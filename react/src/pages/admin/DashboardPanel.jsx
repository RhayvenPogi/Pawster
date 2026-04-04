// ── DASHBOARD OVERVIEW PANEL — hover tooltips on all charts + organized density plot
import { useState, useEffect, useRef, useCallback } from "react";

const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8082";
const SPRING = import.meta.env.VITE_API_BASE   ?? "http://localhost:8080";
const POLL_INTERVAL = 30_000;

function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}
function djFetch(path) {
  const token = getToken();
  return fetch(`${DJANGO}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}
function springFetch(path) {
  const token = getToken();
  return fetch(`${SPRING}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

// ── CARD THEMES ───────────────────────────────────────────────────────────────
const CARD_THEMES = {
  green:  { accent: "linear-gradient(90deg,#1c4f09,#5aaa30)", valColor: "#1c4f09", iconBg: "rgba(90,170,48,0.14)",   hoverBorder: "rgba(90,170,48,0.50)",  hoverShadow: "0 8px 28px rgba(90,170,48,0.15)"  },
  orange: { accent: "linear-gradient(90deg,#B45A22,#e07830)", valColor: "#B45A22", iconBg: "rgba(180,90,34,0.12)",  hoverBorder: "rgba(180,90,34,0.50)", hoverShadow: "0 8px 28px rgba(180,90,34,0.15)" },
  amber:  { accent: "linear-gradient(90deg,#d4880a,#e0a030)", valColor: "#d4880a", iconBg: "rgba(212,136,10,0.12)", hoverBorder: "rgba(212,136,10,0.50)", hoverShadow: "0 8px 28px rgba(212,136,10,0.15)" },
  purple: { accent: "linear-gradient(90deg,#7a3dc0,#a070e0)", valColor: "#7a3dc0", iconBg: "rgba(122,61,192,0.12)", hoverBorder: "rgba(122,61,192,0.50)", hoverShadow: "0 8px 28px rgba(122,61,192,0.15)" },
};

// ── TOOLTIP BUBBLE ────────────────────────────────────────────────────────────
function Tooltip({ x, y, lines, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      transform: "translate(-50%, calc(-100% - 10px))",
      background: "rgba(22,54,10,0.97)",
      border: "1px solid rgba(90,170,48,0.35)",
      borderRadius: 9, padding: "8px 13px",
      pointerEvents: "none", zIndex: 200,
      boxShadow: "0 6px 22px rgba(0,0,0,0.28)",
      minWidth: 130,
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: i < lines.length - 1 ? 4 : 0 }}>
          {l.color && <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />}
          <span style={{ fontSize: "0.71rem", fontWeight: l.bold ? 900 : 700, color: l.bold ? "#fff" : "rgba(255,255,255,0.72)", whiteSpace: "nowrap" }}>
            {l.text}
          </span>
        </div>
      ))}
      <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid rgba(22,54,10,0.97)" }} />
    </div>
  );
}

// ── WIDE STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ val, label, sub, subWarn, icon, theme, onClick }) {
  const t = CARD_THEMES[theme] || CARD_THEMES.green;
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,248,225,0.85)", border: `1.5px solid ${hovered ? t.hoverBorder : "rgba(180,140,60,0.22)"}`,
        borderRadius: 12, padding: "18px 22px", cursor: "pointer", position: "relative", overflow: "hidden",
        backdropFilter: "blur(12px)", boxShadow: hovered ? t.hoverShadow : "0 2px 10px rgba(100,70,20,0.08)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)", transition: "transform 0.2s,box-shadow 0.2s,border-color 0.2s",
        display: "flex", alignItems: "center", gap: 16,
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, borderRadius: "12px 0 0 12px", background: t.accent }} />
      <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: t.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", marginLeft: 8 }}>
        {icon}
      </div>
<div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1.1, color: t.valColor, fontFamily: "'Playfair Display',Georgia,serif" }}>{val}</div>
        <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#6a7a50", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{label}</div>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: subWarn ? "#B45A22" : "#1c4f09", marginTop: 5, display: "inline-block", background: subWarn ? "rgba(180,90,34,0.10)" : "rgba(90,170,48,0.10)", padding: "3px 8px", borderRadius: 20 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

