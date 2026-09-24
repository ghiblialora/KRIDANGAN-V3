"""Admin endpoints — every route (except login) requires the httpOnly admin session cookie."""

from __future__ import annotations

import csv
import io
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import FileResponse, StreamingResponse

from lib import notifications
from lib.db import db
from lib.event_config import GAMES, format_fee, game_title
from lib.security import (
    AdminUser,
    clear_session_cookie,
    issue_token,
    login_limiter,
    set_session_cookie,
    verify_password,
)
from lib.uploads import screenshot_path
from models.registration import (
    AdminLogin,
    AdminMe,
    DuplicateWarning,
    GameCount,
    NoteInput,
    Registration,
    RegistrationDetail,
    RegistrationPage,
    RejectInput,
    Stats,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_PROJECTION = {"_id": 0}


def _to_model(doc: dict) -> Registration:
    return Registration(
        **{k: v for k, v in doc.items() if k not in {"payment_screenshot_file"}},
        game_title=game_title(doc["game"]),
        fee_display=format_fee(doc.get("registration_fee")),
        payment_screenshot_url=f"/api/admin/registrations/{doc['registration_id']}/screenshot",
    )


async def _get_or_404(registration_id: str) -> dict:
    doc = await db.registrations.find_one({"registration_id": registration_id.upper()}, _PROJECTION)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    return doc


# ---------------- auth ----------------


@router.post("/login", response_model=AdminMe, dependencies=[Depends(login_limiter)])
async def login(body: AdminLogin, request: Request, response: Response) -> AdminMe:
    admin = await db.admins.find_one({"username": body.username.strip(), "active": True})
    if not admin or not verify_password(body.password, admin.get("password_hash", "")):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
    set_session_cookie(response, request, issue_token(admin["username"]))
    return AdminMe(username=admin["username"])


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> Response:
    clear_session_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=AdminMe)
async def me(admin: str = AdminUser) -> AdminMe:
    return AdminMe(username=admin)


# ---------------- dashboard ----------------


@router.get("/stats", response_model=Stats)
async def stats(admin: str = AdminUser) -> Stats:
    pipeline = [{"$group": {"_id": {"game": "$game", "status": "$registration_status"}, "n": {"$sum": 1}}}]
    rows = await db.registrations.aggregate(pipeline).to_list(100)
    totals = {"PENDING": 0, "VERIFIED": 0, "REJECTED": 0}
    per_game: dict[str, dict[str, int]] = {g: {"PENDING": 0, "VERIFIED": 0, "REJECTED": 0} for g in GAMES}
    for row in rows:
        g, s, n = row["_id"]["game"], row["_id"]["status"], row["n"]
        totals[s] = totals.get(s, 0) + n
        if g in per_game:
            per_game[g][s] = per_game[g].get(s, 0) + n
    return Stats(
        total=sum(totals.values()), pending=totals["PENDING"], verified=totals["VERIFIED"], rejected=totals["REJECTED"],
        games=[GameCount(game=g, title=GAMES[g], total=sum(c.values()), pending=c["PENDING"], verified=c["VERIFIED"]) for g, c in per_game.items()],
    )


def _build_filter(status_filter: str | None, game: str | None, q: str | None) -> dict:
    query: dict = {}
    if status_filter and status_filter != "ALL":
        query["registration_status"] = status_filter
    if game and game != "ALL":
        query["game"] = game
    if q and q.strip():
        pattern = re.compile(re.escape(q.strip()), re.IGNORECASE)
        query["$or"] = [{f: pattern} for f in ("registration_id", "full_name", "email", "mobile", "utr_number", "college")]
    return query


