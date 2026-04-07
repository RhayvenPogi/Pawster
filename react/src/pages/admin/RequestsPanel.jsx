/**
 * RequestsPanel.jsx
 * Admin panel component — calls Django instead of PHP.
 * Handles both adoption and rehoming requests.
 * Props: type = "adoptions" | "rehoming"  |  show = boolean
 *
 * CRUD:
 *  ✅ Create  — submit_adoption / submit_rehoming (user-facing, unchanged)
 *  ✅ Read    — list_adoptions / list_rehoming
 *  ✅ Update  — PATCH /<pk>/update/  (admin Edit modal)
 *  ✅ Delete  — DELETE /<pk>/delete/ (admin, with confirm dialog)
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

async function uploadPhotoToSpring(base64DataUrl) {
  if (!base64DataUrl) return null;
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
    } catch { /* try next */ }
  }
  return base64DataUrl;
}

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
            <button onClick={onClose} style={{ padding:"0.6rem 1.1rem",borderRadius:10,fontWeight:800,fontSize:"0.84rem",background:"transparent",border:"1px solid rgba(180,140,60,0.28)",color:"#3a5020",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <span style={{ fontSize:"1rem",lineHeight:1 }}>✕</span> Cancel
            </button>
            <button onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); setReason(""); } }}
              disabled={!reason.trim()}
              style={{ padding:"0.6rem 1.25rem",borderRadius:10,fontWeight:900,fontSize:"0.84rem",background:reason.trim()?"#c03030":"#e08080",border:"none",color:"#fff",cursor:reason.trim()?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <span style={{ fontSize:"1rem",lineHeight:1 }}>✕</span> Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ open, record, type, onClose, onConfirm }) {
  if (!open || !record) return null;
  const label = type === "adoptions"
    ? `adoption request from ${record.name || "this applicant"} for ${record.animal_name || "an animal"}`
    : `rehoming request for ${record.pet_name || "this pet"}`;

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:820,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"rgba(10,6,2,0.65)",backdropFilter:"blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:"100%",maxWidth:420,borderRadius:18,background:"#fffce8",border:"1px solid rgba(192,48,48,0.3)",boxShadow:"0 16px 48px rgba(40,20,5,0.35)",overflow:"hidden" }}>
        <div style={{ padding:"1.1rem 1.25rem",borderBottom:"1px solid rgba(192,48,48,0.15)",display:"flex",alignItems:"center",gap:"0.6rem" }}>
          <div style={{ width:32,height:32,borderRadius:8,background:"rgba(192,48,48,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <span style={{ color:"#c03030",fontSize:"0.9rem" }}>🗑</span>
          </div>
          <span style={{ fontWeight:900,fontSize:"0.95rem",color:"#c03030",fontFamily:"'Nunito',sans-serif" }}>Delete Request</span>
        </div>
        <div style={{ padding:"1rem 1.25rem",display:"flex",flexDirection:"column",gap:"1rem" }}>
          <p style={{ fontSize:"0.84rem",fontWeight:700,color:"#3a2010",margin:0,lineHeight:1.5 }}>
            Are you sure you want to permanently delete the <strong>{label}</strong>? This action cannot be undone.
          </p>
          <div style={{ display:"flex",gap:"0.5rem",justifyContent:"flex-end" }}>
            <button onClick={onClose}
              style={{ padding:"0.6rem 1.1rem",borderRadius:10,fontWeight:800,fontSize:"0.84rem",background:"transparent",border:"1px solid rgba(180,140,60,0.28)",color:"#3a5020",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <span style={{ fontSize:"1rem",lineHeight:1 }}>✕</span> Cancel
            </button>
            <button onClick={onConfirm}
              style={{ padding:"0.6rem 1.25rem",borderRadius:10,fontWeight:900,fontSize:"0.84rem",background:"#c03030",border:"none",color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <span style={{ fontSize:"1rem",lineHeight:1 }}>🗑</span> Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ open, record, type, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) setForm({ ...record });
  }, [record]);

  if (!open || !record) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const adoptionFields = [
    { key: "name",              label: "Full Name",        type: "text" },
    { key: "email",             label: "Email",            type: "email" },
    { key: "phone",             label: "Phone",            type: "text" },
    { key: "address",           label: "Address",          type: "text" },
    { key: "animal_name",       label: "Animal Name",      type: "text" },
    { key: "housing",           label: "Housing Type",     type: "text" },
    { key: "household_size",    label: "Household Size",   type: "text" },
    { key: "budget",            label: "Monthly Budget",   type: "text" },
    { key: "alone_hours",       label: "Hours Alone",      type: "text" },
    { key: "exp",               label: "Experience",       type: "text" },
    { key: "vet_plan",          label: "Vet Plan",         type: "text" },
    { key: "backup_care",       label: "Backup Care",      type: "text" },
    { key: "reason",            label: "Reason to Adopt",  type: "textarea" },
    { key: "behavior_response", label: "Behavior Response",type: "textarea" },
    { key: "primary_caregiver", label: "Primary Caregiver",type: "text" },
    { key: "children_ages",     label: "Children Ages",    type: "text" },
    { key: "other_pets_detail", label: "Other Pets Detail",type: "text" },
    { key: "previous_pet_details", label: "Previous Pet Info", type: "textarea" },
  ];

  const rehomingFields = [
    { key: "pet_name",        label: "Pet Name",         type: "text" },
    { key: "species",         label: "Species",          type: "text" },
    { key: "breed",           label: "Breed",            type: "text" },
    { key: "age",             label: "Age",              type: "text" },
    { key: "gender",          label: "Gender",           type: "text" },
    { key: "contact",         label: "Contact",          type: "text" },
    { key: "duration_owned",  label: "Duration Owned",   type: "text" },
    { key: "vaccine_type",    label: "Vaccine Type",     type: "text" },
    { key: "last_vacc_date",  label: "Last Vaccinated",  type: "text" },
    { key: "vacc_clinic",     label: "Vet / Clinic",     type: "text" },
    { key: "vacc_notes",      label: "Vaccination Notes",type: "textarea" },
    { key: "medical_notes",   label: "Medical Notes",    type: "textarea" },
    { key: "behavior",        label: "Behavior",         type: "text" },
    { key: "behavior_other",  label: "Behavior Detail",  type: "text" },
    { key: "ideal_home_desc", label: "Ideal Home",       type: "textarea" },
    { key: "reason",          label: "Reason for Rehoming", type: "textarea" },
    { key: "details",         label: "Details",          type: "textarea" },
    { key: "tried_alternatives", label: "Tried Alternatives", type: "textarea" },
  ];

  const boolFieldsAdoption = [
    { key: "owns_home",              label: "Owns Home" },
    { key: "pet_permission",         label: "Pet Permission" },
    { key: "has_children",           label: "Has Children" },
    { key: "has_other_pets",         label: "Has Other Pets" },
    { key: "other_pets_vaccinated",  label: "Pets Vaccinated" },
    { key: "open_to_guidance",       label: "Open to Guidance" },
    { key: "previous_pet",           label: "Had Previous Pet" },
  ];

  const boolFieldsRehoming = [
    { key: "is_vaccinated",      label: "Vaccinated" },
    { key: "is_neutered",        label: "Neutered" },
    { key: "is_house_trained",   label: "House Trained" },
    { key: "is_leash_trained",   label: "Leash Trained" },
    { key: "good_with_children", label: "Good with Children" },
    { key: "good_with_pets",     label: "Good with Pets" },
    { key: "has_aggression",     label: "Has Aggression" },
    { key: "can_provide_food",   label: "Can Provide Food" },
    { key: "can_provide_carrier",label: "Can Provide Carrier" },
    { key: "can_provide_records",label: "Can Provide Records" },
  ];

  const fields     = type === "adoptions" ? adoptionFields     : rehomingFields;
  const boolFields = type === "adoptions" ? boolFieldsAdoption : boolFieldsRehoming;

  const inputStyle = {
    padding:"0.5rem 0.75rem",
    borderRadius:10,
    border:"1px solid rgba(180,140,60,0.28)",
    background:"rgba(255,250,232,0.8)",
    fontFamily:"'Nunito',sans-serif",
    fontWeight:700,
    fontSize:"0.84rem",
    color:"#1a2e0a",
    outline:"none",
    width:"100%",
    boxSizing:"border-box",
  };

  const labelStyle = {
    fontSize:"0.62rem",
    fontWeight:900,
    textTransform:"uppercase",
    letterSpacing:"0.07em",
    color:"#9aaa80",
    marginBottom:4,
    display:"block",
  };

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:810,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"rgba(10,6,2,0.65)",backdropFilter:"blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:"100%",maxWidth:700,borderRadius:20,background:"#fffce8",border:"1px solid rgba(180,140,60,0.3)",boxShadow:"0 24px 64px rgba(40,20,5,0.45)",display:"flex",flexDirection:"column",maxHeight:"92vh",overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"1rem 1.25rem",borderBottom:"1px solid rgba(180,140,60,0.2)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(28,79,9,0.06),rgba(90,170,48,0.03))",flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1rem",color:"#1a4a08",display:"flex",alignItems:"center",gap:"0.5rem" }}>
              <span style={{ fontSize:"0.85rem",color:"#5aaa30" }}>✏️</span>
              Edit {type === "adoptions" ? "Adoption" : "Rehoming"} Request
            </div>
            <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#6a7a50",marginTop:2 }}>
              #{record.id} · Status changes require Approve / Reject actions
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:30,height:30,borderRadius:8,border:"1px solid rgba(192,48,48,0.2)",background:"rgba(192,48,48,0.08)",color:"#c03030",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem" }}>
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:"auto",padding:"1rem 1.25rem",flex:1,display:"flex",flexDirection:"column",gap:"1.25rem" }}>

          {/* Text / textarea fields — 2-col grid */}
          <div>
            <div style={{ fontSize:"0.7rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#1c4f09",marginBottom:"0.625rem",display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <span style={{ color:"#5aaa30",fontSize:"0.72rem" }}>📄</span> Record Fields
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.625rem" }}>
              {fields.map(({ key, label, type: ftype }) => (
                <div key={key} style={{ gridColumn: ftype === "textarea" ? "span 2" : "span 1" }}>
                  <label style={labelStyle}>{label}</label>
                  {ftype === "textarea" ? (
                    <textarea
                      rows={3}
                      value={form[key] ?? ""}
                      onChange={e => set(key, e.target.value)}
                      style={{ ...inputStyle, resize:"vertical" }}
                    />
                  ) : (
                    <input
                      type={ftype}
                      value={form[key] ?? ""}
                      onChange={e => set(key, e.target.value)}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Boolean toggles */}
          <div>
            <div style={{ fontSize:"0.7rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#1c4f09",marginBottom:"0.625rem",display:"flex",alignItems:"center",gap:"0.4rem" }}>
              <span style={{ color:"#5aaa30",fontSize:"0.72rem" }}>🔘</span> Flags
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.5rem" }}>
              {boolFields.map(({ key, label }) => {
                const val = form[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(key, !val)}
                    style={{
                      padding:"0.5rem 0.75rem",
                      borderRadius:10,
                      border: val ? "1px solid rgba(90,170,48,0.45)" : "1px solid rgba(180,140,60,0.25)",
                      background: val ? "rgba(28,79,9,0.07)" : "rgba(255,248,218,0.5)",
                      display:"flex",
                      alignItems:"center",
                      gap:"0.5rem",
                      cursor:"pointer",
                      transition:"all 0.15s",
                      textAlign:"left",
                    }}
                  >
                    <span style={{
                      width:16,
                      height:16,
                      borderRadius:4,
                      border: val ? "2px solid #5aaa30" : "2px solid rgba(180,140,60,0.35)",
                      background: val ? "#5aaa30" : "transparent",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      flexShrink:0,
                      transition:"all 0.15s",
                      fontSize:"0.55rem",
                      color:"#fff",
                    }}>
                      {val && "✓"}
                    </span>
                    <span style={{ fontSize:"0.78rem",fontWeight:800,color: val ? "#1c4f09" : "#7a8060" }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding:"0.875rem 1.25rem",borderTop:"1px solid rgba(180,140,60,0.18)",display:"flex",gap:"0.625rem",flexShrink:0,background:"rgba(255,252,235,0.97)" }}>
          <button onClick={onClose}
            style={{ padding:"0.7rem 1.25rem",borderRadius:11,fontWeight:800,fontSize:"0.88rem",background:"transparent",border:"1px solid rgba(180,140,60,0.3)",color:"#3a5020",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
            <span style={{ fontSize:"1rem",lineHeight:1 }}>✕</span> Cancel
          </button>
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(form);
              setSaving(false);
            }}
            style={{ flex:1,padding:"0.7rem",borderRadius:11,fontWeight:900,fontSize:"0.88rem",color:"#fff",background: saving ? "#5aaa30aa" : "#1c7a09",border:"none",cursor: saving ? "not-allowed" : "pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem",transition:"background 0.15s" }}>
            {saving
              ? <><div style={{ width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }}/> Saving…</>
              : <><span style={{ fontSize:"1rem",lineHeight:1 }}>💾</span> Save Changes</>
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          <span style={{ color:"#5aaa30" }}>🖼</span> Vaccination Record Photos ({photos.length})
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
            ✕
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
function DetailModal({ r, type, open, onClose, onApprove, onReject, onEdit, onDelete }) {
  if (!open || !r) return null;
  const status = r.status || "Pending";
  const cfg    = STATUS_CFG[status] || STATUS_CFG.Pending;

  const photoSrc = type === "rehoming"
    ? (r.photo_base64 || r.photo_url || null)
    : null;

  let vaccPhotos = [];
  if (type === "rehoming") {
    if (Array.isArray(r.vacc_photos)) {
      vaccPhotos = r.vacc_photos;
    } else if (typeof r.vacc_photos === "string" && r.vacc_photos.trim()) {
      try {
        vaccPhotos = JSON.parse(r.vacc_photos.replace(/'/g, '"'));
      } catch {
        vaccPhotos = [];
      }
    }
  }

  const fmt = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? "Yes ✓" : "No";
    if (typeof v === "string" && v.trim() === "") return null;
    return String(v);
  };

  const adoptionSections = [
    {
      title: "Applicant", icon: "👤",
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
      title: "Housing", icon: "🏠",
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
      title: "Other Pets", icon: "🐶",
      fields: [
        ["Has Other Pets",      r.has_other_pets !== undefined ? fmt(r.has_other_pets) : null],
        ["Other Pets Detail",   fmt(r.other_pets_detail)],
        ["Pets Vaccinated",     r.other_pets_vaccinated !== undefined ? fmt(r.other_pets_vaccinated) : null],
      ],
    },
    {
      title: "Time & Budget", icon: "🕐",
      fields: [
        ["Experience",       fmt(r.exp)],
        ["Hours Alone",      fmt(r.alone_hours)],
        ["Backup Care",      fmt(r.backup_care)],
        ["Monthly Budget",   fmt(r.budget)],
        ["Vet Plan",         fmt(r.vet_plan)],
      ],
    },
    {
      title: "Commitment", icon: "📋",
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
      title: "Pet Details", icon: "🐾",
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
      title: "Health", icon: "💉",
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
      title: "Behavior", icon: "⭐",
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
      title: "Contact & Reason", icon: "📞",
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
      <div style={{ width:"100%",maxWidth:680,borderRadius:20,background:"#fffce8",border:"1px solid rgba(180,140,60,0.28)",boxShadow:"0 24px 64px rgba(40,20,5,0.45)",display:"flex",flexDirection:"column",maxHeight:"92vh",overflow:"hidden" }}>

        {/* Header */}
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
              style={{ width:30,height:30,borderRadius:8,border:"1px solid rgba(192,48,48,0.2)",background:"rgba(192,48,48,0.08)",color:"#c03030",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem" }}>
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto",padding:"1rem 1.25rem",flex:1,display:"flex",flexDirection:"column",gap:"1rem" }}>
          {photoSrc && (
            <div style={{ borderRadius:14,overflow:"hidden",border:"1px solid rgba(180,140,60,0.22)",flexShrink:0 }}>
              <img src={photoSrc} alt={r.pet_name||"Pet photo"} style={{ width:"100%",maxHeight:240,objectFit:"cover",display:"block" }}/>
            </div>
          )}

          {vaccPhotos.length > 0 && (
            <div style={{ padding:"0.875rem",borderRadius:12,background:"rgba(28,79,9,0.05)",border:"1px solid rgba(90,170,48,0.22)",flexShrink:0 }}>
              <VaccPhotosGallery photos={vaccPhotos}/>
            </div>
          )}

          {r.reject_note && (
            <div style={{ padding:"0.75rem 1rem",borderRadius:12,background:"rgba(192,48,48,0.06)",border:"1px solid rgba(192,48,48,0.2)",fontSize:"0.82rem",fontWeight:700,color:"#c03030",flexShrink:0 }}>
              <strong>Rejection note:</strong> {r.reject_note}
            </div>
          )}

          {sections.map(({ title, icon, fields }) => {
            const visibleFields = fields.filter(([, v]) => v !== null && v !== undefined);
            if (visibleFields.length === 0) return null;
            return (
              <div key={title}>
                <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.5rem",paddingBottom:"0.3rem",borderBottom:"1px solid rgba(180,140,60,0.20)" }}>
                  <span style={{ fontSize:"0.78rem" }}>{icon}</span>
                  <span style={{ fontSize:"0.7rem",fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",color:"#1c4f09" }}>{title}</span>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem" }}>
                  {visibleFields.map(([label, value]) => (
                    <FieldPill
                      key={label}
                      label={label}
                      value={value}
                      accent={
                        (label === "Vaccinated"    && value === "Yes ✓") ||
                        (label === "Neutered"      && value === "Yes ✓") ||
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

        {/* Footer actions */}
        <div style={{ padding:"0.875rem 1.25rem",borderTop:"1px solid rgba(180,140,60,0.18)",display:"flex",gap:"0.5rem",flexShrink:0,background:"rgba(255,252,235,0.97)",flexWrap:"wrap" }}>
          <button onClick={() => { onEdit(r); onClose(); }}
            style={{ padding:"0.65rem 1.1rem",borderRadius:11,fontWeight:900,fontSize:"0.84rem",color:"#1a4a08",background:"rgba(255,248,218,0.9)",border:"1px solid rgba(180,140,60,0.35)",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
            <span style={{ fontSize:"0.9rem" }}>✏️</span> Edit
          </button>
          <button onClick={() => { onDelete(r); onClose(); }}
            style={{ padding:"0.65rem 1.1rem",borderRadius:11,fontWeight:900,fontSize:"0.84rem",color:"#c03030",background:"rgba(192,48,48,0.06)",border:"1px solid rgba(192,48,48,0.25)",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"0.4rem" }}>
            <span style={{ fontSize:"0.9rem" }}>🗑</span> Delete
          </button>

          {status === "Pending" && (
            <>
              <button onClick={() => { onApprove(r.id); onClose(); }}
                style={{ flex:1,minWidth:100,padding:"0.7rem",borderRadius:11,fontWeight:900,fontSize:"0.88rem",color:"#fff",background:"#1c7a09",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem" }}>
                <span>✓</span> Approve
              </button>
              <button onClick={() => { onReject(r.id); onClose(); }}
                style={{ flex:1,minWidth:100,padding:"0.7rem",borderRadius:11,fontWeight:900,fontSize:"0.88rem",color:"#fff",background:"#c03030",border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.4rem" }}>
                <span>✕</span> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ r, type, onApprove, onReject, onView, onEdit, onDelete }) {
  const status   = r.status || "Pending";
  const name     = r.name || r.animal_name || "Applicant";
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

      {photoSrc ? (
        <div style={{ width:"100%",height:150,overflow:"hidden",flexShrink:0,position:"relative" }}>
          <img src={photoSrc} alt={r.pet_name||"Pet"} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
          {r.is_vaccinated && (
            <span style={{ position:"absolute",top:8,left:8,padding:"0.2rem 0.5rem",borderRadius:50,background:"rgba(28,79,9,0.85)",color:"#fff",fontSize:"0.65rem",fontWeight:900,display:"flex",alignItems:"center",gap:"0.3rem" }}>
              💉 Vaccinated
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

        {type === "rehoming" && r.is_vaccinated && r.vaccine_type && (
          <div style={{ padding:"0.5rem 0.75rem",borderRadius:10,background:"rgba(28,79,9,0.06)",border:"1px solid rgba(90,170,48,0.25)",display:"flex",alignItems:"center",gap:"0.5rem" }}>
            <span style={{ fontSize:"0.85rem",flexShrink:0 }}>💉</span>
            <div>
              <div style={{ fontSize:"0.68rem",fontWeight:900,color:"#1c4f09",textTransform:"uppercase",letterSpacing:"0.05em" }}>Vaccine</div>
              <div style={{ fontSize:"0.78rem",fontWeight:700,color:"#1a4a08" }}>{r.vaccine_type}{r.last_vacc_date ? ` · ${r.last_vacc_date}` : ""}</div>
            </div>
          </div>
        )}

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

        {type === "rehoming" && status === "Approved" && (
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background:"rgba(28,79,9,0.07)",border:"1px solid rgba(90,170,48,0.28)" }}>
            <span style={{ fontSize:"0.85rem" }}>🐾</span>
            <span className="text-xs font-bold" style={{ color:"#1c4f09" }}>
              {r.pet_name || "Pet"} has been listed for adoption
            </span>
          </div>
        )}

        {r.reject_note && status === "Rejected" && (
          <div className="rounded-xl p-3 text-xs font-semibold" style={{ background:"rgba(192,48,48,0.06)",border:"1px solid rgba(192,48,48,0.2)",color:"#c03030" }}>
            <strong>Rejected:</strong> {r.reject_note}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1 flex-wrap">
          <button onClick={() => onView(r)}
            className="px-3 py-2 rounded-xl text-xs font-black border transition-all hover:bg-amber-50"
            style={{ background:"rgba(255,248,218,0.7)",borderColor:"rgba(180,140,60,0.28)",color:"#7a6030",display:"flex",alignItems:"center",gap:"0.3rem" }}>
            <span>👁</span> View
          </button>

          <button onClick={() => onEdit(r)}
            className="px-3 py-2 rounded-xl text-xs font-black border transition-all"
            style={{ background:"rgba(90,170,48,0.08)",borderColor:"rgba(90,170,48,0.3)",color:"#1c6a09",display:"flex",alignItems:"center",gap:"0.3rem" }}
            title="Edit record">
            <span>✏️</span> Edit
          </button>

          <button onClick={() => onDelete(r)}
            className="px-3 py-2 rounded-xl text-xs font-black border transition-all"
            style={{ background:"rgba(192,48,48,0.05)",borderColor:"rgba(192,48,48,0.22)",color:"#c03030",display:"flex",alignItems:"center",gap:"0.3rem" }}
            title="Delete record">
            <span>🗑</span>
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
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [filter,       setFilter]       = useState("all");
  const [rejectId,     setRejectId]     = useState(null);
  const [viewTarget,   setViewTarget]   = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

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
      const res  = await djFetch(`${apiBase}/${id}/approve/`, { method: "POST" });
      const data = await res.json();
      if (!data.success) { showToast(data.message || "Error approving", "err"); return; }
      showToast(
        type === "rehoming"
          ? `Approved! ${records.find(r => r.id === id)?.pet_name || "Pet"} is now listed 🐾`
          : "Request approved ✓"
      );
      load(filter);
    } catch (e) {
      console.error("Approve error:", e);
      showToast("Network error", "err");
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

  // ── Update ───────────────────────────────────────────────────────────────
  const doUpdate = async (form) => {
    try {
      const res  = await djFetch(`${apiBase}/${form.id}/update/`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Changes saved ✓");
        setEditTarget(null);
        load(filter);
      } else {
        showToast(data.message || "Error saving","err");
      }
    } catch { showToast("Network error","err"); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await djFetch(`${apiBase}/${deleteTarget.id}/delete/`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(
          type === "adoptions"
            ? `Adoption request deleted`
            : `Rehoming request for ${deleteTarget.pet_name || "pet"} deleted`
        );
        setDeleteTarget(null);
        load(filter);
      } else {
        showToast(data.message || "Error deleting","err");
      }
    } catch { showToast("Network error","err"); }
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
            <RequestCard
              key={r.id || i}
              r={r}
              type={type}
              onApprove={approve}
              onReject={id => setRejectId(id)}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <RejectModal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={doReject}
      />
      <DetailModal
        r={viewTarget}
        type={type}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        onApprove={approve}
        onReject={id => { setViewTarget(null); setRejectId(id); }}
        onEdit={r => { setViewTarget(null); setEditTarget(r); }}
        onDelete={r => { setViewTarget(null); setDeleteTarget(r); }}
      />
      <EditModal
        open={!!editTarget}
        record={editTarget}
        type={type}
        onClose={() => setEditTarget(null)}
        onSave={doUpdate}
      />
      <DeleteModal
        open={!!deleteTarget}
        record={deleteTarget}
        type={type}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
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
          <span>{toast.kind==="err" ? "✕" : "✓"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}