// pages/admin/ActivityPanel.jsx
// ── ACTIVITY LOG PANEL ────────────────────────────────────────────────────────
// Changes:
//   1. Filter chips → single <select> dropdown.
//   2. Fixed Login/Today stats: derived from `logs` (raw, unfiltered) and
//      uses a stable today-string so the count updates after each load().
//   3. load() now also fires on mount regardless of prior `show` value.
//   4. Receipt column + PDF download logic unchanged.
//
// Install once: npm install jspdf

import { useState, useEffect, useRef } from "react";
import { phpApi, Badge, Table, Tr, Td, PageHeader } from "../../shared";
import { downloadAppointmentPDF } from "../../utils/downloadAppointmentPDF";
import { usePageTitle } from "../../hooks/usePageTitle";

const ActionIcon = ({ type, size = 12 }) => {
  const s = { width: size, height: size, flexShrink: 0 };
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "Login":   return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
    case "Logout":  return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case "Delete":  return <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
    case "Create":  return <svg viewBox="0 0 24 24" style={s} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case "Update":  return <svg viewBox="0 0 24 24" style={s} {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case "Approve": return <svg viewBox="0 0 24 24" style={s} {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    case "Reject":  return <svg viewBox="0 0 24 24" style={s} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    default:        return <svg viewBox="0 0 24 24" style={s} {...p}><circle cx="12" cy="12" r="2"/></svg>;
  }
};

const ACTION_CONFIG = {
  Login:   { color: "green" },
  Logout:  { color: "gray"  },
  Delete:  { color: "red"   },
  Create:  { color: "blue"  },
  Update:  { color: "amber" },
  Approve: { color: "green" },
  Reject:  { color: "red"   },
};

export default function ActivityPanel({ show }) {
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [filter,      setFilter]      = useState("all");
  const [downloading, setDownloading] = useState(null);
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 15;

  usePageTitle("Activity Log");

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const load = () => {
    setLoading(true);
    phpApi("get_activity")
      .then(r => { if (r.success) setLogs(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Fire on mount AND whenever the panel becomes visible again.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; load(); return; }
    if (show) load();
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [show]);

  // ── Derived counts (always from raw `logs`, never from filtered slice) ──────
  const todayStr      = new Date().toDateString();
  const loginCount    = logs.filter(a => a.action === "Login").length;
  const changesCount  = logs.filter(a => ["Create", "Update", "Delete"].includes(a.action)).length;
  const todayCount    = logs.filter(a => new Date(a.created_at || "").toDateString() === todayStr).length;

  // ── Filter & pagination ─────────────────────────────────────────────────────
  const uniqueActions = [...new Set(logs.map(a => a.action).filter(Boolean))];
  const filtered      = filter === "all" ? logs : logs.filter(a => a.action === filter);
  const totalPages    = Math.ceil(filtered.length / PAGE_SIZE);
  const paged         = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter]);

  // ── PDF download handler ────────────────────────────────────────────────────
  const handleDownload = async (log) => {
    setDownloading(log.id);
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
    await new Promise(r => setTimeout(r, 200));
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        }
      />

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { lbl: "Total Events", val: logs.length,   color: "#1c4f09" },
          { lbl: "Logins",       val: loginCount,     color: "#2a7010" },
          { lbl: "Changes",      val: changesCount,   color: "#c87820" },
          { lbl: "Today",        val: todayCount,     color: "#7a3dc0" },
        ].map(s => (
          <div key={s.lbl} className="rounded-xl border p-4"
            style={{ background: `${s.color}0d`, borderColor: `${s.color}33` }}>
            <div className="text-2xl font-black" style={{ color: "#1a4a08" }}>{s.val}</div>
            <div className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#9aaa80" }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Filter dropdown ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-black uppercase tracking-widest" style={{ color: "#9aaa80" }}>
          Filter
        </label>
        <div className="relative">
          {/* chevron icon */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#3a5020" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="appearance-none pr-8 pl-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/30"
            style={{
              borderColor:     "#ddd0a8",
              color:           "#3a5020",
              background:      "rgba(255,252,232,0.95)",
              minWidth:        "9rem",
            }}>
            <option value="all">All Actions</option>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* live result count */}
        {filter !== "all" && (
          <span className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table / Cards ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm font-semibold" style={{ color: "#9aaa80" }}>
          No activity yet.
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden md:block">
            <Table headers={["Time", "Action", "User", "Details", "Receipt"]} empty="No activity yet.">
              {paged.map((a, i) => {
                const cfg       = ACTION_CONFIG[a.action] || { color: "amber" };
                const isAppt    = a.appointment_id || a.action === "Approve";
                const isLoading = downloading === a.id;
                return (
                  <Tr key={i}>
                    <Td className="text-xs whitespace-nowrap">
                      {a.created_at
                        ? new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ActionIcon type={a.action} size={13} />
                        <Badge color={cfg.color}>{a.action}</Badge>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                          style={{ background: "#1c4f09" }}>
                          {(a.user_name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold">{a.user_name || "System"}</span>
                      </div>
                    </Td>
                    <Td className="text-xs" style={{ color: "#9aaa80" }}>{a.details || "—"}</Td>
                    <Td>
                      {isAppt ? (
                        <button
                          onClick={() => handleDownload(a)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-50"
                          style={{ borderColor: isLoading ? "#9aaa80" : "#2a7010", color: isLoading ? "#9aaa80" : "#1c4f09" }}>
                          {isLoading ? (
                            <><span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Generating…</>
                          ) : (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> PDF</>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: "#9aaa80" }}>—</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {paged.map((a, i) => {
              const cfg       = ACTION_CONFIG[a.action] || { color: "amber" };
              const isAppt    = a.appointment_id || a.action === "Approve";
              const isLoading = downloading === a.id;
              return (
                <div key={i}
                  className="rounded-2xl border p-4 flex flex-col gap-3"
                  style={{ background: "rgba(255,252,232,0.9)", borderColor: "rgba(180,140,60,0.28)" }}>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background: "#1c4f09" }}>
                      {(a.user_name || "S").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate">{a.user_name || "System"}</div>
                      <div className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>
                        {a.created_at
                          ? new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ActionIcon type={a.action} size={13} />
                      <Badge color={cfg.color}>{a.action}</Badge>
                    </div>
                  </div>

                  {a.details && (
                    <div className="rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{ background: "rgba(180,140,60,0.07)", color: "#6a7a50" }}>
                      {a.details}
                    </div>
                  )}

                  {isAppt && (
                    <button
                      onClick={() => handleDownload(a)}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-black border transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-50"
                      style={{ borderColor: isLoading ? "#9aaa80" : "#2a7010", color: isLoading ? "#9aaa80" : "#1c4f09" }}>
                      {isLoading ? (
                        <><span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Generating…</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Download Receipt PDF</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
              <p className="text-[11px] font-semibold" style={{ color: "#9aaa80" }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} events
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(180,140,60,0.28)", color: "#3a5020" }}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className="w-8 h-8 rounded-lg text-[11px] font-bold border transition-all"
                    style={{
                      background:  n === page ? "#1a4a08" : "transparent",
                      color:       n === page ? "#fff"    : "#3a5020",
                      borderColor: n === page ? "#1a4a08" : "rgba(180,140,60,0.28)",
                    }}>
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(180,140,60,0.28)", color: "#3a5020" }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}