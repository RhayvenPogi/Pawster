/**
 * RequestsPanel.jsx
 * Admin panel component — calls Django instead of PHP.
 * Handles both adoption and rehoming requests.
 * Props: type = "adoptions" | "rehoming"  |  show = boolean
 */
import { useState, useEffect, useCallback } from "react";

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

function djFetch(path, opts = {}) {
  const token = getToken();
  return fetch(`${DJANGO}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Pending:  { bg: "bg-amber-50",  border: "border-amber-200",  dot: "#f59e0b", pill: "bg-amber-100 text-amber-700"  },
  Approved: { bg: "bg-green-50",  border: "border-green-200",  dot: "#22c55e", pill: "bg-green-100 text-green-700"  },
  Rejected: { bg: "bg-red-50",    border: "border-red-200",    dot: "#ef4444", pill: "bg-red-100 text-red-700"      },
};

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 18, background: "#fffce8", border: "1px solid rgba(180,140,60,0.28)", boxShadow: "0 16px 48px rgba(40,20,5,0.35)", overflow: "hidden" }}>
        <div style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.18)", fontWeight: 900, fontSize: "0.95rem", color: "#1a4a08", fontFamily: "'Nunito',sans-serif" }}>
          Rejection Reason
        </div>
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6a7a50", margin: 0 }}>
            Please provide a reason. This will be sent to the applicant via email and notification.
          </p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Enter rejection reason…"
            style={{ padding: "0.625rem 0.875rem", borderRadius: 10, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,250,232,0.7)", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#1a2e0a", outline: "none", resize: "vertical", width: "100%" }} />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={onClose}
              style={{ padding: "0.6rem 1.1rem", borderRadius: 10, fontWeight: 800, fontSize: "0.84rem", background: "transparent", border: "1px solid rgba(180,140,60,0.28)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              Cancel
            </button>
            <button onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); setReason(""); } }}
              disabled={!reason.trim()}
              style={{ padding: "0.6rem 1.25rem", borderRadius: 10, fontWeight: 900, fontSize: "0.84rem", background: reason.trim() ? "#c03030" : "#e08080", border: "none", color: "#fff", cursor: reason.trim() ? "pointer" : "not-allowed", fontFamily: "'Nunito',sans-serif" }}>
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Expanded detail modal ─────────────────────────────────────────────────────
function DetailModal({ r, type, open, onClose, onApprove, onReject }) {
  if (!open || !r) return null;
  const status   = r.status || "Pending";
  const cfg      = STATUS_CFG[status] || STATUS_CFG.Pending;

  const adoptionFields = [
    ["Full Name",          r.name],
    ["Email",              r.email],
    ["Phone",              r.phone],
    ["Address",            r.address],
    ["Animal",             r.animal_name],
    ["Housing Type",       r.housing],
    ["Owns / Rents",       r.owns_home ? "Owns" : "Rents"],
    ["Pet Permission",     r.pet_permission ? "Yes" : "No"],
    ["Pet Space",          r.pet_space],
    ["Household Size",     r.household_size],
    ["Has Children",       r.has_children ? "Yes" : "No"],
    ["Children Ages",      r.children_ages],
    ["Other Pets",         r.has_other_pets ? "Yes" : "No"],
    ["Other Pets Detail",  r.other_pets_detail],
    ["Pets Vaccinated",    r.other_pets_vaccinated ? "Yes" : "No"],
    ["Experience",         r.exp],
    ["Hours Alone",        r.alone_hours],
    ["Backup Care",        r.backup_care],
    ["Monthly Budget",     r.budget],
    ["Vet Plan",           r.vet_plan],
    ["Behavior Response",  r.behavior_response],
    ["Open to Guidance",   r.open_to_guidance ? "Yes" : "No"],
    ["Previous Pet",       r.previous_pet ? "Yes" : "No"],
    ["Previous Pet Info",  r.previous_pet_details],
    ["Primary Caregiver",  r.primary_caregiver],
    ["Reason to Adopt",    r.reason],
  ];

  const rehomingFields = [
    ["Pet Name",           r.pet_name],
    ["Species",            r.species],
    ["Breed",              r.breed],
    ["Age",                r.age],
    ["Gender",             r.gender],
    ["Duration Owned",     r.duration_owned],
    ["Vaccinated",         r.is_vaccinated ? "Yes" : "No"],
    ["Neutered",           r.is_neutered ? "Yes" : "No"],
    ["Medical Notes",      r.medical_notes],
    ["Behavior",           r.behavior],
    ["Has Aggression",     r.has_aggression ? "Yes" : "No"],
    ["House Trained",      r.is_house_trained ? "Yes" : "No"],
    ["Leash Trained",      r.is_leash_trained ? "Yes" : "No"],
    ["Good w/ Children",   r.good_with_children ? "Yes" : "No"],
    ["Good w/ Pets",       r.good_with_pets ? "Yes" : "No"],
    ["Ideal Home",         r.ideal_home_desc],
    ["Contact",            r.contact],
    ["Reason",             r.reason],
    ["Details",            r.details],
    ["Tried Alternatives", r.tried_alternatives],
    ["Can Provide Food",   r.can_provide_food ? "Yes" : "No"],
    ["Can Provide Carrier",r.can_provide_carrier ? "Yes" : "No"],
    ["Can Provide Records",r.can_provide_records ? "Yes" : "No"],
  ];

  const fields = type === "adoptions" ? adoptionFields : rehomingFields;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 600, borderRadius: 20, background: "#fffce8", border: "1px solid rgba(180,140,60,0.28)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", display: "flex", flexDirection: "column", maxHeight: "88vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(28,79,9,0.07),rgba(90,170,48,0.04))", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: "#1a4a08" }}>
              {type === "adoptions" ? "Adoption" : "Rehoming"} Request — Full Details
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>
              Submitted {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, padding: "0.25rem 0.75rem", borderRadius: 50, background: cfg.dot + "22", color: cfg.dot, border: `1px solid ${cfg.dot}44` }}>{status}</span>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            {fields.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([label, value]) => (
              <div key={label} style={{ padding: "0.5rem 0.75rem", borderRadius: 10, background: "rgba(255,248,218,0.6)", border: "1px solid rgba(180,140,60,0.18)" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: "0.83rem", fontWeight: 700, color: "#1a2e0a", wordBreak: "break-word" }}>{String(value)}</div>
              </div>
            ))}
          </div>

          {r.reject_note && (
            <div style={{ marginTop: "0.875rem", padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(192,48,48,0.06)", border: "1px solid rgba(192,48,48,0.2)", fontSize: "0.82rem", fontWeight: 700, color: "#c03030" }}>
              <strong>Rejection note:</strong> {r.reject_note}
            </div>
          )}
        </div>

        {/* Actions */}
        {status === "Pending" && (
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(180,140,60,0.18)", display: "flex", gap: "0.625rem", flexShrink: 0, background: "rgba(255,252,235,0.95)" }}>
            <button onClick={() => { onApprove(r.id); onClose(); }}
              style={{ flex: 1, padding: "0.7rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#1c7a09", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <i className="fas fa-check" /> Approve
            </button>
            <button onClick={() => { onReject(r.id); onClose(); }}
              style={{ flex: 1, padding: "0.7rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#c03030", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <i className="fas fa-times" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ r, type, onApprove, onReject, onView }) {
  const status = r.status || "Pending";
  const name   = r.name || r.contact || "Applicant";
  const initials = name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const cfg    = STATUS_CFG[status] || STATUS_CFG.Pending;
  const avatarBg = type === "adoptions" ? "#1c4f09" : "#b45a22";

  const details = type === "adoptions"
    ? [
        ["Animal",   r.animal_name || "—"],
        ["Email",    r.email || "—"],
        ["Phone",    r.phone || "—"],
        ["Address",  r.address || "—"],
        ["Housing",  r.housing || "—"],
        ["Budget",   r.budget || "—"],
      ]
    : [
        ["Pet",        r.pet_name || "—"],
        ["Species",    r.species || "—"],
        ["Reason",     r.reason || "—"],
        ["Contact",    r.contact || "—"],
        ["Vaccinated", r.is_vaccinated ? "Yes" : "No"],
        ["Neutered",   r.is_neutered ? "Yes" : "No"],
      ];

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col ${cfg.bg} ${cfg.border}`}>
      <div className="h-1 w-full" style={{ background: cfg.dot }} />
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: avatarBg }}>{initials}</div>
            <div>
              <div className="font-black text-sm" style={{ color: "#1a4a08" }}>{name}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-black px-3 py-1 rounded-full flex-shrink-0 ${cfg.pill}`}>{status}</span>
        </div>

        <div className="h-px" style={{ background: "rgba(180,140,60,0.15)" }} />

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-2">
          {details.map(([lbl, val]) => (
            <div key={lbl}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#9aaa80" }}>{lbl}</div>
              <div className="text-xs font-semibold truncate" style={{ color: "#1a2e0a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Reason / details */}
        {(r.reason || r.details) && (
          <div className="rounded-xl p-3" style={{ background: "rgba(255,248,218,0.7)", border: "1px solid rgba(180,140,60,0.2)" }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9aaa80" }}>
              {type === "adoptions" ? "Reason for adoption" : "Reason for rehoming"}
            </div>
            <div className="text-xs font-semibold line-clamp-2" style={{ color: "#3a5020" }}>
              {r.reason || r.details}
            </div>
          </div>
        )}

        {/* Reject note */}
        {r.reject_note && status === "Rejected" && (
          <div className="rounded-xl p-3 text-xs font-semibold"
            style={{ background: "rgba(192,48,48,0.06)", border: "1px solid rgba(192,48,48,0.2)", color: "#c03030" }}>
            <strong>Rejected:</strong> {r.reject_note}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          {/* View full details button always visible */}
          <button onClick={() => onView(r)}
            className="px-3 py-2 rounded-xl text-xs font-black border transition-all hover:bg-amber-50"
            style={{ background: "rgba(255,248,218,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#7a6030" }}>
            <i className="fas fa-eye" /> View
          </button>

          {status === "Pending" ? (
            <>
              <button onClick={() => onApprove(r.id)}
                className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-600 hover:text-white hover:border-green-600"
                style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#15803d" }}>
                ✓ Approve
              </button>
              <button onClick={() => onReject(r.id)}
                className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-red-600 hover:text-white hover:border-red-600"
                style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.28)", color: "#dc2626" }}>
                ✕ Reject
              </button>
            </>
          ) : (
            <div className="flex-1 py-2 rounded-xl text-xs font-black border text-center"
              style={{ borderColor: "#ddd0a8", color: "#9aaa80" }}>
              {status === "Approved" ? "✓ Approved" : "✕ Rejected"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function RequestsPanel({ type, show }) {
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [rejectId,   setRejectId]   = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [toast,      setToast]      = useState(null);

  const apiBase = type === "adoptions"
    ? "/api/approvals/adoptions"
    : "/api/approvals/rehoming";

  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (status = "all") => {
    setLoading(true);
    try {
      const url = `${apiBase}/admin/${status !== "all" ? `?status=${status}` : ""}`;
      const res  = await djFetch(url);
      if (res.status === 401) { showToast("Unauthorized — please log in as admin", "err"); setLoading(false); return; }
      const data = await res.json();
      if (data.success) setRecords(data.data || []);
      else showToast(data.message || "Failed to load", "err");
    } catch { showToast("Failed to load requests", "err"); }
    setLoading(false);
  }, [type]);

  useEffect(() => { if (show) load(filter); }, [show, filter, load]);

  const approve = async (id) => {
    try {
      const res  = await djFetch(`${apiBase}/${id}/approve/`, { method: "POST" });
      const data = await res.json();
      if (data.success) { showToast("Request approved ✓"); load(filter); }
      else showToast(data.message || "Error approving", "err");
    } catch { showToast("Network error", "err"); }
  };

  const doReject = async (reason) => {
    try {
      const res  = await djFetch(`${apiBase}/${rejectId}/reject/`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) { showToast("Request rejected"); load(filter); }
      else showToast(data.message || "Error rejecting", "err");
    } catch { showToast("Network error", "err"); }
    setRejectId(null);
  };

  const label = type === "adoptions" ? "Adoption Requests" : "Rehome Requests";
  const tabs  = ["all", "Pending", "Approved", "Rejected"];

  const counts = tabs.reduce((acc, t) => ({
    ...acc,
    [t]: t === "all" ? records.length : records.filter(r => r.status === t).length,
  }), {});

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-black text-lg" style={{ color: "#1a4a08", fontFamily: "'Playfair Display',serif" }}>{label}</div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>
            Review and process applications — {records.filter(r => r.status === "Pending").length} pending
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${filter === t ? "bg-green-600 border-green-600 text-white" : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"}`}>
              {t === "all" ? "All" : t}
              {counts[t] > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === t ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-sm font-bold" style={{ color: "#9aaa80" }}>No {filter === "all" ? "" : filter.toLowerCase() + " "}requests found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((r, i) => (
            <RequestCard key={r.id || i} r={r} type={type}
              onApprove={approve}
              onReject={id => setRejectId(id)}
              onView={setViewTarget} />
          ))}
        </div>
      )}

      {/* Modals */}
      <RejectModal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={doReject}
      />

      <DetailModal
        r={viewTarget}
        type={type}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        onApprove={approve}
        onReject={id => { setViewTarget(null); setRejectId(id); }}
      />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "0.7rem 1.25rem", borderRadius: 12, fontWeight: 800, fontSize: "0.84rem", background: toast.kind === "err" ? "#c03030" : "#1c4f09", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.22)", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <i className={`fas ${toast.kind === "err" ? "fa-times-circle" : "fa-check-circle"}`} /> {toast.msg}
        </div>
      )}
    </div>
  );
}