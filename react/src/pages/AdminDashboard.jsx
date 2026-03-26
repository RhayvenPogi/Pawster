// ── ADMIN DASHBOARD SHELL ─────────────────────────────────────────────────────
// This component expects a `user` prop passed from the auth system (LoginPage.jsx)
// It does NOT have its own login — auth is handled by LoginPage → useAuth hook
//
// Usage in App.jsx / routing:
//   import AdminDashboard from "./components/admin/AdminDashboard";
//   <AdminDashboard user={currentUser} onLogout={handleLogout} />

import { useState, useEffect } from "react";
import { phpApi, useToast, ToastContainer } from "../shared";
import { useAuth } from "../hooks/useAuth";

// Lazy-loaded panels
import DashboardPanel from "./admin/DashboardPanel";
import AnimalsPanel   from "./admin/AnimalsPanel";
import RequestsPanel  from "./admin/RequestsPanel";
import SurveysPanel   from "./admin/SurveysPanel";
import UsersPanel     from "./admin/UsersPanel";
import GeoMapPanel    from "./admin/GeoMapPanel";
import ActivityPanel  from "./admin/ActivityPanel";
import ProfilePanel   from "./admin/ProfilePanel";

// ── NAV CONFIG ────────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "OVERVIEW",
    items: [{ id: "overview", icon: "📊", label: "Dashboard" }],
  },
  {
    group: "MANAGEMENT",
    items: [
      { id: "animals",   icon: "🐾", label: "Animals",   badge: "animals"            },
      { id: "adoptions", icon: "❤️", label: "Adoptions", badge: "pending_adoptions", warn: true },
      { id: "rehome",    icon: "🏠", label: "Rehoming",  badge: "pending_rehome"      },
      { id: "surveys",   icon: "📋", label: "Surveys"                                 },
    ],
  },
  {
    group: "ANALYTICS",
    items: [{ id: "map", icon: "🌏", label: "Geographic Map" }],
  },
  {
    group: "SYSTEM",
    items: [
      { id: "users",    icon: "👥", label: "User Management", badge: "users" },
      { id: "activity", icon: "🕐", label: "Activity Log"                    },
    ],
  },
];

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onNav, stats, user, collapsed, onToggle, onLogout }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      style={{
        background: "rgba(255,252,230,0.96)",
        backdropFilter: "blur(20px)",
        borderRight: "1.5px solid rgba(90,160,48,0.3)",
        boxShadow: "4px 0 24px rgba(100,70,20,0.08)",
      }}>

      {/* Brand */}
      <div className="flex items-center gap-3 px-3.5 py-4 border-b flex-shrink-0" style={{ borderColor: "#e8dfc0", minHeight: 64 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
          🐾
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-black text-base leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1a4a08" }}>
              Pawster
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9aaa80" }}>Admin Panel</div>
          </div>
        )}
        <button onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg hover:bg-green-50 transition-colors flex-shrink-0"
          style={{ color: "#9aaa80" }}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* User chip */}
      <div className={`flex items-center gap-2.5 px-3.5 py-3 border-b flex-shrink-0 ${collapsed ? "justify-center" : ""}`}
        style={{ background: "rgba(42,112,16,0.06)", borderColor: "#e8dfc0" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0 border-2 border-green-300"
          style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
          {user.firstName?.[0] || "A"}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm truncate" style={{ color: "#1a4a08" }}>{user.firstName}</div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#9aaa80" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Online
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: "thin" }}>
        {NAV.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <div className="text-[10px] font-black uppercase tracking-widest px-2 pt-3 pb-1" style={{ color: "#b0b890" }}>
                {group.group}
              </div>
            )}
            {group.items.map(item => {
              const isActive = active === item.id;
              const count = item.badge ? stats[item.badge] : 0;
              return (
                <button key={item.id} onClick={() => onNav(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 transition-all ${collapsed ? "justify-center" : ""}`}
                  style={{
                    background: isActive ? "rgba(42,112,16,0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(42,112,16,0.2)" : "1px solid transparent",
                    color: isActive ? "#1a4a08" : "#5a7040",
                  }}>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all ${isActive ? "bg-green-200" : "bg-green-50 hover:bg-green-100"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className={`flex-1 text-left text-sm ${isActive ? "font-black" : "font-bold"}`}>{item.label}</span>
                      {count > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.warn ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t p-2 flex flex-col gap-1 flex-shrink-0" style={{ borderColor: "#e8dfc0" }}>
        {[
          { id: "profile", icon: "⚙️", label: "Profile Settings", color: "#5a7040", hoverBg: "hover:bg-green-50" },
        ].map(a => (
          <button key={a.id} onClick={() => onNav(a.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${collapsed ? "justify-center" : ""} ${a.hoverBg} ${active === a.id ? "bg-green-50" : ""}`}
            style={{ color: a.color }}>
            <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base bg-green-50">{a.icon}</span>
            {!collapsed && <span className="flex-1 text-left text-sm font-bold">{a.label}</span>}
          </button>
        ))}
        <button onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:bg-red-50 ${collapsed ? "justify-center" : ""}`}
          style={{ color: "#c03030" }}>
          <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base bg-red-50">🚪</span>
          {!collapsed && <span className="flex-1 text-left text-sm font-bold">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
const CRUMBS = {
  overview: "Dashboard", animals: "Manage Animals", adoptions: "Adoption Requests",
  rehome: "Rehome Requests", surveys: "Follow-up Surveys", users: "User Management",
  activity: "Activity Log", map: "Geographic Map", profile: "Profile Settings",
};

function Topbar({ panel, user, onRefresh, onToggle, collapsed }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-5 gap-4 transition-all duration-300"
      style={{
        left: collapsed ? 64 : 240, height: 64,
        background: "rgba(255,252,230,0.95)",
        backdropFilter: "blur(18px)",
        borderBottom: "1.5px solid rgba(180,140,60,0.2)",
        boxShadow: "0 2px 14px rgba(100,70,20,0.06)",
      }}>

      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-green-50 transition-colors" style={{ color: "#9aaa80" }}>
          ☰
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold" style={{ color: "#9aaa80" }}>Pawster</span>
          <span style={{ color: "#c0b080" }}>›</span>
          <span className="font-black" style={{ color: "#1a4a08" }}>{CRUMBS[panel] || panel}</span>
        </div>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ background: "rgba(255,250,232,0.8)", borderColor: "#c8b878" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input placeholder="Search…" className="bg-transparent outline-none text-sm flex-1" style={{ color: "#1a2e0a" }} />
          <kbd className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#e8dfc0", color: "#9aaa80" }}>⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button onClick={onRefresh}
          className="p-2 rounded-lg border hover:bg-green-50 transition-colors"
          style={{ borderColor: "#ddd0a8", color: "#9aaa80" }} title="Refresh">
          ↻
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            className="p-2 rounded-lg border hover:bg-green-50 transition-colors"
            style={{ borderColor: "#ddd0a8", color: "#9aaa80" }}>
            🔔
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl border p-4 z-50"
              style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
              <div className="font-black text-sm mb-3" style={{ color: "#1a4a08" }}>Notifications</div>
              <div className="text-sm font-semibold text-center py-8" style={{ color: "#9aaa80" }}>🔕 No new notifications</div>
            </div>
          )}
        </div>

        {/* View Site */}
        <button
          onClick={() => window.open("/", "_blank")}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-black transition-all hover:bg-green-50"
          style={{ borderColor: "#ddd0a8", color: "#3a5020" }}>
          🌐 View Site
        </button>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-green-50 transition-colors"
            style={{ borderColor: "#ddd0a8" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
              style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
              {user.firstName?.[0] || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-black leading-tight" style={{ color: "#1a4a08" }}>{user.firstName}</div>
              <div className="text-[10px] font-semibold" style={{ color: "#9aaa80" }}>{user.role}</div>
            </div>
            <span className="text-xs" style={{ color: "#9aaa80" }}>▾</span>
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border overflow-hidden z-50"
              style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#e8dfc0" }}>
                <div className="font-black text-sm" style={{ color: "#1a4a08" }}>{user.firstName} {user.lastName}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>{user.email}</div>
              </div>
              <button onClick={() => { setUserOpen(false); /* navigate to profile */ }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-green-50 transition-colors"
                style={{ color: "#3a5020" }}>
                ⚙️ Profile Settings
              </button>
              <div className="border-t" style={{ borderColor: "#e8dfc0" }} />
              <button onClick={() => { setUserOpen(false); window.location.href = "/"; }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-red-50 transition-colors"
                style={{ color: "#c03030" }}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── BACKGROUND ────────────────────────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(110px)", opacity: 0.45 }} />
      <div style={{ position: "absolute", top: "5%", right: "-15%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,#B45A22,transparent 70%)", filter: "blur(110px)", opacity: 0.4 }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,#e8e0d0,transparent 60%)", filter: "blur(110px)", opacity: 0.45 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,70,30,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.03) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user: authUser, logout } = useAuth();

  // ✅ ALL hooks must be declared before any early return
  const [user,       setUser]       = useState(null);
  const [panel,      setPanel]      = useState("overview");
  const [collapsed,  setCollapsed]  = useState(false);
  const [stats,      setStats]      = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { toasts, show: toast }     = useToast();

  // Sync auth user into local state
  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  // Fetch stats
  useEffect(() => {
    phpApi("stats").then(r => { if (r.success) setStats(r.data || {}); }).catch(() => {});
  }, [refreshKey]);

  // ✅ Guard goes AFTER all hooks
  if (!user) return null;

  const refresh = () => {
    setRefreshKey(k => k + 1);
    toast("Dashboard refreshed", "success");
  };

  const handleLogout = () => logout();
  const updateUser   = (updates) => setUser(u => ({ ...u, ...updates }));
  const sidebarWidth = collapsed ? 64 : 240;
  
  return (
    <div className="relative min-h-screen" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <Background />

      <Sidebar
        active={panel}
        onNav={setPanel}
        stats={stats}
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onLogout={handleLogout}
      />

      <Topbar
        panel={panel}
        user={user}
        onRefresh={refresh}
        onToggle={() => setCollapsed(c => !c)}
        collapsed={collapsed}
      />

      {/* Main content */}
      <main
        className="relative z-10 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: sidebarWidth, paddingTop: 64, minHeight: "100vh" }}>
        <div className="p-6 max-w-[1600px]">
          {panel === "overview"  && <DashboardPanel stats={stats} onNav={setPanel} user={user} />}
          {panel === "animals"   && <AnimalsPanel   show={panel === "animals"} />}
          {panel === "adoptions" && <RequestsPanel  type="adoptions" show={panel === "adoptions"} />}
          {panel === "rehome"    && <RequestsPanel  type="rehome"    show={panel === "rehome"} />}
          {panel === "surveys"   && <SurveysPanel   show={panel === "surveys"} />}
          {panel === "users"     && <UsersPanel     show={panel === "users"} />}
          {panel === "activity"  && <ActivityPanel  show={panel === "activity"} />}
          {panel === "map"       && <GeoMapPanel    show={panel === "map"} />}
          {panel === "profile"   && <ProfilePanel   user={user} onUserUpdate={updateUser} />}
        </div>
      </main>

      <ToastContainer toasts={toasts} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-slideUp { animation: slideUp 0.25s ease both; }
        .leaflet-container { background: #e8dfc8 !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(255,252,235,0.98) !important;
          border: 1.5px solid rgba(90,170,48,0.4) !important;
          border-radius: 12px !important;
          font-family: Nunito, sans-serif !important;
        }
        .leaflet-popup-tip { background: rgba(255,252,235,0.98) !important; }
      `}</style>
    </div>
  );
}