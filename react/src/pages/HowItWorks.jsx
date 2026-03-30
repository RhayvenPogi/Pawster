import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
  const [dropOpen, setDropOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
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

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:200, display:'flex', alignItems:'center', padding:'0 2.5rem', gap:'1rem', height:70, background:'rgba(255,248,218,0.90)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(90,170,48,0.45)', boxShadow:'0 2px 20px rgba(100,70,20,0.09)' }}>
        <Link to="/home" style={{ display:'flex', alignItems:'center', gap:'0.6rem', textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#1c4f09', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>🐾</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.25rem', fontWeight:900, color:'#1a4a08' }}>Paw<em style={{ fontStyle:'italic', color:'#e07820' }}>ster</em></span>
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:'0.1rem', margin:'0 auto', background:'rgba(255,245,210,0.5)', borderRadius:50, padding:'0.25rem', border:'1px solid rgba(180,140,60,0.28)' }}>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <Link key={label} to={to} style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.45rem 0.9rem', borderRadius:50, fontSize:'0.78rem', fontWeight:800, textDecoration:'none', whiteSpace:'nowrap', background: to === '/how-it-works' ? 'linear-gradient(135deg,rgba(28,79,9,0.16),rgba(90,170,48,0.12))' : to === '/missing-pets' ? 'rgba(180,90,34,0.09)' : 'transparent', color: to === '/how-it-works' ? '#1a4a08' : to === '/missing-pets' ? '#B45A22' : '#3a5020' }}>
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
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:'0.81rem', fontWeight:800, color:'#1a4a08' }}>{user.firstName}</div>
                    <div style={{ fontSize:'0.64rem', fontWeight:700, color:'#6a7a50' }}>Member</div>
                  </div>
                  <i className="fas fa-chevron-down" style={{ fontSize:'0.62rem', color:'#6a7a50', transition:'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {dropOpen && (
                  <div onClick={() => setDropOpen(false)} style={{ position:'absolute', top:'calc(100% + 9px)', right:0, borderRadius:14, border:'1px solid rgba(180,140,60,0.28)', minWidth:215, padding:'0.5rem', zIndex:999, background:'rgba(255,252,235,0.98)', boxShadow:'0 8px 40px rgba(100,70,20,0.20)', animation:'fadeUp .18s ease both' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem 0.5rem 0.65rem' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#1c4f09,#2a7010)', border:'2px solid #5aaa30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', fontWeight:900, color:'#fff' }}>{initials}</div>
                      <div><div style={{ fontSize:'0.86rem', fontWeight:800, color:'#1a4a08' }}>{user.firstName}</div><div style={{ fontSize:'0.7rem', fontWeight:700, color:'#6a7a50' }}>{user.email}</div></div>
                    </div>
                    <div style={{ height:1, margin:'0.25rem 0', background:'rgba(180,140,60,0.28)' }} />
                    <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.6rem', borderRadius:8, fontSize:'0.82rem', fontWeight:700, color:'#3a5020', textDecoration:'none' }}><i className="fas fa-th-large" style={{ width:16 }} /> Dashboard</Link>
                    <button onClick={logout} style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.6rem', borderRadius:8, fontSize:'0.82rem', fontWeight:700, color:'#c03030', background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}><i className="fas fa-sign-out-alt" style={{ width:16 }} /> Log Out</button>
                  </div>
                )}
              </div>
              <button onClick={logout} style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1rem', borderRadius:9, fontSize:'0.79rem', fontWeight:800, background:'rgba(192,48,48,0.08)', color:'#c03030', border:'1px solid rgba(192,48,48,0.25)', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                <i className="fas fa-sign-out-alt" /> Log Out
              </button>
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
    </div>
  );
}