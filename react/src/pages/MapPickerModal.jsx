// ─────────────────────────────────────────────────────────────────────────────
// DROP-IN PATCH for RegisterPage.jsx
//
// 1. Add this import at the top of RegisterPage.jsx (after existing imports):
//    import MapPickerModal from "./MapPickerModal"; // or paste the component inline
//
// 2. Add state in RegisterPage:
//    const [showMap, setShowMap] = useState(false);
//
// 3. Replace the Step 2 block with the one below.
//
// 4. Add <MapPickerModal> just before the closing </> in the return.
//
// Or just copy MapPickerModal as a sibling function inside the same file.
// ─────────────────────────────────────────────────────────────────────────────

// ── MapPickerModal ────────────────────────────────────────────────────────────
// Paste this function ABOVE the RegisterPage export (or in a separate file).

import { useEffect, useRef, useState } from "react";

function MapPickerModal({ onClose, onConfirm }) {
  const mapRef      = useRef(null);
  const leafletMap  = useRef(null);
  const markerRef   = useRef(null);
  const [picked, setPicked]     = useState(null);   // { lat, lng, label }
  const [loading, setLoading]   = useState(false);
  const [geoErr, setGeoErr]     = useState("");

  // ── Load Leaflet from CDN once ────────────────────────────────────────────
  useEffect(() => {
    // Inject CSS if not already present
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    // Inject JS if not already loaded
    const initMap = () => {
      if (leafletMap.current || !mapRef.current) return;
      const L = window.L;

      // Default center: Manila, Philippines
      const map = L.map(mapRef.current, { zoomControl: true }).setView([14.5995, 120.9842], 12);
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Custom paw marker icon
      const pawIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;
          background:linear-gradient(135deg,#1c4f09,#2a6e10);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid #fff;
          box-shadow:0 4px 12px rgba(28,79,9,0.45);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg style="transform:rotate(45deg)" width="20" height="20" viewBox="0 0 100 100" fill="white" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="66" rx="24" ry="21"/>
            <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
            <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/>
            <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
            <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
          </svg>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const placeMarker = (lat, lng) => {
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng], { icon: pawIcon }).addTo(map);
        setLoading(true);
        setGeoErr("");
        // Reverse geocode via Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r => r.json())
          .then(data => {
            const a = data.address || {};
            const road      = a.road || a.pedestrian || a.footway || "";
            const houseNo   = a.house_number || "";
            const suburb    = a.suburb || a.village || a.neighbourhood || "";
            const city      = a.city || a.town || a.municipality || "";
            const province  = a.province || a.state || "";
            const postcode  = a.postcode || "";
            const streetLine = [houseNo, road, suburb].filter(Boolean).join(" ");
            setPicked({ lat, lng, street: streetLine, city, province, zip: postcode, label: data.display_name });
          })
          .catch(() => setGeoErr("Could not fetch address. You can still confirm."))
          .finally(() => setLoading(false));
      };

      map.on("click", e => placeMarker(e.latlng.lat, e.latlng.lng));

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 15);
            placeMarker(pos.coords.latitude, pos.coords.longitude);
          },
          () => {} // silently fail — user can click manually
        );
      }
    };

    if (window.L) {
      initMap();
    } else if (!document.getElementById("leaflet-js")) {
      const script  = document.createElement("script");
      script.id     = "leaflet-js";
      script.src    = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      // Script tag exists but may still be loading
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap(); }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, []);

  const handleConfirm = () => {
    if (!picked) return;
    onConfirm(picked);
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:"fixed",inset:0,zIndex:20000,
        background:"rgba(10,25,5,0.65)",
        backdropFilter:"blur(8px)",
        display:"flex",alignItems:"center",justifyContent:"center",
        padding:"1rem",
        animation:"modalFadeIn .22s ease",
      }}
    >
      <div style={{
        width:"100%",maxWidth:680,
        background:"rgba(255,250,230,0.97)",
        borderRadius:24,
        overflow:"hidden",
        boxShadow:"0 28px 72px rgba(28,79,9,0.22),0 4px 16px rgba(0,0,0,0.10)",
        display:"flex",flexDirection:"column",
        maxHeight:"90vh",
        animation:"modalSlideUp .28s cubic-bezier(.34,1.3,.64,1)",
      }}>

        {/* Header */}
        <div style={{
          display:"flex",alignItems:"center",gap:"0.8rem",
          padding:"1.1rem 1.4rem",
          background:"linear-gradient(135deg,#1c4f09,#2a6e10)",
          flexShrink:0,
        }}>
          <div style={{
            width:38,height:38,background:"rgba(255,255,255,0.15)",
            borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontFamily:"'Nunito',sans-serif",fontSize:"1rem",fontWeight:900,color:"#fff",margin:0 }}>
              Pin Your Address
            </h3>
            <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.74rem",fontWeight:700,color:"rgba(255,255,255,0.75)",margin:0 }}>
              Click anywhere on the map to set your location
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft:"auto",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:32,height:32,borderRadius:8,fontSize:"1.2rem",display:"flex",alignItems:"center",justifyContent:"center" }}
          >×</button>
        </div>

        {/* Map */}
        <div style={{ position:"relative", flex:"1 1 380px", minHeight:340 }}>
          <div ref={mapRef} style={{ width:"100%",height:"100%",minHeight:340 }} />

          {/* Hint overlay — shown before pin is placed */}
          {!picked && !loading && (
            <div style={{
              position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
              background:"rgba(28,79,9,0.88)",color:"#fff",
              padding:"0.6rem 1.1rem",borderRadius:30,
              fontFamily:"'Nunito',sans-serif",fontSize:"0.82rem",fontWeight:800,
              pointerEvents:"none",whiteSpace:"nowrap",
              boxShadow:"0 4px 16px rgba(0,0,0,0.2)",
              animation:"modalFadeIn .4s ease",
            }}>
              📍 Click on the map to drop a pin
            </div>
          )}

          {loading && (
            <div style={{
              position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",
              background:"rgba(28,79,9,0.9)",color:"#fff",
              padding:"0.45rem 1rem",borderRadius:20,
              fontFamily:"'Nunito',sans-serif",fontSize:"0.78rem",fontWeight:800,
              display:"flex",alignItems:"center",gap:"0.4rem",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Fetching address…
            </div>
          )}
        </div>

        {/* Address preview */}
        {(picked || geoErr) && (
          <div style={{
            padding:"0.9rem 1.4rem",
            background:"rgba(240,252,232,0.85)",
            borderTop:"1.5px solid rgba(90,170,48,0.25)",
            flexShrink:0,
          }}>
            {geoErr && (
              <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.78rem",fontWeight:700,color:"#c03030",margin:"0 0 0.5rem" }}>
                ⚠ {geoErr}
              </p>
            )}
            {picked && (
              <div style={{ display:"flex",alignItems:"flex-start",gap:"0.6rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" style={{ flexShrink:0,marginTop:2 }} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/>
                </svg>
                <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.82rem",fontWeight:700,color:"#2a5010",lineHeight:1.5,margin:0 }}>
                  {picked.label}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display:"flex",gap:"0.7rem",padding:"0.9rem 1.4rem",
          borderTop:"1.5px solid rgba(180,150,80,0.22)",
          background:"rgba(255,250,228,0.9)",
          flexShrink:0,
        }}>
          <button onClick={onClose} style={{
            flex:1,padding:"0.7rem",border:"2px solid rgba(28,79,9,0.3)",
            background:"transparent",color:"#1c4f09",
            fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:800,
            borderRadius:10,
          }}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!picked || loading}
            style={{
              flex:2,padding:"0.7rem",border:"none",
              background: picked ? "linear-gradient(135deg,#1c4f09,#2a6e10)" : "rgba(180,180,160,0.4)",
              color: picked ? "#fff" : "#aaa",
              fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:800,
              borderRadius:10,
              boxShadow: picked ? "0 4px 14px rgba(28,79,9,0.28)" : "none",
              transition:"all 0.2s",
            }}
          >
            {picked ? "✓ Use This Location" : "Drop a pin first"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATED STEP 2 — replace your existing {step===2 && (...)} block with this:
// ─────────────────────────────────────────────────────────────────────────────

/*
  REQUIRED: Add this state to RegisterPage:
    const [showMap, setShowMap] = useState(false);

  REQUIRED: Add this handler to RegisterPage:
    function handleMapConfirm(loc) {
      setForm(f => ({
        ...f,
        address:  loc.street   || f.address,
        city:     loc.city     || f.city,
        province: loc.province || f.province,
        zip:      loc.zip      || f.zip,
      }));
      setErrors(v => ({ ...v, address:"", city:"", province:"", zip:"" }));
      setShowMap(false);
    }

  REQUIRED: Add inside the return, before closing </>:
    {showMap && <MapPickerModal onClose={() => setShowMap(false)} onConfirm={handleMapConfirm} />}
*/

// Step 2 JSX — paste this replacing your existing step===2 block:
const Step2JSX = `
{step===2 && (
  <div className="step-content">

    {/* Address field with GPS button */}
    <div style={{ marginBottom:"0.95rem", display:"flex", flexDirection:"column" }}>
      <label htmlFor="address" style={{
        fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase",
        letterSpacing:"0.07em", color: errors.address ? "#c03030" : "#276010",
        marginBottom:"0.38rem", fontStyle:"italic",
      }}>
        Home Address
      </label>
      <div style={{ position:"relative", display:"flex", gap:"0.5rem", alignItems:"center" }}>
        <input
          id="address" type="text" placeholder="Street address"
          value={form.address} onChange={set("address")}
          className="field-input"
          style={{
            flex:1, padding:"0.75rem 0.9rem",
            border:\`2px solid \${errors.address ? "#d04040" : "#5aaa30"}\`,
            borderLeft: errors.address ? "4px solid #d04040" : "2px solid #5aaa30",
            borderRadius:10,
            background: errors.address ? "rgba(253,240,240,0.60)" : "rgba(255,250,232,0.52)",
            fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem",
            fontWeight:600, color:"#222", outline:"none",
            transition:"border-color 0.18s,box-shadow 0.18s",
          }}
        />

        {/* GPS Button */}
        <button
          type="button"
          onClick={() => setShowMap(true)}
          title="Pick location on map"
          style={{
            flexShrink:0,
            width:44, height:44,
            background:"linear-gradient(135deg,#1c4f09,#2a6e10)",
            border:"none", borderRadius:10,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 3px 10px rgba(28,79,9,0.30)",
            transition:"transform 0.15s,box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 18px rgba(28,79,9,0.38)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";   e.currentTarget.style.boxShadow="0 3px 10px rgba(28,79,9,0.30)"; }}
        >
          {/* GPS / Location SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/>
            <line x1="12" y1="2" x2="12" y2="0"/>
            <line x1="12" y1="22" x2="12" y2="24"/>
            <line x1="2" y1="10" x2="0" y2="10"/>
            <line x1="24" y1="10" x2="22" y2="10"/>
          </svg>
        </button>
      </div>

      {errors.address && (
        <span style={{ display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.72rem",fontWeight:700,color:"#c03030",marginTop:"0.28rem" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {errors.address}
        </span>
      )}
    </div>

    <p style={{ fontSize:"0.76rem",fontWeight:700,color:"#5a8a30",marginTop:"-0.5rem",marginBottom:"0.85rem",paddingLeft:"0.15rem",display:"flex",alignItems:"center",gap:"0.35rem" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      This helps us match you with animals in your area — or use the pin button to auto-fill from the map
    </p>

    <div style={{ display:"flex",gap:"0.9rem" }}>
      <Field label="City"     id="city"     placeholder="City"     value={form.city}     onChange={set("city")}     error={errors.city}     style={{ flex:1 }}/>
      <Field label="Province" id="province" placeholder="Province" value={form.province} onChange={set("province")} error={errors.province} style={{ flex:1 }}/>
    </div>
    <Field label="Zip / Postal Code" id="zip" placeholder="Zip / Postal Code" value={form.zip} onChange={set("zip")} error={errors.zip}/>

    <div style={{ display:"flex",gap:"0.9rem",marginTop:"0.4rem" }}>
      <button className="btn-outline" onClick={()=>goTo(1)} style={{ ...btnBase,flex:1,background:"transparent",color:"#1c4f09",border:"2px solid rgba(28,79,9,0.35)",fontWeight:800,fontSize:"0.95rem" }}>← Back</button>
      <button className="btn-primary" onClick={()=>goTo(3)} style={{ ...btnBase,flex:2,background:"linear-gradient(135deg,#1c4f09,#2a6e10)",color:"#fff",boxShadow:"0 4px 16px rgba(28,79,9,0.25)" }}>Continue →</button>
    </div>
  </div>
)}
`;