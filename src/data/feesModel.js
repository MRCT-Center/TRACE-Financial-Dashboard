// ─────────────────────────────────────────────────────────────────────────────
// Tier 10 (Willyanne 2026-05-28, plane-to-London email): Regular Revenue from
// Fees data model. Replaces the prior 7-row × 4-col fees structure (legacy
// `{ type, ind, ngo, ctPro, ctStu, rev }`) with 15 review-type rows and 9
// funder/student-type $/# column pairs. Column headers are editable; row
// labels are editable; rows can be added and removed.
//
// New row shape: { type, cells: { proAny: {amount, count}, ... × 9 } }.
// Legacy fields (`ctPro`, `ctStu`, `ind`, `ngo`, `rev`) are derived from the
// new cells on submit so GapView.jsx and Revenue.jsx keep working without
// per-file rewrites.
// ─────────────────────────────────────────────────────────────────────────────

export const FEES_COLUMN_KEYS = [
  "proAny", "proIndustry", "proInstitution", "proGovt",
  "studAny", "studIntl", "studPhD", "studMA", "studBA",
];

export const PRO_KEYS  = ["proAny", "proIndustry", "proInstitution", "proGovt"];
export const STUD_KEYS = ["studAny", "studIntl", "studPhD", "studMA", "studBA"];

// Default editable column headers. Tier 11 (Willyanne 2026-05-28B item #11):
// first dollar header renamed "Pro funder (any) $" → "Pro (any) $" (resolves
// the Tier 10 T10-B flag — she confirmed the shorter, symmetric form).
// "#" added to "Pro (any)" and "$" added to "Pro Govt." where her Tier 10
// literal text dropped them (silent fixes).
export const FEES_DEFAULT_COLUMN_LABELS = {
  proAny:         { dollar: "Pro (any) $",        count: "Pro (any) #" },
  proIndustry:    { dollar: "Pro Industry $",     count: "Pro Industry #" },
  proInstitution: { dollar: "Pro Institution $",  count: "Pro Institution #" },
  proGovt:        { dollar: "Pro Govt. $",        count: "Pro Govt. #" },
  studAny:        { dollar: "Stud. (any) $",      count: "Stud. (any) #" },
  studIntl:       { dollar: "Stud. Intl. $",      count: "Stud. Intl. #" },
  studPhD:        { dollar: "Stud. PhD $",        count: "Stud. PhD #" },
  studMA:         { dollar: "Stud. MA $",         count: "Stud. MA #" },
  studBA:         { dollar: "Stud. BA $",         count: "Stud. BA #" },
};

// 15 review-type rows. Non-human subjects/Exempt placed below all four Initial
// sub-rows and above Continuing review. Tier 11 (Willyanne 2026-05-28B item
// #12): the word "review" added after "Initial" in each of the six Initial
// row labels ("Initial" → "Initial review").
export const FEES_DEFAULT_ROW_TYPES = [
  "Initial review (any) Reg.",
  "Initial review (any) Accel.",
  "Initial review (>min risk) Reg.",
  "Initial review (>min risk) Accel.",
  "Initial review (min risk) Reg.",
  "Initial review (min risk) Accel.",
  "Non-human subjects/Exempt",
  "Continuing Rev.",
  "Continuing Rev. Accel.",
  "Amendment (any) Reg.",
  "Amendment (any) Accel.",
  "Amendment (minor) Reg.",
  "Amendment (minor) Accel.",
  "Amendment (major) Reg.",
  "Amendment (major) Accel.",
  "Extension Reg.",
  "Extension Accel.",
  "Penalty (e.g., late submission, protocol deviations)",
  "Appeal or resubmission",
  "Other",
];

function blankCells() {
  return Object.fromEntries(
    FEES_COLUMN_KEYS.map((k) => [k, { amount: null, count: null }]),
  );
}

