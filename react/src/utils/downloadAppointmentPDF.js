/**
 * src/utils/downloadAppointmentPDF.js
 *
 * Receipt-style PDF — Adoption or Rehoming.
 * Layout: logo top-left · org info top-right · bordered table sections
 * No payment. No signature.
 *
 * ADDRESS FIELDS READ (tries all common key names):
 *   street / street_address / house_number
 *   barangay
 *   city / municipality / city_municipality
 *   province
 *   region
 *   zip_code / zipcode / postal_code / zip
 *   address / home_address  ← raw string fallback
 *
 * Usage:  await downloadAppointmentPDF(record, "admin" | "user")
 * Needs:  npm install jspdf   +   src/utils/logoBase64.js
 */

import { jsPDF } from "jspdf";
import { getLogoBase64 } from "./logoBase64";

// ─── Page geometry ────────────────────────────────────────────────────────────
const PW = 210;
const PH = 297;
const ML = 14;
const MR = 14;
const CW = PW - ML - MR;

// ─── Palettes ─────────────────────────────────────────────────────────────────
const ADOPTION = {
  headerBg:   [0,   62,  90],
  sectionBg:  [0,   62,  90],
  sectionFg:  [255, 255, 255],
  accentLine: [0,   62,  90],
  tint:       [237, 245, 250],
  labelFg:    [60,  60,  60],
  valueFg:    [10,  10,  10],
  border:     [160, 180, 195],
  title:      "Animal Adoption Receipt",
};
const REHOMING = {
  headerBg:   [90,  42,  10],
  sectionBg:  [90,  42,  10],
  sectionFg:  [255, 255, 255],
  accentLine: [90,  42,  10],
  tint:       [252, 246, 234],
  labelFg:    [60,  60,  60],
  valueFg:    [10,  10,  10],
  border:     [200, 175, 145],
  title:      "Animal Rehoming Receipt",
};

const WHITE    = [255, 255, 255];
const INK_LITE = [130, 125, 115];
const RULE     = [190, 188, 180];

const STATUS_COLOR = {
  Approved: { fg: [12,  100, 20],  bg: [208, 248, 210] },
  Rejected: { fg: [155, 20,  20],  bg: [252, 215, 215] },
  Pending:  { fg: [125, 85,   5],  bg: [252, 242, 205] },
};

// ─── Record normaliser ────────────────────────────────────────────────────────
/**
 * Coerce all known field-name variants and type mismatches so the rest of the
 * PDF code always sees a consistent shape regardless of which endpoint or form
 * produced the record.
 */
function normalizeRecord(r) {
  const n = { ...r };

  // ── Boolean coercion (Django sometimes sends "true"/"false" strings) ────────
  const BOOL_KEYS = [
    "owns_home", "pet_permission", "has_children", "has_other_pets",
    "other_pets_vaccinated", "open_to_guidance", "previous_pet",
    "is_vaccinated", "is_neutered", "is_house_trained", "is_leash_trained",
    "good_with_children", "good_with_pets", "has_aggression",
    "can_provide_food", "can_provide_carrier", "can_provide_records",
  ];
  BOOL_KEYS.forEach(k => {
    if (k in n) {
      if (n[k] === "true"  || n[k] === 1) n[k] = true;
      if (n[k] === "false" || n[k] === 0) n[k] = false;
    }
  });

  // ── Address field aliases ───────────────────────────────────────────────────
  if (!n.zip)     n.zip     = n.zip_code || n.zipcode || n.postal_code || "";
  if (!n.city)    n.city    = n.municipality || n.city_municipality || "";
  if (!n.address) n.address = n.home_address || "";

  // ── Replace null / undefined string fields with "" ─────────────────────────
  // Prevents sv() from printing the literal string "null" in the PDF
  [
    "name", "email", "phone", "address", "city", "province", "zip",
    "animal_name", "primary_caregiver", "housing", "household_size",
    "children_ages", "other_pets_detail", "exp", "alone_hours",
    "backup_care", "budget", "vet_plan", "behavior_response",
    "previous_pet_details", "reason",
    "owner_name", "contact", "pet_name", "species", "breed", "age",
    "gender", "duration_owned", "ideal_home_desc", "vaccine_type",
    "last_vacc_date", "vacc_clinic", "vacc_notes", "medical_notes",
    "behavior", "behavior_other", "details", "tried_alternatives",
    "reject_note",
  ].forEach(k => { if (n[k] == null) n[k] = ""; });

  return n;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function setF(doc, c)  { doc.setFillColor(...c); }
function setD(doc, c)  { doc.setDrawColor(...c); }
function setT(doc, c)  { doc.setTextColor(...c); }
function setLW(doc, w) { doc.setLineWidth(w); }

function hln(doc, y, x1, x2, col, w) {
  x1  = x1  ?? ML;
  x2  = x2  ?? PW - MR;
  col = col ?? RULE;
  w   = w   ?? 0.2;
  setD(doc, col); setLW(doc, w);
  doc.line(x1, y, x2, y);
}

function sv(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const s = String(v).trim();
  return s === "" ? "—" : s;
}

function fmtDate(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("en-PH", { dateStyle: "long" }); }
  catch { return String(v); }
}

