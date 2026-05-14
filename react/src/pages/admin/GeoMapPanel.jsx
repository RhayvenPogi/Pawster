// ── GeoMapPanel.jsx — Baguio City & CAR Geo Map · Tailwind UI · Leaflet renderer ───────
import { useState, useEffect, useRef } from "react";
import { useGeoMap, PROVINCES, SB, pColor, phpApi, fetchAndGeocodePets } from "../../hooks/useGeoMap";
import LeafletMap from "./LeafletMap";
import { usePageTitle } from "../../hooks/usePageTitle";

// ─── CAR PROVINCES & BAGUIO CITY ──────────────────────────────────────────────
// Override PROVINCES with Cordillera Administrative Region areas.
// If useGeoMap exports a mutable PROVINCES object you can redefine it here,
// otherwise update useGeoMap.js to use the map below.
//
// CAR_AREAS is the source-of-truth used throughout this panel.
const CAR_AREAS = {
  "Baguio City":       { color: "#1a6b3c" },   // deep pine green  (chartered city)
  "Benguet":           { color: "#2e86ab" },   // cool highland blue
  "Abra":              { color: "#c05c1f" },   // warm terracotta
  "Apayao":            { color: "#7b4f9e" },   // mountain violet
  "Ifugao":            { color: "#d4a017" },   // rice-terrace gold
  "Kalinga":           { color: "#b0303a" },   // warrior red
  "Mountain Province": { color: "#3d6b50" },   // forest green
};

const REALTIME_INTERVAL_MS = 15000;

// ─── SVG ICON SET ─────────────────────────────────────────────────────────────
const GeoIcons = {
  Map: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
  Pin: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  User: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Users: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Home: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Heart: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Paw: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/>
      <circle cx="6.5" cy="15.5" r="2.5"/>
      <path d="M17.5 15.5c0 4-6 7-6 7s-6-3-6-7"/>
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Search: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Menu: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Eye: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Navigation: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  ),
  Activity: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Mountain: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 20 11 4 19 20 3 20"/>
      <polyline points="8.5 20 11 15 13.5 20"/>
    </svg>
  ),
  Layers: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Refresh: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Dog: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3 4.722 3.295 3 4.272 3 6c0 1.333.375 2.375 1.125 3.125L3 16v3h3l1-2h8l1 2h3v-3l-1.125-6.875C18.625 8.375 19 7.333 19 6c0-1.728-1.722-2.705-3.5-3-.667-.12-1.353.143-2 .5"/>
      <path d="M9.5 11c-.667 0-1 .5-1 1s.333 1 1 1h5c.667 0 1-.5 1-1s-.333-1-1-1h-5z"/>
    </svg>
  ),
};

