import { useState } from "react";
import { COLORS as C } from "../utils/metrics";
import { COUNTRIES } from "../data/countries";
import { signIn, requestAccess, checkAccessRequest, claimAccess, requestPasswordReset, verifyPasswordResetOtp, updatePassword } from "../auth";

// Real country list for the request form — Nyika is the fixed worked example,
// not something a country team requests access to.
const REQUESTABLE_COUNTRIES = Object.keys(COUNTRIES).filter((c) => c !== "Nyika");

export default function LoginPage({ notice }) {
  const [screen, setScreen] = useState("signin"); // signin | request | claim | forgot

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
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Draft Version: Do Not Share
          </div>
        </div>

        {notice && (
          <div style={{ background: "#fdecec", border: `1px solid ${C.red}`, color: C.red, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
            {notice}
          </div>
        )}

        {screen === "signin" && <SignInForm onNavigate={setScreen} />}
        {screen === "request" && <RequestAccessForm onNavigate={setScreen} />}
        {screen === "claim" && <ClaimAccessForm onNavigate={setScreen} />}
        {screen === "forgot" && <ForgotPasswordForm onNavigate={setScreen} />}
      </div>
    </div>
  );
}

// ─── Sign in ────────────────────────────────────────────────────────────────

function SignInForm({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await signIn(email, password);
    // On success, App.jsx's onAuthStateChange listener picks up the new
    // session automatically — nothing more to do here.
    if (err) { setError(humanizeAuthError(err)); setLoading(false); }
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Email</label>
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
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={inputStyle}
          />
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <div style={{ textAlign: "right" }}>
          <LinkButton onClick={() => onNavigate("forgot")} style={{ fontSize: 12 }}>
            Forgot password?
          </LinkButton>
        </div>

        <button type="submit" disabled={loading} style={primaryBtn(loading)}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <LinkButton onClick={() => onNavigate("request")} style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Request access
        </LinkButton>
        <LinkButton onClick={() => onNavigate("claim")}>
          Already approved? Set your password
        </LinkButton>
      </div>
    </>
  );
}

// ─── Forgot password ────────────────────────────────────────────────────────

function ForgotPasswordForm({ onNavigate }) {
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await requestPasswordReset(email);
    setLoading(false);
    if (err) { setError(err); return; }
    setStep("code");
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    setResent(false);
    const err = await requestPasswordReset(email);
    setLoading(false);
    if (err) { setError(err); return; }
    setResent(true);
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const verifyErr = await verifyPasswordResetOtp(email, code);
    if (verifyErr) {
      setLoading(false);
      setError(/expired|invalid/i.test(verifyErr)
        ? "That code is incorrect or has expired. Request a new one below."
        : verifyErr);
      return;
    }
    const pwErr = await updatePassword(password);
    setLoading(false);
    if (pwErr) { setError(pwErr); return; }
    // Password is set and a real session now exists — App.jsx's auth
    // listener will pick it up and move past the login screen on its own.
  }

  if (step === "code") {
    return (
      <>
        <p style={{ fontSize: 13, color: C.blueGrey, marginBottom: 16, lineHeight: 1.5 }}>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below
          along with your new password. (If the "reset password" link in
          that email just took you back to the sign-in page instead of
          working, this code is the fix — some work email systems open
          links automatically before you get to them, but they can't type
          in a code for you.)
        </p>
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}
          {resent && !error && (
            <p style={{ fontSize: 12, color: C.blueGrey }}>A new code is on its way.</p>
          )}

          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <LinkButton onClick={handleResend}>Didn't get a code? Send another</LinkButton>
          <LinkButton onClick={() => onNavigate("signin")}>← Back to sign in</LinkButton>
        </div>
      </>
    );
  }

  return (
    <>
      <p style={{ fontSize: 13, color: C.blueGrey, marginBottom: 16, lineHeight: 1.5 }}>
        Enter the email on your account and we'll send you a code to reset your password.
      </p>
      <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus style={inputStyle} />
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <button type="submit" disabled={loading} style={primaryBtn(loading)}>
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
        <LinkButton onClick={() => onNavigate("signin")}>← Back to sign in</LinkButton>
      </div>
    </>
  );
}

// ─── Request access ─────────────────────────────────────────────────────────

