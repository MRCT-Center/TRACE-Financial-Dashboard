import { totalFeesRevenue, deriveLegacyFeeFields } from "../data/feesModel";

// Sandbox edits (2026-10-27). Applies one edit to an in-memory copy of a file
// and re-computes whatever totals depend on the row that changed, using the
// same roll-up rules the Inputs Review/Submit step uses. Never saved anywhere.

const num = (v) => Number(v) || 0;
const sum = (rows) => (rows || []).reduce((s, r) => s + num(r?.amount), 0);

function setPath(data, path, value) {
  const clone = JSON.parse(JSON.stringify(data || {}));
  const keys = path.split(".");
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] === undefined || cur[k] === null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

const ikRollup = (rows) => {
  const r = { federal: 0, institutional: 0, other: 0 };
  (rows || []).forEach((x) => {
    const v = num(x?.amount);
    if (x?.funder === "In-kind contribution (federal)") r.federal += v;
    else if (x?.funder === "In-kind contribution (institutional)") r.institutional += v;
    else if (x?.funder === "In-kind contribution (other source)") r.other += v;
  });
  return { ...r, total: sum(rows) };
};

export function applySandboxEdit(data, path, value) {
  const d = setPath(data, path, value);
  const [top, second] = path.split(".");
  if (top === "er" && Array.isArray(d.erRows)) {
    // aggregate edit from the Expenses results table: keep the matching row in step
    d.erRows = d.erRows.map((r) => (r && r.key === second ? { ...r, amount: value } : r));
  }
  if (top === "erRows") {
    const flat = {};
    (d.erRows || []).forEach((r) => { if (r && r.key) flat[r.key] = r.amount ?? null; });
    d.er = flat;
  }
  if (top === "fees") {
    const i = Number(second);
    if (d.fees?.[i]) d.fees[i] = { ...d.fees[i], ...deriveLegacyFeeFields(d.fees[i]) };
    d.revFees = totalFeesRevenue(d.fees);
  }
  if (top === "revRegOther") d.revOther = sum(d.revRegOther);
  if (top === "revIrr") {
    const ri = { grants: 0, contracts: 0, other: 0, reserves: 0 };
    (d.revIrr || []).forEach((r) => {
      const v = num(r?.amount);
      if (r?.category === "Grant") ri.grants += v;
      else if (r?.category === "Contract") ri.contracts += v;
      else if (r?.category === "Other 1-time payment") ri.other += v;
      else if (r?.category === "Deferred reserves") ri.reserves += v;
    });
    d.ri = ri;
  }
  if (top === "irrProj") d.ei = { proj: (d.irrProj || []).reduce((s, p) => s + num(p?.amount), 0) };
  if (top === "ikRegRows") d.ikReg = ikRollup(d.ikRegRows);
  if (top === "ikIrrRows") d.ikIrr = ikRollup(d.ikIrrRows);
  return d;
}
