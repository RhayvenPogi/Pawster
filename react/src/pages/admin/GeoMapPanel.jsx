// ── GEO MAP PANEL — MapLibre GL JS + Nominatim OSM Geocoder
// ── OPTIMIZED: localStorage persistent cache, instant pin restore, mobile-responsive
import { useState, useEffect, useRef, useCallback } from "react";
import { phpApi, PageHeader } from "../../shared";

const ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMxNDExZDdhZGUzOTQ5YmM5ZjNkMzc5ZGU0MTZlNjc2IiwiaCI6Im11cm11cjY0In0=";
const ILOCOS_CENTER = [120.45, 17.0];
const ILOCOS_ZOOM = 7.8;
const GEO_CACHE_KEY = "pawster_geo_cache_v3";
const USER_PINS_KEY  = "pawster_user_pins_v3";
const PET_PINS_KEY   = "pawster_pet_pins_v3";

const PROVINCES = {
  "Ilocos Norte": { color: "#d4880a", center: [120.594, 18.197] },
  "Ilocos Sur":   { color: "#c87820", center: [120.387, 17.575] },
  "La Union":     { color: "#5aaa30", center: [120.317, 16.616] },
  "Pangasinan":   { color: "#588B41", center: [120.333, 16.043] },
};

const ILOCOS_BBOX = { minLat: 15.50, maxLat: 18.70, minLng: 119.60, maxLng: 121.00 };

const PROVINCE_CENTERS = {
  "Ilocos Norte": { lat: 18.1977, lng: 120.5937 },
  "Ilocos Sur":   { lat: 17.5747, lng: 120.3872 },
  "La Union":     { lat: 16.6159, lng: 120.3166 },
  "Pangasinan":   { lat: 16.0430, lng: 120.3330 },
};

