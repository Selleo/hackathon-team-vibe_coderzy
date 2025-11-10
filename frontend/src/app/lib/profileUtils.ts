import { UserProfile } from "./types";

const sanitize = (value?: string) => value?.trim() ?? "";

const capitalizeWords = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const buildProfileHooks = (profile: UserProfile) => {
  const goal = sanitize(profile.learningGoal) || "ship a small interactive project";
  const reason = sanitize(profile.reason) || "stay curious";
  const jobStatus = sanitize(profile.jobStatus) || "learner";
  const experience = sanitize(profile.codingExperience) || "beginner";
  const captivates = sanitize(profile.captivates) || "problem solving";
  const hobbies = profile.hobbies?.filter((hobby) => Boolean(sanitize(hobby))) ?? [];

  const shortGoal = goal.length > 60 ? `${goal.slice(0, 57)}…` : goal;

  return {
    goal,
    shortGoal,
    reason,
    jobStatus,
    experience,
    captivates,
    hobbies,
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

export const deriveLanguageFromProfile = (profile: UserProfile): "javascript" | "python" | "typescript" => {
  const goal = sanitize(profile.learningGoal);
  if (!goal) {
    return "javascript";
  }

  // Check for explicit language mentions
  if (/\bpython\b/i.test(goal)) return "python";
  if (/\btypescript\b|\bts\b/i.test(goal)) return "typescript";
  if (/\bjavascript\b|\bjs\b|\breact\b|\bnode\b|\bvue\b|\bangular\b/i.test(goal)) return "javascript";
  
  // Check for framework/domain patterns
  if (/django|flask|fastapi|pandas|numpy|data\s+science|machine\s+learning/i.test(goal)) return "python";
  if (/next\.js|react|vue|angular|frontend|web\s+app/i.test(goal)) return "javascript";
  
  // Default to JavaScript
  return "javascript";
};

export const introFriendlyTopic = (profile: UserProfile): string =>
  `Introduction to ${deriveDisciplineLabel(profile)} Concepts`;

export const defaultTopicScaffolding = (profile: UserProfile): string[] => {
  const hooks = buildProfileHooks(profile);
  const discipline = deriveDisciplineLabel(profile);
  const action = hooks.hobbies.length > 0 ? `Projects Inspired by ${hooks.hobbies.join(', ')}` : "Side Projects";

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
