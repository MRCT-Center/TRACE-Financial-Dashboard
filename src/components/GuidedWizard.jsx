import { useState, useEffect, Fragment } from "react";
import { COLORS as C } from "../utils/metrics";
import StepInstructions from "./StepInstructions";
import { WIZARD_STEP_INSTRUCTIONS } from "../data/instructions";
import { CURRENCIES as CURRENCY_MAP, COUNTRY_CURRENCIES } from "../utils/CurrencyContext";
import { EXPENSES_REGULAR_ROW_DEFAULTS, EXPENSES_REGULAR_CATEGORIES } from "../data/expensesRegular";
import { EXPENSES_IRREGULAR_DEFAULTS, IRREGULAR_CATEGORIES } from "../data/expensesIrregular";
import { ACTIVITY_LIST, ACTIVITY_DESCRIPTIONS, ACTIVITY_DEFAULT_ROWS } from "../data/activities";
import { REVENUE_REGULAR_OTHER_DEFAULTS, REVENUE_REGULAR_OTHER_CATEGORIES } from "../data/revenueRegularOther";
import { REVENUE_IRREGULAR_DEFAULTS, REVENUE_IRREGULAR_CATEGORIES, PAYMENT_STATUS_OPTIONS } from "../data/revenueIrregular";
import { IN_KIND_REGULAR_DEFAULTS, IN_KIND_REGULAR_CATEGORIES, IN_KIND_FUNDING_SOURCE_OPTIONS } from "../data/inKindRegular";
import { IN_KIND_IRREGULAR_DEFAULTS, IN_KIND_IRREGULAR_CATEGORIES } from "../data/inKindIrregular";
import { KEY_CONSIDERATIONS_DEFAULTS } from "../data/countries";
import { DEMO_MODE } from "../demoConfig";
import {
  FEES_COLUMN_KEYS, FEES_DEFAULT_COLUMN_LABELS, FEES_DEFAULT_ROWS,
  makeBlankFeeRow, rowRevenue, totalFeesRevenue,
  deriveLegacyFeeFields, isLegacyFeesArray,
} from "../data/feesModel";
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
const DRAFT_VERSION = 12;
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
  // Hydrate from localStorage draft on mount (component is keyed by country in App.jsx).
  // Demo mode: ignore any saved draft so every visitor starts from the pristine
  // seeded data and a refresh always resets to clean. See src/demoConfig.js.
  const draft = DEMO_MODE ? null : loadDraft(country);

  const [step, setStep]           = useState(() => draft?.step ?? 0);
  // Furthest step the user has reached. Once a step has been visited (advanced
  // to via Next, which enforces the per-step validation gates), the user can
  // freely jump back to it by clicking its tab — they no longer have to walk
  // forward with the Next button (Willyanne 2026-05-31 #9).
  const [maxStepReached, setMaxStepReached] = useState(() => draft?.maxStepReached ?? draft?.step ?? 0);
  useEffect(() => { setMaxStepReached((m) => Math.max(m, step)); }, [step]);
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
  // Tier 10 (Willyanne 2026-05-28): new fees row shape with 9 funder/student
  // $/# column buckets. Draft v10 > saved data > workbook defaults; if any
  // route yields legacy-shape rows (pre-Tier 10) substitute fresh defaults.
  const [feesEdits, setFeesEdits] = useState(() => {
    const candidate = draft?.feesEdits ?? data?.fees ?? null;
    if (isLegacyFeesArray(candidate)) return JSON.parse(JSON.stringify(FEES_DEFAULT_ROWS));
    return JSON.parse(JSON.stringify(candidate));
  });
  // Editable column headers — country teams adjust to match local terminology.
  // Persisted alongside feesEdits in draft + submit payload.
  const [feesColumnsEdits, setFeesColumnsEdits] = useState(() =>
    JSON.parse(JSON.stringify(draft?.feesColumnsEdits || data?.feesColumns || FEES_DEFAULT_COLUMN_LABELS))
  );
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
  // Per Willyanne 2026-05-27 PM: In-Kind Regular + Irregular now use row-shape
  // (mirrors Expenses). Each row has Item ⓘ + Amount + Currency conversion +
  // Funding source dropdown (3 options) + (Irregular only) start/end dates +
  // red × delete. The flat `ikReg`/`ikIrr` shapes are rebuilt on submit for
  // backward compat with Overview/GapView/AdminDashboard/metrics.js.
  const [ikRegRowsEdits, setIkRegRowsEdits] = useState(() =>
    draft?.ikRegRowsEdits
      ?? (Array.isArray(data?.ikRegRows) && data.ikRegRows.length > 0
          ? JSON.parse(JSON.stringify(data.ikRegRows))
          : JSON.parse(JSON.stringify(IN_KIND_REGULAR_DEFAULTS)))
  );
  const [ikIrrRowsEdits, setIkIrrRowsEdits] = useState(() =>
    draft?.ikIrrRowsEdits
      ?? (Array.isArray(data?.ikIrrRows) && data.ikIrrRows.length > 0
          ? JSON.parse(JSON.stringify(data.ikIrrRows))
          : JSON.parse(JSON.stringify(IN_KIND_IRREGULAR_DEFAULTS)))
  );
  // Mirror of expVisitedIrregular / revVisitedIrregular for In-Kind — per
  // Willyanne 2026-05-27 PM: country teams must open the Irregular In-Kind
  // sub-tab before advancing from Step 4 → Review.
  const [inkVisitedIrregular, setInkVisitedIrregular] = useState(() => !!draft?.inkVisitedIrregular);

  // Autosave every state change. Synchronous localStorage write is fast for this payload size.
  // Demo mode: skip autosave entirely so nothing persists across a refresh.
  useEffect(() => {
    if (submitted || DEMO_MODE) return;
    saveDraft(country, {
      step, maxStepReached, currencyCode: currency.code, inputMode, unit, budgetYear,
      hasRisks, hasOpps, riskText, oppText,
      activityRows, stepSources, stepNotes,
      erRowsEdits, feesEdits, feesColumnsEdits, irrProjEdits,
      revRegOtherEdits, revIrrEdits,
      ikRegRowsEdits, ikIrrRowsEdits,
      expVisitedIrregular, revVisitedIrregular, inkVisitedIrregular,
    });
    setDraftSavedAt(new Date().toISOString());
  }, [country, submitted, step, maxStepReached, currency.code, inputMode, unit, budgetYear, hasRisks, hasOpps, riskText, oppText, activityRows, stepSources, stepNotes, erRowsEdits, feesEdits, feesColumnsEdits, irrProjEdits, revRegOtherEdits, revIrrEdits, ikRegRowsEdits, ikIrrRowsEdits, expVisitedIrregular, revVisitedIrregular, inkVisitedIrregular]);

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
  const inKindSubtabsOk   = step !== 4 || inkVisitedIrregular;
  // Step 1 (Key Considerations) — per Willyanne 2026-05-26 #5: yes/no AND
  // description are required for both risks and opportunities.
  const riskAnswered = hasRisks === "yes" || hasRisks === "no";
  const oppAnswered  = hasOpps  === "yes" || hasOpps  === "no";
  const riskDescOk   = hasRisks !== "yes" || riskText.trim().length > 0;
  const oppDescOk    = hasOpps  !== "yes" || oppText.trim().length > 0;
  const keyConsidOk  = step !== 1 || (riskAnswered && oppAnswered && riskDescOk && oppDescOk);
  const canAdvance = sourcesNotesOk && expensesSubtabsOk && revenueSubtabsOk && inKindSubtabsOk && keyConsidOk;
  const advanceBlockReason = !sourcesNotesOk
    ? "Fill in data source and notes to continue"
    : !expensesSubtabsOk
      ? "Open the Irregular sub-tab before advancing"
      : !revenueSubtabsOk
        ? "Open the Irregular sub-tab before advancing"
        : !inKindSubtabsOk
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
            onClick={() => i <= maxStepReached && setStep(i)}
            style={{
              flex: "1 1 auto", padding: "6px 4px", fontSize: 11, borderRadius: 5,
              background: i === step ? C.teal : i <= maxStepReached ? C.darkNavy : "#dde",
              color: i <= maxStepReached ? "#fff" : C.blueGrey,
              fontWeight: i === step ? 700 : 400,
              whiteSpace: "nowrap", cursor: i <= maxStepReached && i !== step ? "pointer" : "default", minHeight: 36,
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
              feesColumnsEdits={feesColumnsEdits} setFeesColumnsEdits={setFeesColumnsEdits}
              revRegOtherEdits={revRegOtherEdits} setRevRegOtherEdits={setRevRegOtherEdits}
              revIrrEdits={revIrrEdits} setRevIrrEdits={setRevIrrEdits}
              onIrregularVisited={() => setRevVisitedIrregular(true)}
              visitedIrregular={revVisitedIrregular}
            />
          )}
          {step === 4 && (
            <InKindStep
              conv={conv}
              ikRegRowsEdits={ikRegRowsEdits} setIkRegRowsEdits={setIkRegRowsEdits}
              ikIrrRowsEdits={ikIrrRowsEdits} setIkIrrRowsEdits={setIkIrrRowsEdits}
              onIrregularVisited={() => setInkVisitedIrregular(true)}
              visitedIrregular={inkVisitedIrregular}
            />
          )}
          {step === 5 && <StepReview  country={country} activityRows={activityRows} currency={currency} budgetYear={budgetYear} erRowsEdits={erRowsEdits} irrProjEdits={irrProjEdits} feesEdits={feesEdits} revRegOtherEdits={revRegOtherEdits} revIrrEdits={revIrrEdits} ikRegRowsEdits={ikRegRowsEdits} ikIrrRowsEdits={ikIrrRowsEdits} />}

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
                {sourcesNotesOk && !revenueSubtabsOk && (
                  <div style={{ fontSize: 12, color: C.red, fontStyle: "italic" }}>
                    Open the <strong>Irregular</strong> sub-tab and review it before continuing to In-Kind.
                  </div>
                )}
                {sourcesNotesOk && !inKindSubtabsOk && (
                  <div style={{ fontSize: 12, color: C.red, fontStyle: "italic" }}>
                    Open the <strong>Irregular</strong> sub-tab and review it before continuing to Review.
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
              // Compute legacy ikReg/ikIrr shapes from the new row-based state
              // for backward compat with Overview/GapView/AdminDashboard/metrics.js.
              // `funder` is a dropdown from IN_KIND_FUNDING_SOURCE_OPTIONS;
              // empty funder rows contribute to `total` but not the rollup buckets.
              const ikRegRollup = (ikRegRowsEdits || []).reduce((acc, r) => {
                const v = Number(r?.amount) || 0;
                if (r?.funder === "In-kind contribution (federal)")            acc.federal       += v;
                else if (r?.funder === "In-kind contribution (institutional)") acc.institutional += v;
                else if (r?.funder === "In-kind contribution (other source)")  acc.other         += v;
                return acc;
              }, { federal: 0, institutional: 0, other: 0 });
              const ikRegTotal = (ikRegRowsEdits || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);
              const ikRegFinal = { ...ikRegRollup, total: ikRegTotal };
              // Irregular in-kind: roll up by funding source too (per Willyanne
              // 2026-05-29) so the Overview In-Kind box can show federal /
              // institutional / other combined across both in-kind tabs.
              const ikIrrRollup = (ikIrrRowsEdits || []).reduce((acc, r) => {
                const v = Number(r?.amount) || 0;
                if (r?.funder === "In-kind contribution (federal)")            acc.federal       += v;
                else if (r?.funder === "In-kind contribution (institutional)") acc.institutional += v;
                else if (r?.funder === "In-kind contribution (other source)")  acc.other         += v;
                return acc;
              }, { federal: 0, institutional: 0, other: 0 });
              const ikIrrTotal = (ikIrrRowsEdits || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);
              const ikIrrFinal = { ...ikIrrRollup, total: ikIrrTotal };
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
                // Tier 10: fees rows carry the new `cells` shape + derived
                // legacy fields (`ctPro`, `ctStu`, `ind`, `ngo`, `rev`) so
                // GapView.jsx and Revenue.jsx keep working without rewrites.
                fees:        feesEdits.map((r) => ({ ...r, ...deriveLegacyFeeFields(r) })),
                feesColumns: feesColumnsEdits,
                revFees:     totalFeesRevenue(feesEdits),
                revRegOther: revRegOtherEdits,
                revOther: revOtherTotal,
                revIrr:  revIrrEdits,
                ri:      riRollup,
                irrProj: irrProjEdits,
                ei:      { proj: irrProjEdits.reduce((s, p) => s + (p.amount || 0), 0) },
                ikReg:     ikRegFinal,
                ikRegRows: ikRegRowsEdits,
                ikIrr:     ikIrrFinal,
                ikIrrRows: ikIrrRowsEdits,
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

  // Per Willyanne 2026-05-29 (in-person): two group subtotals on the Regular
  // Expenses page — one summing every "Secretariat/mgmt." category, one summing
  // every "Ethics Committee" category. Classified by the category label prefix
  // (robust to row edits/additions, which inherit an existing category label).
  // The banner renders after the last category in each group; categories seed
  // in order (6 Secretariat, then 3 Ethics Committee), so the two subtotals
  // read as running group totals above the overall "Total regular expenses."
  const isSecretariatCat = (cat) => (cat || "").startsWith("Secretariat");
  const isEthicsCat      = (cat) => (cat || "").startsWith("Ethics Committee");
  const groupTotal = (pred) =>
    rows.reduce((s, r) => (pred(r?.category) ? s + (Number(r?.amount) || 0) : s), 0);
  const secretariatTotal = groupTotal(isSecretariatCat);
  const ethicsTotal      = groupTotal(isEthicsCat);
  const lastSecretariatIdx = EXPENSES_REGULAR_CATEGORIES.map(isSecretariatCat).lastIndexOf(true);
  const lastEthicsIdx      = EXPENSES_REGULAR_CATEGORIES.map(isEthicsCat).lastIndexOf(true);

  const SubtotalBanner = ({ label, value }) => (
    <div style={{ background: C.teal, color: "#fff", padding: "9px 16px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace" }}>
        {conv.displaySym}{conv.toDisplay(value).toLocaleString()}
      </span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {EXPENSES_REGULAR_CATEGORIES.map((cat, ci) => {
        const rowsInCat = rows
          .map((r, idx) => ({ row: r, idx }))
          .filter(({ row }) => row?.category === cat);
        const catTotal = rowsInCat.reduce((s, { row }) => s + (Number(row?.amount) || 0), 0);

        return (
          <Fragment key={cat}>
          <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, overflow: "hidden" }}>
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
          {ci === lastSecretariatIdx && (
            <SubtotalBanner label="Secretariat/mgmt. subtotal" value={secretariatTotal} />
          )}
          {ci === lastEthicsIdx && (
            <SubtotalBanner label="Ethics Committee subtotal" value={ethicsTotal} />
          )}
          </Fragment>
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

  // Per Willyanne 2026-05-30 (#1): mirror the Regular Expenses page with two
  // group subtotals — one summing every "Secretariat/mgmt." category, one
  // summing every "Ethics Committee" category. Classified by category-label
  // prefix (robust to row edits/additions, which inherit a category label) and
  // rendered as a banner after the last category in each group.
  const isSecretariatCat = (cat) => (cat || "").startsWith("Secretariat");
  const isEthicsCat      = (cat) => (cat || "").startsWith("Ethics Committee");
  const groupTotal = (pred) =>
    (irrProjEdits || []).reduce((s, r) => (pred(r?.category) ? s + (Number(r?.amount) || 0) : s), 0);
  const secretariatTotal = groupTotal(isSecretariatCat);
  const ethicsTotal      = groupTotal(isEthicsCat);
  const lastSecretariatIdx = IRREGULAR_CATEGORIES.map(isSecretariatCat).lastIndexOf(true);
  const lastEthicsIdx      = IRREGULAR_CATEGORIES.map(isEthicsCat).lastIndexOf(true);
  const SubtotalBanner = ({ label, value }) => (
    <div style={{ background: C.teal, color: "#fff", padding: "9px 16px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace" }}>${value.toLocaleString()}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {IRREGULAR_CATEGORIES.map((cat, ci) => {
        const rowsInCat = (irrProjEdits || [])
          .map((r, idx) => ({ row: r, idx }))
          .filter(({ row }) => row?.category === cat);
        const catTotal = rowsInCat.reduce((s, { row }) => s + (Number(row?.amount) || 0), 0);

        return (
          <Fragment key={cat}>
          <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, overflow: "hidden" }}>
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
          {ci === lastSecretariatIdx && (
            <SubtotalBanner label="Secretariat/mgmt. subtotal" value={secretariatTotal} />
          )}
          {ci === lastEthicsIdx && (
            <SubtotalBanner label="Ethics Committee subtotal" value={ethicsTotal} />
          )}
          </Fragment>
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
function StepRevenue({ conv, feesEdits, setFeesEdits, feesColumnsEdits, setFeesColumnsEdits, revRegOtherEdits, setRevRegOtherEdits, revIrrEdits, setRevIrrEdits, onIrregularVisited, visitedIrregular }) {
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
          feesColumnsEdits={feesColumnsEdits} setFeesColumnsEdits={setFeesColumnsEdits}
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

function StepRevenueRegular({ conv, feesEdits, setFeesEdits, feesColumnsEdits, setFeesColumnsEdits, revRegOtherEdits, setRevRegOtherEdits }) {
  // Safety net: if rows are missing or in a legacy shape, hydrate from defaults.
  // App.jsx's merge guard handles this on load too.
  useEffect(() => {
    if (!Array.isArray(revRegOtherEdits) || revRegOtherEdits.length === 0 ||
        revRegOtherEdits.some((r) => r && r.category === undefined)) {
      setRevRegOtherEdits(JSON.parse(JSON.stringify(REVENUE_REGULAR_OTHER_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feeTotal = totalFeesRevenue(feesEdits);
  const otherTotal = (revRegOtherEdits || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CollapsibleSection title="Regular Revenue from Fees" defaultOpen={true}>
        <StepRevenueFees
          conv={conv}
          feesEdits={feesEdits} setFeesEdits={setFeesEdits}
          feesColumnsEdits={feesColumnsEdits} setFeesColumnsEdits={setFeesColumnsEdits}
        />
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

// Tier 10 (Willyanne 2026-05-28): Regular Revenue from Fees rebuild.
// 15 review-type rows × 9 funder/student $/# column pairs (18 input cols).
// Column headers + row labels are editable; rows can be added or removed.
// Revenue auto-calculated per row (Σ amount × count across 9 cells) and
// summed for grand total. Table is horizontally scrollable via minWidth.
function StepRevenueFees({ conv, feesEdits, setFeesEdits, feesColumnsEdits, setFeesColumnsEdits }) {
  // Cell update: amount inputs go through conv.fromDisplay for currency
  // conversion (stored in USD internally); count inputs are integers.
  const updateCell = (rowIdx, colKey, field, raw) => {
    setFeesEdits((rows) => rows.map((r, i) => {
      if (i !== rowIdx) return r;
      const isAmount = field === "amount";
      let value;
      if (raw === "" || raw === null || raw === undefined) {
        value = null;
      } else {
        const parsed = parseFloat(raw);
        if (Number.isNaN(parsed)) { value = null; }
        else { value = isAmount ? conv.fromDisplay(parsed) : Math.max(0, Math.round(parsed)); }
      }
      const existingCell = r.cells?.[colKey] || { amount: null, count: null };
      return {
        ...r,
        cells: { ...r.cells, [colKey]: { ...existingCell, [field]: value } },
      };
    }));
  };

  const updateRowType = (rowIdx, value) => {
    setFeesEdits((rows) => rows.map((r, i) => i === rowIdx ? { ...r, type: value } : r));
  };

  const updateColumnLabel = (colKey, field, value) => {
    setFeesColumnsEdits((cols) => ({ ...cols, [colKey]: { ...cols[colKey], [field]: value } }));
  };

  const addRow = () => {
    setFeesEdits((rows) => [...rows, makeBlankFeeRow("")]);
  };

  const deleteRow = (rowIdx) => {
    setFeesEdits((rows) => rows.filter((_, i) => i !== rowIdx));
  };

  const grandTotal = totalFeesRevenue(feesEdits);

  // Cell-width constants — tuned so the table reliably exceeds the wizard's
  // ~960px content area on common viewports, forcing horizontal scroll.
  const W_TYPE = 220, W_DOLLAR = 100, W_COUNT = 80, W_REV = 130, W_DEL = 32;
  const minWidth = W_TYPE + 9 * (W_DOLLAR + W_COUNT) + W_REV + W_DEL;

  const cellInputStyle = {
    width: "100%", border: "1px solid #ccc", borderRadius: 4,
    padding: "5px 7px", fontSize: 12, textAlign: "right", fontFamily: "monospace",
  };
  // Tier 11 (Willyanne 2026-05-28B item #10): headers are 2-line wrapping
  // fields so the full column label is visible and the header row sits ~2×
  // as tall as the single-line cell inputs below it.
  const headerInputStyle = {
    width: "100%", border: "1px solid #cdd5dc", borderRadius: 4,
    padding: "4px 6px", fontSize: 11, fontWeight: 700, color: C.navy,
    background: "#fff", textAlign: "left",
    fontFamily: "inherit", lineHeight: 1.3, resize: "none",
    whiteSpace: "normal", overflow: "hidden", boxSizing: "border-box",
    display: "block",
  };
  const rowLabelInputStyle = {
    width: "100%", border: "1px solid #dde", borderRadius: 4,
    padding: "5px 7px", fontSize: 12, color: C.navy, background: "#fff",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ overflowX: "auto", border: "1px solid #dde", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth, width: "100%" }}>
          <thead>
            <tr style={{ background: C.lightBG, borderBottom: "1px solid #dde" }}>
              <th style={{ ...thStyle, width: W_TYPE, minWidth: W_TYPE, position: "sticky", left: 0, background: C.lightBG, zIndex: 2, borderRight: "1px solid #dde", verticalAlign: "top" }}>
                Review type
              </th>
              {FEES_COLUMN_KEYS.map((k) => {
                const labels = feesColumnsEdits[k] || FEES_DEFAULT_COLUMN_LABELS[k];
                return [
                  <th key={`${k}-d`} style={{ ...thStyle, width: W_DOLLAR, minWidth: W_DOLLAR, padding: "6px 6px", verticalAlign: "top" }}>
                    <textarea
                      rows={2}
                      value={labels.dollar}
                      onChange={(e) => updateColumnLabel(k, "dollar", e.target.value)}
                      style={headerInputStyle}
                      title="Editable column header"
                    />
                  </th>,
                  <th key={`${k}-c`} style={{ ...thStyle, width: W_COUNT, minWidth: W_COUNT, padding: "6px 6px", verticalAlign: "top" }}>
                    <textarea
                      rows={2}
                      value={labels.count}
                      onChange={(e) => updateColumnLabel(k, "count", e.target.value)}
                      style={headerInputStyle}
                      title="Editable column header"
                    />
                  </th>,
                ];
              })}
              <th style={{ ...thStyle, width: W_REV, minWidth: W_REV, textAlign: "right", verticalAlign: "top" }}>Revenue (USD)</th>
              <th style={{ ...thStyle, width: W_DEL, minWidth: W_DEL, verticalAlign: "top" }}></th>
            </tr>
          </thead>
          <tbody>
            {feesEdits.map((row, ri) => {
              const rev = rowRevenue(row);
              return (
                <tr key={ri} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "6px 8px", position: "sticky", left: 0, background: "#fff", zIndex: 1, borderRight: "1px solid #dde" }}>
                    <input
                      type="text"
                      value={row.type || ""}
                      onChange={(e) => updateRowType(ri, e.target.value)}
                      placeholder="Review type"
                      style={rowLabelInputStyle}
                    />
                  </td>
                  {FEES_COLUMN_KEYS.map((k) => {
                    const cell = row.cells?.[k] || { amount: null, count: null };
                    const amtBlank = cell.amount === null || cell.amount === undefined || cell.amount === "";
                    const cntBlank = cell.count === null || cell.count === undefined || cell.count === "";
                    return [
                      <td key={`${ri}-${k}-d`} style={{ padding: "4px 6px" }}>
                        <input
                          type="number" min="0"
                          value={amtBlank ? "" : Math.round(conv.toDisplay(cell.amount))}
                          onChange={(e) => updateCell(ri, k, "amount", e.target.value)}
                          style={cellInputStyle}
                        />
                      </td>,
                      <td key={`${ri}-${k}-c`} style={{ padding: "4px 6px" }}>
                        <input
                          type="number" min="0"
                          value={cntBlank ? "" : cell.count}
                          onChange={(e) => updateCell(ri, k, "count", e.target.value)}
                          style={cellInputStyle}
                        />
                      </td>,
                    ];
                  })}
                  <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: C.navy }}>
                    ${rev.toLocaleString()}
                  </td>
                  <td style={{ padding: "4px 2px", textAlign: "center" }}>
                    <button
                      onClick={() => deleteRow(ri)}
                      title="Delete this row"
                      style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 15, padding: "2px 4px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: "#fafbfc" }}>
              <td colSpan={2 + 2 * FEES_COLUMN_KEYS.length + 2} style={{ padding: "8px 10px" }}>
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
                  + Add row
                </button>
              </td>
            </tr>
            <tr style={{ fontWeight: 700, background: "#f8f8f8", borderTop: "1px solid #dde" }}>
              <td colSpan={1 + 2 * FEES_COLUMN_KEYS.length} style={{ padding: "9px 12px", color: C.navy }}>
                Total Revenue
              </td>
              <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", color: C.navy }}>
                ${grandTotal.toLocaleString()}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: C.blueGrey, fontStyle: "italic" }}>
        Revenue is always shown in USD. Fee amounts (the $-columns) convert based on your currency selection in Setup; counts (the #-columns) are integers. Scroll horizontally to see all columns. Column headers and row labels are editable.
      </div>
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

// ─── Step 4 / In-Kind Contributions ───────────────────────────────────────────
// Per Willyanne 2026-05-27 PM: In-Kind step split into Regular + Irregular
// sub-tabs (mirrors Expenses pattern). Each row has Item ⓘ + Amount +
// Currency conversion + Funding source dropdown + (Irregular only) start/end
// dates + red × delete. ⓘ content seeded from workbook col J on Regular and
// col L on Irregular; editable inline. Funding source dropdown = 3 options
// sourced from workbook 'Drop down options' col O.

function FundingSourceSelect({ value, onChange }) {
  return (
    <select
      value={value || ""}
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
    >
      <option value="">— select —</option>
      {IN_KIND_FUNDING_SOURCE_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function InKindStep({ conv, ikRegRowsEdits, setIkRegRowsEdits, ikIrrRowsEdits, setIkIrrRowsEdits, onIrregularVisited, visitedIrregular }) {
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
        <StepInKindRegular conv={conv} ikRegRowsEdits={ikRegRowsEdits} setIkRegRowsEdits={setIkRegRowsEdits} />
      )}
      {sub === "irregular" && (
        <StepInKindIrregular conv={conv} ikIrrRowsEdits={ikIrrRowsEdits} setIkIrrRowsEdits={setIkIrrRowsEdits} />
      )}
    </div>
  );
}

// Per Willyanne 2026-05-29 (in-person): subtotals by funding source on both
// In-Kind pages. Sums each row's amount grouped by its `funder` dropdown value
// (the 3 IN_KIND_FUNDING_SOURCE_OPTIONS). Amounts on rows with no funder
// selected are not attributed to any source but still count in the grand total.
function InKindFunderSubtotals({ rows, conv }) {
  const shortLabel = (opt) => {
    const m = opt.match(/\(([^)]+)\)/);
    const inner = m ? m[1] : opt;
    return inner.charAt(0).toUpperCase() + inner.slice(1);
  };
  const subtotal = (opt) =>
    (rows || []).reduce((s, r) => (r?.funder === opt ? s + (Number(r?.amount) || 0) : s), 0);
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>
        Subtotals by funding source
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {IN_KIND_FUNDING_SOURCE_OPTIONS.map((opt) => (
          <div key={opt} style={{ flex: "1 1 150px", background: C.steelblue, color: "#fff", padding: "9px 14px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{shortLabel(opt)}</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
              {conv.displaySym}{conv.toDisplay(subtotal(opt)).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepInKindRegular({ conv, ikRegRowsEdits, setIkRegRowsEdits }) {
  useEffect(() => {
    if (!Array.isArray(ikRegRowsEdits) || ikRegRowsEdits.length === 0) {
      setIkRegRowsEdits(JSON.parse(JSON.stringify(IN_KIND_REGULAR_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = Array.isArray(ikRegRowsEdits) ? ikRegRowsEdits : [];

  const updateRow = (idx, patch) => {
    setIkRegRowsEdits((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const addRow = (category) => {
    setIkRegRowsEdits((rs) => [
      ...rs,
      { category, item: "", funder: "", amount: null, description: "" },
    ]);
  };
  const deleteRow = (idx) => {
    setIkRegRowsEdits((rs) => rs.filter((_, i) => i !== idx));
  };

  const grandTotal = rows.reduce((s, r) => s + (Number(r?.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {IN_KIND_REGULAR_CATEGORIES.map((cat) => {
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 880 }}>
                <thead>
                  <tr style={{ background: "#f8fafb" }}>
                    <th style={{ ...thStyle, minWidth: 280 }}>Item</th>
                    <th style={{ ...thStyle, textAlign: "right", width: 140 }}>
                      Amount ({conv.displayCode === "USD" ? "US Dollars" : conv.displayCode})
                    </th>
                    {conv.showAlt && (
                      <th style={{ ...thStyle, textAlign: "right", width: 110 }}>≈ ({conv.altSym})</th>
                    )}
                    <th style={{ ...thStyle, width: 220 }}>Funding source</th>
                    <th style={{ ...thStyle, width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rowsInCat.length === 0 && (
                    <tr>
                      <td colSpan={conv.showAlt ? 5 : 4} style={{ padding: "14px 12px", fontSize: 12, color: "#999", fontStyle: "italic", textAlign: "center" }}>
                        No items yet — use + Add item below.
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
                      <td style={{ padding: "8px 10px" }}>
                        <FundingSourceSelect
                          value={row.funder}
                          onChange={(v) => updateRow(idx, { funder: v })}
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
                    <td colSpan={conv.showAlt ? 5 : 4} style={{ padding: "8px 10px" }}>
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

      <InKindFunderSubtotals rows={rows} conv={conv} />

      <div style={{ background: C.navy, color: "#fff", padding: "12px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total regular in-kind ({conv.displayCode})</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          {conv.displaySym}{conv.toDisplay(grandTotal).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function StepInKindIrregular({ conv, ikIrrRowsEdits, setIkIrrRowsEdits }) {
  useEffect(() => {
    if (!Array.isArray(ikIrrRowsEdits) || ikIrrRowsEdits.length === 0) {
      setIkIrrRowsEdits(JSON.parse(JSON.stringify(IN_KIND_IRREGULAR_DEFAULTS)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = Array.isArray(ikIrrRowsEdits) ? ikIrrRowsEdits : [];

  const updateRow = (idx, patch) => {
    setIkIrrRowsEdits((rs) => rs.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const addRow = (category) => {
    setIkIrrRowsEdits((rs) => [
      ...rs,
      { category, item: "", funder: "", amount: null, startDate: "", endDate: "", description: "" },
    ]);
  };
  const deleteRow = (idx) => {
    setIkIrrRowsEdits((rs) => rs.filter((_, i) => i !== idx));
  };

  const grandTotal = rows.reduce((s, r) => s + (Number(r?.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {IN_KIND_IRREGULAR_CATEGORIES.map((cat) => {
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1020 }}>
                <thead>
                  <tr style={{ background: "#f8fafb" }}>
                    <th style={{ ...thStyle, minWidth: 280 }}>Item</th>
                    <th style={{ ...thStyle, textAlign: "right", width: 130 }}>
                      Amount ({conv.displayCode === "USD" ? "US Dollars" : conv.displayCode})
                    </th>
                    {conv.showAlt && (
                      <th style={{ ...thStyle, textAlign: "right", width: 110 }}>≈ ({conv.altSym})</th>
                    )}
                    <th style={{ ...thStyle, width: 200 }}>Funding source</th>
                    <th style={{ ...thStyle, width: 120 }}>Start date</th>
                    <th style={{ ...thStyle, width: 120 }}>End date</th>
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
                        <FundingSourceSelect
                          value={row.funder}
                          onChange={(v) => updateRow(idx, { funder: v })}
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

      <InKindFunderSubtotals rows={rows} conv={conv} />

      <div style={{ background: C.navy, color: "#fff", padding: "12px 18px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total irregular in-kind (USD)</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
          ${grandTotal.toLocaleString()}
        </span>
      </div>
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

function StepReview({ country, activityRows, currency, budgetYear, erRowsEdits, irrProjEdits, feesEdits, revRegOtherEdits, revIrrEdits, ikRegRowsEdits, ikIrrRowsEdits }) {
  const filledActivities = activityRows.filter((r) => r.nearTerm && r.longTerm);
  const sumRows = (rows) => (rows || []).reduce((s, r) => s + (Number(r?.amount) || 0), 0);
  const totalRegExpenses = sumRows(erRowsEdits);
  const totalIrrExpenses = sumRows(irrProjEdits);
  const totalFeeRevenue  = totalFeesRevenue(feesEdits);
  const totalRegRevenue  = totalFeeRevenue + sumRows(revRegOtherEdits);
  const totalIrrRevenue  = sumRows(revIrrEdits);
  const totalIkReg       = sumRows(ikRegRowsEdits);
  const totalIkIrr       = sumRows(ikIrrRowsEdits);
  const usd = (v) => `$${Math.round(v).toLocaleString()}`;
  // Per Willyanne 2026-05-31 (later-morning #4): Review summary order is
  // Country · Currency · Budget year, then the seven totals, then activities.
  // All totals shown in USD (the dashboard's internal storage currency).
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={descStyle}>Review your responses before submitting. Submitting will save all changes to the TRACE database.</p>
      <div style={{ background: C.lightBG, borderRadius: 8, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Summary</div>
        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.9 }}>
          <div>Country: <strong>{country}</strong></div>
          <div>Currency: <strong>{currency.code} ({currency.symbol})</strong></div>
          <div>Budget year: <strong>{budgetYear || "—"}</strong></div>
          <div style={{ borderTop: `1px solid ${C.lightBorder || "#dde"}`, margin: "8px 0 4px" }} />
          <div>Total regular expenses: <strong>{usd(totalRegExpenses)}</strong></div>
          <div>Total irregular expenses: <strong>{usd(totalIrrExpenses)}</strong></div>
          <div>Total regular revenue: <strong>{usd(totalRegRevenue)}</strong></div>
          <div style={{ paddingLeft: 14, color: "#666" }}>— of which total fee revenue: <strong>{usd(totalFeeRevenue)}</strong></div>
          <div>Total irregular revenue: <strong>{usd(totalIrrRevenue)}</strong></div>
          <div>Total in-kind contributions (regular): <strong>{usd(totalIkReg)}</strong></div>
          <div>Total in-kind contributions (irregular): <strong>{usd(totalIkIrr)}</strong></div>
          <div style={{ borderTop: `1px solid ${C.lightBorder || "#dde"}`, margin: "8px 0 4px" }} />
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
