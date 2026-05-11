import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";
import Dogs from "../images/Dogs.png";
import { usePageTitle } from "../hooks/usePageTitle";

// ── Philippine Zip Code Database (PHLPost) ─────────────────────────────────
const PHL_ZIP_DB = [
  ["NCR","Metro Manila","Binondo",1006],["NCR","Metro Manila","Ermita",1000],["NCR","Metro Manila","Intramuros",1002],["NCR","Metro Manila","Malate",1004],["NCR","Metro Manila","Paco",1007],["NCR","Metro Manila","Pandacan",1011],["NCR","Metro Manila","Port Area",1018],["NCR","Metro Manila","Quiapo",1001],["NCR","Metro Manila","Sampaloc",1008],["NCR","Metro Manila","San Andres",1015],["NCR","Metro Manila","San Miguel",1005],["NCR","Metro Manila","San Nicolas",1010],["NCR","Metro Manila","Santa Ana",1009],["NCR","Metro Manila","Santa Cruz",1003],["NCR","Metro Manila","Santa Mesa",1016],["NCR","Metro Manila","Tondo",1013],
  ["NCR","Metro Manila","Makati CPO",1200],["NCR","Metro Manila","Bel-Air",1209],["NCR","Metro Manila","Cembo",1201],["NCR","Metro Manila","Dasmariñas Village",1221],["NCR","Metro Manila","Forbes Park",1219],["NCR","Metro Manila","Guadalupe Nuevo",1212],["NCR","Metro Manila","Guadalupe Viejo",1211],["NCR","Metro Manila","Pio del Pilar",1230],["NCR","Metro Manila","Poblacion Makati",1210],["NCR","Metro Manila","Rockwell",1210],["NCR","Metro Manila","San Lorenzo Village",1223],["NCR","Metro Manila","Urdaneta Village",1222],
  ["NCR","Metro Manila","Quezon City CPO",1100],["NCR","Metro Manila","Balara",1119],["NCR","Metro Manila","Batasan Hills",1126],["NCR","Metro Manila","Cubao",1109],["NCR","Metro Manila","Diliman",1101],["NCR","Metro Manila","Fairview",1118],["NCR","Metro Manila","Kamuning",1103],["NCR","Metro Manila","Kamias",1102],["NCR","Metro Manila","Lagro",1116],["NCR","Metro Manila","Novaliches",1123],["NCR","Metro Manila","Pasong Tamo QC",1107],["NCR","Metro Manila","Project 2 & 3",1102],["NCR","Metro Manila","Project 4",1109],["NCR","Metro Manila","Project 6",1100],["NCR","Metro Manila","Project 7",1105],["NCR","Metro Manila","Project 8",1106],["NCR","Metro Manila","Sauyo",1116],["NCR","Metro Manila","Tandang Sora",1116],["NCR","Metro Manila","Teachers Village",1101],["NCR","Metro Manila","UP Village",1101],["NCR","Metro Manila","West Triangle",1104],["NCR","Metro Manila","Holy Spirit",1127],["NCR","Metro Manila","Payatas",1119],["NCR","Metro Manila","Commonwealth",1121],["NCR","Metro Manila","Bagumbayan",1110],["NCR","Metro Manila","Bagong Silangan",1124],["NCR","Metro Manila","Claro",1101],
  ["NCR","Metro Manila","Caloocan CPO",1400],["NCR","Metro Manila","Bagong Barrio",1400],["NCR","Metro Manila","EDSA Caloocan",1403],["NCR","Metro Manila","Grace Park",1403],["NCR","Metro Manila","Maypajo",1406],["NCR","Metro Manila","Pasong Putik",1404],["NCR","Metro Manila","Deparo",1409],["NCR","Metro Manila","Camarin",1422],["NCR","Metro Manila","Bagumbong",1421],
  ["NCR","Metro Manila","Malabon CPO",1470],["NCR","Metro Manila","Navotas CPO",1485],["NCR","Metro Manila","Valenzuela CPO",1440],["NCR","Metro Manila","Karuhatan",1441],["NCR","Metro Manila","Lingunan",1446],["NCR","Metro Manila","Mapulang Lupa",1448],["NCR","Metro Manila","Malinta CPO",1440],
  ["NCR","Metro Manila","Pasay CPO",1300],["NCR","Metro Manila","Pasig CPO",1600],["NCR","Metro Manila","Pasig Kapitolyo",1603],["NCR","Metro Manila","Ortigas Center",1605],["NCR","Metro Manila","Mandaluyong CPO",1550],["NCR","Metro Manila","Mandaluyong Wack-Wack",1555],
  ["NCR","Metro Manila","Marikina CPO",1800],["NCR","Metro Manila","Marikina Concepcion",1810],["NCR","Metro Manila","San Juan CPO",1500],["NCR","Metro Manila","Greenhills",1502],["NCR","Metro Manila","Eisenhower-Crame",1504],
  ["NCR","Metro Manila","Parañaque CPO",1700],["NCR","Metro Manila","BF Homes Parañaque",1720],["NCR","Metro Manila","Sto. Niño Parañaque",1709],["NCR","Metro Manila","Las Piñas CPO",1740],["NCR","Metro Manila","Muntinlupa CPO",1770],["NCR","Metro Manila","Alabang",1771],["NCR","Metro Manila","Sucat",1767],
  ["NCR","Metro Manila","Taguig CPO",1630],["NCR","Metro Manila","Bonifacio Global City",1635],["NCR","Metro Manila","Fort Bonifacio",1634],["NCR","Metro Manila","Ususan",1639],["NCR","Metro Manila","Pateros CPO",1620],
  ["Region 4A (CALABARZON)","Laguna","Biñan",4024],["Region 4A (CALABARZON)","Laguna","Calamba",4027],["Region 4A (CALABARZON)","Laguna","San Pedro",4023],["Region 4A (CALABARZON)","Laguna","Sta. Rosa",4026],["Region 4A (CALABARZON)","Laguna","Cabuyao",4025],["Region 4A (CALABARZON)","Laguna","Los Baños",4030],["Region 4A (CALABARZON)","Laguna","Bay",4033],["Region 4A (CALABARZON)","Laguna","Calauan",4012],["Region 4A (CALABARZON)","Laguna","San Pablo",4000],["Region 4A (CALABARZON)","Laguna","Siniloan",4019],
  ["Region 4A (CALABARZON)","Cavite","Cavite City",4100],["Region 4A (CALABARZON)","Cavite","Bacoor",4102],["Region 4A (CALABARZON)","Cavite","Imus",4103],["Region 4A (CALABARZON)","Cavite","Dasmariñas",4114],["Region 4A (CALABARZON)","Cavite","Tagaytay",4120],["Region 4A (CALABARZON)","Cavite","Trece Martires",4109],["Region 4A (CALABARZON)","Cavite","Silang",4118],
  ["Region 4A (CALABARZON)","Rizal","Antipolo",1870],["Region 4A (CALABARZON)","Rizal","Cainta",1900],["Region 4A (CALABARZON)","Rizal","Taytay",1920],["Region 4A (CALABARZON)","Rizal","Angono",1930],["Region 4A (CALABARZON)","Rizal","Binangonan",1940],
  ["Region 4A (CALABARZON)","Batangas","Batangas City",4200],["Region 4A (CALABARZON)","Batangas","Lipa",4217],["Region 4A (CALABARZON)","Batangas","Tanauan",4232],
  ["Region 4A (CALABARZON)","Quezon","Lucena",4301],["Region 4A (CALABARZON)","Quezon","Tayabas",4327],
  ["Region 3 (Central Luzon)","Bulacan","Malolos",3000],["Region 3 (Central Luzon)","Bulacan","Meycauayan",3020],["Region 3 (Central Luzon)","Bulacan","Marilao",3019],["Region 3 (Central Luzon)","Bulacan","San Jose del Monte",3023],
  ["Region 3 (Central Luzon)","Pampanga","San Fernando",2000],["Region 3 (Central Luzon)","Pampanga","Angeles",2009],["Region 3 (Central Luzon)","Pampanga","Mabalacat",2010],
  ["Region 3 (Central Luzon)","Nueva Ecija","Cabanatuan",3100],["Region 3 (Central Luzon)","Nueva Ecija","Palayan",3132],
  ["Region 3 (Central Luzon)","Bataan","Balanga",2100],["Region 3 (Central Luzon)","Tarlac","Tarlac City",2300],["Region 3 (Central Luzon)","Zambales","Olongapo",2200],
  ["Region 1 (Ilocos Region)","Pangasinan","Dagupan",2400],["Region 1 (Ilocos Region)","La Union","San Fernando City",2500],["Region 1 (Ilocos Region)","Ilocos Norte","Laoag City",2900],["Region 1 (Ilocos Region)","Ilocos Sur","Vigan",2700],
  ["Region 2 (Cagayan Valley)","Cagayan","Tuguegarao",3500],["Region 2 (Cagayan Valley)","Isabela","Ilagan",3300],["Region 2 (Cagayan Valley)","Nueva Vizcaya","Bayombong",3700],
  ["CAR (Cordillera)","Benguet","Baguio",2600],["CAR (Cordillera)","Benguet","La Trinidad",2601],["CAR (Cordillera)","Ifugao","Lagawe",3600],["CAR (Cordillera)","Mountain Province","Bontoc",2616],["CAR (Cordillera)","Kalinga","Tabuk",3800],
  ["Region 4B (MIMAROPA)","Palawan","Puerto Princesa",5300],["Region 4B (MIMAROPA)","Oriental Mindoro","Calapan",5200],
  ["Region 5 (Bicol)","Camarines Sur","Naga",4400],["Region 5 (Bicol)","Albay","Legazpi",4500],["Region 5 (Bicol)","Sorsogon","Sorsogon City",4700],
  ["Region 6 (Western Visayas)","Iloilo","Iloilo City",5000],["Region 6 (Western Visayas)","Negros Occidental","Bacolod",6100],
  ["Region 7 (Central Visayas)","Cebu","Cebu City",6000],["Region 7 (Central Visayas)","Cebu","Mandaue",6014],["Region 7 (Central Visayas)","Bohol","Tagbilaran",6300],["Region 7 (Central Visayas)","Negros Oriental","Dumaguete",6200],
  ["Region 8 (Eastern Visayas)","Leyte","Tacloban",6500],["Region 8 (Eastern Visayas)","Leyte","Ormoc",6541],
  ["Region 9 (Zamboanga)","Zamboanga City","Zamboanga City",7000],["Region 9 (Zamboanga)","Zamboanga del Norte","Dipolog",7100],
  ["Region 10 (Northern Mindanao)","Misamis Oriental","Cagayan de Oro",9000],["Region 10 (Northern Mindanao)","Lanao del Norte","Iligan",9200],
  ["Region 11 (Davao)","Davao del Sur","Davao City",8000],["Region 11 (Davao)","Davao del Norte","Tagum",8100],
  ["Region 12 (SOCCSKSARGEN)","South Cotabato","General Santos",9500],["Region 12 (SOCCSKSARGEN)","North Cotabato","Kidapawan",9400],
  ["BARMM","Maguindanao del Norte","Cotabato City",9600],["BARMM","Lanao del Sur","Marawi",9700],
  ["Region 13 (Caraga)","Agusan del Norte","Butuan",8600],["Region 13 (Caraga)","Surigao del Norte","Surigao City",8400],
];

