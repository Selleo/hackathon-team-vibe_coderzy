import { NextResponse } from "next/server";

import {
  callGrok,
  extractResponseText,
  GrokConfigurationError,
  GrokRequestError,
} from "../../../lib/grok";

type QuizRequest = {
  action?: "ask" | "answer";
  lessonContext?: string;
  topic?: string;
  prompt?: string;
  question?: string;
  answer?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as QuizRequest;
  const { action, lessonContext, topic, prompt, question, answer } = body;

  if (!action) {
    return NextResponse.json({ error: "action is required." }, { status: 400 });
  }

  if (!lessonContext || !topic) {
    return NextResponse.json(
      { error: "lessonContext and topic are required." },
      { status: 400 },
    );
  }

  if (action === "ask") {
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required for ask." }, { status: 400 });
    }

    try {
      const response = await callGrok(
        [
          {
            role: "system",
            content:
              "You are an AI mentor generating short open-ended quiz questions. Respond strictly with JSON using the shape {\"question\": string}.",
          },
          {
            role: "user",
            content: `Lesson context: ${lessonContext}\nTopic: ${topic}\nPrompt: ${prompt}\nGenerate one question that tests understanding and reflects the learner's interests.`,
          },
        ],
        { temperature: 0.7, maxOutputTokens: 300 },
      );

      const content = extractResponseText(response);
      try {
        const parsed = JSON.parse(content || "{}");
        return NextResponse.json(parsed);
      } catch (jsonError) {
        console.error("Quiz ask JSON parse error", jsonError, content);
        return NextResponse.json(
          { error: "Quiz generator returned invalid JSON." },
          { status: 502 },
        );
      }
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

      console.error("Quiz ask route error", error);
      return NextResponse.json({ error: "Unexpected error calling Grok." }, { status: 500 });
    }
  }

  if (action === "answer") {
    if (!question || !answer) {
      return NextResponse.json(
        { error: "question and answer are required for answer." },
        { status: 400 },
      );
    }

    try {
      const response = await callGrok(
        [
          {
            role: "system",
            content:
              "You are an AI mentor evaluating learner answers. Respond with JSON using the shape {\"correct\": boolean, \"feedback\": string}. Be encouraging but honest.",
          },
          {
            role: "user",
            content: `Lesson context: ${lessonContext}\nTopic: ${topic}\nQuestion: ${question}\nLearner answer: ${answer}`,
          },
        ],
        { temperature: 0.3, maxOutputTokens: 400 },
      );

      const content = extractResponseText(response);
      try {
        const parsed = JSON.parse(content || "{}");
        return NextResponse.json(parsed);
      } catch (jsonError) {
        console.error("Quiz answer JSON parse error", jsonError, content);
        return NextResponse.json(
          { error: "Quiz evaluator returned invalid JSON." },
          { status: 502 },
        );
      }
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

      console.error("Quiz answer route error", error);
      return NextResponse.json({ error: "Unexpected error calling Grok." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
