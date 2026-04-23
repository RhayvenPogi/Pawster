import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from "../images/logo.png";
import { usePageTitle } from '../hooks/usePageTitle';


const SB = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

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
    <div ref={ref} style={{ transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`, opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)' }}>
      {children}
    </div>
  );
}

// ── Photo component — uses DB endpoint instead of photoUrl ───────────────────
function PetPhoto({ pet }) {
  const [imgErr, setImgErr] = useState(false);
  const emoji = pet.species?.toLowerCase() === 'cat' ? '🐱' : '🐶';
  const photoSrc = `${SB}/api/missing-pets/${pet.id}/photo`;

  useEffect(() => { setImgErr(false); }, [pet.id]);

  if (!imgErr) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img
          src={photoSrc}
          alt={pet.name || 'Pet'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgErr(true)}
        />
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', background: 'rgba(180,140,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>{emoji}</div>
  );
}

const COMMON_SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Guinea Pig', 'Turtle', 'Snake', 'Lizard', 'Fish'];

function SpeciesCombobox({ value, onChange, hasErr }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || '');
  const wrapRef = useRef(null);

  useEffect(() => { setInputVal(value || ''); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COMMON_SPECIES.filter(s => s.toLowerCase().includes(inputVal.toLowerCase()));
  const showCustom = inputVal && !COMMON_SPECIES.some(s => s.toLowerCase() === inputVal.toLowerCase());
  const select = (val) => { setInputVal(val); onChange(val); setOpen(false); };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="mp-field"
          placeholder="Type or select species…"
          value={inputVal}
          onFocus={() => setOpen(true)}
          onChange={e => { setInputVal(e.target.value); onChange(e.target.value); setOpen(true); }}
          autoComplete="off"
          style={hasErr ? { borderColor: '#c03030', boxShadow: '0 0 0 3px rgba(192,48,48,0.12)', border: '2px solid #c03030' } : {}}
        />
        <button type="button" onClick={() => setOpen(o => !o)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aaa80', fontSize: '0.75rem', padding: 0 }}>
          {open ? '▴' : '▾'}
        </button>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 9999, background: 'rgba(255,252,235,0.99)', border: '1px solid rgba(180,140,60,0.35)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: 220, overflowY: 'auto' }}>
          {showCustom && (
            <div onMouseDown={() => select(inputVal)}
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#B45A22', cursor: 'pointer', borderBottom: '1px solid rgba(180,140,60,0.15)', background: 'rgba(180,90,34,0.04)' }}>
              + Use "{inputVal}"
            </div>
          )}
          {(filtered.length > 0 ? filtered : COMMON_SPECIES).map(s => (
            <div key={s} onMouseDown={() => select(s)}
              style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 700, color: inputVal === s ? '#B45A22' : '#1a4a08', cursor: 'pointer', background: inputVal === s ? 'rgba(180,90,34,0.08)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(180,90,34,0.06)'}
              onMouseLeave={e => { e.currentTarget.style.background = inputVal === s ? 'rgba(180,90,34,0.08)' : 'transparent'; }}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldErr({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', padding: '0.28rem 0.6rem', borderRadius: 6, background: 'rgba(192,48,48,0.09)', border: '1px solid rgba(192,48,48,0.22)' }}>
      <i className="fas fa-exclamation-circle" style={{ color: '#c03030', fontSize: '0.72rem', flexShrink: 0 }} />
      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#c03030' }}>{msg}</span>
    </div>
  );
}

function FLabel({ children, required }) {
  return (
    <div style={{ fontSize: '0.67rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6a7a50', marginBottom: '0.4rem' }}>
      {children}{required && <span style={{ color: '#c03030', marginLeft: '0.15rem' }}>*</span>}
    </div>
  );
}

function validateReport(form) {
  const errs = {};
  if (!form.species || !form.species.trim()) errs.species = "Species is required.";
  if (!form.area.trim())                     errs.area    = "City / Municipality is required.";
  if (!form.address.trim())                  errs.address = "Address where lost or found is required.";
  return errs;
}

export default function MissingPets() {
  const { user } = useAuth();
  const [pets, setPets]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'lost', name: '', species: 'Dog', breed: '', area: '', address: '', color: '', details: '' });
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formErrs, setFormErrs]         = useState({});
  const [touched, setTouched]           = useState(false);
  const fileRef = useRef(null);

  const [expandedComments, setExpandedComments]   = useState({});
  const [comments, setComments]                   = useState({});
  const [commentInputs, setCommentInputs]         = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  const fetchPets = async () => {
  try {
    const token = getToken();
    const res = await fetch(`${SB}/api/missing-pets`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) setPets(await res.json());
  } catch (err) { console.error('Failed to fetch missing pets:', err); }
  finally { setLoading(false); }
};

  useEffect(() => { fetchPets(); }, []);

  const filtered = filter === 'all' ? pets : pets.filter(p => p.type === filter);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '';
  const formatRelative = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime() - 8*3600*1000;
    const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), day = Math.floor(h/24);
    if (s < 60) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (day < 7) return `${day}d ago`;
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fetchComments = async (petId) => {
  try {
    const token = getToken();
    const res = await fetch(`${SB}/api/missing-pets/${petId}/comments`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [petId]: data }));
      }
    } catch (err) { console.error(err); }
  };

  const toggleComments = (petId) => {
    setExpandedComments(prev => {
      const nowOpen = !prev[petId];
      if (nowOpen && !comments[petId]) fetchComments(petId);
      return { ...prev, [petId]: nowOpen };
    });
  };

  const submitComment = async (petId) => {
    const content = commentInputs[petId]?.trim();
    if (!content || !user) return;
    setCommentSubmitting(prev => ({ ...prev, [petId]: true }));
    try {
      const token = getToken();
      const res = await fetch(`${SB}/api/missing-pets/${petId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, authorName: `${user.firstName} ${user.lastName}`, content }),
      });
      if (res.ok) { setCommentInputs(prev => ({ ...prev, [petId]: '' })); fetchComments(petId); }
    } catch (err) { console.error(err); }
    finally { setCommentSubmitting(prev => ({ ...prev, [petId]: false })); }
  };

  const resolveReport = async (petId) => {
    if (!user) return;
    try {
      const token = getToken();
      const res = await fetch(`${SB}/api/missing-pets/${petId}/resolve?userId=${user.id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) fetchPets();
    } catch (err) { console.error(err); }
  };

  const handlePhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert('Photo must be under 5 MB.'); return; }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const updateField = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched) setFormErrs(validateReport(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validateReport(form);
    setFormErrs(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries({
        type: form.type, name: form.name, species: form.species || 'Dog',
        breed: form.breed, area: form.area, address: form.address,
        color: form.color, details: form.details,
      }).forEach(([k, v]) => fd.append(k, v));
      if (user?.id) fd.append('reporterUserId', user.id);
      if (photoFile) fd.append('photo', photoFile);
      const token = getToken();
      const res = await fetch(`${SB}/api/missing-pets`, {
      method: 'POST',
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) { console.error('Submit failed:', res.status); setSubmitting(false); return; }
    } catch (err) { console.error(err); setSubmitting(false); return; }

    setSubmitted(true);
    setSubmitting(false);
    fetchPets();
    setTimeout(() => {
      setShowModal(false); setSubmitted(false); setPhotoFile(null); setPhotoPreview(null);
      setFormErrs({}); setTouched(false);
      setForm({ type: 'lost', name: '', species: 'Dog', breed: '', area: '', address: '', color: '', details: '' });
    }, 2500);
  };

  const closeModal = () => {
    setShowModal(false); setSubmitted(false); setPhotoFile(null); setPhotoPreview(null);
    setFormErrs({}); setTouched(false);
    setForm({ type: 'lost', name: '', species: 'Dog', breed: '', area: '', address: '', color: '', details: '' });
  };

  const errCount = Object.keys(formErrs).length;

  usePageTitle('Missing Pets');

  return (
    <div style={{ minHeight: '100vh', background: '#EDDABB', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0)}50%{transform:translate(5%,8%)}}
        @keyframes fl2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,5%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
        .mp-upload-zone{border:2px dashed rgba(180,90,34,0.40);border-radius:12px;padding:1rem;text-align:center;cursor:pointer;background:rgba(255,248,220,0.5);transition:all 0.15s;}
        .mp-upload-zone:hover{border-color:rgba(180,90,34,0.75);background:rgba(255,248,220,0.80);}
        .mp-field{padding:0.75rem 1rem;border-radius:10px;border:1px solid rgba(180,140,60,0.28);background:rgba(255,250,232,0.7);font-family:'Nunito',sans-serif;font-weight:700;font-size:0.88rem;color:#1a4a08;outline:none;width:100%;transition:border-color 0.15s,box-shadow 0.15s;box-sizing:border-box;}
        .mp-field:focus{border-color:#B45A22;box-shadow:0 0 0 3px rgba(180,90,34,0.12);}
        .mp-field-err{border:2px solid #c03030 !important;box-shadow:0 0 0 3px rgba(192,48,48,0.12) !important;}
        .mp-card{background:rgba(255,248,225,0.88);border:1px solid rgba(180,140,60,0.28);border-radius:20px;overflow:visible;box-shadow:0 4px 20px rgba(100,70,20,0.11);transition:transform 0.2s,box-shadow 0.2s;}
        .mp-card:hover{transform:translateY(-5px);box-shadow:0 8px 32px rgba(100,70,20,0.18);}
        .mp-comment-toggle{width:100%;padding:0.55rem 1.25rem;background:rgba(255,248,220,0.5);border:none;border-top:1px solid rgba(180,140,60,0.18);font-size:0.75rem;font-weight:800;color:#6a7a50;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:'Nunito',sans-serif;}
        .mp-comment-toggle:hover{background:rgba(255,244,210,0.75);}
        .mp-resolve-btn{width:100%;padding:0.55rem;border-radius:10px;font-size:0.78rem;font-weight:800;cursor:pointer;font-family:'Nunito',sans-serif;background:rgba(28,79,9,0.08);border:1px solid rgba(28,79,9,0.25);color:#1c4f09;display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-top:0.75rem;transition:background 0.15s;}
        .mp-resolve-btn:hover{background:rgba(28,79,9,0.15);}
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.38, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.38, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>


      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '4rem 2.5rem 6rem' }}>
        <Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 50, padding: '0.3rem 1rem', fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic', marginBottom: '1rem', background: 'rgba(180,90,34,0.10)', border: '1px solid rgba(180,90,34,0.28)', color: '#B45A22' }}>
            <i className="fas fa-search-location" style={{ fontSize: '0.65rem' }} /> Community Board
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.2rem,4vw,3.2rem)', fontWeight: 900, color: '#1a4a08', lineHeight: 1.1 }}>
                <em style={{ fontStyle: 'italic', color: '#B45A22' }}>Missing</em> Pets Board
              </h1>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3a5020', marginTop: '0.5rem' }}>
                Help reunite animals with their families across the Ilocos Region.
              </p>
              {pets.length > 0 && (
                <p style={{ fontSize: '0.80rem', fontWeight: 700, color: '#9aaa80', marginTop: '0.25rem' }}>
                  {pets.filter(p => p.type === 'lost').length} lost · {pets.filter(p => p.type === 'found').length} found
                </p>
              )}
            </div>
            <button onClick={() => setShowModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: 12, fontWeight: 900, fontSize: '0.9rem', color: '#fff', background: '#B45A22', border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(180,90,34,0.30)', fontFamily: "'Nunito',sans-serif" }}>
              <i className="fas fa-plus" /> Report a Pet
            </button>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', background: 'rgba(255,248,220,0.6)', borderRadius: 50, padding: '0.3rem', border: '1px solid rgba(180,140,60,0.28)', marginBottom: '2rem' }}>
            {[['all', 'All Posts'], ['lost', 'Lost'], ['found', 'Found']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: '0.45rem 1.3rem', borderRadius: 50, fontSize: '0.82rem', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: filter === val ? (val === 'lost' ? '#c03030' : val === 'found' ? '#1c4f09' : '#1a4a08') : 'transparent', color: filter === val ? '#fff' : '#3a5020', transition: 'all 0.15s' }}>
                {lbl}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.1rem', borderRadius: 12, background: 'rgba(212,136,10,0.09)', border: '1px solid rgba(212,136,10,0.25)', marginBottom: '1.5rem' }}>
            <i className="fas fa-clock" style={{ color: '#d4880a', fontSize: '0.85rem' }} />
            <p style={{ fontSize: '0.80rem', fontWeight: 700, color: '#b07010', margin: 0 }}>
              Reports are reviewed before appearing publicly. Most are approved within a few hours.
            </p>
          </div>
        </Reveal>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0', gap: '0.75rem', color: '#3a5020', fontWeight: 700 }}>
            <div style={{ width: 22, height: 22, border: '3px solid rgba(180,90,34,0.25)', borderTopColor: '#B45A22', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Loading reports...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#3a5020' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>No reports yet</div>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6a7a50' }}>Be the first to post a missing or found pet in this area.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem' }}>
            {filtered.map((pet, i) => (
              <Reveal key={pet.id} delay={i * 60}>
                <div className="mp-card">
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
                    <PetPhoto pet={pet} />
                    <span style={{ position: 'absolute', top: 10, left: 10, padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: pet.type === 'lost' ? 'rgba(192,48,48,0.90)' : 'rgba(28,79,9,0.90)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                      {pet.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                    </span>
                    {pet.resolvedByUser && (
                      <span style={{ position: 'absolute', bottom: 10, left: 10, padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.65rem', fontWeight: 800, background: 'rgba(24,95,165,0.88)', color: '#fff' }}>✅ Resolved</span>
                    )}
                    <span style={{ position: 'absolute', top: 10, right: 10, padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.65rem', fontWeight: 800, background: 'rgba(10,6,2,0.60)', color: 'rgba(255,235,150,0.95)' }}>{formatDate(pet.reportedDate)}</span>
                  </div>
                  <div style={{ padding: '1.1rem 1.25rem 0.75rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1a4a08', marginBottom: '0.25rem' }}>{pet.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6a7a50', marginBottom: '0.55rem' }}>{[pet.species, pet.breed].filter(Boolean).join(' · ')}</div>
                    {pet.address && (
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: '#3a5020', marginBottom: '0.55rem', display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                        <i className="fas fa-map-marker-alt" style={{ color: '#B45A22', marginTop: '0.1rem', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{pet.address}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {pet.area && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 50, background: 'rgba(28,79,9,0.10)', color: '#1c4f09' }}><i className="fas fa-city" style={{ marginRight: '0.25rem' }} />{pet.area}</span>}
                      {pet.color && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 50, background: 'rgba(180,140,60,0.12)', color: '#7a6020' }}>{pet.color}</span>}
                    </div>
                    {pet.details && <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6a7a50', marginTop: '0.6rem', lineHeight: 1.55, borderTop: '1px solid rgba(180,140,60,0.18)', paddingTop: '0.55rem' }}>{pet.details.length > 100 ? pet.details.slice(0, 100) + '…' : pet.details}</p>}
                    {user && user.id === pet.reporterUserId && (
                      !pet.resolvedByUser
                        ? <button className="mp-resolve-btn" onClick={() => resolveReport(pet.id)}><i className="fas fa-check-circle" /> Mark as Resolved — Pet has been found</button>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontWeight: 800, color: '#1c4f09' }}><i className="fas fa-check-circle" /> You marked this pet as found</span>
                    )}
                  </div>
                  <button className="mp-comment-toggle" onClick={() => toggleComments(pet.id)}>
                    <span><i className="fas fa-comment-dots" style={{ marginRight: '0.35rem' }} />Comments {comments[pet.id] ? `(${comments[pet.id].length})` : ''}</span>
                    <span style={{ fontSize: '0.65rem' }}>{expandedComments[pet.id] ? '▴' : '▾'}</span>
                  </button>
                  {expandedComments[pet.id] && (
                    <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: '1px solid rgba(180,140,60,0.12)' }}>
                      {(comments[pet.id] || []).length === 0 && <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9aaa80', margin: '0 0 0.75rem' }}>No comments yet. Be the first to leave a tip!</p>}
                      {(comments[pet.id] || []).map(c => (
                        <div key={c.id} style={{ paddingBottom: '0.55rem', marginBottom: '0.55rem', borderBottom: '1px solid rgba(180,140,60,0.12)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1a4a08' }}>{c.authorName}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9aaa80' }}>{formatRelative(c.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3a5020', margin: 0, lineHeight: 1.5 }}>{c.content}</p>
                        </div>
                      ))}
                      {user ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <textarea className="mp-field" rows={2} placeholder="Leave a tip or sighting…"
                            value={commentInputs[pet.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [pet.id]: e.target.value }))}
                            style={{ resize: 'vertical', minHeight: 60, fontSize: '0.78rem' }} />
                          <button onClick={() => submitComment(pet.id)} disabled={commentSubmitting[pet.id] || !commentInputs[pet.id]?.trim()}
                            style={{ marginTop: '0.4rem', padding: '0.45rem 1.1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: '#B45A22', color: '#fff', border: 'none', opacity: commentSubmitting[pet.id] || !commentInputs[pet.id]?.trim() ? 0.5 : 1 }}>
                            {commentSubmitting[pet.id] ? 'Posting…' : 'Post Comment'}
                          </button>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.73rem', fontWeight: 700, color: '#9aaa80', margin: '0.5rem 0 0' }}>
                          <Link to="/login" style={{ color: '#B45A22', textDecoration: 'underline' }}>Log in</Link> to leave a comment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* ── Report Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(6px)', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{ background: 'rgba(255,252,235,0.99)', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.30)', animation: 'fadeUp 0.22s ease both', border: '1px solid rgba(180,140,60,0.28)' }}
            onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 900, color: '#1a4a08', marginBottom: '0.5rem' }}>Report Submitted!</div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3a5020', lineHeight: 1.6 }}>Your report is under review and will appear once approved — usually within a few hours.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(180,140,60,0.22)', background: 'linear-gradient(135deg,rgba(180,90,34,0.07),rgba(212,136,10,0.04))', flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.25rem', fontWeight: 900, color: '#1a4a08' }}>Report a <em style={{ fontStyle: 'italic', color: '#B45A22' }}>Pet</em></div>
                  <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(180,140,60,0.28)', background: 'rgba(255,248,220,0.7)', color: '#6a7a50', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-times" />
                  </button>
                </div>

                {/* Error banner */}
                <div style={{ flexShrink: 0, overflow: 'hidden', maxHeight: errCount > 0 ? '80px' : '0px', padding: errCount > 0 ? '0.75rem 1.5rem 0' : '0 1.5rem', transition: 'max-height 0.25s ease, padding 0.25s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.6rem 0.875rem', borderRadius: 10, background: 'rgba(192,48,48,0.10)', border: '1px solid rgba(192,48,48,0.35)' }}>
                    <i className="fas fa-exclamation-triangle" style={{ color: '#c03030', fontSize: '0.85rem', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c03030' }}>
                      {errCount === 1
                        ? '1 required field needs attention — please fill it in before submitting.'
                        : `${errCount} required fields need attention — please fill them in before submitting.`}
                    </span>
                  </div>
                </div>

                {/* Scrollable form */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
                  <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Type toggle */}
                    <div>
                      <FLabel>Report Type</FLabel>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[['lost', '🔴 Lost'], ['found', '🟢 Found']].map(([val, lbl]) => (
                          <button type="button" key={val} onClick={() => updateField('type', val)}
                            style={{ flex: 1, padding: '0.65rem', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", border: form.type === val ? 'none' : '1px solid rgba(180,140,60,0.28)', background: form.type === val ? (val === 'lost' ? '#c03030' : '#1c4f09') : 'rgba(255,250,232,0.7)', color: form.type === val ? '#fff' : '#3a5020' }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Species */}
                    <div>
                      <FLabel required>Species</FLabel>
                      <SpeciesCombobox value={form.species} onChange={(val) => updateField('species', val)} hasErr={!!formErrs.species} />
                      <FieldErr msg={formErrs.species} />
                      <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#9aaa80', marginTop: '0.3rem' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '0.25rem' }} />Select from the list or type any species (e.g. Parrot, Ferret, Horse…)
                      </div>
                    </div>

                    {/* Photo */}
                    <div>
                      <FLabel>Photo <span style={{ fontWeight: 700, textTransform: 'none', fontSize: '0.62rem', color: '#9aaa80' }}>(recommended)</span></FLabel>
                      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                      <div className="mp-upload-zone" onClick={() => fileRef.current?.click()}>
                        {photoPreview ? (
                          <div style={{ position: 'relative' }}>
                            <img src={photoPreview} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />
                            <button type="button" onClick={e => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                              style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(192,48,48,0.88)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="fas fa-times" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <i className="fas fa-camera" style={{ fontSize: '1.6rem', color: '#B45A22', display: 'block', marginBottom: '0.35rem' }} />
                            <div style={{ fontSize: '0.80rem', fontWeight: 800, color: '#3a5020' }}>Click to upload a photo</div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9aaa80', marginTop: '0.12rem' }}>JPG, PNG, WEBP · max 5 MB</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pet name */}
                    <div>
                      <FLabel>Pet Name</FLabel>
                      <input className="mp-field" placeholder="Pet's name (or 'Unknown')" value={form.name} onChange={e => updateField('name', e.target.value)} />
                    </div>

                    {/* Breed */}
                    <div>
                      <FLabel>Breed</FLabel>
                      <input className="mp-field" placeholder="e.g. Aspin, Tabby, Shih Tzu" value={form.breed} onChange={e => updateField('breed', e.target.value)} />
                    </div>

                    {/* Color */}
                    <div>
                      <FLabel>Color / Markings</FLabel>
                      <input className="mp-field" placeholder="e.g. Brown & white, Black" value={form.color} onChange={e => updateField('color', e.target.value)} />
                    </div>

                    {/* City */}
                    <div>
                      <FLabel required>City / Municipality</FLabel>
                      <input
                        className={`mp-field${formErrs.area ? ' mp-field-err' : ''}`}
                        placeholder="e.g. Laoag City, Vigan City"
                        value={form.area}
                        onChange={e => updateField('area', e.target.value)}
                      />
                      <FieldErr msg={formErrs.area} />
                    </div>

                    {/* Address */}
                    <div>
                      <FLabel required>Full Address Where {form.type === 'lost' ? 'Lost' : 'Found'}</FLabel>
                      <input
                        className={`mp-field${formErrs.address ? ' mp-field-err' : ''}`}
                        placeholder="Street, Barangay, City"
                        value={form.address}
                        onChange={e => updateField('address', e.target.value)}
                      />
                      <FieldErr msg={formErrs.address} />
                      <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#9aaa80', marginTop: '0.3rem' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '0.25rem' }} />This helps us pin the location on our community map.
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <FLabel>Additional Details</FLabel>
                      <textarea className="mp-field" placeholder="Contact number, distinctive features, circumstances…"
                        value={form.details} onChange={e => updateField('details', e.target.value)}
                        rows={3} style={{ resize: 'vertical', minHeight: 80 }} />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button type="button" onClick={closeModal}
                        style={{ flex: 1, padding: '0.78rem', borderRadius: 10, fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: 'transparent', border: '1px solid rgba(180,140,60,0.28)', color: '#3a5020' }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting}
                        style={{ flex: 2, padding: '0.78rem', borderRadius: 10, fontWeight: 900, fontSize: '0.88rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'Nunito',sans-serif", background: submitting ? '#9a6030' : '#B45A22', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(180,90,34,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: submitting ? 0.75 : 1 }}>
                        {submitting ? <><i className="fas fa-spinner" style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</> : <><i className="fas fa-paper-plane" /> Submit Report</>}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

       {/* Footer */}
            <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
              <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                <div>
                  <div className="mb-2">
                    <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
                  </div>
                  <div className="font-black text-[1.2rem] text-[#1a4a08]">Paw<em className="italic text-[#e07820]">ster</em></div>
                  <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
                    Screening, placing, and supporting animal adoptions across Baguio City and the Cordillera Administrative Region with care and accountability.
                  </p>
                </div>
                {[
                  { title: "Adopt", links: [["Browse animals", "/pets"], ["My profile", "/profile"], ["Log in", "/login"], ["Register", "/register"]] },
                  { title: "Services", links: [["How it works", "/how-it-works"], ["Rehome & Rescue", "/rehome"], ["Missing pets", "/missing-pets"], ["About us", "/about"]] },
                  { title: "Regions", links: [["Baguio City", "/pets"], ["Benguet", "/pets"], ["Mountain Province", "/pets"], ["Ifugao", "/pets"]] },
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
                <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in Baguio City.</div>
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