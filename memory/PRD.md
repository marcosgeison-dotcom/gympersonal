# Gym Personal App — PRD

## Problema Original
Recriar o app "Gym Personal" a partir de APK anexado. Clone pixel-perfect com estética cyberpunk/neon "data terminal" (fundo #0f0f0f, acento indigo #6366f1). Idioma do usuário: PT-BR (sempre responder em português).

## Requisitos do Produto
- Ligas multiplayer por academia: competição por nº de treinos, calorias e streak diário; rankings semanal e mensal.
- Telas: Dashboard, Treino (log de séries/reps), Progresso (medidas, 1RM, platôs, volume), Perfil, Chat Treinador IA, Biblioteca de Exercícios.
- Login com Google (Emergent Auth) para cada aluno ter seus próprios dados e ligas.
- UI: frame mobile no desktop, tema dark cyberpunk — não quebrar esse estilo.

## Arquitetura
- Frontend: React + Tailwind + shadcn/ui, Context API (`AuthContext.jsx`), axios com withCredentials (`src/api.js`).
- Backend: FastAPI + Motor/MongoDB, tudo em `/app/backend/server.py` (~543 linhas).
- Auth: Emergent Google Auth — POST /api/auth/session (troca session_id → cookie httpOnly + Bearer), /api/auth/me, /api/auth/logout. Todos os endpoints protegidos e escopados por user_id. Novos usuários recebem seed starter e entram na liga lg1.
- DB: users, user_sessions, fitness_profiles, dashboard_stats, workouts, measurements, leagues, league_members, exercises (global), trainer_styles, daily_tips.

## Implementado (histórico)
- 2026-06: Etapas 1&2 — backend completo (user/profile, dashboard, workouts, progresso, ligas com ranking metric=workouts|calories|streak, period=weekly|monthly). Testado 24/24.
- 2026-06: Integração frontend↔backend de todas as telas (exceto Chat IA = mock).
- 2026-06: Emergent Google Auth + isolamento multiusuário TESTADO (23/23, iteration_1.json).
- 2026-06 (custo aprovado 40 créditos): Revisão geral + IA real + extras — TESTADO 100% (iteration_2.json: backend 10/10 + regressão 23/23, frontend 15/15):
  - Treinador IA real: POST /api/chat (GPT-5.5 streaming via Emergent LLM Key, histórico em chat_messages, personalidade = trainer_style), GET /api/chat/history.
  - Geração de plano IA real: POST /api/workout/generate-plan (JSON → substitui today_workout + cria plano ativo).
  - Funções reativadas: Treino Emergencial (GET /api/workout/emergency), Ativar plano (POST /api/workout/plans/{id}/activate), Atualizar Perfil Fitness + botão settings (modal), streak real no workout/complete (incrementa/reseta, weekly_days, challenges c1-c3, conquistas a1-a3), guard anti duplo-clique 60s.
  - Convites de liga: GET /api/leagues/{id}/invite (código 6 chars), POST /api/leagues/join-by-code; modal com copiar/compartilhar/entrar com código.
  - Alerta de streak: dashboard retorna streak_at_risk; banner motivacional com botão Treinar.
  - Compartilhar Conquista: card PNG neon gerado via canvas (ShareCard.jsx), navigator.share + fallback download.
  - Splash screen só com a logo (1.8s).
  - Avaliação Profissional no 1º login (3 passos): baseline de medidas, weekly_goal, challenge c1 parametrizado, conquista "Avaliação Pro"; gate em App.js via user.assessment_done.

## Backlog Priorizado
- P1 — Notificações push/lembretes de treino (streak alert já existe in-app).
- P2 — Melhorias: rotação/expiração de código de convite; arquivar planos IA antigos; dedup de user_sessions; refatorar server.py (~800 linhas) em módulos; Chat: structured output p/ generate-plan.

## Notas Técnicas
- seed_global usa flag "v2" — ao alterar seeds globais, bump para v3.
- Testes de regressão: /app/backend/tests/test_auth_and_isolation.py (23) e /app/backend/tests/test_new_features.py (10); seed frontend: /app/tests/seed_frontend_user.py (cookie session_token no Playwright).
- Google Auth é fluxo externo — sem senhas; EMERGENT_LLM_KEY em backend/.env.
