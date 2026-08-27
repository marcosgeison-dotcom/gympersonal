# Auth Testing Playbook (Emergent Google Auth)

Multi-user app. Session via httpOnly cookie `session_token` (also accepts Authorization: Bearer).
Collections: `users` (field `user_id`), `user_sessions` (`user_id`, `session_token`, `expires_at`).
All per-user data scoped by `user_id`. Global data: leagues, exercises, trainer_styles, daily_tips, bot league_members.

## Create Test User & Session (mongosh)
```
use('test_database'); // DB_NAME from backend/.env
var userId = 'test-user-' + Date.now();
var token = 'test_session_' + Date.now();
db.users.insertOne({ user_id:userId, email:'t'+Date.now()+'@ex.com', name:'Test User', picture:'https://via.placeholder.com/150', gym:'IronCore Academia', level:1, xp:0, xp_to_next:1000, combo_multiplier:1.0, streak:0, handle:'@test', avatar:'https://via.placeholder.com/150', joined_at:'2025', neon_color:'#7c5cff', trainer_style:'t1', created_at:new Date() });
db.user_sessions.insertOne({ user_id:userId, session_token:token, expires_at:new Date(Date.now()+7*24*3600*1000), created_at:new Date() });
print('token='+token);
```
NOTE: New real users get personal starter data auto-seeded on first /api/auth/session. Test users created directly won't have per-user seed unless you call the seeding or test read endpoints tolerate empties.

## Backend checks
- GET /api/auth/me with Authorization: Bearer <token> → user data (200), invalid → 401
- GET /api/dashboard, /api/progress, /api/leagues with Bearer token → scoped to that user

## Browser
Set cookie session_token (httpOnly, secure, sameSite None) on app domain, load app → dashboard (not login).

## Key rules
- Callback detection uses useLocation().hash
- All Mongo queries exclude _id
- Endpoints use user_id from session, never a hardcoded id
