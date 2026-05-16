import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../config/axios';

// ── Philippine Zip Code Database (PHLPost) ──────────────────────────────────
const PHL_ZIP_DB = [
  ["NCR","Metro Manila","Binondo",1006],["NCR","Metro Manila","Ermita",1000],["NCR","Metro Manila","Intramuros",1002],["NCR","Metro Manila","Malate",1004],["NCR","Metro Manila","Paco",1007],["NCR","Metro Manila","Pandacan",1011],["NCR","Metro Manila","Port Area",1018],["NCR","Metro Manila","Quiapo",1001],["NCR","Metro Manila","Sampaloc",1008],["NCR","Metro Manila","San Andres",1015],["NCR","Metro Manila","San Miguel",1005],["NCR","Metro Manila","San Nicolas",1010],["NCR","Metro Manila","Santa Ana",1009],["NCR","Metro Manila","Santa Cruz",1003],["NCR","Metro Manila","Santa Mesa",1016],["NCR","Metro Manila","Tondo",1013],
  ["NCR","Metro Manila","Makati CPO",1200],["NCR","Metro Manila","Bel-Air",1209],["NCR","Metro Manila","Cembo",1201],["NCR","Metro Manila","Dasmariñas Village",1221],["NCR","Metro Manila","Forbes Park",1219],["NCR","Metro Manila","Guadalupe Nuevo",1212],["NCR","Metro Manila","Guadalupe Viejo",1211],["NCR","Metro Manila","Pio del Pilar",1230],["NCR","Metro Manila","Poblacion Makati",1210],["NCR","Metro Manila","Rockwell",1210],["NCR","Metro Manila","San Lorenzo Village",1223],["NCR","Metro Manila","Urdaneta Village",1222],
  ["NCR","Metro Manila","Quezon City CPO",1100],["NCR","Metro Manila","Balara",1119],["NCR","Metro Manila","Batasan Hills",1126],["NCR","Metro Manila","Cubao",1109],["NCR","Metro Manila","Diliman",1101],["NCR","Metro Manila","Fairview",1118],["NCR","Metro Manila","Kamuning",1103],["NCR","Metro Manila","Kamias",1102],["NCR","Metro Manila","Lagro",1116],["NCR","Metro Manila","Novaliches",1123],["NCR","Metro Manila","Pasong Tamo QC",1107],["NCR","Metro Manila","Project 2 & 3",1102],["NCR","Metro Manila","Project 4",1109],["NCR","Metro Manila","Project 6",1100],["NCR","Metro Manila","Project 7",1105],["NCR","Metro Manila","Project 8",1106],["NCR","Metro Manila","Sauyo",1116],["NCR","Metro Manila","Tandang Sora",1116],["NCR","Metro Manila","Teachers Village",1101],["NCR","Metro Manila","UP Village",1101],["NCR","Metro Manila","West Triangle",1104],["NCR","Metro Manila","Holy Spirit",1127],["NCR","Metro Manila","Payatas",1119],["NCR","Metro Manila","Commonwealth",1121],["NCR","Metro Manila","Bagumbayan",1110],["NCR","Metro Manila","Bagong Silangan",1124],["NCR","Metro Manila","Claro",1101],
  ["NCR","Metro Manila","Caloocan CPO",1400],["NCR","Metro Manila","Bagong Barrio",1400],["NCR","Metro Manila","EDSA Caloocan",1403],["NCR","Metro Manila","Grace Park",1403],["NCR","Metro Manila","Maypajo",1406],["NCR","Metro Manila","Pasong Putik",1404],["NCR","Metro Manila","Deparo",1409],["NCR","Metro Manila","Camarin",1422],["NCR","Metro Manila","Bagumbong",1421],
  ["NCR","Metro Manila","Malabon CPO",1470],["NCR","Metro Manila","Navotas CPO",1485],["NCR","Metro Manila","Valenzuela CPO",1440],["NCR","Metro Manila","Karuhatan",1441],["NCR","Metro Manila","Lingunan",1446],["NCR","Metro Manila","Mapulang Lupa",1448],["NCR","Metro Manila","Malinta CPO",1440],
  ["NCR","Metro Manila","Pasay CPO",1300],["NCR","Metro Manila","Pasig CPO",1600],["NCR","Metro Manila","Pasig Kapitolyo",1603],["NCR","Metro Manila","Ortigas Center",1605],["NCR","Metro Manila","Mandaluyong CPO",1550],["NCR","Metro Manila","Mandaluyong Wack-Wack",1555],
  ["NCR","Metro Manila","Marikina CPO",1800],["NCR","Metro Manila","Marikina Concepcion",1810],["NCR","Metro Manila","San Juan CPO",1500],["NCR","Metro Manila","Greenhills",1502],["NCR","Metro Manila","Eisenhower-Crame",1504],
  ["NCR","Metro Manila","Parañaque CPO",1700],["NCR","Metro Manila","BF Homes Parañaque",1720],["NCR","Metro Manila","Sto. Niño Parañaque",1709],["NCR","Metro Manila","Las Piñas CPO",1740],["NCR","Metro Manila","Muntinlupa CPO",1770],["NCR","Metro Manila","Alabang",1771],["NCR","Metro Manila","Sucat",1767],
  ["NCR","Metro Manila","Taguig CPO",1630],["NCR","Metro Manila","Bonifacio Global City",1635],["NCR","Metro Manila","Fort Bonifacio",1634],["NCR","Metro Manila","Ususan",1639],["NCR","Metro Manila","Pateros CPO",1620],
  ["Region 4A (CALABARZON)","Laguna","Biñan",4024],["Region 4A (CALABARZON)","Laguna","Calamba",4027],["Region 4A (CALABARZON)","Laguna","San Pedro",4023],["Region 4A (CALABARZON)","Laguna","Sta. Rosa",4026],["Region 4A (CALABARZON)","Laguna","Cabuyao",4025],["Region 4A (CALABARZON)","Laguna","Los Baños",4030],["Region 4A (CALABARZON)","Laguna","Bay",4033],["Region 4A (CALABARZON)","Laguna","Calauan",4012],["Region 4A (CALABARZON)","Laguna","San Pablo",4000],["Region 4A (CALABARZON)","Laguna","Siniloan",4019],
  ["Region 4A (CALABARZON)","Cavite","Cavite City",4100],["Region 4A (CALABARZON)","Cavite","Bacoor",4102],["Region 4A (CALABARZON)","Cavite","Imus",4103],["Region 4A (CALABARZON)","Cavite","Dasmariñas",4114],["Region 4A (CALABARZON)","Cavite","Tagaytay",4120],["Region 4A (CALABARZON)","Cavite","Trece Martires",4109],["Region 4A (CALABARZON)","Cavite","Silang",4118],
  ["Region 4A (CALABARZON)","Rizal","Antipolo",1870],["Region 4A (CALABARZON)","Rizal","Cainta",1900],["Region 4A (CALABARZON)","Rizal","Taytay",1920],["Region 4A (CALABARZON)","Rizal","Angono",1930],["Region 4A (CALABARZON)","Rizal","Binangonan",1940],
  ["Region 4A (CALABARZON)","Batangas","Batangas City",4200],["Region 4A (CALABARZON)","Batangas","Lipa",4217],["Region 4A (CALABARZON)","Batangas","Tanauan",4232],
  ["Region 4A (CALABARZON)","Quezon","Lucena",4301],["Region 4A (CALABARZON)","Quezon","Tayabas",4327],
  ["Region 3 (Central Luzon)","Bulacan","Malolos",3000],["Region 3 (Central Luzon)","Bulacan","Meycauayan",3020],["Region 3 (Central Luzon)","Bulacan","Marilao",3019],["Region 3 (Central Luzon)","Bulacan","San Jose del Monte",3023],
  ["Region 3 (Central Luzon)","Pampanga","San Fernando",2000],["Region 3 (Central Luzon)","Pampanga","Angeles",2009],["Region 3 (Central Luzon)","Pampanga","Mabalacat",2010],
  ["Region 3 (Central Luzon)","Nueva Ecija","Cabanatuan",3100],["Region 3 (Central Luzon)","Nueva Ecija","Palayan",3132],
  ["Region 3 (Central Luzon)","Bataan","Balanga",2100],["Region 3 (Central Luzon)","Tarlac","Tarlac City",2300],["Region 3 (Central Luzon)","Zambales","Olongapo",2200],
  ["Region 1 (Ilocos Region)","Pangasinan","Dagupan",2400],["Region 1 (Ilocos Region)","La Union","San Fernando City",2500],["Region 1 (Ilocos Region)","Ilocos Norte","Laoag City",2900],["Region 1 (Ilocos Region)","Ilocos Sur","Vigan",2700],
  ["Region 2 (Cagayan Valley)","Cagayan","Tuguegarao",3500],["Region 2 (Cagayan Valley)","Isabela","Ilagan",3300],["Region 2 (Cagayan Valley)","Nueva Vizcaya","Bayombong",3700],
  ["CAR (Cordillera)","Benguet","Baguio",2600],["CAR (Cordillera)","Benguet","La Trinidad",2601],["CAR (Cordillera)","Ifugao","Lagawe",3600],["CAR (Cordillera)","Mountain Province","Bontoc",2616],["CAR (Cordillera)","Kalinga","Tabuk",3800],
  ["Region 4B (MIMAROPA)","Palawan","Puerto Princesa",5300],["Region 4B (MIMAROPA)","Oriental Mindoro","Calapan",5200],
  ["Region 5 (Bicol)","Camarines Sur","Naga",4400],["Region 5 (Bicol)","Albay","Legazpi",4500],["Region 5 (Bicol)","Sorsogon","Sorsogon City",4700],
  ["Region 6 (Western Visayas)","Iloilo","Iloilo City",5000],["Region 6 (Western Visayas)","Negros Occidental","Bacolod",6100],
  ["Region 7 (Central Visayas)","Cebu","Cebu City",6000],["Region 7 (Central Visayas)","Cebu","Mandaue",6014],["Region 7 (Central Visayas)","Bohol","Tagbilaran",6300],["Region 7 (Central Visayas)","Negros Oriental","Dumaguete",6200],
  ["Region 8 (Eastern Visayas)","Leyte","Tacloban",6500],["Region 8 (Eastern Visayas)","Leyte","Ormoc",6541],
  ["Region 9 (Zamboanga)","Zamboanga City","Zamboanga City",7000],["Region 9 (Zamboanga)","Zamboanga del Norte","Dipolog",7100],
  ["Region 10 (Northern Mindanao)","Misamis Oriental","Cagayan de Oro",9000],["Region 10 (Northern Mindanao)","Lanao del Norte","Iligan",9200],
  ["Region 11 (Davao)","Davao del Sur","Davao City",8000],["Region 11 (Davao)","Davao del Norte","Tagum",8100],
  ["Region 12 (SOCCSKSARGEN)","South Cotabato","General Santos",9500],["Region 12 (SOCCSKSARGEN)","North Cotabato","Kidapawan",9400],
  ["BARMM","Maguindanao del Norte","Cotabato City",9600],["BARMM","Lanao del Sur","Marawi",9700],
  ["Region 13 (Caraga)","Agusan del Norte","Butuan",8600],["Region 13 (Caraga)","Surigao del Norte","Surigao City",8400],
];

