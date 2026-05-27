// Source: TRACE Financial Workbook 2026-05-27, "<In_kind contrib_irregular>" sheet.
// Categories + items + descriptions are verbatim from the workbook
// (columns B, C, D, L). The unit (col B) is baked into the category label
// using the same pattern as expensesIrregular.js.
//
// Per Willyanne 2026-05-27 PM:
//   - 3 unit-prefixed categories (mirroring Expenses Irregular structure).
//   - Section 1 (Durable goods): 2 empty placeholder rows for country teams.
//   - Section 2 (Secretariat one-time): 1 empty + 7 named items (seeded from
//     workbook col D R13-R19) — Digitalization, Capacity building, etc.
//   - Section 3 (Ethics Committee one-time): 2 empty placeholder rows.
//   - ⓘ description content sources from col L (EXAMPLE item description /
//     budget narrative).
//   - Funding source dropdown uses the same 3 options as Regular (Federal /
//     Institutional / Other source) — see inKindRegular.js IN_KIND_FUNDING_SOURCE_OPTIONS.

export const IN_KIND_IRREGULAR_CATEGORIES = [
  "Secretariat/mgmt. Capital costs (durable goods)",
  "Secretariat/mgmt. Capital costs (one-time/irregular activities)",
  "Ethics Committee capital costs (one-time/irregular activities)",
];

export const IN_KIND_IRREGULAR_DEFAULTS = [
  // R10 — Durable goods, empty placeholder, vehicle example
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[0],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., Vehicle purchase. Note: this is only if a vehicle has been purchased by a federal/institutional entity and given permanently to the Secretariat to use.",
  },
  // R11 — Durable goods, empty placeholder, building/equipment example
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[0],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., Building renovation/equipment (such as a furnace). Note: this is only if a renovation/equipment has been purchased by a federal/institutional entity and given permanently to the Secretariat to use.",
  },
  // R12 — Secretariat one-time, empty placeholder, conference example
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time conference/meeting investment, or partial cost of the one-time conference/meeting paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R13 — Digitalization
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Digitalization: Develop and implement a nationally hosted digital ethics platform to improve submission, tracking, and integration with regulatory systems.",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time IT upgrade investment, or partial cost of the one-time IT upgrade paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R14 — Capacity building & accreditation
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Capacity building & accreditation:",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time training development investment, or partial cost of the one-time training development paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R15 — Harmonization
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Harmonization: Reduce review timelines and streamline ethics review processes to eliminate regulatory bottlenecks and harmonize CTA approvals",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time update/harmonization of guidance and policies (e.g., SOPs), or partial cost of the update on guidance paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R16 — Financial sustainability
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Financial sustainability: To enhance financial sustainability for clinical trial ethics review processes by developing a tiered fee structure that balances affordability for researchers with the operational needs of ethics committees.",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time update for budgeting and planning (e.g., assessment/revision of fee structure, revenue flows), or partial cost of the one-time update for budgeting and planning paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R17 — Communication
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Communication: Enhance communication, visibility, and transparency through revamping the RNEC website and providing applicant support tools.",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time investment/contract for communications strengthening (e.g., develop/revise communication strategy, develop newsletter, development of an initial website), or partial cost of the one-time investment/contract for communications strengthening paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R18 — Admin personnel
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Admin personnel or other indirect cost:",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time overhead support for admin, HR, finance, office operations, or partial cost of the one-time overhead support paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // R19 — Technical Personnel
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[1],
    item: "Technical Personnel: Project personnel to support the M&E",
    funder: "", amount: null, startDate: "", endDate: "",
    description: "e.g., One-time project technical staffing based on LoE for implementation, or partial cost of the one-time project technical staffing paid for in-kind. Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  // Ethics Committee — 2 empty placeholder rows per Willyanne 2026-05-27 PM
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[2],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    description: "One-time irregular activity conducted by the NEC (that was not conducted by the Secretariat on behalf of the NEC, such as developing a training or overhauling SOPs). Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
  {
    category: IN_KIND_IRREGULAR_CATEGORIES[2],
    item: "", funder: "", amount: null, startDate: "", endDate: "",
    description: "One-time activity conducted by the NEC (that was not conducted by the Secretariat on behalf of the NEC, such as developing a training or overhauling SOPs). Please note, in-kind does NOT include federal subsidies or grants. In-kind is for something \"off-book\" like one-time federal/institutional/volunteer staff support, office space, or equipment (such as portable AV equipment) that is being used for the one-time event but is not charged.",
  },
];
