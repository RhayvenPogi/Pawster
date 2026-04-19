// ── DASHBOARD OVERVIEW PANEL — formal design, Pawster color scheme
import { useState, useEffect, useRef, useCallback } from "react";

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
  card:        { background: "rgba(255,248,225,0.85)", border: "1.5px solid rgba(180,140,60,0.22)", borderRadius: 12, backdropFilter: "blur(12px)", boxShadow: "0 2px 10px rgba(100,70,20,0.08)" },
  textPrimary:   "#1a4a08",
  textSecondary: "#6a7a50",
  textTertiary:  "#9aaa80",
  accent: {
    green:  { color: "#1c4f09", bar: "#5aaa30",  hover: "rgba(90,170,48,0.18)"  },
    orange: { color: "#B45A22", bar: "#e07830",  hover: "rgba(180,90,34,0.15)"  },
    amber:  { color: "#d4880a", bar: "#e0a030",  hover: "rgba(212,136,10,0.15)" },
    purple: { color: "#7a3dc0", bar: "#a070e0",  hover: "rgba(122,61,192,0.15)" },
    rose:   { color: "#b03060", bar: "#e05080",  hover: "rgba(176,48,96,0.15)"  },
    teal:   { color: "#1a8a6a", bar: "#30c090",  hover: "rgba(26,138,106,0.15)" },
  },
  badge: {
    warn:    { bg: "rgba(212,136,10,0.15)",  color: "#d4880a" },
    ok:      { bg: "rgba(90,170,48,0.14)",   color: "#1c4f09" },
    danger:  { bg: "rgba(176,48,96,0.13)",   color: "#b03060" },
    neutral: { bg: "rgba(180,140,60,0.11)",  color: "#6a7a50" },
    purple:  { bg: "rgba(122,61,192,0.12)",  color: "#7a3dc0" },
    blue:    { bg: "rgba(32,96,160,0.10)",   color: "#2060a0" },
  },
};

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function Badge({ type = "neutral", children }) {
  const s = T.badge[type] || T.badge.neutral;
  return (
    <span style={{ display: "inline-block", fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color }}>
      {children}
    </span>
  );
}

function LiveBadge({ lastUpdated, polling }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", fontWeight: 700, color: T.textSecondary }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: polling ? "#d4880a" : "#5aaa30",
        display: "inline-block",
        boxShadow: polling ? "none" : "0 0 0 3px rgba(90,170,48,0.2)",
      }} />
      {polling ? "Refreshing…" : "Live"}
      {lastUpdated && !polling && (
        <span style={{ color: T.textTertiary, marginLeft: 4 }}>
          · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}

function StatCard({ val, label, sub, subType = "ok", accent = "green", onClick }) {
  const [hovered, setHovered] = useState(false);
  const a = T.accent[accent] || T.accent.green;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...T.card,
        padding: "0 20px 18px",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        background: hovered ? "rgba(255,248,225,0.97)" : T.card.background,
        boxShadow: hovered ? `0 6px 24px ${a.hover}` : T.card.boxShadow,
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "transform 0.18s, box-shadow 0.18s, background 0.18s",
      }}
    >
      {/* top accent bar */}
      <div style={{ height: 3, background: a.bar, marginLeft: -20, marginRight: -20, marginBottom: 14 }} />
      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 900, color: a.color, lineHeight: 1.1, fontFamily: "'Playfair Display',Georgia,serif" }}>
        {val}
      </div>
      <div style={{ marginTop: 8 }}>
        <Badge type={subType}>{sub}</Badge>
      </div>
    </div>
  );
}

function DonutChart({ healthy, care, treatment }) {
  const canvasRef = useRef(null);
  const total = (healthy + care + treatment) || 1;
  const pct = Math.round((healthy / total) * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = 52, inner = 34;
    const segs = [
      { val: healthy,   color: "#5aaa30" },
      { val: care,      color: "#d4880a" },
      { val: treatment, color: "#7a3dc0" },
    ];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let start = -Math.PI / 2;
    segs.forEach(({ val, color }) => {
      if (val <= 0) return;
      const sweep = (val / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + sweep);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      start += sweep;
    });
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }, [healthy, care, treatment, total]);

  return (
    <div style={{ position: "relative", width: 112, height: 112, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <canvas ref={canvasRef} width={112} height={112} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "relative", textAlign: "center", zIndex: 1, pointerEvents: "none" }}>
        <span style={{ display: "block", fontSize: "1.35rem", fontWeight: 900, color: T.textPrimary, lineHeight: 1 }}>{pct}%</span>
        <small style={{ fontSize: "0.6rem", fontWeight: 800, color: T.textSecondary }}>Healthy</small>
      </div>
    </div>
  );
}

