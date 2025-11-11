import { NextResponse } from "next/server";
import { LessonBlock, LessonPlan, UserProfile, TopicBlueprint } from "../../lib/types";
import { buildProfileHooks } from "../../lib/profileUtils";

interface LessonRequestBody {
  plan: LessonPlan;
  profile: UserProfile;
  topicBlueprint: TopicBlueprint;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const sanitize = (value?: string) => value?.trim() ?? "";
const joinOrFallback = (values: string[], fallback: string) => {
  const filtered = values.map(sanitize).filter(Boolean);
  return filtered.length ? filtered.join(", ") : fallback;
};
const buildInstructionStrategy = (
  profile: UserProfile,
  plan: LessonPlan,
  topicBlueprint: TopicBlueprint,
  hobbyContext: string,
) => {
  const experience = sanitize(profile.codingExperience).toLowerCase();
  const beginnerPattern = /(beginner|no experience|never coded|new|first lesson)/i;
  if (beginnerPattern.test(experience)) {
    return `Strategy: This is a foundation learner. Keep blocks short, celebrate quick wins, tie every explanation to ${hobbyContext}, and use reassuring language that shows the mentor is demonstrating the steps inside the lesson.`;
  }
  return `Strategy: This learner has prior wins. Skip trivial definitions, compare ${topicBlueprint.title} to real project trade-offs, keep the mentor voice confident, and use ${plan.assessmentFocus} moments that feel like debugging sessions or design reviews.`;
};

const generateUserPrompt = (plan: LessonPlan, profile: UserProfile, topicBlueprint: TopicBlueprint): string => {
  const hobbies = joinOrFallback(profile.hobbies ?? [], "their interests");
  const hobbyContext = sanitize(plan.hobbyInfusion) || hobbies;
  const skillsToUnlock = joinOrFallback(topicBlueprint.skillsToUnlock ?? [], "core foundations");
  const recommendedArtifacts = joinOrFallback(topicBlueprint.recommendedArtifacts ?? [], "streak challenges and mentor chats");
  const instructionStrategy = buildInstructionStrategy(profile, plan, topicBlueprint, hobbyContext);
  const personaSummary = `
You are ViaMent's curriculum architect. Follow the "persona-first" workflow described below and output only JSON.

Learner Persona:
- Role: ${sanitize(profile.jobStatus) || "Learner"}
- Experience: ${sanitize(profile.codingExperience) || "Complete beginner"}
- Motivation: ${sanitize(profile.reason) || "Stay curious"}
- Captivated by: ${sanitize(profile.captivates) || "Problem solving"}
- Learning goal: ${sanitize(profile.learningGoal) || "Ship a project"}
- Hobbies / inspiration wells: ${hobbies}

Topic Blueprint Snapshot:
- Topic: ${topicBlueprint.title}
- Tagline: ${topicBlueprint.tagline}
- Why it matters: ${topicBlueprint.whyItMatters}
- Hobby hook: ${topicBlueprint.hobbyHook}
- Skills to unlock: ${skillsToUnlock}
- Recommended artifacts: ${recommendedArtifacts}

Lesson Plan Inputs:
- Lesson template: ${plan.templateId} (${plan.lessonType})
- Lesson goal: ${plan.lessonGoal}
- Reason hook: ${plan.reasonHook}
- Hobby infusion: ${plan.hobbyInfusion}
- Assessment focus: ${plan.assessmentFocus}
- Lesson description: ${plan.description}

${instructionStrategy}

Workflow you must simulate internally:
1. Persona Synthesis - restate the learner motivations and anxieties so every block mirrors their survey answers.
2. Module Binding - tie ${plan.topic} back to ${topicBlueprint.tagline} and ${plan.lessonGoal}.
3. Lesson Scaffolding - create a Hook -> Teach -> Practice -> Verification arc. Each block must be short, direct, and contextualized with ${hobbyContext}.
4. Block Assembly - use only the block palette described here:
   - Text block (type: "text") = 2 tight paragraphs + 2-3 mentor narrated micro-steps ("We first notice..."). Include concrete examples, not instructions.
   - Code block (type: "code") = mentor walks through a tiny snippet (1-6 lines). Provide starter, solution, acceptanceCriteria, and a reflectionPrompt starting with "Consider".
   - Quiz block (type: "quiz") = recap + persona-sized scenario + question + 3-4 options. Each option needs a personalized explanation. Include a reflectionPrompt that begins with "Consider".
   - AI mentor block (type: "ai-mentor") = open dialogue. Specify mode, persona, lessonContext, prompt, topic, and 2-3 suggestedQuestions. Use mode "quiz" when you want an open-response check, otherwise mode "explain".

General directives:
- Teach inside the lesson; never tell the learner to leave the platform or "go practice later".
- Reference their motivation "${plan.reasonHook}" and hobby context "${plan.hobbyInfusion}" inside every block.
- Keep paragraphs under 80 words and avoid filler.
- Use confident mentor voice ("Notice how...", "Let's trace...") instead of imperatives ("Do X").
- Never output placeholders. Everything must be fully written out.
- Output a single JSON object: {"blocks": [...]} with properly escaped strings.
`;

  switch (plan.lessonType) {
    case "text":
      return `
${personaSummary}
Lesson Template: Narrated Concept Sprint (Text)
- Block 1 ("Hook & Context"): type "text". Two short paragraphs connect ${plan.topic} to ${plan.reasonHook} and ${plan.hobbyInfusion}. Include a tangible example the learner can visualize. Provide 2-3 microSteps describing what the mentor is pointing out.
- Block 2 ("Concept Walkthrough"): type "text". Show the core mechanic with a tiny snippet or analogy. Mention how this supports ${plan.lessonGoal}. Provide 2-3 observation microSteps.
- Block 3 ("Apply it Immediately"): type "text". Walk through a mini-scenario showing how the concept solves a ${profile.captivates} flavored problem. Mention any recommended artifact (${recommendedArtifacts}). Include microSteps that narrate the mentor validating the idea.
- Block 4 ("Mentor Reflection"): type "ai-mentor" with mode "explain". Persona should sound like a supportive coach for a ${profile.jobStatus}. The lessonContext must summarize what was taught. Provide 2-3 suggested questions the learner could ask (all aligned to ${plan.assessmentFocus}).

Return JSON exactly as:
{
  "blocks": [
    { ...Block 1... },
    { ...Block 2... },
    { ...Block 3... },
    { ...AI mentor Block 4... }
  ]
}
`;
    case "quiz":
      return `
${personaSummary}
Lesson Template: Scenario Drills (Quiz)
- Block 1 ("Set the Stage"): type "text". Two paragraphs recap ${plan.topic} with an example from ${profile.jobStatus} life and ${plan.hobbyInfusion}. Close with why mastering this unlocks ${skillsToUnlock}.
- Block 2 ("Challenge A"): type "quiz". Recap references Block 1, scenario leans on ${plan.hobbyInfusion}, and the question targets ${plan.assessmentFocus}. Include 4 options (one correct) and set penalty_hearts to 1. Each explanation must cite the persona or hobby. The reflectionPrompt begins with "Consider".
- Block 3 ("Challenge B"): another quiz block escalating the difficulty. Use a scenario linked to ${profile.captivates} or ${profile.reason}. Same option requirements.
- Block 4 ("Mentor Check-in"): type "ai-mentor" with mode "quiz". The prompt should tell the mentor to ask an open-response question that mixes ${plan.assessmentFocus} with ${plan.reasonHook}. Set quizGoal to 1. Provide suggestedQuestions the learner might ask if they need clarification.

Return JSON with the 4 blocks in this order.
`;
    case "code":
      return `
${personaSummary}
Lesson Template: Guided Build (Code)
- Block 1 ("Mentor Walkthrough"): type "text". Describe the mentor narrating a micro snippet related to ${plan.lessonGoal}. Mention how this ties to ${plan.reasonHook} and ${plan.hobbyInfusion}.
- Block 2 ("Tiny Build Together"): type "code". Instructions must describe the mentor demonstrating a 2-6 line snippet. Set the language field to the exact stack implied by ${profile.learningGoal}. Provide realistic starter and solution strings plus 3 acceptance criteria referencing ${plan.assessmentFocus}. Add a reflectionPrompt starting with "Consider".
- Block 3 ("Check Understanding"): type "quiz". Recap the code, present a scenario (ideally ${plan.hobbyInfusion}-flavored), ask one question, include 4 options with explanations, keep penalty_hearts at 1, and a reflection prompt that begins with "Consider".
- Block 4 ("Open Mentor Quiz"): type "ai-mentor" with mode "quiz". The prompt should tell the mentor to ask an open-response debugging or extension question referencing ${plan.assessmentFocus}. Set quizGoal to 1 and craft lessonContext that summarizes what was built.

Return JSON with the blocks ordered 1->4 as described.
`;
    default:
      return `
${personaSummary}
Lesson Template: Mentor Dialogue
- Block 1 ("Context & Stakes"): type "text" covering why ${plan.topic} matters for ${profile.learningGoal}.
- Block 2 ("Strategy Primer"): another text block highlighting pitfalls or patterns, referencing ${skillsToUnlock}.
- Block 3 ("Mentor Dialogue"): type "ai-mentor" with mode "explain". Persona should sound like an expert sparring partner for a ${profile.jobStatus}. Provide lessonContext, prompt, and suggestedQuestions so the learner can probe deeper before continuing.

Return JSON with these three blocks.
`;
  }
};

const ensureString = (value: unknown, fallback: string): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
};

const ensureNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureStringArray = (value: unknown, fallback: string[]): string[] => {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
    if (cleaned.length) {
      return cleaned;
    }
  }
  return fallback;
};

const buildLessonContext = (
  plan: LessonPlan,
  profile: UserProfile,
  topicBlueprint: TopicBlueprint,
) => {
  const hooks = buildProfileHooks(profile);
  return [
    `Topic: ${plan.topic}`,
    `Module: ${topicBlueprint.title}`,
    `Goal: ${hooks.goal}`,
    `Persona: ${hooks.personaLabel} (${hooks.experienceTier})`,
    `Motivation: ${hooks.reason}`,
    `Hobby lens: ${plan.hobbyInfusion}`,
    `Assessment: ${plan.assessmentFocus}`,
  ].join(" | ");
};

const normalizeBlocks = (
  rawBlocks: unknown,
  plan: LessonPlan,
  profile: UserProfile,
  topicBlueprint: TopicBlueprint,
): LessonBlock[] => {
  if (!Array.isArray(rawBlocks)) {
    throw new Error("Lesson blocks not returned.");
  }

  const hooks = buildProfileHooks(profile);
  const defaultMicroSteps = [
    `Notice how ${plan.topic} keeps looping back to your hobby (${plan.hobbyInfusion}).`,
    `Call out where it reinforces your motivation: ${plan.reasonHook}.`,
  ];
  const defaultReflection = `Consider how ${plan.topic} shortens the path to ${plan.lessonGoal}.`;
  const defaultLessonContext = buildLessonContext(plan, profile, topicBlueprint);

  return rawBlocks.map((rawBlock, index) => {
    const fallbackTitle = `Mentor insight ${index + 1}`;
    const block = (rawBlock ?? {}) as Record<string, unknown>;
    const type = typeof block.type === "string" ? block.type : "text";

    if (type === "quiz") {
      const options = Array.isArray(block.options) ? block.options : [];
      const normalizedOptions =
        options.length > 0
          ? options.map((option, optionIndex) => {
              const optionRecord = (option ?? {}) as Record<string, unknown>;
              return {
                text: ensureString(
                  optionRecord.text,
                  optionIndex === 0
                    ? `Relate ${plan.topic} directly to your goal (${hooks.shortGoal}).`
                    : `Option ${optionIndex + 1}`,
                ),
                isCorrect: Boolean(
                  optionRecord.isCorrect ?? optionIndex === 0,
                ),
                explanation: ensureString(
                  optionRecord.explanation,
                  optionIndex === 0
                    ? `Nice! You tied ${plan.topic} to ${plan.reasonHook}.`
                    : "This choice ignores your motivation and context.",
                ),
              };
            })
          : [
              {
                text: `Connect ${plan.topic} to the ${hooks.projectLabel}.`,
                isCorrect: true,
                explanation: "Keeping context visible makes learning stick.",
              },
              {
                text: "Ignore the context and memorize theory only.",
                isCorrect: false,
                explanation: "Without context, the insight fades quickly.",
              },
            ];

      const reflection = ensureString(block.reflectionPrompt, defaultReflection);
      const normalizedReflection = reflection.startsWith("Consider") ? reflection : defaultReflection;

      return {
        type: "quiz",
        title: ensureString(block.title, `Quiz: ${plan.topic}`),
        recap: ensureString(
          block.recap,
          `Remember: ${plan.topic} accelerates your goal of ${hooks.shortGoal}.`,
        ),
        scenario: ensureString(
          block.scenario,
          `Imagine a scene tied to ${plan.hobbyInfusion} where this matters.`,
        ),
        question: ensureString(
          block.question,
          `What keeps ${plan.topic} alive in your routine?`,
        ),
        kind: "single",
        options: normalizedOptions,
        penalty_hearts: ensureNumber(block.penalty_hearts, 1),
        reflectionPrompt: normalizedReflection,
      };
    }

    if (type === "code") {
      const starter = ensureString(block.starter, `// Write code related to ${plan.topic}\n`);
      const solution = ensureString(
        block.solution,
        `${starter}\n// mentor solution`,
      );
      const acceptanceCriteria = ensureStringArray(block.acceptanceCriteria, [
        `Code demonstrates ${plan.topic}.`,
        `It references ${plan.hobbyInfusion} to stay contextual.`,
        `Comments explain how this supports ${plan.lessonGoal}.`,
      ]);
      const reflection = ensureString(block.reflectionPrompt, defaultReflection);
      const normalizedReflection = reflection.startsWith("Consider") ? reflection : defaultReflection;

      return {
        type: "code",
        title: ensureString(block.title, `Workshop: ${plan.topic}`),
        instructions: ensureString(
          block.instructions,
          `The mentor walks you through a mini build focused on ${plan.topic}.`,
        ),
        language: ensureString(block.language, profile.learningGoal || "javascript"),
        starter,
        solution,
        acceptanceCriteria,
        penalty_hearts: ensureNumber(block.penalty_hearts, 0),
        reflectionPrompt: normalizedReflection,
      };
    }

    if (type === "ai-mentor") {
      const mode = (block.mode === "quiz" || block.mode === "explain") ? block.mode : "explain";
      const suggestedQuestions = ensureStringArray(block.suggestedQuestions, [
        `How does ${plan.topic} elevate your ${plan.hobbyInfusion} storyline?`,
        `What should you watch out for while chasing ${plan.lessonGoal}?`,
      ]);

      return {
        type: "ai-mentor",
        mode,
        title: ensureString(block.title, `Mentor: ${plan.topic}`),
        persona: ensureString(
          block.persona,
          hooks.gamerMode ? "Supportive quest mentor" : "Pragmatic coach",
        ),
        lessonContext: ensureString(block.lessonContext, defaultLessonContext),
        topic: ensureString(block.topic, plan.topic),
        prompt: ensureString(
          block.prompt,
          `Guide ${hooks.personaLabel} through applying ${plan.topic} within ${plan.hobbyInfusion}.`,
        ),
        suggestedQuestions,
        quizGoal: mode === "quiz" ? ensureNumber(block.quizGoal, 1) : undefined,
      };
    }

    // default to text block
    const markdownSource =
      typeof block.markdown === "string"
        ? block.markdown
        : ensureString(block.content, "");
    const markdown =
      markdownSource ||
      `The mentor summarizes ${plan.topic} and highlights how it fuels ${plan.lessonGoal}.`;

    return {
      type: "text",
      title: ensureString(block.title, fallbackTitle),
      markdown,
      microSteps: ensureStringArray(block.microSteps, defaultMicroSteps),
    };
  });
};

export async function POST(req: Request) {
  const body = (await req.json()) as LessonRequestBody;

  if (!body?.plan || !body?.profile || !body?.topicBlueprint) {
    return NextResponse.json(
      { error: "Lesson plan, user profile, and topic blueprint are required." },
      { status: 400 },
    );
  }

  const { plan, profile, topicBlueprint } = body;

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 },
    );
  }

  try {
    const userPrompt = generateUserPrompt(plan, profile, topicBlueprint);

    const payload = {
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: "application/json",
      },
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini lesson error", data);
      return NextResponse.json(
        { error: "Failed to generate lesson content." },
        { status: 502 },
      );
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("Gemini lesson empty response", data);
      return NextResponse.json(
        { error: "Lesson model returned empty content." },
        { status: 502 },
      );
    }

    let parsed: { blocks?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch (jsonError) {
      console.error("Gemini lesson JSON parse error", jsonError, content);
      return NextResponse.json(
        { error: "Lesson model returned invalid JSON." },
        { status: 502 },
      );
    }

    const blocks = normalizeBlocks(parsed.blocks, plan, profile, topicBlueprint);

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Lesson generation error", error);
    return NextResponse.json(
      { error: "Unable to generate lesson content." },
      { status: 500 },
    );
  }
}
