import { LessonPlan, StageStatus, UserProfile } from "./types";
import {
  buildProfileHooks,
  defaultTopicScaffolding,
  deriveDisciplineLabel,
  introFriendlyTopic,
} from "./profileUtils";

const INTRO_PATTERN = /(intro|fundament|overview|basic)/i;

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const xpForLessonType = (lessonType: LessonPlan["lessonType"]) => {
  switch (lessonType) {
    case "code":
      return 30;
    case "quiz":
      return 22;
    case "mentor":
      return 18;
    case "text":
    default:
      return 16;
  }
};

export interface RoadmapLessonPlan {
  id: string;
  title: string;
  topic: string;
  status: StageStatus;
  plan: LessonPlan;
  xp_reward: number;
}

export const generateTopicsFallback = (profile: UserProfile): string[] => {
  const scaffolding = defaultTopicScaffolding(profile);
  return scaffolding.length ? scaffolding : [introFriendlyTopic(profile)];
};

const baseSequence: LessonPlan["lessonType"][] = ["text", "quiz", "code", "mentor"];

const rotateSequence = (shift: number) =>
  baseSequence.map((_, index) => baseSequence[(index + shift) % baseSequence.length]);

const lessonTitle = (
  topic: string,
  hooks: ReturnType<typeof buildProfileHooks>,
  lessonType: LessonPlan["lessonType"],
  index: number,
) => {
  const prefixMap: Record<LessonPlan["lessonType"], string[]> = {
    text: ["Connect", "Unpack", "Spotlight"],
    quiz: ["Scenario check", "Quick recap", "Concept pulse"],
    code: ["Mini build", "Pseudo sprint", "Plan the steps"],
    mentor: ["Mentor session", "Open question", "Reflection desk"],
  };
  const prefix = prefixMap[lessonType][index % prefixMap[lessonType].length];
  return `${prefix}: ${topic} → ${hooks.projectLabel}`;
};

const templateIdForLesson = (
  lessonType: LessonPlan["lessonType"],
  isIntro: boolean,
  lessonIndex: number,
) => {
  if (lessonType === "text") {
    return isIntro && lessonIndex === 0 ? "text-foundation" : "text-deepening";
  }
  if (lessonType === "quiz") return "quiz-scenario";
  if (lessonType === "code") return "code-plan";
  return "mentor-duo";
};

const createLessonPlan = (
  topic: string,
  lessonType: LessonPlan["lessonType"],
  lessonIndex: number,
  hooks: ReturnType<typeof buildProfileHooks>,
  isIntroTopic: boolean,
  profile: UserProfile,
): LessonPlan => {
  const title = lessonTitle(topic, hooks, lessonType, lessonIndex);
  const templateId = templateIdForLesson(lessonType, isIntroTopic, lessonIndex);
  const descriptionBase = `Tie ${topic} to ${hooks.goal} for someone who is ${hooks.reason.toLowerCase()}.`;

  if (lessonType === "text") {
    return {
      templateId,
      lessonType,
      topic,
      title,
      description: descriptionBase,
      focus: hooks.projectLabel,
      quickActions: [
        `Relate the idea to your work as a ${hooks.jobStatus}`,
        `Note how it helps with ${hooks.shortGoal}`,
        `Capture one blocker to ask the mentor`,
      ],
      snippetTag: "<button class=\"focus-pill\">Reflect</button>",
      emphasis: hooks.captivates,
    };
  }

  if (lessonType === "quiz") {
    return {
      templateId,
      lessonType,
      topic,
      title,
      description: `${descriptionBase} Challenge their memory before building.`,
      focus: hooks.shortGoal,
      scenario: `While crafting ${hooks.projectLabel}, a ${hooks.jobStatus.toLowerCase()} wants ${topic} to support ${hooks.reason.toLowerCase()}.`,
      quickActions: [
        `Identify the best option for ${hooks.projectLabel}`,
        `Explain why another option slows the plan`,
      ],
    };
  }

  if (lessonType === "code") {
    return {
      templateId,
      lessonType,
      topic,
      title,
      description: `Help the learner sketch pseudocode for ${topic} without locking them to a language.`,
      focus: deriveDisciplineLabel(profile),
      scenario: `Outline steps they can adapt for ${hooks.projectLabel}`,
      quickActions: [
        "Draft a three-step plan",
        "Mark where to personalize messaging",
      ],
      snippetTag: "<pseudo>plan()</pseudo>",
    };
  }

  return {
    templateId,
    lessonType,
    topic,
    title,
    description: `${descriptionBase} Use a mentor persona that balances warmth and accountability.`,
    focus: hooks.reason,
    persona: hooks.experience.toLowerCase().includes("beginner")
      ? "encouraging guide"
      : "pragmatic coach",
    prompt: `Explain ${topic} using examples from ${hooks.projectLabel}. After that, switch into examiner mode and ask open questions until the learner gives confident answers that align with ${hooks.goal}. Reference their job status (${hooks.jobStatus}) and what captivates them (${hooks.captivates}).`,
    emphasis: hooks.captivates,
  };
};

export const generateRoadmapPlan = (
  profile: UserProfile,
  topics: string[],
): RoadmapLessonPlan[] => {
  const hooks = buildProfileHooks(profile);
  const validTopics = topics.length ? topics : generateTopicsFallback(profile);

  const roadmap: RoadmapLessonPlan[] = [];
  let globalIndex = 0;

  validTopics.forEach((topic, topicIndex) => {
    const sanitizedTopic = topic.trim() || introFriendlyTopic(profile);
    const isIntro = INTRO_PATTERN.test(sanitizedTopic);
    const lessonCount = Math.max(3, isIntro ? 3 : 4);
    const sequence = isIntro ? baseSequence : rotateSequence(topicIndex % baseSequence.length);

    for (let lessonIndex = 0; lessonIndex < lessonCount; lessonIndex += 1) {
      const sequenceType = sequence[lessonIndex % sequence.length];
      const lessonType =
        isIntro && lessonIndex === 0 ? "text" : sequenceType;
      const plan = createLessonPlan(
        sanitizedTopic,
        lessonType,
        lessonIndex,
        hooks,
        isIntro,
        profile,
      );
      roadmap.push({
        id: `${slugify(sanitizedTopic)}-${lessonType}-${lessonIndex}`,
        title: plan.title,
        topic: sanitizedTopic,
        status: globalIndex === 0 ? StageStatus.Unlocked : StageStatus.Locked,
        plan,
        xp_reward: xpForLessonType(lessonType),
      });
      globalIndex += 1;
    }
  });

  return roadmap;
};
