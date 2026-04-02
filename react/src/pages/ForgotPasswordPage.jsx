import { useState, useEffect, useRef } from "react";
import logo from "../images/logo.png";
import dogMascot from "../images/forgot_dog.png";
import api from "../config/axios";

// ─── Shared: Mesh background ──────────────────────────────────────────────────
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
          el.style.marginTop = m.cy * factors[i].fy + "px";
        }
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const orbStyles = [
    { width: 1100, height: 1100, top: "-25%", left: "-20%", background: "radial-gradient(circle,#588B41 0%,transparent 70%)", animation: "float1 8s ease-in-out infinite" },
    { width: 1000, height: 1000, top: "10%", right: "-20%", background: "radial-gradient(circle,#B45A22 0%,transparent 70%)", animation: "float2 10s ease-in-out infinite" },
    { width: 950, height: 950, bottom: "-20%", left: "10%", background: "radial-gradient(circle,#e8e0d0 0%,transparent 60%)", animation: "float3 7s ease-in-out infinite" },
    { width: 900, height: 900, top: "30%", left: "25%", background: "radial-gradient(circle,#588B41 0%,transparent 70%)", animation: "float4 9s ease-in-out infinite" },
    { width: 850, height: 850, bottom: "0%", right: "-5%", background: "radial-gradient(circle,#B45A22 0%,transparent 70%)", animation: "float5 11s ease-in-out infinite" },
    { width: 800, height: 800, top: "5%", left: "35%", background: "radial-gradient(circle,#d4c9b0 0%,transparent 70%)", animation: "float6 8.5s ease-in-out infinite" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
      {orbStyles.map((s, i) => (
        <div key={i} ref={el => orbRefs.current[i] = el}
          style={{ position: "absolute", borderRadius: "50%", width: s.width, height: s.height, top: s.top, left: s.left, right: s.right, bottom: s.bottom, background: s.background, animation: s.animation }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", filter: "blur(110px)", mixBlendMode: "multiply", opacity: 0.7 }} />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,70,30,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "absolute", inset: "-50%", width: "200%", height: "200%", opacity: 0.06, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "256px 256px", animation: "grain 0.4s steps(1) infinite" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(150,100,40,0.2) 100%)" }} />
    </div>
  );
}

// ─── Shared: Paw SVG ──────────────────────────────────────────────────────────
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

// ─── Shared: Nav ─────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{ position: "fixed", top: 0, right: 0, zIndex: 300, display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.6rem" }}>
      <button
        onClick={() => window.location.href = "/login"}
        style={{ background: "none", border: "none", borderBottom: "2.5px solid #1c4f09", fontFamily: "'Nunito',sans-serif", fontSize: "1rem", fontWeight: 800, color: "#1c4f09", padding: "0.15rem 0.3rem 0.2rem", cursor: "pointer" }}>
        Sign in
      </button>
      <button
        onClick={() => window.location.href = "/register"}
        style={{ background: "#1c4f09", color: "#fff", border: "none", borderRadius: 50, fontFamily: "'Nunito',sans-serif", fontSize: "1rem", fontWeight: 800, padding: "0.5rem 1.6rem", cursor: "pointer" }}>
        Register
      </button>
      <a href="/" style={{ display: "flex", alignItems: "center" }}>
        <img src={logo} alt="Pawster Logo" style={{ width: 70, height: 70, objectFit: "cover" }} />
      </a>
    </nav>
  );
}

// ─── Modal: OTP Sent Success ──────────────────────────────────────────────────
function OtpSentModal({ email, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,20,5,0.38)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "rgba(255,248,225,0.97)", border: "2px solid #e8b84b", borderRadius: 20, padding: "2.5rem 2.8rem", maxWidth: 420, width: "90%", textAlign: "center", boxShadow: "0 12px 50px rgba(160,100,20,0.22)", animation: "popIn 0.28s cubic-bezier(.34,1.56,.64,1) forwards" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1c4f09", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: "1.7rem", color: "#1a4a08", margin: "0 0 0.5rem" }}>OTP Sent!</h2>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#3a6020", lineHeight: 1.6, margin: "0 0 1.6rem" }}>
          We've sent a 6-digit PIN to<br />
          <strong style={{ color: "#1c4f09" }}>{email}</strong><br />
          Please check your inbox.
        </p>
        <button
          onClick={onClose}
          style={{ background: "#d97020", color: "#fff", border: "none", borderRadius: 50, fontFamily: "'Nunito',sans-serif", fontSize: "1rem", fontWeight: 900, padding: "0.75rem 2.5rem", cursor: "pointer", transition: "background 0.18s, transform 0.15s" }}
          onMouseEnter={e => { e.target.style.background = "#b85c10"; e.target.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.target.style.background = "#d97020"; e.target.style.transform = "translateY(0)"; }}>
          Got it!
        </button>
      </div>
    </div>
  );
}

