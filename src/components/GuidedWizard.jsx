import { useState, useEffect } from "react";
import { COLORS as C } from "../utils/metrics";
import StepInstructions from "./StepInstructions";
import { WIZARD_STEP_INSTRUCTIONS } from "../data/instructions";
import { CURRENCIES as CURRENCY_MAP, COUNTRY_CURRENCIES } from "../utils/CurrencyContext";
import { EXPENSES_REGULAR_ROW_DEFAULTS, EXPENSES_REGULAR_CATEGORIES } from "../data/expensesRegular";
import { EXPENSES_IRREGULAR_DEFAULTS, IRREGULAR_CATEGORIES } from "../data/expensesIrregular";
import { ACTIVITY_LIST, ACTIVITY_DESCRIPTIONS, ACTIVITY_DEFAULT_ROWS } from "../data/activities";
import { REVENUE_REGULAR_OTHER_DEFAULTS, REVENUE_REGULAR_OTHER_CATEGORIES } from "../data/revenueRegularOther";
import { REVENUE_IRREGULAR_DEFAULTS, REVENUE_IRREGULAR_CATEGORIES, PAYMENT_STATUS_OPTIONS } from "../data/revenueIrregular";
import { KEY_CONSIDERATIONS_DEFAULTS } from "../data/countries";
import InfoTip from "./InfoTip";

const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar"        },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling"  },
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira"   },
  { code: "RWF", symbol: "RF",  name: "Rwandan Franc"    },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ZWG", symbol: "ZiG", name: "Zimbabwe Gold"    },
];

// Setup tab — Unit options. Per Willyanne 2026-05-26 #4: only the two
// "/mgmt." options are user-facing (the Ethics Committee variants are
// reported through the parent Secretariat's submission, not as separate units).
const UNIT_OPTIONS = [
  "National Secretariat/mgmt.",
  "Local IRB Secretariat/mgmt.",
];

const TREND_OPTIONS = ["Remain the same", "Increase", "Decrease"];

