import { NextResponse } from "next/server";

type QuizRequest = {
  action?: "ask" | "answer";
  lessonContext?: string;
  topic?: string;
  prompt?: string;
  question?: string;
  answer?: string;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const questionSchema = {
  type: "object",
  properties: {
    question: { type: "string" },
  },
  required: ["question"],
};

const answerSchema = {
  type: "object",
  properties: {
    correct: { type: "boolean" },
    feedback: { type: "string" },
  },
  required: ["correct", "feedback"],
};

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

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

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are an AI mentor generating short open-ended quiz questions. Use JSON schema when responding.\nLesson context: ${lessonContext}\nTopic: ${topic}\nPrompt: ${prompt}\nGenerate one question that tests understanding.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: "application/json",
        response_schema: questionSchema,
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
        console.error("Gemini quiz ask error", data);
        return NextResponse.json({ error: "Failed to contact Gemini." }, { status: 502 });
      }

      const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
      return NextResponse.json(parsed);
    } catch (error) {
      console.error("Quiz ask route error", error);
      return NextResponse.json({ error: "Unexpected error calling Gemini." }, { status: 500 });
    }
  }

  if (action === "answer") {
    if (!question || !answer) {
      return NextResponse.json(
        { error: "question and answer are required for answer." },
        { status: 400 },
      );
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are an AI mentor evaluating learner answers. Respond with the JSON schema and be encouraging but honest.\nLesson context: ${lessonContext}\nTopic: ${topic}\nQuestion: ${question}\nLearner answer: ${answer}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        response_mime_type: "application/json",
        response_schema: answerSchema,
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
        console.error("Gemini quiz answer error", data);
        return NextResponse.json({ error: "Failed to contact Gemini." }, { status: 502 });
      }

      const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
      return NextResponse.json(parsed);
    } catch (error) {
      console.error("Quiz answer route error", error);
      return NextResponse.json({ error: "Unexpected error calling Gemini." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
