// Workbook row-1 instructions, verbatim from
// `2026_04_17 financial workbook _WITH dummy numbers_with in kind contributions.xlsx`.
// One entry per sheet column with content. Surfaced in the wizard via <StepInstructions>.
//
// Per Willyanne 2026-05-27 email: the Setup, Risks & Opportunities, and
// Activities steps now use her rewritten instructions (below — WIZARD_SETUP_STEPS,
// WIZARD_RISKS_OPPS_STEPS, WIZARD_ACTIVITIES_STEPS). The KEY_CONSIDERATIONS
// array is kept for historical reference but no longer wired into the wizard.

// Setup step (Willyanne 2026-05-27, mid-day update: Step 1 expanded; Step 3 added).
export const WIZARD_SETUP_STEPS = [
  'Step 1: Select the unit that is doing the planning/budgeting from the two options: National Secretariat/mgmt. or Local IRB Secretariat/mgmt. Please note that it is these Secretariats/management units that budget for the Ethics Committees (i.e., the budget for the actual ethics committee review meetings). The Secretariat/management unit plans for, and disburses the funding (e.g., payments to reviewers) to the Ethics Committee.',
  'Step 2: Select the currency that you would like to use for the financial data entry. This is usually the currency used in your budgets. The dashboard will automatically convert local currency to USD and vice versa.',
  'Step 3: The budget year is filled in for you. It comes from the year you set under Year dates on the Version History page and cannot be changed here. To work in a different year, add that year\'s dates on the Version History page first.',
];

// Key Considerations — Risks & Opportunities (Willyanne 2026-05-27).
export const WIZARD_RISKS_OPPS_STEPS = [
  'Step 1: Select "yes" or "no" from the two options below to convey whether you expect any major financial risks in the next year. Please note, this may be any type of risk that could affect clinical research ethics activities and funding, whether the risk is national in scope (e.g., war or other political instability, out-migration of talent, tariffs, inflation, austerity measures) or specific to clinical research (e.g., loss of international funding, major pension payout for ethics staff, fewer trials). Then describe in the text box what risks you foresee (if you selected yes) or why you don\'t foresee any risks (if you answered no).',
  'Step 2: Select "yes" or "no" from the two options below to convey whether you expect any major financial opportunities in the next year. Please note, this may be any type of opportunity that could affect clinical research ethics activities and funding, whether the opportunity is national in scope (e.g., increased political stability, in-migration of talent) or specific to clinical research (e.g., increase in international funding or economic investment). Then describe in the text box what opportunities you foresee (if you selected yes) or why you don\'t foresee any opportunities (if you answered no).',
  'Step 3: List the data sources (i.e., document name and date, weblink and specific place on the webpage) on which you based your assessment of risks and opportunities.',
  'Step 4: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. If you don\'t have any notes, please write "NA."',
];

// Key Considerations — Activities (Willyanne 2026-05-27).
export const WIZARD_ACTIVITIES_STEPS = [
  'Step 1: Review the pre-populated list of activities in the "Activities column". Each activity has a pre-populated description you can see when you click on the "i" circle.',
  'Step 2: Both the pre-populated activity names and descriptions are editable. Please make any edits that reflect the ethics activities in your country. You may also remove any activity from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an activity that is not in the pre-populated list by clicking on "add item" at the bottom of the activity list and then writing in the activity name and description.',
  'Step 3: For each activity in the activity list, use the drop-down list to select whether you expect effort for that activity to remain the same, increase, or decrease in the short-term (next year). Consider whether you will be adding tasks (e.g., you are not currently doing one or more of the tasks in the list for that activity) or "scaling-up" effort on tasks (e.g., you are not completing the tasks as fully as you would wish).',
  'Step 4: For each activity in the activity list, use the drop-down list to select whether you expect effort for that activity to remain the same, increase, or decrease over the long-term (next 3-5 years). Consider whether you will be adding tasks or "scaling-up" effort on tasks.',
  'Step 5: List the data sources (i.e., document name and date, weblink and specific place on the webpage) on which you based your assessment.',
  'Step 6: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. If you don\'t have any notes, please write "NA."',
];

