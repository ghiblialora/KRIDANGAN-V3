"""Pydantic models for registrations and admin auth. Mirrored by frontend/src/lib/types.ts — keep in sync."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from lib.event_config import GAMES

GameId = Literal["freefire", "chess", "efootball"]
Status = Literal["PENDING", "VERIFIED", "REJECTED"]

MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
UTR_RE = re.compile(r"^[A-Za-z0-9]{8,30}$")


class RegistrationInput(BaseModel):
    """Form fields of a public registration (the screenshot arrives as a separate multipart file)."""

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    mobile: str
    college: str = Field(min_length=2, max_length=150)
    student_id: str = Field(min_length=2, max_length=60)
    game: GameId
    utr_number: str

    @field_validator("full_name", "college", "student_id", mode="before")
    @classmethod
    def _strip(cls, value: str) -> str:
        return str(value).strip()

    @field_validator("email", mode="before")
    @classmethod
    def _lower_email(cls, value: str) -> str:
        return str(value).strip().lower()

    @field_validator("mobile", mode="before")
    @classmethod
    def _mobile(cls, value: str) -> str:
        digits = re.sub(r"[\s\-]", "", str(value))
        if digits.startswith("+91"):
            digits = digits[3:]
        elif digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        elif digits.startswith("0") and len(digits) == 11:
            digits = digits[1:]
        if not MOBILE_RE.match(digits):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return digits

    @field_validator("utr_number", mode="before")
    @classmethod
    def _utr(cls, value: str) -> str:
        cleaned = re.sub(r"\s", "", str(value)).upper()
        if not UTR_RE.match(cleaned):
            raise ValueError("UTR / Transaction ID must be 8–30 letters or digits")
        return cleaned

    @field_validator("game")
    @classmethod
    def _game(cls, value: str) -> str:
        if value not in GAMES:
            raise ValueError("Unknown game")
        return value


class RegistrationSubmitted(BaseModel):
    registration_id: str
    game: GameId
    game_title: str
    registration_fee: int | None
    fee_display: str
    payment_status: Status
    registration_status: Status
    created_at: datetime


class StatusLookup(BaseModel):
    registration_id: str = Field(min_length=6, max_length=20)
    email: EmailStr | None = None


class PublicStatus(BaseModel):
    registration_id: str
    game: GameId
    game_title: str
    payment_status: Status
    registration_status: Status
    created_at: datetime
    verified_at: datetime | None = None


class GameConfig(BaseModel):
    id: GameId
    title: str
    fee: int | None
    fee_display: str


class PaymentConfig(BaseModel):
    upi_id: str
    qr_code: str


class RegistrationConfig(BaseModel):
    games: list[GameConfig]
    payment: PaymentConfig
    organizer_email: str


# ---------------- admin ----------------


class AdminLogin(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


class AdminMe(BaseModel):
    username: str


class Registration(BaseModel):
    """Full record as seen by admins."""

    registration_id: str
    full_name: str
    email: str
    mobile: str
    college: str
    student_id: str
    game: GameId
    game_title: str
    registration_fee: int | None
    fee_display: str
    utr_number: str
    payment_screenshot_url: str
    payment_status: Status
    registration_status: Status
    admin_note: str | None = None
    created_at: datetime
    updated_at: datetime
    verified_at: datetime | None = None
    verified_by: str | None = None


class DuplicateWarning(BaseModel):
    kind: Literal["utr", "participant"]
    message: str
    registration_ids: list[str]


class RegistrationDetail(BaseModel):
    registration: Registration
    warnings: list[DuplicateWarning]


class RegistrationPage(BaseModel):
    items: list[Registration]
    total: int
    page: int
    page_size: int


class GameCount(BaseModel):
    game: GameId
    title: str
    total: int
    pending: int
    verified: int


class Stats(BaseModel):
    total: int
    pending: int
    verified: int
    rejected: int
    games: list[GameCount]


class RejectInput(BaseModel):
    reason: str = Field(min_length=2, max_length=500)


class NoteInput(BaseModel):
    admin_note: str = Field(max_length=2000)
