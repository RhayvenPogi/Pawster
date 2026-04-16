import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import Navbar from "./Navbar";
import logo from "../images/logo.png";
import { Link } from 'react-router-dom';

const DJANGO      = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";
const POLL_7DAY   = 30_000;  // 30s — 7-day surveys check frequently
const POLL_30DAY  = 60_000;  // 60s — 30-day surveys check every minute

// Token is passed in from the component — sourced from useAuth, not guessed from localStorage
function makeDjFetch(token) {
  return function djFetch(path, opts = {}) {
    return fetch(`${DJANGO}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
    });
  };
}

const TYPE_INFO = {
  "7_day":  { label: "7-Day Check-In",  icon: "fa-calendar-week", color: "#1c7a09", bg: "rgba(28,122,9,0.08)"  },
  "30_day": { label: "30-Day Check-In", icon: "fa-calendar-alt",  color: "#1a5fbf", bg: "rgba(26,95,191,0.08)" },
};

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.3rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHov(n)}
          onMouseLeave={() => setHov(0)}
          onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.8rem", color: n <= (hov || value) ? "#e07820" : "rgba(180,140,60,0.25)", transition: "color 0.12s", padding: "0.05rem" }}
        >★</button>
      ))}
    </div>
  );
}

// ── Yes/No toggle ─────────────────────────────────────────────────────────────
function YesNo({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {[["yes", "Yes"], ["no", "No"]].map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          style={{ flex: 1, padding: "0.55rem", borderRadius: 9, fontWeight: 800, fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Nunito',sans-serif", transition: "all 0.15s", border: `1px solid ${value === v ? "#1c4f09" : "rgba(180,140,60,0.28)"}`, background: value === v ? "#1c4f09" : "rgba(255,250,232,0.7)", color: value === v ? "#fff" : "#3a5020" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

const sInp = { padding: "0.625rem 0.875rem", borderRadius: 10, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,250,232,0.7)", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#1a2e0a", outline: "none", width: "100%" };
const sFocIn  = (e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.12)"; };
const sFocOut = (e) => { e.target.style.borderColor = "rgba(180,140,60,0.28)"; e.target.style.boxShadow = "none"; };

const SField = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
    <label style={{ fontSize: "0.69rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50" }}>{label}</label>
    {children}
  </div>
);

const SectionBox = ({ icon, title, children }) => (
  <div style={{ padding: "0.875rem 1rem", borderRadius: 12, background: "rgba(28,79,9,0.05)", border: "1px solid rgba(90,170,48,0.18)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
    <div style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1c4f09" }}>
      <i className={`fas ${icon}`} style={{ marginRight: "0.4rem" }} />{title}
    </div>
    {children}
  </div>
);

// ── Survey form modal ─────────────────────────────────────────────────────────
function SurveyModal({ survey, onClose, onSuccess, token }) {
  const [form, setForm] = useState({
    adjustment: "", behavioralNotes: "", showingIllness: "",
    vetVisited: "", satisfied: "", needsSupport: "",
    additionalNotes: "", rating: 0,
  });
  const [loading, setLoading] = useState(false);

  const ti = TYPE_INFO[survey.survey_type] || TYPE_INFO["7_day"];

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setV = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating)      { alert("Please give a star rating before submitting."); return; }
    if (!form.adjustment)  { alert("Please select how the pet is adjusting."); return; }
    if (!form.showingIllness || !form.vetVisited || !form.satisfied) {
      alert("Please answer all required questions."); return;
    }
    setLoading(true);
    try {
      const res  = await makeDjFetch(token)("/api/surveys/response/", {
        method: "POST",
        body: JSON.stringify({
          survey_id:        survey.id,
          adjustment:       form.adjustment,
          behavioral_notes: form.behavioralNotes,
          showing_illness:  form.showingIllness === "yes",
          vet_visited:      form.vetVisited === "yes",
          satisfied:        form.satisfied === "yes",
          needs_support:    form.needsSupport === "yes",
          additional_notes: form.additionalNotes,
          rating:           form.rating,
        }),
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
      else {
        const msg = data.errors
          ? Object.values(data.errors).flat().join(" ")
          : data.message || "Error submitting. Please try again.";
        alert(msg);
      }
    } catch { alert("Network error. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 520, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,252,235,0.98)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", animation: "modalIn .28s cubic-bezier(.22,.68,0,1.15) both", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.22)", background: "linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))", flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: ti.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <i className={`fas ${ti.icon}`} />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: "#1a4a08" }}>{ti.label}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50" }}>for {survey.animal_name}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>

            <SectionBox icon="fa-paw" title="Pet Adjustment">
              <SField label="How is the pet adjusting to their new home? *">
                <select required value={form.adjustment} onChange={setF("adjustment")} style={sInp} onFocus={sFocIn} onBlur={sFocOut}>
                  <option value="">Select…</option>
                  {["Very well", "Moderate", "Struggling"].map(o => <option key={o}>{o}</option>)}
                </select>
              </SField>
              <SField label="Any behavioral concerns?">
                <textarea value={form.behavioralNotes} onChange={setF("behavioralNotes")} rows={2}
                  placeholder="Describe any issues, fears, or changes you've noticed…"
                  style={{ ...sInp, resize: "vertical", minHeight: 60 }} onFocus={sFocIn} onBlur={sFocOut} />
              </SField>
            </SectionBox>

            <SectionBox icon="fa-heartbeat" title="Pet Health">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <SField label="Showing signs of illness? *">
                  <YesNo value={form.showingIllness} onChange={v => setV("showingIllness", v)} />
                </SField>
                <SField label="Visited a veterinarian? *">
                  <YesNo value={form.vetVisited} onChange={v => setV("vetVisited", v)} />
                </SField>
              </div>
              {form.showingIllness === "yes" && (
                <div style={{ padding: "0.625rem 0.875rem", borderRadius: 10, background: "rgba(192,48,48,0.07)", border: "1px solid rgba(192,48,48,0.22)", fontSize: "0.8rem", fontWeight: 700, color: "#a02020" }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: "0.4rem" }} />
                  Please visit a vet as soon as possible. Our team will follow up with you.
                </div>
              )}
            </SectionBox>

            <SectionBox icon="fa-smile" title="Your Satisfaction">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <SField label="Satisfied with the adoption? *">
                  <YesNo value={form.satisfied} onChange={v => setV("satisfied", v)} />
                </SField>
                <SField label="Need support from our shelter?">
                  <YesNo value={form.needsSupport} onChange={v => setV("needsSupport", v)} />
                </SField>
              </div>
              <SField label="Additional notes or feedback">
                <textarea value={form.additionalNotes} onChange={setF("additionalNotes")} rows={2}
                  placeholder="Anything else you'd like to share with us…"
                  style={{ ...sInp, resize: "vertical", minHeight: 64 }} onFocus={sFocIn} onBlur={sFocOut} />
              </SField>
            </SectionBox>

            {/* Star rating */}
            <div style={{ padding: "0.875rem 1rem", borderRadius: 12, background: "rgba(224,120,32,0.06)", border: "1px solid rgba(224,120,32,0.2)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#b05010" }}>
                <i className="fas fa-star" style={{ marginRight: "0.4rem" }} />Rate your overall experience *
              </div>
              <StarRating value={form.rating} onChange={v => setV("rating", v)} />
              {form.rating > 0 && (
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6a7a50" }}>
                  {["", "Poor — we'd like to hear more", "Fair — room for improvement", "Good — thanks!", "Very Good — glad to hear it!", "Excellent! — you made our day 🐾"][form.rating]}
                </div>
              )}
            </div>
          </div>

          {/* Submit footer */}
          <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(180,140,60,0.18)", flexShrink: 0, background: "rgba(255,252,235,0.95)" }}>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "0.8rem", borderRadius: 12, fontWeight: 900, fontSize: "0.9rem", color: "#fff", background: loading ? "#5a8a40" : "#1c4f09", border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 4px 16px rgba(28,79,9,0.28)" }}>
              {loading
                ? <><i className="fas fa-spinner" style={{ animation: "spin .8s linear infinite" }} /> Submitting…</>
                : <><i className="fas fa-paper-plane" /> Submit Follow-Up</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── Survey card (list view) ───────────────────────────────────────────────────
function SurveyCard({ survey, onOpen }) {
  const ti        = TYPE_INFO[survey.survey_type] || TYPE_INFO["7_day"];
  const isPending = survey.status === "Pending";
  const dateLabel = survey.submitted_at || survey.scheduled_for;

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${isPending ? "rgba(90,170,48,0.35)" : "rgba(180,140,60,0.28)"}`, background: "rgba(255,248,225,0.85)", boxShadow: "0 4px 20px rgba(100,70,20,0.10)", transition: "transform 0.2s, box-shadow 0.2s" }}>
      <div style={{ height: 4, background: isPending ? ti.color : "rgba(180,140,60,0.30)" }} />
      <div style={{ padding: "1.125rem 1.25rem" }}>

        {/* Card header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: isPending ? ti.bg : "rgba(180,140,60,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: isPending ? ti.color : "#6a7a50" }}>
              <i className={`fas ${ti.icon}`} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#1a4a08", fontFamily: "'Nunito',sans-serif" }}>{ti.label}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6a7a50" }}>for {survey.animal_name}</div>
            </div>
          </div>
          <span style={{ fontSize: "0.68rem", fontWeight: 900, padding: "0.25rem 0.625rem", borderRadius: 50, textTransform: "uppercase", letterSpacing: "0.06em", background: isPending ? "rgba(90,170,48,0.15)" : "rgba(180,140,60,0.15)", color: isPending ? "#1c7a09" : "#6a7a50" }}>
            {survey.status}
          </span>
        </div>

        {/* Date */}
        {dateLabel && (
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6a7a50", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <i className="fas fa-calendar" style={{ color: "#b4903a", fontSize: "0.7rem" }} />
            {isPending ? "Available since" : "Submitted on"}{": "}
            {new Date(dateLabel).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        )}

        {/* Poll badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.28rem", marginBottom: "0.75rem", padding: "0.18rem 0.55rem", borderRadius: 50, fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.05em", background: survey.survey_type === "7_day" ? "rgba(28,122,9,0.10)" : "rgba(26,95,191,0.10)", color: survey.survey_type === "7_day" ? "#1c7a09" : "#1a5fbf" }}>
          <i className={`fas ${survey.survey_type === "7_day" ? "fa-sync-alt" : "fa-clock"}`} style={{ fontSize: "0.55rem" }} />
          {survey.survey_type === "7_day" ? "Refreshes every 30s" : "Refreshes every 60s"}
        </div>

        {/* Action */}
        {isPending ? (
          <button onClick={() => onOpen(survey)}
            style={{ width: "100%", padding: "0.625rem", borderRadius: 10, fontWeight: 900, fontSize: "0.84rem", color: "#fff", background: "#1c4f09", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", boxShadow: "0 4px 14px rgba(28,79,9,0.22)", transition: "background 0.2s" }}>
            <i className="fas fa-clipboard-list" /> Fill Out Survey
          </button>
        ) : (
          <div style={{ width: "100%", padding: "0.625rem", borderRadius: 10, fontWeight: 900, fontSize: "0.84rem", color: "#6a7a50", background: "rgba(180,140,60,0.10)", border: "1px solid rgba(180,140,60,0.22)", textAlign: "center", fontFamily: "'Nunito',sans-serif" }}>
            <i className="fas fa-check-circle" style={{ marginRight: "0.4rem", color: "#5aaa30" }} />Survey Completed
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upcoming survey card ──────────────────────────────────────────────────────
function UpcomingCard({ survey }) {
  const ti       = TYPE_INFO[survey.survey_type] || TYPE_INFO["7_day"];
  const dueDate  = new Date(survey.scheduled_for);
  const daysLeft = Math.ceil((dueDate - Date.now()) / 86_400_000);

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(180,140,60,0.22)", background: "rgba(255,248,225,0.6)", opacity: 0.8 }}>
      <div style={{ height: 4, background: "rgba(180,140,60,0.25)" }} />
      <div style={{ padding: "1.125rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: ti.bg, display: "flex", alignItems: "center", justifyContent: "center", color: ti.color, flexShrink: 0 }}>
          <i className={`fas ${ti.icon}`} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: "0.9rem", color: "#1a4a08", fontFamily: "'Nunito',sans-serif" }}>{ti.label}</div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6a7a50" }}>for {survey.animal_name}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 900, color: ti.color }}>
            {daysLeft <= 0 ? "Due today" : `In ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          </div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9aaa80", marginTop: 2 }}>
            {dueDate.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Poll status indicator ─────────────────────────────────────────────────────
function PollIndicator({ label, intervalMs, lastPolled }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(lastPolled ? Math.floor((Date.now() - lastPolled) / 1000) : 0);
    }, 1000);
    return () => clearInterval(id);
  }, [lastPolled]);

  const progress = lastPolled ? Math.min((Date.now() - lastPolled) / intervalMs, 1) : 0;
  const secs     = Math.floor(intervalMs / 1000);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.75rem", borderRadius: 50, background: "rgba(255,248,220,0.85)", border: "1px solid rgba(180,140,60,0.25)" }}>
      {/* Mini ring progress */}
      <svg width="14" height="14" viewBox="0 0 14 14">
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(180,140,60,0.22)" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="#5aaa30" strokeWidth="1.5"
          strokeDasharray={`${2 * Math.PI * 5.5}`}
          strokeDashoffset={`${2 * Math.PI * 5.5 * (1 - progress)}`}
          strokeLinecap="round" transform="rotate(-90 7 7)"
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <span style={{ fontSize: "0.64rem", fontWeight: 800, color: "#6a7a50", fontFamily: "'Nunito',sans-serif" }}>
        {label} · next in {Math.max(0, secs - elapsed)}s
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FollowUpSurveys() {
  const auth                  = useAuth();
  const user                  = auth.user;
  // useAuth may expose the token as auth.token, auth.accessToken, or user.token —
  // try all three so this works regardless of how your hook is shaped.
  const token                 = auth.token ?? auth.accessToken ?? user?.token ??
    localStorage.getItem("pawster_token") ?? localStorage.getItem("token") ?? "";
  const [data,    setData]    = useState({ pending: [], completed: [], pending_count: 0 });
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(null);
  const [toast,   setToast]   = useState(null);
  const [tab,     setTab]     = useState("pending");

  // Track when each type was last polled (for the ring indicators)
  const [last7,  setLast7]  = useState(null);
  const [last30, setLast30] = useState(null);

  // Interval refs — managed manually so we can start/stop them dynamically
  // without causing re-renders or stale closure issues
  const interval7Ref  = useRef(null);
  const interval30Ref = useRef(null);

  // ── Core fetcher: fetches both types in one call, merges state, then
  //    starts/stops each interval based on whether that survey type actually
  //    exists for this user (i.e. they have an approved adoption).
  //    Poll for 7-day starts the moment a 7-day survey appears.
  //    Poll for 30-day starts only once a 30-day survey appears (30 days post-approval).
  // ────────────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const res = await makeDjFetch(token)("/api/surveys/user/");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const pending   = json.pending   || [];
          const completed = json.completed || [];

          setData({
            pending,
            completed,
            pending_count: pending.filter(s => new Date(s.scheduled_for) <= Date.now()).length,
          });
          setLast7(Date.now());
          setLast30(Date.now());

          // ── Smart interval management ────────────────────────────────────
          // A survey type is "active" when the user has at least one pending
          // OR upcoming entry of that type — meaning an adoption was approved
          // and the backend has created the survey record.

          const has7Day  = pending.some(s => s.survey_type === "7_day")  ||
                           completed.some(s => s.survey_type === "7_day");
          const has30Day = pending.some(s => s.survey_type === "30_day") ||
                           completed.some(s => s.survey_type === "30_day");

          // 7-day: start 30s interval if surveys exist and not already running
          if (has7Day && !interval7Ref.current) {
            interval7Ref.current = setInterval(() => fetch7DayOnly(), POLL_7DAY);
          }
          // 7-day: stop if no surveys exist
          if (!has7Day && interval7Ref.current) {
            clearInterval(interval7Ref.current);
            interval7Ref.current = null;
          }

          // 30-day: start 60s interval if surveys exist and not already running
          if (has30Day && !interval30Ref.current) {
            interval30Ref.current = setInterval(() => fetch30DayOnly(), POLL_30DAY);
          }
          // 30-day: stop if no surveys exist
          if (!has30Day && interval30Ref.current) {
            clearInterval(interval30Ref.current);
            interval30Ref.current = null;
          }
        }
      }
    } catch { /* silent */ }
    if (isFirstLoad) setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  // (fetch7DayOnly / fetch30DayOnly are defined below and referenced via closure)

  // ── Targeted fetchers called by each interval ────────────────────────────
  // These only replace their own type's slice of state, leaving the other intact.

  const fetch7DayOnly = useCallback(async () => {
    try {
      const res = await makeDjFetch(token)("/api/surveys/user/?type=7_day");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(prev => {
            const keep30  = prev.pending.filter(s => s.survey_type === "30_day");
            const keep30c = prev.completed.filter(s => s.survey_type === "30_day");
            const new7    = (json.pending   || []).filter(s => s.survey_type === "7_day");
            const new7c   = (json.completed || []).filter(s => s.survey_type === "7_day");
            const merged  = [...keep30, ...new7];
            return {
              pending:       merged,
              completed:     [...keep30c, ...new7c],
              pending_count: merged.filter(s => new Date(s.scheduled_for) <= Date.now()).length,
            };
          });
          setLast7(Date.now());
        }
      }
    } catch { /* silent */ }
  }, [token]);

  const fetch30DayOnly = useCallback(async () => {
    try {
      const res = await makeDjFetch(token)("/api/surveys/user/?type=30_day");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(prev => {
            const keep7   = prev.pending.filter(s => s.survey_type === "7_day");
            const keep7c  = prev.completed.filter(s => s.survey_type === "7_day");
            const new30   = (json.pending   || []).filter(s => s.survey_type === "30_day");
            const new30c  = (json.completed || []).filter(s => s.survey_type === "30_day");
            const merged  = [...keep7, ...new30];
            return {
              pending:       merged,
              completed:     [...keep7c, ...new30c],
              pending_count: merged.filter(s => new Date(s.scheduled_for) <= Date.now()).length,
            };
          });
          setLast30(Date.now());
        }
      }
    } catch { /* silent */ }
  }, [token]);

  // ── Bootstrap: one combined fetch on mount + a slow "approval watcher" ───
  // The approval watcher polls /api/surveys/user/ every 30s just to detect
  // when a new survey type appears (i.e. an adoption just got approved).
  // Once detected, the smart interval management above takes over.
  useEffect(() => {
    if (!token) return; // don't poll until authenticated

    // First load — show spinner, fetch everything, start intervals if needed
    fetchAll(true);

    // Approval watcher: checks every 30s for newly approved adoptions that
    // would generate new survey records on the backend.
    // This is the *only* always-on interval — it's cheap (one GET).
    const approvalWatcher = setInterval(() => fetchAll(false), POLL_7DAY);

    return () => {
      clearInterval(approvalWatcher);
      // Clean up any type-specific intervals on unmount
      if (interval7Ref.current)  clearInterval(interval7Ref.current);
      if (interval30Ref.current) clearInterval(interval30Ref.current);
    };
  }, [fetchAll, token]);

  const handleSuccess = () => {
    setToast("Thank you for your feedback! 🐾");
    setTimeout(() => setToast(null), 3500);
    // Refresh everything after submission so intervals re-evaluate
    fetchAll(false);
  };

  const now          = Date.now();
  const dueSurveys   = data.pending.filter(s => new Date(s.scheduled_for) <= now);
  const upcoming     = data.pending.filter(s => new Date(s.scheduled_for) > now);
  const totalPending = dueSurveys.length;

  // Split due surveys by type for display clarity
  const due7Day  = dueSurveys.filter(s => s.survey_type === "7_day");
  const due30Day = dueSurveys.filter(s => s.survey_type === "30_day");

  return (
    <div style={{ minHeight: "100vh", background: "#EDDABB", fontFamily: "'Nunito',sans-serif", color: "#1a2e0a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pdot{0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.4)}50%{box-shadow:0 0 0 6px rgba(90,170,48,0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Mesh background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
        <div style={{ position: "absolute", width: 900, height: 900, top: "-20%", left: "-15%", borderRadius: "50%", background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(120px)", opacity: 0.38 }} />
        <div style={{ position: "absolute", width: 800, height: 800, bottom: "-15%", right: "-15%", borderRadius: "50%", background: "radial-gradient(circle,#B45A22,transparent 70%)", filter: "blur(120px)", opacity: 0.32 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,70,30,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.03) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <Navbar />

      {/* Hero */}
      <div style={{ position: "relative", zIndex: 10, paddingTop: "4rem", paddingBottom: "2.5rem", textAlign: "center", animation: "fadeUp .6s ease both" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: 50, padding: "0.375rem 1rem", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", background: "rgba(28,79,9,0.09)", border: "1px solid rgba(90,170,48,0.32)", color: "#1c4f09" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5aaa30", display: "inline-block", animation: "pdot 2s ease infinite" }} />
          <i className="fas fa-clipboard-list" style={{ fontSize: "0.65rem" }} /> Follow-Up Surveys
        </div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3.5rem)", fontWeight: 900, color: "#1a4a08", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          How's Your <em style={{ fontStyle: "italic", color: "#e07820" }}>New Pet</em> Doing?
        </h1>
        <p style={{ fontWeight: 700, fontSize: "0.95rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.7, color: "#3a5020" }}>
          We check in at 7 and 30 days after adoption to make sure both you and your pet are settling in well.
        </p>

        {/* Poll indicators — only shown when that survey type is active */}
        {!loading && (
          <div style={{ display: "inline-flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            {(data.pending.some(s => s.survey_type === "7_day") || data.completed.some(s => s.survey_type === "7_day")) && (
              <PollIndicator label="7-Day"  intervalMs={POLL_7DAY}  lastPolled={last7}  />
            )}
            {(data.pending.some(s => s.survey_type === "30_day") || data.completed.some(s => s.survey_type === "30_day")) && (
              <PollIndicator label="30-Day" intervalMs={POLL_30DAY} lastPolled={last30} />
            )}
          </div>
        )}

        {/* Stats row */}
        {!loading && (
          <div style={{ display: "inline-flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: "Pending",   value: totalPending,          color: "#1c4f09" },
              { label: "Upcoming",  value: upcoming.length,       color: "#1a5fbf" },
              { label: "Completed", value: data.completed.length, color: "#6a7a50" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "0.625rem 1.25rem", borderRadius: 50, background: "rgba(255,248,220,0.85)", border: "1px solid rgba(180,140,60,0.28)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1rem", color }}>{value}</span>
                <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#6a7a50" }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <i className="fas fa-spinner" style={{ fontSize: "2rem", color: "#1c4f09", animation: "spin .8s linear infinite" }} />
          </div>
        ) : (
          <>
            {/* Due now banner */}
            {totalPending > 0 && (
              <div style={{ padding: "0.875rem 1.125rem", borderRadius: 14, background: "rgba(28,79,9,0.08)", border: "1px solid rgba(90,170,48,0.28)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1c4f09", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  <i className="fas fa-bell" />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "0.9rem", color: "#1a4a08" }}>
                    You have {totalPending} survey{totalPending > 1 ? "s" : ""} ready to fill in
                    {due7Day.length > 0 && due30Day.length > 0 && ` (${due7Day.length} × 7-day, ${due30Day.length} × 30-day)`}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#5a7a40", marginTop: "0.1rem" }}>
                    Your feedback helps us improve our adoption process for everyone.
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            {(data.completed.length > 0 || upcoming.length > 0) && (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {[
                  { key: "pending",   label: "Due Now",   count: totalPending },
                  { key: "upcoming",  label: "Upcoming",  count: upcoming.length },
                  { key: "completed", label: "Completed", count: data.completed.length },
                ].map(({ key, label, count }) => (
                  <button key={key} onClick={() => setTab(key)}
                    style={{ padding: "0.5rem 1rem", borderRadius: 50, fontWeight: 900, fontSize: "0.8rem", cursor: "pointer", fontFamily: "'Nunito',sans-serif", transition: "all 0.2s", border: `1px solid ${tab === key ? "#1c4f09" : "rgba(180,140,60,0.28)"}`, background: tab === key ? "#1c4f09" : "rgba(255,248,220,0.75)", color: tab === key ? "#fff" : "#3a5020", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {label}
                    {count > 0 && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 900, minWidth: 18, height: 18, borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", background: tab === key ? "rgba(255,255,255,0.25)" : "rgba(28,79,9,0.12)", color: tab === key ? "#fff" : "#1c4f09" }}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Due Now — grouped by type */}
            {tab === "pending" && (
              dueSurveys.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* 7-Day group */}
                  {due7Day.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div style={{ height: 3, width: 20, borderRadius: 2, background: TYPE_INFO["7_day"].color }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: TYPE_INFO["7_day"].color }}>
                          7-Day Surveys <span style={{ opacity: 0.6 }}>· polls every 30s</span>
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
                        {due7Day.map(s => <SurveyCard key={s.id} survey={s} onOpen={setActive} />)}
                      </div>
                    </div>
                  )}
                  {/* 30-Day group */}
                  {due30Day.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div style={{ height: 3, width: 20, borderRadius: 2, background: TYPE_INFO["30_day"].color }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: TYPE_INFO["30_day"].color }}>
                          30-Day Surveys <span style={{ opacity: 0.6 }}>· polls every 60s</span>
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
                        {due30Day.map(s => <SurveyCard key={s.id} survey={s} onOpen={setActive} />)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 18, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)" }}>
                  <i className="fas fa-check-circle" style={{ fontSize: "3rem", color: "#5aaa30", opacity: 0.5, display: "block", marginBottom: "1rem" }} />
                  <p style={{ fontWeight: 700, fontSize: "1rem", color: "#3a5020", margin: "0 0 0.4rem" }}>All caught up!</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6a7a50", margin: 0 }}>No surveys due right now.</p>
                </div>
              )
            )}

            {/* Upcoming */}
            {tab === "upcoming" && (
              upcoming.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {upcoming.map(s => <UpcomingCard key={s.id} survey={s} />)}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 18, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)" }}>
                  <i className="fas fa-calendar" style={{ fontSize: "3rem", color: "#b4903a", opacity: 0.4, display: "block", marginBottom: "1rem" }} />
                  <p style={{ fontWeight: 700, fontSize: "1rem", color: "#3a5020", margin: 0 }}>No upcoming surveys scheduled.</p>
                </div>
              )
            )}

            {/* Completed */}
            {tab === "completed" && (
              data.completed.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
                  {data.completed.map(s => <SurveyCard key={s.id} survey={s} onOpen={() => {}} />)}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: 18, border: "1px solid rgba(180,140,60,0.28)", background: "rgba(255,248,225,0.75)" }}>
                  <i className="fas fa-clipboard-list" style={{ fontSize: "3rem", color: "#1c4f09", opacity: 0.3, display: "block", marginBottom: "1rem" }} />
                  <p style={{ fontWeight: 700, fontSize: "1rem", color: "#3a5020", margin: "0 0 0.4rem" }}>No completed surveys yet.</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6a7a50", margin: 0 }}>Surveys appear here 7 and 30 days after your adoption is approved.</p>
                </div>
              )
            )}
          </>
        )}
        
      </div>


      {active && <SurveyModal survey={active} onClose={() => setActive(null)} onSuccess={handleSuccess} token={token} />}

      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "0.75rem 1.25rem", borderRadius: 12, fontWeight: 800, fontSize: "0.85rem", background: "#1c4f09", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.5rem", animation: "fadeUp .25s ease both", whiteSpace: "nowrap" }}>
          <i className="fas fa-check-circle" /> {toast}
        </div>
      )}
      
                 <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <div className="mb-2">
              <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
            </div>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">
              Paw<em className="italic text-[#e07820]">ster</em>
            </div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
              Screening, placing, and supporting animal adoptions across the Ilocos Region with care and accountability.
            </p>
          </div>
          {[
            { title: "Adopt",    links: [["Browse Animals", "/pets"], ["My Profile", "/profile"], ["Log In", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How It Works", "/how-it-works"], ["Rehome a Pet", "/rehome"], ["Missing Pets", "/missing-pets"], ["About Us", "/about"]] },
            { title: "Regions",  links: [["Ilocos Norte", "/pets"], ["Ilocos Sur", "/pets"], ["La Union", "/pets"], ["Pangasinan", "/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">{title}</div>
              {links.map(([label, to]) => (
                <Link key={label} to={to} className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline">{label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f", "fab fa-instagram", "fab fa-twitter"].map(icon => (
              <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition">
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>

    
  );
}