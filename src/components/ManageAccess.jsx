import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";

// Admin screen for revoking and reinstating country-rep access after the
// fact. Country teams can have more than one rep (profiles.country isn't
// unique), so this lists every 'country' profile, grouped by country, each
// with its own revoke/reinstate toggle.
//
// Revoking sets profiles.active = false. That's enforced at the database
// level (see the access-control-lockdown-and-revoke migration): every RLS
// policy that grants a country rep access to their country's data also
// requires active = true, so a revoked rep loses real data access
// immediately, not just the ability to see it rendered in the UI. Revoking
// does not delete their login or their history, and does not stop them from
// submitting a new access request — that's intentional; a new request just
// goes back through the normal approval queue (see AdminAccessRequests.jsx),
// which reactivates this same profile row rather than creating a new one.

export default function ManageAccess() {
  const [profiles, setProfiles] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, country, active, created_at")
        .eq("role", "country")
        .order("country", { ascending: true })
        .order("email", { ascending: true });
      if (error) throw error;
      setProfiles(data || []);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load access.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(profile) {
    setBusyId(profile.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active: !profile.active })
        .eq("id", profile.id);
      if (error) throw error;
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not update access.");
    } finally {
      setBusyId(null);
    }
  }

  const grouped = profiles.reduce((acc, p) => {
    const key = p.country || "(no country set)";
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});
  const countryNames = Object.keys(grouped).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.navy, borderRadius: 10, padding: "16px 22px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Manage Access 🔒</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
            {profiles.length} country accounts · revoke or reinstate access per person
          </div>
        </div>
        <button onClick={load} style={ghostBtn}>↻ Refresh</button>
      </div>

      {status === "loading" && <Note>Loading access…</Note>}
      {status === "error" && <Note color={C.red}>Could not load access: {errorMsg}</Note>}

      {status === "ready" && (
        countryNames.length === 0 ? (
          <Note>No country accounts yet.</Note>
        ) : (
          countryNames.map((country) => (
            <Card key={country} title={`${country} (${grouped[country].length})`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {grouped[country].map((p) => (
                  <div key={p.id} style={{ border: "1px solid #e3e8ec", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{p.email}</div>
                      <div style={{ fontSize: 12, marginTop: 2, color: p.active ? C.teal : C.red, fontWeight: 700 }}>
                        {p.active ? "Active" : "Revoked"}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={busyId === p.id}
                      style={p.active ? denyBtn : approveBtn}
                    >
                      {busyId === p.id ? "…" : p.active ? "Revoke access" : "Reinstate access"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )
      )}
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

function Note({ children, color }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 9, padding: "16px 18px", fontSize: 13, color: color || "#666" }}>
      {children}
    </div>
  );
}

const ghostBtn = { background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 44, border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" };
const approveBtn = { background: C.teal, color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 40, border: "none", cursor: "pointer" };
const denyBtn = { background: "#fff", color: C.red, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, minHeight: 40, border: `1px solid ${C.red}`, cursor: "pointer" };
