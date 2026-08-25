import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Dumbbell } from "lucide-react";
import { Header } from "./Workout";
import api from "../api";

const MUSCLE_GROUPS = ["Todos", "Peito", "Costas", "Perna", "Ombro", "Braço", "Abdômen", "Cardio"];

export default function Library() {
  const nav = useNavigate();
  const [group, setGroup] = useState("Todos");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => { api.getExercises(group, q).then(setItems).catch(console.error); }, 250);
    return () => clearTimeout(t);
  }, [group, q]);

  const diffColor = { "Iniciante": "#39ff14", "Intermediário": "#f59e0b", "Avançado": "#ef4444" };

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title="BIBLIOTECA" onBack={() => nav("/")} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1c1c22", border: "1px solid var(--border)", borderRadius: 14, padding: "10px 14px", marginBottom: 14 }}>
        <Search size={18} color="var(--muted)" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exercício..." style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 14, outline: "none" }} />
      </div>

      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 2 }}>
        {MUSCLE_GROUPS.map((g) => (
          <button key={g} onClick={() => setGroup(g)} style={{ whiteSpace: "nowrap", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600, border: group === g ? "1px solid var(--neon)" : "1px solid var(--border)", background: group === g ? "rgba(124,92,255,0.16)" : "#141418", color: group === g ? "var(--neon)" : "var(--muted)" }}>{g}</button>
        ))}
      </div>

      <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{items.length} exercícios</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((e) => (
          <div key={e.id} className="card-surface" style={{ padding: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <img src={e.img} alt="" style={{ width: 58, height: 58, borderRadius: 12, objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>{e.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span className="font-mono-t" style={{ fontSize: 10, color: "var(--muted)" }}>{e.muscle} · {e.equipment}</span>
              </div>
              <span style={{ fontSize: 10, color: diffColor[e.difficulty], fontWeight: 600 }}>{e.difficulty}</span>
            </div>
            <button style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid rgba(124,92,255,0.4)", background: "rgba(124,92,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Plus size={20} className="neon-text" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <Dumbbell size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
            <div style={{ fontSize: 13 }}>Nenhum exercício encontrado</div>
          </div>
        )}
      </div>
    </div>
  );
}
