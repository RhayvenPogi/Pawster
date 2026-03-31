import { useState, useEffect, useCallback } from "react";

const STATUS_STYLE = {
  approved: { bg: "rgba(88,139,65,0.14)",  color: "#276010", border: "rgba(88,139,65,0.30)",  dot: "#5aaa30",  label: "Approved" },
  pending:  { bg: "rgba(212,136,10,0.14)", color: "#b07010", border: "rgba(212,136,10,0.30)", dot: "#e0a020",  label: "Pending"  },
  rejected: { bg: "rgba(192,48,48,0.12)",  color: "#b03030", border: "rgba(192,48,48,0.28)",  dot: "#c04040",  label: "Rejected" },
};

// Normalize photoUrl — strips hardcoded localhost for old records
function normalizePhotoUrl(url) {
  if (!url) return null;
  try {
    // If it's an absolute URL (any host), extract just the pathname
    const u = new URL(url);
    return u.pathname;
  } catch {
    // Already relative — ensure it starts with /
    if (!url.startsWith('/')) return '/' + url;
    return url;
  }
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.28rem", padding: "0.18rem 0.6rem", borderRadius: 50, fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const isLost = type === "lost";
  return (
    <span style={{ padding: "0.18rem 0.6rem", borderRadius: 50, fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", background: isLost ? "rgba(192,48,48,0.10)" : "rgba(28,79,9,0.10)", color: isLost ? "#c03030" : "#1c4f09", border: `1px solid ${isLost ? "rgba(192,48,48,0.22)" : "rgba(28,79,9,0.22)"}` }}>
      {isLost ? "🔴 Lost" : "🟢 Found"}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

/* ── Confirm dialog ── */
function ConfirmDialog({ message, title, icon, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor = "#c03030", confirmBg, confirmBorder }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.50)", backdropFilter:"blur(6px)", padding:"1rem" }}>
      <div style={{ background:"rgba(255,252,235,0.99)", border:"1.5px solid rgba(180,140,60,0.35)", borderRadius:20, padding:"1.75rem 1.5rem 1.5rem", maxWidth:360, width:"calc(100% - 2rem)", boxShadow:"0 20px 50px rgba(0,0,0,0.28)", animation:"mpFadeUp 0.2s ease both" }}>

        {/* Icon */}
        <div style={{ width:56, height:56, borderRadius:16, background: confirmBg || "rgba(192,48,48,0.09)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", fontSize:26 }}>
          {icon}
        </div>

        {/* Title */}
        {title && (
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.15rem", fontWeight:900, color:"#1a4a08", textAlign:"center", marginBottom:"0.4rem" }}>
            {title}
          </div>
        )}

        {/* Message */}
        <p style={{ textAlign:"center", fontWeight:700, fontSize:"0.88rem", color:"#3a5020", marginBottom:"1.4rem", lineHeight:1.65 }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"0.7rem", borderRadius:10, fontWeight:800, fontSize:"0.88rem", cursor:"pointer", background:"transparent", border:"1.5px solid rgba(180,140,60,0.28)", color:"#3a5020", fontFamily:"inherit" }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"0.7rem", borderRadius:10, fontWeight:800, fontSize:"0.88rem", cursor:"pointer", background: confirmBg || "rgba(192,48,48,0.09)", border:`1.5px solid ${confirmBorder || "rgba(192,48,48,0.28)"}`, color: confirmColor, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.35rem" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
/* ── Detail modal ── */
function DetailModal({ pet, onClose, onApprove, onReject, onDelete }) {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => { setImgErr(false); }, [pet?.id, pet?.photoUrl]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const photoUrl = normalizePhotoUrl(pet.photoUrl);
  const isPending  = !pet.status || pet.status === "pending";
  const isApproved = pet.status === "approved";
  const isLost     = pet.type === "lost";

  const pills = [
    { icon: "📍", label: "Area",     value: pet.area || "—",   bg: "rgba(180,90,34,0.07)",   border: "rgba(180,90,34,0.18)",   color: "#B45A22" },
    { icon: "🎨", label: "Color",    value: pet.color || "—",  bg: "rgba(42,112,16,0.06)",   border: "rgba(42,112,16,0.14)",   color: "#3a7a10" },
    { icon: "📅", label: "Reported", value: pet.reportedDate
        ? new Date(pet.reportedDate).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})
        : "—",                                                  bg: "rgba(32,96,160,0.07)",   border: "rgba(32,96,160,0.15)",   color: "#2060a0" },
    { icon: "🐾", label: "Species",  value: pet.species || "—",bg: "rgba(45,90,27,0.07)",    border: "rgba(45,90,27,0.15)",    color: "#2d5a1b" },
    ...(pet.breed ? [{ icon: "🦮", label: "Breed", value: pet.breed, bg: "rgba(45,90,27,0.05)", border: "rgba(45,90,27,0.12)", color: "#2d5a1b" }] : []),
  ];

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center",
        justifyContent:"center", background:"rgba(0,0,0,0.40)", backdropFilter:"blur(4px)",
        padding:"1rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background:"#fefefe", border:"1px solid rgba(0,0,0,0.10)", borderRadius:16,
          maxWidth:480, width:"100%", maxHeight:"92vh", overflow:"hidden", display:"flex",
          flexDirection:"column", boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
          animation:"mpFadeUp 0.20s ease both" }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Modal header (matches your "Add New Animal" header style) ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"1rem 1.25rem", borderBottom:"1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>🐾</span>
            <span style={{ fontWeight:700, fontSize:"0.95rem", color:"#1a3a08" }}>
              Report Details
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ padding:"3px 10px", borderRadius:50, fontSize:"0.65rem",
              fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em",
              background: isLost ? "rgba(192,48,48,0.10)" : "rgba(28,79,9,0.10)",
              color: isLost ? "#c03030" : "#1c4f09",
              border:`1px solid ${isLost ? "rgba(192,48,48,0.22)" : "rgba(28,79,9,0.22)"}` }}>
              {isLost ? "Lost" : "Found"}
            </span>
            <StatusBadge status={pet.status ?? "pending"} />
            <button onClick={onClose}
              style={{ width:28, height:28, borderRadius:6, border:"1px solid rgba(0,0,0,0.12)",
                background:"transparent", color:"#888", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY:"auto", flex:1, display:"flex", flexDirection:"column" }}>

          {/* Cover photo banner */}
          <div style={{ position:"relative", height:200, background:"#f0ece0",
            flexShrink:0, overflow:"hidden" }}>
            {photoUrl && !imgErr ? (
              <img src={photoUrl} alt={pet.name || "Pet"}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={() => { console.error("Photo failed:", photoUrl); setImgErr(true); }}
                onLoad={() => setImgErr(false)} />
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:60, opacity:0.25 }}>
                {pet.species?.toLowerCase() === "cat" ? "🐱" : "🐶"}
              </div>
            )}
            {/* Gradient */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:90,
              background:"linear-gradient(to top, #fefefe 5%, transparent)" }} />
            {/* Pet name over gradient */}
            <div style={{ position:"absolute", bottom:12, left:16, right:16 }}>
              <div style={{ fontWeight:800, fontSize:"1.2rem", color:"#1a3a08", lineHeight:1.2 }}>
                {pet.name || "Unknown"}
              </div>
              {(pet.species || pet.breed) && (
                <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#6a7a50", marginTop:2 }}>
                  {[pet.species, pet.breed].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Content area */}
          <div style={{ padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:12 }}>

            {/* Wrapping pills */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {pills.map(({ icon, label, value, bg, border, color }) => (
                <div key={label} style={{ background: bg, border:`1px solid ${border}`,
                  borderRadius:8, padding:"6px 12px" }}>
                  <div style={{ fontSize:"0.58rem", fontWeight:800, textTransform:"uppercase",
                    letterSpacing:"0.07em", color }}>
                    {icon} {label}
                  </div>
                  <div style={{ fontSize:"0.84rem", fontWeight:700, color:"#1a3a08", marginTop:2 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Address */}
            {pet.address && (
              <div style={{ background:"#faf8f0", border:"1px solid rgba(0,0,0,0.08)",
                borderRadius:10, padding:"0.8rem 1rem" }}>
                <div style={{ fontSize:"0.60rem", fontWeight:800, textTransform:"uppercase",
                  letterSpacing:"0.08em", color:"#B45A22", marginBottom:4 }}>📍 Address</div>
                <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#1a3a08", lineHeight:1.45 }}>
                  {pet.address}
                </div>
              </div>
            )}

            {/* Details */}
            {pet.details && (
              <div style={{ background:"#faf8f0", border:"1px solid rgba(0,0,0,0.08)",
                borderRadius:10, padding:"0.8rem 1rem" }}>
                <div style={{ fontSize:"0.60rem", fontWeight:800, textTransform:"uppercase",
                  letterSpacing:"0.08em", color:"#888", marginBottom:4 }}>📝 Details</div>
                <p style={{ fontSize:"0.83rem", fontWeight:600, color:"#3a5020",
                  lineHeight:1.65, margin:0 }}>{pet.details}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons (matches your "Cancel / Save Animal" footer style) ── */}
        <div style={{ padding:"0.9rem 1.25rem", borderTop:"1px solid rgba(0,0,0,0.08)",
          display:"flex", gap:"0.5rem", background:"#fefefe", flexShrink:0 }}>
          {isPending && (<>
            <button onClick={() => onApprove(pet)}
              style={{ flex:1, padding:"0.65rem", borderRadius:8, fontWeight:700,
                fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit",
                background:"#2d5a1b", border:"none", color:"#fff" }}>
              ✓ Approve
            </button>
            <button onClick={() => onReject(pet)}
              style={{ flex:1, padding:"0.65rem", borderRadius:8, fontWeight:700,
                fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit",
                background:"transparent", border:"1px solid rgba(0,0,0,0.15)", color:"#555" }}>
              ✕ Reject
            </button>
          </>)}
          {isApproved && (
            <button onClick={() => onReject(pet)}
              style={{ flex:1, padding:"0.65rem", borderRadius:8, fontWeight:700,
                fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit",
                background:"transparent", border:"1px solid rgba(0,0,0,0.15)", color:"#b07010" }}>
              ⊘ Revoke Approval
            </button>
          )}
          {pet.status === "rejected" && (
            <button onClick={() => onApprove(pet)}
              style={{ flex:1, padding:"0.65rem", borderRadius:8, fontWeight:700,
                fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit",
                background:"#2d5a1b", border:"none", color:"#fff" }}>
              ✓ Re-approve
            </button>
          )}
          <button onClick={() => onDelete(pet)}
            style={{ padding:"0.65rem 1rem", borderRadius:8, fontWeight:700,
              fontSize:"0.88rem", cursor:"pointer", fontFamily:"inherit",
              background:"rgba(192,48,48,0.08)", border:"1px solid rgba(192,48,48,0.22)",
              color:"#c03030" }}>
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
/* ════════════════════════════════════════════════
   Main Panel
════════════════════════════════════════════════ */
export default function MissingPetsPanel({ show, onStatsChange }) {
  const [pets, setPets]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState("all");
  const [typeFilter, setType]       = useState("all");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmAct, setConfirmAct] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  /* ── Fetch ALL reports (admin view) ── */
  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/missing-pets/admin/all");
      if (res.ok) setPets(await res.json());
    } catch (err) {
      console.error("Failed to fetch missing pets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (show) fetchPets(); }, [show, fetchPets]);

  /* ── Actions ── */
  const handleApprove = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/admin/${pet.id}/approve`, { method: "PUT" });
      if (res.ok) {
        setPets(p => p.map(x => x.id === pet.id ? { ...x, status: "approved" } : x));
        setSelected(null);
        setConfirmAct(null);
        showToast("Report approved — now visible to the public.");
        onStatsChange?.();
      } else {
        showToast("Failed to approve report.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleReject = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/admin/${pet.id}/reject`, { method: "PUT" });
      if (res.ok) {
        setPets(p => p.map(x => x.id === pet.id ? { ...x, status: "rejected" } : x));
        setSelected(null);
        setConfirmAct(null);
        showToast("Report rejected.");
        onStatsChange?.();
      } else {
        showToast("Failed to reject report.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const handleDelete = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/admin/${pet.id}`, { method: "DELETE" });
      if (res.ok) {
        setPets(p => p.filter(x => x.id !== pet.id));
        setSelected(null);
        setConfirmDel(null);
        showToast("Report deleted.");
        onStatsChange?.();
      } else {
        showToast("Failed to delete report.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  /* ── Derived data ── */
  const counts = {
    all:      pets.length,
    pending:  pets.filter(p => !p.status || p.status === "pending").length,
    approved: pets.filter(p => p.status === "approved").length,
    rejected: pets.filter(p => p.status === "rejected").length,
    lost:     pets.filter(p => p.type === "lost").length,
    found:    pets.filter(p => p.type === "found").length,
  };

  const filtered = pets.filter(p => {
    const matchStatus = statusFilter === "all"
      ? true
      : statusFilter === "pending"
        ? (!p.status || p.status === "pending")
        : p.status === statusFilter;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchSearch = !search.trim() || [p.name, p.breed, p.area, p.address, p.color, p.species]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchType && matchSearch;
  });

  if (!show) return null;

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", animation: "mpFadeUp 0.25s ease both" }}>
      <style>{`
        @keyframes mpFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .mpp-row:hover { background:rgba(90,170,48,0.05) !important; }
        .mpp-act-btn { padding:0.28rem 0.52rem; border-radius:7px; font-size:0.72rem; font-weight:800; cursor:pointer; font-family:inherit; border:1px solid; transition:opacity 0.15s; }
        .mpp-act-btn:hover { opacity:0.80; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 2000, padding: "0.75rem 1.25rem", borderRadius: 12, fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 8px 28px rgba(0,0,0,0.15)", background: toast.type === "success" ? "rgba(28,79,9,0.94)" : "rgba(192,48,48,0.94)", color: "#fff", backdropFilter: "blur(8px)", animation: "mpFadeUp 0.2s ease" }}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: 50, padding: "0.25rem 0.85rem", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(180,90,34,0.10)", border: "1px solid rgba(180,90,34,0.28)", color: "#B45A22", marginBottom: "0.5rem" }}>
            🐾 Community Reports
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 900, color: "#1a4a08", margin: 0, lineHeight: 1.1 }}>
            <em style={{ fontStyle: "italic", color: "#B45A22" }}>Missing</em> Pets
          </h2>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6a7a50", marginTop: "0.3rem" }}>
            {counts.all} total · {counts.pending} pending review · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <button onClick={fetchPets}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.65rem 1.25rem", borderRadius: 10, fontWeight: 800, fontSize: "0.82rem", color: "#1c4f09", background: "rgba(90,170,48,0.12)", border: "1.5px solid rgba(90,170,48,0.30)", cursor: "pointer", fontFamily: "inherit" }}>
          🔄 Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total",    value: counts.all,      icon: "📋", bg: "rgba(180,140,60,0.10)",  color: "#7a6020"  },
          { label: "Pending",  value: counts.pending,  icon: "🕐", bg: "rgba(212,136,10,0.10)",  color: "#b07010"  },
          { label: "Approved", value: counts.approved, icon: "✓",  bg: "rgba(88,139,65,0.10)",   color: "#276010"  },
          { label: "Rejected", value: counts.rejected, icon: "✕",  bg: "rgba(192,48,48,0.09)",   color: "#b03030"  },
          { label: "Lost",     value: counts.lost,     icon: "🔴", bg: "rgba(192,48,48,0.07)",   color: "#c03030"  },
          { label: "Found",    value: counts.found,    icon: "🟢", bg: "rgba(28,79,9,0.07)",     color: "#1c4f09"  },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.65rem", border: `1px solid ${c.bg}` }}>
            <span style={{ fontSize: "1.2rem" }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#6a7a50", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
        {/* Status filter */}
        <div style={{ display: "inline-flex", gap: "0.28rem", background: "rgba(255,248,220,0.7)", borderRadius: 50, padding: "0.25rem", border: "1px solid rgba(180,140,60,0.28)" }}>
          {[["all","All"],["pending","Pending"],["approved","Approved"],["rejected","Rejected"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setStatus(val)}
              style={{ padding: "0.38rem 0.9rem", borderRadius: 50, fontSize: "0.78rem", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                background: statusFilter === val
                  ? (val === "pending" ? "#d4880a" : val === "approved" ? "#1c4f09" : val === "rejected" ? "#c03030" : "#1a4a08")
                  : "transparent",
                color: statusFilter === val ? "#fff" : "#3a5020" }}>
              {lbl}
              {val !== "all" && counts[val] > 0 && <span style={{ marginLeft: "0.25rem", opacity: 0.75 }}>({counts[val]})</span>}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ display: "inline-flex", gap: "0.28rem", background: "rgba(255,248,220,0.7)", borderRadius: 50, padding: "0.25rem", border: "1px solid rgba(180,140,60,0.28)" }}>
          {[["all","All"],["lost","Lost"],["found","Found"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setType(val)}
              style={{ padding: "0.38rem 0.9rem", borderRadius: 50, fontSize: "0.78rem", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                background: typeFilter === val
                  ? (val === "lost" ? "#c03030" : val === "found" ? "#1c4f09" : "#555")
                  : "transparent",
                color: typeFilter === val ? "#fff" : "#3a5020" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.82rem", pointerEvents: "none", color: "#9aaa80" }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, breed, area, address…"
            style={{ width: "100%", padding: "0.6rem 0.75rem 0.6rem 2.2rem", borderRadius: 10, border: "1.5px solid rgba(180,140,60,0.28)", background: "rgba(255,250,232,0.88)", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", color: "#1a4a08", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Clear filters */}
        {(statusFilter !== "all" || typeFilter !== "all" || search) && (
          <button onClick={() => { setStatus("all"); setType("all"); setSearch(""); }}
            style={{ padding: "0.5rem 1rem", borderRadius: 9, fontSize: "0.78rem", fontWeight: 800, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,220,0.7)", color: "#6a7a50", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Pending alert banner ── */}
      {counts.pending > 0 && statusFilter !== "pending" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.1rem", borderRadius: 12, background: "rgba(212,136,10,0.09)", border: "1px solid rgba(212,136,10,0.28)", marginBottom: "1.1rem", cursor: "pointer" }}
          onClick={() => setStatus("pending")}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e0a020", flexShrink: 0, animation: "spin 2s linear infinite" }} />
          <p style={{ fontSize: "0.82rem", fontWeight: 800, color: "#b07010", margin: 0 }}>
            {counts.pending} report{counts.pending !== 1 ? "s" : ""} awaiting review — <span style={{ textDecoration: "underline" }}>click to filter</span>
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem", gap: "0.75rem", color: "#3a5020", fontWeight: 700 }}>
          <div style={{ width: 20, height: 20, border: "3px solid rgba(180,90,34,0.2)", borderTopColor: "#B45A22", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading reports…
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#6a7a50" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🐾</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.1rem", color: "#1a4a08" }}>No reports found</div>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.3rem" }}>
            {search ? "Try a different search term." : "No reports match the selected filters."}
          </p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ background: "rgba(255,248,225,0.88)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(100,70,20,0.08)" }}>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr 100px 130px 100px 100px 145px", gap: "0.5rem", padding: "0.7rem 1.1rem", background: "rgba(180,140,60,0.08)", borderBottom: "1.5px solid rgba(180,140,60,0.18)" }}>
            {["Photo", "Type", "Pet / Breed", "Species", "Address / Area", "Status", "Reported", "Actions"].map(h => (
              <div key={h} style={{ fontSize: "0.64rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6a7a50" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((pet, i) => (
            <div
              key={pet.id}
              className="mpp-row"
              style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr 100px 130px 100px 100px 145px", gap: "0.5rem", padding: "0.8rem 1.1rem", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid rgba(180,140,60,0.11)" : "none", cursor: "pointer", transition: "background 0.12s" }}
              onClick={() => setSelected(pet)}
            >
              {/* Photo thumbnail */}
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", background: "rgba(180,140,60,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {pet.photoUrl ? (
                  <img
                    src={normalizePhotoUrl(pet.photoUrl)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                ) : null}
                <span style={{ fontSize: "1.4rem", display: pet.photoUrl ? "none" : "flex" }}>
                  {pet.species?.toLowerCase() === "cat" ? "🐱" : "🐶"}
                </span>
              </div>

              {/* Type */}
              <div><TypeBadge type={pet.type} /></div>

              {/* Name / breed */}
              <div>
                <div style={{ fontWeight: 900, fontSize: "0.88rem", color: "#1a4a08" }}>{pet.name || "Unknown"}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>{pet.breed || "—"}</div>
              </div>

              {/* Species */}
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3a5020" }}>{pet.species}</div>

              {/* Address / area */}
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#3a5020", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pet.area || "—"}</div>
                {pet.address && <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9aaa80", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pet.address}</div>}
              </div>

              {/* Status */}
              <div><StatusBadge status={pet.status ?? "pending"} /></div>

              {/* Date */}
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6a7a50" }}>{formatDate(pet.reportedDate)}</div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.28rem", flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                <button className="mpp-act-btn"
                  onClick={() => setSelected(pet)}
                  title="View details"
                  style={{ background: "rgba(32,96,160,0.10)", borderColor: "rgba(32,96,160,0.22)", color: "#2060a0" }}>
                  👁
                </button>

                {(pet.status === "pending" || !pet.status || pet.status === "rejected") && (
                  <button className="mpp-act-btn"
                    onClick={() => setConfirmAct({ pet, action: "approve" })}
                    title="Approve"
                    style={{ background: "rgba(88,139,65,0.12)", borderColor: "rgba(88,139,65,0.30)", color: "#276010" }}>
                    ✓
                  </button>
                )}

                {(pet.status === "pending" || !pet.status || pet.status === "approved") && (
                  <button className="mpp-act-btn"
                    onClick={() => setConfirmAct({ pet, action: "reject" })}
                    title={pet.status === "approved" ? "Revoke" : "Reject"}
                    style={{ background: "rgba(192,48,48,0.08)", borderColor: "rgba(192,48,48,0.22)", color: "#c03030" }}>
                    {pet.status === "approved" ? "⊘" : "✕"}
                  </button>
                )}

                <button className="mpp-act-btn"
                  onClick={() => setConfirmDel(pet)}
                  title="Delete"
                  style={{ background: "rgba(192,48,48,0.09)", borderColor: "rgba(192,48,48,0.20)", color: "#c03030" }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result count */}
      {!loading && filtered.length > 0 && (
        <div style={{ textAlign: "right", fontSize: "0.75rem", fontWeight: 700, color: "#9aaa80", marginTop: "0.75rem" }}>
          Showing {filtered.length} of {pets.length} report{pets.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Detail modal — rendered at root level via portal-like fixed positioning */}
      {selected && (
        <DetailModal
          pet={selected}
          onClose={() => setSelected(null)}
          onApprove={(pet) => { setSelected(null); setConfirmAct({ pet, action: "approve" }); }}
          onReject={(pet)  => { setSelected(null); setConfirmAct({ pet, action: "reject"  }); }}
          onDelete={(pet)  => { setSelected(null); setConfirmDel(pet); }}
        />
      )}

      {/* Approve / Reject confirm */}
{confirmAct && (
  <ConfirmDialog
    title={confirmAct.action === "approve" ? "Approve report?" : confirmAct.pet.status === "approved" ? "Revoke approval?" : "Reject report?"}
    message={
      confirmAct.action === "approve"
        ? `"${confirmAct.pet.name || "Unknown"}" will become visible to the public on the Missing Pets board.`
        : confirmAct.pet.status === "approved"
          ? `"${confirmAct.pet.name || "Unknown"}" will be hidden from the public board immediately.`
          : `"${confirmAct.pet.name || "Unknown"}" will be marked as rejected and hidden from the board.`
    }
    icon={confirmAct.action === "approve" ? "✓" : confirmAct.pet.status === "approved" ? "⏎" : "✕"}
    confirmLabel={confirmAct.action === "approve" ? "Approve" : confirmAct.pet.status === "approved" ? "Revoke" : "Reject"}
    confirmColor={confirmAct.action === "approve" ? "#276010" : confirmAct.pet.status === "approved" ? "#b07010" : "#b03030"}
    confirmBg={confirmAct.action === "approve" ? "rgba(88,139,65,0.12)" : confirmAct.pet.status === "approved" ? "rgba(212,136,10,0.10)" : "rgba(192,48,48,0.09)"}
    confirmBorder={confirmAct.action === "approve" ? "rgba(88,139,65,0.32)" : confirmAct.pet.status === "approved" ? "rgba(212,136,10,0.28)" : "rgba(192,48,48,0.28)"}
    onConfirm={() => confirmAct.action === "approve" ? handleApprove(confirmAct.pet) : handleReject(confirmAct.pet)}
    onCancel={() => setConfirmAct(null)}
  />
)}

{/* Delete confirm */}
{confirmDel && (
  <ConfirmDialog
    title="Delete permanently?"
    message={`This cannot be undone. The report for "${confirmDel.name || "Unknown"}" and its photo will be removed forever.`}
    icon="🗑"
    confirmLabel="Delete"
    confirmColor="#b03030"
    confirmBg="rgba(192,48,48,0.09)"
    confirmBorder="rgba(192,48,48,0.28)"
    onConfirm={() => handleDelete(confirmDel)}
    onCancel={() => setConfirmDel(null)}
  />
)}
    </div>
  );
}