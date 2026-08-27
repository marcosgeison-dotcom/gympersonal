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
- `OPENROUTER_API_KEY` — **optional** external secret (platform-managed at `/run/base44/app.env`, listed in `.base44/environment.json`). Powers the AI coach chat and AI plan generation via `litellm` routed to **OpenRouter** (OpenAI-compatible). Without it, those two endpoints return 503 (the app boots fine). Default free model `nvidia/nemotron-3-ultra-550b-a55b:free`, override via `OPENROUTER_MODEL`. Note: OpenRouter free models can intermittently return 429/503 (upstream overloaded) — the plan endpoint retries succeed; treat transient failures as expected on the free tier.
- `OPENAI_API_KEY`, `EMERGENT_LLM_KEY` — legacy, no longer used by the app (kept only because they were set earlier). The app is now fully decoupled from Emergent's LLM gateway and from direct OpenAI billing.

## Quirks / gotchas
- `emergentintegrations==0.2.0` (in `backend/requirements.txt`) is a **platform-private** package not resolvable from PyPI here (its PyPI release is flagged malicious — do not install it). `backend/Dockerfile.base44` filters it out at install time. The app no longer imports it — AI now runs through `litellm` (installed from a direct wheel URL in requirements.txt, works offline).
- `litellm`, `openai`, `bcrypt`, `passlib` are all installed in the image.
- Frontend `REACT_APP_BACKEND_URL` is intentionally empty so the app calls `/api/*` (relative), proxied to the backend via `proxy` in `frontend/package.json`. Do not set it to an absolute URL — the session cookie is SameSite=None/Secure and the single-origin proxy is what makes auth work in the preview.
- `frontend/craco.config.js` sets `allowedHosts: "all"` + `host: 0.0.0.0` so the preview's changing external hostname is accepted by webpack-dev-server.
- Auth is **own email/password** (fully decoupled from Emergent OAuth). `POST /api/auth/register` and `POST /api/auth/login` create a session and set the `session_token` cookie (httpOnly, SameSite=None, 7-day). Passwords hashed with `bcrypt`. Most endpoints require this session (cookie or `Authorization: Bearer` header). `frontend/src/components/Login.jsx` is the email/password form (toggle Entrar/Cadastrar); `AuthCallback.jsx` is now dead/unused.

## Tests
- Backend tests (`backend/tests/`) use pytest-xdist (`-n 2 --dist loadscope`) per `backend/pytest.ini`. They insert test users directly into Mongo and hit the running backend.
