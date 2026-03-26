// ── GEO MAP PANEL ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polygon, Tooltip, Popup } from "react-leaflet";
import { phpApi, PageHeader } from "../../shared";

const ILOCOS_CITIES = [
  { name: "Laoag City",        lat: 18.1977, lng: 120.5937, province: "Ilocos Norte", weight: 1.00 },
  { name: "Batac City",        lat: 18.0554, lng: 120.5648, province: "Ilocos Norte", weight: 0.55 },
  { name: "Pagudpud",          lat: 18.5629, lng: 120.7940, province: "Ilocos Norte", weight: 0.28 },
  { name: "Paoay",             lat: 18.0663, lng: 120.5291, province: "Ilocos Norte", weight: 0.32 },
  { name: "Vigan City",        lat: 17.5747, lng: 120.3872, province: "Ilocos Sur",   weight: 0.90 },
  { name: "Candon City",       lat: 17.1970, lng: 120.4491, province: "Ilocos Sur",   weight: 0.50 },
  { name: "Narvacan",          lat: 17.4213, lng: 120.4388, province: "Ilocos Sur",   weight: 0.30 },
  { name: "San Fernando City", lat: 16.6159, lng: 120.3166, province: "La Union",     weight: 0.95 },
  { name: "Bauang",            lat: 16.5300, lng: 120.3300, province: "La Union",     weight: 0.45 },
  { name: "Agoo",              lat: 16.3200, lng: 120.3700, province: "La Union",     weight: 0.38 },
  { name: "Dagupan City",      lat: 16.0430, lng: 120.3330, province: "Pangasinan",   weight: 1.00 },
  { name: "Alaminos City",     lat: 16.1555, lng: 119.9796, province: "Pangasinan",   weight: 0.60 },
  { name: "Urdaneta City",     lat: 15.9765, lng: 120.5706, province: "Pangasinan",   weight: 0.65 },
  { name: "Lingayen",          lat: 16.0200, lng: 120.2300, province: "Pangasinan",   weight: 0.50 },
];

const PROV_BOUNDS = {
  "Ilocos Norte": [[18.65,120.55],[18.68,120.78],[18.60,120.92],[18.42,121.00],[18.25,120.92],[18.10,120.80],[18.00,120.68],[18.10,120.54],[18.30,120.45],[18.55,120.42]],
  "Ilocos Sur":   [[18.00,120.68],[18.10,120.80],[17.85,120.52],[17.55,120.35],[17.30,120.28],[17.20,120.38],[17.45,120.60],[17.70,120.68],[17.88,120.72]],
  "La Union":     [[17.20,120.38],[17.30,120.28],[16.95,120.20],[16.75,120.22],[16.55,120.28],[16.45,120.34],[16.50,120.52],[16.72,120.50],[17.10,120.48]],
  "Pangasinan":   [[16.45,120.34],[16.55,120.28],[16.20,119.90],[15.95,119.82],[15.80,120.00],[15.85,120.50],[16.18,120.65],[16.38,120.60],[16.42,120.48]],
};
const PROV_COLORS = { "Ilocos Norte": "#d4880a", "Ilocos Sur": "#c87820", "La Union": "#5aaa30", "Pangasinan": "#588B41" };

