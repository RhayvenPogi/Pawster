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
import AnimalsPanel from "./admin/AnimalsPanel";
import RequestsPanel from "./admin/RequestsPanel";
import SurveysPanel from "./admin/SurveysPanel";
import UsersPanel from "./admin/UsersPanel";
import GeoMapPanel from "./admin/GeoMapPanel";
import ActivityPanel from "./admin/ActivityPanel";
import ProfilePanel from "./admin/ProfilePanel";

// ── NAV CONFIG ────────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "OVERVIEW",
    items: [{ id: "overview", icon: "📊", label: "Dashboard" }],
  },
  {
    group: "MANAGEMENT",
    items: [
      { id: "animals", icon: "🐾", label: "Animals", badge: "animals" },
      { id: "adoptions", icon: "❤️", label: "Adoptions", badge: "pending_adoptions", warn: true },
      { id: "rehome", icon: "🏠", label: "Rehoming", badge: "pending_rehome" },
      { id: "surveys", icon: "📋", label: "Surveys" },
    ],
  },
  {
    group: "ANALYTICS",
    items: [{ id: "map", icon: "🌏", label: "Geographic Map" }],
  },
  {
    group: "SYSTEM",
    items: [
      { id: "users", icon: "👥", label: "User Management", badge: "users" },
      { id: "activity", icon: "🕐", label: "Activity Log" },
    ],
  },
];

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onNav, stats, user, collapsed, onToggle, onLogout }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-[252px]"}`}
      style={{
        background: "rgba(255,248,220,0.90)",
        backdropFilter: "blur(20px)",
        borderRight: "1.5px solid rgba(90,160,48,0.3)",
        boxShadow: "4px 0 24px rgba(100,70,20,0.08)",
      }}>

      {/* Brand */}
      <div className="flex items-center gap-3 px-3.5 py-4 border-b flex-shrink-0" style={{ borderColor: "#e8dfc0", minHeight: 64 }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-150 hover:scale-105 cursor-pointer"
          style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}
          title="Pawster Admin"
        >
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
      </div>

      {/* User chip */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-3 border-b flex-shrink-0 transition-colors duration-150 cursor-default ${collapsed ? "justify-center" : ""}`}
        style={{ background: "rgba(42,112,16,0.06)", borderColor: "#e8dfc0" }}
      >
        <div
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-green-300 transition-all duration-150 hover:border-green-400 hover:scale-105 cursor-pointer"
          style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}
          title={user.firstName}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 -960 960 960" fill="#e3e3e3">
            <path d="M609-389q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29ZM480-160v-56q0-24 12.5-44.5T528-290q36-15 74.5-22.5T680-320q39 0 77.5 7.5T832-290q23 9 35.5 29.5T880-216v56H480ZM287-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm113-113ZM80-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T400-440q35 0 70 6t70 14l-34 34-34 34q-18-5-36-6.5t-36-1.5q-58 0-113.5 14T180-306q-10 5-15 14t-5 20v32h240v80H80Zm320-80Zm56.5-343.5Q480-607 480-640t-23.5-56.5Q433-720 400-720t-56.5 23.5Q320-673 320-640t23.5 56.5Q367-560 400-560t56.5-23.5Z" />
          </svg>
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm truncate" style={{ color: "#1a4a08" }}>
              {user.firstName}
            </div>
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
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group ${collapsed ? "justify-center" : ""}`}
                  style={{
                    background: isActive ? "rgba(42,112,16,0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(42,112,16,0.2)" : "1px solid transparent",
                    color: isActive ? "#1a4a08" : "#5a7040",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(42,112,16,0.06)";
                      e.currentTarget.style.border = "1px solid rgba(42,112,16,0.1)";
                      e.currentTarget.style.color = "#1a4a08";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.border = "1px solid transparent";
                      e.currentTarget.style.color = "#5a7040";
                    }
                  }}
                >
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all duration-150 ${isActive ? "bg-green-200" : "bg-green-50 group-hover:bg-green-100"}`}
                    style={{ transform: isActive ? "none" : undefined }}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className={`flex-1 text-left text-sm ${isActive ? "font-black" : "font-bold"}`}>{item.label}</span>
                      {count > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all duration-150 ${item.warn ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
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
          { id: "profile", icon: "⚙️", label: "Profile Settings", color: "#5a7040" },
        ].map(a => (
          <button
            key={a.id}
            onClick={() => onNav(a.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 group ${collapsed ? "justify-center" : ""} ${active === a.id ? "bg-green-100" : ""}`}
            style={{ color: a.color }}
            onMouseEnter={e => {
              if (active !== a.id) {
                e.currentTarget.style.background = "rgba(42,112,16,0.07)";
                e.currentTarget.style.color = "#1a4a08";
              }
            }}
            onMouseLeave={e => {
              if (active !== a.id) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = a.color;
              }
            }}
          >
            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all duration-150 bg-green-50 group-hover:bg-green-100`}>{a.icon}</span>
            {!collapsed && <span className="flex-1 text-left text-sm font-bold">{a.label}</span>}
          </button>
        ))}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 group ${collapsed ? "justify-center" : ""}`}
          style={{ color: "#c03030" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(192,48,48,0.07)";
            e.currentTarget.style.color = "#9b1c1c";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#c03030";
          }}
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all duration-150 bg-red-50 group-hover:bg-red-100">🚪</span>
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
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-5 gap-4 transition-all duration-300"
      style={{
        left: collapsed ? 64 : 240, height: 64,
        background: "rgba(255,248,220,0.90)",
        backdropFilter: "blur(18px)",
        borderBottom: "1.5px solid rgba(180,140,60,0.2)",
        boxShadow: "0 2px 14px rgba(100,70,20,0.06)",
      }}>

      <div className="flex items-center gap-3">
        {/* Sidebar toggle */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg transition-all duration-150"
          style={{ color: "#61765a" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(42,112,16,0.08)";
            e.currentTarget.style.color = "#1a4a08";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#61765a";
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="32px" width="32px" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
          </svg>
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-black" style={{ color: "#1a4a08" }}>{CRUMBS[panel] || panel}</span>
        </div>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 transition-all duration-150"
          style={{ background: "rgba(255,250,232,0.8)", borderColor: "#c8b878" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#a89050"; e.currentTarget.style.background = "rgba(255,250,232,1)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#c8b878"; e.currentTarget.style.background = "rgba(255,250,232,0.8)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Search…"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: "#1a2e0a" }}
          />
          <kbd className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#e8dfc0", color: "#9aaa80" }}>⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="flex items-center justify-center px-3 rounded-xl border transition-all duration-150"
          style={{
            borderColor: "#ddd0a8",
            color: "#9aaa80",
            background: "rgba(255,250,232,0.78)",
            height: "40px",
            minWidth: "40px",
          }}
          title="Refresh"
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(42,112,16,0.08)";
            e.currentTarget.style.borderColor = "#b0c890";
            e.currentTarget.style.color = "#3a7010";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,250,232,0.78)";
            e.currentTarget.style.borderColor = "#ddd0a8";
            e.currentTarget.style.color = "#9aaa80";
          }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -960 960 960" fill="currentColor">
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
          </svg>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            className="flex items-center justify-center px-3 rounded-xl border transition-all duration-150"
            style={{
              borderColor: notifOpen ? "#b0c890" : "#ddd0a8",
              color: notifOpen ? "#3a7010" : "#9aaa80",
              background: notifOpen ? "rgba(42,112,16,0.08)" : "rgba(255,250,232,0.78)",
              height: "40px",
              minWidth: "40px",
            }}
            title="Notifications"
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(42,112,16,0.08)";
              e.currentTarget.style.borderColor = "#b0c890";
              e.currentTarget.style.color = "#3a7010";
            }}
            onMouseLeave={e => {
              if (!notifOpen) {
                e.currentTarget.style.background = "rgba(255,250,232,0.78)";
                e.currentTarget.style.borderColor = "#ddd0a8";
                e.currentTarget.style.color = "#9aaa80";
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21M19.75,3.19L18.33,4.61C20.04,6.3 21,8.6 21,11H23C23,8.07 21.84,5.25 19.75,3.19M1,11H3C3,8.6 3.96,6.3 5.67,4.61L4.25,3.19C2.16,5.25 1,8.07 1,11Z" />
            </svg>
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl border p-4 z-50"
              style={{ background: "#fffce8", borderColor: "#ddd0a8" }}
            >
              <div className="font-black text-sm mb-3" style={{ color: "#1a4a08" }}>Notifications</div>
              <div className="text-sm font-semibold text-center py-8" style={{ color: "#9aaa80" }}>
                🔕 No new notifications
              </div>
            </div>
          )}
        </div>

        {/* View Site */}
        <button
          onClick={() => window.open("/", "_blank")}
          className="hidden md:flex items-center gap-2 px-3 rounded-xl border text-xs font-black transition-all duration-150"
          style={{
            background: "rgba(90,170,48,0.13)",
            border: "1.5px solid rgba(90,170,48,0.35)",
            color: "#3a7010",
            height: "40px",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(90,170,48,0.22)";
            e.currentTarget.style.border = "1.5px solid rgba(90,170,48,0.55)";
            e.currentTarget.style.color = "#1a4a08";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(90,170,48,0.13)";
            e.currentTarget.style.border = "1.5px solid rgba(90,170,48,0.35)";
            e.currentTarget.style.color = "#3a7010";
          }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          🌐 View Site
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-150"
            style={{
              borderColor: userOpen ? "#b0c890" : "#ddd0a8",
              background: userOpen ? "rgba(42,112,16,0.08)" : "rgba(255,250,232,0.78)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(42,112,16,0.08)";
              e.currentTarget.style.borderColor = "#b0c890";
            }}
            onMouseLeave={e => {
              if (!userOpen) {
                e.currentTarget.style.background = "rgba(255,250,232,0.78)";
                e.currentTarget.style.borderColor = "#ddd0a8";
              }
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-150"
              style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 -960 960 960" fill="#e3e3e3">
                <path d="M609-389q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29ZM480-160v-56q0-24 12.5-44.5T528-290q36-15 74.5-22.5T680-320q39 0 77.5 7.5T832-290q23 9 35.5 29.5T880-216v56H480ZM287-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm113-113ZM80-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T400-440q35 0 70 6t70 14l-34 34-34 34q-18-5-36-6.5t-36-1.5q-58 0-113.5 14T180-306q-10 5-15 14t-5 20v32h240v80H80Zm320-80Zm56.5-343.5Q480-607 480-640t-23.5-56.5Q433-720 400-720t-56.5 23.5Q320-673 320-640t23.5 56.5Q367-560 400-560t56.5-23.5Z" />
              </svg>
            </div>

            <div className="hidden sm:block text-left">
              <div className="text-xs font-black leading-tight" style={{ color: "#1a4a08" }}>{user.firstName}</div>
              <div className="text-[10px] font-semibold" style={{ color: "#9aaa80" }}>{user.role}</div>
            </div>

            <span
              className="text-xs transition-transform duration-200"
              style={{
                color: "#9aaa80",
                display: "inline-block",
                transform: userOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >▾</span>
          </button>

          {userOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border overflow-hidden z-50"
              style={{ background: "#fffce8", borderColor: "#ddd0a8" }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "#e8dfc0" }}>
                <div className="font-black text-sm" style={{ color: "#1a4a08" }}>{user.firstName} {user.lastName}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>{user.email}</div>
              </div>
              <button
                onClick={() => { setUserOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all duration-150"
                style={{ color: "#3a5020" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(42,112,16,0.08)"; e.currentTarget.style.color = "#1a4a08"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3a5020"; }}
              >
                ⚙️ Profile Settings
              </button>
              <div className="border-t" style={{ borderColor: "#e8dfc0" }} />
              <button
                onClick={() => { setUserOpen(false); window.location.href = "/"; }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all duration-150"
                style={{ color: "#c03030" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,48,48,0.07)"; e.currentTarget.style.color = "#9b1c1c"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c03030"; }}
              >
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

  const [user, setUser] = useState(null);
  const [panel, setPanel] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { toasts, show: toast } = useToast();

  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    phpApi("stats").then(r => { if (r.success) setStats(r.data || {}); }).catch(() => { });
  }, [refreshKey]);

  if (!user) return null;

  const refresh = () => {
    setRefreshKey(k => k + 1);
    toast("Dashboard refreshed", "success");
  };

  const handleLogout = () => logout();
  const updateUser = (updates) => setUser(u => ({ ...u, ...updates }));
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
          {panel === "overview" && <DashboardPanel stats={stats} onNav={setPanel} user={user} />}
          {panel === "animals" && <AnimalsPanel show={panel === "animals"} />}
          {panel === "adoptions" && <RequestsPanel type="adoptions" show={panel === "adoptions"} />}
          {panel === "rehome" && <RequestsPanel type="rehome" show={panel === "rehome"} />}
          {panel === "surveys" && <SurveysPanel show={panel === "surveys"} />}
          {panel === "users" && <UsersPanel show={panel === "users"} />}
          {panel === "activity" && <ActivityPanel show={panel === "activity"} />}
          {panel === "map" && <GeoMapPanel show={panel === "map"} />}
          {panel === "profile" && <ProfilePanel user={user} onUserUpdate={updateUser} />}
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