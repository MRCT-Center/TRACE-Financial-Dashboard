// Source: TRACE Financial Workbook 2026-04-17, "Expenses_regular" sheet.
// Categories + items + descriptions are verbatim from the workbook
// (columns C, D, J). Keys are camelCase derived from item labels.
//
// Per Willyanne 2026-05-26 (#11/#12): Regular Expenses now mirrors the
// Irregular Expenses paradigm — every item (label, description, amount) is
// editable, the ⓘ description can be rewritten, "+ Add item" appends new
// rows under any category, and a red × deletes rows. The static config below
// is the workbook seed only; `EXPENSES_REGULAR_ROW_DEFAULTS` flattens it
// into the row-shape the wizard actually uses.

export const EXPENSES_REGULAR = [
  {
    categoryKey: "personnelSalariesReg",
    categoryLabel: "Personnel salaries (regular personnel)",
    items: [
      { key: "salaries", label: "Salaries", description: "Wages for research, administrative, communication, and technical staff." },
    ],
  },
  {
    categoryKey: "personnelBenefitsInsurance",
    categoryLabel: "Personnel benefits — insurance (regular personnel)",
    items: [
      { key: "healthInsurance", label: "Health Insurance", description: "Employer health insurance contributions." },
    ],
  },
  {
    categoryKey: "personnelBenefitsPension",
    categoryLabel: "Personnel benefits — pension (regular personnel)",
    items: [
      { key: "pensions", label: "Pensions", description: "Employer pension contributions to retirement plans." },
    ],
  },
  {
    categoryKey: "recurrentGeneral",
    categoryLabel: "Recurrent costs (general)",
    items: [
      { key: "rent",                       label: "Rent",                                                                description: "Office rent." },
      { key: "cleaningServiceMaterials",   label: "Cleaning service/materials",                                          description: "Cleaning service and cleaning supplies." },
      { key: "securityServices",           label: "Security services",                                                   description: "Security and alarm monitoring for premises and equipment." },
      { key: "vehicleFuelMaintenance",     label: "Vehicle fuel and maintenance",                                        description: "Vehicle fuel and maintenance." },
      { key: "vehicleRental",              label: "Vehicle \"rental\"",                                                  description: "Vehicle \"rental.\" This is for annual rental of a vehicle by the Secretariat, if the vehicle is rented. (Note: vehicle purchase is on the irregular budget). If the vehicle is a government, institutional, or personal vehicle that is used for Secretariat purposes on an annual basis, but the Secretariat does not pay for use of that vehicle, list the vehicle purchase on the in-kind contributions worksheet." },
      { key: "officeExpenses",             label: "Office expenses",                                                     description: "Electricity, water, software subscriptions (Microsoft Office, Adobe, Zoom), stationery, small office supplies." },
      { key: "internetService",            label: "Internet service",                                                    description: "Reliable internet for communication, data management, and virtual meetings." },
      { key: "websiteDomainHosting",       label: "Website domain and hosting service",                                  description: "Annual fee to a service (e.g., Wix, Ionos) to host the unit's website and maintain the domain name." },
      { key: "websiteEditsConsultant",     label: "Regular website edits (if not done by regular personnel)",            description: "Regular/recurrent website edits/maintenance (if done by consultants/outside organizations). Don't list here if done by regular personnel whose time would be paid as part of the \"salaries,\" \"benefits\", and \"pensions\" items. Please note, this is for regular/recurrent website edits/maintenance, such as editing an existing webpage or posting new content to a \"news and events\" section of the website, and not for irregular/one-time actions like developing a comprehensive new website structure, creating a new digital platform (e.g., a registration portal), or integrating significant new functionality." },
      { key: "commMarketingConsultant",    label: "Regular communication/marketing (if not done by regular personnel)", description: "Regular/recurrent communication services and marketing products (if done by consultants/outside organizations). Don't list here if done by regular personnel whose time would be paid as part of the \"salaries,\" \"benefits\", and \"pensions\" items. Please note, this is for regular/recurrent communication and marketing, such as developing social media messages and newsletter content, and not for irregular/one-time communications or marketing items." },
      { key: "annualConferenceHosting",    label: "Annual conference hosting",                                           description: "Organisation's annual dissemination and stakeholder engagement event, or conference to bring employees together to review/plan/train." },
      { key: "otherConferenceMeetingTravel", label: "Other conference/meeting travel",                                   description: "Travel costs for regular personnel to attend conferences or meetings. Note, travel for site visits is not included here (please list under \"site visits and monitoring\")." },
      { key: "refundPayments",             label: "Refund payments",                                                     description: "Refund payments to PIs and study teams, in the case that those teams double-paid for a review or submitted a payment for a review in a higher fee category than was appropriate." },
      { key: "contingencyReserveFund",     label: "Contingency / reserve fund",                                          description: "Contribution to reserve fund, which acts as a buffer for unforeseen operational expenses." },
    ],
  },
  {
    categoryKey: "recurrentGovt",
    categoryLabel: "Recurrent costs (govt fees & compliance)",
    items: [
      { key: "govtFees",              label: "Government fees (e.g., National Insurance Scheme, Social Security)", description: "Government fees such as National Insurance Scheme or Social Security." },
      { key: "regularEthicsTraining", label: "Regular ethics training",                                            description: "Fees for staff to attend training programs on research ethics, data protection, and regulatory compliance; AND/OR regular development/editing of ethics training programs (if by a consultant and not regular personnel) — note this is only for regular development/review/maintenance of training materials and not a 1-time development of a new training or significant revision of existing training. Time for regular staff spent training should be part of the salary." },
      { key: "siteVisitsMonitoring",  label: "Site visits and site monitoring",                                    description: "Field supervision and monitoring of research sites to ensure quality control." },
    ],
  },
  {
    categoryKey: "capitalCosts",
    categoryLabel: "Capital costs (durable goods)",
    items: [
      { key: "computers", label: "Computers", description: "Computers, tablets, printers, scanners, etc." },
      { key: "furniture", label: "Furniture", description: "Desks, chairs, tables, lighting, filing cabinets, etc." },
    ],
  },
  {
    categoryKey: "necPersonnelSalaries",
    categoryLabel: "Ethics Committee personnel salaries (IRB reviewers)",
    items: [
      { key: "necReviewerSalaryReview",   label: "[salary] Payments to reviewers (review time)",   description: "Payment to reviewers for their time to assess research quality and ethics." },
      { key: "necReviewerSalaryTraining", label: "[salary] Payments to reviewers (training time)", description: "Payment to reviewers for their time spent in training to be able to assess research quality and ethics." },
    ],
  },
  {
    categoryKey: "necPersonnelBenefits",
    categoryLabel: "Ethics Committee personnel benefits (IRB reviewers)",
    items: [
      { key: "necTravelTimeStipend", label: "Supplement payment for travel time",                       description: "Stipend/allowance for reviewer travel time, if the review meetings or trainings are in-person." },
      { key: "necTravelCostStipend", label: "Supplement payment for travel costs (e.g., tickets, lodging)", description: "Stipend/allowances for reviewer travel costs (e.g., flight, hotel), if the review meetings or trainings are in-person." },
    ],
  },
  {
    categoryKey: "necRecurrentGeneral",
    categoryLabel: "Ethics Committee recurrent costs (general)",
    items: [
      { key: "necReviewMeetingHosting", label: "Review meeting hosting (e.g., venue, catering)", description: "Review board meeting or training meeting hosting costs such as venue rental, food, stationary, etc." },
    ],
  },
];

