import { gm } from "./metrics";
import { rowRevenue, FEES_DEFAULT_COLUMN_LABELS } from "../data/feesModel";

// Pre-submit checks on the Review page: (1) line items that moved more than
// OUTLIER_PCT from the file the user started from, (2) unit/currency mix-up
// signs, (3) sanity problems inside the file, (4) before/after headline totals.
export const OUTLIER_PCT = 0.2;
const num = (v) => Number(v) || 0;

const hasBaseline = (b) => !!b && b.er && Object.keys(b.er).length > 0;

// Turn an array of row objects into { id: {label, amount} } with stable ids.
function rowMap(rows, labelOf, amountOf) {
  const out = {}; const seen = {};
  (rows || []).forEach((r, i) => {
    if (!r) return;
    const base = r.key || `${r.category || ""}|${r.item || r.type || r.funder || ""}`;
    seen[base] = (seen[base] || 0) + 1;
    const id = seen[base] > 1 ? `${base}#${seen[base]}` : base;
    out[id] = { label: labelOf(r, i), amount: amountOf(r) };
  });
  return out;
}

function sections(d) {
  const erLabels = {};
  (d.erRows || []).forEach((r) => { if (r?.key) erLabels[r.key] = r.label || r.key; });
  const er = {};
  Object.entries(d.er || {}).forEach(([k, v]) => { er[k] = { label: erLabels[k] || k, amount: num(v) }; });
  const fees = rowMap(d.fees, (r) => r.type || "Fee row", (r) => (r.cells ? rowRevenue(r) : num(r.rev)));
  const lab = (r) => [r.category, r.item || r.funder].filter(Boolean).join(": ") || "Row";
  return {
    "Regular expenses": er,
    "Irregular expenses": rowMap(d.irrProj, lab, (r) => num(r.amount)),
    "Fee revenue": fees,
    "Other regular revenue": rowMap(d.revRegOther, lab, (r) => num(r.amount)),
    "Irregular revenue": rowMap(d.revIrr, lab, (r) => num(r.amount)),
    "In-kind (regular)": rowMap(d.ikRegRows, lab, (r) => num(r.amount)),
    "In-kind (irregular)": rowMap(d.ikIrrRows, lab, (r) => num(r.amount)),
  };
}

export function headlineTotals(d) {
  const m = gm({ er: {}, ei: {}, ri: {}, revFees: 0, revOther: 0, ...d });
  return [
    { key: "te", label: "Total regular expenses", value: m.te },
    { key: "tr", label: "Total regular revenue", value: m.tr },
    { key: "ti", label: "Total irregular expenses", value: m.ti },
    { key: "tri", label: "Total irregular revenue", value: m.tri },
    { key: "cg", label: "Combined budget gap", value: m.cg },
    { key: "ik", label: "Total in-kind contributions", value: m.ik },
  ];
}

