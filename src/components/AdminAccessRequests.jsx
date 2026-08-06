import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";

// Admin queue for the access-request gatekeeping flow: country teams submit
// requests from the login page (RequestAccessForm in LoginPage.jsx); this
// panel is where MRCT Center approves or denies them. Approval doesn't create
// the account directly — it just unlocks the "set your password" step for
// that email (see claimAccess() in src/auth.js). Reads/writes the
// access_requests table set up by supabase-access-control-migration.sql.

export default function AdminAccessRequests({ adminEmail }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .select("id, name, email, country, note, status, requested_at, decided_at, decided_by")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      setRows(data || []);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load access requests.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id, decision) {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({ status: decision, decided_at: new Date().toISOString(), decided_by: adminEmail })
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not update the request.");
    } finally {
      setBusyId(null);
    }
  }

  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "16px 22px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Access Requests 🔑</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            {pending.length} pending · country teams requesting dashboard access
          </div>
        </div>
        <button onClick={load} style={ghostBtn}>↻ Refresh</button>
      </div>

      {status === "loading" && <Note>Loading access requests…</Note>}
      {status === "error" && <Note color={C.red}>Could not load access requests: {errorMsg}</Note>}

      {status === "ready" && (
        <>
          <Card title={`Pending (${pending.length})`}>
            {pending.length === 0 ? (
              <Note>No pending requests.</Note>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.map((r) => (
                  <div key={r.id} style={{ border: "1px solid #e3e8ec", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{r.name} — {r.country}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{r.email} · requested {new Date(r.requested_at).toLocaleString()}</div>
                      {r.note && <div style={{ fontSize: 13, color: "#444", marginTop: 6, whiteSpace: "pre-wrap" }}>{r.note}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => decide(r.id, "denied")} disabled={busyId === r.id} style={denyBtn}>Deny</button>
                      <button onClick={() => decide(r.id, "approved")} disabled={busyId === r.id} style={approveBtn}>
                        {busyId === r.id ? "…" : "Approve"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Decided (${decided.length})`}>
            {decided.length === 0 ? (
              <Note>No decided requests yet.</Note>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.lightBG }}>
                      <th style={thL}>Name</th>
                      <th style={thL}>Email</th>
                      <th style={thL}>Country</th>
                      <th style={thL}>Status</th>
                      <th style={thL}>Decided</th>
                      <th style={thL}>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decided.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={tdCell}>{r.name}</td>
                        <td style={tdCell}>{r.email}</td>
                        <td style={tdCell}>{r.country}</td>
                        <td style={tdCell}><StatusBadge status={r.status} /></td>
                        <td style={tdCell}>{r.decided_at ? new Date(r.decided_at).toLocaleString() : "—"}</td>
                        <td style={tdCell}>{r.decided_by || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colorMap = { approved: C.teal, completed: C.green, denied: C.red };
  const labelMap = { approved: "Approved — awaiting password", completed: "Active account", denied: "Denied" };
  return <span style={{ color: colorMap[status] || "#666", fontWeight: 700 }}>{labelMap[status] || status}</span>;
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 9, border: "1px solid #dde", overflow: "hidden" }}>
      <div style={{ background: C.lightBG, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: C.navy, borderBottom: "1px solid #dde" }}>{title}</div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function Note({ children, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "16px 18px", fontSize: 13, color: color || "#666" }}>
      {children}
    </div>
  );
}

const thL = { padding: "8px 12px", textAlign: "left", color: C.navy, fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" };
const tdCell = { padding: "9px 12px", textAlign: "left" };
const ghostBtn = { background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 44, border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" };
const approveBtn = { background: C.teal, color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 40, border: "none", cursor: "pointer" };
const denyBtn = { background: "#fff", color: C.red, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 40, border: `1px solid ${C.red}`, cursor: "pointer" };
