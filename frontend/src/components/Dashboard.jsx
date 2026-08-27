import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame, Clock, Dumbbell, ChevronRight, Sparkles, Activity, Play, BookOpen, Target, Loader2,
} from "lucide-react";

import api from "../api";

const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: "linear-gradient(145deg,#7c5cff,#5b3ee0)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(124,92,255,0.5)",
      }}>
        <Activity size={20} color="#fff" strokeWidth={2.6} />
      </div>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.02em" }}>
        GYM<span className="neon-text">PERSONAL</span>
      </div>
    </div>
  );
}

export function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 size={30} className="neon-text" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.getDashboard().then(setData).catch(console.error); }, []);
  if (!data) return <div style={{ padding: 16 }}><Loader /></div>;

  const { user, stats, daily_tip, today_workout, challenges, my_league } = data;
  const xpPct = Math.round((user.xp / user.xp_to_next) * 100);

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <Logo />
        <button onClick={() => nav("/profile")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
          <img src={user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover", border: "2px solid rgba(124,92,255,0.6)" }} />
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="term-label">// TERMINAL DE DADOS · {user.gym}</div>
        <h1 className="font-display" style={{ fontSize: 26, margin: "4px 0 0", fontWeight: 700 }}>
          Olá, {user.name.split(" ")[0]} <span style={{ color: "var(--amber)" }}>👋</span>
        </h1>
      </div>

      {/* XP / Level */}
      <div className="card-surface" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(124,92,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="font-display neon-text" style={{ fontWeight: 700, fontSize: 15 }}>{user.level}</span>
            </div>
            <div><div className="term-label">NÍVEL</div><div className="font-display" style={{ fontWeight: 600, fontSize: 14 }}>Atleta Elite</div></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="term-label">COMBO</div>
            <div className="font-display" style={{ color: "var(--amber)", fontWeight: 700, fontSize: 16 }}>x{user.combo_multiplier}</div>
          </div>
        </div>
        <div style={{ height: 8, background: "#232329", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ width: `${xpPct}%`, height: "100%", borderRadius: 10, background: "linear-gradient(90deg,#7c5cff,#a48bff)", boxShadow: "0 0 12px rgba(124,92,255,0.7)" }} />
        </div>
        <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          {user.xp} / {user.xp_to_next} XP · faltam {user.xp_to_next - user.xp} para o nível {user.level + 1}
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        <StatCell icon={Dumbbell} color="#7c5cff" value={stats.workouts_this_week} label="Treinos" sub={`/ ${stats.weekly_goal}`} />
        <StatCell icon={Flame} color="#f59e0b" value={(stats.calories_week / 1000).toFixed(1) + "k"} label="Kcal" sub="semana" />
        <StatCell icon={Clock} color="#22d3ee" value={stats.time_week.split(" ")[0]} label="Tempo" sub={stats.time_week.split(" ")[1]} />
      </div>

      <div className="card-surface" style={{ padding: 14, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Flame size={26} color="#f59e0b" fill="#f59e0b" />
          <div><div className="font-display" style={{ fontWeight: 700, fontSize: 20, lineHeight: 1 }}>{stats.streak} dias</div><div className="term-label">STREAK ATIVO</div></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {stats.weekly_days.map((d, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: d ? "linear-gradient(145deg,#7c5cff,#5b3ee0)" : "#232329", boxShadow: d ? "0 0 10px rgba(124,92,255,0.5)" : "none" }} />
              <div className="font-mono-t" style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>{DAYS[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* streak at risk alert */}
      {stats.streak_at_risk && (
        <div data-testid="streak-alert" className="card-surface animate-slide-up" style={{ padding: 14, marginBottom: 14, border: "1px solid rgba(245,158,11,0.5)", background: "linear-gradient(145deg,#1a1410,#141418)", display: "flex", alignItems: "center", gap: 12 }}>
          <Flame size={28} color="#f59e0b" fill="#f59e0b" className="live-dot" />
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 14, color: "#f59e0b" }}>Seu streak de {stats.streak} dias está em risco!</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Treine hoje para não perder a sequência. Você consegue! 💪</div>
          </div>
          <button data-testid="streak-alert-train-btn" onClick={() => nav("/workout")} style={{ padding: "9px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#f59e0b,#d97706)", color: "#0a0a0c", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>Treinar</button>
        </div>
      )}

      {/* today workout */}
      <SectionTitle title="TREINO DO DIA" onMore={() => nav("/workout")} />
      <button onClick={() => nav("/workout")} className="card-surface" style={{ width: "100%", textAlign: "left", padding: 0, marginBottom: 16, cursor: "pointer", overflow: "hidden", border: "1px solid rgba(124,92,255,0.4)" }}>
        <div style={{ position: "relative", height: 120 }}>
          <img src={today_workout.exercises[0].img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,20,24,0.2), #141418)" }} />
          <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
            <div className="term-label neon-text">{today_workout.day}</div>
            <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{today_workout.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{today_workout.focus}</div>
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, width: 44, height: 44, borderRadius: 14, background: "rgba(124,92,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(124,92,255,0.6)" }}>
            <Play size={20} color="#fff" fill="#fff" />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontSize: 12, color: "var(--muted)" }}>
          <span>{today_workout.exercises.length} exercícios</span>
          <span>{today_workout.duration}</span>
          <span>Vol. {today_workout.total_volume}</span>
        </div>
      </button>

      {/* daily tip */}
      <div className="card-surface" style={{ padding: 16, marginBottom: 16, background: "linear-gradient(145deg,#1a1710,#141418)", border: "1px solid rgba(245,158,11,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Sparkles size={16} color="#f59e0b" />
          <span className="term-label" style={{ color: "#f59e0b" }}>{daily_tip.title} · {daily_tip.tag}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#e5e5e5" }}>{daily_tip.text}</p>
      </div>

      {/* trainer chat */}
      <button onClick={() => nav("/chat")} className="card-surface" style={{ width: "100%", textAlign: "left", padding: 16, marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(124,92,255,0.3)" }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Activity size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>Seu Treinador IA</div>
          <div className="term-label neon-text live-dot">[ TOQUE PARA CONVERSAR ]</div>
        </div>
        <ChevronRight size={20} color="var(--muted)" />
      </button>

      {/* missions */}
      <SectionTitle title="MISSÕES ATIVAS" icon={Target} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {challenges.map((c) => {
          const pct = Math.min(100, Math.round((c.progress / c.total) * 100));
          return (
            <div key={c.id} className="card-surface" style={{ padding: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</span>
                <span className="font-mono-t" style={{ fontSize: 11, color: c.color }}>{c.reward}</span>
              </div>
              <div style={{ height: 6, background: "#232329", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 6, boxShadow: `0 0 8px ${c.color}88` }} />
              </div>
              <div className="font-mono-t" style={{ fontSize: 10, color: "var(--muted)", marginTop: 5 }}>{c.progress.toLocaleString("pt-BR")} / {c.total.toLocaleString("pt-BR")} · {pct}%</div>
            </div>
          );
        })}
      </div>

      {/* league */}
      {my_league && (
        <>
          <SectionTitle title="MINHA LIGA" onMore={() => nav("/leagues")} />
          <button onClick={() => nav(`/league/${my_league.id}`)} className="card-surface" style={{ width: "100%", textAlign: "left", padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 26 }}>{my_league.emoji}</div>
            <div style={{ flex: 1 }}>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>{my_league.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{my_league.members} membros · {my_league.gym}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="term-label">RANK</div>
              <div className="font-display neon-text" style={{ fontWeight: 700, fontSize: 20 }}>#{my_league.my_rank}</div>
            </div>
          </button>
        </>
      )}

      <button onClick={() => nav("/library")} className="card-surface" style={{ width: "100%", textAlign: "left", padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <BookOpen size={22} color="var(--cyan)" />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Biblioteca de Exercícios</span>
        <ChevronRight size={20} color="var(--muted)" />
      </button>
    </div>
  );
}

function StatCell({ icon: Icon, color, value, label, sub }) {
  return (
    <div className="card-surface" style={{ padding: "12px 10px", textAlign: "center" }}>
      <Icon size={18} color={color} style={{ marginBottom: 4 }} />
      <div className="font-display" style={{ fontWeight: 700, fontSize: 20, lineHeight: 1 }}>{value}</div>
      <div className="term-label" style={{ marginTop: 3 }}>{label}</div>
      <div className="font-mono-t" style={{ fontSize: 9, color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

function SectionTitle({ title, onMore, icon: Icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={14} className="neon-text" />}
        <span className="term-label" style={{ fontSize: 11, color: "#c9c9d4" }}>{title}</span>
      </div>
      {onMore && (
        <button onClick={onMore} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
          <span className="term-label neon-text">VER TUDO</span>
          <ChevronRight size={13} className="neon-text" />
        </button>
      )}
    </div>
  );
}
