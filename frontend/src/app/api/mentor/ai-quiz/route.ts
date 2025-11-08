import { NextResponse } from "next/server";

type QuizRequest = {
  action?: "ask" | "answer";
  lessonContext?: string;
  topic?: string;
  prompt?: string;
  question?: string;
  answer?: string;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type ContentPart = { text?: string };

const parseContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const candidate = part as ContentPart;
          if (typeof candidate.text === "string") {
            return candidate.text;
          }
        }
        return "";
      })
      .join("");
  }
  return "";
};

const questionSchema = {
  name: "MentorQuizQuestion",
  schema: {
    type: "object",
    properties: {
      question: { type: "string" },
    },
    required: ["question"],
  },
};

const answerSchema = {
  name: "MentorQuizAnswer",
  schema: {
    type: "object",
    properties: {
      correct: { type: "boolean" },
      feedback: { type: "string" },
    },
    required: ["correct", "feedback"],
  },
};

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
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
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: questionSchema,
      },
      messages: [
        {
          role: "system",
          content:
            "You are an AI mentor generating short open-ended quiz questions. Use JSON schema when responding.",
        },
        {
          role: "user",
          content: `Lesson context: ${lessonContext}\nTopic: ${topic}\nPrompt: ${prompt}\nGenerate one question that tests understanding.`,
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
        console.error("OpenAI quiz ask error", data);
        return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
      }

      const parsed = JSON.parse(parseContent(data.choices?.[0]?.message?.content));
      return NextResponse.json(parsed);
    } catch (error) {
      console.error("Quiz ask route error", error);
      return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
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
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: answerSchema,
      },
      messages: [
        {
          role: "system",
          content:
            "You are an AI mentor evaluating learner answers. Respond with the JSON schema and be encouraging but honest.",
        },
        {
          role: "user",
          content: `Lesson context: ${lessonContext}\nTopic: ${topic}\nQuestion: ${question}\nLearner answer: ${answer}`,
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
        console.error("OpenAI quiz answer error", data);
        return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
      }

      const parsed = JSON.parse(parseContent(data.choices?.[0]?.message?.content));
      return NextResponse.json(parsed);
    } catch (error) {
      console.error("Quiz answer route error", error);
      return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
