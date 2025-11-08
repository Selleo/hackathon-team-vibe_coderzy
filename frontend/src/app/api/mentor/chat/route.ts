import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface ChatHistoryItem {
  role: "user" | "assistant";
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
  try {
    const body = (await req.json()) as MentorChatPayload;

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

    const assistantReply = "Wiadomość zapisana. Prześlij kolejne pytanie, a ja pomogę.";

    return NextResponse.json({ response: assistantReply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
