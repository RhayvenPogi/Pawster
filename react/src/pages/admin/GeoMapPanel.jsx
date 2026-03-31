// ── GEO MAP PANEL — GPS-driven navigation + Missing Pets overlay ──────────────
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer, TileLayer, CircleMarker, Polygon,
  Tooltip, Popup, useMap, Polyline, Marker
} from "react-leaflet";
import L from "leaflet";
import { phpApi, PageHeader } from "../../shared";

const ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImMxNDExZDdhZGUzOTQ5YmM5ZjNkMzc5ZGU0MTZlNjc2IiwiaCI6Im11cm11cjY0In0=";
const ILOCOS_CENTER = [17.0, 120.45];
const ILOCOS_ZOOM   = 8;

const PROVINCES = {
  "Ilocos Norte": { color:"#d4880a", bounds:[[18.65,120.55],[18.68,120.78],[18.60,120.92],[18.42,121.00],[18.25,120.92],[18.10,120.80],[18.00,120.68],[18.10,120.54],[18.30,120.45],[18.55,120.42]] },
  "Ilocos Sur":   { color:"#c87820", bounds:[[18.00,120.68],[18.10,120.80],[17.85,120.52],[17.55,120.35],[17.30,120.28],[17.20,120.38],[17.45,120.60],[17.70,120.68],[17.88,120.72]] },
  "La Union":     { color:"#5aaa30", bounds:[[17.20,120.38],[17.30,120.28],[16.95,120.20],[16.75,120.22],[16.55,120.28],[16.45,120.34],[16.50,120.52],[16.72,120.50],[17.10,120.48]] },
  "Pangasinan":   { color:"#588B41", bounds:[[16.45,120.34],[16.55,120.28],[16.20,119.90],[15.95,119.82],[15.80,120.00],[15.85,120.50],[16.18,120.65],[16.38,120.60],[16.42,120.48]] },
};

const CITY_COORDS = {
  "laoag":[18.1977,120.5937],"laoag city":[18.1977,120.5937],"batac":[18.0554,120.5648],"batac city":[18.0554,120.5648],
  "pagudpud":[18.5629,120.7940],"paoay":[18.0663,120.5291],"bangui":[18.5333,120.7667],"vintar":[18.2333,120.6500],
  "pasuquin":[18.3333,120.6167],"bacarra":[18.2500,120.6167],"piddig":[18.1667,120.7000],"sarrat":[18.1667,120.6333],
  "nueva era":[17.9333,120.6667],"marcos":[18.0333,120.7000],
  "vigan":[17.5747,120.3872],"vigan city":[17.5747,120.3872],"candon":[17.1970,120.4491],"candon city":[17.1970,120.4491],
  "narvacan":[17.4213,120.4388],"santa":[17.4667,120.4333],"bantay":[17.6000,120.3833],"sinait":[17.8500,120.4333],
  "tagudin":[16.9333,120.4500],"santa cruz":[17.1167,120.4500],"cabugao":[17.7833,120.4000],"magsingal":[17.6833,120.4167],
  "san fernando":[16.6159,120.3166],"san fernando city":[16.6159,120.3166],"bauang":[16.5300,120.3300],
  "agoo":[16.3200,120.3700],"aringay":[16.3833,120.3500],"caba":[16.4833,120.3500],"naguilian":[16.5500,120.3833],
  "luna":[16.8667,120.3667],"balaoan":[16.8167,120.3833],"bacnotan":[16.7333,120.3500],"tubao":[16.4500,120.4167],
  "dagupan":[16.0430,120.3330],"dagupan city":[16.0430,120.3330],"alaminos":[16.1555,119.9796],"alaminos city":[16.1555,119.9796],
  "urdaneta":[15.9765,120.5706],"urdaneta city":[15.9765,120.5706],"lingayen":[16.0200,120.2300],
  "san carlos":[15.9255,120.3486],"san carlos city":[15.9255,120.3486],"calasiao":[16.0100,120.3600],
  "manaoag":[15.9700,120.4900],"umingan":[15.9167,120.8000],"pozorrubio":[16.1167,120.5500],"sison":[16.1833,120.5333],
  "manila":[14.5995,120.9842],"quezon city":[14.6760,121.0437],"makati":[14.5547,121.0244],
  "cebu":[10.3157,123.8854],"cebu city":[10.3157,123.8854],"davao":[7.1907,125.4553],
  "baguio":[16.4023,120.5960],"baguio city":[16.4023,120.5960],
  "olongapo":[14.8292,120.2828],"angeles":[15.1450,120.5887],"angeles city":[15.1450,120.5887],
  "tarlac":[15.4755,120.5963],"tarlac city":[15.4755,120.5963],
};

const PROV_CENTERS = {
  "Ilocos Norte":[18.197,120.594],"Ilocos Sur":[17.575,120.387],
  "La Union":[16.616,120.317],"Pangasinan":[16.043,120.333],
};

const PROVINCE_MAP = {
  "ilocos norte":"Ilocos Norte","ilocos sur":"Ilocos Sur","la union":"La Union","pangasinan":"Pangasinan",
  "iln":"Ilocos Norte","ils":"Ilocos Sur","lau":"La Union","pan":"Pangasinan",
  "ilocos norte province":"Ilocos Norte","ilocos sur province":"Ilocos Sur",
  "la union province":"La Union","pangasinan province":"Pangasinan",
  "la-union":"La Union","ilocossur":"Ilocos Sur","ilocosnorte":"Ilocos Norte",
};

const NORTE=["laoag","batac","pagudpud","paoay","bangui","vintar","pasuquin","bacarra","piddig","sarrat","nueva era","marcos"];
const SUR=["vigan","candon","narvacan","santa","bantay","sinait","tagudin","santa cruz","cabugao","magsingal"];
const UNION=["san fernando","bauang","agoo","aringay","caba","naguilian","luna","balaoan","bacnotan","tubao"];

function normalizeProvince(p) {
  if (!p) return null;
  return PROVINCE_MAP[p.trim().toLowerCase()] || null;
}
function guessProv(c) {
  if (NORTE.includes(c)) return "Ilocos Norte";
  if (SUR.includes(c))   return "Ilocos Sur";
  if (UNION.includes(c)) return "La Union";
  return "Pangasinan";
}
function geocodeUser(user) {
  const city=(user.city||"").trim().toLowerCase();
  const normProv=normalizeProvince(user.province||"");
  if (CITY_COORDS[city]) {
    const [lat,lng]=CITY_COORDS[city];
    return {lat:lat+(Math.random()-.5)*.015,lng:lng+(Math.random()-.5)*.015,province:normProv||guessProv(city),inRegion:true};
  }
  const pk=Object.keys(CITY_COORDS).find(k=>city.includes(k)||k.includes(city));
  if (pk) {
    const [lat,lng]=CITY_COORDS[pk];
    return {lat:lat+(Math.random()-.5)*.015,lng:lng+(Math.random()-.5)*.015,province:normProv||guessProv(pk),inRegion:true};
  }
  if (normProv&&PROV_CENTERS[normProv]) {
    const [lat,lng]=PROV_CENTERS[normProv];
    return {lat:lat+(Math.random()-.5)*.08,lng:lng+(Math.random()-.5)*.08,province:normProv,inRegion:true};
  }
  return {inRegion:false};
}

