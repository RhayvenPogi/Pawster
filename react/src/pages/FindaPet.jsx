import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from "./Navbar";
import logo from "../images/logo.png";

const API_BASE  = import.meta.env.VITE_API_BASE   ?? "http://localhost:8080";
const DJANGO    = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8082";

const STATUS_STYLE = {
  Available: { bg: "rgba(88,139,65,0.88)",  text: "#fff" },
  Pending:   { bg: "rgba(180,90,34,0.88)",  text: "#fff" },
  Adopted:   { bg: "rgba(100,100,100,0.8)", text: "#fff" },
};
const TYPE_EMOJI = { Dog: "🐕", Cat: "🐈", Bird: "🐦", Rabbit: "🐇" };
const STEPS = ["Contact", "Home", "Pets", "Time & Money", "Agreement"];

// ─── helpers ───
function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function djFetch(path, opts = {}) {
  const token = getToken();
  return fetch(`${DJANGO}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
}

/**
 * Resolve a photo URL from a Spring Boot animal object.
 * Spring Boot may return the photo under different field names depending
 * on the entity mapping. We try them all in priority order.
 */
function resolvePhotoUrl(a) {
  // Try every common field name Spring Boot might use
  const raw =
    a.photoUrl    ||   // camelCase JPA
    a.photo_url   ||   // snake_case
    a.photo       ||   // short form
    a.imageUrl    ||
    a.image_url   ||
    a.imgUrl      ||
    null;

  if (!raw) return null;

  // Already a data-URL or absolute URL — use as-is
  if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  // Relative path — prepend Spring Boot base
  return `${API_BASE}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

// ─── Reveal hook ───
function useReveal(delay = 0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.1 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis, delay];
}

// ─── Toast ───
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{ position:"fixed", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)", zIndex:9999, display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.75rem 1.25rem", borderRadius:12, fontWeight:800, fontSize:"0.85rem", boxShadow:"0 8px 32px rgba(0,0,0,0.25)", background:type==="err"?"#c03030":"#1c4f09", color:"#fff", animation:"fadeUp .25s ease both", fontFamily:"'Nunito',sans-serif" }}>
      <i className={"fas " + (type === "err" ? "fa-times-circle" : "fa-check-circle")} />
      {message}
    </div>
  );
}

// ─── Shared modal input styles (module-level = stable references) ───
const mInp = { background:"rgba(255,250,232,0.7)", color:"#1a2e0a", fontFamily:"'Nunito',sans-serif", borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.88rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)", width:"100%" };
const mFocIn  = (e) => { e.target.style.borderColor="#5aaa30"; e.target.style.boxShadow="0 0 0 3px rgba(90,170,48,0.12)"; };
const mFocOut = (e) => { e.target.style.borderColor="rgba(180,140,60,0.28)"; e.target.style.boxShadow="none"; };
const mg2 = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" };
const mcol = { display:"flex", flexDirection:"column", gap:"0.75rem" };

// ─── Modal sub-components (module-level = stable references, no focus loss) ───
const MLabel = ({ children, prefill }) => (
  <label style={{ fontSize:"0.69rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6a7a50", display:"flex", alignItems:"center", gap:"0.35rem", marginBottom:"0.25rem" }}>
    {children}
    {prefill && <span style={{ fontSize:"0.65rem", background:"rgba(90,170,48,0.15)", color:"#1c7a09", borderRadius:4, padding:"0 5px", fontWeight:800 }}>✓ pre-filled</span>}
  </label>
);

const MField = ({ label, prefill, col, children }) => (
  <div style={{ display:"flex", flexDirection:"column", gridColumn:col==="full"?"1/-1":undefined }}>
    <MLabel prefill={prefill}>{label}</MLabel>
    {children}
  </div>
);

const MSel = ({ value, onChange, opts, req = true }) => (
  <select value={value} onChange={onChange} required={req} style={mInp} onFocus={mFocIn} onBlur={mFocOut}>
    <option value="">Select…</option>
    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

const MYN = ({ value, onChange }) => (
  <div style={{ display:"flex", gap:"0.5rem" }}>
    {[["yes","Yes"],["no","No"]].map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        style={{ flex:1, padding:"0.55rem", borderRadius:9, fontWeight:800, fontSize:"0.82rem", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
          border:`1px solid ${value===v?"#1c4f09":"rgba(180,140,60,0.28)"}`,
          background:value===v?"#1c4f09":"rgba(255,250,232,0.7)",
          color:value===v?"#fff":"#3a5020" }}>
        {l}
      </button>
    ))}
  </div>
);

const MSecTitle = ({ icon, title }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.4rem 0", borderBottom:"1px solid rgba(180,140,60,0.18)", marginBottom:"0.5rem" }}>
    <i className={`fas fa-${icon}`} style={{ color:"#5aaa30", fontSize:"0.8rem" }} />
    <span style={{ fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color:"#1c4f09" }}>{title}</span>
  </div>
);

