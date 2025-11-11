import { LessonBlock, LessonPlan, UserProfile, TopicBlueprint } from "../lib/types";

const headers = {
  "Content-Type": "application/json",
};

const parseError = async (response: Response) => {
  try {
    const data = await response.json();
    return data?.error ?? "Unexpected server error";
  } catch {
    return "Unexpected server error";
  }
};

export const hydrateLessonBlocks = async (
  plan: LessonPlan,
  profile: UserProfile,
  topicBlueprint: TopicBlueprint,
): Promise<LessonBlock[]> => {
  const response = await fetch("/api/lesson", {
    method: "POST",
    headers,
    body: JSON.stringify({ plan, profile, topicBlueprint }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { blocks?: LessonBlock[] };
  if (!data?.blocks || !Array.isArray(data.blocks)) {
    throw new Error("Lesson blocks not returned.");
  }
  return data.blocks;
};
