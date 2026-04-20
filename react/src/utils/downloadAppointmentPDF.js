/**
 * src/utils/downloadAppointmentPDF.js
 *
 * Receipt-style PDF — Adoption or Rehoming.
 * Layout: logo top-left · org info top-right · bordered table sections
 * No payment. No signature.
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
const MT  = 14; // margin top content

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
const SECTION_GAP  = 6;   // gap between sections
const ROW_PAD_X    = 4;   // horizontal padding inside cells
const ROW_PAD_Y    = 3.5; // top padding for label inside a cell
const ROW_LINE_H   = 4.2; // line-height for value text
const ROW_MIN_H    = 12;  // minimum row height

// ─── Palettes ─────────────────────────────────────────────────────────────────
// Colors sourced from the Pawster login page design
// Primary green: #1c4f09 / #2a6e10 / #588B41
// Warm amber/brown: #B45A22 / #c87820 / #a06010
// Page base: #EDDABB / #e8e0d0 / #d4c9b0
// Text darks: #1a4a08 / #276010 / #2a5010

const ADOPTION = {
  headerBg:   [28,  79,   9],   // #1c4f09 — primary dark green (login button / headings)
  sectionBg:  [28,  79,   9],   // #1c4f09
  sectionFg:  [255, 255, 255],
  accentLine: [88, 139,  65],   // #588B41 — mid green orb from mesh bg
  tint:       [237, 248, 232],  // light green tint (matches green orb softly)
  labelFg:    [90, 122,  64],   // #5a7a40 — muted green label (login page sub-text)
  valueFg:    [26,  74,   8],   // #1a4a08 — darkest green heading
  border:     [180, 215, 165],  // soft green border
  divider:    [210, 232, 200],  // lighter green divider
  title:      "Animal Adoption Receipt",
  typeTag:    "ADOPTION",
};
const REHOMING = {
  headerBg:   [164,  88,  32],  // #a45820 — darker amber (between #B45A22 and #a06010)
  sectionBg:  [180,  90,  34],  // #B45A22 — warm amber orb (mesh bg)
  sectionFg:  [255, 255, 255],
  accentLine: [200, 120,  32],  // #c87820 — forgot-password / link amber
  tint:       [253, 244, 228],  // #EDDABB lightened — page base tint
  labelFg:    [140,  95,  50],  // warm mid-brown label
  valueFg:    [80,   45,  10],  // deep warm brown value text
  border:     [220, 185, 135],  // sand/amber border
  divider:    [235, 210, 165],  // lighter amber divider
  title:      "Animal Rehoming Receipt",
  typeTag:    "REHOMING",
};

const WHITE    = [255, 255, 255];
const INK_MID  = [100,  80,  45];  // warm brown mid ink (matches login page brown tones)
const INK_LITE = [160, 130,  85];  // lighter warm brown
const RULE     = [220, 195, 155];  // #d4c9b0 — from mesh bg light orb

const STATUS_COLOR = {
  Approved: { fg: [28,  79,   9],  bg: [220, 245, 210], border: [88, 139, 65]  },  // green palette
  Rejected: { fg: [170,  18,  18], bg: [255, 218, 218], border: [210, 60, 60]  },  // kept red (universal)
  Pending:  { fg: [164,  88,  32], bg: [255, 241, 215], border: [200, 120, 32] },  // amber palette
};

// ─── Record normaliser ────────────────────────────────────────────────────────
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

function hln(doc, y, x1, x2, col, w = 0.2) {
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

// ─── Rounded rect helper (with optional per-corner radii) ────────────────────
function roundRect(doc, x, y, w, h, r, style = "F") {
  doc.roundedRect(x, y, w, h, r, r, style);
}

// ─── Page 1 header ────────────────────────────────────────────────────────────
function drawHeader(doc, pal, logo, record, status) {
  // Background
  setF(doc, WHITE); doc.rect(0, 0, PW, PH, "F");

  // Top colour bar with gradient-like layering
  setF(doc, pal.headerBg); doc.rect(0, 0, PW, 38, "F");
  // Subtle inner highlight strip
  setF(doc, pal.accentLine); doc.rect(0, 0, PW, 2, "F");

  // Decorative diagonal shape at top-right for visual interest
  doc.setGState && doc.setGState(doc.GState({ opacity: 0.12 }));
  setF(doc, WHITE);
  doc.triangle(PW - 50, 0, PW, 0, PW, 50, "F");
  doc.setGState && doc.setGState(doc.GState({ opacity: 1.0 }));

  // Logo
  if (logo) {
    try { doc.addImage(logo, "PNG", ML, 7, 20, 20); }
    catch {}
  }

  // Org info (right-aligned)
  const rightX = PW - MR;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
  setT(doc, WHITE);
  doc.text("PAWSTER", rightX, 10, { align: "right" });

  doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.tiny);
  setT(doc, [190, 220, 240]);
  doc.text("Animal Adoption & Rehoming System", rightX, 15,   { align: "right" });
  doc.text("Ilocos Region, Philippines",         rightX, 19.5,{ align: "right" });
  doc.text("pawster@email.com",                  rightX, 24,  { align: "right" });

  // Document title — centred, baseline-aligned to logo midpoint
  const titleY = logo ? 21 : 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.hero);
  setT(doc, WHITE);
  doc.text(pal.title.toUpperCase(), PW / 2, titleY, { align: "center" });

  // Type tag pill
  const tagW  = 24, tagH = 6;
  const tagX  = PW / 2 - tagW / 2;
  const tagY  = titleY + 3;
  setF(doc, pal.accentLine); setD(doc, pal.accentLine); setLW(doc, 0);
  roundRect(doc, tagX, tagY, tagW, tagH, tagH / 2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(5);
  setT(doc, WHITE);
  doc.text(pal.typeTag, PW / 2, tagY + tagH / 3 + 1.8, { align: "center" });

  // ── Meta strip (below header box) ───────────────────────────────────────
  const stripY = 40;
  const colW   = CW / 4;
  const meta = [
    { label: "DATE GENERATED", value: new Date().toLocaleDateString("en-PH", { dateStyle: "medium" }) },
    { label: "RECEIPT NO.",    value: sv(record.id) },
    { label: "DATE SUBMITTED", value: fmtDate(record.created_at) },
  ];

  // Light meta background band
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
    // Vertical divider
    if (i < meta.length - 1) {
      setD(doc, pal.border); setLW(doc, 0.2);
      doc.line(ML + colW * (i + 1), stripY + 2, ML + colW * (i + 1), stripY + 12);
    }
  });

  // Status badge — right side of meta strip, vertically centred
  const st   = STATUS_COLOR[status] || STATUS_COLOR.Pending;
  const badgeW = 30, badgeH = 8;
  const badgeX = PW - MR - badgeW - 1;
  const badgeY = stripY + (14 - badgeH) / 2;
  setF(doc, st.bg);
  setD(doc, st.border);
  setLW(doc, 0.5);
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
  // Thin accent rule above footer
  setF(doc, pal.accentLine); doc.rect(ML, fy, CW, 0.5, "F");
  // Footer background tint
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
    "Pawster Animal Adoption & Rehoming System  ·  Ilocos Region, Philippines",
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
  // Left accent bar
  setF(doc, pal.accentLine); doc.rect(ML, y, 3, H, "F");
  // Section background
  setF(doc, pal.sectionBg); doc.rect(ML + 3, y, CW - 3, H, "F");

  doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.section);
  setT(doc, pal.sectionFg);
  // Vertically center label in section header
  doc.text(title.toUpperCase(), ML + 8, y + H / 2 + 2.8);

  return y + H;
}

// ─── Table renderer ───────────────────────────────────────────────────────────
/**
 * Renders a two-column key-value table.
 * Rows with `full: true` span both columns.
 */
