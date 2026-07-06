// Feedback survey — Willyanne 2026-05-31 midday note.
// Designed as the FINAL step participants complete live in the room (10–15 min
// session): one page, all questions visible at once, every field optional so it
// can be answered in ~2 minutes. Scale questions are radio 1–5 with anchor labels.

export const SURVEY_INTRO =
  "Please complete the brief survey below to help us better understand your experience with the Financial Dashboard. We welcome your insights and comments.";

export const QUESTIONS_INTRO =
  "If you have questions on the Financial Dashboard or additional feedback/comments that you would like to provide, please put your questions and feedback/comments in the text box below and then click Submit.";

// Each scale question carries the two end-anchor labels shown under the 1 and 5 buttons.
export const SURVEY_QUESTIONS = [
  {
    id: "q1",
    type: "scale",
    text: "Do you prefer this Financial Dashboard to the Excel workbook?",
    low: "Strongly prefer Excel",
    high: "Strongly prefer Dashboard",
  },
  {
    id: "q2",
    type: "scale",
    text: "Do you feel the MRCT Center should continue developing this Financial Dashboard in place of the Excel workbook?",
    low: "Strongly disagree",
    high: "Strongly agree",
  },
  {
    id: "q3",
    type: "scale",
    text: "Do you think you / your country team will be able to use this Financial Dashboard?",
    low: "Definitely not",
    high: "Definitely yes",
  },
  {
    id: "q4",
    type: "scale",
    text: "Overall, how easy was it to navigate through the Introduction, Inputs, and Results?",
    low: "Very difficult",
    high: "Very easy",
  },
  {
    id: "q5",
    type: "scale",
    text: "Overall, how easy was entering new data and editing any existing data?",
    low: "Very difficult",
    high: "Very easy",
  },
  {
    id: "q6",
    type: "text",
    text: "Was there anything you wanted to record that had no place?",
  },
  {
    id: "q7",
    type: "scale",
    text: "How helpful were the instructions?",
    low: "Not at all helpful",
    high: "Extremely helpful",
  },
  {
    id: "q8",
    type: "text",
    text: "Do you have any suggestions to improve the instructions?",
  },
  {
    id: "q9",
    type: "scale",
    text: "Did you find the visualizations in the Results section helpful?",
    low: "Not at all helpful",
    high: "Extremely helpful",
  },
  {
    id: "q10",
    type: "text",
    text: "Was there any financial information from the Inputs tabs that you wanted to visualize in the Results tabs, but there was no visualization yet?",
  },
  {
    id: "q11",
    type: "text",
    text: "Please provide any additional feedback here.",
  },
  {
    id: "q12",
    type: "scale",
    text: "I think that this Financial Dashboard will be helpful to my planning for Ethics System Financial Sustainability.",
    low: "Strongly disagree",
    high: "Strongly agree",
  },
];
