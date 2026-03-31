import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';

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

const VALUES = [
  { icon:'fas fa-heart',         color:'#c03060', bg:'rgba(192,48,96,0.11)',   title:'Compassion First',    desc:'Every decision we make is guided by the welfare of the animals in our care.' },
  { icon:'fas fa-shield-alt',    color:'#2060a0', bg:'rgba(32,96,160,0.11)',   title:'Trust & Safety',      desc:'We vet every adopter and rehoming request to ensure animals go to safe, loving homes.' },
  { icon:'fas fa-users',         color:'#1c4f09', bg:'rgba(28,79,9,0.12)',     title:'Community Driven',    desc:'Pawster is built on the generosity of volunteers, fosters, and local shelters.' },
  { icon:'fas fa-map-marker-alt',color:'#d4880a', bg:'rgba(212,136,10,0.12)', title:'Locally Rooted',      desc:'We focus exclusively on the Ilocos Region, knowing our communities deeply.' },
];

const TEAM = [
  { name:'Ana Reyes',      role:'Founder & Director',    initials:'AR', color:'#1c4f09' },
  { name:'Marco Santos',   role:'Adoption Coordinator',  initials:'MS', color:'#B45A22' },
  { name:'Liza Cruz',      role:'Vet & Animal Welfare',  initials:'LC', color:'#2060a0' },
  { name:'Paolo Aquino',   role:'Community Manager',     initials:'PA', color:'#7040b0' },
];

