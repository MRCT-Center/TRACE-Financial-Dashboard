import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";

// Self-designated Original/Midpoint/Final dates (2026-09-29), one set per
// country per year, not tied to the calendar year and not auto-repeating --
// see country_year_dates and spec_master_sandbox_final.md section 3. Reps
// set these; admins can see them (read-only) but don't normally set them.
//
// 2026-10-07 (batch 1): the Year box starts blank and only accepts a
// four-digit year; every saved date now has an "Edit" link next to it so it
// can be changed in place. In Nyika II only admins may write dates (RLS), so
// the parent passes canEdit=false for testers there.

const isFourDigitYear = (v) => /^\d{4}$/.test(v);
const DATE_FIELDS = [
  { key: "original_date", label: "Original" },
  { key: "midpoint_date", label: "Midpoint" },
  { key: "final_date", label: "Final" },
];

export default function YearDates({ country, canEdit, readOnly = false, onRowsChange, isAdmin = false, currentUserEmail = "" }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [original, setOriginal] = useState("");
  const [midpoint, setMidpoint] = useState("");
  const [final, setFinal] = useState("");
  const [saving, setSaving] = useState(false);
  // { id, key } of the single date currently being edited in place, plus its draft value
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("country_year_dates")
        .select("id, year_label, original_date, midpoint_date, final_date, set_by, set_at")
        .eq("country", country)
        .order("year_label", { ascending: false });
      if (error) throw error;
      // Nyika II: year dates are per tester. The database already limits a
      // tester to the shared default plus their own; admins can read every
      // row, so they are narrowed here to the default plus their own.
      const me = (currentUserEmail || "").toLowerCase();
      const shown = (data || []).filter((r) => country !== "Nyika II" || !isAdmin || !r.set_by || r.set_by.toLowerCase() === me);
      setRows(shown);
      onRowsChange?.(shown);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load dates.");
      setStatus("error");
    }
  }, [country, currentUserEmail, isAdmin]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  // A year that already has dates can't be entered again (2026-10-07): use
  // "Edit" next to its dates to change them, or start a new year.
  const yearTaken = isFourDigitYear(yearLabel) && rows.some((r) => r.year_label === yearLabel);
  const numericYears = rows.map((r) => Number(r.year_label)).filter((n) => Number.isInteger(n) && n > 0);
  const suggestedYear = numericYears.length ? Math.max(...numericYears) + 1 : null;

  async function upsertDates(year, dates) {
    const { error } = await supabase.from("country_year_dates").upsert(
      { country, year_label: year, ...dates },
      { onConflict: "country,year_label" },
    );
    if (error) throw error;
    await load();
  }

  async function save() {
    setSaving(true);
    setErrorMsg("");
    try {
      // Plain insert (not upsert) so the database itself refuses a repeat year.
      const { error } = await supabase.from("country_year_dates").insert({
        country, year_label: yearLabel,
        original_date: original || null, midpoint_date: midpoint || null, final_date: final || null,
      });
      if (error) {
        throw new Error(/duplicate|unique/i.test(error.message)
          ? `${yearLabel} already has dates. Use Edit next to them, or enter a new year.`
          : error.message);
      }
      setYearLabel(""); setOriginal(""); setMidpoint(""); setFinal("");
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not save dates.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(r) {
    if (!window.confirm(`Delete the ${r.year_label} year dates? Saved files for ${r.year_label} are not deleted.`)) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const { error, count } = await supabase.from("country_year_dates").delete({ count: "exact" }).eq("id", r.id);
      if (error) throw error;
      if (!count) throw new Error("Could not delete these dates (not permitted).");
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not delete these dates.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(row) {
    setSaving(true);
    setErrorMsg("");
    try {
      await upsertDates(row.year_label, {
        original_date: row.original_date, midpoint_date: row.midpoint_date, final_date: row.final_date,
        [editing.key]: editValue || null,
      });
      setEditing(null);
    } catch (err) {
      setErrorMsg(err.message || "Could not save this date.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { padding: "6px 8px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 34 };
  const linkBtn = { background: "transparent", border: "none", color: C.teal, fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: "0 0 0 6px", textDecoration: "underline" };
  const canWrite = !readOnly && canEdit;
  // Nyika II: the shared default row (no author) is only editable by admins; a tester can only change rows they created.
  const rowEditable = (r) => canWrite && (country !== "Nyika II" || (isAdmin ? !r.set_by || r.set_by.toLowerCase() === (currentUserEmail || "").toLowerCase() : !!r.set_by && r.set_by.toLowerCase() === (currentUserEmail || "").toLowerCase()));

  return (
    <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Year dates</div>
      <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
        {readOnly
          ? `${country}'s self-designated Original, Midpoint, and Final dates for the year, chosen once a year and not tied to the calendar.`
          : canEdit
            ? "Set your Original, Midpoint, and Final dates for the year -- a once-a-year choice that doesn't have to line up with the calendar year."
            : `${country}'s Original, Midpoint, and Final dates for the year. These are set by an administrator.`}
      </p>

      {errorMsg && (
        <div style={{ fontSize: 12.5, color: "#b3261e", background: "#fdecea", border: "1px solid #f3c5c1", borderRadius: 8, padding: 10, marginBottom: 10 }}>
          {errorMsg}
        </div>
      )}

      {status === "loading" && <div style={{ fontSize: 12.5, color: "#777" }}>Loading…</div>}

      {status !== "loading" && canWrite && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#555" }}>
            Year
            <input
              value={yearLabel}
              onChange={(e) => setYearLabel(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="e.g. 2026"
              style={{ ...inputStyle, width: 100 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#555" }}>
            Original date
            <input type="date" value={original} onChange={(e) => setOriginal(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#555" }}>
            Midpoint date
            <input type="date" value={midpoint} onChange={(e) => setMidpoint(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#555" }}>
            Final date
            <input type="date" value={final} onChange={(e) => setFinal(e.target.value)} style={inputStyle} />
          </label>
          <button
            onClick={save}
            disabled={saving || !isFourDigitYear(yearLabel) || yearTaken}
            title={!isFourDigitYear(yearLabel) ? "Enter a four-digit year first" : yearTaken ? "This year already has dates" : undefined}
            style={{ padding: "8px 16px", minHeight: 34, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: saving || !isFourDigitYear(yearLabel) || yearTaken ? "default" : "pointer", opacity: saving || !isFourDigitYear(yearLabel) || yearTaken ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : "Save dates"}
          </button>
        </div>
      )}

      {status !== "loading" && canWrite && yearTaken && (
        <div style={{ fontSize: 12, color: "#b3261e", marginTop: -6, marginBottom: 12 }}>
          {yearLabel} already has dates set. Use <strong>Edit</strong> next to them below to change a date, or enter a new year{suggestedYear ? ` (for example, ${suggestedYear})` : ""}.
        </div>
      )}

      {status === "ready" && rows.length === 0 && (
        <div style={{ fontSize: 12.5, color: "#777" }}>No dates set yet.</div>
      )}

      {status === "ready" && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 18, fontSize: 12, color: "#333", flexWrap: "wrap", alignItems: "center", padding: "6px 0", borderTop: "1px solid #eee" }}>
              <span style={{ fontWeight: 700, width: 50 }}>{r.year_label}</span>
              {DATE_FIELDS.map(({ key, label }) => {
                const isEditing = editing?.id === r.id && editing?.key === key;
                return (
                  <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {label}:{" "}
                    {isEditing ? (
                      <>
                        <input type="date" value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ ...inputStyle, minHeight: 28, padding: "3px 6px" }} />
                        <button onClick={() => saveEdit(r)} disabled={saving} style={{ ...linkBtn, opacity: saving ? 0.5 : 1 }}>{saving ? "Saving…" : "Save"}</button>
                        <button onClick={() => setEditing(null)} style={{ ...linkBtn, color: "#777" }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        {r[key] || "—"}
                        {rowEditable(r) && (
                          <button onClick={() => { setEditing({ id: r.id, key }); setEditValue(r[key] || ""); }} style={linkBtn}>
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </span>
                );
              })}
              {rowEditable(r) && (
                <button onClick={() => deleteRow(r)} disabled={saving} style={{ ...linkBtn, color: "#b3261e", marginLeft: "auto", opacity: saving ? 0.5 : 1 }}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
