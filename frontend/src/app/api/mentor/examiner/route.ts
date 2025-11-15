import { NextResponse } from "next/server";

import {
  callGrok,
  extractResponseText,
  GrokConfigurationError,
  GrokRequestError,
} from "../../../lib/grok";

interface ExaminerRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userCode?: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as ExaminerRequestBody;
  const { lessonContext, proficiency, userCode } = body;

  if (!lessonContext || !proficiency || !userCode) {
    return NextResponse.json(
      { error: "lessonContext, proficiency, and userCode are required." },
      { status: 400 },
    );
  }

  try {
    const systemPrompt =
      'You are "Mentor" in Examiner mode. Evaluate code fairly and rigorously. Check if it meets the acceptance criteria and solves the problem correctly. Accept different valid approaches, but the code must actually work. Reject code with logic errors or missing functionality. Respond strictly with JSON using the shape {"passed": boolean, "feedback": string, "deduct_heart": boolean}.';

    const userPrompt = `Proficiency: ${proficiency}\n\nLesson context and acceptance criteria:\n${lessonContext}\n\nUser's code:\n${userCode}\n\nEvaluate the submission and set deduct_heart to true only when the learner should lose a heart.`;

    const response = await callGrok(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.2, maxOutputTokens: 600 },
    );

    const content = extractResponseText(response);
    try {
      const parsed = JSON.parse(content || "{}");
      return NextResponse.json(parsed);
    } catch (jsonError) {
      console.error("Examiner JSON parse error", jsonError, content);
      return NextResponse.json(
        { error: "Examiner model returned invalid JSON." },
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

    console.error("Examiner route error", error);
    return NextResponse.json({ error: "Unexpected error calling Grok." }, { status: 500 });
  }
}
