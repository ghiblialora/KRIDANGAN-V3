"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "admins": [IndexModel([("username", ASCENDING)], name="username_unique", unique=True)],
    "login_attempts": [IndexModel([("identifier", ASCENDING)], name="identifier_unique", unique=True)],
    "registrations": [
        IndexModel([("registration_id", ASCENDING)], name="registration_id_unique", unique=True),
        IndexModel([("utr_number", ASCENDING)], name="utr_number"),
        IndexModel([("email", ASCENDING), ("game", ASCENDING)], name="email_game"),
        IndexModel([("mobile", ASCENDING), ("game", ASCENDING)], name="mobile_game"),
        IndexModel([("participant_emails", ASCENDING), ("game", ASCENDING)], name="participant_email_game"),
        IndexModel([("participant_mobiles", ASCENDING), ("game", ASCENDING)], name="participant_mobile_game"),
        IndexModel([("registration_status", ASCENDING), ("game", ASCENDING), ("created_at", DESCENDING)], name="status_game_created"),
        IndexModel([("created_at", DESCENDING)], name="created_desc"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
