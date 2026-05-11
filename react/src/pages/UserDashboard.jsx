import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import logo from "../images/logo.png";

const API_BASE = import.meta.env.VITE_API_BASE   ?? 'http://localhost:8000';
const DJANGO   = import.meta.env.VITE_DJANGO_API ?? 'http://localhost:8000';
const PHP_BASE = import.meta.env.VITE_PHP_API_URL ?? 'http://localhost:8000';

const POLL_APPS     = 15_000;
const POLL_ACTIVITY = 20_000;
const POLL_STATS    = 30_000;

// ── How many items to show per panel page ──
const PAGE_SIZE = 5;

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

function resolvePhotoUrl(a) {
  if (!a) return null;
  // base64 blob with explicit type
  if (a.photoData && a.photoType) return `data:${a.photoType};base64,${a.photoData}`;
  // rehome form stores the full data-URI in photo_base64
  if (a.photo_base64 && a.photo_base64.startsWith('data:')) return a.photo_base64;
  if (a.photoBase64  && a.photoBase64.startsWith('data:'))  return a.photoBase64;
  const raw =
    a.photoUrl   || a.photo_url   || a.photo     ||
    a.imageUrl   || a.image_url   || a.imgUrl    ||
    a.animal_photo || a.animalPhoto || null;
  if (!raw) return null;
  if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${PHP_BASE}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

/* ── Animal photo cache: keyed by id (string) ── */
const animalPhotoCache = {};   // { "123": "https://..." | "data:..." }

/* ── Fetch animal photo URL by id, with cache ── */
async function fetchAnimalPhoto(animalId) {
  if (!animalId) return null;
  const key = String(animalId);
  if (animalPhotoCache[key] !== undefined) return animalPhotoCache[key];

  // 1. Try Spring Boot /api/animals/:id
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/animals/${key}`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.ok) {
      const data = await res.json();
      const url = resolvePhotoUrl(data);
      if (url) { animalPhotoCache[key] = url; return url; }
    }
  } catch { /* fallthrough */ }

  // 2. Try Django /api/approvals/animals/:id
  try {
    const token = getToken();
    const res = await fetch(`${DJANGO}/api/approvals/animals/${key}/`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.ok) {
      const data = await res.json();
      const url = resolvePhotoUrl(data);
      if (url) { animalPhotoCache[key] = url; return url; }
    }
  } catch { /* fallthrough */ }

  // 3. Try PHP dashboard action=get_animal
  try {
    const fd = new FormData();
    fd.append('action', 'get_animal');
    fd.append('id', key);
    const res = await fetch(`${PHP_BASE}/php/admin/dashboard`, { method: 'POST', body: fd, credentials: 'include' });
    if (res.ok) {
      const text = await res.text();
      if (text.trim()) {
        const json = JSON.parse(text);
        const animal = json.data ?? json;
        const url = resolvePhotoUrl(animal);
        if (url) { animalPhotoCache[key] = url; return url; }
      }
    }
  } catch { /* fallthrough */ }

  // 4. Try Spring Boot /api/animals/:id/photo as a direct image URL
  const directUrl = `${API_BASE}/api/animals/${key}/photo`;
  animalPhotoCache[key] = directUrl;
  return directUrl;
}

/* ── Enrich a list of adoption/rehome records with animal photos ── */
async function enrichWithPhotos(list, idField = 'animal_id') {
  return Promise.all(
    list.map(async (item) => {
      // Already has a resolvable photo on the item itself → use it
      const existing = resolvePhotoUrl(item);
      if (existing) return { ...item, _resolvedPhoto: existing };

      // Extract animal id from various field names
      const animalId =
        item[idField] ??
        item.animalId ??
        item.animal_id ??
        item.petId ??
        item.pet_id ??
        null;

      if (!animalId) return { ...item, _resolvedPhoto: null };

      const url = await fetchAnimalPhoto(animalId);
      return { ...item, _resolvedPhoto: url };
    })
  );
}

/* ── Exhaustive paginated fetch — walks all pages until done ── */
async function fetchAllPages(base, path) {
  const results = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await apiFetch(base, `${path}${sep}page=${page}&size=100`);
    if (!res.ok) break;
    const data = await res.json();

    // Handle Spring‑style Page<T>
    if (data && typeof data === 'object' && 'content' in data) {
      results.push(...(data.content ?? []));
      totalPages = data.totalPages ?? 1;
      page++;
      continue;
    }
    // Handle Django‑style { data: [], count: N } or { results: [] }
    const list = data.data ?? data.results ?? (Array.isArray(data) ? data : []);
    results.push(...list);

    // If a next link exists keep going, otherwise stop
    if (data.next) {
      page++;
    } else {
      break;
    }
  }

  return results;
}

/* ── SVG Icons ── */
const SVG = {
  dog: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2 .336-3.5 2.001-3.5 3.5 0 .826.408 1.168 1 1.5l1.143.571"/>
      <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2 .336 3.5 2.001 3.5 3.5 0 .826-.408 1.168-1 1.5L19 8.571"/>
      <path d="M8 14v.5"/><path d="M16 14v.5"/>
      <path d="M11.25 16.25h1.5L12 17l-.75-.75z"/>
      <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>
    </svg>
  ),
  cat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 17 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5z"/>
      <path d="M8 14v.5"/><path d="M16 14v.5"/>
      <path d="M11.25 16.25h1.5L12 17l-.75-.75z"/>
    </svg>
  ),
  rabbit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M18 11c0-1.1-.4-2.1-1-2.8V4a2 2 0 0 0-4 0v1.1A7 7 0 0 0 5 12v2a5 5 0 0 0 10 0v-1c1.7 0 3-1.3 3-3z"/>
      <path d="M9.5 14.5A1.5 1.5 0 0 0 8 16"/><path d="M14.5 14.5A1.5 1.5 0 0 1 16 16"/>
    </svg>
  ),
  paw: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.7em', height: '0.7em' }}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.7em', height: '0.7em' }}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.75em', height: '0.75em' }}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  ),
  spinner: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: '0.85em', height: '0.85em', animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: '0.65em', height: '0.65em' }}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  bird: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }}>
      <path d="M16 7h.01"/>
      <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/>
      <path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/>
      <path d="M7 18a6 6 0 0 0 3.84-10.61"/>
    </svg>
  ),
};

function getAnimalSVG(type, size = '1.1rem') {
  const t = (type || '').toLowerCase();
  let icon = SVG.dog;
  if (t === 'cat') icon = SVG.cat;
  else if (t === 'rabbit') icon = SVG.rabbit;
  else if (t === 'bird') icon = SVG.bird;
  return <span style={{ fontSize: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>;
}

/* ── Reveal on scroll ── */
function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.06 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}
function Reveal({ children, delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(18px)',
    }}>
      {children}
    </div>
  );
}

/* ── Live badge ── */
function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.12rem 0.55rem', borderRadius: 4, background: 'rgba(28,79,9,0.07)', border: '1px solid rgba(90,170,48,0.28)', fontSize: '0.58rem', fontWeight: 800, color: '#1c4f09', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#5aaa30', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
      Live
    </span>
  );
}

/* ── Stat card ── */
function StatCard({ icon, value, label, sublabel, color, delay }) {
  const [ref, vis] = useReveal();
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,252,235,0.97)' : 'rgba(255,250,228,0.88)',
        border: `1px solid ${hov ? 'rgba(90,170,48,0.35)' : 'rgba(180,140,60,0.22)'}`,
        borderRadius: 16,
        padding: '1.25rem 1.35rem',
        boxShadow: hov ? '0 8px 32px rgba(100,70,20,0.14)' : '0 2px 12px rgba(100,70,20,0.07)',
        opacity: vis ? 1 : 0,
        transform: vis ? (hov ? 'translateY(-3px)' : 'translateY(0)') : 'translateY(16px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease, background 0.28s ease`,
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '1.15rem' }}>
          {icon}
        </div>
        {sublabel && (
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color, background: `${color}10`, padding: '0.18rem 0.55rem', borderRadius: 4, letterSpacing: '0.04em', border: `1px solid ${color}20` }}>
            {sublabel}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '2rem', fontWeight: 900, color: '#1a4a08', lineHeight: 1 }}>{value ?? 0}</div>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7a8a60', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

