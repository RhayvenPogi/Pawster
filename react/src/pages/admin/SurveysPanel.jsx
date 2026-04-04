/**
 * SurveysPanel.jsx
 * Admin panel — reads from Django /api/surveys/admin/
 * Filters: All | 30-sec | 60-sec | ⚠ Health flags
 */
import { useState, useEffect } from "react";

const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8082";

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

// ── Expanded survey detail modal ──────────────────────────────────────────────
function SurveyDetailModal({ s, open, onClose }) {
  if (!open || !s) return null;
  const name    = s.adopter_name || "Adopter";
  const rating  = parseInt(s.rating || 0);
  const isHealth = s.health_flag || s.showing_illness;

  const surveyTypeLabel = s.survey_type === "7_day" ? "7-Day Check-In" : "30-Day Check-In";

  const fields = [
    ["Adopter",          s.adopter_name],
    ["Animal",           s.animal_name],
    ["Survey Type",      surveyTypeLabel],
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
      <div style={{ width: "100%", maxWidth: 520, borderRadius: 20, background: "#fffce8", border: `1px solid ${isHealth ? "rgba(192,48,48,0.4)" : "rgba(180,140,60,0.28)"}`, boxShadow: "0 24px 64px rgba(40,20,5,0.45)", display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", background: isHealth ? "rgba(192,48,48,0.05)" : "linear-gradient(135deg,rgba(28,79,9,0.07),rgba(90,170,48,0.04))", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: isHealth ? "#c03030" : "#1a4a08" }}>
              {isHealth ? "⚠ Health Flag — " : ""}Survey Details
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>{name}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Star rating display */}
          <div style={{ display: "flex", gap: "0.25rem", padding: "0.625rem 0.875rem", borderRadius: 12, background: "rgba(224,120,32,0.06)", border: "1px solid rgba(224,120,32,0.2)" }}>
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

function SurveyCard({ s, onView }) {
  const name     = s.adopter_name || "Adopter";
  const initials = name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const rating   = parseInt(s.rating || 0);
  const isHealth = s.health_flag || s.showing_illness;

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all"
      style={{ background: "#fffce8", borderColor: isHealth ? "rgba(192,48,48,0.4)" : "#ddd0a8" }}>
      <div className="h-1 w-full" style={{ background: isHealth ? "#ef4444" : "#3b82f6" }} />
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

        {/* View button */}
        <button onClick={() => onView(s)}
          className="mt-auto w-full py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-600 hover:text-white hover:border-green-600"
          style={{ background: "rgba(28,79,9,0.07)", borderColor: "rgba(90,170,48,0.3)", color: "#1c4f09" }}>
          <i className="fas fa-eye" style={{ marginRight: "0.35rem" }} /> View Full Survey
        </button>
      </div>
    </div>
  );
}

export default function SurveysPanel({ show }) {
  const [surveys,  setSurveys]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState("all");
  const [viewTarget, setViewTarget] = useState(null);

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
      if (data.success) setSurveys(data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { if (show) load(filter); }, [show, filter]);

  const avgRating = surveys.length
    ? (surveys.reduce((s, x) => s + parseInt(x.rating || 0), 0) / surveys.length).toFixed(1)
    : "—";

  const healthCount = surveys.filter(s => s.health_flag || s.showing_illness).length;

  // Fix the tabs
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
          <div className="font-black text-lg" style={{ color: "#1a4a08", fontFamily: "'Playfair Display',serif" }}>Follow-Up Surveys</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>Post-adoption feedback — 30-sec & 60-sec check-ins</div>
        </div>

        {/* Summary stats */}
        <div className="flex gap-2">
          {[
            { label: "Avg Rating",   value: avgRating },
            { label: "Total",        value: surveys.length },
            { label: "Health flags", value: healthCount, warn: healthCount > 0 },
          ].map(({ label, value, warn }) => (
            <div key={label} className="rounded-xl border px-3 py-2 text-center" style={{ background: "#fffce8", borderColor: warn ? "rgba(192,48,48,0.3)" : "#ddd0a8" }}>
              <div className="text-xl font-black" style={{ color: warn ? "#c03030" : "#1a4a08" }}>{value}</div>
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
      ) : surveys.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-sm font-bold" style={{ color: "#9aaa80" }}>No surveys found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {surveys.map((s, i) => <SurveyCard key={s.id || i} s={s} onView={setViewTarget} />)}
        </div>
      )}

      <SurveyDetailModal
        s={viewTarget}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </div>
  );
}