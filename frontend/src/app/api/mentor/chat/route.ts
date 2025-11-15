import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

import {
  callGrok,
  extractResponseText,
  GrokConfigurationError,
  GrokRequestError,
} from "../../../lib/grok";
import { UserProfile } from "../../../lib/types";

interface ChatHistoryItem {
  role: "user" | "model";
  content: string;
}

interface MentorChatPayload {
  message: string;
  userProfile: UserProfile;
  conversationHistory?: ChatHistoryItem[];
}

interface MentorChatEntry extends MentorChatPayload {
  id: number;
  timestamp: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MentorChatPayload;

    if (!body?.message || !body?.userProfile) {
      return NextResponse.json(
        { error: "message and userProfile are required." },
        { status: 400 },
      );
    }

    const systemPrompt = `You are a helpful programming mentor. Your role is to guide and support learners on their coding journey.

User Profile:
- Reason for learning: ${body.userProfile.reason || "Not specified"}
- Job status: ${body.userProfile.jobStatus || "Not specified"}
- Coding experience: ${body.userProfile.codingExperience || "beginner"}
- What captivates them: ${body.userProfile.captivates || "Not specified"}
- Learning goal: ${body.userProfile.learningGoal || "Not specified"}
- Hobbies: ${Array.isArray(body.userProfile.hobbies) ? body.userProfile.hobbies.join(", ") : "Not specified"}

Adapt your responses to their experience level and goals. Be encouraging, clear, and provide practical guidance.`;

    const historyMessages = (body.conversationHistory ?? []).map((item) => ({
      role: mapHistoryRole(item.role),
      content: item.content,
    }));

    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: body.message },
    ];

    const assistantReply = await getAssistantReply(
      messages,
      body.userProfile,
      body.message,
      historyMessages,
    );

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
    if (error instanceof GrokConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (error instanceof GrokRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getAssistantReply(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  profile: UserProfile,
  lastMessage: string,
  history: { role: "assistant" | "user"; content: string }[],
): Promise<string> {
  try {
    const response = await callGrok(messages, {
      temperature: 0.7,
      maxOutputTokens: 400,
    });

    const assistantReply = extractResponseText(response)?.trim();
    if (assistantReply) {
      return assistantReply;
    }
  } catch (error) {
    if (!(error instanceof GrokConfigurationError) && !(error instanceof GrokRequestError)) {
      throw error;
    }

    console.warn("Falling back to heuristic mentor response", error);
  }

  return generateFallbackMentorResponse(profile, lastMessage, history);
}

function mapHistoryRole(role: string): "assistant" | "user" {
  if (role === "assistant" || role === "model") {
    return "assistant";
  }

  return "user";
}

function generateFallbackMentorResponse(
  profile: UserProfile,
  message: string,
  history: { role: "assistant" | "user"; content: string }[],
): string {
  const normalizedMessage = message.toLowerCase();
  const experience = (profile.codingExperience || "beginner").toLowerCase();
  const intensity = profile.learningGoal || profile.reason || "twoje tempo";
  const conversationCount = history.filter((item) => item.role === "assistant").length + 1;

  const thanksKeywords = ["dziękuję", "dzieki", "dzięki", "dziekuje", "thanks", "thx"];
  if (thanksKeywords.some((keyword) => normalizedMessage.includes(keyword))) {
    return "Cieszę się, że mogłem pomóc! Jeśli masz kolejne pytania lub chcesz rozwinąć temat, po prostu daj znać.";
  }

  const helpKeywords = ["pomoc", "help", "pytanie", "nie wiem", "?", "jak", "dlaczego"];
  if (helpKeywords.some((keyword) => normalizedMessage.includes(keyword))) {
    if (experience === "beginner") {
      return (
        "Pamiętaj, że początki zawsze są wyzwaniem, ale idzie Ci świetnie. " +
        "Opisz proszę dokładniej swój problem, a rozłożymy go na małe kroki i wszystko przejdziemy razem."
      );
    }

    if (experience.includes("intermediate") || experience.includes("mid")) {
      return (
        "Masz już solidne podstawy, więc spróbujmy od razu wejść w szczegóły. " +
        "Prześlij fragment kodu albo opisz przypadek, a pomogę Ci znaleźć najlepsze rozwiązanie."
      );
    }

    return (
      "Skoro masz już sporo doświadczenia, skupmy się na optymalizacji i dobrych praktykach. " +
      "Opowiedz, gdzie dokładnie utknąłeś, a przeanalizujemy to jak inżynierowie przy code review."
    );
  }

  if (conversationCount === 1) {
    return (
      `Widzę, że pracujesz nad celem: ${intensity || "rozwój"}. ` +
      "Jestem tu, by prowadzić Cię krok po kroku i reagować na Twoje tempo. " +
      "Napisz, nad czym dokładnie chcesz popracować, a zaproponuję kolejne kroki."
    );
  }

  return (
    "Zrozumiem Twoją sytuację. Opisz proszę dokładniej kontekst lub pokaż fragment kodu, a " +
    "przejdziemy przez rozwiązanie wspólnie tak, abyś czuł się pewniej z tematem."
  );
}
