"""Regression tests for public registration + admin review APIs on preview URL."""

from __future__ import annotations

import csv
import io
import json
import os
import random
import time
from pathlib import Path

import pytest
import requests


def _load_preview_base_url() -> str:
    # Prefer injected env var; otherwise read frontend/.env for preview URL.
    base = os.environ.get("REACT_APP_BACKEND_URL", "").strip()
    if not base:
        env_path = Path("/app/frontend/.env")
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                if line.startswith("REACT_APP_BACKEND_URL="):
                    base = line.split("=", 1)[1].strip()
                    break
    if not base:
        pytest.skip("REACT_APP_BACKEND_URL is not configured")
    return base.rstrip("/")


BASE_URL = _load_preview_base_url()
SCREENSHOT_PATH = Path("/app/frontend/public/assets/payment-qr.png")


def _phone(seed: int) -> str:
    # Generates 10-digit Indian-like numbers starting with 9.
    return f"9{seed % 1_000_000_000:09d}"


def _unique(prefix: str) -> str:
    return f"{prefix}{int(time.time())}{random.randint(100, 999)}"


def _submit_registration(data: dict, screenshot_path: Path = SCREENSHOT_PATH) -> requests.Response:
    with screenshot_path.open("rb") as fh:
        files = {"screenshot": (screenshot_path.name, fh, "image/png")}
        return requests.post(f"{BASE_URL}/api/registration/submit", data=data, files=files, timeout=30)


@pytest.fixture(scope="session")
def admin_session() -> requests.Session:
    # Admin auth and protected endpoint access.
    session = requests.Session()
    login_payload = {"username": "nxtgen", "password": "Millionmack@2611"}
    login = session.post(f"{BASE_URL}/api/admin/login", json=login_payload, timeout=20)
    assert login.status_code == 200, f"Admin login failed: {login.status_code} {login.text}"
    body = login.json()
    assert body["username"] == "nxtgen"
    me = session.get(f"{BASE_URL}/api/admin/me", timeout=20)
    assert me.status_code == 200, f"Admin session invalid: {me.status_code} {me.text}"
    return session


@pytest.fixture(scope="session")
def created_registrations() -> dict:
    # Creates one pending registration per game and returns IDs + payload context.
    assert SCREENSHOT_PATH.exists(), f"Missing screenshot fixture: {SCREENSHOT_PATH}"
    seed = int(time.time())

    # Free Fire team payload
    ff_leader_phone = _phone(seed)
    ff_leader_email = f"ffleader{seed}@example.com"
    ff_players = []
    for idx in range(5):
        ff_players.append(
            {
                "uid": f"FFUID{seed}{idx}",
                "ign": f"FFIGN{seed}{idx}",
                "phone": _phone(seed + idx + 11),
                "email": f"ffp{idx}{seed}@example.com",
            }
        )
    ff_game_details = {
        "team_leader": {
            "name": f"FF Leader {seed}",
            "uid": f"FFL{seed}",
            "ign": f"FFLIGN{seed}",
            "phone": ff_leader_phone,
            "email": ff_leader_email,
        },
        "players": ff_players,
    }
    ff_data = {
        "full_name": ff_game_details["team_leader"]["name"],
        "email": ff_game_details["team_leader"]["email"],
        "mobile": ff_game_details["team_leader"]["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTFF"),
        "game": "freefire",
        "game_details_json": json.dumps(ff_game_details),
        "rulebook_accepted": "true",
        "utr_number": _unique("UTRFF"),
    }

    # Chess payload
    chess_phone = _phone(seed + 101)
    chess_email = f"chess{seed}@example.com"
    chess_game_details = {
        "player_name": f"Chess Player {seed}",
        "chess_username": f"chess_user_{seed}",
        "phone": chess_phone,
        "email": chess_email,
    }
    chess_data = {
        "full_name": chess_game_details["player_name"],
        "email": chess_game_details["email"],
        "mobile": chess_game_details["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTCH"),
        "game": "chess",
        "game_details_json": json.dumps(chess_game_details),
        "rulebook_accepted": "true",
        "utr_number": _unique("UTRCH"),
    }

    # E-Football payload
    ef_phone = _phone(seed + 202)
    ef_email = f"efootball{seed}@example.com"
    ef_game_details = {
        "player_name": f"EFootball Player {seed}",
        "efootball_id": f"ef_id_{seed}",
        "phone": ef_phone,
        "email": ef_email,
    }
    ef_data = {
        "full_name": ef_game_details["player_name"],
        "email": ef_game_details["email"],
        "mobile": ef_game_details["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTEF"),
        "game": "efootball",
        "game_details_json": json.dumps(ef_game_details),
        "rulebook_accepted": "true",
        "utr_number": _unique("UTREF"),
    }

    responses = {
        "freefire": _submit_registration(ff_data),
        "chess": _submit_registration(chess_data),
        "efootball": _submit_registration(ef_data),
    }

    expected_fees = {"freefire": 199, "chess": 99, "efootball": 99}
    result: dict[str, dict] = {}
    for game, response in responses.items():
        assert response.status_code == 201, f"{game} submit failed: {response.status_code} {response.text}"
        body = response.json()
        assert body["game"] == game
        assert body["registration_fee"] == expected_fees[game]
        assert body["payment_status"] == "PENDING"
        assert body["registration_status"] == "PENDING"
        result[game] = {"registration_id": body["registration_id"], "response": body}
    result["source"] = {
        "freefire": ff_game_details,
        "chess": chess_game_details,
        "efootball": ef_game_details,
    }
    return result


