// ── SURVEYS PANEL ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { phpApi, PageHeader } from "../../shared";

function SurveyCard({ s }) {
  const name = s.adopter_name || s.user_name || "Adopter";
  const initials = name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const rating = parseInt(s.rating || s.happiness_rating || 0);
  const feedback = s.notes || s.comments || s.feedback || "";

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all"
      style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
      <div className="h-1 bg-blue-500 w-full" />
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: "#1a8a6a" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm truncate" style={{ color: "#1a4a08" }}>{name}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>
              {s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>
          <span className="text-[11px] font-black px-3 py-1 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
            Submitted
          </span>
        </div>

        <div className="h-px" style={{ background: "rgba(180,140,60,0.15)" }} />

        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9aaa80" }}>Animal</div>
            <div className="text-xs font-bold" style={{ color: "#1a2e0a" }}>{s.animal_name || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#9aaa80" }}>Rating</div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(k => (
                <span key={k} className={`text-base ${k <= rating ? "text-amber-500" : "text-gray-200"}`}>★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="rounded-xl p-3 text-xs font-semibold line-clamp-3"
            style={{ background: "rgba(255,248,218,0.7)", color: "#3a5020" }}>
            "{feedback}"
          </div>
        )}
      </div>
    </div>
  );
}

export default function SurveysPanel({ show }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    phpApi("get_surveys")
      .then(r => { if (r.success) setSurveys(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [show]);

  const avgRating = surveys.length
    ? (surveys.reduce((s, x) => s + parseInt(x.rating || x.happiness_rating || 0), 0) / surveys.length).toFixed(1)
    : "—";

  const filtered = filter === "all" ? surveys : surveys.filter(s => {
    const r = parseInt(s.rating || s.happiness_rating || 0);
    if (filter === "high") return r >= 4;
    if (filter === "mid")  return r === 3;
    if (filter === "low")  return r <= 2;
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Follow-up Surveys"
        subtitle="Post-adoption feedback from adopters"
        action={
          <div className="flex items-center gap-3">
            <div className="rounded-xl border px-4 py-2.5 text-center" style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
              <div className="text-2xl font-black" style={{ color: "#1a4a08" }}>{avgRating}</div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9aaa80" }}>Avg Rating</div>
            </div>
            <div className="rounded-xl border px-4 py-2.5 text-center" style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
              <div className="text-2xl font-black" style={{ color: "#1a4a08" }}>{surveys.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9aaa80" }}>Total</div>
            </div>
          </div>
        }
      />

      <div className="flex gap-2">
        {[
          { key: "all",  label: "All" },
          { key: "high", label: "⭐ 4–5" },
          { key: "mid",  label: "⭐ 3" },
          { key: "low",  label: "⭐ 1–2" },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              filter === t.key
                ? "bg-green-600 border-green-600 text-white"
                : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-sm font-bold" style={{ color: "#9aaa80" }}>No surveys yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s, i) => <SurveyCard key={i} s={s} />)}
        </div>
      )}
    </div>
  );
}