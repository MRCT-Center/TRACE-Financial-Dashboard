import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";

// Self-designated Original/Midpoint/Final dates (2026-09-29), one set per
// country per year, not tied to the calendar year and not auto-repeating --
// see country_year_dates and spec_master_sandbox_final.md section 3. Reps
// set these; admins can see them (read-only) but don't normally set them.

export default function YearDates({ country, canEdit, readOnly = false }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [yearLabel, setYearLabel] = useState(String(new Date().getFullYear()));
  const [original, setOriginal] = useState("");
  const [midpoint, setMidpoint] = useState("");
  const [final, setFinal] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("country_year_dates")
        .select("id, year_label, original_date, midpoint_date, final_date, set_by, set_at")
        .eq("country", country)
        .order("year_label", { ascending: false });
      if (error) throw error;
      setRows(data || []);
      const current = (data || []).find((r) => r.year_label === yearLabel);
      setOriginal(current?.original_date || "");
      setMidpoint(current?.midpoint_date || "");
      setFinal(current?.final_date || "");
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load dates.");
      setStatus("error");
    }
  }, [country, yearLabel]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.from("country_year_dates").upsert(
        {
          country, year_label: yearLabel.trim(),
          original_date: original || null, midpoint_date: midpoint || null, final_date: final || null,
        },
        { onConflict: "country,year_label" },
      );
      if (error) throw error;
      await load();
    } catch (err) {
      setErrorMsg(err.message || "Could not save dates.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { padding: "6px 8px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 34 };

  return (
    <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Year dates</div>
      <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
        {readOnly
          ? `${country}'s self-designated Original, Midpoint, and Final dates for the year, chosen once a year and not tied to the calendar.`
          : "Set your Original, Midpoint, and Final dates for the year -- a once-a-year choice that doesn't have to line up with the calendar year."}
      </p>

      {errorMsg && (
        <div style={{ fontSize: 12.5, color: "#b3261e", background: "#fdecea", border: "1px solid #f3c5c1", borderRadius: 8, padding: 10, marginBottom: 10 }}>
          {errorMsg}
        </div>
      )}

      {status === "loading" && <div style={{ fontSize: 12.5, color: "#777" }}>Loading…</div>}

      {status === "ready" && !readOnly && canEdit && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#555" }}>
            Year
            <input value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} style={{ ...inputStyle, width: 140 }} />
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
            disabled={saving || !yearLabel.trim()}
            style={{ padding: "8px 16px", minHeight: 34, borderRadius: 6, border: "none", background: C.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save dates"}
          </button>
        </div>
      )}

      {status === "ready" && rows.length === 0 && (
        <div style={{ fontSize: 12.5, color: "#777" }}>No dates set yet.</div>
      )}

      {status === "ready" && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 14, fontSize: 12, color: "#333", flexWrap: "wrap", padding: "6px 0", borderTop: "1px solid #eee" }}>
              <span style={{ fontWeight: 700, width: 70 }}>{r.year_label}</span>
              <span>Original: {r.original_date || "—"}</span>
              <span>Midpoint: {r.midpoint_date || "—"}</span>
              <span>Final: {r.final_date || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
