// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// When true, the app runs as a safe sandbox for live demos:
//   • Every edit (Results cells + Inputs wizard + the Submit button) updates only
//     the current visitor's in-memory session — NOTHING is written to Supabase.
//   • The seeded dummy data is therefore never modified, no matter what testers do.
//   • A browser refresh reloads the pristine seeded data, so every tester (and
//     multiple people sharing one country login) starts from the same clean copy
//     and cannot affect each other.
//
// This was added for Willyanne's 2026-05-31 prototype demo to representatives from
// all five countries. FLIP THIS BACK TO `false` after the demo to restore normal
// saving for real data entry.
export const DEMO_MODE = true;
