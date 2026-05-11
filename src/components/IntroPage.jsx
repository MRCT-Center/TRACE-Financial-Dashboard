import { COLORS as C } from "../utils/metrics";

const DASHBOARD_SECTIONS = [
  { name: "Key Considerations", desc: "Country and unit selection, financial risks and opportunities, and near/long-term activity planning." },
  { name: "Expenses", desc: "Secretariat and Ethics Committee operating costs — both recurring annual expenses and one-time project costs." },
  { name: "Revenue", desc: "Review fees and other recurring income, plus grants and time-limited funding sources." },
  { name: "Gap Analysis", desc: "Combined view of whether revenue covers expenses, and where funding gaps exist." },
  { name: "Activities", desc: "Near-term and long-term activity planning tied to financial sustainability." },
  { name: "In-Kind Contributions", desc: "Non-cash support — donated staff time, equipment, or office space from federal agencies, institutions, and others." },
];

const HOW_TO_START = [
  { icon: "📝", heading: "New to this tool?", body: "Start with the Guided Wizard — it will walk you through entering your country's data step by step.", view: "wizard" },
  { icon: "📊", heading: "Reviewing existing data?", body: "Go to Overview for a high-level summary, then use Expenses, Revenue, or Gap Analysis to explore specific areas.", view: "overview" },
  { icon: "🌍", heading: "MRCT Center Admin?", body: "Use the country selector in the top menu to switch between countries. The Admin tab shows cross-country comparisons and data completeness.", view: "admin", adminOnly: true },
];

const WORKSTREAMS = [
  { letter: "A", label: "Capacity building & accreditation" },
  { letter: "B", label: "Harmonization" },
  { letter: "C", label: "Digitalization" },
  { letter: "D", label: "Funding models (Financial Sustainability)" },
  { letter: "E", label: "Communication" },
];

const WORKBOOK_REASONS = [
  "Enable countries to track ethics system expenses and revenues.",
  "Support financial planning for current and forecasted budgets.",
  "Help countries understand how fees align with budgets and assess funding gaps.",
  "Document opportunity costs of unpaid labor and donated items (in-kind contributions).",
  "Support advocacy for additional and sustainable funding.",
];

const KEY_OBJECTIVES = [
  "Streamline and harmonize clinical trial ethics review processes in participating countries.",
  "Build capacity for National Ethics Committees (NECs) and Institutional Review Boards (IRBs), in collaboration with National Regulatory Authorities (NRAs).",
  "Strengthen and optimize digital systems for ethics and clinical trial oversight to improve efficiency, transparency, and coordination.",
  "Engage policymakers, regulators, and institutional stakeholders to strengthen ethics governance and coordination.",
  "Ensure all NECs implement a financial sustainability plan to support long-term operational effectiveness.",
];

const DESIGN_DECISIONS = [
  {
    heading: "Regular vs. irregular split",
    body: "This is not standard accounting — it is intentional. Separating recurring costs from one-time project costs makes it much easier to plan and compare across years.",
  },
  {
    heading: "In-kind contributions are \"off-budget\"",
    body: "Donated items (staff time, equipment, office space) are tracked separately because they are real resources that do not appear in the formal budget. They matter for sustainability analysis.",
  },
  {
    heading: "Forecasting built in",
    body: "Near-term planning (~1 year) focuses on the regular budget. Long-term planning (3–5 years) focuses on the irregular budget, where grant timelines matter most.",
  },
  {
    heading: "Standardized fee categories",
    body: "The same review types are used across all five countries: initial review, minimal risk, more than minimal risk, accelerated, continuing review, major amendment, and minor amendment.",
  },
];

