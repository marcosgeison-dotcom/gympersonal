import React from "react";
import { Activity } from "lucide-react";

export default function Splash() {
  return (
    <div data-testid="splash-screen" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, position: "relative" }}>
      <div style={{ position: "absolute", width: 300, height: 300, background: "radial-gradient(circle, rgba(124,92,255,0.32), transparent 65%)", filter: "blur(24px)", pointerEvents: "none" }} />
      <div className="splash-pop" style={{ width: 96, height: 96, borderRadius: 30, background: "linear-gradient(150deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 50px rgba(124,92,255,0.6)", zIndex: 1 }}>
        <Activity size={52} color="#fff" strokeWidth={2.6} />
      </div>
      <div className="font-display splash-fade" style={{ fontSize: 30, fontWeight: 700, zIndex: 1 }}>
        GYM<span className="neon-text">PERSONAL</span>
      </div>
      <style>{`
        .splash-pop{animation:splashpop .7s cubic-bezier(.2,1.4,.4,1) both}
        .splash-fade{animation:splashfade .8s .3s ease both}
        @keyframes splashpop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes splashfade{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}
