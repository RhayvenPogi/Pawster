import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import logo from "../images/logo.png";
import dog from "../images/dog.png";
import { usePageTitle } from "../hooks/usePageTitle";

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

  const orbs = [
    { size: 1100, pos: "-top-[25%] -left-[20%]",  color: "#588B41", stop: "70%", anim: "float1 8s ease-in-out infinite" },
    { size: 1000, pos: "top-[10%] -right-[20%]",  color: "#B45A22", stop: "70%", anim: "float2 10s ease-in-out infinite" },
    { size: 950,  pos: "-bottom-[20%] left-[10%]",color: "#e8e0d0", stop: "60%", anim: "float3 7s ease-in-out infinite" },
    { size: 900,  pos: "top-[30%] left-[25%]",    color: "#588B41", stop: "70%", anim: "float4 9s ease-in-out infinite" },
    { size: 850,  pos: "bottom-0 -right-[5%]",    color: "#B45A22", stop: "70%", anim: "float5 11s ease-in-out infinite" },
    { size: 800,  pos: "top-[5%] left-[35%]",     color: "#d4c9b0", stop: "70%", anim: "float6 8.5s ease-in-out infinite" },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      <div className="absolute inset-0 bg-[#EDDABB]" />
      {orbs.map((o, i) => (
        <div
          key={i}
          ref={el => orbRefs.current[i] = el}
          className={`absolute rounded-full ${o.pos}`}
          style={{ width: o.size, height: o.size, background: `radial-gradient(circle,${o.color} 0%,transparent ${o.stop})`, animation: o.anim }}
        >
          <div className="w-full h-full rounded-full mix-blend-multiply opacity-70" style={{ filter: "blur(110px)" }} />
        </div>
      ))}
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(100,70,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute opacity-[0.06]" style={{ inset: "-50%", width: "200%", height: "200%", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "256px 256px", animation: "grain 0.4s steps(1) infinite" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.2) 100%)" }} />
    </div>
  );
}

function PawSVG({ style }) {
  return (
    <svg style={style} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="66" rx="24" ry="21" />
      <ellipse cx="25" cy="43" rx="11" ry="14" transform="rotate(-14 25 43)" />
      <ellipse cx="43" cy="33" rx="11" ry="14" transform="rotate(-5 43 33)" />
      <ellipse cx="62" cy="33" rx="11" ry="14" transform="rotate(5 62 33)" />
      <ellipse cx="78" cy="43" rx="10" ry="13" transform="rotate(14 78 43)" />
    </svg>
  );
}