export default function IntroPage({ onNavigate, isAdmin }) {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "28px 32px", color: "#fff", marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.yellow, marginBottom: 8 }}>
          TRACE — Trial Regulation and Clinical Ethics Optimization
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
          TRACE Financial Dashboard
        </h1>
        <p style={{ fontSize: 15, opacity: 0.88, lineHeight: 1.65 }}>
          This interactive dashboard helps research ethics committees across five African countries track expenses,
          revenue, and funding gaps — and plan for sustainable ethics review operations over time.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <Section title="About the TRACE Project" logo={<img src="/trace-logo.png" alt="TRACE" style={{ height: 40, objectFit: "contain" }} />}>
          <p style={bodyText}>
            TRACE (Trial Regulation and Clinical Ethics Optimization) is a multi-country initiative
            launched in 2025 to strengthen and harmonize clinical trial ethics and regulatory oversight
            across selected African countries. Coordinated by Garnett Partners and funded by the
            Gates Foundation, TRACE works to build a coordinated, transparent, predictable, and
            efficient environment for ethics and regulatory review — aligned with AVAREF and the
            African Medicines Agency (AMA).
          </p>
          <p style={{ ...bodyText, marginTop: 10 }}>
            TRACE works with ethics committees and regulators in Rwanda, Tanzania, Nigeria, Zimbabwe,
            and Kenya. By improving capacity, governance, and digital systems, TRACE makes ethics and
            regulatory processes more transparent, predictable, and efficient while ensuring strong
            participant protection.
          </p>

          <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: "1 1 340px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Five workstreams</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {WORKSTREAMS.map(({ letter, label }) => (
                  <div key={letter} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "#f4f6f8", borderRadius: 6 }}>
                    <span style={{ background: C.navy, color: "#fff", fontWeight: 700, fontSize: 11, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {letter}
                    </span>
                    <span style={{ fontSize: 13, color: "#333" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: "1 1 340px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>Key objectives</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {KEY_OBJECTIVES.map((obj, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "#f4f6f8", borderRadius: 6, borderLeft: `3px solid ${C.teal}` }}>
                    <span style={{ color: C.teal, fontWeight: 700, minWidth: 18, fontSize: 12 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: "#333", lineHeight: 1.5 }}>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0f7f9", borderRadius: 7, borderLeft: `3px solid ${C.teal}`, fontSize: 13, color: "#444", lineHeight: 1.6 }}>
            <strong style={{ color: C.navy }}>MRCT Center</strong> — The Multi-Regional Clinical Trials Center
            of Brigham and Women's Hospital and Harvard is the training partner within TRACE and
            developed this financial dashboard, funded by the Gates Foundation.
          </div>
        </Section>

        <Section title="Why this dashboard?">
          <p style={{ ...bodyText, marginBottom: 14 }}>
            This dashboard was developed to help ethics committees across TRACE countries build a clear,
            shared picture of their financial situation. Specifically, it enables teams to:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {WORKBOOK_REASONS.map((reason, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", background: "#f4f6f8", borderRadius: 6 }}>
                <span style={{ color: C.teal, fontSize: 16, flexShrink: 0, marginTop: -1 }}>✓</span>
                <span style={{ fontSize: 13, color: "#333", lineHeight: 1.55 }}>{reason}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Dashboard structure">
          <p style={{ ...bodyText, marginBottom: 6 }}>
            Financial data is organized into three categories: <strong>Regular</strong> (recurring annual costs and income),{" "}
            <strong>Irregular</strong> (one-time or project-based items), and{" "}
            <strong>In-Kind</strong> (non-cash contributions tracked separately). The dashboard has six main sections:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {DASHBOARD_SECTIONS.map((section, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#f4f6f8", borderRadius: 7, borderLeft: `3px solid ${C.teal}` }}>
                <div style={{ minWidth: 26, fontWeight: 700, color: C.teal, fontSize: 13 }}>{i + 1}.</div>
                <div>
                  <div style={{ fontWeight: 600, color: C.navy, fontSize: 13 }}>{section.name}</div>
                  <div style={{ fontSize: 12, color: C.blueGrey, marginTop: 2 }}>{section.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="How data is organized">
          <p style={{ ...bodyText, marginBottom: 14 }}>
            A few design choices shape how data is structured — understanding these makes the dashboard easier to use:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {DESIGN_DECISIONS.map(({ heading, body }) => (
              <div key={heading} style={{ flex: "1 1 340px", background: "#f4f6f8", borderRadius: 8, padding: "14px 16px", borderTop: `3px solid ${C.navy}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{heading}</div>
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="How to get started">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {HOW_TO_START.filter((item) => !item.adminOnly || isAdmin).map((item, i) => (
              <button
                key={i}
                onClick={() => onNavigate?.(item.view)}
                style={{
                  flex: "1 1 220px",
                  background: "#fff",
                  border: `1px solid ${C.teal}`,
                  borderRadius: 9,
                  padding: "16px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${C.teal}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, color: C.navy, fontSize: 14, marginBottom: 6 }}>{item.heading}</div>
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>{item.body}</div>
                <div style={{ marginTop: 10, fontSize: 12, color: C.teal, fontWeight: 600 }}>Go →</div>
              </button>
            ))}
          </div>
        </Section>

        <div style={{ background: "#fff", border: `1px solid #dde`, borderRadius: 9, padding: "18px 20px", fontSize: 13, color: C.blueGrey, lineHeight: 1.65 }}>
          <strong style={{ color: C.navy }}>Questions or feedback?</strong> Contact the MRCT Center team.
          This prototype is being developed in close collaboration with country teams ahead of the
          Zimbabwe meeting in June 2026.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, logo }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, padding: "22px 24px", border: "1px solid #dde" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #eee" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0 }}>{title}</h2>
        {logo && logo}
      </div>
      {children}
    </div>
  );
}

const bodyText = { fontSize: 14, color: "#333", lineHeight: 1.7 };
