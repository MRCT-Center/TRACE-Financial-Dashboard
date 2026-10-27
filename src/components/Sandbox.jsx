import { COLORS as C } from "../utils/metrics";
import Results from "./Results";
import { applySandboxEdit } from "../utils/sandboxEdit";

// Sandbox (2026-10-27): the file is chosen from Version History (so people
// can see each file's title, date, and description of what changed), then
// played with on the Results screens in real time. Every number can be
// edited here, nothing is saved, and the real files are never touched.
// While a file is open in the Sandbox the Inputs tab is locked (see App.jsx);
// "Exit Sandbox" clears the changes and unlocks it.
//
// `sandbox` is { label, source, data } held by App so it survives a trip to
// Version History to choose a file; null means no file is open yet.

export default function Sandbox({ country, flag, masterData, sandbox, setSandbox, onChooseFromHistory }) {
  const fresh = (d) => JSON.parse(JSON.stringify(d || {}));

  function useCurrent() {
    setSandbox({ label: "Current file (the live data)", source: fresh(masterData), data: fresh(masterData) });
  }
  function reset() {
    setSandbox((s) => (s ? { ...s, data: fresh(s.source) } : s));
  }
  function exit() {
    if (window.confirm("Exit the Sandbox? Your what-if changes will be cleared and Inputs will unlock.")) setSandbox(null);
  }
  function edit(path, value) {
    setSandbox((s) => (s ? { ...s, data: applySandboxEdit(s.data, path, value) } : s));
  }

  const btn = (primary) => ({
    padding: "8px 16px", minHeight: 36, borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    border: primary ? "none" : "1px solid #ccd", background: primary ? C.teal : "#fff", color: primary ? "#fff" : C.teal,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#fff", border: "1px solid #dde", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Sandbox</div>
        <p style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
          Try out different numbers on a saved file without changing it. Choose the file from Version History,
          where you can see each file's title, date, and a description of what changed. You can then edit any
          number on the Results pages (including the fee schedule and in-kind contributions) and see the totals
          update. Nothing is saved, and while a file is open here the Inputs tab is locked so the real file cannot
          be changed by mistake.
        </p>
        {!sandbox ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button onClick={onChooseFromHistory} style={btn(true)}>Choose file to use from Version History</button>
            <button onClick={useCurrent} style={btn(false)}>Use the current file instead</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: C.navy }}>Working with: <strong>{sandbox.label}</strong></div>
            <button onClick={onChooseFromHistory} style={btn(false)}>Choose a different file from Version History</button>
            <button onClick={reset} style={btn(false)}>Reset to the saved file</button>
            <button onClick={exit} style={{ ...btn(false), color: "#b3261e" }}>Exit Sandbox</button>
          </div>
        )}
      </div>

      {sandbox && (
        <div style={{ background: "#fff8e8", border: `1px solid ${C.yellow}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#5a4000" }}>
          <strong>What-if only.</strong> Changes here are not saved anywhere. Inputs is locked until you exit the Sandbox.
        </div>
      )}

      {sandbox && (
        <Results country={country} data={sandbox.data} flag={flag} onEdit={edit} sandbox />
      )}
    </div>
  );
}
