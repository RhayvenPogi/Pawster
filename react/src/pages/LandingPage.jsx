export default function LandingPage() {
    return (
        <div style={{ minHeight:'100vh', background:'#EDDABB', fontFamily:"'Nunito',sans-serif", display:'flex', flexDirection:'column' }}>

            {/* Navbar */}
            <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.2rem 4vw', position:'fixed', top:0, width:'100%', zIndex:100, background:'rgba(237,218,187,0.85)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(200,170,100,0.3)' }}>
                <img src="/images/logo.png" alt="Pawster" style={{ width:56, height:56, objectFit:'cover' }} />
                <div style={{ display:'flex', gap:'1rem' }}>
                    <a href="/login"    style={{ fontWeight:800, color:'#1c4f09', textDecoration:'none', fontSize:'0.95rem' }}>Sign In</a>
                    <a href="/register" style={{ fontWeight:800, color:'#fff', background:'#1c4f09', padding:'0.45rem 1.4rem', borderRadius:50, textDecoration:'none', fontSize:'0.95rem' }}>Register</a>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'8rem 2rem 4rem' }}>
                <h1 style={{ fontSize:'clamp(3rem,6vw,5.5rem)', fontWeight:900, color:'#1a4a08', lineHeight:0.95, textTransform:'uppercase', letterSpacing:-2, marginBottom:'1.5rem' }}>
                    Every Pet<br/>Deserves Love
                </h1>
                <p style={{ fontSize:'clamp(1rem,1.5vw,1.2rem)', fontWeight:600, color:'#3a6020', maxWidth:520, lineHeight:1.7, marginBottom:'2.5rem' }}>
                    Pawster connects compassionate adopters with rescue organizations to give animals a second chance at life.
                </p>
                <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
                    <a href="/register" style={{ fontWeight:900, fontSize:'1.1rem', color:'#fff', background:'#1c4f09', padding:'0.9rem 2.5rem', borderRadius:14, textDecoration:'none', boxShadow:'0 6px 20px rgba(28,79,9,0.3)' }}>Get Started</a>
                    <a href="/login"    style={{ fontWeight:900, fontSize:'1.1rem', color:'#1c4f09', background:'transparent', border:'2px solid #1c4f09', padding:'0.9rem 2.5rem', borderRadius:14, textDecoration:'none' }}>Sign In</a>
                </div>
            </section>

            {/* Features */}
            <section style={{ display:'flex', gap:'1.5rem', padding:'3rem 6vw 5rem', flexWrap:'wrap', justifyContent:'center' }}>
                {[
                    { icon:'🐾', title:'Find Your Match',  text:'Browse hundreds of rescue animals looking for a forever home.' },
                    { icon:'🏠', title:'Local Shelters',   text:'Connect with verified rescue organizations near you.'         },
                    { icon:'✅', title:'Safe & Verified',  text:'Every adopter is identity-verified for animal safety.'        },
                ].map(({ icon, title, text }) => (
                    <div key={title} style={{ flex:'1 1 260px', maxWidth:320, background:'rgba(255,248,225,0.6)', backdropFilter:'blur(12px)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:20, padding:'2rem', textAlign:'center', boxShadow:'0 4px 20px rgba(160,105,30,0.1)' }}>
                        <div style={{ fontSize:'2.5rem', marginBottom:'0.8rem' }}>{icon}</div>
                        <h3 style={{ fontWeight:900, color:'#1a4a08', fontSize:'1.1rem', marginBottom:'0.5rem' }}>{title}</h3>
                        <p style={{ fontWeight:600, color:'#4a6030', fontSize:'0.9rem', lineHeight:1.6 }}>{text}</p>
                    </div>
                ))}
            </section>

            <footer style={{ textAlign:'center', padding:'1.5rem', fontWeight:700, color:'#6a8a50', fontSize:'0.85rem', borderTop:'1px solid rgba(160,120,60,0.2)' }}>
                © 2026 Pawster. Made with 🐾 for animals everywhere.
            </footer>
        </div>
    );
}