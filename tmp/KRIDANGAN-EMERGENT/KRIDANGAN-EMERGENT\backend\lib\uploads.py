"""Payment-screenshot upload handling: strict type/size checks, random filenames, private storage."""

from __future__ import annotations

import os
import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

MAX_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def upload_dir() -> Path:
    path = Path(os.environ.get("UPLOAD_DIR", Path(__file__).parent.parent / "uploads"))
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sniff(head: bytes) -> str | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    return None


async def save_screenshot(file: UploadFile) -> tuple[str, str]:
    """Validate and persist the screenshot. Returns (stored_filename, mime)."""
    declared = (file.content_type or "").lower()
    if declared not in ALLOWED:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Screenshot must be a JPG, PNG or WEBP image.")

    data = bytearray()
    while chunk := await file.read(256 * 1024):
        data.extend(chunk)
        if len(data) > MAX_BYTES:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Screenshot must be 5 MB or smaller.")
    if len(data) < 64:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Screenshot file is empty or corrupted.")

    sniffed = _sniff(bytes(data[:16]))
    if sniffed is None or sniffed != declared:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File content does not match an allowed image type.")

    name = f"{secrets.token_hex(16)}.{ALLOWED[sniffed]}"
    (upload_dir() / name).write_bytes(bytes(data))
    return name, sniffed


def screenshot_path(stored_name: str) -> Path:
    # stored names are hex + ext we generated; refuse anything else to block traversal
    base = upload_dir()
    candidate = (base / Path(stored_name).name).resolve()
    if candidate.parent != base.resolve() or not candidate.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Screenshot not found")
    return candidate
