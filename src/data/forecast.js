// Budget forecast bands (Willyanne 2026-06-18).
//
// Source: the workbook "Drop down options" sheet, column E ("Expenses [future]
// expectation"), which the Summary sheet (regular) H column ("Near-term
// forecast (for next year) %") draws from. Extended on 2026-06-18 with the
// intermediate 5 / 17.5 / 37.5 bands Willyanne added on each side — these exist
// only in the dashboard (the workbook list is a subset). Order matches the
// workbook, per her instruction: "Remain the same" first, then increases, then
// decreases.
//
// Each bounded band maps to a fixed multiplier applied to the regular expenses
// base. The two open-ended bands carry no fixed multiplier — the user types an
// exact % which drives the multiplier (forecastMultiplier below).
export const FORECAST_OPTIONS = [
  { label: "Remain the same", multiplier: 1 },
  { label: "Increase around 5%", multiplier: 1.05 },
  { label: "Increase around 10%", multiplier: 1.1 },
  { label: "Increase around 17.5%", multiplier: 1.175 },
  { label: "Increase around 25%", multiplier: 1.25 },
  { label: "Increase around 37.5%", multiplier: 1.375 },
  { label: "Increase around 50%", multiplier: 1.5 },
  { label: "Increase around 75%", multiplier: 1.75 },
  { label: "Increase around 100% (i.e., double)", multiplier: 2 },
  { label: "Increase more than 100%", openEnded: "increase" },
  { label: "Decrease around 5%", multiplier: 0.95 },
  { label: "Decrease around 10%", multiplier: 0.9 },
  { label: "Decrease around 17.5%", multiplier: 0.825 },
  { label: "Decrease around 25%", multiplier: 0.75 },
  { label: "Decrease around 37.5%", multiplier: 0.625 },
  { label: "Decrease around 50%", multiplier: 0.5 },
  { label: "Decrease around 75%", multiplier: 0.25 },
  { label: "Decrease around 100% (i.e., loss of original amount)", multiplier: 0 },
  { label: "Decrease more than 100% (full loss of original amount + additional loss)", openEnded: "decrease" },
];

// One forecast entry = the chosen band, an optional typed % (open-ended bands
// only), and the required reasoning.
// option defaults to "" so the select shows the "-select-" placeholder (like
// other blank cells) rather than pre-choosing "Remain the same" (Willyanne
// 2026-07-06). forecastMultiplier() treats "" as no change (multiplier 1).
export const FORECAST_DEFAULT = { option: "", customPct: "", reason: "" };

// A country carries a near-term (next year) and a long-term (3–5 years) forecast.
export const makeForecastDefault = () => ({
  near: { ...FORECAST_DEFAULT },
  long: { ...FORECAST_DEFAULT },
});

// Resolve a forecast entry { option, customPct } to the numeric multiplier
// applied to the regular-expenses base. Bounded bands use their fixed
// multiplier; open-ended bands use the typed %. Falls back to 1 (no change)
// when the band is unknown or the open-ended % is blank/invalid.
export function forecastMultiplier(fc) {
  if (!fc) return 1;
  const opt = FORECAST_OPTIONS.find((o) => o.label === fc.option);
  if (!opt) return 1;
  if (opt.openEnded) {
    const pct = Number(fc.customPct);
    if (!Number.isFinite(pct) || fc.customPct === "") return 1;
    return opt.openEnded === "increase" ? 1 + pct / 100 : 1 - pct / 100;
  }
  return opt.multiplier;
}
