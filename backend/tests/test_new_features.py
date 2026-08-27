"""Backend tests for new features: chat AI, plan generation, emergency workout,
league invites, workout/complete streak logic, and professional assessment."""
import os
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path("/app/backend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://gym-personal-app.preview.emergentagent.com"
API = f"{BASE_URL}/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

USER_ID = "test_new_" + uuid.uuid4().hex[:10]
TOKEN = "tok_new_" + uuid.uuid4().hex
USER_ID_B = "test_new_B_" + uuid.uuid4().hex[:10]
TOKEN_B = "tok_new_B_" + uuid.uuid4().hex


async def _seed_full_user(db, user_id, token, name, email, no_assessment=False):
    now = datetime.now(timezone.utc)
    user_doc = {
        "user_id": user_id, "email": email, "name": name,
        "handle": "@" + name.lower(), "avatar": "https://x/a.png",
        "picture": "https://x/a.png", "gym": "IronCore Academia",
        "level": 1, "xp": 0, "xp_to_next": 1000, "combo_multiplier": 1.0,
        "streak": 0, "joined_at": now.strftime("%b %Y"),
        "neon_color": "#7c5cff", "trainer_style": "t1", "created_at": now,
    }
    if not no_assessment:
        user_doc["assessment_done"] = True
    await db.users.insert_one(user_doc)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": now + timedelta(days=7), "created_at": now,
    })
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
    await db.plans.insert_many([
        {"id": f"{user_id}_p1", "user_id": user_id, "name": "Plan A", "days": 4, "focus": "Hipertrofia", "active": True, "progress": 0},
        {"id": f"{user_id}_p2", "user_id": user_id, "name": "Plan B", "days": 3, "focus": "Força", "active": False, "progress": 0},
    ])
    await db.challenges.insert_many([
        {"id": f"{user_id}_c1", "user_id": user_id, "title": "5 treinos", "reward": "+250 XP", "progress": 0, "total": 5, "color": "#7c5cff"},
        {"id": f"{user_id}_c2", "user_id": user_id, "title": "4000 kcal", "reward": "+180 XP", "progress": 0, "total": 4000, "color": "#22d3ee"},
        {"id": f"{user_id}_c3", "user_id": user_id, "title": "Streak 20", "reward": "Badge", "progress": 0, "total": 20, "color": "#f59e0b"},
    ])
    await db.achievements.insert_many([
        {"id": f"{user_id}_a1", "user_id": user_id, "name": "P1", "icon": "flame", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a2", "user_id": user_id, "name": "P2", "icon": "zap", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a3", "user_id": user_id, "name": "P3", "icon": "trophy", "unlocked": False, "color": "#6b7280"},
    ])
    await db.measurements.insert_many([
        {"user_id": user_id, "label": "Peso", "value": 75.0, "unit": "kg", "delta": 0, "history": [75.0]},
        {"user_id": user_id, "label": "Gordura", "value": 18.0, "unit": "%", "delta": 0, "history": [18.0]},
        {"user_id": user_id, "label": "Cintura", "value": 82, "unit": "cm", "delta": 0, "history": [82]},
        {"user_id": user_id, "label": "Braço", "value": 36.0, "unit": "cm", "delta": 0, "history": [36.0]},
    ])
    if not await db.league_members.find_one({"league_id": "lg1", "user_id": user_id}):
        await db.league_members.insert_one({
            "id": str(uuid.uuid4()), "league_id": "lg1", "user_id": user_id,
            "name": name, "avatar": "https://x/a.png",
            "workouts_week": 0, "calories_week": 0,
            "workouts_month": 0, "calories_month": 0, "streak": 0})


async def _cleanup(db):
    for uid_ in (USER_ID, USER_ID_B):
        await db.users.delete_many({"user_id": uid_})
        await db.user_sessions.delete_many({"user_id": uid_})
        await db.fitness_profiles.delete_many({"user_id": uid_})
        await db.dashboard_stats.delete_many({"user_id": uid_})
        await db.today_workout.delete_many({"user_id": uid_})
        await db.plans.delete_many({"user_id": uid_})
        await db.challenges.delete_many({"user_id": uid_})
        await db.achievements.delete_many({"user_id": uid_})
        await db.measurements.delete_many({"user_id": uid_})
        await db.league_members.delete_many({"user_id": uid_})
        await db.chat_messages.delete_many({"user_id": uid_})
        await db.assessments.delete_many({"user_id": uid_})
    # Reset lg1 invite code if we created one, but leave it alone to be idempotent.


