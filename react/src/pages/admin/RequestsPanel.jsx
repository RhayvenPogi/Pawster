/**
 * RequestsPanel.jsx — Redesigned: clean, professional, no emojis, collapsible detail.
 * Props: type = "adoptions" | "rehoming"  |  show = boolean
 * FIXES:
 *  1. null is_vaccinated/is_neutered/etc. now shows "Unknown" (not hidden)
 *  2. Edit modal hides vacc detail fields when is_vaccinated is not "yes"/true
 *  3. Detail modal hides vacc detail fields when is_vaccinated is not "yes"/true
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { downloadAppointmentPDF } from "../../utils/downloadAppointmentPDF";
import { usePageTitle } from "../../hooks/usePageTitle";

const DJANGO = "";
const SPRING = "";

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
  const endpoints = [`${SPRING}/api/animals/upload-photo`, `${SPRING}/api/upload`];
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#fafaf8",
  surface:   "#ffffff",
  border:    "#e8e3d8",
  borderSub: "#f0ece2",
  text:      "#1a1a18",
  textSub:   "#6b6b60",
  textMute:  "#a8a89a",
  green:     "#2d6a1f",
  greenBg:   "rgba(45,106,31,0.06)",
  greenBdr:  "rgba(45,106,31,0.18)",
  amber:     "#b87c14",
  amberBg:   "rgba(184,124,20,0.06)",
  amberBdr:  "rgba(184,124,20,0.22)",
  red:       "#c0392b",
  redBg:     "rgba(192,57,43,0.05)",
  redBdr:    "rgba(192,57,43,0.20)",
  blue:      "#1a5a7a",
  blueBg:    "rgba(26,90,122,0.05)",
  blueBdr:   "rgba(26,90,122,0.18)",
};

const STATUS_CFG = {
  Pending:  { dot: C.amber, pill: { bg: C.amberBg, color: C.amber, border: C.amberBdr } },
  Approved: { dot: C.green, pill: { bg: C.greenBg, color: C.green, border: C.greenBdr } },
  Rejected: { dot: C.red,   pill: { bg: C.redBg,   color: C.red,   border: C.redBdr   } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * triLabel — converts stored values to display strings.
 * nullAsUnknown: when true, null/undefined → "Unknown" instead of null (hidden).
 * Used for rescue submissions where "unknown" is stored as null in DB.
 */
function triLabel(val, nullAsUnknown = false) {
  if (val === true  || val === "yes")    return "Yes";
  if (val === false || val === "no")     return "No";
  if (val === "unknown")                 return "Unknown";
  if (val === null || val === undefined) return nullAsUnknown ? "Unknown" : null;
  return String(val);
}

