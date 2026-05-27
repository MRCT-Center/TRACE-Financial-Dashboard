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
  'Step 3: Enter in the year for the budget data that you are entering.',
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
  'Step 2: Review the regular expense items listed below. These have been pre-populated by the MRCT Center, based on review of country budget structures and discussion with country staff. Please review this list in tandem with the item descriptions in the "i" circle in the same row as the item name. Both the pre-populated item names and descriptions are editable. Please make any edits that reflect the expense items in your country. You may also remove any item from the pre-populated list that doesn\'t apply by clicking on the red "x" at the far right in each row, and/or you may add an item that is not in the pre-populated list by clicking on "add item" and then writing in the activity name and description.',
  'Step 3a: Enter the expense amount for each item. You will have selected the currency that you want to use for the dashboard on the Setup tab. Once you enter in the expense amount the program will automatically carry out a currency conversion. You can leave an amount blank if you don\'t know the cost yet for that item; enter 0 only if the actual amount is zero.',
  'Step 3b: Please note, IF you will be documenting in-kind contributions that are "off-budget," you will list the portion of the full regular expense that is "donated" on the in-kind contribution_regular worksheet. An in-kind contribution is where an entity (the federal government, an institution such as a University, or another source) "gives" the Secretariat/NEC/IRB personnel time, an office, office supplies, or other items the Secretariat/mgmt. unit does not have to pay for from their regular or irregular budget. For example, if the government gives the Secretariat office space valued at $20,000/year, list $0 on this Expenses Regular page in the row for rent AND then put $20,000 in the row for rent on the In-kind contributions Regular page.',
  'Step 7: List the data sources (i.e., document name and date, weblink and specific place on the webpage) for the expense item estimate.',
  'Step 8: List any notes that will help others (e.g., other staff in your unit) understand more about your choices in this section. This is especially important to describe each expense item (e.g., it is helpful to list the number and type of staff that make up the "salaries" expense), and any calculations you make to derive an expense (e.g., 3 staff at $30,000 each = $90,000 for salaries). IF you will be documenting in-kind contributions, you will need to document the distinction between what is captured on this Expenses Regular page and what is captured on the In-kind contributions Regular page.',
];

export const EXPENSES_IRREGULAR = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that you are planning/budgeting for from the drop down list in the cells for "Unit."',
  'Step 3: Review the irregular expense categories below. The list is pre-populated by the MRCT Center. Irregular expenses are those that are not regularly charged on an annual, or less than annual, basis. Irregular expenses are generally large one-time (or something like one in 5 years) expenses. You are welcome to add additional rows with other types of large [irregular] capital costs that apply in your situation.',
  'Step 4: IF the country has the irregular expense category listed in the adjacent cell in step 3, enter in the purpose/activities for that item.',
  'Step 5: IF the country has the irregular expense category listed in this row in step 3, and the expected funding source is a federal or institutional source, please list the department within the government or institution that you expect will provide the funding.',
  'Step 6a: Enter the expense in local currency if your country primarily uses local currency. Note about in-kind: whereas this expenses_irregular sheet shows what the Secretariat/NEC/local IRB pay for out of their own budget (usually after receiving irregular revenue such as grants), the in-kind contributions_irregular worksheet tracks what is "off-budget." IMPORTANT: PLEASE WRITE NOTES in the notes column explaining the division in funding for each purpose/activity between the expenses_irregular worksheet and the in-kind contributions_irregular worksheet.',
  'Step 6b: Select from the drop-down list in each cell for "Expense currency" the currency in which the irregular expense is listed in the country budget.',
  'Step 6c: List the exchange rate for local currency to USD.',
  'Step 6d: Enter the expense in USD if your country primarily uses USD in its budget reports.',
  'Step 7a: List the expected or actual start date of the irregular expense. For a vehicle or large renovation list the start date as the date received/completed, and the end date as the end of the life of that vehicle or other capital good (e.g., vehicles usually last 10 years, a one-time IT upgrade may be sufficient for five years before another large upgrade is needed).',
  'Step 7b: List the expected or actual end date of the revenue (funding).',
  'Step 8: Review carefully the item descriptions listed below. These have been pre-populated by the MRCT Center, and are examples of possible irregular expenses. Please review this list in tandem with the item column. If you believe the item description should be more detailed or changed, please edit and describe how you edited in the notes/comments column.',
  'Step 9: List the data source (i.e., document name and date, weblink and specific place on the webpage) that documents each listed revenue (funding) source.',
  'Step 10: Add any comments that will be helpful to others looking at this worksheet.',
];

