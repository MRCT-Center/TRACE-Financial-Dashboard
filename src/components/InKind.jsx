import { COLORS as C } from "../utils/metrics";
import { useCurrency } from "../utils/CurrencyContext";
import EditableCell from "./EditableCell";
import { IN_KIND_FUNDING_SOURCE_OPTIONS } from "../data/inKindRegular";

// In-Kind results page (2026-10-27): a dedicated breakout of in-kind
// contributions (previously only a small box on the Overview). In the
// Sandbox (`sandbox` true) amounts and funding sources can be edited; on the
// real Results page it is read-only.
export default function InKind({ country, data: d, flag, onEdit, sandbox = false }) {
  const { fmt } = useCurrency();
  const reg = d.ikReg || { federal: 0, institutional: 0, other: 0, total: 0 };
  const irr = d.ikIrr || { federal: 0, institutional: 0, other: 0, total: 0 };
  const combined = (f) => (Number(reg[f]) || 0) + (Number(irr[f]) || 0);
  const total = (Number(reg.total) || 0) + (Number(irr.total) || 0);
  const sources = [
    { label: "Federal", field: "federal", color: C.navy },
    { label: "Institutional", field: "institutional", color: C.teal },
    { label: "Other source", field: "other", color: C.purple },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.navy, borderRadius: 9, padding: "14px 20px", color: "#fff" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{flag} {country} — In-Kind Contributions</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Non-cash support, shown separately from the cash budget</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        <KPI label="Regular In-Kind" val={fmt(reg.total || 0)} color={C.teal} />
        <KPI label="Irregular In-Kind" val={fmt(irr.total || 0)} color={C.purple} />
        <KPI label="Total In-Kind" val={fmt(total)} color={C.navy} />
      </div>

      <Card title="In-Kind by Funding Source">
        <p style={narrativeStyle}>
          In-kind contributions are both an expense and a revenue, so they do not change the cash gap. They are shown here as additional economic context, combined across the regular and irregular tabs.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {sources.map((s) => {
            const v = combined(s.field);
            const pct = total > 0 ? (v / total) * 100 : 0;
            return (
              <div key={s.field}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.navy, marginBottom: 4 }}>
                  <span>{s.label}</span><strong>{fmt(v)} ({Math.round(pct)}%)</strong>
                </div>
                <div style={{ height: 12, background: "#eee", borderRadius: 7, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <RowsCard title="Regular In-Kind Contributions" rows={d.ikRegRows} arrayKey="ikRegRows" fmt={fmt} onEdit={onEdit} sandbox={sandbox} />
      <RowsCard title="Irregular In-Kind Contributions" rows={d.ikIrrRows} arrayKey="ikIrrRows" fmt={fmt} onEdit={onEdit} sandbox={sandbox} />
    </div>
  );
}

function RowsCard({ title, rows, arrayKey, fmt, onEdit, sandbox }) {
  const list = rows || [];
  return (
    <Card title={title}>
      {sandbox && <p style={narrativeStyle}>Sandbox: click any amount to edit it, or change the funding source. Nothing here is saved.</p>}
      {list.length === 0 ? (
        <p style={narrativeStyle}>No in-kind contributions recorded.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.lightBG }}>
                {["Category", "Item", "Funding source", "Amount"].map((h) => (
                  <th key={h} style={{ textAlign: h === "Amount" ? "right" : "left", padding: "8px 10px", color: C.navy, fontWeight: 700, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 10px", color: C.blueGrey, fontSize: 12 }}>{r.category}</td>
                  <td style={{ padding: "8px 10px" }}>{r.item || "—"}</td>
                  <td style={{ padding: "8px 10px" }}>
                    {sandbox ? (
                      <select value={r.funder || ""} onChange={(e) => onEdit(`${arrayKey}.${i}.funder`, e.target.value)} style={{ padding: "3px 6px", fontSize: 12, border: "1px solid #ccd", borderRadius: 5 }}>
                        <option value="">(none)</option>
                        {IN_KIND_FUNDING_SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o.replace("In-kind contribution ", "")}</option>)}
                      </select>
                    ) : (r.funder ? r.funder.replace("In-kind contribution ", "") : "—")}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: C.navy }}>
                    {sandbox
                      ? <EditableCell value={Number(r.amount) || 0} display={fmt(Number(r.amount) || 0)} path={`${arrayKey}.${i}.amount`} onEdit={onEdit} />
                      : fmt(Number(r.amount) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
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
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde" }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde", borderRadius: "9px 9px 0 0" }}>{title}</div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}
const narrativeStyle = { fontSize: 13, color: "#555", lineHeight: 1.6, fontStyle: "italic" };
