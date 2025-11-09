import { UserProfile } from "./types";

const sanitize = (value?: string) => value?.trim() ?? "";

const capitalizeWords = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const fallbackProject = "personal side project";

export const getPrimaryHobby = (profile: UserProfile): string | null => {
  return profile.hobbies?.find((hobby) => Boolean(sanitize(hobby))) ?? null;
};

export const buildProfileHooks = (profile: UserProfile) => {
  const goal = sanitize(profile.learningGoal) || "ship a small interactive project";
  const reason = sanitize(profile.reason) || "stay curious";
  const jobStatus = sanitize(profile.jobStatus) || "learner";
  const experience = sanitize(profile.codingExperience) || "beginner";
  const captivates = sanitize(profile.captivates) || "problem solving";
  const hobby = getPrimaryHobby(profile);

  const projectLabel = hobby ? `${hobby} side project` : fallbackProject;
  const shortGoal = goal.length > 60 ? `${goal.slice(0, 57)}…` : goal;

  return {
    goal,
    shortGoal,
    reason,
    jobStatus,
    experience,
    captivates,
    hobby,
    projectLabel,
  };
};

export const deriveDisciplineLabel = (profile: UserProfile): string => {
  const goal = sanitize(profile.learningGoal);
  if (!goal) {
    return "Programming";
  }

  const keywords = [
    { pattern: /frontend|react|ui|javascript/i, label: "Frontend Engineering" },
    { pattern: /backend|api|python|fastapi/i, label: "Backend Foundations" },
    { pattern: /data|analysis|ml|ai/i, label: "Data & AI" },
    { pattern: /mobile|ios|android/i, label: "Mobile Development" },
    { pattern: /game/i, label: "Game Programming" },
  ];

  const match = keywords.find(({ pattern }) => pattern.test(goal));
  return match ? match.label : capitalizeWords(goal.split(/[,:-]/)[0] ?? "Programming");
};

export const introFriendlyTopic = (profile: UserProfile): string =>
  `Introduction to ${deriveDisciplineLabel(profile)} Concepts`;

export const defaultTopicScaffolding = (profile: UserProfile): string[] => {
  const hooks = buildProfileHooks(profile);
  const discipline = deriveDisciplineLabel(profile);
  const action = hooks.hobby ? `Projects Inspired by ${hooks.hobby}` : "Side Projects";

  const baseTopics = [
    introFriendlyTopic(profile),
    `${discipline} Fundamentals: Variables & Data Types`,
    `${discipline} Control Flow Foundations`,
    `Practical ${discipline} Patterns for ${action}`,
    `Applying ${discipline} to ${hooks.shortGoal}`,
    `Review & Reflection for ${hooks.reason}`,
  ];

  const uniqueTopics = Array.from(new Set(baseTopics.map((topic) => topic.trim()))).filter(Boolean);
  return uniqueTopics.slice(0, 6);
};
