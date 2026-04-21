import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";

/* ─────────────────────────────────────────────
   API CONFIG
───────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_BASE   ?? "http://localhost:8000";
const PHP_BASE = import.meta.env.VITE_PHP_API_URL ?? "http://localhost:8000";

function getToken() {
  return (
    localStorage.getItem("pawster_token")  ||
    localStorage.getItem("token")          ||
    localStorage.getItem("authToken")      ||
    localStorage.getItem("accessToken")    ||
    sessionStorage.getItem("token")        ||
    ""
  );
}

function resolvePhotoUrl(a) {
  // Spring Boot: inline base64
  if (a.photoData && a.photoType) {
    return `data:${a.photoType};base64,${a.photoData}`;
  }
  const raw =
    a.photoUrl || a.photo_url || a.photo ||
    a.imageUrl || a.image_url || a.imgUrl || null;
  if (!raw) return null;
  if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Relative paths: PHP animals use PHP_BASE, SB animals use API_BASE
  const base = a._source === "php" ? PHP_BASE : API_BASE;
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function resolveVideoUrl(a) {
  const raw = a.videoUrl || a.video_url || a.video || null;
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const base = a._source === "php" ? PHP_BASE : API_BASE;
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

async function fetchPhpAnimals() {
  try {
    const form = new FormData();
    form.append("action", "get_animals");
    const res = await fetch(`/php/admin/dashboard`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) {
      console.warn("PHP animals unavailable: HTTP", res.status);
      return [];
    }
    const text = await res.text();
    if (!text.trim()) {
      console.warn("PHP animals: empty response");
      return [];
    }
    const json = JSON.parse(text);
    if (json?.success && Array.isArray(json.data)) {
      return json.data.map(a => ({
        ...a,
        _source: "php",
        _resolvedPhotoUrl: resolvePhotoUrl({ ...a, _source: "php" }),
        _resolvedVideoUrl: resolveVideoUrl({ ...a, _source: "php" }),
      }));
    }
  } catch (err) {
    console.warn("PHP animals unavailable:", err);
  }
  return [];
}

async function fetchSbAnimals() {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/animals?status=Available&limit=8`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.content ?? []);
    return list.map(a => ({
      ...a,
      _source: "springboot",
      _resolvedPhotoUrl: resolvePhotoUrl({ ...a, _source: "springboot" }),
      _resolvedVideoUrl: resolveVideoUrl({ ...a, _source: "springboot" }),
    }));
  } catch (err) {
    console.warn("Spring Boot animals unavailable:", err);
  }
  return [];
}

const TYPE_EMOJI  = { Dog: "🐕", Cat: "🐈", Bird: "🐦", Rabbit: "🐇" };
const STATUS_META = {
  Available: { dot: "#6cde28", glow: "#6cde28", text: "#9de860", ring: "rgba(80,200,30,.32)",  bg: "rgba(70,190,30,.18)"  },
  Pending:   { dot: "#e07820", glow: "#e07820", text: "#f0a060", ring: "rgba(200,100,25,.30)", bg: "rgba(180,90,30,.18)"  },
  Adopted:   { dot: "#aaa",    glow: "#aaa",    text: "#ccc",    ring: "rgba(150,150,150,.3)", bg: "rgba(100,100,100,.18)" },
};

/* ─────────────────────────────────────────────
   REVEAL HOOK
───────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, vis] = useReveal();
  return (
    <div
      ref={ref}
      className={"transition-all duration-700 " + (vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6") + " " + className}
      style={{ transitionDelay: delay + "ms" }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHIMMER SKELETON
───────────────────────────────────────────── */
function Skel({ h, w = "100%", r = 10, mt = 0 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r, marginTop: mt,
      background: "linear-gradient(90deg,rgba(255,235,180,.35) 25%,rgba(255,250,225,.65) 50%,rgba(255,235,180,.35) 75%)",
      backgroundSize: "600px 100%",
      animation: "shimmer 1.5s ease infinite",
    }} />
  );
}

