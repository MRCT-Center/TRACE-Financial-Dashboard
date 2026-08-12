# TRACE Financial Dashboard — AGENTS.md

*The runbook for this project. Read it before changing anything, and update it in the same commit as your change. This file replaces the dated handoff cards that used to live in Dropbox; git history is the change log now.*

## What this is

A financial sustainability dashboard for the TRACE programme, a multi-country ethics-training initiative run by the MRCT Center. Country teams enter their budget data through a guided wizard, and the dashboard shows expenses, revenue, a gap analysis, activities, a forecast, and an overview for each country.

It is meant to **replace the Excel workbook**, so everything is editable. That framing matters: this is a data-entry tool for country teams, not a read-only report.

TRACE is Africa-based. The five real countries are Kenya, Nigeria, Rwanda, Tanzania and Zimbabwe. Do not map it onto United States initiatives.

## Where it lives

- **Repo:** `MRCT-Center/TRACE-Financial-Dashboard` (private)
- **Live:** https://trace-financial-dashboard.vercel.app — MRCT Center Vercel account (`mrct@bwh.harvard.edu`), auto-deploys from `main` in about a minute
- **Database:** Supabase project `ohnwrvysqbtyxghnlkbx` (`mrct-trace-dashboard`), us-east-1. Not shared with any other application.
- **Primary reviewer:** Willyanne DeCormier Plosky (TRACE programme)
- **Local clone:** unlike most Center tools, this one has one. Clone anywhere; it was `~/Desktop/TRACE-Financial-Dashboard/` on Nannie's machine. Two older directories with similar names exist and should be ignored.

## How it's built

- **React 19 + Vite**, **Recharts 3** for charts, **Supabase** for persistence. No TypeScript, no test framework.
- The Supabase connection (URL + publishable key) is **hardcoded in `src/supabaseClient.js`**, so **no environment variables are needed** on Vercel. The app works the moment it deploys.
- **`vercel.json`** carries only an `X-Robots-Tag: noindex` header. No crons, no rewrites.

### Dev setup

```bash
nvm use --lts
npm install
npm run dev      # Vite dev server → localhost:5173
```

Commit and push before ending a session. Localhost is not Vercel.

## Where things live — the content map

The single most useful thing to know: **screens live in `src/components/`, content lives in `src/data/`.** For wording, categories, definitions and instruction text, you almost always want a `src/data/` file.

### Content (`src/data/`) — usually what you want

| To change this... | Edit this file |
|---|---|
| Country list + each country's seed data | `countries.js` |
| Regular / irregular **expense** categories and rows | `expensesRegular.js` · `expensesIrregular.js` |
| Irregular / other-regular **revenue** categories | `revenueIrregular.js` · `revenueRegularOther.js` |
| **In-kind** contributions (regular + irregular) | `inKindRegular.js` · `inKindIrregular.js` |
| The **fee model** (review types + fee structure) | `feesModel.js` |
| The **activity** list and descriptions | `activities.js` |
| **Forecast** bands and projection logic | `forecast.js` |
| The **wizard instruction text** (large content file, ~42 KB) | `instructions.js` |
| **Feedback survey** questions | `feedbackSurvey.js` |
| Older/archived text blurbs | `archivedBlurbs.js` |

### Screens (`src/components/`)

| To change this... | Edit this file |
|---|---|
| Layout, tabs/nav, country selector, currency toggle, prototype logins | `../App.jsx` |
| Sign-in screen + request-access + set-password flows | `LoginPage.jsx` |
| Admin queue for approving/denying access requests | `AdminAccessRequests.jsx` |
| "About TRACE / MRCT Center's role" intro | `IntroPage.jsx` |
| Overview summary cards (incl. in-kind) | `Overview.jsx` |
| Expenses screen (regular + irregular) | `Expenses.jsx` |
| Revenue screen (fees, grants, funder types) | `Revenue.jsx` |
| Gap analysis + advocacy summary | `GapView.jsx` |
| Activities screen | `Activities.jsx` |
| Budget Forecast tab | `Forecast.jsx` |
| Results tab wrapper (holds the sub-tabs) | `Results.jsx` |
| Feedback/survey tab | `Feedback.jsx` |
| Admin view | `AdminDashboard.jsx` |
| Admin feedback inbox | `AdminFeedback.jsx` |
| The multi-step data-entry wizard (largest file, ~125 KB) | `GuidedWizard.jsx` |
| "Instructions for this step" box in the wizard | `StepInstructions.jsx` |
| Click-to-open callouts + term/definition helper | `InfoTip.jsx` |
| Inline-editable table cells | `EditableCell.jsx` |

### Other

