import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, "mentor_chats.json");

    const entry = {
      id: Date.now(),
      message: body.message,
      userProfile: body.userProfile,
      conversationHistory: body.conversationHistory,
      timestamp: new Date().toISOString(),
    };

    let arr: any[] = [];
    if (fs.existsSync(filePath)) {
      const txt = fs.readFileSync(filePath, "utf8");
      arr = txt ? JSON.parse(txt) : [];
    }

    arr.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));

    // For now, reply with a simple assistant message and confirm save
    const assistantReply = `Wiadomość zapisana. Prześlij kolejne pytanie, a ja pomogę.`;

    return NextResponse.json({ response: assistantReply });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
