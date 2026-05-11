import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { gm, COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import EditableCell from "./EditableCell";

const REG_LABELS = {
  secSal: "Secretariat — Salaries",
  secBen: "Secretariat — Benefits",
  secRec: "Secretariat — Recurring",
  nSal:   "NEC — Payments",
  nBen:   "NEC — Benefits",
  nRec:   "NEC — Recurring",
  recG:   "Recurring — Grants",
  recGov: "Recurring — Gov't",
};

export default function Expenses({ country, data: d, flag, onEdit }) {
  const { fmt } = useCurrency();
  const m = gm(d);
  const regRows = Object.entries(d.er).map(([k, v]) => ({ key: k, category: REG_LABELS[k] || k, amount: v }));
  const necTotal = (d.er.nSal || 0) + (d.er.nBen || 0) + (d.er.nRec || 0);
  const secTotal = m.te - necTotal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title={`${flag} ${country} — Expenses`} subtitle="Regular and irregular costs" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <KPI label="Total Regular Expenses" val={fmt(m.te)} color={C.navy} />
        <KPI label="Secretariat" val={fmt(secTotal)} color={C.teal} />
        <KPI label="Ethics Committee (NEC)" val={fmt(necTotal)} color={C.purple} />
        <KPI label="Total Irregular Expenses" val={fmt(m.ti)} color={C.steelblue} />
      </div>

      <Card title="Regular Expenses — Breakdown">
        <p style={narrativeStyle}>
          Regular expenses are the recurring annual costs of running your secretariat and ethics committee.
          Salaries and benefits make up the bulk of these costs for most committees. Click any amount to edit.
        </p>
        <div style={{ height: 240, marginTop: 14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regRows} layout="vertical" margin={{ left: 14, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <YAxis dataKey="category" type="category" fontSize={11} width={170} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="amount" fill={C.navy} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.lightBG }}>
              <th style={{ textAlign: "left", padding: "7px 10px", color: C.navy, fontWeight: 700, fontSize: 12 }}>Category</th>
              <th style={{ textAlign: "right", padding: "7px 10px", color: C.navy, fontWeight: 700, fontSize: 12 }}>Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            {regRows.map(({ key, category, amount }) => (
              <tr key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "8px 10px", color: "#333" }}>{category}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 500, color: C.navy }}>
                  <EditableCell value={amount} display={fmt(amount)} path={`er.${key}`} onEdit={onEdit} />
                </td>
              </tr>
            ))}
            <tr style={{ background: "#f8f8f8", fontWeight: 700 }}>
              <td style={{ padding: "8px 10px" }}>Total</td>
              <td style={{ padding: "8px 10px", textAlign: "right", color: C.navy }}>{fmt(m.te)}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {d.necDetail && (
        <Card title="Ethics Committee — Detailed Breakdown">
          <p style={narrativeStyle}>
            The ethics committee budget covers reviewer payments, training time, travel supplements, and meeting hosting.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {[
              { label: "Reviewer payments (review time)", field: "reviewPay" },
              { label: "Reviewer training time",          field: "reviewTrain" },
              { label: "Travel time supplement",          field: "travelTime" },
              { label: "Travel cost supplement",          field: "travelCost" },
              { label: "Meeting hosting",                 field: "meetings" },
            ].map(({ label, field }) => (
              <div key={field} style={{ flex: "1 1 160px", background: "#f4f6f8", borderRadius: 7, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: C.blueGrey }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.purple, marginTop: 4 }}>
                  <EditableCell
                    value={d.necDetail[field]}
                    display={fmt(d.necDetail[field])}
                    path={`necDetail.${field}`}
                    onEdit={onEdit}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Irregular Expenses">
        {(!d.irrProj || d.irrProj.length === 0) ? (
          <p style={narrativeStyle}>No irregular expenses recorded for this country.</p>
        ) : (
          <>
            <p style={narrativeStyle}>
              Irregular expenses are project-based costs funded by grants. They do not recur annually.
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.lightBG }}>
                  {["Project", "Funder", "Amount"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.navy, fontWeight: 700, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.irrProj.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "9px 12px" }}>
                      <EditableCell value={p.name} path={`irrProj.${i}.name`} onEdit={onEdit} type="text" align="left" />
                    </td>
                    <td style={{ padding: "9px 12px", color: C.blueGrey }}>
                      <EditableCell value={p.funder} path={`irrProj.${i}.funder`} onEdit={onEdit} type="text" align="left" />
                    </td>
                    <td style={{ padding: "9px 12px", fontWeight: 600, color: C.navy }}>
                      <EditableCell value={p.amount} display={fmt(p.amount)} path={`irrProj.${i}.amount`} onEdit={onEdit} />
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "#f8f8f8", fontWeight: 700 }}>
                  <td style={{ padding: "9px 12px" }} colSpan={2}>Total</td>
                  <td style={{ padding: "9px 12px", color: C.navy }}>{fmt(m.ti)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
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

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", overflow: "hidden" }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>{title}</div>
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