export const FEES_MODEL_FORM = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that you are planning/budgeting for from the drop down list in the cells for "Unit."',
  'Step 3: Review the fee types listed below. These have been pre-populated in line with the options in the draft fee model. The same review type will be listed multiple times even if the fee charged is the same, because the fee charged could be (and in some countries is) different for the same fee type depending on whether the type of fee is for a professional or student, or how the study is funded. See the fee model PowerPoint for more information about fee type, and definitions of initial review, minimal risk vs more than minimal risk review, and major vs minor amendments.',
  'Step 4: Review the timeframe selections below. Use the drop-down list in each cell to correct any errors. Please note that the MRCT Center input the selection "regular" if the country fee structure did not specify a timeframe. The MRCT Center also disaggregated timeframe into regular and accelerated, even if the fee charged is the same, because the fee charged could be (and in some countries is) different for different timeframes.',
  'Step 5: Review the investigator type selections below. Use the drop-down list in each cell to correct any errors. Please note that the MRCT Center input the selection "professional" if the country fee structure did not specify an investigator type. The MRCT Center also disaggregated students into International students, PhD, MA, and BA students, because the fee charged could be (and in some countries is) different for different types of students.',
  'Step 6: Review the funder type selections below. Use the drop-down list in each cell to correct any errors. Please note that the MRCT Center input the selection "industry" if the country fee structure stated the funding was pharma, industry, or for a clinical trial. The MRCT Center also disaggregated funders into industry and institution/NGO/philanthropy, because the fee charged could be (and in some countries is) different for different types of funders.',
  'Step 7a: Enter the fee in local currency if your country primarily uses local currency in its fee structure/budget reports.',
  'Step 7b: Enter the currency the fee is charged in.',
  'Step 7c: Enter the exchange rate for the currency that your country primarily charges fees in.',
  'Step 7d: Enter the fee in USD if your country primarily uses USD in its budget reports.',
  'Step 8ai: Review the total number of [non-student] initial reviews (for both more than minimal risk and minimal risk) conducted last year. If the cell is blank, please contact the MRCT Center to share the country estimate of total reviews for the year.',
  'Step 8aii: Review the total number of all types of reviews conducted last year.',
  'Step 8bi: Review the total revenue (for all fee types together) collected last year in local currency.',
  'Step 8bii: Review the total revenue (for all fee types together) collected last year in USD.',
  'Step 8c: Review the number of reviews by fee type. If the country does not disaggregate a fee type (e.g., does not disaggregate initial review into more than minimal risk and minimal risk), the MRCT Center has created multiple rows for that fee type to disaggregate according to the draft fee model — using the same fee for each. If the country gave an estimate of 20 initial reviews conducted in the last year, the MRCT Center put "20" only on one of the disaggregated initial review lines so that we do not artificially inflate the number of reviews.',
  'Step 9: Review the data source/s below. These have been listed by the MRCT Center based on the documents that countries have shared with the MRCT Center.',
  'Step 10: Add any comments that will be helpful to others looking at this worksheet. For example, if you feel that data is not correct for a cell, explain why in the notes cell for that row.',
];

export const REVENUE_REGULAR_OTHER = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that you are planning/budgeting for from the drop down list in the cells for "Unit."',
  'Step 3: Review the regular revenue categories below. The list is pre-populated by the MRCT Center to show two possible entries for each category of regular revenue. If your country has more than two entries for a category of revenue, please add additional rows. Please note that a subsidy is usually from a government budget line that disburses every year to the Secretariat.',
  'Step 4: IF the country has the regular revenue category listed in the adjacent cell in step 3, enter in the purpose/activities that will be supported by the funding.',
  'Step 5: IF the country has the regular revenue category listed in the same row in Step 3, enter in the funding source. If the revenue source is a federal or institutional source, please list the department within the government or institution that provides the revenue.',
  'Step 6a: Enter the revenue in local currency if your country primarily uses local currency in its budget reports.',
  'Step 6b: Select the currency that the revenue is received in.',
  'Step 6c: List the exchange rate for local currency to USD.',
  'Step 6d: Enter the revenue in USD if your country primarily uses USD in its budget reports.',
  'Step 7a: List the expected or actual start date of the revenue (funding).',
  'Step 7b: List the expected or actual end date of the revenue (funding).',
  'Step 8: List the data source (i.e., document name and date, weblink and specific place on the webpage) that documents each listed revenue (funding) source.',
  'Step 9: Add any comments that will be helpful to others looking at this worksheet.',
];

