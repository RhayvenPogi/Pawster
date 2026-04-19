// ── LeafletMap.jsx ────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { REGION1_CENTER, REGION1_ZOOM, pColor } from "../../hooks/useGeoMap";

// ── Inject Leaflet CSS + JS once (idempotent) ─────────────────────────────────
function ensureLeaflet() {
  if (!document.getElementById("leaflet-css")) {
    const link = Object.assign(document.createElement("link"), {
      id: "leaflet-css", rel: "stylesheet",
      href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    });
    document.head.appendChild(link);
  }
  if (!document.getElementById("leaflet-js")) {
    const s = Object.assign(document.createElement("script"), {
      id: "leaflet-js", async: true,
      src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    });
    document.head.appendChild(s);
  }
}

// ── Icon builders (pure functions, only need window.L) ────────────────────────
function makeUserIcon(user) {
  const L     = window.L;
  const color = pColor(user._geo?.province);
  const pr    = user._geo?.precision;
  const ring  = pr === "street"   ? "#00cfff"
              : pr === "barangay" ? "#ffffff"
              : pr === "city"     ? "#ffe082"
              : "#ffcc80";
  const size  = user.is_active ? 14 : 10;
  const total = size + 8;
  return L.divIcon({
    className:  "",
    iconSize:   [total, total],
    iconAnchor: [total / 2, total / 2],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${user.is_active ? color : "#aaa"};
      border:3px solid ${ring};
      box-shadow:0 2px 8px rgba(0,0,0,0.40);
      opacity:${user.is_active ? 0.93 : 0.5};
      margin:${(total - size) / 2 - 3}px;
    "></div>`,
  });
}

