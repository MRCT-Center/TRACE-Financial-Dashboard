// Source: TRACE Financial Workbook 2026-05-27, "<In_kind contrib_regular>" sheet.
// Categories + items + descriptions are verbatim from the workbook
// (columns B, C, D, J). The unit (col B) is baked into the category label
// using the same pattern as expensesIrregular.js / expensesRegular.js.
//
// Per Willyanne 2026-05-27 PM:
//   - T8-A: keep BOTH "Salaries" rows under Personnel salaries (regular
//     personnel) for Secretariat/mgmt. — duplicate in workbook is intentional.
//   - T8-B: ⓘ description content sources from col J (Item description /
//     budget narrative), NOT col L (Notes/Comments).
//   - Funding source dropdown uses 3 options sourced from `Drop down options`
//     col O: Federal / Institutional / Other source.
//
// Per Willyanne 2026-05-27 evening: amount column is pre-populated from
// workbook col I. Federal subtotal $58,250, institutional $21,000,
// other $14,500 — grand total $93,750 (matches workbook R7).

export const IN_KIND_FUNDING_SOURCE_OPTIONS = [
  "In-kind contribution (federal)",
  "In-kind contribution (institutional)",
  "In-kind contribution (other source)",
];

export const IN_KIND_REGULAR_CATEGORIES = [
  "Secretariat/mgmt. Personnel salaries (regular personnel)",
  "Secretariat/mgmt. Personnel benefits — insurance (regular personnel)",
  "Secretariat/mgmt. Personnel benefits — pension (regular personnel)",
  "Secretariat/mgmt. Recurrent costs (general)",
  "Secretariat/mgmt. Recurrent costs (govt fees & compliance)",
  "Secretariat/mgmt. Capital costs (durable goods)",
  "Ethics Committee personnel salaries (IRB reviewers)",
  "Ethics Committee personnel benefits (IRB reviewers)",
  "Ethics Committee recurrent costs (general)",
];

