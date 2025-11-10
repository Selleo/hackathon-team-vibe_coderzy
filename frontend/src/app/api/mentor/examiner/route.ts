import { NextResponse } from "next/server";

interface ExaminerRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userCode?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const responseSchema = {
  type: "object",
  properties: {
    passed: { type: "boolean" },
    feedback: { type: "string" },
    deduct_heart: { type: "boolean" },
  },
  required: ["passed", "feedback", "deduct_heart"],
};

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
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
    contents: [
      {
        parts: [
          {
            text: `You are "Mentor" in Examiner mode. Evaluate code fairly and rigorously. Check if it meets the acceptance criteria and solves the problem correctly. Accept different valid approaches, but the code must actually work and meet the requirements. Reject code with logic errors, incorrect output, or missing key functionality. Be encouraging but honest in feedback.
Proficiency: ${proficiency}\n\nLesson context and acceptance criteria:\n${lessonContext}\n\nUser's code:\n${userCode}\n\nEvaluate: Does it meet the acceptance criteria? Does it solve the problem? Is the logic correct? Be fair but rigorous - don't accept code that doesn't work or misses requirements.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: "application/json",
      response_schema: responseSchema,
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
      console.error("Gemini examiner error", data);
      return NextResponse.json({ error: "Failed to contact Gemini." }, { status: 502 });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Examiner route error", error);
    return NextResponse.json({ error: "Unexpected error calling Gemini." }, { status: 500 });
  }
}
