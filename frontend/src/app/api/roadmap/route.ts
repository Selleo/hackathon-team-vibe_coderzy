import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const responseSchema = {
  type: "object",
  properties: {
    lessons: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["text", "quiz", "code"] },
        },
        required: ["title", "description", "type"],
      },
    },
  },
  required: ["lessons"],
};

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const { topic } = (await req.json()) as { topic: string };

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "RoadmapResponse",
        schema: responseSchema,
      },
    },
    messages: [
      {
        role: "system",
        content:
          "You are a curriculum generator. Based on the user's topic, generate a list of lessons. Each lesson should have a title, a description, and a type (text, quiz, or code).",
      },
      {
        role: "user",
        content: `Generate 3-5 lessons for the following topic: ${topic}`,
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
      console.error("OpenAI roadmap error", data);
      return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
    }

    const content = JSON.parse(data.choices?.[0]?.message?.content);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Roadmap route error", error);
    return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
  }
}