export default function About() {
  const { user, logout } = useAuth();
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

      <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, background:'#EDDABB' }} />
        <div style={{ position:'absolute', width:900, height:900, top:'-20%', left:'-15%', borderRadius:'50%', background:'radial-gradient(circle,#588B41,transparent 70%)', filter:'blur(120px)', opacity:0.42, animation:'fl1 9s ease-in-out infinite' }} />
        <div style={{ position:'absolute', width:800, height:800, bottom:'-15%', right:'-15%', borderRadius:'50%', background:'radial-gradient(circle,#B45A22,transparent 70%)', filter:'blur(120px)', opacity:0.35, animation:'fl2 11s ease-in-out infinite' }} />
      </div>

      <Navbar />

      <div style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'4rem 2.5rem 6rem' }}>

        {/* Hero */}
        <Reveal>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(28,79,9,0.08)', border:'1px solid rgba(90,170,48,0.28)', color:'#1c4f09' }}>
            <i className="fas fa-info-circle" style={{ fontSize:'0.65rem' }} /> Our Story
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center', marginBottom:'5rem' }}>
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.2rem,4vw,3.4rem)', fontWeight:900, color:'#1a4a08', lineHeight:1.1, marginBottom:'1.25rem' }}>
                About <em style={{ fontStyle:'italic', color:'#e07820' }}>Pawster</em>
              </h1>
              <p style={{ fontSize:'0.95rem', fontWeight:700, color:'#3a5020', lineHeight:1.8, marginBottom:'1rem' }}>
                Founded in 2023, Pawster was born from a simple belief: every animal in the Ilocos Region deserves a loving home, and every family deserves a loyal companion.
              </p>
              <p style={{ fontSize:'0.92rem', fontWeight:700, color:'#3a5020', lineHeight:1.8 }}>
                We started as a small volunteer group in Laoag City and have since grown to serve all four Ilocos provinces — connecting hundreds of animals with families who love them.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[['240+','Animals rehomed'],['98%','Family satisfaction'],['4','Provinces served'],['2023','Year founded']].map(([val,lbl]) => (
                <div key={lbl} style={{ background:'rgba(255,248,225,0.80)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:18, padding:'1.5rem', textAlign:'center', boxShadow:'0 3px 14px rgba(100,70,20,0.10)' }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.2rem', fontWeight:900, color:'#1a4a08', lineHeight:1 }}>{val}</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:800, color:'#6a7a50', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:'0.4rem' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Values */}
        <Reveal delay={80}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(28,79,9,0.08)', border:'1px solid rgba(90,170,48,0.28)', color:'#1c4f09' }}>
            <i className="fas fa-star" style={{ fontSize:'0.65rem' }} /> Core Values
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:900, color:'#1a4a08', marginBottom:'1.5rem' }}>What We Stand For</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1.1rem', marginBottom:'5rem' }}>
            {VALUES.map(({ icon, color, bg, title, desc }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div style={{ background:'rgba(255,248,225,0.80)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:18, padding:'1.75rem', boxShadow:'0 3px 14px rgba(100,70,20,0.10)', transition:'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{ width:48, height:48, borderRadius:13, background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', marginBottom:'1rem' }}>
                    <i className={icon} />
                  </div>
                  <div style={{ fontWeight:900, fontSize:'1rem', color:'#1a4a08', marginBottom:'0.5rem' }}>{title}</div>
                  <p style={{ fontSize:'0.84rem', fontWeight:700, color:'#6a7a50', lineHeight:1.65 }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Team */}
        <Reveal delay={80}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:50, padding:'0.3rem 1rem', fontSize:'0.67rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', fontStyle:'italic', marginBottom:'1rem', background:'rgba(28,79,9,0.08)', border:'1px solid rgba(90,170,48,0.28)', color:'#1c4f09' }}>
            <i className="fas fa-users" style={{ fontSize:'0.65rem' }} /> The Team
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:900, color:'#1a4a08', marginBottom:'1.5rem' }}>Meet the People Behind Pawster</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1.1rem', marginBottom:'5rem' }}>
            {TEAM.map(({ name, role, initials: ini, color }, i) => (
              <Reveal key={name} delay={i * 70}>
                <div style={{ background:'rgba(255,248,225,0.80)', border:'1px solid rgba(180,140,60,0.28)', borderRadius:18, padding:'2rem', textAlign:'center', boxShadow:'0 3px 14px rgba(100,70,20,0.10)', transition:'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{ width:64, height:64, borderRadius:'50%', background: 'linear-gradient(135deg,' + color + ',#3a8a18)', border:'3px solid rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:900, color:'#fff', margin:'0 auto 1rem' }}>{ini}</div>
                  <div style={{ fontWeight:900, fontSize:'1rem', color:'#1a4a08' }}>{name}</div>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#6a7a50', marginTop:'0.3rem' }}>{role}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Contact band */}
        <Reveal>
          <div style={{ background:'linear-gradient(135deg,rgba(28,79,9,0.10),rgba(90,170,48,0.07))', border:'1px solid rgba(90,170,48,0.35)', borderRadius:24, padding:'3rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'2rem', flexWrap:'wrap', boxShadow:'0 6px 30px rgba(28,79,9,0.10)' }}>
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:900, color:'#1a4a08', marginBottom:'0.5rem' }}>Get in Touch</h2>
              <p style={{ fontSize:'0.9rem', fontWeight:700, color:'#3a5020', lineHeight:1.7 }}>Have questions? We'd love to hear from you.<br />Reach us at <strong>hello@pawster.ph</strong> or on Facebook.</p>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <a href="mailto:hello@pawster.ph" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.85rem 1.75rem', borderRadius:12, fontWeight:900, fontSize:'0.9rem', color:'#fff', background:'#1c4f09', textDecoration:'none', boxShadow:'0 4px 16px rgba(28,79,9,0.25)' }}>
                <i className="fas fa-envelope" /> Email Us
              </a>
              <Link to="/pets" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.85rem 1.75rem', borderRadius:12, fontWeight:800, fontSize:'0.9rem', color:'#3a5020', background:'rgba(255,248,220,0.75)', border:'1px solid rgba(180,140,60,0.28)', textDecoration:'none' }}>
                <i className="fas fa-search" /> Browse Pets
              </Link>
            </div>
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

      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}