import { useState, useEffect } from "react";
import { COLORS as C } from "../utils/metrics";
import StepInstructions from "./StepInstructions";
import { WIZARD_STEP_INSTRUCTIONS } from "../data/instructions";
import { CURRENCIES as CURRENCY_MAP, COUNTRY_CURRENCIES } from "../utils/CurrencyContext";
import { EXPENSES_REGULAR } from "../data/expensesRegular";
import { EXPENSES_IRREGULAR_DEFAULTS, IRREGULAR_CATEGORIES } from "../data/expensesIrregular";
import { ACTIVITY_LIST, ACTIVITY_DESCRIPTIONS } from "../data/activities";
import InfoTip from "./InfoTip";

const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar"        },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling"  },
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira"   },
  { code: "RWF", symbol: "RF",  name: "Rwandan Franc"    },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ZWG", symbol: "ZiG", name: "Zimbabwe Gold"    },
];

// Setup tab — Unit options (from workbook dropdown sheet, locked 2026-05-21).
const UNIT_OPTIONS = [
  "National Secretariat/mgmt.",
  "National Ethics Committee",
  "Local IRB Secretariat/mgmt.",
  "Local IRB Ethics Committee",
];

const TREND_OPTIONS = ["Remain the same", "Increase", "Decrease"];

// ─── Wizard draft persistence ────────────────────────────────────────────────
// PROTOTYPE ONLY: localStorage-based draft persistence (per browser, per device).
// Before production deployment with real country teams, this MUST be replaced
// with server-side persistence (Supabase) so drafts survive logout and follow
// the user across devices. See plan velvety-seeking-marble.md.
const DRAFT_VERSION = 3;
const draftKey = (country) => `trace-wizard-draft:${country}:v${DRAFT_VERSION}`;

