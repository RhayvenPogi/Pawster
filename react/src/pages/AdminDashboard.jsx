// ── ADMIN DASHBOARD — Styled to match PHP/CSS dashboard.css v2
import { useState, useEffect, useRef } from "react";
import { phpApi, useToast, ToastContainer } from "../shared";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";

import DashboardPanel from "./admin/DashboardPanel";
import AnimalsPanel from "./admin/AnimalsPanel";
import RequestsPanel from "./admin/RequestsPanel";
import SurveysPanel from "./admin/SurveysPanel";
import UsersPanel from "./admin/UsersPanel";
import GeoMapPanel from "./admin/GeoMapPanel";
import ActivityPanel from "./admin/ActivityPanel";
import ProfilePanel from "./admin/ProfilePanel";

// ── NAV CONFIG ─────────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "Overview",
    items: [{ id: "overview", label: "Dashboard", ico: "ico-blue", faIcon: "chart-line" }],
  },
  {
    group: "Management",
    items: [
      { id: "animals",   label: "Animals",         ico: "ico-green",  faIcon: "paw",           badge: "animals",          badgeWarn: false },
      { id: "adoptions", label: "Adoptions",        ico: "ico-orange", faIcon: "heart",         badge: "pending_adoptions", badgeWarn: true  },
      { id: "rehome",    label: "Rehoming",         ico: "ico-amber",  faIcon: "home",          badge: "pending_rehome",   badgeWarn: false },
      { id: "surveys",   label: "Surveys",          ico: "ico-teal",   faIcon: "clipboard-list", badge: "surveys",         badgeWarn: false },
    ],
  },
  {
    group: "Analytics",
    items: [{ id: "map", label: "Geographic Map", ico: "ico-blue", faIcon: "globe-asia" }],
  },
  {
    group: "System",
    items: [
      { id: "users",    label: "User Management", ico: "ico-purple", faIcon: "users",   badge: "users", badgeWarn: false },
      { id: "activity", label: "Activity Log",    ico: "ico-rose",   faIcon: "history" },
    ],
  },
];

// Icon colors matching CSS
const ICO_COLORS = {
  "ico-blue":   { bg: "rgba(32,96,160,0.12)",   color: "#2060a0" },
  "ico-green":  { bg: "rgba(90,170,48,0.14)",   color: "#1c4f09" },
  "ico-orange": { bg: "rgba(180,90,34,0.14)",   color: "#B45A22" },
  "ico-amber":  { bg: "rgba(212,136,10,0.14)",  color: "#d4880a" },
  "ico-teal":   { bg: "rgba(26,138,106,0.14)",  color: "#1a8a6a" },
  "ico-purple": { bg: "rgba(122,61,192,0.14)",  color: "#7a3dc0" },
  "ico-rose":   { bg: "rgba(176,48,96,0.14)",   color: "#b03060" },
};

const CRUMBS = {
  overview: "Dashboard", animals: "Animals", adoptions: "Adoptions",
  rehome: "Rehoming", surveys: "Surveys", users: "User Management",
  activity: "Activity Log", map: "Geographic Map", profile: "Profile Settings", security: "Security",
};

// ── MESH BACKGROUND ────────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base */}
      <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
      {/* Orbs */}
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(110px)", mixBlendMode: "multiply", opacity: 0.5, animation: "float1 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "5%", right: "-15%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,#B45A22,transparent 70%)", filter: "blur(110px)", mixBlendMode: "multiply", opacity: 0.5, animation: "float2 10s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,#e8e0d0,transparent 60%)", filter: "blur(110px)", mixBlendMode: "multiply", opacity: 0.5, animation: "float3 7s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(110px)", mixBlendMode: "multiply", opacity: 0.5, animation: "float4 9s ease-in-out infinite" }} />
      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,70,30,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.035) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.15) 100%)" }} />
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