// ── COMBO BAR+LINE CHART with hover ──────────────────────────────────────────
function ComboBarLineChart({ data, labels, colorScheme }) {
  const canvasRef  = useRef(null);
  const wrapRef    = useRef(null);
  const regionsRef = useRef([]);
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, lines: [] });

  const approved = data.approved || [];
  const pending  = data.pending  || [];
  const rejected = data.rejected || [];

  const approvedColor = colorScheme === "orange" ? "#B45A22" : "#1c4f09";
  const pendingColor  = "#d4880a";
  const lineColor     = colorScheme === "orange" ? "#e07830" : "#5aaa30";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const padL = 38, padR = 52, padTop = 14, padBot = 30;
    const chartW = W - padL - padR, chartH = H - padTop - padBot;

    ctx.clearRect(0, 0, W, H);

    const allVals = [...approved, ...pending, ...rejected];
    const maxBar  = Math.max(...allVals, 1);
    const regions = [];

    // Gridlines + left Y labels
    ctx.strokeStyle = "rgba(180,140,60,0.12)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padTop + chartH - (i / 5) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
      ctx.fillStyle = "#9aaa80"; ctx.font = "700 9px Nunito,sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round((i / 5) * maxBar), padL - 5, y + 3);
    }

    const n = labels.length;
    const groupW = chartW / n;
    const barW = Math.max(5, (groupW * 0.65) / 2);
    const gap  = Math.max(2, barW * 0.25);

    labels.forEach((lbl, i) => {
      const groupX = padL + i * groupW + groupW / 2;
      const startX = groupX - (2 * barW + gap) / 2;

      // Bar: approved
      const aVal = approved[i] || 0;
      const aH   = (aVal / maxBar) * chartH;
      ctx.fillStyle = approvedColor + "cc";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(startX, padTop + chartH - Math.max(aH, 1), barW, Math.max(aH, 1), [3,3,0,0]);
      else ctx.rect(startX, padTop + chartH - Math.max(aH, 1), barW, Math.max(aH, 1));
      ctx.fill();
      regions.push({ x: startX, y: padTop + chartH - Math.max(aH, 8), w: barW, h: Math.max(aH, 8), lbl, series: "Approved", val: aVal, color: approvedColor });

      // Bar: pending
      const pVal = pending[i] || 0;
      const pH   = (pVal / maxBar) * chartH;
      const x2   = startX + barW + gap;
      ctx.fillStyle = pendingColor + "aa";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x2, padTop + chartH - Math.max(pH, 1), barW, Math.max(pH, 1), [3,3,0,0]);
      else ctx.rect(x2, padTop + chartH - Math.max(pH, 1), barW, Math.max(pH, 1));
      ctx.fill();
      regions.push({ x: x2, y: padTop + chartH - Math.max(pH, 8), w: barW, h: Math.max(pH, 8), lbl, series: "Pending", val: pVal, color: pendingColor });

      // X label
      ctx.fillStyle = "#6a7a50"; ctx.font = "700 9px Nunito,sans-serif"; ctx.textAlign = "center";
      ctx.fillText(lbl, groupX, H - 7);
    });

    // Line: rejected
    const maxLine = Math.max(...rejected, 1);
    ctx.beginPath();
    rejected.forEach((val, i) => {
      const x = padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
      const y = padTop + chartH - (val / maxLine) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = lineColor; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();

    // Dots
    rejected.forEach((val, i) => {
      const x = padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
      const y = padTop + chartH - (val / maxLine) * chartH;
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.stroke();
      regions.push({ x: x - 12, y: y - 12, w: 24, h: 24, lbl: labels[i], series: "Rejected", val, color: "#c03030", dot: true });
    });

    // Right Y axis
    ctx.fillStyle = "#9aaa80"; ctx.font = "700 9px Nunito,sans-serif"; ctx.textAlign = "left";
    for (let i = 0; i <= 4; i++) {
      const y = padTop + chartH - (i / 4) * chartH;
      ctx.fillText(Math.round((i / 4) * Math.max(...rejected, 1)), padL + chartW + 5, y + 3);
    }
    // Right axis label
    ctx.save(); ctx.translate(W - 8, padTop + chartH / 2); ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#b0b890"; ctx.font = "700 8px Nunito,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Rejected", 0, 0); ctx.restore();

    regionsRef.current = regions;
  }, [data, labels, colorScheme]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;
    const hit = regionsRef.current.find(r => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
    if (hit) {
      const wRect = wrap.getBoundingClientRect();
      setTip({
        visible: true,
        x: e.clientX - wRect.left,
        y: e.clientY - wRect.top,
        lines: [
          { text: hit.lbl, bold: true },
          { text: `${hit.series}: ${hit.val}`, color: hit.color },
        ],
      });
    } else setTip(t => ({ ...t, visible: false }));
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", cursor: "crosshair" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}>
      <canvas ref={canvasRef} width={580} height={220} style={{ width: "100%", height: 220 }} />
      <Tooltip {...tip} />
    </div>
  );
}