function makePetIcon(pet) {
  const L      = window.L;
  const isLost = pet.type === "lost";
  const bg     = isLost ? "#c03030" : "#1c4f09";
  const label  = isLost ? "!" : "&#10003;";
  return L.divIcon({
    className:  "",
    iconSize:   [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${bg};border:3px solid #fff;
      box-shadow:0 2px 10px rgba(0,0,0,0.45);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:900;color:#fff;
      font-family:system-ui,sans-serif;
      margin:2px;
    ">${label}</div>`,
  });
}

// ── Popup HTML builders ───────────────────────────────────────────────────────
function userPopup(u) {
  const addr    = [u.address, u.city, u._geo?.province].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${u._geo?.lat},${u._geo?.lng}`;
  return `
    <div style="font-family:'Nunito',sans-serif;min-width:180px;line-height:1.5">
      <div style="font-weight:900;font-size:13px;color:#1a4a08;margin-bottom:3px">
        ${u.first_name ?? ""} ${u.last_name ?? ""}
      </div>
      ${addr ? `<div style="font-size:11px;color:#7a9060">${addr}</div>` : ""}
      <div style="font-size:10px;color:#9aaa80;font-style:italic;margin-top:3px">
        ${u._geo?.precision ?? ""} precision &nbsp;&middot;&nbsp;
        <span style="color:${u.is_active ? "#2a7010" : "#c03030"};font-weight:700">
          ${u.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
        style="display:inline-flex;align-items:center;gap:5px;margin-top:8px;
          padding:6px 12px;border-radius:8px;font-size:11px;font-weight:800;
          background:#1a5e0a;color:#fff;text-decoration:none;cursor:pointer;
          box-shadow:0 2px 6px rgba(0,0,0,0.20);">
        🗺 Get Directions
      </a>
    </div>`;
}

function petPopup(pet) {
  const isLost  = pet.type === "lost";
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pet._geo?.lat},${pet._geo?.lng}`;
  return `
    <div style="font-family:'Nunito',sans-serif;min-width:175px;line-height:1.5">
      <div style="font-weight:900;font-size:10px;letter-spacing:.06em;
        color:${isLost ? "#c03030" : "#1c4f09"};margin-bottom:3px">
        ${isLost ? "&#9679; LOST" : "&#9679; FOUND"}
      </div>
      <div style="font-weight:900;font-size:13px;color:#1a4a08;margin-bottom:2px">
        ${pet.name || "Unknown"}
      </div>
      ${[pet.species, pet.breed].filter(Boolean).length
        ? `<div style="font-size:11px;color:#7a9060">${[pet.species, pet.breed].filter(Boolean).join(" &middot; ")}</div>`
        : ""}
      ${pet.address
        ? `<div style="font-size:11px;color:#3a5020;margin-top:4px">&#128205; ${pet.address}</div>`
        : ""}
      ${pet.area
        ? `<div style="font-size:11px;color:#1c4f09">${pet.area}</div>`
        : ""}
      ${pet.color
        ? `<div style="font-size:10px;color:#7a6020;margin-top:2px">Color: ${pet.color}</div>`
        : ""}
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
        style="display:inline-flex;align-items:center;gap:5px;margin-top:8px;
          padding:6px 12px;border-radius:8px;font-size:11px;font-weight:800;
          background:${isLost ? "#a01010" : "#1a5e0a"};color:#fff;
          text-decoration:none;cursor:pointer;
          box-shadow:0 2px 6px rgba(0,0,0,0.20);">
        🗺 Get Directions
      </a>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LeafletMap({
  users        = [],
  pets         = [],
  showPets     = true,
  onSelectUser = () => {},
  onSelectPet  = () => {},
  flyTarget,
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);   // L.Map instance
  const readyRef     = useRef(false);  // true once map initialised

  // ── Stable refs so render helpers always see latest props without
  //    needing to be included in effect dependency arrays ─────────────────────
  const usersRef     = useRef(users);
  const petsRef      = useRef(pets);
  const showPetsRef  = useRef(showPets);
  const onUserRef    = useRef(onSelectUser);
  const onPetRef     = useRef(onSelectPet);

  usersRef.current    = users;
  petsRef.current     = pets;
  showPetsRef.current = showPets;
  onUserRef.current   = onSelectUser;
  onPetRef.current    = onSelectPet;

  // Marker arrays managed manually (no LayerGroup needed)
  const userMarkersRef = useRef([]);
  const petMarkersRef  = useRef([]);

  // ── Render helpers — defined once via useRef, always read from prop refs ───
  const renderUsers = useRef(() => {
    const m = mapRef.current;
    const L = window.L;
    if (!m || !L) return;

    // Remove old markers
    userMarkersRef.current.forEach(mk => mk.remove());
    userMarkersRef.current = [];

    usersRef.current.forEach(u => {
      if (!u._geo?.lat || !u._geo?.lng) return;

      const mk = L.marker([u._geo.lat, u._geo.lng], { icon: makeUserIcon(u) })
        .bindPopup(userPopup(u), { maxWidth: 260, closeButton: false })
        .addTo(m);

      mk.on("click", () => {
        onUserRef.current(u);
        mk.openPopup();
      });

      userMarkersRef.current.push(mk);
    });
  }).current;

  const renderPets = useRef(() => {
    const m = mapRef.current;
    const L = window.L;
    if (!m || !L) return;

    petMarkersRef.current.forEach(mk => mk.remove());
    petMarkersRef.current = [];

    if (!showPetsRef.current) return;

    petsRef.current.forEach(pet => {
      if (!pet._geo?.lat || !pet._geo?.lng) return;

      const mk = L.marker([pet._geo.lat, pet._geo.lng], { icon: makePetIcon(pet) })
        .bindPopup(petPopup(pet), { maxWidth: 280, closeButton: false })
        .addTo(m);

      mk.on("click", () => {
        onPetRef.current(pet);
        mk.openPopup();
      });

      petMarkersRef.current.push(mk);
    });
  }).current;

  // ── One-time init: inject Leaflet, build map, then draw initial data ───────
  useEffect(() => {
    ensureLeaflet();
    let intervalId;

    const tryInit = () => {
      if (!window.L || !containerRef.current || mapRef.current) return;
      const L = window.L;

      const m = L.map(containerRef.current, {
        center:      REGION1_CENTER,
        zoom:        REGION1_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(m);

      L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(m);

      mapRef.current   = m;
      readyRef.current = true;

      // Draw whatever data already arrived before map was ready
      renderUsers();
      renderPets();
    };

    if (window.L) {
      tryInit();
    } else {
      intervalId = setInterval(() => {
        if (window.L) { clearInterval(intervalId); tryInit(); }
      }, 150);
    }

    return () => {
      clearInterval(intervalId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current   = null;
        readyRef.current = false;
        userMarkersRef.current = [];
        petMarkersRef.current  = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once

  // ── Re-render users whenever the array identity changes ───────────────────
  useEffect(() => {
    if (readyRef.current) renderUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // ── Re-render pets whenever array or visibility changes ───────────────────
  useEffect(() => {
    if (readyRef.current) renderPets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets, showPets]);

  // ── Fly to target ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!flyTarget?.lat || !flyTarget?.lng || !mapRef.current) return;
    mapRef.current.flyTo([flyTarget.lat, flyTarget.lng], 14, { duration: 1.2 });
  }, [flyTarget]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          font-size: 13px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important;
          font-family: 'Nunito', sans-serif !important;
          padding: 10px 14px !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip     { background: #fff !important; }
        .leaflet-control-attribution { font-size: 10px !important; }
        .leaflet-control-zoom a {
          border-radius: 6px !important;
          font-weight: 900 !important;
          color: #1c4f09 !important;
        }
      `}</style>
    </div>
  );
}