function parseVaccPhotos(r) {
  if (!r) return [];
  if (Array.isArray(r.vacc_photos) && r.vacc_photos.length > 0) return r.vacc_photos;
  if (typeof r.vacc_photos === "string" && r.vacc_photos.trim()) {
    try { const p = JSON.parse(r.vacc_photos.replace(/'/g, '"')); if (Array.isArray(p)) return p; } catch {}
  }
  return [];
}

function getPhotoSrc(r) {
  if (!r) return null;
  if (r.photo_base64 && r.photo_base64.length > 50) return r.photo_base64;
  if (r.photo_url && r.photo_url.length > 4) return r.photo_url;
  return null;
}

/** Returns true if is_vaccinated indicates the pet IS vaccinated */
function isVaccinatedYes(val) {
  return val === true || val === "yes";
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const font = "'Nunito', sans-serif";

const inputSt = {
  padding: "0.5rem 0.75rem",
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.surface,
  fontFamily: font,
  fontWeight: 600,
  fontSize: "0.84rem",
  color: C.text,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelSt = {
  fontSize: "0.62rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: C.textMute,
  marginBottom: 4,
  display: "block",
};

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status, small }) {
  const cfg = (STATUS_CFG[status] || STATUS_CFG.Pending).pill;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: small ? "0.18rem 0.55rem" : "0.25rem 0.7rem",
      borderRadius: 99,
      fontSize: small ? "0.65rem" : "0.72rem",
      fontWeight: 800,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ requestType, small }) {
  const isRescue = requestType === "rescue";
  return (
    <span style={{
      display: "inline-block",
      padding: small ? "0.15rem 0.5rem" : "0.2rem 0.6rem",
      borderRadius: 4,
      fontSize: small ? "0.58rem" : "0.65rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      background: isRescue ? C.blueBg : C.amberBg,
      color: isRescue ? C.blue : C.amber,
      border: `1px solid ${isRescue ? C.blueBdr : C.amberBdr}`,
      whiteSpace: "nowrap",
    }}>
      {isRescue ? "Rescue" : "Rehoming"}
    </span>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 420, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 40px rgba(0,0,0,0.14)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${C.borderSub}`, fontWeight: 800, fontSize: "0.9rem", color: C.text, fontFamily: font }}>
          Rejection Reason
        </div>
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: C.textSub, margin: 0 }}>
            This reason will be sent to the applicant via email and notification.
          </p>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Enter rejection reason…" style={{ ...inputSt, resize: "vertical" }} />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "0.55rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", background: "transparent", border: `1px solid ${C.border}`, color: C.textSub, cursor: "pointer", fontFamily: font }}>Cancel</button>
            <button onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); setReason(""); } }} disabled={!reason.trim()}
              style={{ padding: "0.55rem 1.1rem", borderRadius: 8, fontWeight: 800, fontSize: "0.82rem", background: reason.trim() ? C.red : "#e08080", border: "none", color: "#fff", cursor: reason.trim() ? "pointer" : "not-allowed", fontFamily: font }}>
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ open, record, type, onClose, onConfirm }) {
  if (!open || !record) return null;
  const label = type === "adoptions"
    ? `adoption request from ${record.name || "this applicant"} for ${record.animal_name || "an animal"}`
    : `rehoming request for ${record.pet_name || "this pet"}`;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 820, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 400, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 8px 40px rgba(0,0,0,0.14)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${C.redBdr}`, fontWeight: 800, fontSize: "0.9rem", color: C.red, fontFamily: font }}>Delete Request</div>
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, margin: 0, lineHeight: 1.55 }}>
            Permanently delete the <strong>{label}</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "0.55rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", background: "transparent", border: `1px solid ${C.border}`, color: C.textSub, cursor: "pointer", fontFamily: font }}>Cancel</button>
            <button onClick={onConfirm} style={{ padding: "0.55rem 1.1rem", borderRadius: 8, fontWeight: 800, fontSize: "0.82rem", background: C.red, border: "none", color: "#fff", cursor: "pointer", fontFamily: font }}>Delete Permanently</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ open, record, type, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState("tab0");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (record) { setForm({ ...record }); setActiveTab("tab0"); } }, [record]);
  if (!open || !record) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const isRescue = form.request_type === "rescue";

  // FIX: Vaccination detail fields only appear when is_vaccinated is true/"yes"
  const vaccDetailFields = isVaccinatedYes(form.is_vaccinated)
    ? [
        { key: "vaccine_type",  label: "Vaccine Type",        type: "text" },
        { key: "last_vacc_date",label: "Last Vaccinated",     type: "text" },
        { key: "vacc_clinic",   label: "Vet / Clinic",        type: "text" },
        { key: "vacc_notes",    label: "Vaccination Notes",   type: "textarea" },
      ]
    : [];

  const allAdoptionFields = [
    { key: "name", label: "Full Name", type: "text" }, { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "text" }, { key: "address", label: "Address", type: "text" },
    { key: "city", label: "City / Municipality", type: "text" }, { key: "province", label: "Province", type: "text" },
    { key: "zip", label: "Zip Code", type: "text" }, { key: "animal_name", label: "Animal Name", type: "text" },
    { key: "primary_caregiver", label: "Primary Caregiver", type: "text" }, { key: "housing", label: "Housing Type", type: "text" },
    { key: "household_size", label: "Household Size", type: "text" }, { key: "children_ages", label: "Children Ages", type: "text" },
    { key: "other_pets_detail", label: "Other Pets Detail", type: "text" }, { key: "exp", label: "Experience", type: "text" },
    { key: "alone_hours", label: "Hours Alone", type: "text" }, { key: "backup_care", label: "Backup Care", type: "text" },
    { key: "budget", label: "Monthly Budget", type: "text" }, { key: "vet_plan", label: "Vet Plan", type: "text" },
    { key: "reason", label: "Reason to Adopt", type: "textarea" }, { key: "behavior_response", label: "Behavior Response", type: "textarea" },
    { key: "previous_pet_details", label: "Previous Pet Info", type: "textarea" },
  ];

  const allRehomingFields = [
    { key: "owner_name", label: "Owner / Rescuer Name", type: "text" }, { key: "contact", label: "Contact", type: "text" },
    { key: "address", label: "Address", type: "text" }, { key: "city", label: "City / Municipality", type: "text" },
    { key: "province", label: "Province", type: "text" }, { key: "zip", label: "Zip Code", type: "text" },
    { key: "pet_name", label: "Pet Name", type: "text" }, { key: "species", label: "Species", type: "text" },
    { key: "breed", label: "Breed", type: "text" }, { key: "age", label: "Age", type: "text" },
    { key: "gender", label: "Gender", type: "text" },
    ...(!isRescue ? [{ key: "duration_owned", label: "Duration Owned", type: "text" }] : []),
    ...(isRescue  ? [{ key: "found_location", label: "Where Found", type: "text" }]   : []),
    { key: "ideal_home_desc", label: "Ideal Home", type: "textarea" },
    // FIX: vacc detail fields injected conditionally
    ...vaccDetailFields,
    { key: "medical_notes", label: "Medical Notes", type: "textarea" }, { key: "behavior", label: "Behavior", type: "text" },
    { key: "behavior_other", label: "Behavior Detail", type: "text" }, { key: "details", label: "Details", type: "textarea" },
    { key: "reason", label: isRescue ? "Reason for Surrendering" : "Reason for Rehoming", type: "textarea" },
    ...(!isRescue ? [{ key: "tried_alternatives", label: "Tried Alternatives", type: "textarea" }] : []),
  ];

  const boolFieldsAdoption = [
    { key: "owns_home", label: "Owns Home" }, { key: "pet_permission", label: "Pet Permission" },
    { key: "has_children", label: "Has Children" }, { key: "has_other_pets", label: "Has Other Pets" },
    { key: "other_pets_vaccinated", label: "Pets Vaccinated" }, { key: "open_to_guidance", label: "Open to Guidance" },
    { key: "previous_pet", label: "Had Previous Pet" },
  ];

  const boolFieldsRehoming = [
    { key: "is_vaccinated", label: "Vaccinated" }, { key: "is_neutered", label: "Neutered" },
    { key: "is_house_trained", label: "House Trained" }, { key: "is_leash_trained", label: "Leash Trained" },
    { key: "good_with_children", label: "Good with Children" }, { key: "good_with_pets", label: "Good with Pets" },
    { key: "has_aggression", label: "Has Aggression" }, { key: "can_provide_food", label: "Can Provide Food" },
    { key: "can_provide_carrier", label: "Can Provide Carrier" }, { key: "can_provide_records", label: "Can Provide Records" },
    { key: "understands_permanent", label: "Understands Permanent" }, { key: "open_to_followup", label: "Open to Follow-up" },
  ];

  const triStateRehomingKeys = new Set(["is_vaccinated", "is_neutered", "is_house_trained", "is_leash_trained", "good_with_children", "good_with_pets"]);

  // FIX: Health tab fieldKeys only include vacc details when vaccinated
  const healthFieldKeys = isVaccinatedYes(form.is_vaccinated)
    ? ["vaccine_type", "last_vacc_date", "vacc_clinic", "vacc_notes", "medical_notes"]
    : ["medical_notes"];

  const editTabsRehoming = [
    { key: "tab0", label: "Pet", fieldKeys: ["owner_name","contact","address","city","province","zip","pet_name","species","breed","age","gender","duration_owned","found_location","ideal_home_desc"] },
    { key: "tab1", label: "Health", fieldKeys: healthFieldKeys },
    { key: "tab2", label: "Behavior", fieldKeys: ["behavior","behavior_other","details"] },
    { key: "tab3", label: "Reason", fieldKeys: ["reason","tried_alternatives"] },
    { key: "tab4", label: "Flags", boolOnly: true },
  ];

  const editTabsAdoption = [
    { key: "tab0", label: "Applicant", fieldKeys: ["name","email","phone","address","city","province","zip","animal_name","primary_caregiver"] },
    { key: "tab1", label: "Housing", fieldKeys: ["housing","household_size","children_ages","other_pets_detail"] },
    { key: "tab2", label: "Time & Budget", fieldKeys: ["exp","alone_hours","backup_care","budget","vet_plan"] },
    { key: "tab3", label: "Commitment", fieldKeys: ["reason","behavior_response","previous_pet_details"] },
    { key: "tab4", label: "Flags", boolOnly: true },
  ];

  const editTabs   = type === "adoptions" ? editTabsAdoption : editTabsRehoming;
  const allFields  = type === "adoptions" ? allAdoptionFields : allRehomingFields;
  const boolFields = type === "adoptions" ? boolFieldsAdoption : boolFieldsRehoming;

  const curIdx = editTabs.findIndex(t => t.key === activeTab);
  const curTab = editTabs[curIdx];
  const isLast = curIdx === editTabs.length - 1;
  const visibleFields = curTab.boolOnly ? [] : allFields.filter(f => curTab.fieldKeys.includes(f.key));

  const cycleTriState = (key) => {
    const cur = form[key];
    if (type === "rehoming" && triStateRehomingKeys.has(key)) {
      const order = [null, "yes", "no", "unknown"];
      set(key, order[(order.indexOf(cur) + 1) % order.length]);
    } else { set(key, !cur); }
  };

  const triBtnState = (key) => {
    const v = form[key];
    if (v === true  || v === "yes")  return { label: "Yes",     bg: C.greenBg,  border: C.greenBdr,  color: C.green };
    if (v === false || v === "no")   return { label: "No",      bg: C.redBg,    border: C.redBdr,    color: C.red   };
    if (v === "unknown")             return { label: "Unknown", bg: C.amberBg,  border: C.amberBdr,  color: C.amber };
    // null also shows as Unknown for rehoming tri-state fields
    if (v === null && triStateRehomingKeys.has(key)) return { label: "Unknown", bg: C.amberBg, border: C.amberBdr, color: C.amber };
    return { label: "Not set", bg: "#f5f5f0", border: C.border, color: C.textMute };
  };

  const tabSt = (active) => ({
    padding: "0.55rem 0.875rem", fontSize: "0.78rem", fontWeight: 700,
    background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
    fontFamily: font, color: active ? C.green : C.textMute,
    borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
    transition: "color 0.15s",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 810, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 680, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 12px 48px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${C.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: C.text, fontFamily: font, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Edit {type === "adoptions" ? "Adoption" : "Rehoming"} Request
              {type === "rehoming" && form.request_type && <TypeBadge requestType={form.request_type} small />}
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.textMute, marginTop: 2 }}>#{record.id} · Status changes require Approve / Reject actions</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>✕</button>
        </div>

        {type === "rehoming" && (
          <div style={{ padding: "0.5rem 1.25rem", borderBottom: `1px solid ${C.borderSub}`, display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: C.textMute }}>Request type:</span>
            {["rehome","rescue"].map(v => (
              <button key={v} type="button" onClick={() => set("request_type", v)}
                style={{ padding: "0.28rem 0.75rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: font,
                  border: `1px solid ${form.request_type === v ? (v === "rescue" ? C.blueBdr : C.greenBdr) : C.border}`,
                  background: form.request_type === v ? (v === "rescue" ? C.blueBg : C.greenBg) : "transparent",
                  color: form.request_type === v ? (v === "rescue" ? C.blue : C.green) : C.textMute }}>
                {v === "rescue" ? "Rescue / Surrender" : "Rehoming"}
              </button>
            ))}
          </div>
        )}

        {/* Inline vaccination status toggle — always visible on Health tab for rehoming */}
        {type === "rehoming" && activeTab === "tab1" && (
          <div style={{ padding: "0.5rem 1.25rem", borderBottom: `1px solid ${C.borderSub}`, flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: C.textMute, whiteSpace: "nowrap" }}>Vaccinated:</span>
            {[
              { v: "yes",     label: "Yes",     bg: C.greenBg,  border: C.greenBdr,  color: C.green },
              { v: "no",      label: "No",      bg: C.redBg,    border: C.redBdr,    color: C.red   },
              { v: "unknown", label: "Unknown", bg: C.amberBg,  border: C.amberBdr,  color: C.amber },
            ].map(({ v, label, bg, border, color }) => {
              const cur = form.is_vaccinated;
              const active = cur === v || (v === "unknown" && (cur === null || cur === undefined || cur === "unknown"));
              return (
                <button key={v} type="button"
                  onClick={() => set("is_vaccinated", v === "yes" ? "yes" : v === "no" ? "no" : "unknown")}
                  style={{
                    padding: "0.28rem 0.875rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 800,
                    cursor: "pointer", fontFamily: font, transition: "all 0.15s",
                    border: `1px solid ${active ? border : C.border}`,
                    background: active ? bg : "transparent",
                    color: active ? color : C.textMute,
                  }}>
                  {label}
                </button>
              );
            })}
            {!isVaccinatedYes(form.is_vaccinated) && (
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: C.textMute, marginLeft: "0.25rem" }}>
                — set to <strong style={{ color: C.green }}>Yes</strong> to unlock vaccination details
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 1.25rem", flexShrink: 0, overflowX: "auto" }}>
          {editTabs.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabSt(activeTab === t.key)}>{t.label}</button>)}
        </div>

        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1 }}>
          {curTab.boolOnly ? (
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: C.textMute, marginBottom: "0.625rem" }}>Flags</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(185px,1fr))", gap: "0.45rem" }}>
                {boolFields.map(({ key, label }) => {
                  const s = triBtnState(key);
                  return (
                    <button key={key} type="button" onClick={() => cycleTriState(key)}
                      style={{ padding: "0.5rem 0.7rem", borderRadius: 8, border: `1px solid ${s.border}`, background: s.bg, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: s.color }}>{label}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: s.color, background: "rgba(255,255,255,0.6)", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              {visibleFields.map(({ key, label, type: ftype }) => (
                <div key={key} style={{ gridColumn: ftype === "textarea" ? "span 2" : "span 1" }}>
                  <label style={labelSt}>{label}</label>
                  {ftype === "textarea"
                    ? <textarea rows={3} value={form[key] ?? ""} onChange={e => set(key, e.target.value)} style={{ ...inputSt, resize: "vertical" }} />
                    : <input type={ftype} value={form[key] ?? ""} onChange={e => set(key, e.target.value)} style={inputSt} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${C.borderSub}`, display: "flex", gap: "0.5rem", flexShrink: 0, background: C.bg, alignItems: "center" }}>
          <button onClick={onClose} style={{ padding: "0.6rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", background: "transparent", border: `1px solid ${C.border}`, color: C.textSub, cursor: "pointer", fontFamily: font }}>Cancel</button>
          <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: 600, color: C.textMute, textAlign: "center" }}>{curIdx + 1} / {editTabs.length} — {curTab.label}</span>
          {curIdx > 0 && <button onClick={() => setActiveTab(editTabs[curIdx - 1].key)} style={{ padding: "0.6rem 1rem", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem", background: "transparent", border: `1px solid ${C.border}`, color: C.textSub, cursor: "pointer", fontFamily: font }}>Back</button>}
          {!isLast
            ? <button onClick={() => setActiveTab(editTabs[curIdx + 1].key)} style={{ padding: "0.6rem 1.1rem", borderRadius: 8, fontWeight: 800, fontSize: "0.82rem", color: "#fff", background: C.green, border: "none", cursor: "pointer", fontFamily: font }}>Next</button>
            : <button disabled={saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
                style={{ padding: "0.6rem 1.1rem", borderRadius: 8, fontWeight: 800, fontSize: "0.82rem", color: "#fff", background: saving ? "#6aaa50" : C.green, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: font }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>}
        </div>
      </div>
    </div>
  );
}

// ── Vacc photos gallery (lightbox) ────────────────────────────────────────────
function VaccPhotosGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null);
  const [idx, setIdx] = useState(0);
  if (!photos || photos.length === 0) return null;
  const open  = (src, i) => { setLightbox(src); setIdx(i); };
  const goNext = e => { e.stopPropagation(); const n = (idx+1)%photos.length; setLightbox(photos[n]); setIdx(n); };
  const goPrev = e => { e.stopPropagation(); const p = (idx-1+photos.length)%photos.length; setLightbox(photos[p]); setIdx(p); };

  return (
    <>
      <div>
        <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: "0.5rem" }}>
          Vaccination Records ({photos.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {photos.map((src, i) => (
            <button key={i} type="button" onClick={() => open(src, i)}
              style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: `1.5px solid ${C.greenBdr}`, padding: 0, cursor: "pointer", position: "relative", flexShrink: 0 }}>
              <img src={src} alt={`Vacc ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ position: "absolute", bottom: 2, right: 3, background: "rgba(0,0,0,0.55)", borderRadius: 3, padding: "1px 4px", fontSize: "0.5rem", fontWeight: 800, color: "#fff" }}>{i+1}</div>
            </button>
          ))}
        </div>
      </div>
      {lightbox && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Vaccination record" style={{ maxWidth: "88vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          {photos.length > 1 && (
            <>
              <button onClick={goPrev} style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", fontSize: "1rem" }}>‹</button>
              <button onClick={goNext} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", fontSize: "1rem" }}>›</button>
            </>
          )}
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 18, right: 18, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>✕</button>
          <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "0.25rem 0.7rem", fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>
            {idx+1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}

// ── Full record fetch hook ────────────────────────────────────────────────────
function useFullRecord(record, apiBase, enabled) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(false);
  const prevId = useRef(null);

  useEffect(() => {
    if (!enabled || !record?.id) { setFull(null); return; }
    if (prevId.current === record.id && full) return;
    let cancelled = false;
    setLoading(true); setFull(null);
    prevId.current = record.id;
    djFetch(`${apiBase}/${record.id}/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        setFull(data ? { ...record, ...(data?.data ?? data) } : { ...record });
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setFull({ ...record }); setLoading(false); } });
    return () => { cancelled = true; };
  }, [record?.id, enabled]);

  return { full: full || record, loading };
}

// ── PDF Download Button ───────────────────────────────────────────────────────
function DownloadPDFButton({ record, type }) {
  const [busy, setBusy] = useState(false);
  const isAdoption = type === "adoptions";
  const apiBase    = isAdoption ? "/api/approvals/adoptions" : "/api/approvals/rehoming";

  const handle = async () => {
    if (!record?.id) return;
    setBusy(true);
    try {
      const res = await djFetch(`${apiBase}/${record.id}/`);
      let full = record;
      if (res.ok) { const d = await res.json(); full = d?.data ?? d; }
      await downloadAppointmentPDF({ ...full, _type: isAdoption ? "Adoption" : "Rehoming" }, "admin");
    } catch {
      try { await downloadAppointmentPDF({ ...record, _type: isAdoption ? "Adoption" : "Rehoming" }, "admin"); } catch {}
    }
    setBusy(false);
  };

  return (
    <button onClick={handle} disabled={busy}
      style={{ padding: "0.5rem 0.875rem", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, cursor: busy ? "not-allowed" : "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: "0.35rem", opacity: busy ? 0.6 : 1, whiteSpace: "nowrap" }}>
      {busy ? "Generating…" : "Download PDF"}
    </button>
  );
}

// ── Field display ─────────────────────────────────────────────────────────────
function FieldRow({ label, value, accent, warn }) {
  return (
    <div style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: warn ? C.redBg : accent ? C.greenBg : "#f7f6f2", border: `1px solid ${warn ? C.redBdr : accent ? C.greenBdr : C.borderSub}` }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: warn ? C.red : accent ? C.green : C.text, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{String(value)}</div>
    </div>
  );
}

// FIX: TriRow now accepts nullAsUnknown prop
function TriRow({ label, value, nullAsUnknown = false }) {
  const display = triLabel(value, nullAsUnknown);
  if (!display) return null;
  const isYes = display === "Yes", isNo = display === "No", isUnknown = display === "Unknown";
  return (
    <div style={{ padding: "0.45rem 0.7rem", borderRadius: 8, background: isYes ? C.greenBg : isNo ? C.redBg : C.amberBg, border: `1px solid ${isYes ? C.greenBdr : isNo ? C.redBdr : C.amberBdr}` }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: isYes ? C.green : isNo ? C.red : C.amber }}>{display}</div>
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function DetailModal({ r, type, open, onClose, onApprove, onReject, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState("tab0");
  const [photoExpanded, setPhotoExpanded] = useState(false);

  const apiBase = type === "adoptions" ? "/api/approvals/adoptions" : "/api/approvals/rehoming";
  const { full: record, loading: detailLoading } = useFullRecord(r, apiBase, open && !!r);

  useEffect(() => { if (open) { setActiveTab("tab0"); setPhotoExpanded(false); } }, [open, r?.id]);
  if (!open || !r) return null;

  const status   = record.status || "Pending";
  const isRescue = record.request_type === "rescue";
  const photoSrc   = type === "rehoming" ? getPhotoSrc(record) : null;
  const vaccPhotos = type === "rehoming" ? parseVaccPhotos(record) : [];
  const vaccYes    = isVaccinatedYes(record.is_vaccinated);

  const fmt = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "string" && v.trim() === "") return null;
    return String(v);
  };

  const tabSt = (active) => ({
    padding: "0.5rem 0.875rem", fontSize: "0.78rem", fontWeight: 700, background: "none",
    border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: font,
    color: active ? C.green : C.textMute,
    borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
  });

  // FIX: Health tab vacc detail fields only shown when vaccinated
  const vaccDetailFields = vaccYes
    ? [
        ["Vaccine Type", fmt(record.vaccine_type)],
        ["Last Vaccinated", fmt(record.last_vacc_date)],
        ["Vet / Clinic", fmt(record.vacc_clinic)],
        ["Vaccination Notes", fmt(record.vacc_notes)],
      ]
    : [];

  const rehomingTabs = [
    { key: "tab0", label: "Pet", sections: [{ title: "Pet Details", fields: [
        ["Request Type", record.request_type === "rescue" ? "Rescue / Surrender" : record.request_type === "rehome" ? "Rehoming" : null],
        ["Pet Name", fmt(record.pet_name)], ["Species", fmt(record.species)], ["Breed", fmt(record.breed)],
        ["Age", fmt(record.age)], ["Gender", fmt(record.gender)],
        ...(!isRescue ? [["Duration Owned", fmt(record.duration_owned)]] : []),
        ...(isRescue  ? [["Where Found",    fmt(record.found_location)]] : []),
        ["Ideal Home", fmt(record.ideal_home_desc)],
      ]}, { title: "Owner / Rescuer", fields: [
        ["Name", fmt(record.owner_name)], ["Contact", fmt(record.contact)],
        ["City", fmt(record.city || record.municipality)], ["Province", fmt(record.province)],
        ["Address", fmt(record.address || record.home_address)],
      ]}],
    },
    { key: "tab1", label: "Health", sections: [{ title: "Vaccination & Health", fields: [
        // FIX: vacc detail fields gated on vaccYes
        ...vaccDetailFields,
        ["Medical Notes", fmt(record.medical_notes)],
      ]}],
    },
    { key: "tab2", label: "Behavior", triState: true, sections: [{ title: "Behavior", fields: [
        ["Behavior", fmt(record.behavior)], ["Detail", fmt(record.behavior_other)],
        ["Has Aggression", fmt(record.has_aggression)],
      ]}],
    },
    { key: "tab3", label: "Reason & Consent", sections: [
      { title: "Reason & Details", fields: [
        ["Reason", fmt(record.reason)], ["Details", fmt(record.details)],
        ...(!isRescue ? [["Tried Alternatives", fmt(record.tried_alternatives)]] : []),
      ]},
      { title: "Transition & Consent", fields: [
        ["Can Provide Food", fmt(record.can_provide_food)], ["Can Provide Carrier", fmt(record.can_provide_carrier)],
        ["Can Provide Records", fmt(record.can_provide_records)],
        ["Understands Permanent", fmt(record.understands_permanent)], ["Open to Follow-up", fmt(record.open_to_followup)],
      ]},
    ]},
  ];

  const adoptionTabs = [
    { key: "tab0", label: "Applicant", sections: [{ title: "Applicant Info", fields: [
        ["Full Name", fmt(record.name)], ["Email", fmt(record.email)], ["Phone", fmt(record.phone)],
        ["City", fmt(record.city)], ["Province", fmt(record.province)], ["Address", fmt(record.address)],
        ["Animal", fmt(record.animal_name)], ["Primary Caregiver", fmt(record.primary_caregiver)],
      ]}]},
    { key: "tab1", label: "Housing", sections: [
      { title: "Housing", fields: [["Housing Type", fmt(record.housing)], ["Owns / Rents", record.owns_home !== undefined ? (record.owns_home ? "Owns" : "Rents") : null], ["Pet Permission", fmt(record.pet_permission)], ["Household Size", fmt(record.household_size)], ["Has Children", fmt(record.has_children)], ["Children Ages", fmt(record.children_ages)]] },
      { title: "Other Pets", fields: [["Has Other Pets", fmt(record.has_other_pets)], ["Other Pets Detail", fmt(record.other_pets_detail)], ["Pets Vaccinated", fmt(record.other_pets_vaccinated)]] },
    ]},
    { key: "tab2", label: "Time & Budget", sections: [{ title: "Time & Budget", fields: [["Experience", fmt(record.exp)], ["Hours Alone", fmt(record.alone_hours)], ["Backup Care", fmt(record.backup_care)], ["Monthly Budget", fmt(record.budget)], ["Vet Plan", fmt(record.vet_plan)]] }] },
    { key: "tab3", label: "Commitment", sections: [{ title: "Commitment", fields: [["Behavior Response", fmt(record.behavior_response)], ["Open to Guidance", fmt(record.open_to_guidance)], ["Previous Pet", fmt(record.previous_pet)], ["Previous Pet Info", fmt(record.previous_pet_details)], ["Reason to Adopt", fmt(record.reason)]] }] },
  ];

  const detailTabs = type === "adoptions" ? adoptionTabs : rehomingTabs;
  const curTab     = detailTabs.find(t => t.key === activeTab) || detailTabs[0];

  const accentSet = new Set(["Vaccinated","Neutered","Open to Follow-up","Understands Permanent","Can Provide Food","Can Provide Carrier","Can Provide Records"]);
  const warnSet   = new Set(["Has Aggression"]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 680, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 12px 48px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${C.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: "0.88rem", color: C.text, fontFamily: font }}>
                {type === "rehoming"
                  ? `${record.pet_name || "—"} · ${record.owner_name || "Unknown"}`
                  : `${record.name || "Applicant"} · ${record.animal_name || "—"}`}
              </span>
              {type === "rehoming" && record.request_type && <TypeBadge requestType={record.request_type} small />}
              <StatusPill status={status} small />
              {detailLoading && <span style={{ fontSize: "0.65rem", color: C.textMute, fontWeight: 600 }}>Loading…</span>}
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.textMute }}>
              #{record.id} · Submitted {record.created_at ? new Date(record.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
        </div>

        {/* Rescue context banner */}
        {type === "rehoming" && isRescue && (
          <div style={{ padding: "0.45rem 1.25rem", background: C.blueBg, borderBottom: `1px solid ${C.blueBdr}`, fontSize: "0.72rem", fontWeight: 600, color: C.blue, flexShrink: 0 }}>
            Rescue / Surrender — some fields may be blank or marked Unknown if the rescuer didn't know the animal's full history.
            {record.found_location ? ` Found at: ${record.found_location}.` : ""}
          </div>
        )}

        {/* Pet photo — collapsible */}
        {type === "rehoming" && (photoSrc || (detailLoading && !photoSrc)) && (
          <div style={{ flexShrink: 0 }}>
            <button type="button" onClick={() => setPhotoExpanded(p => !p)}
              style={{ width: "100%", padding: "0.45rem 1.25rem", borderBottom: `1px solid ${C.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7f6f2", border: "none", cursor: "pointer", fontFamily: font }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute }}>Pet Photo</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: C.textMute }}>{photoExpanded ? "Collapse" : "Expand"}</span>
            </button>
            {photoExpanded && (
              <div style={{ borderBottom: `1px solid ${C.borderSub}`, overflow: "hidden" }}>
                {detailLoading && !photoSrc ? (
                  <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", color: C.textMute, fontWeight: 600, fontFamily: font }}>Loading photo…</div>
                ) : (
                  <img src={photoSrc} alt={record.pet_name || "Pet"} style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 1.25rem", flexShrink: 0, overflowX: "auto" }}>
          {detailTabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabSt(activeTab === t.key)}>
              {t.label}
              {t.key === "tab1" && vaccPhotos.length > 0 && type === "rehoming" && (
                <span style={{ marginLeft: "0.3rem", fontSize: "0.6rem", fontWeight: 800, background: C.greenBg, color: C.green, padding: "0.05rem 0.3rem", borderRadius: 4 }}>{vaccPhotos.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Health status tri-state (tab1, rehoming only) */}
          {curTab.key === "tab1" && type === "rehoming" && (
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: "0.5rem" }}>Health Status</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.75rem" }}>
                {/* FIX: nullAsUnknown so null → "Unknown" displayed with amber pill */}
                <TriRow label="Vaccinated"        value={record.is_vaccinated} nullAsUnknown />
                <TriRow label="Spayed / Neutered" value={record.is_neutered}   nullAsUnknown />
              </div>
            </div>
          )}

          {/* Vacc photos on Health tab — only when vaccinated */}
          {curTab.key === "tab1" && type === "rehoming" && (
            vaccYes ? (
              detailLoading && vaccPhotos.length === 0 ? (
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: C.textMute, fontFamily: font }}>Loading vaccination photos…</div>
              ) : vaccPhotos.length > 0 ? (
                <div style={{ padding: "0.75rem", borderRadius: 10, background: C.greenBg, border: `1px solid ${C.greenBdr}` }}>
                  <VaccPhotosGallery photos={vaccPhotos} />
                </div>
              ) : (
                <div style={{ padding: "0.5rem 0.75rem", borderRadius: 8, background: "#f7f6f2", border: `1px solid ${C.borderSub}`, fontSize: "0.75rem", fontWeight: 600, color: C.textMute }}>
                  No vaccination record photos uploaded.
                </div>
              )
            ) : (
              // FIX: when not vaccinated, show status note instead of vacc details
              <div style={{
                padding: "0.65rem 0.875rem", borderRadius: 8,
                background: record.is_vaccinated === false || record.is_vaccinated === "no" ? C.redBg : C.amberBg,
                border: `1px solid ${record.is_vaccinated === false || record.is_vaccinated === "no" ? C.redBdr : C.amberBdr}`,
                fontSize: "0.78rem", fontWeight: 600,
                color: record.is_vaccinated === false || record.is_vaccinated === "no" ? C.red : C.amber,
              }}>
                {record.is_vaccinated === false || record.is_vaccinated === "no"
                  ? "This pet has not been vaccinated. No vaccination records available."
                  : "Vaccination status is unknown — records may not be available. This is common for rescue / stray animals."}
              </div>
            )
          )}

          {activeTab === "tab0" && record.reject_note && (
            <div style={{ padding: "0.65rem 0.875rem", borderRadius: 8, background: C.redBg, border: `1px solid ${C.redBdr}`, fontSize: "0.8rem", fontWeight: 600, color: C.red }}>
              <strong>Rejection note:</strong> {record.reject_note}
            </div>
          )}

          {/* Behavioral tri-state section */}
          {curTab.triState && type === "rehoming" && (
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: "0.5rem" }}>Behavioral Assessment</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.75rem" }}>
                {/* FIX: nullAsUnknown for all rescue-optional behavioral fields */}
                <TriRow label="House Trained"      value={record.is_house_trained}   nullAsUnknown />
                <TriRow label="Leash Trained"      value={record.is_leash_trained}   nullAsUnknown />
                <TriRow label="Good w/ Children"   value={record.good_with_children} nullAsUnknown />
                <TriRow label="Good w/ Other Pets" value={record.good_with_pets}     nullAsUnknown />
              </div>
            </div>
          )}

          {curTab.sections.map(({ title, fields }) => {
            const visible = fields.filter(([, v]) => v !== null && v !== undefined);
            if (visible.length === 0) return null;
            return (
              <div key={title}>
                <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: "0.5rem", paddingBottom: "0.3rem", borderBottom: `1px solid ${C.borderSub}` }}>{title}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  {visible.map(([label, value]) => (
                    <FieldRow key={label} label={label} value={value}
                      accent={accentSet.has(label) && (value === "Yes" || value === "true")}
                      warn={warnSet.has(label) && value === "Yes"} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.75rem 1.25rem", borderTop: `1px solid ${C.borderSub}`, display: "flex", gap: "0.5rem", flexShrink: 0, background: C.bg, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => { onEdit(record); onClose(); }} style={{ padding: "0.5rem 0.875rem", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", color: C.text, background: "transparent", border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: font }}>Edit</button>
          <button onClick={() => { onDelete(record); onClose(); }} style={{ padding: "0.5rem 0.875rem", borderRadius: 8, fontWeight: 700, fontSize: "0.78rem", color: C.red, background: "transparent", border: `1px solid ${C.redBdr}`, cursor: "pointer", fontFamily: font }}>Delete</button>
          <DownloadPDFButton record={record} type={type} />
          {status === "Pending" && (
            <>
              <button onClick={() => { onApprove(record.id); onClose(); }}
                style={{ marginLeft: "auto", padding: "0.55rem 1.1rem", borderRadius: 8, fontWeight: 800, fontSize: "0.82rem", color: "#fff", background: C.green, border: "none", cursor: "pointer", fontFamily: font }}>
                Approve
              </button>
              <button onClick={() => { onReject(record.id); onClose(); }}
                style={{ padding: "0.55rem 1.1rem", borderRadius: 8, fontWeight: 800, fontSize: "0.82rem", color: "#fff", background: C.red, border: "none", cursor: "pointer", fontFamily: font }}>
                Reject
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
  const [expanded, setExpanded] = useState(false);

  const status    = r.status || "Pending";
  const cfg       = STATUS_CFG[status];
  const isRescue  = r.request_type === "rescue";
  const photoSrc  = type === "rehoming" ? getPhotoSrc(r) : null;
  const vaccPhotos = type === "rehoming" ? parseVaccPhotos(r) : [];

  const ownerName = type === "rehoming"
    ? (r.owner_name ?? "Unknown Owner")
    : (r.name || "Applicant");
  const initials  = ownerName.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";

  const primaryLabel = type === "adoptions" ? (r.animal_name || "—")     : (r.pet_name || "—");
  const subLabel     = type === "adoptions" ? (r.email || "—")           : ([r.species, r.breed].filter(Boolean).join(" · ") || "—");

  const compactDetails = type === "adoptions"
    ? [["City", r.city || "—"], ["Budget", r.budget || "—"], ["Phone", r.phone || "—"]]
    : [
        ["Species", r.species || "—"],
        isRescue ? ["Found at", r.found_location || "—"] : ["Duration", r.duration_owned || "—"],
        ["Contact", r.contact || "—"],
      ];

  const expandedDetails = type === "adoptions"
    ? [["Province", r.province || "—"], ["Housing", r.housing || "—"], ["Household", r.household_size || "—"], ["Vet Plan", r.vet_plan || "—"]]
    : [
        // FIX: nullAsUnknown so null shows as "Unknown" not hidden
        ["Vaccinated", triLabel(r.is_vaccinated, true) ?? "Unknown"],
        ["Neutered",   triLabel(r.is_neutered,   true) ?? "Unknown"],
        ["Behavior",   r.behavior || "—"],
        ["Vacc photos", vaccPhotos.length > 0 ? `${vaccPhotos.length} attached` : "None"],
      ];

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>

      <div style={{ height: 3, background: cfg.dot, flexShrink: 0 }} />

      {type === "rehoming" && photoSrc && (
        <div style={{ height: 140, overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <img src={photoSrc} alt={r.pet_name || "Pet"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => { e.target.parentElement.style.display = "none"; }} />
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: "0.35rem" }}>
            <TypeBadge requestType={r.request_type || "rehome"} small />
          </div>
          {vaccPhotos.length > 0 && (
            <div style={{ position: "absolute", top: 8, right: 8 }}>
              <span style={{ padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "0.62rem", fontWeight: 800 }}>
                {vaccPhotos.length} vacc photo{vaccPhotos.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {type === "rehoming" && !photoSrc && (
        <div style={{ padding: "0.6rem 1rem", borderBottom: `1px solid ${C.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <TypeBadge requestType={r.request_type || "rehome"} small />
          {(r.has_photo || r.photo_url) && (
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: C.textMute, background: "#f7f6f2", padding: "0.15rem 0.5rem", borderRadius: 4, border: `1px solid ${C.border}` }}>Photo available — click View</span>
          )}
          {vaccPhotos.length > 0 && (
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: C.green, background: C.greenBg, padding: "0.15rem 0.5rem", borderRadius: 4, border: `1px solid ${C.greenBdr}` }}>
              {vaccPhotos.length} vacc photo{vaccPhotos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      <div style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: type === "adoptions" ? C.green : "#8c4a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 900, color: "#fff", flexShrink: 0, fontFamily: font }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "0.85rem", color: C.text, fontFamily: font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {type === "rehoming" ? primaryLabel : ownerName}
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {type === "rehoming" ? ownerName : primaryLabel}
            </div>
          </div>
          <StatusPill status={status} small />
        </div>

        <div style={{ height: 1, background: C.borderSub }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
          {compactDetails.map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: "0.58rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: "0.76rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</div>
            </div>
          ))}
        </div>

        {expanded && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem", paddingTop: "0.25rem", borderTop: `1px solid ${C.borderSub}` }}>
            {expandedDetails.map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: "0.58rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: "0.76rem", fontWeight: 600, color: C.text }}>{val}</div>
              </div>
            ))}
            {(r.reason || r.details) && (
              <div style={{ gridColumn: "span 2", padding: "0.4rem 0.65rem", borderRadius: 7, background: "#f7f6f2", border: `1px solid ${C.borderSub}`, marginTop: 2 }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute, marginBottom: 3 }}>
                  {type === "adoptions" ? "Reason for adoption" : isRescue ? "Reason for surrendering" : "Reason for rehoming"}
                </div>
                <div style={{ fontSize: "0.76rem", fontWeight: 600, color: C.textSub, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.reason || r.details}
                </div>
              </div>
            )}
            {type === "rehoming" && (r.can_provide_food || r.can_provide_carrier || r.can_provide_records) && (
              <div style={{ gridColumn: "span 2", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {r.can_provide_food    && <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBdr}` }}>Food incl.</span>}
                {r.can_provide_carrier && <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBdr}` }}>Carrier incl.</span>}
                {r.can_provide_records && <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBdr}` }}>Records incl.</span>}
              </div>
            )}
            {type === "rehoming" && isRescue && r.found_location && (
              <div style={{ gridColumn: "span 2", padding: "0.4rem 0.65rem", borderRadius: 7, background: C.blueBg, border: `1px solid ${C.blueBdr}` }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.blue, marginBottom: 2 }}>Found at</div>
                <div style={{ fontSize: "0.76rem", fontWeight: 600, color: C.blue }}>{r.found_location}</div>
              </div>
            )}
            {r.reject_note && status === "Rejected" && (
              <div style={{ gridColumn: "span 2", padding: "0.4rem 0.65rem", borderRadius: 7, background: C.redBg, border: `1px solid ${C.redBdr}`, fontSize: "0.76rem", fontWeight: 600, color: C.red }}>
                <strong>Rejected:</strong> {r.reject_note}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.66rem", fontWeight: 600, color: C.textMute }}>
            {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
          </span>
          <button type="button" onClick={() => setExpanded(p => !p)}
            style={{ fontSize: "0.68rem", fontWeight: 700, color: C.textSub, background: "none", border: "none", cursor: "pointer", padding: "0.15rem 0.4rem", borderRadius: 4, fontFamily: font }}>
            {expanded ? "Less" : "More"}
          </button>
        </div>

        <div style={{ height: 1, background: C.borderSub }} />

        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => onView(r)} style={{ padding: "0.48rem 0.8rem", borderRadius: 7, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, cursor: "pointer", fontFamily: font }}>View</button>
          <button onClick={() => onEdit(r)} style={{ padding: "0.48rem 0.8rem", borderRadius: 7, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${C.border}`, background: "transparent", color: C.textSub, cursor: "pointer", fontFamily: font }}>Edit</button>
          <button onClick={() => onDelete(r)} style={{ padding: "0.48rem 0.8rem", borderRadius: 7, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${C.redBdr}`, background: "transparent", color: C.red, cursor: "pointer", fontFamily: font }}>Delete</button>
          <DownloadPDFButton record={r} type={type} />
          {status === "Pending" ? (
            <div style={{ display: "flex", gap: "0.35rem", marginLeft: "auto" }}>
              <button onClick={() => onApprove(r.id)} style={{ padding: "0.48rem 0.875rem", borderRadius: 7, fontWeight: 800, fontSize: "0.78rem", color: "#fff", background: C.green, border: "none", cursor: "pointer", fontFamily: font }}>Approve</button>
              <button onClick={() => onReject(r.id)}  style={{ padding: "0.48rem 0.875rem", borderRadius: 7, fontWeight: 800, fontSize: "0.78rem", color: "#fff", background: C.red,   border: "none", cursor: "pointer", fontFamily: font }}>Reject</button>
            </div>
          ) : (
            <span style={{ marginLeft: "auto", fontSize: "0.72rem", fontWeight: 700, color: C.textMute }}>{status === "Approved" ? "Approved" : "Rejected"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function RequestsPanel({ type, show, onStatsChange }) {
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [filter,       setFilter]       = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [rejectId,     setRejectId]     = useState(null);
  const [viewTarget,   setViewTarget]   = useState(null);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

  usePageTitle(type === "adoptions" ? "Adoption Requests" : "Rehome Requests");
  const apiBase = type === "adoptions" ? "/api/approvals/adoptions" : "/api/approvals/rehoming";

  const showToast = (msg, kind = "ok") => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async (status = "all") => {
    setLoading(true);
    try {
      const res  = await djFetch(`${apiBase}/admin/${status !== "all" ? `?status=${status}` : ""}`);
      if (res.status === 401) { showToast("Unauthorized — please log in as admin", "err"); setLoading(false); return; }
      const data = await res.json();
      if (data.success) setRecords(data.data || []);
      else showToast(data.message || "Failed to load", "err");
    } catch { showToast("Failed to load requests", "err"); }
    setLoading(false);
  }, [type]);

  useEffect(() => { if (show) load(filter); }, [show, filter, load]);

  const approve = async (id) => {
    try {
      const res  = await djFetch(`${apiBase}/${id}/approve/`, { method: "POST" });
      const data = await res.json();
      if (!data.success) { showToast(data.message || "Error approving", "err"); return; }
      showToast(type === "rehoming" ? `Approved — ${records.find(r => r.id === id)?.pet_name || "pet"} listed` : "Request approved");
      load(filter); onStatsChange?.();
    } catch { showToast("Network error", "err"); }
  };

  const doReject = async (reason) => {
    try {
      const res  = await djFetch(`${apiBase}/${rejectId}/reject/`, { method: "POST", body: JSON.stringify({ reason }) });
      const data = await res.json();
      if (data.success) { showToast("Request rejected"); load(filter); onStatsChange?.(); }
      else showToast(data.message || "Error rejecting", "err");
    } catch { showToast("Network error", "err"); }
    setRejectId(null);
  };

  const doUpdate = async (form) => {
    try {
      const res  = await djFetch(`${apiBase}/${form.id}/update/`, { method: "PATCH", body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { showToast("Changes saved"); setEditTarget(null); load(filter); }
      else showToast(data.message || "Error saving", "err");
    } catch { showToast("Network error", "err"); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await djFetch(`${apiBase}/${deleteTarget.id}/delete/`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Request deleted"); setDeleteTarget(null); load(filter); onStatsChange?.(); }
      else showToast(data.message || "Error deleting", "err");
    } catch { showToast("Network error", "err"); }
  };

  const tabs   = ["all", "Pending", "Approved", "Rejected"];
  const label  = type === "adoptions" ? "Adoption Requests" : "Rehome & Rescue Requests";

  const visibleRecords = records.filter(r => typeFilter === "all" || r.request_type === typeFilter);
  const counts = tabs.reduce((acc, t) => ({ ...acc, [t]: t === "all" ? visibleRecords.length : visibleRecords.filter(r => r.status === t).length }), {});

  const rescueCount = records.filter(r => r.request_type === "rescue").length;
  const rehomeCount = records.filter(r => r.request_type === "rehome" || !r.request_type).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontFamily: font }}>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "1.15rem", color: C.text, letterSpacing: "-0.01em" }}>{label}</div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.textMute, marginTop: 3 }}>
            {records.filter(r => r.status === "Pending").length} pending review
            {type === "rehoming" && " · Approved rehomes are auto-posted to listings"}
          </div>
        </div>

        {type === "rehoming" && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { label: "Total",    value: records.length },
              { label: "Pending",  value: records.filter(r => r.status === "Pending").length, warn: true },
              { label: "Rehoming", value: rehomeCount },
              { label: "Rescue",   value: rescueCount },
            ].map(({ label: l, value, warn }) => (
              <div key={l} style={{ borderRadius: 8, border: `1px solid ${warn && value > 0 ? C.amberBdr : C.border}`, padding: "0.5rem 0.875rem", textAlign: "center", background: C.surface }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: warn && value > 0 ? C.amber : C.green }}>{value}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {type === "rehoming" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMute }}>Type</span>
          {[{ key: "all", label: "All" }, { key: "rehome", label: "Rehoming" }, { key: "rescue", label: "Rescue / Surrender" }].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              style={{ padding: "0.35rem 0.75rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, border: `1px solid ${typeFilter === t.key ? C.green : C.border}`, background: typeFilter === t.key ? C.greenBg : "transparent", color: typeFilter === t.key ? C.green : C.textSub, cursor: "pointer", fontFamily: font }}>
              {t.label} <span style={{ fontWeight: 600, opacity: 0.7, marginLeft: "0.2rem" }}>({t.key === "all" ? records.length : t.key === "rescue" ? rescueCount : rehomeCount})</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: "0.4rem 0.875rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: filter === t ? 800 : 700, border: `1px solid ${filter === t ? C.green : C.border}`, background: filter === t ? C.greenBg : "transparent", color: filter === t ? C.green : C.textSub, cursor: "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {t === "all" ? "All" : t}
            {counts[t] > 0 && (
              <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "0.1rem 0.35rem", borderRadius: 4, background: filter === t ? C.green : "#f0ece2", color: filter === t ? "#fff" : C.textMute }}>{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "0.75rem", color: C.textMute, fontSize: "0.82rem", fontWeight: 600 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${C.green}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
          Loading requests…
        </div>
      ) : visibleRecords.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: C.textMute, fontSize: "0.82rem", fontWeight: 600 }}>
          No {filter === "all" ? "" : filter.toLowerCase() + " "}requests found
          {typeFilter !== "all" && ` for ${typeFilter === "rescue" ? "rescue / surrender" : "rehoming"}`}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1rem" }}>
          {visibleRecords.map((r, i) => (
            <RequestCard key={r.id || i} r={r} type={type} onApprove={approve} onReject={id => setRejectId(id)} onView={setViewTarget} onEdit={setEditTarget} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <RejectModal open={!!rejectId} onClose={() => setRejectId(null)} onConfirm={doReject} />
      <DetailModal r={viewTarget} type={type} open={!!viewTarget} onClose={() => setViewTarget(null)}
        onApprove={approve} onReject={id => { setViewTarget(null); setRejectId(id); }}
        onEdit={r => { setViewTarget(null); setEditTarget(r); }} onDelete={r => { setViewTarget(null); setDeleteTarget(r); }} />
      <EditModal open={!!editTarget} record={editTarget} type={type} onClose={() => setEditTarget(null)} onSave={doUpdate} />
      <DeleteModal open={!!deleteTarget} record={deleteTarget} type={type} onClose={() => setDeleteTarget(null)} onConfirm={doDelete} />

      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "0.65rem 1.25rem", borderRadius: 10, fontWeight: 700, fontSize: "0.82rem", background: toast.kind === "err" ? C.red : C.green, color: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,0.2)", fontFamily: font, display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}