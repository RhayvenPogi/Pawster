import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import logo from "../images/logo.png";
import dog from "../images/dog.png";

function MeshBackground() {
  const orbRefs = useRef([]);
  const mouse = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });
  const factors = [
    { fx: 0.10, fy: 0.07 }, { fx: -0.12, fy: 0.09 },
    { fx: 0.14, fy: -0.08 }, { fx: -0.08, fy: -0.11 },
    { fx: 0.09, fy: 0.13 }, { fx: -0.13, fy: 0.07 },
  ];
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.mx = (e.clientX / window.innerWidth - 0.5) * 80;
      mouse.current.my = (e.clientY / window.innerHeight - 0.5) * 80;
    };
    window.addEventListener("mousemove", onMove);
    let raf;
    const animate = () => {
      const m = mouse.current;
      m.cx += (m.mx - m.cx) * 0.08;
      m.cy += (m.my - m.cy) * 0.08;
      orbRefs.current.forEach((el, i) => {
        if (el) {
          el.style.marginLeft = m.cx * factors[i].fx + "px";
          el.style.marginTop  = m.cy * factors[i].fy + "px";
        }
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const orbStyles = [
    { width:1100,height:1100,top:"-25%",left:"-20%",  background:"radial-gradient(circle,#588B41 0%,transparent 70%)",animation:"float1 8s ease-in-out infinite" },
    { width:1000,height:1000,top:"10%", right:"-20%", background:"radial-gradient(circle,#B45A22 0%,transparent 70%)",animation:"float2 10s ease-in-out infinite" },
    { width:950, height:950, bottom:"-20%",left:"10%",background:"radial-gradient(circle,#e8e0d0 0%,transparent 60%)",animation:"float3 7s ease-in-out infinite" },
    { width:900, height:900, top:"30%", left:"25%",   background:"radial-gradient(circle,#588B41 0%,transparent 70%)",animation:"float4 9s ease-in-out infinite" },
    { width:850, height:850, bottom:"0%",right:"-5%", background:"radial-gradient(circle,#B45A22 0%,transparent 70%)",animation:"float5 11s ease-in-out infinite" },
    { width:800, height:800, top:"5%",  left:"35%",   background:"radial-gradient(circle,#d4c9b0 0%,transparent 70%)",animation:"float6 8.5s ease-in-out infinite" },
  ];

  return (
    <div style={{ position:"fixed",inset:0,overflow:"hidden",zIndex:0 }}>
      <div style={{ position:"absolute",inset:0,background:"#EDDABB" }} />
      {orbStyles.map((s, i) => (
        <div key={i} ref={el => orbRefs.current[i] = el}
          style={{ position:"absolute",borderRadius:"50%",...s }}>
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
  const state = useRef({ mouseX:0,mouseY:0,dogX:0,dogY:0,isClicking:false });
  useEffect(() => {
    const s = state.current;
    s.dogX = window.innerWidth / 2;
    s.dogY = window.innerHeight / 2;
    const onMove = (e) => { s.mouseX = e.clientX; s.mouseY = e.clientY; };
    const onDown = () => {
      s.isClicking = true;
      if (cursorRef.current) cursorRef.current.className = "dog-cursor clicking";
      setTimeout(() => { s.isClicking = false; }, 300);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    let raf;
    const loop = () => {
      const el = cursorRef.current;
      if (!el) { raf = requestAnimationFrame(loop); return; }
      if (!s.isClicking) {
        const dx = s.mouseX - s.dogX, dy = s.mouseY - s.dogY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
          s.dogX += (dx/dist) * Math.min(dist*0.13, 18);
          s.dogY += (dy/dist) * Math.min(dist*0.13, 18);
          const svg = document.getElementById("dog-svg");
          if (svg) svg.style.transform = dx > 0 ? "scaleX(1)" : "scaleX(-1)";
          el.className = "dog-cursor " + (dist > 7 ? "walking" : "idle");
        } else { el.className = "dog-cursor idle"; }
      }
      el.style.left = s.dogX + "px";
      el.style.top  = s.dogY + "px";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cursorRef} className="dog-cursor idle"
      style={{ position:"fixed",zIndex:99999,pointerEvents:"none",width:28,height:28,transform:"translate(-50%,-50%)" }}>
      <svg id="dog-svg" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg" style={{ overflow:"visible" }}>
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

function Field({ label, id, type="text", placeholder, value, onChange, error }) {
  return (
    <div style={{ marginBottom:"1.1rem" }}>
      <label htmlFor={id} style={{
        display:"block", fontSize:"0.72rem", fontWeight:900,
        textTransform:"uppercase", letterSpacing:"0.07em",
        color: error ? "#c03030" : "#276010", marginBottom:"0.4rem",
        fontStyle:"italic",
      }}>
        {label}
      </label>
      <div style={{ position:"relative" }}>
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={onChange} className="field-input"
          style={{
            display:"block", width:"100%",
            padding:"0.78rem 0.95rem",
            border:`2px solid ${error ? "#d04040" : "#5aaa30"}`,
            borderLeft: error ? "4px solid #d04040" : "2px solid #5aaa30",
            borderRadius:10,
            background: error ? "rgba(253,240,240,0.60)" : "rgba(255,250,232,0.52)",
            fontFamily:"'Nunito',sans-serif", fontSize:"0.93rem",
            fontWeight:600, color:"#222", outline:"none",
            transition:"border-color 0.18s,box-shadow 0.18s,background 0.18s",
          }}
        />
      </div>
      {error && (
        <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.74rem", fontWeight:700, color:"#c03030", marginTop:"0.3rem" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// Hidden GoogleLogin trigger — renders the real GoogleLogin off-screen,
// exposes a ref so our custom icon button can click it programmatically.
function HiddenGoogleLogin({ onSuccess, onError }) {
  return (
    <div style={{
      position: "absolute",
      opacity: 0,
      pointerEvents: "none",
      width: 0,
      height: 0,
      overflow: "hidden",
    }}>
      <div id="google-login-hidden">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, googleLogin }  = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors]     = useState({});
  const [alert, setAlert]       = useState({ type: "", msg: "" });
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pawster_email");
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  function validate() {
    const e = {};
    if (!email.trim())                     e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Enter a valid email.";
    if (!password)                         e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setAlert({ type: "", msg: "" });
    try {
      await login(email.trim(), password);
      if (remember) localStorage.setItem("pawster_email", email.trim());
      else          localStorage.removeItem("pawster_email");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password.";
      setAlert({ type: "error", msg });
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    setAlert({ type: "", msg: "" });
    try {
      await googleLogin(credentialResponse);
    } catch (err) {
      const msg = err.response?.data?.message || "Google sign-in failed. Please try again.";
      setAlert({ type: "error", msg });
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setAlert({ type: "error", msg: "Google sign-in was cancelled or failed." });
  }

  // Click the hidden GoogleLogin button rendered by @react-oauth/google
  function triggerGoogleLogin() {
    const btn = document.querySelector("#google-login-hidden [role='button'], #google-login-hidden div[tabindex]");
    if (btn) btn.click();
  }

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
        @keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
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
        .signin-btn:hover:not(:disabled){background:#143806!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(28,79,9,0.35)!important}
        .signin-btn:active:not(:disabled){transform:translateY(0)!important;}
        .nav-register:hover{background:#143806!important;}
        .forgot-btn:hover{text-decoration:underline;color:#a06010!important;}
        .footer-link:hover{text-decoration:underline;}
        .social-btn{transition:all 0.18s!important;}
        .social-btn:hover{border-color:#a09060!important;transform:translateY(-2px)!important;box-shadow:0 6px 16px rgba(0,0,0,0.12)!important;background:rgba(255,255,255,0.92)!important}
        .remember-check:focus-within{outline:2px solid #1c4f09;outline-offset:3px;border-radius:4px;}
      `}</style>

      <MeshBackground />
      <DogCursor />

      {/* Hidden GoogleLogin — provides real OAuth flow, triggered programmatically */}
      <HiddenGoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

      {/* Nav */}
      <nav style={{ position:"fixed",top:0,right:0,zIndex:300,display:"flex",alignItems:"center",gap:"0.9rem",padding:"0.85rem 1.6rem" }}>
        <span style={{ fontFamily:"'Nunito',sans-serif",fontSize:"0.95rem",fontWeight:800,color:"#1c4f09",borderBottom:"2.5px solid #1c4f09",padding:"0.15rem 0.3rem 0.2rem" }}>
          Sign in
        </span>
        <button className="nav-register" onClick={() => window.location.href = "/register"}
          style={{ background:"#1c4f09",color:"#fff",border:"none",borderRadius:50,fontFamily:"'Nunito',sans-serif",fontSize:"0.95rem",fontWeight:800,padding:"0.45rem 1.5rem",transition:"background 0.18s" }}>
          Register
        </button>
        <a href="/" style={{ display:"flex",alignItems:"center" }}>
          <img src={logo} alt="Pawster Logo" style={{ width:64,height:64,objectFit:"cover" }} />
        </a>
      </nav>

      <div style={{ position:"relative",zIndex:10,display:"flex",alignItems:"center",height:"100vh",width:"100vw",maxWidth:1920,maxHeight:1200,margin:"0 auto",padding:"0 6vw",gap:"2vw" }}>

        {/* Left Panel */}
        <div style={{ flex:1,position:"relative",height:"100vh",maxHeight:1200,overflow:"visible" }}>
          <div style={{ position:"absolute",inset:0,zIndex:5,pointerEvents:"none" }}>
            {pawData.map((p,i) => (
              <PawSVG key={i} style={{ position:"absolute",top:p.top,left:p.left,bottom:p.bottom,width:p.width,height:p.width,fill:p.fill,transform:`rotate(${p.rotate}deg)` }} />
            ))}
          </div>
          <img src={dog} alt="Pawster Dog Mascot"
            style={{ position:"absolute",bottom:0,left:"-1%",zIndex:10,height:"82vh",maxHeight:760,width:"auto",objectFit:"contain",filter:"drop-shadow(0 10px 28px rgba(0,0,0,0.16))" }} />
          <div style={{ position:"absolute",top:"4%",left:"15%",zIndex:20,textAlign:"center",maxWidth:560 }}>
            <h1 style={{ fontSize:"clamp(3rem,3.8vw,4.8rem)",fontWeight:900,color:"#1a4a08",lineHeight:0.95,textTransform:"uppercase",letterSpacing:-1,textShadow:"0 2px 14px rgba(255,255,255,0.22)" }}>
              Every Pet<br/>Deserves Love
            </h1>
            <p style={{ marginTop:"1rem",fontSize:"clamp(0.88rem,1vw,1.05rem)",fontWeight:700,color:"#2a5010",lineHeight:1.62,maxWidth:420,marginLeft:"auto",marginRight:"auto",textShadow:"0 1px 6px rgba(255,255,255,0.32)" }}>
              Join our community of compassionate adopters and rescue organizations making a real difference in animals' lives.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          width:420, minWidth:380, flexShrink:0, alignSelf:"center",
          marginRight:"3vw", marginTop:"3vh",
          display:"flex", flexDirection:"column", justifyContent:"center",
          padding:"2.4rem 2.6rem",
          background:"rgba(255,248,225,0.42)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          border:"1.5px solid rgba(255,238,190,0.55)",
          borderRadius:28,
          boxShadow:"0 12px 48px rgba(160,105,30,0.15),0 2px 12px rgba(0,0,0,0.07)",
          animation:"cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
        }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:"1.6rem" }}>
            <h2 style={{ fontSize:"clamp(1.8rem,2.4vw,2.6rem)",fontWeight:900,color:"#1a4a08",lineHeight:1.05,marginBottom:"0.4rem" }}>
              Welcome Back!
            </h2>
            <p style={{ fontSize:"0.86rem",fontWeight:600,color:"#5a7a40",lineHeight:1.5 }}>
              Sign in to continue your journey of making<br/>a difference in an animal's life
            </p>
          </div>

          {/* Alert */}
          {alert.msg && (
            <div style={{
              borderRadius:10, padding:"0.75rem 1rem",
              fontSize:"0.84rem", fontWeight:700, marginBottom:"1rem",
              display:"flex", alignItems:"center", gap:"0.5rem",
              background: alert.type==="success" ? "rgba(230,245,220,0.9)" : "rgba(253,232,232,0.9)",
              color:       alert.type==="success" ? "#276010" : "#b83030",
              border:      alert.type==="success" ? "1px solid #90d060" : "1px solid #f0a0a0",
              borderLeft:  alert.type==="success" ? "4px solid #5aaa30" : "4px solid #d04040",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {alert.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field
              label="Email" id="email" type="email"
              placeholder="Enter your email…"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(v=>({...v,email:""})); setAlert({type:"",msg:""}); }}
              error={errors.email}
            />
            <Field
              label="Password" id="password" type="password"
              placeholder="Enter your password…"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(v=>({...v,password:""})); setAlert({type:"",msg:""}); }}
              error={errors.password}
            />

            {/* Remember + Forgot */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.4rem",marginTop:"0.2rem" }}>
              <label className="remember-check" style={{ display:"flex",alignItems:"center",gap:"0.5rem",fontSize:"0.88rem",fontWeight:700,color:"#3a5020",userSelect:"none" }}>
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}
                  style={{ width:17,height:17,accentColor:"#1c4f09",flexShrink:0 }} />
                Remember me
              </label>
              <button type="button" className="forgot-btn"
                onClick={() => window.location.href = "/forgot-password"}
                style={{ background:"none",border:"none",fontFamily:"'Nunito',sans-serif",fontSize:"0.88rem",fontWeight:800,color:"#c87820",padding:0,transition:"color 0.15s" }}>
                Forgot password?
              </button>
            </div>

            {/* Sign in button */}
            <button type="submit" className="signin-btn" disabled={loading}
              style={{
                display:"block", width:"100%", padding:"0.95rem",
                background:"linear-gradient(135deg,#1c4f09,#2a6e10)",
                color:"#fff", border:"none", borderRadius:13,
                fontFamily:"'Nunito',sans-serif", fontSize:"1rem", fontWeight:900,
                letterSpacing:"0.04em",
                boxShadow:"0 4px 16px rgba(28,79,9,0.28)",
                transition:"background 0.18s,transform 0.15s,box-shadow 0.15s",
                opacity:loading?0.65:1,
                position:"relative", overflow:"hidden",
              }}>
              {loading ? (
                <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation:"spin 0.8s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  Signing in…
                </span>
              ) : "Sign in →"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:"flex",alignItems:"center",gap:"0.8rem",margin:"1.3rem 0 1.1rem" }}>
            <div style={{ flex:1,height:1,background:"rgba(160,120,60,0.30)" }}/>
            <span style={{ fontSize:"0.80rem",fontWeight:700,color:"#8a9a70",whiteSpace:"nowrap",letterSpacing:"0.03em" }}>or continue with</span>
            <div style={{ flex:1,height:1,background:"rgba(160,120,60,0.30)" }}/>
          </div>

          {/* Social icon buttons — all three visually identical, Google triggers real OAuth */}
          <div style={{ display:"flex",justifyContent:"center",gap:"0.8rem",marginBottom:"1.3rem" }}>
            {[
              {
                key: "g",
                label: "Google",
                onClick: triggerGoogleLogin,
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                ),
              },
              {
                key: "a",
                label: "Apple",
                onClick: () => {},
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                ),
              },
              {
                key: "f",
                label: "Facebook",
                onClick: () => {},
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                ),
              },
            ].map(({ key, label, onClick, icon }) => (
              <button
                key={key}
                type="button"
                className="social-btn"
                aria-label={`Sign in with ${label}`}
                onClick={onClick}
                style={{
                  width:54, height:54, borderRadius:13,
                  border:"1.5px solid rgba(200,170,100,0.45)",
                  background:"rgba(255,255,255,0.70)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
                  backdropFilter:"blur(5px)",
                }}>
                {icon}
              </button>
            ))}
          </div>

          <p style={{ textAlign:"center",fontSize:"0.86rem",fontWeight:700,color:"#4a6030" }}>
            Don't have an account?{" "}
            <a href="/register" className="footer-link" style={{ color:"#c87820",fontStyle:"italic",fontWeight:800,textDecoration:"none",marginLeft:"0.15rem" }}>
              Create Account!
            </a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}