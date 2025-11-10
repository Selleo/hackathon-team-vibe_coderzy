import { NextResponse } from "next/server";

interface GuideRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userWork?: string;
  question?: string;
}

import { NextResponse } from "next/server";

interface GuideRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userWork?: string;
  question?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = (await req.json()) as GuideRequestBody;
  const { lessonContext, proficiency, userWork, question } = body;

  if (!lessonContext || !proficiency || !userWork || !question) {
    return NextResponse.json(
      { error: "lessonContext, proficiency, userWork, and question are required." },
      { status: 400 },
    );
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `You are "Mentor" in Guide mode. Offer short Socratic guidance (max 4 sentences) and never give away the full solution unless the learner is clearly stuck.
Proficiency: ${proficiency}\nLesson context: ${lessonContext}\nLearner work/question: ${userWork}\nPrompt: ${question}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
    },
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
      console.error("Gemini guide error", data);
      return NextResponse.json({ error: "Failed to contact Gemini." }, { status: 502 });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text.trim() ?? "";
    return NextResponse.json({ feedback: content });
  } catch (error) {
    console.error("Guide route error", error);
    return NextResponse.json({ error: "Unexpected error calling Gemini." }, { status: 500 });
  }
}
