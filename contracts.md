# Contracts — Gym Personal App (Etapas 1 & 2)

Base: all routes prefixed `/api`. Frontend uses `REACT_APP_BACKEND_URL`.
Auth: SIMPLIFIED — single seeded demo user (`u_001`). Real Google login = Etapa 3.
DB seeded on startup from mock values (mirrors `mock.js` so UI stays identical).

## Endpoints
### User / Profile
- GET  /api/user/me → user object
- PUT  /api/user/trainer-style {style_id}
- GET  /api/fitness-profile
- PUT  /api/fitness-profile {height,weight,body_fat,waist,goal,level,place,equipment}

### Dashboard
- GET  /api/dashboard → {user, stats, daily_tip, today_workout(summary), challenges[3], my_league{...,my_rank}}

### Workout
- GET  /api/workout/today → today workout + exercises
- GET  /api/workout/plans
- POST /api/workout/complete → adds XP/stats, returns {xp_gained, stats}
- POST /api/workout/performance {exercise_id, sets:[{weight,reps}]}
- GET  /api/exercises?muscle=&q= → library
- GET  /api/challenges

### Progress
- GET  /api/progress → {measurements[], one_rm[], plateaus[], volume_history[]}
- POST /api/measurements {peso?,gordura?,cintura?,braco?} → updated measurements

### Leagues (multiplayer per gym)
- GET  /api/leagues → leagues in user's gym (with joined flag)
- POST /api/leagues {name} → create + join
- POST /api/leagues/{id}/join
- GET  /api/leagues/{id} → league detail
- GET  /api/leagues/{id}/ranking?metric=workouts|calories|streak&period=weekly|monthly

### Misc
- GET  /api/trainer-styles

## Frontend integration
- New `src/api.js` (axios wrappers).
- Components fetch via `useEffect`; keep `mock.js` only as fallback shapes.
- Replace: Dashboard, Workout, Progress, Leagues, LeagueDetail, Profile, Library.
- Chat stays MOCK (AI = Etapa 3).

## Mocked→Real mapping
mock.js constants → seeded Mongo collections. Chat MOCK_AI_REPLIES stays mocked.