function HealthBar({ label, val, total, color, bg }) {
  const pct = total ? Math.round((val / total) * 100) : 0;
  return (
    <div style={{ padding: "9px 12px", borderRadius: 8, background: bg, marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: T.textPrimary }}>{label}</span>
        <strong style={{ fontSize: "1rem", fontWeight: 900, color: T.textPrimary }}>{val}</strong>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(180,140,60,0.15)" }}>
        <div style={{ height: 4, borderRadius: 2, background: color, width: `${pct}%`, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
}

function ReqRow({ name, detail, status }) {
  const s = (status || "").toLowerCase();
  const badgeType = s === "approved" ? "ok" : s === "rejected" ? "danger" : "warn";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 8,
      background: "rgba(255,250,230,0.50)",
      borderBottom: "1px solid rgba(180,140,60,0.10)",
      transition: "background 0.13s", cursor: "pointer",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,250,230,0.90)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,250,230,0.50)"}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.78rem", fontWeight: 800, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ fontSize: "0.67rem", fontWeight: 700, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}</div>
      </div>
      <Badge type={badgeType}>{status}</Badge>
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: T.textPrimary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      {action && (
        <button onClick={onAction} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Nunito',sans-serif", fontSize: "0.72rem",
          fontWeight: 800, color: "#d4880a",
        }}>{action}</button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 0", color: T.textTertiary, fontSize: "0.80rem", fontWeight: 700 }}>
      {message}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DashboardPanel({ stats = {}, onNav, user }) {
  const [adoptions,   setAdoptions]   = useState([]);
  const [rehomings,   setRehomings]   = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [polling,     setPolling]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const healthy   = stats.health_healthy   || 0;
  const care      = stats.health_care      || 0;
  const treatment = stats.health_treatment || 0;
  const healthTotal = healthy + care + treatment || 1;

  const fetchData = useCallback(async () => {
    setPolling(true);
    try {
      const [aRes, rRes] = await Promise.all([
        djFetch("/api/approvals/adoptions/admin/"),
        djFetch("/api/approvals/rehoming/admin/"),
      ]);
      if (aRes.ok) { const d = await aRes.json(); setAdoptions(d.data || d || []); }
      if (rRes.ok) { const d = await rRes.json(); setRehomings(d.data || d || []); }
      try {
        const uRes = await fetch("/php/admin/dashboard", {
          method: "POST",
          body: (() => { const f = new FormData(); f.append("action", "get_users"); f.append("role", "all"); return f; })(),
          credentials: "include",
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.success) setRecentUsers((uData.data || []).slice(0, 5));
        }
      } catch {}
      setLastUpdated(new Date());
    } catch (e) { console.warn("[DashboardPanel] fetch error:", e); }
    setPolling(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const adoptPending  = adoptions.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const rehomePending = rehomings.filter(r => (r.status || "").toLowerCase() === "pending").length;
  const missingCount  = stats.missing_pets ?? 0;

  const recentAdopt  = [...adoptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const recentRehome = [...rehomings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const statCards = [
    { val: stats.animals ?? "—",  label: "Total Animals",     sub: "Active listings",             subType: "ok",      accent: "green",  panel: "animals"    },
    { val: adoptions.length,       label: "Adoption Requests", sub: `${adoptPending} pending`,     subType: adoptPending  > 0 ? "warn" : "ok", accent: "orange", panel: "adoptions" },
    { val: rehomings.length,       label: "Rehome Requests",   sub: `${rehomePending} pending`,    subType: rehomePending > 0 ? "warn" : "ok", accent: "amber",  panel: "rehome"    },
    { val: stats.users ?? "—",     label: "Registered Users",  sub: "All accounts",                subType: "neutral", accent: "purple", panel: "users"      },
    { val: stats.surveys ?? "—",   label: "Feedback Reports",  sub: "Post-adoption",               subType: "neutral", accent: "teal",   panel: "surveys"    },
    { val: missingCount,           label: "Missing Pets",      sub: `${missingCount} active`,      subType: missingCount > 0 ? "danger" : "ok", accent: "rose", panel: "missingpets" },
  ];

  const quickActions = [
    { label: "Manage Animals",    accent: "green",  panel: "animals"     },
    { label: "Review Adoptions",  accent: "orange", panel: "adoptions"   },
    { label: "Rehoming Requests", accent: "amber",  panel: "rehome"      },
    { label: "User Management",   accent: "purple", panel: "users"       },
    { label: "Missing Pets",      accent: "rose",   panel: "missingpets" },
    { label: "Analytics",         accent: "teal",   panel: "analytics"   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: "'Nunito',sans-serif", animation: "fadeUp 0.25s ease both" }}>

      {/* ── Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.45rem", fontWeight: 800, color: T.textPrimary, margin: 0 }}>
            Good day, {user?.firstName || "Administrator"}
          </h2>
          <p style={{ color: T.textSecondary, fontSize: "0.82rem", fontWeight: 700, marginTop: 3, margin: 0 }}>
            Here is a snapshot of the shelter right now.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LiveBadge lastUpdated={lastUpdated} polling={polling} />
          <button
            onClick={() => onNav("analytics")}
            style={{
              background: "rgba(26,138,106,0.10)", border: "1.5px solid rgba(26,138,106,0.35)",
              borderRadius: 10, padding: "6px 14px", fontFamily: "'Nunito',sans-serif",
              fontSize: "0.78rem", fontWeight: 800, color: "#1a8a6a", cursor: "pointer",
            }}
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* ── Stat cards — 3 × 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {statCards.map(c => (
          <StatCard key={c.panel} {...c} onClick={() => onNav(c.panel)} />
        ))}
      </div>

      {/* ── Middle row: health + quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Animal Health */}
        <div style={{ ...T.card, padding: "18px 20px" }}>
          <SectionHeader title="Animal Health Overview" />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DonutChart healthy={healthy} care={care} treatment={treatment} />
            <div style={{ flex: 1 }}>
              <HealthBar label="Healthy"          val={healthy}   total={healthTotal} color="#5aaa30" bg="rgba(90,170,48,0.10)"    />
              <HealthBar label="Needs Care"       val={care}      total={healthTotal} color="#d4880a" bg="rgba(212,136,10,0.10)"   />
              <HealthBar label="Under Treatment"  val={treatment} total={healthTotal} color="#7a3dc0" bg="rgba(122,61,192,0.10)"   />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ ...T.card, padding: "18px 20px" }}>
          <SectionHeader title="Quick Actions" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {quickActions.map(a => {
              const ac = T.accent[a.accent] || T.accent.green;
              return (
                <button
                  key={a.panel}
                  onClick={() => onNav(a.panel)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 14px", borderRadius: 10,
                    background: `${ac.hover}`,
                    border: `1.5px solid ${ac.color}33`,
                    cursor: "pointer", fontFamily: "'Nunito',sans-serif", textAlign: "left",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.10)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: ac.color }}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom row: recent lists */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Recent Adoptions */}
        <div style={{ ...T.card, padding: "18px 20px" }}>
          <SectionHeader title="Recent Adoptions" action="View All" onAction={() => onNav("adoptions")} />
          {recentAdopt.length > 0
            ? recentAdopt.map((r, i) => (
                <ReqRow key={i} name={r.name || "Unknown"} detail={r.animal_name || "Adoption request"} status={r.status || "Pending"} />
              ))
            : <EmptyState message="No recent adoption requests" />
          }
        </div>

        {/* Recent Rehomings */}
        <div style={{ ...T.card, padding: "18px 20px" }}>
          <SectionHeader title="Recent Rehomings" action="View All" onAction={() => onNav("rehome")} />
          {recentRehome.length > 0
            ? recentRehome.map((r, i) => (
                <ReqRow key={i} name={r.pet_name || "Unknown Pet"} detail={r.reason || `by ${r.contact || "—"}`} status={r.status || "Pending"} />
              ))
            : <EmptyState message="No recent rehoming requests" />
          }
        </div>

        {/* Recent Users */}
        <div style={{ ...T.card, padding: "18px 20px" }}>
          <SectionHeader title="Recent Users" action="View All" onAction={() => onNav("users")} />
          {recentUsers.length > 0
            ? recentUsers.map((u, i) => {
                const name = `${u.first_name || ""} ${u.last_name || ""}`.trim();
                const isAdmin = u.role === "admin";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px", borderRadius: 8,
                      background: "rgba(255,250,230,0.50)",
                      borderBottom: "1px solid rgba(180,140,60,0.10)",
                      cursor: "pointer", transition: "background 0.13s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,250,230,0.90)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,250,230,0.50)"}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#1c4f09,#2a7010)",
                      border: "2px solid #5aaa30",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,248,220,0.9)", fontSize: "0.76rem", fontWeight: 900,
                    }}>
                      {name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: T.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || "—"}</div>
                      <div style={{ fontSize: "0.67rem", fontWeight: 700, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    </div>
                    <Badge type={isAdmin ? "purple" : "blue"}>{u.role}</Badge>
                  </div>
                );
              })
            : <EmptyState message="No user data available" />
          }
        </div>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}