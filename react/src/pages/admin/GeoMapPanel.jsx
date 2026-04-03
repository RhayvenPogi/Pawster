// ── GEO MAP PANEL — MapLibre GL JS + Nominatim OSM Geocoder (accurate) ──
import { useState, useEffect, useRef, useCallback } from "react";
import { phpApi, PageHeader } from "../../shared";

const ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMxNDExZDdhZGUzOTQ5YmM5ZjNkMzc5ZGU0MTZlNjc2IiwiaCI6Im11cm11cjY0In0=";
const ILOCOS_CENTER = [120.45, 17.0];
const ILOCOS_ZOOM   = 7.8;

const PROVINCES = {
  "Ilocos Norte": { color: "#d4880a", center: [120.594, 18.197] },
  "Ilocos Sur":   { color: "#c87820", center: [120.387, 17.575] },
  "La Union":     { color: "#5aaa30", center: [120.317, 16.616] },
  "Pangasinan":   { color: "#588B41", center: [120.333, 16.043] },
};

// ─────────────────────────────────────────────────────────────────────────────
// GEOCODER — Nominatim OSM (full street + house number + barangay accuracy)
// ─────────────────────────────────────────────────────────────────────────────

const ILOCOS_BBOX = { minLat:15.50, maxLat:18.70, minLng:119.60, maxLng:121.00 };

const PROVINCE_CENTERS = {
  "Ilocos Norte": { lat:18.1977, lng:120.5937 },
  "Ilocos Sur":   { lat:17.5747, lng:120.3872 },
  "La Union":     { lat:16.6159, lng:120.3166 },
  "Pangasinan":   { lat:16.0430, lng:120.3330 },
};

// Instant city-center fallback — no API call needed for city-level
const CITY_CENTERS = {
  // Ilocos Norte
  "laoag":{ lat:18.1977, lng:120.5937, province:"Ilocos Norte" },
  "laoag city":{ lat:18.1977, lng:120.5937, province:"Ilocos Norte" },
  "batac":{ lat:18.0554, lng:120.5648, province:"Ilocos Norte" },
  "batac city":{ lat:18.0554, lng:120.5648, province:"Ilocos Norte" },
  "pagudpud":{ lat:18.5629, lng:120.7940, province:"Ilocos Norte" },
  "paoay":{ lat:18.0663, lng:120.5291, province:"Ilocos Norte" },
  "bangui":{ lat:18.5333, lng:120.7667, province:"Ilocos Norte" },
  "vintar":{ lat:18.2333, lng:120.6500, province:"Ilocos Norte" },
  "pasuquin":{ lat:18.3333, lng:120.6167, province:"Ilocos Norte" },
  "bacarra":{ lat:18.2500, lng:120.6167, province:"Ilocos Norte" },
  "piddig":{ lat:18.1667, lng:120.7000, province:"Ilocos Norte" },
  "sarrat":{ lat:18.1667, lng:120.6333, province:"Ilocos Norte" },
  "dingras":{ lat:18.1000, lng:120.6833, province:"Ilocos Norte" },
  "nueva era":{ lat:17.9333, lng:120.6667, province:"Ilocos Norte" },
  "marcos":{ lat:18.0333, lng:120.7000, province:"Ilocos Norte" },
  "espiritu":{ lat:18.2167, lng:120.5333, province:"Ilocos Norte" },
  "badoc":{ lat:17.9167, lng:120.4667, province:"Ilocos Norte" },
  "currimao":{ lat:17.9833, lng:120.4833, province:"Ilocos Norte" },
  "pinili":{ lat:18.0167, lng:120.6167, province:"Ilocos Norte" },
  "solsona":{ lat:18.0167, lng:120.7833, province:"Ilocos Norte" },
  "adams":{ lat:18.4500, lng:120.9167, province:"Ilocos Norte" },
  "carasi":{ lat:18.0167, lng:120.8333, province:"Ilocos Norte" },
  "dumalneg":{ lat:18.3667, lng:120.8667, province:"Ilocos Norte" },
  "banna":{ lat:18.1167, lng:120.6500, province:"Ilocos Norte" },
  "san nicolas":{ lat:18.1733, lng:120.5933, province:"Ilocos Norte" },
  "burgos":{ lat:18.5167, lng:120.6500, province:"Ilocos Norte" },
  // Ilocos Sur
  "vigan":{ lat:17.5747, lng:120.3872, province:"Ilocos Sur" },
  "vigan city":{ lat:17.5747, lng:120.3872, province:"Ilocos Sur" },
  "candon":{ lat:17.1970, lng:120.4491, province:"Ilocos Sur" },
  "candon city":{ lat:17.1970, lng:120.4491, province:"Ilocos Sur" },
  "narvacan":{ lat:17.4213, lng:120.4388, province:"Ilocos Sur" },
  "bantay":{ lat:17.6000, lng:120.3833, province:"Ilocos Sur" },
  "sinait":{ lat:17.8500, lng:120.4333, province:"Ilocos Sur" },
  "tagudin":{ lat:16.9333, lng:120.4500, province:"Ilocos Sur" },
  "cabugao":{ lat:17.7833, lng:120.4000, province:"Ilocos Sur" },
  "magsingal":{ lat:17.6833, lng:120.4167, province:"Ilocos Sur" },
  "caoayan":{ lat:17.5333, lng:120.4000, province:"Ilocos Sur" },
  "santa":{ lat:17.4667, lng:120.4333, province:"Ilocos Sur" },
  "cervantes":{ lat:17.0167, lng:120.7667, province:"Ilocos Sur" },
  "lidlidda":{ lat:17.0833, lng:120.5333, province:"Ilocos Sur" },
  "nagbukel":{ lat:17.2167, lng:120.5000, province:"Ilocos Sur" },
  "san emilio":{ lat:17.1500, lng:120.6000, province:"Ilocos Sur" },
  "san esteban":{ lat:17.5833, lng:120.3667, province:"Ilocos Sur" },
  "san ildefonso":{ lat:17.2000, lng:120.5833, province:"Ilocos Sur" },
  "santa lucia":{ lat:17.1333, lng:120.4667, province:"Ilocos Sur" },
  "santa maria":{ lat:17.3667, lng:120.4667, province:"Ilocos Sur" },
  "santiago":{ lat:17.3167, lng:120.4500, province:"Ilocos Sur" },
  "sigay":{ lat:17.0667, lng:120.5833, province:"Ilocos Sur" },
  "sugpon":{ lat:16.9500, lng:120.5667, province:"Ilocos Sur" },
  "suyo":{ lat:16.9000, lng:120.5167, province:"Ilocos Sur" },
  "galimuyod":{ lat:17.1667, lng:120.5333, province:"Ilocos Sur" },
  // La Union
  "san fernando":{ lat:16.6159, lng:120.3166, province:"La Union" },
  "san fernando city":{ lat:16.6159, lng:120.3166, province:"La Union" },
  "bauang":{ lat:16.5300, lng:120.3300, province:"La Union" },
  "agoo":{ lat:16.3200, lng:120.3700, province:"La Union" },
  "aringay":{ lat:16.3833, lng:120.3500, province:"La Union" },
  "caba":{ lat:16.4833, lng:120.3500, province:"La Union" },
  "naguilian":{ lat:16.5500, lng:120.3833, province:"La Union" },
  "luna":{ lat:16.8667, lng:120.3667, province:"La Union" },
  "balaoan":{ lat:16.8167, lng:120.3833, province:"La Union" },
  "bacnotan":{ lat:16.7333, lng:120.3500, province:"La Union" },
  "tubao":{ lat:16.4500, lng:120.4167, province:"La Union" },
  "pugo":{ lat:16.4667, lng:120.4833, province:"La Union" },
  "rosario":{ lat:16.2167, lng:120.4833, province:"La Union" },
  "santo tomas":{ lat:16.3500, lng:120.3333, province:"La Union" },
  "san gabriel":{ lat:16.7000, lng:120.4333, province:"La Union" },
  "santol":{ lat:16.7667, lng:120.4333, province:"La Union" },
  "sudipen":{ lat:16.7333, lng:120.5167, province:"La Union" },
  "bagulin":{ lat:16.6167, lng:120.4500, province:"La Union" },
  "bangar":{ lat:16.8833, lng:120.4167, province:"La Union" },
  "san juan":{ lat:16.6500, lng:120.3200, province:"La Union" },
  // Pangasinan
  "dagupan":{ lat:16.0430, lng:120.3330, province:"Pangasinan" },
  "dagupan city":{ lat:16.0430, lng:120.3330, province:"Pangasinan" },
  "alaminos":{ lat:16.1555, lng:119.9796, province:"Pangasinan" },
  "alaminos city":{ lat:16.1555, lng:119.9796, province:"Pangasinan" },
  "urdaneta":{ lat:15.9765, lng:120.5706, province:"Pangasinan" },
  "urdaneta city":{ lat:15.9765, lng:120.5706, province:"Pangasinan" },
  "lingayen":{ lat:16.0200, lng:120.2300, province:"Pangasinan" },
  "san carlos":{ lat:15.9255, lng:120.3486, province:"Pangasinan" },
  "san carlos city":{ lat:15.9255, lng:120.3486, province:"Pangasinan" },
  "calasiao":{ lat:16.0100, lng:120.3600, province:"Pangasinan" },
  "manaoag":{ lat:15.9700, lng:120.4900, province:"Pangasinan" },
  "pozorrubio":{ lat:16.1167, lng:120.5500, province:"Pangasinan" },
  "sison":{ lat:16.1833, lng:120.5333, province:"Pangasinan" },
  "umingan":{ lat:15.9167, lng:120.8000, province:"Pangasinan" },
  "tayug":{ lat:15.9500, lng:120.7333, province:"Pangasinan" },
  "laoac":{ lat:15.8500, lng:120.5500, province:"Pangasinan" },
  "malasiqui":{ lat:15.9167, lng:120.4167, province:"Pangasinan" },
  "mangaldan":{ lat:16.0667, lng:120.4333, province:"Pangasinan" },
  "mapandan":{ lat:16.0833, lng:120.4500, province:"Pangasinan" },
  "rosales":{ lat:15.8833, lng:120.6333, province:"Pangasinan" },
  "san fabian":{ lat:16.1167, lng:120.3833, province:"Pangasinan" },
  "villasis":{ lat:15.9000, lng:120.5833, province:"Pangasinan" },
  "sual":{ lat:16.0667, lng:120.1000, province:"Pangasinan" },
  "bolinao":{ lat:16.3833, lng:119.8833, province:"Pangasinan" },
  "dasol":{ lat:15.9833, lng:119.8833, province:"Pangasinan" },
  "masinloc":{ lat:15.5333, lng:119.9500, province:"Pangasinan" },
};

