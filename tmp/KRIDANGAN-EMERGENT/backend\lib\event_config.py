"""Organizer-owned game, fee, rulebook, prize, and payment configuration."""

from __future__ import annotations

GAMES: dict[str, str] = {
    "freefire": "Free Fire",
    "chess": "Chess",
    "efootball": "E-Football",
}

REGISTRATION_FEES: dict[str, int | None] = {
    "freefire": 199,
    "chess": 99,
    "efootball": 99,
}

GAME_METADATA: dict[str, dict[str, str]] = {
    "freefire": {
        "registrationType": "Team registration",
        "mode": "Esports Mode (Battle Royale)",
        "rulebookUrl": "https://customer-assets-eiarnc6j.emergentagent.net/job_kridangan-debug/artifacts/yv4ahhuq_Free%20Fire%20Rulebook%20-%20Jamrang%20Kridangan%202026.pdf",
    },
    "chess": {
        "registrationType": "Individual registration",
        "mode": "Rapid Fire",
        "rulebookUrl": "https://customer-assets-eiarnc6j.emergentagent.net/job_kridangan-debug/artifacts/npymbnd5_Chess%20Rapid%20Fire%20Official%20Rulebook.pdf",
    },
    "efootball": {
        "registrationType": "Individual registration",
        "mode": "1v1 Competitive Battle",
        "rulebookUrl": "https://customer-assets-eiarnc6j.emergentagent.net/job_kridangan-debug/artifacts/qw07s22m_eFootball%20Mobile%20Championship%20Official%20Rulebook.pdf",
    },
}

TOTAL_PRIZE_POOL = 40_000
GAME_PRIZES: dict[str, int] = {"freefire": 20_000, "chess": 10_000, "efootball": 8_000}

PAYMENT: dict[str, str] = {
    "upiId": "9321222950@kotakbank",
    "qrCode": "/assets/payment-qr.png",
}

ORGANIZER_EMAIL = "nxtgenesportsclub@gmail.com"
REGISTRATION_ID_PREFIX = "KRD26"


def game_title(game_id: str) -> str:
    return GAMES[game_id]


def fee_for(game_id: str) -> int | None:
    return REGISTRATION_FEES.get(game_id)


def metadata_for(game_id: str) -> dict[str, str]:
    return GAME_METADATA[game_id]


def format_fee(amount: int | None) -> str:
    return f"₹{amount:,}" if amount is not None else "₹XXX"
