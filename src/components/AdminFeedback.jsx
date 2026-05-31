import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import { SURVEY_QUESTIONS } from "../data/feedbackSurvey";

// Admin view of everything submitted through the Feedback tab — both the survey
// responses and the open "Questions or Other Feedback" messages. Reads the
// `feedback` table directly (prototype anon key). Shown inside the Admin tab.

const SCALE_Q = SURVEY_QUESTIONS.filter((q) => q.type === "scale");
const TEXT_Q = SURVEY_QUESTIONS.filter((q) => q.type === "text");

export default function AdminFeedback() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, created_at, country, user_email, responses, message, respondent_name, contact_ok, contact_email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load feedback.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const surveyRows = rows.filter((r) => hasSurveyAnswers(r.responses));
  const messageRows = rows.filter((r) => r.message && r.message.trim());
  const contactRows = rows.filter((r) => r.contact_ok);

  // Per-scale-question average across all responses that answered it.
  const averages = SCALE_Q.map((q) => {
    const vals = rows
      .map((r) => Number(r.responses?.[q.id]))
      .filter((n) => n >= 1 && n <= 5);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { ...q, avg, n: vals.length };
  });

  function exportCSV() {
    const headers = [
      "Submitted", "Country", "Login", "Name", "May contact?", "Contact email",
      ...SURVEY_QUESTIONS.map((q, i) => `Q${i + 1}`),
      "Question/Other feedback",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [
        new Date(r.created_at).toLocaleString(),
        r.country || "",
        r.user_email || "",
        r.respondent_name || "",
        r.contact_ok ? "Yes" : "No",
        r.contact_email || "",
        ...SURVEY_QUESTIONS.map((q) => r.responses?.[q.id] ?? ""),
        r.message || "",
      ].map(esc).join(",")
    );
    const csv = [headers.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TRACE-feedback-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "16px 22px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Feedback Inbox 📨</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            {rows.length} submission{rows.length === 1 ? "" : "s"} · survey responses and open questions
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={ghostBtn}>↻ Refresh</button>
          <button onClick={exportCSV} disabled={!rows.length} style={{ ...tealBtn, opacity: rows.length ? 1 : 0.5 }}>
            Export feedback CSV
          </button>
        </div>
      </div>

      {status === "loading" && <Note>Loading feedback…</Note>}
      {status === "error" && <Note color={C.red}>Could not load feedback: {errorMsg}</Note>}

      {status === "ready" && rows.length === 0 && (
        <Note>No feedback has been submitted yet. Responses from the Feedback tab will appear here.</Note>
      )}

      {status === "ready" && rows.length > 0 && (
        <>
          {/* Scale averages */}
          <Card title="Survey — average rating per question (1–5)">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.lightBG }}>
                    <th style={thL}>Question</th>
                    <th style={thR}>Average</th>
                    <th style={thR}>Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {averages.map((q) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "9px 12px", color: C.navy }}>{q.text}</td>
                      <td style={{ ...tdR, fontWeight: 700, color: C.teal }}>
                        {q.avg != null ? q.avg.toFixed(1) : "—"}
                      </td>
                      <td style={tdR}>{q.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Full survey responses */}
          <Card title={`Survey responses (${surveyRows.length})`}>
            {surveyRows.length === 0 ? (
              <Note>No survey answers yet.</Note>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.lightBG }}>
                      <th style={thL}>When</th>
                      <th style={thL}>Country</th>
                      <th style={thL}>Name</th>
                      <th style={thL}>Contact?</th>
                      {SCALE_Q.map((q, i) => (
                        <th key={q.id} style={{ ...thR, whiteSpace: "nowrap" }} title={q.text}>
                          Q{SURVEY_QUESTIONS.indexOf(q) + 1}
                        </th>
                      ))}
                      {TEXT_Q.map((q) => (
                        <th key={q.id} style={thL} title={q.text}>
                          Q{SURVEY_QUESTIONS.indexOf(q) + 1} (text)
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {surveyRows.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign: "top" }}>
                        <td style={tdCell}>{new Date(r.created_at).toLocaleString()}</td>
                        <td style={tdCell}>{r.country || "—"}</td>
                        <td style={tdCell}>{r.respondent_name || <span style={{ color: "#bbb" }}>—</span>}</td>
                        <td style={tdCell}>
                          {r.contact_ok
                            ? <span style={{ color: C.green, fontWeight: 700 }}>✓ {r.contact_email || "(no email)"}</span>
                            : <span style={{ color: "#bbb" }}>—</span>}
                        </td>
                        {SCALE_Q.map((q) => (
                          <td key={q.id} style={{ ...tdR }}>{r.responses?.[q.id] ?? "—"}</td>
                        ))}
                        {TEXT_Q.map((q) => (
                          <td key={q.id} style={{ ...tdCell, minWidth: 160, color: "#444" }}>
                            {r.responses?.[q.id] || <span style={{ color: "#bbb" }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
                  Q-number key: {SURVEY_QUESTIONS.map((q, i) => `Q${i + 1} = ${shortText(q.text)}`).join(" · ")}
                </p>
              </div>
            )}
          </Card>

          {/* Follow-up contacts */}
          <Card title={`Willing to be contacted for follow-up (${contactRows.length})`}>
            {contactRows.length === 0 ? (
              <Note>No one has opted in to follow-up contact yet.</Note>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.lightBG }}>
                      <th style={thL}>Name</th>
                      <th style={thL}>Contact email</th>
                      <th style={thL}>Country</th>
                      <th style={thL}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactRows.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={tdCell}>{r.respondent_name || <span style={{ color: "#bbb" }}>(no name)</span>}</td>
                        <td style={tdCell}>
                          {r.contact_email
                            ? <a href={`mailto:${r.contact_email}`} style={{ color: C.teal }}>{r.contact_email}</a>
                            : <span style={{ color: "#bbb" }}>(none given)</span>}
                        </td>
                        <td style={tdCell}>{r.country || "—"}</td>
                        <td style={tdCell}>{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Open questions / other feedback */}
          <Card title={`Questions & Other Feedback (${messageRows.length})`}>
            {messageRows.length === 0 ? (
              <Note>No open questions or comments yet.</Note>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {messageRows.map((r) => (
                  <div key={r.id} style={{ border: "1px solid #e3e8ec", borderRadius: 8, padding: "11px 14px" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                      {r.respondent_name ? `${r.respondent_name} · ` : ""}{r.country ? `${r.country} · ` : ""}{r.user_email || "anonymous"} · {new Date(r.created_at).toLocaleString()}
                      {r.contact_ok && <span style={{ color: C.green, fontWeight: 700 }}> · ✓ may contact{r.contact_email ? ` (${r.contact_email})` : ""}</span>}
                    </div>
                    <div style={{ fontSize: 14, color: C.navy, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.message}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ───────────────────────── helpers ─────────────────────────

function hasSurveyAnswers(responses) {
  if (!responses || typeof responses !== "object") return false;
  return SURVEY_QUESTIONS.some((q) => {
    const v = responses[q.id];
    return v !== undefined && v !== null && v !== "";
  });
}

function shortText(t) {
  return t.length > 42 ? t.slice(0, 40).trim() + "…" : t;
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", overflow: "hidden" }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>{title}</div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function Note({ children, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "16px 18px", fontSize: 13, color: color || "#666" }}>
      {children}
    </div>
  );
}

const thL = { padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" };
const thR = { padding: "8px 12px", textAlign: "right", color: C.navy, fontWeight: 700, fontSize: 12 };
const tdR = { padding: "9px 12px", textAlign: "right" };
const tdCell = { padding: "9px 12px", textAlign: "left" };
const tealBtn = { background: C.teal, color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, minHeight: 44, border: "none", cursor: "pointer" };
const ghostBtn = { background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 44, border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" };
