/**
 * src/utils/downloadAppointmentPDF.js
 *
 * Receipt-style PDF — Adoption or Rehoming.
 * Layout: logo top-left · org info top-right · bordered table sections
 * No payment. No signature. No trait grid.
 *
 * ADDRESS FIELDS READ:
 *   street_address / street / house_number
 *   city / municipality / city_municipality
 *   province
 *   zip_code / zipcode / postal_code / zip
 *   address / home_address  ← raw string fallback
 *
 * Usage:  await downloadAppointmentPDF(record, "admin" | "user")
 * Needs:  npm install jspdf   +   src/utils/logoBase64.js
 */

import { jsPDF } from "jspdf";
import { getLogoBase64 } from "./logoBase64";

// ─── Page geometry ────────────────────────────────────────────────────────────
const PW  = 210;
const PH  = 297;
const ML  = 15;
const MR  = 15;
const CW  = PW - ML - MR;
const MT  = 14;

// ─── Typography scale ─────────────────────────────────────────────────────────
const FONT = {
  hero:    13,
  section: 7.5,
  label:   5.8,
  value:   8,
  tiny:    5.5,
  badge:   6.2,
  sub:     6.5,
};

// ─── Spacing constants ────────────────────────────────────────────────────────
const SECTION_GAP  = 6;
const ROW_PAD_X    = 4;
const ROW_PAD_Y    = 3.5;
const ROW_LINE_H   = 4.2;
const ROW_MIN_H    = 12;

// ─── Palettes ─────────────────────────────────────────────────────────────────
const ADOPTION = {
  headerBg:   [22,  60,   8],
  sectionBg:  [22,  60,   8],
  sectionFg:  [255, 255, 255],
  accentLine: [72, 120,  50],
  tint:       [240, 250, 235],
  labelFg:    [80, 110,  58],
  valueFg:    [20,  55,   6],
  border:     [175, 210, 158],
  divider:    [215, 235, 205],
  title:      "Animal Adoption Receipt",
  typeTag:    "ADOPTION",
};
const REHOMING = {
  headerBg:   [130,  65,  20],
  sectionBg:  [145,  70,  22],
  sectionFg:  [255, 255, 255],
  accentLine: [185, 105,  28],
  tint:       [254, 246, 232],
  labelFg:    [130,  88,  45],
  valueFg:    [70,   38,   8],
  border:     [215, 178, 128],
  divider:    [235, 212, 170],
  title:      "Animal Rehoming / Rescue Receipt",
  typeTag:    "REHOMING / RESCUE",
};

const WHITE    = [255, 255, 255];
const INK_MID  = [90,  70,  38];
const INK_LITE = [148, 120,  78];
const RULE     = [215, 192, 150];

const STATUS_COLOR = {
  Approved: { fg: [22,  65,   8],  bg: [218, 244, 208], border: [72, 120, 50]  },
  Rejected: { fg: [158,  16,  16], bg: [255, 215, 215], border: [200, 55, 55]  },
  Pending:  { fg: [145,  78,  20], bg: [255, 240, 210], border: [185, 110, 28] },
};

// ─── Boolean normaliser ───────────────────────────────────────────────────────
function normalizeRecord(r) {
  const n = { ...r };

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

  if (!n.zip)     n.zip     = n.zip_code || n.zipcode || n.postal_code || "";
  if (!n.city)    n.city    = n.municipality || n.city_municipality || "";
  if (!n.address) n.address = n.home_address || "";

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

function hln(doc, y, x1, x2, col, w = 0.18) {
  x1  = x1  ?? ML;
  x2  = x2  ?? PW - MR;
  col = col ?? RULE;
  setD(doc, col); setLW(doc, w);
  doc.line(x1, y, x2, y);
}

function sv(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  const s = String(v).trim();
  return s === "" ? "—" : s;
}

/**
 * triSv — for tri-state fields (is_vaccinated, is_neutered, etc.)
 * null / "unknown" → "Unknown"
 * true / "yes"     → "Yes"
 * false / "no"     → "No"
 */
function triSv(v) {
  if (v === true  || v === "yes")                            return "Yes";
  if (v === false || v === "no")                             return "No";
  if (v === "unknown" || v === null || v === undefined)      return "Unknown";
  const s = String(v).trim();
  return s === "" ? "Unknown" : s;
}

function isYes(v) {
  return v === true || v === "yes" || v === "true" || v === 1;
}

function fmtDate(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("en-PH", { dateStyle: "long" }); }
  catch { return String(v); }
}

