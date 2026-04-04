// ── ADMIN DASHBOARD — Tailwind version
import { useState, useEffect, useRef, useCallback } from "react";
import { phpApi, useToast, ToastContainer } from "../shared";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";

import DashboardPanel   from "./admin/DashboardPanel";
import AnimalsPanel     from "./admin/AnimalsPanel";
import RequestsPanel    from "./admin/RequestsPanel";
import SurveysPanel     from "./admin/SurveysPanel";
import UsersPanel       from "./admin/UsersPanel";
import GeoMapPanel      from "./admin/GeoMapPanel";
import ActivityPanel    from "./admin/ActivityPanel";
import ProfilePanel     from "./admin/ProfilePanel";
import MissingPetsPanel from "./admin/MissingPetsPanel";

const NAV = [
  {
    group: "Overview",
    items: [
      { id: "overview", label: "Dashboard", ico: "ico-blue", faIcon: "chart-line",
        badge: "total_records", badgeWarn: false },
    ],
  },
  {
    group: "Management",
    items: [
      { id: "animals",     label: "Animals",      ico: "ico-green",  faIcon: "paw",
        badge: "animals",           badgeWarn: false },
      { id: "adoptions",   label: "Adoptions",    ico: "ico-orange", faIcon: "heart",
        badge: "pending_adoptions", badgeWarn: true  },
      { id: "rehome",      label: "Rehoming",     ico: "ico-amber",  faIcon: "home",
        badge: "pending_rehome",    badgeWarn: true  },
      { id: "surveys",     label: "Surveys",      ico: "ico-teal",   faIcon: "clipboard-list",
        badge: "surveys",           badgeWarn: false },
      { id: "missingpets", label: "Missing Pets", ico: "ico-rose",   faIcon: "search",
        badge: "missing_pets",      badgeWarn: true  },
    ],
  },
  {
    group: "Analytics",
    items: [
      { id: "map", label: "Geographic Map", ico: "ico-blue", faIcon: "globe-asia",
        badge: "users", badgeWarn: false },
    ],
  },
  {
    group: "System",
    items: [
      { id: "users",    label: "User Management", ico: "ico-purple", faIcon: "users",
        badge: "users",          badgeWarn: false },
      { id: "activity", label: "Activity Log",    ico: "ico-rose",   faIcon: "history",
        badge: "activity_today", badgeWarn: false },
    ],
  },
];

const ICO_COLORS = {
  "ico-blue":   { bg: "rgba(32,96,160,0.12)",  color: "#2060a0" },
  "ico-green":  { bg: "rgba(90,170,48,0.14)",  color: "#1c4f09" },
  "ico-orange": { bg: "rgba(180,90,34,0.14)",  color: "#B45A22" },
  "ico-amber":  { bg: "rgba(212,136,10,0.14)", color: "#d4880a" },
  "ico-teal":   { bg: "rgba(26,138,106,0.14)", color: "#1a8a6a" },
  "ico-purple": { bg: "rgba(122,61,192,0.14)", color: "#7a3dc0" },
  "ico-rose":   { bg: "rgba(176,48,96,0.14)",  color: "#b03060" },
};

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
        .dot-pulse { animation: dotPulse 2s ease infinite; }
        .fade-up { animation: fadeUp 0.25s ease both; }
        .spinning { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}

