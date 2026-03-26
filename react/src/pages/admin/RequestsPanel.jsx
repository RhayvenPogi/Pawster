// ── REQUESTS PANEL (Adoptions & Rehome) ───────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { phpApi, useToast, Modal, Field, Textarea, Badge, BtnCancel, BtnConfirm, PageHeader } from "../../shared";

function RequestCard({ r, type, onApprove, onReject }) {
  const status = r.status || "Pending";
  const name = r.name || r.owner_name || "Applicant";
  const initials = name.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";

  const statusConfig = {
    Pending:   { bg: "bg-amber-50",  border: "border-amber-200",  dot: "#f59e0b", pill: "bg-amber-100 text-amber-700"  },
    Approved:  { bg: "bg-green-50",  border: "border-green-200",  dot: "#22c55e", pill: "bg-green-100 text-green-700"  },
    Rejected:  { bg: "bg-red-50",    border: "border-red-200",    dot: "#ef4444", pill: "bg-red-100 text-red-700"      },
    Submitted: { bg: "bg-blue-50",   border: "border-blue-200",   dot: "#3b82f6", pill: "bg-blue-100 text-blue-700"   },
  };
  const cfg = statusConfig[status] || statusConfig.Pending;
  const avatarBg = type === "adoptions" ? "#1c4f09" : "#b45a22";

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col ${cfg.bg} ${cfg.border}`}>
      <div className="h-1 w-full" style={{ background: cfg.dot }} />
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: avatarBg }}>
              {initials}
            </div>
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

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Pet / Animal", r.pet_name || r.animal_name || "—"],
            ["Email",        r.email || r.contact || "—"],
            ["Phone",        r.phone || r.contact_no || "—"],
            ["Address",      r.address || r.city || "—"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#9aaa80" }}>{lbl}</div>
              <div className="text-xs font-semibold truncate" style={{ color: "#1a2e0a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Reason */}
        {(r.reason || r.description) && (
          <div className="rounded-xl p-3" style={{ background: "rgba(255,248,218,0.7)", border: "1px solid rgba(180,140,60,0.2)" }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9aaa80" }}>
              {type === "adoptions" ? "Reason for adoption" : "Reason for rehoming"}
            </div>
            <div className="text-xs font-semibold line-clamp-2" style={{ color: "#3a5020" }}>
              {r.reason || r.description}
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

export default function RequestsPanel({ type, show }) {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filter,  setFilter]    = useState("all");
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const { show: toast } = useToast();

  const load = useCallback(async (status = "all") => {
    setLoading(true);
    try {
      const r = await phpApi("get_requests", { type, status: status === "all" ? "" : status });
      if (r.success) setRecords(r.data || []);
    } catch {}
    setLoading(false);
  }, [type]);

  useEffect(() => { if (show) load(filter); }, [show, filter, load]);

  const approve = async (id) => {
    await phpApi("update_request", { type, id, status: "Approved" });
    toast("Request approved", "success");
    load(filter);
  };

  const doReject = async () => {
    if (!rejectNote.trim()) { toast("Please provide a reason", "error"); return; }
    await phpApi("update_request", { type, id: rejectId, status: "Rejected", reason: rejectNote });
    toast("Request rejected", "info");
    setRejectId(null); setRejectNote(""); load(filter);
  };

  const label = type === "adoptions" ? "Adoption Requests" : "Rehome Requests";
  const tabs  = [
    { key: "all",      label: "All",      count: records.length },
    { key: "Pending",  label: "Pending",  count: records.filter(r => r.status === "Pending").length  },
    { key: "Approved", label: "Approved", count: records.filter(r => r.status === "Approved").length },
    { key: "Rejected", label: "Rejected", count: records.filter(r => r.status === "Rejected").length },
  ];

  // Count pending across all for badge
  const [allPending, setAllPending] = useState(0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={label}
        subtitle="Review and process applications"
        action={
          <div className="flex gap-2 flex-wrap">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                  filter === t.key
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
                }`}>
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === t.key ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-sm font-bold" style={{ color: "#9aaa80" }}>No requests found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((r, i) => (
            <RequestCard key={r.id || i} r={r} type={type} onApprove={approve} onReject={id => { setRejectId(id); setRejectNote(""); }} />
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Rejection Reason"
        icon="✕"
        footer={
          <>
            <BtnCancel onClick={() => setRejectId(null)} />
            <BtnConfirm onClick={doReject} red>Confirm Rejection</BtnConfirm>
          </>
        }>
        <p className="text-sm font-semibold" style={{ color: "#7a9060" }}>
          Please provide a reason for rejecting this request. This will be visible to the applicant.
        </p>
        <Field label="Reason *">
          <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Enter rejection reason…" />
        </Field>
      </Modal>
    </div>
  );
}   