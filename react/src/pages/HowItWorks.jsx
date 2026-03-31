import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';
import logo from "../images/logo.png"; 

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
function Reveal({ children, delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{ transition: 'opacity 0.7s ease, transform 0.7s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)' }}>
      {children}
    </div>
  );
}

const STEPS = [
  { num:'01', icon:'fas fa-search',        color:'#1c4f09', bg:'rgba(28,79,9,0.12)',      title:'Browse Animals',       desc:'Explore dogs, cats, and small animals available across the Ilocos Region. Filter by species, age, and location to find your perfect match.' },
  { num:'02', icon:'fas fa-user-check',    color:'#2060a0', bg:'rgba(32,96,160,0.11)',    title:'Create an Account',    desc:'Register for a free Pawster account. We need basic info to match you with the right pet and keep you updated on your application.' },
  { num:'03', icon:'fas fa-file-alt',      color:'#B45A22', bg:'rgba(180,90,34,0.12)',    title:'Submit Application',   desc:'Fill out a short adoption form for the pet you love. Tell us about your home, lifestyle, and experience with animals.' },
  { num:'04', icon:'fas fa-comments',      color:'#d4880a', bg:'rgba(212,136,10,0.12)',   title:'Meet & Interview',     desc:'Our team will reach out within 2–3 business days to schedule a meet-and-greet with the animal and a quick interview.' },
  { num:'05', icon:'fas fa-shield-alt',    color:'#7040b0', bg:'rgba(112,64,176,0.11)',   title:'Approval & Paperwork', desc:'Once approved, we handle the adoption paperwork together. We ensure everything is above board for both you and the animal.' },
  { num:'06', icon:'fas fa-heart',         color:'#c03060', bg:'rgba(192,48,96,0.11)',    title:'Welcome Home!',        desc:'Take your new companion home! We follow up at 1 week and 1 month to make sure everyone is happy and thriving.' },
];

const FAQS = [
  { q: 'How long does the adoption process take?',         a: 'Most adoptions are completed within 1–2 weeks from application to bringing your pet home.' },
  { q: 'Is there an adoption fee?',                        a: 'Fees vary by animal and shelter. They typically cover vaccinations, microchipping, and spay/neuter procedures.' },
  { q: 'Can I adopt if I live in an apartment?',           a: 'Yes! Many pets thrive in apartments. We match animals to living situations during the interview.' },
  { q: 'What if the pet and I are not a good fit?',        a: 'We have a 30-day adjustment period. If it truly isn\'t working, we facilitate a safe return.' },
  { q: 'Do you deliver pets outside the Ilocos Region?',  a: 'Currently we serve the four Ilocos provinces. Inter-region transfers may be arranged case-by-case.' },
];