// ─── Address helpers ──────────────────────────────────────────────────────────
function buildFullAddress(r) {
  const parts = [];
  const street = sv(r.street_address || r.street || r.house_number || "");
  if (street !== "—") parts.push(street);
  const city = sv(r.city || r.municipality || r.city_municipality || "");
  if (city !== "—") parts.push(city);
  const prov = sv(r.province || "");
  if (prov !== "—") parts.push(prov);
  const zip = sv(r.zip_code || r.zipcode || r.postal_code || r.zip || "");
  if (zip !== "—") parts.push(zip);
  if (parts.length > 0) return parts.join(", ");
  return sv(r.address || r.home_address || "");
}

function addrComponents(r) {
  return {
    street:   sv(r.street_address || r.street || r.house_number || ""),
    city:     sv(r.city || r.municipality || r.city_municipality || ""),
    province: sv(r.province || ""),
    zip:      sv(r.zip_code || r.zipcode || r.postal_code || r.zip || ""),
  };
}

// ─── Rounded rect ─────────────────────────────────────────────────────────────
function roundRect(doc, x, y, w, h, r, style = "F") {
  doc.roundedRect(x, y, w, h, r, r, style);
}

// ─── Page 1 header ────────────────────────────────────────────────────────────
function drawHeader(doc, pal, logo, record, status) {
  // Background
  setF(doc, WHITE); doc.rect(0, 0, PW, PH, "F");

  // Header band — tall enough to clear title + tag + padding
  setF(doc, pal.headerBg); doc.rect(0, 0, PW, 52, "F");
  // Top accent line
  setF(doc, pal.accentLine); doc.rect(0, 0, PW, 2, "F");
  // Subtle triangle watermark
  doc.setGState && doc.setGState(doc.GState({ opacity: 0.08 }));
  setF(doc, WHITE);
  doc.triangle(PW - 45, 0, PW, 0, PW, 45, "F");
  doc.setGState && doc.setGState(doc.GState({ opacity: 1.0 }));

  // Logo
  if (logo) {
    try { doc.addImage(logo, "PNG", ML, 9, 20, 20); }
    catch {}
  }

  // Org info (right)
  const rightX = PW - MR;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  setT(doc, WHITE);
  doc.text("PAWSTER", rightX, 11, { align: "right" });

  doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.tiny);
  setT(doc, [185, 215, 235]);
  doc.text("Animal Adoption & Rescue System", rightX, 16,   { align: "right" });
  doc.text("CAR, Philippines",               rightX, 20.5, { align: "right" });
  doc.text("pawster@email.com",              rightX, 25,   { align: "right" });

  // Document title (centred)
  const titleY = 24;
  doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.hero);
  setT(doc, WHITE);
  doc.text(pal.title.toUpperCase(), PW / 2, titleY, { align: "center" });

  // Type badge
  const tagW = 24, tagH = 6;
  const tagX = PW / 2 - tagW / 2;
  const tagY = titleY + 4;
  setF(doc, pal.accentLine); setD(doc, pal.accentLine); setLW(doc, 0);
  roundRect(doc, tagX, tagY, tagW, tagH, tagH / 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(5);
  setT(doc, WHITE);
  doc.text(pal.typeTag, PW / 2, tagY + tagH / 3 + 1.8, { align: "center" });

  // Meta strip — starts after header band clears
  const stripY = 56;
  const colW   = CW / 4;
  const meta = [
    { label: "DATE GENERATED", value: new Date().toLocaleDateString("en-PH", { dateStyle: "medium" }) },
    { label: "RECEIPT NO.",    value: sv(record.id) },
    { label: "DATE SUBMITTED", value: fmtDate(record.created_at) },
  ];

  setF(doc, [246, 249, 252]); doc.rect(ML, stripY, CW, 14, "F");
  setD(doc, pal.border); setLW(doc, 0.3);
  doc.rect(ML, stripY, CW, 14, "S");

  meta.forEach((m, i) => {
    const cx = ML + colW * i + ROW_PAD_X;
    doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.label);
    setT(doc, INK_LITE);
    doc.text(m.label, cx, stripY + 4.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.value);
    setT(doc, pal.valueFg);
    doc.text(m.value, cx, stripY + 10.5);
    if (i < meta.length - 1) {
      setD(doc, pal.border); setLW(doc, 0.2);
      doc.line(ML + colW * (i + 1), stripY + 2, ML + colW * (i + 1), stripY + 12);
    }
  });

  // Status badge
  const st     = STATUS_COLOR[status] || STATUS_COLOR.Pending;
  const badgeW = 30, badgeH = 8;
  const badgeX = PW - MR - badgeW - 1;
  const badgeY = stripY + (14 - badgeH) / 2;
  setF(doc, st.bg); setD(doc, st.border); setLW(doc, 0.5);
  roundRect(doc, badgeX, badgeY, badgeW, badgeH, badgeH / 2, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.badge);
  setT(doc, st.fg);
  doc.text(status.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 3 + 2.1, { align: "center" });

  return stripY + 14 + SECTION_GAP;
}