@pytest.fixture(scope="module", autouse=True)
def setup_users():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    loop = asyncio.new_event_loop()
    loop.run_until_complete(_cleanup(db))
    loop.run_until_complete(_seed_full_user(db, USER_ID, TOKEN, "NewFeatUser", f"nf_{uuid.uuid4().hex[:6]}@t.com"))
    # user B without assessment - not member of lg1 initially? Actually seed adds them. Keep for join-by-code we'll remove membership below.
    loop.run_until_complete(_seed_full_user(db, USER_ID_B, TOKEN_B, "NewFeatUserB", f"nfB_{uuid.uuid4().hex[:6]}@t.com", no_assessment=True))
    # Remove B from lg1 so join-by-code test is meaningful
    loop.run_until_complete(db.league_members.delete_many({"league_id": "lg1", "user_id": USER_ID_B}))
    yield db, loop
    loop.run_until_complete(_cleanup(db))
    client.close()
    loop.close()


def h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---- Chat AI ----
class TestChatAI:
    def test_chat_streams_pt_br_and_persists_history(self):
        r = requests.post(f"{API}/chat", headers=h(TOKEN), json={"message": "Me dê uma dica rápida de hipertrofia."}, timeout=60, stream=True)
        assert r.status_code == 200, r.text
        chunks = []
        for c in r.iter_content(chunk_size=None, decode_unicode=True):
            if c:
                chunks.append(c)
        full = "".join(chunks)
        assert len(full) > 20, f"Empty AI response: {full!r}"
        # Should not be the fallback error
        assert "problema para responder" not in full or len(full) > 60

        # Small pause then check history persisted (user + trainer)
        hist = requests.get(f"{API}/chat/history", headers=h(TOKEN), timeout=15).json()
        assert isinstance(hist, list) and len(hist) >= 2
        roles = [m["role"] for m in hist]
        assert "user" in roles and "trainer" in roles