function renderTable(doc, startY, rows, pal) {
  const HALF = (CW - 1) / 2;

  // Pair rows into groups: [full] or [left, right]
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
  // Outer border start — drawn at end
  const borderStartY = y;

  groups.forEach((grp, gi) => {
    const isFull = grp.length === 1 && !!grp[0].full;
    const valW   = isFull ? CW - ROW_PAD_X * 2 - 1 : HALF - ROW_PAD_X * 2;

    // Compute row height based on wrapped value text
    let maxLines = 1;
    grp.forEach(cell => {
      const lines = doc.splitTextToSize(sv(cell.value), valW);
      if (lines.length > maxLines) maxLines = lines.length;
    });
    // label row (6pt) + gap + value lines + bottom padding
    const labelH = ROW_PAD_Y + 4;         // label top + label height
    const valueH = maxLines * ROW_LINE_H;
    const rowH   = Math.max(ROW_MIN_H, labelH + valueH + 4);

    // Alternating row tint
    const rowBg = gi % 2 === 0 ? WHITE : pal.tint;
    setF(doc, rowBg); doc.rect(ML, y, CW, rowH, "F");

    // Column divider for 2-col rows
    if (grp.length === 2) {
      setD(doc, pal.divider); setLW(doc, 0.18);
      doc.line(ML + HALF + 0.5, y + 1.5, ML + HALF + 0.5, y + rowH - 1.5);
    }

    grp.forEach((cell, ci) => {
      const cx = ci === 0 ? ML + ROW_PAD_X : ML + HALF + 1 + ROW_PAD_X;

      // Label
      doc.setFont("helvetica", "bold"); doc.setFontSize(FONT.label);
      setT(doc, pal.labelFg);
      doc.text(cell.label.toUpperCase(), cx, y + ROW_PAD_Y + 2.5);

      // Value — word-wrap
      doc.setFont("helvetica", "normal"); doc.setFontSize(FONT.value);
      setT(doc, pal.valueFg);
      const lines = doc.splitTextToSize(sv(cell.value), isFull ? CW - ROW_PAD_X * 2 - 1 : HALF - ROW_PAD_X * 2);
      doc.text(lines, cx, y + ROW_PAD_Y + 2.5 + 4);
    });

    // Bottom divider per row
    hln(doc, y + rowH, ML, ML + CW, pal.divider, 0.18);
    y += rowH;
  });

  // Outer border
  setD(doc, pal.border); setLW(doc, 0.45);
  doc.rect(ML, borderStartY, CW, y - borderStartY, "S");

  return y + SECTION_GAP;
}