// ─── Continuation header ──────────────────────────────────────────────────────
function drawContinuation(doc, pal, logo, pageNum) {
  setF(doc, WHITE); doc.rect(0, 0, PW, PH, "F");
  setF(doc, pal.accentLine); doc.rect(0, 0, PW, 2, "F");
  setF(doc, pal.headerBg);   doc.rect(0, 2, PW, 11, "F");

  if (logo) { try { doc.addImage(logo, "PNG", ML, 3.5, 7, 7); } catch {} }

  const tx = logo ? ML + 10 : ML;
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  setT(doc, WHITE);
  doc.text("PAWSTER  ·  " + pal.title, tx, 9);
  doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.tiny);
  setT(doc, [190, 220, 240]);
  doc.text("Page " + pageNum, PW - MR, 9, { align: "right" });

  hln(doc, 15, ML, PW - MR, pal.border, 0.3);
  return 21;
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function drawFooter(doc, pal, pageNum, total) {
  const fy = PH - 14;
  setF(doc, pal.accentLine); doc.rect(ML, fy, CW, 0.5, "F");
  setF(doc, [248, 250, 252]); doc.rect(ML, fy + 0.5, CW, 13, "F");

  doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.tiny);
  setT(doc, INK_MID);
  doc.text(
    "This is an official Pawster receipt. Please retain for your records.",
    ML + 3, fy + 5
  );
  doc.text("Page " + pageNum + " of " + total, PW - MR - 3, fy + 5, { align: "right" });

  setT(doc, INK_LITE);
  doc.text(
    "Pawster Animal Adoption & Rescue System  ·  Ilocos Region, Philippines",
    ML + 3, fy + 10
  );
  doc.text(
    "Generated: " + new Date().toLocaleDateString("en-PH", { dateStyle: "medium" }),
    PW - MR - 3, fy + 10, { align: "right" }
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function sectionHeader(doc, y, title, pal) {
  const H = 8;
  setF(doc, pal.accentLine); doc.rect(ML, y, 3, H, "F");
  setF(doc, pal.sectionBg);  doc.rect(ML + 3, y, CW - 3, H, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.section);
  setT(doc, pal.sectionFg);
  doc.text(title.toUpperCase(), ML + 8, y + H / 2 + 2.8);
  return y + H;
}

// ─── Table renderer ───────────────────────────────────────────────────────────
function renderTable(doc, startY, rows, pal) {
  const HALF = (CW - 1) / 2;

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
  const borderStartY = y;

  groups.forEach((grp, gi) => {
    const isFull = grp.length === 1 && !!grp[0].full;
    const valW   = isFull ? CW - ROW_PAD_X * 2 - 1 : HALF - ROW_PAD_X * 2;

    let maxLines = 1;
    grp.forEach(cell => {
      const lines = doc.splitTextToSize(sv(cell.value), valW);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    const labelH = ROW_PAD_Y + 4;
    const valueH = maxLines * ROW_LINE_H;
    const rowH   = Math.max(ROW_MIN_H, labelH + valueH + 3.5);

    const rowBg = gi % 2 === 0 ? WHITE : pal.tint;
    setF(doc, rowBg); doc.rect(ML, y, CW, rowH, "F");

    if (grp.length === 2) {
      setD(doc, pal.divider); setLW(doc, 0.15);
      doc.line(ML + HALF + 0.5, y + 1.5, ML + HALF + 0.5, y + rowH - 1.5);
    }

    grp.forEach((cell, ci) => {
      const cx = ci === 0 ? ML + ROW_PAD_X : ML + HALF + 1 + ROW_PAD_X;

      doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.label);
      setT(doc, pal.labelFg);
      doc.text(cell.label.toUpperCase(), cx, y + ROW_PAD_Y + 2.5);

      doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.value);
      setT(doc, pal.valueFg);
      const lines = doc.splitTextToSize(sv(cell.value), isFull ? CW - ROW_PAD_X * 2 - 1 : HALF - ROW_PAD_X * 2);
      doc.text(lines, cx, y + ROW_PAD_Y + 2.5 + 4);
    });

    hln(doc, y + rowH, ML, ML + CW, pal.divider, 0.18);
    y += rowH;
  });

  setD(doc, pal.border); setLW(doc, 0.45);
  doc.rect(ML, borderStartY, CW, y - borderStartY, "S");

  return y + SECTION_GAP;
}

// ─── Page-break guard ─────────────────────────────────────────────────────────
function guard(doc, y, need, pal, logo, pg) {
  if (y + need < PH - 16) return y;
  drawFooter(doc, pal, pg.n, "?");
  doc.addPage();
  pg.n++;
  return drawContinuation(doc, pal, logo, pg.n);
}

// ─── Address rows helper ──────────────────────────────────────────────────────
function addressRows(r, addrLabel = "Full Address") {
  const addr = addrComponents(r);
  const full = buildFullAddress(r);
  return [
    { label: addrLabel,             value: full,          full: true },
    { label: "Street / House No.",  value: addr.street   },
    { label: "City / Municipality", value: addr.city     },
    { label: "Province",            value: addr.province },
    { label: "Zip / Postal Code",   value: addr.zip      },
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function downloadAppointmentPDF(recordRaw, _mode = "user") {

  const record = normalizeRecord(recordRaw);
  const logo   = await getLogoBase64();

  const isRehoming =
    record._type === "Rehoming" ||
    (!record._type && !record.name && !record.animal_name &&
     (record.pet_name || record.species || record.owner_name));

  const pal = isRehoming ? REHOMING : ADOPTION;

  const rawName  = isRehoming
    ? (record.owner_name || record.pet_name || "Applicant")
    : (record.name       || "Applicant");
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
      { label: "Full Name",         value: record.name },
      { label: "Primary Caregiver", value: record.primary_caregiver },
      { label: "Phone",             value: record.phone },
      { label: "Email",             value: record.email },
      ...addressRows(record, "Home Address"),
    ], pal);

    // ── Animal Details ────────────────────────────────────────
    y = guard(doc, y, 28, pal, logo, pg);
    y = sectionHeader(doc, y, "Animal Details", pal);
    y = renderTable(doc, y, [
      { label: "Animal Applied For", value: record.animal_name },
      { label: "Date Submitted",     value: fmtDate(record.created_at) },
    ], pal);

    // ── Household & Housing ───────────────────────────────────
    y = guard(doc, y, 70, pal, logo, pg);
    y = sectionHeader(doc, y, "Household & Housing", pal);
    y = renderTable(doc, y, [
      { label: "Housing Type",          value: record.housing },
      { label: "Household Size",        value: record.household_size },
      { label: "Owns Home",             value: sv(record.owns_home) },
      { label: "Has Pet Permission",    value: sv(record.pet_permission) },
      { label: "Has Children",          value: sv(record.has_children) },
      { label: "Children's Ages",       value: record.children_ages },
      { label: "Has Other Pets",        value: sv(record.has_other_pets) },
      { label: "Other Pets Vaccinated", value: sv(record.other_pets_vaccinated) },
      { label: "Other Pets Detail",     value: record.other_pets_detail, full: true },
      { label: "Open to Guidance",      value: sv(record.open_to_guidance) },
    ], pal);

    // ── Experience, Time & Budget ─────────────────────────────
    y = guard(doc, y, 55, pal, logo, pg);
    y = sectionHeader(doc, y, "Experience, Time & Budget", pal);
    y = renderTable(doc, y, [
      { label: "Prior Experience",       value: record.exp },
      { label: "Hours Left Alone / Day", value: record.alone_hours },
      { label: "Monthly Budget",         value: record.budget },
      { label: "Backup Care Plan",       value: record.backup_care,  full: true },
      { label: "Veterinary Plan",        value: record.vet_plan,     full: true },
    ], pal);

    // ── Commitment & Reason ───────────────────────────────────
    y = guard(doc, y, 60, pal, logo, pg);
    y = sectionHeader(doc, y, "Commitment & Reason", pal);
    y = renderTable(doc, y, [
      { label: "Had a Previous Pet",   value: sv(record.previous_pet) },
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
      { label: "Owner Name",  value: record.owner_name },
      { label: "Contact No.", value: record.contact },
      ...addressRows(record, "Owner Address"),
    ], pal);

    // ── Pet Details ───────────────────────────────────────────
    y = guard(doc, y, 65, pal, logo, pg);
    y = sectionHeader(doc, y, "Pet Details", pal);

    const isRescue = record.request_type === "rescue";
    y = renderTable(doc, y, [
      { label: "Pet Name", value: record.pet_name },
      { label: "Species",  value: record.species },
      { label: "Breed",    value: record.breed },
      { label: "Age",      value: record.age },
      { label: "Gender",   value: record.gender },
      ...(isRescue
        ? [{ label: "Where Found",    value: record.found_location || record.foundLocation || "—" }]
        : [{ label: "Duration Owned", value: record.duration_owned }]
      ),
      { label: "Ideal Home Description", value: record.ideal_home_desc, full: true },
    ], pal);

    // ── Health & Vaccination ──────────────────────────────────
    y = guard(doc, y, 55, pal, logo, pg);
    y = sectionHeader(doc, y, "Health & Vaccination", pal);

    const vaccStatus = triSv(record.is_vaccinated);
    const vaccYes    = isYes(record.is_vaccinated);

    y = renderTable(doc, y, [
      { label: "Vaccination Status",  value: vaccStatus },
      { label: "Neutered / Spayed",   value: triSv(record.is_neutered) },
      ...(vaccYes
        ? [
            { label: "Vaccine Type",      value: record.vaccine_type },
            { label: "Last Vaccinated",   value: record.last_vacc_date },
            { label: "Vet / Clinic",      value: record.vacc_clinic },
            { label: "Vaccination Notes", value: record.vacc_notes,    full: true },
          ]
        : []
      ),
      { label: "Medical Notes", value: record.medical_notes, full: true },
    ], pal);

    // ── Behavioural Traits ────────────────────────────────────
    y = guard(doc, y, 45, pal, logo, pg);
    y = sectionHeader(doc, y, "Behavioural Traits", pal);
    y = renderTable(doc, y, [
      { label: "House Trained",        value: triSv(record.is_house_trained)   },
      { label: "Leash Trained",        value: triSv(record.is_leash_trained)   },
      { label: "Good with Children",   value: triSv(record.good_with_children) },
      { label: "Good with Other Pets", value: triSv(record.good_with_pets)     },
      { label: "Has Aggression",       value: sv(record.has_aggression)        },
      { label: "Can Provide Food",     value: sv(record.can_provide_food)      },
      { label: "Can Provide Carrier",  value: sv(record.can_provide_carrier)   },
      { label: "Can Provide Records",  value: sv(record.can_provide_records)   },
    ], pal);

    // ── Behaviour & Reason for Rehoming ──────────────────────
    y = guard(doc, y, 65, pal, logo, pg);
    const sectionTitle = isRescue
      ? "Behaviour & Reason for Surrendering"
      : "Behaviour & Reason for Rehoming";
    y = sectionHeader(doc, y, sectionTitle, pal);
    y = renderTable(doc, y, [
      { label: "Behaviour",        value: record.behavior },
      { label: "Behaviour Detail", value: record.behavior_other },
      {
        label: isRescue ? "Reason for Surrendering" : "Reason for Rehoming",
        value: record.reason,
        full: true,
      },
      { label: "Additional Details", value: record.details, full: true },
      ...(!isRescue
        ? [{ label: "Alternatives Explored", value: record.tried_alternatives, full: true }]
        : []
      ),
    ], pal);
  }

  // ── Rejection note ────────────────────────────────────────────────────────
  if (sv(record.reject_note) !== "—") {
    y = guard(doc, y, 36, pal, logo, pg);
    const rejPal = {
      ...pal,
      sectionBg:  STATUS_COLOR.Rejected.fg,
      sectionFg:  WHITE,
      accentLine: STATUS_COLOR.Rejected.border,
      tint:       STATUS_COLOR.Rejected.bg,
      divider:    [238, 192, 192],
      border:     STATUS_COLOR.Rejected.border,
    };
    y = sectionHeader(doc, y, "Rejection Note", rejPal);
    y = renderTable(doc, y, [
      { label: "Rejection Reason", value: record.reject_note, full: true },
    ], rejPal);
  }

  // ── End-of-document banner ────────────────────────────────────────────────
  y = guard(doc, y, 20, pal, logo, pg);
  y += 4;

  setF(doc, pal.tint);  doc.rect(ML, y, CW, 14, "F");
  setF(doc, pal.accentLine); doc.rect(ML, y, 4, 14, "F");
  setD(doc, pal.border); setLW(doc, 0.4);
  doc.rect(ML, y, CW, 14, "S");

  doc.setFont("helvetica", "bold");   doc.setFontSize(7.5);
  setT(doc, pal.sectionBg);
  doc.text("END OF DOCUMENT", ML + 8, y + 6);

  doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.tiny);
  setT(doc, INK_MID);
  doc.text(
    "This is a computer-generated document valid without a handwritten signature.",
    ML + 8, y + 11
  );

  // ── Footer on every page ──────────────────────────────────────────────────
  const total = pg.n;
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, pal, p, total);
  }

  doc.save(filename);
}