export function runReviewChecks(baseline, proposed) {
  const comparable = hasBaseline(baseline);
  const outliers = [];
  const units = [];
  const sanity = [];
  let summary = null;

  if (comparable) {
    const before = sections(baseline); const after = sections(proposed);
    Object.keys(after).forEach((sec) => {
      const ids = new Set([...Object.keys(before[sec] || {}), ...Object.keys(after[sec] || {})]);
      ids.forEach((id) => {
        const o = before[sec]?.[id]?.amount ?? 0;
        const n = after[sec]?.[id]?.amount ?? 0;
        if (o === 0 && n === 0) return;
        const label = after[sec]?.[id]?.label || before[sec]?.[id]?.label || id;
        if (o === 0) { outliers.push({ id: `${sec}|${id}`, section: sec, label, oldValue: o, newValue: n, pct: null }); return; }
        const pct = (n - o) / Math.abs(o);
        if (Math.abs(pct) > OUTLIER_PCT) outliers.push({ id: `${sec}|${id}`, section: sec, label, oldValue: o, newValue: n, pct });
      });
    });

    const bt = headlineTotals(baseline); const at = headlineTotals(proposed);
    summary = at.map((a, i) => ({ ...a, before: bt[i].value, pct: bt[i].value ? (a.value - bt[i].value) / Math.abs(bt[i].value) : null }));
    summary.forEach((s) => {
      if (["te", "tr", "ti", "tri", "ik"].includes(s.key) && s.before > 0 && s.value > 0) {
        const ratio = s.value / s.before;
        if (ratio >= 5 || ratio <= 0.2) {
          units.push({ id: `ratio-${s.key}`, text: `${s.label} is ${ratio >= 1 ? `${ratio.toFixed(1)} times larger` : `${(1 / ratio).toFixed(1)} times smaller`} than in the file you started from. That often means local currency was typed into a USD box (or the reverse), or amounts were entered in thousands instead of full amounts.` });
        }
      }
    });
    if (baseline.currencyCode && proposed.currencyCode && baseline.currencyCode !== proposed.currencyCode) {
      units.push({ id: "currency", text: `The reporting currency changed from ${baseline.currencyCode} to ${proposed.currencyCode}. Make sure every amount was re-entered in the new currency.` });
    }
    if ((baseline.unit || "") !== (proposed.unit || "") && baseline.unit) {
      units.push({ id: "unit", text: `The unit changed from "${baseline.unit}" to "${proposed.unit || "(blank)"}". Make sure all amounts match that unit.` });
    }
  }

  // Sanity checks (these run even with nothing to compare against).
  const neg = [];
  const scan = (name, rows) => (rows || []).forEach((r, i) => { if (num(r?.amount) < 0) neg.push(`${name}, row ${i + 1}`); });
  Object.entries(proposed.er || {}).forEach(([k, v]) => { if (num(v) < 0) neg.push(`Regular expenses: ${k}`); });
  scan("Irregular expenses", proposed.irrProj); scan("Other regular revenue", proposed.revRegOther);
  scan("Irregular revenue", proposed.revIrr); scan("In-kind (regular)", proposed.ikRegRows); scan("In-kind (irregular)", proposed.ikIrrRows);
  if (neg.length) sanity.push({ id: "negative", text: `Negative amounts entered: ${neg.slice(0, 6).join("; ")}${neg.length > 6 ? ` and ${neg.length - 6} more` : ""}.` });

  (proposed.fees || []).forEach((f) => {
    Object.entries(f?.cells || {}).forEach(([k, c]) => {
      const a = num(c?.amount); const n = num(c?.count);
      const col = FEES_DEFAULT_COLUMN_LABELS[k]?.dollar?.replace(/\s*\$\s*$/, "") || k;
      if (a > 0 && n === 0) sanity.push({ id: `fee-nocount-${f.type}-${k}`, text: `Fee schedule, "${f.type}" (${col}): a fee is entered but the number of reviews is blank or zero.` });
      if (n > 0 && a === 0) sanity.push({ id: `fee-noamt-${f.type}-${k}`, text: `Fee schedule, "${f.type}" (${col}): a number of reviews is entered but the fee is blank or zero.` });
    });
  });
  const noFunder = (name, rows, field) => (rows || []).forEach((r, i) => {
    if (num(r?.amount) > 0 && !String(r?.[field] || "").trim()) sanity.push({ id: `${name}-${i}`, text: `${name}, row ${i + 1}: an amount is entered but no ${field === "funder" ? "funding source" : field} is selected.` });
  });
  noFunder("In-kind (regular)", proposed.ikRegRows, "funder");
  noFunder("In-kind (irregular)", proposed.ikIrrRows, "funder");
  noFunder("Irregular expenses", proposed.irrProj, "funder");
  if (Object.values(proposed.er || {}).reduce((s, v) => s + num(v), 0) === 0) sanity.push({ id: "no-expenses", text: "Total regular expenses are zero." });
  if (num(proposed.revFees) + num(proposed.revOther) === 0) sanity.push({ id: "no-revenue", text: "Total regular revenue is zero." });

  const ids = [...outliers.map((o) => o.id), ...units.map((u) => u.id), ...sanity.map((s) => s.id)];
  return { comparable, outliers, units, sanity, summary, needsAck: ids.length > 0, signature: ids.join("~") };
}
