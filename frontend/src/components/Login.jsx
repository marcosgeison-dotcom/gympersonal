import React from "react";
import { Activity, Dumbbell, Trophy, TrendingUp, Sparkles } from "lucide-react";

export default function Login() {
  const signIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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

        <p style={{ color: "#9ba1a6", fontSize: 14, lineHeight: 1.6, margin: "22px 0 30px", maxWidth: 300 }}>
          Treinos personalizados por IA, progresso em tempo real e ligas com sua academia. Cada aluno, seus próprios dados.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%", marginBottom: 34 }}>
          <Feature icon={Dumbbell} label="Treinos IA" color="#7c5cff" />
          <Feature icon={TrendingUp} label="Progresso" color="#22d3ee" />
          <Feature icon={Trophy} label="Ligas" color="#f59e0b" />
        </div>
      </div>

      <button onClick={signIn} style={{
        width: "100%", padding: "15px 0", borderRadius: 16, border: "none", cursor: "pointer",
        background: "#fff", color: "#1a1a1a", fontWeight: 600, fontSize: 15,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 1,
      }}>
        <GoogleIcon /> Entrar com Google
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, color: "var(--muted)", fontSize: 11, zIndex: 1 }}>
        <Sparkles size={12} color="#7c5cff" />
        Ao continuar, você concorda com os termos de serviço
      </div>
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
