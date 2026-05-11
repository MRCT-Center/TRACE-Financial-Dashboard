import { useState, useEffect, useRef } from "react";
import { COLORS as C } from "../utils/metrics";

export default function InfoTip({ title, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block", verticalAlign: "middle", lineHeight: 1 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={title || "More information"}
        style={{
          width: 17, height: 17, borderRadius: "50%",
          background: open ? C.teal : "#a8c8d0",
          color: "#fff", fontSize: 10, fontWeight: 700, fontStyle: "italic",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer", marginLeft: 6, flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        i
      </button>
      {open && (
        <div style={{
          position: "absolute", zIndex: 300,
          top: "calc(100% + 8px)", left: 0,
          minWidth: 280, maxWidth: 340,
          background: "#fff",
          border: `1.5px solid ${C.teal}`,
          borderRadius: 9, padding: "14px 16px",
          boxShadow: "0 6px 24px rgba(0,59,88,0.14)",
          fontSize: 12, color: "#333", lineHeight: 1.65,
        }}>
          {title && (
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 10, fontSize: 13, borderBottom: `1px solid #e8f5f7`, paddingBottom: 8 }}>
              {title}
            </div>
          )}
          {children}
        </div>
      )}
    </span>
  );
}

export function Def({ term, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontWeight: 700, color: "#003b58" }}>{term}: </span>
      <span>{children}</span>
    </div>
  );
}
