import { NextResponse } from "next/server";

interface ExaminerRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userCode?: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const responseSchema = {
  type: "object",
  properties: {
    passed: { type: "boolean" },
    feedback: { type: "string" },
    deduct_heart: { type: "boolean" },
  },
  required: ["passed", "feedback", "deduct_heart"],
};

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

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = (await req.json()) as ExaminerRequestBody;
  const { lessonContext, proficiency, userCode } = body;

  if (!lessonContext || !proficiency || !userCode) {
    return NextResponse.json(
      { error: "lessonContext, proficiency, and userCode are required." },
      { status: 400 },
    );
  }

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ExaminerResponse",
        schema: responseSchema,
      },
    },
    messages: [
      {
        role: "system",
        content:
          'You are "Mentor" in Examiner mode. Evaluate code fairly and rigorously. Check if it meets the acceptance criteria and solves the problem correctly. Accept different valid approaches, but the code must actually work and meet the requirements. Reject code with logic errors, incorrect output, or missing key functionality. Be encouraging but honest in feedback.',
      },
      {
        role: "user",
        content: `Proficiency: ${proficiency}\n\nLesson context and acceptance criteria:\n${lessonContext}\n\nUser's code:\n${userCode}\n\nEvaluate: Does it meet the acceptance criteria? Does it solve the problem? Is the logic correct? Be fair but rigorous - don't accept code that doesn't work or misses requirements.`,
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
      console.error("OpenAI examiner error", data);
      return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
    }

    const content = parseContent(data.choices?.[0]?.message?.content);
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Examiner route error", error);
    return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
  }
}
