/**
 * ProfilePage.jsx  (Account Settings — full standalone page at /account)
 *
 * FIX SUMMARY — why data wasn't showing after login/register:
 *  1. useAuth now persists the user to localStorage on login, so it's
 *     available on the next render even before the /api/auth/me call completes.
 *  2. This page initialises its form from `user` in the auth context
 *     immediately (no waiting), then refreshes from the backend in the
 *     background.
 *  3. setUser is called after a successful save so the navbar and every
 *     other page reflects changes without a refresh.
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';  
import api from '../config/axios'; // adjust path to match your project

import logo from "../images/logo.png";

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080';

/* ── tiny helpers ── */
function inp(extra = {}) {
  return {
    padding: '0.72rem 0.95rem', borderRadius: 11,
    border: '1px solid rgba(180,140,60,0.28)',
    background: 'rgba(255,250,232,0.72)', fontFamily: "'Nunito',sans-serif",
    fontWeight: 700, fontSize: '0.9rem', color: '#1a4a08', outline: 'none',
    width: '100%', transition: 'border-color 0.15s, box-shadow 0.15s',
    ...extra,
  };
}
const focIn  = (e) => { e.target.style.borderColor = '#5aaa30'; e.target.style.boxShadow = '0 0 0 3px rgba(90,170,48,0.12)'; };
const focOut = (e) => { e.target.style.borderColor = 'rgba(180,140,60,0.28)'; e.target.style.boxShadow = 'none'; };

function FieldLabel({ children }) {
  return <label style={{ fontSize: '0.67rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a7a50', marginBottom: '0.35rem', display: 'block' }}>{children}</label>;
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: 'fixed', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.75rem 1.25rem', borderRadius: 12, fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', background: type === 'err' ? '#c03030' : '#1c4f09', color: '#fff', animation: 'toastUp .25s ease both', fontFamily: "'Nunito',sans-serif", whiteSpace: 'nowrap' }}>
      <i className={`fas ${type === 'err' ? 'fa-circle-xmark' : 'fa-circle-check'}`} />
      {msg}
    </div>
  );
}

function pwStrength(p) {
  if (!p) return null;
  if (p.length < 6)  return { label: 'Weak',   color: '#c03030', w: '28%'  };
  if (p.length < 10 || !/[^a-zA-Z0-9]/.test(p))
                     return { label: 'Fair',   color: '#d4880a', w: '60%'  };
  return             { label: 'Strong', color: '#276010', w: '100%' };
}

/* ─── Empty form shape ─── */
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', address: '', city: '', province: '', zip: '' };

/* ─── Seed form from user object (works even if fields are missing) ─── */
function seedForm(u) {
  if (!u) return EMPTY;
  return {
    firstName: u.firstName ?? '',
    lastName:  u.lastName  ?? '',
    email:     u.email     ?? '',
    phone:     u.phone     ?? '',
    address:   u.address   ?? '',
    city:      u.city      ?? '',
    province:  u.province  ?? '',
    zip:       u.zip       ?? '',
  };
}

