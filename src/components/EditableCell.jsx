import { useState, useRef, useEffect } from "react";
import { COLORS as C } from "../utils/metrics";

/**
 * Inline editable value. Displays a formatted value; click to edit the raw value.
 *
 * Props:
 *   value      – raw stored value (number or string)
 *   display    – formatted string to show in display mode (e.g. fmt(value))
 *   path       – dot-notation path like "er.secSal" or "fees.0.ind"
 *   onEdit     – (path, newValue) => void  called when user confirms edit
 *   type       – "number" | "text" | "date"  (default "number")
 *   align      – "left" | "right"  (default "right" for numbers)
 */
export default function EditableCell({ value, display, path, onEdit, type = "number", align = "right" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEdit() {
    setDraft(String(value ?? ""));
    setEditing(true);
  }

  function confirm() {
    if (!editing) return;
    setEditing(false);
    const parsed = type === "number" ? parseFloat(draft) : draft.trim();
    if (type === "number" && isNaN(parsed)) return; // discard bad input
    if (parsed !== value) onEdit(path, parsed);
  }

  function handleKey(e) {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <input
          ref={inputRef}
          type={type === "date" ? "text" : type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={confirm}
          onKeyDown={handleKey}
          style={{
            width: type === "number" ? 100 : 140,
            padding: "2px 6px",
            border: `1.5px solid ${C.teal}`,
            borderRadius: 4,
            fontSize: "inherit",
            textAlign: align,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        {type === "number" && (
          <span style={{ fontSize: 10, color: C.blueGrey, whiteSpace: "nowrap" }}>USD</span>
        )}
      </span>
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Click to edit"
      style={{
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: 3,
        padding: "1px 3px",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#e8f5f7"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {display ?? value}
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
        <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke={C.teal} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