function PrecisionBadge({ precision }) {
  const cfg = {
    street:   { label: "Street",   dot: "#0891b2", cls: "bg-cyan-50 text-cyan-700 ring-cyan-200"   },
    barangay: { label: "Barangay", dot: "#16a34a", cls: "bg-green-50 text-green-700 ring-green-200" },
    city:     { label: "City",     dot: "#d97706", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    province: { label: "Province", dot: "#dc2626", cls: "bg-red-50 text-red-600 ring-red-200"       },
    gps:      { label: "GPS",      dot: "#2563eb", cls: "bg-blue-50 text-blue-700 ring-blue-200"    },
  };
  const c = cfg[precision] || { label: "—", dot: "#9ca3af", cls: "bg-gray-50 text-gray-400 ring-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ring-1 tracking-wide ${c.cls}`}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0, display: "inline-block" }} />
      {c.label}
    </span>
  );
}

// ─── SYNC BADGE ───────────────────────────────────────────────────────────────
function SyncBadge({ status }) {
  const cfg = {
    cached:  { label: "Cached",    dot: "#16a34a", cls: "bg-green-50 text-green-700 ring-green-200"     },
    syncing: { label: "Syncing…",  dot: "#d97706", cls: "bg-amber-50 text-amber-700 ring-amber-200"     },
    fresh:   { label: "Live",      dot: "#059669", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    loading: { label: "Loading…",  dot: "#9ca3af", cls: "bg-gray-50 text-gray-400 ring-gray-200"         },
  };
  const c = cfg[status] || cfg.loading;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ring-1 tracking-wide ${c.cls}`}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0, display: "inline-block" }} />
      {c.label}
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
function BarChart({ data, color = "#1a6b3c" }) {
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
    <span className="relative inline-flex h-1.5 w-1.5 ml-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
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
    <div className="absolute top-3 right-3 z-[500] w-56 rounded-2xl overflow-hidden bg-[#fffce8] ring-1 ring-[rgba(180,140,60,0.28)] shadow-xl">
      <div className="h-28 bg-amber-100 overflow-hidden relative">
        <img src={photoUrl} alt={pet.name || "Pet"} className="w-full h-full object-cover"
          onError={e => { e.target.style.display = "none"; }} />
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#fffce8] to-transparent" />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-black text-sm text-green-900 leading-tight">{pet.name || "Unknown"}</p>
            {(pet.species || pet.breed) && (
              <p className="text-[10px] font-bold text-green-600 mt-0.5">{[pet.species, pet.breed].filter(Boolean).join(" · ")}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ring-1 ${isLost ? "bg-red-50 text-red-600 ring-red-200" : "bg-green-50 text-green-700 ring-green-200"}`}>
              {isLost ? "Lost" : "Found"}
            </span>
            <button onClick={onClose} className="w-5 h-5 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600">
              <GeoIcons.X size={10} />
            </button>
          </div>
        </div>
        {(pet.address || pet.area) && (
          <div className="flex gap-1.5 items-start">
            <span className="text-amber-600 mt-0.5 flex-shrink-0"><GeoIcons.Pin size={10} /></span>
            <p className="text-[10px] font-bold text-green-800 leading-snug">{pet.address || pet.area}</p>
          </div>
        )}
        {pet.color && (
          <p className="text-[10px] font-semibold text-gray-500">Color: {pet.color}</p>
        )}
        <PrecisionBadge precision={pet._geo?.precision} />
        {pet.details && (
          <p className="text-[10px] leading-relaxed text-gray-400 pt-2 border-t border-[rgba(180,140,60,0.15)]">
            {pet.details.length > 80 ? pet.details.slice(0, 80) + "…" : pet.details}
          </p>
        )}
        <DirectionsButton lat={pet._geo?.lat} lng={pet._geo?.lng} />
      </div>
    </div>
  );
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onFlyTo, adoptions, rehome, liveAdoptions, liveRehome }) {
  if (!user) return null;

  const allAdoptions = liveAdoptions ?? adoptions;
  const allRehome    = liveRehome    ?? rehome;

  const uA   = allAdoptions.filter(a => a.user_id === user.id || a.email === user.email);
  const uR   = allRehome.filter(r => r.user_id === user.id || r.email === user.email);
  const addr = [user.address, user.city, user.province, user.zip_code].filter(Boolean).join(", ");
  const currentYear = new Date().getFullYear();

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
    <div onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[88vh] bg-[#fffce8] ring-1 ring-[rgba(180,140,60,0.28)] shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(180,140,60,0.15)] flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-900 text-white flex-shrink-0">
            <GeoIcons.User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-green-900 truncate">{user.first_name} {user.last_name}</p>
            <p className="text-[10px] font-semibold text-green-600 truncate">{user.email}</p>
          </div>
          <PrecisionBadge precision={user._geo?.precision} />
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border border-[rgba(180,140,60,0.28)] bg-transparent text-gray-400 hover:bg-amber-100 transition-colors ml-1">
            <GeoIcons.X size={13} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">

          {/* Address */}
          <div className="rounded-xl p-3.5 bg-green-50 ring-1 ring-green-200">
            <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-1.5 flex items-center gap-1">
              <GeoIcons.Pin size={10} /> Registered Address
            </p>
            <p className="text-xs font-bold text-green-950 leading-relaxed mb-3">{addr || "No address provided"}</p>
            {user._geo?.nominatimLabel && (
              <p className="text-[10px] italic text-gray-400 mb-2.5">{user._geo.nominatimLabel}</p>
            )}
            <div className="flex flex-col gap-1.5">
              {user._geo?.inRegion && (
                <button onClick={() => { onFlyTo(user._geo); onClose(); }}
                  className="w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer bg-green-100 hover:bg-green-200 text-green-800 ring-1 ring-green-300 transition-colors flex items-center justify-center gap-1.5">
                  <GeoIcons.Pin size={11} /> Show on Map
                </button>
              )}
              <DirectionsButton lat={user._geo?.lat} lng={user._geo?.lng} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: uA.length, label: "Adoptions", Icon: GeoIcons.Heart, cls: "bg-green-50 ring-green-200 text-green-700" },
              { val: uR.length, label: "Rehoming",  Icon: GeoIcons.Home,  cls: "bg-amber-50 ring-amber-200 text-amber-700" },
              { val: [...uA, ...uR].filter(r => r.status === "Approved").length, label: "Approved", Icon: GeoIcons.Check, cls: "bg-emerald-50 ring-emerald-200 text-emerald-700" },
            ].map(({ val, label, Icon, cls }) => (
              <div key={label} className={`rounded-xl p-3 text-center ring-1 ${cls}`}>
                <div className="flex justify-center mb-1 opacity-60"><Icon size={13} /></div>
                <div className="text-lg font-black">{val}</div>
                <div className="text-[9px] font-bold uppercase text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Activity chart */}
          <div className="rounded-xl p-3.5 bg-white ring-1 ring-[rgba(180,140,60,0.15)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-green-900 flex items-center gap-1.5">
                <GeoIcons.Activity size={11} /> Activity — {currentYear}
              </p>
              <span className="flex items-center text-[10px] font-bold text-green-600">
                Live <RealtimeDot />
              </span>
            </div>
            <BarChart data={monthly} color="#1a6b3c" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AREA BAR CHART ───────────────────────────────────────────────────────────
function AreaBarChart({ areaStats, areaFilter, onSelect }) {
  const max = Math.max(...areaStats.map(a => a.count), 1);
  return (
    <div className="rounded-xl bg-[rgba(255,252,232,0.95)] ring-1 ring-[rgba(180,140,60,0.22)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[rgba(180,140,60,0.15)] flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#B45A22] flex items-center gap-1.5 mb-0.5">
            <GeoIcons.Mountain size={10} /> Distribution by Area
          </p>
          <p className="text-[10px] font-semibold text-gray-400">Registered users per CAR province / city</p>
        </div>
        {areaFilter !== "all" && (
          <button onClick={() => onSelect("all")}
            className="text-[10px] font-bold text-[#B45A22] border border-[rgba(180,90,34,0.28)] bg-transparent rounded-lg px-2.5 py-1 cursor-pointer hover:bg-[rgba(180,90,34,0.06)] transition-colors">
            Clear filter
          </button>
        )}
      </div>

      {/* Chart body */}
      <div className="p-5">
        <div className="flex flex-col gap-3">
          {areaStats.map((a, i) => {
            const pct     = Math.max(2, (a.count / max) * 100);
            const isActive = areaFilter === a.name;
            const activePct = a.count > 0 ? Math.round((a.active / a.count) * 100) : 0;
            // Orange ramp — darkest for top areas
            const orangeRamp = [
              "#7c2d00","#9a3412","#b45a22","#c2692e","#d97706",
              "#ea8c1a","#f59e0b",
            ];
            const barColor = orangeRamp[Math.min(i, orangeRamp.length - 1)];

            return (
              <button key={a.name}
                onClick={() => onSelect(isActive ? "all" : a.name)}
                className="w-full text-left cursor-pointer border-none p-0 bg-transparent group"
              >
                <div className={`rounded-lg transition-all px-3 py-2.5 ${
                  isActive
                    ? "bg-[rgba(180,90,34,0.08)] ring-1 ring-[rgba(180,90,34,0.25)]"
                    : "hover:bg-[rgba(180,90,34,0.04)]"
                }`}>
                  {/* Row header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: barColor }} />
                      <span className="text-[11px] font-black text-green-900 tracking-tight">{a.name}</span>
                      {isActive && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[rgba(180,90,34,0.12)] text-[#B45A22]">
                          Filtered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-gray-400">
                        {a.active} active · {activePct}%
                      </span>
                      <span className="text-sm font-black text-green-900 w-6 text-right">{a.count}</span>
                    </div>
                  </div>

                  {/* Bar track */}
                  <div className="h-2 rounded-full bg-[rgba(180,140,60,0.12)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                        opacity: isActive ? 1 : 0.78,
                      }}
                    />
                  </div>

                  {/* Active sub-bar */}
                  {a.active > 0 && (
                    <div className="h-1 rounded-full mt-0.5 overflow-hidden" style={{ width: `${pct}%`, background: "transparent" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${activePct}%`,
                          background: "#16a34a",
                          opacity: 0.55,
                        }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-[rgba(180,140,60,0.12)]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full" style={{ background: "#b45a22" }} />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total users</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-green-500 opacity-60" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Active users</span>
          </div>
          <span className="text-[9px] font-semibold text-gray-300 ml-auto">Click a row to filter map</span>
        </div>
      </div>
    </div>
  );
}



// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function GeoMapPanel({ show }) {
  const {
    rawUsers, geocodedUsers, adoptions, rehome,
    missingPets: initialPets, syncStatus, geocodingProgress,
  } = useGeoMap(show);
  const [missingPets, setMissingPets] = useState([]);

  useEffect(() => {
    if (initialPets.length > 0) setMissingPets(initialPets);
  }, [initialPets]);

  // ── Realtime adoption/rehome polling every 15s ────────────────────────────
  const [liveAdoptions, setLiveAdoptions] = useState(null);
  const [liveRehome,    setLiveRehome]    = useState(null);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const pollRef = useRef(null);

  usePageTitle("Geo Map Dashboard");

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

  const petPollRef = useRef(null);

  useEffect(() => {
    if (!show) return;

    const pollPets = async () => {
      try {
        const updated = await fetchAndGeocodePets();
        if (updated) {
          setMissingPets(prev => {
            if (prev.length !== updated.length) return updated;
            const prevIds = new Set(prev.map(p => String(p.id)));
            const hasNew  = updated.some(p => !prevIds.has(String(p.id)));
            return hasNew ? updated : prev;
          });
        }
      } catch (err) {
        console.error("[GeoMapPanel] pet poll error:", err);
      }
    };

    pollPets();
    petPollRef.current = setInterval(pollPets, 30_000);
    return () => clearInterval(petPollRef.current);
  }, [show]);

  const [filter,      setFilter]      = useState("all");
  const [areaFilter,  setAreaFilter]  = useState("all");   // replaces provFilter
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
  const geoProvince = u._geo?.province || "";
  const geoCity     = u._geo?.city     || "";
  const rawCity     = u.city           || "";
  const rawProvince = u.province       || "";
  const isBaguio    =
    geoCity.toLowerCase().includes("baguio") ||
    rawCity.toLowerCase().includes("baguio");

  let areaMatch = true;
  if (areaFilter !== "all") {
    if (areaFilter === "Baguio City") {
      areaMatch = isBaguio;
    } else {
      areaMatch =
        !isBaguio &&
        (geoProvince.toLowerCase() === areaFilter.toLowerCase() ||
         rawProvince.toLowerCase() === areaFilter.toLowerCase());
    }
  }

  const mf = filter === "all" || (filter === "active" ? u.is_active : !u.is_active);
  const ms = !search ||
    `${u.first_name} ${u.last_name} ${u.city || ""} ${u.province || ""} ${u.address || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

  return mf && areaMatch && ms;
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

  // ── Area stat cards (CAR areas) ───────────────────────────────────────────
  const areaStats = Object.keys(CAR_AREAS).map(area => {
  const match = (u) => {
    const geoProvince = u._geo?.province || "";
    const geoCity     = u._geo?.city     || "";
    const rawCity     = u.city           || "";
    const rawProvince = u.province       || "";

    if (area === "Baguio City") {
      return (
        geoCity.toLowerCase().includes("baguio") ||
        rawCity.toLowerCase().includes("baguio")
      );
    }

    const isBaguio =
      geoCity.toLowerCase().includes("baguio") ||
      rawCity.toLowerCase().includes("baguio");

    return (
      !isBaguio &&
      (geoProvince.toLowerCase() === area.toLowerCase() ||
       rawProvince.toLowerCase() === area.toLowerCase())
    );
  };

  return {
    name:   area,
    color:  CAR_AREAS[area].color,
    count:  geocodedUsers.filter(match).length,
    active: geocodedUsers.filter(u => match(u) && u.is_active).length,
  };
});

  const brgCount = geocodedUsers.filter(u =>
    u._geo?.precision === "barangay" || u._geo?.precision === "street"
  ).length;

  const activeAdoptions = (liveAdoptions ?? adoptions).filter(a => a.status === "Pending").length;
  const activeRehome    = (liveRehome    ?? rehome).filter(r => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap pb-5 border-b border-[rgba(180,140,60,0.18)]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B45A22] mb-1.5 flex items-center gap-1.5">
            <GeoIcons.Map /> Cordillera Administrative Region
          </p>
          <h2 className="text-[clamp(1.15rem,4vw,1.5rem)] font-black text-green-900 leading-tight tracking-tight m-0"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Baguio City &amp; CAR — Geo Map
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <SyncBadge status={syncStatus} />
            {lastUpdated && (
              <span className="inline-flex items-center text-[10px] font-semibold text-gray-400">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                <RealtimeDot />
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "active", "inactive"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                filter === f
                  ? "bg-green-900 border-green-900 text-white shadow-sm"
                  : "bg-transparent border-[rgba(180,140,60,0.28)] text-green-700 hover:bg-[rgba(90,170,48,0.07)]"
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>


      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { val: rawUsers.length, label: "Total Users",       Icon: GeoIcons.Users,  cls: "bg-green-50 ring-green-200 text-green-700",   live: false },
          { val: brgCount,        label: "High Precision",    Icon: GeoIcons.Pin,    cls: "bg-teal-50 ring-teal-200 text-teal-700",       live: false },
          { val: activeAdoptions, label: "Pending Adoptions", Icon: GeoIcons.Heart,  cls: "bg-rose-50 ring-rose-200 text-rose-700",       live: true  },
          { val: activeRehome,    label: "Pending Rehome",    Icon: GeoIcons.Home,   cls: "bg-orange-50 ring-orange-200 text-orange-700", live: true  },
        ].map(({ val, label, Icon, cls, live }) => (
          <div key={label} className={`rounded-xl p-3 flex items-center gap-2.5 ring-1 ${cls}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 flex-shrink-0 opacity-80">
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-0.5">
                <p className="text-xl font-black leading-none text-green-900">{val}</p>
                {live && <RealtimeDot />}
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Geocoding progress ─────────────────────────────────────────── */}
      {geocodingProgress.active && (
        <GeocodingProgress done={geocodingProgress.done} total={geocodingProgress.total} />
      )}

      {/* ── Missing Pets layer controls ───────────────────────────────── */}
      <div className="rounded-xl p-3 bg-[rgba(255,252,232,0.9)] ring-1 ring-[rgba(180,140,60,0.22)]">
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
              <p className="text-xs font-black text-green-900 flex items-center gap-1.5">
                <GeoIcons.Paw size={11} /> Missing Pets Layer
              </p>
              <p className="text-[10px] font-semibold text-gray-400">
                {showPets ? `${fPets.length} of ${missingPets.length} reports` : "Layer hidden"}
              </p>
            </div>
          </div>

          {showPets && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex gap-0.5 rounded-full p-0.5 bg-white ring-1 ring-amber-200">
                {[["all", "All"], ["lost", "Lost"], ["found", "Found"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setMpType(v)}
                    className="px-3 py-1 rounded-full text-xs font-extrabold border-none cursor-pointer transition-colors"
                    style={{
                      background: mpType === v ? (v === "lost" ? "#c03030" : v === "found" ? "#1a6b3c" : "#B45A22") : "transparent",
                      color: mpType === v ? "#fff" : "#3a5020",
                    }}
                  >
                    {l} {v !== "all" && mc[v] > 0 && `(${mc[v]})`}
                  </button>
                ))}
              </div>
              
            </div>
          )}
        </div>

        {showPets && (
          <div className="flex gap-4 flex-wrap mt-2.5 pt-2.5 border-t border-[rgba(180,140,60,0.15)] items-center">
            {[
              { color: "#dc2626", label: "Lost" },
              { color: "#14532d", label: "Found" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full ring-1 ring-white" style={{ background: color }} />
                <span className="text-[10px] font-bold text-green-800">{label}</span>
              </div>
            ))}
            <div className="hidden sm:flex gap-3 ml-auto flex-wrap">
              {[
                { color: "#0891b2", label: "Street-level" },
                { color: "#d97706", label: "City-level" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] font-semibold text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Map + Sidebar ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-3">

        {/* Map card */}
        <div className="rounded-2xl overflow-hidden ring-1 ring-green-200 shadow-md">

          {/* Search bar */}
          <div className="px-3 py-2 flex items-center gap-2 bg-[rgba(255,252,232,0.95)] border-b border-[rgba(180,140,60,0.15)]">
            <span className="text-gray-400 flex-shrink-0"><GeoIcons.Search size={13} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, city, barangay, address…"
              className="flex-1 border-none bg-transparent outline-none text-xs font-semibold text-green-950 placeholder:text-gray-300 min-w-0" />
            {search && (
              <button onClick={() => setSearch("")} className="border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600 flex-shrink-0">
                <GeoIcons.X size={11} />
              </button>
            )}
            <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">{fUsers.length} users</span>
            {showPets && <span className="text-[10px] font-bold text-amber-600 flex-shrink-0">{fPets.length} pets</span>}
            <button onClick={() => setSidebarOpen(v => !v)}
              className="lg:hidden ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold border border-[rgba(180,140,60,0.28)] text-green-700 bg-transparent cursor-pointer hover:bg-amber-100 transition-colors">
              <GeoIcons.Menu size={12} />
            </button>
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

          {/* Legend footer — CAR areas */}
          <div className="px-3 py-2 flex items-center gap-2.5 flex-wrap bg-[rgba(255,252,232,0.95)] border-t border-[rgba(180,140,60,0.15)]">
            {Object.entries(CAR_AREAS).map(([area, cfg]) => (
              <div key={area} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                <span className="text-[9px] font-bold text-green-800 whitespace-nowrap">{area}</span>
              </div>
            ))}
            <span className="text-[9px] text-gray-300 ml-auto hidden sm:block">© OpenStreetMap · Leaflet</span>
          </div>
        </div>

        {/* User sidebar */}
        <div className={`rounded-2xl overflow-hidden flex-col ring-1 ring-amber-200 bg-amber-50 ${
          sidebarOpen ? "flex" : "hidden lg:flex"
        }`}>
          <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between bg-[rgba(255,252,232,0.95)] border-b border-[rgba(180,140,60,0.15)]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-900 flex items-center gap-1.5">
                <GeoIcons.Users size={11} /> Users ({fUsers.length})
              </p>
              {showPets && (
                <p className="text-[10px] font-semibold text-amber-600 mt-0.5 flex items-center gap-1">
                  <GeoIcons.Paw size={10} /> {fPets.length} pets on map
                </p>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-6 h-6 flex items-center justify-center border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600">
              <GeoIcons.X size={13} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 max-h-[480px]">
            {fUsers.length === 0 ? (
              <div className="p-8 text-center text-sm font-semibold text-gray-400">No users match filters</div>
            ) : fUsers.map(u => {
              const userArea = u._geo?.province || u._geo?.city || u.city || u.province || "";
              const areaColor = CAR_AREAS[userArea]?.color || "#ccc";
              return (
                <div
                  key={u.id}
                  className="px-4 py-2.5 flex items-center gap-2 border-b border-amber-100/60 hover:bg-amber-100/40 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: u.is_active ? areaColor : "#ccc" }}
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
                  <button onClick={() => setSelected(u)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer bg-green-50 hover:bg-green-100 ring-1 ring-green-200 text-green-700 border-none transition-colors flex-shrink-0"
                    title="View details">
                    <GeoIcons.Eye size={12} />
                  </button>
                  <button onClick={() => setFlyTgt({ lat: u._geo.lat, lng: u._geo.lng })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer bg-green-900 hover:bg-green-800 text-white border-none transition-colors flex-shrink-0"
                    title="Show on map">
                    <GeoIcons.Pin size={12} />
                  </button>
                  {u._geo?.lat && u._geo?.lng && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${u._geo.lat},${u._geo.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white border-none transition-colors flex-shrink-0"
                      title="Get Directions">
                      <GeoIcons.Navigation size={12} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Area Distribution Bar Chart ───────────────────────────────── */}
      <AreaBarChart
        areaStats={areaStats}
        areaFilter={areaFilter}
        onSelect={setAreaFilter}
      />

      

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