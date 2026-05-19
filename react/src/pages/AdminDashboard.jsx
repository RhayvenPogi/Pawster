// ── ADMIN DASHBOARD — Tailwind version
import { useState, useEffect, useRef, useCallback } from "react";
import { phpApi, useToast, ToastContainer } from "../shared";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";


import LoadingScreen from "./LoadingScreen";
import DashboardPanel from "./admin/DashboardPanel";
import AnimalsPanel from "./admin/AnimalsPanel";
import RequestsPanel from "./admin/RequestsPanel";
import SurveysPanel from "./admin/SurveysPanel";
import UsersPanel from "./admin/UsersPanel";
import GeoMapPanel from "./admin/GeoMapPanel";
import ActivityPanel from "./admin/ActivityPanel";
import ProfilePanel from "./admin/ProfilePanel";
import MissingPetsPanel from "./admin/MissingPetsPanel";
import AnalyticsPanel from "./admin/AnalyticsPanel";
import AdminMessagingPanel from "./admin/AdminMessagingPanel";


const NAV = [
  {
    group: "Overview",
    items: [
      {
        id: "overview", label: "Dashboard", ico: "ico-blue", faIcon: "chart-line",
        badge: "total_records", badgeWarn: false
      },
    ],
  },
  {
    group: "Management",
    items: [
      {
        id: "animals", label: "Animals", ico: "ico-green", faIcon: "paw",
        badge: "animals", badgeWarn: false
      },
      {
        id: "adoptions", label: "Adoptions", ico: "ico-orange", faIcon: "heart",
        badge: "pending_adoptions", badgeWarn: true
      },
      {
        id: "rehome", label: "Rehoming", ico: "ico-amber", faIcon: "home",
        badge: "pending_rehome", badgeWarn: true
      },
      {
        id: "surveys", label: "Feedbacks", ico: "ico-teal", faIcon: "clipboard-list",
        badge: "surveys", badgeWarn: false
      },
      {
        id: "missingpets", label: "Missing Pets", ico: "ico-rose", faIcon: "search",
        badge: "missing_pets", badgeWarn: true
      },
    ],
  },
  {
    group: "Analytics",
    items: [
      {
        id: "analytics", label: "Analytics", ico: "ico-teal", faIcon: "chart-bar",
        badge: "total_records", badgeWarn: false
      },
      {
        id: "map", label: "Geographic Map", ico: "ico-blue", faIcon: "globe-asia",
        badge: "users", badgeWarn: false
      },
    ],
  },
  {
    group: "System",
    items: [
      {
        id: "users", label: "User Management", ico: "ico-purple", faIcon: "users",
        badge: "users", badgeWarn: false
      },
      {
        id: "activity", label: "Activity Log", ico: "ico-rose", faIcon: "history",
        badge: "activity_today", badgeWarn: false
      },
    ],
  },
];


const ICO_COLORS = {
  "ico-blue": { bg: "rgba(32,96,160,0.12)", color: "#2060a0" },
  "ico-green": { bg: "rgba(90,170,48,0.14)", color: "#1c4f09" },
  "ico-orange": { bg: "rgba(180,90,34,0.14)", color: "#B45A22" },
  "ico-amber": { bg: "rgba(212,136,10,0.14)", color: "#d4880a" },
  "ico-teal": { bg: "rgba(26,138,106,0.14)", color: "#1a8a6a" },
  "ico-purple": { bg: "rgba(122,61,192,0.14)", color: "#7a3dc0" },
  "ico-rose": { bg: "rgba(176,48,96,0.14)", color: "#b03060" },
};


function isDeleted(item) {
  if (!item) return false;
  if (item.deleted_at !== undefined && item.deleted_at !== null && item.deleted_at !== "") return true;
  if (item.deletedAt !== undefined && item.deletedAt !== null && item.deletedAt !== "") return true;
  if (item.is_deleted !== undefined && (item.is_deleted === true || item.is_deleted === 1 || item.is_deleted === "1")) return true;
  if (item.isDeleted !== undefined && (item.isDeleted === true || item.isDeleted === 1 || item.isDeleted === "1")) return true;
  if (typeof item.status === "string" && item.status.toLowerCase() === "deleted") return true;
  return false;
}


function filterActive(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => !isDeleted(item));
}


