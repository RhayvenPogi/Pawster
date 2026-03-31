import { useState, useEffect, useCallback } from "react";

const STATUS_COLORS = {
  lost:  { bg: "rgba(192,48,48,0.10)",  color: "#c03030", border: "rgba(192,48,48,0.25)",  label: "🔴 Lost"  },
  found: { bg: "rgba(28,79,9,0.10)",    color: "#1c4f09", border: "rgba(28,79,9,0.25)",    label: "🟢 Found" },
};

function Badge({ type }) {
  const s = STATUS_COLORS[type] || STATUS_COLORS.lost;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "0.2rem 0.65rem", borderRadius: 50, fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {s.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "rgba(255,252,235,0.99)", border: "1.5px solid rgba(180,140,60,0.35)", borderRadius: 18, padding: "2rem", maxWidth: 360, width: "100%", margin: "1rem", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "0.75rem" }}>🗑️</div>
        <p style={{ textAlign: "center", fontWeight: 700, fontSize: "0.92rem", color: "#1a4a08", marginBottom: "1.5rem" }}>{message}</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "0.65rem", borderRadius: 10, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", background: "transparent", border: "1.5px solid rgba(180,140,60,0.28)", color: "#3a5020", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "0.65rem", borderRadius: 10, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", background: "#c03030", border: "none", color: "#fff", fontFamily: "inherit" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ pet, onClose, onDelete }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "rgba(255,252,235,0.99)", border: "1.5px solid rgba(180,140,60,0.35)", borderRadius: 22, padding: "2rem", maxWidth: 460, width: "100%", margin: "1rem", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.35rem", color: "#1a4a08" }}>Report Details</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#6a7a50", padding: "0.25rem 0.5rem" }}>✕</button>
        </div>

        {/* Species icon */}
        <div style={{ width: "100%", height: 120, background: "rgba(180,140,60,0.10)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem", marginBottom: "1.25rem", border: "1px solid rgba(180,140,60,0.18)" }}>
          {pet.species?.toLowerCase() === "cat" ? "🐱" : "🐶"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <Badge type={pet.type} />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6a7a50" }}>{pet.species} · {pet.breed || "Unknown breed"}</span>
        </div>

        {[
          ["Pet Name",    pet.name || "Unknown"],
          ["Area / City", pet.area],
          ["Color",       pet.color],
          ["Reported",    formatDate(pet.reportedDate)],
          ["Details",     pet.details || "No additional details provided."],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid rgba(180,140,60,0.13)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6a7a50", minWidth: 90, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a4a08", flex: 1 }}>{val}</span>
          </div>
        ))}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.7rem", borderRadius: 10, fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", background: "transparent", border: "1.5px solid rgba(180,140,60,0.28)", color: "#3a5020", fontFamily: "inherit" }}>Close</button>
          <button onClick={() => onDelete(pet)} style={{ flex: 1, padding: "0.7rem", borderRadius: 10, fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", background: "rgba(192,48,48,0.10)", border: "1.5px solid rgba(192,48,48,0.25)", color: "#c03030", fontFamily: "inherit" }}>🗑 Delete Report</button>
        </div>
      </div>
    </div>
  );
}

