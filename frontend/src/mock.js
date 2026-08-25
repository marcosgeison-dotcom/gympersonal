// ============================================================
// MOCK DATA for Gym Personal App (frontend-only teaser)
// Later replaced by real backend per contracts.md
// ============================================================

export const USER = {
  id: "u_001",
  name: "Rafael Souza",
  handle: "@rafa.souza",
  email: "rafael@gymapp.io",
  avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop",
  gym: "IronCore Academia",
  level: 12,
  xp: 4820,
  xpToNext: 6000,
  comboMultiplier: 2.4,
  streak: 17,
  joinedAt: "Jan 2025",
  neonColor: "#7c5cff",
};

export const FITNESS_PROFILE = {
  height: 178,
  weight: 82.4,
  bodyFat: 15.2,
  waist: 84,
  goal: "Ganho de massa muscular",
  level: "Intermediário",
  place: "Academia",
  equipment: ["Halteres", "Barra", "Máquinas", "Cabos"],
};

export const DASHBOARD_STATS = {
  workoutsThisWeek: 4,
  weeklyGoal: 5,
  caloriesWeek: 3820,
  timeWeek: "3h 42m",
  streak: 17,
  weeklyDays: [true, true, false, true, true, false, false], // Mon..Sun
};

export const DAILY_TIP = {
  title: "DICA DE OURO",
  text: "Priorize a fase excêntrica (descida) por 2-3 segundos em cada repetição. Isso aumenta o tempo sob tensão e potencializa a hipertrofia sem precisar de mais carga.",
  tag: "TÉCNICA",
};

