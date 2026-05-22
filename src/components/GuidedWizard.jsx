import { useState, useEffect } from "react";
import { COLORS as C } from "../utils/metrics";
import StepInstructions from "./StepInstructions";
import { WIZARD_STEP_INSTRUCTIONS } from "../data/instructions";

const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar"        },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling"  },
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira"   },
  { code: "RWF", symbol: "RF",  name: "Rwandan Franc"    },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ZWG", symbol: "ZiG", name: "Zimbabwe Gold"    },
];

const ACTIVITY_LIST = [
  "Managing and leading",
  "Developing/reviewing/conducting/advising on training",
  "Receipt, screening, and maintaining logs",
  "Determining risk, triaging, and assigning study proposals",
  "Reviewing minimal risk studies",
  "Reviewing, preparing for, and participating in full board meetings",
  "Minutes and record-keeping",
  "On-study review",
  "Close out of study",
  "Preparing and monitoring sites, inspections, and audits",
  "Participant feedback, concerns, complaints, questions",
  "Other ethics activities",
];

const ACTIVITY_DESCRIPTIONS = {
  "Managing and leading": "Drafting and updating SOPs; drafting and communicating policies (like the frequency and format of REC meetings); drafting and updating forms; creating email letter templates and checklists; reviewing plans for website redesign and language; networking and engaging new partners; hiring and managing staff; managing budgets; organizing meetings (other than ethics review/study determination meetings).",
  "Developing/reviewing/conducting/advising on training": "Advising on concepts; reviewing outlines, language and formatting for training on ethics; reviewing training materials; conducting training (arranging logistics, securing venues, giving lectures, following up on any questions); tracking ethics training expiration dates.",
  "Receipt, screening, and maintaining logs": "Reviewing completeness of the study protocol and plain language summary, informed consent documents, investigator's brochure, all study instruments; communicating with the study team as needed to complete the review for proposal completeness.",
  "Determining risk, triaging, and assigning study proposals": "Triaging Not Human Subjects Research Determinations (NHSRD) and Exempt Determinations; communicating with the study team as needed to make the determination; making risk determination (minimal risk / more than minimal risk).",
  "Reviewing minimal risk studies": "Reviewing minimal risk studies by an individual(s) delegated by the board; communicating with the study team as needed to complete the risk determination and review of minimal risk studies.",
  "Reviewing, preparing for, and participating in full board meetings": "Facilitating logistics for the ethics review meeting; confirming members and quorum; assigning primary and secondary reviewers; ensuring confidentiality agreements; preparing and sending agendas; reviewing/responding to emails; reading preparatory materials; assessing materials for ethics to prepare advanced questions; attending the meeting; communicating the decision.",
  "Minutes and record-keeping": "Compiling a list of determinations and minimal risk approvals and including the list in the Board's minutes. For full board review, taking notes and attendance and providing meeting minutes; record-keeping.",
  "On-study review": "Reviewing adverse events; reviewing protocol deviations; reviewing protocol amendments and appeals; notifying study staff of upcoming deadlines and monitoring; conducting annual review.",
  "Close out of study": "Providing ethical oversight of studies in the data analysis phase; review study closure form; retain all study-related information.",
  "Preparing and monitoring sites, inspections, and audits": "Providing tools such as document templates, regulatory binders, and educational programs; following up on any outstanding issues; retaining all monitoring documents.",
  "Participant feedback, concerns, complaints, questions": "Receiving, triaging, and responding to participants' feedback including complaints, concerns and questions about research; deciding on the most appropriate follow up procedures; retaining all documentation.",
  "Other ethics activities": "Participating in ethics training; learning new software or ethics review processes; traveling to ethics conferences/meetings; staying abreast of any changes in national or international regulations or guidance.",
};

const TREND_OPTIONS = ["Remain the same", "Increase", "Decrease"];

