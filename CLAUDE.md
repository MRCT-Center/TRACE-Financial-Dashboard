# TRACE Financial Dashboard — Claude Context

## Quick Orientation

A financial sustainability dashboard for the TRACE program (a multi-country ethics training initiative run by the MRCT Center at Harvard). Country teams enter budget data through a guided wizard; the dashboard displays expenses, revenue, gap analysis, activities, and an overview for each country.

- **Local path:** `/Users/nc404/Desktop/TRACE-Financial-Dashboard/`
- **Repo:** `nclough68/TRACE-Financial-Dashboard` (private)
- **Live:** Vercel (auto-deploys from main)
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

```
src/
  App.jsx                  # Top-level routing, country selector, currency toggle
  supabaseClient.js        # Supabase init
  CurrencyContext.jsx      # Static fallback exchange rates; provides displayCode/convert()
  components/
    LoginPage.jsx          # 6 prototype accounts with auto-fill credentials panel
    IntroPage.jsx          # About TRACE, MRCT Center's role, why this dashboard
    Overview.jsx           # Summary cards incl. in-kind contributions
    Expenses.jsx           # Regular + irregular expenses breakdown
    Revenue.jsx            # Fees, grants, funder types
    GapView.jsx            # Gap analysis, advocacy summary
    Activities.jsx         # Per-activity data with NHSRD/etc descriptions
    GuidedWizard.jsx       # Multi-step data entry wizard (Steps 1–5)
    InfoTip.jsx            # Click-to-open callout component; Def helper for term/definition pairs
    EditableCell.jsx       # Inline-editable table cell
    AdminDashboard.jsx     # Admin view
    metrics.js             # Metric definitions
    countries.js           # Country data (Kenya most accurate; others placeholder)
```

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