export default function HowItWorks() {
  const { user, logout } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const initials = user ? ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? 'U')).toUpperCase() : 'U';



  return (
    <div style={{ minHeight:'100vh', background:'#EDDABB', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0)}50%{transform:translate(5%,8%)}}
        @keyframes fl2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,5%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
      `}</style>

      {/* Mesh bg */}
      <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, background:'#EDDABB' }} />
        <div style={{ position:'absolute', width:900, height:900, top:'-20%', left:'-15%', borderRadius:'50%', background:'radial-gradient(circle,#588B41,transparent 70%)', filter:'blur(120px)', opacity:0.45, animation:'fl1 9s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:800, height:800, top:'10%', right:'-18%', borderRadius:'50%', background:'radial-gradient(circle,#B45A22,transparent 70%)', filter:'blur(120px)', opacity:0.40, animation:'fl2 11s ease-in-out infinite' }} />
      </div>

      <Navbar />

      {/* Content */}
      <div style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'4rem 2.5rem 6rem' }}>

        {/* Header */}
        <Reveal>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(28,79,9,0.08)', border:'1px solid rgba(90,170,48,0.28)', color:'#1c4f09' }}>
            <i className="fas fa-list-ol" style={{ fontSize:'0.65rem' }} /> Simple Process
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.2rem,4vw,3.4rem)', fontWeight:900, color:'#1a4a08', lineHeight:1.1, marginBottom:'1rem' }}>
            How <em style={{ fontStyle:'italic', color:'#e07820' }}>Adoption</em> Works
          </h1>
          <p style={{ fontSize:'1rem', fontWeight:700, color:'#3a5020', maxWidth:520, lineHeight:1.7, marginBottom:'3.5rem' }}>
            Six simple steps stand between you and your forever companion. Here's exactly what to expect.
          </p>
        </Reveal>

        {/* Steps grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.25rem', marginBottom:'5rem' }}>
          {STEPS.map(({ num, icon, color, bg, title, desc }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div style={{ position:'relative', background:'rgba(255,248,225,0.80)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:20, padding:'2rem', boxShadow:'0 4px 24px rgba(100,70,20,0.11)', transition:'transform 0.2s', cursor:'default' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ position:'absolute', top:'1rem', right:'1.25rem', fontFamily:"'Playfair Display',serif", fontSize:'3.2rem', fontWeight:900, color:'rgba(28,79,9,0.08)', lineHeight:1 }}>{num}</div>
                <div style={{ width:52, height:52, borderRadius:14, background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', marginBottom:'1.2rem' }}>
                  <i className={icon} />
                </div>
                <div style={{ fontWeight:900, fontSize:'1.05rem', color:'#1a4a08', marginBottom:'0.5rem' }}>{title}</div>
                <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#6a7a50', lineHeight:1.65 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Requirements */}
        <Reveal>
          <div style={{ background:'rgba(255,248,225,0.80)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:24, padding:'2.5rem', marginBottom:'3rem', boxShadow:'0 4px 24px rgba(100,70,20,0.11)' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(28,79,9,0.08)', border:'1px solid rgba(90,170,48,0.28)', color:'#1c4f09' }}>
              <i className="fas fa-clipboard-list" style={{ fontSize:'0.65rem' }} /> Requirements
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:900, color:'#1a4a08', marginBottom:'1.5rem' }}>What You'll Need</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
              {[
                { icon:'fas fa-id-card',     label:'Valid Government ID' },
                { icon:'fas fa-home',        label:'Proof of Residence' },
                { icon:'fas fa-phone',       label:'Active Contact Number' },
                { icon:'fas fa-users',       label:'Household Agreement' },
                { icon:'fas fa-dog',         label:'Pet-Friendly Home' },
                { icon:'fas fa-hand-holding-heart', label:'Genuine Commitment' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,252,238,0.6)', borderRadius:12, padding:'0.9rem 1rem', border:'1px solid rgba(200,170,100,0.3)' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(28,79,9,0.10)', color:'#1c4f09', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={icon} />
                  </div>
                  <span style={{ fontWeight:800, fontSize:'0.85rem', color:'#1a4a08' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(28,79,9,0.08)', border:'1px solid rgba(90,170,48,0.28)', color:'#1c4f09' }}>
            <i className="fas fa-question-circle" style={{ fontSize:'0.65rem' }} /> FAQ
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:900, color:'#1a4a08', marginBottom:'1.5rem' }}>Common Questions</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} style={{ background:'rgba(255,248,225,0.80)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(100,70,20,0.08)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.1rem 1.5rem', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:'0.95rem', color:'#1a4a08', textAlign:'left' }}>
                  {q}
                  <i className={'fas fa-chevron-' + (openFaq === i ? 'up' : 'down')} style={{ color:'#6a7a50', fontSize:'0.8rem', flexShrink:0, marginLeft:'1rem' }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding:'0 1.5rem 1.2rem', fontSize:'0.88rem', fontWeight:700, color:'#3a5020', lineHeight:1.7 }}>{a}</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal delay={100}>
          <div style={{ marginTop:'4rem', textAlign:'center' }}>
            <Link to="/pets" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'1rem 2.5rem', borderRadius:13, fontWeight:900, fontSize:'1rem', color:'#fff', background:'#1c4f09', textDecoration:'none', boxShadow:'0 6px 24px rgba(28,79,9,0.30)' }}>
              <i className="fas fa-search" /> Browse Animals
            </Link>
          </div>
        </Reveal>
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
    </div>
  );
}