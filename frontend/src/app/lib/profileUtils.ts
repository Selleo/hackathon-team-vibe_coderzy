import { UserProfile, TopicBlueprint } from "./types";

const sanitize = (value?: string) => value?.trim() ?? "";

const capitalizeWords = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const hasGamingAffinity = (value: string) => /game|gaming|quest|hero|rpg|adventure/i.test(value);

const detectExperienceTier = (experience: string) =>
  /(beginner|no experience|never coded|student|junior|first project)/i.test(experience)
    ? "beginner"
    : "experienced";

const buildPersonaLabel = (jobStatus: string, experience: string) => {
  const job = capitalizeWords(jobStatus || "Learner");
  const level = capitalizeWords(experience || "Explorer");
  return `${level} ${job}`.trim();
};

export const buildProfileHooks = (profile: UserProfile) => {
  const goal = sanitize(profile.learningGoal) || "ship a small interactive project";
  const reason = sanitize(profile.reason) || "stay curious";
  const jobStatus = sanitize(profile.jobStatus) || "learner";
  const experience = sanitize(profile.codingExperience) || "beginner";
  const captivates = sanitize(profile.captivates) || "problem solving";
  const hobbies = profile.hobbies?.filter((hobby) => Boolean(sanitize(hobby))) ?? [];

  const shortGoal = goal.length > 60 ? `${goal.slice(0, 57)}...` : goal;
  const primaryHobby = hobbies[0] || captivates || "passion project";
  const projectLabel = hasGamingAffinity(primaryHobby)
    ? `${primaryHobby} quest`
    : `${primaryHobby} project`;
  const experienceTier = detectExperienceTier(experience);
  const personaLabel = buildPersonaLabel(jobStatus, experience);
  const gamerMode =
    hobbies.some((hobby) => hasGamingAffinity(hobby)) ||
    hasGamingAffinity(goal) ||
    hasGamingAffinity(reason);

  return {
    goal,
    shortGoal,
    reason,
    jobStatus,
    experience,
    captivates,
    hobbies,
    primaryHobby,
    projectLabel,
    experienceTier,
    personaLabel,
    gamerMode,
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
    { pattern: /c\+\+|cpp/i, label: "C++" },
  ];

  const match = keywords.find(({ pattern }) => pattern.test(goal));
  return match ? match.label : capitalizeWords(goal.split(/[,:-]/)[0] ?? "Programming");
};

type ModuleTemplate = (
  hooks: ReturnType<typeof buildProfileHooks>,
  discipline: string,
  index: number,
) => Omit<TopicBlueprint, "id">;

