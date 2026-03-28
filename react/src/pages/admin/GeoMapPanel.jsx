// ── GEO MAP PANEL with IN-MAP DIRECTIONS ──────────────────────────────────────
import { useState, useEffect, useRef } from "react";
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
  const city = (user.city||"").trim().toLowerCase();
  const normProv = normalizeProvince(user.province||"");
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

// ── Map controller ────────────────────────────────────────────────────────────
function MapController({flyTarget,routePoints}) {
  const map=useMap();
  useEffect(()=>{
    if (flyTarget) map.flyTo([flyTarget.lat,flyTarget.lng],13,{animate:true,duration:1.2});
  },[flyTarget]);
  useEffect(()=>{
    if (routePoints&&routePoints.length>1) {
      const bounds=L.latLngBounds(routePoints);
      map.fitBounds(bounds,{padding:[40,40],animate:true,duration:1.0});
    }
  },[routePoints]);
  return null;
}

// ── Custom marker icons ───────────────────────────────────────────────────────
const startIcon = L.divIcon({
  className:"",
  html:`<div style="width:22px;height:22px;border-radius:50%;background:#1c4f09;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:900">A</div>`,
  iconSize:[22,22], iconAnchor:[11,11],
});
const endIcon = L.divIcon({
  className:"",
  html:`<div style="width:22px;height:22px;border-radius:50%;background:#c03030;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:900">B</div>`,
  iconSize:[22,22], iconAnchor:[11,11],
});

