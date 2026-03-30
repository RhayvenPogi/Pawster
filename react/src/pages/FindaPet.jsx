import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

const STATUS_STYLE = {
  Available: { bg: "rgba(88,139,65,0.88)",  text: "#fff" },
  Pending:   { bg: "rgba(180,90,34,0.88)",  text: "#fff" },
  Adopted:   { bg: "rgba(100,100,100,0.8)", text: "#fff" },
};
const TYPE_EMOJI = { Dog: "🐕", Cat: "🐈", Bird: "🐦", Rabbit: "🐇" };

const NAV_LINKS = [
  { to: "/home",         icon: "fas fa-house",          label: "Home" },
  { to: "/pets",         icon: "fas fa-search",          label: "Find a Pet" },
  { to: "/how-it-works", icon: "fas fa-list-ol",         label: "How It Works" },
  { to: "/rehome",       icon: "fas fa-home",            label: "Rehome" },
  { to: "/missing-pets", icon: "fas fa-search-location", label: "Missing Pets" },
  { to: "/about",        icon: "fas fa-info-circle",     label: "About" },
  { to: "/profile",      icon: "fas fa-user",            label: "Profile" },
];

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
    <div style={{ position:"fixed", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.75rem 1.25rem", borderRadius:12, fontWeight:800, fontSize:"0.85rem", boxShadow:"0 8px 32px rgba(0,0,0,0.25)", background: type === "err" ? "#c03030" : "#1c4f09", color:"#fff", animation:"fadeUp .25s ease both", fontFamily:"'Nunito',sans-serif" }}>
      <i className={"fas " + (type === "err" ? "fa-times-circle" : "fa-check-circle")} />
      {message}
    </div>
  );
}

