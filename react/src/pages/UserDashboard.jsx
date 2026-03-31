import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

/* ─── Reveal hook ─── */
function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}
function Reveal({ children, delay = 0, style: extraStyle = {} }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{ transition: 'opacity 0.65s ease, transform 0.65s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(22px)', ...extraStyle }}>
      {children}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon, iconBg, iconColor, value, label, delay }) {
  const [ref, vis] = useReveal();
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid ' + (hov ? 'rgba(90,170,48,0.40)' : 'rgba(180,140,60,0.28)'), borderRadius: 18, padding: '1.3rem 1.4rem', boxShadow: hov ? '0 8px 32px rgba(100,70,20,0.16)' : '0 3px 14px rgba(100,70,20,0.10)', transition: 'all 0.3s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(22px)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', marginBottom: '0.8rem' }}>
        <i className={icon} />
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.9rem', fontWeight: 900, color: '#1a4a08', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#6a7a50', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.28rem' }}>{label}</div>
    </div>
  );
}

/* ─── Application Row ─── */
function AppRow({ app }) {
  const STATUS = {
    approved: { bg: 'rgba(88,139,65,0.14)', color: '#276010', dot: '#5aaa30',  label: 'Approved' },
    pending:  { bg: 'rgba(212,136,10,0.14)', color: '#b07010', dot: '#e0a020', label: 'Pending'  },
    rejected: { bg: 'rgba(192,48,48,0.12)',  color: '#b03030', dot: '#c04040', label: 'Rejected' },
  };
  const st = STATUS[app.status] ?? STATUS.pending;
  const [hov, setHov] = useState(false);
  const emoji = app.emoji || (app.animalType === 'Cat' ? '🐈' : app.animalType === 'Rabbit' ? '🐇' : '🐕');
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.8rem 0.95rem', borderRadius: 13, background: hov ? 'rgba(28,79,9,0.05)' : 'rgba(255,252,238,0.60)', border: '1px solid ' + (hov ? 'rgba(90,170,48,0.25)' : 'rgba(200,170,100,0.22)'), transition: 'all 0.18s', transform: hov ? 'translateX(4px)' : 'translateX(0)', cursor: 'default' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#3a8a18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: '0.86rem', color: '#1a4a08', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.petName ?? app.animalName ?? 'Unknown Pet'}</div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50', marginTop: '0.08rem' }}>{app.breed ?? app.animalBreed ?? ''} · {app.date ?? app.createdAt ?? ''}</div>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.17rem 0.55rem', borderRadius: 50, fontSize: '0.60rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', background: st.bg, color: st.color, flexShrink: 0 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
        {st.label}
      </span>
    </div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ icon, iconColor, iconBg, title, desc, time, last }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0 }}>
          <i className={icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.83rem', color: '#1a4a08' }}>{title}</div>
          <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#6a7a50', marginTop: '0.07rem', lineHeight: 1.5 }}>{desc}</div>
        </div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9aaa80', flexShrink: 0, marginTop: '0.12rem' }}>{time}</div>
      </div>
      {!last && <div style={{ height: 1, background: 'rgba(180,140,60,0.13)', margin: '0.85rem 0' }} />}
    </div>
  );
}

/* ─── Quick Link ─── */
function QuickLink({ to, icon, iconBg, iconColor, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0.95rem', borderRadius: 13, background: hov ? 'rgba(28,79,9,0.07)' : 'rgba(255,252,238,0.60)', border: '1px solid ' + (hov ? 'rgba(90,170,48,0.32)' : 'rgba(200,170,100,0.22)'), transition: 'all 0.18s', transform: hov ? 'translateY(-2px)' : 'translateY(0)', cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
          <i className={icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: '0.83rem', color: '#1a4a08' }}>{title}</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50' }}>{desc}</div>
        </div>
        <i className="fas fa-chevron-right" style={{ fontSize: '0.58rem', color: '#9aaa80' }} />
      </div>
    </Link>
  );
}