const CITY_CENTERS = {
  "laoag": { lat: 18.1977, lng: 120.5937, province: "Ilocos Norte" },
  "laoag city": { lat: 18.1977, lng: 120.5937, province: "Ilocos Norte" },
  "batac": { lat: 18.0554, lng: 120.5648, province: "Ilocos Norte" },
  "batac city": { lat: 18.0554, lng: 120.5648, province: "Ilocos Norte" },
  "pagudpud": { lat: 18.5629, lng: 120.7940, province: "Ilocos Norte" },
  "paoay": { lat: 18.0663, lng: 120.5291, province: "Ilocos Norte" },
  "bangui": { lat: 18.5333, lng: 120.7667, province: "Ilocos Norte" },
  "vintar": { lat: 18.2333, lng: 120.6500, province: "Ilocos Norte" },
  "pasuquin": { lat: 18.3333, lng: 120.6167, province: "Ilocos Norte" },
  "bacarra": { lat: 18.2500, lng: 120.6167, province: "Ilocos Norte" },
  "piddig": { lat: 18.1667, lng: 120.7000, province: "Ilocos Norte" },
  "sarrat": { lat: 18.1667, lng: 120.6333, province: "Ilocos Norte" },
  "dingras": { lat: 18.1000, lng: 120.6833, province: "Ilocos Norte" },
  "nueva era": { lat: 17.9333, lng: 120.6667, province: "Ilocos Norte" },
  "marcos": { lat: 18.0333, lng: 120.7000, province: "Ilocos Norte" },
  "espiritu": { lat: 18.2167, lng: 120.5333, province: "Ilocos Norte" },
  "badoc": { lat: 17.9167, lng: 120.4667, province: "Ilocos Norte" },
  "currimao": { lat: 17.9833, lng: 120.4833, province: "Ilocos Norte" },
  "pinili": { lat: 18.0167, lng: 120.6167, province: "Ilocos Norte" },
  "solsona": { lat: 18.0167, lng: 120.7833, province: "Ilocos Norte" },
  "adams": { lat: 18.4500, lng: 120.9167, province: "Ilocos Norte" },
  "carasi": { lat: 18.0167, lng: 120.8333, province: "Ilocos Norte" },
  "dumalneg": { lat: 18.3667, lng: 120.8667, province: "Ilocos Norte" },
  "banna": { lat: 18.1167, lng: 120.6500, province: "Ilocos Norte" },
  "san nicolas": { lat: 18.1733, lng: 120.5933, province: "Ilocos Norte" },
  "burgos": { lat: 18.5167, lng: 120.6500, province: "Ilocos Norte" },
  "vigan": { lat: 17.5747, lng: 120.3872, province: "Ilocos Sur" },
  "vigan city": { lat: 17.5747, lng: 120.3872, province: "Ilocos Sur" },
  "candon": { lat: 17.1970, lng: 120.4491, province: "Ilocos Sur" },
  "candon city": { lat: 17.1970, lng: 120.4491, province: "Ilocos Sur" },
  "narvacan": { lat: 17.4213, lng: 120.4388, province: "Ilocos Sur" },
  "bantay": { lat: 17.6000, lng: 120.3833, province: "Ilocos Sur" },
  "sinait": { lat: 17.8500, lng: 120.4333, province: "Ilocos Sur" },
  "tagudin": { lat: 16.9333, lng: 120.4500, province: "Ilocos Sur" },
  "cabugao": { lat: 17.7833, lng: 120.4000, province: "Ilocos Sur" },
  "magsingal": { lat: 17.6833, lng: 120.4167, province: "Ilocos Sur" },
  "caoayan": { lat: 17.5333, lng: 120.4000, province: "Ilocos Sur" },
  "santa": { lat: 17.4667, lng: 120.4333, province: "Ilocos Sur" },
  "cervantes": { lat: 17.0167, lng: 120.7667, province: "Ilocos Sur" },
  "lidlidda": { lat: 17.0833, lng: 120.5333, province: "Ilocos Sur" },
  "nagbukel": { lat: 17.2167, lng: 120.5000, province: "Ilocos Sur" },
  "san emilio": { lat: 17.1500, lng: 120.6000, province: "Ilocos Sur" },
  "san esteban": { lat: 17.5833, lng: 120.3667, province: "Ilocos Sur" },
  "san ildefonso": { lat: 17.2000, lng: 120.5833, province: "Ilocos Sur" },
  "santa lucia": { lat: 17.1333, lng: 120.4667, province: "Ilocos Sur" },
  "santa maria": { lat: 17.3667, lng: 120.4667, province: "Ilocos Sur" },
  "santiago": { lat: 17.3167, lng: 120.4500, province: "Ilocos Sur" },
  "sigay": { lat: 17.0667, lng: 120.5833, province: "Ilocos Sur" },
  "sugpon": { lat: 16.9500, lng: 120.5667, province: "Ilocos Sur" },
  "suyo": { lat: 16.9000, lng: 120.5167, province: "Ilocos Sur" },
  "galimuyod": { lat: 17.1667, lng: 120.5333, province: "Ilocos Sur" },
  "san fernando": { lat: 16.6159, lng: 120.3166, province: "La Union" },
  "san fernando city": { lat: 16.6159, lng: 120.3166, province: "La Union" },
  "bauang": { lat: 16.5300, lng: 120.3300, province: "La Union" },
  "agoo": { lat: 16.3200, lng: 120.3700, province: "La Union" },
  "aringay": { lat: 16.3833, lng: 120.3500, province: "La Union" },
  "caba": { lat: 16.4833, lng: 120.3500, province: "La Union" },
  "naguilian": { lat: 16.5500, lng: 120.3833, province: "La Union" },
  "luna": { lat: 16.8667, lng: 120.3667, province: "La Union" },
  "balaoan": { lat: 16.8167, lng: 120.3833, province: "La Union" },
  "bacnotan": { lat: 16.7333, lng: 120.3500, province: "La Union" },
  "tubao": { lat: 16.4500, lng: 120.4167, province: "La Union" },
  "pugo": { lat: 16.4667, lng: 120.4833, province: "La Union" },
  "rosario": { lat: 16.2167, lng: 120.4833, province: "La Union" },
  "santo tomas": { lat: 16.3500, lng: 120.3333, province: "La Union" },
  "san gabriel": { lat: 16.7000, lng: 120.4333, province: "La Union" },
  "santol": { lat: 16.7667, lng: 120.4333, province: "La Union" },
  "sudipen": { lat: 16.7333, lng: 120.5167, province: "La Union" },
  "bagulin": { lat: 16.6167, lng: 120.4500, province: "La Union" },
  "bangar": { lat: 16.8833, lng: 120.4167, province: "La Union" },
  "san juan": { lat: 16.6500, lng: 120.3200, province: "La Union" },
  "dagupan": { lat: 16.0430, lng: 120.3330, province: "Pangasinan" },
  "dagupan city": { lat: 16.0430, lng: 120.3330, province: "Pangasinan" },
  "alaminos": { lat: 16.1555, lng: 119.9796, province: "Pangasinan" },
  "alaminos city": { lat: 16.1555, lng: 119.9796, province: "Pangasinan" },
  "urdaneta": { lat: 15.9765, lng: 120.5706, province: "Pangasinan" },
  "urdaneta city": { lat: 15.9765, lng: 120.5706, province: "Pangasinan" },
  "lingayen": { lat: 16.0200, lng: 120.2300, province: "Pangasinan" },
  "san carlos": { lat: 15.9255, lng: 120.3486, province: "Pangasinan" },
  "san carlos city": { lat: 15.9255, lng: 120.3486, province: "Pangasinan" },
  "calasiao": { lat: 16.0100, lng: 120.3600, province: "Pangasinan" },
  "manaoag": { lat: 15.9700, lng: 120.4900, province: "Pangasinan" },
  "pozorrubio": { lat: 16.1167, lng: 120.5500, province: "Pangasinan" },
  "sison": { lat: 16.1833, lng: 120.5333, province: "Pangasinan" },
  "umingan": { lat: 15.9167, lng: 120.8000, province: "Pangasinan" },
  "tayug": { lat: 15.9500, lng: 120.7333, province: "Pangasinan" },
  "laoac": { lat: 15.8500, lng: 120.5500, province: "Pangasinan" },
  "malasiqui": { lat: 15.9167, lng: 120.4167, province: "Pangasinan" },
  "mangaldan": { lat: 16.0667, lng: 120.4333, province: "Pangasinan" },
  "mapandan": { lat: 16.0833, lng: 120.4500, province: "Pangasinan" },
  "rosales": { lat: 15.8833, lng: 120.6333, province: "Pangasinan" },
  "san fabian": { lat: 16.1167, lng: 120.3833, province: "Pangasinan" },
  "villasis": { lat: 15.9000, lng: 120.5833, province: "Pangasinan" },
  "sual": { lat: 16.0667, lng: 120.1000, province: "Pangasinan" },
  "bolinao": { lat: 16.3833, lng: 119.8833, province: "Pangasinan" },
  "dasol": { lat: 15.9833, lng: 119.8833, province: "Pangasinan" },
  "masinloc": { lat: 15.5333, lng: 119.9500, province: "Pangasinan" },
};

const PROV_MAP = {
  "ilocos norte": "Ilocos Norte", "iln": "Ilocos Norte",
  "ilocos sur": "Ilocos Sur", "ils": "Ilocos Sur",
  "la union": "La Union", "lau": "La Union",
  "pangasinan": "Pangasinan", "pan": "Pangasinan",
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT GEOCODE CACHE — localStorage survives logout + browser restart
// Key: query string → geocode result
// ─────────────────────────────────────────────────────────────────────────────
const _geoCache = new Map();
try {
  const saved = JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "{}");
  Object.entries(saved).forEach(([k, v]) => _geoCache.set(k, v));
} catch { }

function _persistGeoCache() {
  try {
    const obj = {};
    _geoCache.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(obj));
  } catch { }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT PIN CACHE — stores fully geocoded user/pet arrays by ID hash
