# TRACE Financial Dashboard — Claude Context

## Quick Orientation

A financial sustainability dashboard for the TRACE program (a multi-country ethics training initiative run by the MRCT Center at Harvard). Country teams enter budget data through a guided wizard; the dashboard displays expenses, revenue, gap analysis, activities, and an overview for each country.

> **Migrated 2026-07-23:** this repo moved from `nclough68` to the `MRCT-Center` GitHub org, and hosting moved to the MRCT Center Vercel account. Old URLs redirect; the live URL is unchanged.

- **Local path:** clone anywhere you work (was `/Users/nc404/Desktop/TRACE-Financial-Dashboard/` on Nannie's machine)
- **Repo:** `MRCT-Center/TRACE-Financial-Dashboard` (private; in the MRCT Center GitHub org)
- **Live:** `trace-financial-dashboard.vercel.app`, hosted on the MRCT Center Vercel account (`mrct@bwh.harvard.edu`); auto-deploys from `main`
- **Stakeholder:** Willyanne DeCormier Plosky (TRACE program, primary content reviewer)

## Dev Setup

```bash
nvm use --lts       # Node via nvm
npm run dev         # Vite dev server → localhost:5173
```

Always commit and push before ending a session — localhost is not Vercel.

## Stack

- React 19 + Vite 8
- Recharts 3 for charts
- Supabase (`@supabase/supabase-js`) for data persistence
- No TypeScript, no testing framework

## Architecture

`CLAUDE.md` is notes-for-AI only; it does not run. The app is built entirely from `src/`.

```
src/
  App.jsx                  # Top-level routing, tabs/nav, country selector, currency toggle, mocked prototype logins
  main.jsx                 # React entry point
  App.css, index.css       # Global styles
  supabaseClient.js        # Supabase client — connection URL + publishable key are HARDCODED here (no env vars)
  demoConfig.js            # DEMO_MODE flag (currently true)
  assets/                  # Logo + images
  components/              # SCREENS (how each page looks and behaves)
    LoginPage.jsx          # Sign-in screen + quick-fill prototype logins
    IntroPage.jsx          # About TRACE / MRCT Center's role
    Overview.jsx           # Overview summary cards (incl. in-kind)
    Expenses.jsx           # Expenses screen (regular + irregular)
    Revenue.jsx            # Revenue screen (fees, grants, funder types)
    GapView.jsx            # Gap analysis + advocacy summary
    Activities.jsx         # Activities screen
    Forecast.jsx           # Budget Forecast tab
    Results.jsx            # Results tab wrapper (holds the results sub-tabs)
    Feedback.jsx           # Feedback/survey tab (participant survey + open questions)
    AdminDashboard.jsx     # Admin view
    AdminFeedback.jsx      # Admin feedback inbox (survey responses)
    GuidedWizard.jsx       # Multi-step data-entry wizard (largest file, ~125KB)
    StepInstructions.jsx   # "Instructions for this step" box in the wizard
    InfoTip.jsx            # Click-to-open callout + Def helper (term/definition pairs)
    EditableCell.jsx       # Inline-editable table cell
  data/                    # CONTENT (wording, categories, definitions, fee model, instruction text)
    countries.js           # Country list + per-country seed data (Kenya...Nyika)
    expensesRegular.js     # Regular expense categories/rows
    expensesIrregular.js   # Irregular expense categories/rows
    revenueIrregular.js    # Irregular revenue categories
    revenueRegularOther.js # Other-regular revenue categories
    inKindRegular.js       # In-kind contributions (regular)
    inKindIrregular.js     # In-kind contributions (irregular)
    feesModel.js           # Fee model (review types + fee structure)
    activities.js          # Activity list + descriptions
    forecast.js            # Forecast bands + projection logic
    instructions.js        # Wizard step-by-step instruction text (~42KB content file)
    feedbackSurvey.js      # Feedback survey questions
    archivedBlurbs.js      # Older/archived text blurbs
  utils/
    CurrencyContext.jsx    # Static fallback exchange rates; provides displayCode/convert()
    metrics.js             # Metric definitions
```

For most wording, definition, or category edits, the target is a `src/data/` file. The `src/components/` files control layout and behavior.

## Key Decisions & Constraints

- **All budget data stored in USD internally.** Conversion to local currency happens only at display/input time via `CurrencyContext` or wizard's live rate fetch.
- **Live exchange rates** are fetched each wizard session from `cdn.jsdelivr.net/@fawazahmed0/currency-api`. The `CurrencyContext` static rates are a separate fallback — the two systems are independent.
- **`canConvert` flag** in the wizard disables local-currency mode while the rate is loading or errored, preventing bad data entry.
- **Currency toggle visibility** uses `defaultCode !== "USD"` (country's base currency), not `displayCode` — so the toggle doesn't hide itself after switching to USD view.
- **`overflow: hidden` removed** from all Card components — it was clipping InfoTip callouts. Border-radius now applied to header divs only (`borderRadius: "9px 9px 0 0"`).
- **InfoTip content** was audited line-by-line against Willyanne's source documents (TRACE Financial Workbook slides 25–27, About the TRACE Project DOCX). Use her verbatim language for all financial definitions.
- **TRACE logo** is `src/assets/trace-logo.svg`. Header renders it white via `filter: "brightness(0) invert(1)"`. Favicon uses a cropped viewBox of the diamond symbol only (`viewBox="48 4 66 66"`).
- **Supabase auth** is currently mocked — 6 hardcoded prototype accounts in `App.jsx`. Real auth is Phase 2.

## Country Data Status

- **Kenya** — most accurate (from April 17 workbook with real data)
- **Nigeria, Rwanda, Tanzania, Zimbabwe** — placeholder data only; real data needed before Zimbabwe meeting

## Pending / Known Issues

- **Willyanne sign-off needed** on two things before country team release:
  - Irregular expenses funding source sentence (in a JSX comment in GuidedWizard, not rendered)
  - Activity descriptions flagged `SUGGESTED elaboration` in `Activities.jsx` comments
- **`revOther` field** not yet editable in wizard Step 4 (deferred)
- **Wizard source/notes** reset on page reload — no persistence across sessions yet
- **CurrencyContext static rates** will go stale over time; consider syncing with the live API fetch
- **In-kind pulling into gap calculations** — deferred to Phase 2; Willyanne to explain the logic
- **`ikReg.total`** is auto-computed from federal + institutional + other on save, not directly editable

## Source Documents (Willyanne's content)

Located in `~/Desktop/MRCT/TRACE Financial Dashboard/`:
- `2026_04_13 Inroduction to the TRACE Financial Workbook.pptx` — fee definitions, funder types (slides 25–27), advocacy (slides 10, 37)
- `2026_04_20 About the TRACE Project_for dashboard.docx` — MRCT Center role, project description
- `Feedback from Willyanne.md` — accumulated content feedback
