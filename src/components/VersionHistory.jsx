import { useState, useEffect, useCallback } from "react";
import { COLORS as C, gm, fmt } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import YearDates from "./YearDates";
import StepInstructions from "./StepInstructions";
import { VERSION_HISTORY_STEP_INSTRUCTIONS, VERSION_HISTORY_NOTE } from "../data/instructions";

// Best-effort totals for the read-only "View" modal (2026-10-05) -- gm()
// expects er/ei/revFees/revOther/ri/ikReg/ikIrr to be present (they are, on
// every version saved by the wizard's Submit step), but older or partial
// snapshots might be missing a field, so this fills in safe empty defaults
// rather than letting Object.values(undefined) throw.
function safeGm(d) {
  if (!d) return null;
  try {
    return gm({
      er: d.er || {}, ei: d.ei || {},
      revFees: d.revFees || 0, revOther: d.revOther || 0,
      ri: d.ri || {}, ikReg: d.ikReg || {}, ikIrr: d.ikIrr || {},
    });
  } catch {
    return null;
  }
}

// Master version history (2026-09-29): milestones (Original/Midpoint/Final)
// are kept forever; 'working' versions are a rolling window of the last 5
// since the most recent milestone, written automatically by App.jsx on every
// save. See country_versions in Supabase and spec_master_sandbox_final.md
// section 4.
//
// "Continue editing" (formerly "Restore this version", renamed 2026-10-05)
// doesn't rewrite history — it copies that version's data back into the live
// file and adds a fresh 'working' entry so the action itself is part of the
// record, not a silent edit. It's now only ever offered on the single
// chronologically most recent version for the country (any kind) -- older
// versions are view-only (via the read-only "View" modal) and, if they're
// working drafts, deletable -- so edits can never silently branch off an old
// draft. See mostRecentVersionId below.

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

