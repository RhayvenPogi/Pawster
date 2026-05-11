import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../images/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";
function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}

function RevealSection({ children, delay = 0, style = {} }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

const STATS = [
  { val: "500+", label: "Animals Rehomed"    },
  { val: "CAR",  label: "Region Served"      },
  { val: "Free", label: "To Apply"           },
  { val: "48h",  label: "Response Time"      },
];

const FEATURES = [
  { icon: "🐾", bg: "rgba(28,79,9,0.12)",    color: "#1c4f09", title: "Find Your Match",  desc: "Browse dogs, cats, birds & rabbits from verified rescue coordinators across Baguio City and the Cordillera Administrative Region." },
  { icon: "🏠", bg: "rgba(180,90,34,0.12)",  color: "#B45A22", title: "Local Coordinators", desc: "Every rescue coordinator on Pawster is verified and committed to responsible animal welfare practices in the City of Pines." },
  { icon: "✅", bg: "rgba(26,95,191,0.12)",  color: "#1a5fbf", title: "Safe & Screened",  desc: "Identity-verified adopters only. Every application goes through a thorough questionnaire before being reviewed." },
  { icon: "📋", bg: "rgba(176,128,16,0.12)", color: "#b08010", title: "Follow-Up Care",   desc: "Structured check-ins at 7, 30, and 90 days after adoption to make sure your new companion is truly thriving." },
  { icon: "🔍", bg: "rgba(138,58,138,0.12)", color: "#8a3a8a", title: "Missing Pets",     desc: "Community board reuniting lost animals with families across Baguio City and the broader Cordillera region." },
  { icon: "🏡", bg: "rgba(180,90,34,0.12)",  color: "#B45A22", title: "Rehome a Pet",    desc: "Can't keep your pet? We help find them a loving new home locally — with care and discretion." },
];

const STEPS = [
  { num: "01", icon: "fa-search",   bg: "rgba(28,79,9,0.12)",    color: "#1c4f09", title: "Browse & Choose",    desc: "Explore available animals filtered by type, age, and location across Baguio City and CAR." },
  { num: "02", icon: "fa-file-alt", bg: "rgba(180,90,34,0.12)",  color: "#B45A22", title: "Apply Online",        desc: "Fill out our adoption questionnaire. Rescue coordinators review and respond within 2–3 business days." },
  { num: "03", icon: "fa-heart",    bg: "rgba(212,136,10,0.13)", color: "#c07808", title: "Welcome Home",        desc: "Meet your new companion and receive post-adoption support at 7, 30, and 90 days." },
];

const TESTIMONIALS = [
  { quote: "Pawster made the whole adoption process so smooth. Nag-adopt ako ng dog na si Coco at napakaganda ng experience dito sa Baguio!", name: "Maria Santos", loc: "Baguio City, Benguet", emoji: "🐕" },
  { quote: "Hindi ko inakala na ganito kadali mag-adopt. Ang team ay very responsive at caring talaga sa animals sa Cordillera.", name: "Juan dela Cruz", loc: "La Trinidad, Benguet", emoji: "🐈" },
  { quote: "Salamat Pawster! Si Mochi ay very happy na sa aming tahanan. The follow-up check-ins showed they really care about the animals.", name: "Ana Reyes", loc: "Baguio City, CAR", emoji: "🐇" },
];

const VIDEO_ID = "6P9GGITcRsQ";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [vis,      setVis]      = useState(false);

  usePageTitle('Landing Page');

  useEffect(() => {
    setTimeout(() => setVis(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#EDDABB", fontFamily: "'Nunito',sans-serif", color: "#1a2e0a", overflowX: "hidden" }}>

      {/* ── STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fl1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(7%,12%) scale(1.09)} 66%{transform:translate(-5%,5%) scale(0.93)} }
        @keyframes fl2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-10%,8%) scale(0.93)} 70%{transform:translate(5%,-9%) scale(1.1)} }
        @keyframes fl3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(9%,-7%) scale(1.07)} }
        @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.5)} 50%{box-shadow:0 0 0 8px rgba(90,170,48,0)} }
        @keyframes tickerMove { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes playPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.5)} 50%{box-shadow:0 0 0 18px rgba(255,255,255,0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmerMove { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }

        .em-orange { font-style:italic; color:#e07820; }
        .em-rust   { font-style:italic; color:#B45A22; }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#eddabb; }
        ::-webkit-scrollbar-thumb { background:#b4903a; border-radius:3px; }

        .feat-card {
          transition: transform 0.32s cubic-bezier(.22,.68,0,1.2), box-shadow 0.32s, border-color 0.32s;
          cursor: default;
        }
        .feat-card:hover {
          transform: translateY(-10px) scale(1.015);
          box-shadow: 0 20px 60px rgba(90,60,10,0.20) !important;
          border-color: rgba(90,170,55,0.48) !important;
        }
        .feat-card:hover .feat-icon { transform: scale(1.18) rotate(-5deg); }
        .feat-icon { transition: transform 0.38s cubic-bezier(.22,.68,0,1.4); display:flex; align-items:center; justify-content:center; }

        .cta-primary {
          transition: filter 0.2s, transform 0.15s, box-shadow 0.2s;
          display: inline-flex; align-items: center; gap: 0.5rem;
          text-decoration: none;
        }
        .cta-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .cta-primary:active { transform: scale(0.97); }

        .cta-outline {
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
          display: inline-flex; align-items: center; gap: 0.5rem;
          text-decoration: none;
        }
        .cta-outline:hover { background: rgba(28,79,9,0.09) !important; border-color: rgba(90,170,48,0.55) !important; transform: translateY(-2px); }
        .cta-outline:active { transform: scale(0.97); }

        .nav-link { transition: color 0.18s; text-decoration: none; }
        .nav-link:hover { color: #1c4f09 !important; }

        .play-btn {
          transition: transform 0.2s, box-shadow 0.2s;
          animation: playPulse 2.5s ease-in-out infinite;
        }
        .play-btn:hover { transform: scale(1.1); }

        .testi-card { transition: transform 0.28s, box-shadow 0.28s; }
        .testi-card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(90,60,10,0.18) !important; }

        .stat-card { transition: transform 0.28s; }
        .stat-card:hover { transform: translateY(-4px); }

        .video-card {
          transition: transform 0.32s cubic-bezier(.22,.68,0,1.2), box-shadow 0.32s;
          cursor: pointer;
        }
        .video-card:hover { transform: scale(1.012); box-shadow: 0 32px 90px rgba(40,20,5,0.28) !important; }
      `}</style>

      {/* ── MESH BACKGROUND ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
        {[
          { width:"1100px", height:"1100px", top:"-25%",    left:"-18%",  background:"radial-gradient(circle,#588B41,transparent 70%)", animation:"fl1 9s ease-in-out infinite" },
          { width:"950px",  height:"950px",  top:"5%",      right:"-22%", background:"radial-gradient(circle,#B45A22,transparent 70%)", animation:"fl2 12s ease-in-out infinite" },
          { width:"850px",  height:"850px",  bottom:"-20%", left:"15%",   background:"radial-gradient(circle,#e8dfc8,transparent 60%)", animation:"fl3 8s ease-in-out infinite" },
        ].map((s, i) => (
          <div key={i} style={{ position:"absolute", borderRadius:"50%", filter:"blur(130px)", mixBlendMode:"multiply", opacity:0.46, ...s }} />
        ))}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(100,70,30,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.028) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(120,75,20,0.10) 100%)" }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:"fixed", top:0, width:"100%", zIndex:200,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"0 clamp(1.25rem,5vw,3.5rem)",
        height:68,
        background: scrolled ? "rgba(237,218,187,0.92)" : "rgba(237,218,187,0.50)",
        backdropFilter:"blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(180,140,60,0.38)" : "1px solid rgba(180,140,60,0.14)",
        transition:"background 0.35s, border-color 0.35s",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.55rem" }}>
          <img src={logo} alt="Pawster" style={{ width:38, height:38, objectFit:"cover", borderRadius:"50%" }} onError={e => e.target.style.display="none"} />
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.22rem", color:"#192e08", letterSpacing:"-0.3px" }}>
            Paw<em className="em-orange">ster</em>
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}>
          {[["How It Works","/how-it-works"],["Browse Pets","/pets"],["About","/about"]].map(([label, href]) => (
            <a key={label} href={href} className="nav-link"
              style={{ fontWeight:700, color:"#3a5020", fontSize:"0.88rem", padding:"0.4rem 0.75rem" }}>
              {label}
            </a>
          ))}
          <a href="/login" className="cta-outline"
            style={{ fontWeight:800, color:"#1c4f09", fontSize:"0.88rem", padding:"0.45rem 1rem", borderRadius:10, border:"1.5px solid rgba(28,79,9,0.22)", background:"rgba(28,79,9,0.05)", marginLeft:"0.4rem" }}>
            Sign In
          </a>
          <a href="/register" className="cta-primary"
            style={{ fontWeight:900, color:"#fff", background:"#1c4f09", fontSize:"0.88rem", padding:"0.45rem 1.2rem", borderRadius:10, boxShadow:"0 4px 16px rgba(28,79,9,0.30)", marginLeft:"0.2rem" }}>
            Register Free
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:"relative", zIndex:10, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"9rem 2rem 5rem" }}>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:"0.5rem",
          borderRadius:50, padding:"0.4rem 1.1rem",
          fontSize:"0.68rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.12em",
          marginBottom:"1.75rem",
          background:"rgba(28,79,9,0.09)", border:"1px solid rgba(90,170,48,0.32)", color:"#1c4f09",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)",
          transition:"opacity 0.6s ease, transform 0.6s ease",
        }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#5aaa30", flexShrink:0, animation:"dotPulse 2s ease infinite" }} />
          Baguio City &amp; Cordillera's Pet Adoption Platform
        </div>

        <h1 style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:"clamp(3.6rem,8vw,7.5rem)",
          fontWeight:900, lineHeight:0.90, letterSpacing:"-3px",
          color:"#192e08",
          textShadow:"0 6px 40px rgba(255,255,255,0.30)",
          marginBottom:"1.75rem",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
          transition:"opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
        }}>
          Every Pet<br/>Deserves <em className="em-orange">Love.</em>
        </h1>

        <p style={{
          fontWeight:600, lineHeight:1.8, fontSize:"clamp(1rem,1.7vw,1.18rem)",
          color:"#3a5020", maxWidth:540, marginBottom:"2.75rem",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
          transition:"opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
        }}>
          Pawster connects loving homes with rescued animals across Baguio City and the Cordillera Administrative Region.
          Browse, apply, and give a deserving animal a second chance at life.
        </p>

        <div style={{
          display:"flex", gap:"1rem", flexWrap:"wrap", justifyContent:"center", marginBottom:"4rem",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
          transition:"opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
        }}>
          <a href="/register" className="cta-primary"
            style={{ fontWeight:900, fontSize:"1.05rem", color:"#fff", background:"#1c4f09", padding:"1rem 2.5rem", borderRadius:14, boxShadow:"0 8px 32px rgba(28,79,9,0.40), inset 0 1px 0 rgba(255,255,255,.14)" }}>
            <i className="fas fa-paw" /> Create Free Account
          </a>
          <a href="/pets" className="cta-outline"
            style={{ fontWeight:800, fontSize:"1.05rem", color:"#2e4a10", background:"rgba(255,250,232,0.75)", padding:"1rem 2.25rem", borderRadius:14, border:"1.5px solid rgba(180,140,60,0.32)", backdropFilter:"blur(8px)" }}>
            <i className="fas fa-search" /> Browse Animals
          </a>
        </div>

        <div style={{
          display:"flex", gap:"1.5rem", flexWrap:"wrap", justifyContent:"center",
          opacity: vis ? 1 : 0, transition:"opacity 0.7s ease 0.48s",
        }}>
          {[
            { icon:"fa-shield-alt",       label:"Identity-Verified Adopters" },
            { icon:"fa-map-marker-alt",   label:"Baguio City & CAR"          },
            { icon:"fa-check-circle",     label:"Free to Apply"              },
            { icon:"fa-clock",            label:"48h Response Time"          },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.78rem", fontWeight:700, color:"#6a8a50" }}>
              <i className={`fas ${icon}`} style={{ color:"#5aaa30", fontSize:"0.7rem" }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ position:"absolute", bottom:"2.5rem", left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem", opacity:0.45, animation:"floatY 2.5s ease-in-out infinite" }}>
          <div style={{ width:1.5, height:32, background:"#1c4f09", borderRadius:2 }} />
          <i className="fas fa-chevron-down" style={{ color:"#1c4f09", fontSize:"0.7rem" }} />
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ position:"relative", zIndex:10, overflow:"hidden", borderTop:"1px solid rgba(180,140,60,0.28)", borderBottom:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,215,0.58)", backdropFilter:"blur(10px)", padding:"9px 0" }}>
        <div style={{ display:"flex", animation:"tickerMove 28s linear infinite", width:"max-content" }}>
          {[...Array(2)].map((_, gi) =>
            ["Find Your Match 🐕","Verified Coordinators 🐈","Responsible Screening ✅","7, 30 & 90-Day Follow-Ups 🐾","Free to Apply 🏠","Baguio City & CAR 🌿","Every Pet Deserves Love 🐇","Identity Verified 🛡️"].map((item, i) => (
              <span key={`${gi}-${i}`} style={{ display:"inline-flex", alignItems:"center", margin:"0 2.25rem", fontSize:"0.68rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.09em", color:"#4a6a20", whiteSpace:"nowrap" }}>
                {item}
                <span style={{ color:"rgba(180,140,60,.4)", marginLeft:"0.6rem" }}>·</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── STATS BAND ── */}
      <RevealSection style={{ position:"relative", zIndex:10 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"4.5rem 2rem", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"1.5rem" }}>
          {STATS.map(({ val, label }) => (
            <div key={label} className="stat-card"
              style={{ borderRadius:20, padding:"1.75rem 1.5rem", textAlign:"center", background:"rgba(255,249,228,0.80)", border:"1px solid rgba(180,140,60,0.26)", boxShadow:"0 4px 24px rgba(100,70,20,0.10)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(2.2rem,4vw,3rem)", color:"#192e08", lineHeight:1, marginBottom:"0.4rem" }}>
                {val.includes("+") ? <>{val.replace("+","")}<em className="em-orange">+</em></> : <em className="em-orange">{val}</em>}
              </div>
              <div style={{ fontSize:"0.75rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#7a8a5a" }}>{label}</div>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ── VIDEO SECTION ── */}
      <section style={{ position:"relative", zIndex:10, padding:"2rem 2rem 6rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          <RevealSection>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.3rem 0.9rem", fontSize:"0.67rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.875rem", background:"rgba(180,90,34,0.10)", border:"1px solid rgba(180,90,34,0.28)", color:"#B45A22" }}>
              <i className="fas fa-video" style={{ fontSize:"0.6rem" }} /> Animal Rescue in the Philippines
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(2rem,3.5vw,3rem)", color:"#192e08", marginBottom:"0.75rem", lineHeight:1.1 }}>
              See the <em className="em-orange">Impact</em> We Make
            </h2>
            <p style={{ fontWeight:600, color:"#4a6030", fontSize:"0.95rem", lineHeight:1.75, maxWidth:520, marginBottom:"2.5rem" }}>
              Watch how animal rescue organizations across the Philippines are giving strays a fighting chance — and how you can be part of the story right here in Baguio City and the Cordillera.
            </p>
          </RevealSection>

          <RevealSection delay={100}>
            <div
              className="video-card"
              style={{
                position:"relative",
                borderRadius:28,
                overflow:"hidden",
                border:"1px solid rgba(180,140,60,0.30)",
                boxShadow:"0 24px 80px rgba(40,20,5,0.22)",
                maxWidth:860,
                margin:"0 auto"
              }}
            >
              <div style={{ position:"relative", width:"100%", paddingBottom:"56.25%", background:"#000" }}>
                <iframe
                  src={`https://www.youtube.com/embed/JK9YjOTUaGc?autoplay=1&mute=1&controls=1&loop=1&playlist=JK9YjOTUaGc`}
                  title="Philippine Animal Rescue"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                />
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={150}>
            <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", justifyContent:"center", marginTop:"1.75rem" }}>
              {[
                { icon:"fa-dog",         label:"Thousands of strays rescued yearly"   },
                { icon:"fa-hands-heart", label:"Community-driven adoption drives"      },
                { icon:"fa-map-pin",     label:"Locally rooted in Baguio City & CAR"  },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.82rem", fontWeight:700, color:"#5a7a40", padding:"0.5rem 1rem", borderRadius:50, background:"rgba(255,249,228,0.70)", border:"1px solid rgba(180,140,60,0.24)" }}>
                  <i className={`fas ${icon}`} style={{ color:"#1c4f09", fontSize:"0.78rem" }} /> {label}
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position:"relative", zIndex:10, maxWidth:1240, margin:"0 auto", padding:"2rem 2rem 6rem" }}>
        <RevealSection>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.3rem 0.9rem", fontSize:"0.67rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.875rem", background:"rgba(28,79,9,0.08)", border:"1px solid rgba(90,170,48,0.28)", color:"#1c4f09" }}>
            <i className="fas fa-star" style={{ fontSize:"0.58rem" }} /> Why Pawster
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(2rem,3.5vw,3rem)", color:"#192e08", marginBottom:"0.75rem", lineHeight:1.1 }}>
            Built for <em className="em-orange">Real Connections</em>
          </h2>
          <p style={{ fontWeight:600, color:"#4a6030", fontSize:"0.95rem", lineHeight:1.75, maxWidth:460, marginBottom:"3rem" }}>
            Everything you need to find, adopt, and care for your new companion — all in one place, right here in the City of Pines.
          </p>
        </RevealSection>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))", gap:"1.25rem" }}>
          {FEATURES.map(({ icon, bg, color, title, desc }, i) => (
            <RevealSection key={title} delay={i * 60}>
              <div className="feat-card" style={{ borderRadius:22, padding:"2rem", height:"100%", background:"rgba(255,249,228,0.82)", border:"1px solid rgba(180,140,60,0.26)", boxShadow:"0 4px 28px rgba(100,70,20,0.11)" }}>
                <div className="feat-icon" style={{ width:56, height:56, borderRadius:16, fontSize:"1.6rem", marginBottom:"1.2rem", background:bg }}>
                  {icon}
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.06rem", color:"#192e08", marginBottom:"0.5rem" }}>{title}</div>
                <p style={{ fontWeight:600, color:"#7a8a5a", fontSize:"0.84rem", lineHeight:1.7, margin:0 }}>{desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position:"relative", zIndex:10, padding:"2rem 2rem 6rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <RevealSection>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.3rem 0.9rem", fontSize:"0.67rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.875rem", background:"rgba(28,79,9,0.08)", border:"1px solid rgba(90,170,48,0.28)", color:"#1c4f09" }}>
              <i className="fas fa-list-ol" style={{ fontSize:"0.58rem" }} /> Simple Process
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(2rem,3.5vw,3rem)", color:"#192e08", marginBottom:"0.75rem", lineHeight:1.1 }}>
              How <em className="em-orange">Adoption</em> Works
            </h2>
            <p style={{ fontWeight:600, color:"#4a6030", fontSize:"0.95rem", maxWidth:420, marginBottom:"3rem", lineHeight:1.75 }}>
              Three simple steps to bring a new companion home in Baguio City or CAR.
            </p>
          </RevealSection>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1.5rem" }}>
            {STEPS.map(({ num, icon, bg, color, title, desc }, i) => (
              <RevealSection key={num} delay={i * 80}>
                <div className="feat-card" style={{ position:"relative", borderRadius:22, padding:"2.25rem", height:"100%", background:"rgba(255,249,228,0.82)", border:"1px solid rgba(180,140,60,0.26)", boxShadow:"0 4px 28px rgba(100,70,20,0.11)", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:16, right:20, fontFamily:"'Playfair Display',serif", fontSize:"4.5rem", fontWeight:900, color:"rgba(28,79,9,0.055)", lineHeight:1, pointerEvents:"none", userSelect:"none" }}>{num}</div>
                  <div className="feat-icon" style={{ width:56, height:56, borderRadius:16, fontSize:"1.4rem", marginBottom:"1.2rem", background:bg, color }}>
                    <i className={`fas ${icon}`} />
                  </div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.06rem", color:"#192e08", marginBottom:"0.5rem" }}>{title}</div>
                  <p style={{ fontWeight:600, color:"#7a8a5a", fontSize:"0.84rem", lineHeight:1.7, margin:0 }}>{desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position:"relative", zIndex:10, padding:"2rem 2rem 6rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <RevealSection>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.3rem 0.9rem", fontSize:"0.67rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.875rem", background:"rgba(180,90,34,0.10)", border:"1px solid rgba(180,90,34,0.26)", color:"#B45A22" }}>
              <i className="fas fa-quote-left" style={{ fontSize:"0.58rem" }} /> Adopter Stories
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(2rem,3.5vw,3rem)", color:"#192e08", marginBottom:"3rem", lineHeight:1.1 }}>
              Happy <em style={{ fontStyle:"italic", color:"#B45A22" }}>Families</em>
            </h2>
          </RevealSection>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1.25rem" }}>
            {TESTIMONIALS.map(({ quote, name, loc, emoji }, i) => (
              <RevealSection key={name} delay={i * 80}>
                <div className="testi-card"
                  style={{ borderRadius:22, padding:"2rem", height:"100%", background:"rgba(255,249,228,0.82)", border:"1px solid rgba(180,140,60,0.26)", boxShadow:"0 4px 24px rgba(100,70,20,0.10)", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
                  <div style={{ fontSize:"2.5rem", lineHeight:1, color:"rgba(28,79,9,0.15)", fontFamily:"Georgia,serif", fontWeight:900 }}>"</div>
                  <p style={{ fontWeight:700, color:"#3a5020", fontSize:"0.90rem", lineHeight:1.72, flex:1, margin:0, fontStyle:"italic" }}>
                    {quote}
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", paddingTop:"0.75rem", borderTop:"1px solid rgba(180,140,60,0.20)" }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#1c4f09,#2a7010)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>
                      {emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight:900, fontSize:"0.88rem", color:"#192e08" }}>{name}</div>
                      <div style={{ fontSize:"0.72rem", fontWeight:700, color:"#7a8a5a" }}>{loc}</div>
                    </div>
                    <div style={{ marginLeft:"auto", color:"#e07820", fontSize:"0.78rem", letterSpacing:"1px" }}>★★★★★</div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSING PETS BAND ── */}
      <RevealSection style={{ position:"relative", zIndex:10, padding:"0 2rem 5rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", borderRadius:24, background:"linear-gradient(135deg,rgba(180,90,34,0.10),rgba(212,136,10,0.07))", border:"1px solid rgba(180,90,34,0.24)", padding:"2rem 2.5rem", display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap" }}>
          <span style={{ fontSize:"2.5rem", flexShrink:0, animation:"floatY 4s ease-in-out infinite" }}>🔍</span>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.1rem", color:"#192e08", marginBottom:"0.3rem" }}>Lost or Found a Pet in Baguio City or the Cordillera Region?</div>
            <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#7a8a5a" }}>Our community board helps reunite animals with their families across CAR.</div>
          </div>
          <a href="/missing-pets" className="cta-primary"
            style={{ fontWeight:900, fontSize:"0.88rem", color:"#fff", background:"#B45A22", padding:"0.75rem 1.5rem", borderRadius:12, boxShadow:"0 4px 18px rgba(180,90,34,0.30)", flexShrink:0, whiteSpace:"nowrap" }}>
            <i className="fas fa-search-location" /> Missing Pets Board
          </a>
        </div>
      </RevealSection>

      {/* ── CTA ── */}
      <section style={{ position:"relative", zIndex:10, padding:"0 2rem 6rem" }}>
        <RevealSection>
          <div style={{ maxWidth:860, margin:"0 auto", position:"relative", overflow:"hidden", borderRadius:32, border:"1px solid rgba(90,170,48,0.40)", background:"linear-gradient(135deg,rgba(28,79,9,0.12),rgba(90,170,48,0.07))", boxShadow:"0 20px 80px rgba(28,79,9,0.18)", padding:"clamp(3rem,7vw,5.5rem) 2rem", textAlign:"center" }}>
            <div style={{ position:"absolute", bottom:"-2rem", right:"2rem", fontSize:"11rem", opacity:0.032, transform:"rotate(-15deg)", pointerEvents:"none" }}>🐾</div>
            <div style={{ position:"absolute", top:"-1.5rem", left:"1.5rem", fontSize:"7.5rem", opacity:0.025, transform:"rotate(20deg)", pointerEvents:"none" }}>🐾</div>

            <div style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", borderRadius:50, padding:"0.3rem 0.9rem", fontSize:"0.67rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"1.25rem", background:"rgba(28,79,9,0.08)", border:"1px solid rgba(90,170,48,0.28)", color:"#1c4f09" }}>
              🐾 Ready to Begin?
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, lineHeight:1.05, fontSize:"clamp(2.2rem,4.5vw,3.6rem)", color:"#192e08", marginBottom:"1rem" }}>
              Give a Pet a <em className="em-orange">Second Chance</em>
            </h2>
            <p style={{ fontWeight:600, fontSize:"0.95rem", lineHeight:1.8, color:"#4a6030", maxWidth:520, margin:"0 auto 2.75rem" }}>
              Join families across Baguio City and the Cordillera Administrative Region who've opened their hearts and homes to animals in need.
            </p>
            <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
              <a href="/register" className="cta-primary"
                style={{ fontWeight:900, fontSize:"1rem", color:"#fff", background:"#1c4f09", padding:"1rem 2.5rem", borderRadius:14, boxShadow:"0 8px 32px rgba(28,79,9,0.38)" }}>
                <i className="fas fa-paw" /> Create Free Account
              </a>
              <a href="/login" className="cta-outline"
                style={{ fontWeight:800, fontSize:"1rem", color:"#2e4a10", background:"rgba(255,250,232,0.75)", padding:"1rem 2.25rem", borderRadius:14, border:"1.5px solid rgba(180,140,60,0.32)" }}>
                <i className="fas fa-sign-in-alt" /> Sign In
              </a>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <div className="mb-2">
              <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
            </div>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">Paw<em className="italic text-[#e07820]">ster</em></div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
              Screening, placing, and supporting animal adoptions across Baguio City and the Cordillera Administrative Region with care and accountability.
            </p>
          </div>
          {[
            { title: "Adopt", links: [["Browse animals", "/pets"], ["My profile", "/profile"], ["Log in", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How it works", "/how-it-works"], ["Rehome & Rescue", "/rehome"], ["Missing pets", "/missing-pets"], ["About us", "/about"]] },
            { title: "Provinces", links: [["Baguio City", "/pets"], ["Benguet", "/pets"], ["Mountain Province", "/pets"], ["Ifugao", "/pets"]] },
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
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in Baguio City.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f"].map(icon => (
              <a key={icon} href="https://www.facebook.com/pawsterofficial" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontSize: '0.78rem', color: '#7a8a60', background: 'rgba(255,250,232,0.7)', border: '1px solid rgba(180,140,60,0.22)', textDecoration: 'none' }}>
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}