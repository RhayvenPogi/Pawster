import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";
import Dogs from "../images/Dogs.png";

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
    <div style={{ position:"fixed",inset:0,overflow:"hidden",zIndex:0 }}>
      <div style={{ position:"absolute",inset:0,background:"#EDDABB" }} />
      {orbs.map((o,i) => (
        <div key={i} ref={el=>orbRefs.current[i]=el}
          style={{ position:"absolute",borderRadius:"50%",width:o.w,height:o.h,top:o.top,left:o.left,right:o.right,bottom:o.bottom,background:o.bg,animation:o.anim }}>
          <div style={{ width:"100%",height:"100%",borderRadius:"50%",filter:"blur(110px)",mixBlendMode:"multiply",opacity:0.7 }} />
        </div>
      ))}
      <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(100,70,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.04) 1px,transparent 1px)",backgroundSize:"60px 60px" }} />
      <div style={{ position:"absolute",inset:"-50%",width:"200%",height:"200%",opacity:0.06,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:"256px 256px",animation:"grain 0.4s steps(1) infinite" }} />
      <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.2) 100%)" }} />
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

function DogCursor() {
  const cursorRef = useRef(null);
  const s = useRef({ mouseX:0,mouseY:0,dogX:0,dogY:0,isClicking:false });
  useEffect(() => {
    s.current.dogX = window.innerWidth/2; s.current.dogY = window.innerHeight/2;
    const onMove = (e) => { s.current.mouseX=e.clientX; s.current.mouseY=e.clientY; };
    const onDown = () => {
      s.current.isClicking=true;
      if (cursorRef.current) cursorRef.current.className="dog-cursor clicking";
      setTimeout(()=>{ s.current.isClicking=false; },300);
    };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mousedown",onDown);
    let raf;
    const loop = () => {
      const el=cursorRef.current; if (!el){ raf=requestAnimationFrame(loop); return; }
      if (!s.current.isClicking) {
        const dx=s.current.mouseX-s.current.dogX, dy=s.current.mouseY-s.current.dogY;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>5) {
          s.current.dogX+=(dx/dist)*Math.min(dist*0.13,18);
          s.current.dogY+=(dy/dist)*Math.min(dist*0.13,18);
          const svg=document.getElementById("dog-svg-r");
          if (svg) svg.style.transform=dx>0?"scaleX(1)":"scaleX(-1)";
          el.className="dog-cursor "+(dist>7?"walking":"idle");
        } else { el.className="dog-cursor idle"; }
      }
      el.style.left=s.current.dogX+"px"; el.style.top=s.current.dogY+"px";
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return () => { document.removeEventListener("mousemove",onMove); document.removeEventListener("mousedown",onDown); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={cursorRef} className="dog-cursor idle"
      style={{ position:"fixed",zIndex:99999,pointerEvents:"none",width:28,height:28,transform:"translate(-50%,-50%)" }}>
      <svg id="dog-svg-r" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
        <ellipse cx="27" cy="50" rx="14" ry="3" fill="rgba(0,0,0,0.13)" />
        <g id="dog-tail"><path d="M10 22 Q2 14 6 8 Q10 4 12 10 Q10 16 14 20Z" fill="#c8a06a" stroke="#7a5530" strokeWidth="1.2" strokeLinejoin="round"/></g>
        <g id="dog-body">
          <g id="dog-leg-back"><rect x="11" y="30" width="6" height="14" rx="3" fill="#b8904a" stroke="#7a5530" strokeWidth="1"/><ellipse cx="14" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" strokeWidth="1"/></g>
          <rect x="10" y="16" width="28" height="18" rx="9" fill="#d4a96a" stroke="#7a5530" strokeWidth="1.5"/>
          <g id="dog-leg-front"><rect x="27" y="30" width="6" height="14" rx="3" fill="#c8a06a" stroke="#7a5530" strokeWidth="1"/><ellipse cx="30" cy="44" rx="5" ry="3" fill="#a07838" stroke="#7a5530" strokeWidth="1"/></g>
          <ellipse cx="38" cy="10" rx="10" ry="9" fill="#d4a96a" stroke="#7a5530" strokeWidth="1.5"/>
          <circle cx="42" cy="8" r="2.2" fill="#2a1a08"/>
          <g id="dog-ear"><path d="M36 4 Q40 0 44 3 Q42 8 38 9Z" fill="#b87840" stroke="#7a5530" strokeWidth="1" strokeLinejoin="round"/></g>
        </g>
      </svg>
    </div>
  );
}

function TermsModal({ onAccept, onDecline, onClose }) {
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:"fixed",inset:0,zIndex:10000,background:"rgba(20,35,15,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",animation:"modalFadeIn .22s ease" }}>
      <div style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(60,100,30,0.18)",animation:"modalSlideUp .26s cubic-bezier(.34,1.3,.64,1)",overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"0.9rem",padding:"1.4rem 1.6rem 1.2rem",borderBottom:"1.5px solid #e8f0e2",background:"linear-gradient(135deg,#f4faf0,#edf7e5)",flexShrink:0 }}>
          <div style={{ width:48,height:48,background:"#fff",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(90,138,48,0.15)",flexShrink:0 }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="#5a8a30">
              <ellipse cx="50" cy="66" rx="24" ry="21"/>
              <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)"/>
              <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)"/>
              <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)"/>
              <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily:"'Nunito',sans-serif",fontSize:"1.05rem",fontWeight:800,color:"#2a4a18",margin:"0 0 0.15rem" }}>Terms of Service &amp; Privacy Policy</h2>
            <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.78rem",color:"#7aaa50",margin:0,fontWeight:600 }}>Pawster — Last updated March 2026</p>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto",background:"none",border:"none",fontSize:"1.6rem",color:"#6a8a58",padding:"0.2rem 0.4rem",borderRadius:8 }}>&times;</button>
        </div>
        <div style={{ overflowY:"auto",padding:"1.4rem 1.6rem",flex:1 }}>
          {[
            ["1. Acceptance of Terms","By creating an account on Pawster, you agree to these Terms and our Privacy Policy."],
            ["2. Purpose","Pawster connects adopters with rescue organizations. We are not responsible for individual shelter or adopter actions."],
            ["3. Eligibility","You must be at least 18 years of age to register."],
            ["4. Identity Verification","Your government-issued ID is stored securely and only accessible to authorized Pawster staff."],
            ["5. User Responsibilities","You agree to provide accurate information and are responsible for your account security."],
            ["6. Privacy & Data Use","We do not sell your data. We collect name, email, phone for account management; address to match you with nearby animals; and government ID for identity verification only."],
            ["7. Prohibited Conduct","You may not use Pawster for unlawful purposes, to harm animals or users, or to submit false information."],
            ["8. Termination","We may suspend accounts that violate these Terms or pose a risk to animal welfare."],
            ["9. Limitation of Liability","Pawster is provided \"as is.\" We are not liable for damages from platform use."],
            ["10. Contact","Questions? Email support@pawster.com"],
          ].map(([title, text]) => (
            <div key={title} style={{ marginBottom:"1.3rem" }}>
              <h3 style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.88rem",fontWeight:800,color:"#3a6a20",margin:"0 0 0.45rem",textTransform:"uppercase",letterSpacing:"0.04em" }}>{title}</h3>
              <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.88rem",color:"#4a5a42",lineHeight:1.65 }}>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:"0.75rem",padding:"1.1rem 1.6rem 1.3rem",borderTop:"1.5px solid #e8f0e2",background:"#fafdf8",flexShrink:0 }}>
          <button onClick={onDecline} style={{ flex:1,padding:"0.7rem 1rem",border:"2px solid #c8ddb8",background:"#fff",color:"#5a7a48",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:700,borderRadius:10 }}>Decline</button>
          <button onClick={onAccept}  style={{ flex:2,padding:"0.7rem 1rem",border:"none",background:"linear-gradient(135deg,#6aaa38,#4a8a20)",color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:"0.9rem",fontWeight:800,borderRadius:10,boxShadow:"0 4px 14px rgba(90,138,48,0.3)" }}>I Accept &amp; Create Account</button>
        </div>
      </div>
    </div>
  );
}

// ── Improved Field — label above, show/hide for passwords, accent error border ─
function Field({ label, id, type="text", placeholder, value, onChange, error, style }) {
  return (
    <div style={{ marginBottom:"0.95rem", display:"flex", flexDirection:"column", ...style }}>
      <label htmlFor={id} style={{
        fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase",
        letterSpacing:"0.07em", color: error ? "#c03030" : "#276010",
        marginBottom:"0.38rem", fontStyle:"italic",
      }}>
        {label}
      </label>
      <div style={{ position:"relative" }}>
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={onChange} className="field-input"
          style={{
            display:"block", width:"100%",
            padding:"0.75rem 0.9rem",
            border:`2px solid ${error ? "#d04040" : "#5aaa30"}`,
            borderLeft: error ? "4px solid #d04040" : "2px solid #5aaa30",
            borderRadius:10,
            background: error ? "rgba(253,240,240,0.60)" : "rgba(255,250,232,0.52)",
            fontFamily:"'Nunito',sans-serif", fontSize:"0.9rem",
            fontWeight:600, color:"#222", outline:"none",
            transition:"border-color 0.18s,box-shadow 0.18s,background 0.18s",
          }}
        />
      </div>
      {error && (
        <span style={{ display:"flex",alignItems:"center",gap:"0.3rem",fontSize:"0.72rem",fontWeight:700,color:"#c03030",marginTop:"0.28rem" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Slimmer Stepper ────────────────────────────────────────────────────────────
function Stepper({ current }) {
  const steps = ["Personal Info","Location","Verification"];
  return (
    <div style={{ display:"flex",alignItems:"center",marginBottom:"1.5rem" }}>
      {steps.map((label,i) => {
        const n = i+1, done = n < current, active = n === current;
        return (
          <div key={n} style={{ display:"contents" }}>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"0.3rem",minWidth:0 }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                border:`2.5px solid ${done||active?"#1c4f09":"rgba(180,150,80,0.35)"}`,
                background: done ? "#1c4f09" : active ? "rgba(28,79,9,0.10)" : "rgba(255,248,225,0.60)",
                color: done ? "#fff" : active ? "#1c4f09" : "#a09060",
                fontSize: done ? 0 : "0.88rem", fontWeight:900,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.3s",
                boxShadow: active ? "0 0 0 4px rgba(28,79,9,0.12)" : "none",
              }}>
                {done
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : n}
              </div>
              <span style={{ fontSize:"0.67rem",fontWeight:800,color:active?"#1c4f09":done?"#4a7a28":"#a09060",textAlign:"center",whiteSpace:"nowrap",letterSpacing:"0.02em" }}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div style={{ flex:1,height:2,margin:"0 6px",marginBottom:18,background:done?"#1c4f09":"rgba(180,150,80,0.28)",borderRadius:2,transition:"background 0.3s",minWidth:20 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const { register }              = useAuth();
  const [step, setStep]           = useState(1);
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

  const set = (k) => (e) => {
    setForm(f=>({...f,[k]:e.target.value}));
    setErrors(v=>({...v,[k]:""}));
    setAlert({type:"",msg:""});
  };

  function validateStep1() {
    const e = {};
    if (!form.firstName.trim())                      e.firstName       = "First name is required.";
    if (!form.lastName.trim())                       e.lastName        = "Last name is required.";
    if (!form.email.trim())                          e.email           = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))      e.email           = "Enter a valid email address.";
    if (!form.phone.trim())                          e.phone           = "Phone number is required.";
    if (!form.password)                              e.password        = "Password is required.";
    else if (form.password.length < 8)               e.password        = "Password must be at least 8 characters.";
    if (!form.confirmPassword)                       e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (!form.address.trim())  e.address  = "Street address is required.";
    if (!form.city.trim())     e.city     = "City is required.";
    if (!form.province.trim()) e.province = "Province is required.";
    if (!form.zip.trim())      e.zip      = "Zip / Postal code is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goTo(next) {
    setAlert({type:"",msg:""});
    if (next > step) {
      if (step===1 && !validateStep1()) return;
      if (step===2 && !validateStep2()) return;
    }
    setStep(next);
  }

  async function doRegister() {
    setLoading(true);
    const fd = new FormData();
    fd.append("firstName", form.firstName.trim());
    fd.append("lastName",  form.lastName.trim());
    fd.append("email",     form.email.trim());
    fd.append("phone",     form.phone.trim());
    fd.append("password",  form.password);
    fd.append("address",   form.address.trim());
    fd.append("city",      form.city.trim());
    fd.append("province",  form.province.trim());
    fd.append("zip",       form.zip.trim());
    fd.append("idFile",    idFile);
    try {
      await register(fd);
    } catch (err) {
      const msg = err.response?.data?.message || "An error occurred during registration.";
      setAlert({ type:"error", msg });
      setLoading(false);
    }
  }

  function handleSubmit() {
    setAlert({ type:"", msg:"" });
    if (!idFile) {
      setUploadLabel("⚠ Please upload a government-issued ID.");
      return;
    }
    setPendingSubmit(true);
    setShowTerms(true);
  }

  async function handleTermsAccept() {
    setTermsAccepted(true);
    setShowTerms(false);
    setPendingSubmit(false);
    await doRegister();
  }

  function handleTermsDecline() {
    setTermsAccepted(false);
    setPendingSubmit(false);
    setShowTerms(false);
  }

  const pawData = [
    { top:"18%",left:"2%",  width:120,fill:"rgba(72,95,42,0.28)",  rotate:-8  },
    { top:"48%",left:"5%",  width:85, fill:"rgba(72,95,42,0.22)",  rotate:6   },
    { bottom:"-2%",left:"-2%",width:210,fill:"rgba(195,130,70,0.18)",rotate:-18 },
    { top:"41%",left:"52%", width:55, fill:"rgba(195,135,75,0.55)", rotate:-14 },
    { bottom:"18%",left:"46%",width:160,fill:"rgba(198,138,80,0.62)",rotate:13 },
    { top:"24%",left:"38%", width:60, fill:"rgba(72,95,42,0.17)",  rotate:-5  },
  ];

  const btnBase = { fontFamily:"'Nunito',sans-serif",fontWeight:900,fontSize:"1rem",border:"none",borderRadius:12,padding:"0.88rem",cursor:"pointer",transition:"background 0.18s,transform 0.15s,box-shadow 0.15s" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0;padding:0;box-sizing:border-box;cursor:none!important; }
        html,body{height:100%;font-family:'Nunito',sans-serif;overflow:hidden;background:#EDDABB;}
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12%,16%) scale(1.15)}66%{transform:translate(-8%,8%) scale(0.9)}}
        @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-14%,10%) scale(0.9)}66%{transform:translate(8%,-15%) scale(1.15)}}
        @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(14%,-10%) scale(1.12)}75%{transform:translate(-10%,8%) scale(0.9)}}
        @keyframes float4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-15%,-12%) scale(1.18)}}
        @keyframes float5{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-10%,-18%) scale(1.1)}80%{transform:translate(8%,-8%) scale(0.9)}}
        @keyframes float6{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(15%,12%) scale(1.15)}70%{transform:translate(-8%,18%) scale(0.88)}}
        @keyframes grain{0%,100%{transform:translate(0,0)}50%{transform:translate(-2%,2%)}}
        @keyframes legFrontWalk{0%,100%{transform-origin:30px 28px;transform:rotate(-22deg)}50%{transform-origin:30px 28px;transform:rotate(22deg)}}
        @keyframes legBackWalk{0%,100%{transform-origin:14px 28px;transform:rotate(22deg)}50%{transform-origin:14px 28px;transform:rotate(-22deg)}}
        @keyframes tailWag{0%,100%{transform-origin:8px 18px;transform:rotate(-18deg)}50%{transform-origin:8px 18px;transform:rotate(18deg)}}
        @keyframes bodyBob{0%,100%{transform:translateY(0px)}50%{transform:translateY(-1.5px)}}
        @keyframes earFlop{0%,100%{transform-origin:36px 10px;transform:rotate(0deg)}50%{transform-origin:36px 10px;transform:rotate(8deg)}}
        @keyframes sitSettle{0%{transform:translateY(0px)}40%{transform:translateY(-3px)}100%{transform:translateY(0px)}}
        @keyframes pawTap{0%,100%{transform-origin:30px 28px;transform:rotate(0deg)}50%{transform-origin:30px 28px;transform:rotate(-30deg)}}
        @keyframes modalFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes modalSlideUp{from{transform:translateY(28px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes stepFadeIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        .dog-cursor.walking #dog-body{animation:bodyBob .28s ease-in-out infinite}
        .dog-cursor.walking #dog-leg-front{animation:legFrontWalk .28s ease-in-out infinite}
        .dog-cursor.walking #dog-leg-back{animation:legBackWalk .28s ease-in-out infinite}
        .dog-cursor.walking #dog-tail{animation:tailWag .28s ease-in-out infinite}
        .dog-cursor.walking #dog-ear{animation:earFlop .32s ease-in-out infinite}
        .dog-cursor.idle #dog-tail{animation:tailWag .6s ease-in-out infinite}
        .dog-cursor.clicking #dog-body{animation:sitSettle .2s ease-out forwards}
        .dog-cursor.clicking #dog-leg-front{animation:pawTap .18s ease-in-out 2}
        .field-input:focus{border-color:#1c4f09!important;border-left-color:#1c4f09!important;background:rgba(255,252,238,0.78)!important;box-shadow:0 0 0 3px rgba(28,79,9,0.09)!important}
        .field-input::placeholder{color:#b0a07a;font-style:italic;font-weight:600;}
        .upload-btn:hover{background:rgba(236,221,184,0.8)!important;border-style:solid!important;}
        .btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#143806,#1e5c0a)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(28,79,9,0.32)!important}
        .btn-primary:active:not(:disabled){transform:translateY(0)!important}
        .btn-outline:hover{background:rgba(28,79,9,0.06)!important;transform:translateY(-1px);}
        .step-content{animation:stepFadeIn 0.22s ease both}
      `}</style>

      <MeshBackground />
      <DogCursor />

      {showTerms && (
        <TermsModal onAccept={handleTermsAccept} onDecline={handleTermsDecline} onClose={handleTermsDecline} />
      )}

      <nav style={{ position:"fixed",top:0,right:0,zIndex:300,display:"flex",alignItems:"center",gap:"0.9rem",padding:"0.85rem 1.6rem" }}>
        <button onClick={()=>window.location.href="/login"}
          style={{ background:"#1c4f09",color:"#fff",border:"none",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:"0.95rem",fontWeight:800,padding:"0.45rem 1.5rem" }}>
          Sign in
        </button>
        <span style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.95rem",fontWeight:800,color:"#1c4f09",borderBottom:"2.5px solid #1c4f09",padding:"0.15rem 0.3rem 0.2rem" }}>
          Register
        </span>
        <a href="/"><img src={logo} alt="Pawster Logo" style={{ width:64,height:64,objectFit:"cover" }}/></a>
      </nav>

      <div style={{ position:"relative",zIndex:10,display:"flex",alignItems:"center",height:"100vh",width:"100vw",maxWidth:1920,maxHeight:1200,margin:"0 auto",padding:"0 6vw",gap:"2vw" }}>

        {/* Left Panel */}
        <div style={{ flex:1,position:"relative",height:"100vh",maxHeight:1200,overflow:"visible" }}>
          <div style={{ position:"absolute",inset:0,zIndex:5,pointerEvents:"none" }}>
            {pawData.map((p,i)=>(
              <PawSVG key={i} style={{ position:"absolute",top:p.top,left:p.left,bottom:p.bottom,width:p.width,height:p.width,fill:p.fill,transform:`rotate(${p.rotate}deg)` }}/>
            ))}
          </div>
          <img src={Dogs} alt="Pawster Dog Mascot"
            style={{ position:"absolute",bottom:0,left:"-1%",zIndex:10,height:"82vh",maxHeight:760,width:"auto",objectFit:"contain",filter:"drop-shadow(0 10px 28px rgba(0,0,0,0.16))" }}/>
          <div style={{ position:"absolute",top:"4%",left:"15%",zIndex:20,textAlign:"center",maxWidth:560 }}>
            <h1 style={{ fontSize:"clamp(3rem,3.8vw,4.8rem)",fontWeight:900,color:"#1a4a08",lineHeight:0.95,textTransform:"uppercase",letterSpacing:-1,textShadow:"0 2px 14px rgba(255,255,255,0.22)" }}>
              Welcome to<br/>Pawster!
            </h1>
            <p style={{ marginTop:"1rem",fontSize:"clamp(0.88rem,1vw,1.05rem)",fontWeight:700,color:"#2a5010",lineHeight:1.62,maxWidth:420,marginLeft:"auto",marginRight:"auto",textShadow:"0 1px 6px rgba(255,255,255,0.32)" }}>
              Join our community and start making a difference in rescued animals' lives.
            </p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div style={{
          width:500, minWidth:460, flexShrink:0, alignSelf:"center",
          marginRight:"3vw", marginTop:"3vh",
          display:"flex", flexDirection:"column", justifyContent:"center",
          padding:"2rem 2.4rem",
          background:"rgba(255,248,225,0.42)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          border:"1.5px solid rgba(255,238,190,0.55)",
          borderRadius:28,
          boxShadow:"0 12px 48px rgba(160,105,30,0.15),0 2px 12px rgba(0,0,0,0.07)",
          overflowY:"auto", maxHeight:"92vh",
          animation:"cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
        }}>

          {/* Header */}
          <div style={{ textAlign:"center",marginBottom:"1.4rem" }}>
            <h2 style={{ fontSize:"clamp(1.7rem,2.2vw,2.4rem)",fontWeight:900,color:"#1a4a08",lineHeight:1.05,marginBottom:"0.35rem" }}>
              Create Your Account
            </h2>
            <p style={{ fontSize:"0.84rem",fontWeight:600,color:"#5a7a40",lineHeight:1.5 }}>
              Join our community and start making a difference
            </p>
          </div>

          <Stepper current={step} />

          {alert.msg && (
            <div style={{
              borderRadius:10, padding:"0.7rem 0.9rem",
              fontSize:"0.84rem", fontWeight:700, marginBottom:"0.9rem",
              display:"flex", alignItems:"center", gap:"0.5rem",
              background:alert.type==="success"?"rgba(230,245,220,0.9)":"rgba(253,232,232,0.9)",
              color:alert.type==="success"?"#276010":"#b83030",
              border:alert.type==="success"?"1px solid #90d060":"1px solid #f0a0a0",
              borderLeft:alert.type==="success"?"4px solid #5aaa30":"4px solid #d04040",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {alert.msg}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step===1 && (
            <div className="step-content">
              <div style={{ display:"flex",gap:"0.9rem" }}>
                <Field label="First name" id="firstName" placeholder="First name…" value={form.firstName} onChange={set("firstName")} error={errors.firstName} style={{ flex:1 }}/>
                <Field label="Last name"  id="lastName"  placeholder="Last name…"  value={form.lastName}  onChange={set("lastName")}  error={errors.lastName}  style={{ flex:1 }}/>
              </div>
              <Field label="Email"        id="email"    type="email"    placeholder="your@email.com"    value={form.email}    onChange={set("email")}    error={errors.email}/>
              <Field label="Phone Number" id="phone"    type="tel"      placeholder="+1 (555) 000-0000" value={form.phone}    onChange={set("phone")}    error={errors.phone}/>
              <div style={{ display:"flex",gap:"0.9rem" }}>
                <Field label="Password"         id="password"        type="password" placeholder="Min. 8 characters"   value={form.password}        onChange={set("password")}        error={errors.password}        style={{ flex:1 }}/>
                <Field label="Confirm password" id="confirmPassword" type="password" placeholder="Repeat password"     value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} style={{ flex:1 }}/>
              </div>
              <button className="btn-primary" onClick={()=>goTo(2)}
                style={{ ...btnBase,display:"block",width:"100%",background:"linear-gradient(135deg,#1c4f09,#2a6e10)",color:"#fff",boxShadow:"0 4px 16px rgba(28,79,9,0.25)",marginTop:"0.4rem" }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step===2 && (
            <div className="step-content">
              <Field label="Home Address" id="address" placeholder="Street address" value={form.address} onChange={set("address")} error={errors.address}/>
              <p style={{ fontSize:"0.76rem",fontWeight:700,color:"#5a8a30",marginTop:"-0.5rem",marginBottom:"0.85rem",paddingLeft:"0.15rem",display:"flex",alignItems:"center",gap:"0.35rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                This helps us match you with animals in your area
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

          {/* ── Step 3 ── */}
          {step===3 && (
            <div className="step-content">
              {/* Upload zone */}
              <div style={{ marginBottom:"1rem" }}>
                <label style={{ display:"block",fontSize:"0.72rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#276010",marginBottom:"0.45rem",fontStyle:"italic" }}>
                  Government-Issued ID
                </label>
                <label className="upload-btn" style={{
                  display:"flex", alignItems:"center", justifyContent:"center",
                  gap:"0.7rem", padding:"1rem 1.2rem",
                  background: idFile ? "rgba(210,240,195,0.45)" : "rgba(255,250,232,0.52)",
                  border: idFile ? "2px solid #5aaa30" : "2.5px dashed #5aaa30",
                  borderRadius:12, cursor:"pointer",
                  transition:"background 0.18s,border 0.18s",
                }}>
                  {idFile ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a7010" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize:"0.88rem",fontWeight:800,color:"#2a7010" }}>{idFile.name}</span>
                      <span style={{ fontSize:"0.74rem",fontWeight:700,color:"#5a9a40",marginLeft:"auto" }}>✓ Ready</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a6741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                      <div>
                        <div style={{ fontSize:"0.88rem",fontWeight:800,color:"#1c4f09" }}>Click to upload ID</div>
                        <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#7a9060" }}>PDF, JPG, or PNG · max 5MB</div>
                      </div>
                    </>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setIdFile(f); setUploadLabel("Selected: "+f.name); }
                      else   { setIdFile(null); setUploadLabel("No file selected"); }
                    }}/>
                </label>
                {!idFile && uploadLabel.startsWith("⚠") && (
                  <p style={{ fontSize:"0.74rem",fontWeight:700,color:"#c03030",marginTop:"0.3rem",display:"flex",alignItems:"center",gap:"0.3rem" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Please upload a government-issued ID.
                  </p>
                )}
              </div>

              {/* Why we need ID */}
              <div style={{ display:"flex",gap:"0.85rem",alignItems:"flex-start",background:"rgba(255,245,225,0.80)",borderLeft:"4px solid #e07820",borderRadius:10,padding:"0.85rem 1rem",marginBottom:"1rem" }}>
                <div style={{ width:32,height:32,minWidth:32,background:"#e07820",color:"#fff",fontSize:"1rem",fontWeight:900,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontStyle:"italic",flexShrink:0 }}>!</div>
                <div>
                  <p style={{ fontSize:"0.88rem",fontWeight:900,color:"#1c4f09",marginBottom:"0.25rem" }}>Why do we need this?</p>
                  <p style={{ fontSize:"0.80rem",fontWeight:600,color:"#4a5a40",lineHeight:1.55,margin:0 }}>We verify all adopters to ensure the safety and well-being of our rescued animals. Your information is kept secure and confidential.</p>
                </div>
              </div>

              {/* Terms notice */}
              <div style={{ display:"flex",alignItems:"flex-start",gap:"0.55rem",background:"rgba(230,245,220,0.55)",border:"1.5px solid rgba(90,170,48,0.28)",borderRadius:10,padding:"0.8rem 0.95rem",marginBottom:"1.1rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5aaa30" strokeWidth="2.2" style={{ flexShrink:0,marginTop:1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <p style={{ fontSize:"0.79rem",fontWeight:700,color:"#3a6020",lineHeight:1.55,margin:0 }}>
                  By clicking <strong>Submit</strong>, you'll be asked to review and accept our{" "}
                  <button onClick={()=>{ setPendingSubmit(false); setShowTerms(true); }}
                    style={{ background:"none",border:"none",color:"#c87820",fontWeight:800,fontSize:"0.79rem",fontFamily:"'Nunito',sans-serif",textDecoration:"underline",padding:0 }}>
                    Terms of Service &amp; Privacy Policy
                  </button>
                  {" "}before your account is created.
                  {termsAccepted && <span style={{ color:"#2a7010",fontWeight:800,marginLeft:"0.35rem" }}>✓ Accepted</span>}
                </p>
              </div>

              <div style={{ display:"flex",gap:"0.9rem" }}>
                <button className="btn-outline" onClick={()=>goTo(2)} style={{ ...btnBase,flex:1,background:"transparent",color:"#1c4f09",border:"2px solid rgba(28,79,9,0.35)",fontWeight:800,fontSize:"0.95rem" }}>← Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}
                  style={{ ...btnBase,flex:2,background:"linear-gradient(135deg,#d06010,#e07820)",color:"#fff",boxShadow:"0 4px 16px rgba(180,90,20,0.28)",opacity:loading?0.65:1 }}>
                  {loading ? (
                    <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      Creating…
                    </span>
                  ) : "Submit →"}
                </button>
              </div>
            </div>
          )}

          <p style={{ textAlign:"center",fontSize:"0.85rem",fontWeight:700,color:"#4a6030",marginTop:"1rem" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color:"#c87820",fontStyle:"italic",fontWeight:800,textDecoration:"none" }}>Log in here!</a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}