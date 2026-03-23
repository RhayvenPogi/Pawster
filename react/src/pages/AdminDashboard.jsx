import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const SAMPLE_USERS = [
    { id:1, name:'Juan dela Cruz', email:'juan@email.com',  status:'pending',  role:'user' },
    { id:2, name:'Maria Santos',   email:'maria@email.com', status:'approved', role:'user' },
    { id:3, name:'Pedro Reyes',    email:'pedro@email.com', status:'rejected', role:'user' },
    { id:4, name:'Ana Garcia',     email:'ana@email.com',   status:'pending',  role:'user' },
    { id:5, name:'Carlo Mendoza',  email:'carlo@email.com', status:'approved', role:'user' },
];

const S_COLOR = { approved:'#276010', pending:'#c87820', rejected:'#b83030' };
const S_BG    = { approved:'rgba(230,245,220,0.9)', pending:'rgba(255,243,220,0.9)', rejected:'rgba(253,232,232,0.9)' };

export default function AdminDashboard() {
    const { logout }          = useAuth();
    const [users, setUsers]   = useState(SAMPLE_USERS);
    const [tab,   setTab]     = useState('All');

    const filtered = tab === 'All' ? users : users.filter(u => u.status === tab.toLowerCase());

    const counts = {
        total:    users.length,
        pending:  users.filter(u => u.status === 'pending').length,
        approved: users.filter(u => u.status === 'approved').length,
        rejected: users.filter(u => u.status === 'rejected').length,
    };

    const updateStatus = (id, status) =>
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));

    return (
        <div style={{ minHeight:'100vh', background:'#EDDABB', fontFamily:"'Nunito',sans-serif" }}>

            {/* Navbar */}
            <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1rem 4vw', background:'rgba(237,218,187,0.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(200,170,100,0.3)', position:'sticky', top:0, zIndex:100 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.8rem' }}>
                    <img src="/images/logo.png" alt="Pawster" style={{ width:52, height:52, objectFit:'cover' }} />
                    <span style={{ fontWeight:900, color:'#1a4a08', fontSize:'1rem', textTransform:'uppercase', letterSpacing:1 }}>Admin</span>
                </div>
                <button onClick={logout} style={{ fontWeight:800, color:'#fff', background:'#c06010', border:'none', borderRadius:50, padding:'0.45rem 1.3rem', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                    Logout
                </button>
            </nav>

            <div style={{ padding:'2.5rem 4vw' }}>
                <h1 style={{ fontWeight:900, color:'#1a4a08', fontSize:'clamp(1.8rem,3vw,2.4rem)', marginBottom:'2rem' }}>Admin Dashboard</h1>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
                    {[
                        { label:'Total Users', value:counts.total,    bg:'#1c4f09' },
                        { label:'Pending',     value:counts.pending,  bg:'#c87820' },
                        { label:'Approved',    value:counts.approved, bg:'#588B41' },
                        { label:'Rejected',    value:counts.rejected, bg:'#b83030' },
                    ].map(({ label, value, bg }) => (
                        <div key={label} style={{ background:bg, borderRadius:16, padding:'1.4rem 1.2rem', color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
                            <div style={{ fontSize:'2rem', fontWeight:900, lineHeight:1 }}>{value}</div>
                            <div style={{ fontWeight:700, fontSize:'0.85rem', marginTop:'0.4rem', opacity:0.9 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Users Table */}
                <div style={{ background:'rgba(255,248,225,0.7)', border:'1.5px solid rgba(255,238,190,0.6)', borderRadius:20, padding:'1.5rem 2rem', boxShadow:'0 4px 20px rgba(160,105,30,0.1)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.2rem', flexWrap:'wrap', gap:'0.8rem' }}>
                        <h2 style={{ fontWeight:900, color:'#1a4a08', fontSize:'1.1rem' }}>User Registrations</h2>
                        <div style={{ display:'flex', gap:'0.5rem' }}>
                            {['All','Pending','Approved','Rejected'].map(t => (
                                <button key={t} onClick={() => setTab(t)}
                                    style={{ fontWeight:800, fontFamily:"'Nunito',sans-serif", fontSize:'0.82rem', padding:'0.4rem 1rem', borderRadius:50, border:'2px solid #1c4f09', background: tab===t ? '#1c4f09' : 'transparent', color: tab===t ? '#fff' : '#1c4f09', cursor:'pointer' }}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom:'2px solid rgba(200,170,100,0.4)' }}>
                                    {['Name','Email','Status','Actions'].map(h => (
                                        <th key={h} style={{ padding:'0.7rem 0.8rem', textAlign:'left', fontWeight:900, color:'#3a6020', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(user => (
                                    <tr key={user.id} style={{ borderBottom:'1px solid rgba(200,170,100,0.2)' }}>
                                        <td style={{ padding:'0.85rem 0.8rem', fontWeight:700, color:'#1a4a08' }}>{user.name}</td>
                                        <td style={{ padding:'0.85rem 0.8rem', fontWeight:600, color:'#4a6030', fontSize:'0.85rem' }}>{user.email}</td>
                                        <td style={{ padding:'0.85rem 0.8rem' }}>
                                            <span style={{ fontWeight:800, fontSize:'0.75rem', textTransform:'uppercase', color: S_COLOR[user.status], background: S_BG[user.status], padding:'0.25rem 0.75rem', borderRadius:50, border:`1px solid ${S_COLOR[user.status]}40` }}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td style={{ padding:'0.85rem 0.8rem' }}>
                                            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                                                {user.status !== 'approved' && (
                                                    <button onClick={() => updateStatus(user.id, 'approved')}
                                                        style={{ fontWeight:800, fontFamily:"'Nunito',sans-serif", fontSize:'0.78rem', color:'#fff', background:'#588B41', border:'none', borderRadius:8, padding:'0.35rem 0.8rem', cursor:'pointer' }}>
                                                        Approve
                                                    </button>
                                                )}
                                                {user.status !== 'rejected' && (
                                                    <button onClick={() => updateStatus(user.id, 'rejected')}
                                                        style={{ fontWeight:800, fontFamily:"'Nunito',sans-serif", fontSize:'0.78rem', color:'#fff', background:'#b83030', border:'none', borderRadius:8, padding:'0.35rem 0.8rem', cursor:'pointer' }}>
                                                        Reject
                                                    </button>
                                                )}
                                                <button style={{ fontWeight:800, fontFamily:"'Nunito',sans-serif", fontSize:'0.78rem', color:'#1c4f09', background:'transparent', border:'1.5px solid #1c4f09', borderRadius:8, padding:'0.35rem 0.8rem', cursor:'pointer' }}>
                                                    View ID
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}