import { useAuth } from '../hooks/useAuth';

const STATUS_COLOR = { approved:'#276010', pending:'#c87820', rejected:'#b83030' };
const STATUS_BG    = { approved:'rgba(230,245,220,0.9)', pending:'rgba(255,243,220,0.9)', rejected:'rgba(253,232,232,0.9)' };

export default function UserDashboard() {
    const { user, logout } = useAuth();

    return (
        <div style={{ minHeight:'100vh', background:'#EDDABB', fontFamily:"'Nunito',sans-serif" }}>

            {/* Navbar */}
            <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 4vw', background:'rgba(237,218,187,0.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(200,170,100,0.3)', position:'sticky', top:0, zIndex:100 }}>
                <img src="/images/logo.png" alt="Pawster" style={{ width:52, height:52, objectFit:'cover' }} />
                <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
                    <a href="/home"         style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Home</a>
                    <a href="/pets"         style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Find a Pet</a>
                    <a href="/how-it-works" style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>How It Works</a>
                    <a href="/rehome"       style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Rehome</a>
                    <a href="/missing-pets" style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Missing Pets</a>
                    <a href="/about"        style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>About</a>
                    <a href="/profile"      style={{ fontWeight:800, color:'#1c4f09', textDecoration:'none' }}>Profile</a>
                    <button onClick={logout} style={{ fontWeight:800, color:'#fff', background:'#c06010', border:'none', borderRadius:50, padding:'0.45rem 1.3rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                        Logout
                    </button>
                </div>
            </nav>

            <div style={{ padding:'3rem 6vw', maxWidth:900, margin:'0 auto' }}>
                <h1 style={{ fontWeight:900, color:'#1a4a08', fontSize:'clamp(1.8rem,3vw,2.4rem)', marginBottom:'2rem' }}>My Profile</h1>

                {/* Profile Card */}
                <div style={{ background:'rgba(255,248,225,0.7)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:20, padding:'2rem', boxShadow:'0 4px 20px rgba(160,105,30,0.1)', marginBottom:'1.5rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
                        <div style={{ width:80, height:80, borderRadius:'50%', background:'#1c4f09', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', color:'#fff', fontWeight:900, flexShrink:0 }}>
                            {(user?.firstName?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontWeight:900, color:'#1a4a08', fontSize:'1.4rem', marginBottom:'0.3rem' }}>
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <p style={{ fontWeight:600, color:'#5a7a40', fontSize:'0.9rem', marginBottom:'0.4rem' }}>{user?.email}</p>
                            <span style={{ fontWeight:800, fontSize:'0.78rem', textTransform:'uppercase', color:'#fff', background: STATUS_COLOR[user?.status] ?? '#888', padding:'0.25rem 0.75rem', borderRadius:50 }}>
                                {user?.status}
                            </span>
                        </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
                        {[
                            { label:'Role',   value: user?.role   },
                            { label:'Status', value: user?.status },
                            { label:'Email',  value: user?.email  },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background:'rgba(255,252,238,0.6)', borderRadius:12, padding:'1rem', border:'1px solid rgba(200,170,100,0.3)' }}>
                                <p style={{ fontWeight:800, color:'#5a7a40', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>{label}</p>
                                <p style={{ fontWeight:700, color:'#1a4a08', fontSize:'0.95rem', textTransform:'capitalize' }}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Applications Placeholder */}
                <div style={{ background:'rgba(255,248,225,0.7)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:20, padding:'2rem', boxShadow:'0 4px 20px rgba(160,105,30,0.1)' }}>
                    <h3 style={{ fontWeight:900, color:'#1a4a08', marginBottom:'1rem' }}>My Adoption Applications</h3>
                    <div style={{ textAlign:'center', padding:'2rem', color:'#7a9060', fontWeight:700 }}>
                        <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🐾</div>
                        No applications yet. <a href="/pets" style={{ color:'#1c4f09', fontWeight:800 }}>Browse pets</a> to get started!
                    </div>
                </div>
            </div>
        </div>
    );
}