// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// When true, the app runs as a safe sandbox:
//   • Every edit (Results cells + Inputs wizard + the Submit button) updates only
//     the current visitor's in-memory session — NOTHING is written to Supabase.
//   • The seeded dummy data is therefore never modified, no matter what testers do.
//   • A browser refresh reloads the pristine seeded data, so every visitor starts
//     from the same clean copy and cannot affect each other.
//
// This was originally added for Willyanne's 2026-05-31 prototype demo. It has
// stayed on deliberately since then, not by oversight: Willyanne and Hayat
// decided (2026-09-15) that real countries should not be entering real data on
// the live site yet, while still letting country teams explore the dashboard
// via the Nyika example without changing what the next visitor sees. Flip this
// to `false` only when the team is ready for real countries to save real data —
// see AGENTS.md's Security rules section first, since that's also when Nyika
// will need its own admin-only-persists behavior (not yet built).
export const DEMO_MODE = true;