// Restores pins instantly on next visit without any API calls
// ─────────────────────────────────────────────────────────────────────────────
function loadPinCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function savePinCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { }
}
function pinCacheAge(key) {
  try {
    const c = JSON.parse(localStorage.getItem(key) || "null");
    return c ? Date.now() - c.ts : Infinity;
  } catch { return Infinity; }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
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
  for (const [k, v] of Object.entries(PROV_MAP)) { if (t.includes(k)) return v; }
  return null;
}
function jitter(amt = 0.003) { return (Math.random() - 0.5) * amt; }
function precisionFromType(type) {
  if (!type) return "city";
  if (["house", "building", "residential"].includes(type)) return "street";
  if (["suburb", "quarter", "neighbourhood", "hamlet", "village", "amenity"].includes(type)) return "barangay";
  if (["city", "town", "municipality", "administrative"].includes(type)) return "city";
  return "city";
}

// ─── Nominatim with localStorage-persistent cache ───
async function nominatim(query) {
  const key = query.toLowerCase().trim();
  if (_geoCache.has(key)) return _geoCache.get(key);
  try {
    const token = localStorage.getItem("pawster_token") || localStorage.getItem("token") || "";
    const res = await fetch(
      `/php/admin/dashboard?action=nominatim_search&q=${encodeURIComponent(query)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) { _geoCache.set(key, null); _persistGeoCache(); return null; }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) { _geoCache.set(key, null); _persistGeoCache(); return null; }
    const hit = data.find(r => inRegion(parseFloat(r.lat), parseFloat(r.lon))) || data[0];
    if (!hit) { _geoCache.set(key, null); _persistGeoCache(); return null; }
    const result = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), displayName: hit.display_name, type: hit.type };
    _geoCache.set(key, result); _persistGeoCache();
    return result;
  } catch { _geoCache.set(key, null); return null; }
}

async function geocodeAddress(address, city, province) {
  const prov = detectProvince(`${province || ""} ${city || ""} ${address || ""}`);
  const addr = (address || "").trim();
  const cty = (city || "").trim();
  const cLow = cty.toLowerCase();
  const cityHit = CITY_CENTERS[cLow];

  if (!addr) {
    if (cityHit) return { lat: cityHit.lat + jitter(), lng: cityHit.lng + jitter(), province: cityHit.province || prov, inRegion: true, precision: "city" };
    if (prov && PROVINCE_CENTERS[prov]) {
      const p = PROVINCE_CENTERS[prov];
      return { lat: p.lat + jitter(0.05), lng: p.lng + jitter(0.05), province: prov, inRegion: true, precision: "province" };
    }
    return { inRegion: false };
  }

  if (cty) {
    const q = `${addr}, ${cty}, ${province || "Ilocos Region"}, Philippines`;
    const r = await nominatim(q);
    if (r && inRegion(r.lat, r.lng)) return { lat: r.lat + jitter(0.001), lng: r.lng + jitter(0.001), province: prov || guessProvFromCoords(r.lat, r.lng), inRegion: true, precision: precisionFromType(r.type), nominatimLabel: r.displayName };
    const stripped = addr.replace(/^\d+[\s\-,]*/, "").trim();
    if (stripped && stripped !== addr) {
      const r2 = await nominatim(`${stripped}, ${cty}, ${province || "Ilocos Region"}, Philippines`);
      if (r2 && inRegion(r2.lat, r2.lng)) return { lat: r2.lat + jitter(0.001), lng: r2.lng + jitter(0.001), province: prov || guessProvFromCoords(r2.lat, r2.lng), inRegion: true, precision: precisionFromType(r2.type), nominatimLabel: r2.displayName };
    }
  } else if (prov) {
    const r = await nominatim(`${addr}, ${prov}, Philippines`);
    if (r && inRegion(r.lat, r.lng)) return { lat: r.lat + jitter(0.001), lng: r.lng + jitter(0.001), province: prov || guessProvFromCoords(r.lat, r.lng), inRegion: true, precision: precisionFromType(r.type), nominatimLabel: r.displayName };
  }

  if (cityHit) return { lat: cityHit.lat + jitter(0.008), lng: cityHit.lng + jitter(0.008), province: cityHit.province || prov, inRegion: true, precision: "city" };
  if (prov && PROVINCE_CENTERS[prov]) { const p = PROVINCE_CENTERS[prov]; return { lat: p.lat + jitter(0.05), lng: p.lng + jitter(0.05), province: prov, inRegion: true, precision: "province" }; }
  return { inRegion: false };
}

async function geocodeUser(user) {
  if (!user.address && !user.city && !user.province) return { inRegion: false };
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
  for (const q of [`${text}, Philippines`, `${text}, Ilocos Region, Philippines`]) {
    const r = await nominatim(q);
    if (r) return { lat: r.lat, lng: r.lng, label: r.displayName || text };
  }
  throw new Error(`"${text}" not found. Try: "Rizal St, Laoag City", "Brgy 2, Vigan City Ilocos Sur"`);
}

async function geocodeBatch(items, geocodeFn, onProgress, concurrency = 15) {
  const results = new Array(items.length).fill(null);
  let completed = 0;
  async function worker(i) { results[i] = await geocodeFn(items[i]); completed++; onProgress(completed); }
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = [];
    for (let j = i; j < Math.min(i + concurrency, items.length); j++) chunk.push(worker(j));
    await Promise.all(chunk);
  }
  return results;
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

// ─── Math helpers ───
function hM(a, b) { const R = 6371000, r = d => d * Math.PI / 180; const dLat = r(b[1] - a[1]), dLng = r(b[0] - a[0]); const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLng / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)); }
function snap(coords, lat, lng) { let b = 0, bd = Infinity; coords.forEach(([cL, cA], i) => { const d = hM([cL, cA], [lng, lat]); if (d < bd) { bd = d; b = i; } }); return b; }
function remKm(coords, i) { let d = 0; for (let j = i; j < coords.length - 1; j++) d += hM(coords[j], coords[j + 1]); return d / 1000; }
function nxtTurn(steps, tm) { let c = 0; for (const s of steps) { c += s.distance || 0; if (tm < c) { const d = c - tm; return { instruction: s.instruction || "Continue", distToTurn: d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km` }; } } return { instruction: "You have arrived!", distToTurn: "" }; }
function tIcon(ins) { const i = (ins || "").toLowerCase(); if (i.includes("left")) return "↰"; if (i.includes("right")) return "↱"; if (i.includes("u-turn")) return "↩"; if (i.includes("roundabout")) return "⟳"; if (i.includes("arrive") || i.includes("destination")) return "🏁"; return "↑"; }
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
      const m = new window.maplibregl.Map({
        container: cRef.current, style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: ILOCOS_CENTER, zoom: ILOCOS_ZOOM, attributionControl: false
      });
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

  return <div ref={cRef} className="h-full w-full" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Components
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data, color = "#2a7010" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 60 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${Math.max(4, (d.value / max) * 52)}px`, background: color, opacity: .85 }} />
          <span style={{ fontSize: 9, color: "#9aaa80", fontWeight: 700 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function SyncBadge({ status }) {
  const cfg = {
    cached:     { icon: "⚡", label: "Instant (cached)",   color: "#5aaa30", bg: "rgba(90,170,48,.12)" },
    syncing:    { icon: "🔄", label: "Syncing in background…", color: "#c87820", bg: "rgba(200,120,32,.1)" },
    fresh:      { icon: "✅", label: "Map up to date",     color: "#2a7010", bg: "rgba(42,112,16,.1)" },
    loading:    { icon: "📍", label: "Loading…",           color: "#9aaa80", bg: "rgba(150,150,150,.1)" },
  };
  const c = cfg[status] || cfg.loading;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33` }}>
      <span>{c.icon}</span><span>{c.label}</span>
    </div>
  );
}

