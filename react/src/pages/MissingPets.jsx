import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';
import logo from "../images/logo.png";

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
    <div ref={ref} style={{ transition: 'opacity 0.7s ease, transform 0.7s ease', transitionDelay: delay + 'ms', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)' }}>
      {children}
    </div>
  );
}

function PetPlaceholder({ species }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'rgba(180,140,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
      {species?.toLowerCase() === 'cat' ? '🐱' : '🐶'}
    </div>
  );
}

export default function MissingPets() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'lost', name: '', species: 'Dog', breed: '', area: '', color: '', details: '' });
  const [submitted, setSubmitted] = useState(false);

  const fetchPets = async () => {
    try {
      const res = await fetch('/api/missing-pets');
      if (res.ok) {
        const data = await res.json();
        setPets(data);
      }
    } catch (err) {
      console.error('Failed to fetch missing pets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const filtered = filter === 'all' ? pets : pets.filter(p => p.type === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/missing-pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, species: form.species || 'Dog' })
      });
      if (!res.ok) {
        console.error('Submit failed:', res.status, await res.text());
        return;
      }
    } catch (err) {
      console.error('Network error:', err);
      return;
    }
    setSubmitted(true);
    fetchPets();
    setTimeout(() => {
      setShowModal(false);
      setSubmitted(false);
      setForm({ type: 'lost', name: '', species: 'Dog', breed: '', area: '', color: '', details: '' });
    }, 2000);
  };

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
      `}</style>

      {/* Mesh bg */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: '#EDDABB' }} />
        <div style={{ position: 'absolute', width: 900, height: 900, top: '-20%', left: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#B45A22,transparent 70%)', filter: 'blur(120px)', opacity: 0.38, animation: 'fl1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 800, height: 800, bottom: '-15%', right: '-15%', borderRadius: '50%', background: 'radial-gradient(circle,#588B41,transparent 70%)', filter: 'blur(120px)', opacity: 0.38, animation: 'fl2 11s ease-in-out infinite' }} />
      </div>

      <Navbar />

      {/* Content */}
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
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3a5020', marginTop: '0.5rem' }}>Help reunite animals with their families across the Ilocos Region.</p>
            </div>
            <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: 12, fontWeight: 900, fontSize: '0.9rem', color: '#fff', background: '#B45A22', border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(180,90,34,0.30)', fontFamily: "'Nunito',sans-serif" }}>
              <i className="fas fa-plus" /> Report a Pet
            </button>
          </div>
        </Reveal>

        {/* Filter tabs */}
        <Reveal delay={100}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', background: 'rgba(255,248,220,0.6)', borderRadius: 50, padding: '0.3rem', border: '1px solid rgba(180,140,60,0.28)', marginBottom: '2rem' }}>
            {[['all', 'All Posts'], ['lost', 'Lost'], ['found', 'Found']].map(([val, lbl]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding: '0.45rem 1.3rem', borderRadius: 50, fontSize: '0.82rem', fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: filter === val ? (val === 'lost' ? '#c03030' : val === 'found' ? '#1c4f09' : '#1a4a08') : 'transparent', color: filter === val ? '#fff' : '#3a5020', transition: 'all 0.15s' }}>
                {lbl}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0', gap: '0.75rem', color: '#3a5020', fontWeight: 700, fontSize: '0.9rem' }}>
            <div style={{ width: 22, height: 22, border: '3px solid rgba(180,90,34,0.25)', borderTopColor: '#B45A22', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Loading reports...
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#3a5020' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐾</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>No reports yet</div>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6a7a50' }}>Be the first to post a missing or found pet in this area.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
            {filtered.map((pet, i) => (
              <Reveal key={pet.id} delay={i * 60}>
                <div style={{ background: 'rgba(255,248,225,0.85)', border: '1px solid rgba(180,140,60,0.28)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(100,70,20,0.11)', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ position: 'relative', height: 180 }}>
                    <PetPlaceholder species={pet.species} />
                    <span style={{ position: 'absolute', top: 10, left: 10, padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: pet.type === 'lost' ? 'rgba(192,48,48,0.88)' : 'rgba(28,79,9,0.88)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                      {pet.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                    </span>
                    <span style={{ position: 'absolute', top: 10, right: 10, padding: '0.25rem 0.75rem', borderRadius: 50, fontSize: '0.65rem', fontWeight: 800, background: 'rgba(10,6,2,0.55)', color: 'rgba(255,235,150,0.9)', backdropFilter: 'blur(6px)' }}>
                      {formatDate(pet.reportedDate)}
                    </span>
                  </div>
                  <div style={{ padding: '1.1rem 1.25rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1a4a08', marginBottom: '0.3rem' }}>{pet.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6a7a50', marginBottom: '0.6rem' }}>{pet.breed} · {pet.species}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 50, background: 'rgba(28,79,9,0.10)', color: '#1c4f09' }}>
                        <i className="fas fa-map-marker-alt" style={{ marginRight: '0.25rem' }} />{pet.area}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 50, background: 'rgba(180,140,60,0.12)', color: '#7a6020' }}>{pet.color}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'rgba(255,252,235,0.98)', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 480, margin: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'fadeUp 0.2s ease both' }} onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 900, color: '#1a4a08' }}>Report Submitted!</div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3a5020', marginTop: '0.5rem' }}>It's now live on the board.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 900, color: '#1a4a08', marginBottom: '1.5rem' }}>Report a Pet</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[['lost', 'Lost'], ['found', 'Found']].map(([val, lbl]) => (
                      <button type="button" key={val} onClick={() => setForm(f => ({ ...f, type: val }))} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", border: form.type === val ? 'none' : '1px solid rgba(180,140,60,0.28)', background: form.type === val ? (val === 'lost' ? '#c03030' : '#1c4f09') : 'rgba(255,250,232,0.7)', color: form.type === val ? '#fff' : '#3a5020' }}>{lbl}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Dog', 'Cat'].map(s => (
                      <button type="button" key={s} onClick={() => setForm(f => ({ ...f, species: s }))} style={{ flex: 1, padding: '0.5rem', borderRadius: 10, fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", border: form.species === s ? 'none' : '1px solid rgba(180,140,60,0.28)', background: form.species === s ? '#B45A22' : 'rgba(255,250,232,0.7)', color: form.species === s ? '#fff' : '#3a5020' }}>
                        {s === 'Dog' ? '🐶' : '🐱'} {s}
                      </button>
                    ))}
                  </div>
                  {[['name', 'Pet Name (or Unknown)'], ['breed', 'Breed'], ['area', 'Area / City'], ['color', 'Color / Markings']].map(([field, ph]) => (
                    <input key={field} placeholder={ph} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required style={{ padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(180,140,60,0.28)', background: 'rgba(255,250,232,0.7)', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#1a4a08', outline: 'none' }} />
                  ))}
                  <textarea placeholder="Additional details..." value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={3} style={{ padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(180,140,60,0.28)', background: 'rgba(255,250,232,0.7)', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#1a4a08', outline: 'none', resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 10, fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: 'transparent', border: '1px solid rgba(180,140,60,0.28)', color: '#3a5020' }}>Cancel</button>
                    <button type="submit" style={{ flex: 2, padding: '0.75rem', borderRadius: 10, fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", background: '#B45A22', color: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(180,90,34,0.28)' }}>Submit Report</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

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
              Connecting loving homes with animals in need across the Ilocos Region since 2023.
            </p>
          </div>
          {[
            { title: "Adopt", links: [["Browse Animals", "/pets"], ["My Profile", "/profile"], ["Log In", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How It Works", "/how-it-works"], ["Rehome a Pet", "/rehome"], ["Missing Pets", "/missing-pets"], ["About Us", "/about"]] },
            { title: "Regions", links: [["Ilocos Norte", "/pets"], ["Ilocos Sur", "/pets"], ["La Union", "/pets"], ["Pangasinan", "/pets"]] },
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