export const KEY_CONSIDERATIONS = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that you are planning/budgeting for from the drop down list in the cells for "Unit."',
  'Step 3: In the cell directly below, select "yes" or "no" from the drop-down list whether you expect any major financial risks in the next year. Please note, this may be any type of risk that could affect clinical research ethics activities and funding, whether the risk is national in scope (e.g., war or other political instability, out-migration of talent, tariffs, inflation, austerity measures) or specific to clinical research (e.g., loss of international funding, major pension payout for ethics staff, fewer trials).',
  'Step 4: In the cell directly below, select "yes" or "no" from the drop-down list whether you expect any major financial opportunities in the next year. Please note, this may be any type of opportunity that could affect clinical research ethics activities and funding, whether the opportunity is national in scope (e.g., increased political stability, in-migration of talent) or specific to clinical research (e.g., increase in international funding or economic investment).',
  'Step 5: If you selected "yes" in Step 3 or 4, please explain which risks and/or opportunities you feel will impact ethics review of clinical trials, and how significantly you think that risk and/or opportunity will have an impact.',
  'Step 6a: Review the pre-populated list of activities below. Please review in tandem with the activity description.',
  'Step 6b: Review the pre-populated list of activity descriptions. Please review in tandem with the activity list.',
  'Step 7: For each activity in the activity list, use the drop-down list to select whether you expect effort for that activity to remain the same, increase, or decrease in the next year. Consider whether you will be adding tasks (e.g., you are not currently doing one or more of the tasks in the list for that activity) or "scaling-up" effort on tasks (e.g., you are not completing the tasks as fully as you would wish).',
  'Step 8: For each activity in the activity list, use the drop-down list to select whether you expect effort for that activity to remain the same, increase, or decrease over the next 3-5 years. Consider whether you will be adding tasks or "scaling-up" effort on tasks.',
  'Step 9: Elaborate on why you selected "remain the same," "increase," or "decrease" for each activity.',
  'Step 10: List the data source (i.e., document name and date, weblink and specific place on the webpage) that documents activity planning.',
  'Step 11: PLEASE add any comments that will be helpful to others looking at this worksheet.',
];

// Expenses Regular — Willyanne 2026-05-27 mid-day rewrite. Six steps; her
// numbering jumps 3b → 7 → 8 to map to the workbook column structure.
export const EXPENSES_REGULAR = [
  'Step 1: Review the regular expense categories listed below. These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff.',
  'Step 2: Review the regular expense items listed below. These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Please review this list in tandem with the item descriptions in the "i" circle in the same row as the item name. Both the pre-populated item names and descriptions are editable. Please make any edits that reflect the regular expense items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the activity name and description.',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Please note, IF you will be documenting in-kind contributions that are "off-budget," you will list the portion of the full regular expense that is "donated" on the In-kind Contribution Regular page. An in-kind contribution is where an entity (the federal government, an institution such as a University, or another source) "gives" the Secretariat/NEC/IRB personnel time, an office, office supplies, or other items the Secretariat/mgmt. unit does not have to pay for from their regular or irregular budget. For example, if the government gives the Secretariat office space valued at $20,000/year, list $0 on this Expenses Regular page in the row for rent AND then put $20,000 in the row for rent on the In-kind Contributions Regular page.',
  'Step 4: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the expense item estimate.',
  'Step 5: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. This is especially important to describe each expense item (e.g., it is helpful to list the number and type of staff that make up the "salaries" expense), and any calculations you make to derive an expense (e.g., 3 staff at $30,000 each = $90,000 for salaries). IF you will be documenting in-kind contributions, you will need to document the distinction between what is captured on this Expenses Regular page and what is captured on the In-kind Contributions Regular page.',
];

