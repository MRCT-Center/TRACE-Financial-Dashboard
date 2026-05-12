import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { gm, fmtPct, COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import EditableCell from "./EditableCell";
import InfoTip, { Def } from "./InfoTip";

export default function Revenue({ country, data: d, flag, onEdit }) {
  const { fmt } = useCurrency();
  const m = gm(d);

  // Build stacked fee chart data — use authoritative `rev` field, split by count ratio
  const feeRows = d.fees || [];
  const stackedData = feeRows.map((f) => {
    const total = (f.ctPro || 0) + (f.ctStu || 0);
    const proShare = total > 0 ? (f.ctPro || 0) / total : 1;
    return {
      type: f.type,
      professional: Math.round((f.rev || 0) * proShare),
      student: Math.round((f.rev || 0) * (1 - proShare)),
    };
  });

  // Revenue by funder — proportional from rev
  const indRev = stackedData.reduce((s, f) => s + f.professional, 0);
  const ngoRev = stackedData.reduce((s, f) => s + f.student, 0);
  const funderData = [
    { name: "Industry / Sponsor", value: indRev, color: C.navy },
    { name: "Institution / NGO", value: ngoRev, color: C.teal },
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

      <Card title="Revenue from Fees — Professional vs. Student Reviews">
        <p style={narrativeStyle}>
          Each bar shows total fee revenue for a review type, split between professional (sponsor-funded) and student reviews.
          Professional reviews typically generate more revenue per review.
        </p>
        {/* Custom legend above the chart so it never overlaps */}
        <div style={{ display: "flex", gap: 16, marginTop: 10, marginBottom: 4 }}>
          {[{ label: "Professional", color: C.navy }, { label: "Student", color: C.teal }].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#444" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
        {stackedData.length > 0 ? (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData} margin={{ top: 4, right: 20, left: 4, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="type" fontSize={11} angle={-20} textAnchor="end" interval={0} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <Tooltip formatter={(v, name) => [fmt(v), name === "professional" ? "Professional" : "Student"]} />
                <Bar dataKey="professional" stackId="a" fill={C.navy} name="professional" />
                <Bar dataKey="student" stackId="a" fill={C.teal} name="student" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: C.blueGrey, marginTop: 10 }}>No fee data available.</p>
        )}
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {funderData.length > 0 && (
          <Card title={<>Revenue from Fees by Funder Type<InfoTip title="Funder types"><Def term="Industry / Sponsor">Industry-sponsored professional (non-student) research — e.g., pharmaceutical companies or other commercial sponsors conducting clinical trials.</Def><Def term="Institution / NGO / Philanthropy">Research funded by universities, NGOs, or philanthropic organizations, for professional non-student studies.</Def>In the TRACE fee model, funder type is used as a proxy for the origin of the study (e.g., international or domestic), as it is often difficult to identify the study origin directly.</InfoTip></>} style={{ flex: "1 1 260px" }}>
            <p style={narrativeStyle}>
              Industry-sponsored trials typically pay higher fees. Institution and NGO studies often qualify for reduced rates.
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

        <Card title="Fee Revenue — % from fees" style={{ flex: "1 1 220px" }}>
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

      <Card title={<>Fee Schedule<InfoTip title="Review types and fees"><Def term="Initial review">The review process required to give ethics approval (or disapproval) for human subjects research study proposals when first submitted to an ethics committee. This review is designed to protect the rights, safety, and welfare of human participants. Conducted for studies that are either "minimal risk" or "more than minimal risk."</Def><Def term="Minimal risk">Studies where the risk of harm or discomfort is not greater than that ordinarily encountered in daily life or during routine physical or psychological examinations or tests.</Def><Def term="More than minimal risk">Includes any study greater than minimal risk.</Def><Def term="Accelerated review">A higher fee charged to complete a specific review process more quickly than the regular timeframe for that review process.</Def><Def term="Continuing review">Ethical re-evaluation that takes place at regular intervals (at least annually) during studies to ensure participant safety and ethical compliance.</Def><Def term="Major amendment">A major amendment is when there is a major change likely to affect the rights, safety, and/or well-being of the research participants or the conduct of the study, which must be reviewed — such as a change in the study protocol like the dosing of the tested medication.</Def><Def term="Minor amendment">A minor amendment is when there is a simple paperwork update, such as when a new research assistant is added to the team.</Def></InfoTip></>}>
        <p style={narrativeStyle}>
          Full fee schedule for all review types. Counts shown separately for professional and student submissions. Click any value to edit.
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
                  <td style={{ padding: "9px 10px" }}>
                    <EditableCell value={f.ind} display={fmt(f.ind)} path={`fees.${i}.ind`} onEdit={onEdit} />
                  </td>
                  <td style={{ padding: "9px 10px", color: C.blueGrey }}>
                    <EditableCell value={f.ctPro || 0} path={`fees.${i}.ctPro`} onEdit={onEdit} />
                  </td>
                  <td style={{ padding: "9px 10px" }}>
                    <EditableCell value={f.ngo} display={fmt(f.ngo)} path={`fees.${i}.ngo`} onEdit={onEdit} />
                  </td>
                  <td style={{ padding: "9px 10px", color: C.blueGrey }}>
                    <EditableCell value={f.ctStu || 0} path={`fees.${i}.ctStu`} onEdit={onEdit} />
                  </td>
                  <td style={{ padding: "9px 10px", fontWeight: 600, color: C.navy }}>
                    <EditableCell value={f.rev || 0} display={fmt(f.rev || 0)} path={`fees.${i}.rev`} onEdit={onEdit} />
                  </td>
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
