import { useState } from "react";
import { COLORS as C } from "../utils/metrics";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "RWF", symbol: "RF", name: "Rwandan Franc" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "ZWG", symbol: "ZiG", name: "Zimbabwe Gold" },
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

const STEPS = [
  { id: "setup",      label: "1. Setup",        title: "Country & Unit Setup" },
  { id: "risks",      label: "2. Risks & Opps", title: "Financial Risks & Opportunities" },
  { id: "expenses",   label: "3. Expenses",      title: "Regular Expenses" },
  { id: "revenue",    label: "4. Revenue",       title: "Regular Revenue" },
  { id: "irregular",  label: "5. Irregular",     title: "Irregular Budget" },
  { id: "inKind",     label: "6. In-Kind",       title: "In-Kind Contributions" },
  { id: "activities", label: "7. Activities",    title: "Activity Planning" },
  { id: "review",     label: "8. Review",        title: "Review & Submit" },
];

export default function GuidedWizard({ country, data }) {
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [hasRisks, setHasRisks] = useState("");
  const [hasOpps, setHasOpps] = useState("");
  const [riskText, setRiskText] = useState("");
  const [oppText, setOppText] = useState("");
  const [activityRows, setActivityRows] = useState(
    ACTIVITY_LIST.map((name) => ({ name, nearTerm: "", longTerm: "", note: "", sources: "", dataSource: "" }))
  );
  const [stepSources, setStepSources] = useState(Array(STEPS.length).fill(""));
  const [stepNotes, setStepNotes] = useState(Array(STEPS.length).fill(""));
  const [submitted, setSubmitted] = useState(false);

  const currentStep = STEPS[step];
  const canAdvance = stepSources[step].trim().length > 0 && stepNotes[step].trim().length > 0;

  function updateActivity(i, field, val) {
    setActivityRows((rows) => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto", background: "#fff", borderRadius: 12, padding: "40px 32px", border: "1px solid #dde", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, color: C.navy, marginBottom: 10 }}>Data submitted!</h2>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
          Your responses have been recorded. In the live version, this will save to the TRACE database.
          For now, use the Overview and other tabs to review your country's data.
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
      <div style={{ background: C.navy, borderRadius: 10, padding: "16px 22px", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Guided Wizard — {country}</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Enter data step by step. Each step requires a data source and notes before advancing.</div>
      </div>

      {/* Step progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => i < step && setStep(i)}
            style={{
              flex: "1 1 auto",
              padding: "6px 4px",
              fontSize: 11,
              borderRadius: 5,
              background: i === step ? C.teal : i < step ? C.darkNavy : "#dde",
              color: i <= step ? "#fff" : C.blueGrey,
              fontWeight: i === step ? 700 : 400,
              whiteSpace: "nowrap",
              cursor: i < step ? "pointer" : "default",
              minHeight: 36,
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

          {step === 0 && (
            <StepSetup currency={currency} onCurrencyChange={setCurrency} />
          )}
          {step === 1 && (
            <StepRisks
              hasRisks={hasRisks} onHasRisks={setHasRisks}
              hasOpps={hasOpps} onHasOpps={setHasOpps}
              riskText={riskText} onRiskText={setRiskText}
              oppText={oppText} onOppText={setOppText}
            />
          )}
          {step === 2 && <StepExpenses currency={currency} data={data} />}
          {step === 3 && <StepRevenue currency={currency} data={data} />}
          {step === 4 && <StepIrregular currency={currency} data={data} />}
          {step === 5 && <StepInKind currency={currency} data={data} />}
          {step === 6 && (
            <StepActivities
              rows={activityRows}
              onUpdate={updateActivity}
            />
          )}
          {step === 7 && <StepReview country={country} activityRows={activityRows} currency={currency} />}

          {/* Sources & Notes — required on every step except review */}
          {step < 7 && (
            <div style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Required before advancing</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data source <span style={{ color: C.red }}>*</span></label>
                  <textarea
                    value={stepSources[step]}
                    onChange={(e) => setStepSources((s) => s.map((v, i) => i === step ? e.target.value : v))}
                    placeholder="List your data source (document name, date, URL, or page reference)..."
                    style={textareaStyle}
                    rows={2}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Notes / calculations <span style={{ color: C.red }}>*</span></label>
                  <textarea
                    value={stepNotes[step]}
                    onChange={(e) => setStepNotes((s) => s.map((v, i) => i === step ? e.target.value : v))}
                    placeholder="Add any notes, assumptions, or calculations relevant to this step..."
                    style={textareaStyle}
                    rows={2}
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
            onClick={() => setSubmitted(true)}
            style={{ ...navBtnStyle, background: C.green, color: "#fff" }}
          >
            Submit ✓
          </button>
        )}
      </div>
    </div>
  );
}

function StepSetup({ currency, onCurrencyChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={descStyle}>Select the currency your committee uses for budgeting. All amount fields throughout this wizard will use this currency symbol.</p>
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
      <div style={{ background: "#f4f6f8", borderRadius: 7, padding: "12px 16px", fontSize: 13, color: "#555" }}>
        <strong>Note:</strong> The dashboard currently displays all amounts in USD. Local currency selection is recorded here for reference.
        Conversion functionality will be added in a future version.
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
            <button
              key={opt}
              onClick={() => onHasRisks(opt.toLowerCase())}
              style={{ ...toggleBtnStyle, background: hasRisks === opt.toLowerCase() ? C.red : "#f4f6f8", color: hasRisks === opt.toLowerCase() ? "#fff" : C.navy, border: `1px solid ${hasRisks === opt.toLowerCase() ? C.red : "#dde"}` }}
            >
              {opt}
            </button>
          ))}
        </div>
        {hasRisks === "yes" && (
          <textarea
            value={riskText}
            onChange={(e) => onRiskText(e.target.value)}
            placeholder="Describe the risks and how significantly you think they will impact ethics review..."
            style={{ ...textareaStyle, marginTop: 10 }}
            rows={3}
          />
        )}
      </div>
      <div>
        <label style={labelStyle}>Do you expect major financial opportunities in the next year?</label>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              onClick={() => onHasOpps(opt.toLowerCase())}
              style={{ ...toggleBtnStyle, background: hasOpps === opt.toLowerCase() ? C.teal : "#f4f6f8", color: hasOpps === opt.toLowerCase() ? "#fff" : C.navy, border: `1px solid ${hasOpps === opt.toLowerCase() ? C.teal : "#dde"}` }}
            >
              {opt}
            </button>
          ))}
        </div>
        {hasOpps === "yes" && (
          <textarea
            value={oppText}
            onChange={(e) => onOppText(e.target.value)}
            placeholder="Describe the opportunities and how significantly you think they will impact ethics review..."
            style={{ ...textareaStyle, marginTop: 10 }}
            rows={3}
          />
        )}
      </div>
    </div>
  );
}