// Expenses Irregular — Willyanne 2026-05-27 evening rewrite. UI-aligned
// (collapses workbook's 6a/6b/6c/6d/7a/7b into single currency-aware amount
// field). Same pattern as EXPENSES_REGULAR mid-day rewrite.
export const EXPENSES_IRREGULAR = [
  'Step 1: Review the irregular expense categories below. The list is pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Irregular expenses are those that are not regularly charged on an annual, or less than annual, basis. Irregular expenses are generally large one-time (or long term, such as every 5 years) expenses.',
  'Step 2: Review the irregular expense items listed below. These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Please review this list in tandem with the item descriptions in the "i" circle in the same row as the item name. Both the pre-populated item names and descriptions are editable. Please make any edits that reflect the irregular expense items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the item name and description.',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Please note, IF you will be documenting in-kind contributions that are "off-budget," you will list the portion of the full irregular expense that is "donated" on the In-kind Contributions Irregular page. An in-kind contribution for an irregular expense is where an entity (the federal government, an institution such as a University, or another source) "gives" the Secretariat/NEC/IRB irregularly purchased items the Secretariat/mgmt. unit does not have to pay for from their irregular budget. You can add rows if you have multiple in-kind contributions for the same item. For example, if there are in-kind contributions to capital costs (durable goods) from both the federal government (e.g., the government donates a vehicle for permanent use by the Secretariat) and from other sources (e.g., an NGO donates a vehicle for permanent use), you would add an additional row for capital costs (durable goods) for each additional source. You will need to make sure to check against the Expenses Irregular page. If you do not receive in-kind contributions of the type listed in that row, or you do not want to track that type of in-kind contribution, leave the cell in the "Category" column blank for that item purpose/activity.',
  'Step 3c: Please note that the in-kind contribution you list may only partially cover the full irregular expense for that item. For example, it may be that the one-time IT upgrade is made possible not only by a grant to the Secretariat that pays for an IT consultant that costs $100,000, but also by the "donated" work of a consultant that gives one-time support for the IT upgrade (valued at $20,000). You would then list on the In-kind Contributions Irregular page the value of the consultant\'s time for the duration of the IT upgrade in the row for the item "Capital costs (one-time IT upgrade)" and list on the Expenses irregular page the $100,000 that the Secretariat pays out of their budget for the IT consultant. You will need to be careful because in-kind contributions for the irregular budget should only be contributions that are not covered by any irregular funding source (e.g., grants, federal subsidies) that the Secretariat/NEC/local IRB uses to pay for that one-time capital cost.',
  'Step 4: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the expense item estimate.',
  'Step 5: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. IF you will be documenting in-kind contributions, you will need to document the distinction between what is captured on this Expenses Regular page and what is captured on the In-kind contributions Regular page.',
];

