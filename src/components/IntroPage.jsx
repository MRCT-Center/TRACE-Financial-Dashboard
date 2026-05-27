import { useState } from "react";
import { COLORS as C } from "../utils/metrics";

// Per Willyanne 2026-05-27 email: six sections of the Inputs dashboard, in
// wizard order. Section 1 is the unit/currency/year Setup step; section 2 is
// the Key Considerations step (risks/opportunities + activity planning).
const DASHBOARD_SECTIONS = [
  { name: "Setup", desc: "Unit (i.e., the unit completing the dashboard, which is a Secretariat/managerial team either at the national level or local IRB level), currency selection, and year for the budget data." },
  { name: "Key Considerations", desc: "Financial risks and opportunities, and activity planning for both the near- and long-term." },
  { name: "Expenses", desc: "Regular (annual, recurring) and irregular (one-time, long-term) expenses. The expense input section allows for input of expenses for both the Secretariat/management unit (e.g., for ethics operational systems through personnel, rent, developing training, site visits, etc.) and for the expenses to run the Ethics Committee (which are paid from the Secretariat/mgmt. budget)." },
  { name: "Revenue", desc: "Regular (annual, recurring) revenue/income from review fees and from other recurring sources (e.g., subsidies, rental income), and irregular (one-time, long-term) revenue from sources such as grants. The revenue section only has the option to report revenue for the Secretariat/mgmt. unit, because revenue is not usually received directly by the Ethics Committee." },
  { name: "In-Kind Contributions", desc: "Non-cash support such as donated or volunteer staff time, equipment, or office space from federal agencies, institutions, and others. These are essentially expenses/revenue that are \"off-book\" or \"off-budget,\" but which are necessary to the functioning of the ethics review system, and may need to be paid for in the future to support sustainability." },
  { name: "Review", desc: "An opportunity to check over the inputs section." },
];

const HOW_TO_START = [
  { icon: "📝", heading: "New to this tool?", body: "Start with the Guided Wizard — it will walk you through entering your country's data step by step.", view: "wizard" },
  { icon: "📊", heading: "Reviewing existing data?", body: "Go to Results for a high-level overview and to explore Expenses, Revenue, Gap Analysis, and Activities.", view: "results" },
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
  "Help countries understand the extent to which review fees support ethics system budgets (which pay for both the managerial functions of the ethics system and the operating costs of the review committees) and assess funding gaps.",
  "Document opportunity costs of unpaid labor and donated items (in-kind contributions).",
  "Support advocacy for additional and sustainable funding.",
];

const KEY_OBJECTIVES = [
  "Build capacity for National Ethics Committees (NECs) and Institutional Review Boards (IRBs), in collaboration with National Regulatory Authorities (NRAs).",
  "Streamline and harmonize clinical trial ethics review processes in participating countries.",
  "Strengthen and optimize digital systems for ethics and clinical trial oversight to improve efficiency, transparency, and coordination.",
  "Ensure all NECs implement a financial sustainability plan to support long-term operational effectiveness.",
  "Engage policymakers, regulators, and institutional stakeholders to strengthen ethics governance and coordination.",
];

const DESIGN_DECISIONS = [
  {
    heading: "Regular vs. irregular split for both expenses and revenues",
    body: "This differs a bit from standard accounting — it is intentional. Separating regular expenses (or revenues) that are recurring on a generally annual basis from irregular expenses (or revenues) that occur on a \"once in a while\" or one-time basis makes it easier to identify large irregular expenses (or revenues) in the budget and avoids the need for complex accounting to \"smooth/spread\" irregular expenses across budget years.",
  },
  {
    heading: "In-kind contributions are \"off-budget\"",
    body: "Donated items (e.g., staff time, equipment, office or conference space, use of personal vehicles for business purposes) are tracked separately because they often do not appear in formal budgets. However, they matter greatly for sustainability analysis.",
  },
  {
    heading: "Forecasting built in",
    body: "Near-term planning focuses on the next year. Long-term planning focuses on the next 3–5 years.",
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

        <Section title="About the TRACE Project" collapsible defaultOpen={false} logo={<img src="/trace-logo-color.svg" alt="TRACE" style={{ height: 40, objectFit: "contain" }} />}>
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

        <Section title="MRCT Center's role in TRACE" collapsible defaultOpen={false} logo={<img src="/mrct-shield.png" alt="MRCT Center" style={{ height: 40, objectFit: "contain" }} />}>
          <p style={bodyText}>
            The Multi-Regional Clinical Trials Center of Brigham and Women's Hospital and Harvard (MRCT Center)
            is the training partner within TRACE, funded by the Gates Foundation. The MRCT Center supports the
            distinct needs of each country, focused on capacity building and financial sustainability, with particular
            attention to registration, accreditation pathways, in-country reliance, and sustainable financing processes.
          </p>
          <p style={{ ...bodyText, marginTop: 10 }}>
            In parallel, the MRCT Center team has developed harmonized foundational training and is now working on
            advanced training and post-approval monitoring activities. These resources can be applied consistently
            across partner countries while remaining responsive to local contexts and priorities.
          </p>
          <p style={{ ...bodyText, marginTop: 10 }}>
            This financial dashboard was developed by the MRCT Center as part of work on sustainable financing —
            to give country teams a shared, structured way to understand their ethics review system's finances
            and plan for long-term sustainability.
          </p>
        </Section>

        <Section title="Why this dashboard?">
          <p style={{ ...bodyText, marginBottom: 14 }}>
            This dashboard was developed to help ethics systems across TRACE countries build a clear,
            shared picture of their financial situation. Specifically, it enables management teams at National Ethics Secretariats and local IRBs to:
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

        <Section title="Dashboard structure for user Inputs">
          <p style={{ ...bodyText, marginBottom: 6 }}>
            Financial data is organized into three categories: <strong>Regular</strong> (recurring annual expenses and revenue),{" "}
            <strong>Irregular</strong> (one-time or long-term expenses and revenue), and{" "}
            <strong>In-Kind</strong> (non-cash contributions, such as donated staff time or office space, tracked
            separately from expenses and revenue). The Inputs dashboard, accessible from the Inputs tab in the
            header row or through the guided wizard box below, has six main sections:
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
          <p style={{ ...bodyText, marginTop: 14, marginBottom: 0 }}>
            Once financial data is entered into the Inputs section, users can proceed to the visualization of
            the data in graphs and charts in the Results section.
          </p>
        </Section>

        <Section title="How data is organized for financial inputs">
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

function Section({ title, children, logo, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;
  return (
    <div style={{ background: "#fff", borderRadius: 9, padding: "22px 24px", border: "1px solid #dde" }}>
      <div
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isOpen ? 14 : 0,
          paddingBottom: isOpen ? 10 : 0,
          borderBottom: isOpen ? "1px solid #eee" : "none",
          cursor: collapsible ? "pointer" : "default",
          userSelect: collapsible ? "none" : "auto",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          {collapsible && (
            <span aria-hidden style={{ display: "inline-block", color: C.teal, fontSize: 12, transition: "transform 120ms ease", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
              ▶
            </span>
          )}
          {title}
        </h2>
        {logo && logo}
      </div>
      {isOpen && children}
    </div>
  );
}

const bodyText = { fontSize: 14, color: "#333", lineHeight: 1.7 };
