import { useState } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import { SURVEY_INTRO, QUESTIONS_INTRO, SURVEY_QUESTIONS } from "../data/feedbackSurvey";

// The Feedback tab — designed as the final step participants complete live in the
// room. Everything is on one page with a single Submit, every field is optional,
// and it ALWAYS persists to Supabase (the `feedback` table), independent of
// DEMO_MODE — DEMO_MODE only protects the seeded country data, not real feedback.

export default function Feedback({ country, email }) {
  const [responses, setResponses] = useState({}); // { q1: 4, q5: "text", ... }
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");   // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const setAnswer = (id, value) =>
    setResponses((prev) => ({ ...prev, [id]: value }));

  const hasAnyInput =
    Object.values(responses).some((v) => v !== "" && v !== undefined && v !== null) ||
    message.trim() !== "";

  // Completion progress — to encourage finishing without ever requiring it.
  const answeredCount = SURVEY_QUESTIONS.filter((q) => {
    const v = responses[q.id];
    return v !== undefined && v !== null && v !== "";
  }).length;
  const totalCount = SURVEY_QUESTIONS.length;
  const allAnswered = answeredCount === totalCount;
  const pct = Math.round((answeredCount / totalCount) * 100);

  async function handleSubmit() {
    if (status === "saving") return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const { error } = await supabase.from("feedback").insert({
        country: country || null,
        user_email: email || null,
        responses,
        message: message.trim() || null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;
      setStatus("done");
    } catch (err) {
      console.warn("Feedback submit failed:", err.message);
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  function resetForm() {
    setResponses({});
    setMessage("");
    setStatus("idle");
    setErrorMsg("");
  }

  if (status === "done") {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
          <button onClick={resetForm} style={secondaryBtn}>Submit another response</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Feedback</h1>
        <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
          {country} · your responses help us improve the dashboard.
        </p>
      </div>

      {/* ───────── Survey ───────── */}
      <SectionHeading>Survey</SectionHeading>
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

      {/* ───────── Questions or Other Feedback ───────── */}
      <SectionHeading>Questions or Other Feedback</SectionHeading>
      <p style={blurbStyle}>{QUESTIONS_INTRO}</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Enter your questions or feedback here…"
        style={{ ...textareaStyle, minHeight: 96 }}
      />

      {/* ───────── Completion nudge + Submit ───────── */}
      <div style={{ background: "#f4f8fa", border: "1px solid #e3e8ec", borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
            {allAnswered
              ? "All 10 questions answered. Thank you!"
              : `You've answered ${answeredCount} of ${totalCount} survey questions.`}
          </span>
          {!allAnswered && (
            <span style={{ fontSize: 12, color: "#7a8690" }}>
              Completing them all helps us most, but you can submit whenever you're ready.
            </span>
          )}
        </div>
        {/* progress bar */}
        <div style={{ height: 8, background: "#dde6ec", borderRadius: 5, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: allAnswered ? C.green : C.teal, transition: "width 0.2s" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
          <button
            onClick={handleSubmit}
            disabled={status === "saving" || !hasAnyInput}
            style={{
              ...primaryBtn,
              opacity: status === "saving" || !hasAnyInput ? 0.55 : 1,
              cursor: status === "saving" || !hasAnyInput ? "default" : "pointer",
            }}
          >
            {status === "saving" ? "Submitting…" : "Submit"}
          </button>
          {!hasAnyInput && (
            <span style={{ fontSize: 12, color: "#888" }}>
              Answer at least one question to submit.
            </span>
          )}
          {status === "error" && (
            <span style={{ fontSize: 12, color: C.red }}>
              Could not submit: {errorMsg} Please try again.
            </span>
          )}
        </div>
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}

// ───────────────────────── pieces ─────────────────────────

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
const primaryBtn = {
  background: C.teal, color: "#fff", border: "none", borderRadius: 8,
  padding: "11px 30px", fontSize: 15, fontWeight: 700, minHeight: 46,
};
const secondaryBtn = {
  marginTop: 18, background: "#fff", color: C.teal, border: `1px solid ${C.teal}`,
  borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
