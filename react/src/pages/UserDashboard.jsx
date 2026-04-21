import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import logo from "../images/logo.png";

const API_BASE   = import.meta.env.VITE_API_BASE   ?? 'http://localhost:8000';
const DJANGO     = import.meta.env.VITE_DJANGO_API ?? 'http://localhost:8000';

// ── Polling intervals ─────────────────────────────────────────────────────────
const POLL_APPS      = 30_000;   // applications every 30s
const POLL_ACTIVITY  = 45_000;   // activity feed every 45s
const POLL_STATS     = 60_000;   // chart stats every 60s

function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function apiFetch(base, path, opts = {}) {
  const token = getToken();
  return fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
}

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

/* ─── Live badge ─── */
function LiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.15rem 0.45rem', borderRadius: 50, background: 'rgba(90,170,48,0.12)', border: '1px solid rgba(90,170,48,0.28)', fontSize: '0.58rem', fontWeight: 900, color: '#1c7a09', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5aaa30', display: 'inline-block', animation: 'pdot 2s ease infinite' }} />
      Live
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon, iconBg, iconColor, value, label, delay, sublabel }) {
  const [ref, vis] = useReveal();
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid ' + (hov ? 'rgba(90,170,48,0.40)' : 'rgba(180,140,60,0.28)'), borderRadius: 18, padding: '1.1rem 1.2rem', boxShadow: hov ? '0 8px 32px rgba(100,70,20,0.16)' : '0 3px 14px rgba(100,70,20,0.10)', transition: 'all 0.3s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(22px)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', marginBottom: '0.7rem' }}>
        <i className={icon} />
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.75rem', fontWeight: 900, color: '#1a4a08', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6a7a50', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.25rem' }}>{label}</div>
      {sublabel && <div style={{ fontSize: '0.62rem', fontWeight: 700, color: iconColor, marginTop: '0.15rem' }}>{sublabel}</div>}
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
      style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 0.9rem', borderRadius: 13, background: hov ? 'rgba(28,79,9,0.05)' : 'rgba(255,252,238,0.60)', border: '1px solid ' + (hov ? 'rgba(90,170,48,0.25)' : 'rgba(200,170,100,0.22)'), transition: 'all 0.18s', transform: hov ? 'translateX(4px)' : 'translateX(0)', cursor: 'default' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#3a8a18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: '0.84rem', color: '#1a4a08', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.petName ?? app.animalName ?? 'Unknown Pet'}</div>
        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50', marginTop: '0.06rem' }}>{app.breed ?? app.animalBreed ?? ''} · {app.date ?? app.createdAt ?? ''}</div>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: 50, fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', background: st.bg, color: st.color, flexShrink: 0 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
        {st.label}
      </span>
    </div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ icon, iconColor, iconBg, title, desc, time, last, isNew }) {
  return (
    <div style={{ position: 'relative' }}>
      {isNew && (
        <span style={{ position: 'absolute', top: 4, right: 0, fontSize: '0.55rem', fontWeight: 900, color: '#1c7a09', background: 'rgba(90,170,48,0.12)', borderRadius: 50, padding: '1px 5px', border: '1px solid rgba(90,170,48,0.28)' }}>NEW</span>
      )}
      <div style={{ display: 'flex', gap: '0.72rem', alignItems: 'flex-start' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', flexShrink: 0 }}>
          <i className={icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.81rem', color: '#1a4a08' }}>{title}</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50', marginTop: '0.06rem', lineHeight: 1.5 }}>{desc}</div>
        </div>
        <div style={{ fontSize: '0.60rem', fontWeight: 700, color: '#9aaa80', flexShrink: 0, marginTop: '0.1rem' }}>{time}</div>
      </div>
      {!last && <div style={{ height: 1, background: 'rgba(180,140,60,0.13)', margin: '0.75rem 0' }} />}
    </div>
  );
}

/* ─── Quick Link ─── */
function QuickLink({ to, icon, iconBg, iconColor, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 13, background: hov ? 'rgba(28,79,9,0.07)' : 'rgba(255,252,238,0.60)', border: '1px solid ' + (hov ? 'rgba(90,170,48,0.32)' : 'rgba(200,170,100,0.22)'), transition: 'all 0.18s', transform: hov ? 'translateY(-2px)' : 'translateY(0)', cursor: 'pointer' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', flexShrink: 0 }}>
          <i className={icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: '0.81rem', color: '#1a4a08' }}>{title}</div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50' }}>{desc}</div>
        </div>
        <i className="fas fa-chevron-right" style={{ fontSize: '0.55rem', color: '#9aaa80' }} />
      </div>
    </Link>
  );
}

/* ─── SVG Bar Chart ─── */
function BarChart({ data, title, subtitle, color, icon }) {
  const max    = Math.max(...data.map(d => d.value), 1);
  const W      = 280;
  const H      = 100;
  const barW   = Math.floor((W - (data.length - 1) * 6) / data.length);
  const [hov, setHov] = useState(null);

  return (
    <div style={{ padding: '1rem 1.1rem 0.8rem', borderRadius: 16, background: 'rgba(255,252,238,0.7)', border: '1px solid rgba(180,140,60,0.22)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '0.7rem' }}>
          <i className={icon} />
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: '0.78rem', color: '#1a4a08' }}>{title}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9aaa80' }}>{subtitle}</div>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const barH  = max > 0 ? (d.value / max) * H : 0;
          const x     = i * (barW + 6);
          const y     = H - barH;
          const isHov = hov === i;
          return (
            <g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ cursor: 'default' }}>
              {/* bg bar */}
              <rect x={x} y={0} width={barW} height={H} rx={4} fill="rgba(180,140,60,0.07)" />
              {/* value bar */}
              <rect x={x} y={y} width={barW} height={barH} rx={4}
                fill={isHov ? color : `${color}99`}
                style={{ transition: 'fill 0.15s, y 0.4s, height 0.4s' }} />
              {/* value tooltip on hover */}
              {isHov && d.value > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="900" fill={color}>{d.value}</text>
              )}
              {/* x label */}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="8" fontWeight="700" fill="#9aaa80">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── SVG Donut Chart ─── */
function DonutChart({ segments, title, total }) {
  const R  = 38;
  const cx = 50;
  const cy = 50;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const [hov, setHov] = useState(null);

  return (
    <div style={{ padding: '1rem 1.1rem 0.8rem', borderRadius: 16, background: 'rgba(255,252,238,0.7)', border: '1px solid rgba(180,140,60,0.22)' }}>
      <div style={{ fontWeight: 900, fontSize: '0.78rem', color: '#1a4a08', marginBottom: '0.6rem' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* bg ring */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(180,140,60,0.12)" strokeWidth="12" />
          {segments.map((seg, i) => {
            const len  = (seg.value / Math.max(total, 1)) * circ;
            const dash = `${len} ${circ - len}`;
            const el   = (
              <circle key={i} cx={cx} cy={cy} r={R} fill="none"
                stroke={hov === i ? seg.color : seg.color + 'cc'}
                strokeWidth={hov === i ? 14 : 12}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-width 0.15s', cursor: 'pointer' }}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
              />
            );
            offset += len;
            return el;
          })}
          {/* center text */}
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="900" fill="#1a4a08">{total}</text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7" fontWeight="800" fill="#9aaa80">TOTAL</text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {segments.map((seg, i) => (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'default', opacity: hov !== null && hov !== i ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#3a5020', flex: 1 }}>{seg.label}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: seg.color }}>{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sparkline ─── */
function Sparkline({ values, color }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W   = 80;
  const H   = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* last dot */}
      <circle cx={(W)} cy={H - (values[values.length - 1] / max) * H} r="2.5" fill={color} />
    </svg>
  );
}

/* ── timeAgo helper ── */
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* ══════════════════════════ MAIN EXPORT ══════════════════════════ */
export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [applications,  setApplications]  = useState([]);
  const [loadingApps,   setLoadingApps]   = useState(true);
  const [activityFeed,  setActivityFeed]  = useState([]);
  const [loadingAct,    setLoadingAct]    = useState(true);
  const [photoUrl,      setPhotoUrl]      = useState(user?.photoUrl ?? null);
  const [newActivityIds, setNewActivityIds] = useState(new Set());

  // Chart / stats state
  const [adoptionStats,  setAdoptionStats]  = useState({ monthly: [], status: { approved: 0, pending: 0, rejected: 0 }, total: 0 });
  const [rehomeStats,    setRehomeStats]    = useState({ monthly: [], total: 0 });
  const [missingStats,   setMissingStats]   = useState({ monthly: [], total: 0, found: 0 });

  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? 'U')).toUpperCase();

  // ── MOCK DATA helpers (replace with real API calls) ───────────────────────
  const MOCK_APPS = [
    { id: 1, petName: 'Bruno',  breed: 'Labrador Mix', emoji: '🐕', date: 'Mar 12', status: 'approved' },
    { id: 2, petName: 'Luna',   breed: 'Tabby Cat',    emoji: '🐈', date: 'Mar 20', status: 'pending'  },
    { id: 3, petName: 'Coco',   breed: 'Rabbit',       emoji: '🐇', date: 'Mar 28', status: 'pending'  },
  ];

  const MOCK_ACTIVITY = [
    { id: 'a1', icon: 'fas fa-heart',           iconColor: '#c03060', iconBg: 'rgba(192,48,96,0.12)',  title: 'Application Approved',      desc: 'Your application for Bruno has been approved!',  time: '2d ago',  createdAt: new Date(Date.now() - 2*86400000).toISOString() },
    { id: 'a2', icon: 'fas fa-file-alt',        iconColor: '#2060a0', iconBg: 'rgba(32,96,160,0.12)',  title: 'Application Submitted',     desc: 'You applied to adopt Luna the Tabby Cat.',       time: '4d ago',  createdAt: new Date(Date.now() - 4*86400000).toISOString() },
    { id: 'a3', icon: 'fas fa-home',            iconColor: '#B45A22', iconBg: 'rgba(180,90,34,0.12)',  title: 'Rehome Listing Created',    desc: 'You listed Mochi the Shih Tzu for rehoming.',    time: '5d ago',  createdAt: new Date(Date.now() - 5*86400000).toISOString() },
    { id: 'a4', icon: 'fas fa-search-location', iconColor: '#d4880a', iconBg: 'rgba(212,136,10,0.12)', title: 'Missing Pet Report Filed',  desc: 'You reported a found dog in Laoag City.',        time: '1wk ago', createdAt: new Date(Date.now() - 7*86400000).toISOString() },
    { id: 'a5', icon: 'fas fa-user-check',      iconColor: '#1c4f09', iconBg: 'rgba(28,79,9,0.12)',    title: 'Account Verified',          desc: 'Your Pawster account was successfully verified.', time: '2wk ago', createdAt: new Date(Date.now() - 14*86400000).toISOString() },
  ];

  // ── Fetch applications ────────────────────────────────────────────────────
  const prevAppIds = useRef(new Set());

  const fetchApps = useCallback(async () => {
    if (!user?.id) {
      setApplications(MOCK_APPS);
      setLoadingApps(false);
      return;
    }
    try {
      const res = await apiFetch(API_BASE, `/api/adoptions?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.content ?? []);
        setApplications(list);
      }
    } catch {
      setApplications(MOCK_APPS);
    }
    setLoadingApps(false);
  }, [user?.id]);

  // ── Fetch activity feed ───────────────────────────────────────────────────
  const prevActIds = useRef(new Set());

  const fetchActivity = useCallback(async (isFirst = false) => {
    if (!user?.id) {
      setActivityFeed(MOCK_ACTIVITY);
      setLoadingAct(false);
      return;
    }
    try {
      const res = await apiFetch(DJANGO, `/api/activity/?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.results ?? data.data ?? data ?? MOCK_ACTIVITY;

        // Detect newly appeared items
        if (!isFirst) {
          const newIds = new Set();
          list.forEach(item => {
            if (!prevActIds.current.has(String(item.id))) newIds.add(String(item.id));
          });
          if (newIds.size > 0) {
            setNewActivityIds(newIds);
            setTimeout(() => setNewActivityIds(new Set()), 6000);
          }
        }

        prevActIds.current = new Set(list.map(i => String(i.id)));
        setActivityFeed(list.slice(0, 8));
      }
    } catch {
      setActivityFeed(MOCK_ACTIVITY);
    }
    setLoadingAct(false);
  }, [user?.id]);

  // ── Fetch chart stats ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      // Mock chart data
      const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      setAdoptionStats({
        monthly: months.map((label, i) => ({ label, value: [0, 1, 0, 2, 1, 3][i] })),
        status: { approved: 1, pending: 2, rejected: 0 },
        total: 3,
      });
      setRehomeStats({
        monthly: months.map((label, i) => ({ label, value: [0, 0, 1, 0, 1, 0][i] })),
        total: 2,
      });
      setMissingStats({
        monthly: months.map((label, i) => ({ label, value: [0, 0, 0, 1, 0, 1][i] })),
        total: 2,
        found: 1,
      });
      return;
    }

    try {
      const [adoptRes, rehomeRes, missingRes] = await Promise.allSettled([
        apiFetch(API_BASE, `/api/adoptions/stats?userId=${user.id}`),
        apiFetch(API_BASE, `/api/rehome/stats?userId=${user.id}`),
        apiFetch(API_BASE, `/api/missing-pets/stats?userId=${user.id}`),
      ]);

      if (adoptRes.status === 'fulfilled' && adoptRes.value.ok) {
        const d = await adoptRes.value.json();
        setAdoptionStats(d);
      }
      if (rehomeRes.status === 'fulfilled' && rehomeRes.value.ok) {
        const d = await rehomeRes.value.json();
        setRehomeStats(d);
      }
      if (missingRes.status === 'fulfilled' && missingRes.value.ok) {
        const d = await missingRes.value.json();
        setMissingStats(d);
      }
    } catch { /* use mock */ }
  }, [user?.id]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingApps(true);
    setLoadingAct(true);
    fetchApps();
    fetchActivity(true);
    fetchStats();
  }, [fetchApps, fetchActivity, fetchStats]);

  // ── Separate polling intervals ────────────────────────────────────────────
  useEffect(() => {
    const idApps = setInterval(fetchApps,     POLL_APPS);
    const idAct  = setInterval(() => fetchActivity(false), POLL_ACTIVITY);
    const idStat = setInterval(fetchStats,    POLL_STATS);
    return () => {
      clearInterval(idApps);
      clearInterval(idAct);
      clearInterval(idStat);
    };
  }, [fetchApps, fetchActivity, fetchStats]);

  // ── Photo sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.detail?.photoUrl !== undefined) setPhotoUrl(e.detail.photoUrl); };
    window.addEventListener('pawster:photoUpdated', h);
    return () => window.removeEventListener('pawster:photoUpdated', h);
  }, []);

  const approved = applications.filter(a => a.status === 'approved').length;
  const pending  = applications.filter(a => a.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5%,8%)}  }
        @keyframes fl2    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8%,5%)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pdot   { 0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.4)} 50%{box-shadow:0 0 0 5px rgba(90,170,48,0)} }
        @keyframes newPop { 0%{transform:scale(1.04);background:rgba(90,170,48,0.10)} 100%{transform:scale(1);background:transparent} }
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#eddabb} ::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
        @media(max-width:900px)  { .dash-main  { grid-template-columns:1fr !important } }
        @media(max-width:640px)  { .dash-stats { grid-template-columns:repeat(2,1fr) !important } .dash-pad { padding:1.5rem 1rem 3rem !important } }
        @media(max-width:380px)  { .dash-stats { grid-template-columns:1fr !important } }
      `}</style>

      {/* Mesh background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.40, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.33, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

     

      <div className="dash-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 1160, margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* Welcome header */}
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', borderRadius: 50, padding: '0.26rem 0.9rem', fontSize: '0.61rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '0.5rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
                <i className="fas fa-th-large" style={{ fontSize: '0.58rem' }} /> Member Dashboard
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.4rem,3vw,2.4rem)', fontWeight: 900, color: '#1a4a08', lineHeight: 1.1, margin: 0 }}>
                Welcome back, <em style={{ fontStyle: 'italic', color: '#e07820' }}>{user?.firstName}</em>! 🐾
              </h1>
              <p style={{ fontSize: '0.84rem', fontWeight: 700, color: '#3a5020', marginTop: '0.28rem' }}>
                Dashboard updates live — no refresh needed.{' '}<LiveDot />
              </p>
            </div>

            {/* Profile chip */}
            <Link to="/profile/edit"
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.95rem', borderRadius: 14, background: 'rgba(255,248,225,0.90)', border: '1.5px solid rgba(180,140,60,0.30)', boxShadow: '0 3px 14px rgba(100,70,20,0.10)', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 7px 24px rgba(100,70,20,0.17)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(100,70,20,0.10)'; }}>
              {photoUrl
                ? <img src={photoUrl} alt="av" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #5aaa30' }} />
                : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#3a8a18)', border: '2px solid #5aaa30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>{initials}</div>
              }
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 900, fontSize: '0.82rem', color: '#1a4a08' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#6a7a50' }}>Edit profile →</div>
              </div>
            </Link>
          </div>
        </Reveal>

        {/* Stats row */}
        <div className="dash-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
          <StatCard icon="fas fa-file-alt"        iconBg="rgba(28,79,9,0.12)"    iconColor="#1c4f09" value={applications.length} label="Applications"    delay={0}   sublabel={`${approved} approved`} />
          <StatCard icon="fas fa-home"            iconBg="rgba(180,90,34,0.12)"  iconColor="#B45A22" value={rehomeStats.total}   label="Rehome Listings" delay={60}  sublabel="all time" />
          <StatCard icon="fas fa-search-location" iconBg="rgba(212,136,10,0.12)" iconColor="#d4880a" value={missingStats.total}  label="Missing Reports"  delay={120} sublabel={`${missingStats.found} found`} />
          <StatCard icon="fas fa-clock"           iconBg="rgba(26,95,191,0.12)"  iconColor="#1a5fbf" value={pending}             label="Pending"         delay={180} sublabel="awaiting review" />
        </div>

        {/* ── Charts row ─────────────────────────────────────────────────── */}
        <Reveal delay={80}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>

            {/* Adoptions bar chart */}
            <BarChart
              data={adoptionStats.monthly}
              title="Adoptions"
              subtitle="Last 6 months"
              color="#1c7a09"
              icon="fas fa-file-alt"
            />

            {/* Adoption status donut */}
            <DonutChart
              title="Application Status"
              total={adoptionStats.total}
              segments={[
                { label: 'Approved', value: adoptionStats.status.approved, color: '#5aaa30' },
                { label: 'Pending',  value: adoptionStats.status.pending,  color: '#e0a020' },
                { label: 'Rejected', value: adoptionStats.status.rejected, color: '#c04040' },
              ]}
            />

            {/* Rehome bar chart */}
            <BarChart
              data={rehomeStats.monthly}
              title="Rehome Listings"
              subtitle="Last 6 months"
              color="#B45A22"
              icon="fas fa-home"
            />

            {/* Missing reports donut */}
            <DonutChart
              title="Missing Reports"
              total={missingStats.total}
              segments={[
                { label: 'Still Missing', value: missingStats.total - missingStats.found, color: '#d4880a' },
                { label: 'Found / Closed', value: missingStats.found, color: '#5aaa30' },
              ]}
            />
          </div>
        </Reveal>

        {/* Main panels */}
        <div className="dash-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Applications */}
          <Reveal delay={60}>
            <div style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '1.3rem', boxShadow: '0 4px 22px rgba(100,70,20,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 900, color: '#1a4a08' }}>My Applications</div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Your adoption requests · <LiveDot />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.32rem', alignItems: 'center' }}>
                  <button onClick={fetchApps} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(180,140,60,0.28)', background: 'rgba(255,252,238,0.7)', color: '#6a7a50', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem' }} title="Refresh">
                    <i className={loadingApps ? 'fas fa-spinner' : 'fas fa-rotate-right'} style={loadingApps ? { animation: 'spin 0.8s linear infinite' } : {}} />
                  </button>
                  <Link to="/pets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.3rem 0.65rem', borderRadius: 7, fontSize: '0.66rem', fontWeight: 800, color: '#1c4f09', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', textDecoration: 'none' }}>
                    <i className="fas fa-plus" style={{ fontSize: '0.52rem' }} /> Apply
                  </Link>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {loadingApps
                  ? Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 52, borderRadius: 13, background: 'rgba(180,140,60,0.09)' }} />)
                  : applications.length > 0
                    ? applications.map((app, i) => <AppRow key={app.id ?? i} app={app} />)
                    : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#7a9060', fontWeight: 700, fontSize: '0.82rem' }}>
                        <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>🐾</div>
                        No applications yet.<br />
                        <Link to="/pets" style={{ color: '#1c4f09', fontWeight: 900 }}>Browse pets</Link> to get started!
                      </div>
                    )
                }
              </div>
            </div>
          </Reveal>

          {/* Recent Activity — live polled */}
          <Reveal delay={120}>
            <div style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '1.3rem', boxShadow: '0 4px 22px rgba(100,70,20,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 900, color: '#1a4a08' }}>Recent Activity</div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Updates every 45s · <LiveDot />
                  </div>
                </div>
                <button onClick={() => fetchActivity(false)} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(180,140,60,0.28)', background: 'rgba(255,252,238,0.7)', color: '#6a7a50', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem' }} title="Refresh activity">
                  <i className={loadingAct ? 'fas fa-spinner' : 'fas fa-rotate-right'} style={loadingAct ? { animation: 'spin 0.8s linear infinite' } : {}} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 340, overflowY: 'auto', paddingRight: '0.25rem' }}>
                {loadingAct
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 42, borderRadius: 10, background: 'rgba(180,140,60,0.09)', marginBottom: '0.6rem' }} />)
                  : activityFeed.length > 0
                    ? activityFeed.map((a, i) => (
                        <div key={a.id ?? i}
                          style={{ borderRadius: 10, transition: 'background 0.4s', animation: newActivityIds.has(String(a.id)) ? 'newPop 1.2s ease both' : 'none' }}>
                          <ActivityItem
                            {...a}
                            time={a.time ?? timeAgo(a.createdAt)}
                            last={i === activityFeed.length - 1}
                            isNew={newActivityIds.has(String(a.id))}
                          />
                        </div>
                      ))
                    : <div style={{ textAlign: 'center', padding: '2rem', color: '#9aaa80', fontWeight: 700, fontSize: '0.8rem' }}>No activity yet.</div>
                }
              </div>
            </div>
          </Reveal>

          {/* Quick Actions */}
          <Reveal delay={90}>
            <div style={{ background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, padding: '1.3rem', boxShadow: '0 4px 22px rgba(100,70,20,0.10)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.1rem' }}>Quick Actions</div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50', marginBottom: '0.9rem' }}>Jump to where you need to go</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <QuickLink to="/pets"               icon="fas fa-search"          iconBg="rgba(28,79,9,0.12)"    iconColor="#1c4f09" title="Browse Animals"      desc="Find your forever companion"    />
                <QuickLink to="/rehome"             icon="fas fa-home"            iconBg="rgba(180,90,34,0.12)"  iconColor="#B45A22" title="Rehome a Pet"        desc="Find a loving new home"          />
                <QuickLink to="/missing-pets"       icon="fas fa-search-location" iconBg="rgba(212,136,10,0.12)" iconColor="#d4880a" title="Missing Pets"        desc="Report or search lost animals"   />
                <QuickLink to="/follow-up-surveys"  icon="fas fa-clipboard-list"  iconBg="rgba(26,95,191,0.12)"  iconColor="#1a5fbf" title="Follow-Up Surveys"   desc="Check in on your adopted pet"    />
                <QuickLink to="/profile/edit"       icon="fas fa-user"            iconBg="rgba(112,64,176,0.12)" iconColor="#7040b0" title="Edit Profile"        desc="Update info, photo & password"   />
              </div>
            </div>
          </Reveal>

          {/* Tips */}
          <Reveal delay={180}>
            <div style={{ background: 'linear-gradient(135deg,rgba(28,79,9,0.09),rgba(90,170,48,0.06))', border: '1px solid rgba(90,170,48,0.28)', borderRadius: 20, padding: '1.3rem', boxShadow: '0 4px 22px rgba(28,79,9,0.07)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.1rem' }}>Adoption Tips</div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6a7a50', marginBottom: '0.9rem' }}>Get the most out of Pawster</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { emoji: '📋', tip: 'Complete your profile',  desc: 'A detailed profile increases your approval chances.' },
                  { emoji: '🔔', tip: 'Check back often',        desc: 'New animals are listed daily across all 4 provinces.'  },
                  { emoji: '💬', tip: 'Be responsive',           desc: 'Quick replies speed up your review process.'           },
                  { emoji: '🏡', tip: 'Prepare your home',       desc: "Pet-proof your space before your companion arrives."   },
                ].map(({ emoji, tip, desc }) => (
                  <div key={tip} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{emoji}</span>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.79rem', color: '#1a4a08' }}>{tip}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3a5020', marginTop: '0.06rem', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '1rem', padding: '0.48rem 1rem', borderRadius: 9, fontSize: '0.72rem', fontWeight: 900, color: '#1c4f09', background: 'rgba(255,248,220,0.82)', border: '1px solid rgba(90,170,48,0.28)', textDecoration: 'none' }}>
                <i className="fas fa-arrow-right" style={{ fontSize: '0.56rem' }} /> Full Adoption Guide
              </Link>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Footer */}
        <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <div className="mb-2">
              <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
            </div>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">
              Paw<em className="italic text-[#e07820]">ster</em>
            </div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
              Screening, placing, and supporting animal adoptions across the Ilocos Region with care and accountability.
            </p>
          </div>
          {[
            { title: "Adopt",    links: [["Browse Animals", "/pets"], ["My Profile", "/profile"], ["Log In", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How It Works", "/how-it-works"], ["Rehome a Pet", "/rehome"], ["Missing Pets", "/missing-pets"], ["About Us", "/about"]] },
            { title: "Regions",  links: [["Ilocos Norte", "/pets"], ["Ilocos Sur", "/pets"], ["La Union", "/pets"], ["Pangasinan", "/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline">{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f", "fab fa-instagram", "fab fa-twitter"].map(icon => (
              <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition">
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}