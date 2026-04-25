/**
 * RequestsPanel.jsx
 * Admin panel component — calls Django instead of PHP.
 * Handles both adoption and rehoming requests.
 * Props: type = "adoptions" | "rehoming"  |  show = boolean
 *
 * FIXED:
 *   - Pet photo (photo_base64 / photo_url) fetched per-record when missing from list
 *   - Vacc photos (vacc_photos) parsed and shown in card + detail gallery
 *   - request_type (rehome | rescue) badge shown everywhere
 *   - found_location (rescue-only) shown in card + detail
 *   - open_to_followup + understands_permanent surfaced
 *   - Tri-state (yes/no/unknown) display for behavioral fields
 *   - All transition supply flags (can_provide_food/carrier/records)
 *   - Duration owned (rehome) vs found_location (rescue) conditional display
 *   - Photo fetching: on detail open, full record is fetched from /id/ endpoint
 *     so large base64 fields (photo_base64, vacc_photos) are always available
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

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Pending:  { bg: "bg-amber-50",  border: "border-amber-200",  dot: "#f59e0b", pill: "bg-amber-100 text-amber-700"  },
  Approved: { bg: "bg-green-50",  border: "border-green-200",  dot: "#22c55e", pill: "bg-green-100 text-green-700"  },
  Rejected: { bg: "bg-red-50",    border: "border-red-200",    dot: "#ef4444", pill: "bg-red-100 text-red-700"      },
};

// ── Request type badge (rehome vs rescue) ─────────────────────────────────────
function RequestTypeBadge({ requestType, small = false }) {
  const isRescue = requestType === "rescue";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: small ? "0.15rem 0.5rem" : "0.2rem 0.65rem",
      borderRadius: 99,
      fontSize: small ? "0.6rem" : "0.68rem",
      fontWeight: 900,
      background: isRescue ? "rgba(40,100,140,0.10)" : "rgba(180,90,34,0.10)",
      color: isRescue ? "#1a5a7a" : "#8c3c14",
      border: `1px solid ${isRescue ? "rgba(60,140,180,0.30)" : "rgba(180,90,34,0.28)"}`,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {isRescue ? "🫶" : "🏠"} {isRescue ? "Rescue / Surrender" : "Rehoming"}
    </span>
  );
}

// ── Tri-state value display (yes / no / unknown / null) ───────────────────────
function triLabel(val) {
  if (val === true  || val === "yes")     return "Yes ✓";
  if (val === false || val === "no")      return "No";
  if (val === "unknown")                  return "Unknown";
  if (val === null  || val === undefined) return null;
  return String(val);
}

// ── Shared style helpers ──────────────────────────────────────────────────────
const TAB_BASE = {
  padding: "0.6rem 0.875rem",
  fontSize: "0.82rem",
  fontWeight: 800,
  background: "none",
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "'Nunito',sans-serif",
  transition: "color 0.15s, border-color 0.15s",
};

const tabStyle = (active) => ({
  ...TAB_BASE,
  borderBottom: active ? "2px solid #1c4f09" : "2px solid transparent",
  color: active ? "#1c4f09" : "#9aaa80",
});

const inputStyle = {
  padding: "0.5rem 0.75rem",
  borderRadius: 10,
  border: "1px solid rgba(180,140,60,0.28)",
  background: "rgba(255,250,232,0.8)",
  fontFamily: "'Nunito',sans-serif",
  fontWeight: 700,
  fontSize: "0.84rem",
  color: "#1a2e0a",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "0.62rem",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#9aaa80",
  marginBottom: 4,
  display: "block",
};

// ── Helper: parse vacc_photos from record ─────────────────────────────────────
function parseVaccPhotos(r) {
  if (!r) return [];
  if (Array.isArray(r.vacc_photos) && r.vacc_photos.length > 0) return r.vacc_photos;
  if (typeof r.vacc_photos === "string" && r.vacc_photos.trim()) {
    try {
      const parsed = JSON.parse(r.vacc_photos.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed;
    } catch { return []; }
  }
  return [];
}

// ── Helper: get photo src from record ────────────────────────────────────────
function getPhotoSrc(r) {
  if (!r) return null;
  if (r.photo_base64 && r.photo_base64.length > 50) return r.photo_base64;
  if (r.photo_url && r.photo_url.length > 4) return r.photo_url;
  return null;
}

// ── PDF Download Button ───────────────────────────────────────────────────────
function DownloadPDFButton({ record, type, small = false }) {
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  const isAdoption = type === "adoptions";
  const apiBase = isAdoption ? "/api/approvals/adoptions" : "/api/approvals/rehoming";

  const handle = async () => {
    if (!record?.id) return;
    setBusy(true);
    setErrMsg(null);
    try {
      const res = await djFetch(`${apiBase}/${record.id}/`);
      let fullRecord = record;
      if (res.ok) {
        const data = await res.json();
        fullRecord = data?.data ?? data;
      }
      await downloadAppointmentPDF(
        { ...fullRecord, _type: isAdoption ? "Adoption" : "Rehoming" },
        "admin"
      );
    } catch (e) {
      console.error("PDF generation error:", e);
      setErrMsg("Failed to generate PDF");
      try {
        await downloadAppointmentPDF(
          { ...record, _type: isAdoption ? "Adoption" : "Rehoming" },
          "admin"
        );
        setErrMsg(null);
      } catch { /* give up */ }
    }
    setBusy(false);
  };

  const borderColor = isAdoption ? "rgba(90,170,48,0.42)"  : "rgba(180,90,34,0.40)";
  const bgColor     = isAdoption ? "rgba(28,79,9,0.08)"    : "rgba(140,60,20,0.08)";
  const bgBusy      = isAdoption ? "rgba(28,79,9,0.04)"    : "rgba(140,60,20,0.04)";
  const textColor   = isAdoption ? "#1c4f09"               : "#8c3c14";

  return (
    <>
      <button
        onClick={handle}
        disabled={busy}
        className="px-3 py-2 rounded-xl text-xs font-black border transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: busy ? bgBusy : bgColor, borderColor, color: textColor, display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap", fontFamily: "'Nunito',sans-serif" }}
        title="Download PDF receipt"
      >
        {busy ? (
          <>
            <span style={{ display: "inline-block", width: 11, height: 11, borderRadius: "50%", border: `2px solid ${textColor}44`, borderTopColor: textColor, animation: "spin 0.7s linear infinite" }} />
            {small ? "PDF" : "Generating…"}
          </>
        ) : (
          <>{isAdoption ? "🐾" : "🏠"} {small ? "PDF" : "Download PDF"}</>
        )}
      </button>
      {errMsg && <span style={{ fontSize: "0.65rem", color: "#c03030", fontWeight: 700 }}>{errMsg}</span>}
    </>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 18, background: "#fffce8", border: "1px solid rgba(180,140,60,0.28)", boxShadow: "0 16px 48px rgba(40,20,5,0.35)", overflow: "hidden" }}>
        <div style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.18)", fontWeight: 900, fontSize: "0.95rem", color: "#1a4a08", fontFamily: "'Nunito',sans-serif" }}>
          Rejection Reason
        </div>
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#6a7a50", margin: 0 }}>
            Please provide a reason. This will be sent to the applicant via email and notification.
          </p>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Enter rejection reason…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "0.6rem 1.1rem", borderRadius: 10, fontWeight: 800, fontSize: "0.84rem", background: "transparent", border: "1px solid rgba(180,140,60,0.28)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              ✕ Cancel
            </button>
            <button
              onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); setReason(""); } }}
              disabled={!reason.trim()}
              style={{ padding: "0.6rem 1.25rem", borderRadius: 10, fontWeight: 900, fontSize: "0.84rem", background: reason.trim() ? "#c03030" : "#e08080", border: "none", color: "#fff", cursor: reason.trim() ? "pointer" : "not-allowed", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              ✕ Confirm Rejection
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
      style={{ position: "fixed", inset: 0, zIndex: 820, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 420, borderRadius: 18, background: "#fffce8", border: "1px solid rgba(192,48,48,0.3)", boxShadow: "0 16px 48px rgba(40,20,5,0.35)", overflow: "hidden" }}>
        <div style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid rgba(192,48,48,0.15)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(192,48,48,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#c03030", fontSize: "0.9rem" }}>🗑</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: "0.95rem", color: "#c03030", fontFamily: "'Nunito',sans-serif" }}>Delete Request</span>
        </div>
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "#3a2010", margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to permanently delete the <strong>{label}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "0.6rem 1.1rem", borderRadius: 10, fontWeight: 800, fontSize: "0.84rem", background: "transparent", border: "1px solid rgba(180,140,60,0.28)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              ✕ Cancel
            </button>
            <button onClick={onConfirm} style={{ padding: "0.6rem 1.25rem", borderRadius: 10, fontWeight: 900, fontSize: "0.84rem", background: "#c03030", border: "none", color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              🗑 Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal (tabbed) ───────────────────────────────────────────────────────
function EditModal({ open, record, type, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState("tab0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) { setForm({ ...record }); setActiveTab("tab0"); }
  }, [record]);

  if (!open || !record) return null;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isRescue = form.request_type === "rescue";

  const allAdoptionFields = [
    { key: "name", label: "Full Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "address", label: "Address", type: "text" },
    { key: "city", label: "City / Municipality", type: "text" },
    { key: "province", label: "Province", type: "text" },
    { key: "zip", label: "Zip / Postal Code", type: "text" },
    { key: "animal_name", label: "Animal Name", type: "text" },
    { key: "primary_caregiver", label: "Primary Caregiver", type: "text" },
    { key: "housing", label: "Housing Type", type: "text" },
    { key: "household_size", label: "Household Size", type: "text" },
    { key: "children_ages", label: "Children Ages", type: "text" },
    { key: "other_pets_detail", label: "Other Pets Detail", type: "text" },
    { key: "exp", label: "Experience", type: "text" },
    { key: "alone_hours", label: "Hours Alone", type: "text" },
    { key: "backup_care", label: "Backup Care", type: "text" },
    { key: "budget", label: "Monthly Budget", type: "text" },
    { key: "vet_plan", label: "Vet Plan", type: "text" },
    { key: "reason", label: "Reason to Adopt", type: "textarea" },
    { key: "behavior_response", label: "Behavior Response", type: "textarea" },
    { key: "previous_pet_details", label: "Previous Pet Info", type: "textarea" },
  ];

  const allRehomingFields = [
    { key: "owner_name", label: "Owner / Rescuer Name", type: "text" },
    { key: "contact", label: "Contact", type: "text" },
    { key: "address", label: "Address", type: "text" },
    { key: "city", label: "City / Municipality", type: "text" },
    { key: "province", label: "Province", type: "text" },
    { key: "zip", label: "Zip / Postal Code", type: "text" },
    { key: "pet_name", label: "Pet Name", type: "text" },
    { key: "species", label: "Species", type: "text" },
    { key: "breed", label: "Breed", type: "text" },
    { key: "age", label: "Age", type: "text" },
    { key: "gender", label: "Gender", type: "text" },
    ...(!isRescue ? [{ key: "duration_owned", label: "Duration Owned", type: "text" }] : []),
    ...(isRescue  ? [{ key: "found_location", label: "Where Found", type: "text" }]   : []),
    { key: "ideal_home_desc", label: "Ideal Home", type: "textarea" },
    { key: "vaccine_type", label: "Vaccine Type", type: "text" },
    { key: "last_vacc_date", label: "Last Vaccinated", type: "text" },
    { key: "vacc_clinic", label: "Vet / Clinic", type: "text" },
    { key: "vacc_notes", label: "Vaccination Notes", type: "textarea" },
    { key: "medical_notes", label: "Medical Notes", type: "textarea" },
    { key: "behavior", label: "Behavior", type: "text" },
    { key: "behavior_other", label: "Behavior Detail", type: "text" },
    { key: "details", label: "Details", type: "textarea" },
    { key: "reason", label: isRescue ? "Reason for Surrendering" : "Reason for Rehoming", type: "textarea" },
    ...(!isRescue ? [{ key: "tried_alternatives", label: "Tried Alternatives", type: "textarea" }] : []),
  ];

  const boolFieldsAdoption = [
    { key: "owns_home", label: "Owns Home" },
    { key: "pet_permission", label: "Pet Permission" },
    { key: "has_children", label: "Has Children" },
    { key: "has_other_pets", label: "Has Other Pets" },
    { key: "other_pets_vaccinated", label: "Pets Vaccinated" },
    { key: "open_to_guidance", label: "Open to Guidance" },
    { key: "previous_pet", label: "Had Previous Pet" },
  ];

  const boolFieldsRehoming = [
    { key: "is_vaccinated", label: "Vaccinated" },
    { key: "is_neutered", label: "Neutered" },
    { key: "is_house_trained", label: "House Trained" },
    { key: "is_leash_trained", label: "Leash Trained" },
    { key: "good_with_children", label: "Good with Children" },
    { key: "good_with_pets", label: "Good with Pets" },
    { key: "has_aggression", label: "Has Aggression" },
    { key: "can_provide_food", label: "Can Provide Food" },
    { key: "can_provide_carrier", label: "Can Provide Carrier" },
    { key: "can_provide_records", label: "Can Provide Records" },
    { key: "understands_permanent", label: "Understands Permanent" },
    { key: "open_to_followup", label: "Open to Follow-up" },
  ];

  const triStateRehomingKeys = new Set([
    "is_house_trained", "is_leash_trained", "good_with_children", "good_with_pets",
  ]);

  const editTabsRehoming = [
    { key: "tab0", label: "Pet info",       fieldKeys: ["owner_name","contact","address","city","province","zip","pet_name","species","breed","age","gender","duration_owned","found_location","ideal_home_desc"] },
    { key: "tab1", label: "Health",         fieldKeys: ["vaccine_type","last_vacc_date","vacc_clinic","vacc_notes","medical_notes"] },
    { key: "tab2", label: "Behavior",       fieldKeys: ["behavior","behavior_other","details"] },
    { key: "tab3", label: "Contact & reason", fieldKeys: ["reason","tried_alternatives"] },
    { key: "tab4", label: "Flags",          boolOnly: true },
  ];

  const editTabsAdoption = [
    { key: "tab0", label: "Applicant",       fieldKeys: ["name","email","phone","address","city","province","zip","animal_name","primary_caregiver"] },
    { key: "tab1", label: "Housing",         fieldKeys: ["housing","household_size","children_ages","other_pets_detail"] },
    { key: "tab2", label: "Time & budget",   fieldKeys: ["exp","alone_hours","backup_care","budget","vet_plan"] },
    { key: "tab3", label: "Commitment",      fieldKeys: ["reason","behavior_response","previous_pet_details"] },
    { key: "tab4", label: "Flags",           boolOnly: true },
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
    if (isRescue && triStateRehomingKeys.has(key)) {
      const order = [null, "yes", "no", "unknown"];
      const next = order[(order.indexOf(cur) + 1) % order.length];
      set(key, next);
    } else {
      set(key, !cur);
    }
  };

  const triBtnLabel = (key) => {
    const v = form[key];
    if (v === true  || v === "yes")  return "Yes ✓";
    if (v === false || v === "no")   return "No";
    if (v === "unknown")             return "Unknown";
    return "Not set";
  };

  const triBtnColors = (key) => {
    const v = form[key];
    if (v === true  || v === "yes")  return { bg: "rgba(28,79,9,0.07)", border: "rgba(90,170,48,0.45)", color: "#1c4f09" };
    if (v === false || v === "no")   return { bg: "rgba(192,48,48,0.06)", border: "rgba(192,48,48,0.30)", color: "#c03030" };
    if (v === "unknown")             return { bg: "rgba(120,100,40,0.08)", border: "rgba(160,130,40,0.30)", color: "#7a6020" };
    return { bg: "rgba(255,248,218,0.5)", border: "rgba(180,140,60,0.25)", color: "#9aaa80" };
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 810, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 700, borderRadius: 20, background: "#fffce8", border: "1px solid rgba(180,140,60,0.3)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: "#1a4a08", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#5aaa30" }}>✏️</span>
              Edit {type === "adoptions" ? "Adoption" : "Rehoming"} Request
              {type === "rehoming" && form.request_type && (
                <RequestTypeBadge requestType={form.request_type} small />
              )}
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>
              #{record.id} · Status changes require Approve / Reject actions
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
            ✕
          </button>
        </div>

        {type === "rehoming" && (
          <div style={{ padding: "0.625rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.12)", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,252,235,0.7)", flexShrink: 0 }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#7a6020" }}>Request type:</span>
            {["rehome", "rescue"].map(v => (
              <button key={v} type="button" onClick={() => set("request_type", v)}
                style={{
                  padding: "0.3rem 0.8rem", borderRadius: 99, fontSize: "0.75rem", fontWeight: 900,
                  cursor: "pointer", fontFamily: "'Nunito',sans-serif", transition: "all 0.15s",
                  border: `1px solid ${form.request_type === v ? (v === "rescue" ? "rgba(60,140,180,0.5)" : "rgba(90,170,48,0.5)") : "rgba(180,140,60,0.25)"}`,
                  background: form.request_type === v ? (v === "rescue" ? "rgba(40,100,140,0.10)" : "rgba(28,79,9,0.08)") : "transparent",
                  color: form.request_type === v ? (v === "rescue" ? "#1a5a7a" : "#1c4f09") : "#9aaa80",
                }}>
                {v === "rescue" ? "🫶 Rescue / Surrender" : "🏠 Rehoming"}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", borderBottom: "1px solid rgba(180,140,60,0.2)", padding: "0 1.25rem", flexShrink: 0, overflowX: "auto" }}>
          {editTabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(activeTab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1 }}>
          {curTab.boolOnly ? (
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1c4f09", marginBottom: "0.625rem" }}>🔘 Flags</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: "0.5rem" }}>
                {boolFields.map(({ key, label }) => {
                  const isTriState = type === "rehoming" && triStateRehomingKeys.has(key);
                  const colors = triBtnColors(key);
                  return (
                    <button key={key} type="button" onClick={() => cycleTriState(key)}
                      style={{ padding: "0.5rem 0.75rem", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}>
                      <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${colors.border}`, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.55rem", color: colors.color }}>
                        {(form[key] === true || form[key] === "yes") ? "✓" : (form[key] === false || form[key] === "no") ? "✕" : (form[key] === "unknown") ? "?" : ""}
                      </span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: colors.color }}>{label}</span>
                      {isTriState && (
                        <span style={{ marginLeft: "auto", fontSize: "0.62rem", fontWeight: 700, color: colors.color, opacity: 0.8 }}>
                          {triBtnLabel(key)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {type === "rehoming" && (
                <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: 10, background: "rgba(40,100,140,0.05)", border: "1px solid rgba(60,140,180,0.18)", fontSize: "0.72rem", fontWeight: 700, color: "#2a5a7a" }}>
                  ℹ️ Tri-state fields (house trained, leash trained, good with children/pets) support <strong>Unknown</strong> — used when the rescuer doesn't know the animal's history. Click to cycle through Yes → No → Unknown.
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {visibleFields.map(({ key, label, type: ftype }) => (
                <div key={key} style={{ gridColumn: ftype === "textarea" ? "span 2" : "span 1" }}>
                  <label style={labelStyle}>{label}</label>
                  {ftype === "textarea" ? (
                    <textarea rows={3} value={form[key] ?? ""} onChange={e => set(key, e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
                  ) : (
                    <input type={ftype} value={form[key] ?? ""} onChange={e => set(key, e.target.value)} style={inputStyle} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(180,140,60,0.18)", display: "flex", gap: "0.625rem", flexShrink: 0, background: "rgba(255,252,235,0.97)", alignItems: "center" }}>
          <button onClick={onClose} style={{ padding: "0.7rem 1.1rem", borderRadius: 11, fontWeight: 800, fontSize: "0.84rem", background: "transparent", border: "1px solid rgba(180,140,60,0.3)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
            ✕ Cancel
          </button>
          <span style={{ flex: 1, fontSize: "0.75rem", fontWeight: 700, color: "#9aaa80", textAlign: "center" }}>
            {curIdx + 1} of {editTabs.length} — {curTab.label}
          </span>
          {curIdx > 0 && (
            <button onClick={() => setActiveTab(editTabs[curIdx - 1].key)} style={{ padding: "0.7rem 1.1rem", borderRadius: 11, fontWeight: 800, fontSize: "0.84rem", background: "transparent", border: "1px solid rgba(180,140,60,0.3)", color: "#3a5020", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              ← Back
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setActiveTab(editTabs[curIdx + 1].key)} style={{ padding: "0.7rem 1.25rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#1c7a09", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              Next →
            </button>
          ) : (
            <button disabled={saving} onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
              style={{ padding: "0.7rem 1.25rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: saving ? "#5aaa30aa" : "#1c7a09", border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background 0.15s" }}>
              {saving
                ? <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Saving…</>
                : <>💾 Save Changes</>}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Vaccination Photos Gallery ────────────────────────────────────────────────
function VaccPhotosGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  if (!photos || photos.length === 0) return null;

  const openLightbox = (src, idx) => { setLightbox(src); setLightboxIdx(idx); };
  const goNext = (e) => { e.stopPropagation(); const next = (lightboxIdx + 1) % photos.length; setLightbox(photos[next]); setLightboxIdx(next); };
  const goPrev = (e) => { e.stopPropagation(); const prev = (lightboxIdx - 1 + photos.length) % photos.length; setLightbox(photos[prev]); setLightboxIdx(prev); };

  return (
    <>
      <div>
        <div style={{ fontSize: "0.67rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1c4f09", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          🖼 Vaccination Record Photos ({photos.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {photos.map((src, i) => (
            <button key={i} type="button" onClick={() => openLightbox(src, i)}
              style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: "2px solid rgba(90,170,48,0.4)", padding: 0, cursor: "pointer", position: "relative", flexShrink: 0, background: "rgba(255,248,220,0.5)" }}>
              <img src={src} alt={`Vacc ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ position: "absolute", bottom: 2, right: 2, background: "rgba(28,79,9,0.8)", borderRadius: 4, padding: "1px 4px", fontSize: "0.55rem", fontWeight: 900, color: "#fff" }}>{i + 1}</div>
            </button>
          ))}
        </div>
      </div>
      {lightbox && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Vaccination record" style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 14, objectFit: "contain" }} onClick={e => e.stopPropagation()} onError={e => { e.target.alt = "Image failed to load"; }} />
          {photos.length > 1 && (
            <>
              <button onClick={goPrev} style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", zIndex: 1 }}>‹</button>
              <button onClick={goNext} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", zIndex: 1 }}>›</button>
            </>
          )}
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 20, right: 20, width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
            ✕
          </button>
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "0.3rem 0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
            {lightboxIdx + 1} / {photos.length} · Click outside or × to close
          </div>
        </div>
      )}
    </>
  );
}

// ── Pet Photo Lightbox ────────────────────────────────────────────────────────
function PetPhotoLightbox({ src, name, onClose }) {
  if (!src) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <img src={src} alt={name || "Pet photo"} style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 14, objectFit: "contain" }} onClick={e => e.stopPropagation()} />
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>✕</button>
    </div>
  );
}

// ── Field display helper ──────────────────────────────────────────────────────
function FieldPill({ label, value, accent, warn }) {
  return (
    <div style={{ padding: "0.5rem 0.75rem", borderRadius: 10, background: warn ? "rgba(192,48,48,0.06)" : accent ? "rgba(28,79,9,0.07)" : "rgba(255,248,218,0.6)", border: `1px solid ${warn ? "rgba(192,48,48,0.22)" : accent ? "rgba(90,170,48,0.28)" : "rgba(180,140,60,0.18)"}` }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.83rem", fontWeight: 700, color: warn ? "#c03030" : accent ? "#1c4f09" : "#1a2e0a", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{String(value)}</div>
    </div>
  );
}

// ── Tri-state pill for display ────────────────────────────────────────────────
function TriPill({ label, value }) {
  const display = triLabel(value);
  if (!display) return null;
  const isYes     = display === "Yes ✓";
  const isNo      = display === "No";
  const isUnknown = display === "Unknown";
  return (
    <div style={{
      padding: "0.5rem 0.75rem", borderRadius: 10,
      background: isYes ? "rgba(28,79,9,0.07)" : isNo ? "rgba(192,48,48,0.06)" : "rgba(120,100,40,0.08)",
      border: `1px solid ${isYes ? "rgba(90,170,48,0.28)" : isNo ? "rgba(192,48,48,0.22)" : "rgba(160,130,40,0.25)"}`,
    }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.83rem", fontWeight: 700, color: isYes ? "#1c4f09" : isNo ? "#c03030" : "#7a6020" }}>{display}</div>
    </div>
  );
}

// ── useFullRecord: fetches the full single-record detail (with photos) ────────
// Django list endpoints often omit large base64 fields; this hook fetches
// the detail endpoint on demand and merges it with the list record.
function useFullRecord(record, apiBase, enabled) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(false);
  const prevId = useRef(null);

  useEffect(() => {
    if (!enabled || !record?.id) { setFull(null); return; }
    if (prevId.current === record.id && full) return; // already fetched

    let cancelled = false;
    setLoading(true);
    setFull(null);
    prevId.current = record.id;

    djFetch(`${apiBase}/${record.id}/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data) {
          const fetched = data?.data ?? data;
          setFull({ ...record, ...fetched });
        } else {
          setFull({ ...record });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setFull({ ...record }); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [record?.id, enabled]);

  return { full: full || record, loading };
}

// ── Detail modal (tabbed) — NOW fetches full record for photos ────────────────
function DetailModal({ r, type, open, onClose, onApprove, onReject, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState("tab0");
  const [petPhotoOpen, setPetPhotoOpen] = useState(false);

  const apiBase = type === "adoptions" ? "/api/approvals/adoptions" : "/api/approvals/rehoming";
  const { full: record, loading: detailLoading } = useFullRecord(r, apiBase, open && !!r);

  useEffect(() => { if (open) setActiveTab("tab0"); }, [open, r?.id]);

  if (!open || !r) return null;

  const status   = record.status || "Pending";
  const cfg      = STATUS_CFG[status] || STATUS_CFG.Pending;
  const isRescue = record.request_type === "rescue";

  // Always prefer full record's photo fields
  const photoSrc   = type === "rehoming" ? getPhotoSrc(record) : null;
  const vaccPhotos = type === "rehoming" ? parseVaccPhotos(record) : [];

  const fmt = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? "Yes ✓" : "No";
    if (typeof v === "string" && v.trim() === "") return null;
    return String(v);
  };

  const rehomingTabs = [
    {
      key: "tab0", label: "Pet info", showPhoto: true, sections: [{ title: "Pet Details", icon: "🐾", fields: [
        ["Request Type",        record.request_type ? (record.request_type === "rescue" ? "Rescue / Surrender 🫶" : "Rehoming 🏠") : null],
        ["Owner / Rescuer",     fmt(record.owner_name)],
        ["Contact",             fmt(record.contact)],
        ["Pet Name",            fmt(record.pet_name)],
        ["Species",             fmt(record.species)],
        ["Breed",               fmt(record.breed)],
        ["Age",                 fmt(record.age)],
        ["Gender",              fmt(record.gender)],
        ...(!isRescue ? [["Duration Owned", fmt(record.duration_owned)]] : []),
        ...(isRescue  ? [["Where Found",    fmt(record.found_location)]] : []),
        ["Ideal Home",          fmt(record.ideal_home_desc)],
        ["Street / House No.",  fmt(record.street_address || record.street || record.house_number || null)],
        ["Barangay",            fmt(record.barangay)],
        ["City / Municipality", fmt(record.city || record.municipality || record.city_municipality || null)],
        ["Province",            fmt(record.province)],
        ["Region",              fmt(record.region)],
        ["Zip / Postal Code",   fmt(record.zip_code || record.zipcode || record.postal_code || record.zip || null)],
        ...( !(record.barangay || record.city || record.province || record.zip_code || record.zip)
             ? [["Address", fmt(record.address || record.home_address || null)]]
             : [] ),
      ]}],
    },
    {
      key: "tab1", label: "Health", showVacc: true, sections: [{ title: "Health", icon: "💉", fields: [
        ["Vaccinated",        fmt(record.is_vaccinated)],
        ["Vaccine Type",      fmt(record.vaccine_type)],
        ["Last Vaccinated",   fmt(record.last_vacc_date)],
        ["Vet / Clinic",      fmt(record.vacc_clinic)],
        ["Vaccination Notes", fmt(record.vacc_notes)],
        ["Neutered",          fmt(record.is_neutered)],
        ["Medical Notes",     fmt(record.medical_notes)],
      ]}],
    },
    {
      key: "tab2", label: "Behavior", triStateFields: true, sections: [{ title: "Behavior & Home Fit", icon: "⭐", fields: [
        ["Behavior",           fmt(record.behavior)],
        ["Behavior Detail",    fmt(record.behavior_other)],
        ["Has Aggression",     fmt(record.has_aggression)],
      ]}],
    },
    {
      key: "tab3", label: "Contact", sections: [{ title: "Contact & Reason", icon: "📞", fields: [
        ["Contact",             fmt(record.contact)],
        ["Reason",              fmt(record.reason)],
        ["Details",             fmt(record.details)],
        ...(!isRescue ? [["Tried Alternatives", fmt(record.tried_alternatives)]] : []),
      ]}, { title: "Transition & Consent", icon: "🤝", fields: [
        ["Can Provide Food",       fmt(record.can_provide_food)],
        ["Can Provide Carrier",    fmt(record.can_provide_carrier)],
        ["Can Provide Records",    fmt(record.can_provide_records)],
        ["Understands Permanent",  fmt(record.understands_permanent)],
        ["Open to Follow-up",      fmt(record.open_to_followup)],
      ]}],
    },
  ];

  const adoptionTabs = [
    { key: "tab0", label: "Applicant", sections: [{ title: "Applicant", icon: "👤", fields: [
        ["Full Name",           fmt(record.name)],
        ["Email",               fmt(record.email)],
        ["Phone",               fmt(record.phone)],
        ["Street / House No.",  fmt(record.street_address || record.street || record.house_number || null)],
        ["Barangay",            fmt(record.barangay)],
        ["City / Municipality", fmt(record.city || record.municipality || record.city_municipality || null)],
        ["Province",            fmt(record.province)],
        ["Region",              fmt(record.region)],
        ["Zip / Postal Code",   fmt(record.zip_code || record.zipcode || record.postal_code || record.zip || null)],
        ...( !(record.barangay || record.city || record.province || record.zip_code || record.zip)
             ? [["Address", fmt(record.address)]]
             : [] ),
        ["Animal",              fmt(record.animal_name)],
        ["Primary Caregiver",   fmt(record.primary_caregiver)],
    ]}]},
    { key: "tab1", label: "Housing", sections: [
      { title: "Housing", icon: "🏠", fields: [["Housing Type", fmt(record.housing)], ["Owns / Rents", record.owns_home !== undefined ? (record.owns_home ? "Owns" : "Rents") : null], ["Pet Permission", record.pet_permission !== undefined ? fmt(record.pet_permission) : null], ["Pet Space", fmt(record.pet_space)], ["Household Size", fmt(record.household_size)], ["Has Children", record.has_children !== undefined ? fmt(record.has_children) : null], ["Children Ages", fmt(record.children_ages)]] },
      { title: "Other Pets", icon: "🐶", fields: [["Has Other Pets", record.has_other_pets !== undefined ? fmt(record.has_other_pets) : null], ["Other Pets Detail", fmt(record.other_pets_detail)], ["Pets Vaccinated", record.other_pets_vaccinated !== undefined ? fmt(record.other_pets_vaccinated) : null]] },
    ]},
    { key: "tab2", label: "Time & budget", sections: [{ title: "Time & Budget", icon: "🕐", fields: [["Experience", fmt(record.exp)], ["Hours Alone", fmt(record.alone_hours)], ["Backup Care", fmt(record.backup_care)], ["Monthly Budget", fmt(record.budget)], ["Vet Plan", fmt(record.vet_plan)]] }] },
    { key: "tab3", label: "Commitment", sections: [{ title: "Commitment", icon: "📋", fields: [["Behavior Response", fmt(record.behavior_response)], ["Open to Guidance", record.open_to_guidance !== undefined ? fmt(record.open_to_guidance) : null], ["Previous Pet", record.previous_pet !== undefined ? fmt(record.previous_pet) : null], ["Previous Pet Info", fmt(record.previous_pet_details)], ["Reason to Adopt", fmt(record.reason)]] }] },
  ];

  const detailTabs   = type === "adoptions" ? adoptionTabs : rehomingTabs;
  const curTabData   = detailTabs.find(t => t.key === activeTab) || detailTabs[0];
  const accentLabels = new Set(["Vaccinated", "Neutered", "Open to Follow-up", "Understands Permanent", "Can Provide Food", "Can Provide Carrier", "Can Provide Records"]);
  const warnLabels   = new Set(["Has Aggression"]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(10,6,2,0.65)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 700, borderRadius: 20, background: "#fffce8", border: "1px solid rgba(180,140,60,0.28)", boxShadow: "0 24px 64px rgba(40,20,5,0.45)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(180,140,60,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: "#1a4a08", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {type === "adoptions" ? "Adoption" : "Rehoming"} Request — Full Details
              {type === "rehoming" && record.request_type && (
                <RequestTypeBadge requestType={record.request_type} small />
              )}
              {detailLoading && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.65rem", fontWeight: 700, color: "#9aaa80" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #9aaa8044", borderTopColor: "#9aaa80", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Loading full record…
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6a7a50", marginTop: 2 }}>
              {type === "rehoming" && (
                <span style={{ color: "#b45a22", marginRight: "0.5rem" }}>
                  👤 {record.owner_name || "Unknown Owner"} ·
                </span>
              )}
              Submitted {record.created_at ? new Date(record.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 900, padding: "0.25rem 0.75rem", borderRadius: 50, background: cfg.dot + "22", color: cfg.dot, border: `1px solid ${cfg.dot}44` }}>{status}</span>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(192,48,48,0.2)", background: "rgba(192,48,48,0.08)", color: "#c03030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
              ✕
            </button>
          </div>
        </div>

        {/* Rescue context banner */}
        {type === "rehoming" && isRescue && (
          <div style={{ padding: "0.5rem 1.25rem", background: "rgba(40,100,140,0.06)", borderBottom: "1px solid rgba(60,140,180,0.18)", display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "0.8rem" }}>🫶</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1a4a5a" }}>
              Rescue / Surrender — some fields may be blank or marked <strong>Unknown</strong> if the rescuer didn't know the animal's full history.
              {record.found_location ? <> Found at: <strong>{record.found_location}</strong>.</> : ""}
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(180,140,60,0.2)", padding: "0 1.25rem", flexShrink: 0, overflowX: "auto" }}>
          {detailTabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabStyle(activeTab === t.key)}>
              {t.label}
              {/* Dot indicator for photo-heavy tabs when photos exist */}
              {t.key === "tab0" && photoSrc && type === "rehoming" && (
                <span style={{ marginLeft: "0.3rem", width: 6, height: 6, borderRadius: "50%", background: "#B45A22", display: "inline-block", verticalAlign: "middle" }} />
              )}
              {t.key === "tab1" && vaccPhotos.length > 0 && type === "rehoming" && (
                <span style={{ marginLeft: "0.3rem", fontSize: "0.62rem", fontWeight: 900, background: "rgba(28,79,9,0.12)", color: "#1c4f09", padding: "0.05rem 0.35rem", borderRadius: 99 }}>{vaccPhotos.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{ overflowY: "auto", padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Pet photo with click-to-expand — shown on tab0 for rehoming */}
          {curTabData.showPhoto && type === "rehoming" && (
            detailLoading && !photoSrc ? (
              <div style={{ borderRadius: 14, background: "rgba(255,248,220,0.5)", border: "1px solid rgba(180,140,60,0.2)", height: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#9aaa80", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #9aaa8044", borderTopColor: "#9aaa80", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Loading pet photo…
              </div>
            ) : photoSrc ? (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(180,140,60,0.22)", flexShrink: 0, position: "relative", cursor: "zoom-in" }}
                onClick={() => setPetPhotoOpen(true)}>
                <img src={photoSrc} alt={record.pet_name || "Pet photo"} style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                  onError={e => { e.target.parentElement.style.display = "none"; }} />
                <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.55)", borderRadius: 8, padding: "0.2rem 0.55rem", fontSize: "0.66rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  🔍 Click to enlarge
                </div>
              </div>
            ) : (
              <div style={{ borderRadius: 14, background: "rgba(255,248,220,0.4)", border: "1.5px dashed rgba(180,140,60,0.25)", height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#9aaa80", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                No pet photo uploaded
              </div>
            )
          )}

          {/* Vacc photos (tab1 only) */}
          {curTabData.showVacc && (
            detailLoading && vaccPhotos.length === 0 ? (
              <div style={{ padding: "0.75rem", borderRadius: 12, background: "rgba(28,79,9,0.04)", border: "1px solid rgba(90,170,48,0.18)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "#9aaa80", flexShrink: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #9aaa8044", borderTopColor: "#9aaa80", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Loading vaccination photos…
              </div>
            ) : vaccPhotos.length > 0 ? (
              <div style={{ padding: "0.875rem", borderRadius: 12, background: "rgba(28,79,9,0.05)", border: "1px solid rgba(90,170,48,0.22)", flexShrink: 0 }}>
                <VaccPhotosGallery photos={vaccPhotos} />
              </div>
            ) : (
              <div style={{ padding: "0.6rem 0.875rem", borderRadius: 10, background: "rgba(180,140,60,0.06)", border: "1px solid rgba(180,140,60,0.22)", fontSize: "0.75rem", fontWeight: 700, color: "#7a6020", flexShrink: 0 }}>
                ℹ️ No vaccination record photos were uploaded with this request.
              </div>
            )
          )}

          {activeTab === "tab0" && record.reject_note && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(192,48,48,0.06)", border: "1px solid rgba(192,48,48,0.2)", fontSize: "0.82rem", fontWeight: 700, color: "#c03030", flexShrink: 0 }}>
              <strong>Rejection note:</strong> {record.reject_note}
            </div>
          )}

          {/* Tri-state behavior fields for rehoming (tab2) */}
          {curTabData.triStateFields && type === "rehoming" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", paddingBottom: "0.3rem", borderBottom: "1px solid rgba(180,140,60,0.20)" }}>
                <span style={{ fontSize: "0.78rem" }}>🧠</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1c4f09" }}>Behavioral Assessment</span>
                {isRescue && (
                  <span style={{ marginLeft: "auto", fontSize: "0.62rem", fontWeight: 700, color: "#2a5a7a", background: "rgba(40,100,140,0.08)", padding: "0.1rem 0.45rem", borderRadius: 99, border: "1px solid rgba(60,140,180,0.2)" }}>
                    Unknown = rescuer doesn't know
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <TriPill label="House Trained"      value={record.is_house_trained} />
                <TriPill label="Leash Trained"      value={record.is_leash_trained} />
                <TriPill label="Good w/ Children"   value={record.good_with_children} />
                <TriPill label="Good w/ Other Pets" value={record.good_with_pets} />
              </div>
            </div>
          )}

          {curTabData.sections.map(({ title, icon, fields }) => {
            const visibleFields = fields.filter(([, v]) => v !== null && v !== undefined);
            if (visibleFields.length === 0) return null;
            return (
              <div key={title}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", paddingBottom: "0.3rem", borderBottom: "1px solid rgba(180,140,60,0.20)" }}>
                  <span style={{ fontSize: "0.78rem" }}>{icon}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1c4f09" }}>{title}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {visibleFields.map(([label, value]) => (
                    <FieldPill
                      key={label}
                      label={label}
                      value={value}
                      accent={accentLabels.has(label) && (value === "Yes ✓" || value === "true")}
                      warn={warnLabels.has(label) && value === "Yes ✓"}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(180,140,60,0.18)", display: "flex", gap: "0.5rem", flexShrink: 0, background: "rgba(255,252,235,0.97)", flexWrap: "wrap" }}>
          <button onClick={() => { onEdit(record); onClose(); }} style={{ padding: "0.65rem 1.1rem", borderRadius: 11, fontWeight: 900, fontSize: "0.84rem", color: "#1a4a08", background: "rgba(255,248,218,0.9)", border: "1px solid rgba(180,140,60,0.35)", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            ✏️ Edit
          </button>
          <button onClick={() => { onDelete(record); onClose(); }} style={{ padding: "0.65rem 1.1rem", borderRadius: 11, fontWeight: 900, fontSize: "0.84rem", color: "#c03030", background: "rgba(192,48,48,0.06)", border: "1px solid rgba(192,48,48,0.25)", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            🗑 Delete
          </button>
          <DownloadPDFButton record={record} type={type} small />
          {status === "Pending" && (
            <>
              <button onClick={() => { onApprove(record.id); onClose(); }} style={{ flex: 1, minWidth: 100, padding: "0.7rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#1c7a09", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                ✓ Approve
              </button>
              <button onClick={() => { onReject(record.id); onClose(); }} style={{ flex: 1, minWidth: 100, padding: "0.7rem", borderRadius: 11, fontWeight: 900, fontSize: "0.88rem", color: "#fff", background: "#c03030", border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                ✕ Reject
              </button>
            </>
          )}
        </div>
      </div>

      {petPhotoOpen && <PetPhotoLightbox src={photoSrc} name={record.pet_name} onClose={() => setPetPhotoOpen(false)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
// NOTE: Cards use the list record. For photos, we attempt to show what we have
// from the list. If photo_base64 is absent (truncated by Django), a placeholder
// is shown with a "View" nudge. The full photo appears once DetailModal opens.
function RequestCard({ r, type, onApprove, onReject, onView, onEdit, onDelete }) {
  console.log("CARD r:", r.id, "has_photo:", r.has_photo, "vacc_photo_count:", r.vacc_photo_count, "photo_base64:", r.photo_base64?.length);
  const status    = r.status || "Pending";
  const cfg       = STATUS_CFG[status] || STATUS_CFG.Pending;
  const avatarBg  = type === "adoptions" ? "#1c4f09" : "#b45a22";
  const ownerName = type === "rehoming"
    ? (r.owner_name ?? "Unknown Owner")
    : (r.name || "Applicant");
  const photoSrc  = type === "rehoming" ? getPhotoSrc(r) : null;
  const initials  = ownerName.split(" ").map(w => w[0] || "").slice(0, 2).join("").toUpperCase() || "?";
  const isRescue  = r.request_type === "rescue";
  const vaccPhotos = type === "rehoming" ? parseVaccPhotos(r) : [];

  // Indicates photo exists server-side but wasn't included in list payload
  const hasPhotoMeta = type === "rehoming" && !photoSrc && (r.has_photo || r.photo_url);

  const details = type === "adoptions"
    ? [
        ["Animal",   r.animal_name || "—"],
        ["Email",    r.email || "—"],
        ["Phone",    r.phone || "—"],
        ["City",     r.city || "—"],
        ["Province", r.province || "—"],
        ["Budget",   r.budget || "—"],
      ]
    : [
        ["Pet",        r.pet_name || "—"],
        ["Species",    r.species || "—"],
        isRescue
          ? ["Found at",  r.found_location || "—"]
          : ["Duration",  r.duration_owned || "—"],
        ["Contact",    r.contact || "—"],
        ["Vaccinated", r.is_vaccinated ? "Yes ✓" : "No"],
        ["Neutered",   r.is_neutered   ? "Yes ✓" : "No"],
      ];

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col ${cfg.bg} ${cfg.border}`}>
      <div className="h-1 w-full" style={{ background: cfg.dot }} />

      {/* ── Rehoming: photo hero ── */}
      {type === "rehoming" && (
        <div style={{ position: "relative", width: "100%", height: 190, background: "rgba(255,248,220,0.5)", flexShrink: 0, overflow: "hidden", borderBottom: "1px solid rgba(180,140,60,0.15)" }}>
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={r.pet_name || "Pet"}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={e => { e.target.style.display = "none"; e.target.nextSibling && (e.target.nextSibling.style.display = "flex"); }}
            />
          ) : null}
          {/* Fallback emoji placeholder — always rendered, shown only if img fails or no src */}
          <div style={{
            display: photoSrc ? "none" : "flex",
            width: "100%", height: "100%",
            alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "0.4rem",
            position: photoSrc ? "absolute" : "relative",
            inset: photoSrc ? 0 : undefined,
            background: "rgba(255,248,220,0.5)",
          }}>
            <span style={{ fontSize: "3.5rem" }}>
              {r.species === "Cat" ? "🐈" : r.species === "Bird" ? "🐦" : r.species === "Rabbit" ? "🐇" : "🐕"}
            </span>
            {(r.has_photo || r.photo_url) && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9aaa80", background: "rgba(255,248,218,0.9)", padding: "0.2rem 0.6rem", borderRadius: 99, border: "1px solid rgba(180,140,60,0.2)" }}>
                📷 Photo available — click View
              </span>
            )}
            {(r.vacc_photo_count > 0) && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#5aaa30", background: "rgba(28,79,9,0.08)", padding: "0.2rem 0.6rem", borderRadius: 99, border: "1px solid rgba(90,170,48,0.2)", marginTop: "0.25rem" }}>
                🖼 {r.vacc_photo_count} vacc photo{r.vacc_photo_count > 1 ? "s" : ""} — click View
              </span>
            )}
          </div>

          {/* Request type badge */}
          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
            <RequestTypeBadge requestType={r.request_type || "rehome"} small />
          </div>

          {/* Vacc photo count badge */}
          {(vaccPhotos.length > 0 || r.vacc_photo_count > 0) && (
            <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
              <span style={{ padding: "0.2rem 0.5rem", borderRadius: 50, background: "rgba(28,79,9,0.85)", color: "#fff", fontSize: "0.65rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                🖼 {vaccPhotos.length || r.vacc_photo_count} vacc {(vaccPhotos.length || r.vacc_photo_count) === 1 ? "photo" : "photos"}
              </span>
            </div>
          )}

          {/* Vaccinated badge when no vacc photos badge */}
          {r.is_vaccinated && vaccPhotos.length === 0 && (
            <span style={{ position: "absolute", top: 8, right: 8, zIndex: 2, padding: "0.2rem 0.5rem", borderRadius: 50, background: "rgba(28,79,9,0.85)", color: "#fff", fontSize: "0.65rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              💉 Vaccinated
            </span>
          )}

          {/* Owner info overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, background: "linear-gradient(transparent,rgba(10,6,2,0.65))", padding: "1.5rem 0.75rem 0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#b45a22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{ownerName}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{isRescue ? "Rescuer" : "Owner"}</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {type !== "rehoming" && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: avatarBg }}>
                {initials}
              </div>
            )}
            <div>
              <div className="font-black text-sm" style={{ color: "#1a4a08" }}>
                {type === "rehoming" ? `${r.pet_name || "—"} • ${ownerName}` : ownerName}
              </div>
              {type === "rehoming" && (
                <div className="text-xs font-semibold" style={{ color: "#6a7a50" }}>
                  {[r.species, r.age].filter(Boolean).join(" · ") || "Pet"}
                </div>
              )}
              <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-black px-3 py-1 rounded-full flex-shrink-0 ${cfg.pill}`}>{status}</span>
        </div>

        <div className="h-px" style={{ background: "rgba(180,140,60,0.15)" }} />

        <div className="grid grid-cols-2 gap-2">
          {details.map(([lbl, val]) => (
            <div key={lbl}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#9aaa80" }}>{lbl}</div>
              <div className="text-xs font-semibold truncate" style={{ color: "#1a2e0a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Behavior snapshot with tri-state pills */}
        {type === "rehoming" && r.behavior && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800, background: "rgba(180,90,34,0.08)", color: "#8c3c14", border: "1px solid rgba(180,90,34,0.2)" }}>
              {r.behavior}{r.behavior_other ? `: ${r.behavior_other}` : ""}
            </span>
            {r.has_aggression && (
              <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.68rem", fontWeight: 800, background: "rgba(192,48,48,0.08)", color: "#c03030", border: "1px solid rgba(192,48,48,0.2)" }}>
                ⚠ Aggression noted
              </span>
            )}
            {[
              ["is_house_trained", "House trained"],
              ["is_leash_trained", "Leash trained"],
              ["good_with_children", "Kids OK"],
              ["good_with_pets", "Pets OK"],
            ].map(([key, lbl]) => {
              const v = triLabel(r[key]);
              if (!v) return null;
              const isUnknown = v === "Unknown";
              const isYes     = v === "Yes ✓";
              return (
                <span key={key} style={{
                  padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.65rem", fontWeight: 800,
                  background: isUnknown ? "rgba(120,100,40,0.08)" : isYes ? "rgba(28,79,9,0.08)" : "rgba(192,48,48,0.06)",
                  color: isUnknown ? "#7a6020" : isYes ? "#1c4f09" : "#c03030",
                  border: `1px solid ${isUnknown ? "rgba(160,130,40,0.2)" : isYes ? "rgba(90,170,48,0.25)" : "rgba(192,48,48,0.2)"}`,
                }}>
                  {lbl}: {v}
                </span>
              );
            })}
          </div>
        )}

        {/* Vaccine info strip */}
        {type === "rehoming" && r.is_vaccinated && r.vaccine_type && (
          <div style={{ padding: "0.5rem 0.75rem", borderRadius: 10, background: "rgba(28,79,9,0.06)", border: "1px solid rgba(90,170,48,0.25)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>💉</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 900, color: "#1c4f09", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vaccine</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a4a08", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vaccine_type}{r.last_vacc_date ? ` · ${r.last_vacc_date}` : ""}</div>
            </div>
            {vaccPhotos.length > 0 && (
              <div style={{ display: "flex", flexShrink: 0 }}>
                {vaccPhotos.slice(0, 3).map((src, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 6, overflow: "hidden", border: "2px solid rgba(90,170,48,0.4)", marginLeft: i > 0 ? "-6px" : 0, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                  </div>
                ))}
                {vaccPhotos.length > 3 && (
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(28,79,9,0.18)", border: "2px solid rgba(90,170,48,0.4)", marginLeft: "-6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 900, color: "#1c4f09" }}>
                    +{vaccPhotos.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Vacc photos mini-strip when vaccine_type not filled but photos exist */}
        {type === "rehoming" && vaccPhotos.length > 0 && !r.vaccine_type && (
          <div style={{ padding: "0.4rem 0.75rem", borderRadius: 9, background: "rgba(28,79,9,0.05)", border: "1px solid rgba(90,170,48,0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>🖼</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1c4f09" }}>
              {vaccPhotos.length} vaccination {vaccPhotos.length === 1 ? "photo" : "photos"} attached
            </span>
            <div style={{ display: "flex", flexShrink: 0, marginLeft: "auto" }}>
              {vaccPhotos.slice(0, 3).map((src, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: 5, overflow: "hidden", border: "1px solid rgba(90,170,48,0.4)", marginLeft: i > 0 ? "-5px" : 0 }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                </div>
              ))}
              {vaccPhotos.length > 3 && <div style={{ width: 24, height: 24, borderRadius: 5, background: "rgba(28,79,9,0.18)", border: "1px solid rgba(90,170,48,0.3)", marginLeft: "-5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 900, color: "#1c4f09" }}>+{vaccPhotos.length - 3}</div>}
            </div>
          </div>
        )}

        {/* Found location (rescue) */}
        {type === "rehoming" && isRescue && r.found_location && (
          <div style={{ padding: "0.4rem 0.75rem", borderRadius: 9, background: "rgba(40,100,140,0.06)", border: "1px solid rgba(60,140,180,0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>📍</span>
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 900, color: "#2a5a7a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Found at</div>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#1a3a4a" }}>{r.found_location}</div>
            </div>
          </div>
        )}

        {(r.reason || r.details) && (
          <div className="rounded-xl p-3" style={{ background: "rgba(255,248,218,0.7)", border: "1px solid rgba(180,140,60,0.2)" }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9aaa80" }}>
              {type === "adoptions" ? "Reason for adoption" : isRescue ? "Reason for surrendering" : "Reason for rehoming"}
            </div>
            <div className="text-xs font-semibold line-clamp-2" style={{ color: "#3a5020" }}>
              {r.reason || r.details}
            </div>
          </div>
        )}

        {/* Transition supplies */}
        {type === "rehoming" && (r.can_provide_food || r.can_provide_carrier || r.can_provide_records) && (
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {r.can_provide_food    && <span style={{ padding: "0.18rem 0.5rem", borderRadius: 99, fontSize: "0.63rem", fontWeight: 800, background: "rgba(28,79,9,0.07)", color: "#1c4f09", border: "1px solid rgba(90,170,48,0.22)" }}>🍽 Food incl.</span>}
            {r.can_provide_carrier && <span style={{ padding: "0.18rem 0.5rem", borderRadius: 99, fontSize: "0.63rem", fontWeight: 800, background: "rgba(28,79,9,0.07)", color: "#1c4f09", border: "1px solid rgba(90,170,48,0.22)" }}>🧳 Carrier incl.</span>}
            {r.can_provide_records && <span style={{ padding: "0.18rem 0.5rem", borderRadius: 99, fontSize: "0.63rem", fontWeight: 800, background: "rgba(28,79,9,0.07)", color: "#1c4f09", border: "1px solid rgba(90,170,48,0.22)" }}>📄 Records incl.</span>}
          </div>
        )}

        {/* Follow-up consent + understands permanent */}
        {type === "rehoming" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            {r.open_to_followup !== undefined && r.open_to_followup !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.68rem", fontWeight: 700, color: r.open_to_followup ? "#1c4f09" : "#9aaa80" }}>
                <span>{r.open_to_followup ? "✓" : "✕"}</span>
                <span>Open to follow-up contact</span>
              </div>
            )}
            {r.understands_permanent !== undefined && r.understands_permanent !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.68rem", fontWeight: 700, color: r.understands_permanent ? "#1c4f09" : "#c03030" }}>
                <span>{r.understands_permanent ? "✓" : "✕"}</span>
                <span>{isRescue ? "Confirmed animal needs placement" : "Understands rehoming is permanent"}</span>
              </div>
            )}
          </div>
        )}

        {type === "rehoming" && status === "Approved" && (
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(28,79,9,0.07)", border: "1px solid rgba(90,170,48,0.28)" }}>
            <span style={{ fontSize: "0.85rem" }}>🐾</span>
            <span className="text-xs font-bold" style={{ color: "#1c4f09" }}>
              {r.pet_name || "Pet"} has been listed for adoption
            </span>
          </div>
        )}

        {r.reject_note && status === "Rejected" && (
          <div className="rounded-xl p-3 text-xs font-semibold" style={{ background: "rgba(192,48,48,0.06)", border: "1px solid rgba(192,48,48,0.2)", color: "#c03030" }}>
            <strong>Rejected:</strong> {r.reject_note}
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-1 flex-wrap">
          <button onClick={() => onView(r)} className="px-3 py-2 rounded-xl text-xs font-black border transition-all hover:bg-amber-50" style={{ background: "rgba(255,248,218,0.7)", borderColor: "rgba(180,140,60,0.28)", color: "#7a6030", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            👁 View
          </button>
          <button onClick={() => onEdit(r)} className="px-3 py-2 rounded-xl text-xs font-black border transition-all" style={{ background: "rgba(90,170,48,0.08)", borderColor: "rgba(90,170,48,0.3)", color: "#1c6a09", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            ✏️ Edit
          </button>
          <button onClick={() => onDelete(r)} className="px-3 py-2 rounded-xl text-xs font-black border transition-all" style={{ background: "rgba(192,48,48,0.05)", borderColor: "rgba(192,48,48,0.22)", color: "#c03030", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            🗑
          </button>
          <DownloadPDFButton record={r} type={type} />
          {status === "Pending" ? (
            <>
              <button onClick={() => onApprove(r.id)} className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-green-600 hover:text-white hover:border-green-600" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#15803d" }}>
                ✓ Approve
              </button>
              <button onClick={() => onReject(r.id)} className="flex-1 py-2 rounded-xl text-xs font-black border transition-all hover:bg-red-600 hover:text-white hover:border-red-600" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.28)", color: "#dc2626" }}>
                ✕ Reject
              </button>
            </>
          ) : (
            <div className="flex-1 py-2 rounded-xl text-xs font-black border text-center" style={{ borderColor: "#ddd0a8", color: "#9aaa80" }}>
              {status === "Approved" ? "✓ Approved" : "✕ Rejected"}
            </div>
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

  const showToast = (msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (status = "all") => {
    setLoading(true);
    try {
      const url = `${apiBase}/admin/${status !== "all" ? `?status=${status}` : ""}`;
      const res  = await djFetch(url);
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
      showToast(
        type === "rehoming"
          ? `Approved! ${records.find(r => r.id === id)?.pet_name || "Pet"} is now listed 🐾`
          : "Request approved ✓"
      );
      load(filter);
      onStatsChange?.();
    } catch (e) { console.error("Approve error:", e); showToast("Network error", "err"); }
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
      if (data.success) { showToast("Changes saved ✓"); setEditTarget(null); load(filter); }
      else showToast(data.message || "Error saving", "err");
    } catch { showToast("Network error", "err"); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await djFetch(`${apiBase}/${deleteTarget.id}/delete/`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(type === "adoptions" ? "Adoption request deleted" : `Rehoming request for ${deleteTarget.pet_name || "pet"} deleted`);
        setDeleteTarget(null);
        load(filter);
        onStatsChange?.();
      } else showToast(data.message || "Error deleting", "err");
    } catch { showToast("Network error", "err"); }
  };

  const label  = type === "adoptions" ? "Adoption Requests" : "Rehome & Rescue Requests";
  const tabs   = ["all", "Pending", "Approved", "Rejected"];

  const visibleRecords = records.filter(r => {
    if (typeFilter === "all") return true;
    return r.request_type === typeFilter;
  });

  const counts = tabs.reduce((acc, t) => ({
    ...acc,
    [t]: t === "all" ? visibleRecords.length : visibleRecords.filter(r => r.status === t).length,
  }), {});

  const rescueCount = records.filter(r => r.request_type === "rescue").length;
  const rehomeCount = records.filter(r => r.request_type === "rehome" || !r.request_type).length;
  const withVaccPhotos = type === "rehoming"
    ? records.filter(r => parseVaccPhotos(r).length > 0).length
    : 0;
  // Count records with any photo
  const withPhotos = type === "rehoming"
    ? records.filter(r => getPhotoSrc(r) || r.has_photo || r.photo_url).length
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-black text-lg" style={{ color: "#1a4a08", fontFamily: "'Playfair Display',serif" }}>
            {label}
          </div>
          <div className="text-xs font-semibold mt-0.5" style={{ color: "#9aaa80" }}>
            Review and process applications — {records.filter(r => r.status === "Pending").length} pending
            {type === "rehoming" && (
              <span style={{ marginLeft: "0.5rem", color: "#5aaa30" }}>
                · Approved rehomes auto-post to pet listings
              </span>
            )}
          </div>
        </div>

        {type === "rehoming" && (
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Total",          value: records.length,                                         warn: false },
              { label: "Pending",        value: records.filter(r => r.status === "Pending").length,     warn: records.filter(r => r.status === "Pending").length > 0 },
              { label: "Rehoming",       value: rehomeCount,      icon: "🏠", warn: false },
              { label: "Rescue",         value: rescueCount,      icon: "🫶", warn: false },
              ...(withPhotos > 0
                ? [{ label: "w/ Photos",     value: withPhotos,       icon: "📷", warn: false }]
                : []),
              ...(withVaccPhotos > 0
                ? [{ label: "w/ Vacc Photos", value: withVaccPhotos, icon: "🖼", warn: false }]
                : []),
            ].map(({ label, value, warn, icon }) => (
              <div key={label} className="rounded-xl border px-3 py-2 text-center" style={{ background: "#fffce8", borderColor: warn ? "rgba(245,158,11,0.4)" : "#ddd0a8" }}>
                <div className="text-xl font-black" style={{ color: warn ? "#d97706" : "#1a4a08" }}>
                  {icon && <span style={{ marginRight: "0.2rem" }}>{icon}</span>}{value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9aaa80" }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request type sub-filter */}
      {type === "rehoming" && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9aaa80" }}>Type:</span>
          {[
            { key: "all",    label: "All requests" },
            { key: "rehome", label: "🏠 Rehoming only" },
            { key: "rescue", label: "🫶 Rescue / Surrender only" },
          ].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1 rounded-xl text-xs font-black border transition-all ${
                typeFilter === t.key ? "bg-amber-600 border-amber-600 text-white" : "border-[#ddd0a8] text-[#7a6030] hover:bg-amber-50"
              }`}>
              {t.label}
              <span style={{ marginLeft: "0.35rem", fontSize: "0.68rem", opacity: 0.75 }}>
                ({t.key === "all" ? records.length : t.key === "rescue" ? rescueCount : rehomeCount})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      ) : visibleRecords.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-sm font-bold" style={{ color: "#9aaa80" }}>
            No {filter === "all" ? "" : filter.toLowerCase() + " "}requests found
            {typeFilter !== "all" && ` for ${typeFilter === "rescue" ? "rescue / surrender" : "rehoming"}`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleRecords.map((r, i) => (
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

      <RejectModal open={!!rejectId} onClose={() => setRejectId(null)} onConfirm={doReject} />
      <DetailModal
        r={viewTarget} type={type} open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        onApprove={approve}
        onReject={id => { setViewTarget(null); setRejectId(id); }}
        onEdit={r => { setViewTarget(null); setEditTarget(r); }}
        onDelete={r => { setViewTarget(null); setDeleteTarget(r); }}
      />
      <EditModal open={!!editTarget} record={editTarget} type={type} onClose={() => setEditTarget(null)} onSave={doUpdate} />
      <DeleteModal open={!!deleteTarget} record={deleteTarget} type={type} onClose={() => setDeleteTarget(null)} onConfirm={doDelete} />

      {toast && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "0.7rem 1.25rem", borderRadius: 12, fontWeight: 800, fontSize: "0.84rem", background: toast.kind === "err" ? "#c03030" : "#1c4f09", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.22)", fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
          <span>{toast.kind === "err" ? "✕" : "✓"}</span>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}