@router.get("/registrations", response_model=RegistrationPage)
async def list_registrations(
    admin: str = AdminUser,
    status_filter: str | None = Query(default=None, alias="status", pattern="^(ALL|PENDING|VERIFIED|REJECTED)$"),
    game: str | None = Query(default=None, pattern="^(ALL|freefire|chess|efootball)$"),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> RegistrationPage:
    query = _build_filter(status_filter, game, q)
    total = await db.registrations.count_documents(query)
    cursor = db.registrations.find(query, _PROJECTION).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    items = [_to_model(doc) async for doc in cursor]
    return RegistrationPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/registrations/export.csv")
async def export_csv(
    admin: str = AdminUser,
    status_filter: str | None = Query(default=None, alias="status", pattern="^(ALL|PENDING|VERIFIED|REJECTED)$"),
    game: str | None = Query(default=None, pattern="^(ALL|freefire|chess|efootball)$"),
    q: str | None = Query(default=None, max_length=100),
) -> StreamingResponse:
    query = _build_filter(status_filter, game, q)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Registration ID", "Name", "Email", "Mobile", "College", "Student ID", "Game", "Amount", "UTR",
                     "Payment Status", "Registration Status", "Created At", "Verified At", "Verified By", "Admin Note"])
    async for d in db.registrations.find(query, _PROJECTION).sort("created_at", -1):
        writer.writerow([
            d["registration_id"], d["full_name"], d["email"], d["mobile"], d["college"], d["student_id"], game_title(d["game"]),
            d.get("registration_fee") if d.get("registration_fee") is not None else "", d["utr_number"], d["payment_status"], d["registration_status"],
            d["created_at"].isoformat(), d["verified_at"].isoformat() if d.get("verified_at") else "", d.get("verified_by") or "", d.get("admin_note") or "",
        ])
    filename = f"kridangan-registrations-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/registrations/{registration_id}", response_model=RegistrationDetail)
async def registration_detail(registration_id: str, admin: str = AdminUser) -> RegistrationDetail:
    doc = await _get_or_404(registration_id)
    warnings: list[DuplicateWarning] = []
    same_utr = [d["registration_id"] async for d in db.registrations.find(
        {"utr_number": doc["utr_number"], "registration_id": {"$ne": doc["registration_id"]}}, {"_id": 0, "registration_id": 1})]
    if same_utr:
        warnings.append(DuplicateWarning(kind="utr", message="WARNING: This UTR has already been used.", registration_ids=same_utr))
    same_person = [d["registration_id"] async for d in db.registrations.find(
        {"game": doc["game"], "registration_id": {"$ne": doc["registration_id"]}, "$or": [{"email": doc["email"]}, {"mobile": doc["mobile"]}]},
        {"_id": 0, "registration_id": 1})]
    if same_person:
        warnings.append(DuplicateWarning(kind="participant", message="This participant has another registration for the same game.", registration_ids=same_person))
    return RegistrationDetail(registration=_to_model(doc), warnings=warnings)


@router.get("/registrations/{registration_id}/screenshot")
async def registration_screenshot(registration_id: str, admin: str = AdminUser) -> FileResponse:
    doc = await _get_or_404(registration_id)
    path = screenshot_path(doc["payment_screenshot_file"])
    return FileResponse(path, headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


async def _set_status(doc: dict, new_status: str, admin: str, note: str | None) -> Registration:
    now = datetime.now(timezone.utc)
    update: dict = {"payment_status": new_status, "registration_status": new_status, "updated_at": now}
    if new_status == "VERIFIED":
        update.update({"verified_at": now, "verified_by": admin})
    else:
        update.update({"verified_at": None, "verified_by": None})
    if note is not None:
        update["admin_note"] = note
    await db.registrations.update_one({"registration_id": doc["registration_id"]}, {"$set": update})
    fresh = await _get_or_404(doc["registration_id"])
    if new_status == "VERIFIED":
        await notifications.registration_verified(fresh)
    elif new_status == "REJECTED":
        await notifications.payment_rejected(fresh)
    return _to_model(fresh)


@router.post("/registrations/{registration_id}/approve", response_model=Registration)
async def approve(registration_id: str, admin: str = AdminUser) -> Registration:
    doc = await _get_or_404(registration_id)
    if doc["payment_status"] == "VERIFIED":
        raise HTTPException(status.HTTP_409_CONFLICT, "Payment is already verified")
    return await _set_status(doc, "VERIFIED", admin, None)


@router.post("/registrations/{registration_id}/reject", response_model=Registration)
async def reject(registration_id: str, body: RejectInput, admin: str = AdminUser) -> Registration:
    doc = await _get_or_404(registration_id)
    return await _set_status(doc, "REJECTED", admin, body.reason.strip())


@router.patch("/registrations/{registration_id}/note", response_model=Registration)
async def update_note(registration_id: str, body: NoteInput, admin: str = AdminUser) -> Registration:
    doc = await _get_or_404(registration_id)
    await db.registrations.update_one(
        {"registration_id": doc["registration_id"]},
        {"$set": {"admin_note": body.admin_note.strip() or None, "updated_at": datetime.now(timezone.utc)}},
    )
    return _to_model(await _get_or_404(registration_id))
