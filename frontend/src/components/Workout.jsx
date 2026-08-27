import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Sparkles, Check, Plus, Minus, Loader2, CheckCircle2, Zap, Home, Share2,
} from "lucide-react";
import api from "../api";
import { shareAchievement } from "./ShareCard";
import { Loader } from "./Dashboard";

export default function Workout() {
  const nav = useNavigate();
  const [tab, setTab] = useState("hoje");
  const [workout, setWorkout] = useState(null);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [open, setOpen] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getTodayWorkout().then((w) => {
      setWorkout(w);
      setExercises(w.exercises.map((e) => ({ ...e, logged: Array(e.sets).fill(null).map(() => ({ weight: e.weight, reps: 10, done: false })) })));
    });
    api.getPlans().then(setPlans);
  }, []);

  if (!workout) return <div style={{ padding: 16 }}><Loader /></div>;

  const totalSets = exercises.reduce((a, e) => a + e.logged.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.logged.filter((s) => s.done).length, 0);
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  const updateSet = (ei, si, field, val) => setExercises((prev) => prev.map((e, i) => i !== ei ? e : { ...e, logged: e.logged.map((s, j) => j !== si ? s : { ...s, [field]: Math.max(0, val) }) }));
  const toggleSet = (ei, si) => {
    setExercises((prev) => prev.map((e, i) => i !== ei ? e : { ...e, logged: e.logged.map((s, j) => j !== si ? s : { ...s, done: !s.done }) }));
  };

  const finish = async () => {
    // persist performance for exercises with any done set
    for (const ex of exercises) {
      const done = ex.logged.filter((s) => s.done).map((s) => ({ weight: s.weight, reps: s.reps }));
      if (done.length) { try { await api.logPerformance(ex.id, done); } catch (e) { /* noop */ } }
    }
    try { const r = await api.completeWorkout(); setResult(r); } catch (e) { /* noop */ }
    setFinished(true);
  };

  const loadWorkout = (w) => {
    setWorkout(w);
    setExercises(w.exercises.map((e) => ({ ...e, logged: Array(e.sets).fill(null).map(() => ({ weight: e.weight, reps: 10, done: false })) })));
    setFinished(false);
    setOpen(null);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await api.generatePlan();
      loadWorkout(r.workout);
      setPlans(await api.getPlans());
      setTab("hoje");
    } catch (e) {
      alert("Falha ao gerar plano com IA. Tente novamente.");
    }
    setGenerating(false);
  };

  const emergency = async () => {
    try { loadWorkout(await api.getEmergency()); } catch (e) { /* noop */ }
  };

  const activate = async (id) => {
    await api.activatePlan(id);
    setPlans(await api.getPlans());
  };

  return (
    <div className="animate-slide-up" style={{ padding: "8px 16px 24px" }}>
      <Header title="TREINO" onBack={() => nav("/")} />

      <div style={{ display: "flex", background: "#141418", borderRadius: 14, padding: 4, marginBottom: 16, border: "1px solid var(--border)" }}>
        {[["hoje", "Treino de Hoje"], ["planos", "Meus Planos"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, background: tab === k ? "linear-gradient(145deg,#7c5cff,#5b3ee0)" : "transparent", color: tab === k ? "#fff" : "var(--muted)" }}>{l}</button>
        ))}
      </div>

      {tab === "hoje" && !finished && (
        <>
          <div className="card-surface" style={{ padding: 16, marginBottom: 14 }}>
            <div className="term-label neon-text">{workout.day} · {workout.focus}</div>
            <div className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: "2px 0 12px" }}>{workout.name}</div>
            <div style={{ height: 8, background: "#232329", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#39ff14,#22d3ee)", borderRadius: 8, transition: "width 0.3s" }} />
            </div>
            <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{doneSets}/{totalSets} séries · {pct}% completo</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {exercises.map((ex, ei) => {
              const allDone = ex.logged.every((s) => s.done);
              return (
                <div key={ex.id} className="card-surface" style={{ overflow: "hidden", border: allDone ? "1px solid rgba(57,255,20,0.4)" : "1px solid var(--border)" }}>
                  <button onClick={() => setOpen(open === ei ? null : ei)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
                    <img src={ex.img} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover" }} />
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div className="font-display" style={{ fontWeight: 600, fontSize: 15 }}>{ex.name}</div>
                      <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)" }}>{ex.muscle} · {ex.sets}x{ex.reps}</div>
                    </div>
                    {allDone ? <CheckCircle2 size={22} color="#39ff14" /> : <div className="font-mono-t" style={{ fontSize: 12, color: "var(--muted)" }}>{ex.logged.filter((s) => s.done).length}/{ex.sets}</div>}
                  </button>
                  {open === ei && (
                    <div style={{ padding: "0 12px 12px" }}>
                      {ex.logged.map((s, si) => (
                        <div key={si} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                          <span className="font-mono-t neon-text" style={{ width: 22, fontSize: 12 }}>#{si + 1}</span>
                          <Stepper label="kg" value={s.weight} step={2.5} onChange={(v) => updateSet(ei, si, "weight", v)} />
                          <Stepper label="reps" value={s.reps} step={1} onChange={(v) => updateSet(ei, si, "reps", v)} />
                          <button onClick={() => toggleSet(ei, si)} style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0, background: s.done ? "#39ff14" : "#232329", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={18} color={s.done ? "#0a0a0c" : "var(--muted)"} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                      <div className="font-mono-t" style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
                        <Zap size={11} style={{ display: "inline", marginRight: 4 }} color="#f59e0b" /> IA sugere: aumentar carga se completar todas as reps
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={finish} style={primaryBtn}><Check size={20} /> Finalizar Treino</button>
          <button data-testid="emergency-workout-btn" onClick={emergency} style={{ ...ghostBtn, marginTop: 10 }}><Home size={18} /> Treino Emergencial (sem equipamento)</button>
        </>
      )}

      {tab === "hoje" && finished && (
        <div className="card-surface animate-slide-up" style={{ padding: 24, textAlign: "center", marginTop: 20 }}>
          <div style={{ fontSize: 46 }}>🏆</div>
          <div className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: "8px 0" }}>Treino Concluído!</div>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 16px" }}>Você ganhou <span className="neon-text" style={{ fontWeight: 700 }}>+{result?.xp_gained ?? 280} XP</span> e manteve seu streak 🔥</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 18 }}>
            <MiniStat v={pct + "%"} l="Completo" c="#39ff14" />
            <MiniStat v={doneSets} l="Séries" c="#7c5cff" />
            <MiniStat v="+480" l="Kcal queimadas" c="#f59e0b" />
          </div>
          <button data-testid="share-achievement-btn" onClick={() => shareAchievement({ workoutName: workout.name, xp: result?.xp_gained ?? 280, sets: doneSets, pct, kcal: 480, streak: result?.stats?.streak ?? 1 })} style={{ ...primaryBtn, background: "linear-gradient(145deg,#39ff14,#16a34a)", color: "#0a0a0c", marginBottom: 10 }}><Share2 size={20} /> Compartilhar Conquista</button>
          <button onClick={() => nav("/")} style={primaryBtn}>Voltar ao Início</button>
        </div>
      )}

      {tab === "planos" && (
        <>
          <button onClick={generate} disabled={generating} style={{ ...primaryBtn, marginBottom: 16 }}>
            {generating ? <><Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> Gerando treino IA...</> : <><Sparkles size={20} /> Gerar Plano com IA</>}
          </button>
          <div className="term-label" style={{ marginBottom: 10 }}>PLANOS DISPONÍVEIS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plans.map((p) => (
              <div key={p.id} className="card-surface" style={{ padding: 14, border: p.active ? "1px solid rgba(124,92,255,0.5)" : "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="font-display" style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                    <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)" }}>{p.days}x/semana · {p.focus}</div>
                  </div>
                  {p.active ? <span className="term-label neon-text" style={{ padding: "4px 8px", background: "rgba(124,92,255,0.15)", borderRadius: 8 }}>ATIVO</span> : <button data-testid={`activate-plan-${p.id}`} onClick={() => activate(p.id)} style={{ ...ghostBtn, width: "auto", padding: "7px 14px", fontSize: 12 }}>Ativar</button>}
                </div>
                <div style={{ height: 6, background: "#232329", borderRadius: 6, overflow: "hidden", marginTop: 10 }}>
                  <div style={{ width: `${p.progress}%`, height: "100%", background: "#7c5cff", borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Stepper({ label, value, step, onChange }) {
  return (
    <div style={{ flex: 1, background: "#1c1c22", borderRadius: 10, padding: "4px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <button onClick={() => onChange(+(value - step).toFixed(1))} style={stepBtn}><Minus size={14} color="var(--muted)" /></button>
      <div style={{ textAlign: "center" }}>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 15, lineHeight: 1 }}>{value}</div>
        <div className="term-label" style={{ fontSize: 8 }}>{label}</div>
      </div>
      <button onClick={() => onChange(+(value + step).toFixed(1))} style={stepBtn}><Plus size={14} color="var(--neon)" /></button>
    </div>
  );
}

function MiniStat({ v, l, c }) {
  return (
    <div style={{ background: "#1c1c22", borderRadius: 12, padding: "10px 14px", minWidth: 72 }}>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 18, color: c }}>{v}</div>
      <div className="term-label">{l}</div>
    </div>
  );
}

export function Header({ title, onBack, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "#1c1c22", border: "1px solid var(--border)", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={20} color="#fff" />
          </button>
        )}
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

const primaryBtn = { width: "100%", padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", color: "#fff", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 24px rgba(124,92,255,0.4)" };
const ghostBtn = { width: "100%", padding: "12px 0", borderRadius: 14, cursor: "pointer", background: "transparent", color: "#c9c9d4", border: "1px solid var(--border)", fontFamily: "Rajdhani", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const stepBtn = { width: 28, height: 28, borderRadius: 8, border: "none", background: "#141418", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