/**
 * Build a complete address string from all possible field names.
 * Works for both adoption (person address) and rehoming (owner address).
 */
function buildFullAddress(r) {
  const parts = [];

  const street = sv(r.street_address || r.street || r.house_number || "");
  if (street !== "—") parts.push(street);

  const brgy = sv(r.barangay || "");
  if (brgy !== "—") parts.push("Brgy. " + brgy);

  const city = sv(r.city || r.municipality || r.city_municipality || "");
  if (city !== "—") parts.push(city);

  const prov = sv(r.province || "");
  if (prov !== "—") parts.push(prov);

  const region = sv(r.region || "");
  if (region !== "—") parts.push(region);

  const zip = sv(r.zip_code || r.zipcode || r.postal_code || r.zip || "");
  if (zip !== "—") parts.push(zip);

  if (parts.length > 0) return parts.join(", ");

  return sv(r.address || r.home_address || "");
}

/**
 * Return individual address component values (for the separate detail rows).
 */
function addrComponents(r) {
  return {
    street:   sv(r.street_address || r.street || r.house_number || ""),
    barangay: sv(r.barangay || ""),
    city:     sv(r.city || r.municipality || r.city_municipality || ""),
    province: sv(r.province || ""),
    region:   sv(r.region || ""),
    zip:      sv(r.zip_code || r.zipcode || r.postal_code || r.zip || ""),
    raw:      sv(r.address || r.home_address || ""),
  };
}