// ── DENSITY PLOT with hover + organized guide ─────────────────────────────────
function DensityPlot({ data, color }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const kdeRef    = useRef({ xs: [], kde: [], minV: 1, maxV: 31, maxKDE: 0.001, chartW: 1, chartH: 1 });
  const [tip, setTip]   = useState({ visible: false, x: 0, y: 0, lines: [] });
  const [peak, setPeak] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const PAD = { L: 44, R: 14, T: 14, B: 28 };
  const H_PX = 100;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const chartW = W - PAD.L - PAD.R;
    const chartH = H_PX - PAD.T - PAD.B;

    ctx.clearRect(0, 0, W, H_PX);

    if (!data || data.length === 0) {
      ctx.fillStyle = "rgba(180,140,60,0.07)";
      ctx.fillRect(PAD.L, PAD.T, chartW, chartH);
      ctx.fillStyle = "#b0b890"; ctx.font = "700 10px Nunito,sans-serif"; ctx.textAlign = "center";
      ctx.fillText("No submission data yet", PAD.L + chartW / 2, PAD.T + chartH / 2 + 4);
      kdeRef.current = { xs: [], kde: [], minV: 1, maxV: 31, maxKDE: 0.001, chartW, chartH };
      return;
    }

    const bw   = Math.max(0.8, Math.sqrt(data.length) * 0.9);
    const minV = Math.max(1, Math.min(...data));
    const maxV = Math.min(31, Math.max(...data, minV + 1));
    const pts  = 120;
    const xs   = Array.from({ length: pts }, (_, i) => minV + (i / (pts - 1)) * (maxV - minV));
    const kde  = xs.map(x =>
      data.reduce((acc, xi) => {
        const u = (x - xi) / bw;
        return acc + Math.exp(-0.5 * u * u) / (Math.sqrt(2 * Math.PI) * bw);
      }, 0) / data.length
    );
    const maxKDE = Math.max(...kde, 0.001);
    kdeRef.current = { xs, kde, minV, maxV, maxKDE, chartW, chartH };

    const peakIdx = kde.indexOf(maxKDE);
    setPeak({ day: Math.round(xs[peakIdx]) });

    // Subtle gridlines
    ctx.strokeStyle = "rgba(180,140,60,0.10)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.T + (i / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(PAD.L, y); ctx.lineTo(PAD.L + chartW, y); ctx.stroke();
      ctx.fillStyle = "#b0b890"; ctx.font = "600 8px Nunito,sans-serif"; ctx.textAlign = "right";
      ctx.fillText(((1 - i / 4) * 100).toFixed(0) + "%", PAD.L - 4, y + 3);
    }

    // Fill gradient
    const grad = ctx.createLinearGradient(0, PAD.T, 0, PAD.T + chartH);
    grad.addColorStop(0, color + "66");
    grad.addColorStop(1, color + "05");
    ctx.beginPath();
    ctx.moveTo(PAD.L, PAD.T + chartH);
    xs.forEach((x, i) => {
      const px = PAD.L + ((x - minV) / (maxV - minV)) * chartW;
      const py = PAD.T + chartH - (kde[i] / maxKDE) * chartH;
      ctx.lineTo(px, py);
    });
    ctx.lineTo(PAD.L + chartW, PAD.T + chartH);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Curve stroke
    ctx.beginPath();
    xs.forEach((x, i) => {
      const px = PAD.L + ((x - minV) / (maxV - minV)) * chartW;
      const py = PAD.T + chartH - (kde[i] / maxKDE) * chartH;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke();

    // Peak dot + dashed drop
    const pkX = PAD.L + ((xs[peakIdx] - minV) / (maxV - minV)) * chartW;
    const pkY = PAD.T;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pkX, pkY); ctx.lineTo(pkX, PAD.T + chartH);
    ctx.strokeStyle = color + "55"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(pkX, PAD.T + chartH - (kde[peakIdx] / maxKDE) * chartH, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

    // X axis: day ticks
    const tickCount = Math.min(8, Math.round(maxV - minV));
    ctx.fillStyle = "#8a9a70"; ctx.font = "600 8px Nunito,sans-serif"; ctx.textAlign = "center";
    for (let i = 0; i <= tickCount; i++) {
      const val = Math.round(minV + (i / tickCount) * (maxV - minV));
      const px  = PAD.L + ((val - minV) / (maxV - minV)) * chartW;
      ctx.fillText(`${val}`, px, H_PX - 6);
    }

    // Axis labels
    ctx.fillStyle = "#b0b890"; ctx.font = "600 8px Nunito,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Day of month →", PAD.L + chartW / 2, H_PX - 0);
  }, [data, color]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx     = (e.clientX - rect.left) * scaleX;
    const { xs, kde, minV, maxV, maxKDE, chartW } = kdeRef.current;
    if (!xs.length || !chartW) return;

    const frac = (mx - PAD.L) / chartW;
    if (frac < 0 || frac > 1) { setTip(t => ({ ...t, visible: false })); return; }

    const dayVal  = minV + frac * (maxV - minV);
    const closest = xs.reduce((best, x, i) => Math.abs(x - dayVal) < Math.abs(xs[best] - dayVal) ? i : best, 0);
    const relDensity = ((kde[closest] / maxKDE) * 100).toFixed(1);
    const estCount   = Math.max(1, Math.round((kde[closest] / maxKDE) * (data?.length || 1)));
    const wRect = wrap.getBoundingClientRect();

    setTip({
      visible: true,
      x: e.clientX - wRect.left,
      y: e.clientY - wRect.top,
      lines: [
        { text: `Day ${Math.round(xs[closest])} of month`, bold: true },
        { text: `Relative density: ${relDensity}%`, color },
        { text: `Est. submissions: ~${estCount}` },
      ],
    });
  }, [color, data]);

  const guideItems = [
    { swatch: "curve", color, label: "KDE curve", desc: "Gaussian-smoothed distribution of when requests are submitted across days of the month. Taller = more activity." },
    { swatch: "dot",   color, label: "Peak marker (●)", desc: "White dot with colored border = highest-density day. The dashed vertical line marks this peak." },
    { swatch: "fill",  color, label: "Shaded area", desc: "Area under the curve — wider coverage means submissions are more spread across the month." },
    { swatch: "yaxis", color: "#b0b890", label: "Y-axis (%)", desc: "Relative density scaled 0–100%. It is not an absolute count — it shows proportional concentration." },
    { swatch: "xaxis", color: "#8a9a70", label: "X-axis (day)", desc: "Day-of-month (1–31). Hover anywhere on the plot to see exact density and estimated submission count." },
  ];

  return (
    <div style={{ marginTop: 10, borderTop: "1px solid rgba(180,140,60,0.13)", paddingTop: 10 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.71rem", fontWeight: 900, color: "#3a5020" }}>Submission Density</span>
          {peak && (
            <span style={{ fontSize: "0.65rem", fontWeight: 800, color, background: color + "18", border: `1px solid ${color}44`, borderRadius: 5, padding: "1px 7px" }}>
              📍 Peak: Day {peak.day}
            </span>
          )}
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9aaa80" }}>KDE · day-of-month</span>
        </div>
        <button
          onClick={() => setShowGuide(g => !g)}
          style={{ background: showGuide ? color + "15" : "none", border: `1px solid ${showGuide ? color + "50" : "rgba(180,140,60,0.20)"}`, borderRadius: 6, padding: "2px 8px", fontFamily: "'Nunito',sans-serif", fontSize: "0.65rem", fontWeight: 800, color: showGuide ? color : "#9aaa80", cursor: "pointer", transition: "all 0.15s" }}>
          {showGuide ? "✕ Close guide" : "? Guide"}
        </button>
      </div>

      {/* Canvas */}
      <div ref={wrapRef} style={{ position: "relative", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}>
        <canvas ref={canvasRef} width={560} height={H_PX} style={{ width: "100%", height: H_PX }} />
        <Tooltip {...tip} />
      </div>

      {/* Organized Guide Panel */}
      {showGuide && (
        <div style={{ marginTop: 8, background: "rgba(250,248,230,0.80)", border: `1px solid ${color}28`, borderRadius: 9, overflow: "hidden" }}>
          {/* Guide header */}
          <div style={{ background: color + "12", borderBottom: `1px solid ${color}20`, padding: "8px 13px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.80rem" }}>📖</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#1a4a08" }}>Density Plot Guide</span>
            <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "#9aaa80", marginLeft: 4 }}>— Kernel Density Estimation (KDE)</span>
          </div>
          {/* Guide rows */}
          <div style={{ padding: "10px 13px", display: "flex", flexDirection: "column", gap: 0 }}>
            {guideItems.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: i < guideItems.length - 1 ? "1px solid rgba(180,140,60,0.10)" : "none" }}>
                {/* Swatch */}
                <div style={{ width: 32, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 2 }}>
                  {item.swatch === "curve" && (
                    <svg width="28" height="16" viewBox="0 0 28 16">
                      <path d="M2 14 Q8 2 14 8 Q20 14 26 3" fill="none" stroke={item.color} strokeWidth="2.2" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.swatch === "dot" && (
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <circle cx="8" cy="8" r="5.5" fill="#fff" stroke={item.color} strokeWidth="2.5" />
                    </svg>
                  )}
                  {item.swatch === "fill" && (
                    <svg width="28" height="16" viewBox="0 0 28 16">
                      <path d="M2 14 Q8 2 14 8 Q20 14 26 3 L26 14 Z" fill={item.color + "44"} stroke={item.color} strokeWidth="1.5" />
                    </svg>
                  )}
                  {item.swatch === "yaxis" && (
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <line x1="8" y1="1" x2="8" y2="15" stroke={item.color} strokeWidth="1.5" strokeDasharray="3 2" />
                      <text x="4" y="8" fontSize="6" fill={item.color} fontWeight="700">%</text>
                    </svg>
                  )}
                  {item.swatch === "xaxis" && (
                    <svg width="28" height="12" viewBox="0 0 28 12">
                      <line x1="2" y1="6" x2="24" y2="6" stroke={item.color} strokeWidth="1.5" />
                      <polygon points="24,3 28,6 24,9" fill={item.color} />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.69rem", fontWeight: 900, color: "#2a4a12", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: "0.66rem", fontWeight: 700, color: "#6a7a50", lineHeight: 1.45 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Footer note */}
          <div style={{ background: "rgba(180,140,60,0.07)", borderTop: "1px solid rgba(180,140,60,0.12)", padding: "6px 13px" }}>
            <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#9aaa80" }}>
              💡 Tip: Hover over the density curve to see estimated submissions for any day. The Y-axis is normalized — use it to compare shapes, not absolute counts.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DONUT CHART with hover ────────────────────────────────────────────────────
function DonutChart({ healthy, care, treatment }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const slicesRef = useRef([]);
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, lines: [] });

  const total = (healthy + care + treatment) || 1;
  const pct   = Math.round((healthy / total) * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext("2d");
    const cx   = canvas.width / 2, cy = canvas.height / 2, r = 58, inner = 38;
    const defs = [
      { val: healthy,   color: "#5aaa30", label: "Healthy"    },
      { val: care,      color: "#c87820", label: "Needs Care" },
      { val: treatment, color: "#8957e5", label: "Treatment"  },
    ];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let startAngle = -Math.PI / 2;
    const drawn = [];
    defs.forEach(({ val, color, label }) => {
      if (val <= 0) return;
      const sweep = (val / total) * 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, startAngle + sweep); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      drawn.push({ startAngle, endAngle: startAngle + sweep, color, label, val });
      startAngle += sweep;
    });
    ctx.save(); ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, 2 * Math.PI); ctx.fill(); ctx.restore();
    slicesRef.current = drawn;
  }, [healthy, care, treatment]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - canvas.width / 2;
    const my = e.clientY - rect.top - canvas.height / 2;
    const dist = Math.sqrt(mx * mx + my * my);
    if (dist < 38 || dist > 58) { setTip(t => ({ ...t, visible: false })); return; }

    let angle = Math.atan2(my, mx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;

    const hit = slicesRef.current.find(s => {
      let sa = s.startAngle + Math.PI / 2;
      let ea = s.endAngle   + Math.PI / 2;
      if (sa < 0) sa += 2 * Math.PI;
      if (ea < 0) ea += 2 * Math.PI;
      if (ea < sa) return angle >= sa || angle <= ea;
      return angle >= sa && angle <= ea;
    }) || slicesRef.current[0];

    if (!hit) return;
    const wRect = wrap.getBoundingClientRect();
    setTip({
      visible: true,
      x: e.clientX - wRect.left,
      y: e.clientY - wRect.top,
      lines: [
        { text: hit.label, bold: true },
        { text: `${hit.val} animals`, color: hit.color },
        { text: `${Math.round((hit.val / total) * 100)}% of shelter` },
      ],
    });
  }, [total]);

  return (
    <div ref={wrapRef} style={{ position: "relative", width: 124, height: 124, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}>
      <canvas ref={canvasRef} width={124} height={124} style={{ position: "absolute", inset: 0, cursor: "crosshair" }} />
      <div style={{ position: "relative", textAlign: "center", zIndex: 1, pointerEvents: "none" }}>
        <span style={{ display: "block", fontSize: "1.4rem", fontWeight: 900, color: "#1c4f09", lineHeight: 1 }}>{pct}%</span>
        <small style={{ fontSize: "0.62rem", fontWeight: 800, color: "#6a7a50" }}>Healthy</small>
      </div>
      <Tooltip {...tip} />
    </div>
  );
}

// ── HORIZONTAL BAR CHART with hover ──────────────────────────────────────────
function HorizontalBarChart({ items, colorA, colorB }) {
  const maxVal = Math.max(...items.flatMap(i => [i.valA, i.valB]), 1);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ borderRadius: 6, padding: "4px 0", background: hoveredIdx === i ? "rgba(255,248,220,0.70)" : "transparent", transition: "background 0.15s" }}>
          <div style={{ fontSize: "0.71rem", fontWeight: 800, color: "#3a5020", marginBottom: 4 }}>{item.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ flex: item.valA / maxVal, height: 13, background: colorA, borderRadius: "3px 0 0 3px", minWidth: 2, transition: "flex 0.8s ease, opacity 0.15s", opacity: hoveredIdx === i ? 1 : 0.85 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 900, color: colorA, width: 24, textAlign: "right", flexShrink: 0 }}>{item.valA}</span>
            <div style={{ flex: item.valB / maxVal, height: 13, background: colorB, borderRadius: "0 3px 3px 0", minWidth: 2, transition: "flex 0.8s ease, opacity 0.15s", opacity: hoveredIdx === i ? 1 : 0.85 }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 900, color: colorB, width: 24, textAlign: "right", flexShrink: 0 }}>{item.valB}</span>
          </div>
          {hoveredIdx === i && (
            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#9aaa80", marginTop: 3 }}>
              Adoptions: {item.valA} · Rehomes: {item.valB} · Total: {item.valA + item.valB}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── AGGREGATION ───────────────────────────────────────────────────────────────
const WEEK_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEAR_LABELS  = ["2021","2022","2023","2024","2025"];

function aggregate(records, view) {
  const now = new Date();
  const empty = (n) => Array(n).fill(0);
  let approved, pending, rejected, labels;
  if (view === "weekly") {
    approved = empty(7); pending = empty(7); rejected = empty(7); labels = WEEK_LABELS;
    const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0);
    records.forEach(r => {
      if (!r.created_at) return;
      const idx = Math.floor((new Date(r.created_at) - monday) / 86400000);
      if (idx < 0 || idx > 6) return;
      const s = (r.status || "").toLowerCase();
      if (s === "approved") approved[idx]++; else if (s === "rejected") rejected[idx]++; else pending[idx]++;
    });
  } else if (view === "monthly") {
    approved = empty(12); pending = empty(12); rejected = empty(12); labels = MONTH_LABELS;
    records.forEach(r => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      if (d.getFullYear() !== now.getFullYear()) return;
      const s = (r.status || "").toLowerCase();
      if (s === "approved") approved[d.getMonth()]++; else if (s === "rejected") rejected[d.getMonth()]++; else pending[d.getMonth()]++;
    });
  } else {
    approved = empty(5); pending = empty(5); rejected = empty(5); labels = YEAR_LABELS;
    records.forEach(r => {
      if (!r.created_at) return;
      const idx = new Date(r.created_at).getFullYear() - 2021;
      if (idx < 0 || idx > 4) return;
      const s = (r.status || "").toLowerCase();
      if (s === "approved") approved[idx]++; else if (s === "rejected") rejected[idx]++; else pending[idx]++;
    });
  }
  return { approved, pending, rejected, labels };
}

