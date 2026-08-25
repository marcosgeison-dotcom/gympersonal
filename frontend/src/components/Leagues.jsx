import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Share2, Trophy, X, Building2, Check } from "lucide-react";
import { Header } from "./Workout";
import { Loader } from "./Dashboard";
import api from "../api";

export default function Leagues() {
  const nav = useNavigate();
  const [user, setUser] = useState(null);
  const [leagues, setLeagues] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const load = () => api.getLeagues().then(setLeagues);
  useEffect(() => { api.getUser().then(setUser); load(); }, []);
  if (!leagues || !user) return <div style={{ padding: 16 }}><Loader /></div>;

  const myMember = leagues.find((l) => l.joined);

  const join = async (id) => { await api.joinLeague(id); load(); };
  const create = async () => {
    if (!newName.trim()) return;
    await api.createLeague(newName);
    setNewName(""); setCreateOpen(false); load();
  };

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title="LIGAS" onBack={() => nav("/")} />

      <div className="card-surface" style={{ padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(124,92,255,0.3)" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(124,92,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={22} className="neon-text" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="term-label">SUA ACADEMIA</div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 16 }}>{user.gym}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="font-display neon-text" style={{ fontWeight: 700, fontSize: 18 }}>{leagues.length}</div>
          <div className="term-label">ligas</div>
        </div>
      </div>

      {myMember && (
        <button onClick={() => nav(`/league/${myMember.id}`)} className="card-surface" style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: 0, overflow: "hidden", marginBottom: 18, border: "1px solid rgba(124,92,255,0.5)" }}>
          <div style={{ padding: 16, background: "linear-gradient(145deg,rgba(124,92,255,0.18),transparent)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 30 }}>{myMember.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="term-label neon-text">MINHA LIGA</div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 19 }}>{myMember.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{myMember.members} membros ativos</div>
              </div>
              <Trophy size={26} color="#7c5cff" />
            </div>
          </div>
        </button>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <button onClick={() => setCreateOpen(true)} style={actBtn}><Plus size={18} /> Criar Liga</button>
        <button style={{ ...actBtn, background: "#1c1c22", color: "#c9c9d4", boxShadow: "none", border: "1px solid var(--border)" }}><Share2 size={18} /> Convidar</button>
      </div>

      <div className="term-label" style={{ marginBottom: 10 }}>LIGAS DA {user.gym.toUpperCase()}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {leagues.map((l) => (
          <div key={l.id} className="card-surface" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 26 }}>{l.emoji}</div>
            <div style={{ flex: 1, cursor: l.joined ? "pointer" : "default" }} onClick={() => l.joined && nav(`/league/${l.id}`)}>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                <Users size={12} /> {l.members} membros
              </div>
            </div>
            {l.joined ? <span className="term-label" style={{ color: "#39ff14", display: "flex", alignItems: "center", gap: 4 }}><Check size={13} /> MEMBRO</span> : <button onClick={() => join(l.id)} style={{ ...actBtn, width: "auto", padding: "8px 16px", fontSize: 13 }}>Entrar</button>}
          </div>
        ))}
      </div>

      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} className="card-surface animate-slide-up" style={{ width: "100%", maxWidth: 360, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Trophy size={18} className="neon-text" /><span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>Criar Nova Liga</span></div>
              <button onClick={() => setCreateOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="var(--muted)" /></button>
            </div>
            <div className="term-label" style={{ marginBottom: 5 }}>NOME DA LIGA</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Monstros do Ferro" style={inp} />
            <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", margin: "12px 0" }}>
              <Building2 size={12} style={{ display: "inline", marginRight: 4 }} /> Liga vinculada à {user.gym}. Membros competem por treinos, calorias e streaks.
            </div>
            <button onClick={create} style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", color: "#fff", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15 }}>Criar & Compartilhar Convite</button>
          </div>
        </div>
      )}
    </div>
  );
}

const actBtn = { flex: 1, padding: "12px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", color: "#fff", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 6px 18px rgba(124,92,255,0.35)" };
const overlay = { position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16, zIndex: 60 };
const inp = { width: "100%", padding: "11px 14px", borderRadius: 12, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 15, outline: "none" };
