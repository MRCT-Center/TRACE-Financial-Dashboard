import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { gm, fmtPct, COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import { EXPENSES_REGULAR, EXPENSES_REGULAR_ITEM_LOOKUP, NEC_KEYS } from "../data/expensesRegular";
import InfoTip, { Def } from "./InfoTip";

// Per Willyanne 2026-05-30 (#4): the "By category" pie keeps a cool blue/teal
// family; the "Ethics Committee" pie uses a distinct warm palette so the two
// circles never share a colour.
const EXP_COLORS = [C.navy, C.teal, C.steelblue, C.darkTeal, C.blueGrey, "#3f6f8f", "#6aa6c2"];
const NEC_COLORS = [C.purple, C.orange, C.yellow, C.green, C.red, C.darkRed];

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
        <InKindCard d={d} />
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
        { label: "Expenses", val: fmt(m.te), sub: "Secretariat + Ethics Committee" },
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
        { label: "Total In-Kind", val: fmt(ikTotal), sub: "Off-budget" },
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
  const getLabel = (k) => EXPENSES_REGULAR_ITEM_LOOKUP[k]?.label || k;

  // Per Willyanne 2026-05-29 (in-person): the left pie previously drew one
  // slice per expense item (up to 27 — too many). Reduce it to one slice per
  // Secretariat/mgmt. category plus a single combined "Ethics Committee" slice.
  // Iterate the canonical category structure so order + grouping are stable.
  const groupedPie = (() => {
    const out = [];
    let ethicsSum = 0;
    for (const cat of EXPENSES_REGULAR) {
      const sum = cat.items.reduce((s, it) => s + (Number(d.er?.[it.key]) || 0), 0);
      if (cat.categoryLabel.startsWith("Ethics Committee")) ethicsSum += sum;
      // Strip the shared "Secretariat/mgmt." prefix for legend readability
      // (Willyanne 2026-05-29, in-person) — revertible if a fuller label is
      // wanted later. The combined Ethics slice keeps the "Ethics Committee"
      // name since it represents the whole group.
      else out.push({ name: cat.categoryLabel.replace(/^Secretariat\/mgmt\.\s*/, ""), value: sum });
    }
    out.push({ name: "Ethics Committee", value: ethicsSum });
    return out
      .filter((s) => s.value > 0)
      .map((s, i) => ({ ...s, color: EXP_COLORS[i % EXP_COLORS.length] }));
  })();

  const necPie = NEC_KEYS
    .filter((k) => (d.er?.[k] || 0) > 0)
    .map((k, i) => ({ name: getLabel(k), value: d.er[k], color: NEC_COLORS[i % NEC_COLORS.length] }));

  const necTotal = NEC_KEYS.reduce((s, k) => s + (d.er?.[k] || 0), 0);

  return (
    <Card title="Regular Expense Breakdown" style={{ flex: "1 1 360px" }}>
      <p style={narrativeStyle}>
        The left circle shows the regular budget grouped by category — each Secretariat/mgmt. category plus the combined Ethics Committee total. The right circle breaks out the Ethics Committee portion alone ({fmt(necTotal)}).
        Hover over each segment for details.
      </p>
      {/* Per Willyanne 2026-05-30 (#4): each pie gets its own legend stacked in
          a single vertical column directly beneath it (rather than one shared
          wrapping legend), so each circle reads with its own colour key. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginTop: 8 }}>
        <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={groupedPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {groupedPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: C.blueGrey, fontWeight: 600, marginTop: 2 }}>By category</div>
          <PieLegend items={groupedPie} />
        </div>
        {necPie.length > 0 && (
          <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={necPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {necPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: C.blueGrey, fontWeight: 600, marginTop: 2 }}>Ethics Committee only</div>
            <PieLegend items={necPie} />
          </div>
        )}
      </div>
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
    const key = p.funder || "(unspecified)";
    byFunder[key] = (byFunder[key] || 0) + (Number(p.amount) || 0);
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

function InKindCard({ d }) {
  const { fmt } = useCurrency();
  // Per Willyanne 2026-05-29 (in-person): show in-kind by funding source,
  // combining the regular + irregular In-Kind tabs' subtotals. Values derive
  // from the inputs (gm() feeds ikReg/ikIrr rollups), so they are read-only
  // here — country teams edit on the Step 5 In-Kind tabs.
  const reg = d.ikReg || { federal: 0, institutional: 0, other: 0, total: 0 };
  const irr = d.ikIrr || { federal: 0, institutional: 0, other: 0, total: 0 };
  const combined = (f) => (Number(reg[f]) || 0) + (Number(irr[f]) || 0);
  const totalIk = (Number(reg.total) || 0) + (Number(irr.total) || 0);

  return (
    <Card title={<>In-Kind Contributions<InfoTip title="What are in-kind contributions?">Non-cash support that is usually considered "off-budget" or "off-book" — for example, government office space, university staff volunteering on the ethics committee, staff personal vehicle use for site visits, or staff unpaid overtime. In-kind contributions are not listed as either expenses or revenue because they are both; they can be regular/recurring or irregular/one-time.<br /><br /><strong style={{ color: "#a90533" }}>Advocacy note:</strong> Entities that give in-kind contributions — especially government entities — may view the estimates you generate as reason not to provide monetary funding, seeing them as indicative of having "given enough." You may wish to complete the in-kind tabs but share results only with specific audiences.</InfoTip></>} style={{ flex: "1 1 280px" }}>
      <p style={narrativeStyle}>
        In-kind contributions are non-cash support — staff time, office space, or equipment donated by
        federal agencies, universities, or other institutions. These totals are drawn from the In-Kind Contributions tabs (regular + irregular), grouped by funding source. Because in-kind is simultaneously both an expense and a revenue, it does not affect the cash gap; it is captured here as additional economic context.
      </p>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Federal",       field: "federal" },
          { label: "Institutional", field: "institutional" },
          { label: "Other",         field: "other" },
        ].map(({ label, field }) => (
          <div key={field} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f4f6f8", borderRadius: 6 }}>
            <span style={{ fontSize: 13, color: C.navy }}>{label}</span>
            <strong style={{ fontSize: 13, color: C.steelblue }}>{fmt(combined(field))}</strong>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.navy, borderRadius: 6, marginTop: 2 }}>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>Total in-kind</span>
          <strong style={{ fontSize: 13, color: C.yellow }}>{fmt(totalIk)}</strong>
        </div>
      </div>
    </Card>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", ...style }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde", borderRadius: "9px 9px 0 0" }}>
        {title}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

// A single vertical column of legend entries, sized to sit beneath its pie.
// Per Willyanne 2026-05-30 (#4): one entry per row so the key forms a column.
function PieLegend({ items }) {
  const { fmt } = useCurrency();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10, alignSelf: "stretch", width: "100%" }}>
      {items.map((item) => (
        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
          <span style={{ color: "#444" }}>{item.name}: {fmt(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

const narrativeStyle = { fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" };