// ── CHART CARD ────────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, records, colorScheme }) {
  const [view, setView] = useState("weekly");
  const agg = aggregate(records, view);

  const mainColor    = colorScheme === "orange" ? "#B45A22" : "#1c4f09";
  const activeStyle  = colorScheme === "orange"
    ? { background: "rgba(180,90,34,0.12)", borderColor: "rgba(180,90,34,0.38)", color: "#B45A22" }
    : { background: "rgba(90,170,48,0.13)", borderColor: "rgba(90,170,48,0.38)", color: "#1c4f09" };

  const legendItems = [
    { label: "Approved (bars)", color: mainColor },
    { label: "Pending (bars)",  color: "#d4880a" },
    { label: "Rejected (line)", color: colorScheme === "orange" ? "#e07830" : "#5aaa30" },
  ];

  const timestamps = records.map(r => r.created_at ? new Date(r.created_at).getDate() : null).filter(Boolean);

  return (
    <div style={{ background: "rgba(255,248,225,0.85)", border: "1.5px solid rgba(180,140,60,0.22)", borderRadius: 12, padding: "18px 20px", backdropFilter: "blur(12px)", boxShadow: "0 2px 10px rgba(100,70,20,0.08)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a4a08" }}>{title}</div>
          <div style={{ fontSize: "0.70rem", fontWeight: 700, color: "#6a7a50", marginTop: 1 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {["weekly","monthly","yearly"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? activeStyle.background : "none",
              border: `1.5px solid ${view === v ? activeStyle.borderColor : "rgba(180,140,60,0.22)"}`,
              borderRadius: 7, padding: "3px 9px",
              fontFamily: "'Nunito',sans-serif", fontSize: "0.68rem", fontWeight: 800,
              color: view === v ? activeStyle.color : "#6a7a50", cursor: "pointer", transition: "all 0.14s", textTransform: "capitalize",
            }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
        {legendItems.map(({ label, color }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, color: "#6a7a50" }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: "inline-block" }} />{label}
          </span>
        ))}
      </div>

      <ComboBarLineChart data={agg} labels={agg.labels} colorScheme={colorScheme} />
      <DensityPlot data={timestamps} color={mainColor} colorScheme={colorScheme} />
    </div>
  );
}