/* ── Pet avatar ── */
function PetAvatar({ photoUrl, animalType, size = 38, gradient = 'linear-gradient(135deg,#1c4f09,#3a8a18)' }) {
  const [err, setErr] = useState(false);
  if (photoUrl && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(180,140,60,0.25)' }}>
        <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${size * 0.45}px`, color: 'rgba(255,255,255,0.92)', flexShrink: 0 }}>
      {getAnimalSVG(animalType, `${size * 0.45}px`)}
    </div>
  );
}

/* ── Status badge ── */
const STATUS_MAP = {
  Approved: { bg: 'rgba(88,139,65,0.12)', color: '#276010', dot: '#5aaa30', label: 'Approved' },
  approved: { bg: 'rgba(88,139,65,0.12)', color: '#276010', dot: '#5aaa30', label: 'Approved' },
  Pending:  { bg: 'rgba(212,136,10,0.12)', color: '#b07010', dot: '#e0a020', label: 'Pending' },
  pending:  { bg: 'rgba(212,136,10,0.12)', color: '#b07010', dot: '#e0a020', label: 'Pending' },
  Rejected: { bg: 'rgba(192,48,48,0.10)',  color: '#b03030', dot: '#c04040', label: 'Rejected' },
  rejected: { bg: 'rgba(192,48,48,0.10)',  color: '#b03030', dot: '#c04040', label: 'Rejected' },
};
function StatusBadge({ status }) {
  const st = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.16rem 0.55rem', borderRadius: 50, fontSize: '0.57rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: st.bg, color: st.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
      {st.label}
    </span>
  );
}

/* ── Pagination controls ── */
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.875rem 0', borderTop: '1px solid rgba(180,140,60,0.14)', marginTop: '0.25rem' }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.28rem 0.6rem', borderRadius: 7, border: '1px solid rgba(180,140,60,0.22)', background: 'rgba(255,252,238,0.7)', color: page === 0 ? '#c8d8a0' : '#3a5020', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.68rem', fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>
        {SVG.chevronLeft} Prev
      </button>
      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7a8a60' }}>
        Page {page + 1} of {totalPages} · {total} total
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.28rem 0.6rem', borderRadius: 7, border: '1px solid rgba(180,140,60,0.22)', background: 'rgba(255,252,238,0.7)', color: page >= totalPages - 1 ? '#c8d8a0' : '#3a5020', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.68rem', fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>
        Next {SVG.chevronRight}
      </button>
    </div>
  );
}

/* ── Application row ── */
function AppRow({ app }) {
  const [hov, setHov] = useState(false);
  const animalType = app.animalType || app.animal_type || '';
  const petName    = app.petName ?? app.animalName ?? app.animal_name ?? 'Unknown Pet';
  const date       = app.date ?? app.createdAt ?? app.created_at ?? '';
  const breed      = app.breed ?? app.animalBreed ?? '';
  // _resolvedPhoto is pre-fetched by enrichWithPhotos()
  const photoUrl = app._resolvedPhoto ?? null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.75rem 0.875rem', borderRadius: 11,
        background: hov ? 'rgba(28,79,9,0.04)' : 'rgba(255,252,238,0.55)',
        border: `1px solid ${hov ? 'rgba(90,170,48,0.22)' : 'rgba(200,170,100,0.18)'}`,
        transition: 'all 0.18s', transform: hov ? 'translateX(3px)' : 'translateX(0)',
      }}>
      <PetAvatar photoUrl={photoUrl} animalType={animalType} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1a4a08', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{petName}</div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7a8a60', marginTop: '0.08rem' }}>
          {[breed, date ? new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''].filter(Boolean).join(' · ')}
        </div>
      </div>
      <StatusBadge status={app.status} />
    </div>
  );
}

/* ── Rehome row ── */
function RehomeRow({ item }) {
  const [hov, setHov] = useState(false);
  const rawStatus = item.status ?? 'Pending';
  const statusKey = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
  const petName  = item.pet_name ?? item.petName ?? 'Unknown Pet';
  const date     = item.created_at ?? item.createdAt ?? '';
  const species  = item.species ?? item.animal_type ?? '';
  // _resolvedPhoto is pre-fetched; rehome photo = submitted pet photo
  const photoUrl = item._resolvedPhoto ?? null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.75rem 0.875rem', borderRadius: 11,
        background: hov ? 'rgba(180,90,34,0.04)' : 'rgba(255,252,238,0.55)',
        border: `1px solid ${hov ? 'rgba(180,90,34,0.22)' : 'rgba(200,170,100,0.18)'}`,
        transition: 'all 0.18s', transform: hov ? 'translateX(3px)' : 'translateX(0)',
      }}>
      <PetAvatar photoUrl={photoUrl} animalType={species} size={38} gradient="linear-gradient(135deg,#8a3a10,#c05a20)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1a4a08', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{petName}</div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7a8a60', marginTop: '0.08rem' }}>
          {[species, date ? new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''].filter(Boolean).join(' · ')}
        </div>
      </div>
      <StatusBadge status={statusKey} />
    </div>
  );
}

/* ── Activity item ── */
function ActivityItem({ icon, iconColor, title, desc, time, last, isNew }) {
  return (
    <div style={{ position: 'relative', padding: '0.75rem 0' }}>
      {isNew && (
        <span style={{ position: 'absolute', top: 8, right: 0, fontSize: '0.52rem', fontWeight: 900, color: '#1c7a09', background: 'rgba(90,170,48,0.10)', borderRadius: 50, padding: '2px 6px', border: '1px solid rgba(90,170,48,0.25)' }}>NEW</span>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${iconColor}12`, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0 }}>
          <i className={icon} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.80rem', color: '#1a4a08', lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#7a8a60', marginTop: '0.1rem', lineHeight: 1.5 }}>{desc}</div>
        </div>
        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#aab880', flexShrink: 0, marginTop: '0.1rem', letterSpacing: '0.02em' }}>{time}</div>
      </div>
      {!last && <div style={{ height: 1, background: 'rgba(180,140,60,0.11)', marginTop: '0.75rem' }} />}
    </div>
  );
}

