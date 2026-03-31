import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "./Navbar";
import logo from "../images/logo.png";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

const STATUS_STYLE = {
  Available: { bg: "rgba(88,139,65,0.88)", text: "#fff" },
  Pending: { bg: "rgba(180,90,34,0.88)", text: "#fff" },
  Adopted: { bg: "rgba(100,100,100,0.8)", text: "#fff" },
};
const TYPE_EMOJI = { Dog: "🐕", Cat: "🐈", Bird: "🐦", Rabbit: "🐇" };

/* ─── Reveal hook ─── */
function useReveal(delay = 0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis, delay];
}

/* ─── Toast ─── */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.75rem 1.25rem", borderRadius: 12, fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", background: type === "err" ? "#c03030" : "#1c4f09", color: "#fff", animation: "fadeUp .25s ease both", fontFamily: "'Nunito',sans-serif" }}>
      <i className={"fas " + (type === "err" ? "fa-times-circle" : "fa-check-circle")} />
      {message}
    </div>
  );
}

/* ─── Review Details Reminder Modal ─── */
function ReviewDetailsModal({ animal, user, onContinue, onClose }) {
  // Build a summary of what info will be pre-filled
  const hasName = !!(user?.firstName || user?.lastName);
  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phone;
  const hasAddress = !!user?.address;
  const allFilled = hasName && hasEmail && hasPhone && hasAddress;

  const row = (icon, label, value, filled) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.875rem", borderRadius: 10, background: filled ? "rgba(28,79,9,0.06)" : "rgba(192,48,48,0.06)", border: `1px solid ${filled ? "rgba(90,170,48,0.25)" : "rgba(192,48,48,0.2)"}` }}>
      <i className={`fas fa-${icon}`} style={{ color: filled ? "#5aaa30" : "#c03030", width: 16, textAlign: "center", fontSize: "0.85rem" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.67rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50" }}>{label}</div>
        <div style={{ fontSize: "0.84rem", fontWeight: 700, color: filled ? "#1a4a08" : "#c03030", marginTop: 1 }}>
          {filled ? value : "Not set — you can fill this in the form"}
        </div>
      </div>
      <i className={`fas fa-${filled ? "check-circle" : "exclamation-circle"}`} style={{ color: filled ? "#5aaa30" : "#c03030", fontSize: "0.9rem" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 480, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,252,235,0.98)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", animation: "modalIn .28s cubic-bezier(.22,.68,0,1.15) both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(180,140,60,0.22)", background: "linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#e07820,#c05010)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1rem" }}>
            <i className="fas fa-clipboard-check" />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: "#1a4a08" }}>Review Your Details</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>Before adopting {animal.name}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(224,120,32,0.08)", border: "1px solid rgba(224,120,32,0.25)", marginBottom: "1rem" }}>
            <i className="fas fa-info-circle" style={{ color: "#e07820", marginTop: "0.1rem", flexShrink: 0 }} />
            <p style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.6, color: "#6a3a10", margin: 0 }}>
              Your registered details will be pre-filled in the adoption form. Please make sure they're correct — the shelter will use this to contact you.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {row("user", "Full Name", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(), hasName)}
            {row("envelope", "Email", user?.email, hasEmail)}
            {row("phone", "Phone", user?.phone, hasPhone)}
            {row("map-marker-alt", "Address", user?.address, hasAddress)}
          </div>

          {!allFilled && (
            <div style={{ padding: "0.625rem 0.875rem", borderRadius: 10, background: "rgba(192,48,48,0.07)", border: "1px solid rgba(192,48,48,0.18)", marginBottom: "1rem", fontSize: "0.8rem", fontWeight: 700, color: "#a02020" }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: "0.4rem" }} />
              Some details are missing. You can fill them in the adoption form, or update your profile for future adoptions.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            <button onClick={onClose} style={{ padding: "0.75rem", borderRadius: 12, fontWeight: 900, fontSize: "0.86rem", background: "rgba(255,248,220,0.75)", border: "1px solid rgba(180,140,60,0.28)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <i className="fas fa-arrow-left" /> Go Back
            </button>
            <button onClick={onContinue} style={{ padding: "0.75rem", borderRadius: 12, fontWeight: 900, fontSize: "0.86rem", color: "#fff", background: "#1c4f09", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 5px 20px rgba(28,79,9,0.32)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <i className="fas fa-arrow-right" /> Continue
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}

/* ─── Adopt Modal ─── */
function AdoptModal({ animal, user, onClose, onSuccess }) {
  // Pre-fill from registered user details
  const [form, setForm] = useState({
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
    housing: user?.housing || "",
    exp: user?.petExperience || "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Get auth token from localStorage / sessionStorage (common patterns)
  const getToken = () =>
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    (user?.token ?? null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/adoptions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ animalId: animal.id, ...form }),
      });

      // Handle non-JSON responses gracefully
      let data = {};
      try { data = await res.json(); } catch { /* empty body */ }

      if (res.ok && data.success !== false) {
        onSuccess("Request submitted! We'll be in touch soon 🐾");
        onClose();
      } else if (res.status === 401) {
        onSuccess("Session expired — please log in again.", "err");
      } else {
        onSuccess(data.message || `Error submitting request (${res.status})`, "err");
      }
    } catch {
      onSuccess("Server error. Please try again.", "err");
    }
    setLoading(false);
  };

  const inp = { background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#1a2e0a", fontFamily: "'Nunito',sans-serif" };
  const focIn = (e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; };
  const focOut = (e) => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; };

  const fields = [
    { id: "name", label: "Full Name *", type: "text", placeholder: "Your full name", col: "full" },
    { id: "phone", label: "Phone *", type: "tel", placeholder: "+63 9XX XXX XXXX" },
    { id: "email", label: "Email *", type: "email", placeholder: "you@email.com" },
    { id: "address", label: "Address *", type: "text", placeholder: "Your complete home address", col: "full" },
  ];

  // Check which fields were pre-filled from user profile
  const prefilled = {
    name: !!([user?.firstName, user?.lastName].filter(Boolean).join(" ")),
    phone: !!user?.phone,
    email: !!user?.email,
    address: !!user?.address,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 560, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,252,235,0.98)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", animation: "modalIn .28s cubic-bezier(.22,.68,0,1.15) both" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(180,140,60,0.22)", background: "linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1c4f09", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1rem" }}>
            <i className="fas fa-heart" />
          </div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.1rem", color: "#1a4a08" }}>Adopt {animal.name}</span>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Pre-fill notice */}
        <div style={{ margin: "0.875rem 1.5rem 0", padding: "0.6rem 0.875rem", borderRadius: 10, background: "rgba(28,79,9,0.07)", border: "1px solid rgba(90,170,48,0.22)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <i className="fas fa-user-check" style={{ color: "#5aaa30", fontSize: "0.85rem", flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1c4f09" }}>
            Fields marked <span style={{ background: "rgba(90,170,48,0.15)", borderRadius: 4, padding: "0 4px", color: "#1c7a09" }}>✓ pre-filled</span> from your profile. Feel free to edit before submitting.
          </span>
        </div>

        <div style={{ padding: "1rem 1.5rem 1.25rem", maxHeight: "65vh", overflowY: "auto" }}>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {fields.map(({ id, label, type, placeholder, col }) => (
                <div key={id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", gridColumn: col === "full" ? "1/-1" : undefined }}>
                  <label style={{ fontSize: "0.69rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {label}
                    {prefilled[id] && <span style={{ fontSize: "0.65rem", background: "rgba(90,170,48,0.15)", color: "#1c7a09", borderRadius: 4, padding: "0 5px", fontWeight: 800 }}>✓ pre-filled</span>}
                  </label>
                  <input type={type} required value={form[id]} onChange={set(id)} placeholder={placeholder}
                    style={{ ...inp, borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: "0.88rem", fontWeight: 600, outline: "none", border: "1px solid rgba(180,140,60,0.28)", borderLeft: prefilled[id] ? "3px solid rgba(90,170,48,0.5)" : undefined }}
                    onFocus={focIn} onBlur={focOut} />
                </div>
              ))}
              {[
                ["housing", "Housing Type *", ["House with yard", "Apartment", "Condo", "Other"]],
                ["exp", "Pet Experience *", ["First time owner", "Some experience", "Very experienced"]],
              ].map(([id, label, opts]) => (
                <div key={id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.69rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {label}
                    {prefilled[id] && <span style={{ fontSize: "0.65rem", background: "rgba(90,170,48,0.15)", color: "#1c7a09", borderRadius: 4, padding: "0 5px", fontWeight: 800 }}>✓ pre-filled</span>}
                  </label>
                  <select required value={form[id]} onChange={set(id)}
                    style={{ ...inp, borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: "0.88rem", fontWeight: 600, outline: "none", border: "1px solid rgba(180,140,60,0.28)" }}
                    onFocus={focIn} onBlur={focOut}>
                    <option value="">Select…</option>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", gridColumn: "1/-1" }}>
                <label style={{ fontSize: "0.69rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50" }}>Why do you want to adopt? *</label>
                <textarea required value={form.reason} onChange={set("reason")} rows={4} placeholder="Tell us about yourself and your home environment…"
                  style={{ ...inp, borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: "0.88rem", fontWeight: 600, outline: "none", border: "1px solid rgba(180,140,60,0.28)", resize: "vertical", minHeight: 100 }}
                  onFocus={focIn} onBlur={focOut} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.875rem", borderRadius: 12, fontWeight: 900, fontSize: "0.9rem", color: "#fff", background: loading ? "#5a8a40" : "#1c4f09", border: "none", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 5px 20px rgba(28,79,9,0.32)", fontFamily: "'Nunito',sans-serif" }}>
              {loading
                ? <><i className="fas fa-spinner" style={{ animation: "spin .8s linear infinite" }} /> Submitting…</>
                : <><i className="fas fa-paper-plane" /> Submit Adoption Request</>}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

/* ─── Animal Card ─── */
function AnimalCard({ animal, index, onAdopt }) {
  const [ref, vis] = useReveal();
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const emoji = TYPE_EMOJI[animal.type] ?? "🐾";
  const st = STATUS_STYLE[animal.status] ?? STATUS_STYLE.Adopted;
  const isAvail = animal.status === "Available";

  return (
    <div ref={ref} style={{ borderRadius: 18, overflow: "hidden", border: "1px solid " + (hov ? "rgba(90,170,48,0.42)" : "rgba(180,140,60,0.28)"), display: "flex", flexDirection: "column", background: "rgba(255,248,225,0.75)", backdropFilter: "blur(14px)", boxShadow: hov ? "0 8px 40px rgba(100,70,20,0.20)" : "0 4px 24px rgba(100,70,20,0.13)", transform: vis ? (hov ? "translateY(-5px)" : "translateY(0)") : "translateY(20px)", opacity: vis ? 1 : 0, transition: "all 0.3s", transitionDelay: (index % 4) * 70 + "ms", cursor: "pointer" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: "relative", height: 190, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,rgba(255,248,220,0.6),rgba(255,240,200,0.4))", borderBottom: "1px solid rgba(180,140,60,0.28)", overflow: "hidden" }}>
        {(!animal.photoUrl || imgErr) ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>{emoji}</div>
        ) : (
          <>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5rem" }}>{emoji}</div>
            <img src={animal.photoUrl} alt={animal.name} referrerPolicy="no-referrer" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: hov ? "scale(1.06)" : "scale(1)" }}
              onLoad={(e) => { e.target.previousElementSibling.style.display = "none"; }} onError={() => setImgErr(true)} />
          </>
        )}
        <span style={{ position: "absolute", top: 10, right: 10, padding: "0.2rem 0.6rem", borderRadius: 50, fontSize: 10, fontWeight: 900, textTransform: "uppercase", zIndex: 10, background: st.bg, color: st.text }}>{animal.status}</span>
      </div>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.1rem", color: "#1a4a08", lineHeight: 1.2 }}>{animal.name}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: "0.25rem" }}>{[animal.type, animal.breed, animal.age, animal.gender].filter(Boolean).join(" · ")}</div>
        {animal.description && <p style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.6, marginTop: "0.5rem", flex: 1, color: "#3a5020" }}>{animal.description.length > 90 ? animal.description.slice(0, 90) + "…" : animal.description}</p>}
        {isAvail ? (
          <button onClick={() => onAdopt(animal)} style={{ width: "100%", marginTop: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.5625rem", borderRadius: 9, fontSize: "0.78rem", fontWeight: 900, border: "1px solid " + (hov ? "#1c4f09" : "rgba(90,170,48,0.3)"), background: hov ? "#1c4f09" : "rgba(28,79,9,0.08)", color: hov ? "#fff" : "#1c4f09", cursor: "pointer", fontFamily: "'Nunito',sans-serif", transition: "all 0.2s" }}>
            <i className="fas fa-heart" /> Adopt {animal.name}
          </button>
        ) : (
          <div style={{ width: "100%", marginTop: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.5625rem", borderRadius: 9, fontSize: "0.78rem", fontWeight: 900, border: "1px solid rgba(150,150,150,0.25)", background: "rgba(100,100,100,0.07)", color: "#6a7a50", opacity: 0.55, fontFamily: "'Nunito',sans-serif" }}>
            <i className="fas fa-clock" /> {animal.status}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filter Bar ─── */
function FilterBar({ search, type, status, onSearch, onType, onStatus, onSubmit, onClear, hasFilters }) {
  const inp = { background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#1a2e0a", fontFamily: "'Nunito',sans-serif" };
  const focIn = (e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; };
  const focOut = (e) => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; };
  const sel = { ...inp, borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: "0.86rem", fontWeight: 600, outline: "none", border: "1px solid rgba(180,140,60,0.28)" };

  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", padding: "1rem 1.25rem", borderRadius: 18, border: "1px solid rgba(180,140,60,0.28)", marginBottom: "0.5rem", background: "rgba(255,248,225,0.75)", backdropFilter: "blur(14px)", boxShadow: "0 4px 24px rgba(100,70,20,0.10)" }}>
      <i className="fas fa-search" style={{ color: "#6a7a50", fontSize: "0.85rem", flexShrink: 0 }} />
      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or breed…"
        style={{ ...inp, flex: 1, minWidth: 180, borderRadius: 10, padding: "0.625rem 0.875rem", fontSize: "0.86rem", fontWeight: 600, outline: "none", border: "1px solid rgba(180,140,60,0.28)" }}
        onFocus={focIn} onBlur={focOut} onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }} />
      <select value={type} onChange={(e) => onType(e.target.value)} style={sel} onFocus={focIn} onBlur={focOut}>
        <option value="all">All Types</option>
        {["Dog", "Cat", "Bird", "Rabbit", "Other"].map(t => <option key={t} value={t}>{t}s</option>)}
      </select>
      <select value={status} onChange={(e) => onStatus(e.target.value)} style={sel} onFocus={focIn} onBlur={focOut}>
        <option value="all">All Status</option>
        {["Available", "Pending", "Adopted"].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={onSubmit} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.625rem 1.25rem", borderRadius: 12, fontWeight: 900, fontSize: "0.86rem", color: "#fff", background: "#1c4f09", border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(28,79,9,0.28)", fontFamily: "'Nunito',sans-serif" }}>
        <i className="fas fa-search" /> Search
      </button>
      {hasFilters && (
        <button onClick={onClear} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.625rem 1rem", borderRadius: 12, fontWeight: 900, fontSize: "0.86rem", background: "rgba(255,248,220,0.75)", border: "1px solid rgba(180,140,60,0.28)", color: "#3a5020", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Nunito',sans-serif" }}>
          <i className="fas fa-times" /> Clear
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function FindAPet() {
  const { user, logout } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [adoptTarget, setAdopt] = useState(null);   // animal chosen
  const [showReview, setReview] = useState(false);  // show review modal first
  const [showForm, setShowForm] = useState(false);  // show adoption form after review
  const [toast, setToast] = useState(null);
  const [totalCount, setTotal] = useState(0);

  const fetchAnimals = useCallback(async (q = search, t = type, s = status) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q && q.trim()) params.set("search", q.trim());
      if (t !== "all") params.set("type", t);
      if (s !== "all") params.set("status", s);
      params.set("limit", "50");

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        (user?.token ?? null);

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/animals?${params}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.content ?? []);
      const total = Array.isArray(data) ? list.length : (data.totalElements ?? list.length);

      const mapped = list.map(a => ({
        ...a,
        photoUrl: a.photoUrl ?? (a.photo
          ? (a.photo.startsWith("http") ? a.photo : `http://localhost:8081${a.photo}`)
          : null),
      }));

      setAnimals(mapped);
      setTotal(total);
    } catch {
      setError("Could not load animals. Make sure the Spring Boot server is running.");
      setAnimals([]);
    }
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { fetchAnimals("", "all", "all"); }, []); // eslint-disable-line

  const handleSubmit = () => fetchAnimals(search, type, status);
  const handleClear = () => { setSearch(""); setType("all"); setStatus("all"); fetchAnimals("", "all", "all"); };
  const showToast = (msg, kind = "ok") => setToast({ message: msg, type: kind });

  // Step 1: click "Adopt" → show review reminder
  const handleAdoptClick = (animal) => {
    setAdopt(animal);
    setReview(true);
    setShowForm(false);
  };

  // Step 2: user confirms review → open adoption form
  const handleContinueToForm = () => {
    setReview(false);
    setShowForm(true);
  };

  const handleCloseAll = () => {
    setAdopt(null);
    setReview(false);
    setShowForm(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#EDDABB", fontFamily: "'Nunito',sans-serif", color: "#1a2e0a" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(7%,12%) scale(1.09)} 66%{transform:translate(-5%,5%) scale(0.93)} }
        @keyframes fl2  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10%,8%) scale(0.93)} 70%{transform:translate(5%,-9%) scale(1.1)} }
        @keyframes fl3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(9%,-7%) scale(1.07)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot{ 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.4)} 50%{box-shadow:0 0 0 6px rgba(90,170,48,0)} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
      `}</style>

      {/* ── Mesh Background ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
        {[
          { width: "1000px", height: "1000px", top: "-25%", left: "-18%", background: "radial-gradient(circle,#588B41,transparent 70%)", animation: "fl1 9s ease-in-out infinite" },
          { width: "900px", height: "900px", top: "8%", right: "-20%", background: "radial-gradient(circle,#B45A22,transparent 70%)", animation: "fl2 11s ease-in-out infinite" },
          { width: "800px", height: "800px", bottom: "-18%", left: "18%", background: "radial-gradient(circle,#e8dfc8,transparent 60%)", animation: "fl3 8s ease-in-out infinite" },
        ].map((s, i) => <div key={i} style={{ position: "absolute", borderRadius: "50%", filter: "blur(120px)", mixBlendMode: "multiply", opacity: 0.48, ...s }} />)}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,70,30,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.03) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <Navbar />

      {/* ── Page Hero ── */}
      <div style={{ position: "relative", zIndex: 10, paddingTop: "4rem", paddingBottom: "3rem", textAlign: "center", animation: "fadeUp .6s ease both" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: 50, padding: "0.375rem 1rem", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", fontStyle: "italic", marginBottom: "1rem", background: "rgba(28,79,9,0.09)", border: "1px solid rgba(90,170,48,0.32)", color: "#1c4f09" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5aaa30", display: "inline-block", animation: "pulse-dot 2s ease infinite" }} />
          <i className="fas fa-search" style={{ fontSize: "0.65rem" }} /> Browse Animals
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.6rem,5vw,4.5rem)", fontWeight: 900, color: "#1a4a08", lineHeight: 1, textShadow: "0 3px 20px rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
          Find Your <em style={{ fontStyle: "italic", color: "#e07820" }}>Forever</em> Friend
        </h1>
        <p style={{ fontWeight: 700, fontSize: "1rem", maxWidth: 520, margin: "0 auto", lineHeight: 1.7, color: "#3a5020" }}>
          All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1320, margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        <FilterBar search={search} type={type} status={status} onSearch={setSearch} onType={setType} onStatus={setStatus} onSubmit={handleSubmit} onClear={handleClear} hasFilters={search !== "" || type !== "all" || status !== "all"} />

        {!loading && !error && animals.length > 0 && (
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6a7a50", marginBottom: "0.75rem" }}>
            Showing {animals.length}{totalCount > animals.length ? ` of ${totalCount}` : ""} animal{animals.length !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}
          </p>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)" }}>
                <div style={{ height: 190, background: "linear-gradient(90deg,rgba(255,240,200,.4) 25%,rgba(255,250,230,.7) 50%,rgba(255,240,200,.4) 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s ease infinite" }} />
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[["66%", "1.25rem"], ["100%", "0.875rem"], ["80%", "0.75rem"]].map(([w, h], j) => (
                    <div key={j} style={{ height: h, width: w, borderRadius: 6, background: "rgba(180,140,60,.14)", animation: "shimmer 1.4s ease infinite" }} />
                  ))}
                  <div style={{ height: "2.25rem", borderRadius: 9, background: "rgba(28,79,9,.08)", animation: "shimmer 1.4s ease infinite", marginTop: "0.25rem" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "5rem 2rem", borderRadius: 18, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)" }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: "3rem", color: "#d4880a", opacity: 0.6, display: "block", marginBottom: "1rem" }} />
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#3a5020", marginBottom: "0.25rem" }}>{error}</p>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#6a7a50", marginBottom: "1rem" }}>
              Endpoint: <code style={{ padding: "0.1rem 0.4rem", borderRadius: 6, background: "rgba(28,79,9,0.08)", fontFamily: "'DM Mono',monospace", fontSize: "0.78rem" }}>{API_BASE}/api/animals</code>
            </p>
            <button onClick={() => fetchAnimals(search, type, status)} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", borderRadius: 12, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#1c4f09", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              <i className="fas fa-redo" /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && animals.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem 2rem", borderRadius: 18, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)", boxShadow: "0 4px 24px rgba(100,70,20,0.10)" }}>
            <i className="fas fa-paw" style={{ fontSize: "3rem", color: "#1c4f09", opacity: 0.3, display: "block", marginBottom: "1rem" }} />
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#3a5020" }}>No animals found matching your search.</p>
            <button onClick={handleClear} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", borderRadius: 12, fontWeight: 900, fontSize: "0.88rem", background: "rgba(255,248,220,0.75)", border: "1px solid rgba(180,140,60,0.28)", color: "#3a5020", cursor: "pointer", marginTop: "1.25rem", fontFamily: "'Nunito',sans-serif" }}>
              <i className="fas fa-times" /> Clear filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && animals.length > 0 && (
          <div style={{ display: "grid", gap: "1.25rem", marginTop: "0.25rem", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
            {animals.map((a, i) => <AnimalCard key={a.id} animal={a} index={i} onAdopt={handleAdoptClick} />)}
          </div>
        )}
      </div>

 <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">

  <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">

    {/* BRAND */}
    <div>
      <div className="mb-2">
        <img
          src={logo}
          alt="Pawster"
          className="w-8 h-8 object-contain"
          onError={(e) => (e.target.style.display = "none")}
        />
      </div>

      <div className="font-black text-[1.2rem] text-[#1a4a08]">
        Paw<em className="italic text-[#e07820]">ster</em>
      </div>

      <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
        Connecting loving homes with animals in need across the Ilocos Region since 2023.
      </p>
    </div>

    {/* LINKS */}
    {[
      {
        title: "Adopt",
        links: [
          ["Browse Animals", "/pets"],
          ["My Profile", "/profile"],
          ["Log In", "/login"],
          ["Register", "/register"],
        ],
      },
      {
        title: "Services",
        links: [
          ["How It Works", "/how-it-works"],
          ["Rehome a Pet", "/rehome"],
          ["Missing Pets", "/missing-pets"],
          ["About Us", "/about"],
        ],
      },
      {
        title: "Regions",
        links: [
          ["Ilocos Norte", "/pets"],
          ["Ilocos Sur", "/pets"],
          ["La Union", "/pets"],
          ["Pangasinan", "/pets"],
        ],
      },
    ].map(({ title, links }) => (
      <div key={title}>
        <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">
          {title}
        </div>

        {links.map(([label, to]) => (
          <Link
            key={label}
            to={to}
            className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline"
          >
            {label}
          </Link>
        ))}
      </div>
    ))}
  </div>

  {/* BOTTOM BAR */}
  <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">

    <div className="text-[0.75rem] font-bold text-[#6a7a50]">
      © 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.
    </div>

    <div className="flex gap-2">
      {["fab fa-facebook-f", "fab fa-instagram", "fab fa-twitter"].map(icon => (
        <a
          key={icon}
          href="#"
          className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition"
        >
          <i className={icon} />
        </a>
      ))}
    </div>
  </div>
</footer>

      {/* ── Step 1: Review Details Reminder ── */}
      {showReview && adoptTarget && (
        <ReviewDetailsModal
          animal={adoptTarget}
          user={user}
          onContinue={handleContinueToForm}
          onClose={handleCloseAll}
        />
      )}

      {/* ── Step 2: Adoption Form ── */}
      {showForm && adoptTarget && (
        <AdoptModal
          animal={adoptTarget}
          user={user}
          onClose={handleCloseAll}
          onSuccess={(msg, kind) => { showToast(msg, kind); handleCloseAll(); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}