// ── RECENT REQUEST ROW ────────────────────────────────────────────────────────
function ReqMini({ name, detail, status, type }) {
  const ico = type === "rehome"
    ? { color: "#d4880a", icon: "🏠", bg: "rgba(212,136,10,0.12)" }
    : { color: "#1c4f09", icon: "❤️", bg: "rgba(90,170,48,0.12)" };
  const statusStyle = {
    pending:  { bg: "rgba(212,136,10,0.15)", color: "#d4880a" },
    approved: { bg: "rgba(90,170,48,0.14)",  color: "#1c4f09" },
    rejected: { bg: "rgba(192,48,48,0.12)",  color: "#c03030" },
  }[(status||"").toLowerCase()] || { bg: "rgba(180,140,60,0.11)", color: "#6a7a50" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:9, background:"rgba(255,250,230,0.50)", borderLeft:`3px solid ${ico.color}`, marginBottom:5, cursor:"pointer", transition:"background 0.14s" }}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,250,230,0.88)"}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,250,230,0.50)"}>
      <div style={{ width:28, height:28, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"0.8rem", background:ico.bg }}>{ico.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <strong style={{ display:"block", fontSize:"0.80rem", fontWeight:800, color:"#1a4a08", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</strong>
        <small style={{ fontSize:"0.68rem", fontWeight:700, color:"#6a7a50" }}>{detail}</small>
      </div>
      <div style={{ fontSize:"0.65rem", fontWeight:900, padding:"2px 7px", borderRadius:20, flexShrink:0, background:statusStyle.bg, color:statusStyle.color, textTransform:"capitalize" }}>{status}</div>
    </div>
  );
}

// ── LIVE BADGE ────────────────────────────────────────────────────────────────
function LiveBadge({ lastUpdated, polling }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem", fontWeight:700, color:"#6a7a50" }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:polling?"#d4880a":"#5aaa30", display:"inline-block", boxShadow:polling?"none":"0 0 0 3px rgba(90,170,48,0.2)" }} />
      {polling ? "Refreshing…" : "Live"}
      {lastUpdated && !polling && <span style={{ color:"#9aaa80", marginLeft:4 }}>· {lastUpdated.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
    </div>
  );
}

// ── MAIN DASHBOARD PANEL ──────────────────────────────────────────────────────
export default function DashboardPanel({ stats = {}, onNav, user }) {
  const [adoptions,   setAdoptions]   = useState([]);
  const [rehomings,   setRehomings]   = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [animalCount, setAnimalCount] = useState(null);
  const [polling,     setPolling]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const healthy   = stats.health_healthy   || 0;
  const care      = stats.health_care      || 0;
  const treatment = stats.health_treatment || 0;

  const fetchData = useCallback(async () => {
    setPolling(true);
    try {
      const [aRes, rRes] = await Promise.all([djFetch("/api/approvals/adoptions/admin/"), djFetch("/api/approvals/rehoming/admin/")]);
      if (aRes.ok) { const d = await aRes.json(); setAdoptions(d.data || d || []); }
      if (rRes.ok) { const d = await rRes.json(); setRehomings(d.data || d || []); }
      try { const sRes = await springFetch("/api/animals?limit=1"); if (sRes.ok) { const sData = await sRes.json(); setAnimalCount(Array.isArray(sData) ? sData.length : sData.totalElements || (sData.content||[]).length); } } catch {}
      try { const uRes = await fetch("/php/admin/dashboard",{method:"POST",body:(() => { const f=new FormData(); f.append("action","get_users"); f.append("role","all"); return f; })(),credentials:"include"}); if (uRes.ok) { const uData = await uRes.json(); if (uData.success) setRecentUsers((uData.data||[]).slice(0,5)); } } catch {}
      setLastUpdated(new Date());
    } catch(e) { console.warn("[DashboardPanel] fetch error:", e); }
    setPolling(false);
  }, []);

  useEffect(() => { fetchData(); const id = setInterval(fetchData, POLL_INTERVAL); return () => clearInterval(id); }, [fetchData]);

  const adoptPending  = adoptions.filter(r=>(r.status||"").toLowerCase()==="pending").length;
  const rehomePending = rehomings.filter(r=>(r.status||"").toLowerCase()==="pending").length;
  const recentAdopt   = [...adoptions].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  const recentRehome  = [...rehomings].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  const totalAnimals  = animalCount ?? stats.animals ?? 0;

  const adoptStatusItems = [
    { label:"Approved", valA:adoptions.filter(r=>r.status?.toLowerCase()==="approved").length, valB:rehomings.filter(r=>r.status?.toLowerCase()==="approved").length },
    { label:"Pending",  valA:adoptPending, valB:rehomePending },
    { label:"Rejected", valA:adoptions.filter(r=>r.status?.toLowerCase()==="rejected").length, valB:rehomings.filter(r=>r.status?.toLowerCase()==="rejected").length },
    { label:"Total",    valA:adoptions.length, valB:rehomings.length },
  ];

  const statCards = [
    { val:totalAnimals,       label:"Total Animals",     sub:"↑ Active listings",          theme:"green",  panel:"animals",   icon:"🐾" },
    { val:adoptions.length,   label:"Adoption Requests", sub:`⏱ ${adoptPending} pending`,  subWarn:adoptPending>0,  theme:"orange", panel:"adoptions", icon:"❤️" },
    { val:rehomings.length,   label:"Rehome Requests",   sub:`⏱ ${rehomePending} pending`, subWarn:rehomePending>0, theme:"amber",  panel:"rehome",    icon:"🏠" },
    { val:stats.users??"—",   label:"Registered Users",  sub:"👤 All accounts",            theme:"purple", panel:"users",     icon:"👥" },
  ];

  const dashCard = { background:"rgba(255,248,225,0.85)", border:"1.5px solid rgba(180,140,60,0.22)", borderRadius:12, padding:"18px 20px", backdropFilter:"blur(12px)", boxShadow:"0 2px 10px rgba(100,70,20,0.08)" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, animation:"fadeUp 0.25s ease both", fontFamily:"'Nunito',sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:"1.45rem", fontWeight:800, color:"#1a4a08", margin:0 }}>Good day, {user?.firstName}! 🐾</h2>
          <p style={{ color:"#6a7a50", fontSize:"0.82rem", fontWeight:700, marginTop:3, margin:0 }}>Here's what's happening at the shelter today.</p>
        </div>
        <LiveBadge lastUpdated={lastUpdated} polling={polling} />
      </div>

      {/* Row 1 — stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {statCards.map(c => <StatCard key={c.panel} {...c} onClick={() => onNav(c.panel)} />)}
      </div>

      {/* Row 2 — charts + right panel */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 300px", gap:14 }}>
        <ChartCard title="Adoption Activity" subtitle="Bars: Approved & Pending · Line: Rejected rate" records={adoptions} colorScheme="green" />
        <ChartCard title="Rehome Activity"   subtitle="Bars: Approved & Pending · Line: Rejected rate" records={rehomings}  colorScheme="orange" />

        <div style={dashCard}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:"0.88rem", fontWeight:800, color:"#1a4a08" }}>Requests by Status</div>
            <div style={{ fontSize:"0.70rem", fontWeight:700, color:"#6a7a50", marginTop:1 }}>Adoptions vs Rehomes</div>
          </div>
          <div style={{ display:"flex", gap:12, marginBottom:10 }}>
            {[{label:"Adoptions",color:"#1c4f09"},{label:"Rehomes",color:"#d4880a"}].map(l=>(
              <span key={l.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:"0.68rem", fontWeight:700, color:"#6a7a50" }}>
                <span style={{ width:9, height:9, borderRadius:2, background:l.color, display:"inline-block" }} />{l.label}
              </span>
            ))}
          </div>
          <HorizontalBarChart items={adoptStatusItems} colorA="#1c4f09" colorB="#d4880a" />
          <div style={{ borderTop:"1px solid rgba(180,140,60,0.14)", paddingTop:14, marginTop:14 }}>
            <div style={{ fontSize:"0.82rem", fontWeight:800, color:"#1a4a08", marginBottom:10 }}>Animal Health</div>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <DonutChart healthy={healthy} care={care} treatment={treatment} />
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {[{label:"Healthy",val:healthy,color:"#5aaa30"},{label:"Needs Care",val:care,color:"#c87820"},{label:"Treatment",val:treatment,color:"#8957e5"}].map(l=>(
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.75rem", fontWeight:700, color:"#3a5020" }}>
                    <span style={{ width:9, height:9, borderRadius:2, flexShrink:0, background:l.color }} />
                    {l.label}
                    <b style={{ marginLeft:"auto", color:"#1a4a08", fontWeight:900, paddingLeft:8 }}>{l.val}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — recent lists */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {/* Recent adoptions */}
        <div style={dashCard}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div><div style={{ fontSize:"0.88rem", fontWeight:800, color:"#1a4a08" }}>Recent Adoptions</div><div style={{ fontSize:"0.70rem", fontWeight:700, color:"#6a7a50", marginTop:1 }}>Latest requests</div></div>
            <button onClick={()=>onNav("adoptions")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"0.74rem", fontWeight:800, color:"#c87820" }}
              onMouseEnter={e=>{e.currentTarget.style.opacity="0.72";e.currentTarget.style.textDecoration="underline";}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.textDecoration="none";}}>View All</button>
          </div>
          {recentAdopt.length>0 ? recentAdopt.map((r,i)=><ReqMini key={i} name={r.name||"Unknown"} detail={r.animal_name||"Adoption request"} status={r.status||"Pending"} type="adoption" />) : <div style={{ textAlign:"center", padding:"28px 0", color:"#9aaa80", fontSize:"0.82rem", fontWeight:700 }}>❤️ No recent requests</div>}
        </div>

        {/* Recent rehomes */}
        <div style={dashCard}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div><div style={{ fontSize:"0.88rem", fontWeight:800, color:"#1a4a08" }}>Recent Rehomes</div><div style={{ fontSize:"0.70rem", fontWeight:700, color:"#6a7a50", marginTop:1 }}>Latest requests</div></div>
            <button onClick={()=>onNav("rehome")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"0.74rem", fontWeight:800, color:"#c87820" }}
              onMouseEnter={e=>{e.currentTarget.style.opacity="0.72";e.currentTarget.style.textDecoration="underline";}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.textDecoration="none";}}>View All</button>
          </div>
          {recentRehome.length>0 ? recentRehome.map((r,i)=><ReqMini key={i} name={r.pet_name||"Unknown Pet"} detail={r.reason||`by ${r.contact||"—"}`} status={r.status||"Pending"} type="rehome" />) : <div style={{ textAlign:"center", padding:"28px 0", color:"#9aaa80", fontSize:"0.82rem", fontWeight:700 }}>🏠 No recent rehomes</div>}
        </div>

        {/* Recent users */}
        <div style={dashCard}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div><div style={{ fontSize:"0.88rem", fontWeight:800, color:"#1a4a08" }}>Recent Users</div><div style={{ fontSize:"0.70rem", fontWeight:700, color:"#6a7a50", marginTop:1 }}>Newly registered</div></div>
            <button onClick={()=>onNav("users")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"0.74rem", fontWeight:800, color:"#c87820" }}
              onMouseEnter={e=>{e.currentTarget.style.opacity="0.72";e.currentTarget.style.textDecoration="underline";}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.textDecoration="none";}}>View All</button>
          </div>
          {recentUsers.length>0
            ? recentUsers.map((u,i) => {
                const name = `${u.first_name||""} ${u.last_name||""}`.trim();
                const rs = u.role==="admin" ? {bg:"rgba(122,61,192,0.12)",color:"#7a3dc0"} : {bg:"rgba(32,96,160,0.10)",color:"#2060a0"};
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:9, background:"rgba(255,250,230,0.50)", marginBottom:5, cursor:"pointer", transition:"background 0.14s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,250,230,0.88)"}
                    onMouseLeave={e=>e.currentTarget.style.background="rgba(255,250,230,0.50)"}>
                    <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#1c4f09,#2a7010)", border:"2px solid #5aaa30", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"0.76rem", fontWeight:900 }}>
                      {name?.charAt(0)?.toUpperCase()||"?"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <strong style={{ display:"block", fontSize:"0.78rem", fontWeight:800, color:"#1a4a08", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name||"—"}</strong>
                      <small style={{ fontSize:"0.67rem", fontWeight:700, color:"#6a7a50", overflow:"hidden", textOverflow:"ellipsis", display:"block" }}>{u.email}</small>
                    </div>
                    <div style={{ fontSize:"0.64rem", fontWeight:900, padding:"2px 7px", borderRadius:20, background:rs.bg, color:rs.color, flexShrink:0, textTransform:"capitalize" }}>{u.role}</div>
                  </div>
                );
              })
            : <div style={{ textAlign:"center", padding:"28px 0", color:"#9aaa80", fontSize:"0.82rem", fontWeight:700 }}>👤 No user data</div>}
        </div>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}