def test_registration_config_latest_values() -> None:
    # Public config values: fees, mode, rulebooks, payment identity.
    resp = requests.get(f"{BASE_URL}/api/registration/config", timeout=20)
    assert resp.status_code == 200
    cfg = resp.json()
    by_id = {game["id"]: game for game in cfg["games"]}

    assert by_id["freefire"]["fee"] == 199
    assert by_id["freefire"]["mode"] == "Esports Mode (Battle Royale)"
    assert "Free%20Fire%20Rulebook" in by_id["freefire"]["rulebook_url"]

    assert by_id["chess"]["fee"] == 99
    assert by_id["chess"]["mode"] == "Rapid Fire"
    assert "Chess%20Rapid%20Fire" in by_id["chess"]["rulebook_url"]

    assert by_id["efootball"]["fee"] == 99
    assert by_id["efootball"]["mode"] == "1v1 Competitive Battle"
    assert "eFootball%20Mobile%20Championship" in by_id["efootball"]["rulebook_url"]

    assert cfg["payment"]["upi_id"] == "9321222950@kotakbank"


def test_submit_rejects_rulebook_not_accepted() -> None:
    # Validation: backend must reject rulebook_accepted=false.
    seed = int(time.time()) + random.randint(1, 1000)
    details = {
        "player_name": f"Rulebook No {seed}",
        "chess_username": f"rulebook_no_{seed}",
        "phone": _phone(seed),
        "email": f"rulebook-no-{seed}@example.com",
    }
    payload = {
        "full_name": details["player_name"],
        "email": details["email"],
        "mobile": details["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTRB"),
        "game": "chess",
        "game_details_json": json.dumps(details),
        "rulebook_accepted": "false",
        "utr_number": _unique("UTRRB"),
    }
    resp = _submit_registration(payload)
    assert resp.status_code == 422
    assert "Rule Book" in resp.text or "rulebook" in resp.text.lower()


def test_submit_all_games_pending_with_server_fees(created_registrations: dict) -> None:
    # Submission behavior: game-specific fee and pending state from backend.
    expected = {"freefire": 199, "chess": 99, "efootball": 99}
    for game, fee in expected.items():
        body = created_registrations[game]["response"]
        assert body["registration_fee"] == fee
        assert body["fee_display"] == f"₹{fee}"
        assert body["payment_status"] == "PENDING"
        assert body["registration_status"] == "PENDING"


def test_admin_list_and_details_show_new_fields(admin_session: requests.Session, created_registrations: dict) -> None:
    # Admin list/detail should include roster fields, mode, type, rulebook, payment screenshot URL.
    list_resp = admin_session.get(f"{BASE_URL}/api/admin/registrations?page=1&page_size=50", timeout=30)
    assert list_resp.status_code == 200
    listing = list_resp.json()
    ids = {item["registration_id"] for item in listing["items"]}
    for game in ("freefire", "chess", "efootball"):
        assert created_registrations[game]["registration_id"] in ids

    ff_id = created_registrations["freefire"]["registration_id"]
    ff_detail = admin_session.get(f"{BASE_URL}/api/admin/registrations/{ff_id}", timeout=20)
    assert ff_detail.status_code == 200
    ff = ff_detail.json()["registration"]
    assert ff["registration_type"] == "Team registration"
    assert ff["mode"] == "Esports Mode (Battle Royale)"
    assert ff["rulebook_accepted"] is True
    assert ff["payment_screenshot_url"].endswith("/screenshot")
    assert ff["game_details"]["team_leader"]["uid"] == created_registrations["source"]["freefire"]["team_leader"]["uid"]
    assert ff["game_details"]["players"][4]["uid"] == created_registrations["source"]["freefire"]["players"][4]["uid"]

    ch_id = created_registrations["chess"]["registration_id"]
    ch_detail = admin_session.get(f"{BASE_URL}/api/admin/registrations/{ch_id}", timeout=20)
    assert ch_detail.status_code == 200
    chess = ch_detail.json()["registration"]
    assert chess["mode"] == "Rapid Fire"
    assert chess["registration_type"] == "Individual registration"
    assert chess["game_details"]["chess_username"] == created_registrations["source"]["chess"]["chess_username"]

    ef_id = created_registrations["efootball"]["registration_id"]
    ef_detail = admin_session.get(f"{BASE_URL}/api/admin/registrations/{ef_id}", timeout=20)
    assert ef_detail.status_code == 200
    efootball = ef_detail.json()["registration"]
    assert efootball["mode"] == "1v1 Competitive Battle"
    assert efootball["registration_type"] == "Individual registration"
    assert efootball["game_details"]["efootball_id"] == created_registrations["source"]["efootball"]["efootball_id"]