function GeocodingProgress({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="px-4 py-3 rounded-2xl" style={{ background: "rgba(42,112,16,.05)", border: "1px solid rgba(42,112,16,.18)" }}>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-extrabold" style={{ color: "#1a4a08" }}>📍 Syncing addresses via OpenStreetMap…</span>
        <span className="text-xs font-bold" style={{ color: "#5aaa30" }}>{done} / {total}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(42,112,16,.1)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1c4f09,#5aaa30)" }} />
      </div>
      <div className="text-xs mt-1" style={{ color: "#9aaa80" }}>Street-level accuracy · Nominatim OSM · running in background</div>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(42,112,16,.05)", border: "1px solid rgba(42,112,16,.2)" }}>
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "#1a4a08" }}>🗺 Get Directions</div>
        <button onClick={onClose} className="text-xs font-bold cursor-pointer border-none bg-transparent" style={{ color: "#9aaa80" }}>✕ Cancel</button>
      </div>
      <div className="mb-2">
        <div className="text-xs font-extrabold uppercase mb-1" style={{ color: "#9aaa80" }}>From — Point A</div>
        <div className="flex gap-2">
          <input value={ft} onChange={e => { setFt(e.target.value); setUG(false); setErr(""); }} onKeyDown={e => e.key === "Enter" && (ft.trim() || useGeo) && calc()}
            placeholder="e.g. 123 Rizal St Brgy 2 Laoag City…"
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold outline-none"
            style={{ border: "1px solid #c8b878", background: "rgba(255,250,232,.8)", fontFamily: "inherit" }} />
          <button onClick={doGPS} className="px-3 py-2 rounded-lg cursor-pointer text-sm"
            style={{ border: "1px solid #c8b878", background: useGeo ? "#1c4f09" : "rgba(255,250,232,.8)", color: useGeo ? "#fff" : "#5a7040" }}>📍</button>
        </div>
      </div>
      <div className="mb-3">
        <div className="text-xs font-extrabold uppercase mb-1" style={{ color: "#9aaa80" }}>To — Point B</div>
        <div className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ border: "1px solid rgba(192,48,48,.3)", background: "rgba(192,48,48,.05)", color: "#1a2e0a" }}>📍 {destination.label}</div>
      </div>
      {err && <div className="text-xs font-semibold mb-2 px-2 py-1.5 rounded-lg" style={{ color: "#c03030", background: "rgba(192,48,48,.07)" }}>⚠ {err}</div>}
      <button onClick={calc} disabled={loading || (!ft.trim() && !useGeo)}
        className="w-full py-2.5 rounded-xl text-sm font-extrabold text-white cursor-pointer border-none"
        style={{ background: (!ft.trim() && !useGeo) ? "#ccc" : "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
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
    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 6px 24px rgba(28,79,9,.35)", border: "1.5px solid rgba(90,170,48,.3)" }}>
      {!arrived && nextTurn && (
        <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: "linear-gradient(135deg,#1c4f09,#1a5208)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(255,255,255,.12)" }}>{tIcon(nextTurn.instruction)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold uppercase" style={{ color: "rgba(255,255,255,.65)" }}>{nextTurn.distToTurn && `In ${nextTurn.distToTurn}`}</div>
            <div className="text-sm font-extrabold text-white truncate">{nextTurn.instruction}</div>
          </div>
        </div>
      )}
      {arrived && <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#1a5208" }}><span className="text-3xl">🏁</span><span className="text-white text-base font-black">You have arrived!</span></div>}
      <div className="flex px-4 py-2.5" style={{ background: "rgba(28,79,9,.95)" }}>
        {[{ val: dr < 1 ? `${Math.round(dr * 1000)}m` : `${dr.toFixed(1)}km`, label: "Remaining", color: "#5aaa30" }, { val: fmt(tr), label: "Est. Time", color: "#c87820" }, { val: gpsSpeed ?? "—", label: "km/h", color: "#fff" }].map((s, i) => (
          <div key={i} className="flex-1 text-center" style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,.1)" : "none", padding: i === 0 ? "0 12px 0 0" : "0 12px" }}>
            <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs font-extrabold uppercase mt-0.5" style={{ color: "rgba(255,255,255,.5)", fontSize: 9 }}>{s.label}</div>
          </div>
        ))}
        <div className="flex-1 pl-3 flex flex-col items-center gap-1.5">
          <div className="relative w-9 h-9">
            <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" /><circle cx="18" cy="18" r="15" fill="none" stroke="#5aaa30" strokeWidth="3" strokeDasharray={`${(pct / 100) * 94.2} 94.2`} strokeLinecap="round" /></svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-black" style={{ fontSize: 9 }}>{pct}%</div>
          </div>
          <button onClick={onStop} className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold cursor-pointer" style={{ border: "1px solid rgba(255,100,100,.5)", background: "rgba(192,48,48,.3)", color: "#ffaaaa" }}>✕ End</button>
        </div>
      </div>
    </div>
  );
}

