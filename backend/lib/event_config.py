"""
KRIDANGAN organizer configuration — the single place to edit fees and payment details.

* REGISTRATION_FEES: amount in rupees per game. Leave a value as None until the fee is
  finalised; the site then shows "₹XXX" and stores no amount. The backend ALWAYS derives the
  fee from this table — a fee sent by the browser is never trusted.
* PAYMENT: the UPI ID shown to participants and the public path of the QR image. Drop the real
  QR PNG at frontend/public/assets/payment-qr.png (no code change needed).
"""

from __future__ import annotations

GAMES: dict[str, str] = {
    "freefire": "Free Fire",
    "chess": "Chess",
    "efootball": "E-Football",
}

# ₹ per registration. Replace None with the real integer amount, e.g. 150.
REGISTRATION_FEES: dict[str, int | None] = {
    "freefire": None,
    "chess": None,
    "efootball": None,
}

PAYMENT: dict[str, str] = {
    "upiId": "kavyamhatre20viiid@okaxis",
    "qrCode": "/assets/payment-qr.png",
}

ORGANIZER_EMAIL = "nxtgenesportsclub@gmail.com"
REGISTRATION_ID_PREFIX = "KRD26"


def game_title(game_id: str) -> str:
    return GAMES[game_id]


def fee_for(game_id: str) -> int | None:
    return REGISTRATION_FEES.get(game_id)


def format_fee(amount: int | None) -> str:
    return f"₹{amount:,}" if amount is not None else "₹XXX"
