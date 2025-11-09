import { NextResponse } from "next/server";
import { UserProfile } from "../../lib/types";
import { generateTopicsFallback } from "../../lib/roadmapBuilder";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const responseSchema = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["topics"],
};

export async function POST(req: Request) {
  const profile = (await req.json()) as UserProfile;
  const fallbackTopics = generateTopicsFallback(profile);

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
  }

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "TopicsResponse",
        schema: responseSchema,
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are a curriculum generator. Produce 5-7 topics ordered from foundational to advanced. Each topic must be self-contained, specific, and reference the learner's context (reason, job, hobby, goal).",
      },
      {
        role: "user",
        content: `Learner profile:
- Reason: ${profile.reason}
- Job status: ${profile.jobStatus}
- Coding experience: ${profile.codingExperience}
- Captivated by: ${profile.captivates}
- Learning goal: ${profile.learningGoal}
- Hobbies: ${profile.hobbies.join(", ") || "None listed"}

Return only topic titles (no descriptions). Ensure the list covers fundamentals, practice, and review.`,
      },
    ],
  };

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI topics error", data);
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }

    const contentRaw = data.choices?.[0]?.message?.content;
    let parsed: unknown = null;
    try {
      parsed = contentRaw ? JSON.parse(contentRaw) : null;
    } catch {
      parsed = null;
    }
    const topics =
      parsed && typeof parsed === "object" && "topics" in parsed
        ? (parsed as { topics?: string[] }).topics ?? []
        : [];
    if (!Array.isArray(topics) || topics.length < 5) {
      return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
    }
    return NextResponse.json({ topics, source: "openai" });
  } catch (error) {
    console.error("Topics route error", error);
    return NextResponse.json({ topics: fallbackTopics, source: "fallback" });
  }
}
