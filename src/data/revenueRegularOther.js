// Source: TRACE Financial Workbook 2026-04-17, "Revenue_regular (other)" sheet.
// Six categories from column C (Subsidy federal/institutional/other; Income
// rental/investment/other). Each category seeds with 2 blank starter rows
// (matching the workbook's pre-populated structure). Country teams edit the
// item label, ⓘ description, funder, USD amount, and start/end dates per row,
// add rows via "+ Add item," or delete rows with the red ×.
//
// Per Willyanne 2026-05-26 #18/#19: this lives in Step 4 Revenue → Regular
// sub-tab, below the (currently untouched) "Regular Revenue from Fees"
// section. Row shape merges Regular Expenses' editable label/description
// pattern with Irregular Expenses' funder/dates pattern.

export const REVENUE_REGULAR_OTHER_CATEGORIES = [
  "Subsidy (federal)",
  "Subsidy (institutional)",
  "Subsidy (other source)",
  "Income (rental)",
  "Income (investment)",
  "Income other (e.g., lab income, operational income)",
];

// 12 blank starter rows — 2 per category, matching workbook rows C4–C15.
// All fields editable; no workbook-seeded amounts/funders (the workbook leaves
// these blank too — country teams populate based on their own data).
const blankRow = (category) => ({
  category,
  item: "",
  description: "",
  funder: "",
  amount: null,
  startDate: "",
  endDate: "",
});

export const REVENUE_REGULAR_OTHER_DEFAULTS = REVENUE_REGULAR_OTHER_CATEGORIES.flatMap(
  (cat) => [blankRow(cat), blankRow(cat)],
);

// Detects whether a saved row is missing the new shape (no `category` key).
// Used by App.jsx's merge guard to substitute workbook defaults for pre-2026-05-26 rows.
export function isLegacyRevRegOtherRow(row) {
  return row && typeof row === "object" && row.category === undefined;
}