// Regular Revenue from Fees — Willyanne 2026-05-28 evening rewrite (in
// plane-to-London email). Replaces the prior 17-step workbook-verbatim block.
// Maps to the new Tier 10 Fees panel (15 review-type rows, 9 funder/student
// $/# column pairs, editable headers, auto-calc). Silent typo fixes:
// her two consecutive "Step 3" lines split to "Step 3a" / "Step 3b" (her own
// numbering pattern from other panels); "the numb of review" → "the number
// of reviews"; "in the ear you designated" → "in the year you designated".
export const FEES_MODEL_FORM = [
  'Step 1a: Review the Review types in the first column of the fee table below. The list is pre-populated by the MRCT Center, based on review of country fee structures and discussion with country staff. Please note that when the term "(any)" is used, that means that the country does not disaggregate that category. For example, in the column for review type, "Initial (any)" means that the country does not disaggregate initial review into subtypes of initial review (e.g., minimal risk vs >minimal risk; or non-clinical trial vs. clinical trial, which we assume to be the same as minimal risk vs >minimal risk).',
  'Step 1b: Please note that by "Reg." we mean regular timeframe for the review. By "Accel." we mean an accelerated, or fast track (sometimes called expedited) timeframe for review where the entity submitting the proposal pays a higher charge for the "Accel." Review.',
  'Step 1c: If your country does not disaggregate initial review by "risk level" of the study, you can remove the rows for "Initial (>min risk) Reg.", "Initial (>min risk) Accel.", "Initial (min risk) Reg.", and "Initial (min risk) Accel." by clicking on the red "x" at the far right of the rows for those review types. If your country does not disaggregate by Amendment type (and thus you would be filling in the "Amendment (any)" rows), you can remove the rows for "Amendment (minor) Reg.", "Amendment (minor) Accel.", "Amendment (major) Reg." and "Amendment (major) Accel." by clicking on the red "x" at the far right of the rows for those review types.',
  'Step 1d: Please note that if your country does not have an option for accelerated review, you would only fill in the rows for "Reg." review. Please note, while the Fee Model focused only on Initial review, non-human subjects/exempt review, continuing review, and amendments, in order to simplify the fee model and better enable discussions among countries, the fee table in the dashboard below also includes rows under Review type for Extension, Penalty, and Appeal or Resubmission. This is intentional so that countries can more completely account for their revenue from fees.',
  'Step 2a: Review the column headers to the right of Review type. These are different ways that countries disaggregate review fees, that are in addition to the review type. Please note that when the term "(any)" is used, that means that the country does not disaggregate that category. For example, "Pro (any) $" means that the country does not disaggregate professional (i.e., non-student) studies by type of funder (e.g., industry, institutional, govt.) for the fee charged. A country that charges the same fee no matter the student type would use the column for "Stud. (any) $".',
  'Step 2b: Please note that by "Pro" we mean professional (i.e., non-student) studies, and by "Stud." we mean student studies.',
  'Step 2c: Please note that by "$" we mean the financial fee amount charged by the country for that fee type. For example, "Pro Industry $" means the fee charge for Professional studies funded by industry. By "#" we mean the number of reviews conducted in the year you listed on the Setup page for that review type. For example, "Pro Industry #" means the number of professional studies funded by industry that were reviewed by the Ethics Committee in the year you designated on the Setup page.',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Enter in the number of reviews (#) for each row/column "box" combination that is appropriate for your country\'s fee table.',
  'Step 4: List the data sources (i.e., document name and date, weblink and specific place on the webpage) you used. For the regular revenue from fees, make sure to list in the data sources box the sources for BOTH the fee ($) estimates and the number of review (#) estimates.',
  'Step 5: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section.',
];

// Revenue Regular (other) — Willyanne 2026-05-27 evening rewrite. UI-aligned
// (collapses workbook's 6a/6b/6c/6d into single currency-aware amount field).
export const REVENUE_REGULAR_OTHER = [
  'Step 1: Review the regular revenue categories below.',
  'Step 2: Review the regular revenue items listed below. These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. (Note that these are currently blank and we have left room for two items under each category). Both the pre-populated item names and descriptions in the "i" circle are editable. Please make any edits that reflect the revenue items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the item name and description.',
  'Step 3: Enter the revenue amount for each item. You will have selected the currency that you want to use for the dashboard on the Setup tab. Once you enter in the revenue amount the program will automatically carry out a currency conversion. You can leave an amount blank if you don\'t know the cost yet for that item; enter 0 only if the actual amount is zero.',
  'Step 4a: Write in the expected or actual start date of the revenue (funding).',
  'Step 4b: Write in the expected or actual end date of the revenue (funding).',
  'Step 5: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the expense item estimate.',
  'Step 6: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. Please be careful to list any calculations that you have made when you listed your revenue amounts.',
];

// Irregular Revenue — Willyanne 2026-05-28 evening rewrite (in plane-to-London
// email). Replaces the prior 14-line workbook-verbatim block. UI-aligned and
// matches the new Revenue Irregular sub-tab structure. NOTE: Step 5 says
// "expense item estimate" in a Revenue context — flagged for her review.
export const REVENUE_IRREGULAR = [
  'Step 1: Review the irregular revenue categories below. The list is pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Irregular revenues are those that are not regularly obtained by the unit through mechanisms such as grants or contracts, and are generally large one-time (or long term, such as every 3-5 years) revenues.',
  'Step 2: Review the irregular revenue items listed below. These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. (Note that these are currently blank and we have left room for two items under each category). Please make any edits that reflect the revenue items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the item name and description.',
  'Step 3: Enter the irregular revenue amount for each item. You will have selected the currency that you want to use for the dashboard on the Setup tab. Once you enter in the irregular revenue amount the program will automatically carry out a currency conversion. You can leave an amount blank if you don\'t know the cost yet for that item; enter 0 only if the actual amount is zero.',
  'Step 4a: Write in the expected or actual start date of the irregular revenue (funding).',
  'Step 4b: Write in the expected or actual end date of the irregular revenue (funding).',
  'Step 5: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the expense item estimate.',
  'Step 6: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. Please be careful to list any calculations that you have made when you listed your revenue amounts.',
];

// Regular In-Kind Contributions — Willyanne 2026-05-28 evening rewrite (in
// plane-to-London email). Replaces the prior workbook-verbatim block.
// UI-aligned (mirrors EXPENSES_REGULAR row structure). Silent typo fixes
// per the approved go-forward policy: "One you enter" → "Once you enter";
// "In-Kknd" → "In-Kind"; "Select the select" → "Select"; "but it generally"
// → "but it is generally"; "for each item.." → "for each item.";
// "expensive item" → "expense item"; "may up" → "make up"; "apge" → "page".
export const IN_KIND_REGULAR = [
  'Step 1: Review the regular expense categories listed below, which we are using to show in-kind contributions toward regular expenses (you will notice that for in-kind contributions we have mirrored the same categories and items that you see on the Expense Regular page). These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff.',
  'Step 2: Review the regular expense items listed below, which we are using to show in-kind contributions toward regular expenses (you will notice that for in-kind contributions we have mirrored the same categories and items that you see on the Expense Regular page). These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Please review this list in tandem with the item descriptions in the "i" circle in the same row as the item name. Both the pre-populated item names and descriptions are editable. Please make any edits that reflect the expense items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the activity name and description.',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Please note, IF you will be documenting in-kind contributions that are "off-budget," you will list the portion of the full regular expense that is "donated" on this In-kind Contributions Regular page. An in-kind contribution is where an entity (the federal government, an institution such as a University, or another source) "gives" the Secretariat/NEC/IRB personnel time, an office, office supplies, or other items the Secretariat/mgmt. unit does not have to pay for from their regular or irregular budget. For example, if the government gives the Secretariat office space valued at $20,000/year, list $0 on this Expenses Regular page in the row for rent AND then put $20,000 in the row for rent on this In-kind Contributions Regular page.',
  'Step 4: Select the entity/s that gives the in-kind contributions in the box for Funding source, for each item where you have listed an in-kind contribution. Federal indicates a government source, Institution indicates a University source or other institutional source (such as an NGO), and Other can be anything else but it is generally used for in-kind contributions by staff such as the "cost" for use of their personal vehicle for site visits or the "cost" for their unpaid overtime.',
  'Step 5: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the in-kind contribution estimate for each item.',
  'Step 6: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. This is especially important to describe each expense item (e.g., it is helpful to list the number and type of staff that make up the "salaries" expense), and any calculations you make to derive an expense. For example, "Assuming 5 regular employees, at about $30,000 per employee (listed on the Expenses Regular page). Assuming 2 part-time (50% time) government staff supporting the Secretariat (listed on this In-kind Contribution page- so the calculation for the first salaries item of $30,000 on this page comes from 2 government staff x 30,000 salary x 0.5 (i.e., 50% time). Also assuming that 2 personnel are working 20% overtime, and if they were to be paid for that overtime, it would be at their regular hourly rate and not an overtime rate (so the calculation for the second salaries item is 2 unit staff x 30000 salary x 0.2= 12,000)(listed on this In-kind Contributions Regular page).',
];

// Irregular In-Kind Contributions — Willyanne 2026-05-28 evening rewrite (in
// plane-to-London email). Replaces the prior workbook-verbatim block.
// UI-aligned (mirrors EXPENSES_IRREGULAR row structure). Silent typo fixes:
// added missing ")" after "Expense Irregular page" in Step 1 and Step 2.
// NOTE: Step 4 says "expense item estimate" in an In-Kind context —
// flagged for her review.
export const IN_KIND_IRREGULAR = [
  'Step 1: Review the irregular expense categories below, which we are using to show in-kind contributions toward irregular expenses (you will notice that for in-kind contributions we have mirrored the same categories and items that you see on the Expense Irregular page). The list is pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Irregular expenses are those that are not regularly charged on an annual, or less than annual, basis. Irregular expenses are generally large one-time (or long term, such as every 5 years) expenses.',
  'Step 2: Review the irregular expense items listed below, which we are using to show in-kind contributions toward irregular expenses (you will notice that for in-kind contributions we have mirrored the same categories and items that you see on the Expense Irregular page). These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Please review this list in tandem with the item descriptions in the "i" circle in the same row as the item name. Both the pre-populated item names and descriptions are editable. Please make any edits that reflect the expense items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the item name and description.',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Please note, IF you will be documenting in-kind irregular contributions that are "off-budget," you will list the portion of the full irregular expense that is "donated" on this In-kind Contribution Irregular page. An in-kind contribution for an irregular expense is where an entity (the federal government, an institution such as a University, or another source) "gives" the Secretariat/NEC/IRB irregularly purchased items the Secretariat/mgmt. unit does not have to pay for from their irregular budget. You can add rows if you have multiple in-kind contributions for the same item. For example, if there are in-kind contributions to capital costs (durable goods) from both the federal government (e.g., the government donates a vehicle for permanent use by the Secretariat) and from other sources (e.g., an NGO donates a vehicle for permanent use), you would add an additional row for capital costs (durable goods) for each additional source. You will need to make sure to check against the Expenses Irregular page. If you do not receive in-kind contributions of the type listed in that row, or you do not want to track that type of in-kind contribution, leave the cell in the "Category" column blank for that item purpose/activity.',
  'Step 3c: Please note that the in-kind contribution you list may only partially cover the full irregular expense for that item. For example, it may be that the one-time IT upgrade is made possible not only by a grant to the Secretariat that pays for an IT consultant that costs $100,000, but also by the "donated" work of a consultant that gives one-time support for the IT upgrade (valued at $20,000). You would then list on this In-kind Contributions Irregular page the value of the consultant\'s time for the duration of the IT upgrade in the row for the item "Capital costs (one-time IT upgrade)" and list on the Expenses Irregular page the $100,000 that the Secretariat pays out of their budget for the IT consultant. You will need to be careful because in-kind contributions for the irregular budget should only be contributions that are not covered by any irregular funding source (e.g., grants, federal subsidies) that the Secretariat/NEC/local IRB uses to pay for that one-time capital cost.',
  'Step 4: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the expense item estimate.',
  'Step 5: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. IF you will be documenting in-kind contributions, you will need to document the distinction between what is captured on the Expenses Irregular page and what is captured on this In-kind Contributions Irregular page.',
];

export const SUMMARY_REGULAR = [
  'Step 1: Review the total number of initial [non-student] reviews (more than minimal risk + minimal risk) conducted in the last year.',
  'Note: We do not yet have an overall score for ethics maturity level, like there is for regulatory maturity level. If it is determined that one could be calculated, the MRCT Center will enter it in the cell below.',
  'Note: The financial maturity level is a placeholder, and does not need to be filled out until after materials are developed by the MRCT Center to support assessment of financial maturity level.',
  'Step 2: Review whether there are financial risks or opportunities in the near-term. This information is drawn from the Key considerations worksheet, where there is more information.',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Review the number of ethics activities with expected LOE decrease for the short term (next year). The information in this cell is drawn from the Key considerations worksheet.',
  'Step 4a: Consider the number of reviews in the short-term, risks/opportunities, and # of ethics activities with expected LOE increase and decrease. You might also look at the In-kind contributions_regular worksheet to see the extent to which regular expenses are currently being covered "off-book." After considering these factors, please estimate how much you think the budget should increase (or decrease by) to maintain current ethics review operations, compensate for any near-term risks/take advantage of opportunities, and address scale-up of ethics activities in the next year.',
  'Step 4b: Please explain your reasoning for your short-term forecast. If you forecast an increase, what regular expense items do you expect to add to the annual budget? Please be specific, for example by giving the expected position title/s of any new hire/s.',
  'Step 6: Review the REGULAR BUDGET GAP (excluding forecast). This is the gap between total expenses and revenues for the REGULAR (i.e., standard) operating budget. Please note that irregular expenses and irregular revenues (e.g., grants) are covered on the Summary sheet (irregular).',
  'Step 7: If there is GAP, consider if there is a surplus from the Summary (irregular) sheet that will cover it. This will show up in the COMBINED GAP analysis. However, the regular and irregular budget may not be able to be combined so easily, because some or all of the irregular revenue can only be used for specific purposes/activities.',
];

export const SUMMARY_IRREGULAR = [
  'Step 1: Enter in the target for total number of initial [non-student] reviews to be conducted 3-5 years from now (i.e., the number of reviews for one year, that is 3-5 years in the future).',
  'Note: We do not yet have an overall score for ethics maturity level. If it is determined that one could be calculated, the MRCT Center will enter the target scope (after discussion with the country) in the cell below.',
  'Note: The financial maturity level is a placeholder, and does not need to be filled out until after materials are developed by the MRCT Center to support assessment of financial maturity level.',
  'Note: Risks and opportunities are difficult to estimate for the long-term, and therefore you do not need to complete this step.',
  'Step 2a: Review the number of ethics activities with expected LOE increase for the long term (next 3-5 years).',
  'Step 2b: Review the number of ethics activities with expected LOE decrease for the long term (next 3-5 years).',
  'Step 3a: Click "View" on any file to see what is in it without changing anything. "Start editing" is only available on the single most recent file -- whichever Original, Midpoint, Final, or draft was most recently saved. Clicking it opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. Older files stay viewable but are never directly editable, which keeps edits from branching off an outdated version. The tool automatically keeps only the 5 most recent drafts since the last milestone.',
  'Step 3b: Please explain your reasoning for your long-term forecast. If you forecast an increase, what irregular expense items (such as purchase of a new vehicle) do you expect to add?',
  'Step 4: Review the summary irregular revenues. Does the amount cover all of the summary expenses (irregular)? Is there a surplus or deficit?',
  'Step 5: Look at what you entered for your long-term forecast. What would you prioritize most in the existing budget, and what would you advocate is most important for additional funding?',
];

// 2026-10-05 revised instructions: replaces the Summary-sheet-based review
// instructions above (which described a step that no longer exists) with
// steps that match the actual Review & Submit screen -- checking the grey
// Summary box, naming the draft, documenting changes, and submitting.
export const REVIEW_SUBMIT_STEPS = [
  'Step 1: Review the grey Summary box below, which shows a read-only overview of everything entered in this draft so far. Check it against what you intended to enter before submitting.',
  'Step 2: In the "Name this draft" box, give this draft a short, recognizable title (guidance: 50 characters or fewer), such as "2026 Q2 budget update" or "2026 Q2 budget update_edits (1)."',
  'Step 3: In the "Document changes" box, briefly describe the main edits made in this version (guidance: fewer than 100 characters). This note shows up next to the draft in Version History so others can see what changed at a glance.',
  'Step 4: Click Submit to save this as a new draft. When it is saved, click "Go to Version History" to see it listed under its year, labeled "New draft" with the file it was based on (for example, "New draft-Original").',
  'Step 5: Anyone who later opens that draft with "View" in Version History will see your changes highlighted in purple on the pages where you made them. You can also click "Show changes" on any Inputs page to see what changed.',
];

// Version History page instructions (2026-10-05). Steps 3b (Midpoint file)
// and 3c (Final file) are deliberately left as placeholders -- Hayat asked
// to leave them blank for now and send the real text later; do not invent
// content for these two steps.
export const VERSION_HISTORY_STEPS = [
  'Step 1: Set the Year dates for Original, Midpoint, and Final above: enter the four-digit year, add an optional note (for example, if your year is a fiscal year, "The 2026 file is for fiscal year 2026, which runs April 1, 2026 through March 31, 2027"), pick the three dates, and click "Save dates." Click "Edit" next to any saved date to change it, or "Delete" to remove a whole year\'s dates (saved files for that year are not deleted). A year that already has dates cannot be entered again. To change it use Edit, or enter a new year such as 2027. These dates don\'t have to span January 1 to December 31. For example, your year could start March 15, reach its midpoint September 1, and close with a Final on January 30.',
  'Step 2: The year in the Master file section fills in automatically from the Year dates you set above, and you cannot type a different year there. To create your first Original with your data in it, set the year dates, go to Inputs, enter your data, and click "Submit as [year] Original" on the Review page. That first submit is saved as the Original. ("Save as Original" on this page instead saves whatever is currently loaded, which may be blank.) Once an Original is saved for that year, the button is greyed out and the year box clears until you set dates for a new year. The year you set here also becomes the locked budget year on the Inputs Setup page.',
  'Step 3a: Saved files are listed in tabs by year, newest first, and within each tab from newest to oldest. Each row shows the year, the type of file (Original, Midpoint, Final, or "New draft" followed by the file it was based on, for example "New draft-Original"), the title, the date and time, the notes, and the author. Click "View" to open everything in that file exactly as saved, on every Inputs page, without being able to change anything. Edits made in a draft show in purple. "Start editing" is only available on the single most recent file. It opens the Inputs section at Setup with that file\'s information. Nothing is saved, and no new draft is created, until you make your edits, name the draft, describe your changes, and click Submit. If you change your mind, click "Back to Version History" at the top of any Inputs page. The tool automatically keeps only the 5 most recent drafts since the last Original, Midpoint, or Final.',
  'Step 3b: When you are ready to check in partway through the year, click "Save as Midpoint." This button stays greyed out until a Midpoint date is set for the year. If you click it before that date has arrived, nothing is saved. You will be asked to wait or to edit the date above. Once it is saved, the Midpoint takes whatever is currently in the most recent draft (or the Original, if you have not made any drafts yet) and keeps it permanently. Only one Midpoint is allowed per year. Editing the file afterward only creates new drafts on top of it. The Midpoint stays exactly as it was when you saved it.',
  'Step 3c: When you are ready to close out the year, click "Save as Final." It works like the Midpoint: it stays greyed out until a Final date is set, asks you to wait or edit the date above if the date has not arrived, and allows only one Final per year. Any edits made afterward create new drafts and never change the saved Final.',
  'Step 4: The red × at the far right of a draft\'s row deletes that draft. Any representative with access to this country can delete any draft, not only the one they created. Original, Midpoint, and Final files cannot be deleted. (The one exception is the Nyika II demo, where administrators can delete any file.)',
];

export const VERSION_HISTORY_NOTE =
  "For the demo version Nyika II only: everyone starts from the same default 2026 Original, which only administrators can change. You can also add year dates for other years (for example 2027) and save your own Original, Midpoint, and Final for them to practice starting a new year from a Final file. Those years and files are private to you. When you start editing, you work on your own private copy, so what you enter does not affect anyone else and what others enter does not affect you. You will see the default Original and the Midpoint, Final, and draft files that YOU created, but not the files other testers create. Your Sandbox scenarios are also private to you. For the country files, only authorized representatives for that country can view/edit those files, and they can see the files and Sandbox scenarios that fellow country representatives created/edited.";

// Map each wizard step to the relevant sheet(s) from the workbook.
// `note` is an optional banner shown above the instructions when the dashboard
// step doesn't map cleanly to the workbook structure.
export const WIZARD_STEP_INSTRUCTIONS = {
  setup: {
    note: 'Use "Back to Version History" at the top of any Inputs page to leave without submitting. What you have typed stays saved in this browser until you click "Clear current draft edits" (which removes only your unsubmitted typing, not files already submitted). Once a file has been submitted, you can click any tab at the top to move between pages without using Next.',
    sheets: [
      { name: "Setup", lines: WIZARD_SETUP_STEPS },
    ],
  },
  keyconsid: {
    sheets: [
      { name: "Risks & Opportunities", lines: WIZARD_RISKS_OPPS_STEPS },
      { name: "Activities", lines: WIZARD_ACTIVITIES_STEPS },
    ],
  },
  expenses: {
    note: 'The Data source and Notes / calculations boxes are required on both the Regular and Irregular tabs before you can click Next. The message under the boxes lists only what is still empty.',
    sheets: [
      { name: "Regular expenses", lines: EXPENSES_REGULAR },
      { name: "Irregular expenses.", lines: EXPENSES_IRREGULAR },
    ],
  },
  revenue: {
    note: 'The Data source and Notes / calculations boxes are required on both the Regular and Irregular tabs before you can click Next. The message under the boxes lists only what is still empty.',
    sheets: [
      { name: "Regular revenue from fees", lines: FEES_MODEL_FORM },
      { name: "Regular revenue from other sources", lines: REVENUE_REGULAR_OTHER },
      { name: "Irregular revenue", lines: REVENUE_IRREGULAR },
    ],
  },
  inKind: {
    note: 'The Data source and Notes / calculations boxes are required on both the Regular and Irregular tabs before you can click Next. The message under the boxes lists only what is still empty.',
    sheets: [
      { name: "Regular In-Kind Contributions", lines: IN_KIND_REGULAR },
      { name: "Irregular In-Kind Contributions", lines: IN_KIND_IRREGULAR },
    ],
  },
  review: {
    sheets: [
      { name: "Review & Submit", lines: REVIEW_SUBMIT_STEPS },
    ],
  },
};

// Separate from WIZARD_STEP_INSTRUCTIONS since the Version History page isn't
// a wizard step -- consumed directly by VersionHistory.jsx.
export const VERSION_HISTORY_STEP_INSTRUCTIONS = {
  note: VERSION_HISTORY_NOTE,
  sheets: [
    { name: "Version history", lines: VERSION_HISTORY_STEPS },
  ],
};

// Budget Forecast instructions for the Forecast Results tab. Willyanne's final
// wording (2026-07-01 afternoon), verbatim. Her drop-down paragraph (which sat
// between Steps 2 and 3 in her note) is folded onto the end of Step 2 since the
// step list renders as a numbered <ol>. Shaped for <StepInstructions>:
// { note, sheets: [{ name, lines }] }.
export const FORECAST_STEPS = [
  'Step 1: Review the activity outlook on the Activities tab first. How many of your activities do you expect increase, how many will stay the same, and how many will decrease in effort?',
  'Step 2: For the near term (next year), use the drop-down to select how much you expect your regular operating budget to change. If increasing or decreasing activities, what will you need (or what could you reduce) for those changes (e.g., more staff, more training, more vehicles, office space, etc.)? Your budget forecast should follow from that picture. Please note that the forecast you choose is an "educated guess." It does not have to be exact. The point of the forecasting is to give you a general idea of expected increase (or decrease) so that you can plan. The forecast drop-down list runs from "Remain the same" through increases and decreases in set percentage bands. If your expected change is larger than any band, choose the "more than 100%" option and type the exact percentage.',
  'Step 3: In the reason box, explain WHY you chose that drop-down option (e.g., remain the same, or a specific percentage increase or decrease). Be specific. For example, if you will be adding a new permanent staff position, give the position/title, because that affects the estimated salary.',
  'Step 4: Repeat Steps 2 and 3 for the long term (the next 3–5 years).',
  'Step 5: Review the projection boxes. They show your current regular expenses, the projected expenses at the percentage you chose, and the projected gap (revenue minus projected expenses). Use these to double-check whether your forecast seems realistic.',
];

export const FORECAST_INSTRUCTIONS = {
  sheets: [
    { name: "Budget Forecast", lines: FORECAST_STEPS },
  ],
};
