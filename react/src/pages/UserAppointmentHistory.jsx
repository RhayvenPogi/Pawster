/**
 * UserAppointmentHistory.jsx
 * Client-facing history of adoption AND rehoming requests with PDF receipt download.
 * Fetches from Django endpoints; matches the Pawster green/amber design language.
 *
 * Install: npm install jspdf
 */

import { useState, useEffect } from "react";
import { downloadAppointmentPDF } from "../utils/downloadAppointmentPDF";

const DJANGO_BASE = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";

function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  Approved: {
    bg: "rgba(28,79,9,0.10)",
    color: "#1c4f09",
    dot: "#5aaa30",
    border: "rgba(90,170,48,0.35)",
  },
  Rejected: {
    bg: "rgba(192,48,48,0.08)",
    color: "#c03030",
    dot: "#ef4444",
    border: "rgba(192,48,48,0.30)",
  },
  Pending: {
    bg: "rgba(180,120,10,0.10)",
    color: "#7a6010",
    dot: "#d4880a",
    border: "rgba(200,140,20,0.30)",
  },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "0.22rem 0.65rem", borderRadius: 50,
      fontSize: "0.62rem", fontWeight: 900,
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const isAdoption = type === "Adoption";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.18rem 0.55rem", borderRadius: 50,
      fontSize: "0.60rem", fontWeight: 900,
      textTransform: "uppercase", letterSpacing: "0.06em",
      background: isAdoption ? "rgba(28,79,9,0.10)" : "rgba(140,60,20,0.10)",
      color: isAdoption ? "#1c4f09" : "#8c3c14",
      border: `1px solid ${isAdoption ? "rgba(90,170,48,0.30)" : "rgba(180,90,34,0.30)"}`,
    }}>
      {isAdoption ? "🐾" : "🏠"} {type}
    </span>
  );
}

