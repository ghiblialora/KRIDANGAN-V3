import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator, Dict

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Request, Response
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes  # noqa: E402
from lib.security import seed_admin_from_env  # noqa: E402
from routers.admin import router as admin_router  # noqa: E402
from routers.registrations import router as registration_router  # noqa: E402


# Startup runs before the yield, shutdown after it.
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    await seed_admin_from_env()
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "KRIDANGAN API", "status": "ok"}


api_router.include_router(registration_router)
api_router.include_router(admin_router)


@app.middleware("http")
async def security_headers(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
    response: Response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return response


# CORS: credentials are only allowed for an explicit origin list, never with a wildcard.
_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',') if o.strip()]
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

# Include the router in the main app — must stay the last statement.
app.include_router(api_router)