const PROV_MAP = {
  "ilocos norte":"Ilocos Norte","iln":"Ilocos Norte",
  "ilocos sur":"Ilocos Sur","ils":"Ilocos Sur",
  "la union":"La Union","lau":"La Union",
  "pangasinan":"Pangasinan","pan":"Pangasinan",
};

// In-memory cache — avoids duplicate Nominatim calls across renders
const _geoCache = new Map();
let _lastNomCall = 0;

function inRegion(lat, lng) {
  return lat >= ILOCOS_BBOX.minLat && lat <= ILOCOS_BBOX.maxLat &&
         lng >= ILOCOS_BBOX.minLng && lng <= ILOCOS_BBOX.maxLng;
}

function guessProvFromCoords(lat, lng) {
  if (lat >= 18.0) return "Ilocos Norte";
  if (lat >= 17.0) return "Ilocos Sur";
  if (lat >= 16.3) return "La Union";
  if (lat >= 15.7) return "Pangasinan";
  return null;
}

function detectProvince(text) {
  const t = (text || "").toLowerCase();
  for (const [k, v] of Object.entries(PROV_MAP)) {
    if (t.includes(k)) return v;
  }
  return null;
}

function jitter(amt = 0.003) { return (Math.random() - 0.5) * amt; }

function precisionFromType(type) {
  if (!type) return "city";
  if (["house","building","residential"].includes(type)) return "street";
  if (["suburb","quarter","neighbourhood","hamlet","village","amenity"].includes(type)) return "barangay";
  if (["city","town","municipality","administrative"].includes(type)) return "city";
  return "city";
}

