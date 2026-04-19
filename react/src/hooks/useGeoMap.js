// ── useGeoMap.js — All geocoding, caching, and data-fetching logic ────────────

import { useState, useEffect } from "react";
import api from "../config/axios";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
export const SB             = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
export const REGION1_CENTER = [16.5, 120.4];
export const REGION1_ZOOM   = 8;
const GEO_CACHE_KEY  = "pawster_geo_cache_v5"; // bumped → old cache auto-ignored
const USER_PINS_KEY  = "pawster_user_pins_v5"; // bumped → forces fresh geocode
const PET_PINS_KEY   = "pawster_pet_pins_v5";  // bumped → forces fresh geocode
const CACHE_TTL_MS   = 10 * 60 * 1000;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const PROVINCES = {
  "Ilocos Norte": { color: "#d4880a" },
  "Ilocos Sur":   { color: "#c87820" },
  "La Union":     { color: "#5aaa30" },
  "Pangasinan":   { color: "#588B41" },
};

export const PROVINCE_CENTERS = {
  "Ilocos Norte": { lat: 18.1977, lng: 120.5937 },
  "Ilocos Sur":   { lat: 17.5747, lng: 120.3872 },
  "La Union":     { lat: 16.6159, lng: 120.3166 },
  "Pangasinan":   { lat: 16.0430, lng: 120.3330 },
};

const R1 = { minLat: 15.50, maxLat: 18.70, minLng: 119.60, maxLng: 121.10 };