// ── Directions panel (inside modal) ──────────────────────────────────────────
function DirectionsPanel({destination,onRouteReady,onClose}) {
  const [fromCity,setFromCity]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [useGeo,setUseGeo]=useState(false);
  const [geoCoords,setGeoCoords]=useState(null);

  const getLocation=()=>{
    if (!navigator.geolocation){setError("Geolocation not supported");return;}
    navigator.geolocation.getCurrentPosition(
      pos=>{setGeoCoords({lat:pos.coords.latitude,lng:pos.coords.longitude});setUseGeo(true);setFromCity("My Location");setError("");},
      ()=>{setError("Could not get your location. Type a city instead.");}
    );
  };

  const getRoute=async()=>{
    let startCoord=null;
    if (useGeo&&geoCoords) {
      startCoord=geoCoords;
    } else {
      const key=fromCity.trim().toLowerCase();
      if (CITY_COORDS[key]) startCoord={lat:CITY_COORDS[key][0],lng:CITY_COORDS[key][1]};
      else {
        const pk=Object.keys(CITY_COORDS).find(k=>key.includes(k)||k.includes(key));
        if (pk) startCoord={lat:CITY_COORDS[pk][0],lng:CITY_COORDS[pk][1]};
      }
      if (!startCoord){setError("City not found in Ilocos Region. Try: Laoag, Vigan, San Fernando, Dagupan…");return;}
    }
    setLoading(true);setError("");
    try {
      const res = await fetch("/ors/v2/directions/driving-car/geojson", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":ORS_KEY},
        body:JSON.stringify({coordinates:[[startCoord.lng,startCoord.lat],[destination.lng,destination.lat]]})
      });
      if (!res.ok) throw new Error("Route not found");
      const data=await res.json();
      const coords=data.features[0].geometry.coordinates.map(([lng,lat])=>[lat,lng]);
      const props=data.features[0].properties.summary;
      onRouteReady({
        points:coords,
        start:startCoord,
        end:destination,
        distance:(props.distance/1000).toFixed(1),
        duration:Math.round(props.duration/60),
        startLabel:fromCity||"Start",
      });
    } catch(e){
      setError("Could not calculate route. Check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{background:"rgba(42,112,16,.05)",border:"1px solid rgba(42,112,16,.2)",borderRadius:14,padding:"1rem 1.2rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".07em"}}>🗺 Get Directions</div>
        <button onClick={onClose} style={{border:"none",background:"none",color:"#9aaa80",cursor:"pointer",fontSize:13,fontWeight:700}}>✕ Cancel</button>
      </div>
      {/* From */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",marginBottom:4}}>From (Point A)</div>
        <div style={{display:"flex",gap:6}}>
          <input value={fromCity} onChange={e=>{setFromCity(e.target.value);setUseGeo(false);setError("");}}
            placeholder="Type a city e.g. Laoag, Vigan…"
            style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid #c8b878",background:"rgba(255,250,232,.8)",fontSize:13,fontWeight:600,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={getLocation} title="Use my location"
            style={{padding:"8px 10px",borderRadius:8,border:"1px solid #c8b878",background:useGeo?"#1c4f09":"rgba(255,250,232,.8)",color:useGeo?"#fff":"#5a7040",fontSize:14,cursor:"pointer",fontWeight:700}}>
            📍
          </button>
        </div>
      </div>
      {/* To */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",marginBottom:4}}>To (Point B)</div>
        <div style={{padding:"8px 10px",borderRadius:8,border:"1px solid rgba(192,48,48,.3)",background:"rgba(192,48,48,.05)",fontSize:13,fontWeight:600,color:"#1a2e0a"}}>
          📍 {destination.label}
        </div>
      </div>
      {error&&<div style={{fontSize:12,color:"#c03030",fontWeight:600,marginBottom:8,padding:"6px 8px",background:"rgba(192,48,48,.07)",borderRadius:6}}>{error}</div>}
      <button onClick={getRoute} disabled={loading||(!fromCity&&!useGeo)}
        style={{width:"100%",padding:"9px",borderRadius:10,border:"none",background:loading||(!fromCity&&!useGeo)?"#ccc":"linear-gradient(135deg,#1c4f09,#2a7010)",color:"#fff",fontSize:13,fontWeight:800,cursor:loading||(!fromCity&&!useGeo)?"not-allowed":"pointer"}}>
        {loading?"Calculating Route…":"Get Route →"}
      </button>
    </div>
  );
}

// ── Route info bar ────────────────────────────────────────────────────────────
function RouteInfoBar({route,onClear}) {
  return (
    <div style={{background:"linear-gradient(135deg,rgba(28,79,9,.08),rgba(42,112,16,.05))",border:"1.5px solid rgba(42,112,16,.25)",borderRadius:14,padding:"1rem 1.2rem",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:"#1c4f09",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>A</div>
        <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:700,color:"#3a5020",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{route.startLabel}</div>
        <div style={{fontSize:18,color:"#5aaa30",flexShrink:0}}>→</div>
        <div style={{width:28,height:28,borderRadius:"50%",background:"#c03030",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>B</div>
        <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:700,color:"#3a5020",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{route.endLabel}</div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center",flexShrink:0}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#1c4f09",lineHeight:1}}>{route.distance}<span style={{fontSize:10,fontWeight:700}}> km</span></div>
          <div style={{fontSize:9,color:"#9aaa80",fontWeight:700,textTransform:"uppercase"}}>Distance</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#c87820",lineHeight:1}}>{route.duration}<span style={{fontSize:10,fontWeight:700}}> min</span></div>
          <div style={{fontSize:9,color:"#9aaa80",fontWeight:700,textTransform:"uppercase"}}>Drive Time</div>
        </div>
        <button onClick={onClear}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(192,48,48,.3)",background:"rgba(192,48,48,.07)",color:"#c03030",fontSize:12,fontWeight:800,cursor:"pointer"}}>
          ✕ Clear
        </button>
      </div>
    </div>
  );
}

// ── User detail modal ─────────────────────────────────────────────────────────
function UserModal({user,onClose,onFlyTo,onDirections,adoptions,rehome}) {
  if (!user) return null;
  const userA=adoptions.filter(a=>a.user_id===user.id||a.email===user.email);
  const userR=rehome.filter(r=>r.user_id===user.id||r.email===user.email);
  const fullAddress=[user.address,user.city,user.province,user.zip_code].filter(Boolean).join(", ");
  const monthly=Array.from({length:6},(_,i)=>{
    const d=new Date(); d.setMonth(d.getMonth()-(5-i));
    return {label:d.toLocaleString("default",{month:"short"}),value:[...userA,...userR].filter(r=>{const rd=new Date(r.created_at||"");return rd.getMonth()===d.getMonth()&&rd.getFullYear()===d.getFullYear();}).length};
  });
  const sc={
    Approved:[...userA,...userR].filter(r=>r.status==="Approved").length,
    Pending:[...userA,...userR].filter(r=>r.status==="Pending").length,
    Rejected:[...userA,...userR].filter(r=>r.status==="Rejected").length,
  };
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(10,25,5,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:600,maxHeight:"90vh",borderRadius:24,overflow:"hidden",display:"flex",flexDirection:"column",background:"#fffce8",border:"1.5px solid rgba(90,160,48,.4)",boxShadow:"0 24px 64px rgba(30,80,10,.22)"}}>
        {/* Header */}
        <div style={{padding:"1.2rem 1.4rem",background:"linear-gradient(135deg,rgba(42,112,16,.08),rgba(42,112,16,.03))",borderBottom:"1px solid #e8dfc0",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <div style={{width:46,height:46,borderRadius:12,background:"linear-gradient(135deg,#1c4f09,#2a7010)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="#e3e3e3"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 128.5-46.5T480-440q66 0 132.5 15.5T741-378q29 15 46.5 43.5T805-272v112H160Z"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.1rem",fontWeight:900,color:"#1a4a08"}}>{user.first_name} {user.last_name}</div>
            <div style={{fontSize:11,color:"#7a9060",fontWeight:600}}>{user.email}</div>
          </div>
          <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,background:user.is_active?"rgba(90,170,48,.12)":"rgba(192,48,48,.1)",color:user.is_active?"#2a7010":"#c03030",border:`1px solid ${user.is_active?"rgba(90,170,48,.3)":"rgba(192,48,48,.2)"}`}}>{user.is_active?"● Active":"○ Inactive"}</span>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"none",background:"rgba(100,80,40,.08)",color:"#6a7a50",fontSize:15,cursor:"pointer"}}>✕</button>
        </div>
        {/* Body */}
        <div style={{overflowY:"auto",padding:"1.2rem 1.4rem",display:"flex",flexDirection:"column",gap:14}}>
          {/* Address + action buttons */}
          <div style={{background:"rgba(42,112,16,.05)",border:"1px solid rgba(42,112,16,.15)",borderRadius:14,padding:"1rem 1.1rem"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>📍 Registered Address</div>
            <div style={{fontSize:14,fontWeight:700,color:"#1a2e0a",lineHeight:1.5,marginBottom:10}}>{fullAddress||"No address provided"}</div>
            {user._geo?.inRegion&&(
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{onFlyTo(user._geo);onClose();}}
                  style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid rgba(42,112,16,.3)",background:"rgba(42,112,16,.08)",color:"#1c4f09",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                  📍 Show on Map
                </button>
                <button onClick={()=>{onDirections(user);onClose();}}
                  style={{flex:1,padding:"8px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1c4f09,#2a7010)",color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                  🗺 Get Directions
                </button>
              </div>
            )}
          </div>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{val:userA.length,label:"Adoptions",color:"#2a7010",icon:"❤️"},{val:userR.length,label:"Rehoming",color:"#c87820",icon:"🏠"},{val:sc.Approved,label:"Approved",color:"#5aaa30",icon:"✓"}].map(s=>(
              <div key={s.label} style={{background:`${s.color}0d`,border:`1px solid ${s.color}22`,borderRadius:10,padding:".7rem",textAlign:"center"}}>
                <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
                <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
                <div style={{fontSize:9,fontWeight:700,color:"#9aaa80",textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div style={{background:"#fff8e8",border:"1px solid #e8dfc0",borderRadius:12,padding:".9rem 1.1rem"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>📊 Activity — Last 6 Months</div>
            <BarChart data={monthly} color="#2a7010"/>
          </div>
          {/* Status */}
          <div style={{background:"#fff8e8",border:"1px solid #e8dfc0",borderRadius:12,padding:".9rem 1.1rem"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Request Status</div>
            {[{label:"Approved",count:sc.Approved,color:"#5aaa30"},{label:"Pending",count:sc.Pending,color:"#c87820"},{label:"Rejected",count:sc.Rejected,color:"#c03030"}].map(s=>{
              const t=Object.values(sc).reduce((a,b)=>a+b,0)||1;
              return (
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:64,fontSize:12,fontWeight:700,color:"#3a5020"}}>{s.label}</div>
                  <div style={{flex:1,height:7,borderRadius:4,background:"#e8dfc0",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.round(s.count/t*100)}%`,background:s.color,borderRadius:4}}/>
                  </div>
                  <div style={{width:24,fontSize:12,fontWeight:800,color:s.color,textAlign:"right"}}>{s.count}</div>
                </div>
              );
            })}
          </div>
          {/* Details */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[{label:"Phone",value:user.phone||"—"},{label:"Role",value:user.role||"user"},{label:"Joined",value:user.created_at?new Date(user.created_at).toLocaleDateString():"—"},{label:"Last Login",value:user.last_login?new Date(user.last_login).toLocaleDateString():"Never"}].map(d=>(
              <div key={d.label} style={{background:"rgba(42,112,16,.04)",borderRadius:9,padding:".65rem .85rem"}}>
                <div style={{fontSize:9,fontWeight:800,color:"#9aaa80",textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>{d.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#1a2e0a"}}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GeoMapPanel({show}) {
  const [users,setUsers]=useState([]);
  const [adoptions,setAdoptions]=useState([]);
  const [rehome,setRehome]=useState([]);
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState("all");
  const [provFilter,setProvFilter]=useState("all");
  const [selected,setSelected]=useState(null);
  const [flyTarget,setFlyTarget]=useState(null);
  const [search,setSearch]=useState("");
  // Directions state
  const [directionsUser,setDirectionsUser]=useState(null);
  const [route,setRoute]=useState(null);

  useEffect(()=>{
    if(!show)return;
    setLoading(true);
    Promise.all([
      phpApi("get_users_geo"),
      phpApi("get_requests",{type:"adoptions",limit:1000}),
      phpApi("get_requests",{type:"rehome",limit:1000}),
    ]).then(([ur,ar,rr])=>{
      setUsers(ur.success?(ur.data||[]):[]);
      setAdoptions(ar.success?(ar.data||[]):[]);
      setRehome(rr.success?(rr.data||[]):[]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[show]);

  const geocoded=users.map(u=>({...u,_geo:geocodeUser(u)})).filter(u=>u._geo.inRegion);
  const filtered=geocoded.filter(u=>{
    const mf=filter==="all"||(filter==="active"?u.is_active:!u.is_active);
    const mp=provFilter==="all"||u._geo.province===provFilter;
    const ms=!search||`${u.first_name} ${u.last_name} ${u.city} ${u.province}`.toLowerCase().includes(search.toLowerCase());
    return mf&&mp&&ms;
  });
  const provStats=Object.keys(PROVINCES).map(p=>({name:p,color:PROVINCES[p].color,count:geocoded.filter(u=>u._geo.province===p).length,active:geocoded.filter(u=>u._geo.province===p&&u.is_active).length}));

  const handleDirections=(user)=>{
    setDirectionsUser(user);
    setRoute(null);
    setFlyTarget({lat:user._geo.lat,lng:user._geo.lng});
  };

  const handleRouteReady=(routeData)=>{
    setRoute({
      ...routeData,
      endLabel:directionsUser?`${directionsUser.first_name} ${directionsUser.last_name} (${directionsUser.city||""})`:""
    });
  };

  const clearRoute=()=>{setRoute(null);setDirectionsUser(null);};

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="🗺 Ilocos Region — User Map" subtitle="Click any pin to view details or get in-map directions"
        action={
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["all","active","inactive"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:800,border:"1.5px solid",cursor:"pointer",transition:"all .15s",background:filter===f?"#1c4f09":"transparent",borderColor:filter===f?"#1c4f09":"#ddd0a8",color:filter===f?"#fff":"#7a9060"}}>
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
        {[{val:users.length,label:"Total Users",icon:"👥",color:"#1c4f09"},{val:geocoded.length,label:"In Ilocos Region",icon:"📍",color:"#2a7010"},{val:geocoded.filter(u=>u.is_active).length,label:"Active",icon:"●",color:"#5aaa30"},{val:users.length-geocoded.length,label:"Outside Region",icon:"↗",color:"#c87820"}].map(s=>(
          <div key={s.label} style={{borderRadius:14,border:`1px solid ${s.color}22`,padding:".9rem 1rem",background:`${s.color}0a`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:10,background:`${s.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{s.icon}</div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#1a4a08",lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:10,fontWeight:700,color:"#9aaa80",textTransform:"uppercase",letterSpacing:".06em"}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Route info bar — shown when route is active */}
      {route&&<RouteInfoBar route={route} onClear={clearRoute}/>}

      {/* Map + sidebar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
        <div style={{borderRadius:20,overflow:"hidden",border:"1.5px solid rgba(90,160,48,.35)",boxShadow:"0 4px 20px rgba(30,60,10,.08)"}}>
          {/* Search + directions panel */}
          <div style={{padding:"10px 14px",background:"rgba(255,248,220,.97)",borderBottom:"1px solid #e8dfc0"}}>
            {directionsUser&&!route ? (
              <DirectionsPanel
                destination={{lat:directionsUser._geo.lat,lng:directionsUser._geo.lng,label:`${directionsUser.first_name} ${directionsUser.last_name}, ${directionsUser.city||""}`}}
                onRouteReady={handleRouteReady}
                onClose={()=>{setDirectionsUser(null);setRoute(null);}}
              />
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa880" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, city, province…"
                  style={{flex:1,border:"none",background:"transparent",outline:"none",fontSize:13,fontWeight:600,color:"#1a2e0a",fontFamily:"inherit"}}/>
                {search&&<button onClick={()=>setSearch("")} style={{border:"none",background:"none",color:"#9aaa80",cursor:"pointer",fontSize:14}}>✕</button>}
                <span style={{fontSize:11,fontWeight:700,color:"#9aaa80"}}>{filtered.length} pins</span>
              </div>
            )}
          </div>

          {loading?(
            <div style={{height:460,display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f4e8"}}>
              <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid #2a7010",borderTopColor:"transparent",animation:"spin .8s linear infinite"}}/>
            </div>
          ):(
            <div style={{height:460}}>
              {show&&(
                <MapContainer center={ILOCOS_CENTER} zoom={ILOCOS_ZOOM} style={{height:"100%",width:"100%"}} zoomControl>
                  <MapController flyTarget={flyTarget} routePoints={route?.points}/>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap"/>

                  {/* Province outlines */}
                  {Object.entries(PROVINCES).map(([prov,cfg])=>(
                    <Polygon key={prov} positions={cfg.bounds} pathOptions={{color:cfg.color,weight:2,fillColor:cfg.color,fillOpacity:provFilter===prov?.14:.06,dashArray:"5 4"}}>
                      <Tooltip permanent direction="center" opacity={0.85}>{prov}</Tooltip>
                    </Polygon>
                  ))}

                  {/* Route polyline */}
                  {route?.points&&(
                    <>
                      {/* Shadow */}
                      <Polyline positions={route.points} pathOptions={{color:"rgba(0,0,0,.15)",weight:8,opacity:1}}/>
                      {/* Route line */}
                      <Polyline positions={route.points} pathOptions={{color:"#2a7010",weight:5,opacity:.9,dashArray:undefined}}/>
                      {/* Start marker A */}
                      <Marker position={[route.start.lat,route.start.lng]} icon={startIcon}/>
                      {/* End marker B */}
                      <Marker position={[route.end.lat,route.end.lng]} icon={endIcon}/>
                    </>
                  )}

                  {/* User pins */}
                  {filtered.map(u=>{
                    const pc=PROVINCES[u._geo.province]?.color||"#2a7010";
                    const isRouteTarget=directionsUser?.id===u.id||route&&route.end.lat===u._geo.lat;
                    return (
                      <CircleMarker key={u.id} center={[u._geo.lat,u._geo.lng]}
                        radius={isRouteTarget?13:u.is_active?10:7}
                        pathOptions={{fillColor:u.is_active?pc:"#aaa",color:isRouteTarget?"#c03030":"#fff",weight:isRouteTarget?3:2.5,fillOpacity:u.is_active?.92:.55}}
                        eventHandlers={{click:()=>setSelected(u)}}>
                        <Popup>
                          <div style={{minWidth:170,fontFamily:"inherit",padding:"2px 0"}}>
                            <div style={{fontWeight:800,fontSize:14,color:"#1a4a08",marginBottom:2}}>{u.first_name} {u.last_name}</div>
                            <div style={{fontSize:11,color:"#7a9060",marginBottom:4}}>📍 {u.city||"—"}, {u.province||"—"}</div>
                            <div style={{fontSize:11,color:"#9aaa80",marginBottom:8}}>{u.address||"No street address"}</div>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>setSelected(u)}
                                style={{flex:1,padding:"5px 8px",borderRadius:7,border:"1px solid rgba(42,112,16,.3)",background:"rgba(42,112,16,.08)",color:"#1c4f09",fontSize:11,fontWeight:800,cursor:"pointer"}}>
                                Details
                              </button>
                              <button onClick={()=>handleDirections(u)}
                                style={{flex:1,padding:"5px 8px",borderRadius:7,border:"none",background:"#1c4f09",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer"}}>
                                Directions
                              </button>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{padding:"10px 14px",background:"rgba(255,252,235,.97)",borderTop:"1px solid #e8dfc0",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            {Object.entries(PROVINCES).map(([p,cfg])=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:cfg.color}}/>
                <span style={{fontSize:11,fontWeight:700,color:"#6a7a50"}}>{p}</span>
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#aaa"}}/>
              <span style={{fontSize:11,fontWeight:700,color:"#9aaa80"}}>Inactive</span>
            </div>
            <span style={{fontSize:11,color:"#9aaa80",marginLeft:"auto"}}>🖱 Click pin → Details or Directions</span>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{borderRadius:20,border:"1.5px solid #ddd0a8",background:"#fffce8",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"12px 14px 10px",borderBottom:"1px solid #e8dfc0",background:"rgba(255,248,220,.97)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#1a4a08",textTransform:"uppercase",letterSpacing:".08em"}}>Users in Region ({filtered.length})</div>
          </div>
          <div style={{overflowY:"auto",flex:1,maxHeight:480}}>
            {filtered.length===0?(
              <div style={{padding:"2rem",textAlign:"center",color:"#9aa880",fontSize:13,fontWeight:600}}>No users match filters</div>
            ):filtered.map(u=>{
              const pc=PROVINCES[u._geo.province]?.color||"#2a7010";
              return (
                <div key={u.id}
                  style={{padding:"10px 14px",borderBottom:"1px solid rgba(200,176,100,.12)",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:u.is_active?pc:"#ccc",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:"#1a2e0a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.first_name} {u.last_name}</div>
                    <div style={{fontSize:11,color:"#7a9060",fontWeight:600}}>{u.city||"—"}</div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <button onClick={()=>setSelected(u)} title="View details"
                      style={{width:26,height:26,borderRadius:6,border:"1px solid rgba(42,112,16,.25)",background:"rgba(42,112,16,.07)",color:"#1c4f09",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      👁
                    </button>
                    <button onClick={()=>handleDirections(u)} title="Get directions"
                      style={{width:26,height:26,borderRadius:6,border:"none",background:"#1c4f09",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      🗺
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected&&(
        <UserModal
          user={selected}
          onClose={()=>setSelected(null)}
          onFlyTo={geo=>setFlyTarget({lat:geo.lat,lng:geo.lng})}
          onDirections={u=>{handleDirections(u);}}
          adoptions={adoptions}
          rehome={rehome}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}