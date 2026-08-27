from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import uuid
import requests
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi.responses import StreamingResponse

# emergentintegrations is a platform-provided AI integration package that is not
# available in every environment. Import it lazily so the server boots without it;
# the AI chat / plan-generation endpoints return 503 when it (or the LLM key) is absent.
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
except ImportError:
    LlmChat = UserMessage = TextDelta = StreamDone = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")

DEMO_ID = "u_001"
DEFAULT_GYM = "IronCore Academia"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clean(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ---------------- Auth helpers ----------------
async def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    exp = sess["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def uid(user):
    return user["user_id"]


# ---------------- Models ----------------
class SessionIn(BaseModel):
    session_id: str


class TrainerStyleIn(BaseModel):
    style_id: str


class FitnessProfileIn(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    waist: Optional[float] = None
    goal: Optional[str] = None
    level: Optional[str] = None
    place: Optional[str] = None
    equipment: Optional[List[str]] = None


class SetIn(BaseModel):
    weight: float
    reps: int


class PerformanceIn(BaseModel):
    exercise_id: str
    sets: List[SetIn]


class LeagueIn(BaseModel):
    name: str


class MeasurementIn(BaseModel):
    peso: Optional[float] = None
    gordura: Optional[float] = None
    cintura: Optional[float] = None
    braco: Optional[float] = None


class ChatIn(BaseModel):
    message: str


class JoinCodeIn(BaseModel):
    code: str


class AssessmentIn(BaseModel):
    goal: str
    experience: str
    days_per_week: int
    weight: float
    height: float
    body_fat: Optional[float] = None
    waist: Optional[float] = None
    injuries: Optional[str] = None
    focus_area: Optional[str] = None


# ---------------- Per-user seeding ----------------
TODAY_WORKOUT_TEMPLATE = {
    "name": "Peito & Tríceps", "focus": "Hipertrofia · Push Day",
    "day": "Dia 1 de 60", "duration": "~55 min", "total_volume": "7.4 ton",
    "exercises": [
        {"id": "e1", "name": "Supino Reto com Barra", "muscle": "Peito", "sets": 4, "reps": "8-10", "weight": 40, "img": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"},
        {"id": "e2", "name": "Supino Inclinado Halteres", "muscle": "Peito Superior", "sets": 3, "reps": "10-12", "weight": 16, "img": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"},
        {"id": "e3", "name": "Crucifixo na Máquina", "muscle": "Peito", "sets": 3, "reps": "12-15", "weight": 25, "img": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop"},
        {"id": "e4", "name": "Tríceps na Polia", "muscle": "Tríceps", "sets": 4, "reps": "10-12", "weight": 18, "img": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop"},
        {"id": "e5", "name": "Tríceps Francês", "muscle": "Tríceps", "sets": 3, "reps": "10-12", "weight": 12, "img": "https://images.unsplash.com/photo-1591940765400-16b3b7c33d3e?w=400&h=300&fit=crop"},
    ],
}


async def seed_user_data(user_id: str, name: str, avatar: str):
    """Insert personal starter data for a brand-new user (idempotent)."""
    if await db.fitness_profiles.find_one({"user_id": user_id}):
        return
    logger.info(f"Seeding starter data for {user_id}")

    await db.fitness_profiles.insert_one({
        "user_id": user_id, "height": 175, "weight": 75.0, "body_fat": 18.0, "waist": 82,
        "goal": "Ganho de massa muscular", "level": "Iniciante", "place": "Academia",
        "equipment": ["Halteres", "Barra", "Máquinas"]})

    await db.dashboard_stats.insert_one({
        "user_id": user_id, "workouts_this_week": 0, "weekly_goal": 5,
        "calories_week": 0, "time_week": "0h 00m", "streak": 0,
        "weekly_days": [False] * 7})

    await db.today_workout.insert_one({"user_id": user_id, **TODAY_WORKOUT_TEMPLATE})

    await db.plans.insert_many([
        {"id": f"{user_id}_p1", "user_id": user_id, "name": "Push Pull Legs", "days": 6, "focus": "Hipertrofia", "active": True, "progress": 0},
        {"id": f"{user_id}_p2", "user_id": user_id, "name": "Full Body Iniciante", "days": 3, "focus": "Adaptação", "active": False, "progress": 0},
        {"id": f"{user_id}_p3", "user_id": user_id, "name": "Upper / Lower", "days": 4, "focus": "Força", "active": False, "progress": 0},
    ])

    await db.challenges.insert_many([
        {"id": f"{user_id}_c1", "user_id": user_id, "title": "Complete 5 treinos esta semana", "reward": "+250 XP", "progress": 0, "total": 5, "color": "#7c5cff"},
        {"id": f"{user_id}_c2", "user_id": user_id, "title": "Queime 4000 kcal", "reward": "+180 XP", "progress": 0, "total": 4000, "color": "#22d3ee"},
        {"id": f"{user_id}_c3", "user_id": user_id, "title": "Streak de 20 dias", "reward": "Badge Épico", "progress": 0, "total": 20, "color": "#f59e0b"},
        {"id": f"{user_id}_c4", "user_id": user_id, "title": "Registre 3 medidas", "reward": "+120 XP", "progress": 0, "total": 3, "color": "#39ff14"},
    ])

    await db.achievements.insert_many([
        {"id": f"{user_id}_a1", "user_id": user_id, "name": "Primeira Semana", "icon": "flame", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a2", "user_id": user_id, "name": "Streak de 15 dias", "icon": "zap", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a3", "user_id": user_id, "name": "100 Treinos", "icon": "trophy", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a4", "user_id": user_id, "name": "Rei do Supino", "icon": "dumbbell", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a5", "user_id": user_id, "name": "Combo x5", "icon": "flame", "unlocked": False, "color": "#6b7280"},
        {"id": f"{user_id}_a6", "user_id": user_id, "name": "Maratona 60 dias", "icon": "medal", "unlocked": False, "color": "#6b7280"},
    ])

    await db.measurements.insert_many([
        {"user_id": user_id, "label": "Peso", "value": 75.0, "unit": "kg", "delta": 0, "history": [75.0, 75.0]},
        {"user_id": user_id, "label": "Gordura", "value": 18.0, "unit": "%", "delta": 0, "history": [18.0, 18.0]},
        {"user_id": user_id, "label": "Cintura", "value": 82, "unit": "cm", "delta": 0, "history": [82, 82]},
        {"user_id": user_id, "label": "Braço", "value": 36.0, "unit": "cm", "delta": 0, "history": [36.0, 36.0]},
    ])

    await db.one_rm.insert_many([
        {"user_id": user_id, "exercise": "Supino Reto", "value": 50, "delta": 0, "unit": "kg"},
        {"user_id": user_id, "exercise": "Agachamento", "value": 70, "delta": 0, "unit": "kg"},
        {"user_id": user_id, "exercise": "Levantamento Terra", "value": 80, "delta": 0, "unit": "kg"},
        {"user_id": user_id, "exercise": "Desenvolvimento", "value": 35, "delta": 0, "unit": "kg"},
    ])

    await db.volume_history.insert_many([
        {"user_id": user_id, "week": w, "volume": v} for w, v in
        [("S1", 8.0), ("S2", 9.5), ("S3", 11.0), ("S4", 12.2), ("S5", 13.5), ("S6", 15.0)]
    ])

    # auto-join default gym league
    lg = await db.leagues.find_one({"id": "lg1"})
    if lg and not await db.league_members.find_one({"league_id": "lg1", "user_id": user_id}):
        await db.league_members.insert_one({
            "id": str(uuid.uuid4()), "league_id": "lg1", "user_id": user_id,
            "name": name, "avatar": avatar,
            "workouts_week": 0, "calories_week": 0, "workouts_month": 0, "calories_month": 0, "streak": 0})
        await db.leagues.update_one({"id": "lg1"}, {"$inc": {"members": 1}})


# ---------------- Auth routes ----------------
@api.post("/auth/session")
async def auth_session(body: SessionIn, response: Response):
    try:
        r = requests.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id}, timeout=15)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = data.get("email")
    name = data.get("name") or (email.split("@")[0] if email else "Atleta")
    picture = data.get("picture") or "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop"
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "avatar": picture, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        handle = "@" + (email.split("@")[0] if email else "atleta")
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "handle": handle,
            "avatar": picture, "picture": picture, "gym": DEFAULT_GYM,
            "level": 1, "xp": 0, "xp_to_next": 1000, "combo_multiplier": 1.0,
            "streak": 0, "joined_at": datetime.now(timezone.utc).strftime("%b %Y"),
            "neon_color": "#7c5cff", "trainer_style": "t1",
            "created_at": datetime.now(timezone.utc)})
        await seed_user_data(user_id, name, picture)

    expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires, "created_at": datetime.now(timezone.utc)})

    response.set_cookie(key="session_token", value=session_token, httponly=True,
                        secure=True, samesite="none", path="/", max_age=7 * 24 * 3600)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@api.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return user


@api.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---------------- App routes ----------------
@api.get("/")
async def root():
    return {"message": "Gym Personal App API"}


@api.get("/user/me")
async def get_user(user=Depends(get_current_user)):
    return user


@api.put("/user/trainer-style")
async def set_style(body: TrainerStyleIn, user=Depends(get_current_user)):
    await db.users.update_one({"user_id": uid(user)}, {"$set": {"trainer_style": body.style_id}})
    return {"ok": True, "trainer_style": body.style_id}


@api.get("/fitness-profile")
async def get_profile(user=Depends(get_current_user)):
    return clean(await db.fitness_profiles.find_one({"user_id": uid(user)}))


@api.put("/fitness-profile")
async def update_profile(body: FitnessProfileIn, user=Depends(get_current_user)):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    await db.fitness_profiles.update_one({"user_id": uid(user)}, {"$set": upd})
    return clean(await db.fitness_profiles.find_one({"user_id": uid(user)}))


@api.get("/trainer-styles")
async def trainer_styles():
    return [clean(d) for d in await db.trainer_styles.find().to_list(50)]


@api.get("/challenges")
async def challenges(user=Depends(get_current_user)):
    return [clean(d) for d in await db.challenges.find({"user_id": uid(user)}).to_list(50)]


@api.get("/achievements")
async def achievements(user=Depends(get_current_user)):
    return [clean(d) for d in await db.achievements.find({"user_id": uid(user)}).to_list(50)]


async def _my_league_snippet(user_id: str):
    mem = await db.league_members.find_one({"user_id": user_id})
    if not mem:
        return None
    league = clean(await db.leagues.find_one({"id": mem["league_id"]}))
    if not league:
        return None
    members = await db.league_members.find({"league_id": league["id"]}).to_list(200)
    members.sort(key=lambda m: m.get("workouts_week", 0), reverse=True)
    rank = next((i + 1 for i, m in enumerate(members) if m.get("user_id") == user_id), None)
    league["my_rank"] = rank
    return league


@api.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    u = uid(user)
    stats = clean(await db.dashboard_stats.find_one({"user_id": u}))
    if stats:
        today_s = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        stats["streak_at_risk"] = bool(stats.get("streak", 0) > 0 and stats.get("last_workout_date") != today_s)
    tip = clean(await db.daily_tips.find_one({}))
    workout = clean(await db.today_workout.find_one({"user_id": u}))
    chal = [clean(d) for d in await db.challenges.find({"user_id": u}).to_list(3)]
    league = await _my_league_snippet(u)
    return {"user": user, "stats": stats, "daily_tip": tip,
            "today_workout": workout, "challenges": chal, "my_league": league}


@api.get("/workout/today")
async def workout_today(user=Depends(get_current_user)):
    return clean(await db.today_workout.find_one({"user_id": uid(user)}))


@api.get("/workout/plans")
async def workout_plans(user=Depends(get_current_user)):
    return [clean(d) for d in await db.plans.find({"user_id": uid(user)}).to_list(50)]


@api.post("/workout/complete")
async def workout_complete(user=Depends(get_current_user)):
    u = uid(user)
    now = datetime.now(timezone.utc)
    today_s = now.strftime("%Y-%m-%d")
    yest_s = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    ds = await db.dashboard_stats.find_one({"user_id": u})
    last_completed = ds.get("last_completed_at")
    if last_completed and (now - datetime.fromisoformat(last_completed)).total_seconds() < 60:
        return {"xp_gained": 0, "stats": clean(ds)}
    streak = ds.get("streak", 0)
    last = ds.get("last_workout_date")
    if last != today_s:
        streak = streak + 1 if last == yest_s else 1
    weekly = ds.get("weekly_days", [False] * 7)
    weekly[now.weekday()] = True
    total = ds.get("total_workouts", 0) + 1
    xp_gained = 280
    await db.users.update_one({"user_id": u}, {"$inc": {"xp": xp_gained}, "$set": {"streak": streak}})
    await db.dashboard_stats.update_one({"user_id": u}, {
        "$inc": {"workouts_this_week": 1, "calories_week": 480},
        "$set": {"streak": streak, "last_workout_date": today_s, "weekly_days": weekly, "total_workouts": total, "last_completed_at": now.isoformat()}})
    await db.league_members.update_many({"user_id": u}, {
        "$inc": {"workouts_week": 1, "calories_week": 480, "workouts_month": 1, "calories_month": 480},
        "$set": {"streak": streak}})
    stats = clean(await db.dashboard_stats.find_one({"user_id": u}))
    await db.challenges.update_one({"id": f"{u}_c1"}, {"$set": {"progress": stats["workouts_this_week"]}})
    await db.challenges.update_one({"id": f"{u}_c2"}, {"$set": {"progress": stats["calories_week"]}})
    await db.challenges.update_one({"id": f"{u}_c3"}, {"$set": {"progress": streak}})
    if stats["workouts_this_week"] >= stats.get("weekly_goal", 5):
        await db.achievements.update_one({"id": f"{u}_a1"}, {"$set": {"unlocked": True, "color": "#f59e0b"}})
    if streak >= 15:
        await db.achievements.update_one({"id": f"{u}_a2"}, {"$set": {"unlocked": True, "color": "#7c5cff"}})
    if total >= 100:
        await db.achievements.update_one({"id": f"{u}_a3"}, {"$set": {"unlocked": True, "color": "#39ff14"}})
    return {"xp_gained": xp_gained, "stats": stats}


@api.post("/workout/performance")
async def log_performance(body: PerformanceIn, user=Depends(get_current_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": uid(user), "exercise_id": body.exercise_id,
           "sets": [s.dict() for s in body.sets], "date": datetime.now(timezone.utc).isoformat()}
    await db.performance_logs.insert_one(doc)
    return {"ok": True}


@api.get("/exercises")
async def exercises(muscle: Optional[str] = None, q: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if muscle and muscle != "Todos":
        query["muscle"] = muscle
    items = [clean(d) for d in await db.exercises.find(query).to_list(200)]
    if q:
        items = [e for e in items if q.lower() in e["name"].lower()]
    return items


@api.get("/progress")
async def progress(user=Depends(get_current_user)):
    u = uid(user)
    return {
        "measurements": [clean(d) for d in await db.measurements.find({"user_id": u}).to_list(50)],
        "one_rm": [clean(d) for d in await db.one_rm.find({"user_id": u}).to_list(50)],
        "plateaus": [clean(d) for d in await db.plateaus.find({"user_id": u}).to_list(50)],
        "volume_history": [clean(d) for d in await db.volume_history.find({"user_id": u}).to_list(50)],
    }


@api.post("/measurements")
async def add_measurement(body: MeasurementIn, user=Depends(get_current_user)):
    u = uid(user)
    mapping = {"Peso": body.peso, "Gordura": body.gordura, "Cintura": body.cintura, "Braço": body.braco}
    for label, val in mapping.items():
        if val is None:
            continue
        doc = await db.measurements.find_one({"user_id": u, "label": label})
        if not doc:
            continue
        prev = doc["value"]
        history = (doc.get("history") or [])[-4:] + [val]
        await db.measurements.update_one({"user_id": u, "label": label},
                                         {"$set": {"value": val, "delta": round(val - prev, 1), "history": history}})
    return [clean(d) for d in await db.measurements.find({"user_id": u}).to_list(50)]


@api.get("/leagues")
async def leagues(user=Depends(get_current_user)):
    gym = user["gym"]
    items = [clean(d) for d in await db.leagues.find({"gym": gym}).to_list(100)]
    my_ids = {m["league_id"] for m in await db.league_members.find({"user_id": uid(user)}).to_list(100)}
    for it in items:
        it["joined"] = it["id"] in my_ids
    return items


@api.get("/leagues/{league_id}")
async def league_detail(league_id: str, user=Depends(get_current_user)):
    lg = clean(await db.leagues.find_one({"id": league_id}))
    if not lg:
        raise HTTPException(404, "League not found")
    return lg


@api.post("/leagues")
async def create_league(body: LeagueIn, user=Depends(get_current_user)):
    u = uid(user)
    ds = await db.dashboard_stats.find_one({"user_id": u})
    lid = str(uuid.uuid4())
    league = {"id": lid, "name": body.name, "gym": user["gym"], "members": 1,
              "emoji": "🚀", "neon": "#39ff14", "description": f"Liga de {user['name']}"}
    await db.leagues.insert_one(dict(league))
    await db.league_members.insert_one({
        "id": str(uuid.uuid4()), "league_id": lid, "user_id": u,
        "name": user["name"], "avatar": user["avatar"],
        "workouts_week": ds["workouts_this_week"], "calories_week": ds["calories_week"],
        "workouts_month": ds["workouts_this_week"] * 4, "calories_month": ds["calories_week"] * 4,
        "streak": user["streak"]})
    league["joined"] = True
    return clean(league)


@api.post("/leagues/{league_id}/join")
async def join_league(league_id: str, user=Depends(get_current_user)):
    u = uid(user)
    lg = await db.leagues.find_one({"id": league_id})
    if not lg:
        raise HTTPException(404, "League not found")
    if await db.league_members.find_one({"league_id": league_id, "user_id": u}):
        return {"ok": True, "already": True}
    ds = await db.dashboard_stats.find_one({"user_id": u})
    await db.league_members.insert_one({
        "id": str(uuid.uuid4()), "league_id": league_id, "user_id": u,
        "name": user["name"], "avatar": user["avatar"],
        "workouts_week": ds["workouts_this_week"], "calories_week": ds["calories_week"],
        "workouts_month": ds["workouts_this_week"] * 4, "calories_month": ds["calories_week"] * 4,
        "streak": user["streak"]})
    await db.leagues.update_one({"id": league_id}, {"$inc": {"members": 1}})
    return {"ok": True}


@api.get("/leagues/{league_id}/ranking")
async def league_ranking(league_id: str, metric: str = "workouts", period: str = "weekly", user=Depends(get_current_user)):
    members = [clean(m) for m in await db.league_members.find({"league_id": league_id}).to_list(200)]
    if metric == "streak":
        key = "streak"
    elif period == "monthly":
        key = "calories_month" if metric == "calories" else "workouts_month"
    else:
        key = "calories_week" if metric == "calories" else "workouts_week"
    members.sort(key=lambda m: m.get(key, 0), reverse=True)
    for m in members:
        m["is_me"] = (m.get("user_id") == uid(user))
    return {"metric": metric, "period": period, "key": key, "members": members}


# ---------------- AI Coach ----------------
MUSCLE_IMGS = {
    "Peito": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    "Costas": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop",
    "Perna": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop",
    "Ombro": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop",
    "Braço": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop",
    "Tríceps": "https://images.unsplash.com/photo-1591940765400-16b3b7c33d3e?w=400&h=300&fit=crop",
    "Bíceps": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop",
    "Abdômen": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
    "Cardio": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop",
}
DEFAULT_EX_IMG = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"

EMERGENCY_WORKOUT = {
    "name": "Treino Emergencial", "focus": "Peso Corporal · Full Body",
    "day": "Sem equipamento", "duration": "~25 min", "total_volume": "—",
    "exercises": [
        {"id": "em1", "name": "Flexão de Braços", "muscle": "Peito", "sets": 4, "reps": "12-15", "weight": 0, "img": MUSCLE_IMGS["Peito"]},
        {"id": "em2", "name": "Agachamento Corporal", "muscle": "Perna", "sets": 4, "reps": "15-20", "weight": 0, "img": MUSCLE_IMGS["Perna"]},
        {"id": "em3", "name": "Prancha", "muscle": "Abdômen", "sets": 3, "reps": "45s", "weight": 0, "img": MUSCLE_IMGS["Abdômen"]},
        {"id": "em4", "name": "Afundo Alternado", "muscle": "Perna", "sets": 3, "reps": "12/perna", "weight": 0, "img": MUSCLE_IMGS["Perna"]},
        {"id": "em5", "name": "Burpee", "muscle": "Cardio", "sets": 3, "reps": "10", "weight": 0, "img": MUSCLE_IMGS["Cardio"]},
    ],
}


@api.get("/chat/history")
async def chat_history(user=Depends(get_current_user)):
    return [clean(m) for m in await db.chat_messages.find({"user_id": uid(user)}).sort("ts", 1).to_list(100)]


@api.post("/chat")
async def chat_endpoint(body: ChatIn, user=Depends(get_current_user)):
    u = uid(user)
    style = await db.trainer_styles.find_one({"id": user.get("trainer_style", "t1")}) or {}
    stats = await db.dashboard_stats.find_one({"user_id": u}) or {}
    profile = await db.fitness_profiles.find_one({"user_id": u}) or {}
    history = await db.chat_messages.find({"user_id": u}).sort("ts", -1).to_list(10)
    history.reverse()
    hist_txt = "\n".join(f"{m['role']}: {m['text']}" for m in history)
    system = (
        f"Você é o Treinador IA do app GymPersonal, um personal trainer especialista em musculação, nutrição esportiva e condicionamento.\n"
        f"Sua personalidade: {style.get('name', 'O Motivador')} — {style.get('desc', 'cheio de energia e incentivo')}.\n"
        f"Dados do aluno: nome {user['name']}, objetivo: {profile.get('goal')}, nível: {profile.get('level')}, "
        f"peso: {profile.get('weight')}kg, altura: {profile.get('height')}cm, treinos esta semana: {stats.get('workouts_this_week')}, "
        f"streak: {stats.get('streak')} dias.\n"
        f"Responda SEMPRE em português (PT-BR), de forma prática, específica e concisa (máx ~120 palavras).\n"
        f"Histórico recente da conversa:\n{hist_txt}"
    )
    if not LlmChat or not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Integração de IA indisponível. Configure EMERGENT_LLM_KEY para habilitar o treinador IA.")
    await db.chat_messages.insert_one({"id": str(uuid.uuid4()), "user_id": u, "role": "user", "text": body.message, "ts": datetime.now(timezone.utc).isoformat()})
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"coach_{u}_{uuid.uuid4().hex[:6]}", system_message=system).with_model("openai", "gpt-5.5")

    async def gen():
        full = ""
        try:
            async for ev in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield ev.content
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.error(f"chat stream error: {e}")
            if not full:
                yield "Desculpe, tive um problema para responder agora. Tente novamente em instantes."
        if full:
            await db.chat_messages.insert_one({"id": str(uuid.uuid4()), "user_id": u, "role": "trainer", "text": full, "ts": datetime.now(timezone.utc).isoformat()})

    return StreamingResponse(gen(), media_type="text/plain", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@api.post("/workout/generate-plan")
async def generate_plan(user=Depends(get_current_user)):
    if not LlmChat or not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Integração de IA indisponível. Configure EMERGENT_LLM_KEY para gerar planos.")
    u = uid(user)
    profile = await db.fitness_profiles.find_one({"user_id": u}) or {}
    assess = await db.assessments.find_one({"user_id": u}) or {}
    prompt = (
        f"Gere um plano de treino de musculação personalizado.\n"
        f"Objetivo: {profile.get('goal')}. Nível: {profile.get('level')}. Dias/semana: {assess.get('days_per_week', 4)}. "
        f"Peso: {profile.get('weight')}kg. Lesões/restrições: {assess.get('injuries') or 'nenhuma'}. Foco: {assess.get('focus_area') or 'Corpo todo'}.\n"
        'Responda APENAS com JSON válido neste formato exato:\n'
        '{"plan_name": "nome curto", "focus": "foco do plano", "days": 4, "workout": {"name": "nome do treino de hoje", '
        '"focus": "grupo muscular · tipo", "duration": "~50 min", "exercises": [{"name": "...", "muscle": "...", "sets": 4, "reps": "8-10", "weight": 20}]}}\n'
        "O workout é o treino de hoje (dia 1) com 5 a 6 exercícios. O campo muscle deve ser um de: Peito, Costas, Perna, Ombro, Braço, Tríceps, Bíceps, Abdômen, Cardio. weight em kg adequado ao nível."
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"plan_{u}_{uuid.uuid4().hex[:6]}",
                   system_message="Você é um personal trainer especialista. Responda APENAS com JSON válido, sem markdown.").with_model("openai", "gpt-5.5")
    try:
        resp = await chat.send_message(UserMessage(text=prompt))
        txt = (resp if isinstance(resp, str) else str(resp)).strip()
        if txt.startswith("```"):
            txt = txt.split("```")[1]
            if txt.startswith("json"):
                txt = txt[4:]
        data = json.loads(txt.strip())
    except Exception as e:
        logger.error(f"plan generation error: {e}")
        raise HTTPException(status_code=502, detail="Falha ao gerar plano com IA")
    w = data["workout"]
    exercises = []
    for i, ex in enumerate(w.get("exercises", [])):
        exercises.append({"id": f"g{i+1}", "name": ex["name"], "muscle": ex.get("muscle", ""),
                          "sets": int(ex.get("sets", 3)), "reps": str(ex.get("reps", "10")),
                          "weight": float(ex.get("weight", 10)), "img": MUSCLE_IMGS.get(ex.get("muscle"), DEFAULT_EX_IMG)})
    workout_doc = {"user_id": u, "name": w.get("name", data.get("plan_name", "Treino IA")),
                   "focus": w.get("focus", "IA · Personalizado"), "day": "Dia 1 · Gerado por IA",
                   "duration": w.get("duration", "~50 min"), "total_volume": "—", "exercises": exercises}
    await db.today_workout.delete_many({"user_id": u})
    await db.today_workout.insert_one(dict(workout_doc))
    await db.plans.update_many({"user_id": u}, {"$set": {"active": False}})
    plan = {"id": f"{u}_ai_{uuid.uuid4().hex[:5]}", "user_id": u, "name": data.get("plan_name", "Plano IA"),
            "days": int(data.get("days", 4)), "focus": data.get("focus", "IA"), "active": True, "progress": 0, "ai": True}
    await db.plans.insert_one(dict(plan))
    return {"plan": clean(plan), "workout": clean(workout_doc)}


@api.get("/workout/emergency")
async def emergency_workout(user=Depends(get_current_user)):
    return EMERGENCY_WORKOUT


@api.post("/workout/plans/{plan_id}/activate")
async def activate_plan(plan_id: str, user=Depends(get_current_user)):
    u = uid(user)
    p = await db.plans.find_one({"id": plan_id, "user_id": u})
    if not p:
        raise HTTPException(404, "Plan not found")
    await db.plans.update_many({"user_id": u}, {"$set": {"active": False}})
    await db.plans.update_one({"id": plan_id}, {"$set": {"active": True}})
    return {"ok": True}


# ---------------- League invites ----------------
@api.get("/leagues/{league_id}/invite")
async def league_invite(league_id: str, user=Depends(get_current_user)):
    lg = await db.leagues.find_one({"id": league_id})
    if not lg:
        raise HTTPException(404, "League not found")
    if not await db.league_members.find_one({"league_id": league_id, "user_id": uid(user)}):
        raise HTTPException(403, "Somente membros podem convidar")
    code = lg.get("invite_code")
    if not code:
        code = uuid.uuid4().hex[:6].upper()
        await db.leagues.update_one({"id": league_id}, {"$set": {"invite_code": code}})
    return {"code": code, "league_name": lg["name"]}


@api.post("/leagues/join-by-code")
async def join_league_by_code(body: JoinCodeIn, user=Depends(get_current_user)):
    code = body.code.strip().upper()
    lg = await db.leagues.find_one({"invite_code": code})
    if not lg:
        raise HTTPException(404, "Código inválido")
    await join_league(lg["id"], user)
    return {"ok": True, "league": clean(lg)}


# ---------------- Professional assessment ----------------
@api.get("/assessment")
async def get_assessment(user=Depends(get_current_user)):
    a = clean(await db.assessments.find_one({"user_id": uid(user)}))
    return {"done": bool(user.get("assessment_done")), "assessment": a}


@api.post("/assessment")
async def submit_assessment(body: AssessmentIn, user=Depends(get_current_user)):
    u = uid(user)
    doc = {"user_id": u, **body.dict(), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.assessments.update_one({"user_id": u}, {"$set": doc}, upsert=True)
    upd = {"weight": body.weight, "height": body.height, "goal": body.goal, "level": body.experience}
    if body.body_fat is not None:
        upd["body_fat"] = body.body_fat
    if body.waist is not None:
        upd["waist"] = body.waist
    await db.fitness_profiles.update_one({"user_id": u}, {"$set": upd})
    for label, val in [("Peso", body.weight), ("Gordura", body.body_fat), ("Cintura", body.waist)]:
        if val is not None:
            await db.measurements.update_one({"user_id": u, "label": label},
                                             {"$set": {"value": val, "delta": 0, "history": [val, val]}})
    await db.dashboard_stats.update_one({"user_id": u}, {"$set": {"weekly_goal": body.days_per_week}})
    await db.challenges.update_one({"id": f"{u}_c1"},
                                   {"$set": {"title": f"Complete {body.days_per_week} treinos esta semana", "total": body.days_per_week}})
    if not await db.achievements.find_one({"id": f"{u}_a0"}):
        await db.achievements.insert_one({"id": f"{u}_a0", "user_id": u, "name": "Avaliação Pro", "icon": "target", "unlocked": True, "color": "#22d3ee"})
    else:
        await db.achievements.update_one({"id": f"{u}_a0"}, {"$set": {"unlocked": True, "color": "#22d3ee"}})
    await db.users.update_one({"user_id": u}, {"$set": {"assessment_done": True}})
    return await db.users.find_one({"user_id": u}, {"_id": 0})


# ---------------- Global seed ----------------
async def seed_global():
    if not await db.meta.find_one({"_id": "seeded_global_v2"}):
        logger.info("Seeding global data...")

        await db.daily_tips.delete_many({})
        await db.daily_tips.insert_one({
            "id": "tip1", "title": "DICA DE OURO", "tag": "TÉCNICA",
            "text": "Priorize a fase excêntrica (descida) por 2-3 segundos em cada repetição. Isso aumenta o tempo sob tensão e potencializa a hipertrofia sem precisar de mais carga."})

        if not await db.exercises.find_one({}):
            await db.exercises.insert_many([
                {"id": "l1", "name": "Supino Reto", "muscle": "Peito", "equipment": "Barra", "difficulty": "Intermediário", "img": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"},
                {"id": "l2", "name": "Agachamento Livre", "muscle": "Perna", "equipment": "Barra", "difficulty": "Avançado", "img": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop"},
                {"id": "l3", "name": "Puxada Frontal", "muscle": "Costas", "equipment": "Máquina", "difficulty": "Iniciante", "img": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop"},
                {"id": "l4", "name": "Desenvolvimento Militar", "muscle": "Ombro", "equipment": "Halteres", "difficulty": "Intermediário", "img": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop"},
                {"id": "l5", "name": "Rosca Direta", "muscle": "Braço", "equipment": "Barra", "difficulty": "Iniciante", "img": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop"},
                {"id": "l6", "name": "Levantamento Terra", "muscle": "Costas", "equipment": "Barra", "difficulty": "Avançado", "img": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop"},
                {"id": "l7", "name": "Leg Press", "muscle": "Perna", "equipment": "Máquina", "difficulty": "Iniciante", "img": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400&h=300&fit=crop"},
                {"id": "l8", "name": "Prancha Abdominal", "muscle": "Abdômen", "equipment": "Peso Corporal", "difficulty": "Iniciante", "img": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop"},
                {"id": "l9", "name": "Corrida Intervalada", "muscle": "Cardio", "equipment": "Esteira", "difficulty": "Intermediário", "img": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop"},
                {"id": "l10", "name": "Elevação Lateral", "muscle": "Ombro", "equipment": "Halteres", "difficulty": "Iniciante", "img": "https://images.unsplash.com/photo-1591940765400-16b3b7c33d3e?w=400&h=300&fit=crop"},
            ])

        if not await db.trainer_styles.find_one({}):
            await db.trainer_styles.insert_many([
                {"id": "t1", "name": "O Motivador", "desc": "Energia máxima, cheio de incentivo e emojis de força.", "accent": "#f59e0b", "tag": "HYPE"},
                {"id": "t2", "name": "O Científico", "desc": "Baseado em evidências, explica o porquê de cada série.", "accent": "#22d3ee", "tag": "DADOS"},
                {"id": "t3", "name": "O Durão", "desc": "Sem desculpas. Direto ao ponto e exigente.", "accent": "#ef4444", "tag": "HARD"},
                {"id": "t4", "name": "O Equilibrado", "desc": "Foco em bem-estar, técnica e progressão saudável.", "accent": "#39ff14", "tag": "ZEN"},
            ])

        if not await db.leagues.find_one({}):
            gym = DEFAULT_GYM
            await db.leagues.insert_many([
                {"id": "lg1", "gym": gym, "name": "IronCore Warriors", "members": 7, "emoji": "🔥", "neon": "#7c5cff", "description": "Liga oficial da IronCore. Só vale suor de verdade!"},
                {"id": "lg2", "gym": gym, "name": "Beastmode Squad", "members": 18, "emoji": "🦍", "neon": "#39ff14", "description": "Foco total em força."},
                {"id": "lg3", "gym": gym, "name": "Cardio Kings", "members": 31, "emoji": "⚡", "neon": "#22d3ee", "description": "Quem queima mais calorias?"},
                {"id": "lg4", "gym": gym, "name": "Sunrise Lifters", "members": 12, "emoji": "🌅", "neon": "#f59e0b", "description": "Treino matinal."},
            ])

            def mem(name, avatar, ww, cw, wm, cm, streak, user_id=None):
                return {"id": str(uuid.uuid4()), "league_id": "lg1", "user_id": user_id, "name": name,
                        "avatar": avatar, "workouts_week": ww, "calories_week": cw,
                        "workouts_month": wm, "calories_month": cm, "streak": streak}
            a = {
                "bruno": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
                "carla": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
                "rafael": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop",
                "diego": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                "marina": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
                "thiago": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                "julia": "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop",
            }
            await db.league_members.insert_many([
                mem("Bruno Lima", a["bruno"], 6, 5240, 19, 17600, 21),
                mem("Carla Nunes", a["carla"], 6, 4980, 22, 19800, 19),
                mem("Rafael Souza", a["rafael"], 4, 3820, 20, 18400, 17),
                mem("Diego Alves", a["diego"], 4, 3610, 16, 14200, 12),
                mem("Marina Reis", a["marina"], 3, 3200, 12, 11500, 9),
                mem("Thiago Melo", a["thiago"], 3, 2900, 14, 12800, 8),
                mem("Julia Costa", a["julia"], 2, 2100, 9, 8200, 5),
            ])

        await db.meta.insert_one({"_id": "seeded_global_v2", "at": datetime.now(timezone.utc).isoformat()})
        logger.info("Global seeding complete.")


@app.on_event("startup")
async def on_startup():
    await seed_global()


app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
