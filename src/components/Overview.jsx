import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { gm, fmtPct, COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import EditableCell from "./EditableCell";

const EXP_COLORS = [C.navy, C.teal, C.steelblue, C.purple, C.blueGrey, C.darkTeal, C.orange];

export default function Overview({ country, data: d, flag, onEdit }) {
  const m = gm(d);
  const { fmt } = useCurrency();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader country={country} flag={flag} m={m} />
      <KPIColumns m={m} d={d} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <ExpensePieCard d={d} />
        <IrrExpenseCard d={d} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <RevDependencyCard d={d} m={m} />
        <InKindCard d={d} onEdit={onEdit} />
      </div>
    </div>
  );
}

function PageHeader({ country, flag, m }) {
  const { fmt } = useCurrency();
  const gap = m.cg;
  return (
    <div style={{ background: C.navy, borderRadius: 10, padding: "18px 24px", color: "#fff", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, opacity: 0.65, textTransform: "uppercase", letterSpacing: 1 }}>Financial Overview</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{flag} {country}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Combined budget gap</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: gap >= 0 ? "#7ecf5a" : C.yellow }}>
          {fmt(gap)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.65 }}>{gap >= 0 ? "surplus" : "deficit"}</div>
      </div>
    </div>
  );
}

function KPIColumns({ m, d }) {
  const { fmt } = useCurrency();
  const ikTotal = m.ik;
  const cols = [
    {
      label: "Regular Budget",
      color: C.teal,
      rows: [
        { label: "Expenses", val: fmt(m.te), sub: "Secretariat + NEC" },
        { label: "Revenue", val: fmt(m.tr), sub: "Fees + other" },
        { label: "Gap", val: fmt(m.rg), sub: null, gap: true, value: m.rg },
      ],
    },
    {
      label: "Irregular Budget",
      color: C.purple,
      rows: [
        { label: "Expenses", val: fmt(m.ti), sub: "Project-based" },
        { label: "Revenue", val: fmt(m.tri), sub: "Grants" },
        { label: "Gap", val: fmt(m.ig), sub: null, gap: true, value: m.ig },
      ],
    },
    {
      label: "Combined Gap",
      color: m.cg >= 0 ? C.green : C.red,
      rows: [
        { label: "Total Expenses", val: fmt(m.te + m.ti), sub: null },
        { label: "Total Revenue", val: fmt(m.tr + m.tri), sub: null },
        { label: "Combined Gap", val: fmt(m.cg), sub: null, gap: true, value: m.cg },
      ],
    },
    {
      label: "In-Kind",
      color: C.steelblue,
      rows: [
        { label: "Regular In-Kind", val: fmt(d.ikReg?.total || 0), sub: "Fed + Institutional" },
        { label: "Irregular In-Kind", val: fmt(d.ikIrr?.total || 0), sub: "Project-based" },
        { label: "Total In-Kind", val: fmt(ikTotal), sub: null, badge: "Phase 2" },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
      {cols.map((col) => (
        <div key={col.label} style={{ flex: "1 1 180px", background: "#fff", borderRadius: 9, overflow: "hidden", border: "1px solid #dde" }}>
          <div style={{ background: col.color, color: "#fff", padding: "8px 14px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {col.label}
          </div>
          {col.rows.map((row) => (
            <div key={row.label} style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 11, color: C.blueGrey, textTransform: "uppercase", letterSpacing: 0.5 }}>{row.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, color: row.gap ? (row.value >= 0 ? C.green : C.red) : C.navy }}>
                {row.val}
              </div>
              {row.sub && <div style={{ fontSize: 11, color: C.blueGrey, marginTop: 1 }}>{row.sub}</div>}
              {row.badge && (
                <span style={{ marginTop: 4, alignSelf: "flex-start", background: "#eef4ff", color: C.steelblue, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5 }}>
                  {row.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ExpensePieCard({ d }) {
  const { fmt } = useCurrency();
  const erLabels = {
    secSal: "Secretariat salaries", secBen: "Secretariat benefits", secRec: "Secretariat recurring",
    nSal: "NEC payments", nBen: "NEC benefits", nRec: "NEC recurring",
    recG: "Government/Grants", recGov: "Government support",
  };
  const necKeys = ["nSal", "nBen", "nRec"];

  const fullPie = Object.entries(d.er)
    .filter(([, v]) => v > 0)
    .map(([k, v], i) => ({ name: erLabels[k] || k, value: v, color: EXP_COLORS[i % EXP_COLORS.length] }));

  const necPie = necKeys
    .filter((k) => d.er[k] > 0)
    .map((k, i) => ({ name: erLabels[k] || k, value: d.er[k], color: [C.navy, C.teal, C.steelblue][i] }));

  const necTotal = necKeys.reduce((s, k) => s + (d.er[k] || 0), 0);

  return (
    <Card title="Regular Expense Breakdown" style={{ flex: "1 1 360px" }}>
      <p style={narrativeStyle}>
        The two circles show the full secretariat budget (left) and the ethics committee portion alone (right, {fmt(necTotal)}).
        Hover over each segment for details.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
        <div style={{ width: 200, height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={fullPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {fullPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: "center", fontSize: 11, color: C.blueGrey }}>Full budget</div>
        </div>
        {necPie.length > 0 && (
          <div style={{ width: 150, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={necPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                  {necPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", fontSize: 11, color: C.blueGrey }}>NEC only</div>
          </div>
        )}
      </div>
      <PieLegend items={fullPie} />
    </Card>
  );
}

function IrrExpenseCard({ d }) {
  const { fmt } = useCurrency();
  if (!d.irrProj || d.irrProj.length === 0) {
    return (
      <Card title="Irregular Expenses by Funder" style={{ flex: "1 1 300px" }}>
        <p style={narrativeStyle}>No irregular (grant-funded) expenses recorded for this country yet.</p>
      </Card>
    );
  }
  const byFunder = {};
  d.irrProj.forEach((p) => {
    byFunder[p.funder] = (byFunder[p.funder] || 0) + p.amount;
  });
  const data = Object.entries(byFunder).map(([funder, amount]) => ({ funder, amount }));

  return (
    <Card title="Irregular Expenses by Funder" style={{ flex: "1 1 300px" }}>
      <p style={narrativeStyle}>
        Irregular expenses are funded by grants or one-time sources. This chart shows how much comes from each funder.
      </p>
      <div style={{ height: 200, marginTop: 10 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
            <YAxis dataKey="funder" type="category" fontSize={11} width={90} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="amount" fill={C.purple} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function RevDependencyCard({ d, m }) {
  const feePct = m.tr > 0 ? (d.revFees / m.tr) * 100 : 0;
  const grantPct = m.tri > 0 ? ((d.ri?.grants || 0) / m.tri) * 100 : 0;

  return (
    <Card title="Revenue Dependency" style={{ flex: "1 1 280px" }}>
      <p style={narrativeStyle}>
        A high dependency on fees means operations are self-sustaining.
        A high grant dependency means irregular funding is concentrated in one source — a risk if that grant ends.
      </p>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
        <DepBar label="% of regular revenue from fees" pct={feePct} color={C.teal} />
        <DepBar label="% of irregular revenue from grants" pct={grantPct} color={C.purple} />
        {d.grantEnd && (
          <div style={{ fontSize: 12, color: C.blueGrey, background: "#fff8e8", borderRadius: 6, padding: "8px 12px", borderLeft: `3px solid ${C.yellow}` }}>
            Grant ends: <strong>{d.grantEnd}</strong>
          </div>
        )}
      </div>
    </Card>
  );
}

function DepBar({ label, pct, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: C.navy }}>
        <span>{label}</span>
        <strong>{fmtPct(pct)}</strong>
      </div>
      <div style={{ height: 12, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 6, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function InKindCard({ d, onEdit }) {
  const { fmt } = useCurrency();
  const ik = d.ikReg || { federal: 0, institutional: 0, other: 0, total: 0 };

  return (
    <Card title="In-Kind Contributions" style={{ flex: "1 1 280px" }}>
      <p style={narrativeStyle}>
        In-kind contributions are non-cash support — staff time, office space, or equipment donated by
        federal agencies, universities, or other institutions. Click any value to edit. These are not yet included in gap calculations.
      </p>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Federal",       field: "federal" },
          { label: "Institutional", field: "institutional" },
          { label: "Other",         field: "other" },
        ].map(({ label, field }) => (
          <div key={field} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f4f6f8", borderRadius: 6 }}>
            <span style={{ fontSize: 13, color: C.navy }}>{label}</span>
            <strong style={{ fontSize: 13, color: C.steelblue }}>
              <EditableCell value={ik[field] || 0} display={fmt(ik[field] || 0)} path={`ikReg.${field}`} onEdit={onEdit} />
            </strong>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.navy, borderRadius: 6, marginTop: 2 }}>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Total in-kind</span>
          <strong style={{ fontSize: 13, color: C.yellow }}>
            <EditableCell value={ik.total || 0} display={fmt(ik.total || 0)} path="ikReg.total" onEdit={onEdit} />
          </strong>
        </div>
        <div style={{ fontSize: 11, color: C.blueGrey, fontStyle: "italic", marginTop: 4 }}>
          In-kind contributions will factor into gap calculations in Phase 2.
        </div>
      </div>
    </Card>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", overflow: "hidden", ...style }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>
        {title}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function PieLegend({ items }) {
  const { fmt } = useCurrency();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 10 }}>
      {items.map((item) => (
        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
          <span style={{ color: "#444" }}>{item.name}: {fmt(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

const narrativeStyle = { fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" };