function RouteInfoBar({ route, onStartNav, onClear }) {
  return (
    <div className="flex items-center gap-3 flex-wrap rounded-2xl p-4" style={{ background: "linear-gradient(135deg,rgba(28,79,9,.08),rgba(42,112,16,.05))", border: "1.5px solid rgba(42,112,16,.25)" }}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: "#1c4f09" }}>A</div>
        <div className="text-xs font-bold truncate flex-1" style={{ color: "#3a5020" }}>{route.startLabel}</div>
        <div className="text-lg flex-shrink-0" style={{ color: "#5aaa30" }}>→</div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: "#c03030" }}>B</div>
        <div className="text-xs font-bold truncate flex-1" style={{ color: "#3a5020" }}>{route.endLabel}</div>
      </div>
      <div className="flex gap-3 items-center flex-shrink-0 flex-wrap">
        <div className="text-center"><div className="text-lg font-black" style={{ color: "#1c4f09" }}>{route.distance} <span className="text-xs">km</span></div><div className="text-xs font-bold uppercase" style={{ color: "#9aaa80", fontSize: 9 }}>Distance</div></div>
        <div className="text-center"><div className="text-lg font-black" style={{ color: "#c87820" }}>{route.duration} <span className="text-xs">min</span></div><div className="text-xs font-bold uppercase" style={{ color: "#9aaa80", fontSize: 9 }}>Drive Time</div></div>
        <button onClick={onStartNav} className="px-4 py-2 rounded-xl text-sm font-extrabold text-white cursor-pointer border-none" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>🚗 Start Nav</button>
        <button onClick={onClear} className="px-3 py-2 rounded-lg text-xs font-extrabold cursor-pointer" style={{ border: "1px solid rgba(192,48,48,.3)", background: "rgba(192,48,48,.07)", color: "#c03030" }}>✕ Clear</button>
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onFlyTo, onDirections, adoptions, rehome }) {
  if (!user) return null;
  const uA = adoptions.filter(a => a.user_id === user.id || a.email === user.email);
  const uR = rehome.filter(r => r.user_id === user.id || r.email === user.email);
  const addr = [user.address, user.city, user.province, user.zip_code].filter(Boolean).join(", ");
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleString("default", { month: "short" }), value: [...uA, ...uR].filter(r => { const rd = new Date(r.created_at || ""); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); }).length };
  });
  const pr = user._geo?.precision;
  const prLabel = pr === "street" ? "🔵 Street" : pr === "barangay" ? "🟢 Barangay" : pr === "city" ? "🟡 City" : pr === "gps" ? "📡 GPS" : "🔴 Province";
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,25,5,.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col" style={{ maxHeight: "90vh", background: "#fffce8", border: "1.5px solid rgba(90,160,48,.4)", boxShadow: "0 24px 64px rgba(30,80,10,.22)" }}>
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ background: "linear-gradient(135deg,rgba(42,112,16,.08),rgba(42,112,16,.03))", borderBottom: "1px solid #e8dfc0" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 128.5-46.5T480-440q66 0 132.5 15.5T741-378q29 15 46.5 43.5T805-272v112H160Z" /></svg>
          </div>
          <div className="flex-1"><div className="text-lg font-black" style={{ color: "#1a4a08" }}>{user.first_name} {user.last_name}</div><div className="text-xs font-semibold" style={{ color: "#7a9060" }}>{user.email}</div></div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: "#6a7a50", background: "rgba(180,140,60,0.1)" }}>{prLabel}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none text-base" style={{ background: "rgba(100,80,40,.08)", color: "#6a7a50" }}>✕</button>
        </div>
        <div className="overflow-y-auto p-5 flex flex-col gap-4">
          <div className="rounded-2xl p-4" style={{ background: "rgba(42,112,16,.05)", border: "1px solid rgba(42,112,16,.15)" }}>
            <div className="text-xs font-extrabold uppercase mb-2" style={{ color: "#9aaa80" }}>📍 Registered Address</div>
            <div className="text-sm font-bold leading-relaxed mb-3" style={{ color: "#1a2e0a" }}>{addr || "No address provided"}</div>
            {user._geo?.nominatimLabel && <div className="text-xs italic mb-3" style={{ color: "#9aaa80" }}>OSM: {user._geo.nominatimLabel}</div>}
            {user._geo?.inRegion && (
              <div className="flex gap-2">
                <button onClick={() => { onFlyTo(user._geo); onClose(); }} className="flex-1 py-2 rounded-xl text-xs font-extrabold cursor-pointer" style={{ border: "1px solid rgba(42,112,16,.3)", background: "rgba(42,112,16,.08)", color: "#1c4f09" }}>📍 Show on Map</button>
                <button onClick={() => { onDirections(user); onClose(); }} className="flex-1 py-2 rounded-xl text-xs font-extrabold text-white cursor-pointer border-none" style={{ background: "linear-gradient(135deg,#1c4f09,#2a7010)" }}>🗺 Get Directions</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ val: uA.length, label: "Adoptions", color: "#2a7010", icon: "❤️" }, { val: uR.length, label: "Rehoming", color: "#c87820", icon: "🏠" }, { val: [...uA, ...uR].filter(r => r.status === "Approved").length, label: "Approved", color: "#5aaa30", icon: "✓" }].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
                <div className="text-base">{s.icon}</div><div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs font-bold uppercase" style={{ color: "#9aaa80", fontSize: 9 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: "#fff8e8", border: "1px solid #e8dfc0" }}>
            <div className="text-xs font-extrabold uppercase mb-2" style={{ color: "#1a4a08" }}>📊 Activity — Last 6 Months</div>
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
    <div className="absolute top-3 right-3 z-50 w-56 rounded-2xl overflow-hidden" style={{ background: "#fffce8", border: "1.5px solid rgba(180,140,60,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
      {photo && <div className="h-28 overflow-hidden"><img src={photo} alt="" className="w-full h-full object-cover" onError={e => { e.target.parentElement.style.display = "none"; }} /></div>}
      <div className="p-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: isL ? "rgba(192,48,48,0.12)" : "rgba(28,79,9,0.10)", color: isL ? "#c03030" : "#1c4f09" }}>{isL ? "Lost" : "Found"}</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-sm" style={{ color: "#9aaa80" }}>✕</button>
        </div>
        <div className="font-black text-sm mb-1" style={{ color: "#1a4a08" }}>{pet.name || "Unknown"}</div>
        {(pet.species || pet.breed) && <div className="text-xs font-bold mb-1" style={{ color: "#7a9060" }}>{[pet.species, pet.breed].filter(Boolean).join(" · ")}</div>}
        {(pet.address || pet.area) && <div className="text-xs font-bold flex gap-1 mb-1" style={{ color: "#3a5020" }}><span style={{ color: "#B45A22" }}>📍</span><span style={{ lineHeight: 1.4 }}>{pet.address || pet.area}</span></div>}
        {pet.color && <div className="text-xs font-bold" style={{ color: "#7a9060" }}>Color: {pet.color}</div>}
        {pr && <div className="text-xs mt-1" style={{ color: "#9aaa80" }}>{pr === "street" ? "🔵 Street-level pin" : pr === "barangay" ? "🟢 Barangay pin" : pr === "gps" ? "📡 GPS pin" : "🟡 City pin"}</div>}
        {pet.details && <div className="text-xs leading-relaxed mt-2 pt-2" style={{ color: "#9aaa80", borderTop: "1px solid rgba(180,140,60,0.15)" }}>{pet.details.length > 90 ? pet.details.slice(0, 90) + "…" : pet.details}</div>}
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
  const [syncStatus, setSyncStatus] = useState("loading"); // loading | cached | syncing | fresh
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle
  const wRef = useRef(null), rRef = useRef(null), mapRef = useRef(null);
  useEffect(() => { rRef.current = route; }, [route]);

  useEffect(() => {
    if (!show) return;

    // ── STEP 1: Restore cached pins INSTANTLY (zero network) ──
    const cachedUserPins = loadPinCache(USER_PINS_KEY);
    const cachedPetPins  = loadPinCache(PET_PINS_KEY);
    const hasCache = cachedUserPins?.data?.length > 0;

    if (hasCache) {
      setGeocodedUsers(cachedUserPins.data);
      if (cachedPetPins?.data) setMissingPets(cachedPetPins.data);
      setSyncStatus("cached");
    } else {
      setSyncStatus("loading");
    }

    // ── STEP 2: Fetch fresh data from server (background if cached) ──
    const CACHE_TTL_MS = 10 * 60 * 1000; // re-geocode only if >10 min old
    const userCacheAge = pinCacheAge(USER_PINS_KEY);

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

      // Skip re-geocoding if cache is fresh enough and IDs haven't changed
      const cachedIds = new Set((cachedUserPins?.data || []).map(u => u.id));
      const freshIds  = new Set(users.map(u => u.id));
      const idsChanged = users.some(u => !cachedIds.has(u.id)) || [...cachedIds].some(id => !freshIds.has(id));
      const needsRegeocode = !hasCache || idsChanged || userCacheAge > CACHE_TTL_MS;

      if (!needsRegeocode) {
        // Merge any new user data (name changes etc) into existing cached pins
        const pinMap = new Map((cachedUserPins?.data || []).map(u => [u.id, u]));
        const merged = users.map(u => {
          const p = pinMap.get(u.id);
          return p ? { ...u, _geo: p._geo } : null;
        }).filter(Boolean);
        setGeocodedUsers(merged);
        setSyncStatus("fresh");
        return;
      }

      // ── Geocode users in background (show progress only if no cache) ──
      setSyncStatus("syncing");
      if (!hasCache) setGeocodingProgress({ done: 0, total: users.length + approved.length, active: true });

      const userGeoResults = [];
      let lastBatchUpdate = [];

      await geocodeBatch(
        users,
        async (user) => {
          const result = await geocodeUser(user);
          userGeoResults.push(result);
          return result;
        },
        (done) => {
          if (!hasCache) setGeocodingProgress(p => ({ ...p, done }));
          // Update map every 15 geocodes for live feel
          if (done % 15 === 0 || done === users.length) {
            const partial = users.slice(0, done).map((u, i) => userGeoResults[i]?.inRegion ? { ...u, _geo: userGeoResults[i] } : null).filter(Boolean);
            lastBatchUpdate = partial;
            setGeocodedUsers(partial);
          }
        },
        15
      );

      const geocodedU = users.map((u, i) => userGeoResults[i]?.inRegion ? { ...u, _geo: userGeoResults[i] } : null).filter(Boolean);
      setGeocodedUsers(geocodedU);
      savePinCache(USER_PINS_KEY, geocodedU); // persist for next session

      const petGeoResults = await geocodeBatch(
        approved,
        geocodePet,
        (done) => { if (!hasCache) setGeocodingProgress(p => ({ ...p, done: users.length + done })); },
        10
      );

      const geocodedP = approved.map((pet, i) => petGeoResults[i]?.inRegion ? { ...pet, _geo: petGeoResults[i] } : null).filter(Boolean);
      setMissingPets(geocodedP);
      savePinCache(PET_PINS_KEY, geocodedP); // persist for next session
      setGeocodingProgress({ done: 0, total: 0, active: false });
      setSyncStatus("fresh");

    }).catch(() => { setSyncStatus(hasCache ? "cached" : "loading"); });
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
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <PageHeader title="🗺 Ilocos Region — User Map" subtitle="Street-level OSM geocoding · MapLibre · ORS Navigation" />
          <div className="mt-1"><SyncBadge status={syncStatus} /></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "inactive"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all"
              style={{ border: "1.5px solid", background: filter === f ? "#1c4f09" : "transparent", borderColor: filter === f ? "#1c4f09" : "#ddd0a8", color: filter === f ? "#fff" : "#7a9060" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Province cards — 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {pStats.map(p => (
          <div key={p.name} onClick={() => setProvFilter(provFilter === p.name ? "all" : p.name)}
            className="rounded-2xl p-3 md:p-4 cursor-pointer transition-all"
            style={{ background: provFilter === p.name ? `${p.color}18` : "#fffce8", border: `1.5px solid ${provFilter === p.name ? p.color : "rgba(200,180,100,.3)"}`, transform: provFilter === p.name ? "translateY(-2px)" : "none" }}>
            <div className="text-xs font-extrabold mb-1 truncate" style={{ color: "#1a4a08" }}>{p.name}</div>
            <div className="text-2xl md:text-3xl font-black leading-none" style={{ color: p.color }}>{p.count}</div>
            <div className="text-xs mt-1" style={{ color: "#9aaa80", fontWeight: 600 }}>{p.active} active</div>
          </div>
        ))}
      </div>

      {/* Stats row — 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { val: rawUsers.length, label: "Total Users", icon: "👥", color: "#1c4f09" },
          { val: geocodedUsers.length, label: "Pinned on Map", icon: "📍", color: "#2a7010" },
          { val: brgCount, label: "High-Precision", icon: "🏘", color: "#5aaa30" },
          { val: mc.all, label: "Missing Pets", icon: "🐾", color: "#B45A22" }
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 flex items-center gap-2 md:gap-3" style={{ border: `1px solid ${s.color}22`, background: `${s.color}0a` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: `${s.color}18` }}>{s.icon}</div>
            <div><div className="text-xl font-black leading-none" style={{ color: "#1a4a08" }}>{s.val}</div><div className="text-xs font-bold uppercase leading-tight mt-0.5" style={{ color: "#9aaa80", fontSize: 9 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Background sync progress */}
      {geocodingProgress.active && <GeocodingProgress done={geocodingProgress.done} total={geocodingProgress.total} />}

      {/* Nav / Route bars */}
      {navActive && route && <NavHUD route={route} progress={navProg} gpsSpeed={gpsSpd} nextTurn={nt} onStop={stopNav} />}
      {!navActive && route && <RouteInfoBar route={route} onStartNav={startNav} onClear={clrRoute} />}

      {/* Missing pets controls */}
      <div className="rounded-2xl p-3 md:p-4" style={{ background: "rgba(255,248,220,0.88)", border: "1.5px solid rgba(180,90,34,0.28)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowML(v => !v)}
              className="relative flex-shrink-0 cursor-pointer border-none"
              style={{ width: 36, height: 20, borderRadius: 10, background: showML ? "#B45A22" : "rgba(180,140,60,0.28)", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: showML ? "18px" : "2px", width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
            </button>
            <div>
              <div className="text-xs font-black" style={{ color: "#1a4a08" }}>🐾 Missing Pets Layer</div>
              <div className="text-xs font-bold" style={{ color: "#9aaa80" }}>{showML ? `${fPets.length} of ${missingPets.length} reports` : "Layer hidden"}</div>
            </div>
          </div>
          {showML && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex gap-0.5 rounded-full p-0.5" style={{ background: "rgba(255,248,220,0.7)", border: "1px solid rgba(180,140,60,0.25)" }}>
                {[["all", "All"], ["lost", "Lost"], ["found", "Found"]].map(([v, l]) => (
                  <button key={v} onClick={() => setMpType(v)}
                    className="px-3 py-1 rounded-full text-xs font-extrabold border-none cursor-pointer"
                    style={{ fontFamily: "inherit", background: mpType === v ? (v === "lost" ? "#c03030" : v === "found" ? "#1c4f09" : "#B45A22") : "transparent", color: mpType === v ? "#fff" : "#3a5020" }}>
                    {l} {v !== "all" && mc[v] > 0 && `(${mc[v]})`}
                  </button>
                ))}
              </div>
              <div className="inline-flex gap-0.5 rounded-full p-0.5" style={{ background: "rgba(255,248,220,0.7)", border: "1px solid rgba(180,140,60,0.25)" }}>
                {[["all", "All"], ["Dog", "🐕"], ["Cat", "🐈"], ["Other", "Other"]].map(([v, l]) => (
                  <button key={v} onClick={() => setMpSp(v)}
                    className="px-3 py-1 rounded-full text-xs font-extrabold border-none cursor-pointer"
                    style={{ fontFamily: "inherit", background: mpSp === v ? "#B45A22" : "transparent", color: mpSp === v ? "#fff" : "#3a5020" }}>{l}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        {showML && (
          <div className="flex gap-4 flex-wrap mt-2.5 pt-2.5 items-center" style={{ borderTop: "1px solid rgba(180,140,60,0.18)" }}>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: "#c03030", border: "2px solid #fff" }} /><span className="text-xs font-bold" style={{ color: "#6a7a50" }}>Lost (!)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: "#1c4f09", border: "2px solid #fff" }} /><span className="text-xs font-bold" style={{ color: "#6a7a50" }}>Found (✓)</span></div>
            <div className="hidden md:flex gap-3 ml-auto flex-wrap">
              <span className="text-xs font-bold" style={{ color: "#00b8d9" }}>🔵 Cyan = street-level</span>
              <span className="text-xs font-bold" style={{ color: "#5aaa30" }}>🟢 White = barangay</span>
              <span className="text-xs font-bold" style={{ color: "#c87820" }}>🟡 Yellow = city</span>
            </div>
          </div>
        )}
      </div>

      {/* Map + Sidebar — stacked on mobile, side-by-side on lg */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-3">
        {/* Map Card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${navActive ? "rgba(28,79,9,.6)" : "rgba(90,160,48,.35)"}`, boxShadow: "0 4px 20px rgba(30,60,10,.08)" }}>
          {/* Map toolbar */}
          <div className="px-3 md:px-4 py-2.5" style={{ background: navActive ? "rgba(28,79,9,.97)" : "rgba(255,248,220,.97)", borderBottom: "1px solid #e8dfc0" }}>
            {dirUser && !route
              ? <DirectionsPanel destination={{ lat: dirUser._geo.lat, lng: dirUser._geo.lng, label: `${dirUser.first_name} ${dirUser.last_name}, ${dirUser.city || ""}` }} onRouteReady={handleRR} onClose={() => setDirUser(null)} />
              : (
                <div className="flex items-center gap-2">
                  {navActive
                    ? <span className="text-xs font-extrabold" style={{ color: "#5aaa30" }}>🛰 GPS Navigation Active</span>
                    : <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, city, address…"
                        className="flex-1 border-none bg-transparent outline-none text-sm font-semibold"
                        style={{ color: "#1a2e0a", fontFamily: "inherit" }} />
                      {search && <button onClick={() => setSearch("")} className="border-none bg-transparent cursor-pointer text-xs" style={{ color: "#9aaa80" }}>✕</button>}
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: "#9aaa80" }}>{fUsers.length} users</span>
                      {showML && <span className="text-xs font-bold flex-shrink-0" style={{ color: "#B45A22" }}>· {fPets.length} pets</span>}
                      {/* Mobile sidebar toggle */}
                      <button onClick={() => setSidebarOpen(v => !v)}
                        className="lg:hidden ml-1 px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer"
                        style={{ borderColor: "#ddd0a8", color: "#5a7040", background: "rgba(255,250,232,.8)" }}>☰</button>
                    </>
                  }
                </div>
              )}
          </div>

          {/* Map */}
          <div className="relative" style={{ height: "clamp(300px, 50vw, 520px)" }}>
            {show && <MapView users={fUsers} missingPets={fPets} showMissingLayer={showML} route={route} navActive={navActive} vehiclePos={vPos} onSelectUser={setSelected} onSelectMp={setSelMp} flyTarget={flyTgt} mapRef={mapRef} />}
            {selMp && <PetPanel pet={selMp} onClose={() => setSelMp(null)} />}
          </div>

          {/* Map footer legend */}
          <div className="px-3 md:px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: "rgba(255,252,235,.97)", borderTop: "1px solid #e8dfc0" }}>
            {Object.entries(PROVINCES).map(([p, cfg]) => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-xs font-bold" style={{ color: "#6a7a50" }}>{p}</span>
              </div>
            ))}
            <span className="text-xs ml-auto hidden md:block" style={{ color: "#9aaa80" }}>© OpenStreetMap · MapLibre GL JS</span>
          </div>
        </div>

        {/* Sidebar — slide-down on mobile, always visible on lg */}
        <div className={`rounded-2xl overflow-hidden flex flex-col ${sidebarOpen ? "block" : "hidden"} lg:flex`}
          style={{ border: "1.5px solid #ddd0a8", background: "#fffce8" }}>
          <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between" style={{ borderBottom: "1px solid #e8dfc0", background: "rgba(255,248,220,.97)" }}>
            <div>
              <div className="text-xs font-extrabold uppercase" style={{ color: "#1a4a08" }}>{navActive ? "🚗 Navigation" : `Users (${fUsers.length})`}</div>
              {showML && !navActive && <div className="text-xs font-bold mt-0.5" style={{ color: "#B45A22" }}>🐾 {fPets.length} pets on map</div>}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden border-none bg-transparent cursor-pointer text-sm font-bold" style={{ color: "#9aaa80" }}>✕</button>
          </div>

          {navActive ? (
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
              {route?.steps?.map((step, i) => {
                let c = 0; for (let j = 0; j < i; j++) c += route.steps[j].distance || 0;
                const passed = trav >= c + (step.distance || 0); const cur = !passed && trav >= c;
                return (
                  <div key={i} className="px-4 py-2 flex items-center gap-2"
                    style={{ borderBottom: "1px solid rgba(200,176,100,.1)", background: cur ? "rgba(28,79,9,.08)" : "transparent", opacity: passed ? .45 : 1 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: cur ? "#1c4f09" : passed ? "rgba(90,170,48,.15)" : "rgba(42,112,16,.08)" }}>
                      {passed ? "✓" : tIcon(step.instruction)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold truncate leading-snug" style={{ color: cur ? "#1c4f09" : "#1a2e0a" }}>{step.instruction}</div>
                      <div className="text-xs font-semibold" style={{ color: "#9aaa80" }}>{step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
              {fUsers.length === 0
                ? <div className="p-8 text-center text-sm font-semibold" style={{ color: "#9aa880" }}>No users match filters</div>
                : fUsers.map(u => (
                  <div key={u.id} className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(200,176,100,.12)" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: u.is_active ? pColor(u._geo?.province) : "#ccc" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold truncate" style={{ color: "#1a2e0a" }}>{u.first_name} {u.last_name}</div>
                      <div className="text-xs font-semibold" style={{ color: "#7a9060" }}>{u.city || "—"} · <span style={{ color: u._geo?.precision === "street" ? "#00b8d9" : u._geo?.precision === "barangay" ? "#5aaa30" : "#c87820" }}>{u._geo?.precision}</span></div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setSelected(u)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs cursor-pointer" style={{ border: "1px solid rgba(42,112,16,.25)", background: "rgba(42,112,16,.07)", color: "#1c4f09" }}>👁</button>
                      <button onClick={() => handleDir(u)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs cursor-pointer border-none" style={{ background: "#1c4f09", color: "#fff" }}>🗺</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selected && <UserModal user={selected} onClose={() => setSelected(null)} onFlyTo={geo => setFlyTgt({ lat: geo.lat, lng: geo.lng })} onDirections={handleDir} adoptions={adoptions} rehome={rehome} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .maplibregl-ctrl-group { border-radius: 10px !important; overflow: hidden; }
        .maplibregl-ctrl-attrib { font-size: 10px !important; }
      `}</style>
    </div>
  );
}