export default function VersionHistory({ country, canEdit, isAdmin, onSaveMilestone, onRestore, onDelete, currentUserEmail }) {
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");
  // Starts blank and only accepts a four-digit year (2026-10-07, batch 1).
  const [yearLabel, setYearLabel] = useState("");
  const yearValid = /^\d{4}$/.test(yearLabel);
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
  const mostRecentVersionId = versions.reduce(
    (best, v) => (!best || v.created_at > best.created_at ? v : best),
    null
  )?.id ?? null;

  async function handleMilestone(kind) {
    if (!yearValid) { setErrorMsg("Enter a four-digit year (for example, 2026) before saving."); return; }
    setErrorMsg("");
    setBusy(kind);
    try {
      await onSaveMilestone(kind, yearLabel);
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

      <YearDates country={country} canEdit={canEdit && (country !== "Nyika II" || isAdmin)} />

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
              onChange={(e) => setYearLabel(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="Year (e.g. 2026)"
              style={{ padding: "6px 10px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 36, width: 150 }}
            />
            {["original", "midpoint", "final"].map((kind) => {
              const alreadySaved = (kind === "midpoint" || kind === "final") && cycleHasMilestone(kind);
              // Nyika II's Original is the shared demo starting point: admins only.
              const adminOnlyOriginal = kind === "original" && country === "Nyika II" && !isAdmin;
              const disabled = busy === kind || alreadySaved || adminOnlyOriginal || !yearValid;
              return (
                <button
                  key={kind}
                  onClick={() => handleMilestone(kind)}
                  disabled={disabled}
                  title={
                    adminOnlyOriginal ? "Only administrators can save the Nyika II Original."
                    : alreadySaved ? `A ${KIND_LABELS[kind]} has already been saved for this cycle. Save a new Original to start a new cycle.`
                    : !yearValid ? "Enter a four-digit year first."
                    : undefined
                  }
                  style={{
                    padding: "8px 14px", minHeight: 36, borderRadius: 6, border: "none",
                    background: KIND_COLORS[kind], color: "#fff", fontSize: 12.5, fontWeight: 600,
                    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {busy === kind ? "Saving…" : alreadySaved ? `${KIND_LABELS[kind]} already saved` : adminOnlyOriginal ? "Original set by admin" : `Save as ${KIND_LABELS[kind]}`}
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
              {/* Continue editing: only ever shown on the single chronologically
                  most recent version (any kind) -- see mostRecentVersionId above. */}
              {canEdit && v.id === mostRecentVersionId && (
                confirmRestoreId === v.id ? (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleRestore(v)}
                      disabled={busy === v.id}
                      style={{ padding: "5px 10px", minHeight: 30, borderRadius: 6, border: "none", background: "#b3261e", color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      {busy === v.id ? "Starting…" : "Confirm, start editing"}
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
                    Continue editing
                  </button>
                )
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      {viewingVersion && (
        <VersionViewModal version={viewingVersion} onClose={() => setViewingVersion(null)} />
      )}
    </div>
  );
}

// Read-only "View" modal (2026-10-05): shows what's actually in a saved
// version without touching the live file -- separate from "Continue
// editing," which replaces the live file and is only ever available on the
// single most recent version. Reuses gm() (the same totals math Results'
// Overview tab uses) so the numbers here match what you'd see if you
// restored this version and looked at Results.
function VersionViewModal({ version, onClose }) {
  const totals = safeGm(version.data);
  const activities = version.data?.activities || [];
  const filledActivities = activities.filter((r) => r?.nearTerm && r?.longTerm);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 10, padding: "20px 24px", maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#fff", background: KIND_COLORS[version.kind],
            borderRadius: 20, padding: "3px 10px",
          }}>
            {KIND_LABELS[version.kind] || version.kind}
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 18, color: "#777", cursor: "pointer", padding: "2px 6px" }}>×</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginTop: 10 }}>
          {version.year_label || "(no title)"}
        </div>
        <div style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>
          {new Date(version.created_at).toLocaleString()} · {version.created_by || "unknown"}
        </div>
        {version.summary && (
          <div style={{ fontSize: 12, color: "#444", fontStyle: "italic", marginBottom: 10 }}>"{version.summary}"</div>
        )}

        <div style={{ background: C.lightBG, borderRadius: 8, padding: "14px 16px", marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Summary</div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.9 }}>
            <div>Currency: <strong>{version.data?.currencyCode || "—"}</strong></div>
            <div>Budget year: <strong>{version.data?.budgetYear || "—"}</strong></div>
            {totals ? (
              <>
                <div style={{ borderTop: "1px solid #dde", margin: "8px 0 4px" }} />
                <div>Total regular expenses: <strong>{fmt(totals.te)}</strong></div>
                <div>Total irregular expenses: <strong>{fmt(totals.ti)}</strong></div>
                <div>Total regular revenue: <strong>{fmt(totals.tr)}</strong></div>
                <div>Total irregular revenue: <strong>{fmt(totals.tri)}</strong></div>
                <div>Total in-kind contributions: <strong>{fmt(totals.ik)}</strong></div>
                <div style={{ borderTop: "1px solid #dde", margin: "8px 0 4px" }} />
                <div>Regular gap: <strong>{fmt(totals.rg)}</strong></div>
                <div>Irregular gap: <strong>{fmt(totals.ig)}</strong></div>
                <div>Combined gap: <strong>{fmt(totals.cg)}</strong></div>
              </>
            ) : (
              <div style={{ color: "#999", fontStyle: "italic", marginTop: 4 }}>Not enough data saved on this version to compute totals.</div>
            )}
            <div style={{ borderTop: "1px solid #dde", margin: "8px 0 4px" }} />
            <div>Activities filled in: <strong>{filledActivities.length} / {activities.length}</strong></div>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "#999", marginTop: 12 }}>
          Viewing this file does not change the live data -- use "Continue editing" on the most recent file to make changes.
        </div>
      </div>
    </div>
  );
}
