"""Backend tests for Emergent Google Auth + multi-user data isolation."""
import os
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load backend .env for MONGO_URL / DB_NAME
load_dotenv(Path("/app/backend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://gym-personal-app.preview.emergentagent.com"
API = f"{BASE_URL}/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

USER_A_ID = "test_user_A_" + uuid.uuid4().hex[:8]
USER_B_ID = "test_user_B_" + uuid.uuid4().hex[:8]
TOKEN_A = "tok_A_" + uuid.uuid4().hex
TOKEN_B = "tok_B_" + uuid.uuid4().hex


# ------------- Setup / Teardown (module scope) -------------
async def _seed_user(db, user_id, token, name, email):
    now = datetime.now(timezone.utc)
    await db.users.insert_one({
        "user_id": user_id, "email": email, "name": name,
        "handle": "@" + name.lower(), "avatar": "https://x/a.png",
        "picture": "https://x/a.png", "gym": "IronCore Academia",
        "level": 1, "xp": 0, "xp_to_next": 1000, "combo_multiplier": 1.0,
        "streak": 0, "joined_at": now.strftime("%b %Y"),
        "neon_color": "#7c5cff", "trainer_style": "t1", "created_at": now,
    })
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": now + timedelta(days=7), "created_at": now,
    })
    # Seed per-user data via server's seed function logic (inline minimal)
    await db.fitness_profiles.insert_one({
        "user_id": user_id, "height": 175, "weight": 75.0, "body_fat": 18.0, "waist": 82,
        "goal": "Ganho de massa muscular", "level": "Iniciante", "place": "Academia",
        "equipment": ["Halteres"]})
    await db.dashboard_stats.insert_one({
        "user_id": user_id, "workouts_this_week": 0, "weekly_goal": 5,
        "calories_week": 0, "time_week": "0h 00m", "streak": 0,
        "weekly_days": [False] * 7})
    await db.today_workout.insert_one({
        "user_id": user_id, "name": "Peito", "focus": "Push",
        "day": "Dia 1", "duration": "~55 min", "total_volume": "7.4 ton",
        "exercises": []})
    await db.measurements.insert_many([
        {"user_id": user_id, "label": "Peso", "value": 75.0, "unit": "kg", "delta": 0, "history": [75.0]},
        {"user_id": user_id, "label": "Gordura", "value": 18.0, "unit": "%", "delta": 0, "history": [18.0]},
        {"user_id": user_id, "label": "Cintura", "value": 82, "unit": "cm", "delta": 0, "history": [82]},
        {"user_id": user_id, "label": "Braço", "value": 36.0, "unit": "cm", "delta": 0, "history": [36.0]},
    ])
    # Join lg1 league
    if not await db.league_members.find_one({"league_id": "lg1", "user_id": user_id}):
        await db.league_members.insert_one({
            "id": str(uuid.uuid4()), "league_id": "lg1", "user_id": user_id,
            "name": name, "avatar": "https://x/a.png",
            "workouts_week": 0, "calories_week": 0,
            "workouts_month": 0, "calories_month": 0, "streak": 0})


async def _cleanup(db):
    for uid_ in (USER_A_ID, USER_B_ID):
        await db.users.delete_many({"user_id": uid_})
        await db.user_sessions.delete_many({"user_id": uid_})
        await db.fitness_profiles.delete_many({"user_id": uid_})
        await db.dashboard_stats.delete_many({"user_id": uid_})
        await db.today_workout.delete_many({"user_id": uid_})
        await db.plans.delete_many({"user_id": uid_})
        await db.challenges.delete_many({"user_id": uid_})
        await db.achievements.delete_many({"user_id": uid_})
        await db.measurements.delete_many({"user_id": uid_})
        await db.one_rm.delete_many({"user_id": uid_})
        await db.volume_history.delete_many({"user_id": uid_})
        await db.league_members.delete_many({"user_id": uid_})
        await db.performance_logs.delete_many({"user_id": uid_})