// Flat list of all 27 item keys (in workbook order).
export const EXPENSES_REGULAR_KEYS = EXPENSES_REGULAR.flatMap((c) => c.items.map((i) => i.key));

// Quick lookup: itemKey -> { label, description, categoryLabel }.
export const EXPENSES_REGULAR_ITEM_LOOKUP = (() => {
  const map = {};
  for (const cat of EXPENSES_REGULAR) {
    for (const item of cat.items) {
      map[item.key] = { label: item.label, description: item.description, categoryLabel: cat.categoryLabel };
    }
  }
  return map;
})();

// Keys belonging to the National Ethics Committee (NEC) rollup —
// used by Expenses.jsx for the NEC subtotal KPI.
export const NEC_KEYS = [
  ...EXPENSES_REGULAR.find((c) => c.categoryKey === "necPersonnelSalaries").items.map((i) => i.key),
  ...EXPENSES_REGULAR.find((c) => c.categoryKey === "necPersonnelBenefits").items.map((i) => i.key),
  ...EXPENSES_REGULAR.find((c) => c.categoryKey === "necRecurrentGeneral").items.map((i) => i.key),
];

// USD dummy amounts for all 5 testing countries — sourced verbatim from workbook
// 2026-04-17 Expenses_regular sheet, column H (Amount USD). Total $351,500.
// Per Willyanne 2026-05-22 call: all 5 countries seed identical USD values for
// testing; country teams can toggle to local currency or edit values once live.
export const EXPENSES_REGULAR_USD_DEFAULTS = {
  salaries: 150000,
  healthInsurance: 25000,
  pensions: 25000,
  rent: 0,
  cleaningServiceMaterials: 0,
  securityServices: 0,
  vehicleFuelMaintenance: 2500,
  vehicleRental: 0,
  officeExpenses: 2500,
  internetService: 1000,
  websiteDomainHosting: 500,
  websiteEditsConsultant: 2500,
  commMarketingConsultant: 0,
  annualConferenceHosting: 18000,
  otherConferenceMeetingTravel: 7500,
  refundPayments: 2500,
  contingencyReserveFund: 5000,
  govtFees: 50000,
  regularEthicsTraining: 5000,
  siteVisitsMonitoring: 2500,
  computers: 1000,
  furniture: 1000,
  necReviewerSalaryReview: 30000,
  necReviewerSalaryTraining: 5000,
  necTravelTimeStipend: 5000,
  necTravelCostStipend: 5000,
  necReviewMeetingHosting: 5000,
};

// Ordered category labels — used as the canonical category list in the wizard.
export const EXPENSES_REGULAR_CATEGORIES = EXPENSES_REGULAR.map((c) => c.categoryLabel);

// Row-shape defaults (Willyanne 2026-05-26 #11/#12). Mirrors the Irregular
// shape: { category, key, label, description, amount }. Country teams can
// rewrite every field, append rows via "+ Add item," or delete rows with ×.
// `key` is preserved on workbook rows for Overview/Expenses legacy display;
// user-added rows get a generated key like `custom-<n>`.
export const EXPENSES_REGULAR_ROW_DEFAULTS = EXPENSES_REGULAR.flatMap((cat) =>
  cat.items.map((item) => ({
    category: cat.categoryLabel,
    key: item.key,
    label: item.label,
    description: item.description,
    amount: EXPENSES_REGULAR_USD_DEFAULTS[item.key] ?? null,
  })),
);
