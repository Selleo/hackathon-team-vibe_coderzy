import {
  AiMentorBlock,
  CodeBlock,
  LessonBlock,
  LessonPlan,
  QuizBlock,
  QuizOption,
  TextBlock,
  UserProfile,
} from "./types";
import { buildProfileHooks } from "./profileUtils";

const sentencesForText = (plan: LessonPlan, profileHooks: ReturnType<typeof buildProfileHooks>) => {
  const lines = [
    `${plan.topic} matters because you want to ${profileHooks.goal.toLowerCase()}.`,
    `As a ${profileHooks.jobStatus.toLowerCase()}, grounding this concept in ${profileHooks.projectLabel} keeps motivation tied to ${profileHooks.reason.toLowerCase()}.`,
    `Notice how it fuels your fascination with ${profileHooks.captivates.toLowerCase()} while staying friendly to your experience level (${profileHooks.experience}).`,
  ];
  return lines.slice(0, 3);
};

const buildTextBlock = (plan: LessonPlan, profile: UserProfile): TextBlock => {
  const hooks = buildProfileHooks(profile);
  const sentences = sentencesForText(plan, hooks);
  const quickActions = plan.quickActions ?? [
    `Write one sentence about how ${plan.topic} shows up in ${hooks.projectLabel}.`,
    "List a blocker you want the mentor to cover.",
    "Sketch a tag or class name you would use.",
  ];
  const snippet = plan.snippetTag ?? "<button class=\"cta\">Focus pulse</button>";

  const markdown = [
    `### ${plan.title}`,
    sentences.join(" "),
    "**Quick actions**",
    ...quickActions.map((action) => `- ${action}`),
    "",
    `Snippet idea: \`${snippet}\``,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    type: "text",
    title: plan.title,
    markdown,
    quickActions,
    snippet,
  };
};

const buildQuizBlock = (plan: LessonPlan, profile: UserProfile): QuizBlock => {
  const hooks = buildProfileHooks(profile);
  const recap = `Recap: ${plan.topic} is your safety net while chasing ${hooks.shortGoal}.`;
  const scenario =
    plan.scenario ??
    `Scenario: You're improving ${hooks.projectLabel} so it better reflects why ${hooks.reason.toLowerCase()} matters.`;
  const question = `Which option keeps the plan aligned with your goal and ${hooks.captivates.toLowerCase()}?`;

  const options: QuizOption[] = [
    {
      text: `Relate ${plan.topic} directly to the user interaction in ${hooks.projectLabel}.`,
      isCorrect: true,
      explanation: `Correct—tying the concept to your ${hooks.shortGoal} keeps the learning practical.`,
    },
    {
      text: `Ignore ${plan.topic} and jump straight into polishing visuals.`,
      isCorrect: false,
      explanation: "Skipping the concept slows down your ability to reason about the build.",
    },
    {
      text: `Switch to a brand-new problem so you don't overthink ${plan.topic}.`,
      isCorrect: false,
      explanation: "Dodging the scenario delays feedback and doesn't use the data from your survey.",
    },
  ];

  return {
    type: "quiz",
    title: plan.title,
    recap,
    scenario,
    question,
    kind: "single",
    options,
    penalty_hearts: 1,
  };
};

const buildCodeBlock = (plan: LessonPlan, profile: UserProfile): CodeBlock => {
  const hooks = buildProfileHooks(profile);
  const starterLines = [
    "plan BuildFeature:",
    `  define goal -> "${hooks.shortGoal}"`,
    `  outline component using ${plan.topic}`,
    "  mark where to inject personalization",
  ];
  const solutionLines = [
    "plan BuildFeature:",
    `  step one: capture '${hooks.reason.toLowerCase()}' in a note`,
    "  step two: map data/state needed",
    "  step three: describe outcome + testing hook",
    "end",
  ];

  const acceptanceCriteria = [
    `List 2-3 steps that map ${plan.topic} to ${hooks.projectLabel}.`,
    "Mark at least one line where you will personalize text or data.",
    "State how you will validate the behaviour (manual or automated).",
  ];

  return {
    type: "code",
    title: plan.title,
    instructions: `Sketch a short pseudocode plan for ${plan.topic}. Keep it under six lines so you can adapt it to any language later.`,
    language: "pseudocode",
    starter: starterLines.join("\n"),
    solution: solutionLines.join("\n"),
    acceptanceCriteria,
    penalty_hearts: 0,
  };
};

const buildMentorBlocks = (plan: LessonPlan, profile: UserProfile): AiMentorBlock[] => {
  const hooks = buildProfileHooks(profile);
  const lessonContext = `${plan.topic} for ${hooks.projectLabel}. Goal: ${hooks.goal}. Reason: ${hooks.reason}. Experience: ${hooks.experience}.`;
  const promptBase =
    plan.prompt ??
    `Explain the topic using ${hooks.projectLabel} as a concrete anchor. After the explanation quiz the learner until they defend decisions that match ${hooks.goal}.`;

  const explainBlock: AiMentorBlock = {
    type: "ai-mentor",
    mode: "explain",
    title: plan.title,
    persona: plan.persona ?? "supportive mentor",
    lessonContext,
    topic: plan.topic,
    prompt: `${promptBase} Focus on why this matters for someone motivated by ${hooks.captivates}.`,
    suggestedQuestions: [
      `How does ${plan.topic} unblock your ${hooks.projectLabel}?`,
      `Where does it support your ${hooks.reason.toLowerCase()}?`,
    ],
  };

  const quizBlock: AiMentorBlock = {
    type: "ai-mentor",
    mode: "quiz",
    title: `${plan.title} · mentor open question`,
    persona: plan.persona ?? "coach",
    lessonContext,
    topic: plan.topic,
    prompt: `Ask open questions about ${plan.topic}. Wait for convincing answers tied to ${hooks.goal} before marking them correct.`,
    quizGoal: 2,
  };

  return [explainBlock, quizBlock];
};

export const buildBlocksFromPlan = (plan: LessonPlan, profile: UserProfile): LessonBlock[] => {
  switch (plan.lessonType) {
    case "quiz":
      return [buildQuizBlock(plan, profile)];
    case "code":
      return [buildCodeBlock(plan, profile)];
    case "mentor":
      return buildMentorBlocks(plan, profile);
    case "text":
    default:
      return [buildTextBlock(plan, profile)];
  }
};
