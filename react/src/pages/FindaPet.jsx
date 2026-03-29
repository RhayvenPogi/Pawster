import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   CONFIG  –  point this at your Spring Boot server
   e.g.  http://localhost:8080
   ───────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

/* ─── Helpers ─── */
const STATUS_STYLE = {
  Available: { bg: "rgba(88,139,65,0.88)",  text: "#fff" },
  Pending:   { bg: "rgba(180,90,34,0.88)",  text: "#fff" },
  Adopted:   { bg: "rgba(100,100,100,0.8)", text: "#fff" },
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
    <div className="fixed bottom-6 left-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-[12px] font-extrabold text-[0.85rem] shadow-2xl"
      style={{ transform: "translateX(-50%)", background: type === "err" ? "#c03030" : "#1c4f09", color: "#fff", animation: "fadeUp .25s ease both", fontFamily: "'Nunito',sans-serif" }}>
      <i className={`fas ${type === "err" ? "fa-times-circle" : "fa-check-circle"}`} />
      {message}
    </div>
  );
}

/* ─── Adopt Modal ─── */
function AdoptModal({ animal, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", housing: "", exp: "", reason: "" });
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
      if (res.ok && (data.success !== false)) {
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
    { id: "name",    label: "Full Name *",       type: "text",  placeholder: "Your full name",            col: "full" },
    { id: "phone",   label: "Phone *",            type: "tel",   placeholder: "+63 9XX XXX XXXX" },
    { id: "email",   label: "Email *",            type: "email", placeholder: "you@email.com" },
    { id: "address", label: "Address *",          type: "text",  placeholder: "Your complete home address", col: "full" },
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-[560px] rounded-[20px] overflow-hidden border"
        style={{ background: "rgba(255,252,235,0.98)", borderColor: "rgba(180,140,60,0.28)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", animation: "modalIn .28s cubic-bezier(.22,.68,0,1.15) both" }}>

        {/* Head */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "rgba(180,140,60,0.22)", background: "linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))" }}>
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white text-base" style={{ background: "#1c4f09" }}>
            <i className="fas fa-heart" />
          </div>
          <span className="font-black text-[1.1rem]" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>
            Adopt {animal.name}
          </span>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-[8px] flex items-center justify-center text-[0.85rem] transition-all border"
            style={{ background: "rgba(192,48,48,0.08)", borderColor: "rgba(192,48,48,0.2)", color: "#c03030" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <form onSubmit={submit}>
            <div className="grid grid-cols-2 gap-4">
              {fields.map(({ id, label, type, placeholder, col }) => (
                <div key={id} className={`flex flex-col gap-1 ${col === "full" ? "col-span-2" : ""}`}>
                  <label className="text-[0.69rem] font-black uppercase tracking-[.07em]" style={{ color: "#6a7a50" }}>{label}</label>
                  <input type={type} required value={form[id]} onChange={set(id)} placeholder={placeholder}
                    className="rounded-[10px] px-3.5 py-2.5 text-[0.88rem] font-semibold outline-none transition-all border"
                    style={{ background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#1a2e0a", fontFamily: "'Nunito',sans-serif" }}
                    onFocus={(e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; }} />
                </div>
              ))}

              {/* Housing */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.69rem] font-black uppercase tracking-[.07em]" style={{ color: "#6a7a50" }}>Housing Type *</label>
                <select required value={form.housing} onChange={set("housing")}
                  className="rounded-[10px] px-3.5 py-2.5 text-[0.88rem] font-semibold outline-none transition-all border"
                  style={{ background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: form.housing ? "#1a2e0a" : "#6a7a50", fontFamily: "'Nunito',sans-serif" }}>
                  <option value="">Select…</option>
                  {["House with yard","Apartment","Condo","Other"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Experience */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.69rem] font-black uppercase tracking-[.07em]" style={{ color: "#6a7a50" }}>Pet Experience *</label>
                <select required value={form.exp} onChange={set("exp")}
                  className="rounded-[10px] px-3.5 py-2.5 text-[0.88rem] font-semibold outline-none transition-all border"
                  style={{ background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: form.exp ? "#1a2e0a" : "#6a7a50", fontFamily: "'Nunito',sans-serif" }}>
                  <option value="">Select…</option>
                  {["First time owner","Some experience","Very experienced"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[0.69rem] font-black uppercase tracking-[.07em]" style={{ color: "#6a7a50" }}>Why do you want to adopt? *</label>
                <textarea required value={form.reason} onChange={set("reason")} rows={4}
                  placeholder="Tell us about yourself and your home environment…"
                  className="rounded-[10px] px-3.5 py-2.5 text-[0.88rem] font-semibold outline-none transition-all border resize-vertical"
                  style={{ background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#1a2e0a", fontFamily: "'Nunito',sans-serif", minHeight: "100px" }}
                  onFocus={(e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-[12px] font-black text-[0.9rem] text-white transition-all"
              style={{ background: loading ? "#5a8a40" : "#1c4f09", boxShadow: "0 5px 20px rgba(28,79,9,0.32)", fontFamily: "'Nunito',sans-serif" }}>
              {loading
                ? <><i className="fas fa-spinner" style={{ animation: "spin .8s linear infinite" }} /> Submitting…</>
                : <><i className="fas fa-paper-plane" /> Submit Request</>}
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
    <div ref={ref} className="rounded-[18px] overflow-hidden border flex flex-col transition-all duration-300"
      style={{
        background: "rgba(255,248,225,0.75)", backdropFilter: "blur(14px)",
        borderColor: hov ? "rgba(90,170,48,0.42)" : "rgba(180,140,60,0.28)",
        boxShadow: hov ? "0 8px 40px rgba(100,70,20,0.20)" : "0 4px 24px rgba(100,70,20,0.13)",
        transform: vis ? (hov ? "translateY(-5px)" : "translateY(0)") : "translateY(20px)",
        opacity: vis ? 1 : 0,
        transitionDelay: `${(index % 4) * 70}ms`,
        cursor: "pointer",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>

      {/* Image area */}
      <div className="relative h-[190px] flex items-center justify-content-center border-b overflow-hidden"
        style={{ background: "linear-gradient(135deg,rgba(255,248,220,0.6),rgba(255,240,200,0.4))", borderColor: "rgba(180,140,60,0.28)" }}>
        {(!animal.photoUrl || imgErr) ? (
          <div className="w-full h-full flex items-center justify-center text-[5rem]">{emoji}</div>
        ) : (
          <>
            <div className="w-full h-full flex items-center justify-center text-[5rem] absolute inset-0">{emoji}</div>
            <img src={animal.photoUrl} alt={animal.name} referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
              style={{ transform: hov ? "scale(1.06)" : "scale(1)" }}
              onLoad={(e) => { e.target.previousElementSibling.style.display = "none"; }}
              onError={() => setImgErr(true)} />
          </>
        )}
        <span className="absolute top-2.5 right-2.5 px-2.5 py-[3px] rounded-[50px] text-[10px] font-black uppercase z-10"
          style={{ background: st.bg, color: st.text }}>
          {animal.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="font-black text-[1.1rem] leading-tight" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>
          {animal.name}
        </div>
        <div className="text-[0.72rem] font-bold mt-1" style={{ fontFamily: "'DM Mono',monospace", color: "#6a7a50" }}>
          {[animal.type, animal.breed, animal.age, animal.gender].filter(Boolean).join(" · ")}
        </div>
        {animal.description && (
          <p className="text-[0.82rem] font-bold leading-[1.6] mt-2 flex-1" style={{ color: "#3a5020" }}>
            {animal.description.length > 90 ? animal.description.slice(0, 90) + "…" : animal.description}
          </p>
        )}

        {isAvail ? (
          <button onClick={() => onAdopt(animal)}
            className="w-full mt-3.5 flex items-center justify-center gap-1.5 py-[9px] rounded-[9px] text-[0.78rem] font-black transition-all duration-200 border"
            style={{ background: hov ? "#1c4f09" : "rgba(28,79,9,0.08)", color: hov ? "#fff" : "#1c4f09", borderColor: hov ? "#1c4f09" : "rgba(90,170,48,0.3)", fontFamily: "'Nunito',sans-serif" }}>
            <i className="fas fa-heart" /> Adopt {animal.name}
          </button>
        ) : (
          <div className="w-full mt-3.5 flex items-center justify-center gap-1.5 py-[9px] rounded-[9px] text-[0.78rem] font-black border"
            style={{ opacity: 0.55, background: "rgba(100,100,100,0.07)", color: "#6a7a50", borderColor: "rgba(150,150,150,0.25)", fontFamily: "'Nunito',sans-serif" }}>
            <i className="fas fa-clock" /> {animal.status}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Filter Bar ─── */
function FilterBar({ search, type, status, onSearch, onType, onStatus, onSubmit, onClear, hasFilters }) {
  const inputStyle = {
    background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)",
    color: "#1a2e0a", fontFamily: "'Nunito',sans-serif",
  };
  const focusIn  = (e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; };
  const focusOut = (e) => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; };

  return (
    <div className="flex gap-3 items-center flex-wrap px-5 py-4 rounded-[18px] border mb-2"
      style={{ background: "rgba(255,248,225,0.75)", backdropFilter: "blur(14px)", borderColor: "rgba(180,140,60,0.28)", boxShadow: "0 4px 24px rgba(100,70,20,0.10)" }}>
      <i className="fas fa-search flex-shrink-0 text-[0.85rem]" style={{ color: "#6a7a50" }} />

      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by name or breed…"
        className="flex-1 min-w-[180px] rounded-[10px] px-3.5 py-2.5 text-[0.86rem] font-semibold outline-none transition-all border"
        style={inputStyle} onFocus={focusIn} onBlur={focusOut}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }} />

      <select value={type} onChange={(e) => onType(e.target.value)}
        className="rounded-[10px] px-3.5 py-2.5 text-[0.86rem] font-semibold outline-none transition-all border"
        style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
        <option value="all">All Types</option>
        {["Dog","Cat","Bird","Rabbit","Other"].map(t => <option key={t} value={t}>{t}s</option>)}
      </select>

      <select value={status} onChange={(e) => onStatus(e.target.value)}
        className="rounded-[10px] px-3.5 py-2.5 text-[0.86rem] font-semibold outline-none transition-all border"
        style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
        <option value="all">All Status</option>
        {["Available","Pending","Adopted"].map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <button onClick={onSubmit}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[12px] font-black text-[0.86rem] text-white transition-all whitespace-nowrap"
        style={{ background: "#1c4f09", boxShadow: "0 4px 16px rgba(28,79,9,0.28)", fontFamily: "'Nunito',sans-serif" }}>
        <i className="fas fa-search" /> Search
      </button>

      {hasFilters && (
        <button onClick={onClear}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] font-black text-[0.86rem] transition-all whitespace-nowrap border"
          style={{ background: "rgba(255,248,220,0.75)", borderColor: "rgba(180,140,60,0.28)", color: "#3a5020", fontFamily: "'Nunito',sans-serif" }}>
          <i className="fas fa-times" /> Clear
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function FindAPet() {
  const [animals, setAnimals]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [type, setType]           = useState("all");
  const [status, setStatus]       = useState("all");
  const [adoptTarget, setAdopt]   = useState(null);
  const [toast, setToast]         = useState(null);
  const [totalCount, setTotal]    = useState(0);

  /* ── Fetch from Spring Boot ── */
  const fetchAnimals = useCallback(async (q = search, t = type, s = status) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q && q.trim())  params.set("search", q.trim());
      if (t !== "all")    params.set("type",   t);
      if (s !== "all")    params.set("status", s);
      params.set("limit", "50");

      /*
        Expected Spring Boot endpoint:
          GET /api/animals?search=&type=Dog&status=Available&limit=50

        Expected JSON response shape:
          { content: Animal[], totalElements: number }
          — OR —
          Animal[]   (plain array)

        Animal shape:
          { id, name, type, breed, age, gender, description, status, photoUrl, createdAt }
      */
      const res  = await fetch(`${API_BASE}/api/animals?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // handle both Page<Animal> and plain Animal[]
      const list  = Array.isArray(data) ? data : (data.content ?? []);
      const total = Array.isArray(data) ? list.length : (data.totalElements ?? list.length);
      setAnimals(list);
      setTotal(total);
    } catch (err) {
      setError("Could not load animals. Make sure the Spring Boot server is running.");
      setAnimals([]);
    }
    setLoading(false);
  }, []);                         // eslint-disable-line

  useEffect(() => { fetchAnimals("", "all", "all"); }, []);  // eslint-disable-line

  const handleSubmit = () => fetchAnimals(search, type, status);
  const handleClear  = () => { setSearch(""); setType("all"); setStatus("all"); fetchAnimals("", "all", "all"); };
  const showToast    = (msg, kind = "ok") => setToast({ message: msg, type: kind });

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ fontFamily: "'Nunito',sans-serif", color: "#1a2e0a" }}>

      {/* ── Fonts + keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1  { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(7%,12%) scale(1.09)} 66%{transform:translate(-5%,5%) scale(0.93)} }
        @keyframes fl2  { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10%,8%) scale(0.93)} 70%{transform:translate(5%,-9%) scale(1.1)} }
        @keyframes fl3  { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(9%,-7%) scale(1.07)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.4)} 50%{box-shadow:0 0 0 6px rgba(90,170,48,0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .page-hero-title em { font-style:italic; color:#e07820; }
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
      `}</style>

      {/* ── Mesh Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: "#EDDABB" }} />
        {[
          { s: { width:"1000px",height:"1000px",top:"-25%",left:"-18%",   background:"radial-gradient(circle,#588B41,transparent 70%)", animation:"fl1 9s ease-in-out infinite"  } },
          { s: { width:"900px", height:"900px", top:"8%",   right:"-20%", background:"radial-gradient(circle,#B45A22,transparent 70%)", animation:"fl2 11s ease-in-out infinite" } },
          { s: { width:"800px", height:"800px", bottom:"-18%",left:"18%", background:"radial-gradient(circle,#e8dfc8,transparent 60%)", animation:"fl3 8s ease-in-out infinite"  } },
        ].map(({ s }, i) => (
          <div key={i} className="absolute rounded-full" style={{ ...s, filter:"blur(120px)", mixBlendMode:"multiply", opacity:0.48 }} />
        ))}
        <div className="absolute inset-0" style={{ backgroundImage:"linear-gradient(rgba(100,70,30,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.03) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
        <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(140,90,30,0.13) 100%)" }} />
      </div>

      {/* ── Page Hero ── */}
      <div className="relative z-10 pt-16 pb-12 px-10 text-center" style={{ animation: "fadeUp .6s ease both" }}>
        <div className="inline-flex items-center gap-2 rounded-[50px] px-4 py-1.5 text-[0.72rem] font-black uppercase tracking-[.1em] italic mb-4 border"
          style={{ background: "rgba(28,79,9,0.09)", borderColor: "rgba(90,170,48,0.32)", color: "#1c4f09" }}>
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#5aaa30", animation: "pulse-dot 2s ease infinite" }} />
          <i className="fas fa-search text-[0.65rem]" /> Browse Animals
        </div>
        <h1 className="page-hero-title font-black leading-none tracking-tight mb-4"
          style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.6rem,5vw,4.5rem)", color: "#1a4a08", textShadow: "0 3px 20px rgba(255,255,255,0.4)" }}>
          Find Your <em>Forever</em> Friend
        </h1>
        <p className="font-bold text-[1rem] max-w-[520px] mx-auto leading-[1.7]" style={{ color: "#3a5020" }}>
          All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.
        </p>
      </div>

      {/* ── Page Content ── */}
      <div className="relative z-10 max-w-[1320px] mx-auto px-6 pb-20">

        {/* Filter */}
        <FilterBar
          search={search} type={type} status={status}
          onSearch={setSearch} onType={setType} onStatus={setStatus}
          onSubmit={handleSubmit} onClear={handleClear}
          hasFilters={search !== "" || type !== "all" || status !== "all"} />

        {/* Count */}
        {!loading && !error && animals.length > 0 && (
          <p className="text-[0.82rem] font-bold mb-3" style={{ color: "#6a7a50" }}>
            Showing {animals.length}{totalCount > animals.length ? ` of ${totalCount}` : ""} animal{animals.length !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[18px] overflow-hidden border" style={{ borderColor: "rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)" }}>
                <div className="h-[190px]" style={{ background: "linear-gradient(90deg,rgba(255,240,200,.4) 25%,rgba(255,250,230,.7) 50%,rgba(255,240,200,.4) 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s ease infinite" }} />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 rounded-[6px]  w-2/3" style={{ background: "rgba(180,140,60,.18)", animation: "shimmer 1.4s ease infinite" }} />
                  <div className="h-3.5 rounded-[6px] w-full" style={{ background: "rgba(180,140,60,.12)", animation: "shimmer 1.4s ease infinite 0.1s" }} />
                  <div className="h-3 rounded-[6px]  w-4/5" style={{ background: "rgba(180,140,60,.10)", animation: "shimmer 1.4s ease infinite 0.2s" }} />
                  <div className="h-9 rounded-[9px]  w-full mt-3" style={{ background: "rgba(28,79,9,.08)", animation: "shimmer 1.4s ease infinite 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20 rounded-[18px] border"
            style={{ background: "rgba(255,248,225,0.75)", borderColor: "rgba(180,140,60,0.28)" }}>
            <i className="fas fa-exclamation-triangle text-[3rem] block mb-4" style={{ color: "#d4880a", opacity: 0.6 }} />
            <p className="font-bold text-[1rem] mb-1" style={{ color: "#3a5020" }}>{error}</p>
            <p className="text-[0.82rem] font-semibold mb-4" style={{ color: "#6a7a50" }}>
              Endpoint: <code className="px-2 py-0.5 rounded-[6px]" style={{ background: "rgba(28,79,9,0.08)", fontFamily: "'DM Mono',monospace", fontSize: "0.78rem" }}>{API_BASE}/api/animals</code>
            </p>
            <button onClick={() => fetchAnimals(search, type, status)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-black text-[0.88rem] text-white"
              style={{ background: "#1c4f09", fontFamily: "'Nunito',sans-serif" }}>
              <i className="fas fa-redo" /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && animals.length === 0 && (
          <div className="text-center py-20 rounded-[18px] border"
            style={{ background: "rgba(255,248,225,0.75)", borderColor: "rgba(180,140,60,0.28)", boxShadow: "0 4px 24px rgba(100,70,20,0.10)" }}>
            <i className="fas fa-paw text-[3rem] block mb-4" style={{ color: "#1c4f09", opacity: 0.3 }} />
            <p className="font-bold text-[1rem]" style={{ color: "#3a5020" }}>No animals found matching your search.</p>
            <button onClick={handleClear}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-black text-[0.88rem] mt-5 border transition-all"
              style={{ background: "rgba(255,248,220,0.75)", borderColor: "rgba(180,140,60,0.28)", color: "#3a5020", fontFamily: "'Nunito',sans-serif" }}>
              <i className="fas fa-times" /> Clear filters
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && animals.length > 0 && (
          <div className="grid gap-5 mt-1" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
            {animals.map((a, i) => (
              <AnimalCard key={a.id} animal={a} index={i} onAdopt={setAdopt} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t px-10 py-8" style={{ background: "rgba(255,248,218,0.85)", backdropFilter: "blur(16px)", borderColor: "rgba(90,170,48,0.45)" }}>
        <div className="max-w-[1320px] mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1c4f09] flex items-center justify-center text-base">🐾</div>
            <span className="font-black text-[1.1rem]" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>Paw<em style={{ fontStyle:"italic", color:"#e07820" }}>ster</em></span>
          </div>
          <div className="flex flex-wrap gap-5">
            {[["Home","/"],["Find a Pet","/pets"],["How It Works","/how-it-works"],["Missing Pets","/missing"],["Rehome","/rehome"]].map(([label, href]) => (
              <a key={label} href={href} className="text-[0.82rem] font-bold no-underline transition-colors hover:text-[#1a4a08]" style={{ color: "#3a5020" }}>{label}</a>
            ))}
          </div>
          <p className="text-[0.75rem] font-bold" style={{ color: "#6a7a50" }}>© 2025 Pawster. Made with 🐾 in the Ilocos Region.</p>
        </div>
      </footer>

      {/* ── Modals / Overlays ── */}
      {adoptTarget && (
        <AdoptModal animal={adoptTarget} onClose={() => setAdopt(null)}
          onSuccess={(msg, kind) => { showToast(msg, kind); setAdopt(null); }} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}