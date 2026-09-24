"""Admin auth (bcrypt + JWT in an httpOnly cookie) and a small in-memory rate limiter."""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock

import jwt
from fastapi import Depends, HTTPException, Request, Response, status
from passlib.context import CryptContext

from lib.db import db

COOKIE_NAME = "kridangan_admin"
TOKEN_TTL = timedelta(hours=12)

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _secret() -> str:
    secret = os.environ.get("ADMIN_JWT_SECRET")
    if not secret:
        raise RuntimeError("ADMIN_JWT_SECRET is not set in backend/.env")
    return secret


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _pwd.verify(password, password_hash)
    except ValueError:
        return False


def issue_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": username, "iat": now, "exp": now + TOKEN_TTL}, _secret(), algorithm="HS256")


def set_session_cookie(response: Response, request: Request, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(TOKEN_TTL.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


async def current_admin(request: Request) -> str:
    """FastAPI dependency: returns the admin username or raises 401."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Admin authentication required")
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired or invalid")
    username = payload.get("sub")
    admin = await db.admins.find_one({"username": username, "active": True}, {"_id": 0, "username": 1})
    if not admin:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Admin account not found")
    return str(admin["username"])


AdminUser = Depends(current_admin)


async def seed_admin_from_env() -> None:
    """Create/refresh the admin account from ADMIN_USERNAME / ADMIN_PASSWORD (.env)."""
    username = os.environ.get("ADMIN_USERNAME", "").strip()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not username or not password:
        return
    existing = await db.admins.find_one({"username": username})
    if existing and verify_password(password, existing.get("password_hash", "")):
        return
    await db.admins.update_one(
        {"username": username},
        {"$set": {"username": username, "password_hash": hash_password(password), "active": True,
                  "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


class RateLimiter:
    """Sliding-window limiter keyed by client IP. In-memory: fine for a single uvicorn worker."""

    def __init__(self, limit: int, window_seconds: int, label: str) -> None:
        self.limit = limit
        self.window = window_seconds
        self.label = label
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def __call__(self, request: Request) -> None:
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
        now = time.monotonic()
        with self._lock:
            bucket = self._hits[ip]
            while bucket and now - bucket[0] > self.window:
                bucket.popleft()
            if len(bucket) >= self.limit:
                raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"Too many {self.label} attempts. Please try again later.")
            bucket.append(now)


login_limiter = RateLimiter(limit=8, window_seconds=15 * 60, label="login")
submit_limiter = RateLimiter(limit=60, window_seconds=10 * 60, label="registration")  # campus WiFi shares one IP: flood protection only
status_limiter = RateLimiter(limit=120, window_seconds=15 * 60, label="status lookup")
