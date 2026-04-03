/**
 * RequestsPanel.jsx
 * Admin panel component — calls Django instead of PHP.
 * Handles both adoption and rehoming requests.
 * Props: type = "adoptions" | "rehoming"  |  show = boolean
 *
 * When a rehoming request is approved, it automatically creates
 * a new animal listing in the Spring Boot /api/animals endpoint,
 * including the pet's photo (stored as a base64 data-URL in Django).
 *
 * Vaccination photos are shown in the detail modal for admin review.
 */
import { useState, useEffect, useCallback } from "react";

const DJANGO = import.meta.env.VITE_DJANGO_API ?? "http://localhost:8082";
const SPRING = import.meta.env.VITE_API_BASE   ?? "http://localhost:8080";

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

/**
 * Upload a base64 data-URL to the Spring Boot media endpoint and get back a persistent URL.
 *
 * Strategy (in order):
 *  1. Try POST /api/animals/upload-photo  → returns { url } or { photoUrl }
 *  2. Try POST /api/upload               → returns { url } or { photoUrl }
 *  3. Fall back to storing the data-URL directly (works in-browser; may be large)
 */
async function uploadPhotoToSpring(base64DataUrl) {
  if (!base64DataUrl) return null;
  // Already a real URL — nothing to upload
  if (!base64DataUrl.startsWith("data:")) return base64DataUrl;

  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const endpoints = [
    `${SPRING}/api/animals/upload-photo`,
    `${SPRING}/api/upload`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ photo_base64: base64DataUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        const resolved = data.url || data.photoUrl || data.photo_url || null;
        if (resolved) return resolved;
      }
    } catch {
      // try next endpoint
    }
  }

  // Fallback: return the data-URL itself. Spring Boot must accept it as photoUrl.
  return base64DataUrl;
}

/**
 * Posts a new animal to the Spring Boot animals API from a rehoming record.
 *
 * KEY FIX: We send photoUrl as-is (data-URL or real URL).
 * Spring Boot's /api/animals must accept a photoUrl field — if it stores it
 * in the DB and echoes it back, FindAPet will display it fine.
 */