// Tier 11 (Willyanne 2026-05-28B item #13): seed the fee schedule from the
// 2026_05_27 financial workbook, "Rev_regular(fees)model form" tab.
// $ = column J (Fee in USD); # = column Q (# of reviews by fee type).
// Mapping: workbook C (type) + D (timeframe) → dashboard row;
// E (investigator) + F (funder) → column.
//   "Initial review (more than minimal risk study)" → "(>min risk)"
//   "Initial review (minimal risk study)"           → "(min risk)"
//   D "Regular" / "Accelerated"                      → "Reg." / "Accel."
//   E "Professional" + F "Industry"                  → proIndustry
//   E "Professional" + F "Institution/NGO/Phil./Gov" → proInstitution
//   E "Student (Intl/PhD/MA/BA)" (F "Any funder")     → studIntl/studPhD/studMA/studBA
// The workbook has no Professional+govt rows (proGovt stays blank), no
// "Stud. (any)" rows, no "any"-risk / "any"-amendment rows (those rows stay
// blank), and no Student Accelerated rows (Accel. rows carry Professional
// values only). Tier 12 (Willyanne 2026-05-29, in-person) closes the last
// gaps from the Tier 11 reconciliation:
//   - Accelerated Continuing review (workbook rows 18-19, Industry $200×40 +
//     Institution $200×40 = $16,000) → new row "Continuing Rev. Accel.",
//     directly below the renamed regular row ("Continuing review" →
//     "Continuing Rev.").
//   - Extension / Penalty / Appeal (workbook rows 52-55 = $17,000) → four new
//     rows. These are Professional + "Any funder", so they populate the
//     previously-empty "Pro (any)" (proAny) column.
// With these, the 19-row dashboard total = $331,375, matching workbook P3
// exactly — every workbook row is now represented. All 5 countries seed from
// this same data via countries.js cloneFeesDefaults().  [amount, count]
const FEES_SEED = {
  "Initial review (>min risk) Reg.":   { proIndustry: [1500, 10], proInstitution: [750, 30], studIntl: [500, 5],  studPhD: [100, 3],   studMA: [25, 1],  studBA: [10, 0] },
  "Initial review (>min risk) Accel.": { proIndustry: [3000, 20], proInstitution: [1500, 10] },
  "Initial review (min risk) Reg.":    { proIndustry: [750, 30],  proInstitution: [300, 50], studIntl: [500, 60], studPhD: [100, 100], studMA: [25, 50], studBA: [10, 10] },
  "Initial review (min risk) Accel.":  { proIndustry: [1500, 50], proInstitution: [600, 20] },
  "Non-human subjects/Exempt":         { proIndustry: [200, 0],   proInstitution: [100, 2],  studIntl: [0, 5],    studPhD: [0, 2],     studMA: [0, 0],   studBA: [0, 0] },
  "Continuing Rev.":                   { proIndustry: [100, 40],  proInstitution: [100, 40], studIntl: [0, 50],   studPhD: [0, 80],    studMA: [0, 20],  studBA: [0, 5] },
  "Continuing Rev. Accel.":            { proIndustry: [200, 40],  proInstitution: [200, 40] },
  "Amendment (minor) Reg.":            { proIndustry: [100, 10],  proInstitution: [50, 10],  studIntl: [0, 2],    studPhD: [0, 2],     studMA: [0, 0],   studBA: [0, 0] },
  "Amendment (minor) Accel.":          { proIndustry: [200, 10],  proInstitution: [100, 10] },
  "Amendment (major) Reg.":            { proIndustry: [200, 5],   proInstitution: [100, 5],  studIntl: [0, 1],    studPhD: [0, 1],     studMA: [0, 0],   studBA: [0, 0] },
  "Amendment (major) Accel.":          { proIndustry: [400, 5],   proInstitution: [200, 5] },
  "Extension Reg.":                    { proAny: [100, 10] },
  "Extension Accel.":                  { proAny: [200, 20] },
  "Penalty (e.g., late submission, protocol deviations)": { proAny: [200, 50] },
  "Appeal or resubmission":            { proAny: [400, 5] },
};

function seededCells(type) {
  const seed = FEES_SEED[type] || {};
  return Object.fromEntries(
    FEES_COLUMN_KEYS.map((k) => {
      const v = seed[k];
      return [k, v ? { amount: v[0], count: v[1] } : { amount: null, count: null }];
    }),
  );
}

export const FEES_DEFAULT_ROWS = FEES_DEFAULT_ROW_TYPES.map((type) => ({
  type,
  cells: seededCells(type),
}));

export function makeBlankFeeRow(type = "") {
  return { type, cells: blankCells() };
}

export function rowRevenue(row) {
  return FEES_COLUMN_KEYS.reduce((s, k) => {
    const cell = row?.cells?.[k] || {};
    const amt = Number(cell.amount) || 0;
    const cnt = Number(cell.count) || 0;
    return s + amt * cnt;
  }, 0);
}

export function totalFeesRevenue(rows) {
  return (rows || []).reduce((s, r) => s + rowRevenue(r), 0);
}

// Backwards-compat field derivation for submit payload. GapView.jsx reads
// `f.ctPro + f.ctStu` for total reviews; Revenue.jsx reads `f.ind`, `f.ngo`,
// `f.ctPro`, `f.ctStu`, `f.rev` for the legacy fee schedule + bar chart.
// `ind` / `ngo` are weighted averages so the legacy display columns continue
// to render a sensible per-row fee value.
export function deriveLegacyFeeFields(row) {
  const cells = row?.cells || {};
  const sumCount = (keys) => keys.reduce((s, k) => s + (Number(cells[k]?.count) || 0), 0);
  const sumRev   = (keys) => keys.reduce((s, k) => {
    const c = cells[k] || {};
    return s + (Number(c.amount) || 0) * (Number(c.count) || 0);
  }, 0);
  const proCount = sumCount(PRO_KEYS);
  const stuCount = sumCount(STUD_KEYS);
  const proRev   = sumRev(PRO_KEYS);
  const stuRev   = sumRev(STUD_KEYS);
  return {
    ctPro: proCount,
    ctStu: stuCount,
    ind:   proCount > 0 ? Math.round(proRev / proCount) : 0,
    ngo:   stuCount > 0 ? Math.round(stuRev / stuCount) : 0,
    rev:   proRev + stuRev,
  };
}

// True when this is a legacy-shape row (pre-Tier 10) lacking the `cells`
// object. App.jsx merge guard substitutes fresh defaults when ANY row in a
// country's fees array is legacy.
export function isLegacyFeeRow(row) {
  return !row || typeof row !== "object" || row.cells === undefined;
}

export function isLegacyFeesArray(rows) {
  return !Array.isArray(rows) || rows.length === 0 || rows.some(isLegacyFeeRow);
}

// True when every cell in every row has no amount and no count entered.
// Tier 11: used by the App.jsx merge guard so the workbook-seeded fee data
// surfaces for any country whose saved fees are new-shape but still untouched
// (e.g. a Tier 10 submit that left the table blank). Never clobbers real entry.
export function isAllBlankFees(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  return rows.every((r) =>
    FEES_COLUMN_KEYS.every((k) => {
      const c = r?.cells?.[k] || {};
      const blank = (v) => v === null || v === undefined || v === "";
      return blank(c.amount) && blank(c.count);
    }),
  );
}
