import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';
import logo from "../images/logo.png"; 

function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}
function Reveal({ children, delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{ transition:'opacity 0.7s ease, transform 0.7s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)' }}>
      {children}
    </div>
  );
}

const REASONS = [
  { icon:'fas fa-plane-departure', label:'Moving abroad or relocating' },
  { icon:'fas fa-allergies',       label:'Allergies in the household' },
  { icon:'fas fa-baby',            label:'New baby or family changes' },
  { icon:'fas fa-briefcase-medical', label:'Medical or financial hardship' },
  { icon:'fas fa-home',            label:'No longer pet-friendly housing' },
  { icon:'fas fa-clock',           label:'Not enough time to care properly' },
];

export default function Rehome() {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ petName:'', species:'Dog', breed:'', age:'', gender:'Male', reason:'', details:'', contact:'' });
  const [submitted, setSubmitted] = useState(false);
  const initials = user ? ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? 'U')).toUpperCase() : 'U';


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/rehome', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ ...form, userId: user?.id }) });
    } catch(_) {}
    setSubmitted(true);
  };

  const field = (key, ph, type='text') => (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
      <label style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#5a7a40' }}>{ph}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required
        style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.9rem', color:'#1a4a08', outline:'none' }} />
    </div>
  );

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

      <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, background:'#EDDABB' }} />
        <div style={{ position:'absolute', width:900, height:900, top:'-20%', left:'-15%', borderRadius:'50%', background:'radial-gradient(circle,#B45A22,transparent 70%)', filter:'blur(120px)', opacity:0.38, animation:'fl1 9s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:800, height:800, bottom:'-15%', right:'-15%', borderRadius:'50%', background:'radial-gradient(circle,#588B41,transparent 70%)', filter:'blur(120px)', opacity:0.38, animation:'fl2 11s ease-in-out infinite' }} />
      </div>

     <Navbar />
      {/* Content */}
      <div style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'4rem 2.5rem 6rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3rem', alignItems:'start' }}>

        {/* Left */}
        <div>
          <Reveal>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(180,90,34,0.10)', border:'1px solid rgba(180,90,34,0.28)', color:'#B45A22' }}>
              <i className="fas fa-home" style={{ fontSize:'0.65rem' }} /> Rehoming Service
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,3.5vw,3rem)', fontWeight:900, color:'#1a4a08', lineHeight:1.1, marginBottom:'1rem' }}>
              Need to <em style={{ fontStyle:'italic', color:'#B45A22' }}>Rehome</em> Your Pet?
            </h1>
            <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#3a5020', lineHeight:1.7, marginBottom:'2rem' }}>
              Life circumstances change. If you're unable to care for your pet, Pawster will help find them a safe, loving new home — with full discretion and care.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h3 style={{ fontWeight:900, fontSize:'1rem', color:'#1a4a08', marginBottom:'1rem' }}>Common reasons families reach out:</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'2.5rem' }}>
              {REASONS.map(({ icon, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,248,225,0.75)', borderRadius:12, padding:'0.75rem 1rem', border:'1px solid rgba(180,140,60,0.28)' }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'rgba(180,90,34,0.10)', color:'#B45A22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={icon} />
                  </div>
                  <span style={{ fontWeight:700, fontSize:'0.88rem', color:'#3a5020' }}>{label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div style={{ background:'linear-gradient(135deg,rgba(28,79,9,0.10),rgba(90,170,48,0.07))', border:'1px solid rgba(90,170,48,0.30)', borderRadius:18, padding:'1.5rem' }}>
              <div style={{ fontWeight:900, fontSize:'0.95rem', color:'#1a4a08', marginBottom:'0.5rem' }}>🐾 Our Promise</div>
              <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#3a5020', lineHeight:1.7 }}>
                We never abandon animals. Every pet submitted through Pawster is screened, cared for, and matched only with verified, loving adopters. Your pet is in good hands.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Right — form */}
        <Reveal delay={80}>
          <div style={{ background:'rgba(255,248,225,0.85)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:24, padding:'2.5rem', boxShadow:'0 8px 40px rgba(160,105,30,0.12)', position:'sticky', top:90 }}>
            {submitted ? (
              <div style={{ textAlign:'center', padding:'3rem 0' }}>
                <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🏡</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', fontWeight:900, color:'#1a4a08', marginBottom:'0.5rem' }}>Thank You!</div>
                <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#3a5020', lineHeight:1.7 }}>Your rehoming request has been received. Our team will contact you within 24–48 hours.</p>
                <Link to="/home" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', marginTop:'1.5rem', padding:'0.75rem 1.75rem', borderRadius:12, fontWeight:900, fontSize:'0.9rem', color:'#fff', background:'#1c4f09', textDecoration:'none' }}>Back to Home</Link>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:900, color:'#1a4a08', marginBottom:'0.4rem' }}>Rehome Request</h2>
                <p style={{ fontSize:'0.82rem', fontWeight:700, color:'#6a7a50', marginBottom:'1.75rem' }}>All information is kept confidential.</p>

                {/* Step indicator */}
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.75rem' }}>
                  {[1,2].map(s => (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex: s === 1 ? 1 : 'none' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:900, background: step >= s ? '#1c4f09' : 'rgba(180,140,60,0.20)', color: step >= s ? '#fff' : '#6a7a50', transition:'all 0.2s' }}>{s}</div>
                      {s === 1 && <div style={{ flex:1, height:2, background: step >= 2 ? '#1c4f09' : 'rgba(180,140,60,0.20)', borderRadius:1, transition:'all 0.3s' }} />}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {step === 1 ? (
                    <>
                      {field('petName', "Pet's Name")}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                          <label style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#5a7a40' }}>Species</label>
                          <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.9rem', color:'#1a4a08', outline:'none' }}>
                            {['Dog','Cat','Rabbit','Bird','Other'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                          <label style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#5a7a40' }}>Gender</label>
                          <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.9rem', color:'#1a4a08', outline:'none' }}>
                            {['Male','Female'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      {field('breed', 'Breed')}
                      {field('age', 'Age (e.g. 2 years)')}
                      <button type="button" onClick={() => setStep(2)} style={{ padding:'0.85rem', borderRadius:12, fontWeight:900, fontSize:'0.92rem', color:'#fff', background:'#1c4f09', border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif", boxShadow:'0 4px 14px rgba(28,79,9,0.25)', marginTop:'0.5rem' }}>
                        Continue <i className="fas fa-arrow-right" />
                      </button>
                    </>
                  ) : (
                    <>
                      {field('contact', 'Your Contact Number')}
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                        <label style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#5a7a40' }}>Reason for Rehoming</label>
                        <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.9rem', color:'#1a4a08', outline:'none' }}>
                          <option value="">Select a reason</option>
                          {['Moving / Relocating','Allergies','New baby','Medical / Financial','Housing change','Not enough time','Other'].map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                        <label style={{ fontSize:'0.75rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'#5a7a40' }}>Additional Details</label>
                        <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={3} style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.9rem', color:'#1a4a08', outline:'none', resize:'vertical' }} />
                      </div>
                      <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
                        <button type="button" onClick={() => setStep(1)} style={{ flex:1, padding:'0.85rem', borderRadius:12, fontWeight:800, fontSize:'0.88rem', color:'#3a5020', background:'transparent', border:'1px solid rgba(180,140,60,0.28)', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                          <i className="fas fa-arrow-left" /> Back
                        </button>
                        <button type="submit" style={{ flex:2, padding:'0.85rem', borderRadius:12, fontWeight:900, fontSize:'0.92rem', color:'#fff', background:'#B45A22', border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif", boxShadow:'0 4px 14px rgba(180,90,34,0.28)' }}>
                          <i className="fas fa-paper-plane" /> Submit Request
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </>
            )}
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

      {/* Mobile single column fix */}
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}