// ── DASHBOARD OVERVIEW PANEL — styled to match dashboard.css v2 (PHP version)
import { useState, useEffect, useRef } from "react";
import { phpApi } from "../../shared";

// ── STAT CARD ──────────────────────────────────────────────────────────────────
// Matches .stat-card  .sc-green / .sc-orange / .sc-amber / .sc-purple from CSS
const CARD_THEMES = {
  green:  { accent: "linear-gradient(90deg,#1c4f09,#5aaa30)", valColor: "#1c4f09", icon: "#1c4f09", iconBg: "rgba(90,170,48,0.10)", barFill: "linear-gradient(90deg,#1c4f09,#5aaa30)", hoverBorder: "rgba(90,170,48,0.50)", hoverShadow: "0 8px 28px rgba(90,170,48,0.15)" },
  orange: { accent: "linear-gradient(90deg,#B45A22,#e07830)", valColor: "#B45A22", icon: "#B45A22", iconBg: "rgba(180,90,34,0.10)", barFill: "linear-gradient(90deg,#B45A22,#e07830)", hoverBorder: "rgba(180,90,34,0.50)", hoverShadow: "0 8px 28px rgba(180,90,34,0.15)" },
  amber:  { accent: "linear-gradient(90deg,#d4880a,#e0a030)", valColor: "#d4880a", icon: "#d4880a", iconBg: "rgba(212,136,10,0.10)", barFill: "linear-gradient(90deg,#d4880a,#e0a030)", hoverBorder: "rgba(212,136,10,0.50)", hoverShadow: "0 8px 28px rgba(212,136,10,0.15)" },
  purple: { accent: "linear-gradient(90deg,#7a3dc0,#a070e0)", valColor: "#7a3dc0", icon: "#7a3dc0", iconBg: "rgba(122,61,192,0.10)", barFill: "linear-gradient(90deg,#7a3dc0,#a070e0)", hoverBorder: "rgba(122,61,192,0.50)", hoverShadow: "0 8px 28px rgba(122,61,192,0.15)" },
};

