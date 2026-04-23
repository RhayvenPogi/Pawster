/**
 * SurveyPanel.jsx
 * Admin panel — reads from Django /api/surveys/admin/
 * Renamed: "Survey" → "Feedback Report" throughout
 * Added: pet photo gallery in detail modal + photo thumbnails on cards
 * Fixed: defensive photo normalization — handles url, thumbnail_url, image, file_url shapes
 */
import { useState, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";

function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function djFetch(path) {
  const token = getToken();
  return fetch(`${DJANGO}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

/**
 * Normalize a photo object from the backend into a shape the UI can use.
 * Django may return photos in many shapes depending on serializer:
 *   { url, thumbnail_url }         — ideal
 *   { image }                      — ImageField direct URL
 *   { file_url }                   — custom upload handler
 *   { photo }                      — another common field name
 *   "https://..."                  — raw string (some serializers)
 */
function normalizePhoto(p) {
  if (!p) return null;
  if (typeof p === "string") return { url: p };
  const url =
    p.url ||
    p.thumbnail_url ||
    p.image ||
    p.file_url ||
    p.photo ||
    p.src ||
    null;
  if (!url) return null;
  return { url, thumbnail_url: p.thumbnail_url || url };
}

function normalizePhotos(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePhoto).filter(Boolean);
}

// ── Photo lightbox ─────────────────────────────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex || 0);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [photos.length, onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 700, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
        {/* Main image */}
        <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
          <img src={photos[idx].url} alt={`Pet photo ${idx + 1}`}
            style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", display: "block" }} />
          <div style={{ position: "absolute", top: 10, right: 10, padding: "0.25rem 0.625rem", borderRadius: 50, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.72rem", fontWeight: 800 }}>
            {idx + 1} / {photos.length}
          </div>
        </div>

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button onClick={() => setIdx(i => Math.max(i - 1, 0))}
              disabled={idx === 0}
              style={{ position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: idx === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: idx === 0 ? "default" : "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fas fa-chevron-left" />
            </button>
            <button onClick={() => setIdx(i => Math.min(i + 1, photos.length - 1))}
              disabled={idx === photos.length - 1}
              style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: idx === photos.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)", border: "none", color: "#fff", cursor: idx === photos.length - 1 ? "default" : "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fas fa-chevron-right" />
            </button>
          </>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
            {photos.map((p, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: `2px solid ${i === idx ? "#5aaa30" : "rgba(255,255,255,0.2)"}`, background: "none", cursor: "pointer", padding: 0, transition: "border-color 0.15s" }}>
                <img src={p.thumbnail_url || p.url} alt={`thumb-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close */}
      <button onClick={onClose}
        style={{ position: "fixed", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="fas fa-times" />
      </button>
    </div>
  );
}

// ── Photo gallery strip ────────────────────────────────────────────────────────
function PhotoGallery({ photos }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ fontSize: "0.67rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#5a7a40" }}>
          <i className="fas fa-camera" style={{ marginRight: "0.3rem" }} />Pet Photos ({photos.length})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(photos.length, 5)}, 1fr)`, gap: "0.4rem" }}>
          {photos.map((p, i) => (
            <button key={i} type="button" onClick={() => setLightboxIdx(i)}
              style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(90,170,48,0.3)", background: "rgba(28,79,9,0.05)", cursor: "pointer", padding: 0, display: "block" }}>
              <img
                src={p.thumbnail_url || p.url}
                alt={`Pet photo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.28)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}>
                <i className="fas fa-expand" style={{ color: "#fff", opacity: 0, fontSize: "0.9rem", transition: "opacity 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"} />
              </div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9aaa80", margin: 0 }}>Click a photo to view full size</p>
      </div>

      {lightboxIdx !== null && (
        <PhotoLightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function ReportDetailModal({ s, open, onClose }) {
  if (!open || !s) return null;
  const name     = s.adopter_name || "Adopter";
  const rating   = parseInt(s.rating || 0);
  const isHealth = s.health_flag || s.showing_illness;
  // ✅ Normalize photos defensively — handles any backend shape
  const photos   = normalizePhotos(s.photos);

  const reportTypeLabel = s.survey_type === "7_day" ? "7-Day Feedback Report" : "30-Day Feedback Report";

  const fields = [
    ["Adopter",          s.adopter_name],
    ["Animal",           s.animal_name],
    ["Report Type",      reportTypeLabel],
    ["Submitted",        s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"],
    ["Adjustment",       s.adjustment],
    ["Showing Illness",  s.showing_illness ? "⚠ YES" : "No"],
    ["Vet Visited",      s.vet_visited ? "Yes" : "No"],
    ["Satisfied",        s.satisfied ? "Yes" : "No"],
    ["Needs Support",    s.needs_support ? "Yes" : "No"],
    ["Rating",           `${rating}/5 stars`],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 560, borderRadius: 20, background: "#fffce8", border: `1px solid ${isHealth ? "rgba(192,48,48,0.4)" : "rgba(180,140,60,0.28)"}`, boxShadow: "0 24px 64px rgba(40,20,5,0.45)", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", background: isHealth ? "rgba(192,48,48,0.05)" : "linear-gradient(135deg,rgba(28,79,9,0.07),rgba(90,170,48,0.04))", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: isHealth ? "#c03030" : "#1a4a08" }}>
              {isHealth ? "⚠ Health Flag — " : ""}Feedback Report Details
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>{name} · {reportTypeLabel}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          {/* Star rating display */}
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", padding: "0.625rem 0.875rem", borderRadius: 12, background: "rgba(224,120,32,0.06)", border: "1px solid rgba(224,120,32,0.2)" }}>
            {[1,2,3,4,5].map(k => (
              <span key={k} style={{ fontSize: "1.4rem", color: k <= rating ? "#e07820" : "rgba(180,140,60,0.25)" }}>★</span>
            ))}
            <span style={{ marginLeft: "0.5rem", fontWeight: 800, fontSize: "0.85rem", color: "#b05010", alignSelf: "center" }}>{rating}/5</span>
          </div>

          {/* Fields grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {fields.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([label, value]) => (
              <div key={label} style={{ padding: "0.5rem 0.75rem", borderRadius: 10, background: "rgba(255,248,218,0.6)", border: "1px solid rgba(180,140,60,0.18)" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: "0.83rem", fontWeight: 700, color: String(value).includes("⚠") ? "#c03030" : "#1a2e0a" }}>{String(value)}</div>
              </div>
            ))}
          </div>

          {/* Pet Photos */}
          {photos.length > 0 ? (
            <div style={{ padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(28,79,9,0.04)", border: "1px solid rgba(90,170,48,0.2)" }}>
              <PhotoGallery photos={photos} />
            </div>
          ) : (
            <div style={{ padding: "0.625rem 0.875rem", borderRadius: 10, background: "rgba(180,140,60,0.06)", border: "1px dashed rgba(180,140,60,0.28)", textAlign: "center" }}>
              <i className="fas fa-camera" style={{ color: "#b4903a", opacity: 0.4, fontSize: "1.2rem", display: "block", marginBottom: "0.25rem" }} />
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9aaa80" }}>No pet photos submitted with this report</div>
            </div>
          )}

          {/* Notes */}
          {(s.behavioral_notes || s.additional_notes) && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(28,79,9,0.05)", border: "1px solid rgba(90,170,48,0.2)" }}>
              <div style={{ fontSize: "0.67rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#5a7a40", marginBottom: "0.4rem" }}>Notes</div>
              {s.behavioral_notes && <p style={{ fontSize: "0.83rem", fontWeight: 700, color: "#3a5020", margin: "0 0 0.4rem" }}><strong>Behavioral:</strong> {s.behavioral_notes}</p>}
              {s.additional_notes && <p style={{ fontSize: "0.83rem", fontWeight: 700, color: "#3a5020", margin: 0 }}><strong>Additional:</strong> {s.additional_notes}</p>}
            </div>
          )}

          {/* Health alert */}
          {isHealth && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(192,48,48,0.07)", border: "1px solid rgba(192,48,48,0.25)", fontSize: "0.82rem", fontWeight: 700, color: "#c03030" }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: "0.4rem" }} />
              This adopter has reported health concerns. Consider reaching out to follow up directly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report card ────────────────────────────────────────────────────────────────
function ReportCard({ s, onView }) {
  const name     = s.adopter_name || "Adopter";
  const initials = name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const rating   = parseInt(s.rating || 0);
  const isHealth = s.health_flag || s.showing_illness;
  // ✅ Normalize photos defensively
  const photos   = normalizePhotos(s.photos);

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all"
      style={{ background: "#fffce8", borderColor: isHealth ? "rgba(192,48,48,0.4)" : "#ddd0a8" }}>
      <div className="h-1 w-full" style={{ background: isHealth ? "#ef4444" : "#3b82f6" }} />

      {/* Photo strip — shown when photos exist */}
      {photos.length > 0 && (
        <div style={{ position: "relative", height: 80, background: "rgba(28,79,9,0.04)", borderBottom: "1px solid rgba(180,140,60,0.15)", overflow: "hidden", display: "flex" }}>
          {photos.slice(0, 4).map((p, i) => (
            <div key={i} style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <img
                src={p.thumbnail_url || p.url}
                alt={`pet-${i}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          ))}
          {photos.length > 4 && (
            <div style={{ position: "absolute", bottom: 6, right: 6, padding: "0.15rem 0.45rem", borderRadius: 50, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.62rem", fontWeight: 800 }}>
              +{photos.length - 4} more
            </div>
          )}
          <div style={{ position: "absolute", top: 6, left: 6, padding: "0.15rem 0.45rem", borderRadius: 50, background: "rgba(28,79,9,0.75)", color: "#fff", fontSize: "0.6rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <i className="fas fa-camera" style={{ fontSize: "0.55rem" }} /> {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: isHealth ? "#c03030" : "#1a8a6a" }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm truncate" style={{ color: "#1a4a08" }}>{name}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>
              {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              {s.survey_type === "7_day" ? "7-Day" : "30-Day"}
            </span>
            {isHealth && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                ⚠ Health flag
              </span>
            )}
          </div>
        </div>

        <div className="h-px" style={{ background: "rgba(180,140,60,0.15)" }} />

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Animal",        s.animal_name    || "—"],
            ["Adjustment",    s.adjustment     || "—"],
            ["Vet visited",   s.vet_visited    ? "Yes" : "No"],
            ["Needs support", s.needs_support  ? "Yes" : "No"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#9aaa80" }}>{lbl}</div>
              <div className="text-xs font-semibold" style={{ color: "#1a2e0a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Star rating */}
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9aaa80" }}>Rating</div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(k => (
              <span key={k} style={{ fontSize: "1rem", color: k <= rating ? "#e07820" : "rgba(180,140,60,0.25)" }}>★</span>
            ))}
          </div>
        </div>

        {/* Notes preview */}
        {(s.additional_notes || s.behavioral_notes) && (
          <div className="rounded-xl p-3 text-xs font-semibold line-clamp-2"
            style={{ background: "rgba(255,248,218,0.7)", color: "#3a5020" }}>
            "{s.additional_notes || s.behavioral_notes}"
          </div>
        )}

        {/* No photos badge */}
        {photos.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.6rem", borderRadius: 6, background: "rgba(180,140,60,0.08)", border: "1px dashed rgba(180,140,60,0.25)", width: "fit-content" }}>
            <i className="fas fa-camera" style={{ fontSize: "0.6rem", color: "#b4903a", opacity: 0.5 }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#9aaa80" }}>No photos</span>
          </div>
        )}

        {/* View button */}
        <button onClick={() => onView(s)}
          className="mt-auto w-full py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-600 hover:text-white hover:border-green-600"
          style={{ background: "rgba(28,79,9,0.07)", borderColor: "rgba(90,170,48,0.3)", color: "#1c4f09" }}>
          <i className="fas fa-eye" style={{ marginRight: "0.35rem" }} /> View Full Report
        </button>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function SurveyPanel({ show }) {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [viewTarget, setViewTarget] = useState(null);
  usePageTitle("Feedback Reports");

  const load = async (f) => {
    setLoading(true);
    try {
      let url = "/api/surveys/admin/";
      const params = new URLSearchParams();
      if (f === "7_day" || f === "30_day") params.set("survey_type", f);
      if (f === "health") params.set("health_flag", "true");
      if ([...params].length) url += "?" + params.toString();

      const res  = await djFetch(url);
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { if (show) load(filter); }, [show, filter]);

  const avgRating    = reports.length
    ? (reports.reduce((s, x) => s + parseInt(x.rating || 0), 0) / reports.length).toFixed(1)
    : "—";
  const healthCount  = reports.filter(s => s.health_flag || s.showing_illness).length;
  const withPhotos   = reports.filter(s => normalizePhotos(s.photos).length > 0).length;

  const tabs = [
    { key: "all",    label: "All" },
    { key: "7_day",  label: "7-Day" },
    { key: "30_day", label: "30-Day" },
    { key: "health", label: "⚠ Health flags", warn: true },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-black text-lg" style={{ color: "#1a4a08", fontFamily: "'Playfair Display',serif" }}>Feedback Reports</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>Post-adoption feedback — 7-day & 30-day check-ins with pet photos</div>
        </div>

        {/* Summary stats */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Avg Rating",   value: avgRating,   warn: false },
            { label: "Total",        value: reports.length, warn: false },
            { label: "With Photos",  value: withPhotos,  warn: false, icon: "fa-camera" },
            { label: "Health flags", value: healthCount, warn: healthCount > 0 },
          ].map(({ label, value, warn, icon }) => (
            <div key={label} className="rounded-xl border px-3 py-2 text-center" style={{ background: "#fffce8", borderColor: warn ? "rgba(192,48,48,0.3)" : "#ddd0a8" }}>
              <div className="text-xl font-black" style={{ color: warn ? "#c03030" : "#1a4a08" }}>
                {icon && <i className={`fas ${icon}`} style={{ fontSize: "0.9rem", marginRight: "0.2rem", color: "#5a8a40" }} />}
                {value}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9aaa80" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setFilter(t.key); load(t.key); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              filter === t.key
                ? t.warn ? "bg-red-600 border-red-600 text-white" : "bg-green-600 border-green-600 text-white"
                : t.warn ? "border-red-200 text-red-600 hover:bg-red-50" : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-sm font-bold" style={{ color: "#9aaa80" }}>No feedback reports found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((s, i) => <ReportCard key={s.id || i} s={s} onView={setViewTarget} />)}
        </div>
      )}

      <ReportDetailModal
        s={viewTarget}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </div>
  );
}