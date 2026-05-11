import { COLORS as C } from "../utils/metrics";

const WORKBOOK_TABS = [
  { name: "Key Considerations", desc: "Country and unit selection, financial risks and opportunities, and near/long-term activity planning." },
  { name: "Regular Expenses", desc: "Secretariat and Ethics Committee operating costs that recur each year." },
  { name: "Irregular Expenses", desc: "Project-based costs funded by grants or one-time sources." },
  { name: "Regular Revenue", desc: "Review fees and other recurring income that support operations." },
  { name: "Irregular Revenue", desc: "Grants and other time-limited funding streams." },
  { name: "Summary / Gap Analysis", desc: "Combined view of whether revenue covers expenses, and where gaps exist." },
  { name: "In-Kind Contributions", desc: "Non-cash support from federal agencies, institutions, and other sources." },
];

const HOW_TO_START = [
  { icon: "📝", heading: "New to this tool?", body: "Start with the Guided Wizard — it will walk you through entering your country's data step by step.", view: "wizard" },
  { icon: "📊", heading: "Reviewing existing data?", body: "Go to Overview for a high-level summary, then use Expenses, Revenue, or Gap Analysis to explore specific areas.", view: "overview" },
  { icon: "🌍", heading: "MRCT Admin?", body: "Use the country selector in the top menu to switch between countries. The Admin tab shows cross-country comparisons and data completeness.", view: "admin", adminOnly: true },
];

export default function IntroPage({ onNavigate, isAdmin }) {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "28px 32px", color: "#fff", marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.yellow, marginBottom: 8 }}>
          TRACE — Trial REsearch and Accountability for Clinical Ethics
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
          TRACE Financial Workbook
        </h1>
        <p style={{ fontSize: 15, opacity: 0.88, lineHeight: 1.65 }}>
          This tool helps research ethics committees across five African countries track expenses,
          revenue, and funding gaps — and plan for sustainable ethics review operations over time.
        </p>

        <div style={{ marginTop: 20, padding: "14px 18px", background: "rgba(255,255,255,0.08)", borderRadius: 8, borderLeft: `4px solid ${C.yellow}`, fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>
          <strong>Note:</strong> This introduction will be updated with final content from the TRACE team.
          The text below is placeholder copy — Willyanne will provide the authoritative version.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Section title="What this tool does">
          <p style={bodyText}>
            The TRACE Financial Workbook captures the real costs of running a research ethics
            committee (REC) — from staff salaries and committee payments to training and site monitoring.
            It also tracks the revenue that RECs generate through review fees and grants, and calculates
            where gaps exist between what it costs to operate and what funding is available.
          </p>
          <p style={{ ...bodyText, marginTop: 10 }}>
            By collecting this data across all five TRACE countries — Kenya, Nigeria, Rwanda, Tanzania,
            and Zimbabwe — the MRCT Center can help RECs make the case for sustainable, locally-led
            funding of clinical research ethics.
          </p>
        </Section>

        <Section title="Workbook structure">
          <p style={{ ...bodyText, marginBottom: 14 }}>
            The dashboard is organized around seven data areas, each corresponding to a tab in the
            original Excel workbook:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WORKBOOK_TABS.map((tab, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#f4f6f8", borderRadius: 7, borderLeft: `3px solid ${C.teal}` }}>
                <div style={{ minWidth: 26, fontWeight: 700, color: C.teal, fontSize: 13 }}>{i + 1}.</div>
                <div>
                  <div style={{ fontWeight: 600, color: C.navy, fontSize: 13 }}>{tab.name}</div>
                  <div style={{ fontSize: 12, color: C.blueGrey, marginTop: 2 }}>{tab.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="About the TRACE project">
          <p style={bodyText}>
            TRACE is a Gates Foundation-funded initiative led by the MRCT Center at Harvard's
            Brigham and Women's Hospital. It works with research ethics committees in five
            sub-Saharan African countries to strengthen ethical oversight of clinical trials,
            build local capacity, and advance sustainable financing for ethics review.
          </p>
          <p style={{ ...bodyText, marginTop: 10 }}>
            This dashboard supports that mission by giving country teams and MRCT staff a shared,
            data-driven view of the financial health of each REC.
          </p>
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

function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, padding: "22px 24px", border: "1px solid #dde" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #eee" }}>{title}</h2>
      {children}
    </div>
  );
}

const bodyText = { fontSize: 14, color: "#333", lineHeight: 1.7 };
