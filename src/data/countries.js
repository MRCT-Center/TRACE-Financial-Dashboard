import { EXPENSES_REGULAR_USD_DEFAULTS, EXPENSES_REGULAR_ROW_DEFAULTS } from "./expensesRegular";
import { EXPENSES_IRREGULAR_DEFAULTS } from "./expensesIrregular";
import { ACTIVITY_DEFAULT_ROWS } from "./activities";
import { REVENUE_REGULAR_OTHER_DEFAULTS } from "./revenueRegularOther";
import { REVENUE_IRREGULAR_DEFAULTS } from "./revenueIrregular";
import { FEES_DEFAULT_ROWS, FEES_DEFAULT_COLUMN_LABELS, FEES_DEFAULT_ROW_TYPES, makeBlankFeeRow, totalFeesRevenue } from "./feesModel";
import { IN_KIND_REGULAR_DEFAULTS } from "./inKindRegular";
import { IN_KIND_IRREGULAR_DEFAULTS } from "./inKindIrregular";

// Per Willyanne 2026-05-22: irrProj seed mirrors workbook Expenses_irregular
// (D4–D15). All 5 testing countries get identical defaults; country teams edit
// freely and can add rows beyond the 12.
const cloneIrregularDefaults = () => JSON.parse(JSON.stringify(EXPENSES_IRREGULAR_DEFAULTS));

// `ei.proj` is the aggregate irregular-expense figure that gm()/Overview sum
// into the Irregular Budget "Expenses" total. It MUST match the sum of the
// irregular rows the wizard shows on the Step 3 Irregular tab (and writes back
// on submit: ei.proj = Σ irrProjEdits.amount). Earlier each country carried a
// hand-set placeholder that drifted from the now-identical irrProj seed, so
// the Overview showed a different number than the wizard. Derive it from the
// same defaults so the two always agree (currently $300,000). Per Willyanne
// 2026-05-29 (in-person).
const irrProjDefaultTotal = EXPENSES_IRREGULAR_DEFAULTS.reduce(
  (s, r) => s + (r.amount || 0),
  0,
);

// In-Kind aggregates (ikReg / ikIrr) feed the Results → Overview In-Kind box
// (gm() reads d.ikReg.total + d.ikIrr.total) and the editable In-Kind card.
// They MUST match the totals at the bottom of the wizard Step 5 In-Kind tabs
// (which sum IN_KIND_REGULAR_DEFAULTS / IN_KIND_IRREGULAR_DEFAULTS, and which
// the wizard writes back on submit). Earlier these were hand-set per country
// (Kenya matched; the other four were zeros), so the Overview disagreed with
// the tab. Derive them from the same defaults so the two always agree
// (regular $93,750 split federal/institutional/other; irregular $20,000).
// Per Willyanne 2026-05-29 (in-person).
const ikSumByFunder = (rows, funder) =>
  rows.reduce((s, r) => (r.funder === funder ? s + (Number(r.amount) || 0) : s), 0);
const ikRegDefaults = () => ({
  federal:       ikSumByFunder(IN_KIND_REGULAR_DEFAULTS, "In-kind contribution (federal)"),
  institutional: ikSumByFunder(IN_KIND_REGULAR_DEFAULTS, "In-kind contribution (institutional)"),
  other:         ikSumByFunder(IN_KIND_REGULAR_DEFAULTS, "In-kind contribution (other source)"),
  total:         IN_KIND_REGULAR_DEFAULTS.reduce((s, r) => s + (Number(r.amount) || 0), 0),
});
const ikIrrDefaults = () => ({
  federal:       ikSumByFunder(IN_KIND_IRREGULAR_DEFAULTS, "In-kind contribution (federal)"),
  institutional: ikSumByFunder(IN_KIND_IRREGULAR_DEFAULTS, "In-kind contribution (institutional)"),
  other:         ikSumByFunder(IN_KIND_IRREGULAR_DEFAULTS, "In-kind contribution (other source)"),
  total:         IN_KIND_IRREGULAR_DEFAULTS.reduce((s, r) => s + (Number(r.amount) || 0), 0),
});

// Revenue aggregates (revFees / revOther / ri) feed the Results → Overview and
// Revenue KPIs: gm() sums revFees+revOther for regular revenue and Σ ri for
// irregular. Per Willyanne 2026-05-30 (#2/#3/#5/#8/#9): these MUST match the
// totals at the bottom of the wizard Inputs → Revenue pages, which sum the row
// arrays (fees → $331,375, revRegOther → $0, revIrr → Gates $300,000). Earlier
// each country carried hand-set placeholders that drifted from those rows (e.g.
// Rwanda revFees $195k, revOther $15k, ri.grants $180k), so the Overview and
// Results disagreed with the Inputs page. Derive all three from the same row
// defaults so the seed always equals the Inputs totals; App.jsx re-derives them
// from saved rows on load so existing Supabase rows self-heal the same way.
const revFeesDefault  = totalFeesRevenue(FEES_DEFAULT_ROWS);
const revOtherDefault = REVENUE_REGULAR_OTHER_DEFAULTS.reduce(
  (s, r) => s + (Number(r.amount) || 0),
  0,
);
const riDefault = () =>
  REVENUE_IRREGULAR_DEFAULTS.reduce(
    (acc, r) => {
      const v = Number(r.amount) || 0;
      if (r.category === "Grant") acc.grants += v;
      else if (r.category === "Contract") acc.contracts += v;
      else if (r.category === "Other 1-time payment") acc.other += v;
      else if (r.category === "Deferred reserves") acc.reserves += v;
      return acc;
    },
    { grants: 0, contracts: 0, other: 0, reserves: 0 },
  );