| File | What it does |
|---|---|
| `src/supabaseClient.js` | Hardcoded Supabase connection |
| `src/auth.js` | Access-control helpers: sign in/out, request access, check request status, claim account, ensureProfile (backfills the `profiles` row on first sign-in) |
| `src/demoConfig.js` | The `DEMO_MODE` switch — see Key decisions |
| `src/utils/CurrencyContext.jsx` | Fallback exchange rates, `displayCode`/`convert()` |
| `src/utils/metrics.js` | Metric definitions |
| `src/assets/trace-logo.svg` | Logo; header renders it white via `filter: brightness(0) invert(1)` |

## How to make changes

The team how-to, with a path for whichever AI you use, is at **how-we-build.vercel.app**.

This repo has a local clone, so it supports the full loop: branch, edit, preview, merge. It can also be edited entirely through GitHub's web editor.

- **Push** is sending your change to GitHub; the web editor's button says Commit. **Deploy** is the live site rebuilding a minute later, which nobody triggers.
- **Ask your AI for the complete file, every time**, and paste the whole thing back over the whole original. A reply containing `...` or "the rest stays the same" is not code; pasting it deletes real work and the page may still look fine afterwards.
- **Test before it goes live.** Every push to `main` reaches country teams immediately. For anything beyond a wording tweak, use a **branch** — Vercel builds a private preview link.
- **Any InfoTip or financial-definition wording must match Willyanne's source documents verbatim.** See Source documents below.
- **Update this file in the same commit** when you change how something works.

## Key decisions and things to know