// ─── Wizard draft persistence ────────────────────────────────────────────────
// PROTOTYPE ONLY: localStorage-based draft persistence (per browser, per device).
// Before production deployment with real country teams, this MUST be replaced
// with server-side persistence (Supabase) so drafts survive logout and follow
// the user across devices. See plan velvety-seeking-marble.md.
const DRAFT_VERSION = 7;
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
  { id: "revenue",   label: "4. Revenue",            title: "Revenue"                    },
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
  // Budget year — free-text per Willyanne 2026-05-27 mid-day item #3 (e.g. "2026"
  // or "FY 2026/27"). Stored in localStorage draft + submit payload; no Supabase
  // column yet. App.jsx merge-guard pattern handles future migration.
  const [budgetYear, setBudgetYear] = useState(() => draft?.budgetYear ?? data?.budgetYear ?? "");
  // Static rate sourced from CurrencyContext (replaces the prior live fetch).
  // Rate is locked at submission time (`ratesAsOf` payload field). Country
  // teams see "as of [today]" in Setup.
  const [exchangeRate, setExchangeRate] = useState(() => CURRENCY_MAP[currency.code]?.rate ?? 1);

  // Workbook 2c/2d/2e seed both risks and opportunities to "yes" with descriptions
  // (Willyanne 2026-05-26 #6). Saved data > draft > workbook default.
  const [hasRisks, setHasRisks] = useState(() => draft?.hasRisks ?? data?.hasRisks ?? KEY_CONSIDERATIONS_DEFAULTS.hasRisks);
  const [hasOpps,  setHasOpps]  = useState(() => draft?.hasOpps  ?? data?.hasOpps  ?? KEY_CONSIDERATIONS_DEFAULTS.hasOpps);
  const [riskText, setRiskText] = useState(() => draft?.riskText ?? data?.riskText ?? KEY_CONSIDERATIONS_DEFAULTS.riskText);
  const [oppText,  setOppText]  = useState(() => draft?.oppText  ?? data?.oppText  ?? KEY_CONSIDERATIONS_DEFAULTS.oppText);

  // Per Willyanne 2026-05-26 #7/#8/#9: activities are fully editable rows —
  // name, description, near-term, long-term, note. Workbook col-I/col-J seed
  // values pre-fill near-term/long-term for first-time submissions. Saved
  // data merges over workbook defaults by matching on `name`.
  const [activityRows, setActivityRows] = useState(() => {
    if (draft?.activityRows) return draft.activityRows;
    const saved = data?.activities || [];
    return ACTIVITY_DEFAULT_ROWS.map((def) => {
      const existing = saved.find((a) => a.name === def.name);
      if (!existing) return { ...def };
      return {
        name:        def.name,
        description: existing.description ?? def.description,
        nearTerm:    existing.nearTerm    ?? def.nearTerm,
        longTerm:    existing.longTerm    ?? def.longTerm,
        note:        existing.note        ?? def.note,
      };
    }).concat(
      // Carry forward any user-added activities saved previously that aren't
      // in the workbook defaults.
      saved
        .filter((a) => !ACTIVITY_DEFAULT_ROWS.some((d) => d.name === a.name))
        .map((a) => ({
          name: a.name,
          description: a.description || "",
          nearTerm: a.nearTerm || "",
          longTerm: a.longTerm || "",
          note: a.note || "",
        }))
    );
  });

  const [stepSources, setStepSources] = useState(() => draft?.stepSources || Array(STEPS.length).fill(""));
  const [stepNotes,   setStepNotes]   = useState(() => draft?.stepNotes   || Array(STEPS.length).fill(""));
  // Track which Expenses sub-tabs (Regular / Irregular) the user has visited.
  // Per Willyanne 2026-05-22: country teams must visit BOTH sub-tabs before
  // advancing from Step 3 → Revenue, so Irregular doesn't get silently skipped.
  // (Regular defaults to true since the user lands there on entry.)
  const [expVisitedIrregular, setExpVisitedIrregular] = useState(() => !!draft?.expVisitedIrregular);
  // Mirror of expVisitedIrregular for Revenue — per Willyanne 2026-05-27 mid-day
  // item #8: country teams must open the Irregular Revenue sub-tab before
  // advancing to In-Kind. Regular defaults to true since users land there first.
  const [revVisitedIrregular, setRevVisitedIrregular] = useState(() => !!draft?.revVisitedIrregular);
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(draft?.savedAt || null);

  // Editable budget data — all stored in USD
  // Per Willyanne 2026-05-26 #11/#12: Regular Expenses uses row-shape (array)
  // so labels, descriptions, and amounts are all editable + rows can be
  // added/deleted. The flat `er` is rebuilt on submit from the rows for
  // backwards compatibility with Overview/Expenses display.
  const [erRowsEdits, setErRowsEdits] = useState(() =>
    draft?.erRowsEdits
      ?? (Array.isArray(data?.erRows) && data.erRows.length > 0
          ? JSON.parse(JSON.stringify(data.erRows))
          : JSON.parse(JSON.stringify(EXPENSES_REGULAR_ROW_DEFAULTS)))
  );
  const [feesEdits,    setFeesEdits]    = useState(() => draft?.feesEdits    || JSON.parse(JSON.stringify(data?.fees    || [])));
  const [irrProjEdits, setIrrProjEdits] = useState(() => draft?.irrProjEdits || JSON.parse(JSON.stringify(data?.irrProj || [])));
  // Per Willyanne 2026-05-26 #19/#20: Revenue tab gets a Regular sub-tab with
  // a stacked "Regular Revenue from Other Sources" section under Fees, and an
  // Irregular sub-tab with 4 categories + Payment status dropdown. Saved data
  // > draft > workbook blank defaults.
  const [revRegOtherEdits, setRevRegOtherEdits] = useState(() =>
    draft?.revRegOtherEdits
      ?? (Array.isArray(data?.revRegOther) && data.revRegOther.length > 0
          ? JSON.parse(JSON.stringify(data.revRegOther))
          : JSON.parse(JSON.stringify(REVENUE_REGULAR_OTHER_DEFAULTS)))
  );
  const [revIrrEdits, setRevIrrEdits] = useState(() =>
    draft?.revIrrEdits
      ?? (Array.isArray(data?.revIrr) && data.revIrr.length > 0
          ? JSON.parse(JSON.stringify(data.revIrr))
          : JSON.parse(JSON.stringify(REVENUE_IRREGULAR_DEFAULTS)))
  );
  const [ikRegEdits,   setIkRegEdits]   = useState(() => draft?.ikRegEdits   || { ...(data?.ikReg || {}) });
  const [ikIrrEdits,   setIkIrrEdits]   = useState(() => draft?.ikIrrEdits   || { ...(data?.ikIrr || {}) });

  // Autosave every state change. Synchronous localStorage write is fast for this payload size.
  useEffect(() => {
    if (submitted) return;
    saveDraft(country, {
      step, currencyCode: currency.code, inputMode, unit, budgetYear,
      hasRisks, hasOpps, riskText, oppText,
      activityRows, stepSources, stepNotes,
      erRowsEdits, feesEdits, irrProjEdits,
      revRegOtherEdits, revIrrEdits,
      ikRegEdits, ikIrrEdits,
      expVisitedIrregular, revVisitedIrregular,
    });
    setDraftSavedAt(new Date().toISOString());
  }, [country, submitted, step, currency.code, inputMode, unit, budgetYear, hasRisks, hasOpps, riskText, oppText, activityRows, stepSources, stepNotes, erRowsEdits, feesEdits, irrProjEdits, revRegOtherEdits, revIrrEdits, ikRegEdits, ikIrrEdits, expVisitedIrregular, revVisitedIrregular]);

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
  // Step 2 (Expenses) and Step 3 (Revenue) additionally require visiting the
  // Irregular sub-tab — without this, Regular alone lets users skip Irregular.
  // Setup step (0) skips the source/notes requirement per Willyanne 2026-05-27 #4.
  const sourcesNotesOk = step === 0 || (stepSources[step].trim().length > 0 && stepNotes[step].trim().length > 0);
  const expensesSubtabsOk = step !== 2 || expVisitedIrregular;
  const revenueSubtabsOk  = step !== 3 || revVisitedIrregular;
  // Step 1 (Key Considerations) — per Willyanne 2026-05-26 #5: yes/no AND
  // description are required for both risks and opportunities.
  const riskAnswered = hasRisks === "yes" || hasRisks === "no";
  const oppAnswered  = hasOpps  === "yes" || hasOpps  === "no";
  const riskDescOk   = hasRisks !== "yes" || riskText.trim().length > 0;
  const oppDescOk    = hasOpps  !== "yes" || oppText.trim().length > 0;
  const keyConsidOk  = step !== 1 || (riskAnswered && oppAnswered && riskDescOk && oppDescOk);
  const canAdvance = sourcesNotesOk && expensesSubtabsOk && revenueSubtabsOk && keyConsidOk;
  const advanceBlockReason = !sourcesNotesOk
    ? "Fill in data source and notes to continue"
    : !expensesSubtabsOk
      ? "Open the Irregular sub-tab before advancing"
      : !revenueSubtabsOk
        ? "Open the Irregular sub-tab before advancing"
        : !keyConsidOk
          ? "Answer the risks and opportunities questions (and add a description for each Yes) before advancing"
          : "";


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
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Enter data step by step. Data source and notes are required on each step (except Setup) before advancing.</div>
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
              budgetYear={budgetYear} onBudgetYearChange={setBudgetYear}
            />
          )}
          {step === 1 && (
            <KeyConsiderationsStep
              hasRisks={hasRisks} setHasRisks={setHasRisks}
              hasOpps={hasOpps}   setHasOpps={setHasOpps}
              riskText={riskText} setRiskText={setRiskText}
              oppText={oppText}   setOppText={setOppText}
              activityRows={activityRows} setActivityRows={setActivityRows}
            />
          )}
          {step === 2 && (
            <ExpensesStep
              conv={conv}
              erRowsEdits={erRowsEdits} setErRowsEdits={setErRowsEdits}
              irrProjEdits={irrProjEdits} setIrrProjEdits={setIrrProjEdits}
              onIrregularVisited={() => setExpVisitedIrregular(true)}
              visitedIrregular={expVisitedIrregular}
            />
          )}
          {step === 3 && (
            <StepRevenue
              conv={conv}
              feesEdits={feesEdits} setFeesEdits={setFeesEdits}
              revRegOtherEdits={revRegOtherEdits} setRevRegOtherEdits={setRevRegOtherEdits}
              revIrrEdits={revIrrEdits} setRevIrrEdits={setRevIrrEdits}
              onIrregularVisited={() => setRevVisitedIrregular(true)}
              visitedIrregular={revVisitedIrregular}
            />
          )}
          {step === 4 && <StepInKind  conv={conv} ikRegEdits={ikRegEdits} setIkRegEdits={setIkRegEdits} ikIrrEdits={ikIrrEdits} setIkIrrEdits={setIkIrrEdits} />}
          {step === 5 && <StepReview  country={country} activityRows={activityRows} currency={currency} erRowsEdits={erRowsEdits} feesEdits={feesEdits} />}

          {/* Sources & Notes — required on every step except Setup (per
              Willyanne 2026-05-27 mid-day item #4) and Review. */}
          {step > 0 && step < STEPS.length - 1 && (
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
                {sourcesNotesOk && expensesSubtabsOk && !keyConsidOk && (
                  <div style={{ fontSize: 12, color: C.red, fontStyle: "italic" }}>
                    Answer both the risks and opportunities questions, and add a description for each "Yes," before continuing.
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
              // Rebuild flat `er` from the new row-shape for backward
              // compatibility with Overview/Expenses display. Only rows whose
              // `key` matches a workbook-canonical key are included; user-added
              // rows with generated keys are preserved in `erRows` only.
              const erFlat = {};
              for (const row of erRowsEdits || []) {
                if (row && row.key) erFlat[row.key] = row.amount ?? null;
              }
              // Roll up revRegOther → flat `revOther` and revIrr → flat `ri.*`
              // so Overview/Gap views continue to render without changes today.
              // Country teams enter rows; Results-side reads the rolled-up totals.
              const sumRows = (rows) => (rows || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);
              const revOtherTotal = sumRows(revRegOtherEdits);
              const riRollup = (revIrrEdits || []).reduce((acc, r) => {
                const v = Number(r?.amount) || 0;
                if (r?.category === "Grant")                acc.grants    += v;
                else if (r?.category === "Contract")        acc.contracts += v;
                else if (r?.category === "Other 1-time payment") acc.other     += v;
                else if (r?.category === "Deferred reserves") acc.reserves += v;
                return acc;
              }, { grants: 0, contracts: 0, other: 0, reserves: 0 });
              const updates = {
                activities:  activityRows,
                hasRisks, riskText, hasOpps, oppText,
                unit,
                budgetYear,
                currencyCode: currency.code,
                ratesAsOf:    new Date().toISOString(),
                er:      erFlat,
                erRows:  erRowsEdits,
                fees:    feesEdits,
                revFees: feesEdits.reduce((s, f) => s + (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo, 0),
                revRegOther: revRegOtherEdits,
                revOther: revOtherTotal,
                revIrr:  revIrrEdits,
                ri:      riRollup,
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

function StepSetup({ country, localCurrency, currency, inputMode, onInputModeChange, exchangeRate, unit, onUnitChange, budgetYear, onBudgetYearChange }) {
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

      {/* Budget year — grey bar + free-text input per Willyanne 2026-05-27 mid-day item #3 */}
      <div>
        <label style={labelStyle}>Budget year</label>
        <div style={{ marginTop: 6, padding: "10px 14px", background: "#f4f6f8", border: `1px solid #dde`, borderRadius: 8 }}>
          <input
            type="text"
            value={budgetYear || ""}
            onChange={(e) => onBudgetYearChange && onBudgetYearChange(e.target.value)}
            placeholder="e.g., 2026 or FY 2026/27"
            style={{
              width: "100%",
              padding: "6px 10px",
              background: "#fff",
              border: `1px solid #dde`,
              borderRadius: 6,
              fontSize: 14,
              color: C.navy,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StepRisks({ hasRisks, onHasRisks, hasOpps, onHasOpps, riskText, onRiskText, oppText, onOppText }) {
  const riskNeedsDesc = hasRisks === "yes" && !riskText.trim();
  const oppNeedsDesc  = hasOpps  === "yes" && !oppText.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={descStyle}>Do you expect any major financial risks or opportunities in the next year? These may include political instability, currency changes, loss or gain of international funding, or changes in research activity volume.</p>
      <div>
        <label style={labelStyle}>Do you expect major financial risks in the next year? <span style={{ color: C.red }}>*</span></label>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["Yes", "No"].map((opt) => (
            <button key={opt} onClick={() => onHasRisks(opt.toLowerCase())}
              style={{ ...toggleBtnStyle, background: hasRisks === opt.toLowerCase() ? C.red : "#f4f6f8", color: hasRisks === opt.toLowerCase() ? "#fff" : C.navy, border: `1px solid ${hasRisks === opt.toLowerCase() ? C.red : "#dde"}` }}>
              {opt}
            </button>
          ))}
        </div>
        {hasRisks === "yes" && (
          <>
            <label style={{ ...labelStyle, marginTop: 12, fontWeight: 500 }}>Describe the risks <span style={{ color: C.red }}>*</span></label>
            <textarea value={riskText} onChange={(e) => onRiskText(e.target.value)}
              placeholder="Describe the risks and how significantly you think they will impact ethics review..."
              style={{ ...textareaStyle, marginTop: 4, borderColor: riskNeedsDesc ? C.red : "#ccc" }} rows={3} />
            {riskNeedsDesc && <div style={{ fontSize: 11, color: C.red, fontStyle: "italic", marginTop: 4 }}>A description is required when "Yes" is selected.</div>}
          </>
        )}
      </div>
      <div>
        <label style={labelStyle}>Do you expect major financial opportunities in the next year? <span style={{ color: C.red }}>*</span></label>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["Yes", "No"].map((opt) => (
            <button key={opt} onClick={() => onHasOpps(opt.toLowerCase())}
              style={{ ...toggleBtnStyle, background: hasOpps === opt.toLowerCase() ? C.teal : "#f4f6f8", color: hasOpps === opt.toLowerCase() ? "#fff" : C.navy, border: `1px solid ${hasOpps === opt.toLowerCase() ? C.teal : "#dde"}` }}>
              {opt}
            </button>
          ))}
        </div>
        {hasOpps === "yes" && (
          <>
            <label style={{ ...labelStyle, marginTop: 12, fontWeight: 500 }}>Describe the opportunities <span style={{ color: C.red }}>*</span></label>
            <textarea value={oppText} onChange={(e) => onOppText(e.target.value)}
              placeholder="Describe the opportunities and how significantly you think they will impact ethics review..."
              style={{ ...textareaStyle, marginTop: 4, borderColor: oppNeedsDesc ? C.red : "#ccc" }} rows={3} />
            {oppNeedsDesc && <div style={{ fontSize: 11, color: C.red, fontStyle: "italic", marginTop: 4 }}>A description is required when "Yes" is selected.</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Step 3 sub-tab: Regular Expenses (row-shape, fully editable) ─────────────

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

// Editable ⓘ description — renders the info circle inline; click opens a
// pop-out textarea so country teams can rewrite the workbook description in
// place. Per Willyanne 2026-05-26 #11 ("can the I information description be
// editable?"). Closes on Save, Escape, or click-outside.
function EditableDescription({ value, label, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  useEffect(() => { if (!open) setDraft(value || ""); }, [value, open]);

  const commit = () => {
    setOpen(false);
    if (draft !== value) onChange(draft);
  };
  const revert = () => { setDraft(value || ""); setOpen(false); };

  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Edit description"
        aria-label={`Edit description for ${label}`}
        style={{
          background: open ? C.teal : "#eef2f5",
          color: open ? "#fff" : C.teal,
          border: `1px solid ${C.teal}`,
          borderRadius: "50%",
          width: 18,
          height: 18,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          padding: 0,
          cursor: "pointer",
          verticalAlign: "middle",
        }}
      >
        i
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: -6,
            zIndex: 30,
            background: "#fff",
            border: `1px solid ${C.teal}`,
            borderRadius: 7,
            padding: 10,
            minWidth: 280,
            maxWidth: 380,
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{label} — description</div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") revert(); }}
            rows={4}
            placeholder="Describe what counts toward this item..."
            style={{ width: "100%", border: "1px solid #ccc", borderRadius: 5, padding: "6px 8px", fontSize: 12, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button onClick={revert} style={{ background: "transparent", border: "none", color: C.blueGrey, fontSize: 11, cursor: "pointer" }}>Cancel</button>
            <button onClick={commit} style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        </div>
      )}
    </span>
  );
}

function StepExpensesRegular({ conv, erRowsEdits, setErRowsEdits }) {
  // Safety net: if rows are missing or in legacy shape, hydrate from defaults.
  // App.jsx's merge guard handles this on load too.
  useEffect(() => {
    if (!Array.isArray(erRowsEdits) || erRowsEdits.length === 0) {
      setErRowsEdits(JSON.parse(JSON.stringify(EXPENSES_REGULAR_ROW_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = Array.isArray(erRowsEdits) ? erRowsEdits : [];

  const updateRow = (idx, patch) => {
    setErRowsEdits((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const addRow = (category) => {
    const customKey = `custom-${Date.now()}`;
    setErRowsEdits((rs) => [
      ...rs,
      { category, key: customKey, label: "", description: "", amount: null },
    ]);
  };
  const deleteRow = (idx) => {
    setErRowsEdits((rs) => rs.filter((_, i) => i !== idx));
  };

  const grandTotal = rows.reduce((s, r) => {
    const v = r?.amount;
    if (v === null || v === undefined || v === "") return s;
    return s + (Number(v) || 0);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={descStyle}>
        <em>Enter your unit's regular annual expenses below (inclusive of the Secretariat/mgmt. expenses and the Ethics Committee expenses). The categories and items are pre-populated from the TRACE Financial Workbook. <strong>All cells are editable</strong> — you can click the item to rename it and click the <strong>ⓘ</strong> to edit its description. If an item does not apply in your context, you can remove it by clicking on the red "x" at the right end of the row. You may also add an item under any expense category by clicking on <strong>+ Add item</strong> to input the item name and description. Please note, you can leave an amount blank if you don't know the cost yet for that item; enter 0 only if the actual amount is zero.</em>
      </p>

      {EXPENSES_REGULAR_CATEGORIES.map((cat) => {
        const rowsInCat = rows
          .map((r, idx) => ({ row: r, idx }))
          .filter(({ row }) => row?.category === cat);
        const catTotal = rowsInCat.reduce((s, { row }) => s + (Number(row?.amount) || 0), 0);

        return (
          <div key={cat} style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: C.lightBG, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>
              {cat}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
                <thead>
                  <tr style={{ background: "#f8fafb" }}>
                    <th style={{ ...thStyle, minWidth: 340 }}>Item</th>
                    <th style={{ ...thStyle, textAlign: "right", width: 150 }}>
                      Amount ({conv.displayCode === "USD" ? "US Dollars" : conv.displayCode})
                    </th>
                    {conv.showAlt && (
                      <th style={{ ...thStyle, textAlign: "right", width: 120 }}>≈ ({conv.altSym})</th>
                    )}
                    <th style={{ ...thStyle, width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rowsInCat.length === 0 && (
                    <tr>
                      <td colSpan={conv.showAlt ? 4 : 3} style={{ padding: "14px 12px", fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center" }}>
                        No items yet — use + Add item below.
                      </td>
                    </tr>
                  )}
                  {rowsInCat.map(({ row, idx }) => (
                    <tr key={row.key || idx} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <IrregularItemCell
                              value={row.label}
                              onChange={(v) => updateRow(idx, { label: v })}
                            />
                          </div>
                          <EditableDescription
                            value={row.description}
                            label={row.label || "Item"}
                            onChange={(v) => updateRow(idx, { description: v })}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <BlankableAmountInput
                          usdVal={row.amount}
                          conv={conv}
                          onChangeUSD={(v) => updateRow(idx, { amount: v ?? null })}
                        />
                      </td>
                      {conv.showAlt && (
                        <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: C.blueGrey }}>
                          {formatLocked(row.amount, conv)}
                        </td>
                      )}
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
                    <td colSpan={conv.showAlt ? 4 : 3} style={{ padding: "8px 10px" }}>
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
                        Category subtotal: <strong style={{ color: C.navy, fontFamily: "monospace" }}>
                          {conv.displaySym}{conv.toDisplay(catTotal).toLocaleString()}
                        </strong>
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
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total regular expenses ({conv.displayCode})</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          {conv.displaySym}{conv.toDisplay(grandTotal).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

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
                      <td colSpan={conv.showAlt ? 7 : 6} style={{ padding: "14px 12px", fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center" }}>
                        No items yet — use the + Add item button below.
                      </td>
                    </tr>
                  )}
                  {rowsInCat.map(({ row, idx }) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
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
                    <td colSpan={conv.showAlt ? 7 : 6} style={{ padding: "8px 10px" }}>
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

// Per Willyanne 2026-05-26 #17/#18/#19/#20: Step 4 Revenue gets Regular |
// Irregular sub-tabs. Regular has stacked collapsible sections — "Regular
// Revenue from Fees" (the existing fee-based UI, untouched today; redesign
// scheduled for item 21 on 2026-05-27) above "Regular Revenue from Other
// Sources" (6 categories: Subsidy federal/institutional/other; Income
// rental/investment/other). Irregular has 4 categories (Grant, Contract,
// Other 1-time payment, Deferred reserves) plus a Payment status dropdown
// column unique to Irregular Revenue.
function StepRevenue({ conv, feesEdits, setFeesEdits, revRegOtherEdits, setRevRegOtherEdits, revIrrEdits, setRevIrrEdits, onIrregularVisited, visitedIrregular }) {
  const [sub, setSub] = useState("regular");
  const handleSub = (id) => {
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
        active={sub} onChange={handleSub}
      />
      {sub === "regular" && (
        <StepRevenueRegular
          conv={conv}
          feesEdits={feesEdits} setFeesEdits={setFeesEdits}
          revRegOtherEdits={revRegOtherEdits} setRevRegOtherEdits={setRevRegOtherEdits}
        />
      )}
      {sub === "irregular" && (
        <StepRevenueIrregular
          conv={conv}
          revIrrEdits={revIrrEdits} setRevIrrEdits={setRevIrrEdits}
        />
      )}
    </div>
  );
}

// Collapsible section header — used to stack Fees + Other Sources within the
// Regular sub-tab. Per Willyanne 2026-05-26: default expanded, click the
// header to collapse so a country team can fold a section once they're done.
function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid #cdd5dc", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          background: C.lightBG,
          border: "none",
          borderBottom: open ? "1px solid #cdd5dc" : "none",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 700,
          color: C.navy,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 44,
        }}
        aria-expanded={open}
      >
        <span style={{ display: "inline-block", width: 14, fontSize: 10, transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 120ms" }}>▼</span>
        <span>{title}</span>
      </button>
      {open && <div style={{ padding: "16px 18px" }}>{children}</div>}
    </div>
  );
}

function StepRevenueRegular({ conv, feesEdits, setFeesEdits, revRegOtherEdits, setRevRegOtherEdits }) {
  // Safety net: if rows are missing or in a legacy shape, hydrate from defaults.
  // App.jsx's merge guard handles this on load too.
  useEffect(() => {
    if (!Array.isArray(revRegOtherEdits) || revRegOtherEdits.length === 0 ||
        revRegOtherEdits.some((r) => r && r.category === undefined)) {
      setRevRegOtherEdits(JSON.parse(JSON.stringify(REVENUE_REGULAR_OTHER_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feeTotal = feesEdits.reduce((s, f) => s + (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo, 0);
  const otherTotal = (revRegOtherEdits || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>
        Regular revenue comes from two sources: <strong>fees</strong> charged for ethics reviews (top),
        and <strong>other recurring revenue</strong> like government or institutional subsidies, rental
        or investment income, etc. (below). Click a section header to collapse or expand it.
      </p>

      <CollapsibleSection title="Regular Revenue from Fees" defaultOpen={true}>
        <StepRevenueFees conv={conv} feesEdits={feesEdits} setFeesEdits={setFeesEdits} />
      </CollapsibleSection>

      <CollapsibleSection title="Regular Revenue from Other Sources" defaultOpen={true}>
        <RevenueCategoryCards
          conv={conv}
          rows={revRegOtherEdits}
          setRows={setRevRegOtherEdits}
          categories={REVENUE_REGULAR_OTHER_CATEGORIES}
          withPaymentStatus={false}
          intro="Subsidies and recurring non-fee income, organized by category. Each row captures the funder, amount, and start/end dates. Use + Add item to extend a category."
        />
      </CollapsibleSection>

      <div style={{ background: C.navy, color: "#fff", padding: "12px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total regular revenue ({conv.displayCode})</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          {conv.displaySym}{conv.toDisplay(feeTotal + otherTotal).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function StepRevenueIrregular({ conv, revIrrEdits, setRevIrrEdits }) {
  useEffect(() => {
    if (!Array.isArray(revIrrEdits) || revIrrEdits.length === 0 ||
        revIrrEdits.some((r) => r && r.category === undefined)) {
      setRevIrrEdits(JSON.parse(JSON.stringify(REVENUE_IRREGULAR_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grandTotal = (revIrrEdits || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>
        Irregular revenue is one-time, time-limited, or non-recurring funding — grants, contracts,
        other one-time payments, or draws from deferred reserves. Each row captures the funder,
        amount, start/end dates, and <strong>payment status</strong> (whether and when the funds
        have been received). <strong>All cells are editable</strong> — use <em>+ Add item</em> to
        extend a category.
      </p>
      <RevenueCategoryCards
        conv={conv}
        rows={revIrrEdits}
        setRows={setRevIrrEdits}
        categories={REVENUE_IRREGULAR_CATEGORIES}
        withPaymentStatus={true}
      />
      <div style={{ background: C.navy, color: "#fff", padding: "12px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total irregular revenue ({conv.displayCode})</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          {conv.displaySym}{conv.toDisplay(grandTotal).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Shared category-card block: renders one card per category with editable
// label, ⓘ description, funder, USD amount (+ alt-currency display when
// applicable), start/end dates, optional Payment status dropdown, and a
// × delete per row. "+ Add item" appends a new blank row to a category.
function RevenueCategoryCards({ conv, rows, setRows, categories, withPaymentStatus = false, intro }) {
  const updateRow = (idx, patch) => {
    setRows((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const addRow = (category) => {
    setRows((rs) => [
      ...rs,
      {
        category, item: "", description: "", funder: "",
        amount: null, startDate: "", endDate: "",
        ...(withPaymentStatus ? { paymentStatus: "" } : {}),
      },
    ]);
  };
  const deleteRow = (idx) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  // Visible columns: Item (incl. ⓘ) | Funder | Amount | [alt] | Start | End | [Payment] | ×
  const visibleCols = 6 + (conv.showAlt ? 1 : 0) + (withPaymentStatus ? 1 : 0) + 1; // + the × column

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {intro && <p style={descStyle}>{intro}</p>}
      {categories.map((cat) => {
        const rowsInCat = (rows || [])
          .map((r, idx) => ({ row: r, idx }))
          .filter(({ row }) => row?.category === cat);
        const catTotal = rowsInCat.reduce((s, { row }) => s + (Number(row?.amount) || 0), 0);

        return (
          <div key={cat} style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#f4f7f9", padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>
              {cat}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: withPaymentStatus ? 1040 : 880 }}>
                <thead>
                  <tr style={{ background: "#f8fafb" }}>
                    <th style={{ ...thStyle, minWidth: 220 }}>Item</th>
                    <th style={{ ...thStyle, width: 150 }}>Funding source</th>
                    <th style={{ ...thStyle, textAlign: "right", width: 130 }}>
                      Amount ({conv.displayCode === "USD" ? "US Dollars" : conv.displayCode})
                    </th>
                    {conv.showAlt && (
                      <th style={{ ...thStyle, textAlign: "right", width: 110 }}>≈ ({conv.altSym})</th>
                    )}
                    <th style={{ ...thStyle, width: 110 }}>Start date</th>
                    <th style={{ ...thStyle, width: 110 }}>End date</th>
                    {withPaymentStatus && (
                      <th style={{ ...thStyle, width: 180 }}>Payment status</th>
                    )}
                    <th style={{ ...thStyle, width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rowsInCat.length === 0 && (
                    <tr>
                      <td colSpan={visibleCols} style={{ padding: "14px 12px", fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center" }}>
                        No items yet — use the + Add item button below.
                      </td>
                    </tr>
                  )}
                  {rowsInCat.map(({ row, idx }) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <IrregularItemCell
                              value={row.item}
                              onChange={(v) => updateRow(idx, { item: v })}
                            />
                          </div>
                          <EditableDescription
                            value={row.description}
                            label={row.item || "Item"}
                            onChange={(v) => updateRow(idx, { description: v })}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <IrregularTextInput
                          value={row.funder}
                          onChange={(v) => updateRow(idx, { funder: v })}
                          placeholder={row.category === "Subsidy (federal)" ? "e.g., Ministry of Health" : ""}
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
                      {withPaymentStatus && (
                        <td style={{ padding: "8px 10px" }}>
                          <select
                            value={row.paymentStatus || ""}
                            onChange={(e) => updateRow(idx, { paymentStatus: e.target.value })}
                            style={{
                              width: "100%",
                              border: "1px solid #ccc",
                              borderRadius: 4,
                              padding: "5px 6px",
                              fontSize: 12,
                              fontFamily: "inherit",
                              background: "#fff",
                              color: row.paymentStatus ? C.navy : "#888",
                            }}
                          >
                            <option value="">Select…</option>
                            {PAYMENT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </td>
                      )}
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
                    <td colSpan={visibleCols} style={{ padding: "8px 10px" }}>
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
    </div>
  );
}

function StepRevenueFees({ conv, feesEdits, setFeesEdits }) {
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

// Activities table — Willyanne 2026-05-26 #7/#8/#9:
// - Name (editable inline)
// - ⓘ editable description per row
// - Near-term + long-term TrendSelect (seeded from workbook col I / col J)
// - × delete + "+ Add activity" at bottom
function StepActivities({ rows, setRows }) {
  const updateRow = (idx, patch) => {
    setRows((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const addRow = () => {
    setRows((rs) => [...rs, { name: "", description: "", nearTerm: "", longTerm: "", note: "" }]);
  };
  const deleteRow = (idx) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={descStyle}>
        <em>For each activity, select whether you expect effort to <strong>remain the same</strong>, <strong>increase</strong>, or <strong>decrease</strong> in the near term (next year) and the long term (3–5 years). Activity names and descriptions are editable — you can click the name to rename it and click the <strong>ⓘ</strong> to rewrite its description. If any of the pre-populated activities in the activities list does not apply in your context, you can remove it by clicking the red "x" at the right end of the row; if you would like to add an activity, use <strong>+ Add activity</strong> at the end of the list to name that activity and enter in a description.</em>
      </p>
      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 }}>
            <thead>
              <tr style={{ background: C.lightBG }}>
                <th style={{ ...thStyle, width: 32 }}>#</th>
                <th style={{ ...thStyle, minWidth: 320 }}>Activity</th>
                <th style={{ ...thStyle, width: 170 }}>Near-term effort</th>
                <th style={{ ...thStyle, width: 170 }}>Long-term effort</th>
                <th style={{ ...thStyle, width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "14px 12px", fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center" }}>
                    No activities yet — use + Add activity below.
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
                  <td style={{ padding: "10px 10px", fontSize: 12, color: C.blueGrey, fontFamily: "monospace" }}>{idx + 1}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <IrregularItemCell
                          value={row.name}
                          onChange={(v) => updateRow(idx, { name: v })}
                        />
                      </div>
                      <EditableDescription
                        value={row.description}
                        label={row.name || "Activity"}
                        onChange={(v) => updateRow(idx, { description: v })}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <TrendSelect val={row.nearTerm} onChange={(v) => updateRow(idx, { nearTerm: v })} />
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <TrendSelect val={row.longTerm} onChange={(v) => updateRow(idx, { longTerm: v })} />
                  </td>
                  <td style={{ padding: "8px 4px", textAlign: "center" }}>
                    <button
                      onClick={() => deleteRow(idx)}
                      title="Delete this activity"
                      style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#fafbfc" }}>
                <td colSpan={5} style={{ padding: "8px 10px" }}>
                  <button
                    onClick={addRow}
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
                    + Add activity
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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

function KeyConsiderationsStep({ hasRisks, setHasRisks, hasOpps, setHasOpps, riskText, setRiskText, oppText, setOppText, activityRows, setActivityRows }) {
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
        <StepActivities rows={activityRows} setRows={setActivityRows} />
      )}
    </div>
  );
}

// ─── Step 3: Expenses (sub-tabs: Regular | Irregular) ─────────────────────────

function ExpensesStep({ conv, erRowsEdits, setErRowsEdits, irrProjEdits, setIrrProjEdits, onIrregularVisited, visitedIrregular }) {
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
        <StepExpensesRegular conv={conv} erRowsEdits={erRowsEdits} setErRowsEdits={setErRowsEdits} />
      )}
      {sub === "irregular" && (
        <StepExpensesIrregular conv={conv} irrProjEdits={irrProjEdits} setIrrProjEdits={setIrrProjEdits} />
      )}
    </div>
  );
}

function StepReview({ country, activityRows, currency, erRowsEdits, feesEdits }) {
  const filledActivities = activityRows.filter((r) => r.nearTerm && r.longTerm);
  const totalExpenses = (erRowsEdits || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);
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
