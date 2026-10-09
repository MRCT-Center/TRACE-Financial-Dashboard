import { useState, useEffect, useCallback } from "react";
import { COLORS as C } from "../utils/metrics";
import { supabase } from "../supabaseClient";
import Results from "./Results";

// Sandbox (simplified 2026-10-09): pick any saved file (or the current live
// file) and play with its numbers on the Results screen in real time. Nothing
// is named, saved, or written anywhere: edits live only in this browser tab
// and disappear when you pick another file, click Reset, or leave. The real
// files are never touched.

const KIND_LABELS = { original: "Original", midpoint: "Midpoint", final: "Final", working: "New draft" };
const yearOf = (label) => (String(label || "").match(/\b(\d{4})\b/) || [])[1] || "";

export default function Sandbox({ country, flag, masterData }) {
  const [versions, setVersions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [choice, setChoice] = useState("current"); // "current" or a version id
  const [working, setWorking] = useState(null);     // in-memory copy being played with
  const [resetKey, setResetKey] = useState(0);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase
        .from("country_versions")
        .select("id, kind, year_label, data, created_at, created_by, summary")
        .eq("country", country)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVersions(data || []);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message || "Could not load files.");
      setStatus("error");
    }
  }, [country]);

  useEffect(() => { load(); setChoice("current"); setWorking(null); }, [load]);

  const sourceData = choice === "current" ? masterData : versions.find((v) => v.id === choice)?.data;

  // Fresh in-memory copy whenever the chosen file (or the reset counter) changes.
  useEffect(() => {
    setWorking(sourceData ? JSON.parse(JSON.stringify(sourceData)) : null);
  }, [choice, resetKey, sourceData]); // eslint-disable-line

  function describe(v) {
    const kind = KIND_LABELS[v.kind] || v.kind;
    const year = v.kind === "working" ? yearOf(v.year_label) : yearOf(v.year_label);
    const title = v.kind === "working" && v.year_label ? ` "${v.year_label}"` : "";
    return `${year ? year + " " : ""}${kind}${title} · ${new Date(v.created_at).toLocaleString()}`;
  }

  function editWorking(path, value) {
    setWorking((prev) => {
      const clone = JSON.parse(JSON.stringify(prev || {}));
      const keys = path.split(".");
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in cur)) cur[k] = {};
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Sandbox</div>
        <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          Choose any {country} file below and try out different numbers on the results screen in real time.
          Nothing you change here is saved, and it never affects the real files. Choosing another file,
          clicking Reset, or leaving this page clears your changes.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "#555" }}>Work with this file:&nbsp;
            <select
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              style={{ padding: "7px 10px", fontSize: 12.5, border: "1px solid #ccd", borderRadius: 6, minHeight: 36, maxWidth: 520 }}
            >
              <option value="current">Current file (the live data)</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>{describe(v)}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setResetKey((k) => k + 1)}
            style={{ padding: "7px 14px", minHeight: 36, borderRadius: 6, border: "1px solid #ccd", background: "#fff", color: C.teal, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            Reset to the saved file
          </button>
        </div>
        {status === "loading" && <div style={{ fontSize: 12, color: "#777", marginTop: 8 }}>Loading files…</div>}
        {errorMsg && <div style={{ fontSize: 12.5, color: "#b3261e", marginTop: 8 }}>{errorMsg}</div>}
      </div>

      <div style={{ background: "#fff8e8", border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#5a4000" }}>
        <strong>What-if only.</strong> Changes here are not saved anywhere.
      </div>

      {working && (
        <Results
          key={`${choice}-${resetKey}`}
          country={country}
          data={working}
          flag={flag}
          onEdit={editWorking}
        />
      )}
    </div>
  );
}
