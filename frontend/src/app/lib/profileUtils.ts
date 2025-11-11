import { UserProfile, TopicBlueprint } from "./types";

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

export const generateTopicBlueprintsFallback = (profile: UserProfile): TopicBlueprint[] => {
  const hooks = buildProfileHooks(profile);
  const discipline = deriveDisciplineLabel(profile);
  const hobby = hooks.hobbies[0] || hooks.captivates;

  const topics: Omit<TopicBlueprint, 'id'>[] = [
    {
      title: `Introduction to ${discipline}`,
      tagline: `A personalized starting point for your journey into ${discipline}, tailored to your goal of ${hooks.shortGoal}.`,
      whyItMatters: `As a ${hooks.jobStatus} who is motivated by ${hooks.reason}, understanding these fundamentals is the first step toward achieving your learning goal.`,
      skillsToUnlock: ["core concepts", "foundational syntax", "problem-solving mindset"],
      hobbyHook: `We'll connect these concepts to your interest in ${hobby}.`,
      targetExperience: hooks.experience,
      recommendedArtifacts: ["streak challenge", "mentor chat"],
    },
    {
      title: `${discipline} Fundamentals: Variables & Data`,
      tagline: "Learn how to store and manage information, a key skill for any developer.",
      whyItMatters: `To build anything meaningful for your goal of ${hooks.shortGoal}, you need to handle data. This is crucial for a ${hooks.jobStatus}.`,
      skillsToUnlock: ["data storage", "memory management", "typing"],
      hobbyHook: `Think about how you would model data related to ${hobby}.`,
      targetExperience: hooks.experience,
      recommendedArtifacts: ["code challenge", "quiz"],
    },
    {
      title: `${discipline} Control Flow`,
      tagline: "Direct the flow of your application and make decisions in code.",
      whyItMatters: `Your motivation to ${hooks.reason} will be amplified when you can create dynamic applications that respond to user input.`,
      skillsToUnlock: ["conditional logic", "loops", "functions"],
      hobbyHook: `We can apply this to create a simple interactive experience related to ${hobby}.`,
      targetExperience: hooks.experience,
      recommendedArtifacts: ["code challenge", "mentor chat"],
    },
    {
      title: `Practical Patterns for ${discipline}`,
      tagline: "Discover common patterns that will make your code more professional and scalable.",
      whyItMatters: `As a ${hooks.jobStatus}, writing clean, maintainable code is a key skill that will help you achieve ${hooks.shortGoal}.`,
      skillsToUnlock: ["design patterns", "code structure", "modularity"],
      hobbyHook: `These patterns can be used to structure a project inspired by ${hobby}.`,
      targetExperience: hooks.experience,
      recommendedArtifacts: ["streak challenge", "code review"],
    },
    {
      title: `Applying ${discipline} to ${hooks.shortGoal}`,
      tagline: "A capstone topic to apply everything you've learned to a real-world scenario.",
      whyItMatters: `This is where your motivation to ${hooks.reason} pays off. You'll build something tangible that you can be proud of.`,
      skillsToUnlock: ["project planning", "integration", "debugging"],
      hobbyHook: `Let's build a mini-project related to ${hobby} that you can share.`,
      targetExperience: hooks.experience,
      recommendedArtifacts: ["mentor chat", "code challenge"],
    },
  ];

  return topics.map((topic, index) => ({
    ...topic,
    id: `fallback-${index}`,
  }));
};