function Field({ label, id, type = "text", placeholder, value, onChange, error }) {
  return (
    <div className="mb-[1.1rem]">
      <label
        htmlFor={id}
        className={`block text-[0.72rem] font-black uppercase tracking-[0.07em] italic mb-[0.4rem] ${error ? "text-[#c03030]" : "text-[#276010]"}`}
      >
        {label}
      </label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={value} onChange={onChange}
        className={`field-input block w-full px-[0.95rem] py-[0.78rem] rounded-[10px] text-[0.93rem] font-semibold text-[#222] outline-none transition-all duration-[180ms]
          ${error
            ? "border-2 border-l-4 border-[#d04040] bg-[rgba(253,240,240,0.60)]"
            : "border-2 border-[#5aaa30] bg-[rgba(255,250,232,0.52)]"
          }`}
      />
      {error && (
        <span className="flex items-center gap-[0.3rem] text-[0.74rem] font-bold text-[#c03030] mt-[0.3rem]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

function HiddenGoogleLogin({ onSuccess, onError }) {
  return (
    <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
      <div id="google-login-hidden">
        <GoogleLogin onSuccess={onSuccess} onError={onError} useOneTap={false} theme="outline" size="large" text="signin_with" shape="rectangular" />
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
  const [leaving, setLeaving]   = useState(false);

  usePageTitle("Sign in");

  useEffect(() => {
    const saved = localStorage.getItem("pawster_email");
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  function navigate(url) {
    setLeaving(true);
    setTimeout(() => { window.location.href = url; }, 220);
  }

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
      setAlert({ type: "error", msg: err.response?.data?.message || "Invalid email or password." });
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true);
    setAlert({ type: "", msg: "" });
    try {
      await googleLogin(credentialResponse);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Google sign-in failed. Please try again." });
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setAlert({ type: "error", msg: "Google sign-in was cancelled or failed." });
  }

  function triggerGoogleLogin() {
    const btn = document.querySelector("#google-login-hidden [role='button'], #google-login-hidden div[tabindex]");
    if (btn) btn.click();
  }

  const pawData = [
    { top: "18%",   left: "2%",   width: 120, fill: "rgba(72,95,42,0.28)",   rotate: -8  },
    { top: "48%",   left: "5%",   width: 85,  fill: "rgba(72,95,42,0.22)",   rotate: 6   },
    { bottom: "-2%",left: "-2%",  width: 210, fill: "rgba(195,130,70,0.18)", rotate: -18 },
    { top: "41%",   left: "52%",  width: 55,  fill: "rgba(195,135,75,0.55)", rotate: -14 },
    { bottom: "18%",left: "46%",  width: 160, fill: "rgba(198,138,80,0.62)", rotate: 13  },
    { top: "24%",   left: "38%",  width: 60,  fill: "rgba(72,95,42,0.17)",   rotate: -5  },
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
        @keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pageFadeOut{from{opacity:1}to{opacity:0}}
        .card-anim { animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .spin-anim { animation: spin 0.8s linear infinite; }
        .page-exit { animation: pageFadeOut 0.22s ease both; }
        .field-input:focus { border-color:#1c4f09 !important; border-left-color:#1c4f09 !important; background:rgba(255,252,238,0.78) !important; box-shadow:0 0 0 3px rgba(28,79,9,0.09) !important; }
        .field-input::placeholder { color:#b0a07a; font-style:italic; font-weight:600; }
        .signin-btn:hover:not(:disabled) { background:#143806 !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(28,79,9,0.35) !important; }
        .signin-btn:active:not(:disabled) { transform:translateY(0) !important; }
        .nav-register:hover { background:#143806 !important; }
        .forgot-btn:hover { text-decoration:underline; color:#a06010 !important; }
        .footer-link:hover { text-decoration:underline; }
        .social-btn { transition:all 0.18s !important; }
        .social-btn:hover { border-color:#a09060 !important; transform:translateY(-2px) !important; box-shadow:0 6px 16px rgba(0,0,0,0.12) !important; background:rgba(255,255,255,0.92) !important; }
        .remember-check:focus-within { outline:2px solid #1c4f09; outline-offset:3px; border-radius:4px; }
      `}</style>

      <MeshBackground />
      <HiddenGoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

      {/* Nav */}
      <nav className="fixed top-0 right-0 z-[300] flex items-center gap-3 px-4 md:px-[1.6rem] py-[0.85rem]">
        <span className="hidden sm:inline text-[0.95rem] font-extrabold text-[#1c4f09] border-b-[2.5px] border-[#1c4f09] px-[0.3rem] pb-[0.2rem]">
          Sign in
        </span>
        <button
          className="nav-register bg-[#1c4f09] text-white border-none rounded-full text-[0.85rem] md:text-[0.95rem] font-black px-4 md:px-6 py-[0.4rem] transition-colors duration-[180ms]"
          onClick={() => navigate("/register")}
        >
          Register
        </button>
        <a href="/" className="flex items-center">
          <img src={logo} alt="Pawster Logo" className="w-12 h-12 md:w-16 md:h-16 object-cover" />
        </a>
      </nav>

      {/* Page wrapper */}
      <div className={`relative z-10 flex items-center justify-center min-h-screen w-full max-w-[1920px] mx-auto px-4 md:px-[6vw] gap-[2vw] ${leaving ? "page-exit" : ""}`}>

        {/* Left Panel */}
        <div className="hidden lg:block flex-1 relative h-screen max-h-[1200px] overflow-visible">
          <div className="absolute inset-0 z-[5] pointer-events-none">
            {pawData.map((p, i) => (
              <PawSVG
                key={i}
                style={{
                  position: "absolute",
                  top: p.top, left: p.left, bottom: p.bottom,
                  width: p.width, height: p.width,
                  fill: p.fill,
                  transform: `rotate(${p.rotate}deg)`,
                }}
              />
            ))}
          </div>
          <img
            src={dog}
            alt="Pawster Dog Mascot"
            className="absolute bottom-0 left-[-1%] z-10 w-auto object-contain"
            style={{ height: "82vh", maxHeight: 760, filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.16))" }}
          />
          <div className="absolute top-[4%] left-[15%] z-20 text-center max-w-[560px]">
            <h1
              className="font-black text-[#1a4a08] uppercase leading-[0.95] tracking-tight"
              style={{ fontSize: "clamp(3rem,3.8vw,4.8rem)", textShadow: "0 2px 14px rgba(255,255,255,0.22)" }}
            >
              Every Pet<br />Deserves Love
            </h1>
            <p
              className="mt-4 font-bold text-[#2a5010] leading-[1.62] max-w-[420px] mx-auto"
              style={{ fontSize: "clamp(0.88rem,1vw,1.05rem)", textShadow: "0 1px 6px rgba(255,255,255,0.32)" }}
            >
              Join our community of compassionate adopters and rescue organizations making a real difference in animals' lives.
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="card-anim w-full max-w-[420px] lg:w-[420px] lg:min-w-[380px] lg:flex-shrink-0 lg:mr-[3vw] lg:mt-[3vh] mt-16 lg:mt-0 flex flex-col justify-center px-6 py-8 md:px-[2.6rem] md:py-[2.4rem] rounded-[28px] backdrop-blur-xl"
          style={{
            background: "rgba(255,248,225,0.42)",
            border: "1.5px solid rgba(255,238,190,0.55)",
            boxShadow: "0 12px 48px rgba(160,105,30,0.15),0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-5 lg:hidden">
            <img src={logo} alt="Pawster" className="w-14 h-14 object-cover mb-1" />
            <p className="text-[0.75rem] font-bold text-[#2a5010] text-center uppercase tracking-wide">
              Every Pet Deserves Love
            </p>
          </div>

          {/* Header */}
          <div className="text-center mb-[1.6rem]">
            <h2
              className="font-black text-[#1a4a08] leading-[1.05] mb-[0.4rem]"
              style={{ fontSize: "clamp(1.8rem,2.4vw,2.6rem)" }}
            >
              Welcome Back!
            </h2>
            <p className="text-[0.86rem] font-semibold text-[#5a7a40] leading-[1.5]">
              Sign in to continue your journey of making<br className="hidden sm:inline" /> a difference in an animal's life
            </p>
          </div>

          {/* Alert */}
          {alert.msg && (
            <div
              className={`rounded-[10px] px-4 py-3 text-[0.84rem] font-bold mb-4 flex items-center gap-2
                ${alert.type === "success"
                  ? "bg-[rgba(230,245,220,0.9)] text-[#276010] border border-[#90d060] border-l-4 border-l-[#5aaa30]"
                  : "bg-[rgba(253,232,232,0.9)] text-[#b83030] border border-[#f0a0a0] border-l-4 border-l-[#d04040]"
                }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {alert.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field
              label="Email" id="email" type="email"
              placeholder="Enter your email…"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: "" })); setAlert({ type: "", msg: "" }); }}
              error={errors.email}
            />
            <Field
              label="Password" id="password" type="password"
              placeholder="Enter your password…"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: "" })); setAlert({ type: "", msg: "" }); }}
              error={errors.password}
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between mb-[1.4rem] mt-[0.2rem]">
              <label className="remember-check flex items-center gap-2 text-[0.88rem] font-bold text-[#3a5020] select-none cursor-pointer">
                <input
                  type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-[17px] h-[17px] accent-[#1c4f09] flex-shrink-0"
                />
                Remember me
              </label>
              <button
                type="button"
                className="forgot-btn bg-transparent border-none text-[0.88rem] font-extrabold text-[#c87820] p-0 transition-colors duration-[150ms] cursor-pointer"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              className="signin-btn block w-full py-[0.95rem] text-white border-none rounded-[13px] text-[1rem] font-black tracking-[0.04em] transition-all duration-[180ms] relative overflow-hidden cursor-pointer"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg,#1c4f09,#2a6e10)",
                boxShadow: "0 4px 16px rgba(28,79,9,0.28)",
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin-anim">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in →"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-[1.3rem]">
            <div className="flex-1 h-px bg-[rgba(160,120,60,0.30)]" />
            <span className="text-[0.80rem] font-bold text-[#8a9a70] whitespace-nowrap tracking-[0.03em]">or continue with</span>
            <div className="flex-1 h-px bg-[rgba(160,120,60,0.30)]" />
          </div>

          {/* Google button */}
          <div className="flex justify-center mb-[1.3rem]">
            <button
              type="button"
              className="social-btn w-full h-[54px] rounded-[13px] flex items-center justify-center gap-[0.6rem] text-[0.93rem] font-extrabold text-[#444] backdrop-blur-sm cursor-pointer"
              aria-label="Continue with Google"
              onClick={triggerGoogleLogin}
              style={{
                border: "1.5px solid rgba(200,170,100,0.45)",
                background: "rgba(255,255,255,0.70)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="text-center text-[0.86rem] font-bold text-[#4a6030]">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="footer-link bg-transparent border-none text-[#c87820] italic font-extrabold cursor-pointer text-[0.86rem] p-0"
            >
              Create Account!
            </button>
          </p>
        </div>
      </div>
    </>
  );
}