// Source: TRACE Financial Workbook 2026-04-17, "Revenue_irregular" sheet.
// Four categories from column C (Grant, Contract, Other 1-time payment,
// Deferred reserves). Each category seeds with 2 blank starter rows. Country
// teams edit the item label, ⓘ description, funder, USD amount, start/end
// dates, and Payment status (dropdown) per row, add rows via "+ Add item,"
// or delete rows with the red ×.
//
// Per Willyanne 2026-05-26 #20: this is the Irregular sub-tab on Step 4
// Revenue. Row shape mirrors Regular Revenue from Other Sources PLUS a
// `paymentStatus` field — the workbook column L on Revenue_irregular has a
// 6-option dropdown that distinguishes "how much has been paid" (prepaid /
// partially paid / paid / unpaid) by "whether the work is ongoing or
// completed."

export const REVENUE_IRREGULAR_CATEGORIES = [
  "Grant",
  "Contract",
  "Other 1-time payment",
  "Deferred reserves",
];

// 6 verbatim options from workbook "Drop down options" sheet, column R.
export const PAYMENT_STATUS_OPTIONS = [
  "pre-paid (work ongoing)",
  "partially paid (work ongoing)",
  "partially paid (work completed)",
  "paid (work ongoing)",
  "paid (work completed)",
  "unpaid",
];

// 8 blank starter rows — 2 per category. Workbook seeds Deferred reserves
// with only 1; we standardize to 2 everywhere so the structure reads
// consistently across categories.
const blankRow = (category) => ({
  category,
  item: "",
  description: "",
  funder: "",
  amount: null,
  startDate: "",
  endDate: "",
  paymentStatus: "",
});

// Per Willyanne 2026-05-29 (in-person): seed the first Grant row from the
// 2026_05_27 workbook "Revenue_irregular" tab, row 4 — funder = E4, amount =
// I4 ($300,000), payment status = L4. Purpose/activities (D4) is blank in the
// workbook, so item/description stay blank. All other rows remain blank for
// country teams to fill. All 5 countries inherit this via cloneRevIrrDefaults().
const grantSeedRow = {
  category: "Grant",
  item: "",
  description: "",
  funder: "Gates Foundation: Trial Regulation and Clinical Ethics Optimization.",
  amount: 300000,
  startDate: "",
  endDate: "",
  paymentStatus: "partially paid (work ongoing)",
};

export const REVENUE_IRREGULAR_DEFAULTS = REVENUE_IRREGULAR_CATEGORIES.flatMap(
  (cat) => (cat === "Grant" ? [grantSeedRow, blankRow(cat)] : [blankRow(cat), blankRow(cat)]),
);

export function isLegacyRevIrrRow(row) {
  return row && typeof row === "object" && row.category === undefined;
}
