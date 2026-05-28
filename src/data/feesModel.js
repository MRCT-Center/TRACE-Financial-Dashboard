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

// Default editable column headers. "Pro funder (any) $" is slightly asymmetric
// vs. the other three Pro headers; preserved verbatim from Willyanne's email.
// "#" added to "Pro (any)" and "$" added to "Pro Govt." where her literal text
// dropped them (silent fixes, flagged in the Tier 10 .docx).
export const FEES_DEFAULT_COLUMN_LABELS = {
  proAny:         { dollar: "Pro funder (any) $", count: "Pro (any) #" },
  proIndustry:    { dollar: "Pro Industry $",     count: "Pro Industry #" },
  proInstitution: { dollar: "Pro Institution $",  count: "Pro Institution #" },
  proGovt:        { dollar: "Pro Govt. $",        count: "Pro Govt. #" },
  studAny:        { dollar: "Stud. (any) $",      count: "Stud. (any) #" },
  studIntl:       { dollar: "Stud. Intl. $",      count: "Stud. Intl. #" },
  studPhD:        { dollar: "Stud. PhD $",        count: "Stud. PhD #" },
  studMA:         { dollar: "Stud. MA $",         count: "Stud. MA #" },
  studBA:         { dollar: "Stud. BA $",         count: "Stud. BA #" },
};

// 15 review-type rows per Willyanne's item #1. Non-human subjects/Exempt
// placed below all four Initial sub-rows and above Continuing review — her
// literal placement constraint ("above Continuing review and below Initial
// (min risk) Reg.") allows either position relative to the Accel. variants;
// chosen position is flagged in the Tier 10 .docx for her review.
export const FEES_DEFAULT_ROW_TYPES = [
  "Initial (any) Reg.",
  "Initial (any) Accel.",
  "Initial (>min risk) Reg.",
  "Initial (>min risk) Accel.",
  "Initial (min risk) Reg.",
  "Initial (min risk) Accel.",
  "Non-human subjects/Exempt",
  "Continuing review",
  "Amendment (any) Reg.",
  "Amendment (any) Accel.",
  "Amendment (minor) Reg.",
  "Amendment (minor) Accel.",
  "Amendment (major) Reg.",
  "Amendment (major) Accel.",
  "Other",
];

function blankCells() {
  return Object.fromEntries(
    FEES_COLUMN_KEYS.map((k) => [k, { amount: null, count: null }]),
  );
}

export const FEES_DEFAULT_ROWS = FEES_DEFAULT_ROW_TYPES.map((type) => ({
  type,
  cells: blankCells(),
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
