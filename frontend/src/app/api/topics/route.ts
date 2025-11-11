import { NextResponse } from "next/server";
import { UserProfile, TopicBlueprint } from "../../lib/types";
import { generateTopicBlueprintsFallback } from "../../lib/profileUtils";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const topicBlueprintSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    tagline: { type: "string" },
    whyItMatters: { type: "string" },
    skillsToUnlock: { type: "array", items: { type: "string" } },
    hobbyHook: { type: "string" },
    targetExperience: { type: "string" },
    recommendedArtifacts: { type: "array", items: { type: "string" } },
  },
  required: [
    "id",
    "title",
    "tagline",
    "whyItMatters",
    "skillsToUnlock",
    "hobbyHook",
    "targetExperience",
    "recommendedArtifacts",
  ],
};

const responseSchema = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: topicBlueprintSchema,
    },
  },
  required: ["topics"],
};

export async function POST(req: Request) {
  const profile = (await req.json()) as UserProfile;
  const fallbackTopics = generateTopicBlueprintsFallback(profile);

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
  }

  const payload = {
    generationConfig: {
      temperature: 0.7,
      response_mime_type: "application/json",
      response_schema: responseSchema,
    },
    contents: [
      {
        parts: [
          {
            text: `You are a curriculum generator for a personalized learning platform called ViaMent. Your task is to generate a list of 5-7 topic blueprints based on the provided user profile. Each blueprint must be redundantly grounded in the user's survey answers.

User Profile:
- Reason for learning: ${profile.reason}
- Job status: ${profile.jobStatus}
- Coding experience: ${profile.codingExperience}
- What captivates them: ${profile.captivates}
- Learning goal: ${profile.learningGoal}
- Hobbies: ${profile.hobbies.join(", ") || "None listed"}

For each topic blueprint, you must generate the following fields:
- id: A unique slug-like identifier for the topic.
- title: A short, engaging title for the topic.
- tagline: A one-sentence tagline that summarizes the topic and its value.
- whyItMatters: A sentence explaining why this topic is important for the user, explicitly referencing their reason for learning and job status.
- skillsToUnlock: A list of 2-3 skills the user will unlock, referencing their learning goal and what captivates them.
- hobbyHook: A sentence that explicitly connects the topic to one of the user's hobbies. If no hobbies are listed, use what captivates them.
- targetExperience: The user's coding experience level.
- recommendedArtifacts: A list of 2-3 recommended learning artifacts (e.g., "streak challenge", "mentor chat", "code challenge", "quiz").

IMPORTANT:
- Every field must be filled with personalized content based on the user profile.
- The 'whyItMatters' and 'hobbyHook' fields must explicitly reference the user's profile data.
- The output must be a single valid JSON object with a 'topics' array, and all strings must be properly escaped.
`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini topics error", data);
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }

    const contentRaw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsed: { topics: TopicBlueprint[] } | null = null;
    try {
      parsed = contentRaw ? JSON.parse(contentRaw) : null;
    } catch (error) {
      console.error("JSON parsing error in /api/topics", error);
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }
    
    const topics = parsed?.topics ?? [];
    if (!Array.isArray(topics) || topics.length < 5) {
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }
    return NextResponse.json({ topics, source: "gemini" });
  } catch (error) {
    console.error("Topics route error", error);
    return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
  }
}