// ── ACTIVITY LOG PANEL ────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { phpApi, Badge, Table, Tr, Td, PageHeader } from "../../shared";

const ACTION_CONFIG = {
  Login:    { color: "green",  icon: "🔐" },
  Logout:   { color: "gray",   icon: "🚪" },
  Delete:   { color: "red",    icon: "🗑"  },
  Create:   { color: "blue",   icon: "✚"  },
  Update:   { color: "amber",  icon: "✏"  },
  Approve:  { color: "green",  icon: "✓"  },
  Reject:   { color: "red",    icon: "✕"  },
};

export default function ActivityPanel({ show }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("all");

  const load = () => {
    setLoading(true);
    phpApi("get_activity")
      .then(r => { if (r.success) setLogs(r.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (show) load(); }, [show]);

  const filtered = filter === "all" ? logs : logs.filter(a => a.action === filter);
  const uniqueActions = [...new Set(logs.map(a => a.action).filter(Boolean))];

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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { lbl: "Total Events",  val: logs.length,                                color: "#1c4f09" },
          { lbl: "Logins",        val: logs.filter(a => a.action === "Login").length, color: "#2a7010" },
          { lbl: "Changes",       val: logs.filter(a => ["Create","Update","Delete"].includes(a.action)).length, color: "#c87820" },
          { lbl: "Today",         val: logs.filter(a => { const d = new Date(a.created_at||""); const t = new Date(); return d.toDateString() === t.toDateString(); }).length, color: "#7a3dc0" },
        ].map(s => (
          <div key={s.lbl} className="rounded-xl border p-4"
            style={{ background: `${s.color}0d`, borderColor: `${s.color}33` }}>
            <div className="text-2xl font-black" style={{ color: "#1a4a08" }}>{s.val}</div>
            <div className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: "#9aaa80" }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
            filter === "all" ? "bg-green-600 border-green-600 text-white" : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
          }`}>
          All
        </button>
        {uniqueActions.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              filter === a ? "bg-green-600 border-green-600 text-white" : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
            }`}>
            {ACTION_CONFIG[a]?.icon || ""} {a}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <Table headers={["Time", "Action", "User", "Details"]} empty="No activity yet.">
          {filtered.map((a, i) => {
            const cfg = ACTION_CONFIG[a.action] || { color: "amber", icon: "•" };
            return (
              <Tr key={i}>
                <Td className="text-xs whitespace-nowrap">
                  {a.created_at ? new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <Badge color={cfg.color}>{a.action}</Badge>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                      style={{ background: "#1c4f09" }}>
                      {(a.user_name || "S").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{a.user_name || "System"}</span>
                  </div>
                </Td>
                <Td className="text-xs" style={{ color: "#9aaa80" }}>{a.details || "—"}</Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}