"""Seed a frontend test user and print token."""
import asyncio, os, uuid, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path("/app/backend/.env"))

async def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "new"  # new (no assessment) or done
    streak_risk = "risk" in sys.argv
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    uid = "fe_test_" + uuid.uuid4().hex[:10]
    tok = "fe_tok_" + uuid.uuid4().hex
    now = datetime.now(timezone.utc)
    user = {
        "user_id": uid, "email": f"{uid}@t.com", "name": "FE Tester",
        "handle": "@fetester", "avatar": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200",
        "picture": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200",
        "gym": "IronCore Academia", "level": 1, "xp": 0, "xp_to_next": 1000,
        "combo_multiplier": 1.0, "streak": 0, "joined_at": now.strftime("%b %Y"),
        "neon_color": "#7c5cff", "trainer_style": "t1", "created_at": now,
    }
    if mode == "done":
        user["assessment_done"] = True
    await db.users.insert_one(user)
    await db.user_sessions.insert_one({"user_id": uid, "session_token": tok, "expires_at": now + timedelta(days=7), "created_at": now})
    await db.fitness_profiles.insert_one({"user_id": uid, "height": 175, "weight": 75.0, "body_fat": 18.0, "waist": 82,
        "goal": "Ganho de massa muscular", "level": "Iniciante", "place": "Academia", "equipment": ["Halteres"]})
    stats = {"user_id": uid, "workouts_this_week": 0, "weekly_goal": 5, "calories_week": 0, "time_week": "0h", "streak": 0, "weekly_days": [False]*7}
    if streak_risk:
        yest = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        stats.update({"streak": 3, "last_workout_date": yest})
    await db.dashboard_stats.insert_one(stats)
    await db.today_workout.insert_one({"user_id": uid, "name": "Peito", "focus": "Push", "day": "Dia 1", "duration": "~50", "total_volume": "5t", "exercises": [
        {"id": "e1", "name": "Supino", "muscle": "Peito", "sets": 4, "reps": "8-10", "weight": 40, "img": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"},
    ]})
    await db.plans.insert_many([
        {"id": f"{uid}_p1", "user_id": uid, "name": "PPL", "days": 6, "focus": "Hip", "active": True, "progress": 0},
        {"id": f"{uid}_p2", "user_id": uid, "name": "FullBody", "days": 3, "focus": "Adap", "active": False, "progress": 0},
    ])
    await db.challenges.insert_many([{"id": f"{uid}_c{i}", "user_id": uid, "title": f"C{i}", "reward": "+X", "progress": 0, "total": 5, "color": "#7c5cff"} for i in (1,2,3)])
    await db.achievements.insert_many([{"id": f"{uid}_a{i}", "user_id": uid, "name": f"A{i}", "icon": "flame", "unlocked": False, "color": "#6b7280"} for i in (1,2,3)])
    await db.measurements.insert_many([
        {"user_id": uid, "label": "Peso", "value": 75.0, "unit": "kg", "delta": 0, "history": [75.0]},
        {"user_id": uid, "label": "Gordura", "value": 18.0, "unit": "%", "delta": 0, "history": [18.0]},
        {"user_id": uid, "label": "Cintura", "value": 82, "unit": "cm", "delta": 0, "history": [82]},
        {"user_id": uid, "label": "Braço", "value": 36.0, "unit": "cm", "delta": 0, "history": [36.0]},
    ])
    if not await db.league_members.find_one({"league_id": "lg1", "user_id": uid}):
        await db.league_members.insert_one({"id": str(uuid.uuid4()), "league_id": "lg1", "user_id": uid, "name": user["name"], "avatar": user["avatar"], "workouts_week": 0, "calories_week": 0, "workouts_month": 0, "calories_month": 0, "streak": stats.get("streak",0)})
    print(f"UID={uid}")
    print(f"TOKEN={tok}")
    client.close()

asyncio.run(main())
