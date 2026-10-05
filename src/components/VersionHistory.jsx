import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import YearDates from "./YearDates";
import StepInstructions from "./StepInstructions";
import { VERSION_HISTORY_STEP_INSTRUCTIONS } from "../data/instructions";

// Master version history (2026-09-29): milestones (Original/Midpoint/Final)
// are kept forever; 'working' versions are a rolling window of the last 5
// since the most recent milestone, written automatically by App.jsx on every
// save. See country_versions in Supabase and spec_master_sandbox_final.md
// section 4. Restoring a version doesn't rewrite history — it copies that
// version's data back into the live file and adds a fresh 'working' entry so
// the restore itself is part of the record, not a silent edit.

const KIND_LABELS = { original: "Original", midpoint: "Midpoint", final: "Final", working: "Working save" };
const KIND_COLORS = { original: C.teal, midpoint: "#c98a1f", final: C.red || "#b3261e", working: C.blueGrey };
// Display order (2026-10-01): Final, then Midpoint, then Original -- each
// group newest-first -- then all working drafts, newest-first.
const KIND_ORDER = { final: 0, midpoint: 1, original: 2, working: 3 };
const sortVersions = (rows) =>
  [...rows].sort((a, b) => {
    const rankDiff = (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

export default function VersionHistory({ country, canEdit, onSaveMilestone, onRestore, onDelete, currentUserEmail }) {
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  const [yearLabel, setYearLabel] = useState(String(new Date().getFullYear()));
  const [busy, setBusy] = useState(null); // version id or milestone kind currently in flight
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("country_versions")
        .select("id, kind, year_label, data, created_at, created_by, summary")
        .eq("country", country)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVersions(sortVersions(data || []));
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load version history.");
      setStatus("error");
    }
  }, [country]);

  useEffect(() => { load(); }, [load]);

  // Only one Midpoint and one Final are allowed per cycle (everything since
  // the country's most recent Original) -- enforced for real in the database
  // (country_version_milestone_allowed, 2026-10-05), mirrored here so the
  // button is disabled before a rejected save ever happens. A fresh Original
  // starts a new cycle and re-enables both.
  const lastOriginalAt = versions
    .filter((v) => v.kind === "original")
    .reduce((max, v) => (!max || v.created_at > max ? v.created_at : max), null);
  const cycleHasMilestone = (kind) =>
    versions.some((v) => v.kind === kind && (!lastOriginalAt || v.created_at >= lastOriginalAt));

  async function handleMilestone(kind) {
    setBusy(kind);
    try {
      await onSaveMilestone(kind, yearLabel.trim() || null);
      await load();
    } catch (err) {
      if ((kind === "midpoint" || kind === "final") && /row-level security|RLS/i.test(err.message || "")) {
        setErrorMsg(`A ${KIND_LABELS[kind]} has already been saved for this cycle. Save a new Original to start a new cycle before saving another ${KIND_LABELS[kind]}.`);
      } else {
        setErrorMsg(err.message || "Could not save milestone.");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore(version) {
    setBusy(version.id);
    try {
      await onRestore(version);
      setConfirmRestoreId(null);
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not restore this version.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(version) {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    setBusy(version.id);
    try {
      await onDelete(version);
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not delete this draft.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StepInstructions stepInstructions={VERSION_HISTORY_STEP_INSTRUCTIONS} />

      <YearDates country={country} canEdit={canEdit} />

      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Master file</div>
        <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          Every save keeps a working copy (last 5 are kept). Saving a milestone (Original, Midpoint, or Final)
          keeps that snapshot permanently, separate from the rolling working saves.
        </p>

        {canEdit && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <input
              value={yearLabel}
              onChange={(e) => setYearLabel(e.target.value)}
              placeholder="Year (e.g. 2026 or FY 2026/27)"
              style={{ padding: "6px 10px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 36, width: 190 }}
            />
            {["original", "midpoint", "final"].map((kind) => {
              const alreadySaved = (kind === "midpoint" || kind === "final") && cycleHasMilestone(kind);
              const disabled = busy === kind || alreadySaved;
              return (
                <button
                  key={kind}
                  onClick={() => handleMilestone(kind)}
                  disabled={disabled}
                  title={alreadySaved ? `A ${KIND_LABELS[kind]} has already been saved for this cycle. Save a new Original to start a new cycle.` : undefined}
                  style={{
                    padding: "8px 14px", minHeight: 36, borderRadius: 6, border: "none",
                    background: KIND_COLORS[kind], color: "#fff", fontSize: 12.5, fontWeight: 600,
                    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {busy === kind ? "Saving…" : alreadySaved ? `${KIND_LABELS[kind]} already saved` : `Save as ${KIND_LABELS[kind]}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>File version history</div>

        {errorMsg && (
          <div style={{ fontSize: 12.5, color: "#b3261e", background: "#fdecea", border: "1px solid #f3c5c1", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            {errorMsg}
          </div>
        )}

        {status === "loading" && <div style={{ fontSize: 12.5, color: "#777" }}>Loading version history…</div>}

        {status === "ready" && versions.length === 0 && (
          <div style={{ fontSize: 12.5, color: "#777" }}>No saves yet for {country}.</div>
        )}

        {status === "ready" && versions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {versions.map((v) => (
            <div key={v.id} style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#fff", background: KIND_COLORS[v.kind],
                borderRadius: 20, padding: "3px 10px", flexShrink: 0,
              }}>
                {KIND_LABELS[v.kind] || v.kind}
              </span>
              <span style={{ fontSize: 12.5, color: C.navy, flex: 1, minWidth: 160 }}>
                {v.year_label ? `${v.year_label} · ` : ""}
                {new Date(v.created_at).toLocaleString()}
              </span>
              {v.summary && (
                <span style={{ fontSize: 12, color: "#444", fontStyle: "italic" }}>
                  "{v.summary}"
                </span>
              )}
              <span style={{ fontSize: 12, color: "#777" }}>{v.created_by || "unknown"}</span>
              {v.kind === "working" && v.created_by === currentUserEmail && (
                <button
                  onClick={() => handleDelete(v)}
                  disabled={busy === v.id}
                  title="Delete this draft"
                  style={{ background: "transparent", border: "none", color: C.red, cursor: busy === v.id ? "default" : "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1, opacity: busy === v.id ? 0.5 : 1 }}
                >
                  ×
                </button>
              )}
              {canEdit && (
                confirmRestoreId === v.id ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleRestore(v)}
                      disabled={busy === v.id}
                      style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "none", background: "#b3261e", color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      {busy === v.id ? "Restoring…" : "Confirm restore"}
                    </button>
                    <button
                      onClick={() => setConfirmRestoreId(null)}
                      style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: "#555", fontSize: 11.5, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmRestoreId(v.id)}
                    style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.teal, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Restore this version
                  </button>
                )
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
