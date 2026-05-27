import { useState } from "react";
import { COLORS as C } from "../utils/metrics";

export default function StepInstructions({ stepInstructions }) {
  const [open, setOpen] = useState(false);
  if (!stepInstructions) return null;
  const { note, sheets } = stepInstructions;
  const lineCount = sheets.reduce((s, sh) => s + sh.lines.length, 0);

  return (
    <div style={{
      background: "#f0f7f9",
      border: `1px solid ${C.teal}`,
      borderRadius: 8,
      marginBottom: 18,
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "10px 14px",
          textAlign: "left",
          fontSize: 13,
          fontWeight: 700,
          color: C.teal,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 40,
        }}
      >
        <span style={{ fontSize: 14 }}>{open ? "▼" : "▶"}</span>
        <span>Instructions for this step</span>
        <span style={{ fontWeight: 400, fontSize: 11, color: C.blueGrey, marginLeft: "auto" }}>
          {open ? "Hide" : `${lineCount} step${lineCount === 1 ? "" : "s"}`}
        </span>
      </button>

      {open && (
        <div style={{ padding: "4px 16px 14px", borderTop: `1px solid ${C.teal}33` }}>
          {note && (
            <div style={{
              background: "#fff8e8",
              border: `1px solid ${C.yellow}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              color: "#5a4000",
              lineHeight: 1.55,
              margin: "12px 0",
            }}>
              <strong>Note:</strong> {note}
            </div>
          )}
          {sheets.map((sheet, i) => (
            <div key={i} style={{ marginTop: i === 0 && !note ? 8 : 14 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.navy,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}>
                {sheet.name}
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#333", lineHeight: 1.6 }}>
                {sheet.lines.map((line, j) => (
                  <li key={j} style={{ marginBottom: 6 }}>{line}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
