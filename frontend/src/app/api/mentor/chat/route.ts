import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface ChatHistoryItem {
  role: "user" | "model";
  content: string;
}

interface MentorChatPayload {
  message: string;
  userProfile: Record<string, unknown>;
  conversationHistory?: ChatHistoryItem[];
}

interface MentorChatEntry extends MentorChatPayload {
  id: number;
  timestamp: string;
}

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as MentorChatPayload;

    const systemPrompt = `You are a helpful programming mentor. Your role is to guide and support learners on their coding journey.

User Profile:
- Reason for learning: ${body.userProfile.reason || "Not specified"}
- Job status: ${body.userProfile.jobStatus || "Not specified"}
- Coding experience: ${body.userprofile.codingExperience || "beginner"}
- What captivates them: ${body.userProfile.captivates || "Not specified"}
- Learning goal: ${body.userProfile.learningGoal || "Not specified"}
- Hobbies: ${Array.isArray(body.userProfile.hobbies) ? body.userProfile.hobbies.join(", ") : "Not specified"}

Adapt your responses to their experience level and goals. Be encouraging, clear, and provide practical guidance.`;

    const contents = (body.conversationHistory ?? []).map((item) => ({
      role: item.role,
      parts: [{ text: item.content }],
    }));

    // Add the new user message to the contents
    contents.push({
      role: "user",
      parts: [{ text: body.message }],
    });

    // Call Gemini API
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // Save to mentor_chats.json for history tracking
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, "mentor_chats.json");

    const entry: MentorChatEntry = {
      id: Date.now(),
      message: body.message,
      userProfile: body.userProfile,
      conversationHistory: body.conversationHistory ?? [],
      timestamp: new Date().toISOString(),
    };

    let storedEntries: MentorChatEntry[] = [];
    if (fs.existsSync(filePath)) {
      const txt = fs.readFileSync(filePath, "utf8");
      storedEntries = txt ? (JSON.parse(txt) as MentorChatEntry[]) : [];
    }

    storedEntries.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(storedEntries, null, 2));

    return NextResponse.json({ response: assistantReply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