// One row per workbook line. `amount` pre-populated from workbook col I;
// `funder` is "" (country team picks from dropdown). The two "Salaries" rows
// for Personnel salaries are both included per T8-A.
export const IN_KIND_REGULAR_DEFAULTS = [
  // R10 — Secretariat Personnel salaries → Salaries
  {
    category: IN_KIND_REGULAR_CATEGORIES[0],
    item: "Salaries",
    funder: "", amount: 30000,
    description: "Wages for research, administrative, communication, and technical staff.",
  },
  // R13 — Secretariat Personnel salaries → Salaries (duplicate kept per T8-A)
  {
    category: IN_KIND_REGULAR_CATEGORIES[0],
    item: "Salaries",
    funder: "", amount: 12000,
    description: "Wages for research, administrative, communication, and technical staff.",
  },
  // R11 — Personnel benefits insurance → Health Insurance
  {
    category: IN_KIND_REGULAR_CATEGORIES[1],
    item: "Health Insurance",
    funder: "", amount: 5000,
    description: "Employer health insurance contributions.",
  },
  // R12 — Personnel benefits pension → Pensions
  {
    category: IN_KIND_REGULAR_CATEGORIES[2],
    item: "Pensions",
    funder: "", amount: 5000,
    description: "Employer pension contributions to retirement plans.",
  },
  // R14-R27 — Recurrent costs (general) — 14 items
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Rent",
    funder: "", amount: 10000,
    description: "Office rent.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Cleaning service/materials",
    funder: "", amount: 2500,
    description: "Cleaning service and cleaning supplies.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Security services",
    funder: "", amount: 2500,
    description: "Security and alarm monitoring for premises and equipment.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Vehicle fuel and maintenance",
    funder: "", amount: 2500,
    description: "Vehicle fuel and maintenance.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Vehicle \"rental\"",
    funder: "", amount: 0,
    description: "Vehicle \"rental.\" This is for annual rental of a vehicle by the Secretariat, if the vehicle is rented. (Note that vehicle purchase is on the irregular budget.) If the vehicle is a government, institutional, or personal vehicle used for Secretariat purposes on an annual basis, but the Secretariat does not pay for use of that vehicle, list it on the in-kind contributions worksheet.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Office expenses",
    funder: "", amount: 1000,
    description: "Electricity, water, software subscriptions (Microsoft Office, Adobe, Zoom), stationery, small office supplies.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Internet service",
    funder: "", amount: 0,
    description: "Reliable internet for communication, data management, and virtual meetings.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Website domain and hosting service",
    funder: "", amount: 0,
    description: "Annual fee to a service (e.g., Wix, Ionos) to host the unit's website and maintain the domain name.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Regular website edits (if not done by regular personnel)",
    funder: "", amount: 0,
    description: "Regular/recurrent website edits/maintenance (if done by consultants/outside organizations). Don't list here if done by regular personnel whose time would be paid as part of the \"salaries,\" \"benefits,\" and \"pensions\" items. Please note, this is for regular/recurrent website edits/maintenance, such as editing an existing webpage or posting new content to a \"news and events\" section of the website, and not for irregular/one-time actions like developing a comprehensive new website structure, creating a new digital platform (e.g., a registration portal), or integrating significant new functionality (e.g., contracting with a specialized organization to integrate significant disability/accessibility features into the website).",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Regular communication/marketing (if not done by regular personnel)",
    funder: "", amount: 0,
    description: "Regular/recurrent communication services and marketing products (if done by consultants/outside organizations). Don't list here if done by regular personnel whose time would be paid as part of the \"salaries,\" \"benefits,\" and \"pensions\" items. Please note, this is for regular/recurrent communication and marketing, such as developing social media messages and newsletter content, and not for irregular/one-time communications or marketing items such as hiring a consultant to develop a new communications plan, to develop a comprehensive set of graphics for a website or training, or to develop a logo/branding.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Annual conference hosting",
    funder: "", amount: 2000,
    description: "Organisation's annual dissemination and stakeholder engagement event, or conference to bring employees together to review/plan/train.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Other conference/meeting travel",
    funder: "", amount: 1500,
    description: "Travel costs for regular personnel to attend conferences or meetings. Note, travel for site visits is not included here (please list under \"site visits and monitoring\").",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Refund payments",
    funder: "", amount: 0,
    description: "Refund payments to PIs and study teams, in the case that those teams double-paid for a review or submitted a payment for a review in a higher fee category than was appropriate.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[3],
    item: "Contingency / reserve fund",
    funder: "", amount: 0,
    description: "Contribution to reserve fund, which acts as a buffer for unforeseen operational expenses.",
  },
  // R28-R30 — Recurrent costs (govt fees & compliance) — 3 items
  {
    category: IN_KIND_REGULAR_CATEGORIES[4],
    item: "Government fees (e.g., National Insurance Scheme, Social Security)",
    funder: "", amount: 0,
    description: "Government fees such as National Insurance Scheme or Social Security.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[4],
    item: "Regular ethics training",
    funder: "", amount: 0,
    description: "Fees for staff to attend training programs on research ethics, data protection, and regulatory compliance; AND/OR regular development/editing of ethics training programs (if by a consultant and not regular personnel) — note this is only for regular development/review/maintenance of training materials and not a 1-time development of a new training or significant revision of existing training. Time for regular staff spent training should be part of the salary.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[4],
    item: "Site visits and site monitoring",
    funder: "", amount: 0,
    description: "Field supervision and monitoring of research sites to ensure quality control.",
  },
  // R31-R32 — Capital costs (durable goods) — 2 items
  {
    category: IN_KIND_REGULAR_CATEGORIES[5],
    item: "Computers",
    funder: "", amount: 0,
    description: "Computers, tablets, printers, scanners, etc.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[5],
    item: "Furniture",
    funder: "", amount: 750,
    description: "Desks, chairs, tables, lighting, filing cabinets, etc.",
  },
  // R38-R39 — Ethics Committee personnel salaries (IRB reviewers) — 2 items
  {
    category: IN_KIND_REGULAR_CATEGORIES[6],
    item: "[salary] Payments to reviewers (review time)",
    funder: "", amount: 15000,
    description: "Payment to reviewers for their time to assess research quality and ethics.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[6],
    item: "[salary] Payments to reviewers (training time)",
    funder: "", amount: 2500,
    description: "Payment to reviewers for their time spent in training to be able to assess research quality and ethics.",
  },
  // R40-R41 — Ethics Committee personnel benefits — 2 items
  {
    category: IN_KIND_REGULAR_CATEGORIES[7],
    item: "Supplement payment for travel time",
    funder: "", amount: 0,
    description: "Stipend/allowance for reviewer travel time, if the review meetings or trainings are in-person.",
  },
  {
    category: IN_KIND_REGULAR_CATEGORIES[7],
    item: "Supplement payment for travel costs (e.g., tickets, lodging)",
    funder: "", amount: 0,
    description: "Stipend/allowances for reviewer travel costs (e.g., flight, hotel), if the review meetings or trainings are in-person.",
  },
  // R42 — Ethics Committee recurrent costs (general) — 1 item
  {
    category: IN_KIND_REGULAR_CATEGORIES[8],
    item: "Review meeting hosting (e.g., venue, catering)",
    funder: "", amount: 1500,
    description: "Review board meeting or training meeting hosting costs such as venue rental, food, stationery, etc.",
  },
];