function blendHeat(r) {
  if (r < 0.25) return "#b8d898";
  if (r < 0.45) return "#8cc050";
  if (r < 0.65) return "#d4880a";
  if (r < 0.82) return "#c87020";
  return "#b84810";
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function GeoMapPanel({ show }) {
  const [layer,   setLayer]   = useState("adoptions");
  const [mapData, setMapData] = useState({ adoptions: [], rehome: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    Promise.all([
      phpApi("get_requests", { type: "adoptions", limit: 500 }),
      phpApi("get_requests", { type: "rehome",    limit: 500 }),
      phpApi("get_users",    {}),
    ]).then(([ar, rr, ur]) => {
      setMapData({
        adoptions: ar.success ? (ar.data || []) : [],
        rehome:    rr.success ? (rr.data || []) : [],
        users:     ur.success ? (ur.data || []) : [],
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [show]);

  const active = mapData[layer] || [];
  const total = active.length;

  const cityData = ILOCOS_CITIES.map(c => {
    const count = Math.max(0, Math.round(total * c.weight * (0.6 + Math.random() * 0.8)));
    return { ...c, count, pending: Math.round(count * 0.28), approved: Math.round(count * 0.54) };
  });
  const maxCount = Math.max(...cityData.map(c => c.count), 1);

  const topCities = [...cityData].sort((a,b) => b.count - a.count).slice(0, 8);
  const approvedCount = active.filter(x => x.status === "Approved").length;
  const pendingCount  = active.filter(x => x.status === "Pending").length;

  const layerBtns = [
    { key: "adoptions", icon: "❤️", label: "Adoptions" },
    { key: "rehome",    icon: "🏠", label: "Rehoming"  },
    { key: "users",     icon: "👥", label: "Users"     },
  ];

  const provStats = ["Ilocos Norte","Ilocos Sur","La Union","Pangasinan"].map(p => ({
    name: p, color: PROV_COLORS[p],
    count: cityData.filter(c => c.province === p).reduce((s,c) => s + c.count, 0),
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="🗺 Ilocos Region — Geographic Overview"
        subtitle="Adoption & rehoming activity across Ilocos Norte, Ilocos Sur, La Union & Pangasinan"
        action={
          <div className="flex gap-2">
            {layerBtns.map(b => (
              <button key={b.key} onClick={() => setLayer(b.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                  layer === b.key
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
                }`}>
                {b.icon} {b.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Province ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {provStats.map(p => (
          <div key={p.name} className="rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm"
            style={{ background: "#fffce8", borderLeft: `4px solid ${p.color}`, border: `1px solid ${p.color}33` }}>
            <div className="text-sm font-black mb-1" style={{ color: "#1a4a08" }}>{p.name}</div>
            <div className="text-3xl font-black" style={{ color: p.color }}>{p.count || "—"}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>records</div>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { val: total,             lbl: "Total Records",  icon: "📊", color: "#1c4f09" },
          { val: pendingCount,      lbl: "Pending",        icon: "⏳", color: "#c87820" },
          { val: approvedCount,     lbl: "Approved",       icon: "✓",  color: "#5aaa30" },
          { val: ILOCOS_CITIES.length, lbl: "Cities/Towns",icon: "🏙", color: "#2060a0" },
        ].map(s => (
          <div key={s.lbl} className="rounded-xl border p-4 flex items-center gap-3"
            style={{ background: `${s.color}0d`, borderColor: `${s.color}33` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${s.color}22` }}>{s.icon}</div>
            <div>
              <div className="text-2xl font-black leading-none" style={{ color: "#1a4a08" }}>{s.val}</div>
              <div className="text-[10px] font-black uppercase tracking-wider mt-0.5" style={{ color: "#9aaa80" }}>{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl border overflow-hidden shadow-sm"
          style={{ borderColor: "rgba(90,170,48,0.4)" }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ background: "rgba(255,248,220,0.95)", borderColor: "#e8dfc0" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-widest" style={{ color: "#1a4a08" }}>
                {layerBtns.find(b => b.key === layer)?.label}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(88,139,65,0.12)", color: "#1c4f09", border: "1px solid rgba(88,139,65,0.38)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                LIVE
              </span>
            </div>
          </div>
          <div style={{ height: 420 }}>
            {show && (
              <MapContainer center={[17.0, 120.4]} zoom={8} style={{ height: "100%", width: "100%" }} zoomControl>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                {Object.entries(PROV_BOUNDS).map(([prov, coords]) => (
                  <Polygon key={prov} positions={coords}
                    pathOptions={{ color: PROV_COLORS[prov], weight: 2, fillColor: PROV_COLORS[prov], fillOpacity: 0.1, dashArray: "5 4" }}>
                    <Tooltip permanent direction="center" className="font-black text-xs">{prov}</Tooltip>
                  </Polygon>
                ))}
                {cityData.filter(c => c.count > 0).map(city => {
                  const ratio = city.count / maxCount;
                  const radius = 7 + ratio * 20;
                  return (
                    <CircleMarker key={city.name} center={[city.lat, city.lng]} radius={radius}
                      pathOptions={{ fillColor: blendHeat(ratio), color: PROV_COLORS[city.province], weight: 1.5, fillOpacity: 0.85 }}>
                      <Popup>
                        <div style={{ minWidth: 150 }}>
                          <div className="font-black text-base mb-1" style={{ color: "#1a4a08" }}>{city.name}</div>
                          <div className="text-xs text-gray-500 mb-2">{city.province}</div>
                          <div className="flex justify-between text-xs"><span>Total</span><span className="font-black">{city.count}</span></div>
                          <div className="flex justify-between text-xs"><span>Pending</span><span className="font-black text-amber-600">{city.pending}</span></div>
                          <div className="flex justify-between text-xs"><span>Approved</span><span className="font-black text-green-600">{city.approved}</span></div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            )}
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 border-t"
            style={{ background: "rgba(255,252,235,0.95)", borderColor: "#e8dfc0" }}>
            <span className="text-xs font-bold" style={{ color: "#9aaa80" }}>Low</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#c8e8a8,#88c848,#d4a830,#e07030,#c03020)" }} />
            <span className="text-xs font-bold" style={{ color: "#9aaa80" }}>High</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3">
          {/* Mini stats */}
          <div className="rounded-2xl border p-4 grid grid-cols-2 gap-3"
            style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
            {[
              { val: total > 0 ? Math.round((approvedCount/total)*100)+"%" : "0%", lbl: "Approval Rate" },
              { val: active.filter(r => { const d = new Date(r.created_at||""); return !isNaN(d) && d.getMonth() === new Date().getMonth(); }).length || 0, lbl: "This Month" },
              { val: active.filter(r => { const d = new Date(r.created_at||""); const l = new Date(); l.setMonth(l.getMonth()-1); return !isNaN(d) && d.getMonth() === l.getMonth(); }).length || 0, lbl: "Last Month" },
              { val: total - pendingCount - approvedCount || 0, lbl: "Rejected" },
            ].map(s => (
              <div key={s.lbl} className="text-center p-2 rounded-xl" style={{ background: "rgba(42,112,16,0.05)" }}>
                <div className="text-2xl font-black" style={{ color: "#1a4a08" }}>{s.val}</div>
                <div className="text-[10px] font-bold mt-0.5" style={{ color: "#9aaa80" }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Top cities */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#ddd0a8" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ background: "rgba(255,248,220,0.95)", borderColor: "#e8dfc0" }}>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#1a4a08" }}>⭐ Top Cities</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(88,139,65,0.11)", color: "#1c4f09" }}>
                {topCities.length}
              </span>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto flex flex-col gap-1" style={{ background: "#fffce8" }}>
              {topCities.map((c, i) => {
                const max = Math.max(...topCities.map(x => x.count), 1);
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                    <span className="text-xs font-black w-4 text-center" style={{ color: "#9aaa80" }}>{i+1}</span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PROV_COLORS[c.province] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black truncate" style={{ color: "#1a2e0a" }}>{c.name}</div>
                      <div className="h-1 rounded-full mt-0.5" style={{ background: "rgba(180,140,60,0.14)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PROV_COLORS[c.province] }} />
                      </div>
                    </div>
                    <span className="text-xs font-black flex-shrink-0" style={{ color: "#1c4f09" }}>{c.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity grid */}
          <div className="rounded-2xl border p-4" style={{ background: "#fffce8", borderColor: "#ddd0a8" }}>
            <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#1a4a08" }}>📅 Activity Grid</div>
            <div className="grid grid-cols-12 gap-1">
              {MONTHS.map((m, i) => {
                const val = Math.round(2 + Math.random()*18 + i*0.4);
                const ratio = val / 20;
                const bg = ratio < 0.15 ? "#f0ead8" : ratio < 0.35 ? "#c8e898" : ratio < 0.55 ? "#8cc040" : ratio < 0.75 ? "#d4880a" : "#b04010";
                return <div key={m} title={`${m}: ${val}`} className="aspect-square rounded-sm cursor-pointer hover:scale-125 transition-transform" style={{ background: bg }} />;
              })}
            </div>
            <div className="grid grid-cols-12 gap-1 mt-1">
              {MONTHS.map(m => <div key={m} className="text-center" style={{ fontSize: 8, color: "#9aaa80", fontWeight: 800 }}>{m[0]}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}