function RequestAccessForm({ onNavigate }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(REQUESTABLE_COUNTRIES[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await requestAccess({ name, email, country, note });
    setLoading(false);
    if (err) { setError(err); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.6 }}>
          Request submitted. MRCT Center will review it and you'll be able to
          set your password once it's approved — check back using
          "Already approved? Set your password" below.
        </p>
        <div style={{ marginTop: 18 }}>
          <LinkButton onClick={() => onNavigate("signin")}>← Back to sign in</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <p style={{ fontSize: 13, color: C.blueGrey, marginBottom: 16, lineHeight: 1.5 }}>
        Requesting dashboard access for your country's team. MRCT Center
        reviews every request before it's granted.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle}>
            {REQUESTABLE_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
          />
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <button type="submit" disabled={loading} style={primaryBtn(loading)}>
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <div style={{ marginTop: 18 }}>
        <LinkButton onClick={() => onNavigate("signin")}>← Back to sign in</LinkButton>
      </div>
    </>
  );
}

// ─── Claim / set password after approval ───────────────────────────────────

function ClaimAccessForm({ onNavigate }) {
  const [step, setStep] = useState("email"); // email | password | done
  const [email, setEmail] = useState("");
  const [request, setRequest] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheckEmail(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const req = await checkAccessRequest(email);
      if (!req) {
        setError("No access request found for this email. Submit a request first.");
      } else if (req.status === "pending") {
        setError("Your request is still awaiting review by MRCT Center.");
      } else if (req.status === "denied") {
        setError("Your request wasn't approved. Contact MRCT Center for more information.");
      } else if (req.status === "completed") {
        setError("An account already exists for this email — sign in instead.");
      } else {
        setRequest(req);
        setStep("password");
      }
    } catch (err) {
      setError(err.message || "Something went wrong checking your request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    const err = await claimAccess({ email, password });
    setLoading(false);
    if (err) { setError(humanizeAuthError(err)); return; }
    setStep("done");
  }

  if (step === "done") {
    return (
      <div>
        <p style={{ fontSize: 14, color: C.navy, lineHeight: 1.6 }}>
          Account created for <strong>{request?.country}</strong>. If you're
          not signed in automatically in a moment, use "Sign in" with your new
          password (check your email first if this Supabase project requires
          confirmation).
        </p>
        <div style={{ marginTop: 18 }}>
          <LinkButton onClick={() => onNavigate("signin")}>← Back to sign in</LinkButton>
        </div>
      </div>
    );
  }

  if (step === "password") {
    return (
      <>
        <p style={{ fontSize: 13, color: C.blueGrey, marginBottom: 16, lineHeight: 1.5 }}>
          Approved for <strong>{request?.country}</strong>. Set a password to finish creating your account.
        </p>
        <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}

          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <p style={{ fontSize: 13, color: C.blueGrey, marginBottom: 16, lineHeight: 1.5 }}>
        Enter the email you used to request access.
      </p>
      <form onSubmit={handleCheckEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus style={inputStyle} />
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <button type="submit" disabled={loading} style={primaryBtn(loading)}>
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>

      <div style={{ marginTop: 18 }}>
        <LinkButton onClick={() => onNavigate("signin")}>← Back to sign in</LinkButton>
      </div>
    </>
  );
}

// ─── shared bits ─────────────────────────────────────────────────────────

function humanizeAuthError(msg) {
  if (/already registered/i.test(msg)) return "An account already exists for this email — sign in instead.";
  if (/invalid login credentials/i.test(msg)) return "Invalid email or password.";
  return msg;
}

function ErrorBox({ children }) {
  return (
    <div style={{ background: "#fff0f0", border: `1px solid ${C.red}`, borderRadius: 6, padding: "8px 12px", color: C.red, fontSize: 13 }}>
      {children}
    </div>
  );
}

function LinkButton({ onClick, children, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "none", border: "none", color: C.teal, fontSize: 13, fontWeight: 600, textAlign: "left", cursor: "pointer", padding: 0, minHeight: 0, ...style }}
    >
      {children}
    </button>
  );
}

function primaryBtn(loading) {
  return {
    background: loading ? C.blueGrey : C.teal,
    color: "#fff",
    borderRadius: 8,
    padding: "12px 0",
    fontSize: 15,
    fontWeight: 600,
    marginTop: 6,
    minHeight: 44,
    border: "none",
    transition: "background 0.15s",
  };
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
