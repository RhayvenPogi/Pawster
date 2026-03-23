import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
    const { user, logout } = useAuth();

    return (
        <div style={{ minHeight:'100vh', background:'#EDDABB', fontFamily:"'Nunito',sans-serif" }}>

            {/* Navbar */}
            <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 4vw', background:'rgba(237,218,187,0.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(200,170,100,0.3)', position:'sticky', top:0, zIndex:100 }}>
                <img src="/images/logo.png" alt="Pawster" style={{ width:52, height:52, objectFit:'cover' }} />
                <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
                    <a href="/home"    style={{ fontWeight:800, color:'#1c4f09', textDecoration:'none' }}>Home</a>
                    <a href="/pets"    style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Browse Pets</a>
                    <a href="/profile" style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Profile</a>
                    <button onClick={logout} style={{ fontWeight:800, color:'#fff', background:'#c06010', border:'none', borderRadius:50, padding:'0.45rem 1.3rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Welcome */}
            <div style={{ padding:'3rem 6vw 1.5rem' }}>
                <h1 style={{ fontSize:'clamp(2rem,3vw,3rem)', fontWeight:900, color:'#1a4a08', marginBottom:'0.5rem' }}>
                    Welcome back, {user?.firstName || 'Friend'}! 🐾
                </h1>
                <p style={{ fontWeight:600, color:'#3a6020', fontSize:'1rem' }}>
                    {user?.email} &nbsp;·&nbsp;
                    <span style={{ color: user?.status === 'approved' ? '#276010' : '#c87820', fontWeight:800, textTransform:'uppercase', fontSize:'0.8rem' }}>
                        {user?.status}
                    </span>
                </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display:'flex', gap:'1.5rem', padding:'1.5rem 6vw', flexWrap:'wrap' }}>
                {[
                    { href:'/pets',    icon:'🐶', label:'Browse Pets',      bg:'#1c4f09' },
                    { href:'/profile', icon:'👤', label:'My Profile',       bg:'#B45A22' },
                    { href:'/profile', icon:'📋', label:'My Applications',  bg:'#588B41' },
                ].map(({ href, icon, label, bg }) => (
                    <a key={label} href={href}
                        style={{ flex:'1 1 180px', maxWidth:220, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.8rem', padding:'2rem 1rem', background:bg, color:'#fff', borderRadius:20, textDecoration:'none', fontWeight:900, fontSize:'1rem', boxShadow:'0 6px 20px rgba(0,0,0,0.12)', transition:'transform 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <span style={{ fontSize:'2.2rem' }}>{icon}</span>
                        {label}
                    </a>
                ))}
            </div>

            {/* Featured Pets */}
            <div style={{ padding:'2rem 6vw' }}>
                <h2 style={{ fontWeight:900, color:'#1a4a08', fontSize:'1.4rem', marginBottom:'1.2rem' }}>Featured Pets Near You</h2>
                <div style={{ display:'flex', gap:'1.2rem', flexWrap:'wrap' }}>
                    {['Buddy','Luna','Max'].map((name, i) => (
                        <div key={name} style={{ flex:'1 1 200px', maxWidth:240, background:'rgba(255,248,225,0.7)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 16px rgba(160,105,30,0.1)' }}>
                            <div style={{ height:140, background:`hsl(${90+i*30},40%,75%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>🐾</div>
                            <div style={{ padding:'1rem' }}>
                                <h3 style={{ fontWeight:900, color:'#1a4a08', marginBottom:'0.3rem' }}>{name}</h3>
                                <p style={{ fontWeight:600, color:'#5a7a40', fontSize:'0.85rem' }}>Available for adoption</p>
                                <a href="/pets" style={{ display:'inline-block', marginTop:'0.7rem', fontWeight:800, color:'#fff', background:'#1c4f09', padding:'0.4rem 1rem', borderRadius:8, textDecoration:'none', fontSize:'0.85rem' }}>
                                    View Details
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}