/* ─── Adopt Modal ─── */
function AdoptModal({ animal, onClose, onSuccess }) {
  const [form, setForm] = useState({ name:"", phone:"", email:"", address:"", housing:"", exp:"", reason:"" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/adoptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animalId: animal.id, ...form }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        onSuccess("Request submitted! We'll be in touch soon 🐾");
        onClose();
      } else {
        onSuccess(data.message || "Error submitting request", "err");
      }
    } catch {
      onSuccess("Server error. Please try again.", "err");
    }
    setLoading(false);
  };

  const fields = [
    { id:"name",    label:"Full Name *",  type:"text",  placeholder:"Your full name",             col:"full" },
    { id:"phone",   label:"Phone *",      type:"tel",   placeholder:"+63 9XX XXX XXXX" },
    { id:"email",   label:"Email *",      type:"email", placeholder:"you@email.com" },
    { id:"address", label:"Address *",    type:"text",  placeholder:"Your complete home address",  col:"full" },
  ];

  const inp = { background:"rgba(255,250,232,0.7)", borderColor:"rgba(180,140,60,0.28)", color:"#1a2e0a", fontFamily:"'Nunito',sans-serif" };
  const focIn  = (e) => { e.target.style.borderColor="#5aaa30"; e.target.style.boxShadow="0 0 0 3px rgba(90,170,48,0.12)"; };
  const focOut = (e) => { e.target.style.borderColor="rgba(180,140,60,0.28)"; e.target.style.boxShadow="none"; };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", background:"rgba(10,6,2,0.65)", backdropFilter:"blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position:"relative", width:"100%", maxWidth:560, borderRadius:20, overflow:"hidden", border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,252,235,0.98)", boxShadow:"0 24px 64px rgba(40,20,5,0.45)", animation:"modalIn .28s cubic-bezier(.22,.68,0,1.15) both" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(180,140,60,0.22)", background:"linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))" }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"#1c4f09", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"1rem" }}>
            <i className="fas fa-heart" />
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.1rem", color:"#1a4a08" }}>Adopt {animal.name}</span>
          <button onClick={onClose} style={{ marginLeft:"auto", width:32, height:32, borderRadius:8, border:"1px solid rgba(192,48,48,0.2)", background:"rgba(192,48,48,0.08)", color:"#c03030", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ padding:"1.25rem 1.5rem", maxHeight:"70vh", overflowY:"auto" }}>
          <form onSubmit={submit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              {fields.map(({ id, label, type, placeholder, col }) => (
                <div key={id} style={{ display:"flex", flexDirection:"column", gap:"0.25rem", gridColumn: col === "full" ? "1/-1" : undefined }}>
                  <label style={{ fontSize:"0.69rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6a7a50" }}>{label}</label>
                  <input type={type} required value={form[id]} onChange={set(id)} placeholder={placeholder}
                    style={{ ...inp, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.88rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)" }}
                    onFocus={focIn} onBlur={focOut} />
                </div>
              ))}
              {[["housing","Housing Type *",["House with yard","Apartment","Condo","Other"]],["exp","Pet Experience *",["First time owner","Some experience","Very experienced"]]].map(([id, label, opts]) => (
                <div key={id} style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                  <label style={{ fontSize:"0.69rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6a7a50" }}>{label}</label>
                  <select required value={form[id]} onChange={set(id)} style={{ ...inp, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.88rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)" }} onFocus={focIn} onBlur={focOut}>
                    <option value="">Select…</option>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem", gridColumn:"1/-1" }}>
                <label style={{ fontSize:"0.69rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6a7a50" }}>Why do you want to adopt? *</label>
                <textarea required value={form.reason} onChange={set("reason")} rows={4} placeholder="Tell us about yourself and your home environment…"
                  style={{ ...inp, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.88rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)", resize:"vertical", minHeight:100 }}
                  onFocus={focIn} onBlur={focOut} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width:"100%", marginTop:"1rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.875rem", borderRadius:12, fontWeight:900, fontSize:"0.9rem", color:"#fff", background: loading ? "#5a8a40" : "#1c4f09", border:"none", cursor: loading ? "not-allowed" : "pointer", boxShadow:"0 5px 20px rgba(28,79,9,0.32)", fontFamily:"'Nunito',sans-serif" }}>
              {loading ? <><i className="fas fa-spinner" style={{ animation:"spin .8s linear infinite" }} /> Submitting…</> : <><i className="fas fa-paper-plane" /> Submit Request</>}
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
    <div ref={ref} style={{ borderRadius:18, overflow:"hidden", border:"1px solid " + (hov ? "rgba(90,170,48,0.42)" : "rgba(180,140,60,0.28)"), display:"flex", flexDirection:"column", background:"rgba(255,248,225,0.75)", backdropFilter:"blur(14px)", boxShadow: hov ? "0 8px 40px rgba(100,70,20,0.20)" : "0 4px 24px rgba(100,70,20,0.13)", transform: vis ? (hov ? "translateY(-5px)" : "translateY(0)") : "translateY(20px)", opacity: vis ? 1 : 0, transition:"all 0.3s", transitionDelay: (index % 4) * 70 + "ms", cursor:"pointer" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position:"relative", height:190, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,rgba(255,248,220,0.6),rgba(255,240,200,0.4))", borderBottom:"1px solid rgba(180,140,60,0.28)", overflow:"hidden" }}>
        {(!animal.photoUrl || imgErr) ? (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem" }}>{emoji}</div>
        ) : (
          <>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem" }}>{emoji}</div>
            <img src={animal.photoUrl} alt={animal.name} referrerPolicy="no-referrer" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s", transform: hov ? "scale(1.06)" : "scale(1)" }}
              onLoad={(e) => { e.target.previousElementSibling.style.display="none"; }} onError={() => setImgErr(true)} />
          </>
        )}
        <span style={{ position:"absolute", top:10, right:10, padding:"0.2rem 0.6rem", borderRadius:50, fontSize:10, fontWeight:900, textTransform:"uppercase", zIndex:10, background:st.bg, color:st.text }}>{animal.status}</span>
      </div>
      <div style={{ padding:"1rem", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.1rem", color:"#1a4a08", lineHeight:1.2 }}>{animal.name}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.72rem", fontWeight:700, color:"#6a7a50", marginTop:"0.25rem" }}>{[animal.type, animal.breed, animal.age, animal.gender].filter(Boolean).join(" · ")}</div>
        {animal.description && <p style={{ fontSize:"0.82rem", fontWeight:700, lineHeight:1.6, marginTop:"0.5rem", flex:1, color:"#3a5020" }}>{animal.description.length > 90 ? animal.description.slice(0,90) + "…" : animal.description}</p>}
        {isAvail ? (
          <button onClick={() => onAdopt(animal)} style={{ width:"100%", marginTop:"0.875rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.5625rem", borderRadius:9, fontSize:"0.78rem", fontWeight:900, border:"1px solid " + (hov ? "#1c4f09" : "rgba(90,170,48,0.3)"), background: hov ? "#1c4f09" : "rgba(28,79,9,0.08)", color: hov ? "#fff" : "#1c4f09", cursor:"pointer", fontFamily:"'Nunito',sans-serif", transition:"all 0.2s" }}>
            <i className="fas fa-heart" /> Adopt {animal.name}
          </button>
        ) : (
          <div style={{ width:"100%", marginTop:"0.875rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.5625rem", borderRadius:9, fontSize:"0.78rem", fontWeight:900, border:"1px solid rgba(150,150,150,0.25)", background:"rgba(100,100,100,0.07)", color:"#6a7a50", opacity:0.55, fontFamily:"'Nunito',sans-serif" }}>
            <i className="fas fa-clock" /> {animal.status}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filter Bar ─── */
function FilterBar({ search, type, status, onSearch, onType, onStatus, onSubmit, onClear, hasFilters }) {
  const inp = { background:"rgba(255,250,232,0.7)", borderColor:"rgba(180,140,60,0.28)", color:"#1a2e0a", fontFamily:"'Nunito',sans-serif" };
  const focIn  = (e) => { e.target.style.borderColor="#5aaa30"; e.target.style.boxShadow="0 0 0 3px rgba(90,170,48,0.12)"; };
  const focOut = (e) => { e.target.style.borderColor="rgba(180,140,60,0.28)"; e.target.style.boxShadow="none"; };
  const sel = { ...inp, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.86rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)" };

  return (
    <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap", padding:"1rem 1.25rem", borderRadius:18, border:"1px solid rgba(180,140,60,0.28)", marginBottom:"0.5rem", background:"rgba(255,248,225,0.75)", backdropFilter:"blur(14px)", boxShadow:"0 4px 24px rgba(100,70,20,0.10)" }}>
      <i className="fas fa-search" style={{ color:"#6a7a50", fontSize:"0.85rem", flexShrink:0 }} />
      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or breed…"
        style={{ ...inp, flex:1, minWidth:180, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.86rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)" }}
        onFocus={focIn} onBlur={focOut} onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }} />
      <select value={type} onChange={(e) => onType(e.target.value)} style={sel} onFocus={focIn} onBlur={focOut}>
        <option value="all">All Types</option>
        {["Dog","Cat","Bird","Rabbit","Other"].map(t => <option key={t} value={t}>{t}s</option>)}
      </select>
      <select value={status} onChange={(e) => onStatus(e.target.value)} style={sel} onFocus={focIn} onBlur={focOut}>
        <option value="all">All Status</option>
        {["Available","Pending","Adopted"].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={onSubmit} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.625rem 1.25rem", borderRadius:12, fontWeight:900, fontSize:"0.86rem", color:"#fff", background:"#1c4f09", border:"none", cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(28,79,9,0.28)", fontFamily:"'Nunito',sans-serif" }}>
        <i className="fas fa-search" /> Search
      </button>
      {hasFilters && (
        <button onClick={onClear} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.625rem 1rem", borderRadius:12, fontWeight:900, fontSize:"0.86rem", background:"rgba(255,248,220,0.75)", border:"1px solid rgba(180,140,60,0.28)", color:"#3a5020", cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Nunito',sans-serif" }}>
          <i className="fas fa-times" /> Clear
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function FindAPet() {
  const { user, logout } = useAuth();
  const [animals, setAnimals]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [type, setType]         = useState("all");
  const [status, setStatus]     = useState("all");
  const [adoptTarget, setAdopt] = useState(null);
  const [toast, setToast]       = useState(null);
  const [totalCount, setTotal]  = useState(0);
  const [dropOpen, setDropOpen] = useState(false);

  const initials = user ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "U")).toUpperCase() : "U";

  const fetchAnimals = useCallback(async (q = search, t = type, s = status) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q && q.trim()) params.set("search", q.trim());
      if (t !== "all")   params.set("type",   t);
      if (s !== "all")   params.set("status", s);
      params.set("limit", "50");
      const res  = await fetch(`${API_BASE}/api/animals?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list  = Array.isArray(data) ? data : (data.content ?? []);
      const total = Array.isArray(data) ? list.length : (data.totalElements ?? list.length);
      setAnimals(list); setTotal(total);
    } catch {
      setError("Could not load animals. Make sure the Spring Boot server is running.");
      setAnimals([]);
    }
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { fetchAnimals("", "all", "all"); }, []); // eslint-disable-line

  const handleSubmit = () => fetchAnimals(search, type, status);
  const handleClear  = () => { setSearch(""); setType("all"); setStatus("all"); fetchAnimals("", "all", "all"); };
  const showToast    = (msg, kind = "ok") => setToast({ message: msg, type: kind });

  return (
    <div style={{ minHeight:"100vh", background:"#EDDABB", fontFamily:"'Nunito',sans-serif", color:"#1a2e0a" }}>

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
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"#EDDABB" }} />
        {[
          { width:"1000px", height:"1000px", top:"-25%",   left:"-18%",  background:"radial-gradient(circle,#588B41,transparent 70%)", animation:"fl1 9s ease-in-out infinite" },
          { width:"900px",  height:"900px",  top:"8%",     right:"-20%", background:"radial-gradient(circle,#B45A22,transparent 70%)", animation:"fl2 11s ease-in-out infinite" },
          { width:"800px",  height:"800px",  bottom:"-18%",left:"18%",   background:"radial-gradient(circle,#e8dfc8,transparent 60%)", animation:"fl3 8s ease-in-out infinite" },
        ].map((s, i) => <div key={i} style={{ position:"absolute", borderRadius:"50%", filter:"blur(120px)", mixBlendMode:"multiply", opacity:0.48, ...s }} />)}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(100,70,30,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.03) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      {/* ── Navbar ── */}
      <nav style={{ position:"sticky", top:0, zIndex:200, display:"flex", alignItems:"center", padding:"0 2.5rem", gap:"1rem", height:70, background:"rgba(255,248,218,0.90)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(90,170,48,0.45)", boxShadow:"0 2px 20px rgba(100,70,20,0.09)" }}>
        {/* Brand */}
        <Link to="/home" style={{ display:"flex", alignItems:"center", gap:"0.6rem", textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"#1c4f09", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>🐾</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:900, color:"#1a4a08" }}>Paw<em style={{ fontStyle:"italic", color:"#e07820" }}>ster</em></span>
        </Link>

        {/* Nav pill */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.1rem", margin:"0 auto", background:"rgba(255,245,210,0.5)", borderRadius:50, padding:"0.25rem", border:"1px solid rgba(180,140,60,0.28)" }}>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <Link key={label} to={to} style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.45rem 0.9rem", borderRadius:50, fontSize:"0.78rem", fontWeight:800, textDecoration:"none", whiteSpace:"nowrap", background: to === "/pets" ? "linear-gradient(135deg,rgba(28,79,9,0.16),rgba(90,170,48,0.12))" : to === "/missing-pets" ? "rgba(180,90,34,0.09)" : "transparent", color: to === "/pets" ? "#1a4a08" : to === "/missing-pets" ? "#B45A22" : "#3a5020", boxShadow: to === "/pets" ? "0 2px 10px rgba(28,79,9,0.12)" : "none" }}>
              <i className={icon} style={{ fontSize:"0.70rem" }} />{label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
          {user ? (
            <>
              <div style={{ position:"relative" }}>
                <button onClick={() => setDropOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.35rem 0.85rem", background:"rgba(255,248,220,0.7)", border:"1px solid rgba(180,140,60,0.28)", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#1c4f09,#3a8a18)", border:"2px solid #5aaa30", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:900, color:"#fff" }}>{initials}</div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:"0.81rem", fontWeight:800, color:"#1a4a08" }}>{user.firstName}</div>
                    <div style={{ fontSize:"0.64rem", fontWeight:700, color:"#6a7a50" }}>Member</div>
                  </div>
                  <i className="fas fa-chevron-down" style={{ fontSize:"0.62rem", color:"#6a7a50", transition:"transform 0.2s", transform: dropOpen ? "rotate(180deg)" : "none" }} />
                </button>
                {dropOpen && (
                  <div onClick={() => setDropOpen(false)} style={{ position:"absolute", top:"calc(100% + 9px)", right:0, borderRadius:14, border:"1px solid rgba(180,140,60,0.28)", minWidth:215, padding:"0.5rem", zIndex:999, background:"rgba(255,252,235,0.98)", boxShadow:"0 8px 40px rgba(100,70,20,0.20)", animation:"fadeUp .18s ease both" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.5rem 0.5rem 0.65rem" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#1c4f09,#2a7010)", border:"2px solid #5aaa30", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem", fontWeight:900, color:"#fff" }}>{initials}</div>
                      <div><div style={{ fontSize:"0.86rem", fontWeight:800, color:"#1a4a08" }}>{user.firstName}</div><div style={{ fontSize:"0.7rem", fontWeight:700, color:"#6a7a50" }}>{user.email}</div></div>
                    </div>
                    <div style={{ height:1, margin:"0.25rem 0", background:"rgba(180,140,60,0.28)" }} />
                    <Link to="/profile" onClick={() => setDropOpen(false)} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.6rem", borderRadius:8, fontSize:"0.82rem", fontWeight:700, color:"#3a5020", textDecoration:"none" }}><i className="fas fa-th-large" style={{ width:16 }} /> Dashboard</Link>
                    <button onClick={logout} style={{ width:"100%", display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.6rem", borderRadius:8, fontSize:"0.82rem", fontWeight:700, color:"#c03030", background:"transparent", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}><i className="fas fa-sign-out-alt" style={{ width:16 }} /> Log Out</button>
                  </div>
                )}
              </div>
              <button onClick={logout} style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.5rem 1rem", borderRadius:9, fontSize:"0.79rem", fontWeight:800, background:"rgba(192,48,48,0.08)", color:"#c03030", border:"1px solid rgba(192,48,48,0.25)", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                <i className="fas fa-sign-out-alt" /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.5rem 1rem", borderRadius:10, fontSize:"0.82rem", fontWeight:800, color:"#3a5020", background:"rgba(255,250,232,0.7)", border:"1px solid rgba(180,140,60,0.28)", textDecoration:"none" }}><i className="fas fa-sign-in-alt" /> Log In</Link>
              <Link to="/register" style={{ display:"inline-flex", alignItems:"center", gap:"0.35rem", padding:"0.5rem 1rem", borderRadius:10, fontSize:"0.82rem", fontWeight:800, color:"#fff", background:"#1c4f09", border:"1px solid #1c4f09", textDecoration:"none" }}><i className="fas fa-paw" /> Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Page Hero ── */}
      <div style={{ position:"relative", zIndex:10, paddingTop:"4rem", paddingBottom:"3rem", textAlign:"center", animation:"fadeUp .6s ease both" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.375rem 1rem", fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", fontStyle:"italic", marginBottom:"1rem", background:"rgba(28,79,9,0.09)", border:"1px solid rgba(90,170,48,0.32)", color:"#1c4f09" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#5aaa30", display:"inline-block", animation:"pulse-dot 2s ease infinite" }} />
          <i className="fas fa-search" style={{ fontSize:"0.65rem" }} /> Browse Animals
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.6rem,5vw,4.5rem)", fontWeight:900, color:"#1a4a08", lineHeight:1, textShadow:"0 3px 20px rgba(255,255,255,0.4)", marginBottom:"1rem" }}>
          Find Your <em style={{ fontStyle:"italic", color:"#e07820" }}>Forever</em> Friend
        </h1>
        <p style={{ fontWeight:700, fontSize:"1rem", maxWidth:520, margin:"0 auto", lineHeight:1.7, color:"#3a5020" }}>
          All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ position:"relative", zIndex:10, maxWidth:1320, margin:"0 auto", padding:"0 1.5rem 5rem" }}>
        <FilterBar search={search} type={type} status={status} onSearch={setSearch} onType={setType} onStatus={setStatus} onSubmit={handleSubmit} onClear={handleClear} hasFilters={search !== "" || type !== "all" || status !== "all"} />

        {!loading && !error && animals.length > 0 && (
          <p style={{ fontSize:"0.82rem", fontWeight:700, color:"#6a7a50", marginBottom:"0.75rem" }}>
            Showing {animals.length}{totalCount > animals.length ? ` of ${totalCount}` : ""} animal{animals.length !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}
          </p>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ display:"grid", gap:"1.25rem", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,225,0.75)" }}>
                <div style={{ height:190, background:"linear-gradient(90deg,rgba(255,240,200,.4) 25%,rgba(255,250,230,.7) 50%,rgba(255,240,200,.4) 75%)", backgroundSize:"400px 100%", animation:"shimmer 1.4s ease infinite" }} />
                <div style={{ padding:"1rem", display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                  {[["66%","1.25rem"],["100%","0.875rem"],["80%","0.75rem"]].map(([w,h],j) => (
                    <div key={j} style={{ height:h, width:w, borderRadius:6, background:"rgba(180,140,60,.14)", animation:"shimmer 1.4s ease infinite" }} />
                  ))}
                  <div style={{ height:"2.25rem", borderRadius:9, background:"rgba(28,79,9,.08)", animation:"shimmer 1.4s ease infinite", marginTop:"0.25rem" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign:"center", padding:"5rem 2rem", borderRadius:18, border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,225,0.75)" }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize:"3rem", color:"#d4880a", opacity:0.6, display:"block", marginBottom:"1rem" }} />
            <p style={{ fontWeight:700, fontSize:"1rem", color:"#3a5020", marginBottom:"0.25rem" }}>{error}</p>
            <p style={{ fontSize:"0.82rem", fontWeight:600, color:"#6a7a50", marginBottom:"1rem" }}>
              Endpoint: <code style={{ padding:"0.1rem 0.4rem", borderRadius:6, background:"rgba(28,79,9,0.08)", fontFamily:"'DM Mono',monospace", fontSize:"0.78rem" }}>{API_BASE}/api/animals</code>
            </p>
            <button onClick={() => fetchAnimals(search, type, status)} style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.5rem", borderRadius:12, fontWeight:900, fontSize:"0.88rem", color:"#fff", background:"#1c4f09", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              <i className="fas fa-redo" /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && animals.length === 0 && (
          <div style={{ textAlign:"center", padding:"5rem 2rem", borderRadius:18, border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,225,0.75)", boxShadow:"0 4px 24px rgba(100,70,20,0.10)" }}>
            <i className="fas fa-paw" style={{ fontSize:"3rem", color:"#1c4f09", opacity:0.3, display:"block", marginBottom:"1rem" }} />
            <p style={{ fontWeight:700, fontSize:"1rem", color:"#3a5020" }}>No animals found matching your search.</p>
            <button onClick={handleClear} style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.5rem", borderRadius:12, fontWeight:900, fontSize:"0.88rem", background:"rgba(255,248,220,0.75)", border:"1px solid rgba(180,140,60,0.28)", color:"#3a5020", cursor:"pointer", marginTop:"1.25rem", fontFamily:"'Nunito',sans-serif" }}>
              <i className="fas fa-times" /> Clear filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && animals.length > 0 && (
          <div style={{ display:"grid", gap:"1.25rem", marginTop:"0.25rem", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))" }}>
            {animals.map((a, i) => <AnimalCard key={a.id} animal={a} index={i} onAdopt={setAdopt} />)}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ position:"relative", zIndex:10, borderTop:"1px solid rgba(90,170,48,0.45)", padding:"3rem 2.5rem 2rem", background:"rgba(255,248,218,0.85)", backdropFilter:"blur(16px)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"3rem", marginBottom:"2.5rem" }}>
          <div>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"#1c4f09", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", marginBottom:"0.75rem" }}>🐾</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.2rem", color:"#1a4a08", marginBottom:"0.5rem" }}>
              Paw<em style={{ fontStyle:"italic", color:"#e07820" }}>ster</em>
            </div>
            <p style={{ fontSize:"0.82rem", fontWeight:700, lineHeight:1.7, color:"#6a7a50", maxWidth:260 }}>Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
          </div>
          {[
            { title:"Adopt",    links:[["Browse Animals","/pets"],["My Profile","/profile"],["Log In","/login"],["Register","/register"]] },
            { title:"Services", links:[["How It Works","/how-it-works"],["Rehome a Pet","/rehome"],["Missing Pets","/missing-pets"],["About Us","/about"]] },
            { title:"Regions",  links:[["Ilocos Norte","/pets"],["Ilocos Sur","/pets"],["La Union","/pets"],["Pangasinan","/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.09em", color:"#1c4f09", marginBottom:"1rem" }}>{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} style={{ display:"block", fontSize:"0.83rem", fontWeight:700, color:"#3a5020", textDecoration:"none", marginBottom:"0.5rem" }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth:1200, margin:"0 auto", paddingTop:"1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", borderTop:"1px solid rgba(180,140,60,0.28)" }}>
          <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#6a7a50" }}>© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {["fab fa-facebook-f","fab fa-instagram","fab fa-twitter"].map(icon => (
              <a key={icon} href="#" style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", color:"#6a7a50", background:"rgba(255,250,232,0.7)", border:"1px solid rgba(180,140,60,0.28)", textDecoration:"none" }}>
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {adoptTarget && <AdoptModal animal={adoptTarget} onClose={() => setAdopt(null)} onSuccess={(msg, kind) => { showToast(msg, kind); setAdopt(null); }} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}