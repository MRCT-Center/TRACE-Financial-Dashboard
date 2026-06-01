import { useState } from "react";
import { COLORS as C } from "../utils/metrics";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = onLogin(email.trim(), password);
    if (err) { setError(err); setLoading(false); }
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
            MRCT Center
          </div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Draft Version: Do Not Share
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@trace.org"
              required
              autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: `1px solid ${C.red}`, borderRadius: 6, padding: "8px 12px", color: C.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? C.blueGrey : C.teal,
              color: "#fff",
              borderRadius: 8,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              marginTop: 6,
              minHeight: 44,
              transition: "background 0.15s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 24, borderTop: `1px solid #eee`, paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: C.blueGrey, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Country sign-in
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {/* MRCT Admin is intentionally omitted from this quick-fill list so
                country-team participants only see their five country logins and
                don't stumble into the admin / survey-results view. The admin
                account still works by typing the credentials manually. */}
            {[
              ["Kenya", "kenya@trace.org", "kenya2026"],
              ["Nigeria", "nigeria@trace.org", "nigeria2026"],
              ["Rwanda", "rwanda@trace.org", "rwanda2026"],
              ["Tanzania", "tanzania@trace.org", "tz2026"],
              ["Zimbabwe", "zimbabwe@trace.org", "zim2026"],
            ].map(([label, em, pw]) => (
              <button
                key={em}
                type="button"
                onClick={() => { setEmail(em); setPassword(pw); }}
                style={{
                  background: "#f4f6f8",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  color: C.navy,
                  textAlign: "left",
                  border: "1px solid #dde",
                  minHeight: 32,
                }}
              >
                <strong>{label}</strong> — {em}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 14,
  minHeight: 44,
  outline: "none",
};
