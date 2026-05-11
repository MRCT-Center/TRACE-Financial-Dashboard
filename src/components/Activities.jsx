import { COLORS as C } from "../utils/metrics";
import InfoTip from "./InfoTip";

const ACTIVITY_DESCRIPTIONS = {
  "Managing and leading": "Drafting and updating SOPs; drafting and communicating policies; updating forms; creating email and letter templates; reviewing website plans; networking and engaging new partners; hiring and managing staff; managing budgets; organizing meetings.",
  "Developing/reviewing/conducting/advising on training": "Advising on training concepts; reviewing outlines, language, and formatting; conducting training sessions; tracking ethics training expiration dates.",
  "Receipt, screening, and maintaining logs": "Reviewing completeness of study protocols, consent documents, investigators' brochures, and other required materials; communicating with study teams about completeness.",
  "Determining risk, triaging, and assigning study proposals": "Triaging NHSRD and Exempt Determinations; communicating with study teams; making risk determinations (minimal vs. more than minimal risk).",
  "Reviewing minimal risk studies": "Reviewing minimal risk studies by a delegated individual or group; communicating with the study team as needed.",
  "Reviewing, preparing for, and participating in full board meetings": "Facilitating meeting logistics; confirming quorum; assigning reviewers; preparing agendas; reading materials; assessing ethics questions; communicating decisions.",
  "Minutes and record-keeping": "Compiling determination lists; taking notes and attendance; writing minutes; retaining all study-related records.",
  "On-study review": "Reviewing adverse events, protocol deviations, and amendments; monitoring deadlines; conducting annual continuing reviews.",
  "Close out of study": "Overseeing studies in data analysis phase; reviewing closure forms; retaining all study-related information.",
  "Preparing and monitoring sites, inspections, and audits": "Providing document templates and regulatory tools; following up on outstanding issues; retaining monitoring documents.",
  "Participant feedback, concerns, complaints, questions": "Receiving and responding to participant feedback; deciding on appropriate follow-up; retaining all documentation.",
  "Other ethics activities": "Participating in ethics training; learning new software; attending ethics conferences; staying current on national and international regulations.",
};

const TREND_COLORS = {
  increase: { bg: "#e8f5e9", border: "#4CAF50", text: "#2e7d32" },
  decrease: { bg: "#fff3e0", border: "#FF9800", text: "#e65100" },
  "remain the same": { bg: "#e3f2fd", border: "#2196F3", text: "#1565c0" },
};

const TREND_LABELS = {
  increase: "↑ Increasing",
  decrease: "↓ Decreasing",
  "remain the same": "→ Same",
};

export default function Activities({ country, data: d, flag }) {
  const activities = d.activities || [];

  const increasingNear = activities.filter((a) => a.nearTerm === "increase").length;
  const increasingLong = activities.filter((a) => a.longTerm === "increase").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title={`${flag} ${country} — Activity Planning`} subtitle="Near-term and long-term effort expectations" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <KPI label="Total activities tracked" val={activities.length} color={C.navy} />
        <KPI label="Expected to increase (near-term)" val={increasingNear} color={C.teal} />
        <KPI label="Expected to increase (long-term)" val={increasingLong} color={C.purple} />
      </div>

      {activities.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", padding: "28px 24px", textAlign: "center", color: C.blueGrey }}>
          No activity planning data has been entered yet. Use the Guided Wizard to add activity expectations.
        </div>
      ) : (
        <Card title="Activity Expectations">
          <p style={narrativeStyle}>
            Each activity shows whether the country team expects effort to increase, decrease, or remain the same —
            both in the near term (next year) and long term (3–5 years). Click the ℹ button next to any activity name for a full description.
          </p>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px 12px", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <span>Activity</span>
              <span>Near-term</span>
              <span>Long-term</span>
            </div>
            {activities.map((a, i) => {
              const desc = ACTIVITY_DESCRIPTIONS[a.name] || a.name;
              const nearStyle = TREND_COLORS[a.nearTerm?.toLowerCase()] || TREND_COLORS["remain the same"];
              const longStyle = TREND_COLORS[a.longTerm?.toLowerCase()] || TREND_COLORS["remain the same"];
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px 12px", padding: "10px", background: i % 2 === 0 ? "#f9f9fb" : "#fff", borderRadius: 7, alignItems: "start" }}>
                  <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.4 }}>
                    <span>{a.name}</span>
                    {desc && desc !== a.name && <InfoTip title={a.name}>{desc}</InfoTip>}
                    {a.note && <div style={{ fontSize: 11, color: C.blueGrey, marginTop: 3, fontStyle: "italic" }}>{a.note}</div>}
                  </div>
                  <TrendBadge label={TREND_LABELS[a.nearTerm?.toLowerCase()] || a.nearTerm} style={nearStyle} />
                  <TrendBadge label={TREND_LABELS[a.longTerm?.toLowerCase()] || a.longTerm} style={longStyle} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activities.some((a) => a.note) && (
        <Card title="Activity Notes">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activities.filter((a) => a.note).map((a, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${C.teal}`, paddingLeft: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{a.name}</div>
                <div style={{ fontSize: 13, color: "#444", marginTop: 3, lineHeight: 1.6 }}>{a.note}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function TrendBadge({ label, style }) {
  if (!label) return <div />;
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: style.text, background: style.bg, border: `1px solid ${style.border}`, borderRadius: 5, padding: "3px 8px", display: "inline-block" }}>
      {label}
    </div>
  );
}

function KPI({ label, val, color }) {
  return (
    <div style={{ flex: "1 1 150px", background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "14px 16px", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde" }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde", borderRadius: "9px 9px 0 0" }}>{title}</div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ background: C.navy, borderRadius: 9, padding: "14px 20px", color: "#fff" }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

const narrativeStyle = { fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" };
