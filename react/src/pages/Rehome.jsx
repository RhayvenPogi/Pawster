import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../images/logo.png";
import { usePageTitle } from "../hooks/usePageTitle";

const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8000";
function getToken() {
  return (
    localStorage.getItem("pawster_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
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

function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, vis];
}
function Reveal({ children, delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Fields optional for rescue (rescuer may not know these about a stray) ──
const RESCUE_OPTIONAL = new Set([
  "durationOwned",   // Step 1
  "isVaccinated",    // Step 2
  "isNeutered",      // Step 2
  "isLeashTrained",  // Step 3
  "isHouseTrained",  // Step 3
  "goodWithChildren",// Step 3
  "goodWithPets",    // Step 3
]);

function validateStep(step, form) {
  const isRescue = form.requestType === "rescue";
  const errs = {};
  if (step === 1) {
    if (!form.petName.trim()) errs.petName = "Pet's name is required.";
    if (!form.age.trim()) errs.age = "Pet's age is required.";
    if (!isRescue && !form.durationOwned) errs.durationOwned = "Please select how long you've had this pet.";
  }
  if (step === 2) {
    if (!form.isVaccinated) errs.isVaccinated = "Please indicate if the pet is vaccinated.";
    if (!form.isNeutered) errs.isNeutered = "Please indicate if the pet is spayed/neutered.";
  }
  if (step === 3) {
    if (!form.behavior) errs.behavior = "Please select a behavior that best describes your pet.";
    if (!form.hasAggression) errs.hasAggression = "Please indicate if the pet has shown aggression.";
    if (!isRescue && !form.isHouseTrained) errs.isHouseTrained = "Please indicate if the pet is house-trained.";
    if (!isRescue && !form.isLeashTrained) errs.isLeashTrained = "Please indicate if the pet is leash-trained.";
    if (!isRescue && !form.goodWithChildren) errs.goodWithChildren = "Please indicate if the pet is good with children.";
    if (!isRescue && !form.goodWithPets) errs.goodWithPets = "Please indicate if the pet is good with other pets.";
  }
  if (step === 4) {
    if (!form.reason) errs.reason = "Please select a primary reason for rehoming.";
    if (!form.understandsPermanent) errs.understandsPermanent = "Please confirm you understand rehoming is a permanent decision.";
  }
  return errs;
}

const REASONS = [
  { icon: "fas fa-plane-departure", label: "Moving or relocating within CAR" },
  { icon: "fas fa-allergies", label: "Allergies in the household" },
  { icon: "fas fa-baby", label: "New baby or family changes" },
  { icon: "fas fa-briefcase-medical", label: "Medical or financial hardship" },
  { icon: "fas fa-home", label: "No longer pet-friendly housing" },
  { icon: "fas fa-clock", label: "Not enough time to care properly" },
];
const STEPS = ["Pet Info", "Health", "Behavior", "Reason"];

/* ─── Shared style tokens ─────────────────────────────────────────────────── */
const inp = {
  padding: "0.65rem 0.875rem",
  borderRadius: 10,
  border: "1px solid rgba(180,140,60,0.25)",
  background: "rgba(255,253,242,0.8)",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 700,
  fontSize: "0.875rem",
  color: "#1a4a08",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const focIn = (e) => { e.target.style.borderColor = "#5aaa30"; e.target.style.boxShadow = "0 0 0 3px rgba(90,170,48,0.10)"; };
const focOut = (e) => { e.target.style.borderColor = "rgba(180,140,60,0.25)"; e.target.style.boxShadow = "none"; };
const g2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" };
const col = { display: "flex", flexDirection: "column", gap: "0.875rem" };

const RLabel = ({ children }) => (
  <label style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#5a7a40", display: "block", marginBottom: "0.3rem" }}>{children}</label>
);
const RField = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column" }}><RLabel>{label}</RLabel>{children}</div>
);
const RYN = ({ value, onChange, invalid }) => (
  <div style={{ display: "flex", gap: "0.5rem" }}>
    {[["yes", "Yes"], ["no", "No"]].map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        style={{
          flex: 1, padding: "0.6rem", borderRadius: 9, fontWeight: 800, fontSize: "0.82rem",
          cursor: "pointer", fontFamily: "'Nunito',sans-serif",
          border: `1px solid ${value === v ? "#1c4f09" : invalid ? "rgba(192,48,48,0.5)" : "rgba(180,140,60,0.25)"}`,
          background: value === v ? "#1c4f09" : "rgba(255,253,242,0.8)",
          color: value === v ? "#fff" : "#3a5020",
          transition: "all 0.15s",
        }}>
        {l}
      </button>
    ))}
  </div>
);

// Yes / No / Unknown toggle — used for rescue-optional fields
const RYNUnknown = ({ value, onChange, invalid }) => (
  <div style={{ display: "flex", gap: "0.4rem" }}>
    {[["yes", "Yes"], ["no", "No"], ["unknown", "Unknown"]].map(([v, l]) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        style={{
          flex: 1, padding: "0.5rem 0.25rem", borderRadius: 9, fontWeight: 800, fontSize: "0.75rem",
          cursor: "pointer", fontFamily: "'Nunito',sans-serif",
          border: `1px solid ${value === v ? "#1c4f09" : invalid ? "rgba(192,48,48,0.5)" : "rgba(180,140,60,0.25)"}`,
          background: value === v ? (v === "unknown" ? "rgba(120,100,60,0.18)" : "#1c4f09") : "rgba(255,253,242,0.8)",
          color: value === v ? (v === "unknown" ? "#5a4010" : "#fff") : "#3a5020",
          transition: "all 0.15s",
        }}>
        {l}
      </button>
    ))}
  </div>
);

const RSecTitle = ({ icon, title }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: "0.5rem",
    padding: "0.5rem 0.75rem", borderRadius: 10,
    background: "rgba(28,79,9,0.05)", border: "1px solid rgba(90,170,48,0.15)",
    marginBottom: "0.25rem",
  }}>
    <i className={`fas fa-${icon}`} style={{ color: "#B45A22", fontSize: "0.78rem" }} />
    <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#3a5020" }}>{title}</span>
  </div>
);

const InlineErr = ({ msg }) => msg ? (
  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#c03030", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem" }}>
    <i className="fas fa-times-circle" style={{ fontSize: "0.7rem" }} /> {msg}
  </div>
) : null;

// Soft "optional for rescue" badge shown next to field labels
const OptionalBadge = () => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "0.2rem",
    marginLeft: "0.45rem", padding: "0.1rem 0.45rem", borderRadius: 99,
    fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
    background: "rgba(120,100,40,0.10)", color: "#7a6020", border: "1px solid rgba(160,130,40,0.2)",
    verticalAlign: "middle",
  }}>
    optional for rescue
  </span>
);