async function createAnimalFromRehoming(record) {
  const token = getToken();

  const descParts = [
    record.ideal_home_desc,
    record.behavior ? `Behavior: ${record.behavior}${record.behavior_other ? ` (${record.behavior_other})` : ""}` : "",
    record.medical_notes ? `Medical notes: ${record.medical_notes}` : "",
    record.good_with_children === true  ? "Good with children."   : "",
    record.good_with_pets     === true  ? "Good with other pets." : "",
    record.is_house_trained   === true  ? "House-trained."        : "",
    record.is_leash_trained   === true  ? "Leash-trained."        : "",
    record.is_vaccinated      === true && record.vaccine_type
      ? `Vaccinated (${record.vaccine_type}).` : "",
  ].filter(Boolean).join(" ").trim();

  const payload = {
    name:    record.pet_name || "Unknown",
    type:    record.species  || "Other",
    breed:   record.breed    || "",
    age:     record.age      || "",
    health:  "Healthy",
    status:  "Available",
    notes:   descParts || "Available for adoption.",
    // ✅ Send base64 directly as photo field — Spring Boot already handles this
    photo:   record.photo_base64 || null,
  };

  const res = await fetch(`${SPRING}/api/animals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`Spring Boot ${res.status}: ${body}`);
  try { return JSON.parse(body); } catch { return {}; }
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Pending:  { bg: "bg-amber-50",  border: "border-amber-200",  dot: "#f59e0b", pill: "bg-amber-100 text-amber-700"  },
  Approved: { bg: "bg-green-50",  border: "border-green-200",  dot: "#22c55e", pill: "bg-green-100 text-green-700"  },
  Rejected: { bg: "bg-red-50",    border: "border-red-200",    dot: "#ef4444", pill: "bg-red-100 text-red-700"      },
};

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"rgba(10,6,2,0.6)",backdropFilter:"blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:"100%",maxWidth:440,borderRadius:18,background:"#fffce8",border:"1px solid rgba(180,140,60,0.28)",boxShadow:"0 16px 48px rgba(40,20,5,0.35)",overflow:"hidden" }}>
        <div style={{ padding:"1.1rem 1.25rem",borderBottom:"1px solid rgba(180,140,60,0.18)",fontWeight:900,fontSize:"0.95rem",color:"#1a4a08",fontFamily:"'Nunito',sans-serif" }}>
          Rejection Reason
        </div>
        <div style={{ padding:"1rem 1.25rem",display:"flex",flexDirection:"column",gap:"0.75rem" }}>
          <p style={{ fontSize:"0.82rem",fontWeight:700,color:"#6a7a50",margin:0 }}>
            Please provide a reason. This will be sent to the applicant via email and notification.
          </p>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Enter rejection reason…"
            style={{ padding:"0.625rem 0.875rem",borderRadius:10,border:"1px solid rgba(180,140,60,0.28)",background:"rgba(255,250,232,0.7)",fontFamily:"'Nunito',sans-serif",fontWeight:700,fontSize:"0.88rem",color:"#1a2e0a",outline:"none",resize:"vertical",width:"100%" }}
          />
          <div style={{ display:"flex",gap:"0.5rem",justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ padding:"0.6rem 1.1rem",borderRadius:10,fontWeight:800,fontSize:"0.84rem",background:"transparent",border:"1px solid rgba(180,140,60,0.28)",color:"#3a5020",cursor:"pointer",fontFamily:"'Nunito',sans-serif" }}>
              Cancel
            </button>
            <button onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); setReason(""); } }}
              disabled={!reason.trim()}
              style={{ padding:"0.6rem 1.25rem",borderRadius:10,fontWeight:900,fontSize:"0.84rem",background:reason.trim()?"#c03030":"#e08080",border:"none",color:"#fff",cursor:reason.trim()?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif" }}>
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vaccination Photos Gallery ────────────────────────────────────────────────
function VaccPhotosGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null);
  if (!photos || photos.length === 0) return null;
  return (
    <>
      <div>
        <div style={{ fontSize:"0.67rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#1c4f09",marginBottom:"0.5rem",display:"flex",alignItems:"center",gap:"0.4rem" }}>
          <i className="fas fa-images" style={{ color:"#5aaa30" }}/> Vaccination Record Photos ({photos.length})
        </div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"0.5rem" }}>
          {photos.map((src, i) => (
            <button key={i} type="button" onClick={() => setLightbox(src)}
              style={{ width:72,height:72,borderRadius:10,overflow:"hidden",border:"2px solid rgba(90,170,48,0.4)",padding:0,cursor:"pointer",position:"relative",flexShrink:0,background:"rgba(255,248,220,0.5)" }}>
              <img src={src} alt={`Vacc ${i+1}`} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
              <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0)",transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.18)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}/>
              <div style={{ position:"absolute",bottom:2,right:2,background:"rgba(28,79,9,0.8)",borderRadius:4,padding:"1px 4px",fontSize:"0.55rem",fontWeight:900,color:"#fff" }}>{i+1}</div>
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div style={{ position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Vaccination record" style={{ maxWidth:"90vw",maxHeight:"88vh",borderRadius:14,boxShadow:"0 24px 64px rgba(0,0,0,0.6)",objectFit:"contain" }} onClick={e=>e.stopPropagation()}/>
          <button onClick={() => setLightbox(null)}
            style={{ position:"absolute",top:20,right:20,width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.18)",border:"2px solid rgba(255,255,255,0.3)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem" }}>
            <i className="fas fa-times"/>
          </button>
          <div style={{ position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.5)",borderRadius:8,padding:"0.3rem 0.75rem",fontSize:"0.75rem",fontWeight:700,color:"#fff" }}>
            Click outside or × to close
          </div>
        </div>
      )}
    </>
  );
}

// ── Field display helper ──────────────────────────────────────────────────────
function FieldPill({ label, value, accent }) {
  return (
    <div style={{
      padding:"0.5rem 0.75rem",
      borderRadius:10,
      background: accent ? "rgba(28,79,9,0.07)" : "rgba(255,248,218,0.6)",
      border: `1px solid ${accent ? "rgba(90,170,48,0.28)" : "rgba(180,140,60,0.18)"}`,
    }}>
      <div style={{ fontSize:"0.62rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#9aaa80",marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:"0.83rem",fontWeight:700,color: accent ? "#1c4f09" : "#1a2e0a",wordBreak:"break-word",whiteSpace:"pre-wrap" }}>{String(value)}</div>
    </div>
  );
}

// ── Expanded detail modal ─────────────────────────────────────────────────────
function DetailModal({ r, type, open, onClose, onApprove, onReject }) {
  if (!open || !r) return null;
  const status = r.status || "Pending";
  const cfg    = STATUS_CFG[status] || STATUS_CFG.Pending;

  const photoSrc = type === "rehoming"
    ? (r.photo_base64 || r.photo_url || null)
    : null;

  // Parse vaccination photos — handle JSON string, Python list repr, or real array
  let vaccPhotos = [];
  if (type === "rehoming") {
    if (Array.isArray(r.vacc_photos)) {
      vaccPhotos = r.vacc_photos;
    } else if (typeof r.vacc_photos === "string" && r.vacc_photos.trim()) {
      try {
        // Django may store as Python repr: ["...", "..."] or JSON array
        vaccPhotos = JSON.parse(r.vacc_photos.replace(/'/g, '"'));
      } catch {
        vaccPhotos = [];
      }
    }
  }

  // ── Build field sections ─────────────────────────────────────────────────
  // Helper: convert any value to a display string; skip empty/null/undefined
  const fmt = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? "Yes ✓" : "No";
    if (typeof v === "string" && v.trim() === "") return null;
    return String(v);
  };

  const adoptionSections = [
    {
      title: "Applicant", icon: "user",
      fields: [
        ["Full Name",         fmt(r.name)],
        ["Email",             fmt(r.email)],
        ["Phone",             fmt(r.phone)],
        ["Address",           fmt(r.address)],
        ["Animal",            fmt(r.animal_name)],
        ["Primary Caregiver", fmt(r.primary_caregiver)],
      ],
    },
    {
      title: "Housing", icon: "home",
      fields: [
        ["Housing Type",   fmt(r.housing)],
        ["Owns / Rents",   r.owns_home !== undefined ? (r.owns_home ? "Owns" : "Rents") : null],
        ["Pet Permission", r.pet_permission !== undefined ? fmt(r.pet_permission) : null],
        ["Pet Space",      fmt(r.pet_space)],
        ["Household Size", fmt(r.household_size)],
        ["Has Children",   r.has_children !== undefined ? fmt(r.has_children) : null],
        ["Children Ages",  fmt(r.children_ages)],
      ],
    },
    {
      title: "Other Pets", icon: "dog",
      fields: [
        ["Has Other Pets",      r.has_other_pets !== undefined ? fmt(r.has_other_pets) : null],
        ["Other Pets Detail",   fmt(r.other_pets_detail)],
        ["Pets Vaccinated",     r.other_pets_vaccinated !== undefined ? fmt(r.other_pets_vaccinated) : null],
      ],
    },
    {
      title: "Time & Budget", icon: "clock",
      fields: [
        ["Experience",       fmt(r.exp)],
        ["Hours Alone",      fmt(r.alone_hours)],
        ["Backup Care",      fmt(r.backup_care)],
        ["Monthly Budget",   fmt(r.budget)],
        ["Vet Plan",         fmt(r.vet_plan)],
      ],
    },
    {
      title: "Commitment", icon: "file-signature",
      fields: [
        ["Behavior Response", fmt(r.behavior_response)],
        ["Open to Guidance",  r.open_to_guidance !== undefined ? fmt(r.open_to_guidance) : null],
        ["Previous Pet",      r.previous_pet !== undefined ? fmt(r.previous_pet) : null],
        ["Previous Pet Info", fmt(r.previous_pet_details)],
        ["Reason to Adopt",   fmt(r.reason)],
      ],
    },
  ];

  const rehomingSections = [
    {
      title: "Pet Details", icon: "paw",
      fields: [
        ["Pet Name",       fmt(r.pet_name)],
        ["Species",        fmt(r.species)],
        ["Breed",          fmt(r.breed)],
        ["Age",            fmt(r.age)],
        ["Gender",         fmt(r.gender)],
        ["Duration Owned", fmt(r.duration_owned)],
      ],
    },
    {
      title: "Health", icon: "syringe",
      fields: [
        ["Vaccinated",          r.is_vaccinated !== undefined ? fmt(r.is_vaccinated) : null],
        ["Vaccine Type",        fmt(r.vaccine_type)],
        ["Last Vaccinated",     fmt(r.last_vacc_date)],
        ["Vet / Clinic",        fmt(r.vacc_clinic)],
        ["Vaccination Notes",   fmt(r.vacc_notes)],
        ["Neutered",            r.is_neutered !== undefined ? fmt(r.is_neutered) : null],
        ["Medical Notes",       fmt(r.medical_notes)],
      ],
    },
    {
      title: "Behavior", icon: "star",
      fields: [
        ["Behavior",         fmt(r.behavior)],
        ["Behavior Detail",  fmt(r.behavior_other)],
        ["Has Aggression",   r.has_aggression !== undefined ? fmt(r.has_aggression) : null],
        ["House Trained",    r.is_house_trained !== undefined ? fmt(r.is_house_trained) : null],
        ["Leash Trained",    r.is_leash_trained !== undefined ? fmt(r.is_leash_trained) : null],
        ["Good w/ Children", r.good_with_children !== undefined ? fmt(r.good_with_children) : null],
        ["Good w/ Pets",     r.good_with_pets !== undefined ? fmt(r.good_with_pets) : null],
        ["Ideal Home",       fmt(r.ideal_home_desc)],
      ],
    },
    {
      title: "Contact & Reason", icon: "phone",
      fields: [
        ["Contact",              fmt(r.contact)],
        ["Reason",               fmt(r.reason)],
        ["Details",              fmt(r.details)],
        ["Tried Alternatives",   fmt(r.tried_alternatives)],
        ["Can Provide Food",     r.can_provide_food !== undefined ? fmt(r.can_provide_food) : null],
        ["Can Provide Carrier",  r.can_provide_carrier !== undefined ? fmt(r.can_provide_carrier) : null],
        ["Can Provide Records",  r.can_provide_records !== undefined ? fmt(r.can_provide_records) : null],
      ],
    },
  ];

  const sections = type === "adoptions" ? adoptionSections : rehomingSections;

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"rgba(10,6,2,0.65)",backdropFilter:"blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width:"100%",
        maxWidth:680,
        borderRadius:20,
        background:"#fffce8",
        border:"1px solid rgba(180,140,60,0.28)",
        boxShadow:"0 24px 64px rgba(40,20,5,0.45)",
        display:"flex",
        flexDirection:"column",
        // Use 92vh so the modal is tall but never clips off screen
        maxHeight:"92vh",
        overflow:"hidden",
      }}>

        {/* ── Header (fixed) ── */}
        <div style={{ padding:"1rem 1.25rem",borderBottom:"1px solid rgba(180,140,60,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(28,79,9,0.07),rgba(90,170,48,0.04))",flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1rem",color:"#1a4a08" }}>
              {type === "adoptions" ? "Adoption" : "Rehoming"} Request — Full Details
            </div>
            <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6a7a50",marginTop:2 }}>
              Submitted {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "—"}
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"0.5rem" }}>
            <span style={{ fontSize:"0.72rem",fontWeight:900,padding:"0.25rem 0.75rem",borderRadius:50,background:cfg.dot+"22",color:cfg.dot,border:`1px solid ${cfg.dot}44` }}>{status}</span>
            <button onClick={onClose}
              style={{ width:30,height:30,borderRadius:8,border:"1px solid rgba(192,48,48,0.2)",background:"rgba(192,48,48,0.08)",color:"#c03030",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body (flex:1 + overflow) ── */}
        <div style={{ overflowY:"auto",padding:"1rem 1.25rem",flex:1,display:"flex",flexDirection:"column",gap:"1rem" }}>

          {/* Pet photo — rehoming only */}
          {photoSrc && (
            <div style={{ borderRadius:14,overflow:"hidden",border:"1px solid rgba(180,140,60,0.22)",flexShrink:0 }}>
              <img src={photoSrc} alt={r.pet_name||"Pet photo"} style={{ width:"100%",maxHeight:240,objectFit:"cover",display:"block" }}/>
            </div>
          )}

          {/* Vaccination photos gallery */}
          {vaccPhotos.length > 0 && (
            <div style={{ padding:"0.875rem",borderRadius:12,background:"rgba(28,79,9,0.05)",border:"1px solid rgba(90,170,48,0.22)",flexShrink:0 }}>
              <VaccPhotosGallery photos={vaccPhotos}/>
            </div>
          )}

          {/* Rejection note */}
          {r.reject_note && (
            <div style={{ padding:"0.75rem 1rem",borderRadius:12,background:"rgba(192,48,48,0.06)",border:"1px solid rgba(192,48,48,0.2)",fontSize:"0.82rem",fontWeight:700,color:"#c03030",flexShrink:0 }}>
              <strong>Rejection note:</strong> {r.reject_note}
            </div>
          )}

          {/* Sectioned fields */}
          {sections.map(({ title, icon, fields }) => {
            const visibleFields = fields.filter(([, v]) => v !== null && v !== undefined);
            if (visibleFields.length === 0) return null;
            return (
              <div key={title}>
                {/* Section header */}
                <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem",paddingBottom:"0.3rem",borderBottom:"1px solid rgba(180,140,60,0.20)" }}>
                  <i className={`fas fa-${icon}`} style={{ color:"#5aaa30",fontSize:"0.78rem" }}/>
                  <span style={{ fontSize:"0.7rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#1c4f09" }}>{title}</span>
                </div>
                {/* 2-col grid */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem" }}>
                  {visibleFields.map(([label, value]) => (
                    <FieldPill
                      key={label}
                      label={label}
                      value={value}
                      accent={
                        (label === "Vaccinated"  && value === "Yes ✓") ||
                        (label === "Neutered"    && value === "Yes ✓") ||
                        (label === "House Trained" && value === "Yes ✓") ||
                        (label === "Leash Trained" && value === "Yes ✓")
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Actions (fixed footer) ── */}
        {status === "Pending" && (
          <div style={{ padding:"0.875rem 1.25rem",borderTop:"1px solid rgba(180,140,60,0.18)",display:"flex",gap:"0.625rem",flexShrink:0,background:"rgba(255,252,235,0.97)" }}>
            <button onClick={() => { onApprove(r.id); onClose(); }}
              style={{ flex:1,padding:"0.7rem",borderRadius:11,fontWeight:900,fontSize:"0.88rem",color:"#fff",background:"#1c7a09",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem" }}>
              <i className="fas fa-check" /> Approve
            </button>
            <button onClick={() => { onReject(r.id); onClose(); }}
              style={{ flex:1,padding:"0.7rem",borderRadius:11,fontWeight:900,fontSize:"0.88rem",color:"#fff",background:"#c03030",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem" }}>
              <i className="fas fa-times" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ r, type, onApprove, onReject, onView }) {
  const status   = r.status || "Pending";
  const name     = r.name || r.contact || "Applicant";
  const initials = name.split(" ").map(w => w[0] || "").slice(0,2).join("").toUpperCase() || "?";
  const cfg      = STATUS_CFG[status] || STATUS_CFG.Pending;
  const avatarBg = type === "adoptions" ? "#1c4f09" : "#b45a22";

  const photoSrc = type === "rehoming" ? (r.photo_base64 || r.photo_url || null) : null;

  const details = type === "adoptions"
    ? [
        ["Animal",   r.animal_name || "—"],
        ["Email",    r.email       || "—"],
        ["Phone",    r.phone       || "—"],
        ["Address",  r.address     || "—"],
        ["Housing",  r.housing     || "—"],
        ["Budget",   r.budget      || "—"],
      ]
    : [
        ["Pet",        r.pet_name            || "—"],
        ["Species",    r.species             || "—"],
        ["Reason",     r.reason              || "—"],
        ["Contact",    r.contact             || "—"],
        ["Vaccinated", r.is_vaccinated ? "Yes ✓" : "No"],
        ["Neutered",   r.is_neutered   ? "Yes ✓" : "No"],
      ];

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col ${cfg.bg} ${cfg.border}`}>
      <div className="h-1 w-full" style={{ background: cfg.dot }} />

      {/* Pet photo thumbnail — rehoming only */}
      {photoSrc ? (
        <div style={{ width:"100%",height:150,overflow:"hidden",flexShrink:0,position:"relative" }}>
          <img src={photoSrc} alt={r.pet_name||"Pet"} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
          {r.is_vaccinated && (
            <span style={{ position:"absolute",top:8,left:8,padding:"0.2rem 0.5rem",borderRadius:50,background:"rgba(28,79,9,0.85)",color:"#fff",fontSize:"0.65rem",fontWeight:900,display:"flex",alignItems:"center",gap:"0.3rem" }}>
              <i className="fas fa-syringe" style={{fontSize:"0.6rem"}}/> Vaccinated
            </span>
          )}
        </div>
      ) : (
        type === "rehoming" && (
          <div style={{ width:"100%",height:80,background:"rgba(255,248,220,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2.5rem",flexShrink:0,borderBottom:"1px solid rgba(180,140,60,0.15)" }}>
            {r.species==="Cat"?"🐈":r.species==="Bird"?"🐦":r.species==="Rabbit"?"🐇":"🐕"}
          </div>
        )
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {!photoSrc && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: avatarBg }}>
                {initials}
              </div>
            )}
            <div>
              <div className="font-black text-sm" style={{ color:"#1a4a08" }}>
                {type === "rehoming" ? (r.pet_name || name) : name}
              </div>
              {type === "rehoming" && r.pet_name && (
                <div className="text-xs font-semibold" style={{ color:"#6a7a50" }}>by {name}</div>
              )}
              <div className="text-xs font-semibold mt-0.5" style={{ color:"#9aaa80" }}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-black px-3 py-1 rounded-full flex-shrink-0 ${cfg.pill}`}>{status}</span>
        </div>

        <div className="h-px" style={{ background:"rgba(180,140,60,0.15)" }} />

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-2">
          {details.map(([lbl,val]) => (
            <div key={lbl}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color:"#9aaa80" }}>{lbl}</div>
              <div className="text-xs font-semibold truncate" style={{ color:"#1a2e0a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Vaccination details chip — rehoming only */}
        {type === "rehoming" && r.is_vaccinated && r.vaccine_type && (
          <div style={{ padding:"0.5rem 0.75rem",borderRadius:10,background:"rgba(28,79,9,0.06)",border:"1px solid rgba(90,170,48,0.25)",display:"flex",alignItems:"center",gap:"0.5rem" }}>
            <i className="fas fa-syringe" style={{ color:"#1c7a09",fontSize:"0.75rem",flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:"0.68rem",fontWeight:900,color:"#1c4f09",textTransform:"uppercase",letterSpacing:"0.05em" }}>Vaccine</div>
              <div style={{ fontSize:"0.78rem",fontWeight:700,color:"#1a4a08" }}>{r.vaccine_type}{r.last_vacc_date ? ` · ${r.last_vacc_date}` : ""}</div>
            </div>
          </div>
        )}

        {/* Reason */}
        {(r.reason || r.details) && (
          <div className="rounded-xl p-3" style={{ background:"rgba(255,248,218,0.7)",border:"1px solid rgba(180,140,60,0.2)" }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:"#9aaa80" }}>
              {type === "adoptions" ? "Reason for adoption" : "Reason for rehoming"}
            </div>
            <div className="text-xs font-semibold line-clamp-2" style={{ color:"#3a5020" }}>
              {r.reason || r.details}
            </div>
          </div>
        )}

        {/* Rehoming approved badge */}
        {type === "rehoming" && status === "Approved" && (
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background:"rgba(28,79,9,0.07)",border:"1px solid rgba(90,170,48,0.28)" }}>
            <i className="fas fa-paw" style={{ color:"#5aaa30",fontSize:"0.75rem",flexShrink:0 }} />
            <span className="text-xs font-bold" style={{ color:"#1c4f09" }}>
              {r.pet_name || "Pet"} has been listed for adoption
            </span>
          </div>
        )}

        {/* Reject note */}
        {r.reject_note && status === "Rejected" && (
          <div className="rounded-xl p-3 text-xs font-semibold" style={{ background:"rgba(192,48,48,0.06)",border:"1px solid rgba(192,48,48,0.2)",color:"#c03030" }}>
            <strong>Rejected:</strong> {r.reject_note}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button onClick={() => onView(r)}
            className="px-3 py-2 rounded-xl text-xs font-black border transition-all hover:bg-amber-50"
            style={{ background:"rgba(255,248,218,0.7)",borderColor:"rgba(180,140,60,0.28)",color:"#7a6030" }}>
            <i className="fas fa-eye" /> View
          </button>

          {status === "Pending" ? (
            <>
              <button onClick={() => onApprove(r.id)}
                className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-600 hover:text-white hover:border-green-600"
                style={{ background:"rgba(34,197,94,0.08)",borderColor:"rgba(34,197,94,0.3)",color:"#15803d" }}>
                ✓ Approve
              </button>
              <button onClick={() => onReject(r.id)}
                className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-red-600 hover:text-white hover:border-red-600"
                style={{ background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.28)",color:"#dc2626" }}>
                ✕ Reject
              </button>
            </>
          ) : (
            <div className="flex-1 py-2 rounded-xl text-xs font-black border text-center" style={{ borderColor:"#ddd0a8",color:"#9aaa80" }}>
              {status === "Approved" ? "✓ Approved" : "✕ Rejected"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function RequestsPanel({ type, show }) {
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [rejectId,   setRejectId]   = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [toast,      setToast]      = useState(null);

  const apiBase = type === "adoptions"
    ? "/api/approvals/adoptions"
    : "/api/approvals/rehoming";

  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (status = "all") => {
    setLoading(true);
    try {
      const url  = `${apiBase}/admin/${status !== "all" ? `?status=${status}` : ""}`;
      const res  = await djFetch(url);
      if (res.status === 401) { showToast("Unauthorized — please log in as admin","err"); setLoading(false); return; }
      const data = await res.json();
      if (data.success) setRecords(data.data || []);
      else showToast(data.message || "Failed to load","err");
    } catch { showToast("Failed to load requests","err"); }
    setLoading(false);
  }, [type]);

  useEffect(() => { if (show) load(filter); }, [show, filter, load]);

  // ── Approve ──────────────────────────────────────────────────────────────
  const approve = async (id) => {
    try {
      const res  = await djFetch(`${apiBase}/${id}/approve/`, { method:"POST" });
      const data = await res.json();

      if (!data.success) { showToast(data.message || "Error approving","err"); return; }

      if (type === "rehoming") {
        const record = records.find(r => r.id === id);
        if (record) {
          try {
            const animal = await createAnimalFromRehoming(record);
            console.log("✅ Animal created in Spring Boot:", animal);
            showToast(`Approved! ${record.pet_name || "Pet"} is now listed for adoption 🐾`);
          } catch (springErr) {
            console.error("❌ Spring Boot listing failed:", springErr);
            showToast(`Django approved but pet listing FAILED: ${springErr.message}`,"err");
          }
        }
      } else {
        showToast("Request approved ✓");
      }

      load(filter);
    } catch (e) {
      console.error("Approve error:", e);
      showToast("Network error","err");
    }
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const doReject = async (reason) => {
    try {
      const res  = await djFetch(`${apiBase}/${rejectId}/reject/`, { method:"POST", body:JSON.stringify({ reason }) });
      const data = await res.json();
      if (data.success) { showToast("Request rejected"); load(filter); }
      else showToast(data.message || "Error rejecting","err");
    } catch { showToast("Network error","err"); }
    setRejectId(null);
  };

  const label = type === "adoptions" ? "Adoption Requests" : "Rehome Requests";
  const tabs  = ["all","Pending","Approved","Rejected"];
  const counts = tabs.reduce((acc,t) => ({
    ...acc,
    [t]: t === "all" ? records.length : records.filter(r => r.status === t).length,
  }), {});

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-black text-lg" style={{ color:"#1a4a08",fontFamily:"'Playfair Display',serif" }}>
            {label}
          </div>
          <div className="text-xs font-semibold mt-0.5" style={{ color:"#9aaa80" }}>
            Review and process applications — {records.filter(r => r.status === "Pending").length} pending
            {type === "rehoming" && (
              <span style={{ marginLeft:"0.5rem",color:"#5aaa30" }}>
                · Approved rehomes auto-post to pet listings (with photo &amp; vaccination info)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 ${
                filter === t ? "bg-green-600 border-green-600 text-white" : "border-[#ddd0a8] text-[#7a9060] hover:bg-green-50"
              }`}>
              {t === "all" ? "All" : t}
              {counts[t] > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  filter === t ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}>{counts[t]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-sm font-bold" style={{ color:"#9aaa80" }}>
            No {filter === "all" ? "" : filter.toLowerCase() + " "}requests found
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((r, i) => (
            <RequestCard key={r.id || i} r={r} type={type} onApprove={approve} onReject={id => setRejectId(id)} onView={setViewTarget} />
          ))}
        </div>
      )}

      {/* Modals */}
      <RejectModal open={!!rejectId} onClose={() => setRejectId(null)} onConfirm={doReject} />
      <DetailModal
        r={viewTarget}
        type={type}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        onApprove={approve}
        onReject={id => { setViewTarget(null); setRejectId(id); }}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:"1.5rem",left:"50%",transform:"translateX(-50%)",
          zIndex:9999,padding:"0.7rem 1.25rem",borderRadius:12,fontWeight:800,
          fontSize:"0.84rem",background:toast.kind==="err"?"#c03030":"#1c4f09",
          color:"#fff",boxShadow:"0 8px 32px rgba(0,0,0,0.22)",
          fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.5rem",
          whiteSpace:"nowrap",
        }}>
          <i className={`fas ${toast.kind==="err"?"fa-times-circle":"fa-check-circle"}`} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}