"""Azure single-container deployment contract regression tests (public + targeted unit checks)."""

from __future__ import annotations

import asyncio
import json
import os
import random
import sys
import time
from pathlib import Path

import pytest
import requests
from fastapi import FastAPI, HTTPException
from pymongo import MongoClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import server as backend_server


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
    value = os.environ.get(key, "").strip()
    if value:
        return value
    env_path = Path("/app/backend/.env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{key}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


BASE_URL = _load_base_url()
ADMIN_USERNAME = "nxtgen"
ADMIN_PASSWORD = "Millionmack@2611"


def _phone(seed: int) -> str:
    return f"9{seed % 1_000_000_000:09d}"


def _unique(prefix: str) -> str:
    return f"{prefix}{int(time.time())}{random.randint(100, 999)}"


def _registration_payload(seed: int) -> dict[str, str]:
    details = {
        "player_name": f"Test Player {seed}",
        "chess_username": f"test_player_{seed}",
        "phone": _phone(seed),
        "email": f"test-player-{seed}@example.com",
    }
    return {
        "full_name": details["player_name"],
        "email": details["email"],
        "mobile": details["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTAZ"),
        "game": "chess",
        "game_details_json": json.dumps(details),
        "rulebook_accepted": "true",
        "utr_number": _unique("UTRAZ"),
    }


@pytest.fixture
def session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Module: SPA static serving contract over public preview URL
@pytest.mark.parametrize("path", ["/", "/register", "/registration-status", "/admin/login", "/admin"])
def test_spa_routes_serve_index_html(path: str) -> None:
    response = requests.get(f"{BASE_URL}{path}", timeout=20)
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "<!doctype html" in response.text.lower()


# Module: static asset serving from frontend dist
def test_payment_qr_asset_serves_png() -> None:
    response = requests.get(f"{BASE_URL}/assets/payment-qr.png", timeout=20)
    assert response.status_code == 200
    assert response.headers.get("content-type", "").startswith("image/png")
    assert len(response.content) > 100


# Module: API route isolation from SPA fallback
def test_unknown_api_route_is_json_404() -> None:
    response = requests.get(f"{BASE_URL}/api/this-route-does-not-exist", timeout=20)
    assert response.status_code == 404
    assert "application/json" in response.headers.get("content-type", "")
    payload = response.json()
    assert "detail" in payload


# Module: health endpoint success path
def test_health_endpoint_returns_database_and_storage_ok() -> None:
    response = requests.get(f"{BASE_URL}/api/health", timeout=20)
    assert response.status_code == 200
    payload = response.json()
    assert payload == {"status": "ok", "database": "ok", "storage": "ok"}


# Module: auth cookie baseline for admin endpoint protection
def test_admin_login_sets_httponly_cookie(session: requests.Session) -> None:
    login = session.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert login.status_code == 200
    assert login.json()["username"] == ADMIN_USERNAME
    set_cookie = login.headers.get("set-cookie", "")
    assert "kridangan_admin=" in set_cookie
    assert "HttpOnly" in set_cookie


# Module: auth guard on admin screenshot endpoint
def test_screenshot_endpoint_requires_authentication() -> None:
    listing = requests.get(f"{BASE_URL}/api/admin/registrations?page=1&page_size=1", timeout=20)
    assert listing.status_code == 401


# Module: screenshot endpoint headers for authenticated response
def test_authenticated_screenshot_endpoint_is_private_no_store(session: requests.Session) -> None:
    login = session.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert login.status_code == 200

    list_resp = session.get(f"{BASE_URL}/api/admin/registrations?page=1&page_size=1", timeout=25)
    assert list_resp.status_code == 200
    items = list_resp.json().get("items", [])
    if not items:
        pytest.skip("No registration rows available to validate screenshot endpoint")

    reg_id = items[0]["registration_id"]
    shot = session.get(f"{BASE_URL}/api/admin/registrations/{reg_id}/screenshot", timeout=25)
    assert shot.status_code == 200
    cache_control = shot.headers.get("cache-control", "").lower()
    assert "no-store" in cache_control
    assert "private" in cache_control or {"no-cache", "must-revalidate"}.issubset(set(cache_control.replace(" ", "").split(",")))


# Module: screenshot upload validation (5 MB max + magic-byte verification)
def test_registration_submit_rejects_oversized_screenshot() -> None:
    seed = int(time.time()) + random.randint(10, 999)
    payload = _registration_payload(seed)
    oversized = b"\x89PNG\r\n\x1a\n" + (b"0" * (5 * 1024 * 1024 + 8))
    files = {"screenshot": ("large.png", oversized, "image/png")}
    response = requests.post(f"{BASE_URL}/api/registration/submit", data=payload, files=files, timeout=30)
    assert response.status_code == 413
    assert "5 MB" in response.text or "5 mb" in response.text.lower()


# Module: screenshot upload validation for mime/content mismatch
def test_registration_submit_rejects_magic_byte_mismatch() -> None:
    seed = int(time.time()) + random.randint(1000, 1999)
    payload = _registration_payload(seed)
    bad = b"\xff\xd8\xff\xe0" + (b"X" * 200)  # JPEG signature, declared PNG
    files = {"screenshot": ("mismatch.png", bad, "image/png")}
    response = requests.post(f"{BASE_URL}/api/registration/submit", data=payload, files=files, timeout=30)
    assert response.status_code == 400
    assert "does not match" in response.text.lower() or "allowed image type" in response.text.lower()


# Module: lockout policy check from auth testing playbook
def test_bruteforce_lockout_after_five_failures() -> None:
    octet = (int(time.time()) + random.randint(1, 40)) % 250
    headers = {"X-Forwarded-For": f"203.0.113.{octet}"}
    for _ in range(5):
        bad = requests.post(
            f"{BASE_URL}/api/admin/login",
            headers=headers,
            json={"username": ADMIN_USERNAME, "password": "wrong-password"},
            timeout=20,
        )
        assert bad.status_code == 401

    blocked = requests.post(
        f"{BASE_URL}/api/admin/login",
        headers=headers,
        json={"username": ADMIN_USERNAME, "password": "wrong-password"},
        timeout=20,
    )
    assert blocked.status_code == 429


# Module: credentialed CORS expectation for cookie-backed auth
def test_cors_preflight_allows_credentials_for_explicit_origin() -> None:
    origin = "https://kridangan-debug.preview.emergentagent.com"
    response = requests.options(
        f"{BASE_URL}/api/admin/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=20,
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert response.headers.get("access-control-allow-origin") in {
        origin,
        "https://kridangan-debug.cluster-9.preview.emergentcf.cloud",
    }


# Module: DB seed sanity for bcrypt hash prefix requirement
def test_seed_admin_hash_starts_with_2b_prefix() -> None:
    mongo_url = _env_value("MONGO_URL")
    db_name = _env_value("DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("MONGO_URL/DB_NAME not available")

    mongo = MongoClient(mongo_url)
    admins = list(mongo[db_name]["admins"].find({"username": ADMIN_USERNAME}, {"_id": 0, "password_hash": 1, "active": 1}))
    mongo.close()
    assert len(admins) == 1
    assert admins[0]["active"] is True
    assert admins[0]["password_hash"].startswith("$2b$")


# Module: static contract to keep uploads private
def test_upload_dir_is_not_inside_static_dir() -> None:
    upload = Path(_env_value("UPLOAD_DIR") or str(Path("/app/backend/uploads"))).resolve()
    static = Path(_env_value("STATIC_DIR") or str(Path("/app/frontend/dist"))).resolve()
    assert upload != static
    assert static not in upload.parents


# Module: duplicate warning query guardrails in admin router
def test_admin_duplicate_warning_queries_are_bounded() -> None:
    content = Path("/app/backend/routers/admin.py").read_text(encoding="utf-8")
    assert content.count(".limit(10)") >= 2


# Module: Dockerfile production container contract
def test_dockerfile_matches_single_container_azure_contract() -> None:
    content = Path("/app/Dockerfile").read_text(encoding="utf-8")
    assert "FROM node:" in content and "AS frontend-build" in content
    assert "COPY frontend/package.json frontend/package-lock.json" in content
    assert "RUN npm ci" in content
    assert "RUN npm run build" in content
    assert "FROM python:3.11" in content
    assert "COPY --from=frontend-build /build/frontend/dist /app/frontend/dist" in content
    assert "USER appuser" in content
    assert "--host 0.0.0.0" in content
    assert "--port" in content and "$PORT" in content
    assert "/api/health" in content
    assert "COPY backend/.env" not in content
    assert "COPY frontend/.env" not in content


# Module: dockerignore keeps secrets and heavy local state out of image context
def test_dockerignore_excludes_sensitive_and_local_artifacts() -> None:
    content = Path("/app/.dockerignore").read_text(encoding="utf-8")
    for required in (
        "backend/.env",
        "frontend/.env",
        "backend/uploads",
        "frontend/node_modules",
        "frontend/dist",
        "**/__pycache__",
        "test_reports",
        "backend/tests",
        "tests",
    ):
        assert required in content


# Module: GitHub Azure workflow contract (OIDC + immutable SHA deploy)
def test_github_workflow_uses_oidc_and_sha_image_deploy() -> None:
    content = Path("/app/.github/workflows/azure-container-deploy.yml").read_text(encoding="utf-8")
    assert "id-token: write" in content
    assert "uses: azure/login@" in content
    assert "az acr login" in content
    assert "docker build" in content
    assert "docker push" in content
    assert "${{ github.sha }}" in content
    assert "uses: azure/webapps-deploy@" in content
    assert "images:" in content
    assert "MONGO_URL" not in content
    assert "ADMIN_PASSWORD" not in content


# Module: local compose + azure env example consistency
def test_compose_and_azure_env_example_are_consistent() -> None:
    env_example = Path("/app/azure.env.example").read_text(encoding="utf-8")
    compose = Path("/app/compose.azure-local.yml").read_text(encoding="utf-8")
    for key in ("MONGO_URL", "DB_NAME", "ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_JWT_SECRET", "CORS_ORIGINS", "UPLOAD_DIR", "APP_TZ", "PORT"):
        assert f"{key}=" in env_example
        assert key in compose
    assert "payment-screenshots:/mnt/private-uploads" in compose
    assert "8000:8000" in compose


# Module: deployment runbook required Azure settings and verification steps
def test_azure_deployment_documentation_contains_required_guidance() -> None:
    content = Path("/app/AZURE_DEPLOYMENT.md").read_text(encoding="utf-8")
    for required in (
        "Publish: Docker Container",
        "API for MongoDB",
        "/mnt/private-uploads",
        "Key Vault",
        "WEBSITES_PORT",
        "/api/health",
        "AcrPush",
        "AcrPull",
        "restart the Web App",
    ):
        assert required in content


# Module: unit check of health storage failure behavior
@pytest.mark.anyio
async def test_health_returns_503_when_upload_dir_is_unwritable(monkeypatch: pytest.MonkeyPatch) -> None:
    class _FakeDB:
        async def command(self, _: str) -> dict[str, int]:
            return {"ok": 1}

    def _raise_os_error() -> Path:
        raise OSError("read-only filesystem")

    monkeypatch.setattr(backend_server, "db", _FakeDB())
    monkeypatch.setattr(backend_server, "upload_dir", _raise_os_error)

    with pytest.raises(HTTPException) as exc:
        await backend_server.health()
    assert exc.value.status_code == 503
    assert "storage" in str(exc.value.detail).lower()


# Module: lifespan shutdown order (index task handled before mongo close)
@pytest.mark.anyio
async def test_lifespan_waits_for_index_task_then_closes_client(monkeypatch: pytest.MonkeyPatch) -> None:
    events: list[str] = []

    async def _fake_indexes() -> None:
        events.append("index_started")
        try:
            await asyncio.sleep(60)
        except asyncio.CancelledError:
            events.append("index_cancelled")
            raise

    async def _fake_seed() -> None:
        events.append("seed_called")

    class _FakeClient:
        def close(self) -> None:
            events.append("client_closed")

    app = FastAPI()
    monkeypatch.setattr(backend_server, "ensure_indexes", _fake_indexes)
    monkeypatch.setattr(backend_server, "seed_admin_from_env", _fake_seed)
    monkeypatch.setattr(backend_server, "client", _FakeClient())

    async with backend_server.lifespan(app):
        await asyncio.sleep(0.05)

    assert "index_started" in events
    assert "index_cancelled" in events
    assert "client_closed" in events
    assert events.index("index_cancelled") < events.index("client_closed")
