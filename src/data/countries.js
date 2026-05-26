import { EXPENSES_REGULAR_USD_DEFAULTS } from "./expensesRegular";
import { EXPENSES_IRREGULAR_DEFAULTS } from "./expensesIrregular";
import { ACTIVITY_DEFAULT_ROWS } from "./activities";

// Per Willyanne 2026-05-22: irrProj seed mirrors workbook Expenses_irregular
// (D4–D15). All 5 testing countries get identical defaults; country teams edit
// freely and can add rows beyond the 12.
const cloneIrregularDefaults = () => JSON.parse(JSON.stringify(EXPENSES_IRREGULAR_DEFAULTS));

// Per Willyanne 2026-05-26 #9: all 5 testing countries seed identical
// activity rows from workbook col I (near-term) + col J (long-term), with
// editable names and descriptions (#7/#8).
const cloneActivityDefaults = () => JSON.parse(JSON.stringify(ACTIVITY_DEFAULT_ROWS));

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
    fees: [
      { type: "Initial (>min risk) Reg.",   ind: 1500, ngo: 750,  ctPro: 40, ctStu: 0,   rev: 60000 },
      { type: "Initial (>min risk) Accel.", ind: 3000, ngo: 1500, ctPro: 30, ctStu: 0,   rev: 90000 },
      { type: "Initial (min risk) Reg.",    ind: 750,  ngo: 300,  ctPro: 20, ctStu: 55,  rev: 31500 },
      { type: "Initial (min risk) Accel.",  ind: 1500, ngo: 600,  ctPro: 50, ctStu: 0,   rev: 75000 },
      { type: "Continuing Review",          ind: 100,  ngo: 100,  ctPro: 80, ctStu: 80,  rev: 16000 },
      { type: "Amendments",                 ind: 200,  ngo: 100,  ctPro: 30, ctStu: 0,   rev: 6000  },
      { type: "Other (ext., penalties)",    ind: 200,  ngo: 100,  ctPro: 60, ctStu: 25,  rev: 14875 },
    ],
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
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
    fees: [
      { type: "Initial (>min risk) Reg.",   ind: 2000, ngo: 1000, ctPro: 63, ctStu: 0,  rev: 126000 },
      { type: "Initial (>min risk) Accel.", ind: 4000, ngo: 2000, ctPro: 20, ctStu: 0,  rev: 80000  },
      { type: "Initial (min risk) Reg.",    ind: 800,  ngo: 400,  ctPro: 70, ctStu: 30, rev: 68000  },
      { type: "Initial (min risk) Accel.",  ind: 1600, ngo: 800,  ctPro: 30, ctStu: 0,  rev: 48000  },
      { type: "Continuing Review",          ind: 150,  ngo: 150,  ctPro: 100,ctStu: 50, rev: 22500  },
      { type: "Amendments",                 ind: 300,  ngo: 150,  ctPro: 28, ctStu: 12, rev: 10200  },
      { type: "Other",                      ind: 250,  ngo: 125,  ctPro: 35, ctStu: 15, rev: 10625  },
    ],
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
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
    fees: [
      { type: "Initial (>min risk) Reg.",   ind: 1200, ngo: 600,  ctPro: 28, ctStu: 0,  rev: 33600  },
      { type: "Initial (>min risk) Accel.", ind: 2400, ngo: 1200, ctPro: 15, ctStu: 0,  rev: 36000  },
      { type: "Initial (min risk) Reg.",    ind: 500,  ngo: 250,  ctPro: 35, ctStu: 15, rev: 21250  },
      { type: "Initial (min risk) Accel.",  ind: 1000, ngo: 500,  ctPro: 10, ctStu: 0,  rev: 10000  },
      { type: "Continuing Review",          ind: 80,   ngo: 80,   ctPro: 50, ctStu: 30, rev: 6400   },
      { type: "Amendments",                 ind: 150,  ngo: 75,   ctPro: 21, ctStu: 9,  rev: 3825   },
      { type: "Other",                      ind: 100,  ngo: 50,   ctPro: 35, ctStu: 15, rev: 4125   },
    ],
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
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
    fees: [
      { type: "Initial (>min risk) Reg.",   ind: 1800, ngo: 900,  ctPro: 38, ctStu: 0,  rev: 68400  },
      { type: "Initial (>min risk) Accel.", ind: 3600, ngo: 1800, ctPro: 18, ctStu: 0,  rev: 64800  },
      { type: "Initial (min risk) Reg.",    ind: 600,  ngo: 300,  ctPro: 45, ctStu: 20, rev: 33000  },
      { type: "Initial (min risk) Accel.",  ind: 1200, ngo: 600,  ctPro: 25, ctStu: 0,  rev: 30000  },
      { type: "Continuing Review",          ind: 120,  ngo: 120,  ctPro: 70, ctStu: 30, rev: 12000  },
      { type: "Amendments",                 ind: 250,  ngo: 125,  ctPro: 28, ctStu: 12, rev: 8500   },
      { type: "Other",                      ind: 150,  ngo: 75,   ctPro: 35, ctStu: 15, rev: 6375   },
    ],
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
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
    fees: [
      { type: "Initial (>min risk) Reg.",   ind: 1000, ngo: 500,  ctPro: 24, ctStu: 0,  rev: 24000  },
      { type: "Initial (>min risk) Accel.", ind: 2000, ngo: 1000, ctPro: 10, ctStu: 0,  rev: 20000  },
      { type: "Initial (min risk) Reg.",    ind: 400,  ngo: 200,  ctPro: 28, ctStu: 12, rev: 13600  },
      { type: "Initial (min risk) Accel.",  ind: 800,  ngo: 400,  ctPro: 8,  ctStu: 0,  rev: 6400   },
      { type: "Continuing Review",          ind: 75,   ngo: 75,   ctPro: 56, ctStu: 24, rev: 6000   },
      { type: "Amendments",                 ind: 120,  ngo: 60,   ctPro: 17, ctStu: 8,  rev: 2520   },
      { type: "Other",                      ind: 100,  ngo: 50,   ctPro: 21, ctStu: 9,  rev: 2550   },
    ],
    activities: cloneActivityDefaults(),
    irrProj: cloneIrregularDefaults(),
  },
};
