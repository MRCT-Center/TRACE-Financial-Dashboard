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

export const REVENUE_IRREGULAR_DEFAULTS = REVENUE_IRREGULAR_CATEGORIES.flatMap(
  (cat) => [blankRow(cat), blankRow(cat)],
);

export function isLegacyRevIrrRow(row) {
  return row && typeof row === "object" && row.category === undefined;
}