# ---- Plan generation ----
class TestPlanGeneration:
    def test_generate_plan_creates_active_plan_and_replaces_today(self, setup_users):
        db, loop = setup_users
        # Count active plans before
        before = loop.run_until_complete(db.plans.count_documents({"user_id": USER_ID, "active": True}))
        assert before == 1

        r = requests.post(f"{API}/workout/generate-plan", headers=h(TOKEN), timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "plan" in data and "workout" in data
        assert data["plan"]["active"] is True
        exs = data["workout"]["exercises"]
        assert 5 <= len(exs) <= 6, f"expected 5-6 ex, got {len(exs)}"
        for e in exs:
            for k in ("name", "muscle", "sets", "reps", "weight", "img"):
                assert k in e, f"missing {k} in exercise {e}"

        # workout/today reflects new plan
        today = requests.get(f"{API}/workout/today", headers=h(TOKEN), timeout=15).json()
        assert today["name"] == data["workout"]["name"]

        # only one active plan overall
        plans = requests.get(f"{API}/workout/plans", headers=h(TOKEN), timeout=15).json()
        active = [p for p in plans if p["active"]]
        assert len(active) == 1
        assert active[0]["id"] == data["plan"]["id"]


# ---- Emergency + activate ----
class TestEmergencyAndActivate:
    def test_emergency_workout(self):
        r = requests.get(f"{API}/workout/emergency", headers=h(TOKEN), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d["exercises"]) == 5
        for e in d["exercises"]:
            assert e["weight"] == 0

    def test_activate_plan(self):
        plans = requests.get(f"{API}/workout/plans", headers=h(TOKEN), timeout=15).json()
        # Find an inactive plan (p2)
        target = next((p for p in plans if not p["active"]), None)
        assert target is not None
        r = requests.post(f"{API}/workout/plans/{target['id']}/activate", headers=h(TOKEN), timeout=15)
        assert r.status_code == 200
        plans2 = requests.get(f"{API}/workout/plans", headers=h(TOKEN), timeout=15).json()
        active = [p for p in plans2 if p["active"]]
        assert len(active) == 1
        assert active[0]["id"] == target["id"]


# ---- League invites ----
class TestLeagueInvites:
    def test_invite_persistent_code(self):
        r1 = requests.get(f"{API}/leagues/lg1/invite", headers=h(TOKEN), timeout=15)
        assert r1.status_code == 200, r1.text
        code1 = r1.json()["code"]
        assert len(code1) == 6
        r2 = requests.get(f"{API}/leagues/lg1/invite", headers=h(TOKEN), timeout=15)
        assert r2.json()["code"] == code1

    def test_non_member_gets_403(self):
        # user B was removed from lg1
        r = requests.get(f"{API}/leagues/lg1/invite", headers=h(TOKEN_B), timeout=15)
        assert r.status_code == 403

    def test_join_by_code_valid(self):
        code = requests.get(f"{API}/leagues/lg1/invite", headers=h(TOKEN), timeout=15).json()["code"]
        r = requests.post(f"{API}/leagues/join-by-code", headers=h(TOKEN_B), json={"code": code}, timeout=15)
        assert r.status_code == 200
        leagues = requests.get(f"{API}/leagues", headers=h(TOKEN_B), timeout=15).json()
        lg1 = next((l for l in leagues if l["id"] == "lg1"), None)
        assert lg1 and lg1["joined"] is True

    def test_join_by_code_invalid(self):
        r = requests.post(f"{API}/leagues/join-by-code", headers=h(TOKEN), json={"code": "ZZZZZZ"}, timeout=15)
        assert r.status_code == 404


# ---- Workout complete streak logic ----
class TestWorkoutCompleteStreak:
    def test_streak_increments_and_at_risk_flag(self, setup_users):
        db, loop = setup_users
        # Reset stats for USER_ID
        loop.run_until_complete(db.dashboard_stats.update_one(
            {"user_id": USER_ID}, {"$set": {"streak": 0, "workouts_this_week": 0, "calories_week": 0, "weekly_days": [False]*7, "last_workout_date": None, "total_workouts": 0}}))

        r = requests.post(f"{API}/workout/complete", headers=h(TOKEN), timeout=15)
        assert r.status_code == 200
        stats1 = r.json()["stats"]
        assert stats1["streak"] == 1
        today_s = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        assert stats1["last_workout_date"] == today_s

        # Second complete same day → streak stays 1
        r2 = requests.post(f"{API}/workout/complete", headers=h(TOKEN), timeout=15)
        assert r2.json()["stats"]["streak"] == 1

        # Dashboard streak_at_risk should be False
        d = requests.get(f"{API}/dashboard", headers=h(TOKEN), timeout=15).json()
        assert d["stats"]["streak_at_risk"] is False

        # Simulate yesterday's last workout → streak_at_risk True
        yest_s = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        loop.run_until_complete(db.dashboard_stats.update_one(
            {"user_id": USER_ID}, {"$set": {"last_workout_date": yest_s, "streak": 3}}))
        d2 = requests.get(f"{API}/dashboard", headers=h(TOKEN), timeout=15).json()
        assert d2["stats"]["streak_at_risk"] is True

        # Challenges updated for user
        chal = requests.get(f"{API}/challenges", headers=h(TOKEN), timeout=15).json()
        c1 = next((c for c in chal if c["id"] == f"{USER_ID}_c1"), None)
        assert c1 and c1["progress"] >= 1


# ---- Assessment ----
class TestAssessment:
    def test_submit_assessment_sets_flag_and_baselines(self, setup_users):
        db, loop = setup_users
        payload = {
            "goal": "Perda de gordura", "experience": "Intermediário",
            "days_per_week": 6, "weight": 82.5, "height": 178,
            "body_fat": 20.0, "waist": 88, "injuries": "lombar",
            "focus_area": "Membros superiores"
        }
        # Reset user B (no assessment) for this test
        r = requests.post(f"{API}/assessment", headers=h(TOKEN_B), json=payload, timeout=20)
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["assessment_done"] is True

        # GET /assessment
        got = requests.get(f"{API}/assessment", headers=h(TOKEN_B), timeout=15).json()
        assert got["done"] is True
        assert got["assessment"]["weight"] == 82.5

        # Fitness profile updated
        prof = requests.get(f"{API}/fitness-profile", headers=h(TOKEN_B), timeout=15).json()
        assert prof["weight"] == 82.5
        assert prof["height"] == 178
        assert prof["goal"] == "Perda de gordura"

        # Measurements baseline with delta 0
        prog = requests.get(f"{API}/progress", headers=h(TOKEN_B), timeout=15).json()
        peso = next(m for m in prog["measurements"] if m["label"] == "Peso")
        assert peso["value"] == 82.5 and peso["delta"] == 0

        # Weekly goal updated
        dash = requests.get(f"{API}/dashboard", headers=h(TOKEN_B), timeout=15).json()
        assert dash["stats"]["weekly_goal"] == 6

        # Challenge c1 updated total
        chal = requests.get(f"{API}/challenges", headers=h(TOKEN_B), timeout=15).json()
        c1 = next((c for c in chal if c["id"] == f"{USER_ID_B}_c1"), None)
        assert c1 and c1["total"] == 6

        # Achievement Avaliação Pro unlocked
        ach = requests.get(f"{API}/achievements", headers=h(TOKEN_B), timeout=15).json()
        pro = next((a for a in ach if a["name"] == "Avaliação Pro"), None)
        assert pro and pro["unlocked"] is True
