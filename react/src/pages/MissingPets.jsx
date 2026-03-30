import { useState, useEffect, useRef } from 'react';
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

const SAMPLE = [
  { id:1, type:'lost',  name:'Buddy',   species:'Dog',    breed:'Aspin',          area:'Laoag City',       date:'Mar 20',  color:'Brown & white', photo:'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop' },
  { id:2, type:'found', name:'Unknown', species:'Cat',    breed:'Tabby',          area:'Vigan City',       date:'Mar 22',  color:'Orange',        photo:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop' },
  { id:3, type:'lost',  name:'Noodles', species:'Dog',    breed:'Shih Tzu',       area:'San Fernando',     date:'Mar 24',  color:'White',         photo:'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop' },
  { id:4, type:'found', name:'Unknown', species:'Dog',    breed:'Mixed',          area:'Dagupan City',     date:'Mar 25',  color:'Black',         photo:'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=400&h=300&fit=crop' },
  { id:5, type:'lost',  name:'Miso',    species:'Cat',    breed:'Persian Mix',    area:'Batac City',       date:'Mar 26',  color:'Grey & white',  photo:'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop' },
  { id:6, type:'lost',  name:'Choco',   species:'Dog',    breed:'Labrador Mix',   area:'Urdaneta City',    date:'Mar 27',  color:'Chocolate',     photo:'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop' },
];

export default function MissingPets() {
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState('all');
  const [dropOpen, setDropOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type:'lost', name:'', species:'Dog', breed:'', area:'', color:'', details:'' });
  const [submitted, setSubmitted] = useState(false);
  const initials = user ? ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? 'U')).toUpperCase() : 'U';

  const filtered = filter === 'all' ? SAMPLE : SAMPLE.filter(p => p.type === filter);

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
      await fetch('/api/missing-pets', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(form) });
    } catch(_) {}
    setSubmitted(true);
    setTimeout(() => { setShowModal(false); setSubmitted(false); setForm({ type:'lost', name:'', species:'Dog', breed:'', area:'', color:'', details:'' }); }, 2000);
  };

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
            <Link key={label} to={to} style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', padding:'0.45rem 0.9rem', borderRadius:50, fontSize:'0.78rem', fontWeight:800, textDecoration:'none', whiteSpace:'nowrap', background: to === '/missing-pets' ? 'rgba(180,90,34,0.12)' : 'transparent', color: to === '/missing-pets' ? '#B45A22' : '#3a5020', border: to === '/missing-pets' ? '1px solid rgba(180,90,34,0.25)' : '1px solid transparent' }}>
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
      <div style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'4rem 2.5rem 6rem' }}>
        <Reveal>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(180,90,34,0.10)', border:'1px solid rgba(180,90,34,0.28)', color:'#B45A22' }}>
            <i className="fas fa-search-location" style={{ fontSize:'0.65rem' }} /> Community Board
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'2.5rem' }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.2rem,4vw,3.2rem)', fontWeight:900, color:'#1a4a08', lineHeight:1.1 }}>
                <em style={{ fontStyle:'italic', color:'#B45A22' }}>Missing</em> Pets Board
              </h1>
              <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#3a5020', marginTop:'0.5rem' }}>Help reunite animals with their families across the Ilocos Region.</p>
            </div>
            <button onClick={() => setShowModal(true)} style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.85rem 1.75rem', borderRadius:12, fontWeight:900, fontSize:'0.9rem', color:'#fff', background:'#B45A22', border:'none', cursor:'pointer', boxShadow:'0 4px 18px rgba(180,90,34,0.30)', fontFamily:"'Nunito',sans-serif" }}>
              <i className="fas fa-plus" /> Report a Pet
            </button>
          </div>
        </Reveal>

        {/* Filter tabs */}
        <Reveal delay={100}>
          <div style={{ display:'inline-flex', gap:'0.4rem', background:'rgba(255,248,220,0.6)', borderRadius:50, padding:'0.3rem', border:'1px solid rgba(180,140,60,0.28)', marginBottom:'2rem' }}>
            {[['all','All Posts'],['lost','Lost'],['found','Found']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding:'0.45rem 1.3rem', borderRadius:50, fontSize:'0.82rem', fontWeight:800, border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif", background: filter === val ? (val === 'lost' ? '#c03030' : val === 'found' ? '#1c4f09' : '#1a4a08') : 'transparent', color: filter === val ? '#fff' : '#3a5020', transition:'all 0.15s' }}>
                {lbl}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
          {filtered.map((pet, i) => (
            <Reveal key={pet.id} delay={i * 60}>
              <div style={{ background:'rgba(255,248,225,0.85)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 20px rgba(100,70,20,0.11)', transition:'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ position:'relative', height:180 }}>
                  <img src={pet.photo} alt={pet.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <span style={{ position:'absolute', top:10, left:10, padding:'0.25rem 0.75rem', borderRadius:50, fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', background: pet.type === 'lost' ? 'rgba(192,48,48,0.88)' : 'rgba(28,79,9,0.88)', color:'#fff', backdropFilter:'blur(6px)' }}>
                    {pet.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                  </span>
                  <span style={{ position:'absolute', top:10, right:10, padding:'0.25rem 0.75rem', borderRadius:50, fontSize:'0.65rem', fontWeight:800, background:'rgba(10,6,2,0.55)', color:'rgba(255,235,150,0.9)', backdropFilter:'blur(6px)' }}>{pet.date}</span>
                </div>
                <div style={{ padding:'1.1rem 1.25rem' }}>
                  <div style={{ fontWeight:900, fontSize:'1.05rem', color:'#1a4a08', marginBottom:'0.3rem' }}>{pet.name}</div>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#6a7a50', marginBottom:'0.6rem' }}>{pet.breed} · {pet.species}</div>
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:800, padding:'0.2rem 0.6rem', borderRadius:50, background:'rgba(28,79,9,0.10)', color:'#1c4f09' }}><i className="fas fa-map-marker-alt" style={{ marginRight:'0.25rem' }} />{pet.area}</span>
                    <span style={{ fontSize:'0.68rem', fontWeight:800, padding:'0.2rem 0.6rem', borderRadius:50, background:'rgba(180,140,60,0.12)', color:'#7a6020' }}>{pet.color}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)' }} onClick={() => setShowModal(false)}>
          <div style={{ background:'rgba(255,252,235,0.98)', borderRadius:24, padding:'2.5rem', width:'100%', maxWidth:480, margin:'1rem', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', animation:'fadeUp 0.2s ease both' }} onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div style={{ textAlign:'center', padding:'2rem 0' }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:900, color:'#1a4a08' }}>Report Submitted!</div>
                <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#3a5020', marginTop:'0.5rem' }}>We'll post it on the board shortly.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.6rem', fontWeight:900, color:'#1a4a08', marginBottom:'1.5rem' }}>Report a Pet</h2>
                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    {[['lost','Lost'],['found','Found']].map(([val,lbl]) => (
                      <button type="button" key={val} onClick={() => setForm(f => ({ ...f, type: val }))} style={{ flex:1, padding:'0.6rem', borderRadius:10, fontWeight:800, fontSize:'0.85rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif", border: form.type === val ? 'none' : '1px solid rgba(180,140,60,0.28)', background: form.type === val ? (val === 'lost' ? '#c03030' : '#1c4f09') : 'rgba(255,250,232,0.7)', color: form.type === val ? '#fff' : '#3a5020' }}>{lbl}</button>
                    ))}
                  </div>
                  {[['name','Pet Name (or Unknown)'],['breed','Breed'],['area','Area / City'],['color','Color / Markings']].map(([field, ph]) => (
                    <input key={field} placeholder={ph} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.88rem', color:'#1a4a08', outline:'none' }} />
                  ))}
                  <textarea placeholder="Additional details..." value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={3} style={{ padding:'0.75rem 1rem', borderRadius:10, border:'1px solid rgba(180,140,60,0.28)', background:'rgba(255,250,232,0.7)', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:'0.88rem', color:'#1a4a08', outline:'none', resize:'vertical' }} />
                  <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ flex:1, padding:'0.75rem', borderRadius:10, fontWeight:800, fontSize:'0.88rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:'transparent', border:'1px solid rgba(180,140,60,0.28)', color:'#3a5020' }}>Cancel</button>
                    <button type="submit" style={{ flex:2, padding:'0.75rem', borderRadius:10, fontWeight:900, fontSize:'0.88rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:'#B45A22', color:'#fff', border:'none', boxShadow:'0 4px 14px rgba(180,90,34,0.28)' }}>Submit Report</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
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