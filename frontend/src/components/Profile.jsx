import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, Award, ChevronRight, Ruler, Target, MapPin, Check, Palette, Dumbbell } from "lucide-react";
import { Flame, Zap, Trophy, Medal } from "lucide-react";
import { Header } from "./Workout";
import { USER, FITNESS_PROFILE, ACHIEVEMENTS, TRAINER_STYLES } from "../mock";

const ICONS = { flame: Flame, zap: Zap, trophy: Trophy, dumbbell: Dumbbell, medal: Medal };

export default function Profile() {
  const nav = useNavigate();
  const [style, setStyle] = useState("t1");
  const xpPct = Math.round((USER.xp / USER.xpToNext) * 100);

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title="PERFIL" onBack={() => nav("/")}
        right={<button style={{ background: "#1c1c22", border: "1px solid var(--border)", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={18} color="#fff" /></button>} />

      {/* profile card */}
      <div className="card-surface" style={{ padding: 20, textAlign: "center", marginBottom: 16, background: "linear-gradient(160deg,rgba(124,92,255,0.14),transparent)" }}>
        <img src={USER.avatar} alt="" style={{ width: 84, height: 84, borderRadius: 24, objectFit: "cover", border: "3px solid rgba(124,92,255,0.6)", marginBottom: 10 }} />
        <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{USER.name}</div>
        <div className="font-mono-t" style={{ fontSize: 12, color: "var(--muted)" }}>{USER.handle}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 6, fontSize: 12, color: "#c9c9d4" }}>
          <MapPin size={13} className="neon-text" /> {USER.gym}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 16 }}>
          <Stat v={USER.level} l="Nível" />
          <Stat v={USER.streak} l="Streak" />
          <Stat v={`x${USER.comboMultiplier}`} l="Combo" />
        </div>
        <div style={{ height: 8, background: "#232329", borderRadius: 8, overflow: "hidden", marginTop: 16 }}>
          <div style={{ width: `${xpPct}%`, height: "100%", background: "linear-gradient(90deg,#7c5cff,#a48bff)", borderRadius: 8, boxShadow: "0 0 12px rgba(124,92,255,0.7)" }} />
        </div>
        <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{USER.xp} / {USER.xpToNext} XP</div>
      </div>

      {/* fitness profile */}
      <div className="term-label" style={{ marginBottom: 10 }}>PERFIL FITNESS</div>
      <div className="card-surface" style={{ padding: 14, marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field icon={Ruler} label="Altura" value={`${FITNESS_PROFILE.height} cm`} />
          <Field icon={Dumbbell} label="Peso" value={`${FITNESS_PROFILE.weight} kg`} />
          <Field icon={Target} label="Gordura" value={`${FITNESS_PROFILE.bodyFat}%`} />
          <Field icon={Ruler} label="Cintura" value={`${FITNESS_PROFILE.waist} cm`} />
        </div>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12 }}>
          <Row label="Objetivo" value={FITNESS_PROFILE.goal} />
          <Row label="Nível" value={FITNESS_PROFILE.level} />
          <Row label="Local" value={FITNESS_PROFILE.place} />
        </div>
      </div>
      <button style={{ width: "100%", padding: "12px 0", borderRadius: 14, background: "#1c1c22", color: "#c9c9d4", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Atualizar Perfil Fitness</button>

      {/* trainer style */}
      <div className="term-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Palette size={13} className="neon-text" /> ESTILO DO TREINADOR</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {TRAINER_STYLES.map((t) => {
          const active = style === t.id;
          return (
            <button key={t.id} onClick={() => setStyle(t.id)} className="card-surface" style={{
              padding: 12, textAlign: "left", cursor: "pointer",
              border: active ? `1px solid ${t.accent}` : "1px solid var(--border)",
              background: active ? `${t.accent}14` : "var(--surface)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span className="term-label" style={{ color: t.accent }}>{t.tag}</span>
                {active && <Check size={15} color={t.accent} />}
              </div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4, marginTop: 3 }}>{t.desc}</div>
            </button>
          );
        })}
      </div>

      {/* achievements */}
      <div className="term-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Award size={13} className="neon-text" /> CONQUISTAS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {ACHIEVEMENTS.map((a) => {
          const Ic = ICONS[a.icon] || Trophy;
          return (
            <div key={a.id} className="card-surface" style={{ padding: 12, textAlign: "center", opacity: a.unlocked ? 1 : 0.4 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, margin: "0 auto 6px", background: `${a.color}22`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${a.color}55` }}>
                <Ic size={22} color={a.color} />
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1.2 }}>{a.name}</div>
            </div>
          );
        })}
      </div>

      <button style={{ width: "100%", padding: "13px 0", borderRadius: 14, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <LogOut size={18} /> Sair da Conta
      </button>
    </div>
  );
}

function Stat({ v, l }) {
  return (
    <div>
      <div className="font-display neon-text" style={{ fontWeight: 700, fontSize: 22 }}>{v}</div>
      <div className="term-label">{l}</div>
    </div>
  );
}
function Field({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#1c1c22", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={16} className="neon-text" /></div>
      <div>
        <div className="term-label">{label}</div>
        <div className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>{value}</div>
      </div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