function normalizeUser(authUser) {
  if (!authUser) return null;
  if (authUser.id) return authUser;
  try {
    const payload = JSON.parse(atob(authUser.token.split(".")[1]));
    return { ...authUser, id: payload.sub ?? authUser.email };
  } catch {
    return { ...authUser, id: authUser.email };
  }
}


// ── MOBILE DETECTION ───────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}


// ── MESH BACKGROUND ────────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: "#EDDABB" }} />
      <div className="absolute rounded-full opacity-50" style={{ top: "-15%", left: "-10%", width: 900, height: 900, background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(110px)", mixBlendMode: "multiply", animation: "float1 8s ease-in-out infinite" }} />
      <div className="absolute rounded-full opacity-50" style={{ top: "5%", right: "-15%", width: 800, height: 800, background: "radial-gradient(circle,#B45A22,transparent 70%)", filter: "blur(110px)", mixBlendMode: "multiply", animation: "float2 10s ease-in-out infinite" }} />
      <div className="absolute rounded-full opacity-50" style={{ bottom: "-10%", left: "15%", width: 700, height: 700, background: "radial-gradient(circle,#e8e0d0,transparent 60%)", filter: "blur(110px)", mixBlendMode: "multiply", animation: "float3 7s ease-in-out infinite" }} />
      <div className="absolute rounded-full opacity-50" style={{ top: "40%", right: "20%", width: 600, height: 600, background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(110px)", mixBlendMode: "multiply", animation: "float4 9s ease-in-out infinite" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(100,70,30,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.035) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.15) 100%)" }} />
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(8%,12%) scale(1.1)} 66%{transform:translate(-5%,6%) scale(0.92)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-10%,8%) scale(0.92)} 66%{transform:translate(6%,-10%) scale(1.1)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(10%,-8%) scale(1.08)} }
        @keyframes float4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-10%,-10%) scale(1.12)} }
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,0.4)} 50%{box-shadow:0 0 0 6px rgba(90,170,48,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pageFadeIn { from{opacity:0} to{opacity:1} }
        .dot-pulse { animation: dotPulse 2s ease infinite; }
        .fade-up { animation: fadeUp 0.25s ease both; }
        .spinning { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}


// ── SVG ICONS ──────────────────────────────────────────────────────────────────
function FaIcon({ name, size = 14, color = "currentColor" }) {
  const icons = {
    "chart-line": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    "chart-bar": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="7" width="4" height="14" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
        <line x1="2" y1="21" x2="22" y2="21" />
      </svg>
    ),
    "paw": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <ellipse cx="6.5" cy="9.5" rx="2.2" ry="2.8" />
        <ellipse cx="10.2" cy="7" rx="2.2" ry="2.8" />
        <ellipse cx="13.8" cy="7" rx="2.2" ry="2.8" />
        <ellipse cx="17.5" cy="9.5" rx="2.2" ry="2.8" />
        <path d="M12 13.5c-2.2 0-5 1.5-5 3.8 0 1.5 1.2 2.7 3 2.7h4c1.8 0 3-1.2 3-2.7 0-2.3-2.8-3.8-5-3.8z" />
      </svg>
    ),
    "heart": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    "home": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    "clipboard-list": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
    "search": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    "globe-asia": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M9 4.5c1 1.5 1.5 3 1.5 7.5s-.5 6-1.5 7.5" />
      </svg>
    ),
    "users": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    "history": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
    "comments": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    "bars": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
    "rotate-right": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    "external-link-alt": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
    "user-shield": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    "user-cog": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
        <circle cx="19" cy="19" r="2" />
        <path d="M19 15v2M19 21v2M15 19h2M21 19h2M16.5 16.5l1.5 1.5M20.5 20.5l1.5 1.5M20.5 16.5l-1.5 1.5M16.5 20.5l-1.5 1.5" />
      </svg>
    ),
    "shield-alt": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    "sign-out-alt": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    "times": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    "bell": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    "arrow-left": (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    ),
  };


  return icons[name] ?? null;
}