// ─── Adopt Modal step content (module-level) ───
function AdoptStepContent({ step, form, set, setV, animal }) {
  const prefilled = {
    name:    !!(form._prefill_name),
    phone:   !!(form._prefill_phone),
    email:   !!(form._prefill_email),
    address: !!(form._prefill_address),
  };

  return (
    <>
      {step === 1 && (
        <div style={mcol}>
          <MSecTitle icon="user" title="Contact Details" />
          <div style={mg2}>
            <MField label="Full Name *" prefill={prefilled.name}>
              <input type="text" required value={form.name} onChange={set("name")} placeholder="Your full name"
                style={{ ...mInp, borderLeft: prefilled.name ? "3px solid rgba(90,170,48,0.5)" : undefined }}
                onFocus={mFocIn} onBlur={mFocOut} />
            </MField>
            <MField label="Phone *" prefill={prefilled.phone}>
              <input type="tel" required value={form.phone} onChange={set("phone")} placeholder="+63 9XX XXX XXXX"
                style={{ ...mInp, borderLeft: prefilled.phone ? "3px solid rgba(90,170,48,0.5)" : undefined }}
                onFocus={mFocIn} onBlur={mFocOut} />
            </MField>
          </div>
          <MField label="Email *" prefill={prefilled.email}>
            <input type="email" required value={form.email} onChange={set("email")} placeholder="you@email.com"
              style={{ ...mInp, borderLeft: prefilled.email ? "3px solid rgba(90,170,48,0.5)" : undefined }}
              onFocus={mFocIn} onBlur={mFocOut} />
          </MField>
          <MField label="Address *" prefill={prefilled.address} col="full">
            <input type="text" required value={form.address} onChange={set("address")} placeholder="Complete home address"
              style={{ ...mInp, borderLeft: prefilled.address ? "3px solid rgba(90,170,48,0.5)" : undefined }}
              onFocus={mFocIn} onBlur={mFocOut} />
          </MField>
          <MSecTitle icon="heart" title={`Why ${animal.name}?`} />
          <MField label={`Why do you want to adopt ${animal.name}? *`} col="full">
            <textarea required value={form.reason} onChange={set("reason")} rows={3}
              placeholder={`Tell us why ${animal.name} is the right pet for you…`}
              style={{ ...mInp, resize:"vertical", minHeight:80 }} onFocus={mFocIn} onBlur={mFocOut} />
          </MField>
          <div style={mg2}>
            <MField label="Previous pet owner? *">
              <MYN value={form.previousPet} onChange={(v) => setV("previousPet", v)} />
            </MField>
            <MField label="Primary caregiver *">
              <MSel value={form.primaryCaregiver} onChange={set("primaryCaregiver")}
                opts={[["Self","Self"],["Family member","Family member"],["Shared responsibility","Shared responsibility"]]} />
            </MField>
          </div>
          {form.previousPet === "yes" && (
            <MField label="What happened to your previous pet?">
              <input type="text" value={form.previousPetDetails} onChange={set("previousPetDetails")}
                placeholder="Brief description…" style={mInp} onFocus={mFocIn} onBlur={mFocOut} />
            </MField>
          )}
        </div>
      )}

      {step === 2 && (
        <div style={mcol}>
          <MSecTitle icon="home" title="Home & Living Situation" />
          <div style={mg2}>
            <MField label="Housing type *">
              <MSel value={form.housing} onChange={set("housing")}
                opts={[["House with yard","House with yard"],["Apartment","Apartment"],["Condo","Condo"],["Other","Other"]]} />
            </MField>
            <MField label="Own or rent? *">
              <MSel value={form.ownsHome} onChange={set("ownsHome")} opts={[["own","Own"],["rent","Rent"]]} />
            </MField>
          </div>
          {form.ownsHome === "rent" && (
            <MField label="Pet permission from landlord?">
              <MYN value={form.petPermission} onChange={(v) => setV("petPermission", v)} />
            </MField>
          )}
          <MField label="Pet space *">
            <MSel value={form.petSpace} onChange={set("petSpace")}
              opts={[["Fully fenced yard","Fully fenced yard"],["Indoor-only space","Indoor-only space"],["Partially secured area","Partially secured area"],["Not yet prepared","Not yet prepared"]]} />
          </MField>
          <div style={mg2}>
            <MField label="Household size *">
              <MSel value={form.householdSize} onChange={set("householdSize")}
                opts={[["1-2","1–2 people"],["3-5","3–5 people"],["6+","6+ people"]]} />
            </MField>
            <MField label="Children in home? *">
              <MYN value={form.hasChildren} onChange={(v) => setV("hasChildren", v)} />
            </MField>
          </div>
          {form.hasChildren === "yes" && (
            <MField label="Children's age range">
              <MSel value={form.childrenAges} onChange={set("childrenAges")} req={false}
                opts={[["0-5","0–5 years"],["6-12","6–12 years"],["13+","13+ years"]]} />
            </MField>
          )}
        </div>
      )}

      {step === 3 && (
        <div style={mcol}>
          <MSecTitle icon="dog" title="Current Pets" />
          <MField label="Do you currently have other pets? *">
            <MYN value={form.hasOtherPets} onChange={(v) => setV("hasOtherPets", v)} />
          </MField>
          {form.hasOtherPets === "yes" && (
            <>
              <MField label="What type & how many?">
                <input type="text" value={form.otherPetsDetail} onChange={set("otherPetsDetail")}
                  placeholder="e.g. 1 dog, 2 cats…" style={mInp} onFocus={mFocIn} onBlur={mFocOut} />
              </MField>
              <MField label="Are your current pets vaccinated? *">
                <MYN value={form.otherPetsVaccinated} onChange={(v) => setV("otherPetsVaccinated", v)} />
              </MField>
              <MField label="How will you introduce the new pet?">
                <textarea value={form.introductionPlan} onChange={set("introductionPlan")} rows={2}
                  placeholder="Describe your plan for introducing them…"
                  style={{ ...mInp, resize:"vertical", minHeight:60 }} onFocus={mFocIn} onBlur={mFocOut} />
              </MField>
            </>
          )}
          {form.hasOtherPets === "no" && (
            <div style={{ padding:"0.75rem 1rem", borderRadius:12, background:"rgba(28,79,9,0.06)", border:"1px solid rgba(90,170,48,0.2)", fontSize:"0.82rem", fontWeight:700, color:"#3a5020" }}>
              <i className="fas fa-check-circle" style={{ color:"#5aaa30", marginRight:"0.5rem" }} />
              No current pets — {animal.name} will be your first companion!
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div style={mcol}>
          <MSecTitle icon="clock" title="Time & Experience" />
          <div style={mg2}>
            <MField label="Pet experience *">
              <MSel value={form.exp} onChange={set("exp")}
                opts={[["First time owner","First time owner"],["Some experience","Some experience"],["Very experienced","Very experienced"]]} />
            </MField>
            <MField label="Hours alone daily *">
              <MSel value={form.aloneHours} onChange={set("aloneHours")}
                opts={[["0-2 hours","0–2 hours"],["3-5 hours","3–5 hours"],["6-8 hours","6–8 hours"],["More than 8 hours","More than 8 hours"]]} />
            </MField>
          </div>
          <MField label="Who cares for the pet when unavailable? *">
            <MSel value={form.backupCare} onChange={set("backupCare")}
              opts={[["Family","Family"],["Friend","Friend"],["Pet sitter","Pet sitter"],["No plan yet","No plan yet"]]} />
          </MField>
          <MSecTitle icon="peso-sign" title="Financial Readiness" />
          <MField label="Monthly budget for pet care *">
            <MSel value={form.budget} onChange={set("budget")}
              opts={[["1000-3000","₱1,000–₱3,000"],["3001-6000","₱3,001–₱6,000"],["6000+","₱6,000+"]]} />
          </MField>
          <MField label="What will you do if the pet gets sick? *">
            <textarea required value={form.vetPlan} onChange={set("vetPlan")} rows={2}
              placeholder="Describe your plan for emergency vet care…"
              style={{ ...mInp, resize:"vertical", minHeight:60 }} onFocus={mFocIn} onBlur={mFocOut} />
          </MField>
          <MSecTitle icon="hands-helping" title="Responsibility" />
          <MField label="If behavior issues arise, what would you do first? *">
            <MSel value={form.behaviorResponse} onChange={set("behaviorResponse")}
              opts={[["Seek professional help","Seek professional help (vet/trainer)"],["Ask shelter for guidance","Ask shelter for guidance"],["Manage on my own","Try to manage on my own"],["Not sure","Not sure"]]} />
          </MField>
          <MField label="Open to post-adoption guidance from our shelter? *">
            <MYN value={form.openToGuidance} onChange={(v) => setV("openToGuidance", v)} />
          </MField>
        </div>
      )}

      {step === 5 && (
        <div style={mcol}>
          <MSecTitle icon="file-signature" title="Commitment Agreement" />
          <p style={{ fontSize:"0.82rem", fontWeight:700, color:"#6a7a50", lineHeight:1.65, margin:"0 0 0.25rem" }}>
            All four boxes must be checked before you can submit.
          </p>
          {[
            ["agreeProperCare", "I agree to provide proper food, shelter, veterinary care, and a safe environment for the pet."],
            ["agreeLongTerm",   "I understand adopting a pet is a long-term responsibility for their entire lifetime."],
            ["agreeNoAbandon",  "I will not neglect, abuse, or abandon the pet under any circumstances."],
            ["agreeFollowup",   "I agree to participate in follow-up check-ins at 7 days and 30 days after adoption."],
          ].map(([k, label]) => (
            <label key={k} style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.875rem 1rem", borderRadius:12, background:form[k]?"rgba(28,79,9,0.07)":"rgba(255,248,220,0.6)", border:`1px solid ${form[k]?"rgba(90,170,48,0.35)":"rgba(180,140,60,0.28)"}`, cursor:"pointer", transition:"all 0.2s" }}>
              <input type="checkbox" checked={form[k]} onChange={set(k)} style={{ width:18, height:18, accentColor:"#1c4f09", marginTop:2, flexShrink:0, cursor:"pointer" }} />
              <span style={{ fontSize:"0.85rem", fontWeight:700, color:"#3a5020", lineHeight:1.6 }}>{label}</span>
              {form[k] && <i className="fas fa-check-circle" style={{ color:"#5aaa30", marginLeft:"auto", marginTop:2, flexShrink:0 }} />}
            </label>
          ))}
          {!(form.agreeProperCare && form.agreeLongTerm && form.agreeNoAbandon && form.agreeFollowup) && (
            <div style={{ padding:"0.625rem 0.875rem", borderRadius:10, background:"rgba(224,120,32,0.08)", border:"1px solid rgba(224,120,32,0.25)", fontSize:"0.8rem", fontWeight:700, color:"#b05010" }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight:"0.4rem" }} />
              All four agreements are required to submit.
            </div>
          )}
          <div style={{ padding:"0.875rem 1rem", borderRadius:12, background:"rgba(28,79,9,0.06)", border:"1px solid rgba(90,170,48,0.22)" }}>
            <div style={{ fontSize:"0.78rem", fontWeight:900, color:"#1c4f09", marginBottom:"0.4rem" }}>
              <i className="fas fa-info-circle" style={{ marginRight:"0.4rem" }} />What happens after approval?
            </div>
            <p style={{ fontSize:"0.79rem", fontWeight:700, color:"#3a5020", lineHeight:1.65, margin:0 }}>
              Our team will contact you within 24–48 hours to arrange the handover.
              You'll receive follow-up check-ins at <strong>7 days</strong> and <strong>30 days</strong> to ensure {animal.name} is settling in well.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Review Details Modal ───
function ReviewDetailsModal({ animal, user, onContinue, onClose }) {
  const fields = [
    ["user",           "Full Name", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(), !!(user?.firstName || user?.lastName)],
    ["envelope",       "Email",     user?.email,   !!user?.email],
    ["phone",          "Phone",     user?.phone,   !!user?.phone],
    ["map-marker-alt", "Address",   user?.address, !!user?.address],
  ];
  const allFilled = fields.every(([,,, ok]) => ok);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", background:"rgba(10,6,2,0.65)", backdropFilter:"blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"100%", maxWidth:480, borderRadius:20, overflow:"hidden", border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,252,235,0.98)", boxShadow:"0 24px 64px rgba(40,20,5,0.45)", animation:"modalIn .28s cubic-bezier(.22,.68,0,1.15) both" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"1.25rem 1.5rem", borderBottom:"1px solid rgba(180,140,60,0.22)", background:"linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))" }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#e07820,#c05010)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <i className="fas fa-clipboard-check" />
          </div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1rem", color:"#1a4a08" }}>Review Your Details</div>
            <div style={{ fontSize:"0.72rem", fontWeight:700, color:"#6a7a50" }}>Before adopting {animal.name}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", width:32, height:32, borderRadius:8, border:"1px solid rgba(192,48,48,0.2)", background:"rgba(192,48,48,0.08)", color:"#c03030", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ padding:"1.25rem 1.5rem" }}>
          <div style={{ padding:"0.75rem 1rem", borderRadius:12, background:"rgba(224,120,32,0.08)", border:"1px solid rgba(224,120,32,0.25)", marginBottom:"1rem", display:"flex", gap:"0.625rem" }}>
            <i className="fas fa-info-circle" style={{ color:"#e07820", flexShrink:0, marginTop:"0.1rem" }} />
            <p style={{ fontSize:"0.82rem", fontWeight:700, lineHeight:1.6, color:"#6a3a10", margin:0 }}>
              Your registered details will be pre-filled in the adoption form. The shelter uses this to contact you.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1.25rem" }}>
            {fields.map(([icon, label, value, ok]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.6rem 0.875rem", borderRadius:10, background:ok?"rgba(28,79,9,0.06)":"rgba(192,48,48,0.06)", border:`1px solid ${ok?"rgba(90,170,48,0.25)":"rgba(192,48,48,0.2)"}` }}>
                <i className={`fas fa-${icon}`} style={{ color:ok?"#5aaa30":"#c03030", width:16, textAlign:"center", fontSize:"0.85rem" }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.67rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6a7a50" }}>{label}</div>
                  <div style={{ fontSize:"0.84rem", fontWeight:700, color:ok?"#1a4a08":"#c03030", marginTop:1 }}>
                    {ok ? value : "Not set — you can fill this in the form"}
                  </div>
                </div>
                <i className={`fas fa-${ok?"check-circle":"exclamation-circle"}`} style={{ color:ok?"#5aaa30":"#c03030", fontSize:"0.9rem" }} />
              </div>
            ))}
          </div>
          {!allFilled && (
            <div style={{ padding:"0.625rem 0.875rem", borderRadius:10, background:"rgba(192,48,48,0.07)", border:"1px solid rgba(192,48,48,0.18)", marginBottom:"1rem", fontSize:"0.8rem", fontWeight:700, color:"#a02020" }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight:"0.4rem" }} />
              Some details are missing. You can fill them in the form, or update your profile for future adoptions.
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem" }}>
            <button onClick={onClose} style={{ padding:"0.75rem", borderRadius:12, fontWeight:900, fontSize:"0.86rem", background:"rgba(255,248,220,0.75)", border:"1px solid rgba(180,140,60,0.28)", color:"#3a5020", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
              <i className="fas fa-arrow-left" /> Go Back
            </button>
            <button onClick={onContinue} style={{ padding:"0.75rem", borderRadius:12, fontWeight:900, fontSize:"0.86rem", color:"#fff", background:"#1c4f09", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 5px 20px rgba(28,79,9,0.32)", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
              <i className="fas fa-arrow-right" /> Continue
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

// ─── 5-Step Adopt Modal ───
function AdoptModal({ animal, user, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    _prefill_name:    !![user?.firstName, user?.lastName].filter(Boolean).join(" "),
    _prefill_phone:   !!user?.phone,
    _prefill_email:   !!user?.email,
    _prefill_address: !!user?.address,
    name:    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "",
    phone:   user?.phone    || "",
    email:   user?.email    || "",
    address: user?.address  || "",
    reason: "",
    previousPet: "",
    previousPetDetails: "",
    primaryCaregiver: "",
    housing:       user?.housing || "",
    ownsHome:      "",
    petPermission: "",
    petSpace:      "",
    householdSize: "",
    hasChildren:   "",
    childrenAges:  "",
    hasOtherPets:        "",
    otherPetsDetail:     "",
    otherPetsVaccinated: "",
    introductionPlan:    "",
    exp:              user?.petExperience || "",
    aloneHours:       "",
    backupCare:       "",
    budget:           "",
    vetPlan:          "",
    behaviorResponse: "",
    openToGuidance:   "",
    agreeProperCare: false,
    agreeLongTerm:   false,
    agreeNoAbandon:  false,
    agreeFollowup:   false,
  });

  const set  = useCallback((k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value })), []);
  const setV = useCallback((k, v) => setForm((f) => ({ ...f, [k]: v })), []);

  const allAgreed = form.agreeProperCare && form.agreeLongTerm && form.agreeNoAbandon && form.agreeFollowup;

  const submit = async () => {
    if (!allAgreed) { onSuccess("Please check all agreement boxes.", "err"); return; }
    setLoading(true);
    try {
      const res = await djFetch("/api/approvals/adoptions/", {
        method: "POST",
        body: JSON.stringify({
          animal_id:             animal.id,
          animal_name:           animal.name,
          name:                  form.name,
          phone:                 form.phone,
          email:                 form.email,
          address:               form.address,
          reason:                form.reason,
          previous_pet:          form.previousPet === "yes",
          previous_pet_details:  form.previousPetDetails,
          primary_caregiver:     form.primaryCaregiver,
          housing:               form.housing,
          owns_home:             form.ownsHome === "own",
          pet_permission:        form.petPermission === "yes",
          pet_space:             form.petSpace,
          household_size:        form.householdSize,
          has_children:          form.hasChildren === "yes",
          children_ages:         form.childrenAges,
          has_other_pets:        form.hasOtherPets === "yes",
          other_pets_detail:     form.otherPetsDetail,
          other_pets_vaccinated: form.otherPetsVaccinated === "yes",
          introduction_plan:     form.introductionPlan,
          exp:                   form.exp,
          alone_hours:           form.aloneHours,
          backup_care:           form.backupCare,
          budget:                form.budget,
          vet_plan:              form.vetPlan,
          behavior_response:     form.behaviorResponse,
          open_to_guidance:      form.openToGuidance === "yes",
          agree_proper_care:     form.agreeProperCare,
          agree_long_term:       form.agreeLongTerm,
          agree_no_abandon:      form.agreeNoAbandon,
          agree_followup:        form.agreeFollowup,
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { /* empty body */ }
      if (res.ok && data.success !== false) {
        onSuccess("Request submitted! We'll be in touch soon 🐾");
        onClose();
      } else if (res.status === 401) {
        onSuccess("Session expired — please log in again.", "err");
      } else {
        onSuccess(data.message || `Error submitting (${res.status})`, "err");
      }
    } catch {
      onSuccess("Server error. Please try again.", "err");
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", background:"rgba(10,6,2,0.65)", backdropFilter:"blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"100%", maxWidth:580, borderRadius:20, overflow:"hidden", border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,252,235,0.98)", boxShadow:"0 24px 64px rgba(40,20,5,0.45)", animation:"modalIn .28s cubic-bezier(.22,.68,0,1.15) both", display:"flex", flexDirection:"column", maxHeight:"90vh" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"1rem 1.25rem", borderBottom:"1px solid rgba(180,140,60,0.22)", background:"linear-gradient(135deg,rgba(28,79,9,0.08),rgba(90,170,48,0.05))", flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"#1c4f09", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <i className="fas fa-heart" />
          </div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1rem", color:"#1a4a08" }}>Adopt {animal.name}</div>
            <div style={{ fontSize:"0.7rem", fontWeight:700, color:"#6a7a50" }}>Step {step} of {STEPS.length} — {STEPS[step - 1]}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", width:30, height:30, borderRadius:8, border:"1px solid rgba(192,48,48,0.2)", background:"rgba(192,48,48,0.08)", color:"#c03030", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div style={{ display:"flex", gap:0, flexShrink:0 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex:1, height:3, background:step > i ? "#1c4f09" : "rgba(180,140,60,0.20)", transition:"background 0.3s" }} />
          ))}
        </div>
        <div style={{ padding:"1rem 1.25rem", overflowY:"auto", flex:1 }}>
          <AdoptStepContent step={step} form={form} set={set} setV={setV} animal={animal} />
        </div>
        <div style={{ padding:"0.875rem 1.25rem", borderTop:"1px solid rgba(180,140,60,0.18)", display:"flex", gap:"0.625rem", flexShrink:0, background:"rgba(255,252,235,0.95)" }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              style={{ padding:"0.7rem 1.25rem", borderRadius:11, fontWeight:900, fontSize:"0.85rem", background:"rgba(255,248,220,0.75)", border:"1px solid rgba(180,140,60,0.28)", color:"#3a5020", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <i className="fas fa-arrow-left" /> Back
            </button>
          )}
          {step < STEPS.length ? (
            <button type="button" onClick={() => setStep((s) => s + 1)}
              style={{ flex:1, padding:"0.7rem", borderRadius:11, fontWeight:900, fontSize:"0.88rem", color:"#fff", background:"#1c4f09", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 16px rgba(28,79,9,0.28)", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
              Next <i className="fas fa-arrow-right" />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={loading || !allAgreed}
              style={{ flex:1, padding:"0.7rem", borderRadius:11, fontWeight:900, fontSize:"0.88rem", color:"#fff", background:loading || !allAgreed ? "#5a8a40" : "#1c4f09", border:"none", cursor:loading || !allAgreed ? "not-allowed" : "pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 16px rgba(28,79,9,0.28)", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
              {loading
                ? <><i className="fas fa-spinner" style={{ animation:"spin .8s linear infinite" }} /> Submitting…</>
                : <><i className="fas fa-paper-plane" /> Submit Adoption Request</>}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

// ─── Animal Card ───
function AnimalCard({ animal, index, onAdopt }) {
  const [ref, vis] = useReveal();
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const emoji   = TYPE_EMOJI[animal.type] ?? "🐾";
  const st      = STATUS_STYLE[animal.status] ?? STATUS_STYLE.Adopted;
  const isAvail = animal.status === "Available";

  // ── Resolve photo from whatever field Spring Boot returned ──
  const photoSrc = animal._resolvedPhotoUrl || null;

  return (
    <div ref={ref}
      style={{ borderRadius:18, overflow:"hidden", border:`1px solid ${hov?"rgba(90,170,48,0.42)":"rgba(180,140,60,0.28)"}`, display:"flex", flexDirection:"column", background:"rgba(255,248,225,0.75)", backdropFilter:"blur(14px)", boxShadow:hov?"0 8px 40px rgba(100,70,20,0.20)":"0 4px 24px rgba(100,70,20,0.13)", transform:vis?(hov?"translateY(-5px)":"translateY(0)"):"translateY(20px)", opacity:vis?1:0, transition:"all 0.3s", transitionDelay:(index%4)*70+"ms", cursor:"pointer" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position:"relative", height:190, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,rgba(255,248,220,0.6),rgba(255,240,200,0.4))", borderBottom:"1px solid rgba(180,140,60,0.28)", overflow:"hidden" }}>
        {/* Emoji placeholder always rendered underneath */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem" }}>{emoji}</div>

        {/* Photo on top — shown only if we have a src and it hasn't errored */}
        {photoSrc && !imgErr && (
          <img
            src={photoSrc}
            alt={animal.name}
            referrerPolicy="no-referrer"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s", transform:hov?"scale(1.06)":"scale(1)" }}
            onError={() => {
              console.warn("[AnimalCard] photo failed to load:", photoSrc?.slice(0, 80));
              setImgErr(true);
            }}
          />
        )}

        <span style={{ position:"absolute", top:10, right:10, padding:"0.2rem 0.6rem", borderRadius:50, fontSize:10, fontWeight:900, textTransform:"uppercase", zIndex:10, background:st.bg, color:st.text }}>{animal.status}</span>
      </div>

      <div style={{ padding:"1rem", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"1.1rem", color:"#1a4a08", lineHeight:1.2 }}>{animal.name}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.72rem", fontWeight:700, color:"#6a7a50", marginTop:"0.25rem" }}>{[animal.type, animal.breed, animal.age, animal.gender].filter(Boolean).join(" · ")}</div>
        {animal.description && <p style={{ fontSize:"0.82rem", fontWeight:700, lineHeight:1.6, marginTop:"0.5rem", flex:1, color:"#3a5020" }}>{animal.description.length > 90 ? animal.description.slice(0,90)+"…" : animal.description}</p>}
        {isAvail ? (
          <button onClick={() => onAdopt(animal)} style={{ width:"100%", marginTop:"0.875rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.5625rem", borderRadius:9, fontSize:"0.78rem", fontWeight:900, border:`1px solid ${hov?"#1c4f09":"rgba(90,170,48,0.3)"}`, background:hov?"#1c4f09":"rgba(28,79,9,0.08)", color:hov?"#fff":"#1c4f09", cursor:"pointer", fontFamily:"'Nunito',sans-serif", transition:"all 0.2s" }}>
            <i className="fas fa-heart" /> Adopt {animal.name}
          </button>
        ) : (
          <div style={{ width:"100%", marginTop:"0.875rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.5625rem", borderRadius:9, fontSize:"0.78rem", fontWeight:900, border:"1px solid rgba(150,150,150,0.25)", background:"rgba(100,100,100,0.07)", color:"#6a7a50", opacity:0.55, fontFamily:"'Nunito',sans-serif" }}>
            <i className="fas fa-clock" /> {animal.status}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter Bar ───
function FilterBar({ search, type, status, onSearch, onType, onStatus, onSubmit, onClear, hasFilters }) {
  const fInp = { background:"rgba(255,250,232,0.7)", borderColor:"rgba(180,140,60,0.28)", color:"#1a2e0a", fontFamily:"'Nunito',sans-serif" };
  const sel  = { ...fInp, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.86rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)" };
  const fFocIn  = (e) => { e.target.style.borderColor="#5aaa30"; e.target.style.boxShadow="0 0 0 3px rgba(90,170,48,0.12)"; };
  const fFocOut = (e) => { e.target.style.borderColor="rgba(180,140,60,0.28)"; e.target.style.boxShadow="none"; };
  return (
    <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap", padding:"1rem 1.25rem", borderRadius:18, border:"1px solid rgba(180,140,60,0.28)", marginBottom:"0.5rem", background:"rgba(255,248,225,0.75)", backdropFilter:"blur(14px)", boxShadow:"0 4px 24px rgba(100,70,20,0.10)" }}>
      <i className="fas fa-search" style={{ color:"#6a7a50", fontSize:"0.85rem", flexShrink:0 }} />
      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name or breed…"
        style={{ ...fInp, flex:1, minWidth:180, borderRadius:10, padding:"0.625rem 0.875rem", fontSize:"0.86rem", fontWeight:600, outline:"none", border:"1px solid rgba(180,140,60,0.28)" }}
        onFocus={fFocIn} onBlur={fFocOut} onKeyDown={(e) => { if (e.key==="Enter") onSubmit(); }} />
      <select value={type} onChange={(e) => onType(e.target.value)} style={sel} onFocus={fFocIn} onBlur={fFocOut}>
        <option value="all">All Types</option>
        {["Dog","Cat","Bird","Rabbit","Other"].map((t) => <option key={t} value={t}>{t}s</option>)}
      </select>
      <select value={status} onChange={(e) => onStatus(e.target.value)} style={sel} onFocus={fFocIn} onBlur={fFocOut}>
        <option value="all">All Status</option>
        {["Available","Pending","Adopted"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={onSubmit} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.625rem 1.25rem", borderRadius:12, fontWeight:900, fontSize:"0.86rem", color:"#fff", background:"#1c4f09", border:"none", cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(28,79,9,0.28)", fontFamily:"'Nunito',sans-serif" }}>
        <i className="fas fa-search" /> Search
      </button>
      {hasFilters && (
        <button onClick={onClear} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.625rem 1rem", borderRadius:12, fontWeight:900, fontSize:"0.86rem", background:"rgba(255,248,220,0.75)", border:"1px solid rgba(180,140,60,0.28)", color:"#3a5020", cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Nunito',sans-serif" }}>
          <i className="fas fa-times" /> Clear
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function FindAPet() {
  const { user } = useAuth();
  const [animals,     setAnimals]  = useState([]);
  const [loading,     setLoading]  = useState(true);
  const [error,       setError]    = useState(null);
  const [search,      setSearch]   = useState("");
  const [type,        setType]     = useState("all");
  const [status,      setStatus]   = useState("all");
  const [adoptTarget, setAdopt]    = useState(null);
  const [showReview,  setReview]   = useState(false);
  const [showForm,    setShowForm] = useState(false);
  const [toast,       setToast]    = useState(null);
  const [totalCount,  setTotal]    = useState(0);

  const fetchAnimals = useCallback(async (q = search, t = type, s = status) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q && q.trim()) params.set("search", q.trim());
      if (t !== "all") params.set("type", t);
      if (s !== "all") params.set("status", s);
      params.set("limit", "50");
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res  = await fetch(`${API_BASE}/api/animals?${params}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list  = Array.isArray(data) ? data : (data.content ?? []);
      const total = Array.isArray(data) ? list.length : (data.totalElements ?? list.length);

      // ── Normalize animals: resolve photo from whichever field Spring Boot uses ──
      const normalized = list.map((a) => {
        const resolved = resolvePhotoUrl(a);
        if (resolved) {
          console.log(`[FindAPet] ${a.name} → photo resolved (${resolved.startsWith("data:") ? `base64 ${Math.round(resolved.length/1024)}KB` : resolved})`);
        } else {
          console.log(`[FindAPet] ${a.name} → no photo. Raw fields: photoUrl=${a.photoUrl}, photo=${a.photo}, photo_url=${a.photo_url}`);
        }
        return { ...a, _resolvedPhotoUrl: resolved };
      });

      setAnimals(normalized);
      setTotal(total);
    } catch {
      setError("Could not load animals. Make sure the Spring Boot server is running.");
      setAnimals([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnimals("", "all", "all"); }, []);

  const handleSubmit      = () => fetchAnimals(search, type, status);
  const handleClear       = () => { setSearch(""); setType("all"); setStatus("all"); fetchAnimals("", "all", "all"); };
  const showToast         = (msg, kind = "ok") => setToast({ message: msg, type: kind });
  const handleAdoptClick  = (animal) => { setAdopt(animal); setReview(true); setShowForm(false); };
  const handleContinue    = () => { setReview(false); setShowForm(true); };
  const handleCloseAll    = () => { setAdopt(null); setReview(false); setShowForm(false); };

  return (
    <div style={{ minHeight:"100vh", background:"#EDDABB", fontFamily:"'Nunito',sans-serif", color:"#1a2e0a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(7%,12%) scale(1.09)}66%{transform:translate(-5%,5%) scale(0.93)}}
        @keyframes fl2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-10%,8%) scale(0.93)}70%{transform:translate(5%,-9%) scale(1.1)}}
        @keyframes fl3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(9%,-7%) scale(1.07)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(90,170,48,.4)}50%{box-shadow:0 0 0 6px rgba(90,170,48,0)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
      `}</style>

      {/* Mesh background */}
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0, background:"#EDDABB" }} />
        {[
          { width:"1000px", height:"1000px", top:"-25%", left:"-18%", background:"radial-gradient(circle,#588B41,transparent 70%)", animation:"fl1 9s ease-in-out infinite" },
          { width:"900px",  height:"900px",  top:"8%",   right:"-20%", background:"radial-gradient(circle,#B45A22,transparent 70%)", animation:"fl2 11s ease-in-out infinite" },
          { width:"800px",  height:"800px",  bottom:"-18%", left:"18%", background:"radial-gradient(circle,#e8dfc8,transparent 60%)", animation:"fl3 8s ease-in-out infinite" },
        ].map((s, i) => <div key={i} style={{ position:"absolute", borderRadius:"50%", filter:"blur(120px)", mixBlendMode:"multiply", opacity:0.48, ...s }} />)}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(100,70,30,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,70,30,.03) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      <Navbar />

      {/* Hero */}
      <div style={{ position:"relative", zIndex:10, paddingTop:"4rem", paddingBottom:"3rem", textAlign:"center", animation:"fadeUp .6s ease both" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", borderRadius:50, padding:"0.375rem 1rem", fontSize:"0.72rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", fontStyle:"italic", marginBottom:"1rem", background:"rgba(28,79,9,0.09)", border:"1px solid rgba(90,170,48,0.32)", color:"#1c4f09" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#5aaa30", display:"inline-block", animation:"pulse-dot 2s ease infinite" }} />
          <i className="fas fa-search" style={{ fontSize:"0.65rem" }} /> Browse Animals
        </div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.6rem,5vw,4.5rem)", fontWeight:900, color:"#1a4a08", lineHeight:1, textShadow:"0 3px 20px rgba(255,255,255,0.4)", marginBottom:"1rem" }}>
          Find Your <em style={{ fontStyle:"italic", color:"#e07820" }}>Forever</em> Friend
        </h1>
        <p style={{ fontWeight:700, fontSize:"1rem", maxWidth:520, margin:"0 auto", lineHeight:1.7, color:"#3a5020" }}>
          All animals are health-checked, vaccinated, and ready for a loving home across the Ilocos Region.
        </p>
      </div>

      {/* Content */}
      <div style={{ position:"relative", zIndex:10, maxWidth:1320, margin:"0 auto", padding:"0 1.5rem 5rem" }}>
        <FilterBar search={search} type={type} status={status} onSearch={setSearch} onType={setType} onStatus={setStatus} onSubmit={handleSubmit} onClear={handleClear} hasFilters={search!==""||type!=="all"||status!=="all"} />

        {!loading && !error && animals.length > 0 && (
          <p style={{ fontSize:"0.82rem", fontWeight:700, color:"#6a7a50", marginBottom:"0.75rem" }}>
            Showing {animals.length}{totalCount > animals.length ? ` of ${totalCount}` : ""} animal{animals.length !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}
          </p>
        )}

        {loading && (
          <div style={{ display:"grid", gap:"1.25rem", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ borderRadius:18, overflow:"hidden", border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,225,0.75)" }}>
                <div style={{ height:190, background:"linear-gradient(90deg,rgba(255,240,200,.4) 25%,rgba(255,250,230,.7) 50%,rgba(255,240,200,.4) 75%)", backgroundSize:"400px 100%", animation:"shimmer 1.4s ease infinite" }} />
                <div style={{ padding:"1rem", display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                  {[["66%","1.25rem"],["100%","0.875rem"],["80%","0.75rem"]].map(([w,h], j) => (
                    <div key={j} style={{ height:h, width:w, borderRadius:6, background:"rgba(180,140,60,.14)", animation:"shimmer 1.4s ease infinite" }} />
                  ))}
                  <div style={{ height:"2.25rem", borderRadius:9, background:"rgba(28,79,9,.08)", animation:"shimmer 1.4s ease infinite", marginTop:"0.25rem" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign:"center", padding:"5rem 2rem", borderRadius:18, border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,225,0.75)" }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize:"3rem", color:"#d4880a", opacity:0.6, display:"block", marginBottom:"1rem" }} />
            <p style={{ fontWeight:700, fontSize:"1rem", color:"#3a5020", marginBottom:"0.25rem" }}>{error}</p>
            <button onClick={() => fetchAnimals(search, type, status)} style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.5rem", borderRadius:12, fontWeight:900, fontSize:"0.88rem", color:"#fff", background:"#1c4f09", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              <i className="fas fa-redo" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && animals.length === 0 && (
          <div style={{ textAlign:"center", padding:"5rem 2rem", borderRadius:18, border:"1px solid rgba(180,140,60,0.28)", background:"rgba(255,248,225,0.75)", boxShadow:"0 4px 24px rgba(100,70,20,0.10)" }}>
            <i className="fas fa-paw" style={{ fontSize:"3rem", color:"#1c4f09", opacity:0.3, display:"block", marginBottom:"1rem" }} />
            <p style={{ fontWeight:700, fontSize:"1rem", color:"#3a5020" }}>No animals found matching your search.</p>
            <button onClick={handleClear} style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 1.5rem", borderRadius:12, fontWeight:900, fontSize:"0.88rem", background:"rgba(255,248,220,0.75)", border:"1px solid rgba(180,140,60,0.28)", color:"#3a5020", cursor:"pointer", marginTop:"1.25rem", fontFamily:"'Nunito',sans-serif" }}>
              <i className="fas fa-times" /> Clear filters
            </button>
          </div>
        )}

        {!loading && !error && animals.length > 0 && (
          <div style={{ display:"grid", gap:"1.25rem", marginTop:"0.25rem", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))" }}>
            {animals.map((a, i) => <AnimalCard key={a.id} animal={a} index={i} onAdopt={handleAdoptClick} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <img src={logo} alt="Pawster" className="w-8 h-8 object-contain mb-2" onError={(e) => (e.target.style.display="none")} />
            <div className="font-black text-[1.2rem] text-[#1a4a08]">Paw<em className="italic text-[#e07820]">ster</em></div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">Connecting loving homes with animals in need across the Ilocos Region since 2023.</p>
          </div>
          {[
            { title:"Adopt",    links:[["Browse Animals","/pets"],["My Profile","/profile"],["Log In","/login"],["Register","/register"]] },
            { title:"Services", links:[["How It Works","/how-it-works"],["Rehome a Pet","/rehome"],["Follow-Up Surveys","/followup-surveys"],["About Us","/about"]] },
            { title:"Regions",  links:[["Ilocos Norte","/pets"],["Ilocos Sur","/pets"],["La Union","/pets"],["Pangasinan","/pets"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-[0.72rem] font-black uppercase tracking-wider text-[#1c4f09] mb-4">{title}</div>
              {links.map(([label, to]) => <Link key={label} to={to} className="block text-[0.83rem] font-bold text-[#3a5020] mb-2 hover:underline">{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="max-w-[1200px] mx-auto pt-6 border-t border-[rgba(180,140,60,0.28)] flex flex-wrap items-center justify-between gap-4">
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in the Ilocos Region.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f","fab fa-instagram","fab fa-twitter"].map((icon) => (
              <a key={icon} href="#" className="w-8 h-8 flex items-center justify-center rounded-md text-[0.8rem] text-[#6a7a50] bg-[rgba(255,250,232,0.7)] border border-[rgba(180,140,60,0.28)] hover:bg-black/5 transition">
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {showReview && adoptTarget && <ReviewDetailsModal animal={adoptTarget} user={user} onContinue={handleContinue} onClose={handleCloseAll} />}
      {showForm && adoptTarget && (
        <AdoptModal
          animal={adoptTarget}
          user={user}
          onClose={handleCloseAll}
          onSuccess={(msg, kind) => {
            showToast(msg, kind);
            handleCloseAll();
            if (!kind || kind === "ok") {
              fetchAnimals(search, type, status);
            }
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}