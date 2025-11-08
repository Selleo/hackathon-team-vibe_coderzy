import { NextResponse } from "next/server";
import { UserProfile } from "@/app/lib/types";

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
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const profile = (await req.json()) as UserProfile;

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
          "You are a curriculum generator. Based on the user's profile, generate a list of 5-7 topics they should learn. The topics should be in a logical order, starting from the basics and moving to more advanced topics. The topics should be relevant to the user's learning goal and coding experience.",
      },
      {
        role: "user",
        content: `Generate a list of topics for a user with the following profile:
- Reason for studying: ${profile.reason}
- Job status: ${profile.jobStatus}
- Coding experience: ${profile.codingExperience}
- What captivates them about coding: ${profile.captivates}
- Learning goal: ${profile.learningGoal}
- Hobbies: ${profile.hobbies.join(", ")}

Please generate a list of 5-7 topics that would be a good starting point for this user. The topics should be specific and actionable. For example, instead of "JavaScript", suggest "JavaScript Fundamentals (Variables, Data Types, Functions)".`,
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
      return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
    }

    const content = JSON.parse(data.choices?.[0]?.message?.content);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Topics route error", error);
    return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
  }
}