// ─── Boolean trait grid ───────────────────────────────────────────────────────
function traitTable(doc, startY, items, pal) {
  const COLS   = 3;
  const CELL_H = 9;
  const colW   = CW / COLS;
  const rows   = Math.ceil(items.length / COLS);
  const totalH = rows * CELL_H;

  // Background
  setF(doc, WHITE); doc.rect(ML, startY, CW, totalH, "F");

  items.forEach(([label, raw], idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x   = ML + col * colW;
    const ty  = startY + row * CELL_H;

    // Alternating row tint (by row, not cell)
    if (row % 2 === 1) {
      setF(doc, pal.tint); doc.rect(x, ty, colW, CELL_H, "F");
    }

    const yes = raw === true || raw === "true" || raw === 1 || raw === "Yes";

    // Indicator dot
    const dotX = x + 5;
    const dotY = ty + CELL_H / 2;
    const dotR = 1.8;
    setF(doc, yes ? [30, 155, 50] : [210, 55, 55]);
    setD(doc, yes ? [20, 120, 38] : [170, 35, 35]);
    setLW(doc, 0.2);
    doc.circle(dotX, dotY, dotR, "FD");

    // Checkmark / cross drawn inside dot
    doc.setFont("helvetica", "bold"); doc.setFontSize(4);
    setT(doc, WHITE);
    doc.text(yes ? "✓" : "✕", dotX, dotY + 1.4, { align: "center" });

    // Label
    doc.setFont("helvetica", yes ? "bold" : "normal");
    doc.setFontSize(7.2);
    setT(doc, yes ? pal.valueFg : [140, 50, 50]);
    doc.text(label, dotX + dotR + 2.5, ty + CELL_H / 2 + 2.5);

    // Horizontal rule
    hln(doc, ty + CELL_H, x, x + colW, pal.divider, 0.15);

    // Vertical column divider
    if (col < COLS - 1) {
      setD(doc, pal.divider); setLW(doc, 0.15);
      doc.line(x + colW, ty + 1.5, x + colW, ty + CELL_H - 1.5);
    }
  });

  // Outer border
  setD(doc, pal.border); setLW(doc, 0.45);
  doc.rect(ML, startY, CW, totalH, "S");

  return startY + totalH + SECTION_GAP;
}

// ─── Page-break guard ─────────────────────────────────────────────────────────
function guard(doc, y, need, pal, logo, pg) {
  if (y + need < PH - 18) return y;
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
    { label: addrLabel,            value: full,          full: true },
    { label: "Street / House No.", value: addr.street   },
    { label: "City / Municipality",value: addr.city     },
    { label: "Province",           value: addr.province },
    { label: "Zip / Postal Code",  value: addr.zip      },
  ];
}

