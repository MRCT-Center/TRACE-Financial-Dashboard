import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList } from "recharts";
import { gm, fmtPct, COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import EditableCell from "./EditableCell";
import InfoTip, { Def } from "./InfoTip";
import { PRO_KEYS, STUD_KEYS, rowRevenue } from "../data/feesModel";

// Sum review count and revenue across the given fee rows, for the given set of
// column keys (PRO_KEYS or STUD_KEYS). Revenue = Σ(amount × count) per cell.
function sumPair(rows, keys) {
  let count = 0, revenue = 0;
  for (const r of rows || []) {
    for (const k of keys) {
      const c = r?.cells?.[k] || {};
      const amt = Number(c.amount) || 0;
      const cnt = Number(c.count) || 0;
      count += cnt;
      revenue += amt * cnt;
    }
  }
  return { count, revenue };
}

export default function Revenue({ country, data: d, flag, onEdit }) {
  const { fmt } = useCurrency();
  const m = gm(d);

  const feeRows = d.fees || [];

  // Per-review-type total fee revenue (Willyanne 2026-05-31 #5): each x-axis
  // label maps to its total fee revenue — the "Revenue (USD)" column — drawn
  // from cells (Σ amount × count), falling back to the legacy `rev` field.
  const feeChartData = feeRows.map((f) => ({
    type: f.type,
    revenue: f?.cells ? rowRevenue(f) : (f.rev || 0),
  }));

  // Professional vs. student review totals (Willyanne 2026-05-31 #6/#7).
  const proAll  = sumPair(feeRows, PRO_KEYS);
  const studAll = sumPair(feeRows, STUD_KEYS);
  const initialRows = feeRows.filter((f) => (f.type || "").toLowerCase().includes("initial review"));
  const proInit  = sumPair(initialRows, PRO_KEYS);
  const studInit = sumPair(initialRows, STUD_KEYS);

  // Revenue by funder — professional vs. student split
  const indRev = proAll.revenue;
  const ngoRev = studAll.revenue;
  const funderData = [
    { name: "Professional", value: indRev, color: C.navy },
    { name: "Student", value: ngoRev, color: C.teal },
  ].filter((x) => x.value > 0);

  const feePct = m.tr > 0 ? (d.revFees / m.tr) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title={`${flag} ${country} — Revenue`} subtitle="Fees and other income" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <KPI label="Total Regular Revenue" val={fmt(m.tr)} color={C.teal} />
        <KPI label="Revenue from Fees" val={fmt(d.revFees)} color={C.navy} />
        <KPI label="Other Revenue" val={fmt(d.revOther)} color={C.blueGrey} />
        <KPI label="Total Irregular Revenue" val={fmt(m.tri)} color={C.purple} />
      </div>

      <Card title="Revenue from Fees – By Review Type">
        <p style={narrativeStyle}>
          Each bar shows the total fee revenue for a review type, drawn from the "Revenue (USD)" column of the
          Inputs &rsaquo; Revenue &rsaquo; Revenue from fees table (fee amount &times; number of reviews, summed across all funder and student columns for that row).
        </p>
        {feeChartData.length > 0 ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeChartData} margin={{ top: 24, right: 20, left: 4, bottom: 90 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="type" fontSize={10} angle={-40} textAnchor="end" interval={0} height={120} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <Tooltip formatter={(v) => [fmt(v), "Total fee revenue"]} />
                <Bar dataKey="revenue" fill={C.navy} radius={[4, 4, 0, 0]} name="revenue" minPointSize={1}>
                  {/* minPointSize={1} forces a 1px sliver for zero-revenue review
                      types so Recharts still renders a LabelList label above them
                      (a true zero-height bar gets no label layer at all). The
                      formatter then prints "$0"/"KSh0" for those rows, per
                      Willyanne 2026-05-31. */}
                  <LabelList dataKey="revenue" position="top" fontSize={9} fill={C.navy} formatter={(v) => fmt(Number(v) || 0)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: C.blueGrey, marginTop: 10 }}>No fee data available.</p>
        )}
      </Card>

      {/* Professional vs. Student review totals (Willyanne 2026-05-31 #6/#7). */}
      <Card title="Reviews by Submitter Type — Count &amp; Revenue">
        <p style={narrativeStyle}>
          Professional ("Pro.") and student ("Stud.") totals, summed across the fee table. Count is the total number of
          reviews; revenue is fee amount &times; count, summed across the matching columns.
        </p>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 8 }}>All review types</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <ReviewBox label="All professional reviews" count={proAll.count} revenue={proAll.revenue} color={C.navy} fmt={fmt} />
          <ReviewBox label="All student reviews" count={studAll.count} revenue={studAll.revenue} color={C.teal} fmt={fmt} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 18, marginBottom: 8 }}>Initial review rows only</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          <ReviewBox label="Professional — initial review" count={proInit.count} revenue={proInit.revenue} color={C.navy} fmt={fmt} />
          <ReviewBox label="Student — initial review" count={studInit.count} revenue={studInit.revenue} color={C.teal} fmt={fmt} />
        </div>
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {funderData.length > 0 && (
          <Card title={<>Revenue from Fees — Professional vs. Student<InfoTip title="Professional vs. student"><Def term={'Professional ("Pro.")'}>Non-student (professional) studies — e.g., industry-, institution-, NGO-, or government-funded research. These are summed across all "Pro." columns of the fee table.</Def><Def term={'Student ("Stud.")'}>Student studies — e.g., international, PhD, MA, or BA student research. These are summed across all "Stud." columns of the fee table.</Def>Professional studies typically pay higher fees; student studies often qualify for reduced rates.</InfoTip></>} style={{ flex: "1 1 260px" }}>
            <p style={narrativeStyle}>
              Professional (non-student) studies typically pay higher fees. Student studies often qualify for reduced rates.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginTop: 10 }}>
              <div style={{ width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={funderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                      {funderData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {funderData.map((f) => (
                  <div key={f.name}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color }} />
                      <span style={{ color: C.navy }}>{f.name}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: f.color, marginLeft: 16 }}>{fmt(f.value)}</div>
                    <div style={{ fontSize: 11, color: C.blueGrey, marginLeft: 16 }}>{fmtPct((f.value / (indRev + ngoRev)) * 100)} of fee revenue</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card title="% of Regular Revenue from Fees" style={{ flex: "1 1 220px" }}>
          <p style={narrativeStyle}>
            {feePct >= 80
              ? "Strong fee self-sufficiency — most regular revenue comes from review fees."
              : feePct >= 50
              ? "Moderate fee dependency — other revenue sources supplement fees."
              : "Low fee self-sufficiency — this committee relies heavily on non-fee revenue."}
          </p>
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: C.navy }}>
              <span>% of regular revenue from fees</span>
              <strong>{fmtPct(feePct)}</strong>
            </div>
            <div style={{ height: 14, background: "#eee", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(feePct, 100)}%`, background: feePct >= 70 ? C.green : C.yellow, borderRadius: 8, transition: "width 0.4s" }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Fee Schedule — condensed read-only reflection of the fee `cells`
          (source of truth, edited on the Inputs → Revenue → Revenue from fees
          page). Values (Professional/Student fee = weighted-avg, counts, total
          revenue) are derived from cells in App.jsx on load, so this table is
          display-only — the EditableCells were removed 2026-05-31 because their
          edits could not persist against the cells model.
          FLAGGED FOR WILLYANNE (2026-05-31): open decision — keep this as a
          read-only summary, or remove it as duplicative of the new "Revenue
          from Fees" bars + "Reviews by Submitter Type" boxes? See the
          2026-05-31 status .docx. */}
      <Card title={<>Fee Schedule<InfoTip title="Review types and fees"><Def term="Initial review">The review process required to give ethics approval (or disapproval) for human subjects research study proposals when first submitted to an ethics committee. This review is designed to protect the rights, safety, and welfare of human participants. Conducted for studies that are either "minimal risk" or "more than minimal risk."</Def><Def term="Minimal risk">Studies where the risk of harm or discomfort is not greater than that ordinarily encountered in daily life or during routine physical or psychological examinations or tests.</Def><Def term="More than minimal risk">Includes any study greater than minimal risk.</Def><Def term="Accelerated review">A higher fee charged to complete a specific review process more quickly than the regular timeframe for that review process.</Def><Def term="Continuing review">Ethical re-evaluation that takes place at regular intervals (at least annually) during studies to ensure participant safety and ethical compliance.</Def><Def term="Major amendment">A major amendment is when there is a major change likely to affect the rights, safety, and/or well-being of the research participants or the conduct of the study, which must be reviewed — such as a change in the study protocol like the dosing of the tested medication.</Def><Def term="Minor amendment">A minor amendment is when there is a simple paperwork update, such as when a new research assistant is added to the team.</Def></InfoTip></>}>
        <p style={narrativeStyle}>
          Full fee schedule for all review types, with counts shown separately for professional and student submissions.
          This table reflects the fee data entered on the Inputs &rsaquo; Revenue &rsaquo; Revenue from fees page and is shown here for reference;
          to change a fee amount or count, edit it on that Inputs page.
        </p>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.lightBG }}>
                {["Review Type", "Professional Fee", "Pro Count", "Student Fee", "Stu Count", "Total Revenue"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: C.navy, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeRows.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "9px 10px" }}>{f.type}</td>
                  <td style={{ padding: "9px 10px" }}>{fmt(f.ind || 0)}</td>
                  <td style={{ padding: "9px 10px", color: C.blueGrey }}>{(f.ctPro || 0).toLocaleString()}</td>
                  <td style={{ padding: "9px 10px" }}>{fmt(f.ngo || 0)}</td>
                  <td style={{ padding: "9px 10px", color: C.blueGrey }}>{(f.ctStu || 0).toLocaleString()}</td>
                  <td style={{ padding: "9px 10px", fontWeight: 600, color: C.navy }}>{fmt(f.rev || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={<>Irregular Revenue<InfoTip title="Irregular revenue">Irregular revenue includes grants, contracts, other one-time payments, and deferred reserves. It does not recur annually. Some grant awards may restrict what the funds can be used for — those funds may not be able to support excess expenses in another budget category. Countries should check whether their sources of irregular revenue allow intermingling of funds.</InfoTip></>}>
        <p style={narrativeStyle}>
          Irregular revenue comes from time-limited grants and project funding. It does not recur annually. Click any value to edit.
        </p>
        {d.ri && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {Object.entries(d.ri).map(([k, v]) => (
              <div key={k} style={{ flex: "1 1 150px", background: "#f4f6f8", borderRadius: 7, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: C.blueGrey, textTransform: "capitalize" }}>{k}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.purple, marginTop: 4 }}>
                  <EditableCell value={v} display={fmt(v)} path={`ri.${k}`} onEdit={onEdit} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: "#fff8e8", borderRadius: 6, padding: "8px 12px", borderLeft: `3px solid ${C.yellow}`, fontSize: 12, color: C.blueGrey }}>
          Primary grant ends:&nbsp;
          <strong>
            <EditableCell
              value={d.grantEnd || ""}
              path="grantEnd"
              onEdit={onEdit}
              type="text"
              align="left"
            />
          </strong>
        </div>
      </Card>
    </div>
  );
}

function KPI({ label, val, color }) {
  return (
    <div style={{ flex: "1 1 150px", background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "14px 16px", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{val}</div>
    </div>
  );
}

function ReviewBox({ label, count, revenue, color, fmt }) {
  return (
    <div style={{ flex: "1 1 220px", background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "14px 16px", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 12, color: C.navy, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 22, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>Count</div>
          <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 2 }}>{count.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 2 }}>{fmt(revenue)}</div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", ...style }}>
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
