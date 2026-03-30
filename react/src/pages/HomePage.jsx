import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";


/* ─── Data ─── */
const PETS = [
  {
    name: "Bruno", breed: "Labrador Mix · 2 yrs · Laoag City",
    species: "🐕 Dog", status: "available",
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=760&h=1040&fit=crop&auto=format",
    video: "https://videos.pexels.com/video-files/3195394/3195394-sd_640_360_25fps.mp4",
  },
  {
    name: "Luna", breed: "Tabby Cat · 1 yr · Vigan City",
    species: "🐈 Cat", status: "available",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=760&h=1040&fit=crop&auto=format",
    video: "https://videos.pexels.com/video-files/4958792/4958792-sd_640_360_24fps.mp4",
  },
  {
    name: "Coco", breed: "Rabbit · 6 mos · San Fernando",
    species: "🐇 Rabbit", status: "pending",
    photo: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=760&h=1040&fit=crop&auto=format",
    video: "https://videos.pexels.com/video-files/3195386/3195386-sd_640_360_25fps.mp4",
  },
];

const FEATURED = [
  { name: "Bruno", meta: "Labrador Mix · Male · 2 yrs · Laoag City", species: "🐕 Dog", tags: [["green","Healthy"],["blue","Friendly"],["amber","Vaccinated"]], img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=220&fit=crop&auto=format" },
  { name: "Luna",  meta: "Tabby Cat · Female · 1 yr · Vigan City",    species: "🐈 Cat", tags: [["green","Healthy"],["orange","Playful"]], img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=220&fit=crop&auto=format" },
  { name: "Mochi", meta: "Shih Tzu · Female · 3 yrs · San Fernando",  species: "🐕 Dog", tags: [["green","Healthy"],["blue","Calm"],["amber","Vaccinated"]], img: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=220&fit=crop&auto=format" },
  { name: "Shadow",meta: "Black Cat · Male · 2 yrs · Dagupan City",    species: "🐈 Cat", tags: [["green","Healthy"],["orange","Independent"]], img: "https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400&h=220&fit=crop&auto=format" },
];

const TESTIMONIALS = [
  { stars: 5, text: '"The process was so smooth and the team was incredibly supportive. Bruno has been the best addition to our family!"', name: "Maria A.", loc: "Laoag City, Ilocos Norte", initials: "MA" },
  { stars: 5, text: '"I was nervous about adopting for the first time but Pawster made it so easy. Luna settled in within a week!"',       name: "Jose R.",  loc: "Vigan City, Ilocos Sur",     initials: "JR" },
  { stars: 5, text: '"We had to rehome our dog due to moving abroad. Pawster found her a wonderful family in just two weeks."',          name: "Clara L.", loc: "Dagupan City, Pangasinan",  initials: "CL" },
];

/* ─── Tag colour map ─── */
const TAG = {
  green:  "bg-[rgba(90,170,48,0.14)]  text-[#1c4f09]",
  orange: "bg-[rgba(180,90,34,0.13)]  text-[#B45A22]",
  blue:   "bg-[rgba(32,96,160,0.11)]  text-[#2060a0]",
  amber:  "bg-[rgba(212,136,10,0.12)] text-[#d4880a]",
};

/* ─── Reveal hook ─── */
function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} className={"transition-all duration-700 " + (vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5") + " " + className}
      style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

/* ─── Hero Pet Card ─── */
function HeroPetCard() {
  const [current, setCurrent] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);

  const switchPet = (idx) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 220);
  };

  useEffect(() => {
    if (!hovering) { videoRef.current?.pause(); return; }
    const v = videoRef.current;
    if (!v) return;
    v.src = PETS[current].video;
    v.load();
    v.play().catch(() => {});
  }, [hovering, current]);

  useEffect(() => {
    if (hovering) return;
    const id = setInterval(() => switchPet((current + 1) % PETS.length), 4000);
    return () => clearInterval(id);
  }, [hovering, current]);

  const pet = PETS[current];

  return (
    <div className="relative w-full max-w-[380px] mx-auto"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}>
      <div className="relative w-full h-[520px] rounded-[28px] overflow-hidden bg-[#12100a] cursor-pointer transition-transform duration-500"
        style={{ boxShadow: "0 24px 64px rgba(40,20,5,.40), 0 8px 24px rgba(40,20,5,.22)", animation: hovering ? "none" : "cardFloat 6s ease-in-out infinite", transform: hovering ? "translateY(-12px) scale(1.025)" : undefined }}>

        <img src={pet.photo} alt={pet.name} className="absolute inset-0 w-full h-full object-cover z-10 transition-all duration-700"
          style={{ opacity: (hovering && !fading) ? 0 : fading ? 0 : 1, transform: hovering ? "scale(1.06)" : "scale(1.0)" }} />

        <video ref={videoRef} muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-700"
          style={{ opacity: hovering ? 1 : 0 }} />

        <div className="absolute inset-0 z-30 pointer-events-none"
          style={{ background: "linear-gradient(to top,rgba(8,5,1,.88) 0%,rgba(8,5,1,.30) 45%,transparent 70%)" }} />

        <div className="absolute top-[18px] left-[18px] z-[8] flex items-center gap-1.5 rounded-[20px] px-[11px] py-[4px] text-[0.58rem] font-extrabold uppercase tracking-[.07em] transition-all duration-300"
          style={{ background: "rgba(10,6,2,.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,220,80,.20)", color: "rgba(255,235,150,.90)", opacity: hovering ? 1 : 0, transform: hovering ? "translateX(0)" : "translateX(-6px)", transitionDelay: hovering ? "150ms" : "0ms" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5050] flex-shrink-0" style={{ boxShadow: "0 0 8px #ff3030", animation: "livePulse 1.5s ease infinite" }} />
          Live Preview
        </div>

        <div className="absolute top-[18px] right-[18px] z-[8] flex gap-1.5 items-center">
          {PETS.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); switchPet(i); }}
              className="transition-all duration-300 rounded-full border border-white/25 flex-shrink-0"
              style={{ width: i === current ? "22px" : "7px", height: "7px", borderRadius: i === current ? "4px" : "50%", background: i === current ? "#fff" : "rgba(255,255,255,.35)" }} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-[5] px-[22px] pb-[22px]">
          <div className="inline-flex items-center gap-1 rounded-[20px] px-2.5 py-[3px] mb-2 text-[0.60rem] font-extrabold uppercase tracking-[.07em] transition-all duration-500"
            style={{ background: "rgba(255,255,255,.10)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,240,190,.80)", opacity: hovering ? 1 : 0.85, transform: hovering ? "translateY(0)" : "translateY(6px)" }}>
            {pet.species}
          </div>
          <div className="font-black text-white leading-tight tracking-[-0.5px] text-[2.2rem] transition-transform duration-500"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 16px rgba(0,0,0,.5)", transform: hovering ? "translateY(0)" : "translateY(4px)" }}>
            {pet.name}
          </div>
          <div className="text-[0.75rem] font-bold mt-1 transition-transform duration-500" style={{ fontFamily: "'DM Mono', monospace", color: "rgba(255,230,160,.60)", transform: hovering ? "translateY(0)" : "translateY(4px)", transitionDelay: "80ms" }}>
            {pet.breed}
          </div>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-[5px] rounded-[20px] text-[0.62rem] font-extrabold uppercase tracking-[.07em] transition-all duration-500"
            style={{ background: pet.status === "pending" ? "rgba(180,90,30,.18)" : "rgba(70,190,30,.18)", color: pet.status === "pending" ? "#f0a060" : "#9de860", border: "1px solid " + (pet.status === "pending" ? "rgba(200,100,25,.30)" : "rgba(80,200,30,.32)"), opacity: hovering ? 1 : 0, transform: hovering ? "translateY(0)" : "translateY(8px)", transitionDelay: "120ms" }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: pet.status === "pending" ? "#e07820" : "#6cde28", boxShadow: pet.status === "pending" ? "0 0 7px #e07820" : "0 0 7px #6cde28", animation: "dotPulse 2s ease infinite" }} />
            {pet.status === "pending" ? "Pending" : "Available"}
          </div>
        </div>

        <Link to="/pets" className="absolute bottom-[22px] right-[22px] z-[6] inline-flex items-center gap-2 bg-white text-[#15100a] font-black text-[0.78rem] px-4 py-[9px] rounded-[50px] no-underline transition-all duration-500"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,.35)", opacity: hovering ? 1 : 0, transform: hovering ? "translateY(0)" : "translateY(14px)", transitionDelay: "100ms" }}>
          ♥ Adopt Now
        </Link>
      </div>

      <style>{`
        @keyframes cardFloat { 0%,100%{transform:translateY(0) rotate(0)} 33%{transform:translateY(-8px) rotate(0.4deg)} 66%{transform:translateY(-4px) rotate(-0.3deg)} }
        @keyframes livePulse { 0%,100%{box-shadow:0 0 6px #ff3030;opacity:1} 50%{box-shadow:0 0 14px #ff2020;opacity:.7} }
        @keyframes dotPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,0.4)} 50%{box-shadow:0 0 0 6px rgba(90,170,48,0)} }
      `}</style>
    </div>
  );
}