// ─── Download button ──────────────────────────────────────────────────────────
function DownloadReceiptBtn({ record }) {
  const [busy, setBusy] = useState(false);
  const isAdoption = record._type === "Adoption";

  const handle = async () => {
    setBusy(true);
    await new Promise(r => setTimeout(r, 180));
    downloadAppointmentPDF(record, "user");
    setBusy(false);
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      title="Download PDF receipt"
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        padding: "0.5rem 0.9rem", borderRadius: 10, cursor: busy ? "not-allowed" : "pointer",
        fontFamily: "'Nunito',sans-serif", fontSize: "0.75rem", fontWeight: 900,
        whiteSpace: "nowrap", transition: "all 0.15s", opacity: busy ? 0.7 : 1,
        border: `1px solid ${isAdoption ? "rgba(90,170,48,0.42)" : "rgba(180,90,34,0.40)"}`,
        background: isAdoption ? "rgba(28,79,9,0.08)" : "rgba(140,60,20,0.08)",
        color: isAdoption ? "#1c4f09" : "#8c3c14",
      }}
    >
      {busy ? (
        <>
          <span style={{ display: "inline-block", width: 11, height: 11, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
          Generating…
        </>
      ) : (
        <>📄 Receipt</>
      )}
    </button>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${color}33`,
      background: `${color}0d`, padding: "0.9rem 1rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span style={{ fontSize: "1.5rem", fontWeight: 900, color, fontFamily: "'Nunito',sans-serif" }}>{value}</span>
      </div>
      <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80" }}>{label}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserAppointmentHistory({ userId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const headers = authHeaders();

    Promise.all([
      fetch(`${DJANGO_BASE}/api/approvals/adoptions/user/`, { headers }).then(r => r.json()),
      fetch(`${DJANGO_BASE}/api/approvals/rehoming/user/`,  { headers }).then(r => r.json()),
    ])
      .then(([adoptionRes, rehomingRes]) => {
        const adoptions = (adoptionRes?.data ?? adoptionRes ?? []).map(r => ({
          ...r,
          _type: "Adoption",
        }));
        const rehoming  = (rehomingRes?.data ?? rehomingRes ?? []).map(r => ({
          ...r,
          _type: "Rehoming",
        }));
        const all = [...adoptions, ...rehoming].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setRecords(all);
      })
      .catch(() => setError("Could not load your request history. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  // Counts
  const counts = {
    total:    records.length,
    approved: records.filter(r => r.status === "Approved").length,
    pending:  records.filter(r => r.status === "Pending").length,
    rejected: records.filter(r => r.status === "Rejected").length,
    adoption: records.filter(r => r._type === "Adoption").length,
    rehoming: records.filter(r => r._type === "Rehoming").length,
  };

  // Filter
  const filtered = records.filter(r => {
    const statusOk = filter === "All" || r.status === filter;
    const typeOk   = typeFilter === "All" || r._type === typeFilter;
    return statusOk && typeOk;
  });

  const statuses  = ["All", "Approved", "Pending", "Rejected"];
  const typeOpts  = ["All", "Adoption", "Rehoming"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: "'Nunito',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.64rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6a7a50", marginBottom: "0.3rem" }}>
            Request History
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 900, color: "#1a4a08" }}>
            My Adoption & Rehoming Activity
          </div>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#3a5020", margin: "0.2rem 0 0" }}>
            All your submissions — download any as a PDF receipt.
          </p>
        </div>
        <button
          onClick={load}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", borderRadius: 11, border: "1px solid rgba(180,140,60,0.35)", background: "rgba(255,248,218,0.8)", color: "#3a5020", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "0.65rem" }}>
        <StatCard label="Total"    value={counts.total}    color="#1c4f09" icon="📋" />
        <StatCard label="Approved" value={counts.approved}  color="#276010" icon="✅" />
        <StatCard label="Pending"  value={counts.pending}   color="#c87820" icon="⏳" />
        <StatCard label="Rejected" value={counts.rejected}  color="#c03030" icon="❌" />
        <StatCard label="Adoptions" value={counts.adoption} color="#1c4f09" icon="🐾" />
        <StatCard label="Rehoming"  value={counts.rehoming} color="#8c3c14" icon="🏠" />
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Status */}
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: "0.38rem 0.8rem", borderRadius: 20,
                fontSize: "0.75rem", fontWeight: 900,
                cursor: "pointer", fontFamily: "'Nunito',sans-serif",
                transition: "all 0.15s",
                border: filter === s ? "none" : "1px solid rgba(180,140,60,0.28)",
                background: filter === s ? "#1c4f09" : "rgba(255,248,218,0.7)",
                color: filter === s ? "#fff" : "#7a9060",
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(180,140,60,0.25)" }} />

        {/* Type */}
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {typeOpts.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{
                padding: "0.38rem 0.8rem", borderRadius: 20,
                fontSize: "0.75rem", fontWeight: 900,
                cursor: "pointer", fontFamily: "'Nunito',sans-serif",
                transition: "all 0.15s",
                border: typeFilter === t
                  ? "none"
                  : "1px solid rgba(180,140,60,0.28)",
                background: typeFilter === t
                  ? (t === "Rehoming" ? "#8c3c14" : "#1c4f09")
                  : "rgba(255,248,218,0.7)",
                color: typeFilter === t ? "#fff" : "#7a9060",
              }}>
              {t === "Adoption" ? "🐾 Adoption" : t === "Rehoming" ? "🏠 Rehoming" : "All Types"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3.5rem 0", gap: "0.6rem", color: "#9aaa80", fontSize: "0.84rem", fontWeight: 700 }}>
          <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(28,79,9,0.2)", borderTopColor: "#1c4f09", animation: "spin 0.7s linear infinite" }} />
          Loading your requests…
        </div>
      ) : error ? (
        <div style={{ padding: "1rem", borderRadius: 12, background: "rgba(192,48,48,0.06)", border: "1px solid rgba(192,48,48,0.2)", fontSize: "0.82rem", fontWeight: 700, color: "#c03030", textAlign: "center" }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🐾</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#9aaa80" }}>
            No {typeFilter !== "All" ? typeFilter.toLowerCase() + " " : ""}{filter !== "All" ? filter.toLowerCase() + " " : ""}requests found.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map((r, i) => {
            const isAdoption = r._type === "Adoption";
            const name   = isAdoption ? (r.animal_name || "Animal") : (r.pet_name || "Pet");
            const sub    = isAdoption
              ? [r.housing, r.email].filter(Boolean).join(" · ")
              : [r.species, r.breed].filter(Boolean).join(" · ");
            const owner  = isAdoption ? r.name : r.owner_name;
            const dateStr = r.created_at
              ? new Date(r.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })
              : "—";

            return (
              <div key={r.id ?? i} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.1rem",
                borderRadius: 16,
                background: "rgba(255,252,238,0.85)",
                border: "1px solid rgba(180,140,60,0.22)",
                boxShadow: "0 2px 8px rgba(100,70,20,0.07)",
                transition: "box-shadow 0.15s",
              }}>

                {/* Left info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    <TypeBadge type={r._type} />
                    <StatusPill status={r.status || "Pending"} />
                  </div>

                  <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#1a4a08", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {name}
                  </div>

                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    {owner && (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>
                        👤 {owner}
                      </span>
                    )}
                    {sub && (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>
                        📋 {sub}
                      </span>
                    )}
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9aaa80" }}>
                      📅 {dateStr}
                    </span>
                  </div>

                  {r.reject_note && r.status === "Rejected" && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", fontWeight: 700, color: "#c03030" }}>
                      ✕ {r.reject_note}
                    </div>
                  )}
                </div>

                {/* Right: download */}
                <DownloadReceiptBtn record={r} />
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9aaa80", textAlign: "center", margin: 0 }}>
          Each PDF is your official Pawster receipt. Keep it for your records.
        </p>
      )}
    </div>
  );
}