async function nominatim(query) {
  const key = query.toLowerCase().trim();
  if (_geoCache.has(key)) return _geoCache.get(key);

  // Throttle: Nominatim ToS requires max 1 req/sec
  const wait = 1150 - (Date.now() - _lastNomCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastNomCall = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&format=jsonv2&limit=5&countrycodes=ph` +
      `&viewbox=${ILOCOS_BBOX.minLng},${ILOCOS_BBOX.maxLat},${ILOCOS_BBOX.maxLng},${ILOCOS_BBOX.minLat}&bounded=0`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "IlocosMapApp/1.0" }
    });
    if (!res.ok) { _geoCache.set(key, null); return null; }
    const data = await res.json();
    // Prefer results inside Ilocos region bounding box
    const hit = data.find(r => inRegion(parseFloat(r.lat), parseFloat(r.lon))) || data[0];
    if (!hit) { _geoCache.set(key, null); return null; }
    const result = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), displayName: hit.display_name, type: hit.type };
    _geoCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

async function geocodeAddress(address, city, province) {
  const prov = detectProvince(`${province||""} ${city||""} ${address||""}`);
  const addr = (address || "").trim();
  const cty  = (city || "").trim();

  // Fast path: no address — use instant city center lookup
  if (!addr && cty) {
    const c = CITY_CENTERS[cty.toLowerCase()];
    if (c) return { lat: c.lat + jitter(), lng: c.lng + jitter(), province: c.province || prov, inRegion: true, precision: "city" };
  }

  // Build progressive query list (most specific → least)
  const queries = [];
  if (addr && cty) {
    queries.push(`${addr}, ${cty}, ${province || "Ilocos Region"}, Philippines`);
    // Strip leading house number
    const stripped = addr.replace(/^\d+[\s\-,]*/, "").trim();
    if (stripped && stripped !== addr) {
      queries.push(`${stripped}, ${cty}, ${province || "Ilocos Region"}, Philippines`);
    }
  }
  if (addr && province) queries.push(`${addr}, ${province}, Philippines`);
  if (cty) queries.push(`${cty}, ${province || "Ilocos Region"}, Philippines`);

  for (const q of queries) {
    const r = await nominatim(q);
    if (r && inRegion(r.lat, r.lng)) {
      return {
        lat: r.lat + jitter(0.001),
        lng: r.lng + jitter(0.001),
        province: prov || guessProvFromCoords(r.lat, r.lng),
        inRegion: true,
        precision: precisionFromType(r.type),
        nominatimLabel: r.displayName,
      };
    }
  }

  // Fallback: city center table
  const cLow = cty.toLowerCase();
  if (CITY_CENTERS[cLow]) {
    const c = CITY_CENTERS[cLow];
    return { lat: c.lat + jitter(0.008), lng: c.lng + jitter(0.008), province: c.province || prov, inRegion: true, precision: "city" };
  }

  // Fallback: province center
  if (prov && PROVINCE_CENTERS[prov]) {
    const p = PROVINCE_CENTERS[prov];
    return { lat: p.lat + jitter(0.05), lng: p.lng + jitter(0.05), province: prov, inRegion: true, precision: "province" };
  }

  return { inRegion: false };
}

async function geocodeUser(user) {
  return geocodeAddress(user.address, user.city, user.province);
}

async function geocodePet(pet) {
  if (pet.latitude && pet.longitude) {
    const lat = parseFloat(pet.latitude), lng = parseFloat(pet.longitude);
    if (lat > 4 && lat < 22 && lng > 116 && lng < 127 && inRegion(lat, lng))
      return { lat, lng, province: guessProvFromCoords(lat, lng), inRegion: true, precision: "gps" };
  }
  const r = await geocodeAddress(pet.address, pet.area, null);
  if (r.inRegion) return r;
  return geocodeAddress(pet.area, null, null);
}

async function geocodeText(text) {
  const queries = [
    `${text}, Philippines`,
    `${text}, Ilocos Region, Philippines`,
  ];
  for (const q of queries) {
    const r = await nominatim(q);
    if (r) return { lat: r.lat, lng: r.lng, label: r.displayName || text };
  }
  throw new Error(`"${text}" not found. Try: "Rizal St, Laoag City", "Brgy 2, Vigan City Ilocos Sur"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// ORS Routing
// ─────────────────────────────────────────────────────────────────────────────
async function getRoute(sLat, sLng, eLat, eLng) {
  const res = await fetch("/ors/v2/directions/driving-car/geojson", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": ORS_KEY },
    body: JSON.stringify({ coordinates: [[sLng, sLat], [eLng, eLat]], instructions: true, instructions_format: "text" }),
  });
  if (!res.ok) throw new Error("Routing failed");
  const d = await res.json();
  const f = d.features[0];
  const s = f.properties.summary;
  const steps = f.properties.segments?.flatMap(x => x.steps || []) || [];
  return { coords: f.geometry.coordinates, distance: (s.distance / 1000).toFixed(1), duration: Math.round(s.duration / 60), steps, totalMetres: s.distance };
}

// ─────────────────────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────────────────────
function hM(a, b) { const R=6371000,r=d=>d*Math.PI/180;const dLat=r(b[1]-a[1]),dLng=r(b[0]-a[0]);const s=Math.sin(dLat/2)**2+Math.cos(r(a[1]))*Math.cos(r(b[1]))*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s)); }
function snap(coords, lat, lng) { let b=0,bd=Infinity;coords.forEach(([cL,cA],i)=>{const d=hM([cL,cA],[lng,lat]);if(d<bd){bd=d;b=i;}});return b; }
function remKm(coords, i) { let d=0;for(let j=i;j<coords.length-1;j++)d+=hM(coords[j],coords[j+1]);return d/1000; }
function nxtTurn(steps, tm) { let c=0;for(const s of steps){c+=s.distance||0;if(tm<c){const d=c-tm;return{instruction:s.instruction||"Continue",distToTurn:d<1000?`${Math.round(d)} m`:`${(d/1000).toFixed(1)} km`};}}return{instruction:"You have arrived!",distToTurn:""}; }
function tIcon(ins) { const i=(ins||"").toLowerCase();if(i.includes("left"))return"↰";if(i.includes("right"))return"↱";if(i.includes("u-turn"))return"↩";if(i.includes("roundabout"))return"⟳";if(i.includes("arrive")||i.includes("destination"))return"🏁";return"↑"; }
function pColor(p) { return PROVINCES[p]?.color || "#2a7010"; }