/* ─── FeaturedCard ─── */
function FeaturedCard({ pet }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="rounded-[20px] overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col"
      style={{ background: "rgba(255,248,225,0.75)", borderColor: hov ? "rgba(90,170,55,.55)" : "rgba(180,140,60,0.28)", boxShadow: hov ? "0 8px 40px rgba(100,70,20,0.20)" : "0 4px 24px rgba(100,70,20,0.13)", transform: hov ? "translateY(-7px)" : "translateY(0)" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="h-[185px] overflow-hidden relative border-b" style={{ borderColor: "rgba(180,140,60,0.28)" }}>
        <span className="absolute top-2.5 left-2.5 z-10 text-[0.60rem] font-extrabold px-[9px] py-[3px] rounded-[20px] uppercase tracking-[.05em]"
          style={{ background: "rgba(10,6,2,.55)", backdropFilter: "blur(8px)", color: "#f0e0b0", border: "1px solid rgba(255,220,120,.20)" }}>{pet.species}</span>
        <span className="absolute top-2.5 right-2.5 z-10 text-[0.58rem] font-extrabold px-2 py-[3px] rounded-[20px] uppercase tracking-[.05em] inline-flex items-center gap-1"
          style={{ background: "rgba(10,6,2,.55)", backdropFilter: "blur(8px)", color: "#9de860", border: "1px solid rgba(90,200,40,.22)" }}>
          <span className="w-[5px] h-[5px] rounded-full inline-block flex-shrink-0" style={{ background: "#6cde28", boxShadow: "0 0 5px #6cde28" }} />
          Available
        </span>
        <img src={pet.img} alt={pet.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500" style={{ transform: hov ? "scale(1.08)" : "scale(1)" }} />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="font-black text-[0.98rem]" style={{ color: "#1a4a08" }}>{pet.name}</div>
        <div className="text-[0.72rem] font-bold mt-0.5" style={{ color: "#6a7a50", fontFamily: "'DM Mono', monospace" }}>{pet.meta}</div>
        <div className="flex gap-1 mt-2.5 flex-wrap">
          {pet.tags.map(([c, t]) => (
            <span key={t} className={"text-[0.6rem] font-extrabold px-[7px] py-[2px] rounded-[20px] uppercase tracking-[.04em] " + TAG[c]}>{t}</span>
          ))}
        </div>
        <Link to="/pets" className="flex items-center justify-center gap-1.5 mt-3.5 py-[9px] rounded-[9px] text-[0.78rem] font-extrabold transition-all duration-200 no-underline"
          style={{ background: hov ? "#1c4f09" : "rgba(28,79,9,0.08)", color: hov ? "#fff" : "#1c4f09", border: hov ? "1.5px solid #1c4f09" : "1.5px solid rgba(90,170,48,0.3)" }}>
          ♥ Adopt {pet.name}
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const { user, logout } = useAuth();
  const loggedIn = !!user;
  const [dropOpen, setDropOpen] = useState(false);
  const initials = user ? (user.firstName[0] + (user.lastName?.[0] || "U")).toUpperCase() : "U";

  // Full nav links list
  const NAV_LINKS = [
    { to: "/home",         icon: "fas fa-house",           label: "Home" },
    { to: "/pets",         icon: "fas fa-search",           label: "Find a Pet" },
    { to: "/how-it-works", icon: "fas fa-list-ol",          label: "How It Works" },
    { to: "/rehome",       icon: "fas fa-home",             label: "Rehome" },
    { to: "/missing-pets", icon: "fas fa-search-location",  label: "Missing Pets" },
    { to: "/about",        icon: "fas fa-info-circle",      label: "About" },
    { to: "/profile",      icon: "fas fa-user",             label: "Profile" },
  ];

  return (
    <div className="relative overflow-x-hidden" style={{ fontFamily: "'Nunito', sans-serif", color: "#1a2e0a" }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fl1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(7%,12%) scale(1.09)} 66%{transform:translate(-5%,5%) scale(0.93)} }
        @keyframes fl2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10%,8%) scale(0.93)} 70%{transform:translate(5%,-9%) scale(1.1)} }
        @keyframes fl3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(9%,-7%) scale(1.07)} }
        @keyframes fl4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-9%,-9%) scale(1.11)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.4)} 50%{box-shadow:0 0 0 6px rgba(90,170,48,0)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes grain  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2%,2%)} }
        .hero-title em { font-style:italic; color:#e07820; }
        .sec-title em  { font-style:italic; color:#e07820; }
        .rehome-title em { font-style:italic; color:#B45A22; }
        .cta-title em  { font-style:italic; color:#e07820; }
        .nav-brand-text em { font-style:italic; color:#e07820; }
        .footer-brand-name em { font-style:italic; color:#e07820; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:#eddabb; } ::-webkit-scrollbar-thumb { background:#b4903a; border-radius:3px; }
      `}</style>

      {/* ── Mesh Background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: "#EDDABB" }} />
        {[
          { cls: "fl1", style: { width: "1000px", height: "1000px", top: "-25%", left: "-18%", background: "radial-gradient(circle,#588B41,transparent 70%)", animation: "fl1 9s ease-in-out infinite" } },
          { cls: "fl2", style: { width: "900px",  height: "900px",  top: "8%",   right: "-20%", background: "radial-gradient(circle,#B45A22,transparent 70%)", animation: "fl2 11s ease-in-out infinite" } },
          { cls: "fl3", style: { width: "800px",  height: "800px",  bottom: "-18%", left: "18%", background: "radial-gradient(circle,#e8dfc8,transparent 60%)", animation: "fl3 8s ease-in-out infinite" } },
          { cls: "fl4", style: { width: "700px",  height: "700px",  top: "38%",  right: "22%", background: "radial-gradient(circle,#588B41,transparent 70%)", animation: "fl4 10s ease-in-out infinite" } },
        ].map(({ cls, style }) => (
          <div key={cls} className="absolute rounded-full" style={{ ...style, filter: "blur(120px)", mixBlendMode: "multiply", opacity: 0.48 }} />
        ))}
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(100,70,30,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.03) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(140,90,30,0.13) 100%)" }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 w-full z-[999] flex items-center px-10 gap-4 border-b"
        style={{ height: "70px", background: "rgba(255,248,218,0.90)", backdropFilter: "blur(20px)", borderColor: "rgba(90,170,48,0.45)", boxShadow: "0 2px 20px rgba(100,70,20,0.09)" }}>

        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2.5 no-underline flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#1c4f09] flex items-center justify-center text-lg">🐾</div>
          <span className="nav-brand-text text-xl font-black" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>Paw<em>ster</em></span>
        </Link>

        {/* ── Full Nav Links pill ── */}
        <div className="hidden md:flex items-center gap-0.5 mx-auto rounded-[50px] px-1 py-1 border"
          style={{ background: "rgba(255,245,210,0.5)", borderColor: "rgba(180,140,60,0.28)" }}>
          {NAV_LINKS.map(({ to, icon, label }) => {
            const isMissing = to === "/missing-pets";
            const isActive  = typeof window !== "undefined" && window.location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[50px] text-[0.80rem] font-extrabold no-underline transition-all duration-150 whitespace-nowrap"
                style={
                  isMissing
                    ? { background: "rgba(180,90,34,0.09)", color: "#B45A22", border: "1px solid rgba(180,90,34,0.22)" }
                    : isActive
                    ? { background: "linear-gradient(135deg,rgba(28,79,9,0.16),rgba(90,170,48,0.12))", color: "#1a4a08", boxShadow: "0 2px 10px rgba(28,79,9,0.12)" }
                    : { color: "#3a5020" }
                }
              >
                <i className={icon + " text-[0.70rem]"} />{label}
              </Link>
            );
          })}
        </div>

        {/* Nav right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {loggedIn ? (
            <>
              <div className="relative">
                <button onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2 rounded-[50px] px-3.5 py-1.5 border cursor-pointer transition-all"
                  style={{ background: "rgba(255,248,220,0.7)", borderColor: "rgba(180,140,60,0.28)" }}>
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[0.78rem] font-black text-white border-2"
                    style={{ background: "linear-gradient(135deg,#1c4f09,#3a8a18)", borderColor: "#5aaa30" }}>{initials}</div>
                  <div className="text-left hidden sm:block">
                    <div className="text-[0.81rem] font-extrabold" style={{ color: "#1a4a08" }}>{user.firstName}</div>
                    <div className="text-[0.64rem] font-bold" style={{ color: "#6a7a50" }}>Member</div>
                  </div>
                  <i className={"fas fa-chevron-down text-[0.62rem] transition-transform duration-200 " + (dropOpen ? "rotate-180" : "")} style={{ color: "#6a7a50" }} />
                </button>
                {dropOpen && (
                  <div className="absolute top-[calc(100%+9px)] right-0 rounded-[14px] border min-w-[215px] p-2 z-[999]"
                    style={{ background: "rgba(255,252,235,0.98)", borderColor: "rgba(180,140,60,0.28)", boxShadow: "0 8px 40px rgba(100,70,20,0.20)", animation: "fadeUp .18s ease both" }}
                    onClick={() => setDropOpen(false)}>
                    <div className="flex items-center gap-2.5 px-2 py-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.78rem] font-black text-white border-2" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)", borderColor: "#5aaa30" }}>{initials}</div>
                      <div>
                        <div className="text-[0.86rem] font-extrabold" style={{ color: "#1a4a08" }}>{user.firstName}</div>
                        <div className="text-[0.7rem] font-bold" style={{ color: "#6a7a50" }}>{user.email}</div>
                      </div>
                    </div>
                    <div className="h-px my-1" style={{ background: "rgba(180,140,60,0.28)" }} />
                    {[["fas fa-th-large","Dashboard","/profile"],["fas fa-sign-out-alt","Log Out",null,"danger"]].map(([icon,label,to,cls]) => (
                      cls === "danger"
                        ? <button key={label} onClick={logout}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[0.82rem] font-bold transition-all text-left border-none bg-transparent"
                            style={{ color: "#c03030", fontFamily: "'Nunito',sans-serif" }}>
                            <i className={icon + " w-4"} />{label}
                          </button>
                        : <Link key={label} to={to} onClick={() => setDropOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[0.82rem] font-bold no-underline transition-all"
                            style={{ color: "#3a5020" }}>
                            <i className={icon + " w-4"} />{label}
                          </Link>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={logout} className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[0.79rem] font-extrabold transition-all border"
                style={{ background: "rgba(192,48,48,0.08)", borderColor: "rgba(192,48,48,0.25)", color: "#c03030", fontFamily: "'Nunito',sans-serif" }}>
                <i className="fas fa-sign-out-alt" /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[0.82rem] font-extrabold no-underline border transition-all"
                style={{ background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#3a5020" }}>
                <i className="fas fa-sign-in-alt" /> Log In
              </Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[0.82rem] font-extrabold no-underline border transition-all text-white"
                style={{ background: "#1c4f09", borderColor: "#1c4f09", boxShadow: "0 3px 12px rgba(28,79,9,0.28)" }}>
                <i className="fas fa-paw" /> Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Welcome Banner ── */}
      {loggedIn && (
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap px-10 py-3.5 border-b"
          style={{ background: "linear-gradient(135deg,rgba(28,79,9,0.11),rgba(90,170,48,0.07))", borderColor: "rgba(90,170,48,0.28)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-[1.3rem]">🐾</span>
            <span className="text-[0.88rem] font-extrabold" style={{ color: "#1a4a08" }}>
              Welcome back, <em style={{ fontStyle: "italic", color: "#e07820" }}>{user.firstName}</em>! Ready to find a new friend today?
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/profile" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[0.78rem] font-extrabold text-white no-underline transition-all"
              style={{ background: "#1c4f09" }}><i className="fas fa-th-large" /> Dashboard</Link>
            <Link to="/missing-pets" className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[0.78rem] font-extrabold text-white no-underline transition-all"
              style={{ background: "#B45A22" }}><i className="fas fa-search-location" /> Missing Pets</Link>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="relative z-10 flex items-center flex-wrap gap-16 px-10 py-20 max-w-[1400px] mx-auto min-h-[calc(100vh-70px)]">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-[50px] px-4 py-1.5 text-[0.72rem] font-extrabold uppercase tracking-[.1em] italic mb-5 border"
            style={{ background: "rgba(28,79,9,0.09)", borderColor: "rgba(90,170,48,0.32)", color: "#1c4f09", animation: "fadeUp 0.6s ease both" }}>
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#5aaa30", animation: "dotPulse 2s ease infinite" }} />
            Ilocos Region's Pet Adoption Platform
          </div>

          <h1 className="hero-title font-black leading-none tracking-tight mb-0"
            style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(3rem,6vw,5.5rem)", color: "#1a4a08", animation: "fadeUp 0.6s ease 0.1s both", textShadow: "0 3px 20px rgba(255,255,255,0.4)" }}>
            Find Your <em>Forever</em>
            <span className="block">Companion.</span>
          </h1>

          <p className="font-bold leading-[1.7] mt-5 max-w-[480px] text-[1.05rem]" style={{ color: "#3a5020", animation: "fadeUp 0.6s ease 0.2s both" }}>
            Pawster connects loving homes with animals in need across the Ilocos Region. Browse adoptable pets, submit applications, and give a life a second chance.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-8" style={{ animation: "fadeUp 0.6s ease 0.3s both" }}>
            <Link to="/pets" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[13px] font-black text-[0.95rem] text-white no-underline transition-all"
              style={{ background: "#1c4f09", boxShadow: "0 6px 24px rgba(28,79,9,0.32)" }}>
              <i className="fas fa-search" /> Browse Animals
            </Link>
            {loggedIn ? (
              <>
                <Link to="/profile" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-extrabold text-[0.95rem] no-underline transition-all border"
                  style={{ background: "rgba(255,248,220,0.75)", color: "#3a5020", borderColor: "rgba(180,140,60,0.28)" }}>
                  <i className="fas fa-th-large" /> My Dashboard
                </Link>
                <Link to="/missing-pets" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-black text-[0.95rem] text-white no-underline transition-all"
                  style={{ background: "#B45A22", boxShadow: "0 6px 24px rgba(180,90,34,0.28)" }}>
                  <i className="fas fa-search-location" /> Missing Pets
                </Link>
              </>
            ) : (
              <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-extrabold text-[0.95rem] no-underline transition-all border"
                style={{ background: "rgba(255,248,220,0.75)", color: "#3a5020", borderColor: "rgba(180,140,60,0.28)" }}>
                <i className="fas fa-user-plus" /> Create Account
              </Link>
            )}
          </div>

          <div className="flex items-center gap-8 mt-11" style={{ animation: "fadeUp 0.6s ease 0.4s both" }}>
            {[["240+","Pets Adopted"],["4","Provinces"],["98%","Happy Families"]].map(([val, lbl], i) => (
              <div key={lbl} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-9" style={{ background: "rgba(180,140,60,0.28)" }} />}
                <div>
                  <div className="font-black leading-none text-[2rem]" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>{val}</div>
                  <div className="text-[0.72rem] font-bold uppercase tracking-[.06em] mt-0.5" style={{ color: "#6a7a50" }}>{lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero card */}
        <div className="flex-shrink-0 w-[380px]">
          <HeroPetCard />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="relative z-10 max-w-[1200px] mx-auto px-10 py-20">
        <Reveal><div className="inline-flex items-center gap-1.5 rounded-[50px] px-3.5 py-1 text-[0.67rem] font-extrabold uppercase tracking-[.1em] italic mb-3.5 border" style={{ background: "rgba(28,79,9,0.08)", borderColor: "rgba(90,170,48,0.28)", color: "#1c4f09" }}><i className="fas fa-list-ol text-[0.65rem]" /> Simple Process</div></Reveal>
        <Reveal delay={100}><h2 className="sec-title font-black leading-tight mb-4" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,3.5vw,3rem)", color: "#1a4a08" }}>How <em>Adoption</em> Works</h2></Reveal>
        <Reveal delay={200}><p className="font-bold leading-[1.7] text-[0.95rem] max-w-[500px]" style={{ color: "#3a5020" }}>Three easy steps to bring a new friend home.</p></Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { num: "01", icon: "fas fa-search",   iconBg: "rgba(28,79,9,0.12)", iconColor: "#1c4f09", title: "Browse & Choose",      desc: "Explore listings of dogs, cats, and small animals available across the Ilocos Region. Filter by type, age, and location." },
            { num: "02", icon: "fas fa-file-alt",  iconBg: "rgba(180,90,34,0.12)", iconColor: "#B45A22", title: "Submit Application", desc: "Fill out a short adoption form online. Our team reviews every application and responds within 2–3 business days." },
            { num: "03", icon: "fas fa-heart",     iconBg: "rgba(212,136,10,0.12)", iconColor: "#d4880a", title: "Welcome Home",      desc: "Once approved, coordinate your meet & greet. We follow up to make sure both you and your companion are thriving." },
          ].map(({ num, icon, iconBg, iconColor, title, desc }, i) => (
            <Reveal key={title} delay={(i + 1) * 100}>
              <div className="relative overflow-hidden rounded-[18px] border p-8 transition-all duration-200 hover:-translate-y-1"
                style={{ background: "rgba(255,248,225,0.75)", borderColor: "rgba(180,140,60,0.28)", boxShadow: "0 4px 24px rgba(100,70,20,0.13)" }}>
                <div className="absolute top-4 right-5 font-black leading-none" style={{ fontFamily: "'Playfair Display',serif", fontSize: "3.5rem", color: "rgba(28,79,9,0.10)" }}>{num}</div>
                <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[1.4rem] mb-5" style={{ background: iconBg, color: iconColor }}>
                  <i className={icon} />
                </div>
                <div className="font-black text-[1.05rem] mb-2" style={{ color: "#1a4a08" }}>{title}</div>
                <p className="text-[0.85rem] font-bold leading-[1.65]" style={{ color: "#6a7a50" }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 text-center">
          <Link to="/how-it-works" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-extrabold text-[0.95rem] no-underline transition-all border"
            style={{ background: "rgba(255,248,220,0.75)", color: "#3a5020", borderColor: "rgba(180,140,60,0.28)" }}>
            <i className="fas fa-arrow-right" /> Full Process Details
          </Link>
        </Reveal>
      </section>

      {/* ── Stats Band ── */}
      <div className="relative z-10 border-t border-b py-12 px-10" style={{ background: "rgba(255,248,220,0.65)", backdropFilter: "blur(14px)", borderColor: "rgba(90,170,48,0.45)" }}>
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[["240+","Animals Adopted"],["18+","Cities Covered"],["4","Ilocos Provinces"],["98%","Satisfaction Rate"]].map(([val, lbl], i) => (
            <Reveal key={lbl} delay={i * 100}>
              <div className="font-black leading-none text-[3rem]" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>
                {val.includes("+") ? <>{val.slice(0, -1)}<em style={{ fontStyle: "italic", color: "#e07820" }}>+</em></> : val.includes("%") ? <>{val.slice(0, -1)}<em style={{ fontStyle: "italic", color: "#e07820" }}>%</em></> : val}
              </div>
              <div className="text-[0.78rem] font-bold uppercase tracking-[.07em] mt-1.5" style={{ color: "#6a7a50" }}>{lbl}</div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── Missing Pets Band ── */}
      <div className="relative z-10 px-10 py-5 border-t border-b" style={{ background: "linear-gradient(135deg,rgba(180,90,34,0.12),rgba(212,136,10,0.08))", borderColor: "rgba(180,90,34,0.25)" }}>
        <div className="max-w-[1100px] mx-auto flex items-center gap-5 flex-wrap">
          <span className="text-[1.8rem] flex-shrink-0">🔍</span>
          <div className="flex-1">
            <div className="text-[0.95rem] font-black" style={{ color: "#1a4a08" }}>Lost or Found a Pet in the Ilocos Region?</div>
            <div className="text-[0.8rem] font-bold mt-0.5" style={{ color: "#6a7a50" }}>Our community-powered missing pets board helps reunite animals with their families.</div>
          </div>
          <Link to="/missing-pets" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[9px] font-extrabold text-[0.82rem] text-white no-underline transition-all flex-shrink-0 whitespace-nowrap"
            style={{ background: "#B45A22" }}>
            <i className="fas fa-search-location" /> View Missing Pets Board
          </Link>
        </div>
      </div>

      {/* ── Featured Pets ── */}
      <section id="pets" className="relative z-10 max-w-[1200px] mx-auto px-10 py-20">
        <Reveal><div className="inline-flex items-center gap-1.5 rounded-[50px] px-3.5 py-1 text-[0.67rem] font-extrabold uppercase tracking-[.1em] italic mb-3.5 border" style={{ background: "rgba(28,79,9,0.08)", borderColor: "rgba(90,170,48,0.28)", color: "#1c4f09" }}><i className="fas fa-paw text-[0.65rem]" /> Looking for Homes</div></Reveal>
        <Reveal delay={100}><h2 className="sec-title font-black leading-tight mb-4" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,3.5vw,3rem)", color: "#1a4a08" }}><em>Featured</em> Animals</h2></Reveal>
        <Reveal delay={200}><p className="font-bold leading-[1.7] text-[0.95rem] max-w-[500px]" style={{ color: "#3a5020" }}>These wonderful animals are ready to meet you.</p></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-11">
          {FEATURED.map((p, i) => (
            <Reveal key={p.name} delay={(i + 1) * 80}><FeaturedCard pet={p} /></Reveal>
          ))}
        </div>
        <Reveal className="mt-9 text-center">
          <Link to="/pets" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-extrabold text-[0.95rem] no-underline transition-all border"
            style={{ background: "rgba(255,248,220,0.75)", color: "#3a5020", borderColor: "rgba(180,140,60,0.28)" }}>
            <i className="fas fa-search" /> Browse All Animals
          </Link>
        </Reveal>
      </section>

      {/* ── Rehome Banner ── */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-10 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[24px] border p-14 flex items-center gap-12 flex-wrap"
            style={{ background: "linear-gradient(135deg,rgba(180,90,34,0.10),rgba(212,136,10,0.08))", borderColor: "rgba(180,90,34,0.28)", boxShadow: "0 8px 40px rgba(180,90,34,0.12)" }}>
            <span className="text-[5rem] flex-shrink-0" style={{ animation: "floatY 5s ease-in-out infinite" }}>🏡</span>
            <div className="flex-1">
              <h2 className="rehome-title font-black leading-tight mb-3 text-[2.2rem]" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>Need to <em>Rehome</em> Your Pet?</h2>
              <p className="font-bold text-[0.95rem] leading-[1.7] max-w-[520px] mb-6" style={{ color: "#3a5020" }}>Life circumstances change. If you're unable to care for your pet, Pawster can help find them a safe, loving new home with care and discretion.</p>
              <Link to="/rehome" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[12px] font-black text-[0.9rem] text-white no-underline transition-all"
                style={{ background: "#B45A22", boxShadow: "0 5px 20px rgba(180,90,34,0.3)" }}>
                <i className="fas fa-home" /> Rehome a Pet
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Testimonials ── */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-10 py-20">
        <Reveal><div className="inline-flex items-center gap-1.5 rounded-[50px] px-3.5 py-1 text-[0.67rem] font-extrabold uppercase tracking-[.1em] italic mb-3.5 border" style={{ background: "rgba(28,79,9,0.08)", borderColor: "rgba(90,170,48,0.28)", color: "#1c4f09" }}><i className="fas fa-comment-heart text-[0.65rem]" /> Success Stories</div></Reveal>
        <Reveal delay={100}><h2 className="sec-title font-black leading-tight mb-4" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,3.5vw,3rem)", color: "#1a4a08" }}>Happy <em>Families</em></h2></Reveal>
        <Reveal delay={200}><p className="font-bold leading-[1.7] text-[0.95rem] max-w-[500px]" style={{ color: "#3a5020" }}>Real stories from real adopters across the Ilocos Region.</p></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-11">
          {TESTIMONIALS.map(({ stars, text, name, loc, initials: ini }, i) => (
            <Reveal key={name} delay={(i + 1) * 100}>
              <div className="relative overflow-hidden rounded-[18px] border p-7 transition-all duration-200 hover:-translate-y-1"
                style={{ background: "rgba(255,248,225,0.75)", borderColor: "rgba(180,140,60,0.28)", boxShadow: "0 4px 24px rgba(100,70,20,0.13)" }}>
                <div className="text-[0.85rem] tracking-widest mb-3.5" style={{ color: "#d4880a" }}>{"★".repeat(stars)}</div>
                <p className="italic font-bold leading-[1.72] text-[0.88rem] mb-5" style={{ color: "#3a5020" }}>{text}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[0.78rem] font-black text-white border-2 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#1c4f09,#3a8a18)", borderColor: "#5aaa30" }}>{ini}</div>
                  <div>
                    <div className="text-[0.84rem] font-black" style={{ color: "#1a4a08" }}>{name}</div>
                    <div className="text-[0.68rem] font-bold" style={{ color: "#6a7a50" }}>{loc}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-10 py-24">
        <Reveal>
          <div className="max-w-[780px] mx-auto relative overflow-hidden rounded-[28px] border p-16 text-center"
            style={{ background: "linear-gradient(135deg,rgba(28,79,9,0.13),rgba(90,170,48,0.08))", borderColor: "rgba(90,170,48,0.4)", boxShadow: "0 12px 50px rgba(28,79,9,0.14)" }}>
            <div className="absolute bottom-[-1rem] right-4 text-[8rem] opacity-[0.04] pointer-events-none select-none">🐾</div>
            <div className="inline-flex items-center gap-1.5 rounded-[50px] px-3.5 py-1 text-[0.67rem] font-extrabold uppercase tracking-[.1em] italic mb-4 border" style={{ background: "rgba(28,79,9,0.08)", borderColor: "rgba(90,170,48,0.28)", color: "#1c4f09" }}>🐾 Ready to Begin?</div>
            <h2 className="cta-title font-black leading-tight mb-4" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3.2rem)", color: "#1a4a08" }}>Give a Pet a <em>Second Chance</em></h2>
            <p className="font-bold text-[0.95rem] leading-[1.7] mb-8" style={{ color: "#3a5020" }}>Join hundreds of families across the Ilocos Region who have opened their hearts and homes.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {loggedIn ? (
                <>
                  <Link to="/profile" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[13px] font-black text-[0.95rem] text-white no-underline"
                    style={{ background: "#1c4f09", boxShadow: "0 6px 24px rgba(28,79,9,0.32)" }}>
                    <i className="fas fa-th-large" /> Go to Dashboard
                  </Link>
                  <Link to="/missing-pets" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-extrabold text-[0.95rem] no-underline border"
                    style={{ background: "rgba(255,248,220,0.75)", color: "#3a5020", borderColor: "rgba(180,140,60,0.28)" }}>
                    <i className="fas fa-search-location" /> Missing Pets
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[13px] font-black text-[0.95rem] text-white no-underline"
                    style={{ background: "#1c4f09", boxShadow: "0 6px 24px rgba(28,79,9,0.32)" }}>
                    <i className="fas fa-paw" /> Create Free Account
                  </Link>
                  <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[13px] font-extrabold text-[0.95rem] no-underline border"
                    style={{ background: "rgba(255,248,220,0.75)", color: "#3a5020", borderColor: "rgba(180,140,60,0.28)" }}>
                    <i className="fas fa-sign-in-alt" /> Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t px-10 pt-12 pb-8" style={{ background: "rgba(255,248,218,0.85)", backdropFilter: "blur(16px)", borderColor: "rgba(90,170,48,0.45)" }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
          <div>
            <div className="w-10 h-10 rounded-full bg-[#1c4f09] flex items-center justify-center text-lg mb-3">🐾</div>
            <div className="footer-brand-name font-black text-[1.2rem]" style={{ fontFamily: "'Playfair Display',serif", color: "#1a4a08" }}>Paw<em>ster</em></div>
            <p className="text-[0.82rem] font-bold leading-[1.7] mt-2 max-w-[260px]" style={{ color: "#6a7a50" }}>Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
          </div>
          {[
            { title: "Adopt", links: [
                { label: "Browse Animals", to: "/pets" },
                { label: "My Profile",     to: "/profile" },
                { label: "Log In",         to: "/login" },
                { label: "Register",       to: "/register" },
            ]},
            { title: "Services", links: [
                { label: "How It Works",  to: "/how-it-works" },
                { label: "Rehome a Pet",  to: "/rehome" },
                { label: "Missing Pets",  to: "/missing-pets" },
                { label: "About Us",      to: "/about" },
            ]},
            { title: "Regions", links: [
                { label: "Ilocos Norte", to: "/pets" },
                { label: "Ilocos Sur",   to: "/pets" },
                { label: "La Union",     to: "/pets" },
                { label: "Pangasinan",   to: "/pets" },
            ]},
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-[.09em] mb-4" style={{ color: "#1c4f09" }}>{title}</div>
              {links.map(({ label, to }) => (
                <Link key={label} to={to} className="block text-[0.83rem] font-bold no-underline mb-2 transition-colors hover:text-[#1a4a08]" style={{ color: "#3a5020" }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 flex items-center justify-between gap-4 flex-wrap border-t" style={{ borderColor: "rgba(180,140,60,0.28)" }}>
          <div className="text-[0.75rem] font-bold" style={{ color: "#6a7a50" }}>© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f","fab fa-instagram","fab fa-twitter"].map(icon => (
              <a key={icon} href="#" className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[0.8rem] no-underline transition-all border"
                style={{ background: "rgba(255,250,232,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#6a7a50" }}>
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}