function StepExpenses({ currency, data: d }) {
  const sym = currency.symbol;
  const rows = [
    ["Secretariat — Salaries", d.er.secSal],
    ["Secretariat — Benefits", d.er.secBen],
    ["Secretariat — Recurring", d.er.secRec],
    ["NEC — Payments", d.er.nSal],
    ["NEC — Benefits", d.er.nBen],
    ["NEC — Recurring", d.er.nRec],
    ["Recurring — Grants", d.er.recG],
    ["Recurring — Gov't", d.er.recGov],
  ].filter(([, v]) => v > 0);
  const total = rows.reduce((s, [, v]) => s + v, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>Review the regular expenses for your committee. These are recurring annual costs. (Editing will be enabled in a future version.)</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.lightBG }}>
            <th style={thStyle}>Category</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Amount ({sym})</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, val]) => (
            <tr key={label} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: "9px 12px" }}>{label}</td>
              <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>{sym}{val?.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, background: "#f8f8f8" }}>
            <td style={{ padding: "9px 12px" }}>Total</td>
            <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>{sym}{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 12, color: C.blueGrey, fontStyle: "italic" }}>Data shown from current country record. Enter your source and notes below.</div>
    </div>
  );
}

function StepRevenue({ currency, data: d }) {
  const sym = currency.symbol;
  const feeRows = d.fees || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>Review your regular revenue — fees collected for ethics review by type. (Editing will be enabled in a future version.)</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.lightBG }}>
            <th style={thStyle}>Review type</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Pro fee</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Pro count</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Stu fee</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Stu count</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {feeRows.map((f, i) => {
            const total = (f.ctPro || 0) * f.ind + (f.ctStu || 0) * f.ngo;
            return (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "8px 10px" }}>{f.type}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{sym}{f.ind?.toLocaleString()}</td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>{f.ctPro || 0}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{sym}{f.ngo?.toLocaleString()}</td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>{f.ctStu || 0}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{sym}{total.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StepIrregular({ currency, data: d }) {
  const sym = currency.symbol;
  const irrProj = d.irrProj || [];
  const riEntries = Object.entries(d.ri || {}).filter(([, v]) => v > 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={descStyle}>Irregular expenses are project-based costs funded by grants. Irregular revenue includes grants and other time-limited funding.</p>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>Irregular Expenses</div>
      {irrProj.length === 0 ? <p style={{ fontSize: 13, color: C.blueGrey }}>No irregular expenses recorded.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: C.lightBG }}><th style={thStyle}>Project</th><th style={thStyle}>Funder</th><th style={{ ...thStyle, textAlign: "right" }}>Amount</th></tr></thead>
          <tbody>{irrProj.map((p, i) => <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}><td style={{ padding: "8px 10px" }}>{p.name}</td><td style={{ padding: "8px 10px" }}>{p.funder}</td><td style={{ padding: "8px 10px", textAlign: "right" }}>{sym}{p.amount?.toLocaleString()}</td></tr>)}</tbody>
        </table>
      )}
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginTop: 8 }}>Irregular Revenue</div>
      {riEntries.length === 0 ? <p style={{ fontSize: 13, color: C.blueGrey }}>No irregular revenue recorded.</p> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {riEntries.map(([k, v]) => <div key={k} style={{ background: "#f4f6f8", borderRadius: 7, padding: "10px 14px", flex: "1 1 120px" }}><div style={{ fontSize: 12, color: C.blueGrey, textTransform: "capitalize" }}>{k}</div><div style={{ fontSize: 17, fontWeight: 700, color: C.purple }}>{sym}{v?.toLocaleString()}</div></div>)}
        </div>
      )}
    </div>
  );
}