/* Geocode a missing pet report using its area/city field */
async function geocodeMissingPetFull(pet) {
  // 1. Already has coordinates — use directly
  if (pet.latitude && pet.longitude) {
    return { lat: pet.latitude, lng: pet.longitude, inRegion: true };
  }

  // 2. Try full address geocoding via ORS (most accurate)
  if (pet.address) {
    try {
      const query = [pet.address, pet.area, 'Philippines'].filter(Boolean).join(', ');
      const url = `/ors/geocode/search?api_key=${ORS_KEY}&text=${encodeURIComponent(query)}&size=1&boundary.country=PH`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features?.length) {
          const [lng, lat] = data.features[0].geometry.coordinates;
          // Sanity check — must be within Philippines bounding box
          if (lat > 4 && lat < 22 && lng > 116 && lng < 127) {
            return { lat, lng, inRegion: true };
          }
        }
      }
    } catch { /* fall through to city lookup */ }
  }

  // 3. Fallback — match city name from CITY_COORDS table
  const city = (pet.area || '').trim().toLowerCase();
  if (CITY_COORDS[city]) {
    const [lat, lng] = CITY_COORDS[city];
    return { lat: lat + (Math.random()-.5)*.012, lng: lng + (Math.random()-.5)*.012, inRegion: true };
  }
  const pk = Object.keys(CITY_COORDS).find(k => city.includes(k) || k.includes(city));
  if (pk) {
    const [lat, lng] = CITY_COORDS[pk];
    return { lat: lat + (Math.random()-.5)*.012, lng: lng + (Math.random()-.5)*.012, inRegion: true };
  }

  return { inRegion: false };
}

async function geocodeLocation(text) {
  const lower = text.trim().toLowerCase();
  if (CITY_COORDS[lower]) return {lat:CITY_COORDS[lower][0],lng:CITY_COORDS[lower][1],label:text};
  const pk = Object.keys(CITY_COORDS).find(k => lower.includes(k) || k.includes(lower));
  if (pk) return {lat:CITY_COORDS[pk][0],lng:CITY_COORDS[pk][1],label:text};
  const url = `/ors/geocode/search?api_key=${ORS_KEY}&text=${encodeURIComponent(text)}&size=1&boundary.country=PH`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.features?.length) throw new Error(`Location "${text}" not found`);
  const [lng,lat] = data.features[0].geometry.coordinates;
  const label = data.features[0].properties.label || text;
  return {lat,lng,label};
}

