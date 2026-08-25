import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Activity, Sparkles } from "lucide-react";
import { Header } from "./Workout";
import { CHAT_HISTORY, CHAT_SUGGESTIONS, MOCK_AI_REPLIES } from "../mock";

export default function Chat() {
  const nav = useNavigate();
  const [messages, setMessages] = useState(CHAT_HISTORY);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const replyIdx = useRef(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages((prev) => [...prev, { id: "u" + Date.now(), role: "user", text: t }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = MOCK_AI_REPLIES[replyIdx.current % MOCK_AI_REPLIES.length];
      replyIdx.current += 1;
      setTyping(false);
      setMessages((prev) => [...prev, { id: "t" + Date.now(), role: "trainer", text: reply }]);
    }, 1400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 16px 0" }}>
        <Header title="TREINADOR IA" onBack={() => nav("/")}
          right={<div className="term-label neon-text live-dot" style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#39ff14", display: "inline-block" }} /> ONLINE</div>} />
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
        {messages.map((m) => <Bubble key={m.id} m={m} />)}
        {typing && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Avatar />
            <div className="card-surface" style={{ padding: "12px 16px", borderRadius: "4px 16px 16px 16px" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => <span key={i} className="live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--neon)", animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* suggestions */}
      <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px 8px" }}>
        {CHAT_SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} style={{
            whiteSpace: "nowrap", padding: "8px 14px", borderRadius: 20, cursor: "pointer",
            background: "#1c1c22", border: "1px solid rgba(124,92,255,0.3)", color: "#c9c9d4", fontSize: 12,
          }}>{s}</button>
        ))}
      </div>

      {/* input */}
      <div style={{ display: "flex", gap: 8, padding: "8px 16px 14px", alignItems: "center" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pergunte ao seu treinador..."
          style={{ flex: 1, padding: "13px 16px", borderRadius: 16, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 14, outline: "none" }}
        />
        <button onClick={() => send()} style={{ width: 46, height: 46, borderRadius: 15, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(124,92,255,0.4)", flexShrink: 0 }}>
          <Send size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Activity size={17} color="#fff" />
    </div>
  );
}

function Bubble({ m }) {
  const isUser = m.role === "user";
  return (
    <div className="animate-slide-up" style={{ display: "flex", gap: 8, marginBottom: 14, flexDirection: isUser ? "row-reverse" : "row" }}>
      {!isUser && <Avatar />}
      <div style={{
        maxWidth: "76%", padding: "11px 15px", fontSize: 14, lineHeight: 1.5,
        borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isUser ? "linear-gradient(145deg,#7c5cff,#5b3ee0)" : "var(--surface)",
        border: isUser ? "none" : "1px solid var(--border)",
        color: "#fff",
      }}>{m.text}</div>
    </div>
  );
}