export default function MissingPetsPanel({ show, onStatsChange }) {
  const [pets, setPets]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/missing-pets");
      if (res.ok) setPets(await res.json());
    } catch (err) {
      console.error("Failed to fetch missing pets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (show) fetchPets(); }, [show, fetchPets]);

  const handleDelete = async (pet) => {
    try {
      const res = await fetch(`/api/missing-pets/${pet.id}`, { method: "DELETE" });
      if (res.ok) {
        setPets(p => p.filter(x => x.id !== pet.id));
        setSelected(null);
        setConfirmDel(null);
        showToast("Report deleted successfully.");
        onStatsChange?.();
      } else {
        showToast("Failed to delete report.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    }
  };

  const filtered = pets
    .filter(p => filter === "all" || p.type === filter)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [p.name, p.breed, p.area, p.color, p.species].some(f => f?.toLowerCase().includes(q));
    });

  const counts = { all: pets.length, lost: pets.filter(p => p.type === "lost").length, found: pets.filter(p => p.type === "found").length };

  if (!show) return null;

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", animation: "fadeUp 0.25s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 2000, padding: "0.75rem 1.25rem", borderRadius: 12, fontWeight: 800, fontSize: "0.88rem", boxShadow: "0 8px 28px rgba(0,0,0,0.15)", background: toast.type === "success" ? "rgba(28,79,9,0.92)" : "rgba(192,48,48,0.92)", color: "#fff", backdropFilter: "blur(8px)", animation: "fadeUp 0.2s ease" }}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: 50, padding: "0.25rem 0.85rem", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", background: "rgba(180,90,34,0.10)", border: "1px solid rgba(180,90,34,0.28)", color: "#B45A22", marginBottom: "0.5rem" }}>
            🐾 Community Reports
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 900, color: "#1a4a08", margin: 0, lineHeight: 1.1 }}>
            <em style={{ fontStyle: "italic", color: "#B45A22" }}>Missing</em> Pets
          </h2>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6a7a50", marginTop: "0.3rem" }}>
            {pets.length} total report{pets.length !== 1 ? "s" : ""} · {counts.lost} lost · {counts.found} found
          </p>
        </div>
        <button onClick={fetchPets} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.65rem 1.25rem", borderRadius: 10, fontWeight: 800, fontSize: "0.82rem", color: "#1c4f09", background: "rgba(90,170,48,0.12)", border: "1.5px solid rgba(90,170,48,0.30)", cursor: "pointer", fontFamily: "inherit" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Reports", value: counts.all,   icon: "📋", bg: "rgba(180,140,60,0.10)",  color: "#7a6020"  },
          { label: "Lost",          value: counts.lost,  icon: "🔴", bg: "rgba(192,48,48,0.08)",   color: "#c03030"  },
          { label: "Found",         value: counts.found, icon: "🟢", bg: "rgba(28,79,9,0.08)",     color: "#1c4f09"  },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.bg}`, borderRadius: 14, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.4rem" }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#6a7a50", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "inline-flex", gap: "0.3rem", background: "rgba(255,248,220,0.7)", borderRadius: 50, padding: "0.25rem", border: "1px solid rgba(180,140,60,0.28)" }}>
          {[["all", "All"], ["lost", "Lost"], ["found", "Found"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: "0.4rem 1rem", borderRadius: 50, fontSize: "0.80rem", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", background: filter === val ? (val === "lost" ? "#c03030" : val === "found" ? "#1c4f09" : "#1a4a08") : "transparent", color: filter === val ? "#fff" : "#3a5020", transition: "all 0.15s" }}>
              {lbl} {counts[val] > 0 && <span style={{ opacity: 0.75 }}>({counts[val]})</span>}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", pointerEvents: "none" }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, breed, area, color…"
            style={{ width: "100%", padding: "0.6rem 0.75rem 0.6rem 2.2rem", borderRadius: 10, border: "1.5px solid rgba(180,140,60,0.28)", background: "rgba(255,250,232,0.85)", fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem", color: "#1a4a08", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem", gap: "0.75rem", color: "#3a5020", fontWeight: 700 }}>
          <div style={{ width: 20, height: 20, border: "3px solid rgba(180,90,34,0.2)", borderTopColor: "#B45A22", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          Loading reports…
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#6a7a50" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🐾</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.1rem", color: "#1a4a08" }}>No reports found</div>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.3rem" }}>{search ? "Try a different search term." : "No community reports yet."}</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ background: "rgba(255,248,225,0.85)", border: "1.5px solid rgba(180,140,60,0.28)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(100,70,20,0.08)" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 120px 110px 100px 80px", gap: "0.5rem", padding: "0.7rem 1.25rem", background: "rgba(180,140,60,0.08)", borderBottom: "1.5px solid rgba(180,140,60,0.18)" }}>
            {["Type", "Pet / Breed", "Species", "Area", "Color", "Reported", "Actions"].map(h => (
              <div key={h} style={{ fontSize: "0.67rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6a7a50" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((pet, i) => (
            <div
              key={pet.id}
              style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 120px 110px 100px 80px", gap: "0.5rem", padding: "0.85rem 1.25rem", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid rgba(180,140,60,0.12)" : "none", transition: "background 0.12s", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(90,170,48,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={() => setSelected(pet)}
            >
              <div><Badge type={pet.type} /></div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "0.9rem", color: "#1a4a08" }}>{pet.name || "Unknown"}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6a7a50" }}>{pet.breed || "—"}</div>
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3a5020" }}>{pet.species}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3a5020" }}>{pet.area || "—"}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3a5020" }}>{pet.color || "—"}</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6a7a50" }}>{formatDate(pet.reportedDate)}</div>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  onClick={e => { e.stopPropagation(); setSelected(pet); }}
                  title="View details"
                  style={{ padding: "0.3rem 0.55rem", borderRadius: 7, fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", background: "rgba(32,96,160,0.10)", border: "1px solid rgba(32,96,160,0.20)", color: "#2060a0", fontFamily: "inherit" }}
                >👁</button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDel(pet); }}
                  title="Delete"
                  style={{ padding: "0.3rem 0.55rem", borderRadius: 7, fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", background: "rgba(192,48,48,0.09)", border: "1px solid rgba(192,48,48,0.20)", color: "#c03030", fontFamily: "inherit" }}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          pet={selected}
          onClose={() => setSelected(null)}
          onDelete={(pet) => { setSelected(null); setConfirmDel(pet); }}
        />
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <ConfirmDialog
          message={`Delete the report for "${confirmDel.name || "Unknown"}"? This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}