function haversineMetres(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

function remainingDistanceKm(points, fromIdx) {
  let d = 0;
  for (let i = fromIdx; i < points.length - 1; i++) d += haversineMetres(points[i], points[i+1]);
  return d / 1000;
}

function bearing(from, to) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const dLng = toRad(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(toRad(to[0]));
  const x = Math.cos(toRad(from[0])) * Math.sin(toRad(to[0])) - Math.sin(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function snapToRoute(routePoints, lat, lng) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < routePoints.length; i++) {
    const d = haversineMetres([lat, lng], routePoints[i]);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

function getNextTurn(steps, travelledMetres) {
  if (!steps?.length) return null;
  let cum = 0;
  for (const step of steps) {
    cum += step.distance || 0;
    if (travelledMetres < cum) {
      const distToTurn = cum - travelledMetres;
      return { instruction: step.instruction || "Continue", distToTurn: distToTurn < 1000 ? `${Math.round(distToTurn)} m` : `${(distToTurn / 1000).toFixed(1)} km` };
    }
  }
  return { instruction: "You have arrived at your destination", distToTurn: "" };
}

function turnIcon(instruction) {
  const i = (instruction || "").toLowerCase();
  if (i.includes("left")) return "↰";
  if (i.includes("right")) return "↱";
  if (i.includes("u-turn")) return "↩";
  if (i.includes("roundabout")) return "⟳";
  if (i.includes("arrive") || i.includes("destination")) return "🏁";
  if (i.includes("merge")) return "⤵";
  if (i.includes("ramp")) return "↗";
  return "↑";
}

function makeVehicleIcon(rotation) {
  return L.divIcon({
    className: "",
    html: `<div style="width:40px;height:40px;transform:rotate(${rotation}deg);transition:transform 0.4s ease;filter:drop-shadow(0 4px 8px rgba(0,0,0,.55))"><svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="25" rx="11" ry="8" fill="#1c4f09" stroke="#fff" stroke-width="1.5"/><ellipse cx="20" cy="18" rx="7" ry="6" fill="#2a7010" stroke="#fff" stroke-width="1"/><ellipse cx="20" cy="16" rx="4.5" ry="3" fill="rgba(180,230,255,0.9)" stroke="#5aaa30" stroke-width="0.8"/><ellipse cx="14" cy="22" rx="2" ry="1.4" fill="#fffbe0" opacity="0.9"/><ellipse cx="26" cy="22" rx="2" ry="1.4" fill="#fffbe0" opacity="0.9"/><polygon points="20,3 23,10 20,8 17,10" fill="#5aaa30" stroke="#fff" stroke-width="0.8"/><ellipse cx="12" cy="28" rx="2.8" ry="2.2" fill="#111" stroke="#888" stroke-width="0.7"/><ellipse cx="28" cy="28" rx="2.8" ry="2.2" fill="#111" stroke="#888" stroke-width="0.7"/><ellipse cx="12" cy="21" rx="2.8" ry="2.2" fill="#111" stroke="#888" stroke-width="0.7"/><ellipse cx="28" cy="21" rx="2.8" ry="2.2" fill="#111" stroke="#888" stroke-width="0.7"/><circle cx="20" cy="20" r="18" fill="none" stroke="rgba(90,170,48,0.35)" stroke-width="1.5" stroke-dasharray="4 3"/></svg></div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  });
}

const startIcon = L.divIcon({ className:"", html:`<div style="width:28px;height:28px;border-radius:50%;background:#1c4f09;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:900">A</div>`, iconSize:[28,28],iconAnchor:[14,14] });
const endIcon   = L.divIcon({ className:"", html:`<div style="width:28px;height:28px;border-radius:50%;background:#c03030;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:900">B</div>`, iconSize:[28,28],iconAnchor:[14,14] });

function MapController({flyTarget, routePoints, vehiclePos, isNavActive}) {
  const map = useMap();
  useEffect(()=>{ if (flyTarget) map.flyTo([flyTarget.lat,flyTarget.lng],13,{animate:true,duration:1.2}); },[flyTarget]);
  useEffect(()=>{ if (routePoints?.length>1 && !isNavActive) map.fitBounds(L.latLngBounds(routePoints),{padding:[40,40],animate:true,duration:1.0}); },[routePoints, isNavActive]);
  useEffect(()=>{ if (vehiclePos && isNavActive) map.panTo([vehiclePos.lat, vehiclePos.lng],{animate:true,duration:0.6,easeLinearity:0.5}); },[vehiclePos, isNavActive]);
  return null;
}

function VehicleMarker({pos, rotation}) {
  const [icon, setIcon] = useState(()=>makeVehicleIcon(rotation));
  useEffect(()=>{ setIcon(makeVehicleIcon(rotation)); },[rotation]);
  if (!pos) return null;
  return <Marker position={[pos.lat,pos.lng]} icon={icon} zIndexOffset={2000}/>;
}

function AccuracyCircle({pos, accuracy}) {
  if (!pos || !accuracy) return null;
  return <CircleMarker center={[pos.lat,pos.lng]} radius={Math.min(accuracy/2,60)} pathOptions={{color:"#5aaa30",fillColor:"#5aaa30",fillOpacity:0.08,weight:1,dashArray:"4 3"}}/>;
}

function BarChart({data,color="#2a7010"}) {
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{width:"100%",borderRadius:"3px 3px 0 0",height:`${Math.max(4,(d.value/max)*52)}px`,background:color,opacity:.85}}/>
          <span style={{fontSize:9,color:"#9aaa80",fontWeight:700}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DirectionsPanel({destination, onRouteReady, onClose}) {
  const [fromText, setFromText] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [useGeo, setUseGeo]     = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);

  const getLocation = () => {
    if (!navigator.geolocation){setError("Geolocation not supported.");return;}
    navigator.geolocation.getCurrentPosition(
      pos=>{setGeoCoords({lat:pos.coords.latitude,lng:pos.coords.longitude});setUseGeo(true);setFromText("📍 My Current Location");setError("");},
      ()=>{setError("Could not get location. Type an address instead.");}
    );
  };

  const getRoute = async () => {
    setLoading(true); setError("");
    try {
      let startCoord;
      if (useGeo && geoCoords) { startCoord = {...geoCoords, label:"My Location"}; }
      else { startCoord = await geocodeLocation(fromText); }
      const res = await fetch("/ors/v2/directions/driving-car/geojson", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":ORS_KEY},
        body:JSON.stringify({ coordinates:[[startCoord.lng,startCoord.lat],[destination.lng,destination.lat]], instructions:true, instructions_format:"text" })
      });
      if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err?.error?.message || "Route calculation failed"); }
      const data = await res.json();
      const feature = data.features[0];
      const coords = feature.geometry.coordinates.map(([lng,lat])=>[lat,lng]);
      const props  = feature.properties.summary;
      const steps  = feature.properties.segments?.flatMap(seg => seg.steps || []) || [];
      onRouteReady({ points:coords, start:startCoord, end:destination, distance:(props.distance/1000).toFixed(1), duration:Math.round(props.duration/60), startLabel:startCoord.label||fromText, steps, totalMetres:props.distance });
    } catch(e) { setError(e.message || "Could not calculate route."); }
    setLoading(false);
  };

  return (
    <div style={{background:"rgba(42,112,16,.05)",border:"1px solid rgba(42,112,16,.2)",borderRadius:14,padding:"1rem 1.1rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".07em"}}>🗺 Get Directions</div>
        <button onClick={onClose} style={{border:"none",background:"none",color:"#9aaa80",cursor:"pointer",fontSize:13,fontWeight:700}}>✕ Cancel</button>
      </div>
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",marginBottom:4}}>From — Point A</div>
        <div style={{display:"flex",gap:6}}>
          <input value={fromText} onChange={e=>{setFromText(e.target.value);setUseGeo(false);setError("");}} onKeyDown={e=>e.key==="Enter"&&fromText.trim()&&getRoute()} placeholder="Type any city, address…"
            style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid #c8b878",background:"rgba(255,250,232,.8)",fontSize:13,fontWeight:600,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={getLocation} title="Use GPS location"
            style={{padding:"8px 12px",borderRadius:8,border:"1px solid #c8b878",background:useGeo?"#1c4f09":"rgba(255,250,232,.8)",color:useGeo?"#fff":"#5a7040",fontSize:14,cursor:"pointer",fontWeight:700}}>
            📍 GPS
          </button>
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",marginBottom:4}}>To — Point B</div>
        <div style={{padding:"8px 10px",borderRadius:8,border:"1px solid rgba(192,48,48,.3)",background:"rgba(192,48,48,.05)",fontSize:13,fontWeight:600,color:"#1a2e0a"}}>📍 {destination.label}</div>
      </div>
      {error && <div style={{fontSize:12,color:"#c03030",fontWeight:600,marginBottom:8,padding:"6px 8px",background:"rgba(192,48,48,.07)",borderRadius:6}}>⚠ {error}</div>}
      <button onClick={getRoute} disabled={loading||(!fromText.trim()&&!useGeo)}
        style={{width:"100%",padding:"9px",borderRadius:10,border:"none",background:loading||(!fromText.trim()&&!useGeo)?"#ccc":"linear-gradient(135deg,#1c4f09,#2a7010)",color:"#fff",fontSize:13,fontWeight:800,cursor:loading||(!fromText.trim()&&!useGeo)?"not-allowed":"pointer"}}>
        {loading?"🔍 Finding Route…":"Calculate Route →"}
      </button>
    </div>
  );
}

function NavHUD({ route, progress, gpsSpeed, gpsAccuracy, nextTurn, onStop }) {
  const pct = Math.round((progress / Math.max(route.points.length - 1, 1)) * 100);
  const distRem = remainingDistanceKm(route.points, progress);
  const timeRem = Math.max(0, Math.round(route.duration * (1 - pct / 100)));
  const arrived = pct >= 100;
  const fmtTime = mins => { if (mins < 1) return "< 1 min"; if (mins < 60) return `${mins} min`; return `${Math.floor(mins/60)}h ${mins%60}m`; };

  return (
    <div style={{borderRadius:16,overflow:"hidden",boxShadow:"0 6px 24px rgba(28,79,9,.35)",border:"1.5px solid rgba(90,170,48,.3)"}}>
      {nextTurn && !arrived && (
        <div style={{background:"linear-gradient(135deg,#1c4f09,#1a5208)",padding:"10px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,border:"1.5px solid rgba(255,255,255,.2)"}}>{turnIcon(nextTurn.instruction)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:"rgba(255,255,255,.65)",fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:".1em",marginBottom:2}}>{nextTurn.distToTurn&&`In ${nextTurn.distToTurn}`}</div>
            <div style={{color:"#fff",fontSize:14,fontWeight:800,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nextTurn.instruction}</div>
          </div>
          <div style={{flexShrink:0,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:800,color:gpsAccuracy==null?"#c87820":gpsAccuracy<15?"#5aaa30":gpsAccuracy<40?"#c87820":"#c03030"}}>{gpsAccuracy==null?"⚡ GPS":gpsAccuracy<15?"📡 High":gpsAccuracy<40?"📡 Mid":"📡 Low"}</div>
            {gpsAccuracy!=null&&<div style={{color:"rgba(255,255,255,.5)",fontSize:9,fontWeight:600}}>±{Math.round(gpsAccuracy)}m</div>}
          </div>
        </div>
      )}
      {arrived && <div style={{background:"linear-gradient(135deg,#1a5208,#2a7010)",padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:28}}>🏁</div><div style={{color:"#fff",fontSize:15,fontWeight:900}}>You have arrived!</div></div>}
      <div style={{background:"rgba(28,79,9,.95)",padding:"10px 16px",display:"flex",alignItems:"center",gap:0}}>
        <div style={{flex:1,borderRight:"1px solid rgba(255,255,255,.1)",paddingRight:12,textAlign:"center"}}>
          <div style={{color:"#5aaa30",fontSize:20,fontWeight:900,lineHeight:1}}>{distRem<1?`${Math.round(distRem*1000)} m`:`${distRem.toFixed(1)} km`}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",marginTop:2}}>Remaining</div>
        </div>
        <div style={{flex:1,borderRight:"1px solid rgba(255,255,255,.1)",padding:"0 12px",textAlign:"center"}}>
          <div style={{color:"#c87820",fontSize:20,fontWeight:900,lineHeight:1}}>{fmtTime(timeRem)}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",marginTop:2}}>Est. Time</div>
        </div>
        <div style={{flex:1,borderRight:"1px solid rgba(255,255,255,.1)",padding:"0 12px",textAlign:"center"}}>
          <div style={{color:"#fff",fontSize:20,fontWeight:900,lineHeight:1}}>{gpsSpeed!=null?gpsSpeed:"—"}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:".08em",marginTop:2}}>km/h</div>
        </div>
        <div style={{flex:1,paddingLeft:12,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{position:"relative",width:36,height:36}}>
            <svg viewBox="0 0 36 36" style={{transform:"rotate(-90deg)"}}><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3"/><circle cx="18" cy="18" r="15" fill="none" stroke="#5aaa30" strokeWidth="3" strokeDasharray={`${(pct/100)*94.2} 94.2`} strokeLinecap="round"/></svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:900}}>{pct}%</div>
          </div>
          <button onClick={onStop} style={{padding:"3px 10px",borderRadius:8,border:"1px solid rgba(255,100,100,.5)",background:"rgba(192,48,48,.3)",color:"#ffaaaa",fontSize:10,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>✕ End Nav</button>
        </div>
      </div>
    </div>
  );
}

function RouteInfoBar({route, onStartNav, onClear}) {
  return (
    <div style={{background:"linear-gradient(135deg,rgba(28,79,9,.08),rgba(42,112,16,.05))",border:"1.5px solid rgba(42,112,16,.25)",borderRadius:14,padding:"1rem 1.2rem",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
        <div style={{width:26,height:26,borderRadius:"50%",background:"#1c4f09",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>A</div>
        <div style={{fontSize:12,fontWeight:700,color:"#3a5020",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{route.startLabel}</div>
        <div style={{fontSize:18,color:"#5aaa30",flexShrink:0}}>→</div>
        <div style={{width:26,height:26,borderRadius:"50%",background:"#c03030",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>B</div>
        <div style={{fontSize:12,fontWeight:700,color:"#3a5020",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{route.endLabel}</div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center",flexShrink:0}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#1c4f09",lineHeight:1}}>{route.distance}<span style={{fontSize:10}}> km</span></div><div style={{fontSize:9,color:"#9aaa80",fontWeight:700,textTransform:"uppercase"}}>Distance</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:"#c87820",lineHeight:1}}>{route.duration}<span style={{fontSize:10}}> min</span></div><div style={{fontSize:9,color:"#9aaa80",fontWeight:700,textTransform:"uppercase"}}>Drive Time</div></div>
        <button onClick={onStartNav} style={{padding:"9px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#1c4f09,#2a7010)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(28,79,9,.35)"}}>🚗 Start Navigation</button>
        <button onClick={onClear} style={{padding:"8px 12px",borderRadius:8,border:"1px solid rgba(192,48,48,.3)",background:"rgba(192,48,48,.07)",color:"#c03030",fontSize:12,fontWeight:800,cursor:"pointer"}}>✕ Clear</button>
      </div>
    </div>
  );
}

function UserModal({user,onClose,onFlyTo,onDirections,adoptions,rehome}) {
  if (!user) return null;
  const userA=adoptions.filter(a=>a.user_id===user.id||a.email===user.email);
  const userR=rehome.filter(r=>r.user_id===user.id||r.email===user.email);
  const fullAddress=[user.address,user.city,user.province,user.zip_code].filter(Boolean).join(", ");
  const monthly=Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-(5-i)); return {label:d.toLocaleString("default",{month:"short"}),value:[...userA,...userR].filter(r=>{ const rd=new Date(r.created_at||""); return rd.getMonth()===d.getMonth()&&rd.getFullYear()===d.getFullYear(); }).length}; });
  const sc={ Approved:[...userA,...userR].filter(r=>r.status==="Approved").length, Pending:[...userA,...userR].filter(r=>r.status==="Pending").length, Rejected:[...userA,...userR].filter(r=>r.status==="Rejected").length };
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(10,25,5,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:600,maxHeight:"90vh",borderRadius:24,overflow:"hidden",display:"flex",flexDirection:"column",background:"#fffce8",border:"1.5px solid rgba(90,160,48,.4)",boxShadow:"0 24px 64px rgba(30,80,10,.22)"}}>
        <div style={{padding:"1.2rem 1.4rem",background:"linear-gradient(135deg,rgba(42,112,16,.08),rgba(42,112,16,.03))",borderBottom:"1px solid #e8dfc0",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{width:46,height:46,borderRadius:12,background:"linear-gradient(135deg,#1c4f09,#2a7010)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 128.5-46.5T480-440q66 0 132.5 15.5T741-378q29 15 46.5 43.5T805-272v112H160Z"/></svg>
          </div>
          <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.1rem",fontWeight:900,color:"#1a4a08"}}>{user.first_name} {user.last_name}</div><div style={{fontSize:11,color:"#7a9060",fontWeight:600}}>{user.email}</div></div>
          <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,background:user.is_active?"rgba(90,170,48,.12)":"rgba(192,48,48,.1)",color:user.is_active?"#2a7010":"#c03030",border:`1px solid ${user.is_active?"rgba(90,170,48,.3)":"rgba(192,48,48,.2)"}`}}>{user.is_active?"● Active":"○ Inactive"}</span>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"none",background:"rgba(100,80,40,.08)",color:"#6a7a50",fontSize:15,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"1.2rem 1.4rem",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"rgba(42,112,16,.05)",border:"1px solid rgba(42,112,16,.15)",borderRadius:14,padding:"1rem 1.1rem"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>📍 Registered Address</div>
            <div style={{fontSize:14,fontWeight:700,color:"#1a2e0a",lineHeight:1.5,marginBottom:10}}>{fullAddress||"No address provided"}</div>
            {user._geo?.inRegion&&(<div style={{display:"flex",gap:8}}><button onClick={()=>{onFlyTo(user._geo);onClose();}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid rgba(42,112,16,.3)",background:"rgba(42,112,16,.08)",color:"#1c4f09",fontSize:12,fontWeight:800,cursor:"pointer"}}>📍 Show on Map</button><button onClick={()=>{onDirections(user);onClose();}} style={{flex:1,padding:"8px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1c4f09,#2a7010)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>🗺 Get Directions</button></div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{val:userA.length,label:"Adoptions",color:"#2a7010",icon:"❤️"},{val:userR.length,label:"Rehoming",color:"#c87820",icon:"🏠"},{val:sc.Approved,label:"Approved",color:"#5aaa30",icon:"✓"}].map(s=>(<div key={s.label} style={{background:`${s.color}0d`,border:`1px solid ${s.color}22`,borderRadius:10,padding:".7rem",textAlign:"center"}}><div style={{fontSize:16,marginBottom:2}}>{s.icon}</div><div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div><div style={{fontSize:9,fontWeight:700,color:"#9aaa80",textTransform:"uppercase"}}>{s.label}</div></div>))}
          </div>
          <div style={{background:"#fff8e8",border:"1px solid #e8dfc0",borderRadius:12,padding:".9rem 1.1rem"}}><div style={{fontSize:11,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>📊 Activity — Last 6 Months</div><BarChart data={monthly} color="#2a7010"/></div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GeoMapPanel({show}) {
  const [users,setUsers]           = useState([]);
  const [adoptions,setAdoptions]   = useState([]);
  const [rehome,setRehome]         = useState([]);
  const [missingPets,setMissingPets] = useState([]);
  const [loading,setLoading]       = useState(false);

  // User map filters
  const [filter,setFilter]         = useState("all");
  const [provFilter,setProvFilter] = useState("all");
  const [selected,setSelected]     = useState(null);
  const [flyTarget,setFlyTarget]   = useState(null);
  const [search,setSearch]         = useState("");

  // Missing pets overlay filters
  const [showMissingLayer,setShowMissingLayer] = useState(true);
  const [mpTypeFilter,setMpTypeFilter]         = useState("all");
  const [mpSpeciesFilter,setMpSpeciesFilter]   = useState("all");
  const [selectedMp,setSelectedMp]             = useState(null);

  // Route + nav state
  const [directionsUser,setDirectionsUser] = useState(null);
  const [route,setRoute]                   = useState(null);
  const [navActive,setNavActive]           = useState(false);
  const [navProgress,setNavProgress]       = useState(0);
  const [vehiclePos,setVehiclePos]         = useState(null);
  const [vehicleRotation,setVehicleRotation] = useState(0);
  const [gpsSpeed,setGpsSpeed]             = useState(null);
  const [gpsAccuracy,setGpsAccuracy]       = useState(null);
  const [travelledMetres,setTravelledMetres] = useState(0);

  const watchIdRef = useRef(null);
  const routeRef   = useRef(null);
  useEffect(()=>{ routeRef.current = route; },[route]);

  useEffect(() => {
  if (!show) return;
  setLoading(true);

  Promise.all([
    phpApi("get_users_geo"),
    phpApi("get_requests", { type: "adoptions", limit: 1000 }),
    phpApi("get_requests", { type: "rehome", limit: 1000 }),
    fetch("/api/missing-pets/admin/all").then(r => r.ok ? r.json() : []).catch(() => []),
  ]).then(async ([ur, ar, rr, mp]) => {
    setUsers(ur.success ? (ur.data || []) : []);
    setAdoptions(ar.success ? (ar.data || []) : []);
    setRehome(rr.success ? (rr.data || []) : []);

    // Geocode all approved pets in parallel
    const approved = (mp || []).filter(p => p.status === 'approved');
    const withGeo = await Promise.all(
      approved.map(async p => ({ ...p, _geo: await geocodeMissingPetFull(p) }))
    );
    setMissingPets(withGeo.filter(p => p._geo.inRegion));

  }).catch(() => {}).finally(() => setLoading(false));
}, [show]);

  const stopNav = useCallback(()=>{
    if (watchIdRef.current!=null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current=null; }
    setNavActive(false); setNavProgress(0); setVehiclePos(null); setGpsSpeed(null); setGpsAccuracy(null); setTravelledMetres(0);
  },[]);

  const startNav = useCallback(()=>{
    if (!route?.points?.length) return;
    setNavActive(true); setNavProgress(0); setTravelledMetres(0);
    setVehiclePos({lat:route.points[0][0],lng:route.points[0][1]}); setVehicleRotation(0);
    if (!navigator.geolocation) { alert("GPS not supported."); setNavActive(false); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos)=>{
        const r=routeRef.current; if (!r?.points?.length) return;
        const {latitude:lat,longitude:lng,speed,accuracy}=pos.coords;
        const idx=snapToRoute(r.points,lat,lng);
        const nextIdx=Math.min(idx+1,r.points.length-1);
        const rot=bearing(r.points[idx],r.points[nextIdx]);
        let dist=0; for(let i=0;i<idx;i++) dist+=haversineMetres(r.points[i],r.points[i+1]);
        setVehiclePos({lat:r.points[idx][0],lng:r.points[idx][1]}); setVehicleRotation(rot); setNavProgress(idx); setTravelledMetres(dist);
        if(speed!=null&&speed>=0) setGpsSpeed(Math.round(speed*3.6)); else setGpsSpeed(null);
        setGpsAccuracy(accuracy!=null?Math.round(accuracy):null);
        const destPt=r.points[r.points.length-1];
        if(haversineMetres([lat,lng],destPt)<30){ setNavProgress(r.points.length-1); setVehiclePos({lat:destPt[0],lng:destPt[1]}); setTimeout(stopNav,4000); }
      },
      (err)=>{ console.warn("GPS error:",err.message); setGpsSpeed(null); setGpsAccuracy(null); },
      { enableHighAccuracy:true, maximumAge:1000, timeout:10000 }
    );
  },[route,stopNav]);

  const nextTurn = navActive && route?.steps ? getNextTurn(route.steps, travelledMetres) : null;

  const handleDirections = (user) => { setDirectionsUser(user); setRoute(null); stopNav(); setFlyTarget({lat:user._geo.lat,lng:user._geo.lng}); };
  const handleRouteReady = (rd) => { setRoute({...rd,endLabel:directionsUser?`${directionsUser.first_name} ${directionsUser.last_name} (${directionsUser.city||""})`:rd.end.label||""}); setDirectionsUser(null); };
  const clearRoute = () => { setRoute(null); setDirectionsUser(null); stopNav(); };

  const geocoded = users.map(u=>({...u,_geo:geocodeUser(u)})).filter(u=>u._geo.inRegion);
  const filteredUsers = geocoded.filter(u=>{
    const mf=filter==="all"||(filter==="active"?u.is_active:!u.is_active);
    const mp=provFilter==="all"||u._geo.province===provFilter;
    const ms=!search||`${u.first_name} ${u.last_name} ${u.city} ${u.province}`.toLowerCase().includes(search.toLowerCase());
    return mf&&mp&&ms;
  });

  const filteredMissingPets = missingPets.filter(p => {
  const mt = mpTypeFilter === 'all' || p.type === mpTypeFilter;
  const ms = mpSpeciesFilter === 'all' || (p.species || '').toLowerCase() === mpSpeciesFilter.toLowerCase();
  return mt && ms;
  });

// For counts, use missingPets directly:
const missingCounts = {
  all:   missingPets.length,
  lost:  missingPets.filter(p => p.type === 'lost').length,
  found: missingPets.filter(p => p.type === 'found').length,
};

  const provStats = Object.keys(PROVINCES).map(p=>({ name:p, color:PROVINCES[p].color, count:geocoded.filter(u=>u._geo.province===p).length, active:geocoded.filter(u=>u._geo.province===p&&u.is_active).length }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="🗺 Ilocos Region — User Map"
        subtitle="Click any pin for details, directions, or GPS navigation"
        action={
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["all","active","inactive"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:800,border:"1.5px solid",cursor:"pointer",transition:"all .15s",background:filter===f?"#1c4f09":"transparent",borderColor:filter===f?"#1c4f09":"#ddd0a8",color:filter===f?"#fff":"#7a9060"}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      {/* Province cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {provStats.map(p=>(
          <div key={p.name} onClick={()=>setProvFilter(provFilter===p.name?"all":p.name)}
            style={{borderRadius:14,padding:"1rem 1.2rem",cursor:"pointer",transition:"all .15s",background:provFilter===p.name?`${p.color}18`:"#fffce8",border:`1.5px solid ${provFilter===p.name?p.color:"rgba(200,180,100,.3)"}`,boxShadow:provFilter===p.name?`0 4px 16px ${p.color}28`:"none",transform:provFilter===p.name?"translateY(-2px)":"none"}}>
            <div style={{fontSize:12,fontWeight:800,color:"#1a4a08",marginBottom:4}}>{p.name}</div>
            <div style={{fontSize:28,fontWeight:900,color:p.color,lineHeight:1}}>{p.count}</div>
            <div style={{fontSize:10,color:"#9aaa80",fontWeight:600,marginTop:2}}>{p.active} active · {p.count-p.active} inactive</div>
          </div>
        ))}
      </div>

      {/* Stats strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {val:users.length,       label:"Total Users",        icon:"👥",color:"#1c4f09"},
          {val:geocoded.length,    label:"In Ilocos Region",   icon:"📍",color:"#2a7010"},
          {val:geocoded.filter(u=>u.is_active).length, label:"Active", icon:"●",color:"#5aaa30"},
          {val:missingCounts.all,  label:"Missing Pet Reports",icon:"🐾",color:"#B45A22"},
        ].map(s=>(
          <div key={s.label} style={{borderRadius:14,border:`1px solid ${s.color}22`,padding:".9rem 1rem",background:`${s.color}0a`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{s.icon}</div>
            <div><div style={{fontSize:22,fontWeight:900,color:"#1a4a08",lineHeight:1}}>{s.val}</div><div style={{fontSize:10,fontWeight:700,color:"#9aaa80",textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Nav HUD */}
      {navActive && route && <NavHUD route={route} progress={navProgress} gpsSpeed={gpsSpeed} gpsAccuracy={gpsAccuracy} nextTurn={nextTurn} onStop={stopNav}/>}
      {!navActive && route && <RouteInfoBar route={route} onStartNav={startNav} onClear={clearRoute}/>}

      {/* ── Missing Pets Overlay Controls ── */}
      <div style={{background:"rgba(255,248,220,0.88)",border:"1.5px solid rgba(180,90,34,0.28)",borderRadius:16,padding:"1rem 1.25rem"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.75rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <button
              onClick={()=>setShowMissingLayer(v=>!v)}
              style={{width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",position:"relative",background:showMissingLayer?"#B45A22":"rgba(180,140,60,0.28)",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:showMissingLayer?"18px":"2px",width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
            </button>
            <div>
              <div style={{fontSize:"0.82rem",fontWeight:900,color:"#1a4a08"}}>🐾 Missing Pets Layer</div>
              <div style={{fontSize:"0.70rem",fontWeight:700,color:"#9aaa80"}}>{showMissingLayer?`Showing ${filteredMissingPets.length} of ${missingPets.length} reports`:"Layer hidden"}</div>
            </div>
          </div>

          {showMissingLayer && (
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
              {/* Type filter */}
              <div style={{display:"inline-flex",gap:"0.2rem",background:"rgba(255,248,220,0.7)",borderRadius:50,padding:"0.2rem",border:"1px solid rgba(180,140,60,0.25)"}}>
                {[["all","All"],["lost","Lost"],["found","Found"]].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setMpTypeFilter(val)}
                    style={{padding:"0.32rem 0.75rem",borderRadius:50,fontSize:"0.74rem",fontWeight:800,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",
                      background:mpTypeFilter===val?(val==="lost"?"#c03030":val==="found"?"#1c4f09":"#B45A22"):"transparent",
                      color:mpTypeFilter===val?"#fff":"#3a5020"}}>
                    {lbl} {val!=="all"&&missingCounts[val]>0&&`(${missingCounts[val]})`}
                  </button>
                ))}
              </div>

              {/* Species filter */}
              <div style={{display:"inline-flex",gap:"0.2rem",background:"rgba(255,248,220,0.7)",borderRadius:50,padding:"0.2rem",border:"1px solid rgba(180,140,60,0.25)"}}>
                {[["all","All"],["Dog","Dog"],["Cat","Cat"],["Other","Other"]].map(([val,lbl])=>(
                  <button key={val} onClick={()=>setMpSpeciesFilter(val)}
                    style={{padding:"0.32rem 0.75rem",borderRadius:50,fontSize:"0.74rem",fontWeight:800,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",
                      background:mpSpeciesFilter===val?"#B45A22":"transparent",
                      color:mpSpeciesFilter===val?"#fff":"#3a5020"}}>
                    {lbl}
                  </button>
                ))}
              </div>

              {(mpTypeFilter!=="all"||mpSpeciesFilter!=="all")&&(
                <button onClick={()=>{setMpTypeFilter("all");setMpSpeciesFilter("all");}}
                  style={{padding:"0.32rem 0.7rem",borderRadius:50,fontSize:"0.72rem",fontWeight:800,border:"1px solid rgba(180,140,60,0.28)",background:"rgba(255,248,220,0.7)",color:"#6a7a50",cursor:"pointer",fontFamily:"inherit"}}>
                  ✕ Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── PATCH 2: Mini legend — no emojis ── */}
        {showMissingLayer && (
          <div style={{display:"flex",gap:"1.25rem",flexWrap:"wrap",marginTop:"0.65rem",paddingTop:"0.65rem",borderTop:"1px solid rgba(180,140,60,0.18)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:"#c03030",border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",flexShrink:0}}/>
              <span style={{fontSize:"0.72rem",fontWeight:700,color:"#6a7a50"}}>Lost</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:"#1c4f09",border:"2px solid #fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",flexShrink:0}}/>
              <span style={{fontSize:"0.72rem",fontWeight:700,color:"#6a7a50"}}>Found</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
              <div style={{width:12,height:12,borderRadius:"50%",border:"2px solid #B45A22",background:"rgba(180,90,34,0.15)",flexShrink:0}}/>
              <span style={{fontSize:"0.72rem",fontWeight:700,color:"#6a7a50"}}>User (province color)</span>
            </div>
            <span style={{fontSize:"0.70rem",fontWeight:700,color:"#9aaa80",marginLeft:"auto"}}>Click any pin for details</span>
          </div>
        )}
      </div>

      {/* Map + sidebar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
        <div style={{borderRadius:20,overflow:"hidden",border:`1.5px solid ${navActive?"rgba(28,79,9,.6)":"rgba(90,160,48,.35)"}`,boxShadow:navActive?"0 4px 28px rgba(28,79,9,.3)":"0 4px 20px rgba(30,60,10,.08)",transition:"all .3s"}}>

          {/* Map top bar */}
          <div style={{padding:"10px 14px",background:navActive?"rgba(28,79,9,.97)":"rgba(255,248,220,.97)",borderBottom:"1px solid #e8dfc0",transition:"background .3s"}}>
            {directionsUser && !route ? (
              <DirectionsPanel
                destination={{lat:directionsUser._geo.lat,lng:directionsUser._geo.lng,label:`${directionsUser.first_name} ${directionsUser.last_name}, ${directionsUser.city||""}`}}
                onRouteReady={handleRouteReady}
                onClose={()=>setDirectionsUser(null)}
              />
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {navActive ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:"#5aaa30",animation:"gpsPulse 1.2s ease-in-out infinite"}}/>
                    <span style={{color:"#5aaa30",fontSize:12,fontWeight:800,flex:1}}>🛰 GPS Navigation Active</span>
                    {gpsAccuracy!=null&&<span style={{color:"rgba(255,255,255,.5)",fontSize:11,fontWeight:600}}>±{gpsAccuracy}m</span>}
                  </div>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, city, province…" style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:13,fontWeight:600,color:"#1a2e0a",fontFamily:"inherit"}}/>
                    {search&&<button onClick={()=>setSearch("")} style={{border:"none",background:"none",color:"#9aaa80",cursor:"pointer",fontSize:14}}>✕</button>}
                    <span style={{fontSize:11,fontWeight:700,color:"#9aaa80"}}>{filteredUsers.length} users</span>
                    {showMissingLayer&&<span style={{fontSize:11,fontWeight:700,color:"#B45A22",marginLeft:6}}>· {filteredMissingPets.length} pets</span>}
                  </>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{height:480,display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f4e8"}}>
              <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid #2a7010",borderTopColor:"transparent",animation:"spin .8s linear infinite"}}/>
            </div>
          ) : (
            <div style={{height:480}}>
              {show && (
                <MapContainer center={ILOCOS_CENTER} zoom={ILOCOS_ZOOM} style={{height:"100%",width:"100%"}} zoomControl>
                  <MapController flyTarget={flyTarget} routePoints={route?.points} vehiclePos={vehiclePos} isNavActive={navActive}/>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap"/>

                  {/* Province outlines */}
                  {Object.entries(PROVINCES).map(([prov,cfg])=>(
                    <Polygon key={prov} positions={cfg.bounds} pathOptions={{color:cfg.color,weight:2,fillColor:cfg.color,fillOpacity:provFilter===prov?.14:.06,dashArray:"5 4"}}>
                      <Tooltip permanent direction="center" opacity={0.85}>{prov}</Tooltip>
                    </Polygon>
                  ))}

                  {/* Route polylines */}
                  {route?.points && (
                    <>
                      <Polyline positions={route.points} pathOptions={{color:"rgba(0,0,0,.15)",weight:10,opacity:1}}/>
                      {navActive&&navProgress>0&&<Polyline positions={route.points.slice(0,navProgress+1)} pathOptions={{color:"#1c4f09",weight:7,opacity:1}}/>}
                      <Polyline positions={navActive?route.points.slice(navProgress):route.points} pathOptions={{color:"#5aaa30",weight:5,opacity:.85,dashArray:navActive?"10 7":undefined}}/>
                      <Marker position={[route.start.lat,route.start.lng]} icon={startIcon}/>
                      <Marker position={[route.end.lat,route.end.lng]} icon={endIcon}/>
                    </>
                  )}

                  {/* GPS */}
                  {navActive&&vehiclePos&&gpsAccuracy!=null&&<AccuracyCircle pos={vehiclePos} accuracy={gpsAccuracy}/>}
                  {navActive&&vehiclePos&&<VehicleMarker pos={vehiclePos} rotation={vehicleRotation}/>}

                  {/* ── User pins ── */}
                  {!navActive && filteredUsers.map(u=>{
                    const pc=PROVINCES[u._geo.province]?.color||"#2a7010";
                    return (
                      <CircleMarker key={u.id} center={[u._geo.lat,u._geo.lng]} radius={u.is_active?9:6}
                        pathOptions={{fillColor:u.is_active?pc:"#aaa",color:"#fff",weight:2.5,fillOpacity:u.is_active?.88:.50}}
                        eventHandlers={{click:()=>setSelected(u)}}>
                        <Popup>
                          <div style={{minWidth:170,fontFamily:"inherit",padding:"2px 0"}}>
                            <div style={{fontWeight:800,fontSize:14,color:"#1a4a08",marginBottom:2}}>{u.first_name} {u.last_name}</div>
                            <div style={{fontSize:11,color:"#7a9060",marginBottom:4}}>📍 {u.city||"—"}, {u.province||"—"}</div>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>setSelected(u)} style={{flex:1,padding:"5px 8px",borderRadius:7,border:"1px solid rgba(42,112,16,.3)",background:"rgba(42,112,16,.08)",color:"#1c4f09",fontSize:11,fontWeight:800,cursor:"pointer"}}>Details</button>
                              <button onClick={()=>handleDirections(u)} style={{flex:1,padding:"5px 8px",borderRadius:7,border:"none",background:"#1c4f09",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>Directions</button>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}

                  {/* ── PATCH 3: Missing pet pins — improved popup with address/location ── */}
                  {!navActive && showMissingLayer && filteredMissingPets.map(pet=>{
                    const isLost = pet.type === "lost";
                    const locationLine = pet.address || pet.area || null;
                    return (
                      <CircleMarker
                        key={`mp-${pet.id}`}
                        center={[pet._geo.lat, pet._geo.lng]}
                        radius={10}
                        pathOptions={{ fillColor: isLost ? "#c03030" : "#1c4f09", color:"#fff", weight:2.5, fillOpacity:0.90 }}
                        eventHandlers={{ click: () => setSelectedMp(pet) }}
                      >
                        <Popup>
                          <div style={{minWidth:200,fontFamily:"inherit",padding:"2px 0"}}>

                            {/* Photo */}
                            {pet.photoUrl && (
  <img
    src={pet.photoUrl.replace(/^https?:\/\/localhost:\d+/, '')}
    alt={pet.name || 'Pet'}
    style={{ width:'100%', height:100, objectFit:'cover', borderRadius:8, marginBottom:6, display:'block' }}
    onError={e => { e.target.style.display = 'none'; }}
  />
)}

                            {/* Lost / Found badge + species */}
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                              <span style={{
                                fontSize:10,fontWeight:900,padding:"2px 8px",borderRadius:50,
                                background:isLost?"rgba(192,48,48,0.12)":"rgba(28,79,9,0.10)",
                                color:isLost?"#c03030":"#1c4f09",
                                border:`1px solid ${isLost?"rgba(192,48,48,0.22)":"rgba(28,79,9,0.22)"}`
                              }}>
                                {isLost ? "Lost" : "Found"}
                              </span>
                              {(pet.species || pet.breed) && (
                                <span style={{fontSize:11,fontWeight:700,color:"#6a7a50"}}>
                                  {[pet.species,pet.breed].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>

                            {/* Pet name */}
                            <div style={{fontWeight:900,fontSize:14,color:"#1a4a08",marginBottom:4,lineHeight:1.3}}>
                              {pet.name || "Unknown"}
                            </div>

                            {/* Location — address takes priority, falls back to area */}
                            {locationLine && (
                              <div style={{display:"flex",alignItems:"flex-start",gap:4,fontSize:11,color:"#3a5020",fontWeight:700,marginBottom:3,lineHeight:1.4}}>
                                <span style={{color:"#B45A22",flexShrink:0,marginTop:1}}>📍</span>
                                <span>{locationLine}</span>
                              </div>
                            )}

                            {/* Show area separately if both address and area exist */}
                            {pet.address && pet.area && (
                              <div style={{fontSize:10,color:"#9aaa80",fontWeight:700,marginBottom:3,paddingLeft:16}}>
                                {pet.area}
                              </div>
                            )}

                            {/* Color */}
                            {pet.color && (
                              <div style={{fontSize:11,color:"#7a9060",fontWeight:700,marginBottom:2}}>
                                Color: {pet.color}
                              </div>
                            )}

                            {/* Details snippet */}
                            {pet.details && (
                              <div style={{fontSize:10,color:"#9aaa80",fontWeight:600,marginTop:4,lineHeight:1.4,borderTop:"1px solid rgba(180,140,60,0.15)",paddingTop:4}}>
                                {pet.details.length > 80 ? pet.details.slice(0,80) + "…" : pet.details}
                              </div>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          )}

          {/* ── PATCH 1: Bottom legend — Lost/Found without emojis ── */}
          <div style={{padding:"10px 14px",background:"rgba(255,252,235,.97)",borderTop:"1px solid #e8dfc0",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            {Object.entries(PROVINCES).map(([p,cfg])=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:cfg.color}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#6a7a50"}}>{p}</span>
              </div>
            ))}
            {showMissingLayer&&(<>
              <div style={{width:1,height:16,background:"rgba(180,140,60,0.22)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:"#c03030",flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#6a7a50"}}>Lost</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:"#1c4f09",flexShrink:0}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#6a7a50"}}>Found</span>
              </div>
            </>)}
            <span style={{fontSize:11,color:"#9aaa80",marginLeft:"auto"}}>{navActive?"🛰 Following GPS":"🖱 Click any pin"}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{borderRadius:20,border:"1.5px solid #ddd0a8",background:"#fffce8",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 14px 10px",borderBottom:"1px solid #e8dfc0",background:"rgba(255,248,220,.97)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".08em"}}>
              {navActive ? "🚗 Navigation Active" : `Users (${filteredUsers.length})`}
            </div>
            {showMissingLayer && !navActive && (
              <div style={{fontSize:10,fontWeight:700,color:"#B45A22",marginTop:2}}>🐾 {filteredMissingPets.length} missing pet{filteredMissingPets.length!==1?"s":""} on map</div>
            )}
          </div>

          {navActive ? (
            <div style={{overflowY:"auto",flex:1,maxHeight:480,padding:"8px 0"}}>
              {route?.steps?.length ? route.steps.map((step,i)=>{
                let cum=0; for(let j=0;j<i;j++) cum+=route.steps[j].distance||0;
                const passed=travelledMetres>=cum+(step.distance||0);
                const isCurrent=!passed&&travelledMetres>=cum;
                return (
                  <div key={i} style={{padding:"8px 14px",borderBottom:"1px solid rgba(200,176,100,.1)",display:"flex",alignItems:"center",gap:8,background:isCurrent?"rgba(28,79,9,.08)":passed?"rgba(90,170,48,.04)":"transparent",opacity:passed?.45:1,transition:"all .3s"}}>
                    <div style={{width:28,height:28,borderRadius:8,flexShrink:0,background:isCurrent?"#1c4f09":passed?"rgba(90,170,48,.15)":"rgba(42,112,16,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{passed?"✓":turnIcon(step.instruction)}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:800,color:isCurrent?"#1c4f09":passed?"#9aaa80":"#1a2e0a",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{step.instruction}</div>
                      <div style={{fontSize:10,color:"#9aaa80",fontWeight:600,marginTop:1}}>{step.distance<1000?`${Math.round(step.distance)} m`:`${(step.distance/1000).toFixed(1)} km`}{step.duration?` · ~${Math.round(step.duration/60)} min`:""}</div>
                    </div>
                  </div>
                );
              }) : <div style={{padding:"2rem",textAlign:"center",color:"#9aa880",fontSize:12}}>No turn-by-turn steps available</div>}
            </div>
          ) : (
            <div style={{overflowY:"auto",flex:1,maxHeight:480}}>
              {filteredUsers.length===0 ? (
                <div style={{padding:"2rem",textAlign:"center",color:"#9aa880",fontSize:13,fontWeight:600}}>No users match filters</div>
              ) : filteredUsers.map(u=>{
                const pc=PROVINCES[u._geo.province]?.color||"#2a7010";
                return (
                  <div key={u.id} style={{padding:"10px 14px",borderBottom:"1px solid rgba(200,176,100,.12)",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:u.is_active?pc:"#ccc",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#1a2e0a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.first_name} {u.last_name}</div>
                      <div style={{fontSize:11,color:"#7a9060",fontWeight:600}}>{u.city||"—"}</div>
                    </div>
                    <div style={{display:"flex",gap:4,flexShrink:0}}>
                      <button onClick={()=>setSelected(u)} title="View details" style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(42,112,16,.25)",background:"rgba(42,112,16,.07)",color:"#1c4f09",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>👁</button>
                      <button onClick={()=>handleDirections(u)} title="Get directions" style={{width:26,height:26,borderRadius:6,border:"none",background:"#1c4f09",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>🗺</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selected && <UserModal user={selected} onClose={()=>setSelected(null)} onFlyTo={geo=>setFlyTarget({lat:geo.lat,lng:geo.lng})} onDirections={u=>handleDirections(u)} adoptions={adoptions} rehome={rehome}/>}

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes gpsPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
      `}</style>
    </div>
  );
}