function PhotoUpload({ photoPreview, onPhotoChange, onPhotoClear }) {
  const fileRef = useRef(null);
  return (
    <RField label="Pet photo (recommended)">
      <div
        onClick={() => !photoPreview && fileRef.current?.click()}
        style={{
          borderRadius: 12,
          border: `1.5px dashed ${photoPreview ? "rgba(90,170,48,0.45)" : "rgba(180,140,60,0.32)"}`,
          background: photoPreview ? "transparent" : "rgba(255,253,242,0.6)",
          overflow: "hidden",
          cursor: photoPreview ? "default" : "pointer",
          position: "relative",
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        {photoPreview ? (
          <>
            <img src={photoPreview} alt="Pet preview" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} />
            <button type="button" onClick={(e) => { e.stopPropagation(); onPhotoClear(); }}
              style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(192,48,48,0.88)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
              <i className="fas fa-times" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              style={{ position: "absolute", bottom: 8, right: 8, padding: "0.3rem 0.7rem", borderRadius: 8, background: "rgba(28,79,9,0.88)", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.72rem", fontWeight: 800, fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <i className="fas fa-camera" /> Change
            </button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "1.25rem", color: "#9aaa80" }}>
            <i className="fas fa-camera" style={{ fontSize: "1.6rem", display: "block", marginBottom: "0.4rem", color: "#B45A22", opacity: 0.65 }} />
            <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#6a7a50" }}>Click to upload a photo</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, marginTop: "0.2rem", color: "#9aaa80" }}>JPG, PNG, WebP · max 5 MB</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={onPhotoChange} />
      </div>
    </RField>
  );
}

function VaccinationPhotos({ photos, onAdd, onRemove }) {
  const fileRef = useRef(null);
  return (
    <div>
      <RLabel>Vaccination record photos (optional)</RLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: "relative", width: 68, height: 68, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(90,170,48,0.4)", flexShrink: 0 }}>
            <img src={src} alt={`Vacc record ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button type="button" onClick={() => onRemove(i)}
              style={{ position: "absolute", top: 2, right: 2, width: 17, height: 17, borderRadius: "50%", background: "rgba(192,48,48,0.9)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.58rem" }}>
              <i className="fas fa-times" />
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ width: 68, height: 68, borderRadius: 10, border: "1.5px dashed rgba(90,170,48,0.38)", background: "rgba(255,253,242,0.5)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.2rem", color: "#6a7a50", flexShrink: 0 }}>
            <i className="fas fa-plus" style={{ fontSize: "0.8rem", color: "#5aaa30" }} />
            <span style={{ fontSize: "0.58rem", fontWeight: 800 }}>Add</span>
          </button>
        )}
      </div>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9aaa80" }}>Upload up to 5 photos of vaccination cards or health records.</div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={onAdd} />
    </div>
  );
}

/* ─── Request type selector shown at the top of Step 1 ───────────────────── */
function RequestTypeToggle({ value, onChange }) {
  const options = [
    {
      v: "rehome",
      icon: "fas fa-home",
      title: "Rehoming",
      desc: "I own this pet and need to find them a new home.",
    },
    {
      v: "rescue",
      icon: "fas fa-hand-holding-heart",
      title: "Rescue / Surrender",
      desc: "I found or rescued this animal and am surrendering them.",
    },
  ];
  return (
    <div>
      <RLabel>What type of request is this? *</RLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        {options.map(({ v, icon, title, desc }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              padding: "0.75rem 0.875rem",
              borderRadius: 12,
              border: `1.5px solid ${value === v
                ? v === "rescue" ? "rgba(90,150,170,0.55)" : "rgba(90,170,48,0.55)"
                : "rgba(180,140,60,0.22)"}`,
              background: value === v
                ? v === "rescue" ? "rgba(60,120,150,0.07)" : "rgba(28,79,9,0.06)"
                : "rgba(255,253,242,0.7)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "'Nunito',sans-serif",
              transition: "all 0.15s",
              boxShadow: value === v ? "0 0 0 3px rgba(90,170,48,0.08)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <i className={icon} style={{
                fontSize: "0.85rem",
                color: value === v ? (v === "rescue" ? "#2a7a9a" : "#1c7a09") : "#9aaa70",
              }} />
              <span style={{
                fontSize: "0.82rem", fontWeight: 900,
                color: value === v ? (v === "rescue" ? "#1a4a5a" : "#1a4a08") : "#5a6a40",
              }}>{title}</span>
              {value === v && (
                <i className="fas fa-check-circle" style={{
                  marginLeft: "auto", fontSize: "0.75rem",
                  color: v === "rescue" ? "#2a7a9a" : "#5aaa30",
                }} />
              )}
            </div>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, color: "#7a8a60", lineHeight: 1.5 }}>{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Rescue context banner shown on Steps 1, 2, 3 when in rescue mode ─────── */
function RescueBanner() {
  return (
    <div style={{
      display: "flex", gap: "0.5rem", alignItems: "flex-start",
      padding: "0.625rem 0.875rem", borderRadius: 10,
      background: "rgba(40,100,140,0.06)", border: "1px solid rgba(60,140,180,0.22)",
    }}>
      <i className="fas fa-info-circle" style={{ color: "#2a7a9a", flexShrink: 0, marginTop: "0.1rem", fontSize: "0.82rem" }} />
      <p style={{ margin: 0, fontSize: "0.76rem", fontWeight: 700, color: "#1a4a5a", lineHeight: 1.6 }}>
        Fields marked <strong>optional for rescue</strong> can be left blank or answered as "Unknown" — it's OK if you don't know the animal's full history.
      </p>
    </div>
  );
}

function RehomeStepContent({ step, form, set, setV, photoPreview, onPhotoChange, onPhotoClear, vaccPhotos, onVaccPhotoAdd, onVaccPhotoRemove, touched, fieldErrors }) {
  const err = (field) => (touched?.[field] ? fieldErrors[field] : null);
  const isRescue = form.requestType === "rescue";

  return (
    <>
      {step === 1 && (
        <div style={col}>
          {/* Request type selector always first */}
          <RequestTypeToggle value={form.requestType} onChange={(v) => setV("requestType", v)} />

          <RSecTitle icon="paw" title="Pet basics" />

          {isRescue && <RescueBanner />}

          <RField label="Pet's name *">
            <input type="text" value={form.petName} onChange={set("petName")}
              style={{ ...inp, borderColor: err("petName") ? "rgba(192,48,48,0.5)" : undefined }}
              onFocus={focIn} onBlur={focOut} placeholder={isRescue ? "e.g. Unknown / Brownie" : "e.g. Coco"} />
            <InlineErr msg={err("petName")} />
          </RField>
          <div style={g2}>
            <RField label="Species *">
              <select value={form.species} onChange={set("species")} style={inp} onFocus={focIn} onBlur={focOut}>
                {["Dog", "Cat", "Rabbit", "Bird", "Other"].map(s => <option key={s}>{s}</option>)}
              </select>
            </RField>
            <RField label="Gender *">
              <select value={form.gender} onChange={set("gender")} style={inp} onFocus={focIn} onBlur={focOut}>
                {["Male", "Female", "Unknown"].map(s => <option key={s}>{s}</option>)}
              </select>
            </RField>
          </div>
          <div style={g2}>
            <RField label="Breed (if known)">
              <input type="text" value={form.breed} onChange={set("breed")} placeholder="e.g. Aspin / Unknown" style={inp} onFocus={focIn} onBlur={focOut} />
            </RField>
            <RField label="Age *">
              <input type="text" value={form.age} onChange={set("age")} placeholder={isRescue ? "e.g. ~1 year (est.)" : "e.g. 2 years"}
                style={{ ...inp, borderColor: err("age") ? "rgba(192,48,48,0.5)" : undefined }}
                onFocus={focIn} onBlur={focOut} />
              <InlineErr msg={err("age")} />
            </RField>
          </div>

          {/* Duration owned — required for rehome, hidden for rescue */}
          {!isRescue && (
            <RField label="How long have you had this pet? *">
              <select value={form.durationOwned} onChange={set("durationOwned")}
                style={{ ...inp, borderColor: err("durationOwned") ? "rgba(192,48,48,0.5)" : undefined }}
                onFocus={focIn} onBlur={focOut}>
                <option value="">Select…</option>
                {[["Less than 6 months", "Less than 6 months"], ["6 months-2 years", "6 months–2 years"], ["2+ years", "2+ years"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <InlineErr msg={err("durationOwned")} />
            </RField>
          )}

          {isRescue && (
            <RField label={<>Where was the animal found? <OptionalBadge /></>}>
              <input type="text" value={form.foundLocation} onChange={set("foundLocation")}
                placeholder="e.g. Session Road, Baguio City" style={inp} onFocus={focIn} onBlur={focOut} />
            </RField>
          )}

          <PhotoUpload photoPreview={photoPreview} onPhotoChange={onPhotoChange} onPhotoClear={onPhotoClear} />
        </div>
      )}

      {step === 2 && (
        <div style={col}>
          <RSecTitle icon="syringe" title="Health information" />

          {/* ── Rescue banner on step 2 ── */}
          {isRescue && <RescueBanner />}

          <div style={g2}>
            {/* Vaccinated — RYNUnknown for rescue, RYN for rehome */}
            <RField label={
              isRescue
                ? <span>Vaccinated? <OptionalBadge /></span>
                : "Vaccinated? *"
            }>
              {isRescue
                ? <RYNUnknown value={form.isVaccinated} onChange={(v) => setV("isVaccinated", v)} invalid={!!err("isVaccinated")} />
                : <RYN value={form.isVaccinated} onChange={(v) => setV("isVaccinated", v)} invalid={!!err("isVaccinated")} />
              }
              <InlineErr msg={err("isVaccinated")} />
            </RField>

            {/* Spayed/neutered — RYNUnknown for rescue, RYN for rehome */}
            <RField label={
              isRescue
                ? <span>Spayed / neutered? <OptionalBadge /></span>
                : "Spayed / neutered? *"
            }>
              {isRescue
                ? <RYNUnknown value={form.isNeutered} onChange={(v) => setV("isNeutered", v)} invalid={!!err("isNeutered")} />
                : <RYN value={form.isNeutered} onChange={(v) => setV("isNeutered", v)} invalid={!!err("isNeutered")} />
              }
              <InlineErr msg={err("isNeutered")} />
            </RField>
          </div>

          {/* Vaccination details — only expand when explicitly "yes" */}
          {form.isVaccinated === "yes" && (
            <div style={{ padding: "0.875rem 1rem", borderRadius: 12, background: "rgba(28,79,9,0.04)", border: "1px solid rgba(90,170,48,0.22)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1c4f09", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="fas fa-shield-virus" style={{ color: "#1c7a09", fontSize: "0.75rem" }} /> Vaccination details
              </div>
              <div style={g2}>
                <RField label="Vaccine type(s)">
                  <input type="text" value={form.vaccineType} onChange={set("vaccineType")} placeholder="e.g. Anti-rabies, 5-in-1" style={inp} onFocus={focIn} onBlur={focOut} />
                </RField>
                <RField label="Last vaccinated">
                  <input type="date" value={form.lastVaccDate} onChange={set("lastVaccDate")} style={inp} onFocus={focIn} onBlur={focOut} />
                </RField>
              </div>
              <RField label="Vet / clinic name">
                <input type="text" value={form.vaccClinic} onChange={set("vaccClinic")} placeholder="e.g. PetMedico Baguio" style={inp} onFocus={focIn} onBlur={focOut} />
              </RField>
              <RField label="Vaccination notes">
                <textarea value={form.vaccNotes} onChange={set("vaccNotes")} rows={2} placeholder="Boosters due, additional info…" style={{ ...inp, resize: "vertical", minHeight: 56 }} onFocus={focIn} onBlur={focOut} />
              </RField>
              <VaccinationPhotos photos={vaccPhotos} onAdd={onVaccPhotoAdd} onRemove={onVaccPhotoRemove} />
              <div style={{ padding: "0.5rem 0.75rem", borderRadius: 9, background: "rgba(224,120,32,0.07)", border: "1px solid rgba(224,120,32,0.22)", fontSize: "0.75rem", fontWeight: 700, color: "#b05010", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                <i className="fas fa-exclamation-triangle" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                Please bring original vaccination records during handover so the new owner can continue care.
              </div>
            </div>
          )}

          {form.isVaccinated === "no" && (
            <div style={{ padding: "0.6rem 0.875rem", borderRadius: 10, background: "rgba(224,120,32,0.06)", border: "1px solid rgba(224,120,32,0.2)", fontSize: "0.78rem", fontWeight: 700, color: "#b05010", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
              <i className="fas fa-info-circle" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
              The new owner will be informed vaccination is pending and may be required before adoption finalizes.
            </div>
          )}

          {/* Unknown vaccination note for rescue */}
          {isRescue && form.isVaccinated === "unknown" && (
            <div style={{ padding: "0.6rem 0.875rem", borderRadius: 10, background: "rgba(40,100,140,0.06)", border: "1px solid rgba(60,140,180,0.2)", fontSize: "0.78rem", fontWeight: 700, color: "#1a4a5a", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
              <i className="fas fa-info-circle" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
              Vaccination status will be assessed by our team upon intake. The adopter will be informed before finalizing.
            </div>
          )}

          <RField label="Known medical conditions">
            <textarea value={form.medicalNotes} onChange={set("medicalNotes")} rows={3} placeholder="Allergies, ongoing treatments, illnesses…" style={{ ...inp, resize: "vertical", minHeight: 72 }} onFocus={focIn} onBlur={focOut} />
          </RField>
        </div>
      )}

      {step === 3 && (
        <div style={col}>
          <RSecTitle icon="star" title="Behavior & personality" />

          {isRescue && <RescueBanner />}

          <div style={g2}>
            <RField label="Best describes this pet *">
              <select value={form.behavior} onChange={set("behavior")}
                style={{ ...inp, borderColor: err("behavior") ? "rgba(192,48,48,0.5)" : undefined }}
                onFocus={focIn} onBlur={focOut}>
                <option value="">Select…</option>
                {["Friendly", "Shy", "Playful", "Aggressive", "Unknown", "Other"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <InlineErr msg={err("behavior")} />
            </RField>
            <RField label="Shown aggression? *">
              <RYN value={form.hasAggression} onChange={(v) => setV("hasAggression", v)} invalid={!!err("hasAggression")} />
              <InlineErr msg={err("hasAggression")} />
            </RField>
          </div>
          {form.behavior === "Other" && (
            <RField label="Describe behavior">
              <input type="text" value={form.behaviorOther} onChange={set("behaviorOther")} style={inp} onFocus={focIn} onBlur={focOut} />
            </RField>
          )}

          {/* House-trained & leash-trained: required for rehome, optional (with Unknown) for rescue */}
          <div style={g2}>
            <RField label={
              isRescue
                ? <span>House-trained? <OptionalBadge /></span>
                : "House-trained? *"
            }>
              {isRescue
                ? <RYNUnknown value={form.isHouseTrained} onChange={(v) => setV("isHouseTrained", v)} invalid={!!err("isHouseTrained")} />
                : <RYN value={form.isHouseTrained} onChange={(v) => setV("isHouseTrained", v)} invalid={!!err("isHouseTrained")} />
              }
              <InlineErr msg={err("isHouseTrained")} />
            </RField>
            <RField label={
              isRescue
                ? <span>Leash-trained? <OptionalBadge /></span>
                : "Leash-trained? *"
            }>
              {isRescue
                ? <RYNUnknown value={form.isLeashTrained} onChange={(v) => setV("isLeashTrained", v)} invalid={!!err("isLeashTrained")} />
                : <RYN value={form.isLeashTrained} onChange={(v) => setV("isLeashTrained", v)} invalid={!!err("isLeashTrained")} />
              }
              <InlineErr msg={err("isLeashTrained")} />
            </RField>
          </div>

          <RSecTitle icon="home" title="Ideal new home" />
          <div style={g2}>
            <RField label={
              isRescue
                ? <span>Good with children? <OptionalBadge /></span>
                : "Good with children? *"
            }>
              {isRescue
                ? <RYNUnknown value={form.goodWithChildren} onChange={(v) => setV("goodWithChildren", v)} invalid={!!err("goodWithChildren")} />
                : <RYN value={form.goodWithChildren} onChange={(v) => setV("goodWithChildren", v)} invalid={!!err("goodWithChildren")} />
              }
              <InlineErr msg={err("goodWithChildren")} />
            </RField>
            <RField label={
              isRescue
                ? <span>Good with other pets? <OptionalBadge /></span>
                : "Good with other pets? *"
            }>
              {isRescue
                ? <RYNUnknown value={form.goodWithPets} onChange={(v) => setV("goodWithPets", v)} invalid={!!err("goodWithPets")} />
                : <RYN value={form.goodWithPets} onChange={(v) => setV("goodWithPets", v)} invalid={!!err("goodWithPets")} />
              }
              <InlineErr msg={err("goodWithPets")} />
            </RField>
          </div>
          <RField label="What type of home is best?">
            <textarea value={form.idealHomeDesc} onChange={set("idealHomeDesc")} rows={2} placeholder="e.g. Quiet home, patient owner…" style={{ ...inp, resize: "vertical", minHeight: 56 }} onFocus={focIn} onBlur={focOut} />
          </RField>
        </div>
      )}

      {step === 4 && (
        <div style={col}>
          <RSecTitle icon="phone" title="Reason & transition" />

          <RField label={isRescue ? "Primary reason for surrendering *" : "Primary reason for rehoming *"}>
            <select value={form.reason} onChange={set("reason")}
              style={{ ...inp, borderColor: err("reason") ? "rgba(192,48,48,0.5)" : undefined }}
              onFocus={focIn} onBlur={focOut}>
              <option value="">Select…</option>
              {isRescue ? [
                ["Found stray / abandoned", "Found stray / abandoned"],
                ["Rescued from abuse or neglect", "Rescued from abuse or neglect"],
                ["Owner surrender (other)", "Owner surrender (other)"],
                ["Cannot care for long-term", "Cannot care for long-term"],
                ["No resources for ongoing care", "No resources for ongoing care"],
                ["Other", "Other"],
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)
              : [
                ["Moving / Relocating", "Moving / Relocating"],
                ["Allergies", "Allergies"],
                ["New baby", "New baby"],
                ["Medical / Financial", "Medical / Financial"],
                ["Housing change", "Housing change"],
                ["Not enough time", "Not enough time"],
                ["Other", "Other"],
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <InlineErr msg={err("reason")} />
          </RField>

          <RField label="Additional details">
            <textarea value={form.details} onChange={set("details")} rows={2}
              placeholder={isRescue ? "Tell us about how you found this animal…" : "Tell us more about your situation…"}
              style={{ ...inp, resize: "vertical", minHeight: 56 }} onFocus={focIn} onBlur={focOut} />
          </RField>

          {!isRescue && (
            <RField label="Have you tried other solutions?">
              <textarea value={form.triedAlternatives} onChange={set("triedAlternatives")} rows={2} placeholder="e.g. Asked family, tried training…" style={{ ...inp, resize: "vertical", minHeight: 52 }} onFocus={focIn} onBlur={focOut} />
            </RField>
          )}

          <RSecTitle icon="box-open" title="Transition details" />
          <RLabel>Can you provide the following?</RLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[["canProvideFood", "Food supply"], ["canProvideCarrier", "Cage / carrier"], ["canProvideRecords", "Medical records"]].map(([k, label]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.6rem 0.875rem", borderRadius: 10, background: form[k] ? "rgba(28,79,9,0.06)" : "rgba(255,253,242,0.6)", border: `1px solid ${form[k] ? "rgba(90,170,48,0.28)" : "rgba(180,140,60,0.2)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                <input type="checkbox" checked={form[k]} onChange={set(k)} style={{ width: 15, height: 15, accentColor: "#1c4f09", cursor: "pointer" }} />
                <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#3a5020" }}>{label}</span>
              </label>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.75rem 0.875rem", borderRadius: 10, background: form.understandsPermanent ? "rgba(180,90,34,0.07)" : "rgba(255,253,242,0.6)", border: `1.5px solid ${err("understandsPermanent") ? "rgba(192,48,48,0.5)" : form.understandsPermanent ? "rgba(180,90,34,0.35)" : "rgba(180,140,60,0.25)"}`, cursor: "pointer", transition: "all 0.15s", marginTop: "0.25rem" }}>
            <input type="checkbox" checked={form.understandsPermanent} onChange={set("understandsPermanent")} style={{ width: 15, height: 15, accentColor: "#B45A22", marginTop: 2, cursor: "pointer", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6a3a10", lineHeight: 1.6 }}>
              {isRescue
                ? <>I confirm this animal needs placement and all information I've provided is <strong>accurate to the best of my knowledge</strong>.</>
                : <>I understand that rehoming is a <strong>serious and permanent decision</strong>, and I confirm all information is accurate.</>
              }
            </span>
          </label>
          <InlineErr msg={err("understandsPermanent")} />

          <label style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.6rem 0.875rem", borderRadius: 10, background: "rgba(255,253,242,0.6)", border: "1px solid rgba(180,140,60,0.2)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.openToFollowup} onChange={set("openToFollowup")} style={{ width: 15, height: 15, accentColor: "#1c4f09", cursor: "pointer" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#3a5020" }}>I am open to being contacted for follow-up after placement.</span>
          </label>
        </div>
      )}
    </>
  );
}

/* ─── Review Modal ───────────────────────────────────────────────────────── */
function RehomeReviewModal({ user, onContinue, onClose }) {
  const [editableUser, setEditableUser] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    province: user?.province || "",
    zip: user?.zip || "",
  });
  const [editingField, setEditingField] = useState(null);

  const setField = (key) => (e) =>
    setEditableUser(u => ({ ...u, [key]: e.target.value }));

  const fullName = `${editableUser.firstName} ${editableUser.lastName}`.trim();

  const fields = [
    { key: "name", icon: "user", label: "Full name", value: fullName, ok: !!(editableUser.firstName || editableUser.lastName) },
    { key: "email", icon: "envelope", label: "Email", value: editableUser.email, ok: !!editableUser.email },
    { key: "phone", icon: "phone", label: "Phone", value: editableUser.phone, ok: !!editableUser.phone },
    { key: "address", icon: "map-marker-alt", label: "Address", value: editableUser.address, ok: !!editableUser.address },
    { key: "city", icon: "city", label: "City", value: editableUser.city, ok: !!editableUser.city },
    { key: "province", icon: "map", label: "Province", value: editableUser.province, ok: !!editableUser.province },
    { key: "zip", icon: "hashtag", label: "Zip Code", value: editableUser.zip, ok: !!editableUser.zip },
  ];

  const editInp = {
    width: "100%",
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#1a4a08",
    border: "1px solid rgba(90,170,48,0.45)",
    borderRadius: 8,
    padding: "0.35rem 0.6rem",
    fontFamily: "'Nunito',sans-serif",
    background: "rgba(255,253,242,0.9)",
    outline: "none",
    boxShadow: "0 0 0 3px rgba(90,170,48,0.10)",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 460, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(180,140,60,0.25)", background: "rgba(255,252,235,0.98)", boxShadow: "0 20px 56px rgba(40,20,5,0.38)", animation: "modalIn .25s cubic-bezier(.22,.68,0,1.15) both" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.125rem 1.5rem", borderBottom: "1px solid rgba(180,140,60,0.18)", background: "rgba(180,90,34,0.05)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "#B45A22", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
            <i className="fas fa-clipboard-check" style={{ fontSize: "0.9rem" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "0.95rem", color: "#1a4a08" }}>Review your contact details</div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6a7a50", marginTop: 1 }}>Used to reach you about your rehome & rescue request · Click any field to edit</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.18)", background: "rgba(192,48,48,0.07)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.125rem 1.5rem" }}>
          <div style={{ padding: "0.625rem 0.875rem", borderRadius: 10, background: "rgba(180,90,34,0.06)", border: "1px solid rgba(180,90,34,0.2)", marginBottom: "0.875rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <i className="fas fa-info-circle" style={{ color: "#B45A22", flexShrink: 0, marginTop: "0.1rem", fontSize: "0.85rem" }} />
            <p style={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.6, color: "#6a3a10", margin: 0 }}>
              The shelter uses this information to contact you. Your phone number will be used as your contact — no need to re-enter it in the form.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.125rem" }}>
            {fields.map(({ key, icon, label, value, ok }) => {
              const isEditing = editingField === key;

              const renderEditContent = () => {
                if (key === "name") {
                  return (
                    <div style={{ display: "flex", gap: "0.4rem", flex: 1 }}>
                      <input autoFocus type="text" value={editableUser.firstName} onChange={setField("firstName")} placeholder="First name" style={{ ...editInp, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && setEditingField(null)} />
                      <input type="text" value={editableUser.lastName} onChange={setField("lastName")} placeholder="Last name" style={{ ...editInp, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && setEditingField(null)} />
                    </div>
                  );
                }
                return (
                  <input autoFocus type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} value={editableUser[key]} onChange={setField(key)} placeholder={label} style={{ ...editInp, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && setEditingField(null)} />
                );
              };

              return (
                <div key={key} onClick={() => !isEditing && setEditingField(key)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.55rem 0.875rem", borderRadius: 10, background: isEditing ? "rgba(255,253,242,0.95)" : ok ? "rgba(28,79,9,0.05)" : "rgba(192,48,48,0.05)", border: `1px solid ${isEditing ? "rgba(90,170,48,0.45)" : ok ? "rgba(90,170,48,0.22)" : "rgba(192,48,48,0.18)"}`, cursor: isEditing ? "default" : "pointer", transition: "all 0.15s", boxShadow: isEditing ? "0 0 0 3px rgba(90,170,48,0.08)" : "none" }}>
                  <i className={`fas fa-${icon}`} style={{ color: isEditing ? "#5aaa30" : ok ? "#5aaa30" : "#c03030", width: 14, textAlign: "center", fontSize: "0.8rem", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6a7a50", marginBottom: isEditing ? "0.3rem" : 0 }}>{label}</div>
                    {isEditing ? renderEditContent() : (
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: ok ? "#1a4a08" : "#c03030", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ok ? value : <span style={{ fontStyle: "italic", opacity: 0.75 }}>Not set — click to add</span>}
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditingField(null); }} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: "none", background: "#5aaa30", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem" }}>
                      <i className="fas fa-check" />
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                      <i className="fas fa-pen" style={{ color: "#9aaa80", fontSize: "0.62rem", opacity: 0.6 }} />
                      <i className={`fas fa-${ok ? "check-circle" : "exclamation-circle"}`} style={{ color: ok ? "#5aaa30" : "#c03030", fontSize: "0.85rem" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: "0.5rem 0.75rem", borderRadius: 9, background: "rgba(28,79,9,0.06)", border: "1px solid rgba(90,170,48,0.2)", marginBottom: "0.875rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <i className="fas fa-phone" style={{ color: "#5aaa30", fontSize: "0.75rem", flexShrink: 0 }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3a5020" }}>
              {editableUser.phone
                ? <><strong>{editableUser.phone}</strong> will be used as your contact number.</>
                : <span style={{ color: "#c03030" }}>Please add a phone number above — it's required for the shelter to reach you.</span>
              }
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button onClick={onClose} style={{ padding: "0.7rem", borderRadius: 11, fontWeight: 900, fontSize: "0.84rem", background: "rgba(255,248,220,0.7)", border: "1px solid rgba(180,140,60,0.25)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
              <i className="fas fa-arrow-left" style={{ fontSize: "0.75rem" }} /> Go back
            </button>
            <button onClick={() => onContinue(editableUser)} disabled={!editableUser.phone.trim()}
              style={{ padding: "0.7rem", borderRadius: 11, fontWeight: 900, fontSize: "0.84rem", color: "#fff", background: editableUser.phone.trim() ? "#B45A22" : "#cca080", border: "none", cursor: editableUser.phone.trim() ? "pointer" : "not-allowed", fontFamily: "'Nunito',sans-serif", boxShadow: editableUser.phone.trim() ? "0 4px 16px rgba(180,90,34,0.28)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", transition: "all 0.15s" }}>
              Continue <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
            </button>
          </div>
          {!editableUser.phone.trim() && (
            <p style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "#c03030", marginTop: "0.5rem" }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: "0.3rem" }} />
              A phone number is required to continue.
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

/* ─── Pre-form gate card ─────────────────────────────────────────────────── */
function PreFormCard({ onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2.5rem 1.5rem", gap: "1.25rem" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(180,90,34,0.10)", border: "1px solid rgba(180,90,34,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className="fas fa-hand-holding-heart" style={{ fontSize: "1.5rem", color: "#B45A22" }} />
      </div>
      <div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontWeight: 900, color: "#1a4a08", marginBottom: "0.4rem" }}>Rehome / Rescue a pet</div>
        <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "#6a7a50", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>
          Fill out a short form and we'll find your pet a safe, verified new home — with full care and discretion. Whether you're rehoming or surrendering a rescued animal, we're here to help.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.7rem", borderRadius: 99, background: "rgba(28,79,9,0.06)", border: "1px solid rgba(90,170,48,0.2)", fontSize: "0.72rem", fontWeight: 800, color: "#3a5020" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(180,90,34,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 900, color: "#B45A22" }}>{i + 1}</span>
            {s}
          </div>
        ))}
      </div>
      <button onClick={onStart}
        style={{ padding: "0.8rem 2rem", borderRadius: 13, fontWeight: 900, fontSize: "0.9rem", color: "#fff", background: "#B45A22", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 4px 18px rgba(180,90,34,0.28)", display: "flex", alignItems: "center", gap: "0.5rem", transition: "opacity 0.15s" }}
        onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
        onMouseOut={e => e.currentTarget.style.opacity = "1"}>
        <i className="fas fa-hands-holding-heart" /> Start rehome & rescue request
      </button>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9aaa80", margin: 0 }}>
        <i className="fas fa-lock" style={{ marginRight: "0.3rem" }} />Confidential · Takes about 5 minutes
      </p>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function Rehome() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showReview, setShowReview] = useState(false);
  const [formStarted, setFormStarted] = useState(false);

  const [resolvedContact, setResolvedContact] = useState("");
  const [resolvedOwnerName, setResolvedOwnerName] = useState("");
  const [resolvedCity, setResolvedCity] = useState("");
  const [resolvedProvince, setResolvedProvince] = useState("");
  const [resolvedZip, setResolvedZip] = useState("");

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [vaccPhotos, setVaccPhotos] = useState([]);

  const handlePhotoChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSubmitError("Photo must be under 5 MB."); return; }
    try {
      const dataUrl = await fileToBase64(file);
      setPhotoPreview(dataUrl); setPhotoBase64(dataUrl); setSubmitError(null);
    } catch { setSubmitError("Could not read the image. Please try another file."); }
    e.target.value = "";
  }, []);

  const handlePhotoClear = useCallback(() => { setPhotoPreview(null); setPhotoBase64(null); }, []);

  const handleVaccPhotoAdd = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSubmitError("Photo must be under 5 MB."); return; }
    try {
      const dataUrl = await fileToBase64(file);
      setVaccPhotos(prev => [...prev.slice(0, 4), dataUrl]); setSubmitError(null);
    } catch { setSubmitError("Could not read the image. Please try another file."); }
    e.target.value = "";
  }, []);

  const handleVaccPhotoRemove = useCallback((idx) => {
    setVaccPhotos(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const [form, setForm] = useState({
    requestType: "rehome",
    petName: "", species: "Dog", breed: "", age: "", gender: "Male", durationOwned: "",
    foundLocation: "",
    isVaccinated: "", isNeutered: "", medicalNotes: "",
    vaccineType: "", lastVaccDate: "", vaccClinic: "", vaccNotes: "",
    behavior: "", behaviorOther: "", hasAggression: "", isHouseTrained: "", isLeashTrained: "",
    goodWithChildren: "", goodWithPets: "", idealHomeDesc: "",
    reason: "", details: "", triedAlternatives: "",
    canProvideFood: false, canProvideCarrier: false, canProvideRecords: false,
    understandsPermanent: false, openToFollowup: true,
  });

  const set = useCallback((k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    setTouched(t => ({ ...t, [k]: true }));
  }, []);

  const setV = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setTouched(t => ({ ...t, [k]: true }));
  }, []);

  const resetStepState = () => { setTouched({}); setFieldErrors({}); };

  const handleContinue = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      const stepTouched = {};
      Object.keys(errs).forEach(k => stepTouched[k] = true);
      setTouched(stepTouched); setFieldErrors(errs); return;
    }
    resetStepState(); setStep(s => s + 1);
  };

  const handleBack = () => { resetStepState(); setSubmitError(null); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep(4, form);
    if (Object.keys(errs).length > 0) {
      const allTouched = {};
      Object.keys(form).forEach(k => allTouched[k] = true);
      setTouched(allTouched); setFieldErrors(errs); return;
    }
    setSubmitError(null); setLoading(true);
    try {
      const res = await djFetch("/api/approvals/rehoming/", {
        method: "POST",
        body: JSON.stringify({
          request_type: form.requestType,
          pet_name: form.petName, species: form.species, breed: form.breed, age: form.age,
          gender: form.gender, duration_owned: form.durationOwned,
          found_location: form.foundLocation || "",
          // ── nullable booleans: "unknown" → null ──
          is_vaccinated: form.isVaccinated === "yes" ? true : form.isVaccinated === "no" ? false : null,
          is_neutered: form.isNeutered === "yes" ? true : form.isNeutered === "no" ? false : null,
          medical_notes: form.medicalNotes, vaccine_type: form.vaccineType || "",
          last_vacc_date: form.lastVaccDate || null, vacc_clinic: form.vaccClinic || "",
          vacc_notes: form.vaccNotes || "", vacc_photos: vaccPhotos.length > 0 ? vaccPhotos : [],
          behavior: form.behavior, behavior_other: form.behaviorOther,
          has_aggression: form.hasAggression === "yes",
          is_house_trained: form.isHouseTrained === "yes" ? true : form.isHouseTrained === "no" ? false : null,
          is_leash_trained: form.isLeashTrained === "yes" ? true : form.isLeashTrained === "no" ? false : null,
          good_with_children: form.goodWithChildren === "yes" ? true : form.goodWithChildren === "no" ? false : null,
          good_with_pets: form.goodWithPets === "yes" ? true : form.goodWithPets === "no" ? false : null,
          ideal_home_desc: form.idealHomeDesc,
          owner_name: resolvedOwnerName || user?.name || user?.username || "",
          contact: resolvedContact || user?.phone || "",
          street_address: user?.address || "", city: resolvedCity || user?.city || "",
          province: resolvedProvince || user?.province || "", zip_code: resolvedZip || user?.zip || "",
          address: user?.address || "", reason: form.reason, details: form.details,
          tried_alternatives: form.triedAlternatives, can_provide_food: form.canProvideFood,
          can_provide_carrier: form.canProvideCarrier, can_provide_records: form.canProvideRecords,
          understands_permanent: form.understandsPermanent, open_to_followup: form.openToFollowup,
          photo_base64: photoBase64 ?? null,
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { }
      if (res.ok && data.success !== false) {
        setSubmitted(true);
        window.dispatchEvent(new CustomEvent('pawster:rehomeSubmitted'));  // ← ADD THIS
      }
      else { setSubmitError(data.message || `Error (${res.status}). Please try again.`); }
    } catch { setSubmitError("Network error. Please try again."); }
    setLoading(false);
  };

  usePageTitle('Rehome / Rescue a Pet');

  return (
    <div style={{ minHeight: "100vh", background: "#EDDABB", fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes fl1{0%,100%{transform:translate(0,0)}50%{transform:translate(5%,8%)}}
        @keyframes fl2{0%,100%{transform:translate(0,0)}50%{transform:translate(-8%,5%)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        *,*::before,*::after{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#eddabb}::-webkit-scrollbar-thumb{background:#b4903a;border-radius:3px}
        @media(max-width:768px){.rehome-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* Background blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "#EDDABB" }} />
        <div style={{ position: "absolute", width: 900, height: 900, top: "-20%", left: "-15%", borderRadius: "50%", background: "radial-gradient(circle,#B45A22,transparent 70%)", filter: "blur(120px)", opacity: 0.35, animation: "fl1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 800, height: 800, bottom: "-15%", right: "-15%", borderRadius: "50%", background: "radial-gradient(circle,#588B41,transparent 70%)", filter: "blur(120px)", opacity: 0.35, animation: "fl2 11s ease-in-out infinite" }} />
      </div>

      <div className="rehome-grid" style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "4rem 2.5rem 6rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>

        {/* Left column */}
        <div>
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: 50, padding: "0.3rem 1rem", fontSize: "0.67rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", fontStyle: "italic", marginBottom: "1rem", background: "rgba(180,90,34,0.10)", border: "1px solid rgba(180,90,34,0.25)", color: "#B45A22" }}>
              <i className="fas fa-hands-holding-heart" style={{ fontSize: "0.65rem" }} /> Rehome / Rescue service
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900, color: "#1a4a08", lineHeight: 1.1, marginBottom: "1rem" }}>
              Need to <em style={{ fontStyle: "italic", color: "#B45A22" }}>Rehome / Rescue</em> Your Pet?
            </h1>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#3a5020", lineHeight: 1.7, marginBottom: "0.75rem" }}>
              Life circumstances change. If you're unable to care for your pet — or have rescued an animal in need — Pawster will help find them a safe, loving new home in Baguio City and the Cordillera Administrative Region.
            </p>
            <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#6a7a50", lineHeight: 1.7, marginBottom: "2rem" }}>
              Whether you're a family rehoming a beloved companion or a rescuer surrendering a stray found on the mountain roads of Baguio, our process is the same: full discretion, verified adopters, and post-placement support.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h3 style={{ fontWeight: 900, fontSize: "1rem", color: "#1a4a08", marginBottom: "1rem" }}>Common reasons families reach out:</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2.5rem" }}>
              {REASONS.map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,248,225,0.75)", borderRadius: 12, padding: "0.75rem 1rem", border: "1px solid rgba(180,140,60,0.25)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(180,90,34,0.10)", color: "#B45A22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={icon} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#3a5020" }}>{label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div style={{ background: "rgba(28,79,9,0.07)", border: "1px solid rgba(90,170,48,0.28)", borderRadius: 18, padding: "1.5rem" }}>
              <div style={{ fontWeight: 900, fontSize: "0.95rem", color: "#1a4a08", marginBottom: "0.5rem" }}>🐾 Our promise</div>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3a5020", lineHeight: 1.7, margin: 0 }}>
                We never abandon animals. Every pet submitted through Pawster — whether rehomed or rescued from the streets of Baguio — is screened, cared for, and matched only with verified, loving adopters in the City of Pines and across CAR.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Right column — form panel */}
        <Reveal delay={80}>
          <div style={{ background: "rgba(255,250,228,0.88)", border: "1px solid rgba(255,238,185,0.55)", borderRadius: 22, boxShadow: "0 6px 32px rgba(160,105,30,0.10)", position: "sticky", top: 90, overflow: "hidden" }}>

            {submitted ? (
              /* ── Success ── */
              <div style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏡</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, color: "#1a4a08", marginBottom: "0.5rem" }}>Thank you!</div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3a5020", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                  Your rehome & rescue request has been received. Our team in Baguio City will contact you within 24–48 hours.
                </p>
                <Link to="/home" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", borderRadius: 12, fontWeight: 900, fontSize: "0.9rem", color: "#fff", background: "#1c4f09", textDecoration: "none" }}>
                  Back to home
                </Link>
              </div>

            ) : !formStarted ? (
              <PreFormCard onStart={() => setShowReview(true)} />

            ) : (
              /* ── Multi-step form ── */
              <div style={{ padding: "1.75rem" }}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 900, color: "#1a4a08", margin: 0 }}>
                    {form.requestType === "rescue" ? "Rescue / Surrender request" : "Rehome / Rescue request"}
                  </h2>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7a8a60", marginTop: "0.2rem" }}>
                    Confidential · Step {step} of {STEPS.length} — {STEPS[step - 1]}
                  </p>
                </div>

                {/* Step indicators */}
                <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem", gap: 0 }}>
                  {STEPS.map((label, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900, flexShrink: 0, transition: "all 0.2s", background: step > i + 1 ? "#1c4f09" : step === i + 1 ? "#B45A22" : "rgba(180,140,60,0.15)", color: step >= i + 1 ? "#fff" : "#8a9a70", border: step === i + 1 ? "2px solid rgba(180,90,34,0.3)" : "none" }}>
                          {step > i + 1 ? <i className="fas fa-check" style={{ fontSize: "0.6rem" }} /> : i + 1}
                        </div>
                        <span style={{ fontSize: "0.62rem", fontWeight: 800, color: step === i + 1 ? "#B45A22" : "#9aaa70", whiteSpace: "nowrap" }}>{label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, height: "1.5px", background: step > i + 1 ? "#1c4f09" : "rgba(180,140,60,0.2)", margin: "0 4px", marginBottom: "1rem", borderRadius: 1, transition: "background 0.3s" }} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ maxHeight: "50vh", overflowY: "auto", paddingRight: "0.25rem" }}>
                    <RehomeStepContent
                      step={step} form={form} set={set} setV={setV}
                      photoPreview={photoPreview} onPhotoChange={handlePhotoChange} onPhotoClear={handlePhotoClear}
                      vaccPhotos={vaccPhotos} onVaccPhotoAdd={handleVaccPhotoAdd} onVaccPhotoRemove={handleVaccPhotoRemove}
                      touched={touched} fieldErrors={fieldErrors}
                    />
                  </div>

                  {submitError && (
                    <div style={{ padding: "0.6rem 0.875rem", borderRadius: 10, background: "rgba(192,48,48,0.07)", border: "1px solid rgba(192,48,48,0.22)", marginTop: "0.75rem", fontSize: "0.8rem", fontWeight: 700, color: "#c03030", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <i className="fas fa-times-circle" style={{ flexShrink: 0 }} /> {submitError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(180,140,60,0.18)" }}>
                    {step > 1 && (
                      <button type="button" onClick={handleBack}
                        style={{ flex: 1, padding: "0.75rem", borderRadius: 11, fontWeight: 800, fontSize: "0.86rem", color: "#3a5020", background: "transparent", border: "1px solid rgba(180,140,60,0.25)", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        <i className="fas fa-arrow-left" style={{ fontSize: "0.75rem" }} /> Back
                      </button>
                    )}
                    {step < STEPS.length ? (
                      <button type="button" onClick={handleContinue}
                        style={{ flex: 2, padding: "0.75rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#B45A22", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 12px rgba(180,90,34,0.24)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        Continue <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
                      </button>
                    ) : (
                      <button type="submit" disabled={loading}
                        style={{ flex: 2, padding: "0.75rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: loading ? "#c08040" : "#B45A22", border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 12px rgba(180,90,34,0.24)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        {loading
                          ? <><i className="fas fa-spinner" style={{ animation: "spin .8s linear infinite" }} /> Submitting…</>
                          : <><i className="fas fa-paper-plane" /> Submit request</>}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(90,170,48,0.45)] bg-[rgba(255,248,218,0.85)] backdrop-blur-md px-10 py-12">
        <div className="max-w-[1200px] mx-auto grid gap-12 mb-10 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <div className="mb-2">
              <img src={logo} alt="Pawster" className="w-8 h-8 object-contain" onError={(e) => (e.target.style.display = "none")} />
            </div>
            <div className="font-black text-[1.2rem] text-[#1a4a08]">Paw<em className="italic text-[#e07820]">ster</em></div>
            <p className="text-[0.82rem] font-bold leading-7 text-[#6a7a50] max-w-[260px] mt-2">
              Screening, placing, and supporting animal adoptions across Baguio City and the Cordillera Administrative Region with care and accountability.
            </p>
          </div>
          {[
            { title: "Adopt", links: [["Browse animals", "/pets"], ["My profile", "/profile"], ["Log in", "/login"], ["Register", "/register"]] },
            { title: "Services", links: [["How it works", "/how-it-works"], ["Rehome / Rescue", "/rehome"], ["Missing pets", "/missing-pets"], ["About us", "/about"]] },
            { title: "Regions", links: [["Baguio City", "/pets"], ["Benguet", "/pets"], ["Mountain Province", "/pets"], ["Ifugao", "/pets"]] },
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
          <div className="text-[0.75rem] font-bold text-[#6a7a50]">© 2025 Pawster. All rights reserved. Made with 🐾 in Baguio City.</div>
          <div className="flex gap-2">
            {["fab fa-facebook-f"].map(icon => (
              <a key={icon} href="https://www.facebook.com/pawsterofficial" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontSize: '0.78rem', color: '#7a8a60', background: 'rgba(255,250,232,0.7)', border: '1px solid rgba(180,140,60,0.22)', textDecoration: 'none' }}>
                <i className={icon} />
              </a>
            ))}
          </div>
        </div>
      </footer>

      {showReview && (
        <RehomeReviewModal
          user={user}
          onContinue={(updatedUser) => {
            setResolvedContact(updatedUser.phone || user?.phone || "");
            setResolvedOwnerName(`${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim() || user?.name || user?.username || "");
            setResolvedCity(updatedUser.city || user?.city || "");
            setResolvedProvince(updatedUser.province || user?.province || "");
            setResolvedZip(updatedUser.zip || user?.zip || "");
            setShowReview(false); setFormStarted(true);
          }}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  );
}