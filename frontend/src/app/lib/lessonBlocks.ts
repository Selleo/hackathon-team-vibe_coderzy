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

type ProfileHooks = ReturnType<typeof buildProfileHooks>;

const defaultSentences = (plan: LessonPlan, hooks: ProfileHooks) => [
  `${plan.topic} matters because you want to ${hooks.goal.toLowerCase()}.`,
  `As a ${hooks.jobStatus.toLowerCase()}, grounding this concept in ${hooks.projectLabel} keeps motivation tied to ${hooks.reason.toLowerCase()}.`,
  `Notice how it fuels your fascination with ${hooks.captivates.toLowerCase()} while staying friendly to your experience level (${hooks.experience}).`,
];

const buildTextBlock = (
  plan: LessonPlan,
  profile: UserProfile,
  overrides?: {
    title?: string;
    customLines?: string[];
    quickActions?: string[];
    snippet?: string | null;
  },
): TextBlock => {
  const hooks = buildProfileHooks(profile);
  const sentences = overrides?.customLines ?? defaultSentences(plan, hooks).slice(0, 3);
  const quickActions =
    overrides?.quickActions ??
    (plan.quickActions ?? [
      `Write one sentence about how ${plan.topic} shows up in ${hooks.projectLabel}.`,
      "List a blocker you want the mentor to cover.",
      "Sketch a tag or class name you would use.",
    ]);
  const snippet =
    overrides?.snippet === null
      ? null
      : overrides?.snippet ?? plan.snippetTag ?? "<button class=\"cta\">Focus pulse</button>";

  const sections = [
    `### ${overrides?.title ?? plan.title}`,
    sentences.join(" "),
    quickActions.length ? "**Quick actions**" : "",
    ...quickActions.map((action) => `- ${action}`),
    snippet ? "" : null,
    snippet ? `Snippet idea: \`${snippet}\`` : null,
  ].filter(Boolean);

  return {
    type: "text",
    title: overrides?.title ?? plan.title,
    markdown: sections.join("\n\n"),
    quickActions,
    snippet: snippet ?? undefined,
  };
};

const buildQuizBlock = (
  plan: LessonPlan,
  profile: UserProfile,
  overrides?: {
    title?: string;
    recap?: string;
    scenario?: string;
    question?: string;
    options?: QuizOption[];
    penalty_hearts?: number;
  },
): QuizBlock => {
  const hooks = buildProfileHooks(profile);
  const recap =
    overrides?.recap ?? `Recap: ${plan.topic} is your safety net while chasing ${hooks.shortGoal}.`;
  const scenario =
    overrides?.scenario ??
    plan.scenario ??
    `Scenario: You're improving ${hooks.projectLabel} so it better reflects why ${hooks.reason.toLowerCase()} matters.`;
  const question =
    overrides?.question ??
    `Which option keeps the plan aligned with your goal and ${hooks.captivates.toLowerCase()}?`;

  const options: QuizOption[] =
    overrides?.options ??
    [
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
    title: overrides?.title ?? plan.title,
    recap,
    scenario,
    question,
    kind: "single",
    options,
    penalty_hearts: overrides?.penalty_hearts ?? 1,
  };
};

