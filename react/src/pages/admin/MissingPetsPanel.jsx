import { useState, useEffect, useCallback } from "react";

const STATUS_STYLE = {
  approved: { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  dot: "bg-green-400",  label: "Approved" },
  pending:  { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-300",  dot: "bg-amber-400",  label: "Pending"  },
  rejected: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300",    dot: "bg-red-400",    label: "Rejected" },
};

function normalizePhotoUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.pathname;
  } catch {
    return url.startsWith("/") ? url : "/" + url;
  }
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const isLost = type === "lost";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${isLost ? "bg-red-100 text-red-700 border-red-300" : "bg-green-100 text-green-800 border-green-300"}`}>
      {isLost ? "🔴 Lost" : "🟢 Found"}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

/* ── Confirm Dialog ── */
function ConfirmDialog({ message, title, icon, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor, confirmBg, confirmBorder }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#fffceb] border border-[rgba(180,140,60,0.35)] rounded-2xl p-7 max-w-sm w-full shadow-2xl">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl"
          style={{ background: confirmBg || "rgba(192,48,48,0.09)" }}>
          {icon}
        </div>
        {title && (
          <p className="text-center font-black text-[#1a4a08] text-lg mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </p>
        )}
        <p className="text-center font-bold text-sm text-[#3a5020] mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer bg-transparent border border-[rgba(180,140,60,0.28)] text-[#3a5020] hover:bg-[rgba(180,140,60,0.06)] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer flex items-center justify-center gap-1 transition-opacity hover:opacity-80"
            style={{ background: confirmBg, border: `1.5px solid ${confirmBorder}`, color: confirmColor }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ pet, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name:    pet.name    || "",
    species: pet.species || "",
    breed:   pet.breed   || "",
    color:   pet.color   || "",
    area:    pet.area    || "",
    address: pet.address || "",
    details: pet.details || "",
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FIELDS = [
    { name: "name",    label: "Pet Name",   placeholder: "e.g. Buddy"          },
    { name: "species", label: "Species",    placeholder: "e.g. Dog, Cat"        },
    { name: "breed",   label: "Breed",      placeholder: "e.g. Labrador"        },
    { name: "color",   label: "Color",      placeholder: "e.g. Brown and white" },
    { name: "area",    label: "Area",       placeholder: "e.g. Brgy. San Jose"  },
    { name: "address", label: "Address",    placeholder: "Full address"         },
  ];

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-black/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/8">
          <div className="flex items-center gap-2">
            <span>✏️</span>
            <span className="font-bold text-[15px] text-[#1a3a08]">Edit Report</span>
          </div>
          <div className="flex items-center gap-2">
            <TypeBadge type={pet.type} />
            <StatusBadge status={pet.status ?? "pending"} />
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg border border-black/12 bg-transparent text-gray-400 hover:bg-gray-50 cursor-pointer flex items-center justify-center text-sm transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ name, label, placeholder }) => (
              <div key={name} className={name === "address" ? "col-span-2" : ""}>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#B45A22] mb-1">
                  {label}
                </label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-xl border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.88)] font-bold text-sm text-[#1a4a08] outline-none focus:border-[#B45A22] focus:ring-2 focus:ring-[rgba(180,90,34,0.12)] transition-all"
                />
              </div>
            ))}
          </div>

          {/* Details textarea */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#B45A22] mb-1">
              Details
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Additional details about the pet…"
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.88)] font-bold text-sm text-[#1a4a08] outline-none focus:border-[#B45A22] focus:ring-2 focus:ring-[rgba(180,90,34,0.12)] transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-black/8 flex gap-2 bg-white shrink-0">
          <button onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-transparent border border-black/15 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-[#2d5a1b] text-white border-none hover:bg-[#245015] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full inline-block" style={{ animation: "spin .7s linear infinite" }} />
                Saving…
              </>
            ) : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Detail Modal ── */
function DetailModal({ pet, onClose, onApprove, onReject, onDelete, onEdit }) {
  const [imgErr, setImgErr] = useState(false);
  useEffect(() => { setImgErr(false); }, [pet?.id, pet?.photoUrl]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const photoUrl = normalizePhotoUrl(pet.photoUrl);
  const isPending  = !pet.status || pet.status === "pending";
  const isApproved = pet.status === "approved";

  const pills = [
    { icon: "📍", label: "Area",     value: pet.area || "—"   },
    { icon: "🎨", label: "Color",    value: pet.color || "—"  },
    { icon: "📅", label: "Reported", value: pet.reportedDate ? new Date(pet.reportedDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—" },
    { icon: "🐾", label: "Species",  value: pet.species || "—" },
    ...(pet.breed ? [{ icon: "🦮", label: "Breed", value: pet.breed }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-black/10"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/8">
          <div className="flex items-center gap-2">
            <span>🐾</span>
            <span className="font-bold text-[15px] text-[#1a3a08]">Report Details</span>
          </div>
          <div className="flex items-center gap-2">
            <TypeBadge type={pet.type} />
            <StatusBadge status={pet.status ?? "pending"} />
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg border border-black/12 bg-transparent text-gray-400 hover:bg-gray-50 cursor-pointer flex items-center justify-center text-sm transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* Cover photo */}
          <div className="relative h-48 bg-[#f0ece0] shrink-0 overflow-hidden">
            {photoUrl && !imgErr ? (
              <img src={photoUrl} alt={pet.name || "Pet"}
                className="w-full h-full object-cover"
                onError={() => { setImgErr(true); }}
                onLoad={() => setImgErr(false)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
                {pet.species?.toLowerCase() === "cat" ? "🐱" : "🐶"}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-extrabold text-lg text-[#1a3a08] leading-tight">{pet.name || "Unknown"}</p>
              {(pet.species || pet.breed) && (
                <p className="text-xs font-semibold text-[#6a7a50] mt-0.5">{[pet.species, pet.breed].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {pills.map(({ icon, label, value }) => (
                <div key={label} className="bg-[#faf8f0] border border-black/8 rounded-xl px-3 py-1.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#B45A22]">{icon} {label}</p>
                  <p className="text-[13px] font-bold text-[#1a3a08] mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {pet.address && (
              <div className="bg-[#faf8f0] border border-black/8 rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#B45A22] mb-1">📍 Address</p>
                <p className="text-[13px] font-bold text-[#1a3a08] leading-snug">{pet.address}</p>
              </div>
            )}
            {pet.details && (
              <div className="bg-[#faf8f0] border border-black/8 rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">📝 Details</p>
                <p className="text-[13px] font-semibold text-[#3a5020] leading-relaxed">{pet.details}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-black/8 flex gap-2 bg-white shrink-0">
          {isPending && (<>
            <button onClick={() => onApprove(pet)}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-[#2d5a1b] text-white border-none hover:bg-[#245015] transition-colors">
              ✓ Approve
            </button>
            <button onClick={() => onReject(pet)}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-transparent border border-black/15 text-gray-500 hover:bg-gray-50 transition-colors">
              ✕ Reject
            </button>
          </>)}
          {isApproved && (
            <button onClick={() => onReject(pet)}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-transparent border border-black/15 text-amber-600 hover:bg-amber-50 transition-colors">
              ⊘ Revoke Approval
            </button>
          )}
          {pet.status === "rejected" && (
            <button onClick={() => onApprove(pet)}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-[#2d5a1b] text-white border-none hover:bg-[#245015] transition-colors">
              ✓ Re-approve
            </button>
          )}
          {/* Edit button */}
          <button onClick={() => onEdit(pet)}
            className="px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
            ✏️
          </button>
          <button onClick={() => onDelete(pet)}
            className="px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors">
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
  const [editPet, setEditPet]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

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

  const handleApprove = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/admin/${pet.id}/approve`, { method: "PUT" });
      if (res.ok) {
        setPets(p => p.map(x => x.id === pet.id ? { ...x, status: "approved" } : x));
        setSelected(null); setConfirmAct(null);
        showToast("Report approved — now visible to the public.");
        onStatsChange?.();
      } else showToast("Failed to approve report.", "error");
    } catch { showToast("Network error.", "error"); }
  };

  const handleReject = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/admin/${pet.id}/reject`, { method: "PUT" });
      if (res.ok) {
        setPets(p => p.map(x => x.id === pet.id ? { ...x, status: "rejected" } : x));
        setSelected(null); setConfirmAct(null);
        showToast("Report rejected.");
        onStatsChange?.();
      } else showToast("Failed to reject report.", "error");
    } catch { showToast("Network error.", "error"); }
  };

  const handleDelete = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/admin/${pet.id}`, { method: "DELETE" });
      if (res.ok) {
        setPets(p => p.filter(x => x.id !== pet.id));
        setSelected(null); setConfirmDel(null);
        showToast("Report deleted.");
        onStatsChange?.();
      } else showToast("Failed to delete report.", "error");
    } catch { showToast("Network error.", "error"); }
  };

  /* ── NEW: handle update ── */
  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/missing-pets/admin/${editPet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setPets(p => p.map(x => x.id === editPet.id ? { ...x, ...updated } : x));
        // Keep detail modal open but refresh the pet data shown
        if (selected?.id === editPet.id) setSelected(prev => ({ ...prev, ...updated }));
        setEditPet(null);
        showToast("Report updated successfully.");
      } else {
        showToast("Failed to update report.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    all:      pets.length,
    pending:  pets.filter(p => !p.status || p.status === "pending").length,
    approved: pets.filter(p => p.status === "approved").length,
    rejected: pets.filter(p => p.status === "rejected").length,
    lost:     pets.filter(p => p.type === "lost").length,
    found:    pets.filter(p => p.type === "found").length,
  };

  const filtered = pets.filter(p => {
    const matchStatus = statusFilter === "all" ? true
      : statusFilter === "pending" ? (!p.status || p.status === "pending")
      : p.status === statusFilter;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchSearch = !search.trim() || [p.name, p.breed, p.area, p.address, p.color, p.species]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchType && matchSearch;
  });

  if (!show) return null;

  const STAT_CARDS = [
    { label: "Total",    value: counts.all,      icon: "📋", bg: "bg-amber-100",  text: "text-amber-700"  },
    { label: "Pending",  value: counts.pending,  icon: "🕐", bg: "bg-amber-100",  text: "text-amber-700"  },
    { label: "Approved", value: counts.approved, icon: "✅", bg: "bg-green-100",  text: "text-green-800"  },
    { label: "Rejected", value: counts.rejected, icon: "❌", bg: "bg-red-100",    text: "text-red-700"    },
    { label: "Lost",     value: counts.lost,     icon: "🔴", bg: "bg-red-50",     text: "text-red-600"    },
    { label: "Found",    value: counts.found,    icon: "🟢", bg: "bg-green-50",   text: "text-green-700"  },
  ];

  const STATUS_FILTERS = [
    { val: "all",      label: "All",      active: "bg-[#1a4a08] text-white"  },
    { val: "pending",  label: "Pending",  active: "bg-amber-600 text-white"  },
    { val: "approved", label: "Approved", active: "bg-[#1c4f09] text-white"  },
    { val: "rejected", label: "Rejected", active: "bg-red-600 text-white"    },
  ];

  return (
    <div className="font-[Nunito,sans-serif]">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} .mpp-anim{animation:fadeUp .25s ease both;}`}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[2000] px-5 py-3 rounded-xl font-extrabold text-sm text-white shadow-xl mpp-anim ${toast.type === "success" ? "bg-[rgba(28,79,9,0.94)]" : "bg-[rgba(192,48,48,0.94)]"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[rgba(180,90,34,0.10)] border border-[rgba(180,90,34,0.28)] text-[#B45A22] mb-2">
            🐾 Community Reports
          </span>
          <h2 className="text-3xl font-black text-[#1a4a08] leading-tight m-0" style={{ fontFamily: "'Playfair Display', serif" }}>
            <em className="italic text-[#B45A22]">Missing</em> Pets
          </h2>
          <p className="text-sm font-bold text-[#6a7a50] mt-1">
            {counts.all} total · {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <button onClick={fetchPets}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm text-[#1c4f09] bg-[rgba(90,170,48,0.12)] border border-[rgba(90,170,48,0.30)] hover:bg-[rgba(90,170,48,0.2)] cursor-pointer transition-colors">
          🔄 Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-6 gap-2.5 mb-5">
        {STAT_CARDS.map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-3 flex items-center gap-2.5 border border-black/8`}>
            <span className="text-lg">{c.icon}</span>
            <div>
              <p className={`text-xl font-black leading-none ${c.text}`}>{c.value}</p>
              <p className="text-[9px] font-black text-[#6a7a50] uppercase tracking-widest mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 flex-wrap items-center mb-4">
        <div className="inline-flex gap-0.5 bg-[rgba(255,248,220,0.7)] rounded-full p-1 border border-[rgba(180,140,60,0.28)]">
          {STATUS_FILTERS.map(({ val, label, active }) => (
            <button key={val} onClick={() => setStatus(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border-none cursor-pointer transition-all ${statusFilter === val ? active : "bg-transparent text-[#3a5020] hover:bg-[rgba(180,140,60,0.08)]"}`}>
              {label}
              {val !== "all" && counts[val] > 0 && <span className="opacity-60 ml-1">({counts[val]})</span>}
            </button>
          ))}
        </div>

        <div className="inline-flex gap-0.5 bg-[rgba(255,248,220,0.7)] rounded-full p-1 border border-[rgba(180,140,60,0.28)]">
          {[["all", "All", "bg-[#555] text-white"], ["lost", "Lost", "bg-red-600 text-white"], ["found", "Found", "bg-[#1c4f09] text-white"]].map(([val, label, active]) => (
            <button key={val} onClick={() => setType(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold border-none cursor-pointer transition-all ${typeFilter === val ? active : "bg-transparent text-[#3a5020] hover:bg-[rgba(180,140,60,0.08)]"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9aaa80] pointer-events-none">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, breed, area, address…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.88)] font-bold text-sm text-[#1a4a08] outline-none focus:border-[#B45A22] focus:ring-2 focus:ring-[rgba(180,90,34,0.12)] transition-all" />
        </div>

        {(statusFilter !== "all" || typeFilter !== "all" || search) && (
          <button onClick={() => { setStatus("all"); setType("all"); setSearch(""); }}
            className="px-3 py-2 rounded-xl text-xs font-extrabold border border-[rgba(180,140,60,0.28)] bg-[rgba(255,248,220,0.7)] text-[#6a7a50] cursor-pointer hover:bg-[rgba(180,140,60,0.1)] transition-colors whitespace-nowrap">
            ✕ Clear
          </button>
        )}
      </div>

      {/* Pending banner */}
      {counts.pending > 0 && statusFilter !== "pending" && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setStatus("pending")}>
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-xs font-extrabold text-amber-700 m-0">
            {counts.pending} report{counts.pending !== 1 ? "s" : ""} awaiting review —{" "}
            <span className="underline">click to filter</span>
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-16 gap-3 text-[#3a5020] font-bold text-sm">
          <div className="w-5 h-5 border-[3px] border-[rgba(180,90,34,0.2)] border-t-[#B45A22] rounded-full" style={{ animation: "spin .7s linear infinite" }} />
          Loading reports…
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[#6a7a50]">
          <div className="text-5xl mb-3">🐾</div>
          <p className="font-black text-lg text-[#1a4a08]" style={{ fontFamily: "'Playfair Display', serif" }}>No reports found</p>
          <p className="text-sm font-bold mt-1">{search ? "Try a different search term." : "No reports match the selected filters."}</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-[rgba(255,248,225,0.9)] border border-[rgba(180,140,60,0.28)] rounded-2xl overflow-hidden shadow-sm">
          <div className="grid gap-2 px-4 py-2.5 bg-[rgba(180,140,60,0.08)] border-b border-[rgba(180,140,60,0.18)]"
            style={{ gridTemplateColumns: "56px 80px 1fr 90px 130px 100px 95px 160px" }}>
            {["Photo","Type","Pet / Breed","Species","Area / Address","Status","Reported","Actions"].map(h => (
              <div key={h} className="text-[10px] font-black uppercase tracking-widest text-[#6a7a50]">{h}</div>
            ))}
          </div>

          {filtered.map((pet, i) => (
            <div key={pet.id}
              className="grid gap-2 px-4 py-3 items-center cursor-pointer transition-colors hover:bg-[rgba(90,170,48,0.05)]"
              style={{ gridTemplateColumns: "56px 80px 1fr 90px 130px 100px 95px 160px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(180,140,60,0.11)" : "none" }}
              onClick={() => setSelected(pet)}>

              {/* Photo */}
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-[rgba(180,140,60,0.12)] flex items-center justify-center shrink-0">
                {pet.photoUrl ? (
                  <img src={normalizePhotoUrl(pet.photoUrl)} alt=""
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                ) : null}
                <span className="text-2xl" style={{ display: pet.photoUrl ? "none" : "flex" }}>
                  {pet.species?.toLowerCase() === "cat" ? "🐱" : "🐶"}
                </span>
              </div>

              <div><TypeBadge type={pet.type} /></div>

              <div>
                <p className="font-black text-sm text-[#1a4a08] m-0">{pet.name || "Unknown"}</p>
                <p className="text-[11px] font-bold text-[#6a7a50] m-0">{pet.breed || "—"}</p>
              </div>

              <div className="text-xs font-bold text-[#3a5020]">{pet.species}</div>

              <div>
                <p className="text-xs font-bold text-[#3a5020] m-0 truncate">{pet.area || "—"}</p>
                {pet.address && <p className="text-[10px] font-bold text-[#9aaa80] m-0 truncate">{pet.address}</p>}
              </div>

              <div><StatusBadge status={pet.status ?? "pending"} /></div>

              <div className="text-[11px] font-bold text-[#6a7a50]">{formatDate(pet.reportedDate)}</div>

              {/* Actions — now includes Edit ✏️ */}
              <div className="flex gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelected(pet)} title="View"
                  className="px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-opacity hover:opacity-70 bg-blue-50 border-blue-200 text-blue-700">
                  👁
                </button>
                <button onClick={() => setEditPet(pet)} title="Edit"
                  className="px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-opacity hover:opacity-70 bg-amber-50 border-amber-200 text-amber-700">
                  ✏️
                </button>
                {(pet.status === "pending" || !pet.status || pet.status === "rejected") && (
                  <button onClick={() => setConfirmAct({ pet, action: "approve" })} title="Approve"
                    className="px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-opacity hover:opacity-70 bg-green-50 border-green-200 text-green-700">
                    ✓
                  </button>
                )}
                {(pet.status === "pending" || !pet.status || pet.status === "approved") && (
                  <button onClick={() => setConfirmAct({ pet, action: "reject" })} title={pet.status === "approved" ? "Revoke" : "Reject"}
                    className="px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-opacity hover:opacity-70 bg-red-50 border-red-200 text-red-600">
                    {pet.status === "approved" ? "⊘" : "✕"}
                  </button>
                )}
                <button onClick={() => setConfirmDel(pet)} title="Delete"
                  className="px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-opacity hover:opacity-70 bg-red-50 border-red-200 text-red-600">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-right text-[11px] font-bold text-[#9aaa80] mt-2">
          Showing {filtered.length} of {pets.length} report{pets.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Detail modal */}
      {selected && !editPet && (
        <DetailModal
          pet={selected}
          onClose={() => setSelected(null)}
          onApprove={(pet) => { setSelected(null); setConfirmAct({ pet, action: "approve" }); }}
          onReject={(pet)  => { setSelected(null); setConfirmAct({ pet, action: "reject"  }); }}
          onDelete={(pet)  => { setSelected(null); setConfirmDel(pet); }}
          onEdit={(pet)    => setEditPet(pet)}
        />
      )}

      {/* Edit modal */}
      {editPet && (
        <EditModal
          pet={editPet}
          onClose={() => setEditPet(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {/* Approve / Reject confirm */}
      {confirmAct && (
        <ConfirmDialog
          title={confirmAct.action === "approve" ? "Approve report?" : confirmAct.pet.status === "approved" ? "Revoke approval?" : "Reject report?"}
          message={
            confirmAct.action === "approve"
              ? `"${confirmAct.pet.name || "Unknown"}" will become visible to the public.`
              : confirmAct.pet.status === "approved"
                ? `"${confirmAct.pet.name || "Unknown"}" will be hidden from the public board.`
                : `"${confirmAct.pet.name || "Unknown"}" will be marked as rejected.`
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
          message={`The report for "${confirmDel.name || "Unknown"}" and its photo will be removed forever.`}
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