export const REVENUE_IRREGULAR = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that you are planning/budgeting for from the drop down list in the cells for "Unit."',
  'Step 3: Review the irregular revenue categories below. The list is pre-populated by the MRCT Center.',
  'Step 4: If the country has the irregular revenue category listed in the adjacent cell in step 3, enter in the purpose of the revenue (funding) and the activities that will be supported by the funding.',
  'Step 5: If the country has the irregular revenue category listed in this row in step 3, enter in the irregular revenue source. If the irregular revenue source is a federal or institutional source, please list the department within the government or institution that provides the irregular revenue (funding).',
  'Step 6a: Enter the revenue in local currency if your country primarily uses local currency in its budget reports.',
  'Step 6b: Select the currency that the irregular revenue is received in.',
  'Step 6c: List the exchange rate for local currency to USD.',
  'Step 6d: Enter the revenue in USD if your country primarily uses USD in its budget reports.',
  'Step 7a: List the expected or actual start date of the irregular revenue (funding).',
  'Step 7b: List the expected or actual end date of the irregular revenue (funding).',
  'Step 8: Select the payment status from the drop-down list in each cell.',
  'Step 9: List the data source (i.e., document name and date, weblink and specific place on the webpage) that documents each listed revenue (funding) source.',
  'Step 10: Add any comments that will be helpful to others looking at this worksheet.',
];

export const IN_KIND_REGULAR = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that receives the in-kind contributions from the drop-down list in each "Unit" cell below.',
  'Step 3: IF you want to track in-kind contributions from specific sources, select the entity/s that gives the in-kind contributions for the items in the adjacent cells in Step 4 from the drop-down list in the "Category" cells. An in-kind contribution is where an entity (the federal government, an institution such as a University, or another source — e.g., Secretariat staff giving overtime hours they are not paid for, or staff using their personal vehicle for Secretariat work) "gives" the Secretariat/NEC/IRB personnel time, an office, office supplies, or other items that they do not have to pay for from their regular or irregular budget.',
  'Step 4: The MRCT Center has pre-populated the items for all in-kind contributions, which mirror what you see on the expenses_regular worksheet. You can add rows if you have multiple in-kind contributions for the same item. For example, if there are in-kind contributions to salaries from both the federal government and other sources, add an additional row for salaries for each additional source. You will need to make sure to check against the expenses_regular page. The in-kind contribution you list may only partially cover the full annual expense for that item — see the rent and annual conference examples in the workbook. IMPORTANT: PLEASE WRITE NOTES in the notes column explaining the division in funding between expenses_regular and in-kind contributions_regular.',
  'Step 5: If the in-kind revenue source is a federal or institutional source, please list the department within the government or institution that provides the in-kind contribution.',
  'Step 6a: Enter the in-kind contribution in local currency if your country primarily uses local currency.',
  'Step 6b: Select the currency that the in-kind contribution is valued in.',
  'Step 6c: List the exchange rate for local currency to USD.',
  'Step 6d: Enter the in-kind contribution in USD if your country primarily uses USD.',
  'Step 7: Review the in-kind item descriptions listed below. These have been pre-populated by the MRCT Center based on the expense item descriptions in the expense_regular worksheet. If you believe the item description should be more detailed or changed, please edit and describe how you edited in the notes/comments column.',
  'Step 8: List the data source (i.e., document name and date, weblink and specific place on the webpage) that documents each listed in-kind contribution.',
  'Step 9: PLEASE add any notes/comments that will be helpful to others looking at this worksheet. It is especially important to document the distinction between what is captured on the in-kind contributions_regular worksheet and what is captured on the expenses_regular worksheet, and to describe any calculations (e.g., if a Secretariat staff member is working 20% overtime unpaid, multiply their annual salary by 0.2 and explain in the notes).',
];