// ─── Modal: Password Reset Success ───────────────────────────────────────────
function SuccessModal({ onRedirect }) {
  const [count, setCount] = useState(5);
  useEffect(() => {
    const t = setInterval(() => setCount(c => {
      if (c <= 1) { clearInterval(t); onRedirect(); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [onRedirect]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,20,5,0.38)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "rgba(255,248,225,0.97)", border: "2px solid #e8b84b", borderRadius: 20, padding: "2.8rem 3rem", maxWidth: 460, width: "90%", textAlign: "center", boxShadow: "0 12px 50px rgba(160,100,20,0.22)", animation: "popIn 0.28s cubic-bezier(.34,1.56,.64,1) forwards" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#22a045", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: "2rem", color: "#1a4a08", margin: "0 0 0.5rem" }}>Success</h2>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: "1rem", color: "#3a6020", margin: "0 0 1.4rem" }}>
          You've successfully reset your password.
        </p>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.92rem", color: "#6a7a50", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          You will be redirected to the login page shortly.
          <span style={{ display: "inline-block", width: 22, height: 22, border: "3px solid #d97020", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </p>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#d97020", marginTop: "0.8rem" }}>{count}s</p>
      </div>
    </div>
  );
}

// ─── Step 1: Forgot Password ──────────────────────────────────────────────────
function ForgotPasswordStep({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pawData = [
    { top: "18%", left: "2%", width: 120, fill: "rgba(72,95,42,0.28)", rotate: -8 },
    { top: "48%", left: "5%", width: 85, fill: "rgba(72,95,42,0.22)", rotate: 6 },
    { bottom: "-2%", left: "-2%", width: 210, fill: "rgba(195,130,70,0.18)", rotate: -18 },
    { top: "38%", left: "45%", width: 65, fill: "rgba(195,135,75,0.40)", rotate: -14 },
    { bottom: "18%", left: "42%", width: 100, fill: "rgba(198,138,80,0.35)", rotate: 13 },
  ];

  // FIX 1: properly await the API call, show errors to the user
  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email."); return; }
    setError("");
    setLoading(true);
    try {
      await onSubmit(email.trim());
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", height: "100vh", width: "100vw", maxWidth: 1920, margin: "0 auto", padding: "0 6vw", gap: "2vw" }}>
      <div style={{ flex: 1, position: "relative", height: "100vh", overflow: "visible" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
          {pawData.map((p, i) => (
            <PawSVG key={i} style={{ position: "absolute", top: p.top, left: p.left, bottom: p.bottom, width: p.width, height: p.width, fill: p.fill, transform: `rotate(${p.rotate}deg)` }} />
          ))}
        </div>
        <div style={{ position: "absolute", top: "12%", left: "28%", zIndex: 20, fontSize: "5rem", color: "rgba(195,135,75,0.7)", fontFamily: "'Nunito',sans-serif", fontWeight: 900, userSelect: "none", animation: "bobQ 2.5s ease-in-out infinite" }}>?</div>
        <img src={dogMascot} alt="Pawster Dog Mascot"
          style={{ position: "absolute", bottom: 0, left: "-1%", zIndex: 10, height: "82vh", maxHeight: 760, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.16))" }} />
        <div style={{ position: "absolute", top: "4%", left: "15%", zIndex: 20, textAlign: "center", maxWidth: 560 }}>
          <h1 style={{ fontSize: "clamp(2.6rem,3.4vw,4.2rem)", fontWeight: 900, color: "#1a4a08", lineHeight: 0.95, textTransform: "uppercase", letterSpacing: -1, textShadow: "0 2px 14px rgba(255,255,255,0.22)" }}>
            Forgot Your<br />Password?
          </h1>
          <p style={{ marginTop: "1rem", fontSize: "clamp(0.88rem,1vw,1.05rem)", fontWeight: 700, color: "#2a5010", lineHeight: 1.62, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
            No worries! We'll send a one-time PIN to your email so you can get back in.
          </p>
        </div>
      </div>

      <div style={{ width: 400, minWidth: 400, flexShrink: 0, alignSelf: "center", marginRight: "3vw", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2.2rem 2.6rem", background: "rgba(255,248,225,0.38)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1.5px solid rgba(255,238,190,0.50)", borderRadius: 26, boxShadow: "0 8px 40px rgba(160,105,30,0.13),0 2px 10px rgba(0,0,0,0.06)" }}>
        <h2 style={{ fontSize: "clamp(1.8rem,2.4vw,2.6rem)", fontWeight: 900, color: "#1a4a08", textAlign: "center", marginBottom: "0.4rem" }}>Forgot Password</h2>
        <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "#3a6020", textAlign: "center", lineHeight: 1.55, marginBottom: "1.8rem" }}>
          We'll help you recover access to your account
        </p>

        {error && (
          <div style={{ borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.86rem", fontWeight: 700, marginBottom: "1rem", background: "rgba(253,232,232,0.9)", color: "#b83030", border: "1px solid #f0a0a0" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ position: "relative", marginBottom: "1.4rem" }}>
            <label style={{ position: "absolute", top: "-0.55rem", left: "0.75rem", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", fontStyle: "italic", color: "#276010", textShadow: "-1px -1px 0 rgba(255,250,232,0.52),1px 1px 0 rgba(255,250,232,0.52)", zIndex: 2 }}>Email</label>
            <input
              type="email"
              placeholder="Enter email..."
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              style={{ display: "block", width: "100%", padding: "0.82rem 0.95rem", border: `2px solid ${error ? "#d04040" : "#5aaa30"}`, borderRadius: 10, background: "rgba(255,250,232,0.52)", fontFamily: "'Nunito',sans-serif", fontSize: "0.93rem", fontWeight: 600, color: "#222", outline: "none", transition: "border-color 0.18s,box-shadow 0.18s" }}
              onFocus={e => { e.target.style.borderColor = "#1c4f09"; e.target.style.boxShadow = "0 0 0 3px rgba(28,79,9,0.09)"; e.target.style.background = "rgba(255,252,238,0.78)"; }}
              onBlur={e => { e.target.style.borderColor = error ? "#d04040" : "#5aaa30"; e.target.style.boxShadow = "none"; e.target.style.background = "rgba(255,250,232,0.52)"; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: "block", width: "100%", padding: "1rem", background: "#d97020", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'Nunito',sans-serif", fontSize: "1.05rem", fontWeight: 900, letterSpacing: "0.02em", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.18s,transform 0.15s,box-shadow 0.15s", opacity: loading ? 0.65 : 1 }}
            onMouseEnter={e => { if (!loading) { e.target.style.background = "#b85c10"; e.target.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.target.style.background = "#d97020"; e.target.style.transform = "translateY(0)"; }}>
            {loading ? "Sending OTP..." : "Submit"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.88rem", fontWeight: 700, color: "#3a6020", marginTop: "1.4rem" }}>
          Remembered it?{" "}
          <a href="/login" style={{ color: "#c87820", fontStyle: "italic", fontWeight: 800, textDecoration: "none" }}>
            Sign in!
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: OTP Verification ─────────────────────────────────────────────────
function OtpStep({ email, onVerify, onResend, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const inputs = useRef([]);

  function handleChange(val, idx) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(e, idx) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  }

  // FIX 2: show API errors to the user on verify
  async function handleVerify(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setLoading(true);
    try {
      await onVerify(code);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP. Please try again.";
      setError(msg);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // FIX 3: resend OTP properly calls the parent and shows feedback
  async function handleResend() {
    setResending(true);
    setResendMsg("");
    setError("");
    try {
      await onResend();
      setResendMsg("A new OTP has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      setResendMsg("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const pawData = [
    { top: "15%", left: "3%", width: 90, fill: "rgba(72,95,42,0.22)", rotate: -10 },
    { top: "55%", left: "2%", width: 70, fill: "rgba(72,95,42,0.18)", rotate: 8 },
    { bottom: "5%", left: "8%", width: 55, fill: "rgba(195,130,70,0.20)", rotate: -5 },
    { bottom: "3%", right: "10%", width: 80, fill: "rgba(195,130,70,0.22)", rotate: 12 },
  ];

  return (
    <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", width: "100vw" }}>
      {pawData.map((p, i) => (
        <PawSVG key={i} style={{ position: "fixed", top: p.top, left: p.left, bottom: p.bottom, right: p.right, width: p.width, height: p.width, fill: p.fill, transform: `rotate(${p.rotate}deg)`, zIndex: 5, pointerEvents: "none" }} />
      ))}

      <div style={{ width: 520, maxWidth: "92vw", padding: "2.8rem 3rem", background: "rgba(237,218,187,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1.5px solid rgba(255,238,190,0.60)", borderRadius: 26, boxShadow: "0 8px 40px rgba(160,105,30,0.15)", textAlign: "center", zIndex: 10 }}>
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: "clamp(1.7rem,2.5vw,2.2rem)", color: "#1a4a08", marginBottom: "0.5rem" }}>Verify your Account</h2>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "#3a6020", marginBottom: "2rem", lineHeight: 1.55 }}>
          We've sent a PIN to <strong>{email}</strong><br />Please enter it to verify your account
        </p>

        {error && (
          <div style={{ borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.86rem", fontWeight: 700, marginBottom: "1rem", background: "rgba(253,232,232,0.9)", color: "#b83030", border: "1px solid #f0a0a0" }}>
            {error}
          </div>
        )}

        {resendMsg && (
          <div style={{ borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.86rem", fontWeight: 700, marginBottom: "1rem", background: "rgba(232,253,232,0.9)", color: "#207030", border: "1px solid #a0e0a0" }}>
            {resendMsg}
          </div>
        )}

        <form onSubmit={handleVerify} noValidate>
          <div style={{ display: "flex", gap: "0.65rem", justifyContent: "center", marginBottom: "0.5rem" }} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                style={{ width: 56, height: 64, textAlign: "center", fontSize: "1.6rem", fontWeight: 900, fontFamily: "'Nunito',sans-serif", color: "#1a4a08", background: "rgba(255,250,232,0.65)", border: `2px solid ${digit ? "#1c4f09" : "#5aaa30"}`, borderRadius: 10, outline: "none", transition: "border-color 0.18s,box-shadow 0.18s,background 0.18s", caretColor: "#1c4f09" }}
                onFocus={e => { e.target.style.borderColor = "#1c4f09"; e.target.style.boxShadow = "0 0 0 3px rgba(28,79,9,0.12)"; e.target.style.background = "rgba(255,255,240,0.85)"; }}
                onBlur={e => { e.target.style.borderColor = digit ? "#1c4f09" : "#5aaa30"; e.target.style.boxShadow = "none"; e.target.style.background = "rgba(255,250,232,0.65)"; }}
              />
            ))}
          </div>

          <div style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{ background: "none", border: "none", fontFamily: "'Nunito',sans-serif", fontSize: "0.88rem", fontWeight: 700, color: "#6a7a50", cursor: resending ? "not-allowed" : "pointer", opacity: resending ? 0.6 : 1 }}>
              Didn't receive it?{" "}
              <span style={{ color: "#c87820", fontWeight: 800, fontStyle: "italic" }}>
                {resending ? "Sending..." : "Resend OTP"}
              </span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: "block", width: "100%", padding: "1rem", background: "#d97020", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'Nunito',sans-serif", fontSize: "1.05rem", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.18s,transform 0.15s", opacity: loading ? 0.65 : 1 }}
            onMouseEnter={e => { if (!loading) { e.target.style.background = "#b85c10"; e.target.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.target.style.background = "#d97020"; e.target.style.transform = "translateY(0)"; }}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Step 3: Reset Password ────────────────────────────────────────────────────
function ResetPasswordStep({ onReset }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  function validate() {
    const e = {};
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "At least 8 characters.";
    if (!confirm) e.confirm = "Please confirm your password.";
    else if (password !== confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // FIX 4: show API error on reset failure
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onReset(password);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to reset password. Please try again.";
      setErrors(v => ({ ...v, form: msg }));
    } finally {
      setLoading(false);
    }
  }

  const pawData = [
    { top: "15%", left: "3%", width: 90, fill: "rgba(72,95,42,0.22)", rotate: -10 },
    { top: "55%", left: "2%", width: 70, fill: "rgba(72,95,42,0.18)", rotate: 8 },
    { bottom: "5%", left: "8%", width: 55, fill: "rgba(195,130,70,0.20)", rotate: -5 },
    { bottom: "3%", right: "10%", width: 80, fill: "rgba(195,130,70,0.22)", rotate: 12 },
  ];

  const EyeIcon = ({ open }) => open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5aaa30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5aaa30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  );

  return (
    <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", width: "100vw" }}>
      {pawData.map((p, i) => (
        <PawSVG key={i} style={{ position: "fixed", top: p.top, left: p.left, bottom: p.bottom, right: p.right, width: p.width, height: p.width, fill: p.fill, transform: `rotate(${p.rotate}deg)`, zIndex: 5, pointerEvents: "none" }} />
      ))}

      <div style={{ width: 520, maxWidth: "92vw", padding: "2.8rem 3rem", background: "rgba(237,218,187,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1.5px solid rgba(255,238,190,0.60)", borderRadius: 26, boxShadow: "0 8px 40px rgba(160,105,30,0.15)", zIndex: 10 }}>
        <h2 style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: "clamp(1.7rem,2.5vw,2.2rem)", color: "#1a4a08", marginBottom: "0.4rem", textAlign: "center" }}>Reset Your Password</h2>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#3a6020", textAlign: "center", marginBottom: "2rem" }}>
          Choose a strong new password for your account
        </p>

        {errors.form && (
          <div style={{ borderRadius: 8, padding: "0.7rem 0.9rem", fontSize: "0.86rem", fontWeight: 700, marginBottom: "1rem", background: "rgba(253,232,232,0.9)", color: "#b83030", border: "1px solid #f0a0a0" }}>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ position: "relative", marginBottom: "1.4rem" }}>
            <label style={{ position: "absolute", top: "-0.55rem", left: "0.75rem", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", fontStyle: "italic", color: "#276010", textShadow: "-1px -1px 0 rgba(255,250,232,0.52),1px 1px 0 rgba(255,250,232,0.52)", zIndex: 2 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: "" })); }}
                style={{ display: "block", width: "100%", padding: "0.82rem 2.8rem 0.82rem 0.95rem", border: `2px solid ${errors.password ? "#d04040" : "#5aaa30"}`, borderRadius: 10, background: "rgba(255,250,232,0.52)", fontFamily: "'Nunito',sans-serif", fontSize: "0.93rem", fontWeight: 600, color: "#222", outline: "none", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = "#1c4f09"; e.target.style.boxShadow = "0 0 0 3px rgba(28,79,9,0.09)"; }}
                onBlur={e => { e.target.style.borderColor = errors.password ? "#d04040" : "#5aaa30"; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            {errors.password && <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#c03030", marginTop: "0.28rem" }}>{errors.password}</span>}
          </div>

          <div style={{ position: "relative", marginBottom: "1.6rem" }}>
            <label style={{ position: "absolute", top: "-0.55rem", left: "0.75rem", fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", fontStyle: "italic", color: "#276010", textShadow: "-1px -1px 0 rgba(255,250,232,0.52),1px 1px 0 rgba(255,250,232,0.52)", zIndex: 2 }}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showCf ? "text" : "password"}
                placeholder="Enter password..."
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrors(v => ({ ...v, confirm: "" })); }}
                style={{ display: "block", width: "100%", padding: "0.82rem 2.8rem 0.82rem 0.95rem", border: `2px solid ${errors.confirm ? "#d04040" : "#5aaa30"}`, borderRadius: 10, background: "rgba(255,250,232,0.52)", fontFamily: "'Nunito',sans-serif", fontSize: "0.93rem", fontWeight: 600, color: "#222", outline: "none", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = "#1c4f09"; e.target.style.boxShadow = "0 0 0 3px rgba(28,79,9,0.09)"; }}
                onBlur={e => { e.target.style.borderColor = errors.confirm ? "#d04040" : "#5aaa30"; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowCf(v => !v)} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <EyeIcon open={showCf} />
              </button>
            </div>
            {errors.confirm && <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#c03030", marginTop: "0.28rem" }}>{errors.confirm}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: "block", width: "100%", padding: "1rem", background: "#d97020", color: "#fff", border: "none", borderRadius: 12, fontFamily: "'Nunito',sans-serif", fontSize: "1.05rem", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.18s,transform 0.15s", opacity: loading ? 0.65 : 1 }}
            onMouseEnter={e => { if (!loading) { e.target.style.background = "#b85c10"; e.target.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.target.style.background = "#d97020"; e.target.style.transform = "translateY(0)"; }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [step, setStep] = useState("forgot");
  const [email, setEmail] = useState("");
  const [showOtpSentModal, setShowOtpSentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // FIX 5: return the promise so the child can catch/finally properly
  async function handleForgotSubmit(submittedEmail) {
    await api.post("/api/auth/forgot-password", { email: submittedEmail });
    setEmail(submittedEmail);
    setShowOtpSentModal(true);
  }

  function handleOtpSentModalClose() {
    setShowOtpSentModal(false);
    setStep("otp");
  }

  // FIX 6: return the promise so OtpStep can catch errors
  async function handleOtpVerify(code) {
    await api.post("/api/auth/verify-otp", { email, otp: code });
    setStep("reset");
  }

  // FIX 7: resend OTP reuses the same forgot-password endpoint
  async function handleOtpResend() {
    await api.post("/api/auth/forgot-password", { email });
  }

  // FIX 8: return the promise so ResetPasswordStep can catch errors
  async function handlePasswordReset(newPassword) {
    await api.post("/api/auth/reset-password", { email, newPassword });
    setShowSuccessModal(true);
  }

  function handleSuccessRedirect() {
    setShowSuccessModal(false);
    window.location.href = "/login";
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { margin:0;padding:0;box-sizing:border-box; }
        html,body{height:100%;font-family:'Nunito',sans-serif;overflow:hidden;background:#EDDABB;}
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12%,16%) scale(1.15)}66%{transform:translate(-8%,8%) scale(0.9)}}
        @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-14%,10%) scale(0.9)}66%{transform:translate(8%,-15%) scale(1.15)}}
        @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(14%,-10%) scale(1.12)}75%{transform:translate(-10%,8%) scale(0.9)}}
        @keyframes float4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-15%,-12%) scale(1.18)}}
        @keyframes float5{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-10%,-18%) scale(1.1)}80%{transform:translate(8%,-8%) scale(0.9)}}
        @keyframes float6{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(15%,12%) scale(1.15)}70%{transform:translate(-8%,18%) scale(0.88)}}
        @keyframes grain{0%,100%{transform:translate(0,0)}50%{transform:translate(-2%,2%)}}
        @keyframes popIn{0%{opacity:0;transform:scale(0.88) translateY(16px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes bobQ{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-18px) rotate(5deg)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder{color:#a09060;font-style:italic;font-weight:600;}
      `}</style>

      <MeshBackground />
      <Nav />

      {step === "forgot" && <ForgotPasswordStep onSubmit={handleForgotSubmit} />}
      {step === "otp" && <OtpStep email={email} onVerify={handleOtpVerify} onResend={handleOtpResend} onBack={() => setStep("forgot")} />}
      {step === "reset" && <ResetPasswordStep onReset={handlePasswordReset} />}

      {showOtpSentModal && <OtpSentModal email={email} onClose={handleOtpSentModalClose} />}
      {showSuccessModal && <SuccessModal onRedirect={handleSuccessRedirect} />}
    </>
  );
}