/* ═════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const fileRef = useRef(null);
  const idFileRef = useRef(null);

  const [tab,       setTab]       = useState('info');
  const [photoUrl,  setPhotoUrl]  = useState(user?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState(null);
  const [toast,     setToast]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [bgLoading, setBgLoading] = useState(false); // background refresh only

  /* ── form is seeded immediately from auth context — no waiting ── */
  const [form, setForm] = useState(() => seedForm(user));

  const [pw,     setPw]     = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  /* ── Background-refresh from backend (non-blocking) ── */
  useEffect(() => {
    if (!user?.id) return;
    setBgLoading(true);
    api.get(`/api/users/${user.id}`)
        .then(({ data }) => {
            // Always take fresh data from backend, don't merge-block it
            setForm({
                firstName: data.firstName || '',
                lastName:  data.lastName  || '',
                email:     data.email     || '',
                phone:     data.phone     || '',
                address:   data.address   || '',
                city:      data.city      || '',
                province:  data.province  || '',
                zip:       data.zip       || '',
            });
            if (data.photoUrl) {
                const url = data.photoUrl.startsWith('http')
                    ? data.photoUrl
                    : `${API_BASE}${data.photoUrl}`;
                setPhotoUrl(url);
                // Keep localStorage in sync with the latest photoUrl
                setUser(prev => {
                    const updated = { ...(prev ?? {}), photoUrl: url };
                    localStorage.setItem('pawster_user', JSON.stringify(updated));
                    return updated;
                });
            }
        })
        .catch(() => {})
        .finally(() => setBgLoading(false));
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id]);
  /* ── Re-seed if auth context user changes (e.g. after login redirect) ── */
  useEffect(() => {
    if (!user) return;
    setForm(f => {
      // Only fill in blank fields — don't overwrite what the user typed
      return {
        firstName: f.firstName || user.firstName || '',
        lastName:  f.lastName  || user.lastName  || '',
        email:     f.email     || user.email     || '',
        phone:     f.phone     || user.phone     || '',
        address:   f.address   || user.address   || '',
        city:      f.city      || user.city      || '',
        province:  f.province  || user.province  || '',
        zip:       f.zip       || user.zip       || '',
      };
    });
    if (user.photoUrl && !photoUrl) setPhotoUrl(user.photoUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const initials = ((form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? 'U')).toUpperCase();
  const set      = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPwF   = (k) => (e) => setPw(p => ({ ...p, [k]: e.target.value }));
  const strength = pwStrength(pw.newPw);

  /* ── Photo pick ── */
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setToast({ msg: 'Photo must be under 5 MB.', type: 'err' }); return; }
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  /* ── Save profile info ── */
  const saveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);

      const { data: updated } = await api.put(`/api/users/${user?.id ?? 'me'}`, fd);

      const finalPhoto = updated.photoUrl
        ? (updated.photoUrl.startsWith('http') ? updated.photoUrl : `${API_BASE}${updated.photoUrl}`)
        : photoUrl;

      setUser(prev => ({ ...(prev ?? {}), ...form, ...updated, photoUrl: finalPhoto }));
      localStorage.setItem('pawster_user', JSON.stringify({ ...(user ?? {}), ...form, ...updated, photoUrl: finalPhoto }));
      window.dispatchEvent(new CustomEvent('pawster:photoUpdated', { detail: { photoUrl: finalPhoto } }));
      setPhotoUrl(finalPhoto);
      setPhotoFile(null);
      setToast({ msg: 'Profile updated!', type: 'ok' });

    } catch (_) {
      setUser(prev => ({ ...(prev ?? {}), ...form, photoUrl }));
      localStorage.setItem('pawster_user', JSON.stringify({ ...(user ?? {}), ...form, photoUrl }));
      window.dispatchEvent(new CustomEvent('pawster:photoUpdated', { detail: { photoUrl } }));
      setPhotoFile(null);
      setToast({ msg: 'Saved locally (API unavailable).', type: 'ok' });
    }
    setSaving(false);
  };

  /* ── Change password ── */
  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPw.length < 8)       { setToast({ msg: 'Password must be at least 8 characters.', type: 'err' }); return; }
    if (pw.newPw !== pw.confirm)    { setToast({ msg: 'Passwords do not match.', type: 'err' }); return; }
    setSaving(true);
    try {
      await api.put(`/api/users/${user?.id ?? 'me'}/password`, {
        currentPassword: pw.current,
        newPassword: pw.newPw,
      });
      setPw({ current: '', newPw: '', confirm: '' });
      setToast({ msg: 'Password changed successfully!', type: 'ok' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password.';
      setToast({ msg, type: 'err' });
    }
    setSaving(false);
  };

  const TABS = [
    { id: 'info',     icon: 'fas fa-user',    label: 'Profile Info'  },
    { id: 'password', icon: 'fas fa-lock',     label: 'Password'      },
    { id: 'id',       icon: 'fas fa-id-card',  label: 'Verification'  },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5%,8%)}  }
        @keyframes fl2     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8%,5%)} }
        @keyframes toastUp { from{opacity:0;transform:translateY(12px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes revealUp{ from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#eddabb} ::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}

        .prof-tab { display:flex; align-items:center; justify-content:center; gap:0.4rem; flex:1; padding:0.88rem 0.5rem; font-size:0.80rem; font-weight:800; border:none; cursor:pointer; font-family:'Nunito',sans-serif; background:transparent; color:#6a7a50; border-bottom:2.5px solid transparent; transition:all 0.18s; }
        .prof-tab.active { color:#1a4a08; border-bottom-color:#1c4f09; }
        .prof-tab:hover:not(.active) { color:#3a5020; background:rgba(28,79,9,0.04); }

        .upload-zone { border:2px dashed rgba(180,140,60,0.35); border-radius:14px; padding:1.2rem; text-align:center; cursor:pointer; background:rgba(255,248,220,0.50); transition:border-color 0.15s,background 0.15s; }
        .upload-zone:hover { border-color:rgba(90,170,48,0.55); background:rgba(255,248,220,0.78); }

        .save-btn { display:flex; align-items:center; justify-content:center; gap:0.45rem; flex:2; padding:0.82rem; border-radius:11px; font-weight:900; font-size:0.9rem; color:#fff; background:#1c4f09; border:none; cursor:pointer; font-family:'Nunito',sans-serif; box-shadow:0 4px 16px rgba(28,79,9,0.28); transition:opacity 0.15s; }
        .save-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .cancel-btn { flex:1; padding:0.82rem; border-radius:11px; font-weight:800; font-size:0.88rem; color:#3a5020; background:rgba(255,248,220,0.75); border:1px solid rgba(180,140,60,0.28); cursor:pointer; font-family:'Nunito',sans-serif; }
        .eye-btn { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9aaa80; font-size:0.78rem; padding:0.2rem; }
        .side-link { display:flex; align-items:center; gap:0.55rem; padding:0.6rem 0.8rem; border-radius:10px; font-size:0.82rem; font-weight:700; text-decoration:none; transition:background 0.15s; border:none; cursor:pointer; font-family:'Nunito',sans-serif; width:100%; text-align:left; }

        @media(max-width:700px) { .prof-grid { grid-template-columns:1fr !important } }
        @media(max-width:640px) { .prof-pad  { padding:1.75rem 1rem 4rem !important } .prof-form-grid { grid-template-columns:1fr !important } .prof-form-grid > * { grid-column:auto !important } }
      `}</style>

      {/* Mesh bg */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.42, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.35, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

      {/* Shared navbar — pass photoUrl so avatar updates instantly after upload */}
      <Navbar photoUrl={photoUrl} activeLink="/account" />

      <div className="prof-pad" style={{ position: 'relative', zIndex: 10, maxWidth: 880, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* Page header */}
        <div style={{ marginBottom: '2rem', animation: 'revealUp 0.6s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.28rem 0.9rem', fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '0.6rem', background: 'rgba(28,79,9,0.08)', border: '1px solid rgba(90,170,48,0.28)', color: '#1c4f09' }}>
            <i className="fas fa-user" style={{ fontSize: '0.60rem' }} /> My Profile
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 900, color: '#1a4a08', lineHeight: 1.1, margin: 0 }}>
            Account <em style={{ fontStyle: 'italic', color: '#e07820' }}>Settings</em>
          </h1>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3a5020', marginTop: '0.35rem' }}>
            Manage your personal info, password, and verification documents.
            {bgLoading && <span style={{ marginLeft: '0.75rem', fontSize: '0.72rem', color: '#9aaa80' }}><i className="fas fa-spinner" style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.3rem' }} />Syncing…</span>}
          </p>
        </div>

        <div className="prof-grid" style={{ display: 'grid', gridTemplateColumns: '256px 1fr', gap: '1.25rem', alignItems: 'start', animation: 'revealUp 0.6s ease 0.1s both' }}>

          {/* ── Left: Avatar card ── */}
          <div>
            <div style={{ background: 'rgba(255,248,225,0.88)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 24px rgba(100,70,20,0.11)' }}>

              {/* Green banner */}
              <div style={{ background: 'linear-gradient(135deg,#1c4f09 0%,#3a8a18 55%,#5aaa30 100%)', padding: '1.75rem 1.25rem 2.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 180, height: 180, top: '-70px', right: '-50px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

                {/* Avatar */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.9rem' }}>
                  <div style={{ width: 88, height: 88, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.60)', overflow: 'hidden', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    {photoUrl
                      ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '2.2rem', fontWeight: 900, color: '#fff' }}>{initials}</span>
                    }
                  </div>
                  <button onClick={() => fileRef.current?.click()} title="Change photo"
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '2px solid #1c4f09', color: '#1c4f09', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
                    <i className="fas fa-camera" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                </div>

                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{form.firstName} {form.lastName}</div>
                <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.72)', marginTop: '0.2rem', wordBreak: 'break-all' }}>{form.email}</div>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: 50, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9de860', display: 'inline-block' }} />
                    {user?.status ?? 'Active'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: 50, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.20)' }}>
                    <i className="fas fa-shield-alt" style={{ fontSize: '0.50rem' }} />
                    {user?.role ?? 'Member'}
                  </span>
                </div>

                {photoFile && (
                  <div style={{ marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.22rem 0.65rem', borderRadius: 50, fontSize: '0.60rem', fontWeight: 800, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>
                    <i className="fas fa-image" /> New photo staged
                  </div>
                )}
              </div>

              {/* Side nav links */}
              <div style={{ padding: '0.75rem' }}>
                <Link to="/profile" className="side-link" style={{ color: '#3a5020', background: 'rgba(28,79,9,0.06)', marginBottom: '0.35rem' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(28,79,9,0.11)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(28,79,9,0.06)'}>
                  <i className="fas fa-th-large" style={{ color: '#1c4f09', width: 16, textAlign: 'center', fontSize: '0.80rem' }} />
                  Back to Dashboard
                </Link>
                <button onClick={logout} className="side-link" style={{ color: '#c03030' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,48,48,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <i className="fas fa-sign-out-alt" style={{ width: 16, textAlign: 'center', fontSize: '0.80rem' }} />
                  Log Out
                </button>
              </div>
            </div>

            {/* Member since */}
            {user?.createdAt && (
              <div style={{ marginTop: '0.85rem', padding: '0.8rem 1rem', background: 'rgba(255,248,225,0.82)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 14, boxShadow: '0 2px 10px rgba(100,70,20,0.08)' }}>
                <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6a7a50', marginBottom: '0.22rem' }}>Member Since</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1a4a08' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Tabbed form ── */}
          <div style={{ background: 'rgba(255,248,225,0.88)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 4px 24px rgba(100,70,20,0.11)' }}>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(180,140,60,0.22)', background: 'rgba(255,250,232,0.7)' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`prof-tab${tab === t.id ? ' active' : ''}`}>
                  <i className={t.icon} style={{ fontSize: '0.72rem', color: tab === t.id ? '#1c4f09' : '#9aaa80' }} />
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.75rem 2rem 2rem' }}>

              {/* ══ TAB: Profile Info ══ */}
              {tab === 'info' && (
                <form onSubmit={saveInfo}>
                  {/* Photo upload zone */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.64rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a7a50', marginBottom: '0.7rem' }}>Profile Photo</div>
                    <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                      <i className="fas fa-cloud-arrow-up" style={{ fontSize: '1.4rem', color: '#6a7a50', marginBottom: '0.3rem', display: 'block' }} />
                      <div style={{ fontSize: '0.80rem', fontWeight: 800, color: '#3a5020' }}>
                        {photoFile ? `📎 ${photoFile.name}` : 'Click to upload or change your photo'}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9aaa80', marginTop: '0.12rem' }}>JPG, PNG, WEBP · max 5 MB</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.64rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a7a50', marginBottom: '0.9rem' }}>Personal Information</div>

                  <div className="prof-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                    <div>
                      <FieldLabel>First Name *</FieldLabel>
                      <input value={form.firstName} onChange={set('firstName')} required style={inp()} onFocus={focIn} onBlur={focOut} placeholder="First name" />
                    </div>
                    <div>
                      <FieldLabel>Last Name *</FieldLabel>
                      <input value={form.lastName} onChange={set('lastName')} required style={inp()} onFocus={focIn} onBlur={focOut} placeholder="Last name" />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <FieldLabel>Email Address *</FieldLabel>
                      <input type="email" value={form.email} onChange={set('email')} required style={inp()} onFocus={focIn} onBlur={focOut} placeholder="you@email.com" />
                    </div>
                    <div>
                      <FieldLabel>Phone Number</FieldLabel>
                      <input type="tel" value={form.phone} onChange={set('phone')} style={inp()} onFocus={focIn} onBlur={focOut} placeholder="+63 9XX XXX XXXX" />
                    </div>
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <input value={form.city} onChange={set('city')} style={inp()} onFocus={focIn} onBlur={focOut} placeholder="Laoag City" />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <FieldLabel>Home Address</FieldLabel>
                      <input value={form.address} onChange={set('address')} style={inp()} onFocus={focIn} onBlur={focOut} placeholder="Street / Barangay" />
                    </div>
                    <div>
                      <FieldLabel>Province</FieldLabel>
                      <input value={form.province} onChange={set('province')} style={inp()} onFocus={focIn} onBlur={focOut} placeholder="Ilocos Norte" />
                    </div>
                    <div>
                      <FieldLabel>Zip Code</FieldLabel>
                      <input value={form.zip} onChange={set('zip')} style={inp()} onFocus={focIn} onBlur={focOut} placeholder="2900" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.5rem' }}>
                    <Link to="/profile" className="cancel-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                      ← Dashboard
                    </Link>
                    <button type="submit" className="save-btn" disabled={saving}>
                      {saving
                        ? <><i className="fas fa-spinner" style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                        : <><i className="fas fa-floppy-disk" /> Save Changes</>
                      }
                    </button>
                  </div>
                </form>
              )}

              {/* ══ TAB: Password ══ */}
              {tab === 'password' && (
                <form onSubmit={savePw}>
                  <div style={{ background: 'rgba(32,96,160,0.08)', border: '1px solid rgba(32,96,160,0.22)', borderRadius: 12, padding: '0.9rem 1rem', marginBottom: '1.4rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                    <i className="fas fa-circle-info" style={{ color: '#2060a0', marginTop: '0.15rem', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.80rem', fontWeight: 700, color: '#2060a0', margin: 0, lineHeight: 1.6 }}>
                      Choose a strong password — at least 8 characters, including numbers and symbols.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Current */}
                    <div>
                      <FieldLabel>Current Password</FieldLabel>
                      <div style={{ position: 'relative' }}>
                        <input type={showPw.current ? 'text' : 'password'} value={pw.current} onChange={setPwF('current')} required style={inp({ paddingRight: '2.8rem' })} onFocus={focIn} onBlur={focOut} placeholder="Enter current password" />
                        <button type="button" className="eye-btn" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}>
                          <i className={`fas ${showPw.current ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                    </div>

                    {/* New */}
                    <div>
                      <FieldLabel>New Password</FieldLabel>
                      <div style={{ position: 'relative' }}>
                        <input type={showPw.newPw ? 'text' : 'password'} value={pw.newPw} onChange={setPwF('newPw')} required style={inp({ paddingRight: '2.8rem' })} onFocus={focIn} onBlur={focOut} placeholder="Min. 8 characters" />
                        <button type="button" className="eye-btn" onClick={() => setShowPw(s => ({ ...s, newPw: !s.newPw }))}>
                          <i className={`fas ${showPw.newPw ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                      {strength && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div style={{ height: 4, borderRadius: 4, background: 'rgba(180,140,60,0.18)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: strength.w, background: strength.color, borderRadius: 4, transition: 'width 0.3s, background 0.3s' }} />
                          </div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: strength.color, marginTop: '0.22rem' }}>{strength.label}</div>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <FieldLabel>Confirm New Password</FieldLabel>
                      <div style={{ position: 'relative' }}>
                        <input type={showPw.confirm ? 'text' : 'password'} value={pw.confirm} onChange={setPwF('confirm')} required
                          style={inp({ paddingRight: '2.8rem', borderColor: pw.confirm && pw.confirm !== pw.newPw ? '#c03030' : undefined })}
                          onFocus={focIn} onBlur={focOut} placeholder="Repeat new password" />
                        <button type="button" className="eye-btn" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}>
                          <i className={`fas ${showPw.confirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                        </button>
                      </div>
                      {pw.confirm && pw.confirm !== pw.newPw && (
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#c03030', marginTop: '0.25rem' }}>
                          <i className="fas fa-circle-exclamation" style={{ marginRight: '0.28rem' }} />Passwords do not match
                        </div>
                      )}
                      {pw.confirm && pw.confirm === pw.newPw && pw.newPw && (
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#276010', marginTop: '0.25rem' }}>
                          <i className="fas fa-circle-check" style={{ marginRight: '0.28rem' }} />Passwords match
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.5rem' }}>
                    <button type="button" className="cancel-btn" onClick={() => setPw({ current: '', newPw: '', confirm: '' })}>Clear</button>
                    <button type="submit" className="save-btn" disabled={saving}>
                      {saving
                        ? <><i className="fas fa-spinner" style={{ animation: 'spin 0.8s linear infinite' }} /> Updating…</>
                        : <><i className="fas fa-lock" /> Update Password</>
                      }
                    </button>
                  </div>
                </form>
              )}

              {/* ══ TAB: ID Verification ══ */}
              {tab === 'id' && (
                <div>
                  <div style={{ background: 'rgba(28,79,9,0.07)', border: '1px solid rgba(90,170,48,0.28)', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '1.4rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                    <i className="fas fa-shield-alt" style={{ color: '#1c4f09', marginTop: '0.15rem', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.3rem' }}>Why we need this</div>
                      <p style={{ fontSize: '0.80rem', fontWeight: 700, color: '#3a5020', margin: 0, lineHeight: 1.6 }}>We verify all adopters to ensure the safety and well-being of rescued animals. Your ID is stored securely and only accessible to authorised Pawster staff.</p>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.64rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a7a50', marginBottom: '0.75rem' }}>Government-Issued ID</div>

                  {/* Current file status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1rem', background: 'rgba(255,252,238,0.7)', border: '1px solid rgba(200,170,100,0.28)', borderRadius: 12, marginBottom: '1.25rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: user?.idFileName ? 'rgba(28,79,9,0.12)' : 'rgba(180,140,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fas ${user?.idFileName ? 'fa-file-circle-check' : 'fa-file-circle-question'}`} style={{ color: user?.idFileName ? '#1c4f09' : '#6a7a50', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#1a4a08', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.idFileName ?? 'No ID uploaded yet'}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6a7a50' }}>
                        {user?.idFileName ? 'File on record — you may replace it below' : 'Upload a valid government ID to complete verification'}
                      </div>
                    </div>
                    {user?.status === 'approved' && (
                      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.2rem 0.6rem', borderRadius: 50, fontSize: '0.60rem', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(28,79,9,0.12)', color: '#276010', flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5aaa30', display: 'inline-block' }} /> Verified
                      </span>
                    )}
                  </div>

                  <IdUploadForm
                    userId={user?.id}
                    onSuccess={(msg) => setToast({ msg, type: 'ok' })}
                    onError={(msg)   => setToast({ msg, type: 'err' })}
                  />
                </div>
              )}
            </div>
          </div>
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

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ─── ID Upload sub-component ─── */
function IdUploadForm({ userId, onSuccess, onError }) {
  const [file,   setFile]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [label,  setLabel]  = useState('No file chosen');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { onError('File must be under 5 MB.'); return; }
    setFile(f);
    setLabel(`📎 ${f.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { onError('Please choose a file first.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('idFile', file);
      await api.put(`/api/users/${userId ?? 'me'}/id-file`, fd);
      setFile(null);
      setLabel('No file chosen');
      onSuccess('ID document updated successfully!');
    } catch (_) {
      onError('Upload failed. Please try again.');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.78rem 1rem', background: 'rgba(255,250,232,0.70)', border: '2.5px dashed rgba(90,170,48,0.40)', borderRadius: 11, cursor: 'pointer', transition: 'all 0.15s', marginBottom: '0.65rem' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(90,170,48,0.7)'; e.currentTarget.style.background = 'rgba(255,250,232,0.95)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(90,170,48,0.40)'; e.currentTarget.style.background = 'rgba(255,250,232,0.70)'; }}>
        <i className="fas fa-paperclip" style={{ color: '#5aaa30', fontSize: '1rem', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a4a08' }}>Choose File</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9aaa80' }}>{label}</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#6a7a50', marginBottom: '1.1rem' }}>
        Accepted: PDF, JPG, PNG (max 5 MB) — passport, national ID, driver's license, etc.
      </div>
      <button type="submit" disabled={saving || !file}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', width: '100%', padding: '0.82rem', borderRadius: 11, fontWeight: 900, fontSize: '0.9rem', color: '#fff', background: '#1c4f09', border: 'none', cursor: saving || !file ? 'not-allowed' : 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 16px rgba(28,79,9,0.24)', opacity: !file ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {saving
          ? <><i className="fas fa-spinner" style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading…</>
          : <><i className="fas fa-upload" /> Upload ID Document</>
        }
      </button>
    </form>
  );
}