// Ethics Committee detailed breakdown (Results → Expenses). Per Willyanne
// 2026-05-30 (#7): these must equal the er Ethics items on the wizard Inputs →
// 3. Expenses page ($30,000 / $5,000 / $5,000 / $5,000 / $5,000), not the
// drifted per-country placeholders (e.g. Rwanda $14k / $2k / $2k / $2k / $4k).
// Derive from the shared er Ethics defaults so the card always mirrors the
// inputs; App.jsx re-derives from saved er rows on load.
const necDetailDefault = () => ({
  reviewPay:   EXPENSES_REGULAR_USD_DEFAULTS.necReviewerSalaryReview,
  reviewTrain: EXPENSES_REGULAR_USD_DEFAULTS.necReviewerSalaryTraining,
  travelTime:  EXPENSES_REGULAR_USD_DEFAULTS.necTravelTimeStipend,
  travelCost:  EXPENSES_REGULAR_USD_DEFAULTS.necTravelCostStipend,
  meetings:    EXPENSES_REGULAR_USD_DEFAULTS.necReviewMeetingHosting,
});

// Per Willyanne 2026-05-26 #9: all 5 testing countries seed identical
// activity rows from workbook col I (near-term) + col J (long-term), with
// editable names and descriptions (#7/#8).
const cloneActivityDefaults = () => JSON.parse(JSON.stringify(ACTIVITY_DEFAULT_ROWS));

// Per Willyanne 2026-05-26 #19/#20: Revenue tab gets sub-tabs Regular |
// Irregular, with Regular containing a stacked "Regular Revenue from Fees"
// section (untouched today; redesign scheduled for item 21 on 2026-05-27)
// above a new "Regular Revenue from Other Sources" section. All 5 testing
// countries seed identical blank starter rows from the workbook.
const cloneRevRegOtherDefaults = () => JSON.parse(JSON.stringify(REVENUE_REGULAR_OTHER_DEFAULTS));
const cloneRevIrrDefaults       = () => JSON.parse(JSON.stringify(REVENUE_IRREGULAR_DEFAULTS));

// Per Willyanne 2026-05-28 (plane-to-London email): Regular Revenue from Fees
// is rebuilt with 15 review-type rows × 9 funder/student $/# column pairs.
// All 5 testing countries seed identical blank cells; country teams fill in
// fees + counts in the wizard. The legacy dummy values (Kenya rev ~$331k etc.)
// are dropped — the new column structure doesn't map cleanly to the old
// `ind/ngo/ctPro/ctStu` shape, and the values were prototype-only anyway.
const cloneFeesDefaults = () => JSON.parse(JSON.stringify(FEES_DEFAULT_ROWS));
const cloneFeesColumns  = () => JSON.parse(JSON.stringify(FEES_DEFAULT_COLUMN_LABELS));

// Per Willyanne 2026-05-26 #6: Key Considerations workbook (cell 2c/2d/2e)
// pre-fills both risks and opportunities to "yes" with the descriptions from
// the workbook's combined risks-and-opportunities cell E2. Country teams can
// flip to "no" or rewrite the descriptions; both yes/no AND the description
// are required to advance Step 2 (#5).
export const KEY_CONSIDERATIONS_DEFAULTS = {
  hasRisks: "yes",
  hasOpps:  "yes",
  riskText: "Loss of USAID funding to researchers doing HIV and Sexual Reproductive Health by USAID; instability of our local currency with high inflation rate; pensions payout are being eroded.",
  oppText:  "Increase in international funding is expected, e.g., the current Gates Foundation, Africa Clinical Trial Network.",
};

// Populated worked-example seed. Per Willyanne 2026-07-01 the demo data (which
// used to fill all five countries with identical USD dummy amounts from the
// workbook) now lives ONLY in the fake example country "Nyika". The five real
// countries seed blank (see blankCountry below) so country teams start from a
// clean slate. `_legacyEr.recG/recGov` were mis-classified expenses preserved
// pending the Revenue deep-dive; kept on the example only.
const demoCountry = () => ({
  er: { ...EXPENSES_REGULAR_USD_DEFAULTS },
  _legacyEr: { recG: 42000, recGov: 57500 },
  ei: { proj: irrProjDefaultTotal },
  revFees: revFeesDefault, revOther: revOtherDefault,
  ri: riDefault(),
  grantEnd: "Dec 2026",
  ikReg: ikRegDefaults(),
  ikIrr: ikIrrDefaults(),
  necDetail: necDetailDefault(),
  fees: cloneFeesDefaults(),
  feesColumns: cloneFeesColumns(),
  activities: cloneActivityDefaults(),
  irrProj: cloneIrregularDefaults(),
  revRegOther: cloneRevRegOtherDefaults(),
  revIrr: cloneRevIrrDefaults(),
});

