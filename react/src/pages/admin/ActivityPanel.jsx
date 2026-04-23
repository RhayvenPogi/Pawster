// pages/admin/ActivityPanel.jsx
// ── ACTIVITY LOG PANEL ────────────────────────────────────────────────────────
// Changes from original:
//   1. Added "Receipt" column to the table for appointment-type logs.
//   2. Imports downloadAppointmentPDF utility (jsPDF-based, no backend needed).
//   3. All existing logic and styles left untouched.
//
// Install once: npm install jspdf

import { useState, useEffect } from "react";
import { phpApi, Badge, Table, Tr, Td, PageHeader } from "../../shared";
import { downloadAppointmentPDF } from "../../utils/downloadAppointmentPDF";
import { usePageTitle } from "../../hooks/usePageTitle";

const ACTION_CONFIG = {
  Login:   { color: "green",  icon: "🔐" },
  Logout:  { color: "gray",   icon: "🚪" },
  Delete:  { color: "red",    icon: "🗑"  },
  Create:  { color: "blue",   icon: "✚"  },
  Update:  { color: "amber",  icon: "✏"  },
  Approve: { color: "green",  icon: "✓"  },
  Reject:  { color: "red",    icon: "✕"  },
};

export default function ActivityPanel({ show }) {
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [filter,      setFilter]      = useState("all");
  const [downloading, setDownloading] = useState(null); // tracks which log row is generating PDF

  usePageTitle('Activity Log');
  const load = () => {
    setLoading(true);
    phpApi("get_activity")
      .then(r => { if (r.success) setLogs(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (show) load(); }, [show]);

  const filtered      = filter === "all" ? logs : logs.filter(a => a.action === filter);
  const uniqueActions = [...new Set(logs.map(a => a.action).filter(Boolean))];

  // ── PDF download handler ────────────────────────────────────────────────────
  // Your PHP `get_activity` response rows likely include appointment data.
  // Map the fields from your actual DB columns here:
  const handleDownload = async (log) => {
    setDownloading(log.id);
    // Build appointment object from the activity log row.
    // Adjust field names to match what your phpApi("get_activity") actually returns.
    const appt = {
      id:            log.appointment_id  || log.id,
      petName:       log.pet_name        || "—",
      petType:       log.pet_type        || "—",
      ownerName:     log.user_name       || log.owner_name || "—",
      ownerEmail:    log.owner_email     || "—",
      ownerPhone:    log.owner_phone     || "—",
      service:       log.service         || log.details || "—",
      date:          log.appointment_date
                       ? new Date(log.appointment_date).toLocaleDateString("en-PH", { dateStyle: "long" })
                       : "—",
      time:          log.appointment_time || "—",
      vetName:       log.vet_name        || "—",
      status:        log.status          || "Completed",
      notes:         log.notes           || "",
      fee:           log.fee             || 0,
      paymentMethod: log.payment_method  || "Cash",
      completedAt:   log.created_at
                       ? new Date(log.created_at).toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })
                       : "—",
    };
    await new Promise(r => setTimeout(r, 200)); // let spinner render
    downloadAppointmentPDF(appt, "admin");
    setDownloading(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Activity Log"
        subtitle="Recent system activity and audit trail"
        action={
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black border transition-all hover:bg-green-50"
            style={{ borderColor: "#ddd0a8", color: "#3a5020" }}>
            ↻ Refresh
          </button>
        }
      />

      {/* ── Summary cards (unchanged) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { lbl: "Total Events", val: logs.length, color: "#1c4f09" },
          { lbl: "Logins",       val: logs.filter(a => a.action === "Login").length, color: "#2a7010" },
          { lbl: "Changes",      val: logs.filter(a => ["Create","Update","Delete"].includes(a.action)).length, color: "#c87820" },
          { lbl: "Today",        val: logs.filter(a => {
              const d = new Date(a.created_at || "");
              return d.toDateString() === new Date().toDateString();
            }).length, color: "#7a3dc0" },
        ].map(s => (
          <div key={s.lbl} className="rounded-xl border p-4"
            style={{ background: `${s.color}0d`, borderColor: `${s.color}33` }}>
            <div className="text-2xl font-black" style={{ color: "#1a4a08" }}>{s.val}</div>
            <div className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#9aaa80" }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Filter chips (unchanged) ──────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
            filter === "all"
              ? "bg-green-600 border-green-600 text-white"
              : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
          }`}>
          All
        </button>
        {uniqueActions.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              filter === a
                ? "bg-green-600 border-green-600 text-white"
                : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
            }`}>
            {ACTION_CONFIG[a]?.icon || ""} {a}
          </button>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <Table headers={["Time", "Action", "User", "Details", "Receipt"]} empty="No activity yet.">
          {filtered.map((a, i) => {
            const cfg = ACTION_CONFIG[a.action] || { color: "amber", icon: "•" };
            const isAppt = a.appointment_id || a.action === "Approve"; // show button only for appointment-related rows
            const isLoading = downloading === a.id;

            return (
              <Tr key={i}>
                {/* Time (unchanged) */}
                <Td className="text-xs whitespace-nowrap">
                  {a.created_at
                    ? new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </Td>

                {/* Action (unchanged) */}
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <Badge color={cfg.color}>{a.action}</Badge>
                  </div>
                </Td>

                {/* User (unchanged) */}
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                      style={{ background: "#1c4f09" }}>
                      {(a.user_name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{a.user_name || "System"}</span>
                  </div>
                </Td>

                {/* Details (unchanged) */}
                <Td className="text-xs" style={{ color: "#9aaa80" }}>{a.details || "—"}</Td>

                {/* ── NEW: Receipt download column ── */}
                <Td>
                  {isAppt ? (
                    <button
                      onClick={() => handleDownload(a)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-50"
                      style={{
                        borderColor: isLoading ? "#9aaa80" : "#2a7010",
                        color:       isLoading ? "#9aaa80" : "#1c4f09",
                      }}
                      title="Download appointment receipt as PDF"
                    >
                      {isLoading
                        ? <><span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Generating…</>
                        : <>📄 PDF</>
                      }
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: "#9aaa80" }}>—</span>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}