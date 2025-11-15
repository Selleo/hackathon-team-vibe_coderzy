import { NextResponse } from "next/server";

import {
  callGrok,
  extractResponseText,
  GrokConfigurationError,
  GrokRequestError,
} from "../../../lib/grok";

type ExplainRequest = {
  lessonContext?: string;
  proficiency?: string;
  persona?: string;
  topic?: string;
  prompt?: string;
  learnerQuestion?: string;
  history?: { role: "model" | "user"; content: string }[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as ExplainRequest;
  const { lessonContext, proficiency, persona, topic, prompt, learnerQuestion, history } = body;

  if (!lessonContext || !proficiency || !persona || !topic || !prompt || !learnerQuestion) {
    return NextResponse.json(
      { error: "lessonContext, proficiency, persona, topic, prompt, and learnerQuestion are required." },
      { status: 400 },
    );
  }

  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are an AI mentor in ${persona} mode. Explain topics clearly, encourage reflection, and keep responses under five sentences. Use a confident but empathetic tone.`,
      },
      ...((history ?? []).map((message) => ({
        role: message.role === "model" ? "assistant" : "user",
        content: message.content,
      })) as { role: "assistant" | "user"; content: string }[]),
      {
        role: "user" as const,
        content: `Lesson context: ${lessonContext}\nTopic: ${topic}\nPrompt: ${prompt}\nLearner question: ${learnerQuestion}\nProficiency: ${proficiency}\nProvide the next mentor response.`,
      },
    ];

    const response = await callGrok(messages, { temperature: 0.4, maxOutputTokens: 500 });
    const feedback = extractResponseText(response).trim();
    return NextResponse.json({ feedback });
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

    console.error("Explain route error", error);
    return NextResponse.json({ error: "Unexpected error calling Grok." }, { status: 500 });
  }
}
