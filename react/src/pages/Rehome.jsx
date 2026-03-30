import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
  const [dropOpen, setDropOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ petName:'', species:'Dog', breed:'', age:'', gender:'Male', reason:'', details:'', contact:'' });
  const [submitted, setSubmitted] = useState(false);
  const initials = user ? ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? 'U')).toUpperCase() : 'U';

  const NAV_LINKS = [
    { to:'/home',         icon:'fas fa-house',          label:'Home' },
    { to:'/pets',         icon:'fas fa-search',          label:'Find a Pet' },
    { to:'/how-it-works', icon:'fas fa-list-ol',         label:'How It Works' },
    { to:'/rehome',       icon:'fas fa-home',            label:'Rehome' },
    { to:'/missing-pets', icon:'fas fa-search-location', label:'Missing Pets' },
    { to:'/about',        icon:'fas fa-info-circle',     label:'About' },
    { to:'/profile',      icon:'fas fa-user',            label:'Profile' },
  ];

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

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:200, display:'flex', alignItems:'center', padding:'0 2.5rem', gap:'1rem', height:70, background:'rgba(255,248,218,0.90)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(90,170,48,0.45)', boxShadow:'0 2px 20px rgba(100,70,20,0.09)' }}>
        <Link to="/home" style={{ display:'flex', alignItems:'center', gap:'0.6rem', textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#1c4f09', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>🐾</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.25rem', fontWeight:900, color:'#1a4a08' }}>Paw<em style={{ fontStyle:'italic', color:'#e07820' }}>ster</em></span>
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:'0.1rem', margin:'0 auto', background:'rgba(255,245,210,0.5)', borderRadius:50, padding:'0.25rem', border:'1px solid rgba(180,140,60,0.28)' }}>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <Link key={label} to={to} style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.45rem 0.9rem', borderRadius:50, fontSize:'0.78rem', fontWeight:800, textDecoration:'none', whiteSpace:'nowrap', background: to === '/rehome' ? 'linear-gradient(135deg,rgba(180,90,34,0.16),rgba(212,136,10,0.10))' : to === '/missing-pets' ? 'rgba(180,90,34,0.09)' : 'transparent', color: to === '/rehome' ? '#B45A22' : to === '/missing-pets' ? '#B45A22' : '#3a5020' }}>
              <i className={icon} style={{ fontSize:'0.70rem' }} />{label}
            </Link>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
          {user ? (
            <>
              <div style={{ position:'relative' }}>
                <button onClick={() => setDropOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', borderRadius:50, padding:'0.35rem 0.85rem', background:'rgba(255,248,220,0.7)', border:'1px solid rgba(180,140,60,0.28)', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1c4f09,#3a8a18)', border:'2px solid #5aaa30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', fontWeight:900, color:'#fff' }}>{initials}</div>
                  <div style={{ textAlign:'left' }}><div style={{ fontSize:'0.81rem', fontWeight:800, color:'#1a4a08' }}>{user.firstName}</div><div style={{ fontSize:'0.64rem', fontWeight:700, color:'#6a7a50' }}>Member</div></div>
                  <i className="fas fa-chevron-down" style={{ fontSize:'0.62rem', color:'#6a7a50', transform: dropOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
                </button>
                {dropOpen && (
                  <div onClick={() => setDropOpen(false)} style={{ position:'absolute', top:'calc(100% + 9px)', right:0, borderRadius:14, border:'1px solid rgba(180,140,60,0.28)', minWidth:215, padding:'0.5rem', zIndex:999, background:'rgba(255,252,235,0.98)', boxShadow:'0 8px 40px rgba(100,70,20,0.20)', animation:'fadeUp .18s ease both' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#1c4f09,#2a7010)', border:'2px solid #5aaa30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', fontWeight:900, color:'#fff' }}>{initials}</div>
                      <div><div style={{ fontSize:'0.86rem', fontWeight:800, color:'#1a4a08' }}>{user.firstName}</div><div style={{ fontSize:'0.7rem', fontWeight:700, color:'#6a7a50' }}>{user.email}</div></div>
                    </div>
                    <div style={{ height:1, margin:'0.25rem 0', background:'rgba(180,140,60,0.28)' }} />
                    <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.6rem', borderRadius:8, fontSize:'0.82rem', fontWeight:700, color:'#3a5020', textDecoration:'none' }}><i className="fas fa-th-large" /> Dashboard</Link>
                    <button onClick={logout} style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.6rem', borderRadius:8, fontSize:'0.82rem', fontWeight:700, color:'#c03030', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}><i className="fas fa-sign-out-alt" /> Log Out</button>
                  </div>
                )}
              </div>
              <button onClick={logout} style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1rem', borderRadius:9, fontSize:'0.79rem', fontWeight:800, background:'rgba(192,48,48,0.08)', color:'#c03030', border:'1px solid rgba(192,48,48,0.25)', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}><i className="fas fa-sign-out-alt" /> Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1rem', borderRadius:10, fontSize:'0.82rem', fontWeight:800, color:'#3a5020', background:'rgba(255,250,232,0.7)', border:'1px solid rgba(180,140,60,0.28)', textDecoration:'none' }}><i className="fas fa-sign-in-alt" /> Log In</Link>
              <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1rem', borderRadius:10, fontSize:'0.82rem', fontWeight:800, color:'#fff', background:'#1c4f09', border:'1px solid #1c4f09', textDecoration:'none' }}><i className="fas fa-paw" /> Get Started</Link>
            </>
          )}
        </div>
      </nav>

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

      {/* Mobile single column fix */}
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}