// ── GeoMapPanel.jsx — Region 1 Geo Map · Tailwind UI · Leaflet renderer ───────
import { useState, useEffect, useRef } from "react";
import { useGeoMap, PROVINCES, SB, pColor, phpApi } from "../../hooks/useGeoMap";
import LeafletMap from "./LeafletMap";

const REALTIME_INTERVAL_MS = 15000; // poll every 15 seconds

// ─── PRECISION BADGE ──────────────────────────────────────────────────────────
function PrecisionBadge({ precision }) {
  const cfg = {
    street:   { label: "🔵 Street",   cls: "bg-cyan-100 text-cyan-700 ring-cyan-300" },
    barangay: { label: "🟢 Barangay", cls: "bg-green-100 text-green-700 ring-green-300" },
    city:     { label: "🟡 City",     cls: "bg-amber-100 text-amber-700 ring-amber-300" },
    province: { label: "🔴 Province", cls: "bg-red-100 text-red-700 ring-red-300" },
    gps:      { label: "📡 GPS",      cls: "bg-blue-100 text-blue-700 ring-blue-300" },
  };
  const c = cfg[precision] || { label: "—", cls: "bg-gray-100 text-gray-500 ring-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ring-1 ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ─── SYNC BADGE ───────────────────────────────────────────────────────────────
function SyncBadge({ status }) {
  const cfg = {
    cached:  { icon: "⚡", label: "Instant (cached)",     cls: "bg-green-100 text-green-700 ring-green-300" },
    syncing: { icon: "🔄", label: "Geocoding addresses…", cls: "bg-amber-100 text-amber-700 ring-amber-300" },
    fresh:   { icon: "✅", label: "Map up to date",        cls: "bg-emerald-100 text-emerald-700 ring-emerald-300" },
    loading: { icon: "📍", label: "Loading…",              cls: "bg-gray-100 text-gray-500 ring-gray-200" },
  };
  const c = cfg[status] || cfg.loading;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── GEOCODING PROGRESS BAR ───────────────────────────────────────────────────
function GeocodingProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="rounded-2xl p-4 bg-green-50 ring-1 ring-green-200">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-extrabold text-green-900">
          📍 Geocoding via OpenStreetMap Nominatim…
        </span>
        <span className="text-xs font-bold text-green-600">{done} / {total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-green-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-green-900 to-green-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs mt-1.5 text-gray-400">
        Street-level accuracy · Nominatim OSM · Rate-limited to 1 req/s
      </p>
    </div>
  );
}

// ─── MINI BAR CHART (12 months) ───────────────────────────────────────────────
function BarChart({ data, color = "#2a7010" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 h-14">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{ height: `${Math.max(3, (d.value / max) * 48)}px`, background: color, opacity: 0.85 }}
          />
          <span className="text-[8px] font-bold text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── REALTIME PULSING DOT ─────────────────────────────────────────────────────
function RealtimeDot() {
  return (
    <span className="relative inline-flex h-2 w-2 ml-1">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
  );
}

// ─── DIRECTIONS BUTTON (reusable) ─────────────────────────────────────────────
function DirectionsButton({ lat, lng, label = "Get Directions via Google Maps", className = "" }) {
  if (!lat || !lng) return null;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-extrabold bg-green-900 hover:bg-green-800 text-white ring-1 ring-green-700 transition-colors ${className}`}
    >
      🗺 {label}
    </a>
  );
}

// ─── PET DETAIL PANEL (overlays the map) ─────────────────────────────────────
function PetDetailPanel({ pet, onClose }) {
  if (!pet) return null;
  const isLost   = pet.type === "lost";
  const photoUrl = `${SB}/api/missing-pets/${pet.id}/photo`;
  return (
    <div className="absolute top-3 right-3 z-[500] w-60 rounded-2xl overflow-hidden bg-amber-50 ring-1 ring-amber-200 shadow-xl">
      <div className="h-28 bg-amber-100 overflow-hidden">
        <img
          src={photoUrl} alt={pet.name || "Pet"}
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
            isLost ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"
          }`}>
            {isLost ? "Lost" : "Found"}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-sm">✕</button>
        </div>
        <p className="font-black text-sm text-green-900">{pet.name || "Unknown"}</p>
        {(pet.species || pet.breed) && (
          <p className="text-xs font-bold text-green-700">{[pet.species, pet.breed].filter(Boolean).join(" · ")}</p>
        )}
        {(pet.address || pet.area) && (
          <p className="text-xs font-bold text-green-800 flex gap-1">
            <span className="text-amber-600">📍</span>
            <span className="leading-snug">{pet.address || pet.area}</span>
          </p>
        )}
        {pet.color && <p className="text-xs font-bold text-green-700">Color: {pet.color}</p>}
        <PrecisionBadge precision={pet._geo?.precision} />
        {pet.details && (
          <p className="text-xs leading-relaxed text-gray-400 pt-2 border-t border-amber-100">
            {pet.details.length > 90 ? pet.details.slice(0, 90) + "…" : pet.details}
          </p>
        )}

        {/* ── Directions button ── */}
        <div className="pt-1">
          <DirectionsButton lat={pet._geo?.lat} lng={pet._geo?.lng} label="Get Directions" />
        </div>
      </div>
    </div>
  );
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onFlyTo, adoptions, rehome, liveAdoptions, liveRehome }) {
  if (!user) return null;

  // Prefer live polled data, fall back to initial load
  const allAdoptions = liveAdoptions ?? adoptions;
  const allRehome    = liveRehome    ?? rehome;

  const uA   = allAdoptions.filter(a => a.user_id === user.id || a.email === user.email);
  const uR   = allRehome.filter(r => r.user_id === user.id || r.email === user.email);
  const addr = [user.address, user.city, user.province, user.zip_code].filter(Boolean).join(", ");
  const currentYear = new Date().getFullYear();

  // Full 12 months of current year
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      label: d.toLocaleString("default", { month: "short" }),
      value: [...uA, ...uR].filter(r => {
        const rd = new Date(r.created_at || "");
        return rd.getMonth() === i && rd.getFullYear() === currentYear;
      }).length,
    };
  });

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh] bg-amber-50 ring-1 ring-green-200 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-green-50 border-b border-amber-100 flex-shrink-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-900 to-green-600 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="#e3e3e3">
              <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 128.5-46.5T480-440q66 0 132.5 15.5T741-378q29 15 46.5 43.5T805-272v112H160Z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-green-900 truncate">{user.first_name} {user.last_name}</p>
            <p className="text-xs font-semibold text-green-600 truncate">{user.email}</p>
          </div>
          <PrecisionBadge precision={user._geo?.precision} />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none bg-amber-100 text-green-700 hover:bg-amber-200 transition-colors"
          >✕</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Address */}
          <div className="rounded-2xl p-4 bg-green-50 ring-1 ring-green-200">
            <p className="text-[10px] font-extrabold uppercase text-gray-400 mb-2 tracking-wider">📍 Registered Address</p>
            <p className="text-sm font-bold text-green-950 leading-relaxed mb-3">{addr || "No address provided"}</p>
            {user._geo?.nominatimLabel && (
              <p className="text-xs italic text-gray-400 mb-3">OSM: {user._geo.nominatimLabel}</p>
            )}
            <div className="flex flex-col gap-2">
              {user._geo?.inRegion && (
                <button
                  onClick={() => { onFlyTo(user._geo); onClose(); }}
                  className="w-full py-2 rounded-xl text-xs font-extrabold cursor-pointer bg-green-100 hover:bg-green-200 text-green-800 ring-1 ring-green-300 transition-colors"
                >
                  📍 Show on Map
                </button>
              )}
              {/* ── Directions button ── */}
              <DirectionsButton lat={user._geo?.lat} lng={user._geo?.lng} label="Get Directions via Google Maps" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: uA.length, label: "Adoptions", icon: "❤️", cls: "bg-green-50 ring-green-200 text-green-700" },
              { val: uR.length, label: "Rehoming",  icon: "🏠", cls: "bg-amber-50 ring-amber-200 text-amber-700" },
              { val: [...uA, ...uR].filter(r => r.status === "Approved").length, label: "Approved", icon: "✓", cls: "bg-emerald-50 ring-emerald-200 text-emerald-700" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ring-1 ${s.cls}`}>
                <div className="text-base">{s.icon}</div>
                <div className={`text-xl font-black ${s.cls.split(" ").find(c => c.startsWith("text-"))}`}>{s.val}</div>
                <div className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Activity chart — full year */}
          <div className="rounded-xl p-4 bg-white ring-1 ring-amber-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-extrabold uppercase text-green-900">
                📊 Activity — {currentYear}
              </p>
              <span className="flex items-center text-[10px] font-bold text-green-600">
                Live <RealtimeDot />
              </span>
            </div>
            <BarChart data={monthly} color="#2a7010" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function GeoMapPanel({ show }) {
  const {
    rawUsers, geocodedUsers, adoptions, rehome,
    missingPets, syncStatus, geocodingProgress,
  } = useGeoMap(show);

  // ── Realtime adoption/rehome polling every 15s ────────────────────────────
  const [liveAdoptions, setLiveAdoptions] = useState(null);
  const [liveRehome,    setLiveRehome]    = useState(null);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!show) return;

    const poll = async () => {
      try {
        const [ar, rr] = await Promise.all([
          phpApi("get_requests", { type: "adoptions", limit: 1000 }),
          phpApi("get_requests", { type: "rehome",    limit: 1000 }),
        ]);
        if (ar.success) setLiveAdoptions(ar.data || []);
        if (rr.success) setLiveRehome(rr.data || []);
        setLastUpdated(new Date());
      } catch {
        // silently keep last known data on error
      }
    };

    poll();
    pollRef.current = setInterval(poll, REALTIME_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [show]);

  const [filter,      setFilter]      = useState("all");
  const [provFilter,  setProvFilter]  = useState("all");
  const [search,      setSearch]      = useState("");
  const [showPets,    setShowPets]    = useState(true);
  const [mpType,      setMpType]      = useState("all");
  const [mpSp,        setMpSp]        = useState("all");
  const [selected,    setSelected]    = useState(null);
  const [selPet,      setSelPet]      = useState(null);
  const [flyTgt,      setFlyTgt]      = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Filtered data ─────────────────────────────────────────────────────────
  const fUsers = geocodedUsers.filter(u => {
    const mf = filter === "all" || (filter === "active" ? u.is_active : !u.is_active);
    const mp = provFilter === "all" || u._geo?.province === provFilter;
    const ms = !search || `${u.first_name} ${u.last_name} ${u.city || ""} ${u.province || ""} ${u.address || ""}`.toLowerCase().includes(search.toLowerCase());
    return mf && mp && ms;
  });

  const fPets = missingPets.filter(p =>
    (mpType === "all" || p.type === mpType) &&
    (mpSp   === "all" || (p.species || "").toLowerCase() === mpSp.toLowerCase())
  );

  const mc = {
    all:   missingPets.length,
    lost:  missingPets.filter(p => p.type === "lost").length,
    found: missingPets.filter(p => p.type === "found").length,
  };

  const pStats = Object.keys(PROVINCES).map(p => ({
    name:   p,
    color:  PROVINCES[p].color,
    count:  geocodedUsers.filter(u => u._geo?.province === p).length,
    active: geocodedUsers.filter(u => u._geo?.province === p && u.is_active).length,
  }));

  const brgCount = geocodedUsers.filter(u =>
    u._geo?.precision === "barangay" || u._geo?.precision === "street"
  ).length;

  // Use live data where available, fall back to initial load
  const activeAdoptions = (liveAdoptions ?? adoptions).filter(a => a.status === "Pending").length;
  const activeRehome    = (liveRehome    ?? rehome).filter(r => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-green-900">🗺 Region 1 — User &amp; Pet Map</h2>
          <p className="text-xs text-gray-400 mt-0.5">Leaflet · Nominatim OSM · Street-level geocoding</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <SyncBadge status={syncStatus} />
            {lastUpdated && (
              <span className="inline-flex items-center text-[10px] font-bold text-green-600">
                Activity live <RealtimeDot />
                <span className="text-gray-400 font-normal ml-1">
                  · updated {lastUpdated.toLocaleTimeString()}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "inactive"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all border ${
                filter === f
                  ? "bg-green-900 border-green-900 text-white"
                  : "bg-transparent border-amber-200 text-green-700 hover:border-green-400"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Province stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {pStats.map(p => (
          <button
            key={p.name}
            onClick={() => setProvFilter(provFilter === p.name ? "all" : p.name)}
            className={`rounded-2xl p-3 md:p-4 text-left cursor-pointer transition-all border ${
              provFilter === p.name
                ? "shadow-md -translate-y-0.5"
                : "border-amber-200 bg-amber-50 hover:border-amber-300"
            }`}
            style={provFilter === p.name ? { borderColor: p.color, background: `${p.color}15` } : {}}
          >
            <p className="text-xs font-extrabold text-green-900 truncate mb-1">{p.name}</p>
            <p className="text-2xl md:text-3xl font-black leading-none" style={{ color: p.color }}>{p.count}</p>
            <p className="text-xs mt-1 text-gray-400 font-semibold">{p.active} active</p>
          </button>
        ))}
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { val: rawUsers.length,  label: "Total Users",       icon: "👥", cls: "bg-green-50 ring-green-200",   live: false },
          { val: brgCount,         label: "High-Precision",    icon: "🏘", cls: "bg-teal-50 ring-teal-200",     live: false },
          { val: activeAdoptions,  label: "Pending Adoptions", icon: "❤️", cls: "bg-rose-50 ring-rose-200",     live: true  },
          { val: activeRehome,     label: "Pending Rehome",    icon: "🏠", cls: "bg-orange-50 ring-orange-200", live: true  },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-3 flex items-center gap-3 ring-1 ${s.cls}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-white/70 flex-shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-xl font-black leading-none text-green-900">{s.val}</p>
                {s.live && <RealtimeDot />}
              </div>
              <p className="text-[9px] font-bold uppercase text-gray-400 mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Geocoding progress ─────────────────────────────────────────── */}
      {geocodingProgress.active && (
        <GeocodingProgress done={geocodingProgress.done} total={geocodingProgress.total} />
      )}

      {/* ── Missing Pets layer controls ────────────────────────────────── */}
      <div className="rounded-2xl p-3 md:p-4 bg-amber-50 ring-1 ring-amber-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPets(v => !v)}
              className="relative flex-shrink-0 cursor-pointer border-none p-0"
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: showPets ? "#B45A22" : "rgba(180,140,60,0.28)",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                position: "absolute", top: 2,
                left: showPets ? "18px" : "2px",
                width: 16, height: 16, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }} />
            </button>
            <div>
              <p className="text-xs font-black text-green-900">🐾 Missing Pets Layer</p>
              <p className="text-xs font-bold text-gray-400">
                {showPets ? `${fPets.length} of ${missingPets.length} reports` : "Layer hidden"}
              </p>
            </div>
          </div>

          {showPets && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type filter */}
              <div className="inline-flex gap-0.5 rounded-full p-0.5 bg-white ring-1 ring-amber-200">
                {[["all", "All"], ["lost", "Lost"], ["found", "Found"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setMpType(v)}
                    className="px-3 py-1 rounded-full text-xs font-extrabold border-none cursor-pointer transition-colors"
                    style={{
                      background: mpType === v ? (v === "lost" ? "#c03030" : v === "found" ? "#1c4f09" : "#B45A22") : "transparent",
                      color: mpType === v ? "#fff" : "#3a5020",
                    }}
                  >
                    {l} {v !== "all" && mc[v] > 0 && `(${mc[v]})`}
                  </button>
                ))}
              </div>
              {/* Species filter */}
              <div className="inline-flex gap-0.5 rounded-full p-0.5 bg-white ring-1 ring-amber-200">
                {[["all", "All"], ["Dog", "🐕"], ["Cat", "🐈"], ["Other", "Other"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setMpSp(v)}
                    className="px-3 py-1 rounded-full text-xs font-extrabold border-none cursor-pointer transition-colors"
                    style={{
                      background: mpSp === v ? "#B45A22" : "transparent",
                      color: mpSp === v ? "#fff" : "#3a5020",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {showPets && (
          <div className="flex gap-4 flex-wrap mt-2.5 pt-2.5 border-t border-amber-200 items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-white" />
              <span className="text-xs font-bold text-green-800">Lost (!)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-900 ring-2 ring-white" />
              <span className="text-xs font-bold text-green-800">Found (✓)</span>
            </div>
            <div className="hidden md:flex gap-3 ml-auto flex-wrap">
              <span className="text-xs font-bold text-cyan-600">🔵 Cyan = street-level</span>
              <span className="text-xs font-bold text-gray-400">⚪ White = barangay</span>
              <span className="text-xs font-bold text-amber-600">🟡 Yellow = city</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Map + Sidebar ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-3">

        {/* Map card */}
        <div className="rounded-2xl overflow-hidden ring-1 ring-green-200 shadow-md">

          {/* Search bar */}
          <div className="px-3 md:px-4 py-2.5 flex items-center gap-2 bg-amber-50 border-b border-amber-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, city, address…"
              className="flex-1 border-none bg-transparent outline-none text-sm font-semibold text-green-950 placeholder:text-gray-300"
            />
            {search && (
              <button onClick={() => setSearch("")} className="border-none bg-transparent cursor-pointer text-xs text-gray-400 hover:text-gray-600">✕</button>
            )}
            <span className="text-xs font-bold text-gray-400 flex-shrink-0">{fUsers.length} users</span>
            {showPets && <span className="text-xs font-bold text-orange-500 flex-shrink-0">· {fPets.length} pets</span>}
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="lg:hidden ml-1 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200 text-green-700 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
            >☰</button>
          </div>

          {/* Leaflet map */}
          <div className="relative" style={{ height: "clamp(320px,52vw,540px)" }}>
            {show && (
              <LeafletMap
                users={fUsers}
                pets={fPets}
                showPets={showPets}
                onSelectUser={setSelected}
                onSelectPet={setSelPet}
                flyTarget={flyTgt}
              />
            )}
            {selPet && <PetDetailPanel pet={selPet} onClose={() => setSelPet(null)} />}
          </div>

          {/* Legend footer */}
          <div className="px-3 md:px-4 py-2.5 flex items-center gap-3 flex-wrap bg-amber-50 border-t border-amber-100">
            {Object.entries(PROVINCES).map(([p, cfg]) => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-xs font-bold text-green-800">{p}</span>
              </div>
            ))}
            <span className="text-xs text-gray-300 ml-auto hidden md:block">© OpenStreetMap · Leaflet</span>
          </div>
        </div>

        {/* User sidebar */}
        <div className={`rounded-2xl overflow-hidden flex-col ring-1 ring-amber-200 bg-amber-50 ${
          sidebarOpen ? "flex" : "hidden lg:flex"
        }`}>
          <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between bg-amber-50 border-b border-amber-100">
            <div>
              <p className="text-xs font-extrabold uppercase text-green-900">Users ({fUsers.length})</p>
              {showPets && <p className="text-xs font-bold text-orange-500 mt-0.5">🐾 {fPets.length} pets on map</p>}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden border-none bg-transparent cursor-pointer text-sm font-bold text-gray-400 hover:text-gray-600"
            >✕</button>
          </div>

          <div className="overflow-y-auto flex-1 max-h-[480px]">
            {fUsers.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-gray-400">No users match filters</div>
            ) : fUsers.map(u => (
              <div
                key={u.id}
                className="px-4 py-2.5 flex items-center gap-2 border-b border-amber-100/60 hover:bg-amber-100/40 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: u.is_active ? pColor(u._geo?.province) : "#ccc" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-green-950 truncate">{u.first_name} {u.last_name}</p>
                  <p className="text-xs font-semibold text-green-600">
                    {u.city || "—"} ·{" "}
                    <span className={
                      u._geo?.precision === "street"   ? "text-cyan-600" :
                      u._geo?.precision === "barangay" ? "text-green-600" :
                      "text-amber-600"
                    }>
                      {u._geo?.precision}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelected(u)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs cursor-pointer bg-green-50 hover:bg-green-100 ring-1 ring-green-200 text-green-800 border-none transition-colors"
                  title="View details"
                >👁</button>
                <button
                  onClick={() => setFlyTgt({ lat: u._geo.lat, lng: u._geo.lng })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs cursor-pointer bg-green-900 hover:bg-green-800 text-white border-none transition-colors"
                  title="Show on map"
                >📍</button>
                {/* ── Directions button in sidebar ── */}
                {u._geo?.lat && u._geo?.lng && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${u._geo.lat},${u._geo.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-700 text-white border-none transition-colors flex-shrink-0"
                    title="Get Directions"
                  >🗺</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── User detail modal ──────────────────────────────────────────── */}
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onFlyTo={geo => setFlyTgt({ lat: geo.lat, lng: geo.lng })}
          adoptions={adoptions}
          rehome={rehome}
          liveAdoptions={liveAdoptions}
          liveRehome={liveRehome}
        />
      )}
    </div>
  );
}