// Blank (money-free) seed for the five real countries. Per Willyanne 2026-07-01:
// every expense, revenue, in-kind, and fee amount/count is empty, while ALL
// structure is kept — expense/revenue row labels + categories, the fee-schedule
// review-type rows + column headers, activities, and the Key Considerations
// text. The ⓘ callouts and step instructions are unaffected (they live in
// instructions.js / component copy, not here). Country teams enter their own
// numbers in the wizard.
//   - Aggregate fields consumed by gm() with raw `a + b` (er, ei, revFees,
//     revOther, ri, ikReg/ikIrr totals, necDetail) MUST stay numeric 0.
//   - Editable input ROWS (irrProj, revRegOther, revIrr, fee cells) blank to ""
//     so their input boxes render empty rather than "0".
// NOTE: the App.jsx re-seed guards (isAllBlankFees / isAllBlankRevIrr / the
// In-Kind + revenue aggregate guards) would refill this dummy data on load, so
// the Supabase merge is skipped while DEMO_MODE is on — see App.jsx.
const blankMoneyRows = (rows) =>
  JSON.parse(JSON.stringify(rows)).map((r) => {
    const out = { ...r };
    if ("amount" in out) out.amount = "";
    if ("count" in out) out.count = "";
    // Per Willyanne 2026-07-01: also clear pre-seeded funding sources so every
    // funder cell reads the placeholder ("e.g., Gates Foundation" on the free-
    // text irregular expense/revenue inputs) or "-select-" (the in-kind dropdown)
    // for real teams, rather than the demo's "Gates Foundation" values.
    if ("funder" in out) out.funder = "";
    return out;
  });
// Blank activities: keep the workbook activity names + descriptions (scaffolding)
// but clear the near-term / long-term effort selections so the dropdowns read
// their empty "Select…" state for real teams (per Willyanne 2026-07-01).
const blankActivityRows = () =>
  cloneActivityDefaults().map((a) => ({ ...a, nearTerm: "", longTerm: "" }));
const blankEr = () =>
  Object.fromEntries(Object.keys(EXPENSES_REGULAR_USD_DEFAULTS).map((k) => [k, 0]));
const blankCountry = () => ({
  er: blankEr(),
  // erRows feeds the wizard's Regular Expenses step; without it the wizard falls
  // back to the dummy EXPENSES_REGULAR_ROW_DEFAULTS. Seed a blank copy (labels +
  // categories kept, amounts empty) so the step renders empty for real teams.
  erRows: blankMoneyRows(EXPENSES_REGULAR_ROW_DEFAULTS),
  _legacyEr: { recG: 0, recGov: 0 },
  ei: { proj: 0 },
  revFees: 0, revOther: 0,
  ri: { grants: 0, contracts: 0, other: 0, reserves: 0 },
  grantEnd: "",
  // Key Considerations: leave the risk/opportunity toggles unanswered and the
  // description boxes blank (per Willyanne 2026-07-01). The wizard reads these
  // via nullish-coalescing, so "" stays "" (won't fall back to the demo "yes"
  // defaults, which Nyika still gets since demoCountry omits them).
  hasRisks: "", hasOpps: "", riskText: "", oppText: "",
  ikReg: { federal: 0, institutional: 0, other: 0, total: 0 },
  ikIrr: { federal: 0, institutional: 0, other: 0, total: 0 },
  necDetail: { reviewPay: 0, reviewTrain: 0, travelTime: 0, travelCost: 0, meetings: 0 },
  fees: FEES_DEFAULT_ROW_TYPES.map((t) => makeBlankFeeRow(t)),
  feesColumns: cloneFeesColumns(),
  activities: blankActivityRows(),
  irrProj: blankMoneyRows(EXPENSES_IRREGULAR_DEFAULTS),
  revRegOther: blankMoneyRows(REVENUE_REGULAR_OTHER_DEFAULTS),
  revIrr: blankMoneyRows(REVENUE_IRREGULAR_DEFAULTS),
  // In-Kind rows: without these the wizard falls back to the populated
  // IN_KIND_*_DEFAULTS (amounts + funders). Seed blank copies so amounts are
  // empty and every funding-source dropdown reads "-select-" (Willyanne 2026-07-01).
  ikRegRows: blankMoneyRows(IN_KIND_REGULAR_DEFAULTS),
  ikIrrRows: blankMoneyRows(IN_KIND_IRREGULAR_DEFAULTS),
});

export const COUNTRIES = {
  Nyika:    demoCountry(),
  Kenya:    blankCountry(),
  Nigeria:  blankCountry(),
  Rwanda:   blankCountry(),
  Tanzania: blankCountry(),
  Zimbabwe: blankCountry(),
};
