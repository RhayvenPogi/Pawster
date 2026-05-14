import { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";

/* ─────────────────────────────────────────────
   STATUS / STYLE CONFIG
───────────────────────────────────────────── */
const STATUS_STYLE = {
  approved: { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  dot: "bg-green-400",  label: "Approved" },
  pending:  { bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-300",  dot: "bg-amber-400",  label: "Pending"  },
  rejected: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300",    dot: "bg-red-400",    label: "Rejected" },
  resolved: { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-300",   dot: "bg-blue-400",   label: "Resolved" },
};

function getPetPhotoUrl(pet) {
  if (!pet?.id) return null;
  return `/api/missing-pets/${pet.id}/photo`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

/* ─────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────── */
const Ico = ({ d, size = 16, style, className, viewBox = "0 0 24 24", fill = "none" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const Icons = {
  Paw: ({ size = 16, style, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/>
      <circle cx="6.5" cy="15.5" r="2.5"/>
      <path d="M17.5 15.5c0 4-6 7-6 7s-6-3-6-7"/>
    </svg>
  ),
  Eye: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Edit: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Check: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Trash: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  RefreshCw: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Search: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  MapPin: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Palette: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  Calendar: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Cat: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.26A9.06 9.06 0 0 1 12 5z"/>
      <path d="M8 14v.5"/><path d="M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/>
    </svg>
  ),
  Dog: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3 4.722 3.295 3 4.272 3 6c0 1.333.375 2.375 1.125 3.125L3 16v3h3l1-2h8l1 2h3v-3l-1.125-6.875C18.625 8.375 19 7.333 19 6c0-1.728-1.722-2.705-3.5-3-.667-.12-1.353.143-2 .5"/>
      <path d="M9.5 11c-.667 0-1 .5-1 1s.333 1 1 1h5c.667 0 1-.5 1-1s-.333-1-1-1h-5z"/>
    </svg>
  ),
  Home: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  AlertTriangle: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  FileText: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Save: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  Slash: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  Info: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Clock: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  List: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   BADGE COMPONENTS
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const isLost = type === "lost";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${isLost ? "bg-red-100 text-red-700 border-red-300" : "bg-green-100 text-green-800 border-green-300"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLost ? "bg-red-400" : "bg-green-400"}`} />
      {isLost ? "Lost" : "Found"}
    </span>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────────── */
function ConfirmDialog({ message, title, icon, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor, confirmBg, confirmBorder }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#fffceb] border border-[rgba(180,140,60,0.35)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: confirmBg || "rgba(192,48,48,0.09)", color: confirmColor }}>
          {icon}
        </div>
        {title && (
          <p className="text-center font-black text-[#1a4a08] text-base mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
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
            className="flex-1 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ background: confirmBg, border: `1.5px solid ${confirmBorder}`, color: confirmColor }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────────── */
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

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const FIELDS = [
    { name: "name",    label: "Pet Name",  placeholder: "e.g. Buddy"           },
    { name: "species", label: "Species",   placeholder: "e.g. Dog, Cat"         },
    { name: "breed",   label: "Breed",     placeholder: "e.g. Labrador"         },
    { name: "color",   label: "Color",     placeholder: "e.g. Brown and white"  },
    { name: "area",    label: "Area",      placeholder: "e.g. Brgy. San Jose"   },
    { name: "address", label: "Address",   placeholder: "Full address"          },
  ];

  const inputCls = "w-full px-3 py-2 rounded-xl border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.88)] font-bold text-sm text-[#1a4a08] outline-none focus:border-[#B45A22] focus:ring-2 focus:ring-[rgba(180,90,34,0.12)] transition-all";

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-black/10"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icons.Edit size={15} style={{ color: "#B45A22", flexShrink: 0 }} />
            <span className="font-bold text-[15px] text-[#1a3a08] truncate">Edit Report</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <TypeBadge type={pet.type} />
            <StatusBadge status={pet.status ?? "pending"} />
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg border border-black/[0.12] bg-transparent text-gray-400 hover:bg-gray-50 cursor-pointer flex items-center justify-center transition-colors ml-1">
              <Icons.X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map(({ name, label, placeholder }) => (
              <div key={name} className={name === "address" ? "sm:col-span-2" : ""}>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#B45A22] mb-1">{label}</label>
                <input name={name} value={form[name]} onChange={handleChange}
                  placeholder={placeholder} className={inputCls} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#B45A22] mb-1">Details</label>
            <textarea name="details" value={form.details} onChange={handleChange}
              placeholder="Additional details about the pet…" rows={4}
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-black/[0.08] flex gap-2 bg-white flex-shrink-0">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-transparent border border-black/[0.15] text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-[#2d5a1b] text-white border-none hover:bg-[#245015] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full inline-block" style={{ animation: "spin .7s linear infinite" }} />
                Saving…
              </>
            ) : (
              <><Icons.Save size={14} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────── */
function DetailModal({ pet, onClose, onApprove, onReject, onDelete, onEdit }) {
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => { setImgErr(false); }, [pet?.id]);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const photoUrl  = getPetPhotoUrl(pet);
  const isPending  = !pet.status || pet.status === "pending";
  const isApproved = pet.status === "approved";
  const isCat      = pet.species?.toLowerCase() === "cat";

  const pills = [
    { Icon: Icons.MapPin,  label: "Area",     value: pet.area    || "—" },
    { Icon: Icons.Palette, label: "Color",    value: pet.color   || "—" },
    { Icon: Icons.Calendar,label: "Reported", value: formatDate(pet.reportedDate) },
    { Icon: Icons.Paw,     label: "Species",  value: pet.species || "—" },
    ...(pet.breed          ? [{ Icon: Icons.Dog,  label: "Breed",        value: pet.breed }] : []),
    ...(pet.resolvedByUser ? [{ Icon: Icons.Home, label: "Owner Status", value: "Reunited with owner" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-black/10"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.08] flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icons.FileText size={15} style={{ color: "#B45A22", flexShrink: 0 }} />
            <span className="font-bold text-[15px] text-[#1a3a08] truncate">Report Details</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <TypeBadge type={pet.type} />
            <StatusBadge status={pet.status ?? "pending"} />
            {pet.resolvedByUser && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border bg-blue-100 text-blue-700 border-blue-300">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-400" />Reunited
              </span>
            )}
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg border border-black/[0.12] bg-transparent text-gray-400 hover:bg-gray-50 cursor-pointer flex items-center justify-center transition-colors ml-1">
              <Icons.X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* Cover photo */}
          <div className="relative flex-shrink-0 overflow-hidden" style={{ height: "clamp(140px, 28vw, 192px)" }}>
            {!imgErr ? (
              <img src={photoUrl} alt={pet.name || "Pet"}
                className="w-full h-full object-cover"
                onError={() => setImgErr(true)} onLoad={() => setImgErr(false)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f0ece0]">
                {isCat
                  ? <Icons.Cat size={48} style={{ color: "#9aaa80", opacity: 0.4 }} />
                  : <Icons.Dog size={48} style={{ color: "#9aaa80", opacity: 0.4 }} />}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
            {pet.resolvedByUser && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-black shadow-lg">
                <Icons.Home size={11} style={{ color: "#fff" }} /> Reunited with owner
              </div>
            )}
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-extrabold text-lg text-[#1a3a08] leading-tight">{pet.name || "Unknown"}</p>
              {(pet.species || pet.breed) && (
                <p className="text-xs font-semibold text-[#6a7a50] mt-0.5">{[pet.species, pet.breed].filter(Boolean).join(" · ")}</p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-3">
            {/* Reunited banner */}
            {pet.resolvedByUser && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                <Icons.Home size={22} style={{ color: "#2563eb", flexShrink: 0 }} />
                <div>
                  <p className="text-xs font-black text-blue-700 uppercase tracking-wider m-0">Pet Reunited</p>
                  <p className="text-sm font-bold text-blue-600 m-0 mt-0.5">The owner has confirmed this pet was found and reunited.</p>
                </div>
              </div>
            )}

            {/* Pills */}
            <div className="flex gap-2 flex-wrap">
              {pills.map(({ Icon, label, value }) => (
                <div key={label} className="bg-[#faf8f0] border border-black/[0.08] rounded-xl px-3 py-1.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#B45A22] flex items-center gap-1">
                    <Icon size={10} /> {label}
                  </p>
                  <p className="text-[13px] font-bold text-[#1a3a08] mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {pet.address && (
              <div className="bg-[#faf8f0] border border-black/[0.08] rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#B45A22] mb-1 flex items-center gap-1">
                  <Icons.MapPin size={10} /> Address
                </p>
                <p className="text-[13px] font-bold text-[#1a3a08] leading-snug">{pet.address}</p>
              </div>
            )}

            {pet.details && (
              <div className="bg-[#faf8f0] border border-black/[0.08] rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                  <Icons.FileText size={10} /> Details
                </p>
                <p className="text-[13px] font-semibold text-[#3a5020] leading-relaxed">{pet.details}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-black/[0.08] flex gap-2 bg-white flex-shrink-0 flex-wrap">
          {isPending && (
            <>
              <button onClick={() => onApprove(pet)}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-[#2d5a1b] text-white border-none hover:bg-[#245015] transition-colors flex items-center justify-center gap-1.5">
                <Icons.Check size={13} /> Approve
              </button>
              <button onClick={() => onReject(pet)}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-transparent border border-black/[0.15] text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                <Icons.X size={13} /> Reject
              </button>
            </>
          )}
          {isApproved && (
            <button onClick={() => onReject(pet)}
              className="flex-1 min-w-[120px] py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-transparent border border-black/[0.15] text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5">
              <Icons.Slash size={13} /> Revoke Approval
            </button>
          )}
          {pet.status === "rejected" && (
            <button onClick={() => onApprove(pet)}
              className="flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-[#2d5a1b] text-white border-none hover:bg-[#245015] transition-colors flex items-center justify-center gap-1.5">
              <Icons.Check size={13} /> Re-approve
            </button>
          )}
          <button onClick={() => onEdit(pet)}
            className="px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5">
            <Icons.Edit size={13} />
          </button>
          <button onClick={() => onDelete(pet)}
            className="px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
            <Icons.Trash size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PANEL
───────────────────────────────────────────── */
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
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 15;

  usePageTitle("Missing Pets Management");

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
  useEffect(() => { setPage(1); }, [statusFilter, typeFilter, search]);

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
    resolved: pets.filter(p => !!p.resolvedByUser).length,
    lost:     pets.filter(p => p.type === "lost").length,
    found:    pets.filter(p => p.type === "found").length,
  };

  const filtered = pets.filter(p => {
    const matchStatus =
      statusFilter === "all"      ? true :
      statusFilter === "pending"  ? (!p.status || p.status === "pending") :
      statusFilter === "resolved" ? !!p.resolvedByUser :
      p.status === statusFilter;
    const matchType   = typeFilter === "all" || p.type === typeFilter;
    const matchSearch = !search.trim() ||
      [p.name, p.breed, p.area, p.address, p.color, p.species]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchType && matchSearch;
  });

  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedPets    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!show) return null;

  const STAT_CARDS = [
    { label: "Total",    value: counts.all,      Icon: Icons.List,          bg: "bg-amber-50",  text: "text-amber-700"  },
    { label: "Pending",  value: counts.pending,  Icon: Icons.Clock,         bg: "bg-amber-100", text: "text-amber-700"  },
    { label: "Approved", value: counts.approved, Icon: Icons.Check,         bg: "bg-green-100", text: "text-green-800"  },
    { label: "Rejected", value: counts.rejected, Icon: Icons.X,             bg: "bg-red-100",   text: "text-red-700"    },
    { label: "Reunited", value: counts.resolved, Icon: Icons.Home,          bg: "bg-blue-100",  text: "text-blue-700"   },
    { label: "Lost",     value: counts.lost,     Icon: Icons.AlertTriangle, bg: "bg-red-50",    text: "text-red-600"    },
    { label: "Found",    value: counts.found,    Icon: Icons.Paw,           bg: "bg-green-50",  text: "text-green-700"  },
  ];

  const STATUS_FILTERS = [
    { val: "all",      label: "All",      active: "bg-[#1a4a08] text-white"  },
    { val: "pending",  label: "Pending",  active: "bg-amber-600 text-white"  },
    { val: "approved", label: "Approved", active: "bg-[#1c4f09] text-white"  },
    { val: "rejected", label: "Rejected", active: "bg-red-600 text-white"    },
    { val: "resolved", label: "Reunited", active: "bg-blue-600 text-white"   },
  ];

  /* ─── Table column headers (desktop) ─── */
  const COL_HEADERS = ["Photo", "Type", "Pet / Breed", "Species", "Area", "Status", "Date", "Actions"];

  return (
    <div className="font-[Nunito,sans-serif]">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin   { to   { transform:rotate(360deg) } }
        .mpp-anim { animation: fadeUp .22s ease both; }
        /* Mobile card layout for table rows */
        @media (max-width: 767px) {
          .pet-table-header { display: none !important; }
          .pet-table-row    { display: flex !important; flex-direction: column !important; gap: 0.625rem !important; padding: 1rem !important; }
          .pet-row-photo    { display: flex !important; align-items: center !important; gap: 0.75rem !important; }
          .pet-row-grid     { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0.375rem 0.75rem !important; }
          .pet-row-actions  { display: flex !important; flex-wrap: wrap !important; gap: 0.375rem !important; }
          .pet-col-hide     { display: none !important; }
        }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[2000] px-5 py-3 rounded-xl font-extrabold text-sm text-white shadow-xl mpp-anim flex items-center gap-2 ${toast.type === "success" ? "bg-[rgba(28,79,9,0.94)]" : "bg-[rgba(192,48,48,0.94)]"}`}>
          {toast.type === "success"
            ? <Icons.Check size={14} style={{ color: "#fff" }} />
            : <Icons.X     size={14} style={{ color: "#fff" }} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6 pb-5 border-b border-[rgba(180,140,60,0.2)]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B45A22] mb-1.5 flex items-center gap-1.5">
            <Icons.Paw size={10} /> Community Reports
          </p>
          <h2 className="text-[clamp(1.25rem,4vw,1.6rem)] font-black text-[#1a4a08] leading-tight m-0 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Missing Pets Management
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {[
              { label: "Total",    value: counts.all,      color: "text-[#1a4a08]" },
              { label: "Pending",  value: counts.pending,  color: "text-amber-600" },
              { label: "Approved", value: counts.approved, color: "text-green-700" },
              { label: "Rejected", value: counts.rejected, color: "text-red-600"   },
              { label: "Reunited", value: counts.resolved, color: "text-blue-600"  },
            ].map(({ label, value, color }) => (
              <span key={label} className="text-[11px] font-bold text-[#6a7a50]">
                <span className={`font-black text-sm ${color}`}>{value}</span> {label}
              </span>
            ))}
          </div>
        </div>
        <button onClick={fetchPets}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs text-[#1c4f09] bg-transparent border border-[rgba(90,170,48,0.35)] hover:bg-[rgba(90,170,48,0.08)] cursor-pointer transition-colors mt-1">
          <Icons.RefreshCw size={13} /> Refresh
        </button>
      </div>


      {/* ── Filters inline with search ── */}
      <div className="flex gap-2 flex-wrap items-center mb-5">

        {/* Search */}
        <div className="flex-1 relative" style={{ minWidth: 180 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9aaa80]">
            <Icons.Search size={13} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, breed, area…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-[rgba(180,140,60,0.28)] bg-[rgba(255,250,232,0.9)] font-semibold text-sm text-[#1a4a08] outline-none focus:border-[#B45A22] focus:ring-2 focus:ring-[rgba(180,90,34,0.10)] transition-all placeholder:text-[#b4a870] placeholder:font-normal" />
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 rounded-lg border text-[11px] font-extrabold cursor-pointer outline-none transition-all bg-[rgba(255,250,232,0.9)]"
            style={{
              borderColor: statusFilter !== "all" ? "#1a4a08" : "rgba(180,140,60,0.28)",
              color: statusFilter !== "all" ? "#1a4a08" : "#3a5020",
            }}>
            <option value="all">All Status ({counts.all})</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="approved">Approved ({counts.approved})</option>
            <option value="rejected">Rejected ({counts.rejected})</option>
            <option value="resolved">Reunited ({counts.resolved})</option>
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#9aaa80]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </div>

        {/* Type dropdown */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setType(e.target.value)}
            className="appearance-none pl-3 pr-7 py-2 rounded-lg border text-[11px] font-extrabold cursor-pointer outline-none transition-all bg-[rgba(255,250,232,0.9)]"
            style={{
              borderColor: typeFilter !== "all" ? "#1a4a08" : "rgba(180,140,60,0.28)",
              color: typeFilter !== "all" ? "#1a4a08" : "#3a5020",
            }}>
            <option value="all">All Types</option>
            <option value="lost">Lost ({counts.lost})</option>
            <option value="found">Found ({counts.found})</option>
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#9aaa80]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </div>

        {/* Clear */}
        {(statusFilter !== "all" || typeFilter !== "all" || search) && (
          <button onClick={() => { setStatus("all"); setType("all"); setSearch(""); }}
            className="px-3 py-2 rounded-lg text-[11px] font-bold border border-[rgba(180,140,60,0.28)] bg-transparent text-[#6a7a50] cursor-pointer hover:bg-[rgba(180,140,60,0.08)] transition-colors whitespace-nowrap flex items-center gap-1">
            <Icons.X size={10} /> Clear
          </button>
        )}

        {search && (
          <span className="text-[11px] font-semibold text-[#9aaa80] whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      
      {counts.resolved > 0 && statusFilter !== "resolved" && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 mb-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setStatus("resolved")}>
          <Icons.Home size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
          <p className="text-xs font-extrabold text-blue-700 m-0">
            {counts.resolved} pet{counts.resolved !== 1 ? "s" : ""} marked as reunited by their owner —{" "}
            <span className="underline">click to filter</span>
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center items-center py-16 gap-3 text-[#3a5020] font-bold text-sm">
          <div className="w-5 h-5 border-[3px] border-[rgba(180,90,34,0.2)] border-t-[#B45A22] rounded-full" style={{ animation: "spin .7s linear infinite" }} />
          Loading reports…
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[#6a7a50]">
          <Icons.Paw size={44} style={{ color: "#9aaa80", opacity: 0.3, display: "block", margin: "0 auto 0.75rem" }} />
          <p className="font-black text-lg text-[#1a4a08] m-0" style={{ fontFamily: "'Playfair Display', serif" }}>No reports found</p>
          <p className="text-sm font-bold mt-1">{search ? "Try a different search term." : "No reports match the selected filters."}</p>
        </div>
      )}

      {/* ── Table / Card list ── */}
      {!loading && filtered.length > 0 && (
        <div className="bg-[rgba(255,248,225,0.9)] border border-[rgba(180,140,60,0.28)] rounded-2xl overflow-hidden shadow-sm">

          {/* Desktop header */}
          <div
            className="pet-table-header grid gap-2 px-4 py-2.5 bg-[rgba(180,140,60,0.08)] border-b border-[rgba(180,140,60,0.18)]"
            style={{ gridTemplateColumns: "56px 80px 1fr 90px 130px 120px 95px 160px" }}>
            {COL_HEADERS.map(h => (
              <div key={h} className="text-[10px] font-black uppercase tracking-widest text-[#6a7a50]">{h}</div>
            ))}
          </div>

          {pagedPets.map((pet, i) => {
            const isCat = pet.species?.toLowerCase() === "cat";
            const isLast = i === pagedPets.length - 1;
            return (
              <div key={pet.id}
                className="pet-table-row cursor-pointer transition-colors hover:bg-[rgba(90,170,48,0.05)]"
                style={{
                  /* Desktop: 8-col grid */
                  display: "grid",
                  gridTemplateColumns: "56px 80px 1fr 90px 130px 120px 95px 160px",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  alignItems: "center",
                  borderBottom: isLast ? "none" : "1px solid rgba(180,140,60,0.11)",
                }}
                onClick={() => setSelected(pet)}>

                {/* Photo */}
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-[rgba(180,140,60,0.12)] flex items-center justify-center flex-shrink-0 relative">
                  <img
                    src={getPetPhotoUrl(pet)} alt=""
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <span className="hidden items-center justify-center w-full h-full">
                    {isCat
                      ? <Icons.Cat size={24} style={{ color: "#9aaa80" }} />
                      : <Icons.Dog size={24} style={{ color: "#9aaa80" }} />}
                  </span>
                  {pet.resolvedByUser && (
                    <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center rounded-xl">
                      <Icons.Home size={14} style={{ color: "#fff" }} />
                    </div>
                  )}
                </div>

                {/* Type */}
                <div><TypeBadge type={pet.type} /></div>

                {/* Pet / Breed */}
                <div>
                  <p className="font-black text-sm text-[#1a4a08] m-0 truncate">{pet.name || "Unknown"}</p>
                  <p className="text-[11px] font-bold text-[#6a7a50] m-0 truncate">{pet.breed || "—"}</p>
                </div>

                {/* Species — hidden on mobile via pet-col-hide */}
                <div className="pet-col-hide text-xs font-bold text-[#3a5020] truncate">{pet.species}</div>

                {/* Area */}
                <div>
                  <p className="text-xs font-bold text-[#3a5020] m-0 truncate">{pet.area || "—"}</p>
                  {pet.address && <p className="text-[10px] font-bold text-[#9aaa80] m-0 truncate">{pet.address}</p>}
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1 items-start">
                  <StatusBadge status={pet.status ?? "pending"} />
                  {pet.resolvedByUser && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-300">
                      <Icons.Home size={9} /> Reunited
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="text-[11px] font-bold text-[#6a7a50] pet-col-hide">{formatDate(pet.reportedDate)}</div>

                {/* Actions */}
                <div className="flex gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                  {[
                    {
                      Icon: Icons.Eye,
                      cls: "bg-blue-50 border-blue-200 text-blue-700",
                      onClick: () => setSelected(pet),
                      show: true,
                    },
                    {
                      Icon: Icons.Edit,
                      cls: "bg-amber-50 border-amber-200 text-amber-700",
                      onClick: () => setEditPet(pet),
                      show: true,
                    },
                    {
                      Icon: Icons.Check,
                      cls: "bg-green-50 border-green-200 text-green-700",
                      onClick: () => setConfirmAct({ pet, action: "approve" }),
                      show: pet.status === "pending" || !pet.status || pet.status === "rejected",
                    },
                    {

                      Icon: pet.status === "approved" ? Icons.Slash : Icons.X,
                      cls: "bg-red-50 border-red-200 text-red-600",
                      onClick: () => setConfirmAct({ pet, action: "reject" }),
                      show: pet.status === "pending" || !pet.status || pet.status === "approved",
                    },
                    {
                      Icon: Icons.Trash,
                      cls: "bg-red-50 border-red-200 text-red-600",
                      onClick: () => setConfirmDel(pet),
                      show: true,
                    },
                  ].filter(a => a.show).map(({ label, Icon, cls, onClick }) => (
                    <button key={label} onClick={onClick} title={label}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer transition-opacity hover:opacity-70 flex items-center gap-1 ${cls}`}>
                      <Icon size={11} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
          <p className="text-[11px] font-semibold text-[#9aaa80] m-0">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} report{filtered.length !== 1 ? "s" : ""}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[rgba(180,140,60,0.28)] bg-transparent text-[#3a5020] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[rgba(180,140,60,0.07)] transition-colors">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-[11px] font-bold border cursor-pointer transition-all
                    ${n === page
                      ? "bg-[#1a4a08] text-white border-[#1a4a08] shadow-sm"
                      : "bg-transparent border-[rgba(180,140,60,0.28)] text-[#3a5020] hover:bg-[rgba(180,140,60,0.07)]"}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[rgba(180,140,60,0.28)] bg-transparent text-[#3a5020] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[rgba(180,140,60,0.07)] transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {selected && !editPet && (
        <DetailModal
          pet={selected}
          onClose={() => setSelected(null)}
          onApprove={pet => { setSelected(null); setConfirmAct({ pet, action: "approve" }); }}
          onReject={pet  => { setSelected(null); setConfirmAct({ pet, action: "reject"  }); }}
          onDelete={pet  => { setSelected(null); setConfirmDel(pet); }}
          onEdit={pet    => setEditPet(pet)}
        />
      )}

      {editPet && (
        <EditModal pet={editPet} onClose={() => setEditPet(null)} onSave={handleUpdate} saving={saving} />
      )}

      {confirmAct && (
        <ConfirmDialog
          title={confirmAct.action === "approve"
            ? "Approve report?"
            : confirmAct.pet.status === "approved" ? "Revoke approval?" : "Reject report?"}
          message={confirmAct.action === "approve"
            ? `"${confirmAct.pet.name || "Unknown"}" will become visible to the public.`
            : confirmAct.pet.status === "approved"
              ? `"${confirmAct.pet.name || "Unknown"}" will be hidden from the public board.`
              : `"${confirmAct.pet.name || "Unknown"}" will be marked as rejected.`}
          icon={confirmAct.action === "approve"
            ? <Icons.Check size={20} />
            : confirmAct.pet.status === "approved" ? <Icons.Slash size={20} /> : <Icons.X size={20} />}
          confirmLabel={confirmAct.action === "approve" ? "Approve" : confirmAct.pet.status === "approved" ? "Revoke" : "Reject"}
          confirmColor={confirmAct.action === "approve" ? "#276010" : confirmAct.pet.status === "approved" ? "#b07010" : "#b03030"}
          confirmBg={confirmAct.action === "approve" ? "rgba(88,139,65,0.12)" : confirmAct.pet.status === "approved" ? "rgba(212,136,10,0.10)" : "rgba(192,48,48,0.09)"}
          confirmBorder={confirmAct.action === "approve" ? "rgba(88,139,65,0.32)" : confirmAct.pet.status === "approved" ? "rgba(212,136,10,0.28)" : "rgba(192,48,48,0.28)"}
          onConfirm={() => confirmAct.action === "approve" ? handleApprove(confirmAct.pet) : handleReject(confirmAct.pet)}
          onCancel={() => setConfirmAct(null)}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="Delete permanently?"
          message={`The report for "${confirmDel.name || "Unknown"}" and its photo will be removed forever.`}
          icon={<Icons.Trash size={20} />}
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