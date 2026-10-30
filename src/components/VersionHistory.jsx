import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import YearDates from "./YearDates";
import GuidedWizard from "./GuidedWizard";
import StepInstructions from "./StepInstructions";
import { fetchChangeLog, exportLogToWord, kindLabel, fmtVal } from "../utils/changeLog";
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

const KIND_LABELS = { original: "Original", midpoint: "Midpoint", final: "Final", working: "New draft" };
const yearOf = (label) => (String(label || "").match(/\b(\d{4})\b/) || [])[1] || "";
const KIND_COLORS = { original: C.teal, midpoint: "#c98a1f", final: C.red || "#b3261e", working: C.blueGrey };
// Display order (2026-10-08): plain chronological, newest first, whatever the kind.
const sortVersions = (rows) =>
  [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

// 2026-12-18 -> December 18, 2026 (parsed by hand so the time zone can't shift the day)
const prettyDate = (iso) => {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export default function VersionHistory({ country, canEdit, isAdmin, onSaveMilestone, onRestore, onStartNewYear, onDelete, currentUserEmail, pickMode = false, onPick, onCancelPick }) {
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  // Year dates saved for this country (reported up from <YearDates>), used to
  // pick the Master file year -- the year is never typed here (2026-10-07).
  const [dateRows, setDateRows] = useState([]);
  const [busy, setBusy] = useState(null); // version id or milestone kind currently in flight
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);
  const [viewingVersion, setViewingVersion] = useState(null); // read-only "View" modal
  const [selectedYear, setSelectedYear] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logEntries, setLogEntries] = useState(null);
  const [seedChoice, setSeedChoice] = useState(null); // file id, "blank", or null = default
  // Prompt shown when Midpoint/Final is clicked before its scheduled date.
  const [earlyPrompt, setEarlyPrompt] = useState(null); // { kind, rowId, date }
  const [newDate, setNewDate] = useState("");
  const [datesKey, setDatesKey] = useState(0);
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

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
    return base ? `New draft-${KIND_LABELS[base.kind]}` : "New draft";
  };
  // Reference year of a file: milestones use their own year; a draft takes the
  // year of the milestone it was based on (the latest one saved before it).
  const refYearOf = (v) => {
    if (v.kind !== "working") return yearOf(v.year_label);
    const own = String(v.data?.budgetYear || "").match(/^\s*(\d{4})\s*$/);
    if (own) return own[1];
    const base = versions
      .filter((m) => m.kind !== "working" && m.created_at <= v.created_at)
      .reduce((best, m) => (!best || m.created_at > best.created_at ? m : best), null);
    return yearOf(base?.year_label) || yearOf(v.year_label) || "";
  };
  const fileYears = [...new Set(versions.map(refYearOf))].sort().reverse();
  const tabYear = fileYears.includes(selectedYear) ? selectedYear : (fileYears[0] ?? "");
  const shownVersions = versions.filter((v) => refYearOf(v) === tabYear);
  useEffect(() => {
    if (!logOpen || !tabYear) return;
    let cancelled = false;
    setLogEntries(null);
    fetchChangeLog(country, tabYear).then((e) => { if (!cancelled) setLogEntries(e); });
    return () => { cancelled = true; };
  }, [logOpen, country, tabYear, versions.length]);
  // Nyika II: everyone works on their own copy, so "most recent" only counts
  // the default Original and the viewer's own files (admins can read every
  // tester's files, which must not take over their Start editing button).
  const editableCandidates = country === "Nyika II" && !isAdmin
    ? versions.filter((v) => v.kind === "original" || (v.created_by || "").toLowerCase() === (currentUserEmail || "").toLowerCase())
    : versions;
  // One Start editing button per year tab: the newest file in each year.
  const newestByYear = {};
  editableCandidates.forEach((v) => {
    const y = refYearOf(v);
    if (!newestByYear[y] || v.created_at > newestByYear[y].created_at) newestByYear[y] = v;
  });
  const editableIds = new Set(Object.values(newestByYear).map((v) => v.id));


  // Master file year (2026-10-07, batch 2): not typed by the user.
  //  - Original: the highest four-digit year that has year dates set, if it
  //    has no Original saved yet. Blank when there's nothing pending (no dates
  //    yet, or that year's Original is already saved), so the box clears once
  //    an Original is saved.
  //  - Midpoint / Final: the year of this cycle's most recent Original; if none
  //    is visible to this user (e.g. a Nyika II tester, who can't save
  //    Originals), the highest year that has dates.
  const datedYears = dateRows.map((r) => r.year_label).filter((y) => /^\d{4}$/.test(y)).sort().reverse();
  const originalYears = new Set(versions.filter((v) => v.kind === "original").map((v) => yearOf(v.year_label)));
  // Only the newest dated year can start an Original, so an older year left
  // without one can't be picked up by accident.
  const pendingYear = datedYears[0] && !originalYears.has(datedYears[0]) ? datedYears[0] : "";
  const latestOriginal = versions
    .filter((v) => v.kind === "original")
    .reduce((best, v) => (!best || v.created_at > best.created_at ? v : best), null);
  const cycleYear = yearOf(latestOriginal?.year_label) || datedYears[0] || "";
  // Starting points for a new year's Original: any earlier-year file, or blank.
  const seedFiles = pendingYear ? editableCandidates
    .filter((v) => refYearOf(v) && refYearOf(v) < pendingYear)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
  const seedValue = seedChoice || (seedFiles[0] ? seedFiles[0].id : "blank");
  const seedLabel = (v) => `${refYearOf(v)} ${labelFor(v)}${v.kind === "working" && v.year_label ? ` "${v.year_label}"` : ""} (${new Date(v.created_at).toLocaleString()})`;
  const yearFor = (kind) => (kind === "original" ? pendingYear : cycleYear);
  const canSaveOriginalHere = true;
  const displayYear = canSaveOriginalHere ? pendingYear : cycleYear;

  function clickMilestone(kind) {
    if (kind === "midpoint" || kind === "final") {
      const row = dateRows.find((r) => r.year_label === cycleYear);
      const date = row?.[`${kind}_date`];
      if (date && date > todayStr) {
        setErrorMsg("");
        setNewDate(todayStr);
        setEarlyPrompt({ kind, rowId: row.id, date });
        return;
      }
    }
    handleMilestone(kind);
  }

  async function changeDateAndSave() {
    const { kind, rowId } = earlyPrompt;
    setBusy(kind);
    try {
      const { error } = await supabase.from("country_year_dates").update({ [`${kind}_date`]: newDate }).eq("id", rowId);
      if (error) throw error;
      setEarlyPrompt(null);
      setDatesKey((k) => k + 1);
      await handleMilestone(kind);
    } catch (err) {
      setErrorMsg(err.message || "Could not change the date.");
      setBusy(null);
    }
  }

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
      {pickMode && (
        <div style={{ background: "#eaf6f0", border: `1px solid ${C.green}`, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#1c4a33", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <span><strong>Choose a file for the Sandbox.</strong> Find the file you want in the list below (its title and notes describe what changed) and click "Use in Sandbox". Nothing you do in the Sandbox changes the file.</span>
          <button onClick={onCancelPick} style={{ marginLeft: "auto", padding: "6px 12px", minHeight: 32, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.navy, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
        </div>
      )}
      <StepInstructions
        stepInstructions={{
          ...VERSION_HISTORY_STEP_INSTRUCTIONS,
          // The "only for the demo version Nyika II" note is meaningless (and
          // confusing) on a real country's page, so only show it there.
          note: country === "Nyika II" ? VERSION_HISTORY_NOTE : undefined,
        }}
      />

      <YearDates key={datesKey} country={country} canEdit={canEdit} isAdmin={isAdmin} currentUserEmail={currentUserEmail} onRowsChange={setDateRows} yearsWithFiles={fileYears} />

      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Master file</div>
        <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          Every save keeps a working copy (last 5 are kept). Saving a milestone (Original, Midpoint, or Final)
          keeps that snapshot permanently, separate from the rolling new drafts.
        </p>

        {canEdit && (<>
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
              const savedForYear = versions.some((v) => v.kind === kind && yearOf(v.year_label) === cycleYear && (country !== "Nyika II" || v.created_by === currentUserEmail));
              const alreadySaved = (kind === "midpoint" || kind === "final") && (cycleHasMilestone(kind) || (cycleYear && savedForYear));
              // Nyika II's Original is the shared demo starting point: admins only.
              const adminOnlyOriginal = false;
              const originalDone = kind === "original" && datedYears.length > 0 && !pendingYear && !adminOnlyOriginal;
              const dateRowForYear = dateRows.find((r) => r.year_label === cycleYear);
              const noDate = (kind === "midpoint" || kind === "final") && !!cycleYear && !dateRowForYear?.[`${kind}_date`];
              const noYear = (!yearFor(kind) && !originalDone) || noDate;
              const disabled = busy === kind || alreadySaved || originalDone || adminOnlyOriginal || noYear;
              return (
                <button
                  key={kind}
                  onClick={() => clickMilestone(kind)}
                  disabled={disabled}
                  title={
                    adminOnlyOriginal ? "Only administrators can save the Nyika II Original."
                    : noDate ? `Set the ${KIND_LABELS[kind]} date for ${cycleYear} under Year dates first.`
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
          {pendingYear && canEdit && onStartNewYear && (
            <div style={{ marginTop: 14, background: "#f3f8fb", border: `1px solid ${C.teal}`, borderRadius: 8, padding: "12px 14px", fontSize: 12.5, color: C.navy, lineHeight: 1.6 }}>
              <strong>Start the {pendingYear} Original.</strong> Choose what to start from, then fill in your {pendingYear} data in Inputs. Submitting saves it as the {pendingYear} Original.
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 8 }}>
                <select
                  value={seedValue}
                  onChange={(e) => setSeedChoice(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 36, maxWidth: "100%" }}
                >
                  <option value="blank">Blank template (enter {pendingYear} data from scratch)</option>
                  {seedFiles.map((v) => <option key={v.id} value={v.id}>{seedLabel(v)}</option>)}
                </select>
                <button
                  onClick={() => {
                    const f = seedFiles.find((v) => v.id === seedValue);
                    onStartNewYear(f ? f.data : {}, pendingYear);
                  }}
                  style={{ padding: "8px 14px", minHeight: 36, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Start {pendingYear} Original
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: C.blueGrey }}>Importing from Excel will be added here once it is ready.</div>
            </div>
          )}
        </>)}
      </div>

      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>File version history</div>

        {earlyPrompt && (
          <div style={{ background: "#fff8e8", border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "12px 14px", marginBottom: 12, fontSize: 12.5, color: "#5a4000", lineHeight: 1.6 }}>
            <strong>This {KIND_LABELS[earlyPrompt.kind]} isn't due yet.</strong> The {KIND_LABELS[earlyPrompt.kind]} date set for {cycleYear} is <strong>{prettyDate(earlyPrompt.date)}</strong>. You can wait until then or edit the {KIND_LABELS[earlyPrompt.kind].toLowerCase()} date above.
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 8 }}>
              <button onClick={() => setEarlyPrompt(null)} style={{ padding: "6px 12px", minHeight: 32, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.navy, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                I'll wait
              </button>
              {canEdit && (
                <button
                  onClick={() => { setEarlyPrompt(null); document.getElementById("year-dates-box")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  style={{ padding: "6px 12px", minHeight: 32, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                >
                  I'll edit the dates
                </button>
              )}
            </div>
          </div>
        )}
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
        <>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, borderBottom: `2px solid ${C.teal}`, flexWrap: "wrap" }}>
          {fileYears.map((y) => {
            const active = y === tabYear;
            return (
              <button
                key={y || "none"}
                onClick={() => setSelectedYear(y)}
                style={{
                  padding: "7px 16px", minHeight: 34, border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer",
                  background: active ? C.teal : "#eef2f5", color: active ? "#fff" : C.navy, fontSize: 13, fontWeight: 700,
                }}
              >
                {y || "Other"}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shownVersions.map((v) => (
            <div key={v.id} style={{ background: "#fff", border: "1px solid #dde", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, width: 44, flexShrink: 0 }}>{refYearOf(v)}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#fff", background: KIND_COLORS[v.kind],
                borderRadius: 20, padding: "3px 10px", flexShrink: 0,
              }}>
                {labelFor(v)}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: C.navy, minWidth: 90, flex: "1 1 120px" }}>
                {v.kind === "working" ? (v.year_label || "") : ""}
              </span>
              <span style={{ fontSize: 12, color: "#555", flexShrink: 0 }}>
                {new Date(v.created_at).toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: "#444", fontStyle: v.summary ? "italic" : "normal", flex: "2 1 160px", minWidth: 100 }}>
                {v.summary ? `"${v.summary}"` : ""}
              </span>
              <span style={{ fontSize: 12, color: "#777" }}>{v.created_by || "unknown"}</span>
              <button
                onClick={() => setViewingVersion(v)}
                style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.navy, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
              >
                View
              </button>
              {pickMode && (
                <button
                  onClick={() => onPick(v, `${refYearOf(v) ? refYearOf(v) + " " : ""}${labelFor(v)}${v.kind === "working" && v.year_label ? ` "${v.year_label}"` : ""} (${new Date(v.created_at).toLocaleString()})`)}
                  style={{ padding: "5px 12px", minHeight: 30, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Use in Sandbox
                </button>
              )}
              {/* Delete: any rep with access to this country can delete any working
                  draft (not just their own) -- except Nyika II, which stays scoped
                  to your own, matching its per-author privacy. Admins can always
                  delete drafts, and in Nyika II only they can also delete Original/Midpoint/Final
                  files. Everywhere else milestones are never deletable by anyone. */}
              {!pickMode && ((v.kind === "working" && (isAdmin || country !== "Nyika II" || v.created_by === currentUserEmail)) ||
                isAdmin) && (
                <button
                  onClick={() => handleDelete(v)}
                  disabled={busy === v.id}
                  title={v.kind === "working" ? "Delete this draft" : `Delete this ${KIND_LABELS[v.kind]} file (administrators only)`}
                  style={{ background: "transparent", border: "none", color: C.red, cursor: busy === v.id ? "default" : "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1, opacity: busy === v.id ? 0.5 : 1 }}
                >
                  ×
                </button>
              )}
              {/* Start editing: shown on the newest file in each year tab
                  -- see editableIds above. */}
              {!pickMode && canEdit && editableIds.has(v.id) && (
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
        {tabYear && (
          <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setLogOpen((o) => !o)}
                style={{ padding: "6px 12px", minHeight: 32, borderRadius: 6, border: `1px solid ${logOpen ? C.teal : "#ccd"}`, background: logOpen ? "#e8f4f4" : "#fff", color: logOpen ? C.teal : C.navy, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                {logOpen ? `Hide change log for ${tabYear}` : `Show change log for ${tabYear}`}
              </button>
              {logOpen && logEntries && logEntries.length > 0 && (
                <button
                  onClick={() => exportLogToWord(country, tabYear, logEntries)}
                  style={{ padding: "6px 12px", minHeight: 32, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Export to Word
                </button>
              )}
            </div>
            {logOpen && (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
                {logEntries === null ? (
                  <div style={{ fontSize: 12.5, color: "#999" }}>Loading…</div>
                ) : logEntries.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "#999", fontStyle: "italic" }}>No changes have been logged for {tabYear} yet.</div>
                ) : logEntries.map((e) => (
                  <div key={e.id} style={{ fontSize: 12.5, lineHeight: 1.55, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                    <div style={{ fontWeight: 700, color: C.navy }}>{new Date(e.created_at).toLocaleString()} · {e.created_by}</div>
                    <div style={{ color: "#666" }}>{kindLabel(e.kind)}{e.title && e.title !== kindLabel(e.kind) ? ` "${e.title}"` : ""}</div>
                    {e.summary && <div style={{ fontStyle: "italic", color: "#666", margin: "2px 0 4px" }}>"{e.summary}"</div>}
                    {(e.changes || []).length === 0 ? (
                      <div style={{ color: "#999" }}>No input changes recorded for this save.</div>
                    ) : (e.changes || []).map((c, i) => (
                      <div key={i} style={{ marginTop: 3 }}>
                        <span style={{ fontWeight: 600, color: C.navy }}>{c.label}: </span>
                        <span style={{ textDecoration: "line-through", color: "#999" }}>{fmtVal(c.oldValue)}</span>
                        {" → "}
                        <span style={{ color: "#6b46c1", fontWeight: 600 }}>{fmtVal(c.newValue)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
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
