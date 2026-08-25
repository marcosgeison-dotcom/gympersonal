#!/usr/bin/env python3
"""
Backend API Test Suite for Gym Personal App
Tests all endpoints with the external base URL from frontend/.env
"""
import requests
import json
from pathlib import Path

# Read backend URL from frontend/.env
env_path = Path("/app/frontend/.env")
BACKEND_URL = None
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BACKEND_URL = line.split("=", 1)[1].strip()
                break

if not BACKEND_URL:
    raise ValueError("REACT_APP_BACKEND_URL not found in frontend/.env")

BASE_URL = f"{BACKEND_URL}/api"
print(f"Testing backend at: {BASE_URL}\n")

# Test results tracking
tests_passed = 0
tests_failed = 0
failures = []


def test(name, func):
    """Run a test and track results"""
    global tests_passed, tests_failed
    try:
        print(f"Testing: {name}...", end=" ")
        func()
        print("✅ PASSED")
        tests_passed += 1
    except AssertionError as e:
        print(f"❌ FAILED: {e}")
        tests_failed += 1
        failures.append({"test": name, "error": str(e)})
    except Exception as e:
        print(f"❌ ERROR: {e}")
        tests_failed += 1
        failures.append({"test": name, "error": f"Exception: {e}"})


def assert_status(response, expected=200):
    """Assert response status code"""
    if response.status_code != expected:
        raise AssertionError(
            f"Expected status {expected}, got {response.status_code}. "
            f"Response: {response.text[:200]}"
        )


def assert_keys(data, keys):
    """Assert dictionary has required keys"""
    missing = [k for k in keys if k not in data]
    if missing:
        raise AssertionError(f"Missing keys: {missing}")


# ============ Test 1: User & Profile Endpoints ============
def test_user_me():
    r = requests.get(f"{BASE_URL}/user/me")
    assert_status(r)
    user = r.json()
    assert_keys(user, ["id", "name", "gym"])
    assert user["id"] == "u_001", f"Expected id=u_001, got {user['id']}"
    assert user["name"] == "Rafael Souza", f"Expected name='Rafael Souza', got {user['name']}"
    assert user["gym"] == "IronCore Academia", f"Expected gym='IronCore Academia', got {user['gym']}"


def test_trainer_style_update():
    r = requests.put(f"{BASE_URL}/user/trainer-style", json={"style_id": "t2"})
    assert_status(r)
    data = r.json()
    assert data.get("trainer_style") == "t2", f"Expected trainer_style=t2, got {data.get('trainer_style')}"


def test_fitness_profile_get():
    r = requests.get(f"{BASE_URL}/fitness-profile")
    assert_status(r)
    profile = r.json()
    assert_keys(profile, ["user_id", "height", "weight"])


def test_fitness_profile_update():
    # First get current profile
    r1 = requests.get(f"{BASE_URL}/fitness-profile")
    assert_status(r1)
    
    # Update weight
    r2 = requests.put(f"{BASE_URL}/fitness-profile", json={"weight": 83.0})
    assert_status(r2)
    
    # Verify update persisted
    r3 = requests.get(f"{BASE_URL}/fitness-profile")
    assert_status(r3)
    profile = r3.json()
    assert profile["weight"] == 83.0, f"Expected weight=83.0, got {profile['weight']}"


def test_trainer_styles():
    r = requests.get(f"{BASE_URL}/trainer-styles")
    assert_status(r)
    styles = r.json()
    assert len(styles) == 4, f"Expected 4 trainer styles, got {len(styles)}"


# ============ Test 2: Dashboard, Challenges, Achievements ============
def test_challenges():
    r = requests.get(f"{BASE_URL}/challenges")
    assert_status(r)
    challenges = r.json()
    assert len(challenges) == 4, f"Expected 4 challenges, got {len(challenges)}"


def test_achievements():
    r = requests.get(f"{BASE_URL}/achievements")
    assert_status(r)
    achievements = r.json()
    assert len(achievements) == 6, f"Expected 6 achievements, got {len(achievements)}"


