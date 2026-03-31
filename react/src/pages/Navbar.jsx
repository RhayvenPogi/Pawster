import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_LINKS = [
  { to: '/home',         icon: 'fas fa-house',          label: 'Home'         },
  { to: '/pets',         icon: 'fas fa-search',          label: 'Find a Pet'   },
  { to: '/how-it-works', icon: 'fas fa-list-ol',         label: 'How It Works' },
  { to: '/rehome',       icon: 'fas fa-home',            label: 'Rehome'       },
  { to: '/missing-pets', icon: 'fas fa-search-location', label: 'Missing Pets' },
  { to: '/about',        icon: 'fas fa-info-circle',     label: 'About'        },
];

export default function Navbar({ photoUrl: externalPhotoUrl }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const photoUrl = externalPhotoUrl ?? user?.photoUrl ?? null;
  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? 'U')).toUpperCase();

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setDropOpen(false); }, [location.pathname]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Nunito:wght@700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        .paw-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          padding: 0 2.5rem;
          gap: 1rem;
          height: 70px;
          background: rgba(255,248,218,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(90,170,48,0.45);
          box-shadow: 0 2px 20px rgba(100,70,20,0.09);
        }

        /* Pill container — fixed width so it never reflows */
        .paw-nav-pill {
          display: flex;
          align-items: center;
          gap: 0;
          margin: 0 auto;
          background: rgba(255,245,210,0.5);
          border-radius: 50px;
          padding: 0.25rem;
          border: 1px solid rgba(180,140,60,0.28);
          /* Prevent any width change when active state changes */
          width: max-content;
          flex-shrink: 0;
        }

        .paw-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          /* Fixed padding — never changes between states */
          padding: 0.45rem 0.9rem;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
          color: #3a5020;
          background: transparent;
          transition: background 0.15s, color 0.15s;
          /* Prevent layout shift: same border always present, just transparent */
          border: 2px solid transparent;
          /* Fixed line-height & height so text never shifts */
          line-height: 1;
          height: 34px;
          box-sizing: border-box;
        }

        .paw-nav-link:hover {
          background: rgba(28,79,9,0.07);
          border-color: transparent;
        }

        .paw-nav-link.active {
          background: linear-gradient(135deg,rgba(28,79,9,0.16),rgba(90,170,48,0.12));
          color: #1a4a08;
          box-shadow: 0 2px 10px rgba(28,79,9,0.12);
          border-color: transparent;
        }

        .paw-nav-link.missing {
          background: rgba(180,90,34,0.09);
          color: #B45A22;
          border-color: transparent;
        }

        .paw-nav-link.missing:hover {
          background: rgba(180,90,34,0.15);
        }

        /* Dropdown */
        .paw-drop {
          position: absolute;
          top: calc(100% + 9px);
          right: 0;
          border-radius: 14px;
          border: 1px solid rgba(180,140,60,0.28);
          min-width: 220px;
          padding: 0.5rem;
          z-index: 999;
          background: rgba(255,252,235,0.99);
          box-shadow: 0 8px 40px rgba(100,70,20,0.22);
          animation: pawDropIn .18s ease both;
        }

        .paw-drop-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.52rem 0.65rem;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #3a5020;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          width: 100%;
          text-align: left;
          transition: background 0.15s;
        }

        .paw-drop-item:hover { background: rgba(28,79,9,0.07); }
        .paw-drop-item.danger { color: #c03030; }
        .paw-drop-item.danger:hover { background: rgba(192,48,48,0.07); }

        @keyframes pawDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        @media (max-width: 900px) { .paw-nav-pill { display: none !important; } }
        @media (max-width: 640px) { .paw-nav { padding: 0 1rem; } }
      `}</style>

      <nav className="paw-nav">
        {/* Brand */}
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1c4f09', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🐾</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', fontWeight: 900, color: '#1a4a08' }}>
            Paw<em style={{ fontStyle: 'italic', color: '#e07820' }}>ster</em>
          </span>
        </Link>

        {/* Nav pill — stable, no reflow */}
        <div className="paw-nav-pill">
          {NAV_LINKS.map(({ to, icon, label }) => {
            const isMissing = to === '/missing-pets';
            const isActive  = location.pathname === to;
            let cls = 'paw-nav-link';
            if (isActive) cls += ' active';
            else if (isMissing) cls += ' missing';
            return (
              <Link key={to} to={to} className={cls}>
                <i className={icon} style={{ fontSize: '0.70rem', flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
          {user ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 50, padding: '0.35rem 0.85rem', background: 'rgba(255,248,220,0.7)', border: '1px solid rgba(180,140,60,0.28)', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}
              >
                {photoUrl
                  ? <img src={photoUrl} alt="av" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #5aaa30' }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#3a8a18)', border: '2px solid #5aaa30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>{initials}</div>
                }
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.81rem', fontWeight: 800, color: '#1a4a08' }}>{user.firstName}</div>
                  <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#6a7a50' }}>Member</div>
                </div>
                <i className="fas fa-chevron-down" style={{ fontSize: '0.62rem', color: '#6a7a50', transition: 'transform 0.25s ease', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {dropOpen && (
                <div className="paw-drop">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.65rem 0.65rem' }}>
                    {photoUrl
                      ? <img src={photoUrl} alt="av" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #5aaa30', flexShrink: 0 }} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#2a7010)', border: '2px solid #5aaa30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{initials}</div>
                    }
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1a4a08', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ height: 1, margin: '0.15rem 0 0.3rem', background: 'rgba(180,140,60,0.22)' }} />

                  <Link to="/profile" className="paw-drop-item">
                    <i className="fas fa-th-large" style={{ width: 16, textAlign: 'center', color: '#1c4f09', fontSize: '0.78rem' }} />
                    Dashboard
                  </Link>
                  <Link to="/profile/edit" className="paw-drop-item">
                    <i className="fas fa-user" style={{ width: 16, textAlign: 'center', color: '#2060a0', fontSize: '0.78rem' }} />
                    My Profile
                  </Link>

                  <div style={{ height: 1, margin: '0.25rem 0', background: 'rgba(180,140,60,0.22)' }} />

                  <button onClick={logout} className="paw-drop-item danger">
                    <i className="fas fa-sign-out-alt" style={{ width: 16, textAlign: 'center', fontSize: '0.78rem' }} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 800, color: '#3a5020', background: 'rgba(255,250,232,0.7)', border: '1px solid rgba(180,140,60,0.28)', textDecoration: 'none' }}>
                <i className="fas fa-sign-in-alt" /> Log In
              </Link>
              <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 800, color: '#fff', background: '#1c4f09', border: '1px solid #1c4f09', textDecoration: 'none' }}>
                <i className="fas fa-paw" /> Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}