// ─── Wizard draft persistence ────────────────────────────────────────────────
// PROTOTYPE ONLY: localStorage-based draft persistence (per browser, per device).
// Before production deployment with real country teams, this MUST be replaced
// with server-side persistence (Supabase) so drafts survive logout and follow
// the user across devices. See plan velvety-seeking-marble.md.
const DRAFT_VERSION = 2;
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
  const [currency, setCurrency]   = useState(() => CURRENCIES.find((c) => c.code === draft?.currencyCode) || CURRENCIES[0]);
  const [inputMode, setInputMode] = useState(() => draft?.inputMode || "usd"); // "usd" | "local"
  const [exchangeRate, setExchangeRate] = useState(1);
  const [rateLoading, setRateLoading]   = useState(false);
  const [rateError, setRateError]       = useState(null);

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
      step, currencyCode: currency.code, inputMode,
      hasRisks, hasOpps, riskText, oppText,
      activityRows, stepSources, stepNotes,
      erEdits, feesEdits, irrProjEdits, ikRegEdits, ikIrrEdits,
    });
    setDraftSavedAt(new Date().toISOString());
  }, [country, submitted, step, currency.code, inputMode, hasRisks, hasOpps, riskText, oppText, activityRows, stepSources, stepNotes, erEdits, feesEdits, irrProjEdits, ikRegEdits, ikIrrEdits]);

  // Fetch live exchange rate whenever currency changes
  useEffect(() => {
    if (currency.code === "USD") { setExchangeRate(1); setRateError(null); return; }
    setRateLoading(true);
    setRateError(null);
    fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json")
      .then((r) => r.json())
      .then((json) => {
        const rate = json.usd?.[currency.code.toLowerCase()];
        if (rate) setExchangeRate(rate);
        else setRateError(`Rate not available for ${currency.code}`);
      })
      .catch(() => setRateError("Could not fetch exchange rate"))
      .finally(() => setRateLoading(false));
  }, [currency.code]);

  // Conversion helpers — canConvert is false while rate is loading/errored
  const canConvert = inputMode === "local" && currency.code !== "USD" && !rateError && !rateLoading;
  const toDisplay  = (usd) => canConvert ? Math.round((usd || 0) * exchangeRate) : (usd || 0);
  const fromDisplay = (val) => canConvert ? val / exchangeRate : val;
  const displaySym  = canConvert ? currency.symbol : "$";
  const showAlt     = currency.code !== "USD";
  const altSym      = canConvert ? "$" : currency.symbol;
  const toAlt       = (usd) => canConvert ? (usd || 0) : Math.round((usd || 0) * exchangeRate);

  const displayCode = canConvert ? currency.code : "USD";
  const conv = { toDisplay, fromDisplay, displaySym, altSym, toAlt, showAlt, displayCode };

  const currentStep = STEPS[step];
  const canAdvance  = stepSources[step].trim().length > 0 && stepNotes[step].trim().length > 0;

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
              currency={currency} onCurrencyChange={(c) => { setCurrency(c); setInputMode("usd"); }}
              inputMode={inputMode} onInputModeChange={setInputMode}
              exchangeRate={exchangeRate} rateLoading={rateLoading} rateError={rateError}
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
              data={data}
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
                {!canAdvance && (
                  <div style={{ fontSize: 12, color: C.red, fontStyle: "italic" }}>
                    Please fill in both the data source and notes to continue.
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
            title={!canAdvance ? "Fill in data source and notes to continue" : ""}
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
                currencyCode: currency.code,
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

function StepSetup({ currency, onCurrencyChange, inputMode, onInputModeChange, exchangeRate, rateLoading, rateError }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={descStyle}>Select the currency your committee uses for budgeting, then choose how you want to enter amounts.</p>

      <div>
        <label style={labelStyle}>Reporting currency</label>
        <select
          value={currency.code}
          onChange={(e) => onCurrencyChange(CURRENCIES.find((c) => c.code === e.target.value))}
          style={selectStyle}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Enter amounts in</label>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          {[
            { val: "usd",   label: "US Dollars ($)" },
            { val: "local", label: `${currency.code} (${currency.symbol})` },
          ].map((opt) => {
            const disabled = opt.val === "local" && (currency.code === "USD" || rateLoading || !!rateError);
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

        {rateLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: C.blueGrey }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.yellow, display: "inline-block", animation: "pulse 1s infinite" }} />
            Fetching live exchange rate…
          </div>
        )}
        {rateError && (
          <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>⚠ {rateError}. Amounts will display in USD.</div>
        )}
        {!rateLoading && !rateError && currency.code !== "USD" && (
          <div style={{ marginTop: 10, background: "#eef8f4", border: `1px solid ${C.teal}`, borderRadius: 7, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ marginTop: 2 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.teal, marginRight: 6 }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
                Live rate: 1 USD = {exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {currency.code}
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 3, lineHeight: 1.5 }}>
                Rate fetched live each session — not a fixed rate. Amounts shown in {currency.code} are converted at today's market rate and will vary if you return tomorrow.
              </div>
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

const ER_ROWS = [
  ["secSal",  "Secretariat — Salaries"  ],
  ["secBen",  "Secretariat — Benefits"  ],
  ["secRec",  "Secretariat — Recurring" ],
  ["nSal",    "NEC — Payments"          ],
  ["nBen",    "NEC — Benefits"          ],
  ["nRec",    "NEC — Recurring"         ],
  ["recG",    "Recurring — Grants"      ],
  ["recGov",  "Recurring — Gov't"       ],
];

function StepExpenses({ conv, erEdits, setErEdits }) {
  const total = ER_ROWS.reduce((s, [k]) => s + (erEdits[k] || 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>Enter or update the regular annual expenses for your committee. All amounts are in {conv.displayCode} — toggle the currency in Step 1 to switch.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.lightBG }}>
            <th style={thStyle}>Category</th>
            <th style={{ ...thStyle, textAlign: "right", width: 160 }}>Amount ({conv.displayCode})</th>
          </tr>
        </thead>
        <tbody>
          {ER_ROWS.map(([key, label]) => (
            <tr key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "9px 12px" }}>{label}</td>
              <td style={{ padding: "6px 12px" }}>
                <AmountInput usdVal={erEdits[key] || 0} conv={conv}
                  onChangeUSD={(v) => setErEdits((e) => ({ ...e, [key]: v }))} />
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, background: "#f8f8f8" }}>
            <td style={{ padding: "9px 12px" }}>Total</td>
            <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>
              {conv.displaySym}{conv.toDisplay(total).toLocaleString()}
              {conv.showAlt && <div style={{ fontSize: 11, color: C.blueGrey, fontWeight: 400 }}>≈ {conv.altSym} {Math.round(conv.toAlt(total)).toLocaleString()}</div>}
            </td>
          </tr>
        </tbody>
      </table>
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
    <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid #e0e6ea` }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "9px 18px", fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? C.teal : C.blueGrey,
              background: "transparent", border: "none",
              borderBottom: `3px solid ${isActive ? C.teal : "transparent"}`,
              marginBottom: -1, cursor: "pointer",
              whiteSpace: "nowrap", minHeight: 40,
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
        <StepActivities rows={activityRows} onUpdate={onUpdateActivity} />
      )}
    </div>
  );
}

// ─── Step 3: Expenses (sub-tabs: Regular | Irregular) ─────────────────────────

function ExpensesStep({ conv, erEdits, setErEdits, irrProjEdits, setIrrProjEdits, data }) {
  const [sub, setSub] = useState("regular");
  return (
    <div>
      <SubTabs
        tabs={[
          { id: "regular",   label: "Regular" },
          { id: "irregular", label: "Irregular" },
        ]}
        active={sub} onChange={setSub}
      />
      {sub === "regular" && (
        <StepExpenses conv={conv} erEdits={erEdits} setErEdits={setErEdits} />
      )}
      {sub === "irregular" && (
        <StepIrregular conv={conv} irrProjEdits={irrProjEdits} setIrrProjEdits={setIrrProjEdits} data={data} />
      )}
    </div>
  );
}

function StepReview({ country, activityRows, currency, erEdits, feesEdits }) {
  const filledActivities = activityRows.filter((r) => r.nearTerm && r.longTerm);
  const totalExpenses = ER_ROWS.reduce((s, [k]) => s + (erEdits[k] || 0), 0);
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
