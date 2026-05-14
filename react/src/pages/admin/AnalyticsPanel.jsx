// ── ANALYTICS PANEL — formal design, Pawster color scheme
// Line charts + Scatter plots (separate), date filters
import { useState, useEffect, useRef, useCallback } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

const DJANGO = import.meta.env.VITE_DJANGO_API_URL ?? "http://localhost:8000";
const POLL_INTERVAL = 30_000;

function getToken() {
  return localStorage.getItem("pawster_token") || localStorage.getItem("token") ||
    localStorage.getItem("authToken") || sessionStorage.getItem("token") || "";
}
function djFetch(path) {
  const token = getToken();
  return fetch(`${DJANGO}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  card:          { background: "rgba(255,248,225,0.85)", border: "1.5px solid rgba(180,140,60,0.22)", borderRadius: 12, backdropFilter: "blur(12px)", boxShadow: "0 2px 10px rgba(100,70,20,0.08)" },
  textPrimary:   "#1a4a08",
  textSecondary: "#6a7a50",
  textTertiary:  "#9aaa80",
  gridLine:      "rgba(180,140,60,0.12)",
  // per-series colors
  adopt:  { approved: "#1c4f09", pending: "#d4880a", rejected: "#b03060" },
  rehome: { approved: "#1a8a6a", pending: "#d4880a", rejected: "#b03060" },
};

// ── UTILITIES ─────────────────────────────────────────────────────────────────
const WEEK_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEAR_LABELS  = ["2021","2022","2023","2024","2025","2026"];

function aggregate(records, view) {
  const now = new Date();
  const empty = n => Array(n).fill(0);
  let approved, pending, rejected, labels;

  if (view === "weekly") {
    approved = empty(7); pending = empty(7); rejected = empty(7); labels = WEEK_LABELS;
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    records.forEach(r => {
      if (!r.created_at) return;
      const idx = Math.floor((new Date(r.created_at) - monday) / 86400000);
      if (idx < 0 || idx > 6) return;
      const s = (r.status || "").toLowerCase();
      if (s === "approved") approved[idx]++;
      else if (s === "rejected") rejected[idx]++;
      else pending[idx]++;
    });
  } else if (view === "monthly") {
    approved = empty(12); pending = empty(12); rejected = empty(12); labels = MONTH_LABELS;
    records.forEach(r => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      if (d.getFullYear() !== now.getFullYear()) return;
      const s = (r.status || "").toLowerCase();
      if (s === "approved") approved[d.getMonth()]++;
      else if (s === "rejected") rejected[d.getMonth()]++;
      else pending[d.getMonth()]++;
    });
  } else {
    approved = empty(6); pending = empty(6); rejected = empty(6); labels = YEAR_LABELS;
    records.forEach(r => {
      if (!r.created_at) return;
      const idx = new Date(r.created_at).getFullYear() - 2021;
      if (idx < 0 || idx > 5) return;
      const s = (r.status || "").toLowerCase();
      if (s === "approved") approved[idx]++;
      else if (s === "rejected") rejected[idx]++;
      else pending[idx]++;
    });
  }
  return { approved, pending, rejected, labels };
}

function filterRecords(records, selectedYear, dateRange) {
  return records.filter(r => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    if (dateRange.from && d < new Date(dateRange.from)) return false;
    if (dateRange.to   && d > new Date(dateRange.to + "T23:59:59")) return false;
    if (selectedYear !== "all" && d.getFullYear() !== Number(selectedYear)) return false;
    return true;
  });
}

// ── LINE CHART ────────────────────────────────────────────────────────────────
function LineChart({ agg, colors }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const hitRef    = useRef([]);
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, lines: [] });

  const PAD = { l: 38, r: 16, t: 18, b: 30 };

  function buildCurvePath(ctx, pts) {
    if (pts.length < 2) return;
    const tension = 0.3;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth || 400;
    canvas.width  = W * devicePixelRatio;
    canvas.height = 220 * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const cW = W - PAD.l - PAD.r;
    const cH = 220 - PAD.t - PAD.b;

    const allVals = [...agg.approved, ...agg.pending, ...agg.rejected];
    const maxVal  = Math.max(...allVals, 1);
    const n = agg.labels.length;
    const hits = [];

    ctx.clearRect(0, 0, W, 220);

    // Grid & y-labels
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + cH - (i / 4) * cH;
      ctx.strokeStyle = T.gridLine; ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + cW, y); ctx.stroke();
      ctx.fillStyle = T.textTertiary;
      ctx.font = "700 9px 'Nunito',sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round((i / 4) * maxVal), PAD.l - 4, y + 3);
    }

    // X-labels
    agg.labels.forEach((lbl, i) => {
      const x = n > 1 ? PAD.l + (i / (n - 1)) * cW : PAD.l + cW / 2;
      ctx.fillStyle = T.textTertiary;
      ctx.font = "700 9px 'Nunito',sans-serif"; ctx.textAlign = "center";
      ctx.fillText(lbl, x, 220 - 8);
    });

    function drawWaveLine(data, color, dashed) {
      const pts = data.map((val, i) => ({
        x: n > 1 ? PAD.l + (i / (n - 1)) * cW : PAD.l + cW / 2,
        y: PAD.t + cH - (val / maxVal) * cH,
      }));

      // Gradient fill under the wave
      const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + cH);
      grad.addColorStop(0,   color + "4d");
      grad.addColorStop(0.5, color + "1f");
      grad.addColorStop(1,   color + "00");
      ctx.save();
      ctx.beginPath();
      buildCurvePath(ctx, pts);
      ctx.lineTo(pts[pts.length - 1].x, PAD.t + cH);
      ctx.lineTo(pts[0].x, PAD.t + cH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Main wave line
      ctx.save();
      ctx.beginPath();
      buildCurvePath(ctx, pts);
      ctx.setLineDash(dashed ? [5, 3] : []);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();

      // Dot markers
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,248,220,0.95)";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        const seriesName = color === colors.approved ? "Approved"
                         : color === colors.pending  ? "Pending"
                         : "Rejected";
        hits.push({ x: p.x - 12, y: p.y - 12, w: 24, h: 24, lbl: agg.labels[i], series: seriesName, val: data[i], color });
      });
    }

    drawWaveLine(agg.rejected, colors.rejected, false);
    drawWaveLine(agg.pending,  colors.pending,  true);
    drawWaveLine(agg.approved, colors.approved, false);

    hitRef.current = hits;
  }, [agg, colors]);

  const handleMouseMove = useCallback(e => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = (canvas.width / devicePixelRatio) / rect.width;
    const scaleY = (canvas.height / devicePixelRatio) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const hit = hitRef.current.find(r => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
    const wRect = wrap.getBoundingClientRect();
    if (hit) setTip({ visible: true, x: e.clientX - wRect.left, y: e.clientY - wRect.top, lines: [{ text: hit.lbl, bold: true }, { text: `${hit.series}: ${hit.val}`, color: hit.color }] });
    else setTip(t => ({ ...t, visible: false }));
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", cursor: "crosshair" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: 220, display: "block" }} />
      {tip.visible && (
        <div style={{
          position: "absolute", left: tip.x, top: tip.y,
          transform: "translate(-50%, calc(-100% - 10px))",
          background: "rgba(26,74,8,0.96)", border: "1px solid rgba(90,170,48,0.30)",
          borderRadius: 8, padding: "7px 12px", pointerEvents: "none", zIndex: 200,
          boxShadow: "0 6px 20px rgba(0,0,0,0.22)", minWidth: 130,
        }}>
          {tip.lines.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: i < tip.lines.length - 1 ? 3 : 0 }}>
              {l.color && <span style={{ width: 7, height: 7, borderRadius: 2, background: l.color, flexShrink: 0 }} />}
              <span style={{ fontSize: "0.70rem", fontWeight: l.bold ? 900 : 700, color: l.bold ? "rgba(255,248,220,0.95)" : "rgba(255,248,220,0.65)", whiteSpace: "nowrap" }}>{l.text}</span>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgba(26,74,8,0.96)" }} />
        </div>
      )}
    </div>
  );
}

// ── SCATTER PLOT ──────────────────────────────────────────────────────────────
function ScatterPlot({ records, colors }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const hitRef    = useRef([]);
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, text: "" });

  const PAD = { l: 58, r: 16, t: 14, b: 30 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth || 400;
    canvas.width  = W * devicePixelRatio;
    canvas.height = 220 * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const cW = W - PAD.l - PAD.r;
    const cH = 220 - PAD.t - PAD.b;
    ctx.clearRect(0, 0, W, 220);

    const times = records.map(r => r.created_at ? new Date(r.created_at).getTime() : null).filter(Boolean);
    const minT = times.length ? Math.min(...times) : Date.now() - 86400000 * 90;
    const maxT = times.length ? Math.max(...times) : Date.now();
    const tRange = maxT - minT || 1;

    // Y: status rows
    const statusY = { approved: 0.20, pending: 0.50, rejected: 0.80 };
    const statusColors = { approved: colors.approved, pending: colors.pending, rejected: colors.rejected };
    const statusLabels = { approved: "Approved", pending: "Pending", rejected: "Rejected" };

    // Draw dashed guide lines + y-labels
    Object.entries(statusY).forEach(([s, pct]) => {
      const y = PAD.t + cH * pct;
      ctx.strokeStyle = T.gridLine; ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + cW, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = T.textSecondary;
      ctx.font = "700 9px 'Nunito',sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(statusLabels[s], PAD.l - 5, y + 3);
    });

    // X-axis: monthly ticks
    const startDate = new Date(minT);
    const endDate   = new Date(maxT);
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    ctx.strokeStyle = T.gridLine; ctx.lineWidth = 0.5;
    while (d <= endDate) {
      const x = PAD.l + ((d.getTime() - minT) / tRange) * cW;
      if (x >= PAD.l && x <= PAD.l + cW) {
        ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + cH); ctx.stroke();
        ctx.fillStyle = T.textTertiary;
        ctx.font = "700 9px 'Nunito',sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.toLocaleString("default", { month: "short" }), x, 220 - 8);
      }
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }

    // Plot points
    const hits = [];
    records.forEach(r => {
      if (!r.created_at) return;
      const t = new Date(r.created_at).getTime();
      const s = (r.status || "pending").toLowerCase();
      const pct = statusY[s] || 0.5;
      const jitter = (Math.random() - 0.5) * (cH * 0.12);
      const x = PAD.l + ((t - minT) / tRange) * cW;
      const y = PAD.t + cH * pct + jitter;
      const cy2 = Math.max(PAD.t + 4, Math.min(PAD.t + cH - 4, y));

      ctx.beginPath();
      ctx.arc(x, cy2, 4, 0, Math.PI * 2);
      ctx.fillStyle = statusColors[s] || colors.pending;
      ctx.globalAlpha = 0.60;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = statusColors[s] || colors.pending;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      hits.push({ x: x - 8, y: cy2 - 8, w: 16, h: 16, s, t, color: statusColors[s] || colors.pending });
    });
    hitRef.current = hits;
  }, [records, colors]);

  const handleMouseMove = useCallback(e => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = (canvas.width / devicePixelRatio) / rect.width;
    const scaleY = (canvas.height / devicePixelRatio) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const hit = hitRef.current.find(r => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
    const wRect = wrap.getBoundingClientRect();
    if (hit) {
      const date = new Date(hit.t).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
      setTip({ visible: true, x: e.clientX - wRect.left, y: e.clientY - wRect.top, text: `${hit.s.charAt(0).toUpperCase() + hit.s.slice(1)} · ${date}`, color: hit.color });
    } else {
      setTip(t => ({ ...t, visible: false }));
    }
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative", cursor: "crosshair" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: 220, display: "block" }} />
      {tip.visible && (
        <div style={{
          position: "absolute", left: tip.x, top: tip.y,
          transform: "translate(-50%, calc(-100% - 10px))",
          background: "rgba(26,74,8,0.96)", border: "1px solid rgba(90,170,48,0.30)",
          borderRadius: 8, padding: "6px 11px", pointerEvents: "none", zIndex: 200,
          boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: tip.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.70rem", fontWeight: 700, color: "rgba(255,248,220,0.85)", whiteSpace: "nowrap" }}>{tip.text}</span>
          </div>
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgba(26,74,8,0.96)" }} />
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function LiveBadge({ lastUpdated, polling }) {
  return (
    <div className="an-live-badge" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: polling ? "#d4880a" : "#5aaa30", display: "inline-block", boxShadow: polling ? "none" : "0 0 0 3px rgba(90,170,48,0.2)" }} />
      {polling ? "Refreshing…" : "Live · auto-refreshes every 30s"}
      {lastUpdated && !polling && <span style={{ color: "#9aaa80", marginLeft: 4 }}>· {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
    </div>
  );
}

function ViewTabs({ view, onChange, colorKey }) {
  const activeColor = colorKey === "adopt" ? "#1c4f09" : "#1a8a6a";
  return (
    <div className="an-view-tabs" style={{ display: "flex", gap: 3, background: "rgba(180,140,60,0.10)", borderRadius: 8, padding: 3 }}>
      {["weekly", "monthly", "yearly"].map(v => {
        const isActive = view === v;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{
              background: isActive ? "rgba(255,248,220,0.90)" : "none",
              border: isActive ? `1px solid rgba(180,140,60,0.30)` : "1px solid transparent",
              borderRadius: 6, padding: "3px 10px",
              fontFamily: "'Nunito',sans-serif", fontSize: "0.68rem", fontWeight: 800,
              color: isActive ? activeColor : "#6a7a50", cursor: "pointer",
              textTransform: "capitalize",
            }}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

function Legend({ colors }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
      {[["Approved", colors.approved, false], ["Pending", colors.pending, true], ["Rejected", colors.rejected, false]].map(([lbl, color, dashed]) => (
        <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: "#6a7a50" }}>
          <span style={{ width: 18, height: 2, background: dashed ? "none" : color, borderTop: dashed ? `2px dashed ${color}` : "none", display: "inline-block" }} />
          {lbl}
        </span>
      ))}
    </div>
  );
}

function ScatterLegend({ colors }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
      {Object.entries(colors).map(([key, color]) => (
        <span key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: "#6a7a50" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", opacity: 0.75 }} />
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </span>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, sub, accentColor, bgColor }) {
  return (
    <div style={{ background: bgColor, border: `1px solid ${accentColor}22`, borderRadius: 12, padding: "14px 16px" }}>
      <div className="an-summary-val" style={{ fontSize: "1.55rem", fontWeight: 900, color: accentColor, lineHeight: 1, fontFamily: "'Playfair Display',Georgia,serif" }}>{value}</div>
      <div style={{ fontSize: "0.70rem", fontWeight: 800, color: "#6a7a50", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9aaa80", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function FilterBar({ years, selectedYear, onYearChange, dateRange, onDateRangeChange, isActive }) {
  const inputStyle = {
    background: "rgba(255,248,220,0.90)", border: "1.5px solid rgba(180,140,60,0.25)",
    borderRadius: 7, padding: "5px 8px", fontFamily: "'Nunito',sans-serif",
    fontSize: "0.69rem", fontWeight: 700, color: "#3a5020", outline: "none",
  };
  const selectStyle = {
    ...inputStyle,
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236a7a50' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
    paddingRight: 28, minWidth: 110, cursor: "pointer",
  };
  return (
    <div className="an-filter-bar" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.67rem", fontWeight: 900, color: "#9aaa80", letterSpacing: "0.05em" }}>YEAR</span>
      <select style={selectStyle} value={selectedYear} onChange={e => onYearChange(e.target.value === "all" ? "all" : Number(e.target.value))}>
        <option value="all">All Years</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <div style={{ width: 1, height: 18, background: "rgba(180,140,60,0.20)", margin: "0 2px" }} />
      <span style={{ fontSize: "0.67rem", fontWeight: 900, color: "#9aaa80" }}>FROM</span>
      <input type="date" style={inputStyle} value={dateRange.from} onChange={e => onDateRangeChange({ ...dateRange, from: e.target.value })} />
      <span style={{ fontSize: "0.67rem", fontWeight: 900, color: "#9aaa80" }}>TO</span>
      <input type="date" style={inputStyle} value={dateRange.to} onChange={e => onDateRangeChange({ ...dateRange, to: e.target.value })} />
      {isActive && (
        <button
          onClick={() => { onDateRangeChange({ from: "", to: "" }); onYearChange("all"); }}
          style={{ background: "rgba(176,48,96,0.08)", border: "1.5px solid rgba(176,48,96,0.25)", borderRadius: 7, padding: "4px 10px", fontFamily: "'Nunito',sans-serif", fontSize: "0.68rem", fontWeight: 800, color: "#b03060", cursor: "pointer" }}
        >
          Clear
        </button>
      )}
      {isActive && (
        <span style={{ marginLeft: "auto", fontSize: "0.67rem", fontWeight: 900, color: "#B45A22", background: "rgba(180,90,34,0.12)", border: "1px solid rgba(180,90,34,0.25)", borderRadius: 20, padding: "2px 9px" }}>
          Filter active
        </span>
      )}
    </div>
  );
}

// ── MAIN ANALYTICS PANEL ──────────────────────────────────────────────────────
export default function AnalyticsPanel({ show }) {
  const [adoptions,   setAdoptions]   = useState([]);
  const [rehomings,   setRehomings]   = useState([]);
  const [polling,     setPolling]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [adoptView,   setAdoptView]   = useState("weekly");
  const [rehomeView,  setRehomeView]  = useState("weekly");
  const [selectedYear, setSelectedYear] = useState("all");
  const [dateRange,    setDateRange]    = useState({ from: "", to: "" });

  usePageTitle("Analytics Dashboard");

  const fetchData = useCallback(async () => {
    setPolling(true);
    try {
      const [aRes, rRes] = await Promise.all([
        djFetch("/api/approvals/adoptions/admin/"),
        djFetch("/api/approvals/rehoming/admin/"),
      ]);
      if (aRes.ok) { const d = await aRes.json(); setAdoptions(d.data || d || []); }
      if (rRes.ok) { const d = await rRes.json(); setRehomings(d.data || d || []); }
      setLastUpdated(new Date());
    } catch (e) { console.warn("[AnalyticsPanel] fetch error:", e); }
    setPolling(false);
  }, []);

  useEffect(() => {
    if (!show) return;
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [show, fetchData]);

  const handleYearChange = y => {
    setSelectedYear(y);
    if (y !== "all") setDateRange({ from: "", to: "" });
  };
  const handleDateRangeChange = dr => {
    setDateRange(dr);
    if (dr.from || dr.to) setSelectedYear("all");
  };

  const isFilterActive = selectedYear !== "all" || dateRange.from || dateRange.to;

  const filteredAdopt  = filterRecords(adoptions,  selectedYear, dateRange);
  const filteredRehome = filterRecords(rehomings,  selectedYear, dateRange);

  const aggAdopt  = aggregate(filteredAdopt,  adoptView);
  const aggRehome = aggregate(filteredRehome, rehomeView);

  // Available years
  const currentYear = new Date().getFullYear();
  const dataYears = [...new Set([...adoptions, ...rehomings].filter(r => r.created_at).map(r => new Date(r.created_at).getFullYear()))];
  const allYearsSet = new Set(dataYears);
  for (let y = 2021; y <= currentYear + 1; y++) allYearsSet.add(y);
  const availableYears = [...allYearsSet].sort((a, b) => b - a);

  const adoptPending  = adoptions.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const rehomePending = rehomings.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const adoptApproved = adoptions.filter(r => (r.status || "").toLowerCase() === "approved").length;
  const approvalRate  = adoptions.length ? Math.round((adoptApproved / adoptions.length) * 100) : 0;

  const statusRows = [
    { label: "Approved", adoptVal: adoptApproved, rehomeVal: rehomings.filter(r => r.status?.toLowerCase() === "approved").length },
    { label: "Pending",  adoptVal: adoptPending,  rehomeVal: rehomePending },
    { label: "Rejected", adoptVal: adoptions.filter(r => r.status?.toLowerCase() === "rejected").length, rehomeVal: rehomings.filter(r => r.status?.toLowerCase() === "rejected").length },
    { label: "Total",    adoptVal: adoptions.length, rehomeVal: rehomings.length },
  ];

  const dashCard = { ...T.card, padding: "18px 20px" };

  const sectionTitle = (text) => (
    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: T.textPrimary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
      {text}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: "'Nunito',sans-serif", animation: "fadeUp 0.25s ease both" }}>

      {/* ── Header */}
      <div className="an-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.45rem", fontWeight: 800, color: T.textPrimary, margin: 0 }}>Analytics</h2>
          
        </div>
        <LiveBadge lastUpdated={lastUpdated} polling={polling} />
      </div>

      {/* ── Summary cards */}
      <div className="an-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <SummaryCard label="Total Adoptions"   value={adoptions.length}  sub={`${adoptPending} pending`}        accentColor="#1c4f09" bgColor="rgba(90,170,48,0.10)"    />
        <SummaryCard label="Total Rehomings"   value={rehomings.length}  sub={`${rehomePending} pending`}       accentColor="#d4880a" bgColor="rgba(212,136,10,0.10)"   />
        <SummaryCard label="In Filtered View"  value={filteredAdopt.length + filteredRehome.length} sub={`${filteredAdopt.length} adopt · ${filteredRehome.length} rehome`} accentColor="#1a8a6a" bgColor="rgba(26,138,106,0.10)" />
        <SummaryCard label="Approval Rate"     value={`${approvalRate}%`} sub="Adoption approvals"             accentColor="#7a3dc0" bgColor="rgba(122,61,192,0.10)"   />
      </div>

      {/* ── Filters */}
      <div style={{ ...dashCard, padding: "14px 18px" }}>
        {sectionTitle("Filters — applied to all charts below")}
        <FilterBar
          years={availableYears} selectedYear={selectedYear} onYearChange={handleYearChange}
          dateRange={dateRange} onDateRangeChange={handleDateRangeChange} isActive={isFilterActive}
        />
      </div>

      {/* ── Line charts */}
      <div className="an-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Adoption line chart */}

        {/* Adoption line chart */}
        <div style={dashCard}>
          <div className="an-chart-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: T.textPrimary }}>Adoption Activity</div>
              <div style={{ fontSize: "0.70rem", fontWeight: 700, color: T.textSecondary, marginTop: 2 }}>Requests over time by status</div>
            </div>
            <ViewTabs view={adoptView} onChange={setAdoptView} colorKey="adopt" />
          </div>
          <Legend colors={T.adopt} />
          <LineChart agg={aggAdopt} colors={T.adopt} />
        </div>

        {/* Rehome line chart */}
        <div style={dashCard}>
          <div className="an-chart-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: T.textPrimary }}>Rehoming Activity</div>
              <div style={{ fontSize: "0.70rem", fontWeight: 700, color: T.textSecondary, marginTop: 2 }}>Requests over time by status</div>
            </div>
            <ViewTabs view={rehomeView} onChange={setRehomeView} colorKey="rehome" />
          </div>
          <Legend colors={T.rehome} />
          <LineChart agg={aggRehome} colors={T.rehome} />
        </div>
      </div>

      {/* ── Scatter plots */}
       <div className="an-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>


        {/* Adoption scatter */}
        <div style={dashCard}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: T.textPrimary }}>Adoption Distribution</div>
            <div style={{ fontSize: "0.70rem", fontWeight: 700, color: T.textSecondary, marginTop: 2 }}>Each point represents one request</div>
          </div>
          <ScatterLegend colors={T.adopt} />
          <ScatterPlot records={filteredAdopt} colors={T.adopt} />
        </div>

        {/* Rehome scatter */}
        <div style={dashCard}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: T.textPrimary }}>Rehoming Distribution</div>
            <div style={{ fontSize: "0.70rem", fontWeight: 700, color: T.textSecondary, marginTop: 2 }}>Each point represents one request</div>
          </div>
          <ScatterLegend colors={T.rehome} />
          <ScatterPlot records={filteredRehome} colors={T.rehome} />
        </div>
      </div>

      {/* ── Status breakdown table */}
      <div style={dashCard}>
        {sectionTitle("Status Breakdown — Adoptions vs Rehomings")}
        <table className="an-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid rgba(180,140,60,0.22)" }}>
              {["Status", "Adoptions", "Rehomings", "Total"].map((h, i) => (
                <th key={h} style={{ padding: "7px 10px", textAlign: i === 0 ? "left" : "right", fontSize: "0.68rem", fontWeight: 900, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statusRows.map((row, i) => {
              const isTotal = row.label === "Total";
              return (
                <tr key={row.label} style={{ borderBottom: i < statusRows.length - 1 ? "1px solid rgba(180,140,60,0.10)" : "none", background: isTotal ? "rgba(180,140,60,0.06)" : "transparent" }}>
                  <td style={{ padding: "9px 10px", fontSize: "0.80rem", fontWeight: isTotal ? 900 : 700, color: T.textPrimary }}>{row.label}</td>
                  <td style={{ padding: "9px 10px", fontSize: "0.80rem", fontWeight: isTotal ? 900 : 700, color: "#1c4f09", textAlign: "right" }}>{row.adoptVal}</td>
                  <td style={{ padding: "9px 10px", fontSize: "0.80rem", fontWeight: isTotal ? 900 : 700, color: "#1a8a6a", textAlign: "right" }}>{row.rehomeVal}</td>
                  <td style={{ padding: "9px 10px", fontSize: "0.80rem", fontWeight: isTotal ? 900 : 700, color: T.textPrimary, textAlign: "right" }}>{row.adoptVal + row.rehomeVal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:640px){
          .an-grid-2{grid-template-columns:1fr!important;}
          .an-grid-4{grid-template-columns:1fr 1fr!important;}
          .an-header{flex-direction:column!important;align-items:flex-start!important;gap:6px!important;}
          .an-filter-bar{flex-direction:column!important;align-items:flex-start!important;gap:8px!important;}
          .an-filter-row{flex-wrap:wrap!important;gap:6px!important;}
          .an-view-tabs button{padding:3px 7px!important;font-size:0.62rem!important;}
          .an-chart-head{flex-direction:column!important;align-items:flex-start!important;gap:6px!important;}
          .an-table th,.an-table td{padding:7px 6px!important;font-size:0.72rem!important;}
          .an-summary-val{font-size:1.2rem!important;}
          .an-live-badge{font-size:0.65rem!important;}
        }
        @media(max-width:400px){
          .an-grid-4{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}