const gamerModuleTemplates: ModuleTemplate[] = [
  (hooks, discipline) => ({
    title: `Module 1: First Mission - Boot the Console`,
    tagline: `Launch your very first ${discipline} program and talk to the console like it is a co-op partner.`,
    whyItMatters: `As a ${hooks.personaLabel} driven by ${hooks.reason.toLowerCase()}, you need a confident take-off before chasing harder quests.`,
    skillsToUnlock: ["toolchain setup", "hello world flow", "confidence"],
    hobbyHook: `Imagine prepping a cockpit for your ${hooks.primaryHobby} hero.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["interactive tutorial", "mentor chat", "streak checkpoint"],
  }),
  (hooks, discipline) => ({
    title: `Module 2: Hero Inventory - Stats & Data`,
    tagline: `Name your character, assign HP, and store loot using core data structures inside ${discipline}.`,
    whyItMatters: `${hooks.shortGoal} becomes tangible when you can juggle numbers, text, and booleans with ease.`,
    skillsToUnlock: ["variables", "data types", "input/output"],
    hobbyHook: `Treat variables like inventory slots in your go-to ${hooks.primaryHobby} world.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["code challenge", "quiz", "interactive tutorial"],
  }),
  (hooks, discipline) => ({
    title: `Module 3: Crossroads - Decisions & Loops`,
    tagline: `Control story branches with conditionals, switches, and loops so your ${discipline} work reacts like a branching quest.`,
    whyItMatters: `Problem solvers like you thrive once logic mirrors the choices you want players or users to make.`,
    skillsToUnlock: ["if/else", "switch", "loops", "logic operators"],
    hobbyHook: `Think of every branch as a choose-your-own-adventure moment inspired by ${hooks.primaryHobby}.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["debugging exercise", "mentor chat", "code challenge"],
  }),
  (hooks, discipline) => ({
    title: `Module 4: Spellbook - Functions & Systems`,
    tagline: `Package reusable abilities (functions, modules) that you can cast whenever a ${discipline} feature needs it.`,
    whyItMatters: `Reusable logic stops burnout and keeps momentum toward ${hooks.shortGoal}.`,
    skillsToUnlock: ["functions", "parameters", "return values", "modularity"],
    hobbyHook: `Design a loadout of abilities for your ${hooks.primaryHobby} squad.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["mentor pairing", "code challenge", "quiz"],
  }),
  (hooks, discipline) => ({
    title: `Module 5: Final Dungeon - Mini Project Showcase`,
    tagline: `Ship a tiny, story-driven ${discipline} project that threads all mechanics together and proves you can lead the party.`,
    whyItMatters: `Finishing a tangible artifact validates your dedication and keeps your streak alive.`,
    skillsToUnlock: ["integration", "testing", "storytelling", "demo prep"],
    hobbyHook: `Pitch the project as if it were a new feature drop in your favorite ${hooks.primaryHobby} universe.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["code review", "showcase checklist", "mentor chat"],
  }),
];

const defaultModuleTemplates: ModuleTemplate[] = [
  (hooks, discipline) => ({
    title: `Module 1: Launch Pad - ${discipline} Foundations`,
    tagline: `Clarify the tools, mindset, and core building blocks so you can practice without second-guessing.`,
    whyItMatters: `As a ${hooks.personaLabel}, clarity at the beginning shortens the path to ${hooks.shortGoal}.`,
    skillsToUnlock: ["tooling", "syntax basics", "debug habits"],
    hobbyHook: `Connect each lesson to the way you approach ${hooks.primaryHobby}.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["interactive tutorial", "mentor chat"],
  }),
  (hooks, discipline) => ({
    title: `Module 2: Data Flow - Describe the World`,
    tagline: `Collect, store, and display information so your ${discipline} ideas become usable interfaces or simulations.`,
    whyItMatters: `Your motivation (${hooks.reason}) sticks when you can model what matters to you.`,
    skillsToUnlock: ["state management", "typing", "IO patterns"],
    hobbyHook: `Map any dataset or statistic from ${hooks.primaryHobby} into code.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["code challenge", "quiz"],
  }),
  (hooks, discipline) => ({
    title: `Module 3: Decision Lab - Logic & Control`,
    tagline: `Teach your ${discipline} application how to react under pressure using conditionals, loops, and guards.`,
    whyItMatters: `Reliable logic is the backbone of every product, puzzle, or experiment.`,
    skillsToUnlock: ["conditionals", "loops", "guards"],
    hobbyHook: `Recreate a decision tree inspired by ${hooks.primaryHobby}.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["debugging exercise", "mentor chat"],
  }),
  (hooks, discipline) => ({
    title: `Module 4: Systems Studio - Functions & Patterns`,
    tagline: `Transform messy ${discipline} scripts into reusable systems so collaboration (even with Future You) stays fun.`,
    whyItMatters: `Modularity lets you scale ideas without rewriting everything each sprint.`,
    skillsToUnlock: ["functions", "modules", "APIs"],
    hobbyHook: `Ask how this pattern would manifest inside your ${hooks.primaryHobby} project.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["design review", "code challenge"],
  }),
  (hooks, discipline) => ({
    title: `Module 5: Ship It - Apply ${discipline} to ${hooks.shortGoal}`,
    tagline: `Integrate everything into a proof-of-skill build you feel proud to share.`,
    whyItMatters: `Finishing a scoped build cements identity: you are someone who follows through.`,
    skillsToUnlock: ["project planning", "integration", "retrospective"],
    hobbyHook: `Let ${hooks.primaryHobby} shape the story, assets, or constraints of this project.`,
    targetExperience: hooks.experience,
    recommendedArtifacts: ["showcase checklist", "mentor chat", "code review"],
  }),
];

const buildDynamicBlueprints = (
  profile: UserProfile,
): Omit<TopicBlueprint, "id">[] => {
  const hooks = buildProfileHooks(profile);
  const discipline = deriveDisciplineLabel(profile);
  const templates = hooks.gamerMode ? gamerModuleTemplates : defaultModuleTemplates;

  return templates.map((template, index) => template(hooks, discipline, index));
};

export const generateTopicBlueprintsFallback = (profile: UserProfile): TopicBlueprint[] => {
  const templates = buildDynamicBlueprints(profile);
  return templates.map((topic, index) => ({
    ...topic,
    id: `dynamic-${index}`,
  }));
};
