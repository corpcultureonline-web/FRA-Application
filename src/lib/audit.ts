/**
 * Free audit content. Shared by the audit screens and /api/audit so the server
 * validates against exactly the options the founder was shown.
 */

export type Question = {
  id: string;
  prompt: string;
  /** Short label on the "Check your answers" step. */
  reviewLabel: string;
  options: string[];
  /** Shorter wording for long options, shown on the review step. */
  shortOptions?: string[];
  /** list: stacked rows · buttons: side-by-side · statements: long sentences. */
  layout: "list" | "buttons" | "statements";
};

export type Section = {
  id: string;
  title: string;
  intro: string;
  note?: string;
  questions: Question[];
};

export const CATEGORIES = [
  "Food & Beverage",
  "Retail",
  "Services",
  "Education",
  "Wellness & Fitness",
  "Lifestyle",
  "Other",
];

export const OUTLET_BANDS = ["1", "2–5", "6–15", "16+"];

export type Profile = {
  brandName: string;
  founderName: string;
  email: string;
  category: string;
  outlets: string;
  city: string;
};

export const EMPTY_PROFILE: Profile = {
  brandName: "",
  founderName: "",
  email: "",
  category: "",
  outlets: "",
  city: "",
};

export const PROFILE_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: "brandName", label: "Brand name" },
  { key: "founderName", label: "Your name" },
  { key: "email", label: "Email" },
  { key: "category", label: "Category" },
  { key: "outlets", label: "Outlets" },
  { key: "city", label: "City" },
];

/** Section 1 collects the profile; sections 2–7 hold the 11 questions. */
export const PROFILE_SECTION = {
  id: "business",
  title: "About your business",
  intro: "A few basics so your result is about you, not a generic brand.",
};

const YES_PARTLY_NO = ["Yes", "Partially", "No"];

export const QUESTION_SECTIONS: Section[] = [
  {
    id: "numbers",
    title: "Your numbers",
    intro: "Your best estimate is fine — pick the closest band.",
    questions: [
      {
        id: "UE01",
        prompt: "What is the typical payback period for one of your own outlets?",
        reviewLabel: "Payback period, own outlet",
        layout: "list",
        options: [
          "More than 36 months",
          "24–36 months",
          "18–24 months",
          "12–18 months",
          "Less than 12 months",
        ],
      },
      {
        id: "UE02",
        prompt: "What is your outlet-level operating margin?",
        reviewLabel: "Outlet operating margin",
        layout: "list",
        options: ["Less than 10%", "10–15%", "15–20%", "20–25%", "More than 25%"],
      },
    ],
  },
  {
    id: "systems",
    title: "Your systems",
    intro: "How much of the business lives on paper, not in people’s heads.",
    questions: [
      {
        id: "OR01",
        prompt:
          "Are your operating procedures documented in writing, rather than held as knowledge by your team?",
        reviewLabel: "Procedures written down",
        layout: "buttons",
        options: YES_PARTLY_NO,
      },
      {
        id: "OR02",
        prompt:
          "How many of your core workflows have a written SOP that a new manager could follow unassisted?",
        reviewLabel: "Workflows with a usable SOP",
        layout: "list",
        options: ["None", "A few", "About half", "Most", "All"],
      },
    ],
  },
  {
    id: "market",
    title: "Market and brand",
    intro: "Whether demand for your brand travels beyond where you started.",
    questions: [
      {
        id: "BP01",
        prompt:
          "How many enquiries about franchising have you received in the last 12 months, without asking for them?",
        reviewLabel: "Unprompted franchise enquiries, last 12 months",
        layout: "list",
        options: ["0", "1–5", "6–15", "16–40", "More than 40"],
      },
      {
        id: "MR01",
        prompt: "In how many distinct cities has your model been tested?",
        reviewLabel: "Cities where the model is tested",
        layout: "buttons",
        options: ["1", "2–3", "4 or more"],
      },
    ],
  },
  {
    id: "partners",
    title: "Partners and support",
    intro: "Who should run your next outlet, and how you would get them ready.",
    questions: [
      {
        id: "PP01",
        prompt:
          "Have you defined the profile of your ideal franchise partner — the capital they need, the experience required, and how involved they should be?",
        reviewLabel: "Ideal partner profile defined",
        layout: "buttons",
        options: YES_PARTLY_NO,
      },
      {
        id: "SI01",
        prompt: "Is there a structured training programme for a new franchisee and their staff?",
        reviewLabel: "Training programme for franchisees",
        layout: "buttons",
        options: YES_PARTLY_NO,
      },
    ],
  },
  {
    id: "role",
    title: "Your role",
    intro:
      "One question. Pick the sentence closest to how things run today, not how you would like them to.",
    questions: [
      {
        id: "FL01",
        prompt: "How much decision-making authority sits with your team rather than with you?",
        reviewLabel: "Decision-making authority",
        layout: "statements",
        options: [
          "I am involved in most daily decisions. If I am away for a week, things slow down or wait for me.",
          "My team handles routine tasks, but decisions — purchasing, staffing, customer issues — still come to me.",
          "A manager runs the day-to-day within limits I have set. I am consulted on anything outside those limits.",
          "Managers make operational decisions independently. I review outcomes weekly or monthly rather than approving in advance.",
          "The business operates without my involvement in daily decisions. My role is direction and growth, not operations.",
        ],
        shortOptions: [
          "I am involved in most daily decisions",
          "Routine tasks with my team, decisions with me",
          "A manager runs the day-to-day within limits I set",
          "Managers decide; I review outcomes",
          "The business runs without me day to day",
        ],
      },
    ],
  },
  {
    id: "legal",
    title: "Legal position",
    intro: "Two checks on who owns the brand and whether anything is in dispute.",
    note: "These stay private and only affect your own result.",
    questions: [
      {
        id: "G1",
        prompt: "Is your brand name or logo trademarked, or has an application been filed?",
        reviewLabel: "Trademark",
        layout: "list",
        options: ["Registered", "Application filed", "Neither"],
      },
      {
        id: "G3",
        prompt:
          "Are there any active legal disputes over brand ownership, intellectual property, or an existing franchisee?",
        reviewLabel: "Active legal disputes",
        layout: "buttons",
        options: ["Yes", "No"],
      },
    ],
  },
];

export const SECTION_TITLES = [PROFILE_SECTION.title, ...QUESTION_SECTIONS.map((s) => s.title)];

export const ALL_QUESTIONS = QUESTION_SECTIONS.flatMap((section) => section.questions);

export type Answers = Record<string, string>;

export function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

/** Fields of the profile that are still missing or invalid. */
export function profileProblems(profile: Profile): (keyof Profile)[] {
  const problems: (keyof Profile)[] = [];
  if (!profile.brandName.trim()) problems.push("brandName");
  if (!profile.founderName.trim()) problems.push("founderName");
  if (!isValidEmail(profile.email)) problems.push("email");
  if (!CATEGORIES.includes(profile.category)) problems.push("category");
  if (!OUTLET_BANDS.includes(profile.outlets)) problems.push("outlets");
  if (!profile.city.trim()) problems.push("city");
  return problems;
}

export function isAnswered(question: Question, answers: Answers) {
  return question.options.includes(answers[question.id] ?? "");
}

/** The answer as shown on the review step (short wording where there is one). */
export function displayAnswer(question: Question, answer: string) {
  const index = question.options.indexOf(answer);
  return question.shortOptions?.[index] ?? answer;
}