/* ══════════════════════════ MAIN EXPORT ══════════════════════════ */
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps]   = useState(true);
  const [photoUrl, setPhotoUrl]         = useState(user?.photoUrl ?? null);

  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? 'U')).toUpperCase();

  /* Fetch applications */
  const fetchApps = useCallback(async () => {
    if (!user?.id) {
      setApplications([
        { id: 1, petName: 'Bruno',  breed: 'Labrador Mix', emoji: '🐕', date: 'Mar 12', status: 'approved' },
        { id: 2, petName: 'Luna',   breed: 'Tabby Cat',    emoji: '🐈', date: 'Mar 20', status: 'pending'  },
        { id: 3, petName: 'Coco',   breed: 'Rabbit',       emoji: '🐇', date: 'Mar 28', status: 'pending'  },
      ]);
      setLoadingApps(false);
      return;
    }
    setLoadingApps(true);
    try {
      const res = await fetch(`${API_BASE}/api/adoptions?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : (data.content ?? []));
      }
    } catch (_) {
      setApplications([
        { id: 1, petName: 'Bruno',  breed: 'Labrador Mix', emoji: '🐕', date: 'Mar 12', status: 'approved' },
        { id: 2, petName: 'Luna',   breed: 'Tabby Cat',    emoji: '🐈', date: 'Mar 20', status: 'pending'  },
      ]);
    }
    setLoadingApps(false);
  }, [user?.id]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  /* Poll every 30s */
  useEffect(() => {
    const id = setInterval(fetchApps, 30000);
    return () => clearInterval(id);
  }, [fetchApps]);

  /* Listen for photo updates from ProfilePage */
  useEffect(() => {
    const h = (e) => { if (e.detail?.photoUrl !== undefined) setPhotoUrl(e.detail.photoUrl); };
    window.addEventListener('pawster:photoUpdated', h);
    return () => window.removeEventListener('pawster:photoUpdated', h);
  }, []);

  const approved = applications.filter(a => a.status === 'approved').length;
  const pending  = applications.filter(a => a.status === 'pending').length;

  const ACTIVITY = [
    { icon: 'fas fa-heart',           iconColor: '#c03060', iconBg: 'rgba(192,48,96,0.12)',  title: 'Application Approved',     desc: 'Your application for Bruno has been approved!',  time: '2d ago'  },
    { icon: 'fas fa-file-alt',        iconColor: '#2060a0', iconBg: 'rgba(32,96,160,0.12)',  title: 'Application Submitted',    desc: 'You applied to adopt Luna the Tabby Cat.',       time: '4d ago'  },
    { icon: 'fas fa-search-location', iconColor: '#B45A22', iconBg: 'rgba(180,90,34,0.12)',  title: 'Missing Pet Report Filed', desc: 'You reported a found dog in Laoag City.',        time: '1wk ago' },
    { icon: 'fas fa-user-check',      iconColor: '#1c4f09', iconBg: 'rgba(28,79,9,0.12)',    title: 'Account Verified',         desc: 'Your Pawster account was successfully verified.', time: '2wk ago' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5%,8%)}  }
        @keyframes fl2    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8%,5%)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#eddabb} ::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
        @media(max-width:860px)  { .dash-main  { grid-template-columns:1fr !important } }
        @media(max-width:640px)  { .dash-stats { grid-template-columns:repeat(2,1fr) !important } .dash-pad { padding:1.75rem 1rem 3.5rem !important } }
        @media(max-width:380px)  { .dash-stats { grid-template-columns:1fr !important } }
      `}</style>

      {/* Mesh background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.40, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.33, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

      {/* Shared navbar — pass photoUrl so avatar stays in sync */}
      <Navbar photoUrl={photoUrl} />

      <div className="dash-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 1160, margin: '0 auto', padding: '2.75rem 2rem 5rem' }}>

        {/* Welcome header */}
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', borderRadius: 50, padding: '0.26rem 0.9rem', fontSize: '0.61rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '0.55rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
                <i className="fas fa-th-large" style={{ fontSize: '0.58rem' }} /> Member Dashboard
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.5rem,3vw,2.5rem)', fontWeight: 900, color: '#1a4a08', lineHeight: 1.1, margin: 0 }}>
                Welcome back, <em style={{ fontStyle: 'italic', color: '#e07820' }}>{user?.firstName}</em>! 🐾
              </h1>
              <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#3a5020', marginTop: '0.32rem' }}>Here's everything happening with your Pawster account.</p>
            </div>

            {/* Profile chip — links to /profile/edit */}
            <Link to="/profile/edit"
              style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 1rem', borderRadius: 14, background: 'rgba(255,248,225,0.90)', border: '1.5px solid rgba(180,140,60,0.30)', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 7px 24px rgba(100,70,20,0.17)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(100,70,20,0.10)'; }}>
              {photoUrl
                ? <img src={photoUrl} alt="av" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #5aaa30' }} />
                : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#3a8a18)', border: '2px solid #5aaa30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 900, color: '#fff' }}>{initials}</div>
              }
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 900, fontSize: '0.84rem', color: '#1a4a08' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50' }}>Edit profile →</div>
              </div>
            </Link>
          </div>
        </Reveal>

        {/* Stats row */}
        <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.85rem', marginBottom: '1.75rem' }}>
          <StatCard icon="fas fa-file-alt"        iconBg="rgba(28,79,9,0.12)"    iconColor="#1c4f09" value={applications.length} label="Applications"    delay={0}   />
          <StatCard icon="fas fa-heart"           iconBg="rgba(192,48,96,0.12)"  iconColor="#c03060" value={approved}            label="Approved"        delay={70}  />
          <StatCard icon="fas fa-clock"           iconBg="rgba(212,136,10,0.12)" iconColor="#d4880a" value={pending}             label="Pending"         delay={140} />
          <StatCard icon="fas fa-search-location" iconBg="rgba(180,90,34,0.12)"  iconColor="#B45A22" value="1"                   label="Missing Reports"  delay={210} />
        </div>

        {/* Main panels */}
        <div className="dash-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>

          {/* Applications */}
          <Reveal delay={60}>
            <div style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 22px rgba(100,70,20,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 900, color: '#1a4a08' }}>My Applications</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50' }}>Your adoption requests</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button onClick={fetchApps} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(180,140,60,0.28)', background: 'rgba(255,252,238,0.7)', color: '#6a7a50', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }} title="Refresh">
                    <i className={loadingApps ? 'fas fa-spinner' : 'fas fa-rotate-right'} style={loadingApps ? { animation: 'spin 0.8s linear infinite' } : {}} />
                  </button>
                  <Link to="/pets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.22rem', padding: '0.34rem 0.7rem', borderRadius: 7, fontSize: '0.68rem', fontWeight: 800, color: '#1c4f09', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', textDecoration: 'none' }}>
                    <i className="fas fa-plus" style={{ fontSize: '0.55rem' }} /> Apply
                  </Link>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {loadingApps
                  ? Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 54, borderRadius: 13, background: 'rgba(180,140,60,0.09)' }} />)
                  : applications.length > 0
                    ? applications.map((app, i) => <AppRow key={app.id ?? i} app={app} />)
                    : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#7a9060', fontWeight: 700, fontSize: '0.84rem' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>🐾</div>
                        No applications yet.<br />
                        <Link to="/pets" style={{ color: '#1c4f09', fontWeight: 900 }}>Browse pets</Link> to get started!
                      </div>
                    )
                }
              </div>
            </div>
          </Reveal>

          {/* Recent Activity */}
          <Reveal delay={120}>
            <div style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 22px rgba(100,70,20,0.10)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.12rem' }}>Recent Activity</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50', marginBottom: '1rem' }}>Your latest actions on Pawster</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ACTIVITY.map((a, i) => <ActivityItem key={i} {...a} last={i === ACTIVITY.length - 1} />)}
              </div>
            </div>
          </Reveal>

          {/* Quick Actions */}
          <Reveal delay={90}>
            <div style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 22px rgba(100,70,20,0.10)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.12rem' }}>Quick Actions</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50', marginBottom: '1rem' }}>Jump to where you need to go</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <QuickLink to="/pets"          icon="fas fa-search"          iconBg="rgba(28,79,9,0.12)"    iconColor="#1c4f09" title="Browse Animals"  desc="Find your forever companion"    />
                <QuickLink to="/rehome"        icon="fas fa-home"            iconBg="rgba(180,90,34,0.12)"  iconColor="#B45A22" title="Rehome a Pet"    desc="Find a loving new home"          />
                <QuickLink to="/missing-pets"  icon="fas fa-search-location" iconBg="rgba(212,136,10,0.12)" iconColor="#d4880a" title="Missing Pets"    desc="Report or search lost animals"   />
                <QuickLink to="/how-it-works"  icon="fas fa-list-ol"         iconBg="rgba(32,96,160,0.12)"  iconColor="#2060a0" title="How It Works"    desc="Learn about adoption steps"      />
                <QuickLink to="/profile/edit"  icon="fas fa-user"            iconBg="rgba(112,64,176,0.12)" iconColor="#7040b0" title="Edit Profile"    desc="Update info, photo & password"   />
              </div>
            </div>
          </Reveal>

          {/* Tips */}
          <Reveal delay={180}>
            <div style={{ background: 'linear-gradient(135deg,rgba(28,79,9,0.09),rgba(90,170,48,0.06))', border: '1px solid rgba(90,170,48,0.28)', borderRadius: 20, padding: '1.4rem', boxShadow: '0 4px 22px rgba(28,79,9,0.07)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.12rem' }}>Adoption Tips</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50', marginBottom: '1rem' }}>Get the most out of Pawster</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {[
                  { emoji: '📋', tip: 'Complete your profile',  desc: 'A detailed profile increases your approval chances.' },
                  { emoji: '🔔', tip: 'Check back often',        desc: 'New animals are listed daily across all 4 provinces.'  },
                  { emoji: '💬', tip: 'Be responsive',           desc: 'Quick replies speed up your review process.'           },
                  { emoji: '🏡', tip: 'Prepare your home',       desc: "Pet-proof your space before your companion arrives."   },
                ].map(({ emoji, tip, desc }) => (
                  <div key={tip} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{emoji}</span>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.81rem', color: '#1a4a08' }}>{tip}</div>
                      <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#3a5020', marginTop: '0.08rem', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', marginTop: '1.1rem', padding: '0.52rem 1.05rem', borderRadius: 9, fontSize: '0.74rem', fontWeight: 900, color: '#1c4f09', background: 'rgba(255,248,220,0.82)', border: '1px solid rgba(90,170,48,0.28)', textDecoration: 'none' }}>
                <i className="fas fa-arrow-right" style={{ fontSize: '0.58rem' }} /> Full Adoption Guide
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(90,170,48,0.45)', padding: '2.5rem 2rem 1.75rem', background: 'rgba(255,248,218,0.85)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '2.5rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1c4f09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', marginBottom: '0.6rem' }}>🐾</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '1.05rem', color: '#1a4a08', marginBottom: '0.35rem' }}>Paw<em style={{ fontStyle: 'italic', color: '#e07820' }}>ster</em></div>
            <p style={{ fontSize: '0.76rem', fontWeight: 700, lineHeight: 1.7, color: '#6a7a50', maxWidth: 220 }}>Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
          </div>
          {[
            { title: 'Adopt',    links: [['Browse Animals', '/pets'], ['Dashboard', '/profile'], ['Log In', '/login']] },
            { title: 'Services', links: [['How It Works', '/how-it-works'], ['Rehome a Pet', '/rehome'], ['Missing Pets', '/missing-pets'], ['About Us', '/about']] },
            { title: 'Regions',  links: [['Ilocos Norte', '/pets'], ['Ilocos Sur', '/pets'], ['La Union', '/pets'], ['Pangasinan', '/pets']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#1c4f09', marginBottom: '0.85rem' }}>{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3a5020', textDecoration: 'none', marginBottom: '0.42rem' }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1160, margin: '0 auto', paddingTop: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid rgba(180,140,60,0.22)' }}>
          <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#6a7a50' }}>© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['fab fa-facebook-f', 'fab fa-instagram', 'fab fa-twitter'].map(icon => (
              <a key={icon} href="#" style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#6a7a50', background: 'rgba(255,250,232,0.7)', border: '1px solid rgba(180,140,60,0.28)', textDecoration: 'none' }}>
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}