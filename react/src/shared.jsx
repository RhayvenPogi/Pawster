// ── SHARED UTILITIES, CONSTANTS & UI PRIMITIVES ───────────────────────────────
import { useState, useCallback } from "react";
export const PHP_BASE = import.meta.env.VITE_PHP_API_URL ?? "http://localhost:8000";

/**
 * phpApi(action, data, file?)
 *
 * - action: string action name
 * - data:   plain object of fields
 * - file:   optional File object — appended as "photo" if provided
 *
 * Always sends multipart/form-data so PHP can read both $_POST and $_FILES.
 */
export async function phpApi(action, data = {}, file = null) {
  const form = new FormData();
  form.append("action", action);
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) form.append(k, v);
  }
  if (file instanceof File) form.append("photo", file);

  const res = await fetch(`/php/admin/dashboard`, {
    method: "POST",
    body: form,
    credentials: "include",  // ✅ browser sends cookie automatically
  });
  return res.json();
}

// ── TOAST ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

export function ToastContainer({ toasts }) {
  const icons  = { success: "✓", error: "✕", info: "ℹ", warn: "⚠" };
  const colors = {
    success: "border-l-4 border-green-500 text-green-800",
    error:   "border-l-4 border-red-500 text-red-800",
    info:    "border-l-4 border-blue-500 text-blue-800",
    warn:    "border-l-4 border-amber-500 text-amber-800",
  };
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 bg-[#fffce8] rounded-xl px-4 py-3 shadow-xl min-w-[260px] text-sm font-bold animate-slideUp ${colors[t.type]}`}>
          <span>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, icon, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(30,20,5,0.45)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ background: "#fffce8", borderColor: "rgba(90,160,48,0.4)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e8dfc0" }}>
          <h3 className="font-black text-base flex items-center gap-2" style={{ color: "#1a4a08" }}>
            {icon && <span>{icon}</span>} {title}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm hover:bg-green-50 transition-colors"
            style={{ color: "#6a7a50" }}>✕</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#e8dfc0" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FIELD / INPUT / SELECT / TEXTAREA ────────────────────────────────────────
export function Field({ label, children, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#6a7a50" }}>{label}</label>
      {children}
      {error && <span className="text-[11px] font-bold text-red-600">{error}</span>}
    </div>
  );
}

export function Input({ style, ...props }) {
  return (
    <input {...props}
      className="rounded-xl border px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-green-200 transition-all"
      style={{ background: "rgba(255,250,232,0.8)", borderColor: "#c8b878", color: "#1a2e0a", ...style }} />
  );
}

export function Select({ children, ...props }) {
  return (
    <select {...props}
      className="rounded-xl border px-3.5 py-2.5 text-sm font-semibold outline-none cursor-pointer"
      style={{ background: "rgba(255,250,232,0.8)", borderColor: "#c8b878", color: "#1a2e0a" }}>
      {children}
    </select>
  );
}

export function Textarea({ ...props }) {
  return (
    <textarea {...props}
      className="rounded-xl border px-3.5 py-2.5 text-sm font-semibold outline-none resize-y min-h-[80px] focus:ring-2 focus:ring-green-200"
      style={{ background: "rgba(255,250,232,0.8)", borderColor: "#c8b878", color: "#1a2e0a" }} />
  );
}

// ── BUTTONS ───────────────────────────────────────────────────────────────────
export function BtnCancel({ onClick }) {
  return (
    <button onClick={onClick}
      className="px-5 py-2 rounded-xl text-sm font-black border transition-all hover:bg-green-50"
      style={{ color: "#3a5020", borderColor: "#c8b878" }}>
      Cancel
    </button>
  );
}

export function BtnConfirm({ onClick, children, red, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-5 py-2 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: red ? "#c03030" : "#1c4f09" }}>
      {children}
    </button>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color }) {
  const map = {
    green:  "bg-green-100 text-green-700 border border-green-200",
    amber:  "bg-amber-100 text-amber-700 border border-amber-200",
    red:    "bg-red-100 text-red-700 border border-red-200",
    blue:   "bg-blue-100 text-blue-700 border border-blue-200",
    purple: "bg-purple-100 text-purple-700 border border-purple-200",
    teal:   "bg-teal-100 text-teal-700 border border-teal-200",
    gray:   "bg-gray-100 text-gray-600 border border-gray-200",
    orange: "bg-orange-100 text-orange-700 border border-orange-200",
  };
  return (
    <span className={`inline-flex items-center text-[11px] font-black px-2.5 py-0.5 rounded-full ${map[color] || map.gray}`}>
      {children}
    </span>
  );
}

export function statusBadge(s) {
  if (s === "Available") return "green";
  if (s === "Adopted")   return "blue";
  if (s === "Pending")   return "amber";
  return "gray";
}
export function healthBadge(h) {
  if (h === "Healthy")          return "green";
  if (h === "Needs Care")       return "amber";
  if (h === "Under Treatment")  return "purple";
  return "gray";
}
export function roleBadge(r) {
  if (r === "admin") return "purple";
  if (r === "staff") return "blue";
  return "teal";
}

// ── TABLE ─────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ borderColor: "#ddd0a8" }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: "rgba(255,248,210,0.95)" }}>
            {headers.map(h => (
              <th key={h}
                className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b"
                style={{ color: "#6a7a50", borderColor: "#ddd0a8" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ background: "rgba(255,253,240,0.6)" }}>
          {children || (
            <tr>
              <td colSpan={headers.length} className="text-center py-16 font-bold text-sm" style={{ color: "#9aa880" }}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ children }) {
  return (
    <tr className="border-b hover:bg-[#fffbe8] transition-colors" style={{ borderColor: "rgba(200,176,100,0.15)" }}>
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-sm font-semibold ${className}`} style={{ color: "#1a2e0a" }}>
      {children}
    </td>
  );
}

// ── SEARCH BAR ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border px-4 py-2.5"
      style={{ background: "rgba(255,250,232,0.8)", borderColor: "#c8b878", maxWidth: 340 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none text-sm font-semibold flex-1 w-full"
        style={{ color: "#1a2e0a" }} />
    </div>
  );
}

// ── PAGE HEADER ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
      <div>
        <h2 className="text-2xl font-black" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1a4a08" }}>
          {title}
        </h2>
        {subtitle && <p className="text-xs font-bold mt-0.5" style={{ color: "#7a9060" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}