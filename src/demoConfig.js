// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// When true, the app runs as a safe sandbox for live demos:
//   • Every edit (Results cells + Inputs wizard + the Submit button) updates only
//     the current visitor's in-memory session — NOTHING is written to Supabase.
//   • The seeded dummy data is therefore never modified, no matter what testers do.
//   • A browser refresh reloads the pristine seeded data, so every tester (and
//     multiple people sharing one country login) starts from the same clean copy
//     and cannot affect each other.
//
// This was deliberately kept on since Willyanne's 2026-05-31 prototype demo,
// per Hayat + Willyanne's 2026-09-15 decision: countries should be able to see
// how the dashboard works (via Nyika) without being able to enter real data on
// the live site yet. It is not a forgotten flag.
export const DEMO_MODE = true;

// Countries that bypass DEMO_MODE and behave like a real, persisting country
// even while DEMO_MODE is on. Nyika II (2026-09-22) is the internal test copy
// of Nyika, used to validate Master/Sandbox/Final behavior against real
// Supabase writes. As of 2026-10-07 (Hayat/Willyanne, batch 1) the five real
// TRACE countries are also listed here so their reps can set year dates, save
// Original/Midpoint/Final files, and have Inputs edits persist. Only plain
// "Nyika" remains a no-save demo. (Their country_data rows were reset to blank
// at the same time -- the old rows still held May dummy numbers.)
export const NON_DEMO_COUNTRIES = ["Nyika II", "Kenya", "Nigeria", "Rwanda", "Tanzania", "Zimbabwe"];

// True when `country` should behave as a demo (edits stay in-memory only,
// reset on refresh). False for a country in NON_DEMO_COUNTRIES, even while
// DEMO_MODE is globally on.
export function isDemoCountry(country) {
  return DEMO_MODE && !NON_DEMO_COUNTRIES.includes(country);
}