// ─── Page 1 header ────────────────────────────────────────────────────────────
function drawHeader(doc, pal, logo, record, status) {
  setF(doc, WHITE); doc.rect(0, 0, PW, PH, "F");

  setF(doc, pal.accentLine); doc.rect(0, 0, PW, 2, "F");

  if (logo) { try { doc.addImage(logo, "PNG", ML, 4, 22, 22); } catch {} }

  doc.setFont("helvetica", "bold");   doc.setFontSize(9);
  setT(doc, pal.headerBg);
  doc.text("PAWSTER", PW - MR, 8, { align: "right" });

  doc.setFont("helvetica", "normal"); doc.setFontSize(6.8);
  setT(doc, [70, 70, 70]);
  doc.text("Animal Adoption & Rehoming System", PW - MR, 13,   { align: "right" });
  doc.text("Ilocos Region, Philippines",        PW - MR, 17.5, { align: "right" });
  doc.text("pawster@email.com",                 PW - MR, 22,   { align: "right" });

  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  setT(doc, pal.headerBg);
  doc.text(pal.title, PW / 2, 16, { align: "center" });

  let y = 30;
  setD(doc, pal.border); setLW(doc, 0.5);
  doc.line(ML, y, PW - MR, y);
  y += 5;

  const col3 = CW / 3;

  doc.setFont("helvetica", "bold");   doc.setFontSize(6);
  setT(doc, INK_LITE);
  doc.text("DATE GENERATED", ML, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  setT(doc, [10, 10, 10]);
  doc.text(new Date().toLocaleDateString("en-PH", { dateStyle: "long" }), ML, y + 5);

  doc.setFont("helvetica", "bold");   doc.setFontSize(6);
  setT(doc, INK_LITE);
  doc.text("RECEIPT NO.", ML + col3, y, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  setT(doc, [10, 10, 10]);
  doc.text(sv(record.id), ML + col3, y + 5, { align: "center" });

  doc.setFont("helvetica", "bold");   doc.setFontSize(6);
  setT(doc, INK_LITE);
  doc.text("DATE SUBMITTED", ML + col3 * 1.85, y, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  setT(doc, [10, 10, 10]);
  doc.text(fmtDate(record.created_at), ML + col3 * 1.85, y + 5, { align: "center" });

  const st  = STATUS_COLOR[status] || STATUS_COLOR.Pending;
  const pw2 = 28, ph2 = 7;
  const px  = PW - MR - pw2, py = y - 0.5;
  setF(doc, st.bg); setD(doc, st.fg); setLW(doc, 0.35);
  doc.roundedRect(px, py, pw2, ph2, ph2 / 2, ph2 / 2, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
  setT(doc, st.fg);
  doc.text(status.toUpperCase(), px + pw2 / 2, py + ph2 / 2 + 2.2, { align: "center" });

  y += 12;
  hln(doc, y, ML, PW - MR, pal.border, 0.4);
  return y + 5;
}

// ─── Continuation header ──────────────────────────────────────────────────────
function drawContinuation(doc, pal, logo, pageNum) {
  setF(doc, WHITE); doc.rect(0, 0, PW, PH, "F");
  setF(doc, pal.accentLine); doc.rect(0, 0, PW, 2,  "F");
  setF(doc, pal.headerBg);   doc.rect(0, 2, PW, 10, "F");
  if (logo) { try { doc.addImage(logo, "PNG", ML, 3, 7, 7); } catch {} }
  const tx = logo ? ML + 10 : ML;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  setT(doc, WHITE);
  doc.text("PAWSTER  ·  " + pal.title, tx, 8.5);
  doc.text("Page " + pageNum, PW - MR, 8.5, { align: "right" });
  hln(doc, 14, ML, PW - MR, pal.border, 0.3);
  return 20;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc, pal, pageNum, total) {
  const fy = PH - 13;
  setF(doc, pal.accentLine); doc.rect(ML, fy, CW, 0.35, "F");
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.8);
  setT(doc, INK_LITE);
  doc.text("This is an official Pawster receipt. Please retain for your records.", ML, fy + 4.5);
  doc.text("Page " + pageNum + " of " + total, PW - MR, fy + 4.5, { align: "right" });
  doc.text("Pawster Animal Adoption & Rehoming System  ·  Ilocos Region, Philippines", ML, fy + 8.5);
  doc.text("Generated: " + new Date().toLocaleDateString("en-PH", { dateStyle: "long" }), PW - MR, fy + 8.5, { align: "right" });
}

// ─── Section header row ───────────────────────────────────────────────────────
function sectionHeader(doc, y, title, pal) {
  const H = 7;
  setF(doc, pal.sectionBg); doc.rect(ML, y, CW, H, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
  setT(doc, pal.sectionFg);
  doc.text(title, ML + 4, y + 5);
  return y + H;
}

// ─── Table renderer ───────────────────────────────────────────────────────────
function renderTable(doc, startY, rows, pal) {
  const HALF  = (CW - 1) / 2;
  const PAD_X = 3;
  const MIN_H = 11;

  const groups = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].full) {
      groups.push([rows[i]]);
      i++;
    } else if (rows[i + 1] && !rows[i + 1].full) {
      groups.push([rows[i], rows[i + 1]]);
      i += 2;
    } else {
      groups.push([rows[i]]);
      i++;
    }
  }

  let y = startY;

  groups.forEach((grp, gi) => {
    const isFull = grp.length === 1 && !!grp[0].full;
    const valW   = isFull ? CW - PAD_X * 2 : HALF - PAD_X * 2;

    let maxLines = 1;
    grp.forEach(cell => {
      const lines = doc.splitTextToSize(sv(cell.value), valW);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    const rowH = Math.max(MIN_H, 4.5 + maxLines * 4.4 + 5);

    if (gi % 2 === 1) {
      setF(doc, pal.tint); doc.rect(ML, y, CW, rowH, "F");
    }

    if (grp.length === 2) {
      setD(doc, pal.border); setLW(doc, 0.2);
      doc.line(ML + HALF + 0.5, y, ML + HALF + 0.5, y + rowH);
    }

    grp.forEach((cell, ci) => {
      const cx = ci === 0 ? ML + PAD_X : ML + HALF + 1 + PAD_X;
      const cw = isFull ? CW - PAD_X * 2 : HALF - PAD_X * 2;

      doc.setFont("helvetica", "bold"); doc.setFontSize(6);
      setT(doc, pal.labelFg);
      doc.text(cell.label, cx, y + 4);

      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      setT(doc, pal.valueFg);
      const lines = doc.splitTextToSize(sv(cell.value), cw);
      doc.text(lines, cx, y + 9);
    });

    hln(doc, y + rowH, ML, ML + CW, pal.border, 0.2);
    y += rowH;
  });

  setD(doc, pal.border); setLW(doc, 0.4);
  doc.rect(ML, startY, CW, y - startY, "S");

  return y + 5;
}

// ─── Boolean trait grid ───────────────────────────────────────────────────────
function traitTable(doc, startY, items, pal) {
  const COLS   = 3;
  const CELL_H = 8;
  const colW   = CW / COLS;
  const totalH = Math.ceil(items.length / COLS) * CELL_H;

  setF(doc, WHITE); doc.rect(ML, startY, CW, totalH, "F");

  items.forEach(([label, raw], idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x   = ML + col * colW;
    const ty  = startY + row * CELL_H;

    if (row % 2 === 1) {
      setF(doc, pal.tint); doc.rect(x, ty, colW, CELL_H, "F");
    }

    const yes = raw === true || raw === "true" || raw === 1 || raw === "Yes" || raw === "Yes ✓";
    setF(doc, yes ? [30, 145, 30] : [195, 50, 50]);
    doc.circle(x + 4, ty + CELL_H / 2, 1.6, "F");

    doc.setFont("helvetica", yes ? "bold" : "normal"); doc.setFontSize(7.5);
    setT(doc, yes ? pal.sectionBg : [130, 40, 40]);
    doc.text(label, x + 9, ty + CELL_H / 2 + 2.5);

    hln(doc, ty + CELL_H, x, x + colW, pal.border, 0.15);
    if (col < COLS - 1) {
      setD(doc, pal.border); setLW(doc, 0.15);
      doc.line(x + colW, ty, x + colW, ty + CELL_H);
    }
  });

  setD(doc, pal.border); setLW(doc, 0.4);
  doc.rect(ML, startY, CW, totalH, "S");

  return startY + totalH + 5;
}

// ─── Page-break guard ─────────────────────────────────────────────────────────
function guard(doc, y, need, pal, logo, pg) {
  if (y + need < PH - 20) return y;
  drawFooter(doc, pal, pg.n, "?");
  doc.addPage(); pg.n++;
  return drawContinuation(doc, pal, logo, pg.n);
}

// ─── Address rows helper ──────────────────────────────────────────────────────
function addressRows(r, addrLabel = "Full Address") {
  const addr = addrComponents(r);
  const full = buildFullAddress(r);

  const rows = [
    { label: addrLabel, value: full, full: true },
  ];

  const hasStructured = [addr.street, addr.barangay, addr.city, addr.province, addr.zip]
    .some(v => v !== "—");

  if (hasStructured) {
    if (addr.street !== "—") rows.push({ label: "Street / House No.", value: addr.street });
    else                     rows.push({ label: "Street / House No.", value: "—" });

    rows.push(
      { label: "Barangay",            value: addr.barangay },
      { label: "City / Municipality", value: addr.city     },
      { label: "Province",            value: addr.province },
      { label: "Region",              value: addr.region   },
      { label: "Zip / Postal Code",   value: addr.zip      },
    );
  }

  return rows;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function downloadAppointmentPDF(recordRaw, _mode = "user") {

  // Normalise field names and types before anything else touches the record
  const record = normalizeRecord(recordRaw);

  const logo = await getLogoBase64();

  const isRehoming =
    record._type === "Rehoming" ||
    (!record._type && !record.name && !record.animal_name &&
     (record.pet_name || record.species || record.owner_name));

  const pal = isRehoming ? REHOMING : ADOPTION;

  const rawName  = isRehoming
    ? (record.owner_name || record.pet_name || "Applicant")
    : (record.name        || "Applicant");
  const safeName = String(rawName).replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_");
  const filename = `${safeName}_${isRehoming ? "Rehoming" : "Adoption"}_Receipt.pdf`;

  const status = sv(record.status) === "—" ? "Pending" : sv(record.status);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pg  = { n: 1 };

  let y = drawHeader(doc, pal, logo, record, status);

  // ════════════════════════════════════════════════════════════
  // ADOPTION
  // ════════════════════════════════════════════════════════════
  if (!isRehoming) {

    // ── Applicant Details ─────────────────────────────────────
    y = sectionHeader(doc, y, "Applicant Details", pal);
    y = renderTable(doc, y, [
      { label: "Person Name",       value: record.name },
      { label: "Primary Caregiver", value: record.primary_caregiver },
      { label: "Phone / Mobile",    value: record.phone },
      { label: "Email Address",     value: record.email },
      ...addressRows(record, "Person Address"),
    ], pal);

    // ── Animal Details ────────────────────────────────────────
    y = guard(doc, y, 40, pal, logo, pg);
    y = sectionHeader(doc, y, "Animal Details", pal);
    y = renderTable(doc, y, [
      { label: "Animal Applied For", value: record.animal_name },
      { label: "Date Submitted",     value: fmtDate(record.created_at) },
    ], pal);

    // ── Household & Housing ───────────────────────────────────
    y = guard(doc, y, 55, pal, logo, pg);
    y = sectionHeader(doc, y, "Household & Housing", pal);
    y = renderTable(doc, y, [
      { label: "Housing Type",      value: record.housing },
      { label: "Household Size",    value: record.household_size },
      { label: "Children's Ages",   value: record.children_ages },
      { label: "Other Pets Detail", value: record.other_pets_detail, full: true },
    ], pal);
    y = guard(doc, y, 30, pal, logo, pg);
    y = traitTable(doc, y, [
      ["Owns Home",             record.owns_home],
      ["Has Pet Permission",    record.pet_permission],
      ["Has Children",          record.has_children],
      ["Has Other Pets",        record.has_other_pets],
      ["Other Pets Vaccinated", record.other_pets_vaccinated],
      ["Open to Guidance",      record.open_to_guidance],
    ], pal);

    // ── Experience, Time & Budget ─────────────────────────────
    y = guard(doc, y, 50, pal, logo, pg);
    y = sectionHeader(doc, y, "Experience, Time & Budget", pal);
    y = renderTable(doc, y, [
      { label: "Prior Experience",       value: record.exp },
      { label: "Hours Left Alone / Day", value: record.alone_hours },
      { label: "Monthly Budget",         value: record.budget },
      { label: "Backup Care Plan",       value: record.backup_care, full: true },
      { label: "Veterinary Plan",        value: record.vet_plan,    full: true },
    ], pal);

    // ── Commitment & Reason ────────────────────────────────────
    y = guard(doc, y, 55, pal, logo, pg);
    y = sectionHeader(doc, y, "Commitment & Reason", pal);
    y = renderTable(doc, y, [
      { label: "Had a Previous Pet",   value: record.previous_pet },
      { label: "Previous Pet Details", value: record.previous_pet_details, full: true },
      { label: "Reason for Adoption",  value: record.reason,               full: true },
      { label: "Behaviour Response",   value: record.behavior_response,    full: true },
    ], pal);
  }

  // ════════════════════════════════════════════════════════════
  // REHOMING
  // ════════════════════════════════════════════════════════════
  if (isRehoming) {

    // ── Owner / Submitter Details ─────────────────────────────
    y = sectionHeader(doc, y, "Owner / Submitter Details", pal);
    y = renderTable(doc, y, [
      { label: "Owner / Submitter Name", value: record.owner_name },
      { label: "Contact Number",         value: record.contact },
      ...addressRows(record, "Owner Address"),
    ], pal);

    // ── Pet Details ───────────────────────────────────────────
    y = guard(doc, y, 60, pal, logo, pg);
    y = sectionHeader(doc, y, "Pet Details", pal);
    y = renderTable(doc, y, [
      { label: "Pet Name",       value: record.pet_name },
      { label: "Species",        value: record.species },
      { label: "Breed",          value: record.breed },
      { label: "Age",            value: record.age },
      { label: "Gender",         value: record.gender },
      { label: "Duration Owned", value: record.duration_owned },
      { label: "Ideal Home Description", value: record.ideal_home_desc, full: true },
    ], pal);

    // ── Health & Vaccination ──────────────────────────────────
    y = guard(doc, y, 55, pal, logo, pg);
    y = sectionHeader(doc, y, "Health & Vaccination", pal);
    y = renderTable(doc, y, [
      { label: "Vaccine Type",      value: record.vaccine_type },
      { label: "Last Vaccinated",   value: record.last_vacc_date },
      { label: "Veterinary Clinic", value: record.vacc_clinic },
      { label: "Vaccination Notes", value: record.vacc_notes,    full: true },
      { label: "Medical Notes",     value: record.medical_notes, full: true },
    ], pal);

    // ── Care Traits ───────────────────────────────────────────
    y = guard(doc, y, 50, pal, logo, pg);
    y = sectionHeader(doc, y, "Care Traits & Characteristics", pal);
    y = traitTable(doc, y, [
      ["Vaccinated",           record.is_vaccinated],
      ["Neutered / Spayed",    record.is_neutered],
      ["House Trained",        record.is_house_trained],
      ["Leash Trained",        record.is_leash_trained],
      ["Good with Children",   record.good_with_children],
      ["Good with Other Pets", record.good_with_pets],
      ["Has Aggression",       record.has_aggression],
      ["Can Provide Food",     record.can_provide_food],
      ["Can Provide Carrier",  record.can_provide_carrier],
      ["Can Provide Records",  record.can_provide_records],
    ], pal);

    // ── Behaviour & Reason for Rehoming ──────────────────────
    y = guard(doc, y, 60, pal, logo, pg);
    y = sectionHeader(doc, y, "Behaviour & Reason for Rehoming", pal);
    y = renderTable(doc, y, [
      { label: "Behaviour",             value: record.behavior },
      { label: "Behaviour Detail",      value: record.behavior_other },
      { label: "Additional Details",    value: record.details,            full: true },
      { label: "Reason for Rehoming",   value: record.reason,             full: true },
      { label: "Alternatives Explored", value: record.tried_alternatives, full: true },
    ], pal);
  }

  // ── Rejection note ────────────────────────────────────────────────────────
  if (sv(record.reject_note) !== "—") {
    y = guard(doc, y, 35, pal, logo, pg);
    const rejPal = {
      ...pal,
      sectionBg: STATUS_COLOR.Rejected.fg,
      sectionFg: WHITE,
      tint:      STATUS_COLOR.Rejected.bg,
    };
    y = sectionHeader(doc, y, "Rejection Note", rejPal);
    y = renderTable(doc, y, [
      { label: "Rejection Reason", value: record.reject_note, full: true },
    ], rejPal);
  }

  // ── End of document ───────────────────────────────────────────────────────
  y = guard(doc, y, 18, pal, logo, pg);
  y += 4;
  setF(doc, pal.tint); doc.rect(ML, y, CW, 12, "F");
  setF(doc, pal.accentLine); doc.rect(ML, y, 3, 12, "F");
  doc.setFont("helvetica", "bold");   doc.setFontSize(7);
  setT(doc, pal.sectionBg);
  doc.text("END OF DOCUMENT", ML + 6, y + 5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6);
  setT(doc, [90, 90, 90]);
  doc.text(
    "This is a computer-generated document valid without a handwritten signature unless otherwise stipulated by Pawster policy.",
    ML + 6, y + 10
  );

  // ── Footer on all pages ───────────────────────────────────────────────────
  const total = pg.n;
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, pal, p, total);
  }

  doc.save(filename);
}