def test_dashboard():
    r = requests.get(f"{BASE_URL}/dashboard")
    assert_status(r)
    data = r.json()
    assert_keys(data, ["user", "stats", "daily_tip", "today_workout", "challenges", "my_league"])
    
    # Verify challenges length
    assert len(data["challenges"]) == 3, f"Expected 3 challenges in dashboard, got {len(data['challenges'])}"
    
    # Verify my_league has my_rank
    if data["my_league"]:
        assert "my_rank" in data["my_league"], "my_league missing my_rank"
        assert data["my_league"]["my_rank"] is not None, "my_rank should not be null"


# ============ Test 3: Workout Endpoints ============
def test_workout_today():
    r = requests.get(f"{BASE_URL}/workout/today")
    assert_status(r)
    workout = r.json()
    assert_keys(workout, ["exercises"])
    assert len(workout["exercises"]) == 5, f"Expected 5 exercises, got {len(workout['exercises'])}"


def test_workout_plans():
    r = requests.get(f"{BASE_URL}/workout/plans")
    assert_status(r)
    plans = r.json()
    assert len(plans) == 3, f"Expected 3 workout plans, got {len(plans)}"


def test_workout_complete():
    # Get stats before
    r1 = requests.get(f"{BASE_URL}/dashboard")
    assert_status(r1)
    stats_before = r1.json()["stats"]
    workouts_before = stats_before["workouts_this_week"]
    calories_before = stats_before["calories_week"]
    
    # Complete workout
    r2 = requests.post(f"{BASE_URL}/workout/complete")
    assert_status(r2)
    result = r2.json()
    
    # Verify response
    assert result["xp_gained"] == 280, f"Expected xp_gained=280, got {result['xp_gained']}"
    assert_keys(result, ["xp_gained", "stats"])
    
    # Verify stats updated
    stats_after = result["stats"]
    assert stats_after["workouts_this_week"] == workouts_before + 1, \
        f"Expected workouts_this_week to increase by 1 (from {workouts_before} to {workouts_before + 1}), got {stats_after['workouts_this_week']}"
    assert stats_after["calories_week"] == calories_before + 480, \
        f"Expected calories_week to increase by 480 (from {calories_before} to {calories_before + 480}), got {stats_after['calories_week']}"


def test_workout_performance():
    r = requests.post(f"{BASE_URL}/workout/performance", json={
        "exercise_id": "e1",
        "sets": [
            {"weight": 70, "reps": 10},
            {"weight": 72.5, "reps": 8}
        ]
    })
    assert_status(r)
    result = r.json()
    assert result.get("ok") is True, f"Expected ok=true, got {result}"


# ============ Test 4: Exercise Library ============
def test_exercises_all():
    r = requests.get(f"{BASE_URL}/exercises")
    assert_status(r)
    exercises = r.json()
    assert len(exercises) == 10, f"Expected 10 exercises, got {len(exercises)}"


def test_exercises_filter_muscle():
    r = requests.get(f"{BASE_URL}/exercises?muscle=Peito")
    assert_status(r)
    exercises = r.json()
    assert len(exercises) > 0, "Expected at least 1 exercise with muscle=Peito"
    for ex in exercises:
        assert ex["muscle"] == "Peito", f"Expected muscle=Peito, got {ex['muscle']}"


def test_exercises_search():
    r = requests.get(f"{BASE_URL}/exercises?q=agacha")
    assert_status(r)
    exercises = r.json()
    assert len(exercises) > 0, "Expected at least 1 exercise matching 'agacha'"
    found = any("agachamento" in ex["name"].lower() for ex in exercises)
    assert found, "Expected to find 'Agachamento Livre' in search results"


# ============ Test 5: Progress Endpoints ============
def test_progress():
    r = requests.get(f"{BASE_URL}/progress")
    assert_status(r)
    data = r.json()
    assert_keys(data, ["measurements", "one_rm", "plateaus", "volume_history"])
    assert len(data["measurements"]) == 4, f"Expected 4 measurements, got {len(data['measurements'])}"
    assert len(data["one_rm"]) == 4, f"Expected 4 one_rm entries, got {len(data['one_rm'])}"
    assert len(data["plateaus"]) == 2, f"Expected 2 plateaus, got {len(data['plateaus'])}"
    assert len(data["volume_history"]) == 6, f"Expected 6 volume_history entries, got {len(data['volume_history'])}"