- **`DEMO_MODE` is currently `true`** (`src/demoConfig.js`). While it is on, the five real countries render **blank** (everything reads zero) and edits do **not** save; only the fake example country **Nyika** shows worked demo data. This is intentional, set for Willyanne's prototype demos. **"Kenya shows all zeros" is expected, not a bug.** Flip to `false` for real data entry.
- **Testing caveat from `DEMO_MODE`:** because edits do not save while it is on, you can test how a change *looks* but not the save/data-entry flow.
- **All budget data is stored in USD internally.** Conversion to local currency happens only at display/input time.
- **Live exchange rates** are fetched each wizard session from `cdn.jsdelivr.net/@fawazahmed0/currency-api`. The `CurrencyContext` static rates are a **separate fallback**; the two systems are independent.
- **`canConvert`** disables local-currency mode while the rate is loading or errored, preventing bad data entry.
- **Currency toggle visibility** keys off `defaultCode !== "USD"` (the country's base currency), not `displayCode`, so the toggle does not hide itself after switching to USD view.
- **`overflow: hidden` was removed from all Card components** because it clipped InfoTip callouts. Border-radius now applies to header divs only.
- **Real Supabase Auth now backs sign-in (2026-08-06).** The six hardcoded
  `MOCK_USERS` prototype logins in `App.jsx` are gone. Access control works as
  a request/approve/claim flow:
  1. A country rep uses "Request access" on the login screen (name, email,
     country, optional note) — inserted into the `access_requests` table as
     `status = 'pending'`.
  2. An MRCT admin reviews the queue in Admin → **Access Requests**
     (`AdminAccessRequests.jsx`) and approves or denies it.
  3. The rep returns to "Already approved? Set your password", enters their
     email, and — if approved — sets a password. This calls
     `supabase.auth.signUp()`, creating a real Supabase Auth user.
  4. On first sign-in, `ensureProfile()` (`src/auth.js`) creates their
     `profiles` row (`role`, `country`), backfilling `country` from the
     matching access request and marking it `completed`.
  - **Tables:** `access_requests` and `profiles`, plus a `check_access_request(email)`
    RPC so a signed-out visitor can check their own request status without a
    public SELECT policy on the table. Set up via
    `supabase-access-control-migration.sql` (run once in the Supabase SQL
    editor) — see that file for the RLS policies.
  - **The MRCT admin account is created manually**, not through the request
    flow: add the user in Supabase Dashboard → Authentication → Users, then
    run the `profiles` insert at the bottom of the migration file to set
    `role = 'admin'`.
  - **The old quick-fill demo logins (nyika@trace.org, kenya@trace.org, etc.)
    no longer work.** Recreate any you still need (e.g. Nyika for Willyanne's
    demos) the same way as the admin account — Supabase Auth user + a
    `profiles` row — since they're not real country requests.
  - **Revoking access (2026-08-12):** `profiles` has an `active` column
    (default `true`). Admin → **Manage Access** (`ManageAccess.jsx`) lists
    every country account, grouped by country — a country can have more than
    one rep, `profiles.country` isn't unique — with a Revoke/Reinstate toggle
    per person. Revoking sets `active = false`; this is enforced at the
    database level (every RLS policy that grants a country rep access to
    their own country's data also requires `active = true`), not just hidden
    in the UI, and if they're mid-session when it happens, `App.jsx`'s auth
    listener signs them out on the next profile check. Revoking does **not**
    block a resubmitted access request — that's intentional, situations
    change — it just goes back through the normal approval queue. Approving a
    request from someone who already has a profile (a returning/revoked rep)
    reactivates that profile directly instead of routing them through
    "set your password" again, since they already have a working login. See
    `AdminAccessRequests.jsx`'s `decide()`.
  - **Not built yet:** an admin UI for changing someone's role/country after
    creation (still by hand in Supabase), and email notifications when a
    request comes in (the admin currently has to check the Access Requests
    tab — a Resend-based notification was scoped on 2026-08-12 but not yet
    built, blocked on getting API keys). Depending on the Supabase project's
    "Confirm email" setting, a rep may need to confirm their email before
    `ensureProfile()` can finish linking their account — either setting
    works, `App.jsx`'s auth listener re-runs `ensureProfile()` on every
    sign-in until it succeeds.
- **Real data access is now locked down by role/country/active (2026-08-12).**
  `country_data` — the table the live app actually reads and writes — used to
  have a wide-open policy (`public_access`, `qual: true`) left over from
  before real auth existed: anyone with the public anon key, logged in or
  not, could read and overwrite any country's data. That's now replaced with
  policies requiring a matching, active `profiles` row (or `role = 'admin'`).
  The older normalized tables (`activities`, `expenses_regular`,
  `expenses_irregular`, `revenue_regular`, `revenue_irregular`, `in_kind`,
  `countries`) — not queried by the current app, but still holding real
  financial data with the same stale/open policies (some referencing
  `auth.jwt() ->> 'country'` and `->> 'user_role'` claims from the old mock
  system, which the real Supabase Auth session never sets) — got the same
  treatment for defense in depth. See the
  `access_control_lockdown_and_revoke` migration. **Nyika is not a real row
  in any of these tables** — it only exists as hardcoded seed data in
  `src/data/countries.js`, rendered client-side, so it needed no special
  carve-out; it stays effectively public simply by never touching the
  database. `feedback` was left as-is (still publicly readable) — out of
  scope for this pass, worth a look separately.
- **The repository is private. The live site is not.** `trace-financial-dashboard.vercel.app` answers anyone who knows the address, with no account and no password required to *reach* the login screen. A `noindex` header keeps it out of search results, but **the link is the key** to who can attempt to sign in or request access. As of 2026-08-12, actually reading or writing country data additionally requires a real, active, approved account for that specific country (or admin) — see the two points above — so the login screen being reachable no longer means the data behind it is.
- **Country data status:** Kenya is the most accurate (April 17 workbook, real data). Nigeria, Rwanda, Tanzania and Zimbabwe are **placeholder data only** and need real figures.

## Known issues / to-do

- **Willyanne sign-off pending** on the irregular-expenses funding-source sentence (a JSX comment in `GuidedWizard`, not rendered) and the activity descriptions flagged `SUGGESTED elaboration` in `Activities.jsx`.
- **Wizard source/notes reset on page reload** — per-browser `localStorage`, no persistence across sessions. Move to Supabase before real country-team use.
- `revOther` is not yet editable in wizard Step 4.
- `CurrencyContext` static rates go stale; consider syncing them with the live fetch.
- In-kind contributions feeding the gap calculation is deferred to Phase 2; Willyanne to define the logic.
- `ikReg.total` is auto-computed from federal + institutional + other on save, not directly editable.
- **When switching to real data entry:** flip `DEMO_MODE` to `false`, re-check the `App.jsx` Supabase merge guard, and run the five-country data reconciliation. A change to a default in `countries.js` does **not** update rows already in Supabase.

## Related repos

- **`MRCT-Center/trace-ethics-training-dashboard`** — the TRACE programme's other dashboard, covering training rather than money, same five countries. Separate database, separate hosting; as of 2026-07-30 neither is in the Center's accounts. It carries `TRACE_STYLE_GUIDE.md`, which governs TRACE visual conventions across both tools.

## Source documents (Willyanne's content)

In `~/Desktop/MRCT/TRACE Financial Dashboard/`, outside this repo:

- `2026_04_13 Introduction to the TRACE Financial Workbook.pptx` — fee definitions, funder types (slides 25–27), advocacy (slides 10, 37)
- `2026_04_20 About the TRACE Project_for dashboard.docx` — MRCT Center role, project description
- `Feedback from Willyanne.md` — accumulated content feedback