function StatCard({ val, label, sub, subWarn, icon, theme, barPct = 70, onClick }) {
  const t = CARD_THEMES[theme] || CARD_THEMES.green;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,248,225,0.78)",
        border: `1.5px solid ${hovered ? t.hoverBorder : "rgba(180,140,60,0.28)"}`,
        borderRadius: 14, padding: "20px 20px 18px",
        cursor: "pointer", position: "relative", overflow: "hidden",
        backdropFilter: "blur(12px)",
        boxShadow: hovered ? t.hoverShadow : "0 2px 12px rgba(100,70,20,0.09)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      }}
    >
      {/* Top accent stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "3px 3px 0 0", background: t.accent }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: "2.3rem", fontWeight: 900, lineHeight: 1, marginBottom: 5, color: t.valColor }}>{val}</div>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#6a7a50", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
          <div style={{ fontSize: "0.73rem", fontWeight: 700, color: subWarn ? "#B45A22" : "#1c4f09", marginTop: 9, display: "flex", alignItems: "center", gap: 5 }}>
            {sub}
          </div>
        </div>
        <div style={{ fontSize: "2.4rem", opacity: 0.10, color: t.icon, position: "absolute", right: 16, bottom: 14 }}>
          {icon}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(180,140,60,0.10)", borderRadius: "0 0 14px 14px" }}>
        <div style={{ height: "100%", borderRadius: "inherit", background: t.barFill, width: `${barPct}%`, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

// ── DONUT CHART (canvas-based, matching PHP Chart.js donut) ────────────────────
function DonutChart({ healthy, care, treatment }) {
  const canvasRef = useRef(null);
  const total = (healthy + care + treatment) || 1;
  const pct = Math.round((healthy / total) * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = 70, inner = 48;

    const slices = [
      { val: healthy,   color: "#5aaa30" },
      { val: care,      color: "#c87820" },
      { val: treatment, color: "#8957e5" },
    ];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let startAngle = -Math.PI / 2;

    slices.forEach(({ val, color }) => {
      if (val <= 0) return;
      const sweep = (val / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.closePath();
      // Cutout
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
      startAngle += sweep;
    });

    // Cutout hole
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // If all zero, draw gray circle
    if (total === 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(180,140,60,0.20)";
      ctx.lineWidth = r - inner;
      ctx.stroke();
    }
  }, [healthy, care, treatment]);

  return (
    <div style={{ position: "relative", width: 156, height: 156, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <canvas ref={canvasRef} width={156} height={156} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
        <span style={{ display: "block", fontSize: "1.75rem", fontWeight: 900, color: "#1c4f09" }}>{pct}%</span>
        <small style={{ fontSize: "0.70rem", fontWeight: 800, color: "#6a7a50" }}>Healthy</small>
      </div>
    </div>
  );
}

// ── BAR CHART (matches PHP Chart.js activity chart) ────────────────────────────
function ActivityBarChart({ data, labels }) {
  const max = Math.max(...data, 1);
  const barColors = ["#5aaa30", "#d4880a", "#1c4f09", "#B45A22", "#7a3dc0", "#1a8a6a", "#b03060"];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 170, paddingBottom: 20, position: "relative" }}>
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <div key={pct} style={{ position: "absolute", left: 0, right: 0, bottom: 20 + pct * 150, height: 1, background: "rgba(180,140,60,0.12)", zIndex: 0 }} />
      ))}
      {data.map((val, i) => {
        const heightPct = max > 0 ? (val / max) * 100 : 0;
        const color = barColors[i % barColors.length];
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 1, position: "relative" }}>
            {val > 0 && (
              <div style={{ fontSize: "0.60rem", fontWeight: 800, color: "#6a7a50" }}>{val}</div>
            )}
            <div
              style={{ width: "100%", borderRadius: "4px 4px 0 0", minHeight: 4, background: `linear-gradient(180deg,${color},${color}cc)`, height: `${Math.max(heightPct, 2)}%`, transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)", cursor: "pointer", boxShadow: `0 2px 8px ${color}40` }}
              title={`${labels[i]}: ${val}`}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.transform = "scaleY(1.04)"; e.currentTarget.style.transformOrigin = "bottom"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
            />
            <div style={{ fontSize: "0.60rem", fontWeight: 800, color: "#6a7a50", whiteSpace: "nowrap", position: "absolute", bottom: 0 }}>{labels[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── RECENT REQUEST MINI ROW ────────────────────────────────────────────────────
// Matches .req-mini from CSS
function ReqMini({ name, detail, status, type }) {
  const icoMap = {
    adoption: { bg: "rgba(90,170,48,0.14)",  color: "#1c4f09",  icon: "❤️" },
    rehome:   { bg: "rgba(212,136,10,0.14)", color: "#d4880a",  icon: "🏠" },
    other:    { bg: "rgba(180,90,34,0.14)",  color: "#B45A22",  icon: "📋" },
  };
  const ico = icoMap[type] || icoMap.other;

  const statusStyle = {
    Pending:  { bg: "rgba(212,136,10,0.15)",  color: "#d4880a"  },
    Approved: { bg: "rgba(90,170,48,0.14)",   color: "#1c4f09"  },
    Rejected: { bg: "rgba(192,48,48,0.12)",   color: "#c03030"  },
  }[status] || { bg: "rgba(180,140,60,0.11)", color: "#6a7a50" };

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, background: "rgba(255,250,230,0.50)", borderLeft: `3px solid ${ico.color}`, marginBottom: 6, transition: "background 0.14s", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,250,230,0.88)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,250,230,0.50)"; }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem", background: ico.bg }}>
        {ico.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#1a4a08", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</strong>
        <small style={{ fontSize: "0.70rem", fontWeight: 700, color: "#6a7a50" }}>{detail}</small>
      </div>
      <div style={{ fontSize: "0.67rem", fontWeight: 900, padding: "3px 8px", borderRadius: 20, flexShrink: 0, background: statusStyle.bg, color: statusStyle.color }}>
        {status}
      </div>
    </div>
  );
}

// ── RECENT USER MINI ROW ───────────────────────────────────────────────────────
function UserMini({ name, email, role }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, background: "rgba(255,250,230,0.50)", marginBottom: 6, transition: "background 0.14s", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,250,230,0.88)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,250,230,0.50)"; }}
    >
      <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1c4f09,#2a7010)", border: "2px solid #5aaa30", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.80rem", fontWeight: 900 }}>
        {name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#1a4a08", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</strong>
        <small style={{ fontSize: "0.70rem", fontWeight: 700, color: "#6a7a50", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{email}</small>
      </div>
      <div style={{ fontSize: "0.67rem", fontWeight: 900, padding: "3px 8px", borderRadius: 20, background: role === "admin" ? "rgba(122,61,192,0.12)" : "rgba(32,96,160,0.12)", color: role === "admin" ? "#7a3dc0" : "#2060a0", flexShrink: 0, textTransform: "capitalize" }}>
        {role}
      </div>
    </div>
  );
}

// ── DASHBOARD PANEL ────────────────────────────────────────────────────────────
export default function DashboardPanel({ stats = {}, onNav, user }) {
  const [chartView, setChartView] = useState("weekly");
  const [chartData, setChartData] = useState({ weekly: Array(7).fill(0), monthly: Array(12).fill(0), yearly: Array(5).fill(0) });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    // Load recent adoptions for Recent Requests
    phpApi("get_requests", { type: "adoption", limit: 5 }).then(r => {
      if (r.success) setRecentRequests((r.data || []).slice(0, 5));
    }).catch(() => {});

    // Load recent users
    phpApi("get_users", { role: "all" }).then(r => {
      if (r.success) setRecentUsers((r.data || []).slice(0, 5));
    }).catch(() => {});
  }, []);

  const weeklyLabels  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearlyLabels  = ["2021", "2022", "2023", "2024", "2025"];

  const currentData   = chartView === "weekly" ? chartData.weekly   : chartView === "monthly" ? chartData.monthly   : chartData.yearly;
  const currentLabels = chartView === "weekly" ? weeklyLabels        : chartView === "monthly" ? monthlyLabels        : yearlyLabels;

  const healthy   = stats.health_healthy   || 0;
  const care      = stats.health_care      || 0;
  const treatment = stats.health_treatment || 0;

  const statCards = [
    { val: stats.animals || 0,   label: "Total Animals",     sub: "↑ Active listings",             theme: "green",  barPct: 70, panel: "animals",   icon: "🐾" },
    { val: stats.adoptions || 0, label: "Adoption Requests", sub: `⏱ ${stats.pending_adoptions || 0} pending`, subWarn: true, theme: "orange", barPct: 55, panel: "adoptions", icon: "❤️" },
    { val: stats.rehome || 0,    label: "Rehome Requests",   sub: "↑ This week",                   theme: "amber",  barPct: 40, panel: "rehome",    icon: "🏠" },
    { val: stats.users || 0,     label: "Registered Users",  sub: "👤 All accounts",               theme: "purple", barPct: 85, panel: "users",     icon: "👥" },
  ];

  // ── CARD STYLES shared ──────────────────────────────────────────────────────
  const dashCard = {
    background: "rgba(255,248,225,0.78)",
    border: "1.5px solid rgba(180,140,60,0.28)",
    borderRadius: 14, padding: 20,
    backdropFilter: "blur(12px)",
    boxShadow: "0 2px 12px rgba(100,70,20,0.09)",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "fadeUp 0.25s ease both" }}>
      {/* Panel title */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 0, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.55rem", fontWeight: 800, color: "#1a4a08", margin: 0 }}>
            Good day, {user?.firstName}! 🐾
          </h2>
          <p style={{ color: "#6a7a50", fontSize: "0.855rem", fontWeight: 700, marginTop: 4 }}>
            Here's what's happening at the shelter today.
          </p>
        </div>
      
      </div>

      {/* STAT CARDS — 4 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {statCards.map(c => (
          <StatCard key={c.panel} {...c} onClick={() => onNav(c.panel)} />
        ))}
      </div>

      {/* DASH GRID — matches .dash-grid: 1fr 1fr 300px */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gridTemplateRows: "auto auto", gap: 16 }}>

        {/* ACTIVITY CHART — grid-column 1/3 */}
        <div style={{ ...dashCard, gridColumn: "1 / 3" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: "0.93rem", fontWeight: 800, color: "#1a4a08", margin: 0 }}>Adoption Activity</h3>
              <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>Monthly trends</p>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["weekly", "monthly", "yearly"].map(v => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  style={{
                    background: chartView === v ? "rgba(90,170,48,0.13)" : "none",
                    border: `1.5px solid ${chartView === v ? "rgba(90,170,48,0.38)" : "rgba(180,140,60,0.28)"}`,
                    borderRadius: 8, padding: "5px 11px", fontFamily: "'Nunito',sans-serif", fontSize: "0.74rem", fontWeight: 800,
                    color: chartView === v ? "#1c4f09" : "#6a7a50", cursor: "pointer", transition: "all 0.14s",
                    textTransform: "capitalize",
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ActivityBarChart data={currentData} labels={currentLabels} />
        </div>

        {/* HEALTH DONUT — grid-column 3, row 1/3 */}
        <div style={{ ...dashCard, gridColumn: 3, gridRow: "1 / 3", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: "0.93rem", fontWeight: 800, color: "#1a4a08", margin: 0 }}>Animal Health</h3>
              <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>Current status</p>
            </div>
          </div>

          <DonutChart healthy={healthy} care={care} treatment={treatment} />

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: "auto" }}>
            {[
              { label: "Healthy",         val: healthy,   color: "#5aaa30" },
              { label: "Needs Care",      val: care,      color: "#c87820" },
              { label: "Treatment",       val: treatment, color: "#8957e5" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 700, color: "#3a5020" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: l.color }} />
                {l.label}
                <b style={{ marginLeft: "auto", color: "#1a4a08", fontWeight: 900 }}>{l.val}</b>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT REQUESTS — grid-column 1 */}
        <div style={{ ...dashCard, gridColumn: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: "0.93rem", fontWeight: 800, color: "#1a4a08", margin: 0 }}>Recent Requests</h3>
              <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>Pending items</p>
            </div>
            <button
              onClick={() => onNav("adoptions")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontSize: "0.78rem", fontWeight: 800, color: "#c87820", transition: "opacity 0.14s" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.72"; e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.textDecoration = "none"; }}
            >
              View All
            </button>
          </div>
          {recentRequests.length > 0
            ? recentRequests.map((r, i) => (
                <ReqMini
                  key={i}
                  name={r.full_name || r.name || "Unknown"}
                  detail={r.pet_name || r.animal_name || "Adoption request"}
                  status={r.status || "Pending"}
                  type="adoption"
                />
              ))
            : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", color: "#6a7a50", gap: 10, textAlign: "center" }}>
                <span style={{ fontSize: "2rem", opacity: 0.28 }}>❤️</span>
                <p style={{ fontSize: "0.855rem", fontWeight: 700, margin: 0 }}>No recent requests</p>
              </div>
            )
          }
        </div>

        {/* RECENT USERS — grid-column 2 */}
        <div style={{ ...dashCard, gridColumn: 2 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: "0.93rem", fontWeight: 800, color: "#1a4a08", margin: 0 }}>Recent Users</h3>
              <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>Latest signups</p>
            </div>
            <button
              onClick={() => onNav("users")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontSize: "0.78rem", fontWeight: 800, color: "#c87820", transition: "opacity 0.14s" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.72"; e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.textDecoration = "none"; }}
            >
              View All
            </button>
          </div>
          {recentUsers.length > 0
            ? recentUsers.map((u, i) => (
                <UserMini
                  key={i}
                  name={`${u.first_name || ""} ${u.last_name || ""}`.trim()}
                  email={u.email}
                  role={u.role}
                />
              ))
            : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", color: "#6a7a50", gap: 10, textAlign: "center" }}>
                <span style={{ fontSize: "2rem", opacity: 0.28 }}>👥</span>
                <p style={{ fontSize: "0.855rem", fontWeight: 700, margin: 0 }}>No users yet</p>
              </div>
            )
          }
        </div>

      </div>{/* /dash-grid */}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}