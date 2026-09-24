"""Auth rotation regression tests for admin login/session, JWT invalidation, and seed state."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
import requests
from pymongo import MongoClient


def _load_base_url() -> str:
    base = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not base:
        env_path = Path("/app/frontend/.env")
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                if line.startswith("REACT_APP_BACKEND_URL="):
                    base = line.split("=", 1)[1].strip()
                    break
    if not base:
        pytest.skip("REACT_APP_BACKEND_URL is not configured")
    return base.rstrip("/")


def _env_value(key: str) -> str:
    val = os.environ.get(key, "").strip()
    if val:
        return val
    env_path = Path("/app/backend/.env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{key}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


BASE_URL = _load_base_url()
NEW_USERNAME = "nxtgen"
NEW_PASSWORD = "Millionmack@2611"
OLD_USERNAME = "admin@kridangan.local"
OLD_PASSWORD = "Kridangan@2026"


@pytest.fixture
def session() -> requests.Session:
    """Shared HTTP client for auth flow checks."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Module: login credential rotation + cookie properties
def test_admin_login_only_new_credentials_work(session: requests.Session) -> None:
    login = session.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": NEW_USERNAME, "password": NEW_PASSWORD},
        timeout=20,
    )
    assert login.status_code == 200
    body = login.json()
    assert body["username"] == NEW_USERNAME

    set_cookie = login.headers.get("set-cookie", "")
    assert "kridangan_admin=" in set_cookie
    assert "HttpOnly" in set_cookie


# Module: old account rejection after credential rotation
def test_old_admin_credentials_rejected(session: requests.Session) -> None:
    old_login = session.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": OLD_USERNAME, "password": OLD_PASSWORD},
        timeout=20,
    )
    assert old_login.status_code == 401
    detail = old_login.json().get("detail", "")
    assert "Invalid username or password" in detail


# Module: /me should read new cookie-backed session user
def test_me_returns_nxtgen_with_new_cookie(session: requests.Session) -> None:
    login = session.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": NEW_USERNAME, "password": NEW_PASSWORD},
        timeout=20,
    )
    assert login.status_code == 200

    me = session.get(f"{BASE_URL}/api/admin/me", timeout=20)
    assert me.status_code == 200
    assert me.json()["username"] == NEW_USERNAME


# Module: pre-rotation token invalidation verification
def test_pre_rotation_jwt_cookie_rejected() -> None:
    token_path = Path("/app/tmp/pre-rotation-admin-token.txt")
    assert token_path.exists(), "Missing synthetic pre-rotation token fixture"
    stale_token = token_path.read_text(encoding="utf-8").strip()
    assert stale_token

    res = requests.get(
        f"{BASE_URL}/api/admin/me",
        headers={"Cookie": f"kridangan_admin={stale_token}"},
        timeout=20,
    )
    assert res.status_code == 401
    detail = res.json().get("detail", "")
    assert "invalid" in detail.lower() or "expired" in detail.lower() or "required" in detail.lower()


# Module: DB seed/auth storage integrity checks
def test_admin_seed_state_and_password_hash_storage() -> None:
    mongo_url = _env_value("MONGO_URL")
    db_name = _env_value("DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("MONGO_URL/DB_NAME not available")

    client = MongoClient(mongo_url)
    collection = client[db_name]["admins"]
    docs = list(collection.find({}, {"_id": 0, "username": 1, "active": 1, "password_hash": 1}))
    client.close()

    assert len(docs) >= 1
    by_username = {d["username"]: d for d in docs if "username" in d}

    assert NEW_USERNAME in by_username
    assert by_username[NEW_USERNAME]["active"] is True
    new_hash = by_username[NEW_USERNAME].get("password_hash", "")
    assert isinstance(new_hash, str)
    assert new_hash.startswith("$2b$")
    assert NEW_PASSWORD not in new_hash

    if OLD_USERNAME in by_username:
        assert by_username[OLD_USERNAME]["active"] is False
        old_hash = by_username[OLD_USERNAME].get("password_hash", "")
        assert OLD_PASSWORD not in old_hash


# Module: auth lockout control behavior
def test_bruteforce_lockout_after_five_failures() -> None:
    headers = {"X-Forwarded-For": "203.0.113.55"}
    for _ in range(5):
        bad = requests.post(
            f"{BASE_URL}/api/admin/login",
            headers=headers,
            json={"username": NEW_USERNAME, "password": "wrong-password"},
            timeout=20,
        )
        assert bad.status_code == 401

    sixth = requests.post(
        f"{BASE_URL}/api/admin/login",
        headers=headers,
        json={"username": NEW_USERNAME, "password": "wrong-password"},
        timeout=20,
    )
    assert sixth.status_code == 429


# Module: CORS credential posture check for cookie-based admin auth
def test_cors_allows_credentials_with_explicit_origin() -> None:
    origin = "https://kridangan-debug.preview.emergentagent.com"
    preflight = requests.options(
        f"{BASE_URL}/api/admin/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=20,
    )
    assert preflight.status_code in (200, 204)
    assert preflight.headers.get("access-control-allow-credentials") == "true"
    allowed_origin = preflight.headers.get("access-control-allow-origin")
    assert allowed_origin in {origin, "https://kridangan-debug.cluster-9.preview.emergentcf.cloud"}
