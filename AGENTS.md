# Base44 dev environment notes

## Stack
- **Backend**: FastAPI (`backend/server.py`) on port 8000, MongoDB via `motor`. Uvicorn `--reload` (bind-mounted source).
- **Frontend**: React 19 + CRA/craco (`frontend/`) on port 3000, dev server proxied to the backend (single origin — required for the httpOnly SameSite=None session cookie).
- **DB**: MongoDB 7 as a compose service (local infra creds inline in `docker-compose.base44.yml`).

## Run / verify
```bash
docker compose -f docker-compose.base44.yml up -d --build
curl -sf http://localhost:3000/            # frontend
curl -sf http://localhost:8000/api/trainer-styles   # backend (public)
```
CRA compile takes ~1-2 min on first boot (yarn install + webpack). Backend seeds global + per-user data on startup.

## Env / secrets
- `MONGO_URL`, `DB_NAME` — inline in compose (local infra).
- `EMERGENT_LLM_KEY` — **optional** external secret (platform-managed at `/run/base44/app.env`, listed in `.base44/environment.json`). Powers the AI coach chat and AI plan generation. Without it, those two endpoints return 503 (the app boots fine).

## Quirks / gotchas
- `emergentintegrations==0.2.0` (in `backend/requirements.txt`) is a **platform-private** package not resolvable from PyPI here. `backend/Dockerfile.base44` filters it out at install time; `server.py` imports it lazily (try/except → `None`) and the two AI endpoints degrade to HTTP 503 instead of crashing the server. Do NOT re-add it to the install set unless a resolvable source is available.
- `litellm` is installed from a direct wheel URL in requirements.txt — that works offline.
- Frontend `REACT_APP_BACKEND_URL` is intentionally empty so the app calls `/api/*` (relative), proxied to the backend via `proxy` in `frontend/package.json`. Do not set it to an absolute URL — the session cookie is SameSite=None/Secure and the single-origin proxy is what makes auth work in the preview.
- `frontend/craco.config.js` sets `allowedHosts: "all"` + `host: 0.0.0.0` so the preview's changing external hostname is accepted by webpack-dev-server.
- Auth is OAuth via `https://auth.emergentagent.com` (Login button). The session_id returned in the hash is exchanged at `POST /api/auth/session`, which sets the `session_token` cookie. Most endpoints require this session (Bearer header also accepted).

## Tests
- Backend tests (`backend/tests/`) use pytest-xdist (`-n 2 --dist loadscope`) per `backend/pytest.ini`. They insert test users directly into Mongo and hit the running backend.