// ── FA ICON SVG REPLACEMENTS (inline SVGs matching PHP fa icons) ──────────────
function FaIcon({ name, size = 14, color = "currentColor" }) {
  const paths = {
    "chart-line":     "M2 12 L6 7 L10 9 L14 4 L16 6 M2 12 L16 12",
    "paw":            "M12 13.5c-1 1.5-3 1.5-4 0-1-1.5-.5-3.5 1-4.5s3.5-.5 4 1c.5 1.5 0 2-1 3.5zm-6-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm6-2c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM5 5c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1zm8 0c0-.6.4-1 1-1s1 .4 1 1-.4 1-1 1-1-.4-1-1z",
    "heart":          "M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z",
    "home":           "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    "clipboard-list": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    "globe-asia":     "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2c1.4 0 2.7.3 3.9.9L14 7h-2l-1 2-1-1H8l-1 2 1 1v2l2 2 1 3-1 1a8 8 0 01-5-13.3L6 7l2-1 2-2h2zm6.9 3.1A8 8 0 0120 12h-2l-1-1-1 1-2-2 1-2-1-1 1.3-1.7.6.8z",
    "users":          "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    "history":        "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z",
    "user-shield":    "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 110 6 3 3 0 010-6zm0 8c-2 0-6 1-6 3v1h12v-1c0-2-4-3-6-3z",
    "bars":           "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    "chevron-left":   "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
    "chevron-right":  "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
    "chevron-down":   "M7 10l5 5 5-5z",
    "rotate-right":   "M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47H19.93zm-3.01 6.32c1.17-.7 2.08-1.73 2.58-2.96l-1.86-.75c-.35.85-.93 1.54-1.64 2.05l.92 1.66zm-3.92 1.61v2.02c1.39-.17 2.73-.72 3.89-1.62l-1.42-1.42c-.75.54-1.6.87-2.47 1.02z",
    "bell":           "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
    "sign-out-alt":   "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    "arrow-left":     "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    "external-link-alt": "M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
    "user-cog":       "M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-1 9.93V22h2v-4.07c3.62-.44 6.5-3.34 6.94-7H22v-2h-2.06C19.5 5.34 16.62 2.44 13 2V0h-2v2C7.38 2.44 4.5 5.34 4.06 9H2v2h2.06c.44 3.66 3.32 6.56 6.94 7z",
    "shield-alt":     "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
    "times":          "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    "search":         "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  };

  const d = paths[name];
  if (!d) return null;

  // Detect if it's a polyline or path
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

// ── PASTE THIS ENTIRE BLOCK before the Sidebar function in AdminDashboard.jsx ──

function ProfileModal({ user, onClose, onUserUpdate, defaultTab = "profile" }) {
  const [tab, setTab] = useState(defaultTab);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Profile fields
  const [fname, setFname] = useState(user?.firstName || "");
  const [lname, setLname]   = useState(user?.lastName  || "");
  const [email, setEmail]   = useState(user?.email     || "");
  const [phone, setPhone]   = useState(user?.phone     || "");

  // Password fields
  const [current,    setCurrent]    = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);

  // Photo
  const [photoSrc,     setPhotoSrc]     = useState(user?.avatar || "");
  const [pendingFile,  setPendingFile]  = useState(null);
  const fileRef = useRef(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  // Password strength
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
      if (r.success) {
        onUserUpdate({ firstName: fname, lastName: lname, email, phone });
        showMsg("success", "Profile updated successfully!");
      } else showMsg("error", r.message || "Failed to update.");
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
      const res = await fetch("../php/admin_dashboard.php", { method: "POST", body: fd, credentials: "include" });
      const r = await res.json();
      if (r.success) { setPendingFile(null); onUserUpdate({ avatar: r.url }); showMsg("success", "Photo updated!"); }
      else showMsg("error", "Upload failed.");
    } catch { showMsg("error", "Upload error."); }
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputStyle = {
    background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)",
    borderRadius: 9, padding: "10px 13px", fontFamily: "'Nunito',sans-serif",
    fontSize: "0.875rem", fontWeight: 600, color: "#1a2e0a", outline: "none",
    width: "100%", boxSizing: "border-box", transition: "border-color 0.18s",
  };
  const labelStyle = {
    fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase",
    letterSpacing: "0.07em", color: "#6a7a50", marginBottom: 5, display: "block",
  };
  const tabs = [
    { id: "profile",  label: "Personal Info", icon: "👤" },
    { id: "photo",    label: "Photo",          icon: "📷" },
    { id: "security", label: "Security",       icon: "🔒" },
  ];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(100,70,20,0.22)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "rgba(255,252,235,0.99)", border: "1.5px solid rgba(90,170,48,0.45)", borderRadius: 18, width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(100,70,20,0.18)", animation: "fadeUp 0.22s ease both", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── Modal Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1.5px solid rgba(180,140,60,0.28)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#1c4f09,#2a7010)", border: "2px solid #5aaa30", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.1rem", fontWeight: 900, overflow: "hidden", flexShrink: 0 }}>
              {photoSrc
                ? <img src={photoSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : (user?.firstName?.charAt(0)?.toUpperCase() || "A")
              }
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1rem", color: "#1a4a08" }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6a7a50", fontSize: "1.2rem", borderRadius: 8, padding: "4px 8px", transition: "all 0.14s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(90,170,48,0.10)"; e.currentTarget.style.color = "#1a4a08"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6a7a50"; }}
          >✕</button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", borderBottom: "1.5px solid rgba(180,140,60,0.28)", flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
                fontFamily: "'Nunito',sans-serif", fontSize: "0.80rem", fontWeight: 800,
                background: "transparent",
                color: tab === t.id ? "#1a4a08" : "#6a7a50",
                borderBottom: tab === t.id ? "2.5px solid #5aaa30" : "2.5px solid transparent",
                transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Message Banner ── */}
        {msg.text && (
          <div style={{ margin: "12px 22px 0", padding: "10px 14px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, background: msg.type === "success" ? "rgba(90,170,48,0.12)" : "rgba(192,48,48,0.10)", color: msg.type === "success" ? "#1c4f09" : "#c03030", border: `1px solid ${msg.type === "success" ? "rgba(90,170,48,0.28)" : "rgba(192,48,48,0.22)"}`, flexShrink: 0 }}>
            {msg.type === "success" ? "✓ " : "✕ "}{msg.text}
          </div>
        )}

        {/* ── Tab Content ── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px 22px" }}>

          {/* PERSONAL INFO TAB */}
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input value={fname} onChange={e => setFname(e.target.value)} style={inputStyle} placeholder="First name"
                    onFocus={e => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input value={lname} onChange={e => setLname(e.target.value)} style={inputStyle} placeholder="Last name"
                    onFocus={e => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="your@email.com"
                  onFocus={e => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+63 900 000 0000"
                  onFocus={e => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input value={user?.role || ""} disabled style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <button
                  onClick={saveProfile} disabled={saving}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1c4f09", border: "none", borderRadius: 10, padding: "10px 22px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 800, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, transition: "all 0.15s", boxShadow: "0 3px 10px rgba(28,79,9,0.22)" }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "#143806"; e.currentTarget.style.boxShadow = "0 5px 16px rgba(28,79,9,0.38)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#1c4f09"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(28,79,9,0.22)"; }}
                >
                  💾 {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* PHOTO TAB */}
          {tab === "photo" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              {/* Preview */}
              <div
                style={{ position: "relative", width: 130, height: 130, borderRadius: "50%", cursor: "pointer", boxShadow: "0 4px 20px rgba(100,70,20,0.18)" }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ width: 130, height: 130, borderRadius: "50%", overflow: "hidden", border: "3px solid #5aaa30", background: "linear-gradient(135deg,#1c4f09,#2a7010)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {photoSrc
                    ? <img src={photoSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "2.8rem", color: "rgba(255,255,255,0.9)" }}>👤</span>
                  }
                </div>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.44)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 4, opacity: 0, transition: "opacity 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "0"; }}
                >
                  <span style={{ fontSize: "1.4rem" }}>📷</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800 }}>Change</span>
                </div>
              </div>

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }} onChange={previewPhoto} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,250,232,0.88)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 10, padding: "9px 18px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 800, color: "#3a5020", cursor: "pointer", transition: "all 0.17s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#5aaa30"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; }}
                >
                  📁 Choose File
                </button>
                {pendingFile && (
                  <button
                    onClick={uploadPhoto}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#1c4f09", border: "none", borderRadius: 10, padding: "9px 18px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 800, color: "#fff", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#143806"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#1c4f09"; }}
                  >
                    ☁ Save Photo
                  </button>
                )}
              </div>
              <p style={{ fontSize: "0.71rem", fontWeight: 700, color: "#6a7a50", textAlign: "center" }}>JPG, PNG, GIF or WebP · Max 2MB</p>
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {/* Current password */}
              <div>
                <label style={labelStyle}>Current Password *</label>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 9, overflow: "hidden", transition: "border-color 0.18s" }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = "#5aaa30"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <input type={showCur ? "text" : "password"} value={current} onChange={e => setCurrent(e.target.value)} placeholder="Enter current password"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 13px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#1a2e0a" }} />
                  <button type="button" onClick={() => setShowCur(s => !s)}
                    style={{ background: "none", border: "none", borderLeft: "1.5px solid rgba(180,140,60,0.28)", padding: "9px 12px", cursor: "pointer", color: "#6a7a50", fontSize: "0.85rem", transition: "color 0.14s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#1c4f09"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#6a7a50"; }}
                  >{showCur ? "🙈" : "👁"}</button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label style={labelStyle}>New Password *</label>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 9, overflow: "hidden" }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = "#5aaa30"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <input type={showNew ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min 8 characters"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 13px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#1a2e0a" }} />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    style={{ background: "none", border: "none", borderLeft: "1.5px solid rgba(180,140,60,0.28)", padding: "9px 12px", cursor: "pointer", color: "#6a7a50", fontSize: "0.85rem" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#1c4f09"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#6a7a50"; }}
                  >{showNew ? "🙈" : "👁"}</button>
                </div>
                {/* Strength bar */}
                {newPass && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 5, background: "rgba(180,140,60,0.14)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: str.w, background: str.color, borderRadius: 10, transition: "width 0.4s, background 0.4s" }} />
                    </div>
                    <span style={{ fontSize: "0.71rem", fontWeight: 800, color: str.color, marginTop: 3, display: "block" }}>{str.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={labelStyle}>Confirm New Password *</label>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 9, overflow: "hidden" }}
                  onFocusCapture={e => { e.currentTarget.style.borderColor = "#5aaa30"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                  onBlurCapture={e => { e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <input type={showCon ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 13px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#1a2e0a" }} />
                  <button type="button" onClick={() => setShowCon(s => !s)}
                    style={{ background: "none", border: "none", borderLeft: "1.5px solid rgba(180,140,60,0.28)", padding: "9px 12px", cursor: "pointer", color: "#6a7a50", fontSize: "0.85rem" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#1c4f09"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#6a7a50"; }}
                  >{showCon ? "🙈" : "👁"}</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <button
                  onClick={changePassword} disabled={saving}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1c4f09", border: "none", borderRadius: 10, padding: "10px 22px", fontFamily: "'Nunito',sans-serif", fontSize: "0.875rem", fontWeight: 800, color: "#fff", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 3px 10px rgba(28,79,9,0.22)", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#143806"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#1c4f09"; }}
                >
                  🔑 {saving ? "Updating…" : "Update Password"}
                </button>
              </div>

              {/* Account info */}
              <div style={{ borderTop: "1.5px solid rgba(180,140,60,0.28)", paddingTop: 16, marginTop: 4, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50" }}>Account Info</div>
                {[
                  { label: "Full Name", val: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() },
                  { label: "Email",     val: user?.email },
                  { label: "Role",      val: user?.role },
                  { label: "Status",    val: "Active" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(180,140,60,0.11)" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#6a7a50" }}>{row.label}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1a2e0a" }}>{row.val}</span>
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
    <aside
      style={{
        position: "fixed", left: 0, top: 0, zIndex: 200,
        width: collapsed ? 64 : 252,
        height: "100vh",
        background: "rgba(255,248,220,0.90)",
        backdropFilter: "blur(22px)",
        borderRight: "1.5px solid rgba(90,170,48,0.45)",
        boxShadow: "4px 0 24px rgba(100,70,20,0.10)",
        display: "flex", flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
     <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10, padding: "0 14px", borderBottom: "1.5px solid rgba(180,140,60,0.28)", flexShrink: 0, height: 90, overflow: "hidden" }}>
  {!collapsed && (
  <img src={logo} alt="Pawster" style={{ width: 80, height: 80, objectFit: "contain", flexShrink: 0 }}
    onError={e => { e.target.style.display = "none"; }} />
)}
{collapsed && (
  <img src={logo} alt="Pawster" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
    onError={e => { e.target.style.display = "none"; }} />
)}
        {!collapsed && (
  <div style={{ flex: 1, minWidth: 0 }}>
    <span style={{ display: "block", fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#1a4a08", whiteSpace: "nowrap" }}>Pawster</span>
    <span style={{ display: "block", fontSize: "0.64rem", fontWeight: 900, color: "#6a7a50", textTransform: "uppercase", letterSpacing: "0.09em", whiteSpace: "nowrap" }}>Admin Panel</span>
  </div>
)}
        <button
          onClick={onToggle}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6a7a50", padding: "5px 6px", borderRadius: 7, fontSize: "0.78rem", flexShrink: 0, transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(90,170,48,0.12)"; e.currentTarget.style.color = "#1a4a08"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6a7a50"; }}
        >
          {/* chevron left / right SVG */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
      </div>

      {/* User card */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "rgba(90,170,48,0.07)", borderBottom: "1.5px solid rgba(180,140,60,0.28)", flexShrink: 0, justifyContent: collapsed ? "center" : "flex-start" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1c4f09,#2a7010)", border: "2px solid #5aaa30", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.88rem", overflow: "hidden" }}>
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            : <FaIcon name="user-shield" size={18} color="#fff" />
          }
        </div>
        {!collapsed && (
          <div>
            <strong style={{ display: "block", fontSize: "0.84rem", fontWeight: 800, color: "#1a4a08", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 145 }}>{user?.firstName}</strong>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: "#6a7a50" }}>
              <span className="dot-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ccc20", display: "inline-block" }} />
              Online
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 10px", scrollbarWidth: "thin", scrollbarColor: "rgba(180,140,60,0.28) transparent" }}>
        {NAV.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <div style={{ fontSize: "0.61rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.11em", color: "#6a7a50", padding: "13px 8px 4px" }}>
                {group.group}
              </div>
            )}
            {group.items.map(item => {
              const isActive = active === item.id;
              const ico = ICO_COLORS[item.ico] || ICO_COLORS["ico-blue"];
              const count = item.badge ? (stats[item.badge] || 0) : 0;
              return (
                <a
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, padding: collapsed ? "10px" : "9px 10px",
                    borderRadius: 10, textDecoration: "none", cursor: "pointer", marginBottom: 2,
                    fontSize: "0.855rem", fontWeight: 700, transition: "all 0.17s",
                    justifyContent: collapsed ? "center" : "flex-start",
                    background: isActive ? "rgba(90,170,48,0.17)" : "transparent",
                    color: isActive ? "#1a4a08" : "#3a5020",
                    border: isActive ? "1.5px solid rgba(90,170,48,0.30)" : "1.5px solid transparent",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(90,170,48,0.10)"; e.currentTarget.style.color = "#1a4a08"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3a5020"; } }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: ico.bg, color: ico.color }}>
                    <FaIcon name={item.faIcon} size={14} color={ico.color} />
                  </div>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {!collapsed && count > 0 && (
                    <div style={{ fontSize: "0.63rem", fontWeight: 900, padding: "2px 7px", borderRadius: 20, background: item.badgeWarn ? "rgba(180,90,34,0.15)" : (isActive ? "rgba(90,170,48,0.20)" : "rgba(180,140,60,0.14)"), color: item.badgeWarn ? "#B45A22" : (isActive ? "#1c4f09" : "#6a7a50") }}>
                      {count}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1.5px solid rgba(180,140,60,0.28)", padding: collapsed ? "10px 0" : "10px 10px 14px", display: "flex", gap: 6, flexShrink: 0, flexDirection: collapsed ? "column" : "row" }}>
        <a
          href="../php/index.php"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", transition: "all 0.17s", cursor: "pointer", flex: collapsed ? "none" : 1, color: "#3a5020", justifyContent: collapsed ? "center" : "flex-start" }}
          title="Back to Site"
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(90,170,48,0.10)"; e.currentTarget.style.color = "#1a4a08"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3a5020"; }}
        >
          <FaIcon name="arrow-left" size={14} color="currentColor" />
          {!collapsed && <span>Back to Site</span>}
        </a>
        <a
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", transition: "all 0.17s", cursor: "pointer", flex: collapsed ? "none" : 1, color: "#c03030", justifyContent: collapsed ? "center" : "flex-start" }}
          title="Logout"
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,48,48,0.10)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <FaIcon name="sign-out-alt" size={14} color="currentColor" />
          {!collapsed && <span>Logout</span>}
        </a>
      </div>
    </aside>
  );
}

// ── TOPBAR ─────────────────────────────────────────────────────────────────────
function Topbar({ panel, user, onRefresh, onToggle, collapsed, onNav, onOpenProfile }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const sidebarWidth = collapsed ? 64 : 252;
  const avatarSrc = user?.avatar || "";

  return (
    <header
      style={{
        position: "fixed", top: 0, right: 0, left: sidebarWidth, zIndex: 150,
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", gap: 10,
        background: "rgba(255,248,220,0.92)",
        backdropFilter: "blur(18px)",
        borderBottom: "1.5px solid rgba(180,140,60,0.28)",
        boxShadow: "0 2px 14px rgba(100,70,20,0.08)",
        transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggle}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6a7a50", padding: 7, borderRadius: 8, fontSize: "1rem", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(90,170,48,0.12)"; e.currentTarget.style.color = "#1a4a08"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6a7a50"; }}
        >
          <FaIcon name="bars" size={18} color="currentColor" />
        </button>
        
      </div>

  

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {/* Refresh */}
        <button
          onClick={onRefresh}
          style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 9, padding: "8px 11px", color: "#6a7a50", cursor: "pointer", fontSize: "0.86rem", fontFamily: "'Nunito',sans-serif", fontWeight: 700, transition: "all 0.17s", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#1a4a08"; e.currentTarget.style.background = "rgba(255,250,232,0.98)"; e.currentTarget.style.borderColor = "#5aaa30"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#6a7a50"; e.currentTarget.style.background = "rgba(255,250,232,0.78)"; e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; }}
          title="Refresh"
        >
          <FaIcon name="rotate-right" size={14} color="currentColor" />
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
            style={{ background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 9, padding: "8px 11px", color: "#6a7a50", cursor: "pointer", fontSize: "0.86rem", transition: "all 0.17s", display: "flex", alignItems: "center", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#1a4a08"; e.currentTarget.style.borderColor = "#5aaa30"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#6a7a50"; e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; }}
            title="Notifications"
          >
            <FaIcon name="bell" size={14} color="currentColor" />
          </button>
          {notifOpen && (
            <div className="fade-up" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "rgba(255,252,235,0.98)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 14, minWidth: 230, padding: 8, boxShadow: "0 8px 40px rgba(100,70,20,0.18)", zIndex: 999 }}>
              <div style={{ padding: "10px 8px 8px", borderBottom: "1px solid rgba(180,140,60,0.28)", fontWeight: 800, fontSize: "0.92rem", color: "#1a4a08", display: "flex", alignItems: "center", gap: 8 }}>
                <FaIcon name="bell" size={14} color="#1a4a08" /> Notifications
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", color: "#6a7a50", gap: 12, textAlign: "center" }}>
                <FaIcon name="bell" size={28} color="rgba(180,140,60,0.28)" />
                <p style={{ fontSize: "0.84rem", fontWeight: 700, margin: 0 }}>No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* View Site */}
        <button
          onClick={() => window.open("../php/index.php", "_blank")}
          style={{ background: "rgba(90,170,48,0.13)", border: "1.5px solid rgba(90,170,48,0.35)", borderRadius: 9, padding: "8px 11px", color: "#1c4f09", cursor: "pointer", fontSize: "0.86rem", fontFamily: "'Nunito',sans-serif", fontWeight: 700, transition: "all 0.17s", display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1c4f09"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(90,170,48,0.13)"; e.currentTarget.style.color = "#1c4f09"; }}
        >
          <FaIcon name="external-link-alt" size={13} color="currentColor" /> View Site
        </button>

        {/* Profile dropdown */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", background: "rgba(255,250,232,0.78)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 10, padding: "7px 12px", transition: "border-color 0.2s", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#5aaa30"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(180,140,60,0.28)"; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1c4f09,#2a7010)", border: "1.5px solid #5aaa30", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.74rem", overflow: "hidden" }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : <FaIcon name="user-shield" size={14} color="#fff" />
              }
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#1a4a08", whiteSpace: "nowrap" }}>{user?.firstName}</strong>
              <span style={{ display: "block", fontSize: "0.67rem", fontWeight: 700, color: "#6a7a50", textTransform: "capitalize" }}>{user?.role}</span>
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#6a7a50" style={{ transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "none" }}>
              <path d="M7 10l5 5 5-5z"/>
            </svg>

            {profileOpen && (
              <div className="fade-up" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "rgba(255,252,235,0.98)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 14, minWidth: 230, padding: 8, boxShadow: "0 8px 40px rgba(100,70,20,0.18)", zIndex: 999 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px 8px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#1c4f09,#2a7010)", border: "2px solid #5aaa30", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", overflow: "hidden" }}>
                    {avatarSrc ? <img src={avatarSrc} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : <FaIcon name="user-shield" size={18} color="#fff" />}
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.88rem", fontWeight: 800, color: "#1a4a08" }}>{user?.firstName} {user?.lastName}</strong>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>{user?.email}</span>
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(180,140,60,0.28)", margin: "4px 0" }} />
                {[
                  { label: "Profile Settings", icon: "user-cog",  tab: "profile"  },
                  { label: "Security",         icon: "shield-alt", tab: "security" },
                  ].map(item => (
                    <a key={item.label} href="#"
                    onClick={e => { e.preventDefault(); setProfileOpen(false); onOpenProfile(item.tab); }}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, color: "#3a5020", textDecoration: "none", fontSize: "0.84rem", fontWeight: 700, transition: "all 0.14s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(90,170,48,0.10)"; e.currentTarget.style.color = "#1a4a08"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3a5020"; }}
                  >
                    <FaIcon name={item.icon} size={14} color="#6a7a50" /> {item.label}
                  </a>
                ))}
                <div style={{ height: 1, background: "rgba(180,140,60,0.28)", margin: "4px 0" }} />
                <a href="logout.php"
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, color: "#c03030", textDecoration: "none", fontSize: "0.84rem", fontWeight: 700, transition: "all 0.14s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,48,48,0.10)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <FaIcon name="sign-out-alt" size={14} color="#c03030" /> Sign Out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ── ADMIN DASHBOARD ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [panel, setPanel] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [stats, setStats] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { toasts, show: toast } = useToast();
  const [profileModal, setProfileModal] = useState({ open: false, tab: "profile" });

  useEffect(() => { if (authUser) setUser(authUser); }, [authUser]);
  useEffect(() => {
    phpApi("stats").then(r => { if (r.success) setStats(r.data || {}); }).catch(() => {});
  }, [refreshKey]);

  if (!user) return null;

  const refresh = () => { setRefreshKey(k => k + 1); toast("Dashboard refreshed", "success"); };
  const updateUser = (updates) => setUser(u => ({ ...u, ...updates }));
  const sidebarWidth = collapsed ? 64 : 252;

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#1a2e0a" }}>
      <MeshBackground />

      <Sidebar
        active={panel} onNav={setPanel} stats={stats} user={user}
        collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onLogout={logout}
      />

      <Topbar
        panel={panel} user={user} onRefresh={refresh}
        onToggle={() => setCollapsed(c => !c)} collapsed={collapsed}
        onNav={setPanel}
        onOpenProfile={(tab) => setProfileModal({ open: true, tab })}
      />

      <main style={{ marginLeft: sidebarWidth, paddingTop: 64, minHeight: "100vh", position: "relative", zIndex: 10, transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)", overflow: "auto" }}>
        <div style={{ padding: 24 }}>
          {panel === "overview"  && <DashboardPanel stats={stats} onNav={setPanel} user={user} />}
          {panel === "animals"   && <AnimalsPanel show />}
          {panel === "adoptions" && <RequestsPanel type="adoptions" show />}
          {panel === "rehome"    && <RequestsPanel type="rehome" show />}
          {panel === "surveys"   && <SurveysPanel show />}
          {panel === "users"     && <UsersPanel show />}
          {panel === "activity"  && <ActivityPanel show />}
          {panel === "map"       && <GeoMapPanel show user={user} />}
          {panel === "profile"   && <ProfilePanel user={user} onUserUpdate={updateUser} />}
        </div>
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