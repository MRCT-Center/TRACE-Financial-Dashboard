import { EXPENSES_REGULAR_USD_DEFAULTS } from "./expensesRegular";
import { EXPENSES_IRREGULAR_DEFAULTS } from "./expensesIrregular";
import { ACTIVITY_DEFAULT_ROWS } from "./activities";
import { REVENUE_REGULAR_OTHER_DEFAULTS } from "./revenueRegularOther";
import { REVENUE_IRREGULAR_DEFAULTS } from "./revenueIrregular";
import { FEES_DEFAULT_ROWS, FEES_DEFAULT_COLUMN_LABELS } from "./feesModel";

// Per Willyanne 2026-05-22: irrProj seed mirrors workbook Expenses_irregular
// (D4–D15). All 5 testing countries get identical defaults; country teams edit
// freely and can add rows beyond the 12.
const cloneIrregularDefaults = () => JSON.parse(JSON.stringify(EXPENSES_IRREGULAR_DEFAULTS));

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

// Per Willyanne 2026-05-22: all 5 testing countries seed identical USD dummy
// amounts from workbook 2026-04-17 Expenses_regular column H (total $351,500).
// Country teams can edit values or toggle to local currency once live.
export const COUNTRIES = {
  Kenya: {
    er: { ...EXPENSES_REGULAR_USD_DEFAULTS },
    // TODO Revenue session: re-home recG / recGov to revOther or ri.grants
    // (they were mis-classified as expenses; preserved here pending the
    // Revenue tab deep-dive with Willyanne).
    _legacyEr: { recG: 42000, recGov: 57500 },
    // Irregular expenses (summed by gm() for ti total)
    ei: { proj: 350000 },
    revFees: 331375, revOther: 0,
    ri: { grants: 300000, contracts: 0, other: 25000, reserves: 0 },
    grantEnd: "Dec 2026",
    ikReg: { federal: 58250, institutional: 21000, other: 14500, total: 93750 },
    ikIrr: { total: 20000 },
    necDetail: { reviewPay: 30000, reviewTrain: 5000, travelTime: 5000, travelCost: 5000, meetings: 5000 },
    fees: cloneFeesDefaults(),
    feesColumns: cloneFeesColumns(),
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
    revRegOther: cloneRevRegOtherDefaults(),
    revIrr: cloneRevIrrDefaults(),
  },

  Nigeria: {
    er: { ...EXPENSES_REGULAR_USD_DEFAULTS },
    _legacyEr: { recG: 72000, recGov: 45000 },
    ei: { proj: 248000 },
    revFees: 380000, revOther: 20000,
    ri: { grants: 250000, contracts: 0, other: 0, reserves: 10000 },
    grantEnd: "Dec 2026",
    ikReg: { federal: 0, institutional: 0, other: 0, total: 0 },
    ikIrr: { total: 0 },
    necDetail: { reviewPay: 28000, reviewTrain: 5000, travelTime: 4000, travelCost: 4000, meetings: 7000 },
    fees: cloneFeesDefaults(),
    feesColumns: cloneFeesColumns(),
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
    revRegOther: cloneRevRegOtherDefaults(),
    revIrr: cloneRevIrrDefaults(),
  },

  Rwanda: {
    er: { ...EXPENSES_REGULAR_USD_DEFAULTS },
    _legacyEr: { recG: 35000, recGov: 25000 },
    ei: { proj: 150000 },
    revFees: 195000, revOther: 15000,
    ri: { grants: 180000, contracts: 0, other: 0, reserves: 5000 },
    grantEnd: "Dec 2026",
    ikReg: { federal: 0, institutional: 0, other: 0, total: 0 },
    ikIrr: { total: 0 },
    necDetail: { reviewPay: 14000, reviewTrain: 2000, travelTime: 2000, travelCost: 2000, meetings: 4000 },
    fees: cloneFeesDefaults(),
    feesColumns: cloneFeesColumns(),
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
    revRegOther: cloneRevRegOtherDefaults(),
    revIrr: cloneRevIrrDefaults(),
  },

  Tanzania: {
    er: { ...EXPENSES_REGULAR_USD_DEFAULTS },
    _legacyEr: { recG: 48000, recGov: 35000 },
    ei: { proj: 200000 },
    revFees: 270000, revOther: 10000,
    ri: { grants: 220000, contracts: 0, other: 0, reserves: 8000 },
    grantEnd: "Dec 2026",
    ikReg: { federal: 0, institutional: 0, other: 0, total: 0 },
    ikIrr: { total: 0 },
    necDetail: { reviewPay: 19600, reviewTrain: 2800, travelTime: 2800, travelCost: 2800, meetings: 6000 },
    fees: cloneFeesDefaults(),
    feesColumns: cloneFeesColumns(),
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
    revRegOther: cloneRevRegOtherDefaults(),
    revIrr: cloneRevIrrDefaults(),
  },

  Zimbabwe: {
    er: { ...EXPENSES_REGULAR_USD_DEFAULTS },
    _legacyEr: { recG: 32000, recGov: 22000 },
    ei: { proj: 135000 },
    revFees: 165000, revOther: 5000,
    ri: { grants: 140000, contracts: 0, other: 0, reserves: 3000 },
    grantEnd: "Dec 2026",
    ikReg: { federal: 0, institutional: 0, other: 0, total: 0 },
    ikIrr: { total: 0 },
    necDetail: { reviewPay: 12600, reviewTrain: 1800, travelTime: 1800, travelCost: 1800, meetings: 3500 },
    fees: cloneFeesDefaults(),
    feesColumns: cloneFeesColumns(),
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
    revRegOther: cloneRevRegOtherDefaults(),
    revIrr: cloneRevIrrDefaults(),
  },
};
