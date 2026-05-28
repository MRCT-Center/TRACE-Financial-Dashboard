// ─────────────────────────────────────────────────────────────────────────────
// Archived wizard blurbs — removed per Willyanne 2026-05-28 (plane-to-London
// email, "next programming pieces" item #5: "remove the blurbs that are below
// the instructions and save them in a file. I would like to remove them for
// now, but may want to put them back in later.")
//
// Each block below is the verbatim JSX-rendered text of the descriptive blurb
// that used to sit at the top of the corresponding wizard tab/sub-tab. JSX
// markup (<strong>, <em>) is preserved inline as raw markdown-style markers
// so the original emphasis is recoverable. To restore: import the relevant
// constant from this file and re-render it as a <p style={descStyle}> at the
// original location (see Tier 9 / commit cc432d9 for original line numbers).
//
// Layout: one export per removed blurb, matching the wizard step structure.
// ─────────────────────────────────────────────────────────────────────────────

// 1. Setup tab — Confirm your unit and currency settings.
export const SETUP_BLURB =
  "Confirm your unit and currency settings below. Country is set by your login.";

// 2. Key Considerations — Risks & Opportunities sub-tab.
export const RISKS_OPPS_BLURB =
  "Do you expect any major financial risks or opportunities in the next year? " +
  "These may include political instability, currency changes, loss or gain of " +
  "international funding, or changes in research activity volume.";

// 2. Key Considerations — Activities sub-tab.
// (Inline <strong>/<em> markers preserved as ** / _ for round-trip restoration.)
export const ACTIVITIES_BLURB =
  "_For each activity, select whether you expect effort to **remain the same**, " +
  "**increase**, or **decrease** in the near term (next year) and the long term " +
  "(3–5 years). Activity names and descriptions are editable — you can click the " +
  "name to rename it and click the **ⓘ** to rewrite its description. If any of " +
  "the pre-populated activities in the activities list does not apply in your " +
  'context, you can remove it by clicking the red "x" at the right end of the ' +
  "row; if you would like to add an activity, use **+ Add activity** at the end " +
  "of the list to name that activity and enter in a description._";

// 3. Expenses — Regular sub-tab.
export const EXPENSES_REGULAR_BLURB =
  "_Enter your unit's regular annual expenses below (inclusive of the " +
  "Secretariat/mgmt. expenses and the Ethics Committee expenses). The " +
  "categories and items are pre-populated from the TRACE Financial Workbook. " +
  "**All cells are editable** — you can click the item to rename it and click " +
  "the **ⓘ** to edit its description. If an item does not apply in your " +
  'context, you can remove it by clicking on the red "x" at the right end of ' +
  "the row. You may also add an item under any expense category by clicking " +
  "on **+ Add item** to input the item name and description. Please note, you " +
  "can leave an amount blank if you don't know the cost yet for that item; " +
  "enter 0 only if the actual amount is zero._";

// 3. Expenses — Irregular sub-tab.
export const EXPENSES_IRREGULAR_BLURB =
  "Irregular expenses are one-time or infrequent large expenses that are " +
  "usually large in size, such as vehicles, building works, IT upgrades, or " +
  "one-off projects. The categories and items are pre-populated from the " +
  "TRACE Financial Workbook. **All cells are editable** — you can click the " +
  "item to rename it and click the **ⓘ** to edit its description. If an item " +
  "does not apply in your context, you can remove it by clicking on the red " +
  '"x" at the right end of the row. You may also add an item under any expense ' +
  "category by clicking on **+ Add item** to input the item name and " +
  "description. Please note, you can leave an amount blank if you don't know " +
  "the cost yet for that item; enter 0 only if the actual amount is zero.";

// 4. Revenue — Regular sub-tab (composite Fees + Other Sources).
export const REVENUE_REGULAR_BLURB =
  "Regular revenue is revenue that is received in a regular, recurring way. " +
  "It comes from two sources: **regular revenue from fees** charged for ethics " +
  "reviews (top), and **regular revenue from other sources** such as " +
  "government or institutional subsidies, rental or investment income, etc. " +
  "(bottom). Click a section header to collapse or expand it. For the regular " +
  "revenue from other sources, the categories and items are pre-populated from " +
  "the TRACE Financial Workbook. **All cells in that section are editable** — " +
  "you can click the item to rename it and click the **ⓘ** to edit its " +
  "description. If an item does not apply in your context, you can remove it " +
  'by clicking on the red "x" at the right end of the row. You may also add ' +
  "an item under any revenue category by clicking on **+ Add item** to input " +
  "the item name and description. Please note, you can leave an amount blank " +
  "if you don't know the revenue/income yet for that item; enter 0 only if " +
  "the actual amount is zero.";

// 4. Revenue — Regular sub-tab, inner Fees section blurb (also removed as
// part of the Tier 10 Fees panel rebuild).
export const REVENUE_FEES_BLURB =
  "Enter fee amounts and review counts for each fee type. Revenue is " +
  "computed automatically.";

// 4. Revenue — Irregular sub-tab.
export const REVENUE_IRREGULAR_BLURB =
  "Irregular revenue is one-time, time-limited, or otherwise non-recurring " +
  "funding, such as grants, contracts, other one-time payments. Each row " +
  "captures the funder, amount, start/end dates, and **payment status** " +
  "(whether and when the funds have been received). **All cells are editable** " +
  "— you can click the item to rename it and click the **ⓘ** to edit its " +
  "description. If an item does not apply in your context, you can remove it " +
  'by clicking on the red "x" at the right end of the row. You may also add ' +
  "an item under any revenue category by clicking on **+ Add item** to input " +
  "the item name and description. Please note, you can leave an amount blank " +
  "if you don't know the revenue/income yet for that item; enter 0 only if " +
  "the actual amount is zero.";

// 5. In-Kind — Regular sub-tab.
export const IN_KIND_REGULAR_BLURB =
  "_On this page, please enter the regular annual in-kind contributions " +
  "received by your unit — non-cash support such as donated staff time, " +
  "office space, equipment, or services from federal, institutional, or " +
  "other sources. The categories and items below are pre-populated from the " +
  "TRACE Financial Workbook (in-kind contributions regular tab) and mirror " +
  "the regular expense items. **All cells are editable** — you can click the " +
  "item to rename it and click the **ⓘ** to edit its description. If an item " +
  'does not apply, remove it by clicking the red "x." You may also add an ' +
  "item under any category with **+ Add item**. Select a funding source " +
  "(federal / institutional / other) for each row. Please note, you can leave " +
  "an amount blank if you don't know the value yet; enter 0 only if the " +
  "actual amount is zero._";

// 5. In-Kind — Irregular sub-tab.
export const IN_KIND_IRREGULAR_BLURB =
  "_Irregular in-kind contributions are one-time or infrequent non-cash " +
  "support — for example, a vehicle donated by a federal entity, a one-time " +
  "training delivered free by an institution, or capital equipment given for " +
  "a specific project. Categories and pre-filled items below are drawn from " +
  "the TRACE Financial Workbook (in-kind contributions irregular tab). " +
  "**All cells are editable** — including the item description. Click _See " +
  "more_ on long items to read and edit the full text. Use **+ Add item** " +
  'under any category to add new rows; use the red "x" to remove a row._';
