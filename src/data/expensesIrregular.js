// Source: TRACE Financial Workbook 2026-04-17, "Expenses_irregular" sheet.
// Rows D4–D15 reproduced verbatim (12 rows total, in workbook order). The
// item, amount, funder, and example-description fields are pre-populated from
// the workbook where present; blank cells in the workbook stay blank but
// remain fully editable in the dashboard. Country teams can also add new
// items beyond these 12 via the "+ Add item" button under each category.
//
// Per Willyanne 2026-05-22 call: items are editable (unlike Regular's locked
// items), all three workbook extras (funder, start date, end date) appear as
// per-row input fields, and rows showing truncated text get a "See more" link
// to expand the cell to a multi-line editor in place.

export const IRREGULAR_CATEGORIES = [
  "Capital costs (durable goods)",
  "Capital costs (one-time/irregular activities)",
];

// 12 rows mirroring workbook D4–D15. `amount` is null where workbook col I is
// blank, a number where it's populated. `descriptionExample` (workbook col L)
// is populated for ALL 12 rows — including the blank-item ones — because the
// workbook provides example guidance for every row, not just the pre-filled
// ones (per Willyanne 2026-05-22).
export const EXPENSES_IRREGULAR_DEFAULTS = [
  // D4 — Capital costs (durable goods), blank item, vehicle example
  {
    category: IRREGULAR_CATEGORIES[0],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    descriptionExample: "e.g., Vehicle purchase.",
  },
  // D5 — Capital costs (durable goods), blank item, building/equipment example
  {
    category: IRREGULAR_CATEGORIES[0],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    descriptionExample: "e.g., Building renovation/equipment (such as a furnace).",
  },
  // D6 — Capital costs (one-time/irregular activities), blank, legal settlement example
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    descriptionExample: "e.g., legal settlement or other large payout.",
  },
  // D7 — Capital costs (one-time/irregular activities), blank, one-time conference example
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    descriptionExample: "One-time conference/meeting investment.",
  },
  // D8 — Digitalization
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Digitalization: Develop and implement a nationally hosted digital ethics platform to improve submission, tracking, and integration with regulatory systems.",
    funder: "Gates Foundation",
    amount: 100000,
    startDate: "",
    endDate: "",
    descriptionExample: "One-time IT upgrade investment.",
  },
  // D9 — Capacity building & accreditation
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Capacity building & accreditation:",
    funder: "Gates Foundation",
    amount: 50000,
    startDate: "",
    endDate: "",
    descriptionExample: "One time training development investment.",
  },
  // D10 — Harmonization
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Harmonization: Reduce review timelines and streamline ethics review processes to eliminate regulatory bottlenecks and harmonize CTA approvals",
    funder: "Gates Foundation",
    amount: 75000,
    startDate: "",
    endDate: "",
    descriptionExample: "One-time update/harmonization of guidance and policies (e.g., SOPs).",
  },
  // D11 — Financial sustainability
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Financial sustainability: To enhance financial sustainability for clinical trial ethics review processes by developing a tiered fee structure that balances affordability for researchers with the operational needs of ethics committees.",
    funder: "Gates Foundation",
    amount: 10000,
    startDate: "",
    endDate: "",
    descriptionExample: "One time update for budgeting and planning (e.g., assessment/revision of fee structure, revenue flows).",
  },
  // D12 — Communication
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Communication: Enhance communication, visibility, and transparency through revamping the RNEC website and providing applicant support tools.",
    funder: "Gates Foundation",
    amount: 15000,
    startDate: "",
    endDate: "",
    descriptionExample: "One time investment/contract for communications strengthening (e.g., develop/revise communication strategy, develop newsletter, development of an initial website).",
  },
  // D13 — Admin personnel
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Admin personnel or other indirect cost:",
    funder: "Gates Foundation",
    amount: 15000,
    startDate: "",
    endDate: "",
    descriptionExample: "Overhead support for admin, HR, finance, office operations.",
  },
  // D14 — Technical Personnel
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "Technical Personnel: Project personnel to support the M&E",
    funder: "Gates Foundation",
    amount: 35000,
    startDate: "",
    endDate: "",
    descriptionExample: "Project staffing based on LoE for implementation.",
  },
  // D15 — blank item, "Other one-time activity" example
  {
    category: IRREGULAR_CATEGORIES[1],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    descriptionExample: "Other one-time activity",
  },
];

// Detects whether a row is the new shape (has `category`) or the legacy shape
// (`{ name, funder, amount }`). Used by App.jsx's Supabase-merge guard to know
// whether to substitute workbook defaults.
export function isLegacyIrregularRow(row) {
  return row && typeof row === "object" && row.category === undefined;
}