def test_admin_approve_and_reject_controls(admin_session: requests.Session) -> None:
    # Admin actions: reject and approve endpoints should work on new pending rows.
    seed = int(time.time()) + random.randint(1000, 2000)

    # Create one pending row for rejection.
    reject_details = {
        "player_name": f"Reject Me {seed}",
        "chess_username": f"reject_me_{seed}",
        "phone": _phone(seed),
        "email": f"reject-me-{seed}@example.com",
    }
    reject_payload = {
        "full_name": reject_details["player_name"],
        "email": reject_details["email"],
        "mobile": reject_details["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTRJ"),
        "game": "chess",
        "game_details_json": json.dumps(reject_details),
        "rulebook_accepted": "true",
        "utr_number": _unique("UTRRJ"),
    }
    reject_submit = _submit_registration(reject_payload)
    assert reject_submit.status_code == 201
    reject_id = reject_submit.json()["registration_id"]

    reject_resp = admin_session.post(
        f"{BASE_URL}/api/admin/registrations/{reject_id}/reject",
        json={"reason": "Payment not found"},
        timeout=20,
    )
    assert reject_resp.status_code == 200
    rejected = reject_resp.json()
    assert rejected["registration_status"] == "REJECTED"
    assert rejected["payment_status"] == "REJECTED"

    # Create one pending row for approval.
    approve_details = {
        "player_name": f"Approve Me {seed}",
        "efootball_id": f"approve_me_{seed}",
        "phone": _phone(seed + 333),
        "email": f"approve-me-{seed}@example.com",
    }
    approve_payload = {
        "full_name": approve_details["player_name"],
        "email": approve_details["email"],
        "mobile": approve_details["phone"],
        "college": "TEST_Kridangan College",
        "student_id": _unique("TESTAP"),
        "game": "efootball",
        "game_details_json": json.dumps(approve_details),
        "rulebook_accepted": "true",
        "utr_number": _unique("UTRAP"),
    }
    approve_submit = _submit_registration(approve_payload)
    assert approve_submit.status_code == 201
    approve_id = approve_submit.json()["registration_id"]

    approve_resp = admin_session.post(f"{BASE_URL}/api/admin/registrations/{approve_id}/approve", timeout=20)
    assert approve_resp.status_code == 200
    approved = approve_resp.json()
    assert approved["registration_status"] == "VERIFIED"
    assert approved["payment_status"] == "VERIFIED"
    assert approved["verified_by"] == "nxtgen"


def test_csv_export_includes_required_columns_and_values(admin_session: requests.Session, created_registrations: dict) -> None:
    # CSV should include roster/player, mode, rulebook, and game-specific ID columns.
    resp = admin_session.get(f"{BASE_URL}/api/admin/registrations/export.csv", timeout=30)
    assert resp.status_code == 200
    rows = list(csv.DictReader(io.StringIO(resp.text)))
    assert len(rows) > 0

    header = rows[0].keys()
    for required in (
        "Mode",
        "Rulebook Accepted",
        "Rulebook URL",
        "Team Leader UID",
        "Player 5 UID",
        "Chess.com Username/ID",
        "E-Football ID/Name",
    ):
        assert required in header

    # Verify one row from each created registration appears with expected game-specific values.
    id_to_row = {row["Registration ID"]: row for row in rows}

    ff = id_to_row[created_registrations["freefire"]["registration_id"]]
    assert ff["Mode"] == "Esports Mode (Battle Royale)"
    assert ff["Rulebook Accepted"] == "Yes"
    assert ff["Team Leader UID"] == created_registrations["source"]["freefire"]["team_leader"]["uid"]
    assert ff["Player 5 UID"] == created_registrations["source"]["freefire"]["players"][4]["uid"]

    chess = id_to_row[created_registrations["chess"]["registration_id"]]
    assert chess["Mode"] == "Rapid Fire"
    assert chess["Chess.com Username/ID"] == created_registrations["source"]["chess"]["chess_username"]

    ef = id_to_row[created_registrations["efootball"]["registration_id"]]
    assert ef["Mode"] == "1v1 Competitive Battle"
    assert ef["E-Football ID/Name"] == created_registrations["source"]["efootball"]["efootball_id"]
