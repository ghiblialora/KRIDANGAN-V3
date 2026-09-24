"""Pydantic models for registrations and admin auth. Mirrored by frontend/src/lib/types.ts — keep in sync."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from lib.event_config import GAMES

GameId = Literal["freefire", "chess", "efootball"]
Status = Literal["PENDING", "VERIFIED", "REJECTED"]

MOBILE_RE = re.compile(r"^[6-9]\d{9}$")
UTR_RE = re.compile(r"^[A-Za-z0-9]{8,30}$")
PLAYER_ID_RE = re.compile(r"^[A-Za-z0-9_.\- ]{2,40}$")


def normalize_mobile(value: str) -> str:
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


class PlayerContact(BaseModel):
    uid: str = Field(min_length=2, max_length=40)
    ign: str = Field(min_length=2, max_length=40)
    phone: str
    email: EmailStr

    @field_validator("uid", "ign", mode="before")
    @classmethod
    def _player_id(cls, value: str) -> str:
        cleaned = str(value).strip()
        if not PLAYER_ID_RE.fullmatch(cleaned):
            raise ValueError("Use 2–40 letters, numbers, spaces, dots, hyphens or underscores")
        return cleaned

    @field_validator("phone", mode="before")
    @classmethod
    def _phone(cls, value: str) -> str:
        return normalize_mobile(value)

    @field_validator("email", mode="before")
    @classmethod
    def _email(cls, value: str) -> str:
        return str(value).strip().lower()


class TeamLeader(PlayerContact):
    name: str = Field(min_length=2, max_length=100)

    @field_validator("name", mode="before")
    @classmethod
    def _name(cls, value: str) -> str:
        return str(value).strip()


class FreeFireDetails(BaseModel):
    team_leader: TeamLeader
    players: list[PlayerContact] = Field(min_length=5, max_length=5)


class ChessDetails(BaseModel):
    player_name: str = Field(min_length=2, max_length=100)
    chess_username: str = Field(min_length=2, max_length=60)
    phone: str
    email: EmailStr

    @field_validator("player_name", "chess_username", mode="before")
    @classmethod
    def _strip(cls, value: str) -> str:
        return str(value).strip()

    @field_validator("phone", mode="before")
    @classmethod
    def _phone(cls, value: str) -> str:
        return normalize_mobile(value)

    @field_validator("email", mode="before")
    @classmethod
    def _email(cls, value: str) -> str:
        return str(value).strip().lower()


class EFootballDetails(BaseModel):
    player_name: str = Field(min_length=2, max_length=100)
    efootball_id: str = Field(min_length=2, max_length=60)
    phone: str
    email: EmailStr

    @field_validator("player_name", "efootball_id", mode="before")
    @classmethod
    def _strip(cls, value: str) -> str:
        return str(value).strip()

    @field_validator("phone", mode="before")
    @classmethod
    def _phone(cls, value: str) -> str:
        return normalize_mobile(value)

    @field_validator("email", mode="before")
    @classmethod
    def _email(cls, value: str) -> str:
        return str(value).strip().lower()


GameDetails = FreeFireDetails | ChessDetails | EFootballDetails


class RegistrationInput(BaseModel):
    """Form fields of a public registration (the screenshot arrives as a separate multipart file)."""

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    mobile: str
    college: str = Field(min_length=2, max_length=150)
    student_id: str = Field(min_length=2, max_length=60)
    game: GameId
    game_details: GameDetails
    rulebook_accepted: bool
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
        return normalize_mobile(value)

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

    @model_validator(mode="after")
    def _validate_game_details(self) -> "RegistrationInput":
        expected = {"freefire": FreeFireDetails, "chess": ChessDetails, "efootball": EFootballDetails}[self.game]
        if not isinstance(self.game_details, expected):
            raise ValueError(f"Registration details do not match {GAMES[self.game]}")
        if not self.rulebook_accepted:
            raise ValueError("You must read and accept the Rule Book before continuing")
        primary_name, primary_email, primary_mobile = self.primary_contact()
        if self.full_name.casefold() != primary_name.casefold() or self.email != primary_email or self.mobile != primary_mobile:
            raise ValueError("Primary contact must match the submitted player details")
        return self

    def primary_contact(self) -> tuple[str, str, str]:
        if isinstance(self.game_details, FreeFireDetails):
            leader = self.game_details.team_leader
            return leader.name, str(leader.email), leader.phone
        return self.game_details.player_name, str(self.game_details.email), self.game_details.phone

    def participant_contacts(self) -> tuple[list[str], list[str]]:
        if isinstance(self.game_details, FreeFireDetails):
            contacts = [self.game_details.team_leader, *self.game_details.players]
            return [str(p.email) for p in contacts], [p.phone for p in contacts]
        return [str(self.game_details.email)], [self.game_details.phone]


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
    registration_type: str
    mode: str
    rulebook_url: str


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
    registration_type: str
    mode: str
    rulebook_url: str
    rulebook_accepted: bool = False
    game_details: dict = Field(default_factory=dict)
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