// ─── Divider between major sections ──────────────────────────────────────────
function sectionSpacer(doc, y, pal) {
  // Subtle dot separator
  setF(doc, pal.border); doc.rect(ML, y, CW, 0.25, "F");
  return y + SECTION_GAP;
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
      { label: "Full Name",          value: record.name },
      { label: "Primary Caregiver",  value: record.primary_caregiver },
      { label: "Phone",              value: record.phone },
      { label: "Email",              value: record.email },
      ...addressRows(record, "Home Address"),
    ], pal);

    // ── Animal Details ────────────────────────────────────────
    y = guard(doc, y, 30, pal, logo, pg);
    y = sectionHeader(doc, y, "Animal Details", pal);
    y = renderTable(doc, y, [
      { label: "Animal Applied For", value: record.animal_name },
      { label: "Date Submitted",     value: fmtDate(record.created_at) },
    ], pal);

    // ── Household & Housing ───────────────────────────────────
    y = guard(doc, y, 60, pal, logo, pg);
    y = sectionHeader(doc, y, "Household & Housing", pal);
    y = renderTable(doc, y, [
      { label: "Housing Type",       value: record.housing },
      { label: "Household Size",     value: record.household_size },
      { label: "Children's Ages",    value: record.children_ages },
      { label: "Other Pets Detail",  value: record.other_pets_detail, full: true },
    ], pal);
    y = guard(doc, y, 32, pal, logo, pg);
    y = traitTable(doc, y, [
      ["Owns Home",             record.owns_home],
      ["Has Pet Permission",    record.pet_permission],
      ["Has Children",          record.has_children],
      ["Has Other Pets",        record.has_other_pets],
      ["Other Pets Vaccinated", record.other_pets_vaccinated],
      ["Open to Guidance",      record.open_to_guidance],
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
      { label: "Had a Previous Pet",    value: record.previous_pet },
      { label: "Previous Pet Details",  value: record.previous_pet_details, full: true },
      { label: "Reason for Adoption",   value: record.reason,               full: true },
      { label: "Behaviour Response",    value: record.behavior_response,    full: true },
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
    y = renderTable(doc, y, [
      { label: "Pet Name",       value: record.pet_name },
      { label: "Species",        value: record.species },
      { label: "Breed",          value: record.breed },
      { label: "Age",            value: record.age },
      { label: "Gender",         value: record.gender },
      { label: "Duration Owned", value: record.duration_owned },
      { label: "Ideal Home",     value: record.ideal_home_desc, full: true },
    ], pal);

    // ── Health & Vaccination ──────────────────────────────────
    y = guard(doc, y, 60, pal, logo, pg);
    y = sectionHeader(doc, y, "Health & Vaccination", pal);
    y = renderTable(doc, y, [
      { label: "Vaccine Type",       value: record.vaccine_type },
      { label: "Last Vaccinated",    value: record.last_vacc_date },
      { label: "Vet / Clinic",       value: record.vacc_clinic },
      { label: "Vaccination Notes",  value: record.vacc_notes,    full: true },
      { label: "Medical Notes",      value: record.medical_notes, full: true },
    ], pal);

    // ── Care Traits ───────────────────────────────────────────
    y = guard(doc, y, 55, pal, logo, pg);
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
    y = guard(doc, y, 65, pal, logo, pg);
    y = sectionHeader(doc, y, "Behaviour & Reason for Rehoming", pal);
    y = renderTable(doc, y, [
      { label: "Behaviour",              value: record.behavior },
      { label: "Behaviour Detail",       value: record.behavior_other },
      { label: "Reason for Rehoming",    value: record.reason,             full: true },
      { label: "Additional Details",     value: record.details,            full: true },
      { label: "Alternatives Explored",  value: record.tried_alternatives, full: true },
    ], pal);
  }

  // ── Rejection note ────────────────────────────────────────────────────────
  if (sv(record.reject_note) !== "—") {
    y = guard(doc, y, 38, pal, logo, pg);
    const rejPal = {
      ...pal,
      sectionBg:  STATUS_COLOR.Rejected.fg,
      sectionFg:  WHITE,
      accentLine: STATUS_COLOR.Rejected.border,
      tint:       STATUS_COLOR.Rejected.bg,
      divider:    [240, 195, 195],
      border:     STATUS_COLOR.Rejected.border,
    };
    y = sectionHeader(doc, y, "Rejection Note", rejPal);
    y = renderTable(doc, y, [
      { label: "Rejection Reason", value: record.reject_note, full: true },
    ], rejPal);
  }

  // ── End-of-document banner ────────────────────────────────────────────────
  y = guard(doc, y, 22, pal, logo, pg);
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
    "This is a computer-generated document valid without a handwritten signature",
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