function lookupZip(city) {
  if (!city || city.trim().length < 2) return [];
  const q = city.toLowerCase();
  return PHL_ZIP_DB.filter(r => r[2].toLowerCase().includes(q));
}

// ── Background ─────────────────────────────────────────────────────────────
function MeshBackground() {
  const orbRefs = useRef([]);
  const mouse = useRef({ mx:0, my:0, cx:0, cy:0 });
  const factors = [
    { fx:0.10,fy:0.07 },{ fx:-0.12,fy:0.09 },{ fx:0.14,fy:-0.08 },
    { fx:-0.08,fy:-0.11 },{ fx:0.09,fy:0.13 },{ fx:-0.13,fy:0.07 },
  ];
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.mx = (e.clientX/window.innerWidth  - 0.5)*80;
      mouse.current.my = (e.clientY/window.innerHeight - 0.5)*80;
    };
    window.addEventListener("mousemove", onMove);
    let raf;
    const animate = () => {
      const m = mouse.current;
      m.cx += (m.mx - m.cx)*0.08; m.cy += (m.my - m.cy)*0.08;
      orbRefs.current.forEach((el,i) => {
        if (el) { el.style.marginLeft = m.cx*factors[i].fx+"px"; el.style.marginTop = m.cy*factors[i].fy+"px"; }
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove",onMove); cancelAnimationFrame(raf); };
  }, []);

  const orbs = [
    { w:1100,h:1100,top:"-25%",left:"-20%",  bg:"radial-gradient(circle,#588B41 0%,transparent 70%)",anim:"float1 8s ease-in-out infinite" },
    { w:1000,h:1000,top:"10%", right:"-20%", bg:"radial-gradient(circle,#B45A22 0%,transparent 70%)",anim:"float2 10s ease-in-out infinite" },
    { w:950, h:950, bottom:"-20%",left:"10%",bg:"radial-gradient(circle,#e8e0d0 0%,transparent 60%)",anim:"float3 7s ease-in-out infinite" },
    { w:900, h:900, top:"30%", left:"25%",   bg:"radial-gradient(circle,#588B41 0%,transparent 70%)",anim:"float4 9s ease-in-out infinite" },
    { w:850, h:850, bottom:"0%",right:"-5%", bg:"radial-gradient(circle,#B45A22 0%,transparent 70%)",anim:"float5 11s ease-in-out infinite" },
    { w:800, h:800, top:"5%",  left:"35%",   bg:"radial-gradient(circle,#d4c9b0 0%,transparent 70%)",anim:"float6 8.5s ease-in-out infinite" },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      <div className="absolute inset-0 bg-[#EDDABB]" />
      {orbs.map((o,i) => (
        <div key={i} ref={el=>orbRefs.current[i]=el}
          className="absolute rounded-full"
          style={{ width:o.w,height:o.h,top:o.top,left:o.left,right:o.right,bottom:o.bottom,background:o.bg,animation:o.anim }}>
          <div className="w-full h-full rounded-full mix-blend-multiply opacity-70" style={{ filter:"blur(110px)" }} />
        </div>
      ))}
      <div className="absolute inset-0" style={{ backgroundImage:"linear-gradient(rgba(100,70,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.04) 1px,transparent 1px)",backgroundSize:"60px 60px" }} />
      <div className="absolute opacity-[0.06]" style={{ inset:"-50%",width:"200%",height:"200%",backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,backgroundSize:"256px 256px",animation:"grain 0.4s steps(1) infinite" }} />
      <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.2) 100%)" }} />
    </div>
  );
}

