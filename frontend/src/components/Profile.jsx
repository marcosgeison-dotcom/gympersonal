import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, Award, Ruler, Target, MapPin, Check, Palette, Dumbbell, X, Loader2 } from "lucide-react";
import { Flame, Zap, Trophy, Medal } from "lucide-react";
import { Header } from "./Workout";
import { Loader } from "./Dashboard";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const ICONS = { flame: Flame, zap: Zap, trophy: Trophy, dumbbell: Dumbbell, medal: Medal, target: Target };

export default function Profile() {
  const nav = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [styles, setStyles] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [style, setStyle] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setEditOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    api.getUser().then((u) => { setUser(u); setStyle(u.trainer_style); });
    api.getProfile().then(setProfile);
    api.getTrainerStyles().then(setStyles);
    api.getAchievements().then(setAchievements);
  }, []);

  if (!user || !profile) return <div style={{ padding: 16 }}><Loader /></div>;

  const xpPct = Math.round((user.xp / user.xp_to_next) * 100);
  const pickStyle = (id) => { setStyle(id); api.setTrainerStyle(id).catch(console.error); };

  const openEdit = () => {
    setForm({ weight: profile.weight, height: profile.height, body_fat: profile.body_fat, waist: profile.waist, goal: profile.goal });
    setEditOpen(true);
  };
  const saveProfile = async () => {
    setSaving(true);
    try {
      const p = await api.updateProfile({
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        body_fat: form.body_fat ? parseFloat(form.body_fat) : null,
        waist: form.waist ? parseFloat(form.waist) : null,
        goal: form.goal || null,
      });
      setProfile(p);
      setEditOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title="PERFIL" onBack={() => nav("/")}
        right={<button data-testid="settings-btn" onClick={openEdit} style={{ background: "#1c1c22", border: "1px solid var(--border)", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Settings size={18} color="#fff" /></button>} />

      <div className="card-surface" style={{ padding: 20, textAlign: "center", marginBottom: 16, background: "linear-gradient(160deg,rgba(124,92,255,0.14),transparent)" }}>
        <img src={user.avatar} alt="" style={{ width: 84, height: 84, borderRadius: 24, objectFit: "cover", border: "3px solid rgba(124,92,255,0.6)", marginBottom: 10 }} />
        <div className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
        <div className="font-mono-t" style={{ fontSize: 12, color: "var(--muted)" }}>{user.handle}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 6, fontSize: 12, color: "#c9c9d4" }}>
          <MapPin size={13} className="neon-text" /> {user.gym}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 16 }}>
          <Stat v={user.level} l="Nível" />
          <Stat v={user.streak} l="Streak" />
          <Stat v={`x${user.combo_multiplier}`} l="Combo" />
        </div>
        <div style={{ height: 8, background: "#232329", borderRadius: 8, overflow: "hidden", marginTop: 16 }}>
          <div style={{ width: `${xpPct}%`, height: "100%", background: "linear-gradient(90deg,#7c5cff,#a48bff)", borderRadius: 8, boxShadow: "0 0 12px rgba(124,92,255,0.7)" }} />
        </div>
        <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{user.xp} / {user.xp_to_next} XP</div>
      </div>

      <div className="term-label" style={{ marginBottom: 10 }}>PERFIL FITNESS</div>
      <div className="card-surface" style={{ padding: 14, marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field icon={Ruler} label="Altura" value={`${profile.height} cm`} />
          <Field icon={Dumbbell} label="Peso" value={`${profile.weight} kg`} />
          <Field icon={Target} label="Gordura" value={`${profile.body_fat}%`} />
          <Field icon={Ruler} label="Cintura" value={`${profile.waist} cm`} />
        </div>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12 }}>
          <Row label="Objetivo" value={profile.goal} />
          <Row label="Nível" value={profile.level} />
          <Row label="Local" value={profile.place} />
        </div>
      </div>
      <button data-testid="edit-profile-btn" onClick={openEdit} style={{ width: "100%", padding: "12px 0", borderRadius: 14, background: "#1c1c22", color: "#c9c9d4", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, marginBottom: 18 }}>Atualizar Perfil Fitness</button>

      <div className="term-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Palette size={13} className="neon-text" /> ESTILO DO TREINADOR</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {styles.map((t) => {
          const active = style === t.id;
          return (
            <button key={t.id} onClick={() => pickStyle(t.id)} className="card-surface" style={{ padding: 12, textAlign: "left", cursor: "pointer", border: active ? `1px solid ${t.accent}` : "1px solid var(--border)", background: active ? `${t.accent}14` : "var(--surface)" }}>
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

      <div className="term-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Award size={13} className="neon-text" /> CONQUISTAS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
        {achievements.map((a) => {
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

      <button onClick={logout} style={{ width: "100%", padding: "13px 0", borderRadius: 14, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <LogOut size={18} /> Sair da Conta
      </button>

      {editOpen && (
        <div onClick={() => setEditOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16, zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} className="card-surface animate-slide-up" data-testid="edit-profile-modal" style={{ width: "100%", maxWidth: 360, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Ruler size={18} className="neon-text" /><span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Atualizar Perfil Fitness</span></div>
              <button onClick={() => setEditOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="var(--muted)" /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <EditNum label="PESO (KG)" v={form.weight} onC={(v) => setForm({ ...form, weight: v })} tid="edit-weight-input" />
              <EditNum label="ALTURA (CM)" v={form.height} onC={(v) => setForm({ ...form, height: v })} tid="edit-height-input" />
              <EditNum label="GORDURA (%)" v={form.body_fat} onC={(v) => setForm({ ...form, body_fat: v })} tid="edit-bodyfat-input" />
              <EditNum label="CINTURA (CM)" v={form.waist} onC={(v) => setForm({ ...form, waist: v })} tid="edit-waist-input" />
            </div>
            <div className="term-label" style={{ marginBottom: 5 }}>OBJETIVO</div>
            <input data-testid="edit-goal-input" value={form.goal || ""} onChange={(e) => setForm({ ...form, goal: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 14, outline: "none", marginBottom: 14 }} />
            <button data-testid="save-profile-btn" onClick={saveProfile} disabled={saving} style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", color: "#fff", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {saving ? <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={17} />} Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditNum({ label, v, onC, tid }) {
  return (
    <div>
      <div className="term-label" style={{ marginBottom: 4, fontSize: 9 }}>{label}</div>
      <input data-testid={tid} type="number" inputMode="decimal" value={v ?? ""} onChange={(e) => onC(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 15, outline: "none" }} />
    </div>
  );
}

function Stat({ v, l }) {
  return <div><div className="font-display neon-text" style={{ fontWeight: 700, fontSize: 22 }}>{v}</div><div className="term-label">{l}</div></div>;
}
function Field({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#1c1c22", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={16} className="neon-text" /></div>
      <div><div className="term-label">{label}</div><div className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>{value}</div></div>
    </div>
  );
}
function Row({ label, value }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}><span style={{ color: "var(--muted)" }}>{label}</span><span style={{ fontWeight: 600 }}>{value}</span></div>;
}