// ─────────────────────────────────────────────────────────────────────────────
// MapView
// ─────────────────────────────────────────────────────────────────────────────
function MapView({ users, missingPets, showMissingLayer, route, navActive, vehiclePos, onSelectUser, onSelectMp, flyTarget, mapRef }) {
  const cRef = useRef(null);
  const mRef = useRef(null);
  const uM = useRef([]), pM = useRef([]), vM = useRef(null), sM = useRef(null), eM = useRef(null);

  useEffect(() => {
    if (document.getElementById("ml-css")) return;
    const l = document.createElement("link"); l.id = "ml-css"; l.rel = "stylesheet";
    l.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.id = "ml-js";
    s.src = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"; s.async = true; document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const init = () => {
      if (!cRef.current || mRef.current) return;
      const m = new window.maplibregl.Map({ container: cRef.current, style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", center: ILOCOS_CENTER, zoom: ILOCOS_ZOOM, attributionControl: false });
      m.addControl(new window.maplibregl.NavigationControl(), "top-right");
      m.addControl(new window.maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
      m.addControl(new window.maplibregl.AttributionControl({ compact: true }), "bottom-right");
      mRef.current = m; if (mapRef) mapRef.current = m;
      m.on("load", () => {
        m.addSource("rt", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "rt-bg", type: "line", source: "rt", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#000", "line-width": 10, "line-opacity": 0.09 } });
        m.addLayer({ id: "rt-line", type: "line", source: "rt", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "#5aaa30", "line-width": 5, "line-opacity": 0.88 } });
      });
    };
    if (window.maplibregl) { init(); return; }
    const p = setInterval(() => { if (window.maplibregl) { clearInterval(p); init(); } }, 200);
    return () => clearInterval(p);
  }, []);

  useEffect(() => { if (!flyTarget || !mRef.current) return; mRef.current.flyTo({ center: [flyTarget.lng, flyTarget.lat], zoom: 14, speed: 1.5 }); }, [flyTarget]);

  useEffect(() => {
    const m = mRef.current; if (!m) return;
    const apply = () => {
      const src = m.getSource("rt"); if (!src) return;
      sM.current?.remove(); eM.current?.remove(); sM.current = null; eM.current = null;
      if (!route?.coords?.length) { src.setData({ type: "FeatureCollection", features: [] }); return; }
      src.setData({ type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.coords } }] });
      if (!navActive) { const ls = route.coords.map(c => c[0]), lts = route.coords.map(c => c[1]); m.fitBounds([[Math.min(...ls) - 0.01, Math.min(...lts) - 0.01], [Math.max(...ls) + 0.01, Math.max(...lts) + 0.01]], { padding: 60, duration: 900 }); }
      const mkE = (t, bg) => { const e = document.createElement("div"); e.style.cssText = `width:28px;height:28px;border-radius:50%;background:${bg};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:900;`; e.textContent = t; return e; };
      const [sLng, sLat] = route.coords[0]; const [eLng, eLat] = route.coords[route.coords.length - 1];
      sM.current = new window.maplibregl.Marker({ element: mkE("A", "#1c4f09"), anchor: "center" }).setLngLat([sLng, sLat]).addTo(m);
      eM.current = new window.maplibregl.Marker({ element: mkE("B", "#c03030"), anchor: "center" }).setLngLat([eLng, eLat]).addTo(m);
    };
    if (m.isStyleLoaded()) apply(); else m.once("load", apply);
  }, [route, navActive]);

  useEffect(() => {
    const m = mRef.current; if (!m || !window.maplibregl) return;
    uM.current.forEach(x => x.remove()); uM.current = [];
    users.forEach(u => {
      const c = pColor(u._geo?.province);
      const pr = u._geo?.precision;
      const ring = pr === "street" ? "#00e5ff" : pr === "barangay" ? "#fff" : pr === "city" ? "#ffe082" : "#ffcc80";
      const sz = u.is_active ? 14 : 9;
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${u.is_active ? c : "#aaa"};border:2.5px solid ${ring};box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;transition:transform 0.15s;opacity:${u.is_active ? 0.92 : 0.55};"></div>`;
      el.style.cssText = "cursor:pointer;";
      el.title = `${u.first_name} ${u.last_name} — ${u.city || ""}`;
      el.addEventListener("mouseenter", () => el.firstChild.style.transform = "scale(1.9)");
      el.addEventListener("mouseleave", () => el.firstChild.style.transform = "scale(1)");
      el.addEventListener("click", () => onSelectUser(u));
      const mk = new window.maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([u._geo.lng, u._geo.lat]).addTo(m);
      uM.current.push(mk);
    });
  }, [users]);

  useEffect(() => {
    const m = mRef.current; if (!m) return;
    pM.current.forEach(x => x.remove()); pM.current = [];
    if (!showMissingLayer || !window.maplibregl) return;
    missingPets.forEach(pet => {
      const isL = pet.type === "lost";
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:${isL ? "#c03030" : "#1c4f09"};border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:900;transition:transform 0.15s;">${isL ? "!" : "✓"}</div>`;
      el.style.cssText = "cursor:pointer;width:20px;height:20px;";
      el.title = `${isL ? "LOST" : "FOUND"}: ${pet.name || "Unknown"} — ${pet.area || ""}`;
      el.addEventListener("mouseenter", () => el.firstChild.style.transform = "scale(1.7)");
      el.addEventListener("mouseleave", () => el.firstChild.style.transform = "scale(1)");
      el.addEventListener("click", () => onSelectMp(pet));
      const mk = new window.maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([pet._geo.lng, pet._geo.lat]).addTo(m);
      pM.current.push(mk);
    });
  }, [missingPets, showMissingLayer]);

  useEffect(() => {
    const m = mRef.current; if (!m || !window.maplibregl) return;
    if (!navActive || !vehiclePos) { vM.current?.remove(); vM.current = null; return; }
    if (!vM.current) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#1c4f09;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(28,79,9,0.55);">🚗</div>`;
      el.style.cssText = "width:36px;height:36px;";
      vM.current = new window.maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([vehiclePos.lng, vehiclePos.lat]).addTo(m);
    } else vM.current.setLngLat([vehiclePos.lng, vehiclePos.lat]);
    m.panTo([vehiclePos.lng, vehiclePos.lat], { duration: 600 });
  }, [vehiclePos, navActive]);

  return <div ref={cRef} style={{ height: "100%", width: "100%" }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data, color = "#2a7010" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${Math.max(4, (d.value / max) * 52)}px`, background: color, opacity: .85 }} />
          <span style={{ fontSize: 9, color: "#9aaa80", fontWeight: 700 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Geocoding progress bar shown while async geocoding runs
function GeocodingProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ padding: "1rem 1.2rem", background: "rgba(42,112,16,.05)", border: "1px solid rgba(42,112,16,.18)", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#1a4a08" }}>📍 Geocoding addresses via OpenStreetMap…</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#5aaa30" }}>{done} / {total}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(42,112,16,.1)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#1c4f09,#5aaa30)", borderRadius: 3, transition: "width .3s ease" }} />
      </div>
      <div style={{ fontSize: 10, color: "#9aaa80", marginTop: 4 }}>Street-level accuracy · Nominatim OSM · 1 req/sec</div>
    </div>
  );
}

function DirectionsPanel({ destination, onRouteReady, onClose }) {
  const [ft, setFt] = useState(""), [loading, setL] = useState(false), [err, setErr] = useState(""),
    [useGeo, setUG] = useState(false), [gc, setGc] = useState(null);
  const doGPS = () => {
    if (!navigator.geolocation) { setErr("GPS not supported."); return; }
    navigator.geolocation.getCurrentPosition(p => { setGc({ lat: p.coords.latitude, lng: p.coords.longitude }); setUG(true); setFt("📍 My Location"); setErr(""); }, () => setErr("Could not get GPS. Type an address."));
  };
  const calc = async () => {
    setL(true); setErr("");
    try {
      let s;
      if (useGeo && gc) { s = { ...gc, label: "My Location" }; }
      else s = await geocodeText(ft);
      const rt = await getRoute(s.lat, s.lng, destination.lat, destination.lng);
      onRouteReady({ ...rt, start: s, end: destination, startLabel: s.label || ft, endLabel: destination.label });
    } catch (e) { setErr(e.message); }
    setL(false);
  };
  return (
    <div style={{ background: "rgba(42,112,16,.05)", border: "1px solid rgba(42,112,16,.2)", borderRadius: 14, padding: "1rem 1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#1a4a08", textTransform: "uppercase", letterSpacing: ".07em" }}>🗺 Get Directions</div>
        <button onClick={onClose} style={{ border: "none", background: "none", color: "#9aaa80", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Cancel</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#9aaa80", textTransform: "uppercase", marginBottom: 4 }}>From — Point A</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={ft} onChange={e => { setFt(e.target.value); setUG(false); setErr(""); }} onKeyDown={e => e.key === "Enter" && (ft.trim() || useGeo) && calc()} placeholder="e.g. 123 Rizal St Brgy 2 Laoag City…"
            style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #c8b878", background: "rgba(255,250,232,.8)", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit" }} />
          <button onClick={doGPS} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #c8b878", background: useGeo ? "#1c4f09" : "rgba(255,250,232,.8)", color: useGeo ? "#fff" : "#5a7040", fontSize: 14, cursor: "pointer" }}>📍</button>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#9aaa80", textTransform: "uppercase", marginBottom: 4 }}>To — Point B</div>
        <div style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(192,48,48,.3)", background: "rgba(192,48,48,.05)", fontSize: 13, fontWeight: 600, color: "#1a2e0a" }}>📍 {destination.label}</div>
      </div>
      {err && <div style={{ fontSize: 12, color: "#c03030", fontWeight: 600, marginBottom: 8, padding: "6px 8px", background: "rgba(192,48,48,.07)", borderRadius: 6 }}>⚠ {err}</div>}
      <button onClick={calc} disabled={loading || (!ft.trim() && !useGeo)} style={{ width: "100%", padding: "9px", borderRadius: 10, border: "none", background: (!ft.trim() && !useGeo) ? "#ccc" : "linear-gradient(135deg,#1c4f09,#2a7010)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
        {loading ? "🔍 Finding Route…" : "Calculate Route →"}
      </button>
    </div>
  );
}

function NavHUD({ route, progress, gpsSpeed, nextTurn, onStop }) {
  const pct = Math.round((progress / Math.max(route.coords.length - 1, 1)) * 100);
  const dr = remKm(route.coords, progress); const tr = Math.max(0, Math.round(route.duration * (1 - pct / 100)));
  const arrived = pct >= 100; const fmt = m => m < 1 ? "< 1 min" : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 24px rgba(28,79,9,.35)", border: "1.5px solid rgba(90,170,48,.3)" }}>
      {!arrived && nextTurn && <div style={{ background: "linear-gradient(135deg,#1c4f09,#1a5208)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{tIcon(nextTurn.instruction)}</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ color: "rgba(255,255,255,.65)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{nextTurn.distToTurn && `In ${nextTurn.distToTurn}`}</div><div style={{ color: "#fff", fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextTurn.instruction}</div></div>
      </div>}
      {arrived && <div style={{ background: "#1a5208", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 28 }}>🏁</span><span style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>You have arrived!</span></div>}
      <div style={{ background: "rgba(28,79,9,.95)", padding: "10px 16px", display: "flex" }}>
        {[{ val: dr < 1 ? `${Math.round(dr * 1000)}m` : `${dr.toFixed(1)}km`, label: "Remaining", color: "#5aaa30" }, { val: fmt(tr), label: "Est. Time", color: "#c87820" }, { val: gpsSpeed ?? "—", label: "km/h", color: "#fff" }].map((s, i) => (
          <div key={i} style={{ flex: 1, borderRight: i < 2 ? "1px solid rgba(255,255,255,.1)" : "none", padding: i === 0 ? "0 12px 0 0" : "0 12px", textAlign: "center" }}>
            <div style={{ color: s.color, fontSize: 20, fontWeight: 900 }}>{s.val}</div>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 9, fontWeight: 800, textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ flex: 1, paddingLeft: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative", width: 36, height: 36 }}>
            <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" /><circle cx="18" cy="18" r="15" fill="none" stroke="#5aaa30" strokeWidth="3" strokeDasharray={`${(pct / 100) * 94.2} 94.2`} strokeLinecap="round" /></svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 900 }}>{pct}%</div>
          </div>
          <button onClick={onStop} style={{ padding: "3px 10px", borderRadius: 8, border: "1px solid rgba(255,100,100,.5)", background: "rgba(192,48,48,.3)", color: "#ffaaaa", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>✕ End</button>
        </div>
      </div>
    </div>
  );
}

function RouteInfoBar({ route, onStartNav, onClear }) {
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(28,79,9,.08),rgba(42,112,16,.05))", border: "1.5px solid rgba(42,112,16,.25)", borderRadius: 14, padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1c4f09", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>A</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#3a5020", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{route.startLabel}</div>
        <div style={{ fontSize: 18, color: "#5aaa30", flexShrink: 0 }}>→</div>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#c03030", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>B</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#3a5020", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{route.endLabel}</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 900, color: "#1c4f09" }}>{route.distance} <span style={{ fontSize: 10 }}>km</span></div><div style={{ fontSize: 9, color: "#9aaa80", fontWeight: 700, textTransform: "uppercase" }}>Distance</div></div>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 900, color: "#c87820" }}>{route.duration} <span style={{ fontSize: 10 }}>min</span></div><div style={{ fontSize: 9, color: "#9aaa80", fontWeight: 700, textTransform: "uppercase" }}>Drive Time</div></div>
        <button onClick={onStartNav} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1c4f09,#2a7010)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🚗 Start Nav</button>
        <button onClick={onClear} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(192,48,48,.3)", background: "rgba(192,48,48,.07)", color: "#c03030", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>✕ Clear</button>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onFlyTo, onDirections, adoptions, rehome }) {
  if (!user) return null;
  const uA = adoptions.filter(a => a.user_id === user.id || a.email === user.email);
  const uR = rehome.filter(r => r.user_id === user.id || r.email === user.email);
  const addr = [user.address, user.city, user.province, user.zip_code].filter(Boolean).join(", ");
  const monthly = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return { label: d.toLocaleString("default", { month: "short" }), value: [...uA, ...uR].filter(r => { const rd = new Date(r.created_at || ""); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); }).length }; });
  const pr = user._geo?.precision;
  const prLabel = pr === "street" ? "🔵 Street" : pr === "barangay" ? "🟢 Barangay" : pr === "city" ? "🟡 City" : pr === "gps" ? "📡 GPS" : "🔴 Province";
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,25,5,.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", background: "#fffce8", border: "1.5px solid rgba(90,160,48,.4)", boxShadow: "0 24px 64px rgba(30,80,10,.22)" }}>
        <div style={{ padding: "1.2rem 1.4rem", background: "linear-gradient(135deg,rgba(42,112,16,.08),rgba(42,112,16,.03))", borderBottom: "1px solid #e8dfc0", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#1c4f09,#2a7010)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 128.5-46.5T480-440q66 0 132.5 15.5T741-378q29 15 46.5 43.5T805-272v112H160Z" /></svg>
          </div>
          <div style={{ flex: 1 }}><div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1a4a08" }}>{user.first_name} {user.last_name}</div><div style={{ fontSize: 11, color: "#7a9060", fontWeight: 600 }}>{user.email}</div></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#6a7a50", background: "rgba(180,140,60,0.1)", padding: "2px 8px", borderRadius: 50 }}>{prLabel}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(100,80,40,.08)", color: "#6a7a50", fontSize: 15, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "1.2rem 1.4rem", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "rgba(42,112,16,.05)", border: "1px solid rgba(42,112,16,.15)", borderRadius: 14, padding: "1rem 1.1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#9aaa80", textTransform: "uppercase", marginBottom: 6 }}>📍 Registered Address</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2e0a", lineHeight: 1.5, marginBottom: 10 }}>{addr || "No address provided"}</div>
            {user._geo?.nominatimLabel && <div style={{ fontSize: 10, color: "#9aaa80", marginBottom: 10, fontStyle: "italic" }}>OSM: {user._geo.nominatimLabel}</div>}
            {user._geo?.inRegion && <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { onFlyTo(user._geo); onClose(); }} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "1px solid rgba(42,112,16,.3)", background: "rgba(42,112,16,.08)", color: "#1c4f09", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>📍 Show on Map</button>
              <button onClick={() => { onDirections(user); onClose(); }} style={{ flex: 1, padding: "8px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#1c4f09,#2a7010)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>🗺 Get Directions</button>
            </div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[{ val: uA.length, label: "Adoptions", color: "#2a7010", icon: "❤️" }, { val: uR.length, label: "Rehoming", color: "#c87820", icon: "🏠" }, { val: [...uA, ...uR].filter(r => r.status === "Approved").length, label: "Approved", color: "#5aaa30", icon: "✓" }].map(s => (
              <div key={s.label} style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22`, borderRadius: 10, padding: ".7rem", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{s.icon}</div><div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9aaa80", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff8e8", border: "1px solid #e8dfc0", borderRadius: 12, padding: ".9rem 1.1rem" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1a4a08", textTransform: "uppercase", marginBottom: 8 }}>📊 Activity — Last 6 Months</div>
            <BarChart data={monthly} color="#2a7010" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PetPanel({ pet, onClose }) {
  if (!pet) return null;
  const isL = pet.type === "lost";
  const photo = pet.photoUrl ? pet.photoUrl.replace(/^https?:\/\/localhost:\d+/, "") : null;
  const pr = pet._geo?.precision;
  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2000, width: 230, background: "#fffce8", borderRadius: 16, border: "1.5px solid rgba(180,140,60,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
      {photo && <div style={{ height: 110, overflow: "hidden" }}><img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.parentElement.style.display = "none"; }} /></div>}
      <div style={{ padding: "0.7rem 0.9rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 50, background: isL ? "rgba(192,48,48,0.12)" : "rgba(28,79,9,0.10)", color: isL ? "#c03030" : "#1c4f09" }}>{isL ? "Lost" : "Found"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aaa80", fontSize: 14 }}>✕</button>
        </div>
        <div style={{ fontWeight: 900, fontSize: 15, color: "#1a4a08", marginBottom: 3 }}>{pet.name || "Unknown"}</div>
        {(pet.species || pet.breed) && <div style={{ fontSize: 11, color: "#7a9060", fontWeight: 700, marginBottom: 3 }}>{[pet.species, pet.breed].filter(Boolean).join(" · ")}</div>}
        {(pet.address || pet.area) && <div style={{ fontSize: 11, color: "#3a5020", fontWeight: 700, display: "flex", gap: 4, marginBottom: 3 }}><span style={{ color: "#B45A22" }}>📍</span><span style={{ lineHeight: 1.4 }}>{pet.address || pet.area}</span></div>}
        {pet.area && pet.address && <div style={{ fontSize: 10, color: "#9aaa80", marginBottom: 3 }}>{pet.area}</div>}
        {pet.color && <div style={{ fontSize: 11, color: "#7a9060", fontWeight: 700 }}>Color: {pet.color}</div>}
        {pr && <div style={{ fontSize: 10, color: "#9aaa80", marginTop: 4 }}>{pr === "street" ? "🔵 Street-level pin" : pr === "barangay" ? "🟢 Barangay pin" : pr === "gps" ? "📡 GPS pin" : "🟡 City pin"}</div>}
        {pet.details && <div style={{ fontSize: 10, color: "#9aaa80", marginTop: 5, lineHeight: 1.4, borderTop: "1px solid rgba(180,140,60,0.15)", paddingTop: 5 }}>{pet.details.length > 90 ? pet.details.slice(0, 90) + "…" : pet.details}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
export default function GeoMapPanel({ show }) {
  const [rawUsers, setRawUsers] = useState([]);
  const [geocodedUsers, setGeocodedUsers] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [rehome, setRehome] = useState([]);
  const [missingPets, setMissingPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ done: 0, total: 0, active: false });
  const [filter, setFilter] = useState("all");
  const [provFilter, setProvFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showML, setShowML] = useState(true);
  const [mpType, setMpType] = useState("all");
  const [mpSp, setMpSp] = useState("all");
  const [selected, setSelected] = useState(null);
  const [selMp, setSelMp] = useState(null);
  const [flyTgt, setFlyTgt] = useState(null);
  const [dirUser, setDirUser] = useState(null);
  const [route, setRoute] = useState(null);
  const [navActive, setNavActive] = useState(false);
  const [navProg, setNavProg] = useState(0);
  const [vPos, setVPos] = useState(null);
  const [gpsSpd, setGpsSpd] = useState(null);
  const [trav, setTrav] = useState(0);
  const wRef = useRef(null), rRef = useRef(null), mapRef = useRef(null);
  useEffect(() => { rRef.current = route; }, [route]);

  useEffect(() => {
    if (!show) return;
    setLoading(true);

    Promise.all([
      phpApi("get_users_geo"),
      phpApi("get_requests", { type: "adoptions", limit: 1000 }),
      phpApi("get_requests", { type: "rehome", limit: 1000 }),
      fetch("/api/missing-pets/admin/all").then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(async ([ur, ar, rr, mp]) => {
      const users = ur.success ? (ur.data || []) : [];
      setRawUsers(users);
      setAdoptions(ar.success ? (ar.data || []) : []);
      setRehome(rr.success ? (rr.data || []) : []);

      const approved = (mp || []).filter(p => p.status === "approved");
      const totalItems = users.length + approved.length;

      setLoading(false);
      setGeocodingProgress({ done: 0, total: totalItems, active: true });

      // Geocode users one by one (Nominatim: 1 req/sec, but cached)
      const geocodedU = [];
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        const geo = await geocodeUser(u);
        if (geo.inRegion) geocodedU.push({ ...u, _geo: geo });
        setGeocodingProgress(p => ({ ...p, done: i + 1 }));
        // Flush to map as they come in (batched every 5)
        if ((i + 1) % 5 === 0 || i === users.length - 1) {
          setGeocodedUsers([...geocodedU]);
        }
      }

      // Geocode pets
      const geocodedP = [];
      for (let i = 0; i < approved.length; i++) {
        const pet = approved[i];
        const geo = await geocodePet(pet);
        if (geo.inRegion) geocodedP.push({ ...pet, _geo: geo });
        setGeocodingProgress(p => ({ ...p, done: users.length + i + 1 }));
      }
      setMissingPets(geocodedP);
      setGeocodingProgress({ done: totalItems, total: totalItems, active: false });

    }).catch(() => { setLoading(false); });
  }, [show]);

  const stopNav = useCallback(() => {
    if (wRef.current != null) { navigator.geolocation.clearWatch(wRef.current); wRef.current = null; }
    setNavActive(false); setNavProg(0); setVPos(null); setGpsSpd(null); setTrav(0);
  }, []);

  const startNav = useCallback(() => {
    if (!route?.coords?.length) return;
    setNavActive(true); setNavProg(0); setTrav(0); setVPos({ lat: route.coords[0][1], lng: route.coords[0][0] });
    if (!navigator.geolocation) { alert("GPS not supported."); setNavActive(false); return; }
    wRef.current = navigator.geolocation.watchPosition(pos => {
      const r = rRef.current; if (!r?.coords?.length) return;
      const { latitude: lat, longitude: lng, speed } = pos.coords;
      const idx = snap(r.coords, lat, lng);
      let d = 0; for (let i = 0; i < idx; i++) d += hM(r.coords[i], r.coords[i + 1]);
      setVPos({ lat: r.coords[idx][1], lng: r.coords[idx][0] }); setNavProg(idx); setTrav(d);
      if (speed != null) setGpsSpd(Math.round(speed * 3.6));
      if (hM([lng, lat], r.coords[r.coords.length - 1]) < 30) { setNavProg(r.coords.length - 1); setTimeout(stopNav, 4000); }
    }, err => console.warn("GPS:", err.message), { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
  }, [route, stopNav]);

  const nt = navActive && route?.steps ? nxtTurn(route.steps, trav) : null;
  const handleDir = u => { setDirUser(u); setRoute(null); stopNav(); setFlyTgt({ lat: u._geo.lat, lng: u._geo.lng }); };
  const handleRR = rd => { setRoute({ ...rd, endLabel: dirUser ? `${dirUser.first_name} ${dirUser.last_name} (${dirUser.city || ""})` : rd.endLabel || "" }); setDirUser(null); };
  const clrRoute = () => { setRoute(null); setDirUser(null); stopNav(); };

  const fUsers = geocodedUsers.filter(u => {
    const mf = filter === "all" || (filter === "active" ? u.is_active : !u.is_active);
    const mp = provFilter === "all" || u._geo.province === provFilter;
    const ms = !search || `${u.first_name} ${u.last_name} ${u.city} ${u.province} ${u.address || ""}`.toLowerCase().includes(search.toLowerCase());
    return mf && mp && ms;
  });
  const fPets = missingPets.filter(p => (mpType === "all" || p.type === mpType) && (mpSp === "all" || (p.species || "").toLowerCase() === mpSp.toLowerCase()));
  const mc = { all: missingPets.length, lost: missingPets.filter(p => p.type === "lost").length, found: missingPets.filter(p => p.type === "found").length };
  const pStats = Object.keys(PROVINCES).map(p => ({ name: p, color: PROVINCES[p].color, count: geocodedUsers.filter(u => u._geo.province === p).length, active: geocodedUsers.filter(u => u._geo.province === p && u.is_active).length }));
  const brgCount = geocodedUsers.filter(u => u._geo?.precision === "barangay" || u._geo?.precision === "street").length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="🗺 Ilocos Region — User Map" subtitle="Street-level OSM geocoding · MapLibre · ORS Navigation"
        action={<div style={{ display: "flex", gap: 8 }}>{["all", "active", "inactive"].map(f => (<button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, border: "1.5px solid", cursor: "pointer", background: filter === f ? "#1c4f09" : "transparent", borderColor: filter === f ? "#1c4f09" : "#ddd0a8", color: filter === f ? "#fff" : "#7a9060" }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>))}</div>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {pStats.map(p => (
          <div key={p.name} onClick={() => setProvFilter(provFilter === p.name ? "all" : p.name)}
            style={{ borderRadius: 14, padding: "1rem 1.2rem", cursor: "pointer", transition: "all .15s", background: provFilter === p.name ? `${p.color}18` : "#fffce8", border: `1.5px solid ${provFilter === p.name ? p.color : "rgba(200,180,100,.3)"}`, transform: provFilter === p.name ? "translateY(-2px)" : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1a4a08", marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.count}</div>
            <div style={{ fontSize: 10, color: "#9aaa80", fontWeight: 600, marginTop: 2 }}>{p.active} active · {p.count - p.active} inactive</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[{ val: rawUsers.length, label: "Total Users", icon: "👥", color: "#1c4f09" },
        { val: geocodedUsers.length, label: "Pinned on Map", icon: "📍", color: "#2a7010" },
        { val: brgCount, label: "High-Precision Pins", icon: "🏘", color: "#5aaa30" },
        { val: mc.all, label: "Missing Pets", icon: "🐾", color: "#B45A22" }].map(s => (
          <div key={s.label} style={{ borderRadius: 14, border: `1px solid ${s.color}22`, padding: ".9rem 1rem", background: `${s.color}0a`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
            <div><div style={{ fontSize: 22, fontWeight: 900, color: "#1a4a08", lineHeight: 1 }}>{s.val}</div><div style={{ fontSize: 10, fontWeight: 700, color: "#9aaa80", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Geocoding progress bar */}
      {geocodingProgress.active && (
        <GeocodingProgress done={geocodingProgress.done} total={geocodingProgress.total} />
      )}

      {navActive && route && <NavHUD route={route} progress={navProg} gpsSpeed={gpsSpd} nextTurn={nt} onStop={stopNav} />}
      {!navActive && route && <RouteInfoBar route={route} onStartNav={startNav} onClear={clrRoute} />}

      {/* Missing pets controls */}
      <div style={{ background: "rgba(255,248,220,0.88)", border: "1.5px solid rgba(180,90,34,0.28)", borderRadius: 16, padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => setShowML(v => !v)} style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", position: "relative", background: showML ? "#B45A22" : "rgba(180,140,60,0.28)", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: showML ? "18px" : "2px", width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
            </button>
            <div><div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#1a4a08" }}>🐾 Missing Pets Layer</div>
              <div style={{ fontSize: "0.70rem", fontWeight: 700, color: "#9aaa80" }}>{showML ? `${fPets.length} of ${missingPets.length} reports` : "Layer hidden"}</div></div>
          </div>
          {showML && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", gap: "0.2rem", background: "rgba(255,248,220,0.7)", borderRadius: 50, padding: "0.2rem", border: "1px solid rgba(180,140,60,0.25)" }}>
              {[["all", "All"], ["lost", "Lost"], ["found", "Found"]].map(([v, l]) => (
                <button key={v} onClick={() => setMpType(v)} style={{ padding: "0.32rem 0.75rem", borderRadius: 50, fontSize: "0.74rem", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", background: mpType === v ? (v === "lost" ? "#c03030" : v === "found" ? "#1c4f09" : "#B45A22") : "transparent", color: mpType === v ? "#fff" : "#3a5020" }}>
                  {l} {v !== "all" && mc[v] > 0 && `(${mc[v]})`}
                </button>
              ))}
            </div>
            <div style={{ display: "inline-flex", gap: "0.2rem", background: "rgba(255,248,220,0.7)", borderRadius: 50, padding: "0.2rem", border: "1px solid rgba(180,140,60,0.25)" }}>
              {[["all", "All"], ["Dog", "🐕"], ["Cat", "🐈"], ["Other", "Other"]].map(([v, l]) => (
                <button key={v} onClick={() => setMpSp(v)} style={{ padding: "0.32rem 0.75rem", borderRadius: 50, fontSize: "0.74rem", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", background: mpSp === v ? "#B45A22" : "transparent", color: mpSp === v ? "#fff" : "#3a5020" }}>{l}</button>
              ))}
            </div>
          </div>}
        </div>
        {showML && <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: "1px solid rgba(180,140,60,0.18)", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: "#c03030", border: "2px solid #fff" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>Lost (!)</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: "#1c4f09", border: "2px solid #fff" }} /><span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>Found (✓)</span></div>
          <div style={{ display: "flex", gap: "0.6rem", marginLeft: "auto" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00b8d9" }}>🔵 Cyan ring = street-level</span>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#5aaa30" }}>🟢 White ring = barangay</span>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c87820" }}>🟡 Yellow ring = city</span>
          </div>
        </div>}
      </div>

      {/* Map + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>
        <div style={{ borderRadius: 20, overflow: "hidden", border: `1.5px solid ${navActive ? "rgba(28,79,9,.6)" : "rgba(90,160,48,.35)"}`, boxShadow: "0 4px 20px rgba(30,60,10,.08)" }}>
          <div style={{ padding: "10px 14px", background: navActive ? "rgba(28,79,9,.97)" : "rgba(255,248,220,.97)", borderBottom: "1px solid #e8dfc0" }}>
            {dirUser && !route ? <DirectionsPanel destination={{ lat: dirUser._geo.lat, lng: dirUser._geo.lng, label: `${dirUser.first_name} ${dirUser.last_name}, ${dirUser.city || ""}` }} onRouteReady={handleRR} onClose={() => setDirUser(null)} /> : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {navActive ? <span style={{ color: "#5aaa30", fontSize: 12, fontWeight: 800 }}>🛰 GPS Navigation Active</span> : <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, barangay, city, address…"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, fontWeight: 600, color: "#1a2e0a", fontFamily: "inherit" }} />
                  {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "none", color: "#9aaa80", cursor: "pointer" }}>✕</button>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9aaa80" }}>{fUsers.length} users</span>
                  {showML && <span style={{ fontSize: 11, fontWeight: 700, color: "#B45A22", marginLeft: 6 }}>· {fPets.length} pets</span>}
                </>}
              </div>
            )}
          </div>

          {loading ? <div style={{ height: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f4e8" }}><div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #2a7010", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} /></div> : (
            <div style={{ height: 500, position: "relative" }}>
              {show && <MapView users={fUsers} missingPets={fPets} showMissingLayer={showML} route={route} navActive={navActive} vehiclePos={vPos} onSelectUser={setSelected} onSelectMp={setSelMp} flyTarget={flyTgt} mapRef={mapRef} />}
              {selMp && <PetPanel pet={selMp} onClose={() => setSelMp(null)} />}
            </div>
          )}

          <div style={{ padding: "10px 14px", background: "rgba(255,252,235,.97)", borderTop: "1px solid #e8dfc0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(PROVINCES).map(([p, cfg]) => (<div key={p} style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 9, height: 9, borderRadius: "50%", background: cfg.color }} /><span style={{ fontSize: 11, fontWeight: 700, color: "#6a7a50" }}>{p}</span></div>))}
            <span style={{ fontSize: 11, color: "#9aaa80", marginLeft: "auto" }}>© OpenStreetMap contributors · MapLibre GL JS</span>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ borderRadius: 20, border: "1.5px solid #ddd0a8", background: "#fffce8", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #e8dfc0", background: "rgba(255,248,220,.97)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1a4a08", textTransform: "uppercase" }}>{navActive ? "🚗 Navigation" : `Users (${fUsers.length})`}</div>
            {showML && !navActive && <div style={{ fontSize: 10, fontWeight: 700, color: "#B45A22", marginTop: 2 }}>🐾 {fPets.length} pets on map</div>}
          </div>
          {navActive ? (
            <div style={{ overflowY: "auto", flex: 1, maxHeight: 500, padding: "8px 0" }}>
              {route?.steps?.map((step, i) => {
                let c = 0; for (let j = 0; j < i; j++) c += route.steps[j].distance || 0;
                const passed = trav >= c + (step.distance || 0); const cur = !passed && trav >= c;
                return (
                  <div key={i} style={{ padding: "8px 14px", borderBottom: "1px solid rgba(200,176,100,.1)", display: "flex", alignItems: "center", gap: 8, background: cur ? "rgba(28,79,9,.08)" : "transparent", opacity: passed ? .45 : 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: cur ? "#1c4f09" : passed ? "rgba(90,170,48,.15)" : "rgba(42,112,16,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{passed ? "✓" : tIcon(step.instruction)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: cur ? "#1c4f09" : "#1a2e0a", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.instruction}</div>
                      <div style={{ fontSize: 10, color: "#9aaa80", fontWeight: 600 }}>{step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowY: "auto", flex: 1, maxHeight: 500 }}>
              {fUsers.length === 0 ? <div style={{ padding: "2rem", textAlign: "center", color: "#9aa880", fontSize: 13, fontWeight: 600 }}>No users match filters</div>
                : fUsers.map(u => (
                  <div key={u.id} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(200,176,100,.12)", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: u.is_active ? pColor(u._geo?.province) : "#ccc", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1a2e0a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.first_name} {u.last_name}</div>
                      <div style={{ fontSize: 11, color: "#7a9060", fontWeight: 600 }}>{u.city || "—"} · <span style={{ fontSize: 10, color: u._geo?.precision === "street" ? "#00b8d9" : u._geo?.precision === "barangay" ? "#5aaa30" : "#c87820" }}>{u._geo?.precision}</span></div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setSelected(u)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(42,112,16,.25)", background: "rgba(42,112,16,.07)", color: "#1c4f09", fontSize: 12, cursor: "pointer" }}>👁</button>
                      <button onClick={() => handleDir(u)} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "#1c4f09", color: "#fff", fontSize: 12, cursor: "pointer" }}>🗺</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {selected && <UserModal user={selected} onClose={() => setSelected(null)} onFlyTo={geo => setFlyTgt({ lat: geo.lat, lng: geo.lng })} onDirections={handleDir} adoptions={adoptions} rehome={rehome} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .maplibregl-ctrl-group{border-radius:10px!important;overflow:hidden;} .maplibregl-ctrl-attrib{font-size:10px!important;}`}</style>
    </div>
  );
}