// ── PROFILE MODAL ──────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onUserUpdate, defaultTab = "profile" }) {
  const [tab, setTab] = useState(defaultTab);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [fname, setFname] = useState(user?.firstName || "");
  const [lname, setLname] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(user?.avatar || "");
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef = useRef(null);


  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };


  const getStrength = (p) => {
    if (!p) return { w: "0%", color: "#ddd", label: "" };
    if (p.length < 6) return { w: "25%", color: "#c03030", label: "Weak" };
    if (p.length < 8) return { w: "50%", color: "#d4880a", label: "Fair" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { w: "100%", color: "#1c4f09", label: "Strong" };
    return { w: "75%", color: "#5aaa30", label: "Good" };
  };
  const str = getStrength(newPass);


  const saveProfile = async () => {
    if (!fname.trim() || !email.trim()) return showMsg("error", "Name and email are required.");
    setSaving(true);
    try {
      const r = await phpApi("update_profile", { first_name: fname, last_name: lname, email, phone });
      if (r.success) { onUserUpdate({ firstName: fname, lastName: lname, email, phone }); showMsg("success", "Profile updated successfully!"); }
      else showMsg("error", r.message || "Failed to update.");
    } catch { showMsg("error", "Network error."); }
    setSaving(false);
  };


  const changePassword = async () => {
    if (!current || !newPass || !confirm) return showMsg("error", "All fields are required.");
    if (newPass !== confirm) return showMsg("error", "Passwords do not match.");
    if (newPass.length < 8) return showMsg("error", "Password must be at least 8 characters.");
    setSaving(true);
    try {
      const r = await phpApi("change_password", { current_password: current, new_password: newPass, confirm_password: confirm });
      if (r.success) { setCurrent(""); setNewPass(""); setConfirm(""); showMsg("success", "Password changed!"); }
      else showMsg("error", r.message || "Failed to change password.");
    } catch { showMsg("error", "Network error."); }
    setSaving(false);
  };


  const previewPhoto = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setPendingFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPhotoSrc(ev.target.result);
    reader.readAsDataURL(f);
  };


  const uploadPhoto = async () => {
    if (!pendingFile) return;
    const fd = new FormData();
    fd.append("action", "upload_photo");
    fd.append("photo", pendingFile);
    try {
      const res = await fetch("/php/admin/dashboard", { method: "POST", body: fd, credentials: "include" });
      const r = await res.json();
      if (r.success) {
        setPendingFile(null);
        const newAvatar = r.data?.url || r.url;
        setPhotoSrc(newAvatar);
        onUserUpdate({ avatar: newAvatar });
        showMsg("success", "Photo updated!");
      } else {
        showMsg("error", r.message || "Upload failed.");
      }
    } catch { showMsg("error", "Upload error."); }
  };


  const tabs = [
    { id: "profile", label: "Personal Info", icon: "👤" },
    { id: "photo", label: "Photo", icon: "📷" },
    { id: "security", label: "Security", icon: "🔒" },
  ];


  const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1a2e0a] outline-none transition-all duration-150 border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.78)] focus:border-[#5aaa30] focus:ring-2 focus:ring-[rgba(90,170,48,0.12)]";
  const labelCls = "block text-[0.72rem] font-black uppercase tracking-wider text-[#6a7a50] mb-1";


  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-[600] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(100,70,20,0.22)" }}>
      <div className="w-full max-w-[520px] max-h-[92vh] overflow-hidden flex flex-col rounded-[18px] shadow-2xl fade-up" style={{ background: "rgba(255,252,235,0.99)", border: "1.5px solid rgba(90,170,48,0.45)" }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1.5px solid rgba(180,140,60,0.28)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg overflow-hidden shrink-0 border-2 border-[#5aaa30]" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
              {photoSrc ? <img src={photoSrc} alt="avatar" className="w-full h-full object-cover rounded-full" /> : (user?.firstName?.charAt(0)?.toUpperCase() || "A")}
            </div>
            <div>
              <div className="font-black text-base text-[#1a4a08]">{user?.firstName} {user?.lastName}</div>
              <div className="text-[0.72rem] font-bold text-[#6a7a50]">{user?.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6a7a50] hover:text-[#1a4a08] hover:bg-[rgba(90,170,48,0.10)] rounded-lg px-2 py-1 transition-all duration-150 text-xl border-none bg-transparent cursor-pointer">✕</button>
        </div>
        <div className="flex shrink-0" style={{ borderBottom: "1.5px solid rgba(180,140,60,0.28)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-[0.80rem] font-extrabold transition-all duration-150 border-none bg-transparent cursor-pointer border-b-2 ${tab === t.id ? "text-[#1a4a08] border-b-[#5aaa30]" : "text-[#6a7a50] border-b-transparent"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {msg.text && (
          <div className={`mx-6 mt-3 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 ${msg.type === "success" ? "bg-[rgba(90,170,48,0.12)] text-[#1c4f09] border border-[rgba(90,170,48,0.28)]" : "bg-[rgba(192,48,48,0.10)] text-[#c03030] border border-[rgba(192,48,48,0.22)]"}`}>
            {msg.type === "success" ? "✓ " : "✕ "}{msg.text}
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">
          {tab === "profile" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>First Name *</label><input value={fname} onChange={e => setFname(e.target.value)} className={inputCls} placeholder="First name" /></div>
                <div><label className={labelCls}>Last Name</label><input value={lname} onChange={e => setLname(e.target.value)} className={inputCls} placeholder="Last name" /></div>
              </div>
              <div><label className={labelCls}>Email Address *</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="your@email.com" /></div>
              <div><label className={labelCls}>Phone Number</label><input value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+63 900 000 0000" /></div>
              <div><label className={labelCls}>Role</label><input value={user?.role || ""} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} /></div>
              <div className="flex justify-end pt-1">
                <button onClick={saveProfile} disabled={saving} className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all duration-150 ${saving ? "opacity-70 cursor-not-allowed" : "hover:bg-[#143806] cursor-pointer"}`} style={{ background: "#1c4f09", boxShadow: "0 3px 10px rgba(28,79,9,0.22)" }}>
                  💾 {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
          {tab === "photo" && (
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-32 h-32 rounded-full cursor-pointer shadow-lg" onClick={() => fileRef.current?.click()}>
                <div className="w-32 h-32 rounded-full overflow-hidden border-[3px] border-[#5aaa30] flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
                  {photoSrc ? <img src={photoSrc} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-5xl text-white/90">👤</span>}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/44 flex flex-col items-center justify-center text-white gap-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <span className="text-2xl">📷</span>
                  <span className="text-[0.72rem] font-extrabold">Change</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={previewPhoto} />
              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold text-[#3a5020] transition-all duration-150 cursor-pointer hover:border-[#5aaa30]" style={{ background: "rgba(255,250,232,0.88)", border: "1.5px solid rgba(180,140,60,0.28)" }}>📁 Choose File</button>
                {pendingFile && <button onClick={uploadPhoto} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-extrabold text-white cursor-pointer hover:bg-[#143806] transition-all duration-150" style={{ background: "#1c4f09" }}>☁ Save Photo</button>}
              </div>
              <p className="text-[0.71rem] font-bold text-[#6a7a50] text-center">JPG, PNG, GIF or WebP · Max 2MB</p>
            </div>
          )}
          {tab === "security" && (
            <div className="flex flex-col gap-4">
              {[
                ["Current Password *", showCur, setShowCur, current, setCurrent, "Enter current password"],
                ["New Password *", showNew, setShowNew, newPass, setNewPass, "Min 8 characters"],
                ["Confirm New Password *", showCon, setShowCon, confirm, setConfirm, "Repeat new password"],
              ].map(([label, show, setShow, val, setVal, ph]) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <div className="flex items-center rounded-lg overflow-hidden border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.78)] focus-within:border-[#5aaa30] focus-within:ring-2 focus-within:ring-[rgba(90,170,48,0.12)] transition-all duration-150">
                    <input type={show ? "text" : "password"} value={val} onChange={e => setVal(e.target.value)} placeholder={ph} className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-sm font-semibold text-[#1a2e0a]" />
                    <button type="button" onClick={() => setShow(s => !s)} className="px-3 py-2.5 text-[#6a7a50] hover:text-[#1c4f09] border-none bg-transparent cursor-pointer text-sm transition-colors duration-150" style={{ borderLeft: "1.5px solid rgba(180,140,60,0.28)" }}>{show ? "🙈" : "👁"}</button>
                  </div>
                  {label.startsWith("New") && newPass && (
                    <div className="mt-1.5">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(180,140,60,0.14)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: str.w, background: str.color }} />
                      </div>
                      <span className="text-[0.71rem] font-extrabold mt-0.5 block" style={{ color: str.color }}>{str.label}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <button onClick={changePassword} disabled={saving} className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all duration-150 ${saving ? "opacity-70 cursor-not-allowed" : "hover:bg-[#143806] cursor-pointer"}`} style={{ background: "#1c4f09", boxShadow: "0 3px 10px rgba(28,79,9,0.22)" }}>
                  🔑 {saving ? "Updating…" : "Update Password"}
                </button>
              </div>
              <div className="pt-4 mt-1 flex flex-col gap-2" style={{ borderTop: "1.5px solid rgba(180,140,60,0.28)" }}>
                <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#6a7a50]">Account Info</div>
                {[["Full Name", `${user?.firstName || ""} ${user?.lastName || ""}`.trim()], ["Email", user?.email], ["Role", user?.role], ["Status", "Active"]].map(row => (
                  <div key={row[0]} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(180,140,60,0.11)" }}>
                    <span className="text-[0.82rem] font-extrabold text-[#6a7a50]">{row[0]}</span>
                    <span className="text-sm font-bold text-[#1a2e0a]">{row[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── SIDEBAR ────────────────────────────────────────────────────────────────────
function Sidebar({ active, onNav, onNavMobile, stats, user, collapsed, onToggle, onLogout }) {
  const avatarSrc = user?.avatar || "";
  const [hovered, setHovered] = useState(null);


  const handleNav = (id) => {
    if (onNavMobile) {
      onNavMobile(id);
    } else {
      onNav(id);
    }
  };


  return (
    <aside className="fixed left-0 top-0 z-[200] h-screen flex flex-col overflow-hidden transition-all duration-300"
      style={{ width: collapsed ? 64 : 252, background: "rgba(255,248,220,0.90)", backdropFilter: "blur(22px)", borderRight: "1.5px solid rgba(90,170,48,0.45)", boxShadow: "4px 0 24px rgba(100,70,20,0.10)", transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}>


      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3.5 shrink-0 overflow-hidden h-16" style={{ borderBottom: "1.5px solid rgba(180,140,60,0.28)" }}>
        <img src={logo} alt="Pawster" className="object-contain shrink-0" style={{ width: collapsed ? 36 : 50, height: collapsed ? 36 : 50 }} onError={e => { e.target.style.display = "none"; }} />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="block text-[1.1rem] font-bold text-[#1a4a08] whitespace-nowrap" style={{ fontFamily: "'Playfair Display', serif" }}>Pawster</span>
            <span className="block text-[0.64rem] font-black text-[#6a7a50] uppercase tracking-widest whitespace-nowrap">Admin Panel</span>
          </div>
        )}
        <button onClick={onToggle} className="shrink-0 p-1.5 rounded-lg text-[#6a7a50] hover:bg-[rgba(90,170,48,0.12)] hover:text-[#1a4a08] transition-all duration-200 border-none bg-transparent cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
        </button>
      </div>


      {/* User info */}
      <div className={`flex items-center gap-2.5 px-3.5 py-3 shrink-0 ${collapsed ? "justify-center" : ""}`} style={{ background: "rgba(90,170,48,0.07)", borderBottom: "1.5px solid rgba(180,140,60,0.28)" }}>
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white overflow-hidden border-2 border-[#5aaa30]" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
          {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover rounded-full" /> : <FaIcon name="user-shield" size={18} color="#fff" />}
        </div>
        {!collapsed && (
          <div>
            <strong className="block text-[0.84rem] font-extrabold text-[#1a4a08] whitespace-nowrap overflow-hidden text-ellipsis max-w-[145px]">{user?.firstName}</strong>
            <span className="flex items-center gap-1 text-[0.68rem] font-bold text-[#6a7a50]">
              <span className="dot-pulse inline-block w-2 h-2 rounded-full bg-[#4ccc20]" />Online
            </span>
          </div>
        )}
      </div>


      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(180,140,60,0.28) transparent" }}>
        {NAV.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <div className="text-[0.61rem] font-black uppercase tracking-widest text-[#6a7a50] px-2 pt-3 pb-1">{group.group}</div>
            )}
            {group.items.map(item => {
              const isActive = active === item.id;
              const isHovered = hovered === item.id;
              const ico = ICO_COLORS[item.ico] || ICO_COLORS["ico-blue"];
              const count = item.badge ? (stats[item.badge] ?? 0) : 0;
              const highlight = isActive || isHovered;


              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full flex items-center gap-2 mb-0.5 rounded-xl text-[0.855rem] font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border-none ${collapsed ? "p-2.5 justify-center" : "py-2 px-2.5"} ${highlight ? "text-[#1a4a08]" : "text-[#3a5020]"}`}
                  style={{
                    background: highlight ? "rgba(90,170,48,0.17)" : "transparent",
                    border: highlight ? "1.5px solid rgba(90,170,48,0.30)" : "1.5px solid transparent",
                  }}
                >
                  <div
                    className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: ico.bg }}
                  >
                    <FaIcon name={item.faIcon} size={15} color={ico.color} />
                  </div>
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && count > 0 && (
                    <div
                      className="text-[0.63rem] font-black px-2 py-0.5 rounded-full"
                      style={{
                        background: item.badgeWarn ? "rgba(180,90,34,0.15)" : (isActive ? "rgba(90,170,48,0.20)" : "rgba(180,140,60,0.14)"),
                        color: item.badgeWarn ? "#B45A22" : (isActive ? "#1c4f09" : "#6a7a50"),
                      }}
                    >
                      {count}
                    </div>
                  )}
                  {collapsed && item.badgeWarn && count > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B45A22]" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}


// ── MESSAGING BUTTON (topbar) ─────────────────────────────────────────────────
function MessagingButton({ unreadCount, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Messages"
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 cursor-pointer border-none"
      style={{
        background: isActive ? "rgba(26,138,106,0.18)" : "rgba(255,250,232,0.78)",
        border: isActive ? "1.5px solid rgba(26,138,106,0.45)" : "1.5px solid rgba(180,140,60,0.28)",
        color: isActive ? "#1a8a6a" : "#6a7a50",
      }}
    >
      <FaIcon name="comments" size={16} color="currentColor" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white"
          style={{ background: "#B45A22", lineHeight: 1 }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}


// ── TOPBAR ─────────────────────────────────────────────────────────────────────
function Topbar({ panel, user, onRefresh, onToggle, collapsed, onNav,
  onOpenProfile, onLogout, unreadMessages, isMobile }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarSrc = user?.avatar || "";


  return (
    <header
      className="fixed top-0 right-0 z-[150] h-16 flex items-center justify-between px-5 gap-2.5 transition-all duration-300"
      style={{ left: collapsed ? 64 : 252, background: "rgba(255,248,220,0.92)", backdropFilter: "blur(18px)", borderBottom: "1.5px solid rgba(180,140,60,0.28)", boxShadow: "0 2px 14px rgba(100,70,20,0.08)", transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
    >
      <button onClick={onToggle} className="p-1.5 rounded-lg text-[#6a7a50] hover:bg-[rgba(90,170,48,0.12)] hover:text-[#1a4a08] transition-all duration-200 border-none bg-transparent cursor-pointer">
        <FaIcon name="bars" size={18} color="currentColor" />
      </button>


      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#6a7a50] text-sm font-bold hover:text-[#1a4a08] hover:border-[#5aaa30] transition-all duration-150 cursor-pointer"
          style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)" }}
          title="Refresh"
        >
          <FaIcon name="rotate-right" size={14} color="currentColor" />
        </button>


        {/* View Site — hide on mobile when sidebar is expanded */}
        <button
          onClick={() => window.open("/home", "_blank")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-[#1c4f09] hover:bg-[#1c4f09] hover:text-white transition-all duration-150 cursor-pointer"
          style={{ background: "rgba(90,170,48,0.13)", border: "1.5px solid rgba(90,170,48,0.35)" }}
        >
          <FaIcon name="external-link-alt" size={13} color="currentColor" />
          {!(isMobile && !collapsed) && " View Site"}
        </button>




        {/* Messages */}
        <MessagingButton
          unreadCount={unreadMessages}
          isActive={panel === "messaging"}
          onClick={() => onNav("messaging")}
        />


        {/* Profile dropdown */}
        <div className="relative">
          <div
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl transition-all duration-200 hover:border-[#5aaa30]"
            style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)" }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white overflow-hidden border border-[#5aaa30]" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
              {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover rounded-full" /> : <FaIcon name="user-shield" size={14} color="#fff" />}
            </div>
            <div>
              <strong className="block text-[0.82rem] font-extrabold text-[#1a4a08] whitespace-nowrap">{user?.firstName}</strong>
              <span className="block text-[0.67rem] font-bold text-[#6a7a50] capitalize">{user?.role}</span>
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#6a7a50" className={`transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}><path d="M7 10l5 5 5-5z" /></svg>
          </div>


          {profileOpen && (
            <div className="fade-up absolute top-[calc(100%+8px)] right-0 z-[999] rounded-2xl p-2 min-w-[230px] shadow-2xl" style={{ background: "rgba(255,252,235,0.98)", border: "1.5px solid rgba(180,140,60,0.28)" }}>
              <div className="flex items-center gap-2.5 px-2 pt-2 pb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-[#5aaa30]" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
                  {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover rounded-full" /> : <FaIcon name="user-shield" size={18} color="#fff" />}
                </div>
                <div>
                  <strong className="block text-[0.88rem] font-extrabold text-[#1a4a08]">{user?.firstName} {user?.lastName}</strong>
                  <span className="text-[0.72rem] font-bold text-[#6a7a50]">{user?.email}</span>
                </div>
              </div>
              <div className="h-px my-1" style={{ background: "rgba(180,140,60,0.28)" }} />
              <a
                onClick={e => { e.preventDefault(); setProfileOpen(false); onLogout(); }}
                href="#"
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#c03030] no-underline text-sm font-bold hover:bg-[rgba(192,48,48,0.10)] transition-all duration-150 cursor-pointer"
              >
                <FaIcon name="sign-out-alt" size={14} color="#c03030" /> Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


// ── ADMIN DASHBOARD ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user: authUser, logout } = useAuth();
  const normalizedAuthUser = normalizeUser(authUser);
  const isMobile = useIsMobile();


  const [user, setUser] = useState(normalizedAuthUser ?? null);
  const [panel, setPanel] = useState("overview");
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const [stats, setStats] = useState({
    animals: 0,
    adoptions: 0,
    rehome: 0,
    users: 0,
    pending_adoptions: 0,
    pending_rehome: 0,
    surveys: 0,
    health_healthy: 0,
    health_care: 0,
    health_treatment: 0,
    missing_pets: 0,
    activity_today: 0,
    total_records: 0,
    unread_messages: 0,
  });
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toasts, show: toast } = useToast();
  const [profileModal, setProfileModal] = useState({ open: false, tab: "profile" });


  usePageTitle("Admin Dashboard");


  // Sync collapsed state when viewport crosses mobile breakpoint
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);


  useEffect(() => {
    if (authUser) setUser(normalizeUser(authUser));
  }, [authUser]);


  const fetchStats = useCallback(async () => {
    try {
      const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";
      const token =
        localStorage.getItem("pawster_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};


      const [phpRes, mpRes, adoptionRes, rehomeRes] = await Promise.all([
        phpApi("stats"),
        fetch("/api/missing-pets"),
        fetch(`${DJANGO}/api/approvals/adoptions/admin/`, { headers }),
        fetch(`${DJANGO}/api/approvals/rehoming/admin/`, { headers }),
      ]);


      const phpData = phpRes.success ? (phpRes.data || {}) : {};


      let missingCount = phpData.missing_pets ?? 0;
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        if (Array.isArray(mpData)) missingCount = filterActive(mpData).length;
      }


      let adoptionCount = phpData.pending_adoptions ?? 0;
      if (adoptionRes.ok) {
        const adoptionData = await adoptionRes.json();
        const arr = adoptionData?.data || adoptionData || [];
        if (Array.isArray(arr)) adoptionCount = filterActive(arr).filter(r => r.status === "Pending").length;
      }


      let rehomeCount = phpData.pending_rehome ?? 0;
      if (rehomeRes.ok) {
        const rehomeData = await rehomeRes.json();
        const arr = rehomeData?.data || rehomeData || [];
        if (Array.isArray(arr)) rehomeCount = filterActive(arr).filter(r => r.status === "Pending").length;
      }


      setStats(prev => ({
        ...prev,
        ...phpData,
        missing_pets: missingCount,
        pending_adoptions: adoptionCount,
        pending_rehome: rehomeCount,
      }));
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);


  useEffect(() => {
    const MIN_DISPLAY = 2800;
    const start = Date.now();
    fetchStats().then(() => {
      const elapsed = Date.now() - start;
      const remaining = MIN_DISPLAY - elapsed;
      if (remaining > 0) {
        setTimeout(() => setReady(true), remaining);
      } else {
        setReady(true);
      }
    });
  }, [fetchStats, refreshKey]);


  useEffect(() => {
    const interval = setInterval(fetchStats, 5_000);
    return () => clearInterval(interval);
  }, [fetchStats]);


  const handleUnreadChange = useCallback((count) => {
    setStats(prev => ({ ...prev, unread_messages: count }));
  }, []);


  // Mobile-aware nav handler: collapses sidebar after navigation on mobile
  const handleNavMobile = useCallback((id) => {
    setPanel(id);
    if (isMobile) setCollapsed(true);
  }, [isMobile]);


  if (!user) return null;
  if (!ready) return <LoadingScreen destination="" />;


  const refresh = () => {
    setRefreshKey(k => k + 1);
    toast("Dashboard refreshed", "success");
  };


  const updateUser = (updates) => {
    setUser(u => {
      const updated = { ...u, ...updates };
      localStorage.setItem("pawster_user", JSON.stringify(updated));
      return updated;
    });
  };


  const sidebarWidth = collapsed ? 64 : 252;


  return (
    <div className="font-['Nunito',sans-serif] text-[#1a2e0a]" style={{ animation: "pageFadeIn 0.6s ease both" }}>
      <MeshBackground />
      <Sidebar
        active={panel}
        onNav={setPanel}
        onNavMobile={handleNavMobile}
        stats={stats}
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onLogout={logout}
      />
      <Topbar
        panel={panel}
        user={user}
        onRefresh={refresh}
        onToggle={() => setCollapsed(c => !c)}
        isMobile={isMobile}
        collapsed={collapsed}
        onNav={setPanel}
        onLogout={logout}
        onOpenProfile={(tab) => setProfileModal({ open: true, tab })}
        unreadMessages={stats.unread_messages}
      />
      <main
        className="relative z-10 transition-all duration-300"
        style={{ marginLeft: sidebarWidth, paddingTop: 64, transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)", minHeight: "calc(100vh - 64px)" }}
      >
        {/* Always mounted so WebSocket stays alive — no padding, full height */}
        <div style={{ display: panel === "messaging" ? "flex" : "none", height: "calc(100vh - 64px)" }}>
          <AdminMessagingPanel user={normalizedAuthUser} onUnreadChange={handleUnreadChange} />
        </div>


        {panel !== "messaging" && (
          <div className="p-6">
            {panel === "overview" && <DashboardPanel stats={stats} onNav={setPanel} user={user} onStatsChange={fetchStats} />}
            {panel === "analytics" && <AnalyticsPanel show={panel === "analytics"} />}
            {panel === "animals" && <AnimalsPanel show onStatsChange={fetchStats} />}
            {panel === "adoptions" && <RequestsPanel type="adoptions" show onStatsChange={fetchStats} />}
            {panel === "rehome" && <RequestsPanel type="rehoming" show onStatsChange={fetchStats} />}
            {panel === "surveys" && <SurveysPanel show onStatsChange={fetchStats} />}
            {panel === "missingpets" && <MissingPetsPanel show onStatsChange={fetchStats} />}
            {panel === "users" && <UsersPanel show onStatsChange={fetchStats} />}
            {panel === "activity" && <ActivityPanel show onStatsChange={fetchStats} />}
            {panel === "map" && <GeoMapPanel show user={user} onStatsChange={fetchStats} />}
            {panel === "profile" && <ProfilePanel user={user} onUserUpdate={updateUser} onStatsChange={fetchStats} />}
          </div>
        )}
      </main>


      {profileModal.open && (
        <ProfileModal
          user={user}
          defaultTab={profileModal.tab}
          onClose={() => setProfileModal({ open: false, tab: "profile" })}
          onUserUpdate={updateUser}
        />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

