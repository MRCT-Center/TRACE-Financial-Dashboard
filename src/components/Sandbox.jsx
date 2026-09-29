import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import Results from "./Results";

// Sandbox (2026-09-29): what-if scenarios, copied from the current Master at
// creation time, edited independently, shared across a country's reps.
// Never writes back to Master (Hayat's 2026-09-25 decision) -- see
// country_scenarios in Supabase. Admins deliberately can't see this view at
// all (no admin RLS policy on country_scenarios, and Sandbox isn't in
// ADMIN_VIEWS) -- spec section 7.

export default function Sandbox({ country, flag, masterData, canEdit }) {
  const [scenarios, setScenarios] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("country_scenarios")
        .select("id, name, data, created_at, created_by, updated_at, updated_by")
        .eq("country", country)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setScenarios(data || []);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load scenarios.");
      setStatus("error");
    }
  }, [country]);

  useEffect(() => { load(); setOpenId(null); }, [load]);

  async function createScenario() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("country_scenarios").insert({
        country, name, data: masterData,
      });
      if (error) throw error;
      setNewName("");
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not create scenario.");
    } finally {
      setCreating(false);
    }
  }

  async function updateScenarioData(id, updates) {
    const current = scenarios.find((s) => s.id === id);
    if (!current) return;
    const merged = { ...current.data, ...updates };
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, data: merged } : s)));
    const { error } = await supabase
      .from("country_scenarios")
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.warn("Could not save scenario edit:", error.message);
  }

  async function renameScenario(id) {
    const name = renameValue.trim();
    if (!name) { setRenamingId(null); return; }
    const { error } = await supabase.from("country_scenarios").update({ name }).eq("id", id);
    if (error) { setErrorMsg(error.message); return; }
    setRenamingId(null);
    await load();
  }

  async function deleteScenario(id) {
    const { error } = await supabase.from("country_scenarios").delete().eq("id", id);
    if (error) { setErrorMsg(error.message); return; }
    setConfirmDeleteId(null);
    if (openId === id) setOpenId(null);
    await load();
  }

  const openScenario = scenarios.find((s) => s.id === openId);

  if (openScenario) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: "10px 14px" }}>
          <button
            onClick={() => setOpenId(null)}
            style={{ padding: "6px 12px", minHeight: 32, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.teal, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            ← All scenarios
          </button>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.navy }}>{openScenario.name}</div>
          <div style={{ fontSize: 11.5, color: "#777" }}>What-if only — never affects the real {country} data</div>
        </div>
        <Results
          country={country}
          data={openScenario.data}
          flag={flag}
          canEdit={canEdit}
          showHistory={false}
          onEdit={(path, value) => {
            const clone = JSON.parse(JSON.stringify(openScenario.data));
            const keys = path.split(".");
            let cur = clone;
            for (let i = 0; i < keys.length - 1; i++) {
              const k = keys[i];
              if (!(k in cur)) cur[k] = {};
              cur = cur[k];
            }
            cur[keys[keys.length - 1]] = value;
            updateScenarioData(openScenario.id, clone);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Sandbox</div>
        <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          What-if copies of {country}'s current data. Play with the numbers here — changes stay in the
          scenario and never touch the real Master file. Shared with every rep on {country}'s team.
        </p>
        {canEdit && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Scenario name (e.g. “What if fees drop 20%”)"
              style={{ flex: 1, padding: "8px 10px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 36 }}
            />
            <button
              onClick={createScenario}
              disabled={creating || !newName.trim()}
              style={{ padding: "8px 16px", minHeight: 36, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", opacity: creating || !newName.trim() ? 0.6 : 1 }}
            >
              {creating ? "Creating…" : "Create scenario"}
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ fontSize: 12.5, color: "#b3261e", background: "#fdecea", border: "1px solid #f3c5c1", borderRadius: 8, padding: 10 }}>
          {errorMsg}
        </div>
      )}

      {status === "loading" && <div style={{ fontSize: 12.5, color: "#777" }}>Loading scenarios…</div>}
      {status === "ready" && scenarios.length === 0 && (
        <div style={{ fontSize: 12.5, color: "#777" }}>No scenarios yet for {country}.</div>
      )}

      {status === "ready" && scenarios.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scenarios.map((s) => (
            <div key={s.id} style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {renamingId === s.id ? (
                <>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    style={{ flex: 1, padding: "5px 8px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 30 }}
                  />
                  <button onClick={() => renameScenario(s.id)} style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setRenamingId(null)} style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: "#555", fontSize: 11.5, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, flex: 1, minWidth: 160 }}>{s.name}</span>
                  <span style={{ fontSize: 11.5, color: "#777" }}>updated {new Date(s.updated_at).toLocaleString()}</span>
                  <button
                    onClick={() => setOpenId(s.id)}
                    style={{ padding: "5px 12px", minHeight: 30, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Open
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => { setRenamingId(s.id); setRenameValue(s.name); }}
                        style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: "#555", fontSize: 11.5, cursor: "pointer" }}
                      >
                        Rename
                      </button>
                      {confirmDeleteId === s.id ? (
                        <>
                          <button onClick={() => deleteScenario(s.id)} style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "none", background: "#b3261e", color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Confirm delete</button>
                          <button onClick={() => setConfirmDeleteId(null)} style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: "#555", fontSize: 11.5, cursor: "pointer" }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(s.id)} style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: "#b3261e", fontSize: 11.5, cursor: "pointer" }}>Delete</button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