/* ─────────────────────────────────────────────
   SECTION PILL BADGE
───────────────────────────────────────────── */
function Pill({ icon, children }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-[50px] px-3.5 py-[5px] text-[0.67rem] font-extrabold uppercase tracking-[.1em] italic mb-4 border"
      style={{ background: "rgba(28,79,9,0.08)", borderColor: "rgba(90,170,48,0.28)", color: "#1c4f09" }}>
      <i className={icon + " text-[0.62rem]"} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO PET CARD
───────────────────────────────────────────── */
function HeroPetCard({ pets, loading }) {
  const [idx, setIdx]         = useState(0);
  const [hovering, setHover]  = useState(false);
  const [fading, setFading]   = useState(false);
  const [videoReady, setVRdy] = useState(false);
  const videoRef              = useRef(null);

  const go = useCallback((next) => {
    if (next === idx) return;
    setFading(true);
    setVRdy(false);
    setTimeout(() => { setIdx(next); setFading(false); }, 240);
  }, [idx]);

  useEffect(() => {
    if (hovering || pets.length < 2) return;
    const id = setInterval(() => go((idx + 1) % pets.length), 4500);
    return () => clearInterval(id);
  }, [hovering, idx, pets.length, go]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && pets[idx]?._resolvedVideoUrl) {
      v.src = pets[idx]._resolvedVideoUrl;
      v.load();
      v.play().catch(() => {});
    } else {
      v.pause();
      v.removeAttribute("src");
    }
  }, [hovering, idx, pets]);

  if (loading) {
    return (
      <div className="w-full max-w-[400px] mx-auto">
        <div style={{
          height: 560, borderRadius: 32, overflow: "hidden",
          background: "linear-gradient(90deg,rgba(255,235,180,.35) 25%,rgba(255,250,225,.65) 50%,rgba(255,235,180,.35) 75%)",
          backgroundSize: "600px 100%", animation: "shimmer 1.5s ease infinite",
          boxShadow: "0 24px 64px rgba(40,20,5,.25)",
        }} />
      </div>
    );
  }

  if (!pets.length) return null;

  const pet   = pets[idx];
  const emoji = TYPE_EMOJI[pet.type] ?? "🐾";
  const photo = pet._resolvedPhotoUrl;
  const video = pet._resolvedVideoUrl;
  const sm    = STATUS_META[pet.status] ?? STATUS_META.Available;

  return (
    <div
      className="w-full max-w-[400px] mx-auto select-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setVRdy(false); }}
    >
      <div
        className="relative transition-all duration-700"
        style={{
          borderRadius: 32,
          padding: 3,
          background: hovering
            ? "linear-gradient(135deg,rgba(90,170,48,.55),rgba(224,120,32,.45),rgba(90,170,48,.55))"
            : "linear-gradient(135deg,rgba(180,140,60,.22),rgba(180,140,60,.10))",
          boxShadow: hovering
            ? "0 32px 80px rgba(40,20,5,.50), 0 0 0 1px rgba(90,170,48,.3)"
            : "0 24px 64px rgba(40,20,5,.38)",
          transform: hovering ? "translateY(-16px) scale(1.03)" : "translateY(0) scale(1)",
          animation: hovering ? "none" : "cardFloat 7s ease-in-out infinite",
        }}
      >
        <div className="relative w-full rounded-[29px] overflow-hidden" style={{ height: 560, background: "#0f0d08" }}>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]"
            style={{ fontSize: "8rem", opacity: 0.12 }}>{emoji}</div>

          {photo && (
            <img
              src={photo}
              alt={pet.name}
              className="absolute inset-0 w-full h-full object-cover z-[2] transition-all duration-700"
              style={{
                opacity: fading ? 0 : (hovering && videoReady ? 0 : 1),
                transform: hovering ? "scale(1.07)" : "scale(1.0)",
                filter: hovering ? "brightness(0.7)" : "brightness(1)",
              }}
            />
          )}

          {video && (
            <video
              ref={videoRef}
              muted loop playsInline
              onCanPlay={() => setVRdy(true)}
              className="absolute inset-0 w-full h-full object-cover z-[3] transition-opacity duration-700"
              style={{ opacity: hovering && videoReady ? 1 : 0 }}
            />
          )}

          <div className="absolute inset-0 z-[4] pointer-events-none"
            style={{ background: "linear-gradient(to top,rgba(6,4,1,.95) 0%,rgba(6,4,1,.5) 38%,rgba(6,4,1,.08) 62%,transparent 100%)" }} />

          {video && (
            <div
              className="absolute top-[16px] left-[16px] z-[8] flex items-center gap-1.5 rounded-[20px] px-[10px] py-[4px] text-[0.58rem] font-extrabold uppercase tracking-[.08em] transition-all duration-400"
              style={{
                background: "rgba(6,4,1,.60)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,80,80,.28)", color: "rgba(255,200,180,.90)",
                opacity: hovering ? 1 : 0,
                transform: hovering ? "translateX(0)" : "translateX(-8px)",
                transitionDelay: hovering ? "120ms" : "0ms",
              }}
            >
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ background: "#ff4444", boxShadow: "0 0 10px #ff2222", animation: "livePulse 1.4s ease infinite" }} />
              Live Preview
            </div>
          )}

          {pets.length > 1 && (
            <div className="absolute top-[18px] right-[18px] z-[8] flex gap-[5px] items-center">
              {pets.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className="transition-all duration-300 flex-shrink-0"
                  style={{
                    width: i === idx ? "24px" : "7px", height: "7px",
                    borderRadius: i === idx ? "4px" : "50%",
                    background: i === idx ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.30)",
                    border: "1px solid rgba(255,255,255,.20)",
                  }}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 z-[6] px-[24px] pb-[24px]">
            <div
              className="inline-flex items-center gap-[5px] rounded-[20px] px-[10px] py-[4px] mb-[10px] text-[0.60rem] font-extrabold uppercase tracking-[.07em] transition-all duration-500"
              style={{
                background: "rgba(255,255,255,.09)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,.14)", color: "rgba(255,238,185,.85)",
                transform: hovering ? "translateY(0)" : "translateY(8px)",
                opacity: hovering ? 1 : 0.75,
              }}
            >
              {emoji} {pet.type}
            </div>

            <div
              className="font-black text-white leading-[.95] transition-all duration-500"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "clamp(2rem,5vw,2.8rem)",
                textShadow: "0 3px 24px rgba(0,0,0,.6)",
                transform: hovering ? "translateY(0)" : "translateY(6px)",
              }}
            >
              {pet.name}
            </div>

            <div
              className="mt-[6px] text-[0.72rem] font-bold transition-all duration-500"
              style={{
                fontFamily: "'DM Mono',monospace",
                color: "rgba(255,228,155,.55)",
                transform: hovering ? "translateY(0)" : "translateY(6px)",
                transitionDelay: "60ms",
              }}
            >
              {[pet.breed, pet.age, pet.gender].filter(Boolean).join("  ·  ")}
            </div>

            <div
              className="flex items-center justify-between mt-[14px] transition-all duration-500"
              style={{ opacity: hovering ? 1 : 0, transform: hovering ? "translateY(0)" : "translateY(12px)", transitionDelay: "100ms" }}
            >
              <div
                className="inline-flex items-center gap-[6px] px-[10px] py-[5px] rounded-[20px] text-[0.60rem] font-extrabold uppercase tracking-[.07em]"
                style={{ background: sm.bg, color: sm.text, border: `1px solid ${sm.ring}` }}
              >
                <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                  style={{ background: sm.dot, boxShadow: `0 0 8px ${sm.glow}`, animation: "dotPulse 2s ease infinite" }} />
                {pet.status}
              </div>

              <Link
                to="/pets"
                className="inline-flex items-center gap-[6px] bg-white text-[#15100a] font-black text-[0.78rem] px-[16px] py-[8px] rounded-[50px] no-underline transition-all duration-200 hover:bg-[#f0f0e8]"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,.40)" }}
              >
                ♥ Adopt Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardFloat { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-10px) rotate(.3deg)} 75%{transform:translateY(-5px) rotate(-.2deg)} }
        @keyframes livePulse { 0%,100%{box-shadow:0 0 6px #ff3030;opacity:1} 50%{box-shadow:0 0 16px #ff2020;opacity:.65} }
        @keyframes dotPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.5)} 50%{box-shadow:0 0 0 7px rgba(90,170,48,0)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURED CARD
───────────────────────────────────────────── */
function FeaturedCard({ animal, delay = 0 }) {
  const [ref, vis]          = useReveal();
  const [hov, setHov]       = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const photo = animal._resolvedPhotoUrl;
  const emoji = TYPE_EMOJI[animal.type] ?? "🐾";
  const sm    = STATUS_META[animal.status] ?? STATUS_META.Available;

  return (
    <div
      ref={ref}
      className="rounded-[22px] overflow-hidden flex flex-col cursor-pointer transition-all duration-400"
      style={{
        background: "rgba(255,249,228,0.80)",
        border: `1px solid ${hov ? "rgba(90,170,55,.50)" : "rgba(180,140,60,0.26)"}`,
        boxShadow: hov ? "0 12px 50px rgba(90,60,10,0.22)" : "0 4px 28px rgba(100,70,20,0.13)",
        transform: vis ? (hov ? "translateY(-9px)" : "translateY(0)") : "translateY(22px)",
        opacity: vis ? 1 : 0,
        transitionDelay: delay + "ms",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="relative overflow-hidden" style={{ height: 196, borderBottom: "1px solid rgba(180,140,60,0.22)", background: "linear-gradient(135deg,rgba(255,244,210,.7),rgba(255,236,190,.5))" }}>
        <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "4.5rem", opacity: 0.2 }}>{emoji}</div>

        <span
          className="absolute top-[10px] left-[10px] z-10 inline-flex items-center gap-[5px] text-[0.58rem] font-extrabold px-[8px] py-[3px] rounded-[20px] uppercase tracking-[.05em]"
          style={{ background: sm.bg, backdropFilter: "blur(8px)", color: sm.text, border: `1px solid ${sm.ring}` }}
        >
          {animal.status === "Available" && <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: sm.dot, boxShadow: `0 0 6px ${sm.glow}` }} />}
          {animal.status}
        </span>

        <span
          className="absolute top-[10px] right-[10px] z-10 text-[0.58rem] font-extrabold px-[8px] py-[3px] rounded-[20px] uppercase tracking-[.05em]"
          style={{ background: "rgba(10,6,2,.52)", backdropFilter: "blur(8px)", color: "rgba(255,232,148,.85)", border: "1px solid rgba(255,210,80,.18)" }}
        >
          {emoji} {animal.type}
        </span>

        {photo && !imgErr && (
          <img
            src={photo} alt={animal.name} loading="lazy"
            className="absolute inset-0 w-full h-full object-cover z-[5] transition-transform duration-600"
            style={{ transform: hov ? "scale(1.09)" : "scale(1.0)" }}
            onError={() => setImgErr(true)}
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-[50px] z-[6] pointer-events-none"
          style={{ background: "linear-gradient(to top,rgba(255,245,215,.85),transparent)" }} />
      </div>

      <div className="flex flex-col flex-1 p-[18px]">
        <div className="font-black text-[1.05rem] leading-tight" style={{ color: "#192e08", fontFamily: "'Playfair Display',serif" }}>{animal.name}</div>
        <div className="text-[0.70rem] font-bold mt-[4px]" style={{ color: "#7a8a5a", fontFamily: "'DM Mono',monospace" }}>
          {[animal.breed, animal.age, animal.gender].filter(Boolean).join(" · ")}
        </div>

        {animal.description && (
          <p className="text-[0.80rem] leading-[1.58] mt-[8px] flex-1 font-semibold" style={{ color: "#4a6030" }}>
            {animal.description.length > 85 ? animal.description.slice(0, 85) + "…" : animal.description}
          </p>
        )}

        <Link
          to="/pets"
          className="flex items-center justify-center gap-[6px] mt-[14px] py-[10px] rounded-[10px] text-[0.78rem] font-black no-underline transition-all duration-250"
          style={{
            background: hov ? "#1c4f09" : "rgba(28,79,9,0.07)",
            color: hov ? "#fff" : "#1c4f09",
            border: `1.5px solid ${hov ? "#1c4f09" : "rgba(90,170,48,0.28)"}`,
            boxShadow: hov ? "0 4px 16px rgba(28,79,9,0.28)" : "none",
          }}
        >
          <i className="fas fa-heart text-[0.72rem]" /> Adopt {animal.name}
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURED SKELETON
───────────────────────────────────────────── */
function FeaturedSkel() {
  return (
    <div className="rounded-[22px] overflow-hidden" style={{ border: "1px solid rgba(180,140,60,0.22)", background: "rgba(255,249,228,0.65)" }}>
      <Skel h={196} r={0} />
      <div className="p-[18px] flex flex-col gap-[10px]">
        <Skel h={18} w="62%" />
        <Skel h={13} w="82%" />
        <Skel h={12} w="70%" />
        <Skel h={38} mt={6} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HOW IT WORKS STEP CARD
───────────────────────────────────────────── */
function Step({ num, icon, iconBg, iconColor, title, desc, delay }) {
  return (
    <Reveal delay={delay}>
      <div
        className="relative overflow-hidden rounded-[20px] border p-8 h-full transition-all duration-300 hover:-translate-y-[6px] group"
        style={{ background: "rgba(255,249,228,0.78)", borderColor: "rgba(180,140,60,0.26)", boxShadow: "0 4px 28px rgba(100,70,20,0.11)" }}
      >
        <div
          className="absolute top-[14px] right-[18px] font-black leading-none pointer-events-none transition-opacity duration-500 group-hover:opacity-20"
          style={{ fontFamily: "'Playfair Display',serif", fontSize: "4rem", color: "rgba(28,79,9,0.08)" }}
        >{num}</div>

        <div className="w-[54px] h-[54px] rounded-[16px] flex items-center justify-center text-[1.5rem] mb-[18px] transition-transform duration-400 group-hover:scale-110"
          style={{ background: iconBg, color: iconColor }}>
          <i className={icon} />
        </div>

        <div className="font-black text-[1.05rem] mb-[8px]" style={{ color: "#192e08", fontFamily: "'Playfair Display',serif" }}>{title}</div>
        <p className="text-[0.84rem] font-semibold leading-[1.68]" style={{ color: "#7a8a5a" }}>{desc}</p>
      </div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const loggedIn = !!user;

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adopted, setAdopted] = useState(null);

  useEffect(() => {
    const token   = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch both sources in parallel — same pattern as FindAPet
    Promise.all([
      fetchSbAnimals(),
      fetchPhpAnimals(),
    ]).then(([sbAnimals, phpAnimals]) => {
      // De-duplicate: skip SB animals already in PHP by name+type
      const dedupedSb = sbAnimals.filter(sb =>
        !phpAnimals.some(
          p => p.name?.toLowerCase() === sb.name?.toLowerCase() &&
               p.type?.toLowerCase() === sb.type?.toLowerCase()
        )
      );
      const merged = [...phpAnimals, ...dedupedSb];
      // Keep only Available, up to 8 for the homepage
      setAnimals(merged.filter(a => a.status === "Available").slice(0, 8));
      setLoading(false);
    });

    // Adopted count (Spring Boot only — for the stat badge)
    fetch(`${API_BASE}/api/animals?status=Adopted&limit=1`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const n = Array.isArray(data) ? data.length : (data.totalElements ?? null);
        setAdopted(n);
      })
      .catch(() => {});
  }, []);

  const heroPets     = animals.slice(0, 3);
  const featuredPets = animals.slice(0, 4);

  const stats = [
    adopted !== null   && { val: adopted,        suffix: "+", label: "Animals Adopted"   },
    animals.length > 0 && { val: animals.length,  suffix: "",  label: "Available Now"     },
    { val: "4",    suffix: "",  label: "Ilocos Provinces" },
    { val: "Free", suffix: "",  label: "To Apply"          },
  ].filter(Boolean);

  return (
    <div className="relative overflow-x-hidden" style={{ fontFamily: "'Nunito', sans-serif", color: "#1a2e0a" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fl1        { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(7%,12%) scale(1.09)} 66%{transform:translate(-5%,5%) scale(0.93)} }
        @keyframes fl2        { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10%,8%) scale(0.93)} 70%{transform:translate(5%,-9%) scale(1.1)} }
        @keyframes fl3        { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(9%,-7%) scale(1.07)} }
        @keyframes fl4        { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-9%,-9%) scale(1.11)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes dotPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.5)} 50%{box-shadow:0 0 0 7px rgba(90,170,48,0)} }
        @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer    { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes cardFloat  { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-10px) rotate(.3deg)} 75%{transform:translateY(-5px) rotate(-.2deg)} }
        @keyframes tickerMove { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulseLine  { 0%,100%{opacity:.3} 50%{opacity:.75} }

        .em-orange { font-style:italic; color:#e07820; }
        .em-rust   { font-style:italic; color:#B45A22; }

        ::-webkit-scrollbar       { width:6px; }
        ::-webkit-scrollbar-track { background:#eddabb; }
        ::-webkit-scrollbar-thumb { background:#b4903a; border-radius:3px; }
      `}</style>

      {/* MESH BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
        {[
          { width: "1000px", height: "1000px", top: "-25%",    left: "-18%",  background: "radial-gradient(circle,#588B41,transparent 70%)", animation: "fl1 9s ease-in-out infinite" },
          { width: "900px",  height: "900px",  top: "8%",      right: "-20%", background: "radial-gradient(circle,#B45A22,transparent 70%)", animation: "fl2 11s ease-in-out infinite" },
          { width: "800px",  height: "800px",  bottom: "-18%", left: "18%",   background: "radial-gradient(circle,#e8dfc8,transparent 60%)", animation: "fl3 8s ease-in-out infinite" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", borderRadius: "50%", filter: "blur(120px)", mixBlendMode: "multiply", opacity: 0.48, ...s }} />
        ))}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,70,30,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.03) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      

      {/* HERO */}
      <section className="relative z-10 flex items-center flex-wrap gap-14 px-10 py-[5rem] max-w-[1440px] mx-auto min-h-[calc(100vh-70px)]">
        <div className="flex-1 min-w-[300px]">
          <div
            className="inline-flex items-center gap-2 rounded-[50px] px-[16px] py-[7px] text-[0.70rem] font-extrabold uppercase tracking-[.12em] italic mb-[20px] border"
            style={{ background:"rgba(28,79,9,0.09)", borderColor:"rgba(90,170,48,0.32)", color:"#1c4f09", animation:"fadeUp .65s ease both" }}
          >
            <span className="w-[7px] h-[7px] rounded-full" style={{ background:"#5aaa30", animation:"dotPulse 2s ease infinite" }} />
            Ilocos Region's Pet Adoption Platform
          </div>

          <h1
            className="font-black leading-[.92] tracking-[-1.5px] mb-0"
            style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(3.2rem,6.5vw,6rem)", color:"#192e08", animation:"fadeUp .65s ease .1s both", textShadow:"0 4px 32px rgba(255,255,255,0.35)" }}
          >
            Find Your <em className="em-orange">Forever</em>
            <span className="block">Companion.</span>
          </h1>

          <p
            className="font-semibold leading-[1.75] mt-[22px] max-w-[500px] text-[1.05rem]"
            style={{ color:"#3a5020", animation:"fadeUp .65s ease .2s both" }}
          >
            Pawster connects loving homes with animals in need across the Ilocos Region.
            Browse adoptable pets, submit applications, and give a life a second chance.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-[32px]" style={{ animation:"fadeUp .65s ease .3s both" }}>
            <Link
              to="/pets"
              className="inline-flex items-center gap-2 px-8 py-[14px] rounded-[14px] font-black text-[0.94rem] text-white no-underline transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ background:"#1c4f09", boxShadow:"0 6px 28px rgba(28,79,9,0.38), inset 0 1px 0 rgba(255,255,255,.12)" }}
            >
              <i className="fas fa-search" /> Browse Animals
            </Link>
            {loggedIn ? (
              <Link to="/profile"
                className="inline-flex items-center gap-2 px-7 py-[14px] rounded-[14px] font-bold text-[0.94rem] no-underline transition-all duration-200 border hover:border-[rgba(90,170,48,.5)] active:scale-95"
                style={{ background:"rgba(255,250,232,0.70)", color:"#2e4a10", borderColor:"rgba(180,140,60,0.30)", backdropFilter:"blur(8px)" }}>
                <i className="fas fa-th-large" /> My Dashboard
              </Link>
            ) : (
              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-[14px] rounded-[14px] font-bold text-[0.94rem] no-underline transition-all duration-200 border hover:border-[rgba(90,170,48,.5)] active:scale-95"
                style={{ background:"rgba(255,250,232,0.70)", color:"#2e4a10", borderColor:"rgba(180,140,60,0.30)", backdropFilter:"blur(8px)" }}>
                <i className="fas fa-user-plus" /> Create Account
              </Link>
            )}
          </div>

          {!loading && stats.length > 0 && (
            <div className="flex items-stretch gap-0 mt-[44px]" style={{ animation:"fadeUp .65s ease .45s both" }}>
              {stats.map(({ val, suffix, label }, i) => (
                <div key={label} className="flex items-center gap-0">
                  {i > 0 && <div className="mx-[22px] w-px self-stretch" style={{ background:"rgba(180,140,60,0.28)" }} />}
                  <div>
                    <div className="font-black leading-none"
                      style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.1rem", color:"#192e08" }}>
                      {val}{suffix && <em className="em-orange">{suffix}</em>}
                    </div>
                    <div className="text-[0.70rem] font-bold uppercase tracking-[.07em] mt-[4px]" style={{ color:"#7a8a5a" }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-6 mt-[44px]" style={{ animation:"fadeUp .65s ease .45s both" }}>
              {[80, 60, 72].map((w, i) => <Skel key={i} h={44} w={w} />)}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 w-full sm:w-[400px]" style={{ animation:"fadeIn .9s ease .2s both" }}>
          <HeroPetCard pets={heroPets} loading={loading} />
        </div>
      </section>

      {/* ANIMAL TICKER */}
      {!loading && animals.length > 0 && (
        <div className="relative z-10 py-[10px] overflow-hidden border-t border-b"
          style={{ background:"rgba(255,248,215,0.55)", backdropFilter:"blur(10px)", borderColor:"rgba(180,140,60,0.30)" }}>
          <div className="flex" style={{ animation:"tickerMove 28s linear infinite", width:"max-content" }}>
            {[...animals, ...animals].map((a, i) => (
              <div key={i} className="flex items-center gap-[6px] mx-[22px] text-[0.70rem] font-extrabold uppercase tracking-[.08em] whitespace-nowrap"
                style={{ color:"#4a6a20" }}>
                <span style={{ fontSize:"1rem" }}>{TYPE_EMOJI[a.type] ?? "🐾"}</span>
                {a.name}
                <span style={{ color:"rgba(180,140,60,.5)", marginLeft:"4px" }}>·</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 max-w-[1240px] mx-auto px-10 py-[6rem]">
        <Reveal><Pill icon="fas fa-list-ol">Simple Process</Pill></Reveal>
        <Reveal delay={80}>
          <h2 className="font-black leading-tight mb-4"
            style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.1rem,3.8vw,3.2rem)", color:"#192e08" }}>
            How <em className="em-orange">Adoption</em> Works
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="font-semibold leading-[1.75] text-[0.95rem] max-w-[480px] mb-[52px]" style={{ color:"#4a6030" }}>
            Three straightforward steps to bring a new companion home.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step num="01" icon="fas fa-search"   delay={80}  iconBg="rgba(28,79,9,0.12)"    iconColor="#1c4f09" title="Browse & Choose"   desc="Explore listings of dogs, cats, and small animals available across the Ilocos Region. Filter by type, age, and location to find the right match." />
          <Step num="02" icon="fas fa-file-alt" delay={160} iconBg="rgba(180,90,34,0.12)"  iconColor="#B45A22" title="Submit Application" desc="Fill out a short adoption form online. Our team reviews every application carefully and responds within 2–3 business days." />
          <Step num="03" icon="fas fa-heart"    delay={240} iconBg="rgba(212,136,10,0.13)" iconColor="#c07808" title="Welcome Home"       desc="Once approved, coordinate your meet & greet. We follow up at 7 and 30 days to make sure both you and your companion are thriving." />
        </div>
        <Reveal className="mt-[36px] text-center">
          <Link to="/how-it-works"
            className="inline-flex items-center gap-2 px-7 py-[13px] rounded-[13px] font-bold text-[0.92rem] no-underline transition-all duration-200 border hover:border-[rgba(90,170,48,.45)] active:scale-95"
            style={{ background:"rgba(255,250,232,0.72)", color:"#2e4a10", borderColor:"rgba(180,140,60,0.28)", backdropFilter:"blur(8px)" }}>
            <i className="fas fa-arrow-right" /> Full Process Details
          </Link>
        </Reveal>
      </section>

      {/* STATS BAND */}
      {!loading && stats.length > 0 && (
        <div className="relative z-10 border-t border-b py-[52px] px-10"
          style={{ background:"rgba(255,248,216,0.62)", backdropFilter:"blur(16px)", borderColor:"rgba(90,170,48,0.38)" }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[20, 50, 80].map(p => (
              <div key={p} className="absolute h-full w-px"
                style={{ left:`${p}%`, background:"rgba(90,170,48,0.06)", animation:`pulseLine ${2 + p / 30}s ease-in-out infinite` }} />
            ))}
          </div>
          <div className="relative max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ val, suffix, label }, i) => (
              <Reveal key={label} delay={i * 90}>
                <div className="font-black leading-none"
                  style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.4rem,4vw,3.2rem)", color:"#192e08" }}>
                  {val}{suffix && <em className="em-orange">{suffix}</em>}
                </div>
                <div className="text-[0.76rem] font-bold uppercase tracking-[.08em] mt-[8px]" style={{ color:"#7a8a5a" }}>{label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* MISSING PETS BAND */}
      <div className="relative z-10 px-10 py-[18px] border-t border-b"
        style={{ background:"linear-gradient(135deg,rgba(180,90,34,0.10),rgba(212,136,10,0.07))", borderColor:"rgba(180,90,34,0.22)" }}>
        <div className="max-w-[1100px] mx-auto flex items-center gap-5 flex-wrap">
          <span className="text-[1.9rem] flex-shrink-0" style={{ animation:"floatY 4s ease-in-out infinite" }}>🔍</span>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[0.94rem] font-black" style={{ color:"#192e08" }}>Lost or Found a Pet in the Ilocos Region?</div>
            <div className="text-[0.79rem] font-semibold mt-[2px]" style={{ color:"#7a8a5a" }}>Our community-powered board helps reunite animals with their families.</div>
          </div>
          <Link to="/missing-pets"
            className="inline-flex items-center gap-[6px] px-5 py-[9px] rounded-[10px] font-extrabold text-[0.82rem] text-white no-underline transition-all duration-200 flex-shrink-0 whitespace-nowrap hover:brightness-110 active:scale-95"
            style={{ background:"#B45A22", boxShadow:"0 4px 16px rgba(180,90,34,0.30)" }}>
            <i className="fas fa-search-location" /> View Missing Pets Board
          </Link>
        </div>
      </div>

      {/* FEATURED PETS */}
      <section id="pets" className="relative z-10 max-w-[1240px] mx-auto px-10 py-[6rem]">
        <Reveal><Pill icon="fas fa-paw">Looking for Homes</Pill></Reveal>
        <Reveal delay={80}>
          <h2 className="font-black leading-tight mb-4"
            style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.1rem,3.8vw,3.2rem)", color:"#192e08" }}>
            <em className="em-orange">Featured</em> Animals
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="font-semibold leading-[1.75] text-[0.95rem] max-w-[480px] mb-[44px]" style={{ color:"#4a6030" }}>
            These wonderful animals are ready to meet you — hover any card to learn more.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <FeaturedSkel key={i} />)
            : featuredPets.length > 0
              ? featuredPets.map((a, i) => <FeaturedCard key={`${a._source}-${a.id}`} animal={a} delay={i * 70} />)
              : (
                <div className="col-span-full py-[5rem] text-center rounded-[20px] border"
                  style={{ borderColor:"rgba(180,140,60,0.22)", background:"rgba(255,249,228,0.70)" }}>
                  <span className="text-[3.5rem] block mb-3" style={{ opacity:.25 }}>🐾</span>
                  <p className="font-bold text-[0.95rem]" style={{ color:"#7a8a5a" }}>No animals available right now — check back soon.</p>
                </div>
              )
          }
        </div>
        <Reveal className="mt-[40px] text-center">
          <Link to="/pets"
            className="inline-flex items-center gap-2 px-7 py-[13px] rounded-[13px] font-bold text-[0.92rem] no-underline transition-all duration-200 border hover:border-[rgba(90,170,48,.45)] active:scale-95"
            style={{ background:"rgba(255,250,232,0.72)", color:"#2e4a10", borderColor:"rgba(180,140,60,0.28)", backdropFilter:"blur(8px)" }}>
            <i className="fas fa-search" /> Browse All Animals
          </Link>
        </Reveal>
      </section>

      {/* REHOME BANNER */}
      <div className="relative z-10 max-w-[1240px] mx-auto px-10 pb-[5rem]">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border flex items-center gap-14 flex-wrap"
            style={{
              background:"linear-gradient(135deg,rgba(180,90,34,0.09),rgba(212,136,10,0.07))",
              borderColor:"rgba(180,90,34,0.26)",
              boxShadow:"0 10px 50px rgba(180,90,34,0.13)",
              padding:"clamp(2rem,5vw,4rem)",
            }}>
            <div className="absolute top-[-60px] right-[-60px] w-[240px] h-[240px] rounded-full pointer-events-none"
              style={{ background:"radial-gradient(circle,rgba(180,90,34,.12),transparent 70%)" }} />
            <div className="absolute bottom-[-40px] left-[-40px] w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{ background:"radial-gradient(circle,rgba(212,136,10,.10),transparent 70%)" }} />
            <span className="text-[5.5rem] flex-shrink-0 relative z-10" style={{ animation:"floatY 5s ease-in-out infinite" }}>🏡</span>
            <div className="flex-1 relative z-10">
              <h2 className="font-black leading-tight mb-[14px]"
                style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.8rem,3.2vw,2.6rem)", color:"#192e08" }}>
                Need to <em className="em-rust">Rehome</em> Your Pet?
              </h2>
              <p className="font-semibold text-[0.95rem] leading-[1.75] max-w-[520px] mb-[24px]" style={{ color:"#4a6030" }}>
                Life circumstances change. If you're unable to care for your pet, Pawster can help find them a safe, loving new home — with care and discretion.
              </p>
              <Link to="/rehome"
                className="inline-flex items-center gap-2 px-7 py-[12px] rounded-[12px] font-black text-[0.90rem] text-white no-underline transition-all duration-200 hover:brightness-110 active:scale-95"
                style={{ background:"#B45A22", boxShadow:"0 6px 24px rgba(180,90,34,0.34)" }}>
                <i className="fas fa-home" /> Rehome a Pet
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* CTA */}
      <section className="relative z-10 px-10 py-[6rem]">
        <Reveal>
          <div className="max-w-[820px] mx-auto relative overflow-hidden rounded-[32px] border text-center"
            style={{
              background:"linear-gradient(135deg,rgba(28,79,9,0.11),rgba(90,170,48,0.07))",
              borderColor:"rgba(90,170,48,0.38)",
              boxShadow:"0 16px 64px rgba(28,79,9,0.16)",
              padding:"clamp(2.5rem,6vw,5rem)",
            }}>
            <div className="absolute bottom-[-2rem] right-[2rem] text-[10rem] pointer-events-none select-none"
              style={{ opacity:.035, transform:"rotate(-15deg)" }}>🐾</div>
            <div className="absolute top-[-1.5rem] left-[1.5rem] text-[7rem] pointer-events-none select-none"
              style={{ opacity:.025, transform:"rotate(20deg)" }}>🐾</div>

            <div className="inline-flex items-center gap-[6px] rounded-[50px] px-[14px] py-[6px] text-[0.67rem] font-extrabold uppercase tracking-[.1em] italic mb-[18px] border"
              style={{ background:"rgba(28,79,9,0.08)", borderColor:"rgba(90,170,48,0.28)", color:"#1c4f09" }}>
              🐾 Ready to Begin?
            </div>
            <h2 className="font-black leading-tight mb-[14px]"
              style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,4.2vw,3.4rem)", color:"#192e08" }}>
              Give a Pet a <em className="em-orange">Second Chance</em>
            </h2>
            <p className="font-semibold text-[0.95rem] leading-[1.75] mb-[36px] max-w-[560px] mx-auto" style={{ color:"#4a6030" }}>
              Join families across the Ilocos Region who have opened their hearts and homes to a pet in need.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {loggedIn ? (
                <Link to="/profile"
                  className="inline-flex items-center gap-2 px-8 py-[14px] rounded-[14px] font-black text-[0.94rem] text-white no-underline hover:brightness-110 active:scale-95 transition-all"
                  style={{ background:"#1c4f09", boxShadow:"0 6px 28px rgba(28,79,9,0.38)" }}>
                  <i className="fas fa-th-large" /> Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register"
                    className="inline-flex items-center gap-2 px-8 py-[14px] rounded-[14px] font-black text-[0.94rem] text-white no-underline hover:brightness-110 active:scale-95 transition-all"
                    style={{ background:"#1c4f09", boxShadow:"0 6px 28px rgba(28,79,9,0.38)" }}>
                    <i className="fas fa-paw" /> Create Free Account
                  </Link>
                  <Link to="/login"
                    className="inline-flex items-center gap-2 px-7 py-[14px] rounded-[14px] font-bold text-[0.94rem] no-underline border hover:border-[rgba(90,170,48,.45)] active:scale-95 transition-all"
                    style={{ background:"rgba(255,250,232,0.72)", color:"#2e4a10", borderColor:"rgba(180,140,60,0.30)" }}>
                    <i className="fas fa-sign-in-alt" /> Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <div className="mb-2">
              <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
            </div>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">
              Paw<em className="italic text-[#e07820]">ster</em>
            </div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
              Screening, placing, and supporting animal adoptions across the Ilocos Region with care and accountability.
            </p>
          </div>
          {[
            { title: "Adopt",    links: [["Browse Animals", "/pets"], ["My Profile", "/profile"], ["Log In", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How It Works", "/how-it-works"], ["Rehome a Pet", "/rehome"], ["Missing Pets", "/missing-pets"], ["About Us", "/about"]] },
            { title: "Regions",  links: [["Ilocos Norte", "/pets"], ["Ilocos Sur", "/pets"], ["La Union", "/pets"], ["Pangasinan", "/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline">{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f", "fab fa-instagram", "fab fa-twitter"].map(icon => (
              <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition">
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}