function StepInKind({ currency, data: d }) {
  const sym = currency.symbol;
  const ik = d.ikReg || {};
  const ikIrr = d.ikIrr || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={descStyle}>In-kind contributions are non-cash support — staff time, equipment, office space — donated by external organizations. They are tracked separately and not yet included in gap calculations.</p>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>Regular In-Kind</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {[["Federal", ik.federal], ["Institutional", ik.institutional], ["Other", ik.other], ["Total", ik.total]].map(([label, val]) => (
          <div key={label} style={{ background: label === "Total" ? C.navy : "#f4f6f8", borderRadius: 7, padding: "10px 14px", flex: "1 1 120px" }}>
            <div style={{ fontSize: 12, color: label === "Total" ? "rgba(255,255,255,0.7)" : C.blueGrey }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: label === "Total" ? C.yellow : C.steelblue }}>{sym}{(val || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginTop: 4 }}>Irregular In-Kind</div>
      <div style={{ background: "#f4f6f8", borderRadius: 7, padding: "10px 14px" }}>
        <div style={{ fontSize: 12, color: C.blueGrey }}>Total</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.steelblue }}>{sym}{(ikIrr.total || 0).toLocaleString()}</div>
      </div>
      <div style={{ fontSize: 12, color: C.blueGrey, fontStyle: "italic", background: "#eef4ff", padding: "10px 14px", borderRadius: 6, borderLeft: `3px solid ${C.steelblue}` }}>
        In-kind will factor into gap calculations in Phase 2 after the logic is confirmed with the TRACE team.
      </div>
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
    <select
      value={val}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...selectStyle, fontSize: 12, color, fontWeight: val ? 600 : 400, borderColor: val ? color : "#dde" }}
    >
      <option value="">Select…</option>
      {TREND_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function StepReview({ country, activityRows, currency }) {
  const filledActivities = activityRows.filter((r) => r.nearTerm && r.longTerm);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={descStyle}>Review your responses before submitting. In the live version, this will save to the TRACE database.</p>
      <div style={{ background: C.lightBG, borderRadius: 8, padding: "14px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Summary</div>
        <div style={{ fontSize: 13, color: "#444", lineHeight: 1.9 }}>
          <div>Country: <strong>{country}</strong></div>
          <div>Currency: <strong>{currency.code} ({currency.symbol})</strong></div>
          <div>Activities with near/long-term expectations filled in: <strong>{filledActivities.length} / {activityRows.length}</strong></div>
        </div>
      </div>
      {filledActivities.length < activityRows.length && (
        <div style={{ background: "#fff8e8", border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#5a4000" }}>
          {activityRows.length - filledActivities.length} activities don't have both near-term and long-term selections. You can go back to complete them or submit now.
        </div>
      )}
      <div style={{ fontSize: 13, color: C.blueGrey, fontStyle: "italic" }}>
        Click "Submit ✓" to complete this wizard entry.
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 5 };
const textareaStyle = { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: "8px 10px", fontSize: 13, resize: "vertical", minHeight: 60 };
const selectStyle = { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: "8px 10px", fontSize: 13, minHeight: 40, background: "#fff" };
const navBtnStyle = { borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, minHeight: 44 };
const toggleBtnStyle = { borderRadius: 7, padding: "8px 20px", fontSize: 14, fontWeight: 600, minHeight: 40 };
const thStyle = { padding: "8px 10px", textAlign: "left", color: C.navy, fontWeight: 700, fontSize: 12 };
const descStyle = { fontSize: 13, color: "#555", lineHeight: 1.65, fontStyle: "italic" };