export const CITY_CENTERS = {
  "laoag":             { lat: 18.1977, lng: 120.5937, province: "Ilocos Norte" },
  "laoag city":        { lat: 18.1977, lng: 120.5937, province: "Ilocos Norte" },
  "batac":             { lat: 18.0554, lng: 120.5648, province: "Ilocos Norte" },
  "batac city":        { lat: 18.0554, lng: 120.5648, province: "Ilocos Norte" },
  "pagudpud":          { lat: 18.5629, lng: 120.7940, province: "Ilocos Norte" },
  "paoay":             { lat: 18.0663, lng: 120.5291, province: "Ilocos Norte" },
  "bangui":            { lat: 18.5333, lng: 120.7667, province: "Ilocos Norte" },
  "vintar":            { lat: 18.2333, lng: 120.6500, province: "Ilocos Norte" },
  "pasuquin":          { lat: 18.3333, lng: 120.6167, province: "Ilocos Norte" },
  "bacarra":           { lat: 18.2500, lng: 120.6167, province: "Ilocos Norte" },
  "piddig":            { lat: 18.1667, lng: 120.7000, province: "Ilocos Norte" },
  "sarrat":            { lat: 18.1667, lng: 120.6333, province: "Ilocos Norte" },
  "dingras":           { lat: 18.1000, lng: 120.6833, province: "Ilocos Norte" },
  "nueva era":         { lat: 17.9333, lng: 120.6667, province: "Ilocos Norte" },
  "marcos":            { lat: 18.0333, lng: 120.7000, province: "Ilocos Norte" },
  "badoc":             { lat: 17.9167, lng: 120.4667, province: "Ilocos Norte" },
  "currimao":          { lat: 17.9833, lng: 120.4833, province: "Ilocos Norte" },
  "pinili":            { lat: 18.0167, lng: 120.6167, province: "Ilocos Norte" },
  "solsona":           { lat: 18.0167, lng: 120.7833, province: "Ilocos Norte" },
  "adams":             { lat: 18.4500, lng: 120.9167, province: "Ilocos Norte" },
  "carasi":            { lat: 18.0167, lng: 120.8333, province: "Ilocos Norte" },
  "dumalneg":          { lat: 18.3667, lng: 120.8667, province: "Ilocos Norte" },
  "banna":             { lat: 18.1167, lng: 120.6500, province: "Ilocos Norte" },
  "san nicolas":       { lat: 18.1733, lng: 120.5933, province: "Ilocos Norte" },
  "burgos":            { lat: 18.5167, lng: 120.6500, province: "Ilocos Norte" },
  "vigan":             { lat: 17.5747, lng: 120.3872, province: "Ilocos Sur"   },
  "vigan city":        { lat: 17.5747, lng: 120.3872, province: "Ilocos Sur"   },
  "candon":            { lat: 17.1970, lng: 120.4491, province: "Ilocos Sur"   },
  "candon city":       { lat: 17.1970, lng: 120.4491, province: "Ilocos Sur"   },
  "narvacan":          { lat: 17.4213, lng: 120.4388, province: "Ilocos Sur"   },
  "bantay":            { lat: 17.6000, lng: 120.3833, province: "Ilocos Sur"   },
  "sinait":            { lat: 17.8500, lng: 120.4333, province: "Ilocos Sur"   },
  "tagudin":           { lat: 16.9333, lng: 120.4500, province: "Ilocos Sur"   },
  "cabugao":           { lat: 17.7833, lng: 120.4000, province: "Ilocos Sur"   },
  "magsingal":         { lat: 17.6833, lng: 120.4167, province: "Ilocos Sur"   },
  "caoayan":           { lat: 17.5333, lng: 120.4000, province: "Ilocos Sur"   },
  "santa":             { lat: 17.4667, lng: 120.4333, province: "Ilocos Sur"   },
  "cervantes":         { lat: 17.0167, lng: 120.7667, province: "Ilocos Sur"   },
  "nagbukel":          { lat: 17.2167, lng: 120.5000, province: "Ilocos Sur"   },
  "san esteban":       { lat: 17.5833, lng: 120.3667, province: "Ilocos Sur"   },
  "santa lucia":       { lat: 17.1333, lng: 120.4667, province: "Ilocos Sur"   },
  "santa maria":       { lat: 17.3667, lng: 120.4667, province: "Ilocos Sur"   },
  "santiago":          { lat: 17.3167, lng: 120.4500, province: "Ilocos Sur"   },
  "san fernando":      { lat: 16.6159, lng: 120.3166, province: "La Union"     },
  "san fernando city": { lat: 16.6159, lng: 120.3166, province: "La Union"     },
  "bauang":            { lat: 16.5300, lng: 120.3300, province: "La Union"     },
  "agoo":              { lat: 16.3200, lng: 120.3700, province: "La Union"     },
  "aringay":           { lat: 16.3833, lng: 120.3500, province: "La Union"     },
  "caba":              { lat: 16.4833, lng: 120.3500, province: "La Union"     },
  "naguilian":         { lat: 16.5500, lng: 120.3833, province: "La Union"     },
  "luna":              { lat: 16.8667, lng: 120.3667, province: "La Union"     },
  "balaoan":           { lat: 16.8167, lng: 120.3833, province: "La Union"     },
  "bacnotan":          { lat: 16.7333, lng: 120.3500, province: "La Union"     },
  "tubao":             { lat: 16.4500, lng: 120.4167, province: "La Union"     },
  "pugo":              { lat: 16.4667, lng: 120.4833, province: "La Union"     },
  "rosario":           { lat: 16.2167, lng: 120.4833, province: "La Union"     },
  "santo tomas":       { lat: 16.3500, lng: 120.3333, province: "La Union"     },
  "san gabriel":       { lat: 16.7000, lng: 120.4333, province: "La Union"     },
  "santol":            { lat: 16.7667, lng: 120.4333, province: "La Union"     },
  "sudipen":           { lat: 16.7333, lng: 120.5167, province: "La Union"     },
  "bagulin":           { lat: 16.6167, lng: 120.4500, province: "La Union"     },
  "bangar":            { lat: 16.8833, lng: 120.4167, province: "La Union"     },
  "san juan":          { lat: 16.6500, lng: 120.3200, province: "La Union"     },
  "dagupan":           { lat: 16.0430, lng: 120.3330, province: "Pangasinan"   },
  "dagupan city":      { lat: 16.0430, lng: 120.3330, province: "Pangasinan"   },
  "alaminos":          { lat: 16.1555, lng: 119.9796, province: "Pangasinan"   },
  "alaminos city":     { lat: 16.1555, lng: 119.9796, province: "Pangasinan"   },
  "urdaneta":          { lat: 15.9765, lng: 120.5706, province: "Pangasinan"   },
  "urdaneta city":     { lat: 15.9765, lng: 120.5706, province: "Pangasinan"   },
  "lingayen":          { lat: 16.0200, lng: 120.2300, province: "Pangasinan"   },
  "san carlos":        { lat: 15.9255, lng: 120.3486, province: "Pangasinan"   },
  "san carlos city":   { lat: 15.9255, lng: 120.3486, province: "Pangasinan"   },
  "calasiao":          { lat: 16.0100, lng: 120.3600, province: "Pangasinan"   },
  "manaoag":           { lat: 15.9700, lng: 120.4900, province: "Pangasinan"   },
  "pozorrubio":        { lat: 16.1167, lng: 120.5500, province: "Pangasinan"   },
  "sison":             { lat: 16.1833, lng: 120.5333, province: "Pangasinan"   },
  "umingan":           { lat: 15.9167, lng: 120.8000, province: "Pangasinan"   },
  "tayug":             { lat: 15.9500, lng: 120.7333, province: "Pangasinan"   },
  "laoac":             { lat: 15.8500, lng: 120.5500, province: "Pangasinan"   },
  "malasiqui":         { lat: 15.9167, lng: 120.4167, province: "Pangasinan"   },
  "mangaldan":         { lat: 16.0667, lng: 120.4333, province: "Pangasinan"   },
  "mapandan":          { lat: 16.0833, lng: 120.4500, province: "Pangasinan"   },
  "rosales":           { lat: 15.8833, lng: 120.6333, province: "Pangasinan"   },
  "san fabian":        { lat: 16.1167, lng: 120.3833, province: "Pangasinan"   },
  "villasis":          { lat: 15.9000, lng: 120.5833, province: "Pangasinan"   },
  "sual":              { lat: 16.0667, lng: 120.1000, province: "Pangasinan"   },
  "bolinao":           { lat: 16.3833, lng: 119.8833, province: "Pangasinan"   },
  "dasol":             { lat: 15.9833, lng: 119.8833, province: "Pangasinan"   },
  "masinloc":          { lat: 15.5333, lng: 119.9500, province: "Pangasinan"   },
  // Baguio — technically CAR but users often enter it
  "baguio":            { lat: 16.4023, lng: 120.5960, province: "La Union"     },
  "baguio city":       { lat: 16.4023, lng: 120.5960, province: "La Union"     },
};

