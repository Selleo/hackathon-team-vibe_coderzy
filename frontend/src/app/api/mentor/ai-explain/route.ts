import { NextResponse } from "next/server";

type ExplainRequest = {
  lessonContext?: string;
  proficiency?: string;
  persona?: string;
  topic?: string;
  prompt?: string;
  learnerQuestion?: string;
  history?: { role: "mentor" | "user"; content: string }[];
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

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
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

  const historyMessages =
    history?.map((message) => ({
      role: message.role === "mentor" ? "assistant" : "user",
      content: message.content,
    })) ?? [];

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          `You are an AI mentor in ${persona} mode. Explain topics clearly, encourage reflection, and keep responses under five sentences.`,
      },
      ...historyMessages,
      {
        role: "user",
        content: `Lesson context: ${lessonContext}\nTopic: ${topic}\nPrompt: ${prompt}\nLearner question: ${learnerQuestion}\nProficiency: ${proficiency}`,
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
      console.error("OpenAI explain error", data);
      return NextResponse.json({ error: "Failed to contact OpenAI." }, { status: 502 });
    }

    const feedback = parseContent(data.choices?.[0]?.message?.content).trim();
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Explain route error", error);
    return NextResponse.json({ error: "Unexpected error calling OpenAI." }, { status: 500 });
  }
}
