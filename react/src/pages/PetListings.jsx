import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SAMPLE_PETS = [
    { id:1, name:'Buddy',   type:'Dog', breed:'Labrador',        age:'2 yrs', color:'#8fbc6a' },
    { id:2, name:'Luna',    type:'Cat', breed:'Siamese',         age:'1 yr',  color:'#c8a06a' },
    { id:3, name:'Max',     type:'Dog', breed:'Golden Retriever',age:'3 yrs', color:'#d4a96a' },
    { id:4, name:'Cleo',    type:'Cat', breed:'Tabby',           age:'4 yrs', color:'#a09060' },
    { id:5, name:'Charlie', type:'Dog', breed:'Beagle',          age:'1 yr',  color:'#b8904a' },
    { id:6, name:'Mochi',   type:'Cat', breed:'Persian',         age:'2 yrs', color:'#c8b090' },
];

export default function PetListings() {
    const { logout } = useAuth();
    const [filter, setFilter] = useState('All');

    const filtered = filter === 'All' ? SAMPLE_PETS : SAMPLE_PETS.filter(p => p.type === filter);

    return (
        <div style={{ minHeight:'100vh', background:'#EDDABB', fontFamily:"'Nunito',sans-serif" }}>

            {/* Navbar */}
            <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 4vw', background:'rgba(237,218,187,0.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(200,170,100,0.3)', position:'sticky', top:0, zIndex:100 }}>
                <img src="/images/logo.png" alt="Pawster" style={{ width:52, height:52, objectFit:'cover' }} />
                <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
                    <a href="/home"    style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Home</a>
                    <a href="/pets"    style={{ fontWeight:800, color:'#1c4f09', textDecoration:'none' }}>Browse Pets</a>
                    <a href="/profile" style={{ fontWeight:800, color:'#3a6020', textDecoration:'none' }}>Profile</a>
                    <button onClick={logout} style={{ fontWeight:800, color:'#fff', background:'#c06010', border:'none', borderRadius:50, padding:'0.45rem 1.3rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Header + Filter */}
            <div style={{ padding:'2.5rem 6vw 1rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
                <h1 style={{ fontWeight:900, color:'#1a4a08', fontSize:'clamp(1.8rem,3vw,2.6rem)' }}>Browse Pets 🐾</h1>
                <div style={{ display:'flex', gap:'0.6rem' }}>
                    {['All','Dog','Cat'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ fontWeight:800, fontFamily:"'Nunito',sans-serif", fontSize:'0.9rem', padding:'0.5rem 1.2rem', borderRadius:50, border:'2px solid #1c4f09', background: filter===f ? '#1c4f09' : 'transparent', color: filter===f ? '#fff' : '#1c4f09', cursor:'pointer', transition:'all 0.15s' }}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1.4rem', padding:'1rem 6vw 4rem' }}>
                {filtered.map(pet => (
                    <div key={pet.id}
                        style={{ background:'rgba(255,248,225,0.7)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:18, overflow:'hidden', boxShadow:'0 4px 16px rgba(160,105,30,0.1)', transition:'transform 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ height:160, background:pet.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem' }}>
                            {pet.type === 'Dog' ? '🐶' : '🐱'}
                        </div>
                        <div style={{ padding:'1.2rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                                <h3 style={{ fontWeight:900, color:'#1a4a08', fontSize:'1.1rem' }}>{pet.name}</h3>
                                <span style={{ fontWeight:800, fontSize:'0.75rem', color:'#fff', background:'#588B41', padding:'0.2rem 0.6rem', borderRadius:50 }}>{pet.type}</span>
                            </div>
                            <p style={{ fontWeight:600, color:'#5a7a40', fontSize:'0.85rem', marginBottom:'0.2rem' }}>{pet.breed}</p>
                            <p style={{ fontWeight:600, color:'#7a9060', fontSize:'0.82rem', marginBottom:'1rem' }}>{pet.age} old</p>
                            <button style={{ width:'100%', fontWeight:900, fontFamily:"'Nunito',sans-serif", fontSize:'0.9rem', color:'#fff', background:'#1c4f09', border:'none', borderRadius:10, padding:'0.6rem', cursor:'pointer' }}>
                                Adopt Me 🐾
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}