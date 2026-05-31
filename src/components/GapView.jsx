import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { gm, fmtPct, COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import InfoTip, { Def } from "./InfoTip";

export default function GapView({ country, data: d, flag }) {
  const { fmt } = useCurrency();
  const m = gm(d);

  const totalReviews = d.fees ? d.fees.reduce((s, f) => s + (f.ctPro || 0) + (f.ctStu || 0), 0) : 0;
  const initialReviews = d.fees ? d.fees.filter((f) => f.type?.toLowerCase().includes("initial") || f.type?.toLowerCase().includes("full")).reduce((s, f) => s + (f.ctPro || 0) + (f.ctStu || 0), 0) : 0;
  const otherReviews = totalReviews - initialReviews;

  const chartData = [
    { name: "Regular Expenses", value: m.te, fill: C.red },
    { name: "Regular Revenue", value: m.tr, fill: C.teal },
    { name: "Irregular Expenses", value: m.ti, fill: "#8c6bad" },
    { name: "Irregular Revenue", value: m.tri, fill: C.steelblue },
  ];

  const growthRows = d.growthPressures || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title={`${flag} ${country} — Gap Analysis`} subtitle="Where revenue does and does not cover expenses" />

      <div style={{ background: "#e7f1fb", border: `1px solid #bcd8f2`, borderLeft: `4px solid ${C.steelblue}`, borderRadius: 9, padding: "16px 20px", fontSize: 13.5, color: C.navy, lineHeight: 1.7 }}>
        <strong>CAUTION</strong>: Review the REGULAR BUDGET GAP. This is the gap between total expenses and revenues for the REGULAR (i.e., standard) operating budget. A gap can be negative (i.e., a deficit) or positive (i.e., a surplus). Review the IRREGULAR BUDGET GAP. This is the gap between total expenses and revenues for the IRREGULAR (i.e., non-standard, infrequent expenses or revenues) operating budget. If there is a negative gap in the regular budget and a surplus in the irregular budget (or vice-versa), you could consider if you could draw from one budget to support the other. <strong>However, it should be noted that the regular and irregular budget may not be able to be combined so easily, because it may be the case that some or all of the irregular revenue can only be used for specific purposes/activities</strong>. The Results section of this Dashboard also shows a <strong>COMBINED GAP</strong> that adds the regular budget gap and irregular budget gap together. This gives a general overview of both budgets combined, but as aforementioned, caution should be taken because the two budgets (or portions of each) may not be able to be combined because there may be restrictions on how revenue can be spent. For example, it may be that some portion of regular revenue from fees must be returned to the government to pay for the national insurance scheme, and it may be that irregular revenue from grants must only be used for a specific activity like training and not for regular expenses like rent or staffing.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <GapKPI label="Regular Budget Gap" val={m.rg} />
        <GapKPI label="Irregular Budget Gap" val={m.ig} />
        <GapKPI label="Combined Gap" val={m.cg} large />
        {m.ik > 0 && (
          <div style={{ flex: "1 1 180px", background: "#fff", border: `1px solid #dde`, borderTop: `3px solid ${C.steelblue}`, borderRadius: 9, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Expenses Budget</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.steelblue, marginTop: 4 }}>{fmt(m.te + m.ti + m.ik)}</div>
            <div style={{ fontSize: 12, color: C.blueGrey, marginTop: 2 }}>Regular expenses + irregular expenses + in-kind contributions</div>
          </div>
        )}
      </div>

      <Card title={<>Advocacy Summary<InfoTip title="Using this for advocacy">This summary is designed to help TRACE countries advocate for additional funding — by documenting the activities they carry out and the necessary increase in level of effort for those activities, gaps in revenue to support those activities, and how recurrent funding should draw from a mix of revenue streams rather than fees alone. Ethics maturity indicators — including number of initial reviews for professional (non-student) studies, presence of financial risks and opportunities, and number of ethics activities with expected increase in effort — support requests for increased and sustainable funding.</InfoTip></>}>
        <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.75, background: C.lightBG, borderRadius: 8, padding: "14px 18px" }}>
          {country} conducts <strong>{initialReviews}</strong> initial review{initialReviews !== 1 ? "s" : ""},
          {otherReviews > 0 ? ` ${otherReviews} other type${otherReviews !== 1 ? "s" : ""} of review,` : ""}
          {" "}(totaling <strong>{totalReviews}</strong> total),
          generating <strong>{fmt(d.revFees)}</strong> in review fees.
          {" "}The regular budget has a gap of <strong style={{ color: m.rg >= 0 ? C.green : C.red }}>{fmt(m.rg)}</strong>,
          meaning review fees {m.rg >= 0 ? "fully cover" : "do not fully cover"} operating costs.
          {m.ik > 0 && <>{" "}The committee also benefits from an estimated <strong>{fmt(m.ik)}</strong> in non-cash (in-kind) contributions — representing real economic activity not captured in the formal budget — which strengthens the case for sustainable institutional support.</>}
        </p>
      </Card>

      <Card title="Revenue vs. Expenses — Regular and Irregular">
        <p style={narrativeStyle}>
          This chart compares all revenue and expense sources. Bars that exceed their paired revenue bar indicate a gap in that budget category.
        </p>
        <div style={{ height: 260, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" interval={0} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {growthRows.length > 0 && (
        <Card title="Growth Pressures on Expenses">
          <p style={narrativeStyle}>
            These activities are expected to require more resources in the coming year. The percentage shown is an estimated increase over current spending.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {growthRows.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f9f4fb", borderRadius: 7, border: `1px solid #e8d9f0` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.navy }}>{row.activity}</div>
                  {row.note && <div style={{ fontSize: 12, color: C.blueGrey, marginTop: 2 }}>{row.note}</div>}
                </div>
                {row.pct !== undefined && (
                  <div style={{ textAlign: "right", minWidth: 60 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.purple }}>+{row.pct}%</div>
                    <div style={{ fontSize: 11, color: C.blueGrey }}>expected increase</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={<>Summary Table<InfoTip title="Reading the combined gap">The combined gap analysis combines the budget gaps from the regular and irregular budgets together. A deficit in either budget can be covered by a surplus in the other, given allowable use of revenue. Countries should check if the sources of revenue in the workbook allow intermingling of funds — for instance, some grant awards may restrict what the funds can be used for, and those funds may not be able to support excess expenses in another category. The regular and irregular budgets should be read separately as well as together.</InfoTip></>}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.lightBG }}>
              {["", "Expenses", "Revenue", "Gap"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "" ? "left" : "right", color: C.navy, fontWeight: 700, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Regular", exp: m.te, rev: m.tr, gap: m.rg },
              { label: "Irregular", exp: m.ti, rev: m.tri, gap: m.ig },
            ].map((row) => (
              <tr key={row.label} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "9px 12px", fontWeight: 600 }}>{row.label}</td>
                <td style={{ padding: "9px 12px", textAlign: "right" }}>{fmt(row.exp)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right" }}>{fmt(row.rev)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: row.gap >= 0 ? C.green : C.red }}>{fmt(row.gap)}</td>
              </tr>
            ))}
            <tr style={{ background: C.lightBG, fontWeight: 700 }}>
              <td style={{ padding: "9px 12px" }}>Combined</td>
              <td style={{ padding: "9px 12px", textAlign: "right" }}>{fmt(m.te + m.ti)}</td>
              <td style={{ padding: "9px 12px", textAlign: "right" }}>{fmt(m.tr + m.tri)}</td>
              <td style={{ padding: "9px 12px", textAlign: "right", color: m.cg >= 0 ? C.green : C.red }}>{fmt(m.cg)}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function GapKPI({ label, val, large = false }) {
  const { fmt } = useCurrency();
  const color = val >= 0 ? C.green : C.red;
  return (
    <div style={{ flex: large ? "1 1 200px" : "1 1 150px", background: "#fff", border: `1px solid #dde`, borderTop: `3px solid ${color}`, borderRadius: 9, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: large ? 28 : 22, fontWeight: 800, color, marginTop: 4 }}>{fmt(val)}</div>
      <div style={{ fontSize: 12, color, marginTop: 2 }}>{val >= 0 ? "surplus" : "deficit"}</div>
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
