import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Crown, Users, Share2, Dumbbell, Flame, Zap } from "lucide-react";
import { Header } from "./Workout";
import { Loader } from "./Dashboard";
import api from "../api";

const METRICS = [
  { label: "Treinos", api: "workouts", icon: Dumbbell, color: "#7c5cff", unit: "" },
  { label: "Calorias", api: "calories", icon: Flame, color: "#f59e0b", unit: " kcal" },
  { label: "Streak", api: "streak", icon: Zap, color: "#39ff14", unit: "🔥" },
];
const PERIODS = [{ label: "Semanal", api: "weekly" }, { label: "Mensal", api: "monthly" }];

export default function LeagueDetail() {
  const nav = useNavigate();
  const { id } = useParams();
  const [league, setLeague] = useState(null);
  const [metric, setMetric] = useState(METRICS[0]);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [ranking, setRanking] = useState(null);

  useEffect(() => { api.getLeague(id).then(setLeague).catch(console.error); }, [id]);
  useEffect(() => { api.getRanking(id, metric.api, period.api).then(setRanking).catch(console.error); }, [id, metric, period]);

  if (!league || !ranking) return <div style={{ padding: 16 }}><Loader /></div>;

  const key = ranking.key;
  const members = ranking.members;
  const podium = members.slice(0, 3);
  const rest = members.slice(3);
  const MC = metric.color;
  const MI = metric.icon;
  const subFields = (m) => period.api === "monthly"
    ? `${m.workouts_month} treinos · ${m.calories_month.toLocaleString("pt-BR")} kcal · ${m.streak}🔥`
    : `${m.workouts_week} treinos · ${m.calories_week.toLocaleString("pt-BR")} kcal · ${m.streak}🔥`;

  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);
  const heights = { 0: 66, 1: 92, 2: 52 };
  const rankOf = (m) => podium.indexOf(m) + 1;

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title={(league.name || "LIGA").toUpperCase()} onBack={() => nav("/leagues")}
        right={<button style={{ background: "#1c1c22", border: "1px solid var(--border)", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Share2 size={18} color="#fff" /></button>} />

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, color: "var(--muted)", fontSize: 12 }}>
        <Users size={13} /> {league.members} membros · {league.gym}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {METRICS.map((m) => {
          const Ic = m.icon; const active = metric.label === m.label;
          return (
            <button key={m.label} onClick={() => setMetric(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", border: active ? `1px solid ${m.color}` : "1px solid var(--border)", background: active ? `${m.color}22` : "#141418", color: active ? m.color : "var(--muted)", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <Ic size={17} /> {m.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", background: "#141418", borderRadius: 12, padding: 4, marginBottom: 18, border: "1px solid var(--border)" }}>
        {PERIODS.map((p) => (
          <button key={p.label} onClick={() => setPeriod(p)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 13, background: period.label === p.label ? "linear-gradient(145deg,#7c5cff,#5b3ee0)" : "transparent", color: period.label === p.label ? "#fff" : "var(--muted)" }}>Ranking {p.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        {podiumOrder.map((m) => {
          const rank = rankOf(m);
          const h = heights[podiumOrder.indexOf(m)];
          const medal = ["#FFD700", "#C0C0C0", "#CD7F32"][rank - 1];
          return (
            <div key={m.id} style={{ flex: 1, maxWidth: 100, textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: 6 }}>
                {rank === 1 && <Crown size={18} color="#FFD700" style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)" }} />}
                <img src={m.avatar} alt="" style={{ width: rank === 1 ? 56 : 46, height: rank === 1 ? 56 : 46, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${medal}` }} />
              </div>
              <div className="font-display" style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name.split(" ")[0]}</div>
              <div className="font-display" style={{ color: MC, fontWeight: 700, fontSize: 15 }}>{m[key].toLocaleString("pt-BR")}{metric.unit}</div>
              <div style={{ height: h, background: `linear-gradient(180deg,${medal}55,${medal}18)`, borderRadius: "10px 10px 0 0", marginTop: 6, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6, border: `1px solid ${medal}44` }}>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 20, color: medal }}>{rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="term-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <MI size={13} color={MC} /> CLASSIFICAÇÃO · {metric.label.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rest.map((m, i) => {
          const rank = i + 4;
          return (
            <div key={m.id} className="card-surface" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 12, border: m.is_me ? `1px solid ${MC}` : "1px solid var(--border)", background: m.is_me ? `${MC}14` : "var(--surface)" }}>
              <span className="font-display" style={{ width: 22, fontWeight: 700, fontSize: 15, color: "var(--muted)" }}>{rank}</span>
              <img src={m.avatar} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                <div className="font-display" style={{ fontWeight: 600, fontSize: 14 }}>{m.name} {m.is_me && <span className="neon-text" style={{ fontSize: 11 }}>(você)</span>}</div>
                <div className="font-mono-t" style={{ fontSize: 10, color: "var(--muted)" }}>{subFields(m)}</div>
              </div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 16, color: MC }}>{m[key].toLocaleString("pt-BR")}{metric.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