// ── FA ICON ────────────────────────────────────────────────────────────────────
function FaIcon({ name, size = 14, color = "currentColor" }) {
  const paths = {
    "chart-line":        "M2 12 L6 7 L10 9 L14 4 L16 6 M2 12 L16 12",
    "paw":               "M12 13.5c-1 1.5-3 1.5-4 0-1-1.5-.5-3.5 1-4.5s3.5-.5 4 1c.5 1.5 0 2-1 3.5zm-6-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm6-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM5 5c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm8 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1z",
    "heart":             "M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z",
    "home":              "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    "clipboard-list":    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    "globe-asia":        "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2c1.4 0 2.7.3 3.9.9L14 7h-2l-1 2-1-1H8l-1 2 1 1v2l2 2 1 3-1 1a8 8 0 01-5-13.3L6 7l2-1 2-2h2zm6.9 3.1A8 8 0 0120 12h-2l-1-1-1 1-2-2 1-2-1-1 1.3-1.7.6.8z",
    "users":             "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    "history":           "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
    "user-shield":       "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 110 6 3 3 0 010-6zm0 8c-2 0-6 1-6 3v1h12v-1c0-2-4-3-6-3z",
    "bars":              "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    "rotate-right":      "M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47H19.93zm-3.01 6.32c1.17-.7 2.08-1.73 2.58-2.96l-1.86-.75c-.35.85-.93 1.54-1.64 2.05l.92 1.66zm-3.92 1.61v2.02c1.39-.17 2.73-.72 3.89-1.62l-1.42-1.42c-.75.54-1.6.87-2.47 1.02z",
    "bell":              "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
    "sign-out-alt":      "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    "arrow-left":        "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    "external-link-alt": "M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
    "user-cog":          "M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2zm-1 9.93V22h2v-4.07c3.62-.44 6.5-3.34 6.94-7H22v-2h-2.06C19.5 5.34 16.62 2.44 13 2V0h-2v2C7.38 2.44 4.5 5.34 4.06 9H2v2h2.06c.44 3.66 3.32 6.56 6.94 7z",
    "shield-alt":        "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
    "times":             "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    "search":            "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  };
  const d = paths[name];
  if (!d) return null;
  if (name === "chart-line") {
    return (
      <svg width={size} height={size} viewBox="0 0 18 14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,12 6,7 10,9 14,4 16,6" />
        <line x1="2" y1="12" x2="16" y2="12" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={d} />
    </svg>
  );
}

// ── PROFILE MODAL ──────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onUserUpdate, defaultTab = "profile" }) {
  const [tab, setTab]         = useState(defaultTab);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ type: "", text: "" });
  const [fname, setFname]     = useState(user?.firstName || "");
  const [lname, setLname]     = useState(user?.lastName  || "");
  const [email, setEmail]     = useState(user?.email     || "");
  const [phone, setPhone]     = useState(user?.phone     || "");
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [photoSrc, setPhotoSrc]       = useState(user?.avatar || "");
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
    const res = await fetch("/php/admin/dashboard", {  // ← fix URL
      method: "POST",
      body: fd,
      credentials: "include"
    });
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
    { id: "profile",  label: "Personal Info", icon: "👤" },
    { id: "photo",    label: "Photo",          icon: "📷" },
    { id: "security", label: "Security",       icon: "🔒" },
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
              {[["Current Password *", showCur, setShowCur, current, setCurrent, "Enter current password"],
                ["New Password *",     showNew, setShowNew, newPass, setNewPass, "Min 8 characters"],
                ["Confirm New Password *", showCon, setShowCon, confirm, setConfirm, "Repeat new password"]
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
function Sidebar({ active, onNav, stats, user, collapsed, onToggle, onLogout }) {
  const avatarSrc = user?.avatar || "";
  return (
    <aside className="fixed left-0 top-0 z-[200] h-screen flex flex-col overflow-hidden transition-all duration-300"
      style={{ width: collapsed ? 64 : 252, background: "rgba(255,248,220,0.90)", backdropFilter: "blur(22px)", borderRight: "1.5px solid rgba(90,170,48,0.45)", boxShadow: "4px 0 24px rgba(100,70,20,0.10)", transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}>
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
      <div className={`flex items-center gap-2.5 px-3.5 py-3 shrink-0 ${collapsed ? "justify-center" : ""}`} style={{ background: "rgba(90,170,48,0.07)", borderBottom: "1.5px solid rgba(180,140,60,0.28)" }}>
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white overflow-hidden border-2 border-[#5aaa30]" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
          {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover rounded-full" /> : <FaIcon name="user-shield" size={18} color="#fff" />}
        </div>
        {!collapsed && (
          <div>
            <strong className="block text-[0.84rem] font-extrabold text-[#1a4a08] whitespace-nowrap overflow-hidden text-ellipsis max-w-[145px]">{user?.firstName}</strong>
            <span className="flex items-center gap-1 text-[0.68rem] font-bold text-[#6a7a50]"><span className="dot-pulse inline-block w-2 h-2 rounded-full bg-[#4ccc20]" />Online</span>
          </div>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(180,140,60,0.28) transparent" }}>
        {NAV.map(group => (
          <div key={group.group}>
            {!collapsed && <div className="text-[0.61rem] font-black uppercase tracking-widest text-[#6a7a50] px-2 pt-3 pb-1">{group.group}</div>}
            {group.items.map(item => {
              const isActive = active === item.id;
              const ico      = ICO_COLORS[item.ico] || ICO_COLORS["ico-blue"];
              const count    = item.badge ? (stats[item.badge] ?? 0) : 0;
              return (
                <button key={item.id} onClick={() => onNav(item.id)}
                  className={`w-full flex items-center gap-2 mb-0.5 rounded-xl text-[0.855rem] font-bold whitespace-nowrap transition-all duration-150 cursor-pointer border-none bg-transparent ${collapsed ? "p-2.5 justify-center" : "py-2 px-2.5"} ${isActive ? "text-[#1a4a08]" : "text-[#3a5020] hover:bg-[rgba(90,170,48,0.10)] hover:text-[#1a4a08]"}`}
                  style={{ background: isActive ? "rgba(90,170,48,0.17)" : "transparent", border: isActive ? "1.5px solid rgba(90,170,48,0.30)" : "1.5px solid transparent" }}>
                  <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center" style={{ background: ico.bg }}>
                    <FaIcon name={item.faIcon} size={14} color={ico.color} />
                  </div>
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && count > 0 && (
                    <div className="text-[0.63rem] font-black px-2 py-0.5 rounded-full" style={{
                      background: item.badgeWarn
                        ? "rgba(180,90,34,0.15)"
                        : (isActive ? "rgba(90,170,48,0.20)" : "rgba(180,140,60,0.14)"),
                      color: item.badgeWarn
                        ? "#B45A22"
                        : (isActive ? "#1c4f09" : "#6a7a50"),
                    }}>
                      {count}
                    </div>
                  )}
                  {/* Show dot on collapsed sidebar when there's a warn badge */}
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

// ── TOPBAR ─────────────────────────────────────────────────────────────────────
function Topbar({ panel, user, onRefresh, onToggle, collapsed, onNav, onOpenProfile, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const avatarSrc = user?.avatar || "";
  return (
    <header className="fixed top-0 right-0 z-[150] h-16 flex items-center justify-between px-5 gap-2.5 transition-all duration-300"
      style={{ left: collapsed ? 64 : 252, background: "rgba(255,248,220,0.92)", backdropFilter: "blur(18px)", borderBottom: "1.5px solid rgba(180,140,60,0.28)", boxShadow: "0 2px 14px rgba(100,70,20,0.08)", transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}>
      <button onClick={onToggle} className="p-1.5 rounded-lg text-[#6a7a50] hover:bg-[rgba(90,170,48,0.12)] hover:text-[#1a4a08] transition-all duration-200 border-none bg-transparent cursor-pointer">
        <FaIcon name="bars" size={18} color="currentColor" />
      </button>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#6a7a50] text-sm font-bold hover:text-[#1a4a08] hover:border-[#5aaa30] transition-all duration-150 cursor-pointer" style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)" }} title="Refresh">
          <FaIcon name="rotate-right" size={14} color="currentColor" />
        </button>

        <button onClick={() => window.open("/home", "_blank")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold text-[#1c4f09] hover:bg-[#1c4f09] hover:text-white transition-all duration-150 cursor-pointer" style={{ background: "rgba(90,170,48,0.13)", border: "1.5px solid rgba(90,170,48,0.35)" }}>
          <FaIcon name="external-link-alt" size={13} color="currentColor" /> View Site
        </button>
        <div className="relative">
          <div onClick={() => { setProfileOpen(o => !o); }} className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl transition-all duration-200 hover:border-[#5aaa30]" style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)" }}>
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
              {[{ label: "Profile Settings", icon: "user-cog", tab: "profile" }, { label: "Security", icon: "shield-alt", tab: "security" }].map(item => (
                <a key={item.label} href="#" onClick={e => { e.preventDefault(); setProfileOpen(false); onOpenProfile(item.tab); }} className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#3a5020] no-underline text-sm font-bold hover:bg-[rgba(90,170,48,0.10)] hover:text-[#1a4a08] transition-all duration-150">
                  <FaIcon name={item.icon} size={14} color="#6a7a50" /> {item.label}
                </a>
              ))}
              <div className="h-px my-1" style={{ background: "rgba(180,140,60,0.28)" }} />
              <a onClick={e => { e.preventDefault(); setProfileOpen(false); onLogout(); }} href="#" className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#c03030] no-underline text-sm font-bold hover:bg-[rgba(192,48,48,0.10)] transition-all duration-150 cursor-pointer">
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
  const [user, setUser]       = useState(null);
  const [panel, setPanel]     = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats]     = useState({
    animals:           0,
    adoptions:         0,
    rehome:            0,
    users:             0,
    pending_adoptions: 0,
    pending_rehome:    0,
    surveys:           0,
    health_healthy:    0,
    health_care:       0,
    health_treatment:  0,
    missing_pets:      0,
    activity_today:    0,
    total_records:     0,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const { toasts, show: toast }     = useToast();
  const [profileModal, setProfileModal] = useState({ open: false, tab: "profile" });

  useEffect(() => { if (authUser) setUser(authUser); }, [authUser]);

  const fetchStats = useCallback(async () => {
    try {
      const [phpRes, mpRes] = await Promise.all([
        phpApi("stats"),
        fetch("/api/missing-pets"),
      ]);
      const phpData = phpRes.success ? (phpRes.data || {}) : {};
      const mpData  = mpRes.ok ? await mpRes.json() : [];
      // missing_pets: prefer Spring Boot count, fall back to PHP
      const missingCount = Array.isArray(mpData) ? mpData.length : (phpData.missing_pets ?? 0);
      setStats({ ...phpData, missing_pets: missingCount });
    } catch (err) { console.error("Failed to fetch stats:", err); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshKey]);
  useEffect(() => { const interval = setInterval(fetchStats, 5_000); return () => clearInterval(interval); }, [fetchStats]);

  if (!user) return null;

  const refresh    = () => { setRefreshKey(k => k + 1); toast("Dashboard refreshed", "success"); };
  const updateUser = (updates) => {
  setUser(u => {
    const updated = { ...u, ...updates };
    localStorage.setItem('pawster_user', JSON.stringify(updated)); // ← persist
    return updated;
  });
};
  const sidebarWidth = collapsed ? 64 : 252;

  return (
    <div className="font-['Nunito',sans-serif] text-[#1a2e0a]">
      <MeshBackground />
      <Sidebar active={panel} onNav={setPanel} stats={stats} user={user} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onLogout={logout} />
      <Topbar panel={panel} user={user} onRefresh={refresh} onToggle={() => setCollapsed(c => !c)} collapsed={collapsed} onNav={setPanel} onLogout={logout} onOpenProfile={(tab) => setProfileModal({ open: true, tab })} />
      <main className="min-h-screen relative z-10 overflow-auto transition-all duration-300" style={{ marginLeft: sidebarWidth, paddingTop: 64, transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}>
        <div className="p-6">
          {panel === "overview"    && <DashboardPanel   stats={stats} onNav={setPanel} user={user} onStatsChange={fetchStats} />}
          {panel === "animals"     && <AnimalsPanel     show onStatsChange={fetchStats} />}
          {panel === "adoptions"   && <RequestsPanel    type="adoptions" show onStatsChange={fetchStats} />}
          {panel === "rehome"      && <RequestsPanel    type="rehome"    show onStatsChange={fetchStats} />}
          {panel === "surveys"     && <SurveysPanel     show onStatsChange={fetchStats} />}
          {panel === "missingpets" && <MissingPetsPanel show onStatsChange={fetchStats} />}
          {panel === "users"       && <UsersPanel       show onStatsChange={fetchStats} />}
          {panel === "activity"    && <ActivityPanel    show onStatsChange={fetchStats} />}
          {panel === "map"         && <GeoMapPanel      show user={user} onStatsChange={fetchStats} />}
          {panel === "profile"     && <ProfilePanel     user={user} onUserUpdate={updateUser} onStatsChange={fetchStats} />}
        </div>
      </main>
      {profileModal.open && <ProfileModal user={user} defaultTab={profileModal.tab} onClose={() => setProfileModal({ open: false, tab: "profile" })} onUserUpdate={updateUser} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}