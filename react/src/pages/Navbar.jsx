// pages/Navbar.jsx — updated: chat icon opens floating modal instead of navigating
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMessaging } from "../hooks/useMessaging";
import MessagingModal from "./MessagingModal";
import logo from "../images/logo.png";
import NotificationBell from "./NotificationBell";

const NAV_LINKS = [
  { to: "/home",          icon: "fas fa-house",           label: "Home" },
  { to: "/pets",          icon: "fas fa-search",          label: "Find a Pet" },
  { to: "/how-it-works",  icon: "fas fa-list-ol",         label: "How It Works" },
  { to: "/rehome",        icon: "fas fa-home",            label: "Rehome" },
  { to: "/missing-pets",  icon: "fas fa-search-location", label: "Missing Pets" },
  { to: "/about",         icon: "fas fa-info-circle",     label: "About" },
];

function ChatIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      {/* Back bubble */}
      <rect x="7" y="3" width="13" height="9" rx="2.5" opacity="0.45"/>
      {/* Front bubble */}
      <path d="M2 8.5C2 7.4 2.9 6.5 4 6.5H14C15.1 6.5 16 7.4 16 8.5V15C16 16.1 15.1 17 14 17H8.5L5.5 19.5C5.2 19.8 4.7 19.6 4.7 19.2V17H4C2.9 17 2 16.1 2 15V8.5Z"/>
      {/* Lines on front bubble */}
      <rect x="5" y="10.5" width="8" height="1.5" rx="0.75" fill="white" opacity="0.9"/>
      <rect x="5" y="13" width="5" height="1.5" rx="0.75" fill="white" opacity="0.9"/>
    </svg>
  );
}

export default function Navbar({ photoUrl: externalPhotoUrl }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropOpen,  setDropOpen]  = useState(false);
  const [chatOpen,  setChatOpen]  = useState(false);   // ← NEW: modal state
  const [unread,    setUnread]    = useState(0);        // ← NEW: badge count from modal
  const dropRef = useRef(null);

  // Still subscribe to unreadCount here so the badge works even before modal opens
  const { unreadCount } = useMessaging(user);

  // Keep local unread in sync with the hook (modal will override via onUnreadChange)
  useEffect(() => { setUnread(unreadCount); }, [unreadCount]);

  const photoUrl = externalPhotoUrl ?? user?.photoUrl ?? null;
  const initials = (
    (user?.firstName?.[0] ?? "") +
    (user?.lastName?.[0] ?? "U")
  ).toUpperCase();

  // close dropdown when clicking outside
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // close dropdown on route change
  useEffect(() => setDropOpen(false), [location.pathname]);

  const handleUnreadChange = useCallback((count) => setUnread(count), []);

  const toggleChat = () => {
    setDropOpen(false);   // close dropdown if open
    setChatOpen(o => !o);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center h-[70px] px-10 bg-[rgba(255,248,218,0.92)] backdrop-blur-xl border-b border-[rgba(90,170,48,0.45)] shadow-[0_2px_20px_rgba(100,70,20,0.09)]">

        {/* LEFT BRAND */}
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <img
            src={logo}
            alt="Pawster"
            className="w-8 h-8 object-contain"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span className="font-black text-[1.25rem] text-[#1a4a08]">
            Paw<em className="italic text-[#e07820]">ster</em>
          </span>
        </Link>

        {/* CENTER NAV */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center bg-[rgba(255,245,210,0.5)] border border-[rgba(180,140,60,0.28)] rounded-full p-1">
          {NAV_LINKS.map(({ to, icon, label }) => {
            const isActive  = location.pathname === to;
            const isMissing = to === "/missing-pets";
            return (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-1 px-3 py-1.5 text-[0.78rem] font-extrabold rounded-full whitespace-nowrap h-[34px]
                  transition-all
                  ${isActive
                    ? "bg-gradient-to-br from-[rgba(28,79,9,0.16)] to-[rgba(90,170,48,0.12)] text-[#1a4a08] shadow"
                    : isMissing
                      ? "text-[#B45A22] hover:bg-[rgba(180,90,34,0.15)]"
                      : "text-[#3a5020] hover:bg-[rgba(28,79,9,0.07)]"
                  }
                `}
              >
                <i className={`${icon} text-[0.7rem]`} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user && <NotificationBell token={localStorage.getItem("pawster_token")} />}

          {/* ── Chat toggle button (non-admin users only) ── */}
          {user && user.role !== "admin" && (
            <button
              onClick={toggleChat}
              className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all border-0 bg-transparent cursor-pointer"
              style={{
                color: chatOpen ? "#1c4f09" : "#5a7a50",
                background: chatOpen ? "rgba(28,79,9,0.1)" : "transparent",
              }}
              title="Messages"
            >
              <ChatIcon size={20} />
              {unread > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: "#B45A22", lineHeight: 1 }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div ref={dropRef} className="relative">
              <button
                onClick={() => setDropOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,248,220,0.7)] border border-[rgba(180,140,60,0.28)]"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="av"
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#5aaa30]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1c4f09] to-[#3a8a18] text-white flex items-center justify-center text-xs font-black border-2 border-[#5aaa30]">
                    {initials}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-extrabold text-[#1a4a08]">{user.firstName}</div>
                  <div className="text-[10px] font-bold text-[#6a7a50]">Member</div>
                </div>
                <i className={`fas fa-chevron-down text-[10px] transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>

              {/* DROPDOWN */}
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-[220px] rounded-xl border border-[rgba(180,140,60,0.28)] bg-[rgba(255,252,235,0.99)] shadow-xl p-2 animate-[fadeIn_.15s_ease]">
                  <div className="flex items-center gap-2 p-2">
                    {photoUrl ? (
                      <img src={photoUrl} alt="" className="w-9 h-9 rounded-full border-2 border-[#5aaa30]" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#1c4f09] text-white flex items-center justify-center text-xs font-black border-2 border-[#5aaa30]">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold truncate">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>

                  <div className="h-px bg-[rgba(180,140,60,0.22)] my-1" />

                  <Link to="/profile" className="block px-3 py-2 text-sm font-bold hover:bg-black/5 rounded-md">
                    Dashboard
                  </Link>
                  <Link to="/profile/edit" className="block px-3 py-2 text-sm font-bold hover:bg-black/5 rounded-md">
                    My Profile
                  </Link>

                  {/* Messages — now opens modal instead of navigating */}
                  {user.role !== "admin" && (
                    <button
                      onClick={toggleChat}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-bold hover:bg-black/5 rounded-md border-0 bg-transparent cursor-pointer"
                      style={{ color: "#1c4f09" }}
                    >
                      <span className="relative">
                        <ChatIcon size={13} />
                        {unread > 0 && (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full"
                            style={{ background: "#B45A22" }}
                          />
                        )}
                      </span>
                      Messages
                      {unread > 0 && (
                        <span
                          className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
                          style={{ background: "#B45A22" }}
                        >
                          {unread}
                        </span>
                      )}
                    </button>
                  )}

                  <div className="h-px bg-[rgba(180,140,60,0.22)] my-1" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="px-4 py-2 text-sm font-bold border rounded-md">Log In</Link>
              <Link className="px-4 py-2 text-sm font-bold bg-[#1c4f09] text-white rounded-md">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Floating chat modal — rendered outside nav flow ── */}
      {user && user.role !== "admin" && (
        <MessagingModal
          user={user}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          onUnreadChange={handleUnreadChange}
        />
      )}
    </>
  );
}