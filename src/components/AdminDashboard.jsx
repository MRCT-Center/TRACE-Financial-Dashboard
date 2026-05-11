import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { gm, fmt, COLORS as C } from "../utils/metrics";
// Admin always shows USD for cross-country comparison — uses metrics fmt directly, not currency context

export default function AdminDashboard({ countries, flags, onNavigate }) {
  const countryNames = Object.keys(countries);
  const metrics = Object.fromEntries(countryNames.map((c) => [c, gm(countries[c])]));

  // Build cross-country comparison data
  const compareData = countryNames.map((c) => {
    const m = metrics[c];
    return {
      country: `${flags[c]} ${c}`,
      name: c,
      regularExpenses: m.te,
      regularRevenue: m.tr,
      regularGap: m.rg,
      irregularExpenses: m.ti,
      irregularRevenue: m.tri,
      inKind: m.ik,
    };
  });

  function exportCSV() {
    const headers = ["Country", "Reg Expenses", "Reg Revenue", "Reg Gap", "Irr Expenses", "Irr Revenue", "Irr Gap", "In-Kind"];
    const rows = countryNames.map((c) => {
      const m = metrics[c];
      return [c, m.te, m.tr, m.rg, m.ti, m.tri, m.ig, m.ik].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TRACE-financial-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "16px 22px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Admin Dashboard 🔐</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>MRCT view — all countries, cross-country analytics</div>
        </div>
        <button
          onClick={exportCSV}
          style={{ background: C.teal, color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, minHeight: 44 }}
        >
          Export all countries CSV
        </button>
      </div>

      {/* Data completeness grid */}
      <Card title="Data Completeness">
        <p style={narrativeStyle}>
          Each cell shows whether a key data area has been completed for each country.
          Green = complete, yellow = partial, grey = not started.
        </p>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.lightBG }}>
                <th style={thStyle}>Country</th>
                {["Expenses", "Revenue", "Irregular", "In-Kind", "Activities"].map((h) => (
                  <th key={h} style={{ ...thStyle, textAlign: "center" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryNames.map((c) => {
                const d = countries[c];
                const m = metrics[c];
                const checks = [
                  m.te > 0,
                  d.revFees > 0,
                  m.ti > 0 || m.tri > 0,
                  (d.ikReg?.total || 0) > 0,
                  d.activities && d.activities.length > 0,
                ];
                return (
                  <tr key={c} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>
                      <button
                        onClick={() => onNavigate(c, "overview")}
                        style={{ background: "none", color: C.teal, fontWeight: 600, fontSize: 13, textDecoration: "underline", cursor: "pointer", minHeight: 0, padding: 0 }}
                      >
                        {flags[c]} {c}
                      </button>
                    </td>
                    {checks.map((ok, i) => (
                      <td key={i} style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ fontSize: 15 }}>{ok ? "✅" : "⬜"}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cross-country comparison — regular gap */}
      <Card title="Cross-Country: Regular Budget — Expenses vs. Revenue">
        <p style={narrativeStyle}>
          Comparing regular expenses and revenue across all five countries.
          A bar where expenses exceed revenue indicates a funding gap in that country's regular operations.
        </p>
        <div style={{ height: 280, marginTop: 14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} margin={{ top: 4, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="country" fontSize={11} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Bar dataKey="regularExpenses" name="Reg. Expenses" fill={C.red} radius={[3, 3, 0, 0]} />
              <Bar dataKey="regularRevenue" name="Reg. Revenue" fill={C.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cross-country gap summary table */}
      <Card title="Cross-Country: Gap Summary">
        <p style={narrativeStyle}>
          The combined gap is the total difference between all revenue and all expenses across both regular and irregular budgets.
        </p>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.lightBG }}>
                {["Country", "Reg. Expenses", "Reg. Revenue", "Reg. Gap", "Irr. Expenses", "Irr. Revenue", "Irr. Gap", "In-Kind"].map((h) => (
                  <th key={h} style={{ ...thStyle, textAlign: h === "Country" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryNames.map((c) => {
                const m = metrics[c];
                return (
                  <tr key={c} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>{flags[c]} {c}</td>
                    <td style={tdR}>{fmt(m.te)}</td>
                    <td style={tdR}>{fmt(m.tr)}</td>
                    <td style={{ ...tdR, color: m.rg >= 0 ? C.green : C.red, fontWeight: 700 }}>{fmt(m.rg)}</td>
                    <td style={tdR}>{fmt(m.ti)}</td>
                    <td style={tdR}>{fmt(m.tri)}</td>
                    <td style={{ ...tdR, color: m.ig >= 0 ? C.green : C.red, fontWeight: 700 }}>{fmt(m.ig)}</td>
                    <td style={{ ...tdR, color: C.steelblue }}>{fmt(m.ik)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* In-kind cross-country */}
      <Card title="Cross-Country: In-Kind Contributions">
        <p style={narrativeStyle}>
          In-kind contributions vary significantly across countries. Only Kenya has detailed data at this stage.
        </p>
        <div style={{ height: 220, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compareData} margin={{ top: 4, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="country" fontSize={11} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="inKind" name="In-Kind Total" fill={C.steelblue} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", overflow: "hidden" }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>{title}</div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

const thStyle = { padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" };
const tdR = { padding: "9px 12px", textAlign: "right" };
const narrativeStyle = { fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" };
