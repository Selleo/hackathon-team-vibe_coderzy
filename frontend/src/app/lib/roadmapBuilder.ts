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

const lessonTitle = (
  topicTitle: string,
  lessonIndex: number,
  userGoalHook: string
) => {
  return `Lesson ${lessonIndex + 1}: ${topicTitle} - ${userGoalHook}`;
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
  hooks: ReturnType<typeof buildProfileHooks>,
  isIntroTopic: boolean,
  profile: UserProfile,
): LessonPlan => {
  const title = lessonTitle(topicBlueprint.title, lessonIndex, hooks.shortGoal);
  const templateId = templateIdForLesson(lessonType, isIntroTopic, lessonIndex);
  const hobby = hooks.hobbies[0] || hooks.captivates;

  return {
    templateId,
    lessonType,
    topic: topicBlueprint.title,
    title,
    description: `A lesson on ${topicBlueprint.title} to help you with ${hooks.goal}, because you are motivated by ${hooks.reason}. We'll connect this to your interest in ${hobby}.`,
    focus: deriveDisciplineLabel(profile),
    lessonGoal: `Understand ${topicBlueprint.title} to achieve ${hooks.shortGoal}`,
    reasonHook: hooks.reason,
    hobbyInfusion: hobby,
    assessmentFocus: "core concepts",
    topicBlueprintId: topicBlueprint.id,
  };
};

export const generateRoadmapPlan = (
  profile: UserProfile,
  topics: TopicBlueprint[],
): RoadmapTopic[] => {
  const hooks = buildProfileHooks(profile);

  return topics.map((topic, topicIndex) => {
    const isIntro = INTRO_PATTERN.test(topic.title);
    const lessonCount = Math.max(4, isIntro ? 4 : 5);
    const sequence = isIntro ? baseSequence : rotateSequence(topicIndex % baseSequence.length);

    const lessons: LessonSummary[] = [];
    for (let i = 0; i < lessonCount; i++) {
      const lessonType = sequence[i];
      const plan = createLessonPlan(topic, lessonType, i, hooks, isIntro, profile);
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
      topicSummary: `A series of lessons on ${topic.title} to help you with your goal of ${hooks.goal}. This topic matters because ${topic.whyItMatters}. We will connect this to your interest in ${topic.hobbyHook}.`,
      lessons,
    };
  });
};