export const TODAY_WORKOUT = {
  name: "Peito & Tríceps",
  focus: "Hipertrofia · Push Day",
  day: "Dia 24 de 60",
  duration: "~55 min",
  totalVolume: "7.4 ton",
  exercises: [
    { id: "e1", name: "Supino Reto com Barra", muscle: "Peito", sets: 4, reps: "8-10", weight: 70, done: false, img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop" },
    { id: "e2", name: "Supino Inclinado Halteres", muscle: "Peito Superior", sets: 3, reps: "10-12", weight: 28, done: false, img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop" },
    { id: "e3", name: "Crucifixo na Máquina", muscle: "Peito", sets: 3, reps: "12-15", weight: 45, done: false, img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop" },
    { id: "e4", name: "Tríceps na Polia", muscle: "Tríceps", sets: 4, reps: "10-12", weight: 32, done: false, img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop" },
    { id: "e5", name: "Tríceps Francês", muscle: "Tríceps", sets: 3, reps: "10-12", weight: 22, done: false, img: "https://images.unsplash.com/photo-1591940765400-16b3b7c33d3e?w=400&h=300&fit=crop" },
  ],
};

export const WORKOUT_PLANS = [
  { id: "p1", name: "Push Pull Legs", days: 6, focus: "Hipertrofia", active: true, progress: 40 },
  { id: "p2", name: "Full Body Iniciante", days: 3, focus: "Adaptação", active: false, progress: 100 },
  { id: "p3", name: "Upper / Lower", days: 4, focus: "Força", active: false, progress: 0 },
];

export const ACHIEVEMENTS = [
  { id: "a1", name: "Primeira Semana", icon: "flame", unlocked: true, color: "#f59e0b" },
  { id: "a2", name: "Streak de 15 dias", icon: "zap", unlocked: true, color: "#7c5cff" },
  { id: "a3", name: "100 Treinos", icon: "trophy", unlocked: true, color: "#22d3ee" },
  { id: "a4", name: "Rei do Supino", icon: "dumbbell", unlocked: false, color: "#6b7280" },
  { id: "a5", name: "Combo x5", icon: "flame", unlocked: false, color: "#6b7280" },
  { id: "a6", name: "Maratona 60 dias", icon: "medal", unlocked: false, color: "#6b7280" },
];

export const CHALLENGES = [
  { id: "c1", title: "Complete 5 treinos esta semana", reward: "+250 XP", progress: 4, total: 5, color: "#7c5cff" },
  { id: "c2", title: "Queime 4000 kcal", reward: "+180 XP", progress: 3820, total: 4000, color: "#22d3ee" },
  { id: "c3", title: "Streak de 20 dias", reward: "Badge Épico", progress: 17, total: 20, color: "#f59e0b" },
  { id: "c4", title: "Registre 3 medidas", reward: "+120 XP", progress: 1, total: 3, color: "#39ff14" },
];

// ---- Progress ----
export const MEASUREMENTS = [
  { label: "Peso", value: 82.4, unit: "kg", delta: -0.6, history: [84, 83.6, 83.1, 82.9, 82.4] },
  { label: "Gordura", value: 15.2, unit: "%", delta: -1.1, history: [17.4, 16.8, 16.1, 15.6, 15.2] },
  { label: "Cintura", value: 84, unit: "cm", delta: -2, history: [88, 87, 86, 85, 84] },
  { label: "Braço", value: 39.5, unit: "cm", delta: +0.8, history: [37.5, 38, 38.4, 39, 39.5] },
];

export const ONE_RM = [
  { exercise: "Supino Reto", value: 92, delta: +4, unit: "kg" },
  { exercise: "Agachamento", value: 128, delta: +8, unit: "kg" },
  { exercise: "Levantamento Terra", value: 150, delta: +6, unit: "kg" },
  { exercise: "Desenvolvimento", value: 58, delta: +2, unit: "kg" },
];

export const PLATEAUS = [
  { exercise: "Rosca Direta", weeks: 4, weight: 20, note: "Sem progressão há 4 semanas" },
  { exercise: "Elevação Lateral", weeks: 3, weight: 12, note: "Considere drop-set" },
];

export const VOLUME_HISTORY = [
  { week: "S1", volume: 18.2 },
  { week: "S2", volume: 21.5 },
  { week: "S3", volume: 20.1 },
  { week: "S4", volume: 24.8 },
  { week: "S5", volume: 26.3 },
  { week: "S6", volume: 29.0 },
];

// ---- Exercise Library ----
export const MUSCLE_GROUPS = ["Todos", "Peito", "Costas", "Perna", "Ombro", "Braço", "Abdômen", "Cardio"];
export const EXERCISE_LIBRARY = [
  { id: "l1", name: "Supino Reto", muscle: "Peito", equipment: "Barra", difficulty: "Intermediário", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop" },
  { id: "l2", name: "Agachamento Livre", muscle: "Perna", equipment: "Barra", difficulty: "Avançado", img: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop" },
  { id: "l3", name: "Puxada Frontal", muscle: "Costas", equipment: "Máquina", difficulty: "Iniciante", img: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400&h=300&fit=crop" },
  { id: "l4", name: "Desenvolvimento Militar", muscle: "Ombro", equipment: "Halteres", difficulty: "Intermediário", img: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop" },
  { id: "l5", name: "Rosca Direta", muscle: "Braço", equipment: "Barra", difficulty: "Iniciante", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop" },
  { id: "l6", name: "Levantamento Terra", muscle: "Costas", equipment: "Barra", difficulty: "Avançado", img: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=300&fit=crop" },
  { id: "l7", name: "Leg Press", muscle: "Perna", equipment: "Máquina", difficulty: "Iniciante", img: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400&h=300&fit=crop" },
  { id: "l8", name: "Prancha Abdominal", muscle: "Abdômen", equipment: "Peso Corporal", difficulty: "Iniciante", img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop" },
  { id: "l9", name: "Corrida Intervalada", muscle: "Cardio", equipment: "Esteira", difficulty: "Intermediário", img: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&h=300&fit=crop" },
  { id: "l10", name: "Elevação Lateral", muscle: "Ombro", equipment: "Halteres", difficulty: "Iniciante", img: "https://images.unsplash.com/photo-1591940765400-16b3b7c33d3e?w=400&h=300&fit=crop" },
];

// ---- Trainer Styles (Consultants) ----
export const TRAINER_STYLES = [
  { id: "t1", name: "O Motivador", desc: "Energia máxima, cheio de incentivo e emojis de força.", accent: "#f59e0b", tag: "HYPE" },
  { id: "t2", name: "O Científico", desc: "Baseado em evidências, explica o porquê de cada série.", accent: "#22d3ee", tag: "DADOS" },
  { id: "t3", name: "O Durão", desc: "Sem desculpas. Direto ao ponto e exigente.", accent: "#ef4444", tag: "HARD" },
  { id: "t4", name: "O Equilibrado", desc: "Foco em bem-estar, técnica e progressão saudável.", accent: "#39ff14", tag: "ZEN" },
];

// ---- Chat ----
export const CHAT_SUGGESTIONS = [
  "Como melhorar meu supino?",
  "Como aquecer antes do treino?",
  "Substitutos para agachamento?",
  "O que comer antes do treino?",
  "Posso treinar com dor muscular?",
];

export const CHAT_HISTORY = [
  { id: "m1", role: "trainer", text: "Fala, Rafael! 💪 Bora pro treino de hoje. Como está sua energia?" },
  { id: "m2", role: "user", text: "Tô com energia boa! Mas meu ombro incomodou no supino ontem." },
  { id: "m3", role: "trainer", text: "Boa observação. Vamos reduzir a amplitude no supino e priorizar aquecimento de manguito rotador. Quer que eu ajuste o treino de hoje?" },
];

// AI trainer canned responses (MOCK — sem IA real ainda)
export const MOCK_AI_REPLIES = [
  "Ótima pergunta! Para progredir, foque em sobrecarga progressiva: aumente 2.5kg quando completar todas as séries com boa técnica. 📈",
  "Recomendo 5-10 min de aquecimento dinâmico + 1 série leve do exercício. Isso prepara articulações e melhora a performance.",
  "Substitutos válidos: leg press, hack squat ou agachamento búlgaro. Todos trabalham quadríceps e glúteos com menor exigência lombar.",
  "Priorize carboidratos de rápida absorção 30-45 min antes (banana, aveia). Isso garante energia para o treino todo.",
  "Dor muscular leve (DOMS) é normal — pode treinar. Se for dor articular ou aguda, descanse e ajustamos a carga. 🧠",
];

// ---- LEAGUES (multiplayer, por academia) ----
export const LEAGUE_METRICS = ["Treinos", "Calorias", "Streak"];
export const LEAGUE_PERIODS = ["Semanal", "Mensal"];

export const MY_LEAGUE = {
  id: "lg1",
  name: "IronCore Warriors",
  gym: "IronCore Academia",
  members: 24,
  emoji: "🔥",
  neon: "#7c5cff",
  description: "Liga oficial da IronCore. Só vale suor de verdade!",
  myRank: 3,
};

export const LEAGUES = [
  { id: "lg1", name: "IronCore Warriors", gym: "IronCore Academia", members: 24, emoji: "🔥", neon: "#7c5cff", joined: true },
  { id: "lg2", name: "Beastmode Squad", gym: "IronCore Academia", members: 18, emoji: "🦍", neon: "#39ff14", joined: false },
  { id: "lg3", name: "Cardio Kings", gym: "IronCore Academia", members: 31, emoji: "⚡", neon: "#22d3ee", joined: false },
  { id: "lg4", name: "Sunrise Lifters", gym: "IronCore Academia", members: 12, emoji: "🌅", neon: "#f59e0b", joined: false },
];

// ranking per metric+period => list of members
const rk = (name, avatar, workouts, calories, streak, isMe = false) => ({ name, avatar, workouts, calories, streak, isMe });
export const LEAGUE_RANKING = {
  Semanal: [
    rk("Bruno Lima", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", 6, 5240, 21),
    rk("Carla Nunes", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", 6, 4980, 19),
    rk("Rafael Souza", "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", 4, 3820, 17, true),
    rk("Diego Alves", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", 4, 3610, 12),
    rk("Marina Reis", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop", 3, 3200, 9),
    rk("Thiago Melo", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", 3, 2900, 8),
    rk("Julia Costa", "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop", 2, 2100, 5),
  ],
  Mensal: [
    rk("Carla Nunes", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", 22, 19800, 19),
    rk("Rafael Souza", "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", 20, 18400, 17, true),
    rk("Bruno Lima", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", 19, 17600, 21),
    rk("Diego Alves", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", 16, 14200, 12),
    rk("Thiago Melo", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", 14, 12800, 8),
    rk("Marina Reis", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop", 12, 11500, 9),
    rk("Julia Costa", "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop", 9, 8200, 5),
  ],
};

export const metricKey = { Treinos: "workouts", Calorias: "calories", Streak: "streak" };
export const metricUnit = { Treinos: "", Calorias: " kcal", Streak: "🔥" };
