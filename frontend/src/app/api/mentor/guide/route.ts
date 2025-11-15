import { NextResponse } from "next/server";

import {
  callGrok,
  extractResponseText,
  GrokConfigurationError,
  GrokRequestError,
} from "../../../lib/grok";

interface GuideRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userWork?: string;
  question?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as GuideRequestBody;
  const { lessonContext, proficiency, userWork, question } = body;

  if (!lessonContext || !proficiency || !userWork || !question) {
    return NextResponse.json(
      { error: "lessonContext, proficiency, userWork, and question are required." },
      { status: 400 },
    );
  }

  try {
    const messages = [
      {
        role: "system" as const,
        content:
          "You are 'Mentor' in Guide mode. Offer short Socratic guidance (max 4 sentences) and never give away the full solution unless the learner is clearly stuck.",
      },
      {
        role: "user" as const,
        content: `Proficiency: ${proficiency}\nLesson context: ${lessonContext}\nLearner work/question: ${userWork}\nPrompt: ${question}`,
      },
    ];

    const response = await callGrok(messages, { temperature: 0.7, maxOutputTokens: 300 });
    const content = extractResponseText(response);
    return NextResponse.json({ feedback: content.trim() });
  } catch (error) {
    if (error instanceof GrokConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof GrokRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Guide route error", error);
    return NextResponse.json({ error: "Unexpected error calling Grok." }, { status: 500 });
  }
}
