import { NextResponse } from "next/server";

type ExplainRequest = {
  lessonContext?: string;
  proficiency?: string;
  persona?: string;
  topic?: string;
  prompt?: string;
  learnerQuestion?: string;
  history?: { role: "model" | "user"; content: string }[];
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = (await req.json()) as ExplainRequest;
  const { lessonContext, proficiency, persona, topic, prompt, learnerQuestion, history } = body;

  if (!lessonContext || !proficiency || !persona || !topic || !prompt || !learnerQuestion) {
    return NextResponse.json(
      { error: "lessonContext, proficiency, persona, topic, prompt, and learnerQuestion are required." },
      { status: 400 },
    );
  }

  const contents = (history ?? []).map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }));

  contents.push({
    role: "user",
    parts: [
      {
        text: `You are an AI mentor in ${persona} mode. Explain topics clearly, encourage reflection, and keep responses under five sentences.
Lesson context: ${lessonContext}\nTopic: ${topic}\nPrompt: ${prompt}\nLearner question: ${learnerQuestion}\nProficiency: ${proficiency}`,
      },
    ],
  });

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.4,
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
      console.error("Gemini explain error", data);
      return NextResponse.json({ error: "Failed to contact Gemini." }, { status: 502 });
    }

    const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text.trim() ?? "";
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Explain route error", error);
    return NextResponse.json({ error: "Unexpected error calling Gemini." }, { status: 500 });
  }
}