const PROV_MAP = {
  "ilocos norte": "Ilocos Norte", "iln": "Ilocos Norte",
  "ilocos sur":   "Ilocos Sur",   "ils": "Ilocos Sur",
  "la union":     "La Union",     "lau": "La Union",
  "pangasinan":   "Pangasinan",   "pan": "Pangasinan",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function inRegion1(lat, lng) {
  return lat >= R1.minLat && lat <= R1.maxLat && lng >= R1.minLng && lng <= R1.maxLng;
}
export function guessProvince(lat) {
  if (lat >= 18.0) return "Ilocos Norte";
  if (lat >= 17.0) return "Ilocos Sur";
  if (lat >= 16.3) return "La Union";
  if (lat >= 15.7) return "Pangasinan";
  return null;
}
export function detectProvince(text) {
  const t = (text || "").toLowerCase();
  for (const [k, v] of Object.entries(PROV_MAP)) { if (t.includes(k)) return v; }
  return null;
}
export function jitter(amt = 0.003) { return (Math.random() - 0.5) * amt; }
export function precisionFromType(type) {
  if (!type) return "city";
  if (["house", "building", "residential"].includes(type)) return "street";
  if (["suburb", "quarter", "neighbourhood", "hamlet", "village", "amenity"].includes(type)) return "barangay";
  return "city";
}
export function pColor(p) { return PROVINCES[p]?.color || "#2a7010"; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── PERSISTENT GEO CACHE ─────────────────────────────────────────────────────
const _geoCache = new Map();
try {
  const saved = JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "{}");
  Object.entries(saved).forEach(([k, v]) => _geoCache.set(k, v));
} catch {}
function _persistGeoCache() {
  try {
    const obj = {};
    _geoCache.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

// ─── PERSISTENT PIN CACHE ─────────────────────────────────────────────────────
export function loadPinCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
export function savePinCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}
export function pinCacheAge(key) {
  try {
    const c = JSON.parse(localStorage.getItem(key) || "null");
    return c ? Date.now() - c.ts : Infinity;
  } catch { return Infinity; }
}

// ─── NOMINATIM ────────────────────────────────────────────────────────────────
async function nominatim(query) {
  const key = query.toLowerCase().trim();
  if (_geoCache.has(key)) return _geoCache.get(key);
  try {
    const token = localStorage.getItem("pawster_token") || "";
    const res = await fetch(
      `/php/admin/dashboard?action=nominatim_search&q=${encodeURIComponent(query)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) { _geoCache.set(key, null); _persistGeoCache(); return null; }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) { _geoCache.set(key, null); _persistGeoCache(); return null; }
    const hit = data.find(r => inRegion1(parseFloat(r.lat), parseFloat(r.lon))) || data[0];
    if (!hit) { _geoCache.set(key, null); _persistGeoCache(); return null; }
    const result = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), displayName: hit.display_name, type: hit.type };
    _geoCache.set(key, result); _persistGeoCache();
    return result;
  } catch { _geoCache.set(key, null); return null; }
}

// ─── GEOCODING: USER ──────────────────────────────────────────────────────────
// KEY FIX: never returns { inRegion: false } — every user gets placed somewhere.
// Worst case they appear at the region center with precision="unknown".
export async function geocodeUser(user) {
  const prov   = detectProvince(`${user.province || ""} ${user.city || ""} ${user.address || ""}`);
  const city   = (user.city    || "").trim();
  const addr   = (user.address || "").trim();
  const cityFB = CITY_CENTERS[city.toLowerCase()];

  if (addr && city) {
    await sleep(1100);
    const r = await nominatim(`${addr}, ${city}, ${user.province || "Ilocos Region"}, Philippines`);
    if (r && inRegion1(r.lat, r.lng)) {
      return { lat: r.lat + jitter(0.001), lng: r.lng + jitter(0.001), province: prov || guessProvince(r.lat), inRegion: true, precision: precisionFromType(r.type), nominatimLabel: r.displayName };
    }
    const stripped = addr.replace(/^\d+[\s\-,]*/, "").trim();
    if (stripped && stripped !== addr) {
      await sleep(1100);
      const r2 = await nominatim(`${stripped}, ${city}, ${user.province || "Ilocos Region"}, Philippines`);
      if (r2 && inRegion1(r2.lat, r2.lng)) {
        return { lat: r2.lat + jitter(0.001), lng: r2.lng + jitter(0.001), province: prov || guessProvince(r2.lat), inRegion: true, precision: precisionFromType(r2.type), nominatimLabel: r2.displayName };
      }
    }
  }
  if (city && !cityFB) {
    await sleep(1100);
    const r = await nominatim(`${city}, ${user.province || "Ilocos Region"}, Philippines`);
    if (r && inRegion1(r.lat, r.lng)) {
      return { lat: r.lat + jitter(0.005), lng: r.lng + jitter(0.005), province: prov || guessProvince(r.lat), inRegion: true, precision: "city", nominatimLabel: r.displayName };
    }
  }
  if (cityFB) {
    return { lat: cityFB.lat + jitter(0.005), lng: cityFB.lng + jitter(0.005), province: cityFB.province, inRegion: true, precision: "city" };
  }
  const resolvedProv = prov || detectProvince(user.province || "");
  if (resolvedProv && PROVINCE_CENTERS[resolvedProv]) {
    const pc = PROVINCE_CENTERS[resolvedProv];
    return { lat: pc.lat + jitter(0.04), lng: pc.lng + jitter(0.04), province: resolvedProv, inRegion: true, precision: "province" };
  }
  // Absolute last resort — place at region center so user is never invisible
  console.warn(`[useGeoMap] No address data for user ${user.id} (${user.first_name} ${user.last_name}) — placing at region center`);
  return {
    lat:       REGION1_CENTER[0] + jitter(0.08),
    lng:       REGION1_CENTER[1] + jitter(0.08),
    province:  null,
    inRegion:  true,
    precision: "unknown",
  };
}

// ─── GEOCODING: PET ───────────────────────────────────────────────────────────
export async function geocodePet(pet) {
  if (pet.latitude && pet.longitude) {
    const lat = parseFloat(pet.latitude), lng = parseFloat(pet.longitude);
    if (inRegion1(lat, lng)) {
      return { lat, lng, province: guessProvince(lat), inRegion: true, precision: "gps" };
    }
  }
  const area   = (pet.area    || "").trim();
  const addr   = (pet.address || "").trim();
  const cityFB = CITY_CENTERS[area.toLowerCase()];
  const prov   = detectProvince(`${area} ${addr}`);
  if (addr && area) {
    await sleep(1100);
    const r = await nominatim(`${addr}, ${area}, Philippines`);
    if (r && inRegion1(r.lat, r.lng)) {
      return { lat: r.lat + jitter(0.001), lng: r.lng + jitter(0.001), province: prov || guessProvince(r.lat), inRegion: true, precision: precisionFromType(r.type), nominatimLabel: r.displayName };
    }
  }
  if (area && !cityFB) {
    await sleep(1100);
    const r = await nominatim(`${area}, Philippines`);
    if (r && inRegion1(r.lat, r.lng)) {
      return { lat: r.lat + jitter(0.005), lng: r.lng + jitter(0.005), province: prov || guessProvince(r.lat), inRegion: true, precision: "city", nominatimLabel: r.displayName };
    }
  }
  if (cityFB) {
    return { lat: cityFB.lat + jitter(0.005), lng: cityFB.lng + jitter(0.005), province: cityFB.province, inRegion: true, precision: "city" };
  }
  if (prov && PROVINCE_CENTERS[prov]) {
    const pc = PROVINCE_CENTERS[prov];
    return { lat: pc.lat + jitter(0.04), lng: pc.lng + jitter(0.04), province: prov, inRegion: true, precision: "province" };
  }
  return { inRegion: false };
}

// ─── BATCH GEOCODER ───────────────────────────────────────────────────────────
export async function geocodeBatch(items, geocodeFn, onProgress) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    results.push(await geocodeFn(items[i]));
    onProgress(i + 1, results);
  }
  return results;
}

// ─── phpApi HELPER ────────────────────────────────────────────────────────────
export async function phpApi(action, params = {}) {
  const token = localStorage.getItem("pawster_token") || "";
  const fd = new FormData();
  fd.append("action", action);
  Object.entries(params).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(`/php/admin/dashboard`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  return res.json();
}

// ─── MAIN HOOK ────────────────────────────────────────────────────────────────
export function useGeoMap(show) {
  const [rawUsers,          setRawUsers]          = useState([]);
  const [geocodedUsers,     setGeocodedUsers]     = useState([]);
  const [adoptions,         setAdoptions]         = useState([]);
  const [rehome,            setRehome]            = useState([]);
  const [missingPets,       setMissingPets]       = useState([]);
  const [syncStatus,        setSyncStatus]        = useState("loading");
  const [geocodingProgress, setGeocodingProgress] = useState({ done: 0, total: 0, active: false });

  useEffect(() => {
    if (!show) return;

    const cachedUserPins = loadPinCache(USER_PINS_KEY);
    const cachedPetPins  = loadPinCache(PET_PINS_KEY);
    const hasCache       = (cachedUserPins?.data?.length ?? 0) > 0;

    if (hasCache) {
      setGeocodedUsers(cachedUserPins.data);
      if (cachedPetPins?.data) setMissingPets(cachedPetPins.data);
      setSyncStatus("cached");
    } else {
      setSyncStatus("loading");
    }

    const userCacheAge = pinCacheAge(USER_PINS_KEY);

    Promise.all([
      phpApi("get_users_geo", {}),
      phpApi("get_requests", { type: "adoptions", limit: 1000 }),
      phpApi("get_requests", { type: "rehome",    limit: 1000 }),
      api.get("/api/missing-pets/admin/all").then(r => r.data).catch(() => []),
    ]).then(async ([ur, ar, rr, mp]) => {

      const users    = ur.success ? (ur.data || []) : [];
      const approved = (mp || []).filter(p => p.status === "approved");

      // ── DEV LOGGING — visible in Docker logs via `docker logs <container>` ─
      // These print to the browser console which you can see in DevTools even
      // inside Docker/WSL — open http://localhost:5173 in your host browser,
      // press F12 → Console tab.
      console.group(`%c[useGeoMap] API data loaded`, "color:#2a7010;font-weight:bold");
      console.log(`Users returned by get_users_geo: ${users.length}`);
      users.forEach(u => console.log(
        `  #${u.id} ${u.first_name} ${u.last_name} | city="${u.city}" province="${u.province}" address="${u.address}"`
      ));
      console.log(`Approved missing pets: ${approved.length}`);
      console.groupEnd();

      setRawUsers(users);
      setAdoptions(ar.success ? (ar.data || []) : []);
      setRehome(rr.success ? (rr.data || []) : []);

      const cachedIds    = new Set((cachedUserPins?.data || []).map(u => String(u.id)));
      const freshIds     = new Set(users.map(u => String(u.id)));
      const idsChanged   = users.some(u => !cachedIds.has(String(u.id)))
                        || [...cachedIds].some(id => !freshIds.has(id));
      const needsRegeocode = !hasCache || idsChanged || userCacheAge > CACHE_TTL_MS;

      console.log(`[useGeoMap] needsRegeocode=${needsRegeocode} | hasCache=${hasCache} | idsChanged=${idsChanged}`);

      // ── FAST PATH ─────────────────────────────────────────────────────────
      if (!needsRegeocode) {
        const pinMap    = new Map((cachedUserPins?.data || []).map(u => [String(u.id), u]));
        const cachedU   = [];
        const uncachedU = [];

        users.forEach(u => {
          const key = String(u.id);
          if (pinMap.has(key)) {
            // Already processed — reuse cached _geo (may be null if no address)
            cachedU.push({ ...u, _geo: pinMap.get(key)?._geo ?? null });
          } else {
            // New user not yet geocoded
            uncachedU.push(u);
          }
        });

        console.log(`[useGeoMap] fast path | from cache: ${cachedU.length} | new to geocode: ${uncachedU.length}`);

        if (uncachedU.length === 0) {
          setGeocodedUsers(cachedU);
          setSyncStatus("fresh");
          return;
        }

        setSyncStatus("syncing");
        const newGeo = await geocodeBatch(uncachedU, geocodeUser, () => {});

        // FIX: keep ALL users — no .filter(Boolean)
        const newlyGeocoded = uncachedU.map((u, i) => ({
          ...u,
          _geo: newGeo[i]?.inRegion ? newGeo[i] : null,
        }));

        const allGeocoded = [...cachedU, ...newlyGeocoded];
        setGeocodedUsers(allGeocoded);
        savePinCache(USER_PINS_KEY, allGeocoded);
        setSyncStatus("fresh");
        return;
      }

      // ── FULL GEOCODE PATH ─────────────────────────────────────────────────
      setSyncStatus("syncing");
      setGeocodingProgress({ done: 0, total: users.length + approved.length, active: true });

      const userGeo = await geocodeBatch(users, geocodeUser, done => {
        setGeocodingProgress(p => ({ ...p, done }));
      });

      // FIX: keep ALL users — no .filter(Boolean)
      const geocodedU = users.map((u, i) => ({
        ...u,
        _geo: userGeo[i]?.inRegion ? userGeo[i] : null,
      }));

      console.group(`%c[useGeoMap] geocoding complete`, "color:#2a7010;font-weight:bold");
      geocodedU.forEach(u => console.log(
        `  #${u.id} ${u.first_name} ${u.last_name} → ${u._geo
          ? `lat=${u._geo.lat.toFixed(4)} lng=${u._geo.lng.toFixed(4)} precision=${u._geo.precision}`
          : "NO GEO (null address)"}`
      ));
      console.groupEnd();

      setGeocodedUsers(geocodedU);
      savePinCache(USER_PINS_KEY, geocodedU);

      const petGeo = await geocodeBatch(approved, geocodePet, done => {
        setGeocodingProgress(p => ({ ...p, done: users.length + done }));
      });
      const geocodedP = approved
        .map((pet, i) => petGeo[i]?.inRegion ? { ...pet, _geo: petGeo[i] } : null)
        .filter(Boolean);

      setMissingPets(geocodedP);
      savePinCache(PET_PINS_KEY, geocodedP);
      setGeocodingProgress({ done: 0, total: 0, active: false });
      setSyncStatus("fresh");

    }).catch(err => {
      console.error("[useGeoMap] fetch error:", err);
      setSyncStatus(hasCache ? "cached" : "loading");
    });

  }, [show]);

  return { rawUsers, geocodedUsers, adoptions, rehome, missingPets, syncStatus, geocodingProgress };
}