function lookupZip(city) {
  if (!city || city.trim().length < 2) return [];
  const q = city.toLowerCase();
  return PHL_ZIP_DB.filter(r => r[2].toLowerCase().includes(q));
}

// ── Reusable Field ──────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div style={{ marginBottom: '0.95rem', display: 'flex', flexDirection: 'column' }}>
      <label htmlFor={id} style={{
        fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase',
        letterSpacing: '0.07em', fontStyle: 'italic', marginBottom: '0.38rem',
        color: error ? '#c03030' : '#276010',
      }}>
        {label}
      </label>
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="cp-field"
        style={{
          display: 'block', width: '100%', padding: '0.75rem 0.9rem',
          border: `2px solid ${error ? '#d04040' : '#5aaa30'}`,
          borderLeft: error ? '4px solid #d04040' : '2px solid #5aaa30',
          borderRadius: 10,
          background: error ? 'rgba(253,240,240,0.60)' : 'rgba(255,250,232,0.52)',
          fontFamily: "'Nunito',sans-serif", fontSize: '0.9rem',
          fontWeight: 600, color: '#222', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
        }}
      />
      {error && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#c03030', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.28rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Zip Field with dropdown ─────────────────────────────────────────────────
function ZipField({ city, value, onChange, onSelect, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow]               = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (city && city.trim().length >= 2) {
      const matches = lookupZip(city);
      setSuggestions(matches.slice(0, 10));
      setShow(matches.length > 0);
    } else {
      setSuggestions([]); setShow(false);
    }
  }, [city]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    onChange(e);
    const q = e.target.value;
    if (q.length >= 2) { const m = lookupZip(q); setSuggestions(m.slice(0, 10)); setShow(m.length > 0); }
    else { setSuggestions([]); setShow(false); }
  };

  return (
    <div style={{ marginBottom: '0.95rem', display: 'flex', flexDirection: 'column' }}>
      <label htmlFor="zip" style={{
        fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase',
        letterSpacing: '0.07em', fontStyle: 'italic', marginBottom: '0.38rem',
        color: error ? '#c03030' : '#276010',
      }}>
        Zip / Postal Code
      </label>
      <div style={{ position: 'relative' }} ref={wrapRef}>
        <input id="zip" type="text" placeholder="Auto-fills from city, or search here…"
          value={value} onChange={handleInput} className="cp-field"
          onFocus={() => { const m = lookupZip(city || value); if (m.length) { setSuggestions(m.slice(0, 10)); setShow(true); } }}
          autoComplete="off"
          style={{
            display: 'block', width: '100%', padding: '0.75rem 0.9rem',
            border: `2px solid ${error ? '#d04040' : '#5aaa30'}`,
            borderLeft: error ? '4px solid #d04040' : '2px solid #5aaa30',
            borderRadius: 10,
            background: error ? 'rgba(253,240,240,0.60)' : 'rgba(255,250,232,0.52)',
            fontFamily: "'Nunito',sans-serif", fontSize: '0.9rem',
            fontWeight: 600, color: '#222', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.18s, box-shadow 0.18s',
          }}
        />
        {show && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
            background: 'rgba(255,252,238,0.99)', border: '2px solid #5aaa30',
            borderRadius: 10, maxHeight: 220, overflowY: 'auto',
            boxShadow: '0 8px 28px rgba(28,79,9,0.18)',
          }}>
            {suggestions.map((r, i) => (
              <div key={i}
                onMouseDown={e => { e.preventDefault(); onSelect(r); setShow(false); setSuggestions([]); }}
                style={{
                  padding: '0.6rem 0.9rem', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem',
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(90,170,48,0.15)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,170,48,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontWeight: 900, color: '#1c4f09', minWidth: 42, fontSize: '0.88rem' }}>{r[3]}</span>
                <span style={{ fontWeight: 700, color: '#2a4a18', flex: 1 }}>{r[2]}</span>
                <span style={{ fontWeight: 600, color: '#7a9060', fontSize: '0.74rem', textAlign: 'right' }}>{r[1]}</span>
              </div>
            ))}
            <div style={{ padding: '0.4rem 0.9rem', fontSize: '0.70rem', fontWeight: 700, color: '#7a9060', borderTop: '1px solid rgba(90,170,48,0.15)', background: 'rgba(240,252,232,0.6)' }}>
              PHLPost official data · select the zone for your barangay
            </div>
          </div>
        )}
      </div>
      {error && (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#c03030', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.28rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function CompleteProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ phone: '', address: '', city: '', province: '', zip: '' });
  const [idFile, setIdFile]     = useState(null);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [alert, setAlert]       = useState('');

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(v => ({ ...v, [k]: '' }));
    setAlert('');
  };

  const handleZipSelect = (r) => {
    setForm(f => ({ ...f, zip: String(r[3]), city: r[2], province: r[1] }));
    setErrors(v => ({ ...v, zip: '', city: '', province: '' }));
  };

  function validate() {
    const e = {};
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^(09\d{9}|\+639\d{9})$/.test(form.phone.trim()))
      e.phone = 'Enter a valid PH number (e.g. 09171234567).';
    if (!form.address.trim())  e.address  = 'Home address is required.';
    if (!form.city.trim())     e.city     = 'City is required.';
    if (!form.province.trim()) e.province = 'Province is required.';
    if (!form.zip.trim())      e.zip      = 'Zip code is required.';
    if (!idFile)               e.idFile   = 'A government-issued ID is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setAlert('');
    try {
      const fd = new FormData();
      fd.append('phone',    form.phone.trim());
      fd.append('address',  form.address.trim());
      fd.append('city',     form.city.trim());
      fd.append('province', form.province.trim());
      fd.append('zip',      form.zip.trim());
      fd.append('idFile',   idFile);
      const { data } = await api.put('/api/auth/complete-profile', fd);
      const updated = { ...user, ...data, profileComplete: true };
      setUser(updated);
      localStorage.setItem('pawster_user', JSON.stringify(updated));
      navigate('/home');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#EDDABB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito',sans-serif", padding: '2rem 1rem',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes cardIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .cp-field:focus {
          border-color: #1c4f09 !important;
          border-left-color: #1c4f09 !important;
          background: rgba(255,252,238,0.78) !important;
          box-shadow: 0 0 0 3px rgba(28,79,9,0.09) !important;
        }
        .cp-field::placeholder { color:#b0a07a; font-style:italic; font-weight:600; }
        .cp-upload:hover { background: rgba(236,221,184,0.8) !important; border-style: solid !important; }
        .cp-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg,#143806,#1e5c0a) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(28,79,9,0.32) !important;
        }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(255,248,225,0.42)',
        border: '1.5px solid rgba(255,238,190,0.55)',
        borderRadius: 28,
        backdropFilter: 'blur(18px)',
        boxShadow: '0 12px 48px rgba(160,105,30,0.15)',
        padding: '2.2rem 2.4rem',
        animation: 'cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
      }}>

        {/* ── Header (no logo) ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 900, color: '#1a4a08', fontSize: '1.7rem', margin: '0 0 0.3rem' }}>
            One last step!
          </h2>
          <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#5a7a40', margin: 0, lineHeight: 1.55 }}>
            Hi <strong>{user?.firstName}</strong> — fill in a few details to start using Pawster.
          </p>
        </div>

        {/* ── Error alert ── */}
        {alert && (
          <div style={{
            borderRadius: 10, padding: '0.75rem 1rem',
            background: 'rgba(253,232,232,0.9)', border: '1px solid #f0a0a0',
            borderLeft: '4px solid #d04040', color: '#b83030',
            fontWeight: 700, fontSize: '0.84rem', marginBottom: '1rem',
          }}>
            {alert}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Phone */}
          <Field label="Phone Number *" id="phone" type="tel"
            placeholder="09171234567 or +639171234567"
            value={form.phone} onChange={set('phone')} error={errors.phone} />

          {/* Address */}
          <Field label="Home Address *" id="address" type="text"
            placeholder="Street / House No. / Barangay"
            value={form.address} onChange={set('address')} error={errors.address} />

          {/* City + Province */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            <Field label="City *" id="city" placeholder="e.g. Quezon City"
              value={form.city} onChange={set('city')} error={errors.city} />
            <Field label="Province *" id="province" placeholder="e.g. Metro Manila"
              value={form.province} onChange={set('province')} error={errors.province} />
          </div>

          {/* Zip */}
          <ZipField city={form.city} value={form.zip}
            onChange={set('zip')} onSelect={handleZipSelect} error={errors.zip} />

          {/* ── Government ID Upload ── */}
          <div style={{ marginBottom: '1.4rem' }}>
            <label style={{
              display: 'block', fontSize: '0.72rem', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.07em', fontStyle: 'italic',
              color: errors.idFile ? '#c03030' : '#276010', marginBottom: '0.38rem',
            }}>
              Government-Issued ID *
            </label>
            <label className="cp-upload" style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.85rem 1.1rem', borderRadius: 12, cursor: 'pointer',
              background: idFile ? 'rgba(210,240,195,0.45)' : 'rgba(255,250,232,0.52)',
              border: idFile
                ? '2px solid #5aaa30'
                : `2.5px dashed ${errors.idFile ? '#d04040' : '#5aaa30'}`,
              transition: 'all 0.18s',
            }}>
              {idFile ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#2a7010', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idFile.name}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#5a9a40', flexShrink: 0 }}>✓ Ready</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={errors.idFile ? '#d04040' : '#4a6741'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: errors.idFile ? '#c03030' : '#1c4f09' }}>Click to upload ID</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7a9060' }}>PDF, JPG, or PNG · max 5 MB</div>
                  </div>
                </>
              )}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; setIdFile(f || null); setErrors(v => ({ ...v, idFile: '' })); }} />
            </label>
            {errors.idFile && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#c03030', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.3rem' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errors.idFile}
              </span>
            )}

            {/* Why banner */}
            <div style={{
              display: 'flex', gap: '0.7rem', alignItems: 'flex-start',
              marginTop: '0.65rem', padding: '0.65rem 0.9rem', borderRadius: 10,
              background: 'rgba(255,245,225,0.80)', borderLeft: '4px solid #e07820',
            }}>
              <div style={{
                width: 26, height: 26, minWidth: 26, background: '#e07820',
                color: '#fff', fontSize: '0.9rem', fontWeight: 900,
                borderRadius: 7, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontStyle: 'italic', flexShrink: 0,
              }}>!</div>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#4a5a40', lineHeight: 1.55 }}>
                We verify all adopters to protect our rescued animals. Your info is stored securely under <strong>RA 10173</strong>.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="cp-btn-primary"
            style={{
              display: 'block', width: '100%', padding: '0.92rem',
              borderRadius: 13, border: 'none',
              background: 'linear-gradient(135deg,#1c4f09,#2a6e10)',
              color: '#fff', fontFamily: "'Nunito',sans-serif",
              fontSize: '1rem', fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              boxShadow: '0 4px 16px rgba(28,79,9,0.28)',
              transition: 'all 0.18s',
            }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: 14, height: 14,
                  border: '2.5px solid rgba(255,255,255,0.4)',
                  borderTop: '2.5px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                }} />
                Saving…
              </span>
            ) : 'Complete Profile & Continue →'}
          </button>
        </form>

        {/* Sign out */}
        <p style={{ textAlign: 'center', marginTop: '0.9rem', fontSize: '0.80rem', fontWeight: 700, color: '#9aaa80' }}>
          Wrong account?{' '}
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{
              background: 'none', border: 'none', color: '#c87820',
              fontWeight: 800, cursor: 'pointer', fontSize: '0.80rem',
              fontFamily: "'Nunito',sans-serif", textDecoration: 'underline',
            }}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}