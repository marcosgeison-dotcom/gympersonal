import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, AlertTriangle, Plus, Ruler, Activity, X } from "lucide-react";
import { Header } from "./Workout";
import { MEASUREMENTS, ONE_RM, PLATEAUS, VOLUME_HISTORY } from "../mock";

function Spark({ data, color }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / range) * 24 - 2}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" style={{ width: 60, height: 28 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Progress() {
  const nav = useNavigate();
  const [modal, setModal] = useState(false);
  const maxVol = Math.max(...VOLUME_HISTORY.map((v) => v.volume));

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title="PROGRESSO" onBack={() => nav("/")}
        right={<button onClick={() => setModal(true)} style={{ background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", border: "none", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(124,92,255,0.4)" }}><Plus size={20} color="#fff" /></button>} />

      {/* measurements */}
      <div className="term-label" style={{ marginBottom: 10 }}>MEDIDAS CORPORAIS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {MEASUREMENTS.map((m) => {
          const up = m.delta > 0;
          const good = m.label === "Braço" ? up : !up;
          const c = good ? "#39ff14" : "#ef4444";
          return (
            <div key={m.label} className="card-surface" style={{ padding: 14 }}>
              <div className="term-label">{m.label}</div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 }}>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 22 }}>{m.value}<span style={{ fontSize: 12, color: "var(--muted)" }}> {m.unit}</span></div>
                <Spark data={m.history} color={c} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                {up ? <TrendingUp size={13} color={c} /> : <TrendingDown size={13} color={c} />}
                <span className="font-mono-t" style={{ fontSize: 11, color: c }}>{up ? "+" : ""}{m.delta} {m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* volume chart */}
      <div className="term-label" style={{ marginBottom: 10 }}>VOLUME SEMANAL (TON)</div>
      <div className="card-surface" style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 120, gap: 8 }}>
          {VOLUME_HISTORY.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div className="font-mono-t" style={{ fontSize: 9, color: "#c9c9d4" }}>{v.volume}</div>
              <div style={{
                width: "100%", height: `${(v.volume / maxVol) * 90}px`, borderRadius: 6,
                background: i === VOLUME_HISTORY.length - 1 ? "linear-gradient(180deg,#7c5cff,#5b3ee0)" : "#2a2a32",
                boxShadow: i === VOLUME_HISTORY.length - 1 ? "0 0 14px rgba(124,92,255,0.6)" : "none",
              }} />
              <div className="term-label" style={{ fontSize: 9 }}>{v.week}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 1RM */}
      <div className="term-label" style={{ marginBottom: 10 }}>1RM ESTIMADO</div>
      <div className="card-surface" style={{ padding: 6, marginBottom: 18 }}>
        {ONE_RM.map((r, i) => (
          <div key={r.exercise} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px", borderBottom: i < ONE_RM.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{r.exercise}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>{r.value} <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.unit}</span></span>
              <span className="font-mono-t" style={{ fontSize: 11, color: "#39ff14" }}>+{r.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* plateaus */}
      <div className="term-label" style={{ marginBottom: 10, color: "#f59e0b" }}>⚠ PLATÔS DETECTADOS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLATEAUS.map((p) => (
          <div key={p.exercise} className="card-surface" style={{ padding: 14, border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={22} color="#f59e0b" />
            <div style={{ flex: 1 }}>
              <div className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>{p.exercise}</div>
              <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)" }}>{p.note} · {p.weight}kg</div>
            </div>
            <span className="font-display" style={{ fontWeight: 700, color: "#f59e0b" }}>{p.weeks}sem</span>
          </div>
        ))}
      </div>

      {modal && (
        <div onClick={() => setModal(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} className="card-surface animate-slide-up" style={{ width: "100%", maxWidth: 360, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Ruler size={18} className="neon-text" /><span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Registrar Medidas</span></div>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="var(--muted)" /></button>
            </div>
            {["Peso (kg)", "Gordura (%)", "Cintura (cm)", "Braço (cm)"].map((f) => (
              <div key={f} style={{ marginBottom: 12 }}>
                <div className="term-label" style={{ marginBottom: 5 }}>{f}</div>
                <input type="number" placeholder="0" style={inp} />
              </div>
            ))}
            <button onClick={() => setModal(false)} style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", color: "#fff", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, marginTop: 4 }}>Salvar Medidas</button>
          </div>
        </div>
      )}
    </div>
  );
}

const overlay = { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16, zIndex: 60 };
const inp = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 15, outline: "none" };