function loadDraft(country) {
  try {
    const raw = localStorage.getItem(draftKey(country));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveDraft(country, payload) {
  try { localStorage.setItem(draftKey(country), JSON.stringify({ ...payload, savedAt: new Date().toISOString() })); } catch {}
}
function clearDraft(country) {
  try { localStorage.removeItem(draftKey(country)); } catch {}
}

const STEPS = [
  { id: "setup",     label: "1. Setup",              title: "Setup"                      },
  { id: "keyconsid", label: "2. Key Considerations", title: "Key Considerations"         },
  { id: "expenses",  label: "3. Expenses",           title: "Expenses"                   },
  { id: "revenue",   label: "4. Revenue",            title: "Regular Revenue"            },
  { id: "inKind",    label: "5. In-Kind",            title: "In-Kind Contributions"      },
  { id: "review",    label: "6. Review",             title: "Review & Submit"            },
];

export default function GuidedWizard({ country, data, onSave }) {
  // Hydrate from localStorage draft on mount (component is keyed by country in App.jsx)
  const draft = loadDraft(country);

  const [step, setStep]           = useState(() => draft?.step ?? 0);
  // Country's local currency from login — used to default the reporting currency
  // and to drive the static exchange-rate lookup.
  const localCurrencyCode = COUNTRY_CURRENCIES[country] || "USD";
  const localCurrency = CURRENCIES.find((c) => c.code === localCurrencyCode) || CURRENCIES[0];
  const [currency, setCurrency]   = useState(() =>
    CURRENCIES.find((c) => c.code === draft?.currencyCode) || localCurrency
  );
  const [inputMode, setInputMode] = useState(() => draft?.inputMode || "usd"); // "usd" | "local"
  const [unit, setUnit]           = useState(() => draft?.unit || "");
  // Static rate sourced from CurrencyContext (replaces the prior live fetch).
  // Rate is locked at submission time (`ratesAsOf` payload field). Country
  // teams see "as of [today]" in Setup.
  const [exchangeRate, setExchangeRate] = useState(() => CURRENCY_MAP[currency.code]?.rate ?? 1);

  const [hasRisks, setHasRisks] = useState(() => draft?.hasRisks || "");
  const [hasOpps,  setHasOpps]  = useState(() => draft?.hasOpps || "");
  const [riskText, setRiskText] = useState(() => draft?.riskText || "");
  const [oppText,  setOppText]  = useState(() => draft?.oppText || "");

  const [activityRows, setActivityRows] = useState(() => {
    if (draft?.activityRows) return draft.activityRows;
    const saved = data?.activities || [];
    return ACTIVITY_LIST.map((name) => {
      const existing = saved.find((a) => a.name === name);
      return existing
        ? { name, nearTerm: existing.nearTerm || "", longTerm: existing.longTerm || "", note: existing.note || "" }
        : { name, nearTerm: "", longTerm: "", note: "" };
    });
  });

  const [stepSources, setStepSources] = useState(() => draft?.stepSources || Array(STEPS.length).fill(""));
  const [stepNotes,   setStepNotes]   = useState(() => draft?.stepNotes   || Array(STEPS.length).fill(""));
  // Track which Expenses sub-tabs (Regular / Irregular) the user has visited.
  // Per Willyanne 2026-05-22: country teams must visit BOTH sub-tabs before
  // advancing from Step 3 → Revenue, so Irregular doesn't get silently skipped.
  // (Regular defaults to true since the user lands there on entry.)
  const [expVisitedIrregular, setExpVisitedIrregular] = useState(() => !!draft?.expVisitedIrregular);
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(draft?.savedAt || null);

  // Editable budget data — all stored in USD
  const [erEdits,      setErEdits]      = useState(() => draft?.erEdits      || { ...(data?.er    || {}) });
  const [feesEdits,    setFeesEdits]    = useState(() => draft?.feesEdits    || JSON.parse(JSON.stringify(data?.fees    || [])));
  const [irrProjEdits, setIrrProjEdits] = useState(() => draft?.irrProjEdits || JSON.parse(JSON.stringify(data?.irrProj || [])));
  const [ikRegEdits,   setIkRegEdits]   = useState(() => draft?.ikRegEdits   || { ...(data?.ikReg || {}) });
  const [ikIrrEdits,   setIkIrrEdits]   = useState(() => draft?.ikIrrEdits   || { ...(data?.ikIrr || {}) });

  // Autosave every state change. Synchronous localStorage write is fast for this payload size.
  useEffect(() => {
    if (submitted) return;
    saveDraft(country, {
      step, currencyCode: currency.code, inputMode, unit,
      hasRisks, hasOpps, riskText, oppText,
      activityRows, stepSources, stepNotes,
      erEdits, feesEdits, irrProjEdits, ikRegEdits, ikIrrEdits,
      expVisitedIrregular,
    });
    setDraftSavedAt(new Date().toISOString());
  }, [country, submitted, step, currency.code, inputMode, unit, hasRisks, hasOpps, riskText, oppText, activityRows, stepSources, stepNotes, erEdits, feesEdits, irrProjEdits, ikRegEdits, ikIrrEdits, expVisitedIrregular]);

  // Static exchange rate — recomputed when currency changes. Rates source: CurrencyContext map.
  useEffect(() => {
    setExchangeRate(CURRENCY_MAP[currency.code]?.rate ?? 1);
  }, [currency.code]);

  // Conversion helpers
  const canConvert = inputMode === "local" && currency.code !== "USD";
  const toDisplay  = (usd) => canConvert ? Math.round((usd || 0) * exchangeRate) : (usd || 0);
  const fromDisplay = (val) => canConvert ? val / exchangeRate : val;
  const displaySym  = canConvert ? currency.symbol : "$";
  const showAlt     = currency.code !== "USD";
  const altSym      = canConvert ? "$" : currency.symbol;
  const toAlt       = (usd) => canConvert ? (usd || 0) : Math.round((usd || 0) * exchangeRate);

  const displayCode = canConvert ? currency.code : "USD";
  const conv = { toDisplay, fromDisplay, displaySym, altSym, toAlt, showAlt, displayCode };

  const currentStep = STEPS[step];
  // Step 2 (Expenses) additionally requires the user to have visited the
  // Irregular sub-tab — without this, Regular alone lets them skip Irregular.
  const sourcesNotesOk = stepSources[step].trim().length > 0 && stepNotes[step].trim().length > 0;
  const expensesSubtabsOk = step !== 2 || expVisitedIrregular;
  const canAdvance = sourcesNotesOk && expensesSubtabsOk;
  const advanceBlockReason = !sourcesNotesOk
    ? "Fill in data source and notes to continue"
    : !expensesSubtabsOk
      ? "Open the Irregular sub-tab before advancing"
      : "";

  function updateActivity(i, field, val) {
    setActivityRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto", background: "#fff", borderRadius: 12, padding: "40px 32px", border: "1px solid #dde", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, color: C.navy, marginBottom: 10 }}>Data submitted!</h2>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
          Your responses have been recorded. Use the Overview and other tabs to review your country's data.
        </p>
        <button
          onClick={() => { setStep(0); setSubmitted(false); }}
          style={{ marginTop: 20, background: C.teal, color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600 }}
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "16px 22px", color: "#fff", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Guided Wizard — {country}</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Enter data step by step. Each step requires a data source and notes before advancing.</div>
      </div>

      {/* Autosave indicator — PROTOTYPE: local browser only; replace with server-side drafts before production */}
      {draftSavedAt && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: C.blueGrey, marginBottom: 14, padding: "0 4px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
          <span>
            Draft autosaved at {new Date(draftSavedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            <span style={{ marginLeft: 8, fontStyle: "italic", color: "#999" }}>(prototype: saved to this browser only)</span>
          </span>
          <button
            onClick={() => {
              if (window.confirm("Clear your saved draft and start over? This cannot be undone.")) {
                clearDraft(country);
                window.location.reload();
              }
            }}
            style={{ marginLeft: "auto", background: "transparent", border: "none", color: C.red, fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Clear draft
          </button>
        </div>
      )}

      {/* Step progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => i < step && setStep(i)}
            style={{
              flex: "1 1 auto", padding: "6px 4px", fontSize: 11, borderRadius: 5,
              background: i === step ? C.teal : i < step ? C.darkNavy : "#dde",
              color: i <= step ? "#fff" : C.blueGrey,
              fontWeight: i === step ? 700 : 400,
              whiteSpace: "nowrap", cursor: i < step ? "pointer" : "default", minHeight: 36,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #dde", overflow: "hidden" }}>
        <div style={{ background: C.lightBG, padding: "12px 20px", fontSize: 15, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>
          {currentStep.title}
        </div>
        <div style={{ padding: "20px 22px" }}>

          <StepInstructions stepInstructions={WIZARD_STEP_INSTRUCTIONS[currentStep.id]} />

          {step === 0 && (
            <StepSetup
              country={country}
              localCurrency={localCurrency}
              currency={currency}
              inputMode={inputMode} onInputModeChange={setInputMode}
              exchangeRate={exchangeRate}
              unit={unit} onUnitChange={setUnit}
            />
          )}
          {step === 1 && (
            <KeyConsiderationsStep
              hasRisks={hasRisks} setHasRisks={setHasRisks}
              hasOpps={hasOpps}   setHasOpps={setHasOpps}
              riskText={riskText} setRiskText={setRiskText}
              oppText={oppText}   setOppText={setOppText}
              activityRows={activityRows} onUpdateActivity={updateActivity}
            />
          )}
          {step === 2 && (
            <ExpensesStep
              conv={conv}
              erEdits={erEdits} setErEdits={setErEdits}
              irrProjEdits={irrProjEdits} setIrrProjEdits={setIrrProjEdits}
              onIrregularVisited={() => setExpVisitedIrregular(true)}
              visitedIrregular={expVisitedIrregular}
            />
          )}
          {step === 3 && <StepRevenue conv={conv} feesEdits={feesEdits} setFeesEdits={setFeesEdits} />}
          {step === 4 && <StepInKind  conv={conv} ikRegEdits={ikRegEdits} setIkRegEdits={setIkRegEdits} ikIrrEdits={ikIrrEdits} setIkIrrEdits={setIkIrrEdits} />}
          {step === 5 && <StepReview  country={country} activityRows={activityRows} currency={currency} erEdits={erEdits} feesEdits={feesEdits} />}

          {/* Sources & Notes — required on every step except review */}
          {step < STEPS.length - 1 && (
            <div style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Required before advancing</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data source <span style={{ color: C.red }}>*</span></label>
                  <textarea
                    value={stepSources[step]}
                    onChange={(e) => setStepSources((s) => s.map((v, i) => i === step ? e.target.value : v))}
                    placeholder="List your data source (document name, date, URL, or page reference)..."
                    style={textareaStyle} rows={2}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Notes / calculations <span style={{ color: C.red }}>*</span></label>
                  <textarea
                    value={stepNotes[step]}
                    onChange={(e) => setStepNotes((s) => s.map((v, i) => i === step ? e.target.value : v))}
                    placeholder="Add any notes, assumptions, or calculations relevant to this step..."
                    style={textareaStyle} rows={2}
                  />
                </div>
                {!sourcesNotesOk && (
                  <div style={{ fontSize: 12, color: C.red, fontStyle: "italic" }}>
                    Please fill in both the data source and notes to continue.
                  </div>
                )}
                {sourcesNotesOk && !expensesSubtabsOk && (
                  <div style={{ fontSize: 12, color: C.red, fontStyle: "italic" }}>
                    Open the <strong>Irregular</strong> sub-tab and review it before continuing to Revenue.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{ ...navBtnStyle, background: step === 0 ? "#dde" : C.blueGrey, color: step === 0 ? "#aaa" : "#fff" }}
        >
          ← Previous
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canAdvance && setStep((s) => s + 1)}
            disabled={!canAdvance}
            title={advanceBlockReason}
            style={{ ...navBtnStyle, background: canAdvance ? C.teal : "#ccc", color: "#fff", cursor: canAdvance ? "pointer" : "not-allowed" }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={async () => {
              setSaving(true);
              const ikRegFinal = {
                ...ikRegEdits,
                total: (ikRegEdits.federal || 0) + (ikRegEdits.institutional || 0) + (ikRegEdits.other || 0),
              };
              const updates = {
                activities:  activityRows,
                hasRisks, riskText, hasOpps, oppText,
                unit,
                currencyCode: currency.code,
                ratesAsOf:    new Date().toISOString(),
                er:      erEdits,
                fees:    feesEdits,
                revFees: feesEdits.reduce((s, f) => s + (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo, 0),
                irrProj: irrProjEdits,
                ei:      { proj: irrProjEdits.reduce((s, p) => s + (p.amount || 0), 0) },
                ikReg:   ikRegFinal,
                ikIrr:   ikIrrEdits,
              };
              if (onSave) await onSave(updates);
              clearDraft(country);
              setSaving(false);
              setSubmitted(true);
            }}
            disabled={saving}
            style={{ ...navBtnStyle, background: saving ? C.blueGrey : C.green, color: "#fff" }}
          >
            {saving ? "Saving…" : "Submit ✓"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepSetup({ country, localCurrency, currency, inputMode, onInputModeChange, exchangeRate, unit, onUnitChange }) {
  const asOfDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={descStyle}>Confirm your unit and currency settings below. Country is set by your login.</p>

      {/* Unit selector — 4-button segmented control (workbook dropdown values) */}
      <div>
        <label style={labelStyle}>Unit <span style={{ color: C.red }}>*</span></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 0, border: `1px solid #dde`, borderRadius: 8, overflow: "hidden", marginTop: 6 }}>
          {UNIT_OPTIONS.map((opt, i) => {
            const isActive = unit === opt;
            return (
              <button
                key={opt}
                onClick={() => onUnitChange(opt)}
                style={{
                  flex: "1 1 0",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : C.navy,
                  background: isActive ? C.teal : "#f4f6f8",
                  border: "none",
                  borderLeft: i > 0 ? `1px solid #dde` : "none",
                  cursor: "pointer",
                  minHeight: 44,
                  whiteSpace: "nowrap",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Local currency — fixed by country login */}
      <div>
        <label style={labelStyle}>Local currency</label>
        <div style={{ marginTop: 6, padding: "10px 14px", background: "#f4f6f8", border: `1px solid #dde`, borderRadius: 8, fontSize: 14, color: C.navy }}>
          <strong>{localCurrency.code}</strong> · {localCurrency.name} ({localCurrency.symbol})
          <div style={{ fontSize: 11, color: C.blueGrey, marginTop: 4 }}>
            Set by your country login ({country}). Contact MRCT Center to change.
          </div>
        </div>
      </div>

      {/* Enter amounts in — USD / Local toggle */}
      <div>
        <label style={labelStyle}>Enter amounts in</label>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          {[
            { val: "usd",   label: "US Dollars ($)" },
            { val: "local", label: `${localCurrency.code} (${localCurrency.symbol})` },
          ].map((opt) => {
            const disabled = opt.val === "local" && currency.code === "USD";
            return (
              <button
                key={opt.val}
                onClick={() => !disabled && onInputModeChange(opt.val)}
                disabled={disabled}
                style={{
                  ...toggleBtnStyle,
                  background: inputMode === opt.val ? C.teal : "#f4f6f8",
                  color: inputMode === opt.val ? "#fff" : C.navy,
                  border: `1px solid ${inputMode === opt.val ? C.teal : "#dde"}`,
                  opacity: disabled ? 0.45 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {currency.code !== "USD" && (
          <div style={{ marginTop: 12, background: "#eef8f4", border: `1px solid ${C.teal}`, borderRadius: 7, padding: "10px 14px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
              Exchange rate: 1 USD = {exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency.code}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 3, lineHeight: 1.5 }}>
              Fixed rate — as of {asOfDate}. This rate is locked into your submission so amounts stay consistent over time.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRisks({ hasRisks, onHasRisks, hasOpps, onHasOpps, riskText, onRiskText, oppText, onOppText }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={descStyle}>Do you expect any major financial risks or opportunities in the next year? These may include political instability, currency changes, loss or gain of international funding, or changes in research activity volume.</p>
      <div>
        <label style={labelStyle}>Do you expect major financial risks in the next year?</label>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["Yes", "No"].map((opt) => (
            <button key={opt} onClick={() => onHasRisks(opt.toLowerCase())}
              style={{ ...toggleBtnStyle, background: hasRisks === opt.toLowerCase() ? C.red : "#f4f6f8", color: hasRisks === opt.toLowerCase() ? "#fff" : C.navy, border: `1px solid ${hasRisks === opt.toLowerCase() ? C.red : "#dde"}` }}>
              {opt}
            </button>
          ))}
        </div>
        {hasRisks === "yes" && (
          <textarea value={riskText} onChange={(e) => onRiskText(e.target.value)}
            placeholder="Describe the risks and how significantly you think they will impact ethics review..."
            style={{ ...textareaStyle, marginTop: 10 }} rows={3} />
        )}
      </div>
      <div>
        <label style={labelStyle}>Do you expect major financial opportunities in the next year?</label>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["Yes", "No"].map((opt) => (
            <button key={opt} onClick={() => onHasOpps(opt.toLowerCase())}
              style={{ ...toggleBtnStyle, background: hasOpps === opt.toLowerCase() ? C.teal : "#f4f6f8", color: hasOpps === opt.toLowerCase() ? "#fff" : C.navy, border: `1px solid ${hasOpps === opt.toLowerCase() ? C.teal : "#dde"}` }}>
              {opt}
            </button>
          ))}
        </div>
        {hasOpps === "yes" && (
          <textarea value={oppText} onChange={(e) => onOppText(e.target.value)}
            placeholder="Describe the opportunities and how significantly you think they will impact ethics review..."
            style={{ ...textareaStyle, marginTop: 10 }} rows={3} />
        )}
      </div>
    </div>
  );
}

// ─── Step 3 sub-tab: Regular Expenses (workbook-driven, locked items) ──────────

// Sum item values for a list of keys, skipping null/undefined (blank ≠ 0).
function sumKeys(erEdits, keys) {
  let total = 0;
  for (const k of keys) {
    const v = erEdits[k];
    if (v === null || v === undefined || v === "") continue;
    total += Number(v) || 0;
  }
  return total;
}

// Locked-display formatter — renders blank when value is null/undefined.
function formatLocked(val, conv) {
  if (val === null || val === undefined || val === "") return <span style={{ color: "#bbb" }}>—</span>;
  return <>{conv.altSym} {Math.round(conv.toAlt(val)).toLocaleString()}</>;
}

// Numeric input that preserves the blank-vs-0 distinction.
// - Blank input → onChangeUSD(undefined)
// - "0" → onChangeUSD(0)
// - "123" → onChangeUSD(123 / convertedFromDisplay)
function BlankableAmountInput({ usdVal, conv, onChangeUSD }) {
  const isBlank = usdVal === null || usdVal === undefined || usdVal === "";
  const displayVal = isBlank ? "" : Math.round(conv.toDisplay(usdVal));
  return (
    <input
      type="number" min="0"
      value={displayVal}
      placeholder=""
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") { onChangeUSD(undefined); return; }
        const parsed = parseFloat(raw);
        if (Number.isNaN(parsed)) { onChangeUSD(undefined); return; }
        onChangeUSD(conv.fromDisplay(parsed));
      }}
      style={{ width: "100%", border: "1px solid #ccc", borderRadius: 4, padding: "5px 7px", fontSize: 13, textAlign: "right", fontFamily: "monospace" }}
    />
  );
}

function StepExpensesRegular({ conv, erEdits, setErEdits }) {
  const grandTotal = EXPENSES_REGULAR_KEYS_ALL.reduce(
    (s, k) => {
      const v = erEdits[k];
      if (v === null || v === undefined || v === "") return s;
      return s + (Number(v) || 0);
    },
    0,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>
        Enter your committee's regular annual expenses below. The categories and items are pre-populated from the TRACE Financial Workbook — they are locked so country teams report on a consistent set.
        Click the <strong>i</strong> next to any item for its description. Leave an amount <em>blank</em> if it doesn't apply; enter <em>0</em> only if the actual amount is zero.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
          <thead>
            <tr style={{ background: C.lightBG }}>
              <th style={thStyle}>Item</th>
              <th style={{ ...thStyle, textAlign: "right", width: 160 }}>
                Amount ({conv.displayCode === "USD" ? "US Dollars" : conv.displayCode})
              </th>
              {conv.showAlt && (
                <th style={{ ...thStyle, textAlign: "right", width: 140 }}>≈ ({conv.altSym})</th>
              )}
            </tr>
          </thead>
          <tbody>
            {EXPENSES_REGULAR.map((cat) => {
              const catKeys = cat.items.map((i) => i.key);
              const catTotal = sumKeys(erEdits, catKeys);
              return (
                <ExpenseCategoryRows
                  key={cat.categoryKey}
                  cat={cat}
                  catTotal={catTotal}
                  catKeys={catKeys}
                  erEdits={erEdits}
                  setErEdits={setErEdits}
                  conv={conv}
                />
              );
            })}
            <tr style={{ fontWeight: 700, background: C.lightBG, borderTop: `2px solid ${C.navy}` }}>
              <td style={{ padding: "11px 12px", fontSize: 14, color: C.navy }}>TOTAL</td>
              <td style={{ padding: "11px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 14, color: C.navy }}>
                {conv.displaySym}{conv.toDisplay(grandTotal).toLocaleString()}
              </td>
              {conv.showAlt && (
                <td style={{ padding: "11px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: C.blueGrey }}>
                  {conv.altSym} {Math.round(conv.toAlt(grandTotal)).toLocaleString()}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseCategoryRows({ cat, catTotal, erEdits, setErEdits, conv }) {
  return (
    <>
      <tr>
        <td colSpan={conv.showAlt ? 3 : 2} style={{ background: "#e8eef2", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {cat.categoryLabel}
        </td>
      </tr>
      {cat.items.map((item) => {
        const v = erEdits[item.key];
        return (
          <tr key={item.key} style={{ borderBottom: "1px solid #f0f0f0" }}>
            <td style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 4 }}>
              <span>{item.label}</span>
              <InfoTip title={item.label}>{item.description}</InfoTip>
            </td>
            <td style={{ padding: "5px 10px" }}>
              <BlankableAmountInput
                usdVal={v}
                conv={conv}
                onChangeUSD={(nv) => setErEdits((prev) => ({ ...prev, [item.key]: nv }))}
              />
            </td>
            {conv.showAlt && (
              <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: C.blueGrey }}>
                {formatLocked(v, conv)}
              </td>
            )}
          </tr>
        );
      })}
      <tr style={{ background: "#f9fafb", fontWeight: 600 }}>
        <td style={{ padding: "7px 12px", fontSize: 12, color: C.blueGrey, fontStyle: "italic" }}>Subtotal — {cat.categoryLabel}</td>
        <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: C.navy }}>
          {conv.displaySym}{conv.toDisplay(catTotal).toLocaleString()}
        </td>
        {conv.showAlt && (
          <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: C.blueGrey }}>
            {conv.altSym} {Math.round(conv.toAlt(catTotal)).toLocaleString()}
          </td>
        )}
      </tr>
    </>
  );
}

// Flat list of all 27 workbook item keys — used for grand-total sums.
const EXPENSES_REGULAR_KEYS_ALL = EXPENSES_REGULAR.flatMap((c) => c.items.map((i) => i.key));

// ─── Step 3 / Irregular sub-tab ────────────────────────────────────────────────
// Table mirrors workbook Expenses_irregular sheet (rows D4–D15) — 12 default
// rows grouped by category, each editable. Item cells use truncate + "See more"
// for long workbook descriptions. Country teams can add rows beyond the 12 via
// "+ Add item" under each category.

const ITEM_TRUNCATE_AT = 60;

// Editable item cell — truncated to ITEM_TRUNCATE_AT chars in read state, with
// a "See more" link when overflowing. Click → multi-line textarea opens inline
// for editing. Click outside → collapses back. Empty cells show a "(blank — click to enter item)" hint.
function IrregularItemCell({ value, onChange, descriptionExample }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  // Sync external value changes (e.g. when a row above is deleted) into local draft
  useEffect(() => { if (!editing) setDraft(value || ""); }, [value, editing]);

  const overflows = (value || "").length > ITEM_TRUNCATE_AT;
  const truncated = overflows ? value.slice(0, ITEM_TRUNCATE_AT).trimEnd() + "…" : (value || "");

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    return (
      <div style={{ position: "relative" }}>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={Math.min(8, Math.max(3, Math.ceil((draft.length || 1) / 70)))}
          style={{
            width: "100%",
            border: `1px solid ${C.teal}`,
            borderRadius: 5,
            padding: "6px 8px",
            fontSize: 13,
            fontFamily: "inherit",
            lineHeight: 1.45,
            resize: "vertical",
            outline: "none",
            background: "#fff",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          <button
            onClick={(e) => { e.preventDefault(); commit(); }}
            style={{ background: "transparent", border: "none", color: C.teal, fontSize: 11, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            See less
          </button>
        </div>
      </div>
    );
  }

  const isBlank = !value;
  return (
    <div
      onClick={() => setEditing(true)}
      title={value || ""}
      style={{ cursor: "pointer", lineHeight: 1.45, fontSize: 13, color: isBlank ? "#aaa" : C.navy, fontStyle: isBlank ? "italic" : "normal" }}
    >
      {isBlank ? "(blank — click to enter item)" : truncated}
      {overflows && (
        <>
          {" "}
          <span
            style={{ color: C.teal, textDecoration: "underline", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}
          >
            See more
          </span>
        </>
      )}
      {descriptionExample && (
        <span style={{ marginLeft: 6, verticalAlign: "middle" }} onClick={(e) => e.stopPropagation()}>
          <InfoTip title="Example description (from workbook)">{descriptionExample}</InfoTip>
        </span>
      )}
    </div>
  );
}

// Simple text/select input for funder + dates.
function IrregularTextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: "5px 7px",
        fontSize: 12,
        fontFamily: "inherit",
        background: "#fff",
      }}
    />
  );
}

function StepExpensesIrregular({ conv, irrProjEdits, setIrrProjEdits }) {
  // Hydrate to workbook defaults if irrProjEdits is empty or in legacy shape.
  // (App.jsx's merge guard handles this on load; this is a safety net.)
  useEffect(() => {
    if (!irrProjEdits || irrProjEdits.length === 0 || irrProjEdits.some((r) => r && r.category === undefined)) {
      setIrrProjEdits(JSON.parse(JSON.stringify(EXPENSES_IRREGULAR_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRow = (idx, patch) => {
    setIrrProjEdits((rows) => rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const addRow = (category) => {
    setIrrProjEdits((rows) => [
      ...rows,
      { category, item: "", funder: "", amount: null, startDate: "", endDate: "", descriptionExample: "" },
    ]);
  };
  const deleteRow = (idx) => {
    setIrrProjEdits((rows) => rows.filter((_, i) => i !== idx));
  };

  const grandTotal = (irrProjEdits || []).reduce((s, r) => {
    const v = r?.amount;
    if (v === null || v === undefined || v === "") return s;
    return s + (Number(v) || 0);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={descStyle}>
        Irregular expenses are one-time or infrequent large costs — vehicles, building works,
        IT upgrades, one-off projects funded by grants or reserves.
        The categories and pre-filled items below are drawn from the TRACE Financial Workbook (rows D4–D15).
        <strong> All cells are editable</strong> — including the item description. Click any row to add a new item under that category.
        Click <em>See more</em> on long items to read and edit the full text.
      </p>

      {IRREGULAR_CATEGORIES.map((cat) => {
        const rowsInCat = (irrProjEdits || [])
          .map((r, idx) => ({ row: r, idx }))
          .filter(({ row }) => row?.category === cat);
        const catTotal = rowsInCat.reduce((s, { row }) => s + (Number(row?.amount) || 0), 0);

        return (
          <div key={cat} style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: C.lightBG, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>
              {cat}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 880 }}>
                <thead>
                  <tr style={{ background: "#f8fafb" }}>
                    <th style={{ ...thStyle, width: 32 }}>#</th>
                    <th style={{ ...thStyle, minWidth: 320 }}>Item</th>
                    <th style={{ ...thStyle, textAlign: "right", width: 130 }}>
                      Amount ({conv.displayCode === "USD" ? "US Dollars" : conv.displayCode})
                    </th>
                    {conv.showAlt && (
                      <th style={{ ...thStyle, textAlign: "right", width: 110 }}>≈ ({conv.altSym})</th>
                    )}
                    <th style={{ ...thStyle, width: 160 }}>Funding source</th>
                    <th style={{ ...thStyle, width: 130 }}>Start date</th>
                    <th style={{ ...thStyle, width: 130 }}>End date</th>
                    <th style={{ ...thStyle, width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rowsInCat.length === 0 && (
                    <tr>
                      <td colSpan={conv.showAlt ? 8 : 7} style={{ padding: "14px 12px", fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center" }}>
                        No items yet — use the + Add item button below.
                      </td>
                    </tr>
                  )}
                  {rowsInCat.map(({ row, idx }, displayIdx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
                      <td style={{ padding: "10px 10px", fontSize: 12, color: C.blueGrey, fontFamily: "monospace" }}>
                        {displayIdx + 1}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <IrregularItemCell
                          value={row.item}
                          onChange={(v) => updateRow(idx, { item: v })}
                          descriptionExample={row.descriptionExample}
                        />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <BlankableAmountInput
                          usdVal={row.amount}
                          conv={conv}
                          onChangeUSD={(v) => updateRow(idx, { amount: v ?? null })}
                        />
                      </td>
                      {conv.showAlt && (
                        <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontSize: 11, color: C.blueGrey }}>
                          {formatLocked(row.amount, conv)}
                        </td>
                      )}
                      <td style={{ padding: "8px 10px" }}>
                        <IrregularTextInput
                          value={row.funder}
                          onChange={(v) => updateRow(idx, { funder: v })}
                          placeholder="e.g. Gates Foundation"
                        />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <IrregularTextInput
                          value={row.startDate}
                          onChange={(v) => updateRow(idx, { startDate: v })}
                          placeholder="MM/YYYY"
                        />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <IrregularTextInput
                          value={row.endDate}
                          onChange={(v) => updateRow(idx, { endDate: v })}
                          placeholder="MM/YYYY"
                        />
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "center" }}>
                        <button
                          onClick={() => deleteRow(idx)}
                          title="Delete this row"
                          style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#fafbfc" }}>
                    <td colSpan={conv.showAlt ? 8 : 7} style={{ padding: "8px 10px" }}>
                      <button
                        onClick={() => addRow(cat)}
                        style={{
                          background: "transparent",
                          border: `1px dashed ${C.teal}`,
                          color: C.teal,
                          borderRadius: 5,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        + Add item
                      </button>
                      <span style={{ marginLeft: 14, fontSize: 11, color: C.blueGrey, fontStyle: "italic" }}>
                        Category subtotal: <strong style={{ color: C.navy, fontFamily: "monospace" }}>${catTotal.toLocaleString()}</strong>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div style={{ background: C.navy, color: "#fff", padding: "12px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total irregular expenses (USD)</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          ${grandTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function StepRevenue({ conv, feesEdits, setFeesEdits }) {
  function updateFee(i, field, raw) {
    const val = parseFloat(raw) || 0;
    setFeesEdits((rows) => rows.map((f, idx) => idx === i ? { ...f, [field]: field === "ctPro" || field === "ctStu" ? val : conv.fromDisplay(val) } : f));
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>Enter fee amounts and review counts for each fee type. Revenue is computed automatically.</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
          <thead>
            <tr style={{ background: C.lightBG }}>
              <th style={thStyle}>Review type</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Pro fee ({conv.displaySym})</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Pro count</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Stu fee ({conv.displaySym})</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Stu count</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Revenue (USD)</th>
            </tr>
          </thead>
          <tbody>
            {feesEdits.map((f, i) => {
              const rev = (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo;
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 10px" }}>{f.type}</td>
                  <td style={{ padding: "4px 10px" }}>
                    <NumInput val={Math.round(conv.toDisplay(f.ind))} onChange={(v) => updateFee(i, "ind", v)} />
                  </td>
                  <td style={{ padding: "4px 10px" }}>
                    <NumInput val={f.ctPro || 0} onChange={(v) => updateFee(i, "ctPro", v)} isCount />
                  </td>
                  <td style={{ padding: "4px 10px" }}>
                    <NumInput val={Math.round(conv.toDisplay(f.ngo))} onChange={(v) => updateFee(i, "ngo", v)} />
                  </td>
                  <td style={{ padding: "4px 10px" }}>
                    <NumInput val={f.ctStu || 0} onChange={(v) => updateFee(i, "ctStu", v)} isCount />
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                    ${rev.toLocaleString()}
                  </td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: 700, background: "#f8f8f8" }}>
              <td colSpan={5} style={{ padding: "9px 12px" }}>Total Revenue</td>
              <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>
                ${feesEdits.reduce((s, f) => s + (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo, 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 12, color: C.blueGrey, fontStyle: "italic" }}>Revenue is always shown in USD. Fee amounts convert based on your currency selection above.</div>
    </div>
  );
}

function StepIrregular({ conv, irrProjEdits, setIrrProjEdits, data }) {
  const riEntries = Object.entries(data?.ri || {}).filter(([, v]) => v > 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={descStyle}>Irregular expenses are project-based costs funded by grants. Irregular revenue includes grants and other time-limited funding.</p>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>Irregular Expenses</div>
      {irrProjEdits.length === 0
        ? <p style={{ fontSize: 13, color: C.blueGrey }}>No irregular expenses recorded.</p>
        : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.lightBG }}>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>Funder</th>
                <th style={{ ...thStyle, textAlign: "right", width: 160 }}>Amount ({conv.displayCode})</th>
              </tr>
            </thead>
            <tbody>
              {irrProjEdits.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 10px" }}>{p.name}</td>
                  <td style={{ padding: "8px 10px" }}>{p.funder}</td>
                  <td style={{ padding: "4px 10px" }}>
                    <AmountInput
                      usdVal={p.amount || 0} conv={conv}
                      onChangeUSD={(v) => setIrrProjEdits((rows) => rows.map((r, idx) => idx === i ? { ...r, amount: v } : r))}
                    />
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: "#f8f8f8" }}>
                <td colSpan={2} style={{ padding: "9px 12px" }}>Total</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>
                  {conv.displaySym}{conv.toDisplay(irrProjEdits.reduce((s, p) => s + (p.amount || 0), 0)).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        )
      }
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginTop: 8 }}>Irregular Revenue</div>
      {riEntries.length === 0
        ? <p style={{ fontSize: 13, color: C.blueGrey }}>No irregular revenue recorded.</p>
        : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {riEntries.map(([k, v]) => (
              <div key={k} style={{ background: "#f4f6f8", borderRadius: 7, padding: "10px 14px", flex: "1 1 120px" }}>
                <div style={{ fontSize: 12, color: C.blueGrey, textTransform: "capitalize" }}>{k}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.purple }}>${v?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function StepInKind({ conv, ikRegEdits, setIkRegEdits, ikIrrEdits, setIkIrrEdits }) {
  const ikRegTotal = (ikRegEdits.federal || 0) + (ikRegEdits.institutional || 0) + (ikRegEdits.other || 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>In-kind contributions are non-cash support — staff time, equipment, office space — donated by external organizations. They are tracked separately and do not affect the cash gap.</p>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>Regular In-Kind</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.lightBG }}>
            <th style={thStyle}>Category</th>
            <th style={{ ...thStyle, textAlign: "right", width: 160 }}>Amount ({conv.displayCode})</th>
          </tr>
        </thead>
        <tbody>
          {[["federal", "Federal"], ["institutional", "Institutional"], ["other", "Other"]].map(([key, label]) => (
            <tr key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "9px 12px" }}>{label}</td>
              <td style={{ padding: "6px 12px" }}>
                <AmountInput usdVal={ikRegEdits[key] || 0} conv={conv}
                  onChangeUSD={(v) => setIkRegEdits((e) => ({ ...e, [key]: v }))} />
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, background: "#f8f8f8" }}>
            <td style={{ padding: "9px 12px" }}>Total (auto)</td>
            <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>
              {conv.displaySym}{conv.toDisplay(ikRegTotal).toLocaleString()}
              {conv.showAlt && <div style={{ fontSize: 11, color: C.blueGrey, fontWeight: 400 }}>≈ {conv.altSym} {Math.round(conv.toAlt(ikRegTotal)).toLocaleString()}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginTop: 4 }}>Irregular In-Kind</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
            <td style={{ padding: "9px 12px" }}>Total</td>
            <td style={{ padding: "6px 12px" }}>
              <AmountInput usdVal={ikIrrEdits.total || 0} conv={conv}
                onChangeUSD={(v) => setIkIrrEdits((e) => ({ ...e, total: v }))} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function StepActivities({ rows, onUpdate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={descStyle}>For each activity, select whether you expect effort to remain the same, increase, or decrease — in the near term (next year) and long term (3–5 years). Hover over an activity name for its full description.</p>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px 10px", padding: "6px 0", fontSize: 11, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase" }}>
        <span>Activity</span><span>Near-term</span><span>Long-term</span>
      </div>
      {rows.map((row, i) => (
        <div key={row.name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px 10px", alignItems: "start", padding: "10px", background: i % 2 === 0 ? "#f9f9fb" : "#fff", borderRadius: 7 }}>
          <div title={ACTIVITY_DESCRIPTIONS[row.name] || row.name} style={{ fontSize: 13, color: C.navy, cursor: "help", lineHeight: 1.4 }}>{row.name}</div>
          <TrendSelect val={row.nearTerm} onChange={(v) => onUpdate(i, "nearTerm", v)} />
          <TrendSelect val={row.longTerm} onChange={(v) => onUpdate(i, "longTerm", v)} />
        </div>
      ))}
    </div>
  );
}

function TrendSelect({ val, onChange }) {
  const color = val === "Increase" ? C.teal : val === "Decrease" ? C.orange : C.blueGrey;
  return (
    <select value={val} onChange={(e) => onChange(e.target.value)}
      style={{ ...selectStyle, fontSize: 12, color, fontWeight: val ? 600 : 400, borderColor: val ? color : "#dde" }}>
      <option value="">Select…</option>
      {TREND_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── Sub-tab container ────────────────────────────────────────────────────────

function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: `2px solid ${C.teal}`, paddingLeft: 2 }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "11px 22px",
              fontSize: 14,
              fontWeight: isActive ? 700 : 600,
              color: isActive ? "#fff" : C.navy,
              background: isActive ? C.teal : "#eef2f5",
              border: `1px solid ${isActive ? C.teal : "#cdd5dc"}`,
              borderBottom: isActive ? `1px solid ${C.teal}` : `1px solid ${C.teal}`,
              borderRadius: "8px 8px 0 0",
              marginBottom: -2,
              cursor: "pointer",
              whiteSpace: "nowrap",
              minHeight: 42,
              boxShadow: isActive ? "0 -1px 0 rgba(0,0,0,0.04)" : "none",
              transition: "background 120ms ease",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 2: Key Considerations (sub-tabs: Risks & Opps | Activities) ─────────

function KeyConsiderationsStep({ hasRisks, setHasRisks, hasOpps, setHasOpps, riskText, setRiskText, oppText, setOppText, activityRows, onUpdateActivity }) {
  const [sub, setSub] = useState("risks");
  return (
    <div>
      <SubTabs
        tabs={[
          { id: "risks",      label: "Risks & Opportunities" },
          { id: "activities", label: "Activities" },
        ]}
        active={sub} onChange={setSub}
      />
      {sub === "risks" && (
        <StepRisks
          hasRisks={hasRisks} onHasRisks={setHasRisks}
          hasOpps={hasOpps}   onHasOpps={setHasOpps}
          riskText={riskText} onRiskText={setRiskText}
          oppText={oppText}   onOppText={setOppText}
        />
      )}
      {sub === "activities" && (
        <StepActivitiesSubTab rows={activityRows} onUpdate={onUpdateActivity} />
      )}
    </div>
  );
}

// Activities sub-tab — read-only workbook context on top + per-activity entry below.
// Per Willyanne 2026-05-21: "they need to understand what we are paying for, what we are
// doing, the scope of the work."
function StepActivitiesSubTab({ rows, onUpdate }) {
  const [showContext, setShowContext] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#eef8f4", border: `1px solid ${C.teal}`, borderRadius: 8, overflow: "hidden" }}>
        <button
          onClick={() => setShowContext((v) => !v)}
          style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
            What activities does ethics review cover? (read-only context)
          </span>
          <span style={{ fontSize: 12, color: C.teal }}>{showContext ? "▼ Hide" : "▶ Show"}</span>
        </button>
        {showContext && (
          <div style={{ padding: "4px 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.55, margin: "0 0 6px 0", fontStyle: "italic" }}>
              The 12 activities below are the canonical scope of ethics review per the TRACE workbook.
              Skim these first, then use the table below to share how you expect effort on each to change in the near and long term.
            </p>
            {ACTIVITY_LIST.map((name) => (
              <div key={name} style={{ background: "#fff", borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{name}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 3, lineHeight: 1.55 }}>{ACTIVITY_DESCRIPTIONS[name]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginTop: 4 }}>
        Your activity expectations
      </div>
      <StepActivities rows={rows} onUpdate={onUpdate} />
    </div>
  );
}

// ─── Step 3: Expenses (sub-tabs: Regular | Irregular) ─────────────────────────

function ExpensesStep({ conv, erEdits, setErEdits, irrProjEdits, setIrrProjEdits, onIrregularVisited, visitedIrregular }) {
  const [sub, setSub] = useState("regular");
  const handleSubChange = (id) => {
    setSub(id);
    if (id === "irregular" && onIrregularVisited) onIrregularVisited();
  };
  return (
    <div>
      <SubTabs
        tabs={[
          { id: "regular",   label: "Regular" },
          { id: "irregular", label: visitedIrregular ? "Irregular" : "Irregular •" },
        ]}
        active={sub} onChange={handleSubChange}
      />
      {sub === "regular" && (
        <StepExpensesRegular conv={conv} erEdits={erEdits} setErEdits={setErEdits} />
      )}
      {sub === "irregular" && (
        <StepExpensesIrregular conv={conv} irrProjEdits={irrProjEdits} setIrrProjEdits={setIrrProjEdits} />
      )}
    </div>
  );
}

function StepReview({ country, activityRows, currency, erEdits, feesEdits }) {
  const filledActivities = activityRows.filter((r) => r.nearTerm && r.longTerm);
  const totalExpenses = Object.values(erEdits).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalRevenue  = feesEdits.reduce((s, f) => s + (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={descStyle}>Review your responses before submitting. Submitting will save all changes to the TRACE database.</p>
      <div style={{ background: C.lightBG, borderRadius: 8, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Summary</div>
        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.9 }}>
          <div>Country: <strong>{country}</strong></div>
          <div>Currency: <strong>{currency.code} ({currency.symbol})</strong></div>
          <div>Total regular expenses: <strong>${totalExpenses.toLocaleString()}</strong></div>
          <div>Total fee revenue: <strong>${totalRevenue.toLocaleString()}</strong></div>
          <div>Activities filled in: <strong>{filledActivities.length} / {activityRows.length}</strong></div>
        </div>
      </div>
      {filledActivities.length < activityRows.length && (
        <div style={{ background: "#fff8e8", border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#5a4000" }}>
          {activityRows.length - filledActivities.length} activities don't have both near-term and long-term selections. You can go back to complete them or submit now.
        </div>
      )}
      <div style={{ fontSize: 13, color: C.blueGrey, fontStyle: "italic" }}>Click "Submit ✓" to save this wizard entry.</div>
    </div>
  );
}

// ─── Shared input components ──────────────────────────────────────────────────

function AmountInput({ usdVal, onChangeUSD, conv }) {
  const displayVal = Math.round(conv.toDisplay(usdVal));
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
        <span style={{ fontSize: 12, color: C.blueGrey, fontFamily: "monospace" }}>{conv.displaySym}</span>
        <input
          type="number" min="0"
          value={displayVal}
          onChange={(e) => onChangeUSD(conv.fromDisplay(parseFloat(e.target.value) || 0))}
          style={{ width: 110, border: "1px solid #ccc", borderRadius: 4, padding: "4px 6px", fontSize: 13, textAlign: "right", fontFamily: "monospace" }}
        />
      </div>
      {conv.showAlt && (
        <div style={{ fontSize: 11, color: C.blueGrey, marginTop: 2, fontFamily: "monospace" }}>
          ≈ {conv.altSym} {Math.round(conv.toAlt(usdVal)).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function NumInput({ val, onChange, isCount }) {
  return (
    <input
      type="number" min="0"
      value={val}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: isCount ? 70 : 90, border: "1px solid #ccc", borderRadius: 4, padding: "4px 6px", fontSize: 12, textAlign: "right", fontFamily: "monospace", display: "block", marginLeft: "auto" }}
    />
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle     = { display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 5 };
const textareaStyle  = { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: "8px 10px", fontSize: 13, resize: "vertical", minHeight: 60 };
const selectStyle    = { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: "8px 10px", fontSize: 13, minHeight: 40, background: "#fff" };
const navBtnStyle    = { borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, minHeight: 44 };
const toggleBtnStyle = { borderRadius: 7, padding: "8px 20px", fontSize: 14, fontWeight: 600, minHeight: 40 };
const thStyle        = { padding: "8px 10px", textAlign: "left", color: C.navy, fontWeight: 700, fontSize: 12 };
const descStyle      = { fontSize: 13, color: "#555", lineHeight: 1.65, fontStyle: "italic" };
