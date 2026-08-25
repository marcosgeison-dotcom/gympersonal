from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")

USER_ID = "u_001"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clean(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ---------------- Models ----------------
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


# ---------------- Routes ----------------
@api.get("/")
async def root():
    return {"message": "Gym Personal App API"}


@api.get("/user/me")
async def get_user():
    return clean(await db.users.find_one({"id": USER_ID}))


@api.put("/user/trainer-style")
async def set_style(body: TrainerStyleIn):
    await db.users.update_one({"id": USER_ID}, {"$set": {"trainer_style": body.style_id}})
    return {"ok": True, "trainer_style": body.style_id}


@api.get("/fitness-profile")
async def get_profile():
    return clean(await db.fitness_profiles.find_one({"user_id": USER_ID}))


@api.put("/fitness-profile")
async def update_profile(body: FitnessProfileIn):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    await db.fitness_profiles.update_one({"user_id": USER_ID}, {"$set": upd})
    return clean(await db.fitness_profiles.find_one({"user_id": USER_ID}))


@api.get("/trainer-styles")
async def trainer_styles():
    return [clean(d) for d in await db.trainer_styles.find().to_list(50)]


@api.get("/challenges")
async def challenges():
    return [clean(d) for d in await db.challenges.find({"user_id": USER_ID}).to_list(50)]


@api.get("/achievements")
async def achievements():
    return [clean(d) for d in await db.achievements.find({"user_id": USER_ID}).to_list(50)]


async def _my_league_snippet():
    mem = await db.league_members.find_one({"user_id": USER_ID})
    if not mem:
        return None
    league = clean(await db.leagues.find_one({"id": mem["league_id"]}))
    if not league:
        return None
    members = await db.league_members.find({"league_id": league["id"]}).to_list(200)
    members.sort(key=lambda m: m.get("workouts_week", 0), reverse=True)
    rank = next((i + 1 for i, m in enumerate(members) if m.get("user_id") == USER_ID), None)
    league["my_rank"] = rank
    return league


@api.get("/dashboard")
async def dashboard():
    user = clean(await db.users.find_one({"id": USER_ID}))
    stats = clean(await db.dashboard_stats.find_one({"user_id": USER_ID}))
    tip = clean(await db.daily_tips.find_one({}))
    workout = clean(await db.today_workout.find_one({"user_id": USER_ID}))
    chal = [clean(d) for d in await db.challenges.find({"user_id": USER_ID}).to_list(3)]
    league = await _my_league_snippet()
    return {"user": user, "stats": stats, "daily_tip": tip,
            "today_workout": workout, "challenges": chal, "my_league": league}


@api.get("/workout/today")
async def workout_today():
    return clean(await db.today_workout.find_one({"user_id": USER_ID}))


@api.get("/workout/plans")
async def workout_plans():
    return [clean(d) for d in await db.plans.find({"user_id": USER_ID}).to_list(50)]


@api.post("/workout/complete")
async def workout_complete():
    xp_gained = 280
    await db.users.update_one({"id": USER_ID}, {"$inc": {"xp": xp_gained}})
    await db.dashboard_stats.update_one(
        {"user_id": USER_ID},
        {"$inc": {"workouts_this_week": 1, "calories_week": 480}})
    # bump my league weekly metrics
    await db.league_members.update_many(
        {"user_id": USER_ID}, {"$inc": {"workouts_week": 1, "calories_week": 480, "workouts_month": 1, "calories_month": 480}})
    stats = clean(await db.dashboard_stats.find_one({"user_id": USER_ID}))
    return {"xp_gained": xp_gained, "stats": stats}


@api.post("/workout/performance")
async def log_performance(body: PerformanceIn):
    doc = {"id": str(uuid.uuid4()), "user_id": USER_ID, "exercise_id": body.exercise_id,
           "sets": [s.dict() for s in body.sets], "date": datetime.now(timezone.utc).isoformat()}
    await db.performance_logs.insert_one(doc)
    return {"ok": True}


@api.get("/exercises")
async def exercises(muscle: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if muscle and muscle != "Todos":
        query["muscle"] = muscle
    items = [clean(d) for d in await db.exercises.find(query).to_list(200)]
    if q:
        items = [e for e in items if q.lower() in e["name"].lower()]
    return items


@api.get("/progress")
async def progress():
    return {
        "measurements": [clean(d) for d in await db.measurements.find({"user_id": USER_ID}).to_list(50)],
        "one_rm": [clean(d) for d in await db.one_rm.find({"user_id": USER_ID}).to_list(50)],
        "plateaus": [clean(d) for d in await db.plateaus.find({"user_id": USER_ID}).to_list(50)],
        "volume_history": [clean(d) for d in await db.volume_history.find({"user_id": USER_ID}).to_list(50)],
    }


@api.post("/measurements")
async def add_measurement(body: MeasurementIn):
    mapping = {"Peso": body.peso, "Gordura": body.gordura, "Cintura": body.cintura, "Braço": body.braco}
    for label, val in mapping.items():
        if val is None:
            continue
        doc = await db.measurements.find_one({"user_id": USER_ID, "label": label})
        if not doc:
            continue
        prev = doc["value"]
        history = (doc.get("history") or [])[-4:] + [val]
        await db.measurements.update_one(
            {"user_id": USER_ID, "label": label},
            {"$set": {"value": val, "delta": round(val - prev, 1), "history": history}})
    return [clean(d) for d in await db.measurements.find({"user_id": USER_ID}).to_list(50)]


@api.get("/leagues")
async def leagues():
    user = await db.users.find_one({"id": USER_ID})
    gym = user["gym"]
    items = [clean(d) for d in await db.leagues.find({"gym": gym}).to_list(100)]
    my_ids = {m["league_id"] for m in await db.league_members.find({"user_id": USER_ID}).to_list(100)}
    for it in items:
        it["joined"] = it["id"] in my_ids
    return items


@api.get("/leagues/{league_id}")
async def league_detail(league_id: str):
    lg = clean(await db.leagues.find_one({"id": league_id}))
    if not lg:
        raise HTTPException(404, "League not found")
    return lg


@api.post("/leagues")
async def create_league(body: LeagueIn):
    user = await db.users.find_one({"id": USER_ID})
    ds = await db.dashboard_stats.find_one({"user_id": USER_ID})
    lid = str(uuid.uuid4())
    league = {"id": lid, "name": body.name, "gym": user["gym"], "members": 1,
              "emoji": "🚀", "neon": "#39ff14", "description": f"Liga de {user['name']}"}
    await db.leagues.insert_one(dict(league))
    await db.league_members.insert_one({
        "id": str(uuid.uuid4()), "league_id": lid, "user_id": USER_ID,
        "name": user["name"], "avatar": user["avatar"], "is_me": True,
        "workouts_week": ds["workouts_this_week"], "calories_week": ds["calories_week"],
        "workouts_month": ds["workouts_this_week"] * 4, "calories_month": ds["calories_week"] * 4,
        "streak": user["streak"]})
    league["joined"] = True
    return clean(league)


@api.post("/leagues/{league_id}/join")
async def join_league(league_id: str):
    lg = await db.leagues.find_one({"id": league_id})
    if not lg:
        raise HTTPException(404, "League not found")
    existing = await db.league_members.find_one({"league_id": league_id, "user_id": USER_ID})
    if existing:
        return {"ok": True, "already": True}
    user = await db.users.find_one({"id": USER_ID})
    ds = await db.dashboard_stats.find_one({"user_id": USER_ID})
    await db.league_members.insert_one({
        "id": str(uuid.uuid4()), "league_id": league_id, "user_id": USER_ID,
        "name": user["name"], "avatar": user["avatar"], "is_me": True,
        "workouts_week": ds["workouts_this_week"], "calories_week": ds["calories_week"],
        "workouts_month": ds["workouts_this_week"] * 4, "calories_month": ds["calories_week"] * 4,
        "streak": user["streak"]})
    await db.leagues.update_one({"id": league_id}, {"$inc": {"members": 1}})
    return {"ok": True}


@api.get("/leagues/{league_id}/ranking")
async def league_ranking(league_id: str, metric: str = "workouts", period: str = "weekly"):
    members = [clean(m) for m in await db.league_members.find({"league_id": league_id}).to_list(200)]
    if metric == "streak":
        key = "streak"
    elif period == "monthly":
        key = "calories_month" if metric == "calories" else "workouts_month"
    else:
        key = "calories_week" if metric == "calories" else "workouts_week"
    members.sort(key=lambda m: m.get(key, 0), reverse=True)
    return {"metric": metric, "period": period, "key": key, "members": members}


# ---------------- Seed ----------------
async def seed():
    if await db.meta.find_one({"_id": "seeded_v1"}):
        return
    logger.info("Seeding database...")

    await db.users.insert_one({
        "id": USER_ID, "name": "Rafael Souza", "handle": "@rafa.souza",
        "email": "rafael@gymapp.io",
        "avatar": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
        "gym": "IronCore Academia", "level": 12, "xp": 4820, "xp_to_next": 6000,
        "combo_multiplier": 2.4, "streak": 17, "joined_at": "Jan 2025",
        "neon_color": "#7c5cff", "trainer_style": "t1"})

    await db.fitness_profiles.insert_one({
        "user_id": USER_ID, "height": 178, "weight": 82.4, "body_fat": 15.2, "waist": 84,
        "goal": "Ganho de massa muscular", "level": "Intermediário", "place": "Academia",
        "equipment": ["Halteres", "Barra", "Máquinas", "Cabos"]})

    await db.dashboard_stats.insert_one({
        "user_id": USER_ID, "workouts_this_week": 4, "weekly_goal": 5,
        "calories_week": 3820, "time_week": "3h 42m", "streak": 17,
        "weekly_days": [True, True, False, True, True, False, False]})

    await db.daily_tips.insert_one({
        "id": "tip1", "title": "DICA DE OURO", "tag": "TÉCNICA",
        "text": "Priorize a fase excêntrica (descida) por 2-3 segundos em cada repetição. Isso aumenta o tempo sob tensão e potencializa a hipertrofia sem precisar de mais carga."})

    await db.today_workout.insert_one({
        "user_id": USER_ID, "name": "Peito & Tríceps", "focus": "Hipertrofia · Push Day",
        "day": "Dia 24 de 60", "duration": "~55 min", "total_volume": "7.4 ton",
        "exercises": [
            {"id": "e1", "name": "Supino Reto com Barra", "muscle": "Peito", "sets": 4, "reps": "8-10", "weight": 70, "img": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop"},
            {"id": "e2", "name": "Supino Inclinado Halteres", "muscle": "Peito Superior", "sets": 3, "reps": "10-12", "weight": 28, "img": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"},
            {"id": "e3", "name": "Crucifixo na Máquina", "muscle": "Peito", "sets": 3, "reps": "12-15", "weight": 45, "img": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop"},
            {"id": "e4", "name": "Tríceps na Polia", "muscle": "Tríceps", "sets": 4, "reps": "10-12", "weight": 32, "img": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop"},
            {"id": "e5", "name": "Tríceps Francês", "muscle": "Tríceps", "sets": 3, "reps": "10-12", "weight": 22, "img": "https://images.unsplash.com/photo-1591940765400-16b3b7c33d3e?w=400&h=300&fit=crop"},
        ]})

    await db.plans.insert_many([
        {"id": "p1", "user_id": USER_ID, "name": "Push Pull Legs", "days": 6, "focus": "Hipertrofia", "active": True, "progress": 40},
        {"id": "p2", "user_id": USER_ID, "name": "Full Body Iniciante", "days": 3, "focus": "Adaptação", "active": False, "progress": 100},
        {"id": "p3", "user_id": USER_ID, "name": "Upper / Lower", "days": 4, "focus": "Força", "active": False, "progress": 0},
    ])

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

    await db.measurements.insert_many([
        {"user_id": USER_ID, "label": "Peso", "value": 82.4, "unit": "kg", "delta": -0.6, "history": [84, 83.6, 83.1, 82.9, 82.4]},
        {"user_id": USER_ID, "label": "Gordura", "value": 15.2, "unit": "%", "delta": -1.1, "history": [17.4, 16.8, 16.1, 15.6, 15.2]},
        {"user_id": USER_ID, "label": "Cintura", "value": 84, "unit": "cm", "delta": -2, "history": [88, 87, 86, 85, 84]},
        {"user_id": USER_ID, "label": "Braço", "value": 39.5, "unit": "cm", "delta": 0.8, "history": [37.5, 38, 38.4, 39, 39.5]},
    ])

    await db.one_rm.insert_many([
        {"user_id": USER_ID, "exercise": "Supino Reto", "value": 92, "delta": 4, "unit": "kg"},
        {"user_id": USER_ID, "exercise": "Agachamento", "value": 128, "delta": 8, "unit": "kg"},
        {"user_id": USER_ID, "exercise": "Levantamento Terra", "value": 150, "delta": 6, "unit": "kg"},
        {"user_id": USER_ID, "exercise": "Desenvolvimento", "value": 58, "delta": 2, "unit": "kg"},
    ])

    await db.plateaus.insert_many([
        {"user_id": USER_ID, "exercise": "Rosca Direta", "weeks": 4, "weight": 20, "note": "Sem progressão há 4 semanas"},
        {"user_id": USER_ID, "exercise": "Elevação Lateral", "weeks": 3, "weight": 12, "note": "Considere drop-set"},
    ])

    await db.volume_history.insert_many([
        {"user_id": USER_ID, "week": "S1", "volume": 18.2},
        {"user_id": USER_ID, "week": "S2", "volume": 21.5},
        {"user_id": USER_ID, "week": "S3", "volume": 20.1},
        {"user_id": USER_ID, "week": "S4", "volume": 24.8},
        {"user_id": USER_ID, "week": "S5", "volume": 26.3},
        {"user_id": USER_ID, "week": "S6", "volume": 29.0},
    ])

    await db.challenges.insert_many([
        {"id": "c1", "user_id": USER_ID, "title": "Complete 5 treinos esta semana", "reward": "+250 XP", "progress": 4, "total": 5, "color": "#7c5cff"},
        {"id": "c2", "user_id": USER_ID, "title": "Queime 4000 kcal", "reward": "+180 XP", "progress": 3820, "total": 4000, "color": "#22d3ee"},
        {"id": "c3", "user_id": USER_ID, "title": "Streak de 20 dias", "reward": "Badge Épico", "progress": 17, "total": 20, "color": "#f59e0b"},
        {"id": "c4", "user_id": USER_ID, "title": "Registre 3 medidas", "reward": "+120 XP", "progress": 1, "total": 3, "color": "#39ff14"},
    ])

    await db.achievements.insert_many([
        {"id": "a1", "user_id": USER_ID, "name": "Primeira Semana", "icon": "flame", "unlocked": True, "color": "#f59e0b"},
        {"id": "a2", "user_id": USER_ID, "name": "Streak de 15 dias", "icon": "zap", "unlocked": True, "color": "#7c5cff"},
        {"id": "a3", "user_id": USER_ID, "name": "100 Treinos", "icon": "trophy", "unlocked": True, "color": "#22d3ee"},
        {"id": "a4", "user_id": USER_ID, "name": "Rei do Supino", "icon": "dumbbell", "unlocked": False, "color": "#6b7280"},
        {"id": "a5", "user_id": USER_ID, "name": "Combo x5", "icon": "flame", "unlocked": False, "color": "#6b7280"},
        {"id": "a6", "user_id": USER_ID, "name": "Maratona 60 dias", "icon": "medal", "unlocked": False, "color": "#6b7280"},
    ])

    await db.trainer_styles.insert_many([
        {"id": "t1", "name": "O Motivador", "desc": "Energia máxima, cheio de incentivo e emojis de força.", "accent": "#f59e0b", "tag": "HYPE"},
        {"id": "t2", "name": "O Científico", "desc": "Baseado em evidências, explica o porquê de cada série.", "accent": "#22d3ee", "tag": "DADOS"},
        {"id": "t3", "name": "O Durão", "desc": "Sem desculpas. Direto ao ponto e exigente.", "accent": "#ef4444", "tag": "HARD"},
        {"id": "t4", "name": "O Equilibrado", "desc": "Foco em bem-estar, técnica e progressão saudável.", "accent": "#39ff14", "tag": "ZEN"},
    ])

    # Leagues (per gym) + members with weekly/monthly metrics
    gym = "IronCore Academia"
    leagues_data = [
        {"id": "lg1", "gym": gym, "name": "IronCore Warriors", "members": 24, "emoji": "🔥", "neon": "#7c5cff", "description": "Liga oficial da IronCore. Só vale suor de verdade!"},
        {"id": "lg2", "gym": gym, "name": "Beastmode Squad", "members": 18, "emoji": "🦍", "neon": "#39ff14", "description": "Foco total em força."},
        {"id": "lg3", "gym": gym, "name": "Cardio Kings", "members": 31, "emoji": "⚡", "neon": "#22d3ee", "description": "Quem queima mais calorias?"},
        {"id": "lg4", "gym": gym, "name": "Sunrise Lifters", "members": 12, "emoji": "🌅", "neon": "#f59e0b", "description": "Treino matinal."},
    ]
    await db.leagues.insert_many([dict(l) for l in leagues_data])

    def mem(lid, name, avatar, ww, cw, wm, cm, streak, me=False, uid=None):
        return {"id": str(uuid.uuid4()), "league_id": lid, "user_id": uid, "name": name,
                "avatar": avatar, "is_me": me, "workouts_week": ww, "calories_week": cw,
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
        mem("lg1", "Bruno Lima", a["bruno"], 6, 5240, 19, 17600, 21),
        mem("lg1", "Carla Nunes", a["carla"], 6, 4980, 22, 19800, 19),
        mem("lg1", "Rafael Souza", a["rafael"], 4, 3820, 20, 18400, 17, me=True, uid=USER_ID),
        mem("lg1", "Diego Alves", a["diego"], 4, 3610, 16, 14200, 12),
        mem("lg1", "Marina Reis", a["marina"], 3, 3200, 12, 11500, 9),
        mem("lg1", "Thiago Melo", a["thiago"], 3, 2900, 14, 12800, 8),
        mem("lg1", "Julia Costa", a["julia"], 2, 2100, 9, 8200, 5),
    ])

    await db.meta.insert_one({"_id": "seeded_v1", "at": datetime.now(timezone.utc).isoformat()})
    logger.info("Seeding complete.")


@app.on_event("startup")
async def on_startup():
    await seed()


app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True, allow_origins=["*"],
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
