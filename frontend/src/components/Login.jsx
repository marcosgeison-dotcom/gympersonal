import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Dumbbell, Trophy, TrendingUp, Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr("");
    if (!email.trim() || !password) { setErr("Preencha e-mail e senha."); return; }
    if (mode === "register" && !name.trim()) { setErr("Informe seu nome."); return; }
    setBusy(true);
    try {
      const user = mode === "login"
        ? await api.login(email.trim(), password)
        : await api.register(name.trim(), email.trim(), password);
      setUser(user);
      nav("/", { replace: true });
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Não foi possível autenticar. Tente novamente.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", minHeight: "100%", padding: "40px 26px 32px", position: "relative" }}>
      <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 320, height: 320, background: "radial-gradient(circle, rgba(124,92,255,0.35), transparent 65%)", filter: "blur(20px)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", zIndex: 1 }}>
        <div style={{ width: 84, height: 84, borderRadius: 26, background: "linear-gradient(150deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 40px rgba(124,92,255,0.55)", marginBottom: 22 }}>
          <Activity size={46} color="#fff" strokeWidth={2.6} />
        </div>

        <div className="font-display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.02em" }}>
          GYM<span className="neon-text">PERSONAL</span>
        </div>
        <div className="term-label" style={{ marginTop: 6, letterSpacing: "0.24em" }}>SEU TREINADOR PESSOAL COM IA</div>

        <p style={{ color: "#9ba1a6", fontSize: 14, lineHeight: 1.6, margin: "22px 0 24px", maxWidth: 300 }}>
          Treinos personalizados por IA, progresso em tempo real e ligas com sua academia. Cada aluno, seus próprios dados.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%", marginBottom: 26 }}>
          <Feature icon={Dumbbell} label="Treinos IA" color="#7c5cff" />
          <Feature icon={TrendingUp} label="Progresso" color="#22d3ee" />
          <Feature icon={Trophy} label="Ligas" color="#f59e0b" />
        </div>
      </div>

      <form onSubmit={submit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
        {mode === "register" && (
          <Field icon={UserIcon} value={name} onChange={setName} placeholder="Seu nome" type="text" />
        )}
        <Field icon={Mail} value={email} onChange={setEmail} placeholder="E-mail" type="email" />
        <Field icon={Lock} value={password} onChange={setPassword} placeholder="Senha" type="password" />

        {err && <div style={{ color: "#ff6b6b", fontSize: 12.5, textAlign: "center" }}>{err}</div>}

        <button type="submit" disabled={busy} style={{
          width: "100%", padding: "15px 0", borderRadius: 16, border: "none", cursor: busy ? "wait" : "pointer",
          background: busy ? "#5b3ee0" : "#fff", color: "#1a1a1a", fontWeight: 600, fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)", opacity: busy ? 0.7 : 1,
        }}>
          {busy ? "Carregando..." : (mode === "login" ? "Entrar" : "Criar conta")}
        </button>
      </form>

      <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
        style={{ width: "100%", background: "none", border: "none", color: "var(--muted)", fontSize: 13, marginTop: 14, cursor: "pointer", zIndex: 1 }}>
        {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, color: "var(--muted)", fontSize: 11, zIndex: 1 }}>
        <Sparkles size={12} color="#7c5cff" />
        Ao continuar, você concorda com os termos de serviço
      </div>
    </div>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, type }) {
  return (
    <div className="card-surface" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
      <Icon size={18} color="#9ba1a6" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 15 }}
        autoComplete={type === "password" ? "current-password" : type}
      />
    </div>
  );
}

function Feature({ icon: Icon, label, color }) {
  return (
    <div className="card-surface" style={{ padding: "14px 6px", textAlign: "center" }}>
      <Icon size={22} color={color} style={{ marginBottom: 6 }} />
      <div className="term-label" style={{ fontSize: 9 }}>{label}</div>
    </div>
  );
}