def test_measurements_post():
    r = requests.post(f"{BASE_URL}/measurements", json={"peso": 81.9})
    assert_status(r)
    measurements = r.json()
    
    # Find Peso measurement
    peso = next((m for m in measurements if m["label"] == "Peso"), None)
    assert peso is not None, "Peso measurement not found"
    assert peso["value"] == 81.9, f"Expected Peso value=81.9, got {peso['value']}"
    assert "delta" in peso, "Peso missing delta field"
    assert "history" in peso, "Peso missing history field"
    assert len(peso["history"]) > 0, "Peso history should not be empty"


# ============ Test 6: Leagues Multiplayer ============
def test_leagues_list():
    r = requests.get(f"{BASE_URL}/leagues")
    assert_status(r)
    leagues = r.json()
    assert len(leagues) == 4, f"Expected 4 leagues, got {len(leagues)}"
    
    # Check lg1 is joined
    lg1 = next((lg for lg in leagues if lg["id"] == "lg1"), None)
    assert lg1 is not None, "League lg1 not found"
    assert lg1["joined"] is True, f"Expected lg1 joined=true, got {lg1['joined']}"


def test_league_detail():
    r = requests.get(f"{BASE_URL}/leagues/lg1")
    assert_status(r)
    league = r.json()
    assert_keys(league, ["id", "name", "gym"])
    assert league["id"] == "lg1", f"Expected id=lg1, got {league['id']}"


def test_league_ranking_workouts_weekly():
    r = requests.get(f"{BASE_URL}/leagues/lg1/ranking?metric=workouts&period=weekly")
    assert_status(r)
    data = r.json()
    assert_keys(data, ["metric", "period", "members"])
    assert data["metric"] == "workouts", f"Expected metric=workouts, got {data['metric']}"
    assert data["period"] == "weekly", f"Expected period=weekly, got {data['period']}"
    
    members = data["members"]
    assert len(members) > 0, "Expected at least 1 member"
    
    # Verify sorted descending by workouts_week
    for i in range(len(members) - 1):
        assert members[i]["workouts_week"] >= members[i + 1]["workouts_week"], \
            f"Members not sorted by workouts_week desc: {members[i]['workouts_week']} < {members[i + 1]['workouts_week']}"
    
    # Verify Rafael (is_me=true) is present
    rafael = next((m for m in members if m.get("is_me") is True), None)
    assert rafael is not None, "Current user (Rafael, is_me=true) not found in members"
    assert rafael["name"] == "Rafael Souza", f"Expected Rafael Souza, got {rafael['name']}"


def test_league_ranking_calories_monthly():
    r = requests.get(f"{BASE_URL}/leagues/lg1/ranking?metric=calories&period=monthly")
    assert_status(r)
    data = r.json()
    assert data["metric"] == "calories", f"Expected metric=calories, got {data['metric']}"
    assert data["period"] == "monthly", f"Expected period=monthly, got {data['period']}"
    
    members = data["members"]
    # Verify sorted descending by calories_month
    for i in range(len(members) - 1):
        assert members[i]["calories_month"] >= members[i + 1]["calories_month"], \
            f"Members not sorted by calories_month desc"
    
    # Verify Rafael is present
    rafael = next((m for m in members if m.get("is_me") is True), None)
    assert rafael is not None, "Current user not found in calories monthly ranking"


def test_league_ranking_streak():
    r = requests.get(f"{BASE_URL}/leagues/lg1/ranking?metric=streak")
    assert_status(r)
    data = r.json()
    assert data["metric"] == "streak", f"Expected metric=streak, got {data['metric']}"
    
    members = data["members"]
    # Verify sorted descending by streak
    for i in range(len(members) - 1):
        assert members[i]["streak"] >= members[i + 1]["streak"], \
            f"Members not sorted by streak desc"
    
    # Verify Rafael is present
    rafael = next((m for m in members if m.get("is_me") is True), None)
    assert rafael is not None, "Current user not found in streak ranking"


def test_league_create():
    r = requests.post(f"{BASE_URL}/leagues", json={"name": "Test Squad"})
    assert_status(r)
    league = r.json()
    assert_keys(league, ["id", "name", "joined"])
    assert league["name"] == "Test Squad", f"Expected name='Test Squad', got {league['name']}"
    assert league["joined"] is True, f"Expected joined=true for created league, got {league['joined']}"
    
    # Verify it appears in leagues list
    r2 = requests.get(f"{BASE_URL}/leagues")
    assert_status(r2)
    leagues = r2.json()
    found = any(lg["name"] == "Test Squad" for lg in leagues)
    assert found, "Created league 'Test Squad' not found in leagues list"


