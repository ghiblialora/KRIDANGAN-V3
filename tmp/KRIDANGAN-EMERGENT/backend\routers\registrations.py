"""Public registration endpoints: config, submit (multipart), status lookup."""

import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import ValidationError

from lib import notifications
from lib.db import db
from lib.event_config import GAMES, PAYMENT, ORGANIZER_EMAIL, REGISTRATION_ID_PREFIX, fee_for, format_fee, game_title, metadata_for
from lib.security import status_limiter, submit_limiter
from lib.uploads import save_screenshot
from models.registration import (
    GameConfig,
    PaymentConfig,
    PublicStatus,
    RegistrationConfig,
    RegistrationInput,
    RegistrationSubmitted,
    StatusLookup,
)

router = APIRouter(prefix="/registration", tags=["registration"])

_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I to avoid confusion


async def _new_registration_id() -> str:
    for _ in range(10):
        candidate = f"{REGISTRATION_ID_PREFIX}-" + "".join(secrets.choice(_ID_ALPHABET) for _ in range(6))
        if not await db.registrations.find_one({"registration_id": candidate}, {"_id": 1}):
            return candidate
    raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not allocate a registration ID, please retry")


def _validation_detail(exc: ValidationError) -> list[dict]:
    return [{"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"].removeprefix("Value error, ")} for e in exc.errors()]


@router.get("/config", response_model=RegistrationConfig)
async def registration_config() -> RegistrationConfig:
    return RegistrationConfig(
        games=[GameConfig(
            id=gid, title=title, fee=fee_for(gid), fee_display=format_fee(fee_for(gid)),
            registration_type=metadata_for(gid)["registrationType"], mode=metadata_for(gid)["mode"],
            rulebook_url=metadata_for(gid)["rulebookUrl"],
        ) for gid, title in GAMES.items()],
        payment=PaymentConfig(upi_id=PAYMENT["upiId"], qr_code=PAYMENT["qrCode"]),
        organizer_email=ORGANIZER_EMAIL,
    )


@router.post("/submit", response_model=RegistrationSubmitted, status_code=status.HTTP_201_CREATED, dependencies=[Depends(submit_limiter)])
async def submit_registration(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    mobile: str = Form(...),
    college: str = Form(...),
    student_id: str = Form(...),
    game: str = Form(...),
    game_details_json: str = Form(...),
    rulebook_accepted: bool = Form(...),
    utr_number: str = Form(...),
    screenshot: UploadFile = File(...),
) -> RegistrationSubmitted:
    try:
        game_details = json.loads(game_details_json)
        data = RegistrationInput(
            full_name=full_name, email=email, mobile=mobile, college=college,
            student_id=student_id, game=game, game_details=game_details,
            rulebook_accepted=rulebook_accepted, utr_number=utr_number,  # type: ignore[arg-type]
        )
    except json.JSONDecodeError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, [{"field": "game_details", "message": "Invalid game registration details"}])
    except ValidationError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, _validation_detail(exc))

    # Duplicate guards (rejected registrations may re-register / re-submit)
    if await db.registrations.find_one({"utr_number": data.utr_number, "payment_status": {"$ne": "REJECTED"}}, {"_id": 1}):
        raise HTTPException(status.HTTP_409_CONFLICT, "This UTR / Transaction ID has already been submitted.")
    participant_emails, participant_mobiles = data.participant_contacts()
    dup = await db.registrations.find_one(
        {"game": data.game, "registration_status": {"$ne": "REJECTED"}, "$or": [
            {"email": {"$in": participant_emails}}, {"mobile": {"$in": participant_mobiles}},
            {"participant_emails": {"$in": participant_emails}}, {"participant_mobiles": {"$in": participant_mobiles}},
        ]},
        {"_id": 0, "registration_id": 1},
    )
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, f"A registration for {game_title(data.game)} already exists for this email or mobile number (ID {dup['registration_id']}).")

    stored_name, _mime = await save_screenshot(screenshot)

    now = datetime.now(timezone.utc)
    registration_id = await _new_registration_id()
    fee = fee_for(data.game)  # server-side: never trust a fee from the client
    metadata = metadata_for(data.game)
    record = {
        "registration_id": registration_id,
        **data.model_dump(mode="json"),
        "participant_emails": participant_emails,
        "participant_mobiles": participant_mobiles,
        "registration_type": metadata["registrationType"],
        "mode": metadata["mode"],
        "rulebook_url": metadata["rulebookUrl"],
        "registration_fee": fee,
        "payment_screenshot_file": stored_name,
        "payment_status": "PENDING",
        "registration_status": "PENDING",
        "admin_note": None,
        "created_at": now,
        "updated_at": now,
        "verified_at": None,
        "verified_by": None,
    }
    await db.registrations.insert_one(record)
    await notifications.registration_received(record)

    return RegistrationSubmitted(
        registration_id=registration_id, game=data.game, game_title=game_title(data.game),
        registration_fee=fee, fee_display=format_fee(fee),
        payment_status="PENDING", registration_status="PENDING", created_at=now,
    )


@router.post("/status", response_model=PublicStatus, dependencies=[Depends(status_limiter)])
async def registration_status(body: StatusLookup) -> PublicStatus:
    query: dict = {"registration_id": body.registration_id.strip().upper()}
    if body.email:
        query["email"] = body.email.lower()
    reg = await db.registrations.find_one(query, {"_id": 0, "registration_id": 1, "game": 1, "payment_status": 1, "registration_status": 1, "created_at": 1, "verified_at": 1})
    if not reg:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No registration found for these details.")
    return PublicStatus(**reg, game_title=game_title(reg["game"]))
