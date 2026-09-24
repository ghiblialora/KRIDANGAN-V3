import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from typing import AsyncIterator, Dict

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Request, Response, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes  # noqa: E402
from lib.security import seed_admin_from_env  # noqa: E402
from lib.uploads import upload_dir  # noqa: E402
from routers.admin import router as admin_router  # noqa: E402
from routers.registrations import router as registration_router  # noqa: E402


# Startup runs before the yield, shutdown after it.
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    await seed_admin_from_env()
    try:
        yield
    finally:
        if not app.state.index_task.done():
            app.state.index_task.cancel()
        with suppress(asyncio.CancelledError):
            await app.state.index_task
        client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "KRIDANGAN API", "status": "ok"}


@api_router.get("/health")
async def health() -> Dict[str, str]:
    """Azure readiness check: database access and writable private screenshot storage."""
    try:
        await db.command("ping")
    except Exception as exc:
        logger.error("Health check database failure: %s", type(exc).__name__)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database unavailable")

    try:
        probe = upload_dir() / f".health-{os.getpid()}"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
    except OSError as exc:
        logger.error("Health check storage failure: %s", type(exc).__name__)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Screenshot storage unavailable")
    return {"status": "ok", "database": "ok", "storage": "ok"}


api_router.include_router(registration_router)
api_router.include_router(admin_router)


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
    response: Response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.url.path.startswith("/api/admin/registrations/") and request.url.path.endswith("/screenshot"):
        response.headers["Cache-Control"] = "private, no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        response.headers.append("Vary", "Cookie")
    return response


# CORS: credentials are only allowed for an explicit origin list, never with a wildcard.
_cors_setting = os.environ.get("CORS_ORIGINS")
if not _cors_setting:
    raise RuntimeError("CORS_ORIGINS is not set")
_origins = [origin.strip() for origin in _cors_setting.split(",") if origin.strip()]
_wildcard = "*" in _origins
app.add_middleware(
    CORSMiddleware,
    allow_credentials=not _wildcard,
    allow_origins=["*"] if _wildcard else _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API routes must be registered before the SPA fallback.
app.include_router(api_router)


_static_setting = os.environ.get("STATIC_DIR")
if _static_setting:
    _static_root = Path(_static_setting).resolve()
    _index_file = _static_root / "index.html"
    if not _index_file.is_file():
        raise RuntimeError(f"STATIC_DIR does not contain index.html: {_static_root}")
    _assets_dir = _static_root / "assets"
    if _assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str) -> FileResponse:
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status.HTTP_404_NOT_FOUND, "API route not found")
        candidate = (_static_root / full_path).resolve()
        if candidate.is_relative_to(_static_root) and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_index_file, headers={"Cache-Control": "no-cache"})
