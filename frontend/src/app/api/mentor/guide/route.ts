import { NextResponse } from "next/server";

interface GuideRequestBody {
  lessonContext?: string;
  proficiency?: string;
  userWork?: string;
  question?: string;
}

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

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
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
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          'You are "Mentor" in Guide mode. Offer short Socratic guidance (max 4 sentences) and never give away the full solution unless the learner is clearly stuck.',
      },
      {
        role: "user",
        content: `Proficiency: ${proficiency}\nLesson context: ${lessonContext}\nLearner work/question: ${userWork}\nPrompt: ${question}`,
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
      console.error("OpenAI guide error", data);
      return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
    }

    const content = parseContent(data.choices?.[0]?.message?.content).trim();
    return NextResponse.json({ feedback: content });
  } catch (error) {
    console.error("Guide route error", error);
    return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
  }
}