@pytest.fixture(scope="module", autouse=True)
def setup_users():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    loop = asyncio.new_event_loop()
    loop.run_until_complete(_cleanup(db))
    loop.run_until_complete(_seed_user(db, USER_A_ID, TOKEN_A, "AliceTest", f"alicetest_{uuid.uuid4().hex[:6]}@test.com"))
    loop.run_until_complete(_seed_user(db, USER_B_ID, TOKEN_B, "BobTest", f"bobtest_{uuid.uuid4().hex[:6]}@test.com"))
    yield
    loop.run_until_complete(_cleanup(db))
    client.close()
    loop.close()


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ------------- Auth endpoint tests -------------
class TestAuthEndpoints:
    def test_auth_session_invalid_id_returns_401(self):
        r = requests.post(f"{API}/auth/session", json={"session_id": "invalid_session_xyz_" + uuid.uuid4().hex}, timeout=30)
        assert r.status_code in (401, 502), f"expected 401/502, got {r.status_code}: {r.text}"

    def test_auth_me_without_token_returns_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_auth_me_with_bearer_returns_user(self):
        r = requests.get(f"{API}/auth/me", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == USER_A_ID
        assert data["name"] == "AliceTest"
        assert "_id" not in data

    def test_auth_me_invalid_token_returns_401(self):
        r = requests.get(f"{API}/auth/me", headers=h("bogus_token"), timeout=15)
        assert r.status_code == 401

    def test_auth_logout(self):
        # Create a throwaway session using pymongo (sync), then logout, then verify /me fails.
        from pymongo import MongoClient
        mc = MongoClient(MONGO_URL)
        sdb = mc[DB_NAME]
        tmp_tok = "tok_tmp_" + uuid.uuid4().hex
        sdb.user_sessions.insert_one({
            "user_id": USER_A_ID, "session_token": tmp_tok,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            "created_at": datetime.now(timezone.utc),
        })
        try:
            r = requests.post(f"{API}/auth/logout", headers=h(tmp_tok), timeout=15)
            assert r.status_code == 200
            assert r.json().get("ok") is True
            r2 = requests.get(f"{API}/auth/me", headers=h(tmp_tok), timeout=15)
            assert r2.status_code == 401
        finally:
            sdb.user_sessions.delete_many({"session_token": tmp_tok})
            mc.close()


# ------------- Protected endpoints require auth -------------
class TestProtectedEndpointsUnauth:
    @pytest.mark.parametrize("method,path", [
        ("GET", "/dashboard"),
        ("GET", "/user/me"),
        ("GET", "/fitness-profile"),
        ("GET", "/workout/today"),
        ("POST", "/workout/complete"),
        ("GET", "/progress"),
        ("GET", "/leagues"),
        ("GET", "/exercises"),
    ])
    def test_returns_401_without_auth(self, method, path):
        r = requests.request(method, f"{API}{path}", timeout=15)
        # /exercises may be public per code review
        if path == "/exercises":
            # Currently /exercises is NOT protected in server.py; document behavior
            assert r.status_code in (200, 401)
        else:
            assert r.status_code == 401, f"{method} {path} -> {r.status_code}"


# ------------- Regression: authed user can use core endpoints -------------
class TestAuthedRegression:
    def test_dashboard(self):
        r = requests.get(f"{API}/dashboard", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["user_id"] == USER_A_ID
        assert d["stats"]["workouts_this_week"] >= 0
        assert d["my_league"] is not None
        assert d["my_league"]["id"] == "lg1"

    def test_workout_today(self):
        r = requests.get(f"{API}/workout/today", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        assert r.json()["user_id"] == USER_A_ID

    def test_progress(self):
        r = requests.get(f"{API}/progress", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json()["measurements"], list)
        assert len(r.json()["measurements"]) == 4

    def test_measurements_post(self):
        r = requests.post(f"{API}/measurements", headers=h(TOKEN_A), json={"peso": 76.5}, timeout=15)
        assert r.status_code == 200
        peso = next((m for m in r.json() if m["label"] == "Peso"), None)
        assert peso and peso["value"] == 76.5

    def test_leagues_list(self):
        r = requests.get(f"{API}/leagues", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        leagues = r.json()
        assert any(l["id"] == "lg1" and l["joined"] for l in leagues)

    def test_league_ranking(self):
        r = requests.get(f"{API}/leagues/lg1/ranking?metric=workouts&period=weekly", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["key"] == "workouts_week"
        assert any(m.get("is_me") for m in d["members"])

    def test_exercises(self):
        r = requests.get(f"{API}/exercises", timeout=15)  # currently public
        assert r.status_code == 200
        assert len(r.json()) >= 5


# ------------- Multi-user data isolation -------------
class TestIsolation:
    def test_workout_complete_isolation(self):
        # Baseline stats
        ra0 = requests.get(f"{API}/dashboard", headers=h(TOKEN_A), timeout=15).json()
        rb0 = requests.get(f"{API}/dashboard", headers=h(TOKEN_B), timeout=15).json()
        a0 = ra0["stats"]["workouts_this_week"]
        b0 = rb0["stats"]["workouts_this_week"]

        r = requests.post(f"{API}/workout/complete", headers=h(TOKEN_A), timeout=15)
        assert r.status_code == 200
        assert r.json()["xp_gained"] == 280

        ra1 = requests.get(f"{API}/dashboard", headers=h(TOKEN_A), timeout=15).json()
        rb1 = requests.get(f"{API}/dashboard", headers=h(TOKEN_B), timeout=15).json()
        assert ra1["stats"]["workouts_this_week"] == a0 + 1
        assert rb1["stats"]["workouts_this_week"] == b0, "User B stats should NOT change"

    def test_fitness_profile_isolation(self):
        r = requests.put(f"{API}/fitness-profile", headers=h(TOKEN_A),
                         json={"goal": "Definição extrema", "weight": 88.8}, timeout=15)
        assert r.status_code == 200
        pa = requests.get(f"{API}/fitness-profile", headers=h(TOKEN_A), timeout=15).json()
        pb = requests.get(f"{API}/fitness-profile", headers=h(TOKEN_B), timeout=15).json()
        assert pa["goal"] == "Definição extrema"
        assert pa["weight"] == 88.8
        assert pb["goal"] == "Ganho de massa muscular"
        assert pb["weight"] == 75.0

    def test_league_ranking_is_me_flag_per_user(self):
        ra = requests.get(f"{API}/leagues/lg1/ranking?metric=workouts&period=weekly", headers=h(TOKEN_A), timeout=15).json()
        rb = requests.get(f"{API}/leagues/lg1/ranking?metric=workouts&period=weekly", headers=h(TOKEN_B), timeout=15).json()
        me_a = [m for m in ra["members"] if m.get("is_me")]
        me_b = [m for m in rb["members"] if m.get("is_me")]
        assert len(me_a) == 1 and me_a[0]["user_id"] == USER_A_ID
        assert len(me_b) == 1 and me_b[0]["user_id"] == USER_B_ID
