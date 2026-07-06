import { useState } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import { SURVEY_INTRO, QUESTIONS_INTRO, SURVEY_QUESTIONS } from "../data/feedbackSurvey";

// The Feedback tab. Per Willyanne (2026-05-31 afternoon) it's split into two grey
// sub-sections — like the Results tab's Overview/Expenses/etc. — each with its own
// Submit button: "Survey" and "Questions & Other Feedback". The two sections submit
// independently (one Supabase row each), so completing one doesn't disturb the other.
// Feedback ALWAYS persists, independent of DEMO_MODE (that only protects seeded data).

const SUB_TABS = [
  { id: "survey",    label: "Survey" },
  { id: "questions", label: "Questions & Other Feedback" },
];

export default function Feedback({ country, email }) {
  const [activeSub, setActiveSub] = useState("survey");

  // Shared identity — used by whichever section the participant submits.
  const [name, setName] = useState("");
  const [contactOk, setContactOk] = useState(false);
  const [contactEmail, setContactEmail] = useState("");

  // Survey section state
  const [responses, setResponses] = useState({}); // { q1: 4, q5: "text", ... }
  const [surveyStatus, setSurveyStatus] = useState("idle"); // idle | saving | done | error
  const [surveyErr, setSurveyErr] = useState("");

  // Questions section state
  const [message, setMessage] = useState("");
  const [qStatus, setQStatus] = useState("idle");
  const [qErr, setQErr] = useState("");

  const setAnswer = (id, value) =>
    setResponses((prev) => ({ ...prev, [id]: value }));

  // Completion progress — to encourage finishing without ever requiring it.
  const answeredCount = SURVEY_QUESTIONS.filter((q) => {
    const v = responses[q.id];
    return v !== undefined && v !== null && v !== "";
  }).length;
  const totalCount = SURVEY_QUESTIONS.length;
  const allAnswered = answeredCount === totalCount;
  const pct = Math.round((answeredCount / totalCount) * 100);

  const surveyHasInput = answeredCount > 0 || name.trim() !== "" || contactEmail.trim() !== "";
  const qHasInput = message.trim() !== "";

  // Common identity payload attached to either submission.
  const identityFields = () => ({
    respondent_name: name.trim() || null,
    contact_ok: contactOk,
    contact_email: contactOk ? (contactEmail.trim() || null) : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  });

  async function handleSurveySubmit() {
    if (surveyStatus === "saving") return;
    setSurveyStatus("saving");
    setSurveyErr("");
    try {
      const { error } = await supabase.from("feedback").insert({
        country: country || null,
        user_email: email || null,
        responses,
        message: null,
        ...identityFields(),
      });
      if (error) throw error;
      setSurveyStatus("done");
    } catch (err) {
      console.warn("Survey submit failed:", err.message);
      setSurveyErr(err.message || "Something went wrong.");
      setSurveyStatus("error");
    }
  }

  async function handleQuestionsSubmit() {
    if (qStatus === "saving") return;
    setQStatus("saving");
    setQErr("");
    try {
      const { error } = await supabase.from("feedback").insert({
        country: country || null,
        user_email: email || null,
        responses: {},
        message: message.trim() || null,
        ...identityFields(),
      });
      if (error) throw error;
      setQStatus("done");
    } catch (err) {
      console.warn("Questions submit failed:", err.message);
      setQErr(err.message || "Something went wrong.");
      setQStatus("error");
    }
  }

  function resetSurvey() {
    setResponses({});
    setSurveyStatus("idle");
    setSurveyErr("");
  }
  function resetQuestions() {
    setMessage("");
    setQStatus("idle");
    setQErr("");
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Feedback</h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          {country} · your responses help us improve the dashboard.
        </p>
      </div>

      {/* ───────── Grey sub-tabs (mirrors the Results tab) ───────── */}
      <div style={{ display: "flex", gap: 4, overflowX: "auto", borderBottom: `1px solid #dde`, paddingBottom: 0 }}>
        {SUB_TABS.map((t) => {
          const isActive = activeSub === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSub(t.id)}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.teal : C.blueGrey,
                background: "transparent",
                border: "none",
                borderBottom: `3px solid ${isActive ? C.teal : "transparent"}`,
                marginBottom: -1,
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: 44,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════ SURVEY ═════════════════════ */}
      {activeSub === "survey" && (
        surveyStatus === "done" ? (
          <ThankYou
            onAgain={resetSurvey}
            againLabel="Submit another survey response"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p style={blurbStyle}>{SURVEY_INTRO}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SURVEY_QUESTIONS.map((q, i) => (
                <QuestionCard key={q.id} number={i + 1}>
                  <div style={questionTextStyle}>{q.text}</div>
                  {q.type === "scale" ? (
                    <ScaleInput
                      value={responses[q.id]}
                      onChange={(v) => setAnswer(q.id, v)}
                      low={q.low}
                      high={q.high}
                    />
                  ) : (
                    <textarea
                      value={responses[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={2}
                      placeholder="Type your answer (optional)…"
                      style={textareaStyle}
                    />
                  )}
                </QuestionCard>
              ))}
            </div>

            {/* About you (optional) */}
            <AboutYou
              name={name} setName={setName}
              contactOk={contactOk} setContactOk={setContactOk}
              contactEmail={contactEmail} setContactEmail={setContactEmail}
            />

            {/* Completion nudge + Submit */}
            <div style={{ background: "#f4f8fa", border: "1px solid #e3e8ec", borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                  {allAnswered
                    ? `All ${totalCount} questions answered. Thank you!`
                    : `You've answered ${answeredCount} of ${totalCount} survey questions.`}
                </span>
                {!allAnswered && (
                  <span style={{ fontSize: 12, color: "#7a8690" }}>
                    Completing them all helps us most, but you can submit whenever you're ready.
                  </span>
                )}
              </div>
              <div style={{ height: 8, background: "#dde6ec", borderRadius: 5, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: allAnswered ? C.green : C.teal, transition: "width 0.2s" }} />
              </div>

              <SavedNote />

              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
                <button
                  onClick={handleSurveySubmit}
                  disabled={surveyStatus === "saving" || !surveyHasInput}
                  style={{
                    ...primaryBtn,
                    opacity: surveyStatus === "saving" || !surveyHasInput ? 0.55 : 1,
                    cursor: surveyStatus === "saving" || !surveyHasInput ? "default" : "pointer",
                  }}
                >
                  {surveyStatus === "saving" ? "Submitting…" : "Submit survey"}
                </button>
                {!surveyHasInput && (
                  <span style={{ fontSize: 12, color: "#888" }}>
                    Answer at least one question to submit.
                  </span>
                )}
                {surveyStatus === "error" && (
                  <span style={{ fontSize: 12, color: C.red }}>
                    Could not submit: {surveyErr} Please try again.
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ═════════════ QUESTIONS & OTHER FEEDBACK ═════════════ */}
      {activeSub === "questions" && (
        qStatus === "done" ? (
          <ThankYou
            onAgain={resetQuestions}
            againLabel="Submit more feedback"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p style={blurbStyle}>{QUESTIONS_INTRO}</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Enter your questions or feedback here…"
              style={{ ...textareaStyle, minHeight: 140 }}
            />

            {/* About you (optional) — shared with the survey section */}
            <AboutYou
              name={name} setName={setName}
              contactOk={contactOk} setContactOk={setContactOk}
              contactEmail={contactEmail} setContactEmail={setContactEmail}
            />

            <SavedNote />

            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
              <button
                onClick={handleQuestionsSubmit}
                disabled={qStatus === "saving" || !qHasInput}
                style={{
                  ...primaryBtn,
                  opacity: qStatus === "saving" || !qHasInput ? 0.55 : 1,
                  cursor: qStatus === "saving" || !qHasInput ? "default" : "pointer",
                }}
              >
                {qStatus === "saving" ? "Submitting…" : "Submit feedback"}
              </button>
              {!qHasInput && (
                <span style={{ fontSize: 12, color: "#888" }}>
                  Enter a question or comment to submit.
                </span>
              )}
              {qStatus === "error" && (
                <span style={{ fontSize: 12, color: C.red }}>
                  Could not submit: {qErr} Please try again.
                </span>
              )}
            </div>
          </div>
        )
      )}

      <div style={{ height: 12 }} />
    </div>
  );
}

// ───────────────────────── pieces ─────────────────────────

// Reassures participants that, unlike the sample financial data they edit while
// exploring (which the demo badge flags as "not saved"), their feedback IS
// recorded on Submit. Feedback always persists, independent of DEMO_MODE.
function SavedNote() {
  return (
    <p style={{
      display: "flex", alignItems: "flex-start", gap: 7,
      fontSize: 12.5, color: C.navy, lineHeight: 1.5,
      background: "#eef7f0", border: "1px solid #cfe6d5", borderRadius: 8,
      padding: "10px 12px", margin: "14px 0 0",
    }}>
      <span style={{ color: C.green, fontWeight: 800, flexShrink: 0 }}>✓</span>
      <span>
        Your responses are saved when you click Submit. The sample financial data
        you edit while exploring the dashboard is not kept, but your feedback here
        always is.
      </span>
    </p>
  );
}

function ThankYou({ onAgain, againLabel }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.teal}`, borderRadius: 12,
      padding: "40px 28px", textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.navy }}>Thank you!</div>
      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginTop: 8 }}>
        Your feedback has been recorded. We truly appreciate you taking the time
        to share your experience with the Financial Dashboard.
      </p>
      <button onClick={onAgain} style={secondaryBtn}>{againLabel}</button>
    </div>
  );
}

function AboutYou({ name, setName, contactOk, setContactOk, contactEmail, setContactEmail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionHeading>About You (optional)</SectionHeading>
      <p style={blurbStyle}>
        Sharing your name is optional. Let us know if we may follow up with you
        directly about your feedback.
      </p>
      <div>
        <label style={fieldLabel}>Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
          style={inputStyle}
        />
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={contactOk}
          onChange={(e) => setContactOk(e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: "pointer" }}
        />
        <span style={{ fontSize: 14, color: C.navy, lineHeight: 1.4 }}>
          Yes, the MRCT Center may contact me directly with any follow-up
          questions about my feedback.
        </span>
      </label>

      {contactOk && (
        <div>
          <label style={fieldLabel}>Best email to reach you</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@example.org"
            style={inputStyle}
          />
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }) {
  // "in grey font" per Willyanne's note.
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: "#6b7780",
      textTransform: "uppercase", letterSpacing: 1,
      borderBottom: "2px solid #e3e8ec", paddingBottom: 6, marginTop: 6,
    }}>
      {children}
    </div>
  );
}

function QuestionCard({ number, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
          background: C.lightBG, color: C.navy, fontWeight: 700, fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {number}
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function ScaleInput({ value, onChange, low, high }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(selected ? undefined : n)}
              aria-pressed={selected}
              style={{
                width: 46, height: 44, borderRadius: 8,
                border: selected ? `2px solid ${C.teal}` : "1px solid #cbd5dc",
                background: selected ? C.teal : "#fff",
                color: selected ? "#fff" : C.navy,
                fontWeight: 700, fontSize: 15, cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 286, marginTop: 5 }}>
        <span style={anchorStyle}>{low}</span>
        <span style={{ ...anchorStyle, textAlign: "right" }}>{high}</span>
      </div>
    </div>
  );
}

// ───────────────────────── styles ─────────────────────────

const blurbStyle = { fontSize: 14, color: "#444", lineHeight: 1.6, margin: 0 };
const questionTextStyle = { fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.45 };
const anchorStyle = { fontSize: 11, color: "#888", maxWidth: 120, lineHeight: 1.3 };
const textareaStyle = {
  width: "100%", marginTop: 8, padding: "9px 11px", fontSize: 14,
  border: "1px solid #cbd5dc", borderRadius: 8, fontFamily: "inherit",
  resize: "vertical", boxSizing: "border-box", color: C.navy,
};
const fieldLabel = { display: "block", fontSize: 12, fontWeight: 600, color: "#6b7780", marginBottom: 4 };
const inputStyle = {
  width: "100%", maxWidth: 360, padding: "9px 11px", fontSize: 14,
  border: "1px solid #cbd5dc", borderRadius: 8, fontFamily: "inherit",
  boxSizing: "border-box", color: C.navy,
};
const primaryBtn = {
  background: C.teal, color: "#fff", border: "none", borderRadius: 8,
  padding: "11px 30px", fontSize: 15, fontWeight: 700, minHeight: 46,
};
const secondaryBtn = {
  marginTop: 18, background: "#fff", color: C.teal, border: `1px solid ${C.teal}`,
  borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
