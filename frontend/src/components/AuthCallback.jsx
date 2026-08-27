import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity, Loader2 } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const nav = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = location.hash || window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    const run = async () => {
      if (!sessionId) { nav("/", { replace: true }); return; }
      try {
        const user = await api.exchangeSession(sessionId);
        setUser(user);
      } catch (e) {
        console.error("Auth exchange failed", e);
      } finally {
        // clear the hash and land on dashboard
        window.history.replaceState(null, "", window.location.pathname);
        nav("/", { replace: true });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 18 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(150deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 34px rgba(124,92,255,0.5)" }}>
        <Activity size={34} color="#fff" strokeWidth={2.6} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#c9c9d4" }}>
        <Loader2 size={18} className="neon-text" style={{ animation: "spin 1s linear infinite" }} />
        <span className="font-display" style={{ fontWeight: 600 }}>Autenticando...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
