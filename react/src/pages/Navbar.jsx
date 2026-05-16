// pages/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";
import NotificationBell from "./NotificationBell";

const NAV_LINKS = [
  { to: "/home",          icon: "fas fa-house",           label: "Home" },
  { to: "/pets",          icon: "fas fa-search",          label: "Find a Pet" },
  { to: "/how-it-works",  icon: "fas fa-list-ol",         label: "How It Works" },
  { to: "/rehome",        icon: "fas fa-home",            label: "Rehome/Rescue" },
  { to: "/missing-pets", icon: "fas fa-location-dot", label: "Missing Pets" },
  { to: "/about",         icon: "fas fa-info-circle",     label: "About" },
];

export default function Navbar({ photoUrl: externalPhotoUrl }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropOpen,   setDropOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef   = useRef(null);
  const mobileRef = useRef(null);

  const photoUrl = externalPhotoUrl ?? user?.photoUrl ?? null;
  const initials = (
    (user?.firstName?.[0] ?? "") +
    (user?.lastName?.[0]  ?? "U")
  ).toUpperCase();

  // close dropdown when clicking outside
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current   && !dropRef.current.contains(e.target))   setDropOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // close both menus on route change
  useEffect(() => {
    setDropOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center h-[70px] px-4 md:px-10 bg-[rgba(255,248,218,0.92)] backdrop-blur-xl border-b border-[rgba(90,170,48,0.45)] shadow-[0_2px_20px_rgba(100,70,20,0.09)]">

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

        {/* CENTER NAV — desktop only */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center bg-[rgba(255,245,210,0.5)] border border-[rgba(180,140,60,0.28)] rounded-full p-1">
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

          {/* Profile dropdown — desktop */}
          {user ? (
            <div ref={dropRef} className="relative hidden sm:block">
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
                <div className="text-left hidden md:block">
                  <div className="text-xs font-extrabold text-[#1a4a08]">{user.firstName}</div>
                  <div className="text-[10px] font-bold text-[#6a7a50]">Member</div>
                </div>
                <i className={`fas fa-chevron-down text-[10px] transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>

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
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login"    className="px-4 py-2 text-sm font-bold border border-[rgba(180,140,60,0.4)] rounded-md text-[#1a4a08] hover:bg-[rgba(28,79,9,0.06)] transition-colors">Log In</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-bold bg-[#1c4f09] text-white rounded-md hover:bg-[#163a07] transition-colors">Get Started</Link>
            </div>
          )}

          {/* Hamburger — mobile/tablet */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg border border-[rgba(180,140,60,0.28)] bg-[rgba(255,248,220,0.7)] gap-[5px] transition-all"
          >
            <span
              className={`block w-[18px] h-[2px] bg-[#1a4a08] rounded-full transition-all duration-200 origin-center ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`}
            />
            <span
              className={`block w-[18px] h-[2px] bg-[#1a4a08] rounded-full transition-all duration-200 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block w-[18px] h-[2px] bg-[#1a4a08] rounded-full transition-all duration-200 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Slide-in panel */}
      <div
        ref={mobileRef}
        className={`lg:hidden fixed top-0 right-0 z-50 h-full w-[280px] bg-[rgba(255,251,228,0.99)] border-l border-[rgba(180,140,60,0.28)] shadow-2xl flex flex-col transition-transform duration-250 ease-in-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-[70px] border-b border-[rgba(180,140,60,0.2)] shrink-0">
          <span className="text-[0.72rem] font-black uppercase tracking-widest text-[#6a7a50]">
  Menu
</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[rgba(28,79,9,0.08)] transition-colors text-[#3a5020]"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* User info — shown in drawer on small screens */}
        {user && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(180,140,60,0.2)] shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="av" className="w-10 h-10 rounded-full object-cover border-2 border-[#5aaa30]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1c4f09] to-[#3a8a18] text-white flex items-center justify-center text-sm font-black border-2 border-[#5aaa30] shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-[#1a4a08] truncate">{user.firstName} {user.lastName}</div>
              <div className="text-[11px] text-[#6a7a50] font-semibold truncate">{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_LINKS.map(({ to, icon, label }) => {
            const isActive  = location.pathname === to;
            const isMissing = to === "/missing-pets";
            return (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-[0.88rem] font-extrabold mb-1 transition-all
                  ${isActive
                    ? "bg-gradient-to-r from-[rgba(28,79,9,0.14)] to-[rgba(90,170,48,0.08)] text-[#1a4a08] shadow-sm"
                    : isMissing
                      ? "text-[#B45A22] hover:bg-[rgba(180,90,34,0.1)]"
                      : "text-[#3a5020] hover:bg-[rgba(28,79,9,0.07)]"
                  }
                `}
              >
                <i className={`${icon} w-4 text-center text-[0.8rem]`} />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3a8a18]" />}
              </Link>
            );
          })}

          {/* Profile links for logged-in users (mobile) */}
          {user && (
            <>
              <div className="h-px bg-[rgba(180,140,60,0.2)] my-3 mx-1" />
              <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[0.88rem] font-extrabold text-[#3a5020] hover:bg-[rgba(28,79,9,0.07)] mb-1 transition-all">
                <i className="fas fa-gauge w-4 text-center text-[0.8rem]" />
                Dashboard
              </Link>
              <Link to="/profile/edit" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[0.88rem] font-extrabold text-[#3a5020] hover:bg-[rgba(28,79,9,0.07)] mb-1 transition-all">
                <i className="fas fa-user-pen w-4 text-center text-[0.8rem]" />
                My Profile
              </Link>
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 pb-6 pt-3 border-t border-[rgba(180,140,60,0.2)] shrink-0">
          {user ? (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <i className="fas fa-right-from-bracket text-[0.8rem]" />
              Log Out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center px-4 py-2.5 text-sm font-extrabold border border-[rgba(180,140,60,0.4)] rounded-xl text-[#1a4a08] hover:bg-[rgba(28,79,9,0.06)] transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="w-full text-center px-4 py-2.5 text-sm font-extrabold bg-[#1c4f09] text-white rounded-xl hover:bg-[#163a07] transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}