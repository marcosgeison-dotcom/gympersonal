export async function shareAchievement({ workoutName, xp, sets, pct, kcal, streak }) {
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");

  x.fillStyle = "#0f0f0f";
  x.fillRect(0, 0, W, H);

  x.strokeStyle = "rgba(124,92,255,0.08)";
  x.lineWidth = 1;
  for (let i = 0; i < W; i += 60) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 0; i < H; i += 60) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }

  const glow = x.createRadialGradient(W / 2, 340, 50, W / 2, 340, 500);
  glow.addColorStop(0, "rgba(124,92,255,0.4)");
  glow.addColorStop(1, "rgba(124,92,255,0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, W, 800);

  const rr = (px, py, w, h, r) => {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath();
  };

  const lg = x.createLinearGradient(W / 2 - 80, 180, W / 2 + 80, 340);
  lg.addColorStop(0, "#7c5cff");
  lg.addColorStop(1, "#5b3ee0");
  x.fillStyle = lg;
  rr(W / 2 - 80, 170, 160, 160, 44);
  x.fill();
  x.strokeStyle = "#fff";
  x.lineWidth = 12;
  x.lineCap = "round";
  x.lineJoin = "round";
  x.beginPath();
  x.moveTo(W / 2 - 52, 250);
  x.lineTo(W / 2 - 22, 250);
  x.lineTo(W / 2 - 6, 208);
  x.lineTo(W / 2 + 10, 292);
  x.lineTo(W / 2 + 24, 250);
  x.lineTo(W / 2 + 52, 250);
  x.stroke();

  x.textAlign = "center";
  x.fillStyle = "#fff";
  x.font = "700 64px Rajdhani, Arial";
  x.fillText("GYM", W / 2 - 78, 430);
  x.fillStyle = "#a48bff";
  x.fillText("PERSONAL", W / 2 + 92, 430);

  x.fillStyle = "#39ff14";
  x.font = "600 34px monospace";
  x.fillText("[ TREINO CONCLUÍDO ]", W / 2, 520);

  x.fillStyle = "#fff";
  x.font = "700 76px Rajdhani, Arial";
  x.fillText(workoutName || "Treino do Dia", W / 2, 630);

  x.font = "72px Arial";
  x.fillText("🏆", W / 2, 740);

  const stats = [
    { v: `+${xp}`, l: "XP GANHOS", c: "#a48bff" },
    { v: `${sets}`, l: "SÉRIES", c: "#39ff14" },
    { v: `${pct}%`, l: "COMPLETO", c: "#22d3ee" },
    { v: `~${kcal}`, l: "KCAL", c: "#f59e0b" },
  ];
  const bw = 220, gap = 24, total = stats.length * bw + (stats.length - 1) * gap;
  let sx = (W - total) / 2;
  stats.forEach((s) => {
    x.fillStyle = "#17171c";
    rr(sx, 800, bw, 190, 28);
    x.fill();
    x.strokeStyle = "rgba(124,92,255,0.35)";
    x.lineWidth = 2;
    rr(sx, 800, bw, 190, 28);
    x.stroke();
    x.fillStyle = s.c;
    x.font = "700 58px Rajdhani, Arial";
    x.fillText(s.v, sx + bw / 2, 890);
    x.fillStyle = "#9ba1a6";
    x.font = "600 22px monospace";
    x.fillText(s.l, sx + bw / 2, 945);
    sx += bw + gap;
  });

  x.fillStyle = "#17171c";
  rr(W / 2 - 260, 1050, 520, 110, 28);
  x.fill();
  x.strokeStyle = "rgba(245,158,11,0.5)";
  x.lineWidth = 2;
  rr(W / 2 - 260, 1050, 520, 110, 28);
  x.stroke();
  x.font = "52px Arial";
  x.fillText("🔥", W / 2 - 180, 1122);
  x.fillStyle = "#f59e0b";
  x.font = "700 46px Rajdhani, Arial";
  x.fillText(`STREAK DE ${streak} DIAS`, W / 2 + 40, 1120);

  x.fillStyle = "#6b7280";
  x.font = "600 26px monospace";
  const d = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  x.fillText(`// ${d} · gympersonal.app`, W / 2, 1260);

  const blob = await new Promise((res) => c.toBlob(res, "image/png"));
  const file = new File([blob], "conquista-gympersonal.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "GymPersonal", text: `Treino concluído! +${xp} XP 🔥💪` });
      return;
    } catch (e) { /* user cancelled or unsupported -> fallback */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "conquista-gympersonal.png";
  a.click();
  URL.revokeObjectURL(url);
}