def test_league_join():
    # First check lg2 status
    r1 = requests.get(f"{BASE_URL}/leagues")
    assert_status(r1)
    leagues_before = r1.json()
    lg2_before = next((lg for lg in leagues_before if lg["id"] == "lg2"), None)
    assert lg2_before is not None, "League lg2 not found"
    members_before = lg2_before["members"]
    
    # Join lg2
    r2 = requests.post(f"{BASE_URL}/leagues/lg2/join")
    assert_status(r2)
    result = r2.json()
    assert result.get("ok") is True, f"Expected ok=true, got {result}"
    
    # Verify lg2 now shows joined=true
    r3 = requests.get(f"{BASE_URL}/leagues")
    assert_status(r3)
    leagues_after = r3.json()
    lg2_after = next((lg for lg in leagues_after if lg["id"] == "lg2"), None)
    assert lg2_after is not None, "League lg2 not found after join"
    assert lg2_after["joined"] is True, f"Expected lg2 joined=true after join, got {lg2_after['joined']}"
    
    # Verify members count increased (only if not already joined)
    if not result.get("already"):
        assert lg2_after["members"] == members_before + 1, \
            f"Expected members to increase by 1 (from {members_before} to {members_before + 1}), got {lg2_after['members']}"


# ============ Run All Tests ============
print("=" * 60)
print("BACKEND API TEST SUITE - Gym Personal App")
print("=" * 60)
print()

# Test 1: User & Profile
print("📋 Test Group 1: User & Profile Endpoints")
test("GET /api/user/me", test_user_me)
test("PUT /api/user/trainer-style", test_trainer_style_update)
test("GET /api/fitness-profile", test_fitness_profile_get)
test("PUT /api/fitness-profile (partial update)", test_fitness_profile_update)
test("GET /api/trainer-styles", test_trainer_styles)
print()

# Test 2: Dashboard
print("📊 Test Group 2: Dashboard, Challenges, Achievements")
test("GET /api/challenges", test_challenges)
test("GET /api/achievements", test_achievements)
test("GET /api/dashboard", test_dashboard)
print()

# Test 3: Workouts
print("💪 Test Group 3: Workout Endpoints")
test("GET /api/workout/today", test_workout_today)
test("GET /api/workout/plans", test_workout_plans)
test("POST /api/workout/complete", test_workout_complete)
test("POST /api/workout/performance", test_workout_performance)
print()

# Test 4: Exercises
print("🏋️ Test Group 4: Exercise Library")
test("GET /api/exercises (all)", test_exercises_all)
test("GET /api/exercises?muscle=Peito", test_exercises_filter_muscle)
test("GET /api/exercises?q=agacha", test_exercises_search)
print()

# Test 5: Progress
print("📈 Test Group 5: Progress Endpoints")
test("GET /api/progress", test_progress)
test("POST /api/measurements", test_measurements_post)
print()

# Test 6: Leagues
print("🏆 Test Group 6: Leagues Multiplayer")
test("GET /api/leagues", test_leagues_list)
test("GET /api/leagues/lg1", test_league_detail)
test("GET /api/leagues/lg1/ranking (workouts, weekly)", test_league_ranking_workouts_weekly)
test("GET /api/leagues/lg1/ranking (calories, monthly)", test_league_ranking_calories_monthly)
test("GET /api/leagues/lg1/ranking (streak)", test_league_ranking_streak)
test("POST /api/leagues (create)", test_league_create)
test("POST /api/leagues/lg2/join", test_league_join)
print()

# Summary
print("=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print(f"✅ Passed: {tests_passed}")
print(f"❌ Failed: {tests_failed}")
print(f"📊 Total:  {tests_passed + tests_failed}")
print()

if failures:
    print("FAILED TESTS:")
    for f in failures:
        print(f"  ❌ {f['test']}")
        print(f"     {f['error']}")
    print()

exit(0 if tests_failed == 0 else 1)
