import {
  LessonPlan,
  StageStatus,
  UserProfile,
  TopicBlueprint,
  RoadmapTopic,
  LessonSummary,
  Lesson,
} from "./types";
import {
  buildProfileHooks,
  deriveDisciplineLabel,
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

const baseSequence: LessonPlan["lessonType"][] = ["text", "code", "quiz", "code", "mentor"];

const rotateSequence = (shift: number) =>
  baseSequence.map((_, index) => baseSequence[(index + shift) % baseSequence.length]);

type LessonTheme = {
  label: string;
  pitch: string;
  assessment: string;
  goalPrefix: string;
};

const LESSON_THEME_MAP: Record<"gamer" | "default", Record<LessonPlan["lessonType"], LessonTheme>> = {
  gamer: {
    text: {
      label: "Lore Drop",
      pitch: "The mentor narrates the mechanic like a story beat inside your favorite campaign.",
      assessment: "concept clarity",
      goalPrefix: "Anchor the fundamentals of",
    },
    code: {
      label: "Hero Workshop",
      pitch: "Pair-program a tiny spell or mechanic that could live in your go-to game.",
      assessment: "hands-on crafting",
      goalPrefix: "Turn the idea behind",
    },
    quiz: {
      label: "Checkpoint Boss",
      pitch: "Face a quick barrage of questions to prove the concept sticks.",
      assessment: "concept verification",
      goalPrefix: "Stress-test your reflexes on",
    },
    mentor: {
      label: "Mentor Campfire",
      pitch: "Slow the pace, trade insights with a guide, and plan the next raid.",
      assessment: "reflection",
      goalPrefix: "Reframe the strategy for",
    },
  },
  default: {
    text: {
      label: "Concept Studio",
      pitch: "Break the topic into crisp steps with relatable examples.",
      assessment: "concept explanation",
      goalPrefix: "Understand the principles of",
    },
    code: {
      label: "Build Lab",
      pitch: "Build a focused slice of code to see the mechanic run.",
      assessment: "implementation",
      goalPrefix: "Strengthen your practice around",
    },
    quiz: {
      label: "Knowledge Pulse",
      pitch: "Pulse-check your understanding with targeted prompts.",
      assessment: "knowledge check",
      goalPrefix: "Validate your intuition on",
    },
    mentor: {
      label: "Mentor Huddle",
      pitch: "Discuss blockers, momentum, and next experiments.",
      assessment: "strategy alignment",
      goalPrefix: "Realign the plan for",
    },
  },
};

const getLessonTheme = (
  lessonType: LessonPlan["lessonType"],
  gamerMode: boolean,
): LessonTheme => {
  const key = gamerMode ? "gamer" : "default";
  return LESSON_THEME_MAP[key][lessonType];
};

const buildLessonTitle = (
  topicBlueprint: TopicBlueprint,
  topicIndex: number,
  lessonIndex: number,
  lessonType: LessonPlan["lessonType"],
  hooks: ReturnType<typeof buildProfileHooks>,
) => {
  const theme = getLessonTheme(lessonType, hooks.gamerMode);
  const stage = `${topicIndex + 1}.${lessonIndex + 1}`;
  return `Lesson ${stage}: ${theme.label} - ${topicBlueprint.title}`;
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
  topicBlueprint: TopicBlueprint,
  lessonType: LessonPlan["lessonType"],
  lessonIndex: number,
  topicIndex: number,
  hooks: ReturnType<typeof buildProfileHooks>,
  isIntroTopic: boolean,
  profile: UserProfile,
): LessonPlan => {
  const title = buildLessonTitle(topicBlueprint, topicIndex, lessonIndex, lessonType, hooks);
  const templateId = templateIdForLesson(lessonType, isIntroTopic, lessonIndex);
  const hobby = hooks.primaryHobby || hooks.captivates;
  const theme = getLessonTheme(lessonType, hooks.gamerMode);
  const discipline = deriveDisciplineLabel(profile);

  return {
    templateId,
    lessonType,
    topic: topicBlueprint.title,
    title,
    description: `${theme.pitch} inside "${topicBlueprint.title}". We keep referencing ${hobby} so the concept sticks.`,
    focus: discipline,
    lessonGoal: `${theme.goalPrefix} ${topicBlueprint.title} so you move closer to ${hooks.shortGoal}.`,
    reasonHook: hooks.reason,
    hobbyInfusion: hobby,
    assessmentFocus: theme.assessment,
    topicBlueprintId: topicBlueprint.id,
    tone: hooks.gamerMode ? "playful" : "focused",
  };
};

export const generateRoadmapPlan = (
  profile: UserProfile,
  topics: TopicBlueprint[],
): RoadmapTopic[] => {
  const hooks = buildProfileHooks(profile);
  const discipline = deriveDisciplineLabel(profile);

  return topics.map((topic, topicIndex) => {
    const isIntro = INTRO_PATTERN.test(topic.title);
    const lessonCount = Math.max(4, isIntro ? 4 : 5);
    const sequence = isIntro ? baseSequence : rotateSequence(topicIndex % baseSequence.length);

    const lessons: LessonSummary[] = [];
    for (let i = 0; i < lessonCount; i++) {
      const lessonType = sequence[i];
      const plan = createLessonPlan(topic, lessonType, i, topicIndex, hooks, isIntro, profile);
      const lesson: Lesson = {
        id: `${slugify(topic.title)}-${lessonType}-${i}`,
        track: topic.title,
        chapter: topic.title,
        title: plan.title,
        estimated_minutes: 10,
        xp_reward: xpForLessonType(lessonType),
        prerequisites: [],
        blocks: [],
        plan,
      };
      lessons.push({
        id: lesson.id,
        title: lesson.title,
        status: topicIndex === 0 && i === 0 ? StageStatus.Unlocked : StageStatus.Locked,
        lesson,
      });
    }

    return {
      topicBlueprint: topic,
      topicSummary: `${topic.title} - ${topic.tagline}\nWhy it matters: ${topic.whyItMatters}\nKey skills: ${topic.skillsToUnlock.join(", ")}\nHobby hook: ${topic.hobbyHook}\nWe connect everything back to your goal (${hooks.shortGoal}) and the ${discipline} track.`,
      lessons,
    };
  });
};
