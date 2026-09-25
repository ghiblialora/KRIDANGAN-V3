"""
Email notification hooks. Sending is DISABLED until a provider is configured:
set EMAIL_ENABLED=true in backend/.env and implement `_deliver` for the chosen provider.
Every hook is safe to call from a route — failures are logged, never raised.
"""

from __future__ import annotations

import logging
import os

from lib.event_config import ORGANIZER_EMAIL, format_fee, game_title

logger = logging.getLogger(__name__)


def _enabled() -> bool:
    return os.environ.get("EMAIL_ENABLED", "false").lower() == "true"


async def _deliver(to: str, subject: str, body: str) -> None:
    """Provider hook. Replace the body of this function when an email service is configured."""
    logger.info("[email disabled] to=%s subject=%r", to, subject)


async def notify(to: str, subject: str, body: str) -> None:
    try:
        if _enabled():
            await _deliver(to, subject, body)
        else:
            logger.info("[email disabled] to=%s subject=%r", to, subject)
    except Exception:  # never let a notification failure break a registration action
        logger.exception("notification failed: %s", subject)


async def registration_received(reg: dict) -> None:
    await notify(
        reg["email"],
        "Registration Received — KRIDANGAN",
        f"Hi {reg['full_name']},\n\nWe received your KRIDANGAN registration for {game_title(reg['game'])}.\n"
        f"Registration ID: {reg['registration_id']}\nAmount: {format_fee(reg.get('registration_fee'))}\n\n"
        "Your payment is pending manual verification by the KRIDANGAN team. You will be notified once it is reviewed.\n\n"
        f"NxtGen Esports Club · {ORGANIZER_EMAIL}",
    )


async def registration_verified(reg: dict) -> None:
    await notify(
        reg["email"],
        "KRIDANGAN Registration Confirmed",
        f"Hi {reg['full_name']},\n\nYour payment has been verified and your registration for {game_title(reg['game'])} is confirmed.\n"
        f"Registration ID: {reg['registration_id']}\n\nSee you in the arena.\n\nNxtGen Esports Club · {ORGANIZER_EMAIL}",
    )


async def payment_rejected(reg: dict) -> None:
    await notify(
        reg["email"],
        "KRIDANGAN Payment Verification Required",
        f"Hi {reg['full_name']},\n\nWe could not verify the payment for registration {reg['registration_id']} ({game_title(reg['game'])}).\n"
        f"Reason: {reg.get('admin_note') or 'Not specified'}\n\nPlease contact {ORGANIZER_EMAIL} with your payment details.\n\nNxtGen Esports Club",
    )