export const IN_KIND_IRREGULAR = [
  'Step 1: Select your country from the drop-down list in each "Country" cell below.',
  'Step 2: Select the unit that receives the in-kind contributions from the drop-down list in each "Unit" cell below.',
  'Step 3: IF you want to track in-kind contributions from specific sources, select the entity/s that gives the in-kind contributions for the items in the adjacent cells in Step 4 from the drop-down list in the "Category" cells. An in-kind contribution is where an entity "gives" the Secretariat/NEC/IRB some form of one-time large cost item that they do not have to pay for from their regular or irregular budget.',
  'Step 4: The MRCT Center has pre-populated the items for all in-kind contributions, which mirror what you see on the expenses_irregular worksheet. You can add rows if you have multiple in-kind contributions for the same item. You will need to check against the expenses_irregular page. The in-kind contribution you list may only partially cover the full expense for that item — see the IT upgrade and consultant example in the workbook. In-kind contributions for the irregular budget should only be contributions that are not covered by any irregular funding source (e.g., grants, federal subsidies). IMPORTANT: PLEASE WRITE NOTES explaining the division in funding for each purpose/activity between the expenses_irregular and in-kind contributions_irregular worksheets.',
  'Step 5: If the in-kind revenue source is a federal or institutional source, please list the department within the government or institution that provides the in-kind contribution.',
  'Step 6a: Enter the in-kind contribution in local currency if your country primarily uses local currency.',
  'Step 6b: Select the currency that the in-kind contribution is valued in.',
  'Step 6c: List the exchange rate for local currency to USD.',
  'Step 6d: If the in-kind contribution is valued in USD, list the amount in this column.',
  'Step 7a: List the expected or actual start date of the in-kind contribution. For a vehicle or large renovation list the start date as the date received/completed, and the end date as the end of the life of that vehicle or other capital good.',
  'Step 7b: List the expected or actual end date of the in-kind contribution.',
  'Step 8: Review carefully the in-kind item descriptions listed below. If you believe the item description should be more detailed or changed, please edit and describe how you edited in the notes/comments column.',
  'Step 9: List the data source (i.e., document name and date, weblink and specific place on the webpage) that documents each listed in-kind contribution.',
  'Step 10: PLEASE add any notes/comments that will be helpful to others looking at this worksheet. It is especially important to document the distinction between in-kind contributions_irregular and expenses_irregular, and to describe any calculations.',
];

export const SUMMARY_REGULAR = [
  'Step 1: Review the total number of initial [non-student] reviews (more than minimal risk + minimal risk) conducted in the last year.',
  'Note: We do not yet have an overall score for ethics maturity level, like there is for regulatory maturity level. If it is determined that one could be calculated, the MRCT Center will enter it in the cell below.',
  'Note: The financial maturity level is a placeholder, and does not need to be filled out until after materials are developed by the MRCT Center to support assessment of financial maturity level.',
  'Step 2: Review whether there are financial risks or opportunities in the near-term. This information is drawn from the Key considerations worksheet, where there is more information.',
  'Step 3a: Review the number of ethics activities with expected LOE increase for the short term (next year). The information in this cell is drawn from the Key considerations worksheet.',
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
  'Step 3a: Consider the target number of reviews in the long-term, the risks/opportunities, and # of ethics activities with expected LOE increase and decrease. Estimate how much you think the budget should increase (or decrease) to achieve target ethics reviews, address scale-up of ethics activities, and compensate for any risks/opportunities in the next 3-5 years.',
  'Step 3b: Please explain your reasoning for your long-term forecast. If you forecast an increase, what irregular expense items (such as purchase of a new vehicle) do you expect to add?',
  'Step 4: Review the summary irregular revenues. Does the amount cover all of the summary expenses (irregular)? Is there a surplus or deficit?',
  'Step 5: Look at what you entered for your long-term forecast. What would you prioritize most in the existing budget, and what would you advocate is most important for additional funding?',
];

// Map each wizard step to the relevant sheet(s) from the workbook.
// `note` is an optional banner shown above the instructions when the dashboard
// step doesn't map cleanly to the workbook structure.
export const WIZARD_STEP_INSTRUCTIONS = {
  setup: {
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
    sheets: [
      { name: "From Expenses_regular sheet", lines: EXPENSES_REGULAR },
      { name: "From Expenses_irregular sheet", lines: EXPENSES_IRREGULAR },
    ],
  },
  revenue: {
    note: "The current dashboard step only covers Fees. In a future update we'll add a separate Regular Revenue (other) step for subsidies, grants, and other recurring revenue.",
    sheets: [
      { name: "From Rev_regular(fees) model form sheet", lines: FEES_MODEL_FORM },
      { name: "From Revenue_regular (other) sheet — coming soon", lines: REVENUE_REGULAR_OTHER },
    ],
  },
  inKind: {
    sheets: [
      { name: "From In-kind contributions_regular sheet", lines: IN_KIND_REGULAR },
      { name: "From In-kind contributions_irregular sheet", lines: IN_KIND_IRREGULAR },
    ],
  },
  review: {
    sheets: [
      { name: "From Summary sheet (regular)", lines: SUMMARY_REGULAR },
      { name: "From Summary sheet (irregular)", lines: SUMMARY_IRREGULAR },
    ],
  },
};
