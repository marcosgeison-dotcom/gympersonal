import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, TrendingUp, Trophy, User, MessageCircle, Wifi, Signal, BatteryFull, Loader2 } from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import AuthCallback from "./components/AuthCallback";
import Splash from "./components/Splash";
import Assessment from "./components/Assessment";
import Dashboard from "./components/Dashboard";
import Workout from "./components/Workout";
import Progress from "./components/Progress";
import Leagues from "./components/Leagues";
import LeagueDetail from "./components/LeagueDetail";
import Profile from "./components/Profile";
import Chat from "./components/Chat";
import Library from "./components/Library";

function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="statusbar">
      <span>{time}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Signal size={14} />
        <Wifi size={14} />
        <BatteryFull size={16} />
      </div>
    </div>
  );
}

const TABS = [
  { path: "/", label: "Início", icon: Home },
  { path: "/workout", label: "Treino", icon: Dumbbell },
  { path: "/progress", label: "Progresso", icon: TrendingUp },
  { path: "/leagues", label: "Ligas", icon: Trophy },
  { path: "/profile", label: "Perfil", icon: User },
];

function BottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isActive = (p) => (p === "/" ? pathname === "/" : pathname.startsWith(p));
  return (
    <nav className="bottomnav">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = isActive(t.path);
        return (
          <button key={t.path} className={`navitem ${active ? "active" : ""}`} onClick={() => nav(t.path)}>
            <Icon size={21} className={active ? "tab-active-glow" : ""} strokeWidth={active ? 2.4 : 1.8} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function ChatFab() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  if (pathname === "/chat") return null;
  return (
    <button className="fab-chat" onClick={() => nav("/chat")} style={{
      width: 54, height: 54, borderRadius: 18, border: "none", cursor: "pointer",
      background: "linear-gradient(145deg, #7c5cff, #5b3ee0)",
      boxShadow: "0 8px 26px rgba(124,92,255,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <MessageCircle size={24} color="#fff" />
    </button>
  );
}

function FullLoader() {
  return (
    <div className="phone-scroll no-scrollbar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={30} className="neon-text" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function AuthedApp() {
  return (
    <>
      <div className="phone-scroll no-scrollbar">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/league/:id" element={<LeagueDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </div>
      <ChatFab />
      <BottomNav />
    </>
  );
}

function Content() {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Process OAuth callback FIRST (synchronously during render) to avoid race conditions
  if (location.hash?.includes("session_id=")) {
    return <div className="phone-scroll no-scrollbar"><AuthCallback /></div>;
  }
  if (loading) return <FullLoader />;
  if (!user) return <div className="phone-scroll no-scrollbar"><Login /></div>;
  if (!user.assessment_done) return <div className="phone-scroll no-scrollbar"><Assessment /></div>;
  return <AuthedApp />;
}

function Shell() {
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="phone grid-bg">
      {splash ? <Splash /> : (<><StatusBar /><Content /></>)}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <div className="stage">
        <BrowserRouter>
          <AuthProvider>
            <Shell />
          </AuthProvider>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
