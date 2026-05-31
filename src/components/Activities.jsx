import { COLORS as C } from "../utils/metrics";
import { ACTIVITY_DESCRIPTIONS } from "../data/activities";
import InfoTip from "./InfoTip";

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

// Effort-direction classifiers — case-insensitive so they match both the
// wizard dropdown values ("Increase"/"Decrease"/"Remain the same") and any
// lower-case legacy data.
const isIncrease = (v) => (v || "").toLowerCase().includes("increas");
const isDecrease = (v) => (v || "").toLowerCase().includes("decreas");
const isSame     = (v) => { const s = (v || "").toLowerCase(); return s.includes("same") || s.includes("remain"); };
const hasValue   = (v) => (v || "").trim().length > 0;

export default function Activities({ country, data: d, flag }) {
  const activities = d.activities || [];

  // Fractions of activities by expected effort direction (Willyanne 2026-05-31
  // #4). Numerator = count with that direction in the column; denominator =
  // number of activities that have any value in that column.
  const nearDen = activities.filter((a) => hasValue(a.nearTerm)).length;
  const longDen = activities.filter((a) => hasValue(a.longTerm)).length;
  const effortStats = {
    near: {
      inc:  activities.filter((a) => isIncrease(a.nearTerm)).length,
      same: activities.filter((a) => isSame(a.nearTerm)).length,
      dec:  activities.filter((a) => isDecrease(a.nearTerm)).length,
      den:  nearDen,
    },
    long: {
      inc:  activities.filter((a) => isIncrease(a.longTerm)).length,
      same: activities.filter((a) => isSame(a.longTerm)).length,
      dec:  activities.filter((a) => isDecrease(a.longTerm)).length,
      den:  longDen,
    },
  };

  const increasingNear = effortStats.near.inc;
  const increasingLong = effortStats.long.inc;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title={`${flag} ${country} — Activity Planning`} subtitle="Near-term and long-term effort expectations" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <KPI label="Total activities tracked" val={activities.length} color={C.navy} />
        <KPI label="Expected to increase (near-term)" val={increasingNear} color={C.teal} />
        <KPI label="Expected to increase (long-term)" val={increasingLong} color={C.purple} />
      </div>

      {activities.length > 0 && (
        <Card title="Effort Direction — Share of Activities">
          <p style={narrativeStyle}>
            Of the activities tracked, the fraction expected to increase, stay the same, or decrease in effort —
            in the near term (next year) and the long term (3–5 years). Drawn from Inputs &rsaquo; 2. Key Considerations &rsaquo; Activities.
          </p>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Near-term (next year)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <FractionBox label="Increasing effort" num={effortStats.near.inc} den={effortStats.near.den} tone="increase" />
              <FractionBox label="Same effort" num={effortStats.near.same} den={effortStats.near.den} tone="remain the same" />
              <FractionBox label="Decreasing effort" num={effortStats.near.dec} den={effortStats.near.den} tone="decrease" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 8px" }}>Long-term (3–5 years)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <FractionBox label="Increasing effort" num={effortStats.long.inc} den={effortStats.long.den} tone="increase" />
              <FractionBox label="Same effort" num={effortStats.long.same} den={effortStats.long.den} tone="remain the same" />
              <FractionBox label="Decreasing effort" num={effortStats.long.dec} den={effortStats.long.den} tone="decrease" />
            </div>
          </div>
        </Card>
      )}

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

function FractionBox({ label, num, den, tone }) {
  const t = TREND_COLORS[tone] || TREND_COLORS["remain the same"];
  const pct = den > 0 ? Math.round((num / den) * 100) : 0;
  return (
    <div style={{ flex: "1 1 150px", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 9, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: t.text, marginTop: 6 }}>{num}<span style={{ fontSize: 20, fontWeight: 600 }}> / {den}</span></div>
      <div style={{ fontSize: 11, color: t.text, opacity: 0.85, marginTop: 2 }}>{den > 0 ? `${pct}% of activities` : "no data"}</div>
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
