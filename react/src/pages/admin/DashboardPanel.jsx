// ── DASHBOARD OVERVIEW PANEL ──────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { phpApi } from "../../shared";

function StatCard({ val, label, sub, icon, accentColor, onClick }) {
  return (
    <div onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: "#fffce8", border: "1.5px solid #ddd0a8" }}>
      {/* accent stripe */}
      <div className="h-1 w-full" style={{ background: accentColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="text-4xl font-black leading-none" style={{ color: accentColor }}>{val}</div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${accentColor}18` }}>
            {icon}
          </div>
        </div>
        <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: "#7a9060" }}>{label}</div>
        <div className="text-xs font-semibold" style={{ color: "#9aaa80" }}>{sub}</div>
      </div>
    </div>
  );
}

function MiniChart({ data = [], color }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`${pts} 100,100 0,100`} fill={color} opacity="0.12" />
    </svg>
  );
}

export default function DashboardPanel({ stats, onNav, user }) {
  const [chartData, setChartData] = useState({ weekly: [], monthly: [] });
  const [chartView, setChartView] = useState("weekly");

  useEffect(() => {
    phpApi("get_chart_data").then(r => {
      if (r.success) setChartData(r.data || {});
    }).catch(() => {});
  }, []);

  const statCards = [
    { val: stats.animals || 0,   label: "Total Animals",     sub: `${stats.available || 0} available`,            icon: "🐾", accentColor: "#2a7010", panel: "animals"   },
    { val: stats.adoptions || 0, label: "Adoption Requests", sub: `${stats.pending_adoptions || 0} pending`,      icon: "❤️", accentColor: "#d4880a", panel: "adoptions" },
    { val: stats.rehome || 0,    label: "Rehome Requests",   sub: `${stats.pending_rehome || 0} pending`,         icon: "🏠", accentColor: "#b45a22", panel: "rehome"    },
    { val: stats.users || 0,     label: "Registered Users",  sub: "All accounts",                                  icon: "👥", accentColor: "#7a3dc0", panel: "users"     },
  ];

  const healthStats = [
    { lbl: "Healthy",          val: stats.health_healthy   || 0, color: "#2a7010", bg: "rgba(42,112,16,0.09)"  },
    { lbl: "Needs Care",       val: stats.health_care      || 0, color: "#c87820", bg: "rgba(200,120,32,0.09)" },
    { lbl: "Under Treatment",  val: stats.health_treatment || 0, color: "#7a3dc0", bg: "rgba(122,61,192,0.09)" },
  ];

  const totalHealth = (stats.health_healthy || 0) + (stats.health_care || 0) + (stats.health_treatment || 0) || 1;

  const quickActions = [
    { label: "View Pending Adoptions", icon: "❤️", panel: "adoptions", count: stats.pending_adoptions },
    { label: "View Rehome Requests",   icon: "🏠", panel: "rehome",    count: stats.pending_rehome    },
    { label: "Manage Animals",         icon: "🐾", panel: "animals",   count: stats.animals           },
    { label: "User Management",        icon: "👥", panel: "users",     count: stats.users             },
  ];

  const currentData = chartView === "weekly" ? (chartData.weekly || Array(7).fill(0)) : (chartData.monthly || Array(12).fill(0));
  const labels = chartView === "weekly"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h2 className="text-3xl font-black" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1a4a08" }}>
          Good day, {user.firstName}! 🐾
        </h2>
        <p className="text-sm font-semibold mt-1" style={{ color: "#7a9060" }}>
          Here's what's happening at the shelter today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => (
          <StatCard key={c.panel} {...c} onClick={() => onNav(c.panel)} />
        ))}
      </div>

      {/* Charts + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Adoption Activity Chart */}
        <div className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-black text-base" style={{ color: "#1a4a08" }}>Adoption Activity</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>Monthly trends</div>
            </div>
            <div className="flex gap-1.5 rounded-xl overflow-hidden border" style={{ borderColor: "#ddd0a8" }}>
              {["weekly","monthly","yearly"].map(v => (
                <button key={v} onClick={() => setChartView(v)}
                  className={`px-3 py-1.5 text-xs font-black capitalize transition-colors ${chartView === v ? "bg-green-600 text-white" : "text-[#7a9060] hover:bg-green-50"}`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end justify-between gap-1.5 h-40 px-2">
            {currentData.map((val, i) => {
              const max = Math.max(...currentData, 1);
              const pct = (val / max) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className="text-[10px] font-black" style={{ color: "#9aaa80" }}>{val || ""}</div>
                  <div className="w-full rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(pct, 3)}%`, background: pct > 60 ? "#2a7010" : pct > 30 ? "#5aaa30" : "#a8d878", minHeight: 4 }} />
                  <div className="text-[10px] font-bold truncate w-full text-center" style={{ color: "#9aaa80" }}>{labels[i]}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t" style={{ borderColor: "#e8dfc0" }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#7a9060" }}>
              <div className="w-3 h-3 rounded-sm bg-green-600" /> Adoptions
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#7a9060" }}>
              <div className="w-3 h-3 rounded-sm" style={{ background: "#d4880a" }} /> Rehome Requests
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border p-5" style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
          <div className="font-black text-base mb-4" style={{ color: "#1a4a08" }}>Quick Actions</div>
          <div className="flex flex-col gap-2">
            {quickActions.map(a => (
              <button key={a.panel} onClick={() => onNav(a.panel)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-left transition-all hover:shadow-sm group"
                style={{ background: "rgba(42,112,16,0.07)", border: "1px solid rgba(42,112,16,0.15)", color: "#1a4a08" }}>
                <span className="text-base">{a.icon}</span>
                <span className="flex-1">{a.label}</span>
                {a.count > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">{a.count}</span>
                )}
                <span className="text-xs opacity-40 group-hover:opacity-80 transition-opacity">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Animal Health */}
      <div className="rounded-2xl border p-5" style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
        <div className="font-black text-base mb-4" style={{ color: "#1a4a08" }}>Animal Health Overview</div>
        <div className="grid grid-cols-3 gap-4">
          {healthStats.map(h => {
            const pct = Math.round((h.val / totalHealth) * 100);
            return (
              <div key={h.lbl} className="rounded-xl p-4" style={{ background: h.bg, border: `1px solid ${h.color}22` }}>
                <div className="text-3xl font-black mb-1" style={{ color: h.color }}>{h.val}</div>
                <div className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: h.color, opacity: 0.8 }}>{h.lbl}</div>
                <div className="h-1.5 rounded-full" style={{ background: `${h.color}22` }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: h.color }} />
                </div>
                <div className="text-[11px] font-bold mt-1" style={{ color: h.color, opacity: 0.7 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}