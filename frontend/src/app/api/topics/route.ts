import { NextResponse } from "next/server";
import { UserProfile, TopicBlueprint } from "../../lib/types";
import { generateTopicBlueprintsFallback } from "../../lib/profileUtils";
import {
  callGrok,
  extractResponseText,
  hasGrokConfig,
  GrokConfigurationError,
  GrokRequestError,
} from "../../lib/grok";

export async function POST(req: Request) {
  const profile = (await req.json()) as UserProfile;
  const fallbackTopics = generateTopicBlueprintsFallback(profile);

  if (!hasGrokConfig()) {
    return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
  }

  try {
    const response = await callGrok(
      [
        {
          role: "system",
          content:
            "You are a curriculum generator for ViaMent. Always respond with JSON in the shape {\"topics\": TopicBlueprint[]}.",
        },
        {
          role: "user",
          content: `Generate 5-7 topic blueprints personalized for this user. Fill every field with profile-grounded content.\n\nUser Profile:\n- Reason for learning: ${profile.reason}\n- Job status: ${profile.jobStatus}\n- Coding experience: ${profile.codingExperience}\n- What captivates them: ${profile.captivates}\n- Learning goal: ${profile.learningGoal}\n- Hobbies: ${profile.hobbies.join(", ") || "None listed"}\n\nFields required for each topic:\n- id\n- title\n- tagline\n- whyItMatters (must reference the user motivation/job)\n- skillsToUnlock (2-3 items)\n- hobbyHook (explicit tie to a hobby or interest)\n- targetExperience\n- recommendedArtifacts (2-3 items)`,
        },
      ],
      { temperature: 0.7, maxOutputTokens: 1200 },
    );

    const contentRaw = extractResponseText(response);
    let parsed: { topics: TopicBlueprint[] } | null = null;
    try {
      parsed = contentRaw ? JSON.parse(contentRaw) : null;
    } catch (error) {
      console.error("JSON parsing error in /api/topics", error, contentRaw);
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }

    const topics = parsed?.topics ?? [];
    if (!Array.isArray(topics) || topics.length < 5) {
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }
    return NextResponse.json({ topics, source: "openai" });
  } catch (error) {
    if (error instanceof GrokConfigurationError || error instanceof GrokRequestError) {
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }

    console.error("Topics route error", error);
    return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
  }
}