const buildCodeBlock = (
  plan: LessonPlan,
  profile: UserProfile,
  overrides?: {
    title?: string;
    instructions?: string;
    starter?: string[];
    solution?: string[];
    acceptanceCriteria?: string[];
  },
): CodeBlock => {
  const hooks = buildProfileHooks(profile);
  const starterLines =
    overrides?.starter ??
    [
      "plan BuildFeature:",
      `  define goal -> "${hooks.shortGoal}"`,
      `  outline component using ${plan.topic}`,
      "  mark where to inject personalization",
    ];
  const solutionLines =
    overrides?.solution ??
    [
      "plan BuildFeature:",
      `  step one: capture '${hooks.reason.toLowerCase()}' in a note`,
      "  step two: map data/state needed",
      "  step three: describe outcome + testing hook",
      "end",
    ];

  const acceptanceCriteria =
    overrides?.acceptanceCriteria ??
    [
      `List 2-3 steps that map ${plan.topic} to ${hooks.projectLabel}.`,
      "Mark at least one line where you will personalize text or data.",
      "State how you will validate the behaviour (manual or automated).",
    ];

  return {
    type: "code",
    title: overrides?.title ?? plan.title,
    instructions:
      overrides?.instructions ??
      `Sketch a short pseudocode plan for ${plan.topic}. Keep it under six lines so you can adapt it to any language later.`,
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
  const hooks = buildProfileHooks(profile);

  if (plan.lessonType === "text") {
    const snapshot = buildTextBlock(plan, profile, {
      title: `${plan.title} · snapshot`,
      customLines: [
        `${plan.topic} is the bridge between where you are now and ${hooks.shortGoal}.`,
        `Picture yourself as a ${hooks.jobStatus.toLowerCase()} explaining this to someone on ${hooks.projectLabel}.`,
        `Keep your motivation (${hooks.captivates.toLowerCase()}) in mind while you skim this primer.`,
      ],
      quickActions: [
        `Describe ${plan.topic} in eight words for your ${hooks.projectLabel}.`,
        `Note one confusion to bring up in the mentor block.`,
      ],
    });

    const microApply = buildTextBlock(plan, profile, {
      title: `${plan.title} · apply in 60 seconds`,
      customLines: [
        `Walk through a real moment in ${hooks.projectLabel} where ${plan.topic} appears.`,
        `Tie it back to why you study (${hooks.reason.toLowerCase()}) so the concept sticks.`,
      ],
      quickActions: [
        `Sketch a UI/state snippet showing ${plan.topic}.`,
        `Pair it with a hobby reference like ${hooks.hobby ?? "your side project"}.`,
      ],
      snippet: plan.snippetTag ?? "<button>micro-play</button>",
    });

    const checkpoint = buildQuizBlock(plan, profile, {
      title: `${plan.topic} · checkpoint`,
      recap: `You want ${plan.topic} to unlock ${hooks.shortGoal}.`,
      scenario: `You're mid-session on ${hooks.projectLabel} and have 2 minutes to validate understanding.`,
      question: "Which action keeps you moving?",
      options: [
        {
          text: `Explain ${plan.topic} to a friend in the context of ${hooks.projectLabel}.`,
          isCorrect: true,
          explanation: "Teaching forces clarity and makes later mentor chats faster.",
        },
        {
          text: "Open a dozen tabs to read theory you won't apply yet.",
          isCorrect: false,
          explanation: "Information overload steals your limited focus window.",
        },
        {
          text: "Skip reflection and jump to a new feature immediately.",
          isCorrect: false,
          explanation: "Without reflection, the concept won't connect to your goal.",
        },
      ],
    });

    return [snapshot, microApply, checkpoint];
  }

  if (plan.lessonType === "quiz") {
    const recap = buildTextBlock(plan, profile, {
      title: `${plan.title} · recap`,
      customLines: [
        `${plan.topic} underpins your confidence when you present progress on ${hooks.projectLabel}.`,
        `Before answering, remind yourself why ${hooks.reason.toLowerCase()} pushed you into this track.`,
      ],
      quickActions: [
        `Write one sentence linking ${plan.topic} to today's task.`,
        `Predict the trickiest pitfall for someone at your level (${hooks.experience}).`,
      ],
      snippet: "<badge>recap</badge>",
    });

    const quiz = buildQuizBlock(plan, profile);

    const wrap = buildTextBlock(plan, profile, {
      title: `${plan.topic} · next micro-step`,
      customLines: [
        `Bank the learning by sharing it with a teammate or journaling about ${hooks.projectLabel}.`,
        `Highlight how it supports your ${hooks.captivates.toLowerCase()} motivation.`,
      ],
      quickActions: [
        "Write a 2-sentence summary for future-you.",
        "Post a question to the mentor chat to deepen the scenario.",
      ],
      snippet: null,
    });

    return [recap, quiz, wrap];
  }

  if (plan.lessonType === "code") {
    const overview = buildTextBlock(plan, profile, {
      title: `${plan.title} · plan overview`,
      customLines: [
        `Keep the sketch tiny so you can adapt it no matter the language.`,
        `Use ${hooks.projectLabel} as the anchor so you don't drift into generic steps.`,
      ],
      quickActions: [
        `List the inputs you have today for ${hooks.projectLabel}.`,
        `Circle the step that feels riskiest and star it.`,
      ],
      snippet: "<pseudo>draft()</pseudo>",
    });

    const planBlock = buildCodeBlock(plan, profile);

    const reflection = buildTextBlock(plan, profile, {
      title: "Reflect & adapt",
      customLines: [
        `Does the plan still serve ${hooks.shortGoal}? Trim anything that doesn't.`,
        `Decide how you'll validate success—demoing to a friend, writing a test, or narrating it in the mentor chat.`,
      ],
      quickActions: [
        "Add one note about personalization for your hobby or work context.",
        "Schedule when you'll revisit this plan after building.",
      ],
      snippet: null,
    });

    return [overview, planBlock, reflection];
  }

  if (plan.lessonType === "mentor") {
    const warmup = buildTextBlock(plan, profile, {
      title: "Mentor warm-up",
      customLines: [
        `Jot down what you already know about ${plan.topic} and where you wobble.`,
        `Arrive with one story from ${hooks.projectLabel} so the mentor can riff on it.`,
      ],
      quickActions: [
        "Write a curiosity question for the mentor.",
        "List one misconception you want challenged.",
      ],
      snippet: "<prompt>warm-up</prompt>",
    });

    return [warmup, ...buildMentorBlocks(plan, profile)];
  }

  return [buildTextBlock(plan, profile)];
};
