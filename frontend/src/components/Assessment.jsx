import React, { useState } from "react";
import { ClipboardCheck, ChevronRight, ChevronLeft, Loader2, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const GOALS = ["Ganho de massa muscular", "Perda de gordura", "Resistência", "Saúde geral"];
const LEVELS = ["Iniciante", "Intermediário", "Avançado"];
const DAYS = [3, 4, 5, 6];
const FOCUS = ["Corpo todo", "Membros superiores", "Membros inferiores", "Core / Abdômen"];

export default function Assessment() {
  const { setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ goal: GOALS[0], experience: LEVELS[0], days_per_week: 4, weight: "", height: "", body_fat: "", waist: "", injuries: "", focus_area: FOCUS[0] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const canNext = step !== 1 || (f.weight && f.height);

  const submit = async () => {
    setSaving(true);
    try {
      const u = await api.submitAssessment({
        goal: f.goal, experience: f.experience, days_per_week: f.days_per_week,
        weight: parseFloat(f.weight), height: parseFloat(f.height),
        body_fat: f.body_fat ? parseFloat(f.body_fat) : null,
        waist: f.waist ? parseFloat(f.waist) : null,
        injuries: f.injuries || null, focus_area: f.focus_area,
      });
      setUser(u);
    } catch (e) {
      setSaving(false);
    }
  };

  return (
    <div className="animate-slide-up" data-testid="assessment-screen" style={{ padding: "24px 20px 32px", display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(145deg,#7c5cff,#5b3ee0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ClipboardCheck size={22} color="#fff" />
        </div>
        <div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 20 }}>Avaliação Profissional</div>
          <div className="term-label neon-text">PASSO {step + 1} DE 3</div>
        </div>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 12.5, margin: "8px 0 18px", lineHeight: 1.5 }}>
        Esses dados servem de parâmetro para seus treinos, metas e conquistas.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 4, background: i <= step ? "linear-gradient(90deg,#7c5cff,#a48bff)" : "#232329", boxShadow: i <= step ? "0 0 8px rgba(124,92,255,0.6)" : "none" }} />
        ))}
      </div>

      <div style={{ flex: 1 }}>
        {step === 0 && (
          <>
            <Label t="QUAL SEU OBJETIVO PRINCIPAL?" />
            <Chips options={GOALS} value={f.goal} onPick={(v) => set("goal", v)} tid="goal" />
            <Label t="SEU NÍVEL DE EXPERIÊNCIA" />
            <Chips options={LEVELS} value={f.experience} onPick={(v) => set("experience", v)} tid="level" />
            <Label t="QUANTOS DIAS POR SEMANA VOCÊ TREINA?" />
            <Chips options={DAYS} value={f.days_per_week} onPick={(v) => set("days_per_week", v)} tid="days" fmt={(d) => `${d} dias`} />
          </>
        )}
        {step === 1 && (
          <>
            <Label t="SUAS MEDIDAS ATUAIS" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Num label="Peso (kg) *" value={f.weight} onChange={(v) => set("weight", v)} tid="assessment-weight-input" />
              <Num label="Altura (cm) *" value={f.height} onChange={(v) => set("height", v)} tid="assessment-height-input" />
              <Num label="Gordura (%) — opcional" value={f.body_fat} onChange={(v) => set("body_fat", v)} tid="assessment-bodyfat-input" />
              <Num label="Cintura (cm) — opcional" value={f.waist} onChange={(v) => set("waist", v)} tid="assessment-waist-input" />
            </div>
            <div className="font-mono-t" style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
              <Target size={12} style={{ display: "inline", marginRight: 4 }} className="neon-text" />
              Essas medidas viram a linha de base do seu progresso.
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <Label t="FOCO PREFERIDO" />
            <Chips options={FOCUS} value={f.focus_area} onPick={(v) => set("focus_area", v)} tid="focus" />
            <Label t="LESÕES OU RESTRIÇÕES (OPCIONAL)" />
            <textarea data-testid="assessment-injuries-input" value={f.injuries} onChange={(e) => set("injuries", e.target.value)} placeholder="Ex: dor no joelho direito, hérnia lombar..." rows={3}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit" }} />
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {step > 0 && (
          <button data-testid="assessment-back-btn" onClick={() => setStep(step - 1)} style={{ padding: "13px 18px", borderRadius: 14, background: "#1c1c22", color: "#c9c9d4", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "Rajdhani", fontWeight: 600 }}>
            <ChevronLeft size={18} /> Voltar
          </button>
        )}
        {step < 2 ? (
          <button data-testid="assessment-next-btn" onClick={() => canNext && setStep(step + 1)} disabled={!canNext} style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", background: canNext ? "linear-gradient(145deg,#7c5cff,#5b3ee0)" : "#232329", color: canNext ? "#fff" : "var(--muted)", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Continuar <ChevronRight size={18} />
          </button>
        ) : (
          <button data-testid="assessment-submit-btn" onClick={submit} disabled={saving} style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(145deg,#39ff14,#16a34a)", color: "#0a0a0c", fontFamily: "Rajdhani", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {saving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <ClipboardCheck size={18} />} Concluir Avaliação
          </button>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Label({ t }) {
  return <div className="term-label" style={{ margin: "16px 0 8px" }}>{t}</div>;
}

function Chips({ options, value, onPick, tid, fmt }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button key={o} data-testid={`assessment-${tid}-${String(o).toLowerCase().replace(/[^a-z0-9]/g, "-")}`} onClick={() => onPick(o)} style={{
            padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: active ? "rgba(124,92,255,0.18)" : "#1c1c22",
            border: active ? "1px solid #7c5cff" : "1px solid var(--border)",
            color: active ? "#a48bff" : "#c9c9d4",
          }}>{fmt ? fmt(o) : o}</button>
        );
      })}
    </div>
  );
}

function Num({ label, value, onChange, tid }) {
  return (
    <div>
      <div className="term-label" style={{ marginBottom: 5, fontSize: 9 }}>{label}</div>
      <input data-testid={tid} type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "11px 14px", borderRadius: 12, background: "#1c1c22", border: "1px solid var(--border)", color: "#fff", fontSize: 15, outline: "none" }} />
    </div>
  );
}
