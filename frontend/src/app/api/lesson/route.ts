import { NextResponse } from "next/server";
import { LessonPlan, LessonBlock, UserProfile } from "../../lib/types";
import { buildBlocksFromPlan } from "../../lib/lessonBlocks";

interface LessonRequestBody {
  plan?: LessonPlan;
  profile?: UserProfile;
}

export async function POST(req: Request) {
  const body = (await req.json()) as LessonRequestBody;

  if (!body?.plan || !body?.profile) {
    return NextResponse.json(
      { error: "Lesson plan and user profile are required." },
      { status: 400 },
    );
  }

  try {
    const blocks: LessonBlock[] = buildBlocksFromPlan(body.plan, body.profile);
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Lesson hydrate error", error);
    return NextResponse.json(
      { error: "Unable to generate lesson content." },
      { status: 500 },
    );
  }
}
