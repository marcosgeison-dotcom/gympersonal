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
- 2026-06 (esta sessão): Emergent Google Auth + isolamento multiusuário TESTADO e aprovado (23/23, /app/test_reports/iteration_1.json). Correções: /api/exercises agora exige auth; /api/auth/session normaliza erros de rede para 401.

## Backlog Priorizado
- P0 — Etapa 3: IA real via Emergent LLM Key. "Chat Treinador IA" e "Gerar plano com IA" são MOCK no frontend (Chat.jsx). Implementar endpoints LLM no backend (usar integration_expert + emergentintegrations; incluir session_id no chat multi-turno).
- P1 — Convites de liga: gerar link/código de convite para amigos entrarem na liga da academia.
- P2 — Melhorias apontadas pelo teste: dedup de user_sessions em logins repetidos; validar membership antes de expor ranking de liga; idempotência em /api/workout/complete.

## Notas Técnicas
- seed_global usa flag "v2" — ao alterar seeds globais, bump para v3.
- Teste de regressão de auth: /app/backend/tests/test_auth_and_isolation.py (auto-limpa).
- Google Auth é fluxo externo — não há senhas; testes simulam sessão inserindo docs em users + user_sessions e usando Bearer token.
