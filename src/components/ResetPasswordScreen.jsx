import { useState } from "react";
import { COLORS as C } from "../utils/metrics";
import { updatePassword, signOut } from "../auth";

// Shown instead of the normal login/dashboard when Supabase Auth fires a
// PASSWORD_RECOVERY event — i.e. someone landed here via the link from a
// "Forgot password?" email (see requestPasswordReset() in src/auth.js).
// Clicking that link already signs them into a temporary session; this
// screen's only job is to make them set a real new password before they can
// go any further, rather than continuing on with just the recovery session.
export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const err = await updatePassword(password);
    setLoading(false);
    if (err) { setError(err); return; }
    onDone();
  }

  async function cancel() {
    // Landing here already creates a session — if they bail out, sign them
    // fully out rather than leaving them half-authenticated on a stale
    // recovery session with no new password set.
    await signOut();
    onDone();
  }

  return (
    <div style={{
      minHeight: "100svh",
      background: C.navy,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 400,
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/trace-logo-color.svg" alt="TRACE" style={{ height: 60, objectFit: "contain", marginBottom: 12 }} />
          <div style={{ fontSize: 13, color: C.blueGrey, marginTop: 4 }}>
            Financial Dashboard · MRCT Center
          </div>
        </div>

        <p style={{ fontSize: 13, color: C.blueGrey, marginBottom: 16, lineHeight: 1.5 }}>
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: `1px solid ${C.red}`, borderRadius: 6, padding: "8px 12px", color: C.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? C.blueGrey : C.teal,
            color: "#fff",
            borderRadius: 8,
            padding: "12px 0",
            fontSize: 15,
            fontWeight: 600,
            marginTop: 6,
            minHeight: 44,
            border: "none",
          }}>
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>

        <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <button
            type="button"
            onClick={cancel}
            style={{ background: "none", border: "none", color: C.teal, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, minHeight: 0 }}
          >
            ← Cancel and back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 4 };

const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 14,
  minHeight: 44,
  outline: "none",
};