/* ── Quick link ── */
function QuickLink({ to, icon, color, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.875rem',
          padding: '0.8rem 0.875rem', borderRadius: 11,
          background: hov ? 'rgba(28,79,9,0.06)' : 'rgba(255,252,238,0.55)',
          border: `1px solid ${hov ? 'rgba(90,170,48,0.28)' : 'rgba(200,170,100,0.18)'}`,
          transition: 'all 0.18s', transform: hov ? 'translateY(-2px)' : 'translateY(0)', cursor: 'pointer',
        }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}12`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.80rem', color: '#1a4a08' }}>{title}</div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#7a8a60', marginTop: '0.05rem' }}>{desc}</div>
        </div>
        <span style={{ color: '#aab880' }}>{SVG.chevronRight}</span>
      </div>
    </Link>
  );
}

/* ── Panel wrapper ── */
function Panel({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(255,250,228,0.88)',
      border: '1px solid rgba(180,140,60,0.20)',
      borderRadius: 18,
      boxShadow: '0 2px 16px rgba(100,70,20,0.08)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Panel header ── */
function PanelHeader({ title, subtitle, badge, children }) {
  return (
    <div style={{ padding: '1.1rem 1.3rem 0.9rem', borderBottom: '1px solid rgba(180,140,60,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'rgba(255,252,235,0.6)' }}>
      <div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '0.95rem', fontWeight: 900, color: '#1a4a08', lineHeight: 1.2 }}>{title}</div>
        {subtitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.18rem' }}>
            <span style={{ fontSize: '0.63rem', fontWeight: 700, color: '#7a8a60' }}>{subtitle}</span>
            {badge}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Icon button ── */
function IconBtn({ onClick, loading, title }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(180,140,60,0.22)', background: 'rgba(255,252,238,0.7)', color: '#7a8a60', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
      {loading ? SVG.spinner : SVG.refresh}
    </button>
  );
}

/* ── Pill button ── */
function PillBtn({ to, label, color = '#1c4f09' }) {
  return (
    <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.32rem 0.8rem', borderRadius: 7, fontSize: '0.64rem', fontWeight: 800, color, background: `${color}10`, border: `1px solid ${color}28`, textDecoration: 'none', letterSpacing: '0.02em' }}>
      {SVG.plus} {label}
    </Link>
  );
}

/* ── Skeleton loader ── */
function Skeleton({ h = 52, r = 11 }) {
  return <div style={{ height: h, borderRadius: r, background: 'rgba(180,140,60,0.08)', animation: 'shimmer 1.4s ease infinite', backgroundSize: '400px 100%' }} />;
}

/* ── Empty state ── */
function EmptyState({ icon, text, linkTo, linkText, color = '#1c4f09' }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.25rem 1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '1.3rem', color }}>
        {icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.80rem', color: '#7a8a60', marginBottom: '0.5rem' }}>{text}</div>
      {linkTo && (
        <Link to={linkTo} style={{ color, fontWeight: 900, fontSize: '0.77rem', textDecoration: 'none', borderBottom: `1px solid ${color}40` }}>{linkText}</Link>
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ message }) {
  return (
    <div style={{ position: 'fixed', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: 10, background: '#1c4f09', color: '#fff', fontWeight: 700, fontSize: '0.80rem', fontFamily: "'Nunito',sans-serif", boxShadow: '0 8px 24px rgba(0,0,0,0.18)', animation: 'fadeUp 0.25s ease both', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: '0.85rem' }}>{SVG.checkCircle}</span> {message}
    </div>
  );
}

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/* ── Build activity feed from adoptions + rehome data ── */
function buildActivityFromData(applications, rehomeList) {
  const feed = [];

  applications.forEach(app => {
    const date = app.createdAt ?? app.created_at ?? app.date ?? '';
    const petName = app.petName ?? app.animalName ?? app.animal_name ?? 'a pet';
    const status = app.status ?? 'pending';
    const isApproved = ['approved', 'Approved'].includes(status);
    const isRejected = ['rejected', 'Rejected'].includes(status);
    feed.push({
      id: `adopt-${app.id}`,
      icon: isApproved ? 'fas fa-check-circle' : isRejected ? 'fas fa-times-circle' : 'fas fa-heart',
      iconColor: isApproved ? '#1c7a09' : isRejected ? '#c03030' : '#e07820',
      title: isApproved ? `Adoption approved — ${petName}` : isRejected ? `Adoption not approved — ${petName}` : `Adoption application submitted — ${petName}`,
      desc: isApproved ? 'Your application was approved. The shelter will contact you soon.' : isRejected ? 'Your application was not approved this time.' : 'Your application is being reviewed by the shelter.',
      time: timeAgo(date),
      _ts: date ? new Date(date).getTime() : 0,
    });
  });

  rehomeList.forEach(item => {
    const date = item.created_at ?? item.createdAt ?? '';
    const petName = item.pet_name ?? item.petName ?? 'a pet';
    const rawStatus = item.status ?? 'Pending';
    const statusKey = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
    const isApproved = statusKey === 'Approved';
    const isRejected = statusKey === 'Rejected';
    feed.push({
      id: `rehome-${item.id}`,
      icon: isApproved ? 'fas fa-home' : isRejected ? 'fas fa-times-circle' : 'fas fa-hands-holding-heart',
      iconColor: isApproved ? '#B45A22' : isRejected ? '#c03030' : '#c08010',
      title: isApproved ? `Rehome request approved — ${petName}` : isRejected ? `Rehome request declined — ${petName}` : `Rehome / rescue request submitted — ${petName}`,
      desc: isApproved ? 'Your rehome request was approved. Placement process has started.' : isRejected ? 'Your rehome request was not accepted at this time.' : 'Your request is under review by our team.',
      time: timeAgo(date),
      _ts: date ? new Date(date).getTime() : 0,
    });
  });

  // Sort newest first
  feed.sort((a, b) => b._ts - a._ts);
  return feed;
}

/* ══════════════════════════ MAIN EXPORT ══════════════════════════ */
export default function UserDashboard() {
  const { user } = useAuth();

  const [applications,  setApplications]  = useState([]);
  const [rehomeList,    setRehomeList]    = useState([]);
  const [missingList,   setMissingList]   = useState([]);
  const [activityFeed,  setActivityFeed]  = useState([]);

  const [loadingApps,   setLoadingApps]   = useState(true);
  const [loadingRehome, setLoadingRehome] = useState(true);
  const [loadingAct,    setLoadingAct]    = useState(true);

  const [photoUrl,      setPhotoUrl]      = useState(user?.photoUrl ?? null);
  const [toast,         setToast]         = useState(null);

  // Pagination state
  const [appsPage,    setAppsPage]    = useState(0);
  const [rehomePage,  setRehomePage]  = useState(0);
  const [actPage,     setActPage]     = useState(0);

  const prevActIds = useRef(new Set());
  const [newActivityIds, setNewActivityIds] = useState(new Set());

  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? 'U')).toUpperCase();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* ── Fetch all adoption applications (all pages) ── */
  const fetchApps = useCallback(async () => {
    if (!user?.id) { setLoadingApps(false); return; }
    setLoadingApps(true);
    try {
      // Try Django first
      const res = await apiFetch(DJANGO, `/api/approvals/adoptions/user/`);
      if (res.ok) {
        const data = await res.json();
        // Could be paginated { data: [], count } or flat array
        let list = data.data ?? data.results ?? (Array.isArray(data) ? data : []);

        // If Django returns a next link, walk the rest
        if (data.next) {
          let nextUrl = data.next;
          while (nextUrl) {
            const token = getToken();
            const r2 = await fetch(nextUrl, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            if (!r2.ok) break;
            const d2 = await r2.json();
            list = [...list, ...(d2.results ?? d2.data ?? (Array.isArray(d2) ? d2 : []))];
            nextUrl = d2.next ?? null;
          }
        }

        const enriched = await enrichWithPhotos(list, 'animal_id');
        setApplications(enriched);
        setLoadingApps(false);
        return;
      }
    } catch { /* fallthrough */ }

    // Fallback: Spring Boot with full pagination walk
    try {
      const list = await fetchAllPages(API_BASE, `/api/adoptions?userId=${user.id}`);
      const enriched = await enrichWithPhotos(list, 'animal_id');
      setApplications(enriched);
    } catch { setApplications([]); }
    setLoadingApps(false);
  }, [user?.id]);

  /* ── Fetch all rehome requests ── */
  const fetchRehome = useCallback(async () => {
    if (!user?.id) { setLoadingRehome(false); return; }
    setLoadingRehome(true);
    try {
      const res = await apiFetch(DJANGO, `/api/approvals/rehoming/user/`);
      if (res.ok) {
        const data = await res.json();
        let list = data.data ?? data.results ?? (Array.isArray(data) ? data : []);

        if (data.next) {
          let nextUrl = data.next;
          while (nextUrl) {
            const token = getToken();
            const r2 = await fetch(nextUrl, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            if (!r2.ok) break;
            const d2 = await r2.json();
            list = [...list, ...(d2.results ?? d2.data ?? (Array.isArray(d2) ? d2 : []))];
            nextUrl = d2.next ?? null;
          }
        }

        // For rehome: photo is the pet photo submitted inline (photo_base64/photo_url)
        // enrichWithPhotos handles this via resolvePhotoUrl on the item itself first
        const enriched = await enrichWithPhotos(list, 'animal_id');
        setRehomeList(enriched);
      }
    } catch { setRehomeList([]); }
    setLoadingRehome(false);
  }, [user?.id]);

  /* ── Fetch missing pets ── */
  const fetchMissing = useCallback(async () => {
    if (!user?.id) return;
    try {
      const list = await fetchAllPages(API_BASE, `/api/missing-pets?reporterUserId=${user.id}`);
      setMissingList(list);
    } catch { /* silent */ }
  }, [user?.id]);

  /* ── Rebuild activity from adoptions + rehome (no dedicated endpoint needed) ── */
  const rebuildActivity = useCallback((apps, rehome) => {
    setLoadingAct(true);
    const feed = buildActivityFromData(apps, rehome);

    // Detect new entries
    const newIds = new Set();
    feed.forEach(item => {
      if (prevActIds.current.size > 0 && !prevActIds.current.has(item.id)) {
        newIds.add(item.id);
      }
    });
    prevActIds.current = new Set(feed.map(i => i.id));
    if (newIds.size > 0) {
      setNewActivityIds(newIds);
      setTimeout(() => setNewActivityIds(new Set()), 6000);
    }

    setActivityFeed(feed);
    setLoadingAct(false);
  }, []);

  /* ── Try dedicated activity endpoint first, fall back to derived ── */
  const fetchActivity = useCallback(async (apps, rehome) => {
    if (!user?.id) { rebuildActivity(apps, rehome); return; }
    try {
      const res = await apiFetch(DJANGO, `/api/activity/?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.results ?? data.data ?? (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setActivityFeed(list.slice(0, 50));
          setLoadingAct(false);
          return;
        }
      }
    } catch { /* fallthrough to derived */ }

    // Derive activity from adoptions + rehome data
    rebuildActivity(apps, rehome);
  }, [user?.id, rebuildActivity]);

  /* ── Full refresh ── */
  const refreshAll = useCallback(async (msg) => {
    if (msg) showToast(msg);
    const [apps, rehome] = await Promise.all([
      (async () => { await fetchApps(); return applications; })(),
      (async () => { await fetchRehome(); return rehomeList; })(),
      fetchMissing(),
    ]);
    // fetchApps / fetchRehome update state asynchronously; we re-derive after a tick
  }, [fetchApps, fetchRehome, fetchMissing, applications, rehomeList]);

  usePageTitle('Dashboard');

  // Initial load
  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchApps(), fetchRehome(), fetchMissing()]);
    };
    load();
  }, [fetchApps, fetchRehome, fetchMissing]);

  // Rebuild activity whenever apps or rehome data changes
  useEffect(() => {
    if (!loadingApps && !loadingRehome) {
      fetchActivity(applications, rehomeList);
    }
  }, [applications, rehomeList, loadingApps, loadingRehome]);

  // Poll
  useEffect(() => {
    const t1 = setInterval(fetchApps,   POLL_APPS);
    const t2 = setInterval(fetchRehome, POLL_APPS);
    const t3 = setInterval(fetchMissing, POLL_STATS);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, [fetchApps, fetchRehome, fetchMissing]);

  // Custom events from other pages
  useEffect(() => {
    const onAdopt   = () => { fetchApps();   showToast('Adoption submitted — dashboard updated!'); };
    const onRehome  = () => { fetchRehome(); showToast('Rehome request submitted — dashboard updated!'); };
    const onMissing = () => { fetchMissing(); showToast('Missing pet report filed — dashboard updated!'); };
    const onPhoto   = (e) => { if (e.detail?.photoUrl !== undefined) setPhotoUrl(e.detail.photoUrl); };
    window.addEventListener('pawster:adoptionSubmitted',  onAdopt);
    window.addEventListener('pawster:rehomeSubmitted',    onRehome);
    window.addEventListener('pawster:missingPetReported', onMissing);
    window.addEventListener('pawster:photoUpdated',       onPhoto);
    return () => {
      window.removeEventListener('pawster:adoptionSubmitted',  onAdopt);
      window.removeEventListener('pawster:rehomeSubmitted',    onRehome);
      window.removeEventListener('pawster:missingPetReported', onMissing);
      window.removeEventListener('pawster:photoUpdated',       onPhoto);
    };
  }, [fetchApps, fetchRehome, fetchMissing]);

  // Derived counts
  const approved   = applications.filter(a => ['approved','Approved'].includes(a.status)).length;
  const pending    = applications.filter(a => ['pending','Pending'].includes(a.status)).length;
  const foundCount = missingList.filter(p => p.resolvedByUser).length;

  // Paginated slices
  const appsSlice   = applications.slice(appsPage * PAGE_SIZE,   (appsPage + 1) * PAGE_SIZE);
  const rehomeSlice = rehomeList.slice(rehomePage * PAGE_SIZE,  (rehomePage + 1) * PAGE_SIZE);
  const actSlice    = activityFeed.slice(actPage * PAGE_SIZE,   (actPage + 1) * PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif", color: '#1a2e0a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes newPop  { 0%{transform:scale(1.03);background:rgba(90,170,48,0.08)} 100%{transform:scale(1);background:transparent} }
        @keyframes fl1     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5%,8%)} }
        @keyframes fl2     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8%,5%)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#eddabb} ::-webkit-scrollbar-thumb{background:#c4a050;border-radius:3px}
        @media(max-width:960px)  { .dash-grid { grid-template-columns: 1fr !important } }
        @media(max-width:640px)  { .stat-grid { grid-template-columns: repeat(2,1fr) !important } .dash-wrap { padding: 1.5rem 1rem 4rem !important } }
        @media(max-width:360px)  { .stat-grid { grid-template-columns: 1fr !important } }
      `}</style>

      {/* ── Mesh background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.38, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.30, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

      <div className="dash-wrap" style={{ position: 'relative', zIndex: 10, maxWidth: 1180, margin: '0 auto', padding: '2.75rem 2rem 5rem' }}>

        {/* ── Page header ── */}
        <Reveal>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.875rem', padding: '0.22rem 0.8rem', borderRadius: 4, background: 'rgba(28,79,9,0.07)', border: '1px solid rgba(90,170,48,0.22)' }}>
              <i className="fas fa-th-large" style={{ fontSize: '0.58rem', color: '#1c4f09' }} />
              <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#1c4f09', fontStyle: 'italic' }}>Member Dashboard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.65rem,3vw,2.5rem)', fontWeight: 900, color: '#1a4a08', margin: '0 0 0.35rem', lineHeight: 1.1 }}>
                  Welcome back, <em style={{ fontStyle: 'italic', color: '#e07820' }}>{user?.firstName}</em>
                </h1>
                <p style={{ fontSize: '0.80rem', fontWeight: 700, color: '#3a5020', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  Your dashboard updates in real time <LiveBadge />
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={user?.firstName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(180,140,60,0.35)', boxShadow: '0 2px 10px rgba(0,0,0,0.10)' }} onError={() => setPhotoUrl(null)} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#1c4f09,#3a8a18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '1rem', color: '#fff', border: '2px solid rgba(180,140,60,0.35)', letterSpacing: '0.03em' }}>
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(180,140,60,0.25), transparent)', marginBottom: '1.75rem' }} />

        {/* ── Stat cards ── */}
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.875rem', marginBottom: '1.75rem' }}>
          <StatCard icon={SVG.file}   color="#1c7a09" value={applications.length} label="Adoptions"       sublabel={`${approved} approved`}                                                                    delay={0}   />
          <StatCard icon={SVG.home}   color="#B45A22" value={rehomeList.length}   label="Rehome Requests" sublabel={`${rehomeList.filter(r=>['Approved','approved'].includes(r.status)).length} approved`}     delay={60}  />
          <StatCard icon={SVG.mapPin} color="#c08010" value={missingList.length}  label="Missing Reports" sublabel={`${foundCount} resolved`}                                                                  delay={120} />
          <StatCard icon={SVG.clock}  color="#1a5fbf" value={pending}             label="Pending Review"  sublabel="awaiting decision"                                                                         delay={180} />
        </div>

        {/* ── Main grid ── */}
        <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Adoption applications */}
          <Reveal delay={40}>
            <Panel>
              <PanelHeader title="Adoption Applications" subtitle="Your submitted requests" badge={<LiveBadge />}>
                <IconBtn onClick={fetchApps} loading={loadingApps} title="Refresh" />
                <PillBtn to="/pets" label="Browse" color="#1c4f09" />
              </PanelHeader>
              <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {loadingApps
                  ? [1,2,3].map(i => <Skeleton key={i} />)
                  : appsSlice.length > 0
                    ? appsSlice.map((app, i) => <AppRow key={app.id ?? i} app={app} />)
                    : <EmptyState icon={SVG.paw} text="No adoption applications yet." linkTo="/pets" linkText="Browse available animals" color="#1c4f09" />
                }
              </div>
              {!loadingApps && (
                <div style={{ padding: '0 0.875rem 0.875rem' }}>
                  <Pagination page={appsPage} total={applications.length} pageSize={PAGE_SIZE} onChange={p => { setAppsPage(p); }} />
                </div>
              )}
            </Panel>
          </Reveal>

          {/* Rehome requests */}
          <Reveal delay={80}>
            <Panel>
              <PanelHeader title="Rehome & Rescue Requests" subtitle="Your submitted requests" badge={<LiveBadge />}>
                <IconBtn onClick={fetchRehome} loading={loadingRehome} title="Refresh" />
                <PillBtn to="/rehome" label="Submit" color="#B45A22" />
              </PanelHeader>
              <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {loadingRehome
                  ? [1,2,3].map(i => <Skeleton key={i} />)
                  : rehomeSlice.length > 0
                    ? rehomeSlice.map((item, i) => <RehomeRow key={item.id ?? i} item={item} />)
                    : <EmptyState icon={SVG.home} text="No rehome requests yet." linkTo="/rehome" linkText="Submit a rehome request" color="#B45A22" />
                }
              </div>
              {!loadingRehome && (
                <div style={{ padding: '0 0.875rem 0.875rem' }}>
                  <Pagination page={rehomePage} total={rehomeList.length} pageSize={PAGE_SIZE} onChange={p => { setRehomePage(p); }} />
                </div>
              )}
            </Panel>
          </Reveal>

          {/* Recent Activity — derived from real data */}
          <Reveal delay={120}>
            <Panel>
              <PanelHeader title="Recent Activity" subtitle="Based on your applications & requests" badge={<LiveBadge />}>
                <IconBtn onClick={() => rebuildActivity(applications, rehomeList)} loading={loadingAct} title="Refresh" />
              </PanelHeader>
              <div style={{ padding: '0 0.875rem 0', minHeight: 80 }}>
                {loadingAct
                  ? [1,2,3,4].map(i => <Skeleton key={i} h={36} r={8} />)
                  : actSlice.length > 0
                    ? actSlice.map((a, i) => (
                        <div key={a.id ?? i} style={{ animation: newActivityIds.has(a.id) ? 'newPop 1.2s ease both' : 'none', borderRadius: 8 }}>
                          <ActivityItem
                            icon={a.icon}
                            iconColor={a.iconColor}
                            title={a.title}
                            desc={a.desc}
                            time={a.time}
                            last={i === actSlice.length - 1}
                            isNew={newActivityIds.has(a.id)}
                          />
                        </div>
                      ))
                    : <EmptyState icon={SVG.activity} text="No recent activity yet. Submit an adoption or rehome request to see updates here." color="#7a8a60" />
                }
              </div>
              {!loadingAct && (
                <div style={{ padding: '0 0.875rem 0.875rem' }}>
                  <Pagination page={actPage} total={activityFeed.length} pageSize={PAGE_SIZE} onChange={p => setActPage(p)} />
                </div>
              )}
            </Panel>
          </Reveal>

          {/* Quick navigation */}
          <Reveal delay={160}>
            <Panel>
              <PanelHeader title="Quick Navigation" subtitle="Jump to any section of Pawster" />
              <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <QuickLink to="/pets"              icon={SVG.search}    color="#1c7a09" title="Browse Animals"    desc="Find your forever companion"       />
                <QuickLink to="/rehome"            icon={SVG.home}      color="#B45A22" title="Rehome a Pet"      desc="Submit a rehome or rescue request" />
                <QuickLink to="/missing-pets"      icon={SVG.mapPin}    color="#c08010" title="Missing Pets"      desc="Report or search lost animals"     />
                <QuickLink to="/follow-up-surveys" icon={SVG.clipboard} color="#1a5fbf" title="Follow-Up Surveys" desc="Check in on your adopted pet"      />
                <QuickLink to="/profile/edit"      icon={SVG.user}      color="#7040b0" title="Account Settings"  desc="Update your profile and password"  />
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(90,170,48,0.35)', background: 'rgba(255,248,218,0.88)', backdropFilter: 'blur(8px)', padding: '3rem 2.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: '3rem', marginBottom: '2.5rem', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <img src={logo} alt="Pawster" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a4a08' }}>Paw<em style={{ fontStyle: 'italic', color: '#e07820' }}>ster</em></div>
            <p style={{ fontSize: '0.80rem', fontWeight: 700, lineHeight: 1.8, color: '#6a7a50', maxWidth: 260, marginTop: '0.5rem' }}>
              Screening, placing, and supporting animal adoptions across Baguio City and the Cordillera Administrative Region with care and accountability.
            </p>
          </div>
          {[
            { title: "Adopt",    links: [["Browse animals", "/pets"], ["My profile", "/profile"], ["Log in", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How it works", "/how-it-works"], ["Rehome & Rescue", "/rehome"], ["Missing pets", "/missing-pets"], ["About us", "/about"]] },
            { title: "Provinces",  links: [["Baguio City", "/pets"], ["Benguet", "/pets"], ["Mountain Province", "/pets"], ["Ifugao", "/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1c4f09', marginBottom: '1rem' }}>{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} style={{ display: 'block', fontSize: '0.81rem', fontWeight: 700, color: '#3a5020', marginBottom: '0.5rem', textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(180,140,60,0.22)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#7a8a60' }}>© 2025 Pawster. All rights reserved. Made with 🐾 in Baguio City.</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {["fab fa-facebook-f", "fab fa-instagram", "fab fa-twitter"].map(icon => (
              <a key={icon} href="#" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontSize: '0.78rem', color: '#7a8a60', background: 'rgba(255,250,232,0.7)', border: '1px solid rgba(180,140,60,0.22)', textDecoration: 'none' }}>
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {toast && <Toast message={toast} />}
    </div>
  );
}