function PawSVG({ style }) {
  return (
    <svg style={style} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="66" rx="24" ry="21"/>
      <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
      <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/>
      <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
      <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
    </svg>
  );
}

function TermsModal({ onAccept, onDecline, onClose }) {
  const [closing, setClosing] = useState(false);
  const close = (cb) => { setClosing(true); setTimeout(cb, 220); };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-6 backdrop-blur-md"
      style={{
        background:"rgba(20,35,15,0.55)",
        animation: closing ? "modalFadeIn .22s ease reverse both" : "modalFadeIn .22s ease",
      }}
      onClick={e=>{ if(e.target===e.currentTarget) close(onClose); }}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[88vh] flex flex-col overflow-hidden"
        style={{
          boxShadow:"0 24px 64px rgba(60,100,30,0.18)",
          animation: closing ? "modalSlideDown .22s ease both" : "modalSlideUp .26s cubic-bezier(.34,1.3,.64,1)",
        }}>
        {/* Header */}
        <div className="flex items-center gap-[0.9rem] px-[1.6rem] py-[1.4rem] border-b border-[#e8f0e2] flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#f4faf0,#edf7e5)" }}>
          <div className="w-12 h-12 bg-white rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ boxShadow:"0 2px 8px rgba(90,138,48,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="#5a8a30">
              <ellipse cx="50" cy="66" rx="24" ry="21"/><ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
              <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/><ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
              <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[1.05rem] font-extrabold text-[#2a4a18] mb-[0.15rem]">Terms of Service &amp; Privacy Policy</h2>
            <p className="text-[0.78rem] font-semibold text-[#7aaa50]">Pawster — Terms & Conditions</p>
          </div>
          <button onClick={()=>close(onClose)} className="ml-auto bg-none border-none text-[1.6rem] text-[#6a8a58] px-[0.4rem] py-[0.2rem] rounded-lg leading-none">&times;</button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-[1.6rem] py-[1.4rem]" style={{ maxHeight:"420px" }}>
          {[
              ["1. Proper Use", "You agree to use PAWSTER responsibly and only for its intended purpose — connecting animals in need with caring adopters. Provide accurate, honest information at all times. Use the platform solely for adoption and rescue purposes. Treat other users and rescue staff with respect. Accounts found to be misused may be suspended or permanently removed."],
              ["2. Your Responsibilities", "Before and after adoption, you are expected to: honestly assess your readiness for pet ownership before applying; complete all questionnaires and assessments truthfully; and participate in any required post-adoption follow-ups."],
              ["3. Adoption Decisions", "PAWSTER does not guarantee that any adoption application will be approved. All final decisions rest with the rescue organization, which may approve or deny any application at their discretion, and request additional information or interviews."],
              ["4. Platform Limitations", "PAWSTER is a support platform, not a guarantor of outcomes. It does not guarantee the health or behavior of any animal listed, or successful adoption outcomes."],
              ["5. Your Data & Privacy", "We collect only the information needed to run the platform, including account verification, adoption processing, and communication. Your data is protected under the Data Privacy Act of 2012 (Republic Act No. 10173)."],
              ["6. Prohibited Actions", "The following are strictly not allowed: submitting false or misleading information; harassing or threatening other users; using the platform in any unauthorized or harmful way. Violations may result in immediate account termination without prior notice."],
              ["7. Changes to These Terms", "PAWSTER may update these terms at any time. We will make reasonable efforts to notify users of significant changes. Continued use of the platform after any changes constitutes your acceptance of the updated terms."],
              ["Acceptance of Terms", "By creating an account or using PAWSTER, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions."],
              ["Contact", "Questions? Email pawster.medico@gmail.com"],
          ].map(([title, text]) => (
            <div key={title} className="mb-[1.3rem]">
              <h3 className="text-[0.88rem] font-black text-[#3a6a20] mb-[0.45rem] uppercase tracking-[0.04em]">{title}</h3>
              <p className="text-[0.88rem] text-[#4a5a42] leading-[1.65]">{text}</p>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="flex gap-3 px-[1.6rem] py-[1.1rem] border-t border-[#e8f0e2] bg-[#fafdf8] flex-shrink-0">
          <button onClick={onDecline} className="flex-1 py-[0.7rem] border-2 border-[#c8ddb8] bg-white text-[#5a7a48] text-[0.9rem] font-bold rounded-[10px]">Decline</button>
          <button onClick={onAccept} className="flex-[2] py-[0.7rem] border-none text-white text-[0.9rem] font-black rounded-[10px]"
            style={{ background:"linear-gradient(135deg,#6aaa38,#4a8a20)", boxShadow:"0 4px 14px rgba(90,138,48,0.3)" }}>
            I Accept &amp; Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (pw.length >= 12)         score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[a-z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[!@#$%^&*]/.test(pw))  score++;
  if (score <= 2) return { label:"Weak",   color:"#d04040", bars:1, tip:"Try adding numbers or symbols" };
  if (score <= 3) return { label:"Fair",   color:"#e07820", bars:2, tip:"Add uppercase & special characters" };
  if (score <= 4) return { label:"Good",   color:"#c8a020", bars:3, tip:"Almost there — try a longer password" };
  return           { label:"Strong", color:"#3a9020", bars:4, tip:null };
}

function PasswordStrengthMeter({ password }) {
  const s = getPasswordStrength(password);
  if (!s) return null;
  return (
    <div className="-mt-[0.4rem] mb-[0.9rem]">
      <div className="flex gap-1 mb-[0.3rem]">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-[5px] rounded-[3px] transition-colors duration-[250ms]"
            style={{ background: i <= s.bars ? s.color : "rgba(180,150,80,0.22)" }}/>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[0.72rem] font-black tracking-[0.04em]" style={{ color:s.color }}>{s.label} password</span>
        {s.tip && <span className="text-[0.70rem] font-bold text-[#8a7a50]">{s.tip}</span>}
      </div>
    </div>
  );
}

function Field({ label, id, type="text", placeholder, value, onChange, error, className="" }) {
  return (
    <div className={`mb-[0.95rem] flex flex-col ${className}`}>
      <label htmlFor={id} className={`text-[0.72rem] font-black uppercase tracking-[0.07em] italic mb-[0.38rem] ${error ? "text-[#c03030]" : "text-[#276010]"}`}>
        {label}
      </label>
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange} className="field-input"
        style={{ display:"block", width:"100%", padding:"0.75rem 0.9rem", border:`2px solid ${error ? "#d04040" : "#5aaa30"}`, borderLeft: error ? "4px solid #d04040" : "2px solid #5aaa30", borderRadius:10, background: error ? "rgba(253,240,240,0.60)" : "rgba(255,250,232,0.52)", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem", fontWeight:600, color:"#222", outline:"none", transition:"border-color 0.18s,box-shadow 0.18s,background 0.18s" }}
      />
      {error && (
        <span className="flex items-center gap-[0.3rem] text-[0.72rem] font-bold text-[#c03030] mt-[0.28rem]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

function MapPickerModal({ onClose, onConfirm }) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markerRef  = useRef(null);
  const [picked, setPicked]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoErr, setGeoErr]   = useState("");
  const [closing, setClosing] = useState(false);
  const close = (cb) => { setClosing(true); setTimeout(cb, 220); };

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }
    const initMap = () => {
      if (leafletMap.current || !mapRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([14.5995, 120.9842], 12);
      leafletMap.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap contributors", maxZoom:19 }).addTo(map);
      const pawIcon = L.divIcon({
        className: "",
        html: `<div style="width:40px;height:40px;background:linear-gradient(135deg,#1c4f09,#2a6e10);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(28,79,9,0.45);display:flex;align-items:center;justify-content:center;">
          <svg style="transform:rotate(45deg)" width="20" height="20" viewBox="0 0 100 100" fill="white"><ellipse cx="50" cy="66" rx="24" ry="21"/><ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/><ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/><ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/><ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/></svg></div>`,
        iconSize:[40,40], iconAnchor:[20,40],
      });
      const placeMarker = (lat, lng) => {
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng], { icon: pawIcon }).addTo(map);
        setLoading(true); setGeoErr("");
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r=>r.json())
          .then(data => {
            const a = data.address || {};
            const road=a.road||a.pedestrian||a.footway||"", houseNo=a.house_number||"", suburb=a.suburb||a.village||a.neighbourhood||"";
            const city=a.city||a.town||a.municipality||"", province=a.province||a.state||"", postcode=a.postcode||"";
            const streetLine=[houseNo,road,suburb].filter(Boolean).join(" ");
            setPicked({ lat, lng, street:streetLine, city, province, zip:postcode||"", label:data.display_name });
          })
          .catch(()=>setGeoErr("Could not fetch address. You can still confirm."))
          .finally(()=>setLoading(false));
      };
      map.on("click", e=>placeMarker(e.latlng.lat, e.latlng.lng));
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos=>{ map.setView([pos.coords.latitude,pos.coords.longitude],15); placeMarker(pos.coords.latitude,pos.coords.longitude); },
          ()=>{}
        );
      }
    };
    if (window.L) initMap();
    else if (!document.getElementById("leaflet-js")) {
      const script=document.createElement("script"); script.id="leaflet-js";
      script.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload=initMap; document.head.appendChild(script);
    } else {
      const interval=setInterval(()=>{ if(window.L){clearInterval(interval);initMap();} },100);
      return ()=>clearInterval(interval);
    }
    return ()=>{ if(leafletMap.current){leafletMap.current.remove();leafletMap.current=null;} };
  }, []);

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 backdrop-blur-[8px]"
      style={{
        background:"rgba(10,25,5,0.65)",
        animation: closing ? "modalFadeIn .22s ease reverse both" : "modalFadeIn .22s ease",
      }}
      onClick={e=>{ if(e.target===e.currentTarget) close(onClose); }}>
      <div className="w-full max-w-[680px] rounded-[24px] overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background:"rgba(255,250,230,0.97)",
          boxShadow:"0 28px 72px rgba(28,79,9,0.22)",
          animation: closing ? "modalSlideDown .22s ease both" : "modalSlideUp .28s cubic-bezier(.34,1.3,.64,1)",
        }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-[1.4rem] py-[1.1rem] flex-shrink-0"
          style={{ background:"linear-gradient(135deg,#1c4f09,#2a6e10)" }}>
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background:"rgba(255,255,255,0.15)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
          </div>
          <div>
            <h3 className="text-[1rem] font-black text-white">Pin Your Address</h3>
            <p className="text-[0.74rem] font-bold text-white/75">Click anywhere on the map to set your location</p>
          </div>
          <button onClick={()=>close(onClose)} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white text-[1.2rem] border-none"
            style={{ background:"rgba(255,255,255,0.15)" }}>×</button>
        </div>
        {/* Map */}
        <div className="relative flex-1 min-h-[340px]">
          <div ref={mapRef} className="w-full h-full min-h-[340px]" />
          {!picked && !loading && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-[0.82rem] font-black px-[1.1rem] py-[0.6rem] rounded-[30px] pointer-events-none whitespace-nowrap"
              style={{ background:"rgba(28,79,9,0.88)", boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
              📍 Click on the map to drop a pin
            </div>
          )}
          {loading && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-[0.78rem] font-black px-4 py-[0.45rem] rounded-[20px] flex items-center gap-[0.4rem]"
              style={{ background:"rgba(28,79,9,0.9)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="spin-anim"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Fetching address…
            </div>
          )}
        </div>
        {(picked||geoErr) && (
          <div className="px-[1.4rem] py-[0.9rem] flex-shrink-0 border-t border-[rgba(90,170,48,0.25)]"
            style={{ background:"rgba(240,252,232,0.85)" }}>
            {geoErr && <p className="text-[0.78rem] font-bold text-[#c03030] mb-2">⚠ {geoErr}</p>}
            {picked && (
              <div className="flex items-start gap-[0.6rem]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" className="flex-shrink-0 mt-[2px]" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
                <p className="text-[0.82rem] font-bold text-[#2a5010] leading-[1.5]">{picked.label}</p>
              </div>
            )}
          </div>
        )}
        {/* Footer */}
        <div className="flex gap-3 px-[1.4rem] py-[0.9rem] flex-shrink-0 border-t border-[rgba(180,150,80,0.22)]"
          style={{ background:"rgba(255,250,228,0.9)" }}>
          <button onClick={()=>close(onClose)} className="flex-1 py-[0.7rem] border-2 border-[rgba(28,79,9,0.3)] bg-transparent text-[#1c4f09] text-[0.9rem] font-black rounded-[10px]">Cancel</button>
          <button onClick={()=>picked&&onConfirm(picked)} disabled={!picked||loading}
            className="flex-[2] py-[0.7rem] border-none text-[0.9rem] font-black rounded-[10px] transition-all duration-[200ms]"
            style={{ background:picked?"linear-gradient(135deg,#1c4f09,#2a6e10)":"rgba(180,180,160,0.4)", color:picked?"#fff":"#aaa", boxShadow:picked?"0 4px 14px rgba(28,79,9,0.28)":"none" }}>
            {picked ? "✓ Use This Location" : "Drop a pin first"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }) {
  const steps = ["Personal Info","Location","Verification"];
  return (
    <div className="flex items-center mb-6">
      {steps.map((label,i) => {
        const n=i+1, done=n<current, active=n===current;
        return (
          <div key={n} className="contents">
            <div className="flex flex-col items-center gap-[0.3rem] min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[0.88rem] transition-all duration-300"
                style={{
                  border:`2.5px solid ${done||active?"#1c4f09":"rgba(180,150,80,0.35)"}`,
                  background:done?"#1c4f09":active?"rgba(28,79,9,0.10)":"rgba(255,248,225,0.60)",
                  color:done?"#fff":active?"#1c4f09":"#a09060",
                  boxShadow:active?"0 0 0 4px rgba(28,79,9,0.12)":"none",
                }}
              >
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : n}
              </div>
              <span className="text-[0.67rem] font-black text-center whitespace-nowrap tracking-[0.02em]"
                style={{ color:active?"#1c4f09":done?"#4a7a28":"#a09060" }}>{label}</span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-[2px] mx-[6px] mb-[18px] rounded-[2px] transition-colors duration-300 min-w-[20px]"
                style={{ background:done?"#1c4f09":"rgba(180,150,80,0.28)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ZipField({ city, value, onChange, onSelect, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow]               = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (city && city.trim().length >= 2) {
      const matches = lookupZip(city);
      if (matches.length > 0) { setSuggestions(matches.slice(0, 10)); setShow(true); }
      else { setSuggestions([]); setShow(false); }
    } else {
      setSuggestions([]); setShow(false);
    }
  }, [city]);

  useEffect(() => {
    const handler=(e)=>{ if(wrapRef.current&&!wrapRef.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  }, []);

  const handleInput = (e) => {
    onChange(e);
    const q=e.target.value;
    if (q.length>=2) { const m=lookupZip(q); setSuggestions(m.slice(0,10)); setShow(m.length>0); }
    else { setSuggestions([]); setShow(false); }
  };

  return (
    <div className="mb-[0.95rem] flex flex-col">
      <label htmlFor="zip" className={`text-[0.72rem] font-black uppercase tracking-[0.07em] italic mb-[0.38rem] ${error?"text-[#c03030]":"text-[#276010]"}`}>
        Zip / Postal Code
      </label>
      <div className="relative" ref={wrapRef}>
        <input id="zip" type="text" placeholder="Auto-fills from city, or search here…"
          value={value} onChange={handleInput}
          onFocus={()=>{ const m=lookupZip(city||value); if(m.length){setSuggestions(m.slice(0,10));setShow(true);} }}
          className="field-input"
          style={{ display:"block", width:"100%", padding:"0.75rem 0.9rem", border:`2px solid ${error?"#d04040":"#5aaa30"}`, borderLeft:error?"4px solid #d04040":"2px solid #5aaa30", borderRadius:10, background:error?"rgba(253,240,240,0.60)":"rgba(255,250,232,0.52)", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem", fontWeight:600, color:"#222", outline:"none", transition:"border-color 0.18s,box-shadow 0.18s" }}
          autoComplete="off"
        />
        {show && suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[9999] rounded-[10px] max-h-[220px] overflow-y-auto"
            style={{ background:"rgba(255,252,238,0.99)", border:"2px solid #5aaa30", boxShadow:"0 8px 28px rgba(28,79,9,0.18)" }}>
            {suggestions.map((r,i) => (
              <div key={i}
                onMouseDown={e=>{ e.preventDefault(); onSelect(r); setShow(false); setSuggestions([]); }}
                className="px-[0.9rem] py-[0.6rem] cursor-pointer flex items-center gap-[0.6rem] text-[0.84rem]"
                style={{ borderBottom:i<suggestions.length-1?"1px solid rgba(90,170,48,0.15)":"none" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(90,170,48,0.1)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span className="font-black text-[#1c4f09] min-w-[42px] text-[0.88rem]">{r[3]}</span>
                <span className="font-bold text-[#2a4a18] flex-1">{r[2]}</span>
                <span className="font-semibold text-[#7a9060] text-[0.74rem] text-right">{r[1]}</span>
              </div>
            ))}
            <div className="px-[0.9rem] py-[0.4rem] text-[0.70rem] font-bold text-[#7a9060] border-t border-[rgba(90,170,48,0.15)]"
              style={{ background:"rgba(240,252,232,0.6)" }}>
              PHLPost official data · select the zone for your barangay
            </div>
          </div>
        )}
      </div>
      {error && (
        <span className="flex items-center gap-[0.3rem] text-[0.72rem] font-bold text-[#c03030] mt-[0.28rem]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register }              = useAuth();
  const [step, setStep]           = useState(1);
  const [direction, setDirection] = useState("forward");
  const [exiting, setExiting]     = useState(false);
  const [leaving, setLeaving]     = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [alert, setAlert]         = useState({ type:"",msg:"" });
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState({
    firstName:"", lastName:"", email:"", phone:"", password:"", confirmPassword:"",
    address:"", city:"", province:"", zip:"",
  });
  const [idFile, setIdFile]           = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors]           = useState({});
  const [uploadLabel, setUploadLabel] = useState("No file selected");
  const [showMap, setShowMap]         = useState(false);

  const set = (k) => (e) => {
    setForm(f=>({...f,[k]:e.target.value}));
    setErrors(v=>({...v,[k]:""}));
    setAlert({type:"",msg:""});
  };

  const handleZipSelect = (r) => {
    setForm(f=>({...f, zip:String(r[3]), city:r[2], province:`${r[1]}`}));
    setErrors(v=>({...v, zip:"", city:"", province:""}));
  };

  usePageTitle("Register");

  function navigate(url) {
    setLeaving(true);
    setTimeout(() => { window.location.href = url; }, 220);
  }

  function validateStep1() {
    const e={};
    if (!form.firstName.trim()) e.firstName="First name is required.";
    if (!form.lastName.trim())  e.lastName="Last name is required.";
    if (!form.email.trim())     e.email="Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email="Enter a valid email address.";
    if (!form.phone.trim())     e.phone="Phone number is required.";
    else if (!/^(09\d{9}|\+639\d{9})$/.test(form.phone.trim())) e.phone="Enter a valid PH number (e.g. 09171234567).";
    if (!form.password)         e.password="Password is required.";
    if (!form.confirmPassword)  e.confirmPassword="Please confirm your password.";
    else if (form.password!==form.confirmPassword) e.confirmPassword="Passwords do not match.";
    setErrors(e); return Object.keys(e).length===0;
  }

  function validateStep2() {
    const e={};
    if (!form.address.trim())  e.address="Street address is required.";
    if (!form.city.trim())     e.city="City is required.";
    if (!form.province.trim()) e.province="Province is required.";
    if (!form.zip.trim())      e.zip="Zip / Postal code is required.";
    setErrors(e); return Object.keys(e).length===0;
  }

  function goTo(next) {
    setAlert({type:"",msg:""});
    if (next > step) {
      if (step===1 && !validateStep1()) return;
      if (step===2 && !validateStep2()) return;
    }
    setDirection(next > step ? "forward" : "backward");
    setExiting(true);
    setTimeout(() => { setStep(next); setExiting(false); }, 180);
  }

  async function doRegister() {
    setLoading(true);
    const fd=new FormData();
    fd.append("firstName",form.firstName.trim()); fd.append("lastName",form.lastName.trim());
    fd.append("email",form.email.trim()); fd.append("phone",form.phone.trim());
    fd.append("password",form.password); fd.append("address",form.address.trim());
    fd.append("city",form.city.trim()); fd.append("province",form.province.trim());
    fd.append("zip",form.zip.trim()); fd.append("idFile",idFile);
    try { await register(fd); }
    catch(err) { setAlert({ type:"error", msg:err.response?.data?.message||"An error occurred during registration." }); setLoading(false); }
  }

  function handleSubmit() {
    setAlert({type:"",msg:""});
    if (!idFile) { setUploadLabel("⚠ Please upload a government-issued ID."); return; }
    setPendingSubmit(true); setShowTerms(true);
  }

  async function handleTermsAccept() { setTermsAccepted(true); setShowTerms(false); setPendingSubmit(false); await doRegister(); }
  function handleTermsDecline() { setTermsAccepted(false); setPendingSubmit(false); setShowTerms(false); }

  function handleMapConfirm(loc) {
    const safeZip = loc.zip || "";
    setForm(f=>({ ...f, address:loc.street||f.address, city:loc.city||f.city, province:loc.province||f.province, zip:safeZip }));
    setErrors(v=>({...v,address:"",city:"",province:"",zip:""}));
    setShowMap(false);
  }

  const stepClass = exiting
    ? (direction === "forward" ? "step-exit-fwd" : "step-exit-bwd")
    : (direction === "forward" ? "step-enter-fwd" : "step-enter-bwd");

  const pawData = [
    { top:"18%",left:"2%",  width:120,fill:"rgba(72,95,42,0.28)",  rotate:-8  },
    { top:"48%",left:"5%",  width:85, fill:"rgba(72,95,42,0.22)",  rotate:6   },
    { bottom:"-2%",left:"-2%",width:210,fill:"rgba(195,130,70,0.18)",rotate:-18 },
    { top:"41%",left:"52%", width:55, fill:"rgba(195,135,75,0.55)", rotate:-14 },
    { bottom:"18%",left:"46%",width:160,fill:"rgba(198,138,80,0.62)",rotate:13 },
    { top:"24%",left:"38%", width:60, fill:"rgba(72,95,42,0.17)",  rotate:-5  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body { height:100%; font-family:'Nunito',sans-serif; background:#EDDABB; }
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12%,16%) scale(1.15)}66%{transform:translate(-8%,8%) scale(0.9)}}
        @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-14%,10%) scale(0.9)}66%{transform:translate(8%,-15%) scale(1.15)}}
        @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(14%,-10%) scale(1.12)}75%{transform:translate(-10%,8%) scale(0.9)}}
        @keyframes float4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-15%,-12%) scale(1.18)}}
        @keyframes float5{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-10%,-18%) scale(1.1)}80%{transform:translate(8%,-8%) scale(0.9)}}
        @keyframes float6{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(15%,12%) scale(1.15)}70%{transform:translate(-8%,18%) scale(0.88)}}
        @keyframes grain{0%,100%{transform:translate(0,0)}50%{transform:translate(-2%,2%)}}
        @keyframes modalFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes modalSlideUp{from{transform:translateY(36px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes modalSlideDown{from{transform:translateY(0) scale(1);opacity:1}to{transform:translateY(36px) scale(.95);opacity:0}}
        @keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stepEnterFwd{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
        @keyframes stepEnterBwd{from{opacity:0;transform:translateX(-36px)}to{opacity:1;transform:translateX(0)}}
        @keyframes stepExitFwd{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-36px)}}
        @keyframes stepExitBwd{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(36px)}}
        @keyframes pageFadeOut{from{opacity:1}to{opacity:0}}
        .step-enter-fwd { animation: stepEnterFwd 0.30s cubic-bezier(0.22,1,0.36,1) both; }
        .step-enter-bwd { animation: stepEnterBwd 0.30s cubic-bezier(0.22,1,0.36,1) both; }
        .step-exit-fwd  { animation: stepExitFwd  0.18s ease both; }
        .step-exit-bwd  { animation: stepExitBwd  0.18s ease both; }
        .page-exit { animation: pageFadeOut 0.22s ease both; }
        .spin-anim { animation: spin 0.8s linear infinite; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .card-anim { animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .field-input:focus { border-color:#1c4f09 !important; border-left-color:#1c4f09 !important; background:rgba(255,252,238,0.78) !important; box-shadow:0 0 0 3px rgba(28,79,9,0.09) !important; }
        .field-input::placeholder { color:#b0a07a; font-style:italic; font-weight:600; }
        .upload-btn:hover { background:rgba(236,221,184,0.8) !important; border-style:solid !important; }
        .btn-primary:hover:not(:disabled) { background:linear-gradient(135deg,#143806,#1e5c0a) !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(28,79,9,0.32) !important; }
        .btn-primary:active:not(:disabled) { transform:translateY(0) !important; }
        .btn-outline:hover { background:rgba(28,79,9,0.06) !important; transform:translateY(-1px); }
      `}</style>

      <MeshBackground />
      {showTerms && <TermsModal onAccept={handleTermsAccept} onDecline={handleTermsDecline} onClose={handleTermsDecline} />}
      {showMap   && <MapPickerModal onClose={()=>setShowMap(false)} onConfirm={handleMapConfirm} />}

      {/* Nav */}
      <nav className="fixed top-0 right-0 z-[300] flex items-center gap-3 px-4 md:px-[1.6rem] py-[0.85rem]">
        <button onClick={()=>navigate("/login")}
          className="bg-[#1c4f09] text-white border-none rounded-full text-[0.85rem] md:text-[0.95rem] font-black px-4 md:px-6 py-[0.4rem] md:py-[0.45rem]">
          Sign in
        </button>
        <span className="hidden sm:inline text-[0.95rem] font-extrabold text-[#1c4f09] border-b-[2.5px] border-[#1c4f09] px-[0.3rem] pb-[0.2rem]">Register</span>
        <a href="/"><img src={logo} alt="Pawster Logo" className="w-12 h-12 md:w-16 md:h-16 object-cover"/></a>
      </nav>

      {/* Page wrapper */}
      <div className={`relative z-10 flex items-center justify-center min-h-screen w-full max-w-[1920px] mx-auto px-4 md:px-[6vw] gap-[2vw] ${leaving ? "page-exit" : ""}`}>

        {/* Left Panel */}
        <div className="hidden lg:block flex-1 relative h-screen max-h-[1200px] overflow-visible">
          <div className="absolute inset-0 z-[5] pointer-events-none">
            {pawData.map((p,i)=>(
              <PawSVG key={i} style={{ position:"absolute",top:p.top,left:p.left,bottom:p.bottom,width:p.width,height:p.width,fill:p.fill,transform:`rotate(${p.rotate}deg)` }}/>
            ))}
          </div>
          <img src={Dogs} alt="Pawster Dogs Mascot"
            className="absolute bottom-0 left-[-1%] z-10 w-auto object-contain"
            style={{ height:"82vh", maxHeight:760, filter:"drop-shadow(0 10px 28px rgba(0,0,0,0.16))" }}/>
          <div className="absolute top-[4%] left-[15%] z-20 text-center max-w-[560px]">
            <h1 className="font-black text-[#1a4a08] uppercase leading-[0.95] tracking-tight"
              style={{ fontSize:"clamp(3rem,3.8vw,4.8rem)", textShadow:"0 2px 14px rgba(255,255,255,0.22)" }}>
              Welcome to<br/>Pawster!
            </h1>
            <p className="mt-4 font-bold text-[#2a5010] leading-[1.62] max-w-[420px] mx-auto"
              style={{ fontSize:"clamp(0.88rem,1vw,1.05rem)", textShadow:"0 1px 6px rgba(255,255,255,0.32)" }}>
              Join our community and start making a difference in rescued animals' lives.
            </p>
          </div>
        </div>

        {/* Register card */}
        <div className="card-anim w-full max-w-[500px] lg:w-[500px] lg:min-w-[460px] lg:flex-shrink-0 lg:mr-[3vw] lg:mt-[3vh] mt-16 lg:mt-0 flex flex-col justify-center px-5 py-6 md:px-[2.4rem] md:py-8 rounded-[28px] overflow-hidden backdrop-blur-xl"
          style={{ background:"rgba(255,248,225,0.42)", border:"1.5px solid rgba(255,238,190,0.55)", boxShadow:"0 12px 48px rgba(160,105,30,0.15),0 2px 12px rgba(0,0,0,0.07)", maxHeight:"92vh" }}>

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-4 lg:hidden">
            <img src={logo} alt="Pawster" className="w-14 h-14 object-cover mb-1"/>
            <p className="text-[0.75rem] font-bold text-[#2a5010] text-center uppercase tracking-wide">Welcome to Pawster!</p>
          </div>

          <div className="text-center mb-[1.4rem]">
            <h2 className="font-black text-[#1a4a08] leading-[1.05] mb-[0.35rem]"
              style={{ fontSize:"clamp(1.7rem,2.2vw,2.4rem)" }}>Create Your Account</h2>
            <p className="text-[0.84rem] font-semibold text-[#5a7a40] leading-[1.5]">Join our community and start making a difference</p>
          </div>

          <Stepper current={step} />

          {alert.msg && (
            <div className={`rounded-[10px] px-[0.9rem] py-[0.7rem] text-[0.84rem] font-bold mb-[0.9rem] flex items-center gap-2
              ${alert.type==="success"
                ? "bg-[rgba(230,245,220,0.9)] text-[#276010] border border-[#90d060] border-l-4 border-l-[#5aaa30]"
                : "bg-[rgba(253,232,232,0.9)] text-[#b83030] border border-[#f0a0a0] border-l-4 border-l-[#d04040]"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {alert.msg}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step===1 && (
            <div className={stepClass}>
              <div className="flex gap-[0.9rem]">
                <Field label="First name" id="firstName" placeholder="First name…" value={form.firstName} onChange={set("firstName")} error={errors.firstName} className="flex-1"/>
                <Field label="Last name"  id="lastName"  placeholder="Last name…"  value={form.lastName}  onChange={set("lastName")}  error={errors.lastName}  className="flex-1"/>
              </div>
              <Field label="Email"        id="email"   type="email"    placeholder="your@email.com"               value={form.email}   onChange={set("email")}   error={errors.email}/>
              <Field label="Phone Number" id="phone"   type="tel"      placeholder="09171234567 or +639171234567" value={form.phone}   onChange={set("phone")}   error={errors.phone}/>
              <div className="flex gap-[0.9rem]">
                <Field label="Password"         id="password"        type="password" placeholder="Enter password"  value={form.password}        onChange={set("password")}        error={errors.password}        className="flex-1"/>
                <Field label="Confirm password" id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} className="flex-1"/>
              </div>
              <PasswordStrengthMeter password={form.password} />
              <button className="btn-primary block w-full py-[0.88rem] text-white border-none rounded-[12px] text-[1rem] font-black transition-all duration-[180ms] mt-[0.2rem]"
                onClick={()=>goTo(2)}
                style={{ background:"linear-gradient(135deg,#1c4f09,#2a6e10)", boxShadow:"0 4px 16px rgba(28,79,9,0.25)" }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step===2 && (
            <div className={stepClass}>
              <div className="mb-[0.95rem] flex flex-col">
                <label htmlFor="address" className={`text-[0.72rem] font-black uppercase tracking-[0.07em] italic mb-[0.38rem] ${errors.address?"text-[#c03030]":"text-[#276010]"}`}>
                  Home Address
                </label>
                <div className="flex gap-2 items-center">
                  <input id="address" type="text" placeholder="Street address" value={form.address} onChange={set("address")} className="field-input flex-1"
                    style={{ padding:"0.75rem 0.9rem", border:`2px solid ${errors.address?"#d04040":"#5aaa30"}`, borderLeft:errors.address?"4px solid #d04040":"2px solid #5aaa30", borderRadius:10, background:errors.address?"rgba(253,240,240,0.60)":"rgba(255,250,232,0.52)", fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem", fontWeight:600, color:"#222", outline:"none", transition:"border-color 0.18s,box-shadow 0.18s" }}
                  />
                  <button type="button" onClick={()=>setShowMap(true)} title="Pick location on map"
                    className="flex-shrink-0 w-11 h-11 border-none rounded-[10px] flex items-center justify-center transition-all duration-[150ms]"
                    style={{ background:"linear-gradient(135deg,#1c4f09,#2a6e10)", boxShadow:"0 3px 10px rgba(28,79,9,0.30)" }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(28,79,9,0.38)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 3px 10px rgba(28,79,9,0.30)";}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 13-8 13S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
                  </button>
                </div>
                {errors.address && (
                  <span className="flex items-center gap-[0.3rem] text-[0.72rem] font-bold text-[#c03030] mt-[0.28rem]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {errors.address}
                  </span>
                )}
              </div>

              <p className="text-[0.76rem] font-bold text-[#5a8a30] -mt-2 mb-[0.85rem] pl-[0.15rem] flex items-center gap-[0.35rem]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Helps us match you with nearby animals — use the pin button to auto-fill from the map
              </p>

              <div className="flex gap-[0.9rem]">
                <Field label="City / Municipality" id="city"     placeholder="e.g. Quezon City"  value={form.city}     onChange={set("city")}     error={errors.city}     className="flex-1"/>
                <Field label="Province / Region"   id="province" placeholder="e.g. Metro Manila" value={form.province} onChange={set("province")} error={errors.province} className="flex-1"/>
              </div>

              <ZipField city={form.city} value={form.zip} onChange={set("zip")} onSelect={handleZipSelect} error={errors.zip}/>

              <div className="flex gap-[0.9rem] mt-[0.4rem]">
                <button className="btn-outline flex-1 py-[0.88rem] bg-transparent text-[#1c4f09] text-[0.95rem] font-black rounded-[12px] transition-all duration-[150ms]"
                  style={{ border:"2px solid rgba(28,79,9,0.35)" }} onClick={()=>goTo(1)}>← Back</button>
                <button className="btn-primary flex-[2] py-[0.88rem] text-white border-none text-[1rem] font-black rounded-[12px] transition-all duration-[180ms]"
                  style={{ background:"linear-gradient(135deg,#1c4f09,#2a6e10)", boxShadow:"0 4px 16px rgba(28,79,9,0.25)" }} onClick={()=>goTo(3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step===3 && (
            <div className={stepClass}>
              <div className="mb-4">
                <label className="block text-[0.72rem] font-black uppercase tracking-[0.07em] text-[#276010] mb-[0.45rem] italic">
                  Government-Issued ID
                </label>
                <label className="upload-btn flex items-center justify-center gap-[0.7rem] px-[1.2rem] py-4 rounded-[12px] cursor-pointer transition-all duration-[180ms]"
                  style={{ background:idFile?"rgba(210,240,195,0.45)":"rgba(255,250,232,0.52)", border:idFile?"2px solid #5aaa30":"2.5px dashed #5aaa30" }}>
                  {idFile ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="text-[0.88rem] font-black text-[#2a7010]">{idFile.name}</span>
                      <span className="text-[0.74rem] font-bold text-[#5a9a40] ml-auto">✓ Ready</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a6741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      <div>
                        <div className="text-[0.88rem] font-black text-[#1c4f09]">Click to upload ID</div>
                        <div className="text-[0.72rem] font-bold text-[#7a9060]">PDF, JPG, or PNG · max 5MB</div>
                      </div>
                    </>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e=>{ const f=e.target.files?.[0]; if(f){setIdFile(f);setUploadLabel("Selected: "+f.name);}else{setIdFile(null);setUploadLabel("No file selected");} }}/>
                </label>
                {!idFile && uploadLabel.startsWith("⚠") && (
                  <p className="text-[0.74rem] font-bold text-[#c03030] mt-[0.3rem] flex items-center gap-[0.3rem]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Please upload a government-issued ID.
                  </p>
                )}
              </div>

              <div className="flex gap-[0.85rem] items-start rounded-[10px] px-4 py-[0.85rem] mb-4 border-l-4 border-[#e07820]"
                style={{ background:"rgba(255,245,225,0.80)" }}>
                <div className="w-8 h-8 min-w-[32px] bg-[#e07820] text-white text-[1rem] font-black rounded-lg flex items-center justify-center italic flex-shrink-0">!</div>
                <div>
                  <p className="text-[0.88rem] font-black text-[#1c4f09] mb-[0.25rem]">Why do we need this?</p>
                  <p className="text-[0.80rem] font-semibold text-[#4a5a40] leading-[1.55]">We verify all adopters to ensure the safety and well-being of our rescued animals. Your information is kept secure and confidential.</p>
                </div>
              </div>

              <div className="flex items-start gap-[0.55rem] rounded-[10px] px-[0.95rem] py-[0.8rem] mb-[1.1rem] border border-[rgba(90,170,48,0.28)]"
                style={{ background:"rgba(230,245,220,0.55)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5aaa30" strokeWidth="2.2" className="flex-shrink-0 mt-[1px]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p className="text-[0.79rem] font-bold text-[#3a6020] leading-[1.55]">
                  By clicking <strong>Submit</strong>, you'll be asked to review and accept our{" "}
                  <button onClick={()=>{ setPendingSubmit(false); setShowTerms(true); }}
                    className="bg-transparent border-none text-[#c87820] font-black text-[0.79rem] underline p-0 cursor-pointer">
                    Terms of Service &amp; Privacy Policy
                  </button>
                  {" "}before your account is created.
                  {termsAccepted && <span className="text-[#2a7010] font-black ml-[0.35rem]">✓ Accepted</span>}
                </p>
              </div>

              <div className="flex gap-[0.9rem]">
                <button className="btn-outline flex-1 py-[0.88rem] bg-transparent text-[#1c4f09] text-[0.95rem] font-black rounded-[12px] transition-all duration-[150ms]"
                  style={{ border:"2px solid rgba(28,79,9,0.35)" }} onClick={()=>goTo(2)}>← Back</button>
                <button className="btn-primary flex-[2] py-[0.88rem] text-white border-none text-[1rem] font-black rounded-[12px] transition-all duration-[180ms]"
                  disabled={loading}
                  style={{ background:"linear-gradient(135deg,#d06010,#e07820)", boxShadow:"0 4px 16px rgba(180,90,20,0.28)", opacity:loading?0.65:1 }}
                  onClick={handleSubmit}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin-anim"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Creating…
                    </span>
                  ) : "Submit →"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-[0.85rem] font-bold text-[#4a6030] mt-4">
            Already have an account?{" "}
            <button onClick={()=>navigate("/login")} className="bg-transparent border-none text-[#c87820] italic font-extrabold cursor-pointer text-[0.85rem]">Log in here!</button>
          </p>
        </div>
      </div>
    </>
  );
}