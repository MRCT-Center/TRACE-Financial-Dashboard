import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import YearDates from "./YearDates";
import GuidedWizard from "./GuidedWizard";
import StepInstructions from "./StepInstructions";
import { VERSION_HISTORY_STEP_INSTRUCTIONS, VERSION_HISTORY_NOTE } from "../data/instructions";

// Master version history (2026-09-29): milestones (Original/Midpoint/Final)
// are kept forever; 'working' versions are a rolling window of the last 5
// since the most recent milestone, written automatically by App.jsx on every
// save. See country_versions in Supabase and spec_master_sandbox_final.md
// section 4.
//
// "Start editing" (formerly "Restore this version", then "Continue editing")
// loads that version's data into the Inputs wizard and opens Inputs step 1.
// It writes nothing: no working draft is created until the user edits, names
// the draft, describes the changes, and clicks Submit (2026-10-07). It's only ever offered on the single
// chronologically most recent version for the country (any kind) -- older
// versions are view-only (via the read-only "View" modal) and, if they're
// working drafts, deletable -- so edits can never silently branch off an old
// draft. See mostRecentVersionId below.

const KIND_LABELS = { original: "Original", midpoint: "Midpoint", final: "Final", working: "Working save" };
const KIND_COLORS = { original: C.teal, midpoint: "#c98a1f", final: C.red || "#b3261e", working: C.blueGrey };
// Display order (2026-10-08): plain chronological, newest first, whatever the kind.
const sortVersions = (rows) =>
  [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

export default function VersionHistory({ country, canEdit, isAdmin, onSaveMilestone, onRestore, onDelete, currentUserEmail }) {
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  // Year dates saved for this country (reported up from <YearDates>), used to
  // pick the Master file year -- the year is never typed here (2026-10-07).
  const [dateRows, setDateRows] = useState([]);
  const [busy, setBusy] = useState(null); // version id or milestone kind currently in flight
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null); // read-only "View" modal

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
  // In Nyika II everyone shares one Original, so the one-Midpoint/one-Final
  // limit is per tester there (mirrors country_version_milestone_allowed).
  const cycleHasMilestone = (kind) =>
    versions.some((v) =>
      v.kind === kind &&
      (!lastOriginalAt || v.created_at >= lastOriginalAt) &&
      (country !== "Nyika II" || v.created_by === currentUserEmail));

  // Editing can only ever continue from whichever version is chronologically
  // newest overall (any kind -- a milestone counts too if nothing has been
  // drafted since it) -- 2026-10-05, Hayat. Every older version is view-only
  // (plus deletable, if it's a working draft): this is what stops someone
  // from quietly picking up an old draft and editing from there, which is
  // what made the history confusing before. `versions` is sorted for display
  // (Final/Midpoint/Original groups, then working newest-first), so the
  // chronologically newest overall has to be found separately by comparing
  // created_at across all of them.
  // "Working save-Original" / "-Midpoint" / "-Final": named after the most
  // recent milestone saved before the draft was made.
  const labelFor = (v) => {
    if (v.kind !== "working") return KIND_LABELS[v.kind] || v.kind;
    const base = versions
      .filter((m) => m.kind !== "working" && m.created_at <= v.created_at)
      .reduce((best, m) => (!best || m.created_at > best.created_at ? m : best), null);
    return base ? `Working save-${KIND_LABELS[base.kind]}` : "Working save";
  };
  const mostRecentVersionId = versions.reduce(
    (best, v) => (!best || v.created_at > best.created_at ? v : best),
    null
  )?.id ?? null;

  // Master file year (2026-10-07, batch 2): not typed by the user.
  //  - Original: the highest four-digit year that has year dates set, if it
  //    has no Original saved yet. Blank when there's nothing pending (no dates
  //    yet, or that year's Original is already saved), so the box clears once
  //    an Original is saved.
  //  - Midpoint / Final: the year of this cycle's most recent Original; if none
  //    is visible to this user (e.g. a Nyika II tester, who can't save
  //    Originals), the highest year that has dates.
  const datedYears = dateRows.map((r) => r.year_label).filter((y) => /^\d{4}$/.test(y)).sort().reverse();
  const originalYears = new Set(versions.filter((v) => v.kind === "original").map((v) => v.year_label));
  // Only the newest dated year can start an Original, so an older year left
  // without one can't be picked up by accident.
  const pendingYear = datedYears[0] && !originalYears.has(datedYears[0]) ? datedYears[0] : "";
  const latestOriginal = versions
    .filter((v) => v.kind === "original")
    .reduce((best, v) => (!best || v.created_at > best.created_at ? v : best), null);
  const cycleYear = latestOriginal?.year_label || datedYears[0] || "";
  const yearFor = (kind) => (kind === "original" ? pendingYear : cycleYear);
  const canSaveOriginalHere = !(country === "Nyika II" && !isAdmin);
  const displayYear = canSaveOriginalHere ? pendingYear : cycleYear;

  async function handleMilestone(kind) {
    const year = yearFor(kind);
    if (!year) { setErrorMsg("Set the year dates above first -- the Master file uses that year."); return; }
    setErrorMsg("");
    setBusy(kind);
    try {
      await onSaveMilestone(kind, year);
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
    const what = version.kind === "working" ? "draft" : `${KIND_LABELS[version.kind]} file`;
    if (!window.confirm(`Delete this ${what}? This cannot be undone.`)) return;
    setBusy(version.id);
    try {
      await onDelete(version);
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not delete this file.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <StepInstructions
        stepInstructions={{
          ...VERSION_HISTORY_STEP_INSTRUCTIONS,
          // The "only for the demo version Nyika II" note is meaningless (and
          // confusing) on a real country's page, so only show it there.
          note: country === "Nyika II" ? VERSION_HISTORY_NOTE : undefined,
        }}
      />

      <YearDates country={country} canEdit={canEdit && (country !== "Nyika II" || isAdmin)} onRowsChange={setDateRows} />

      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Master file</div>
        <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          Every save keeps a working copy (last 5 are kept). Saving a milestone (Original, Midpoint, or Final)
          keeps that snapshot permanently, separate from the rolling working saves.
        </p>

        {canEdit && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: "#555" }}>
              Year (from Year dates)
              <input
                value={displayYear}
                readOnly
                disabled
                placeholder={datedYears.length === 0 ? "Set year dates first" : ""}
                style={{ padding: "6px 10px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 36, width: 150, background: "#f4f6f8", color: C.navy }}
              />
            </label>
            {["original", "midpoint", "final"].map((kind) => {
              const alreadySaved = (kind === "midpoint" || kind === "final") && cycleHasMilestone(kind);
              // Nyika II's Original is the shared demo starting point: admins only.
              const adminOnlyOriginal = kind === "original" && country === "Nyika II" && !isAdmin;
              const originalDone = kind === "original" && datedYears.length > 0 && !pendingYear && !adminOnlyOriginal;
              const noYear = !yearFor(kind) && !originalDone;
              const disabled = busy === kind || alreadySaved || originalDone || adminOnlyOriginal || noYear;
              return (
                <button
                  key={kind}
                  onClick={() => handleMilestone(kind)}
                  disabled={disabled}
                  title={
                    adminOnlyOriginal ? "Only administrators can save the Nyika II Original."
                    : originalDone ? "The Original for this year is already saved. Add year dates for a new year to start the next one."
                    : alreadySaved ? `A ${KIND_LABELS[kind]} has already been saved for this cycle. Save a new Original to start a new cycle.`
                    : noYear ? (kind === "original"
                        ? (datedYears.length === 0 ? "Set the year dates above first." : "The Original for every year with dates is already saved. Add year dates for a new year to start the next one.")
                        : "Set the year dates above first.")
                    : undefined
                  }
                  style={{
                    padding: "8px 14px", minHeight: 36, borderRadius: 6, border: "none",
                    background: KIND_COLORS[kind], color: "#fff", fontSize: 12.5, fontWeight: 600,
                    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {busy === kind ? "Saving…" : alreadySaved || originalDone ? `${KIND_LABELS[kind]} already saved` : adminOnlyOriginal ? "Original set by admin" : `Save as ${KIND_LABELS[kind]}`}
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
                {labelFor(v)}
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
              <button
                onClick={() => setViewingVersion(v)}
                style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.navy, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
              >
                View
              </button>
              {/* Delete: any rep with access to this country can delete any working
                  draft (not just their own) -- except Nyika II, which stays scoped
                  to your own, matching its per-author privacy. Admins can always
                  delete drafts, and in Nyika II only they can also delete Original/Midpoint/Final
                  files. Everywhere else milestones are never deletable by anyone. */}
              {((v.kind === "working" && (isAdmin || country !== "Nyika II" || v.created_by === currentUserEmail)) ||
                (isAdmin && country === "Nyika II")) && (
                <button
                  onClick={() => handleDelete(v)}
                  disabled={busy === v.id}
                  title={v.kind === "working" ? "Delete this draft" : `Delete this ${KIND_LABELS[v.kind]} file (admin, Nyika II only)`}
                  style={{ background: "transparent", border: "none", color: C.red, cursor: busy === v.id ? "default" : "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1, opacity: busy === v.id ? 0.5 : 1 }}
                >
                  ×
                </button>
              )}
              {/* Start editing: only ever shown on the single chronologically
                  most recent version (any kind) -- see mostRecentVersionId above. */}
              {canEdit && v.id === mostRecentVersionId && (
                confirmRestoreId === v.id ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleRestore(v)}
                      disabled={busy === v.id}
                      style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "none", background: "#b3261e", color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      {busy === v.id ? "Opening…" : "Confirm, start editing"}
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
                    Start editing
                  </button>
                )
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      {viewingVersion && (
        <VersionViewModal version={viewingVersion} country={country} onClose={() => setViewingVersion(null)} />
      )}
    </div>
  );
}

// Read-only "View" (2026-10-08): opens the real wizard on the saved version's
// data with every control locked, so reviewers see every input exactly as
// saved (and any edits since the previous version in purple). It never
// touches the live file.
function VersionViewModal({ version, country, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, overflowY: "auto", padding: "20px 12px" }}>
      <div style={{ background: C.lightBG, borderRadius: 12, maxWidth: 1040, margin: "0 auto", padding: "14px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#fff", background: KIND_COLORS[version.kind],
            borderRadius: 20, padding: "3px 10px",
          }}>
            {KIND_LABELS[version.kind] || version.kind}{version.summary ? ` · "${version.summary}"` : ""}
          </span>
          <button onClick={onClose} style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, padding: "6px 14px", cursor: "pointer" }}>
            Close
          </button>
        </div>
        <GuidedWizard key={version.id} country={country} data={version.data || {}} onSave={() => {}} viewVersion={version} />
      </div>
    </div>
  );
}
