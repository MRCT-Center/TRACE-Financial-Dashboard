// Generic deep-diff between two country data snapshots (2026-10-02).
// Compares `prev` (the draft before last) against `curr` (the most recent
// draft) and returns a flat list of leaf-level changes. Used to highlight
// what changed in the wizard and explain it in the "Show changes" panel.
//
// Arrays are compared index-by-index (rows are rarely reordered within a
// session, so this correctly catches "edited row N" without needing a
// per-table identity key). Objects are compared key-by-key, recursively.
// A few noisy/non-meaningful keys are skipped entirely (see IGNORED_KEYS).

const IGNORED_KEYS = new Set(["ratesAsOf"]);

// Friendlier labels for known top-level fields. Anything not listed falls
// back to a readable version of the raw key.
const FIELD_LABELS = {
  unit: "Unit",
  budgetYear: "Budget year",
  currencyCode: "Currency",
  hasRisks: "Has financial risks?",
  riskText: "Risk description",
  hasOpps: "Has financial opportunities?",
  oppText: "Opportunity description",
  activities: "Activities",
  er: "Regular expenses (totals)",
  erRows: "Regular expenses",
  irrProj: "Irregular expenses",
  fees: "Fee revenue",
  feesColumns: "Fee schedule column labels",
  revRegOther: "Other regular revenue",
  revOther: "Other regular revenue (total)",
  revFees: "Fee revenue (total)",
  revIrr: "Irregular revenue",
  ri: "Irregular revenue (totals)",
  ikReg: "Regular in-kind (totals)",
  ikRegRows: "Regular in-kind",
  ikIrr: "Irregular in-kind (totals)",
  ikIrrRows: "Irregular in-kind",
};

function humanize(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const spaced = String(key).replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Try to find a human-friendly identity for a row object, for use in labels
// like "Regular expenses — Personnel salaries — Amount".
function rowIdentity(row) {
  if (!row || typeof row !== "object") return null;
  return row.label || row.name || row.category || row.type || row.item || row.funder || null;
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function valuesEqual(a, b) {
  if (a === b) return true;
  // Treat null/undefined/"" as equivalent "empty" for diffing purposes --
  // avoids flagging every blank-to-still-blank field as "changed".
  const norm = (v) => (v === undefined || v === null ? "" : v);
  if (norm(a) === norm(b)) return true;
  if (isPlainObject(a) || isPlainObject(b) || Array.isArray(a) || Array.isArray(b)) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }
  return false;
}

/**
 * @param {object} prev previous draft's full data snapshot
 * @param {object} curr latest draft's full data snapshot
 * @returns {{path: string, label: string, oldValue: any, newValue: any, rowKey: string|null, rowIdx: number|null}[]}
 */
export function diffCountryData(prev, curr) {
  const changes = [];

  function walk(prevVal, currVal, pathParts, topKey, rowCtx) {
    if (valuesEqual(prevVal, currVal)) return;

    const bothArrays = Array.isArray(prevVal) && Array.isArray(currVal);
    const bothObjects = isPlainObject(prevVal) && isPlainObject(currVal);

    if (bothArrays) {
      const maxLen = Math.max(prevVal.length, currVal.length);
      for (let i = 0; i < maxLen; i++) {
        const nextRowCtx = pathParts.length === 1 ? { arrayKey: topKey, idx: i, row: currVal[i] } : rowCtx;
        walk(prevVal[i], currVal[i], [...pathParts, `[${i}]`], topKey, nextRowCtx);
      }
      return;
    }

    if (bothObjects) {
      const keys = new Set([...Object.keys(prevVal || {}), ...Object.keys(currVal || {})]);
      for (const k of keys) {
        walk(prevVal?.[k], currVal?.[k], [...pathParts, pathParts.length ? `.${k}` : k], topKey, rowCtx);
      }
      return;
    }

    // Leaf difference (primitive, or shape changed e.g. array <-> object)
    const path = pathParts.join("");
    const leafKey = pathParts[pathParts.length - 1]?.replace(/^[.[]/, "").replace(/\]$/, "");
    let label;
    if (rowCtx) {
      const identity = rowIdentity(rowCtx.row) || `Row ${rowCtx.idx + 1}`;
      label = `${humanize(rowCtx.arrayKey)} — ${identity} — ${humanize(leafKey)}`;
    } else {
      label = humanize(topKey);
    }
    changes.push({
      path,
      label,
      oldValue: prevVal,
      newValue: currVal,
      rowKey: rowCtx ? rowCtx.arrayKey : null,
      rowIdx: rowCtx ? rowCtx.idx : null,
    });
  }

  const topKeys = new Set([...Object.keys(prev || {}), ...Object.keys(curr || {})]);
  for (const key of topKeys) {
    if (IGNORED_KEYS.has(key)) continue;
    walk(prev?.[key], curr?.[key], [key], key, null);
  }

  return changes;
}

// True if any change in `changeList` touches the given row (array key + index).
export function isRowChanged(changeList, arrayKey, idx) {
  return changeList.some((c) => c.rowKey === arrayKey && c.rowIdx === idx);
}

// True if any change in `changeList` touches the exact leaf path (for scalar
// top-level fields like budgetYear, hasRisks, etc).
export function isFieldChanged(changeList, path) {
  return changeList.some((c) => c.path === path);
}

// Filter a changeList down to the top-level keys relevant to one wizard step.
export function changesForKeys(changeList, keys) {
  const keySet = new Set(keys);
  return changeList.filter((c) => {
    const topKey = c.path.split(/[.[]/)[0];
    return keySet.has(topKey);
  });
}
