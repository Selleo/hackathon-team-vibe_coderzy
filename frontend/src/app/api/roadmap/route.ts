import { NextResponse } from "next/server";
import { UserProfile } from "../../lib/types";
import { generateRoadmapPlan, generateTopicsFallback } from "../../lib/roadmapBuilder";

type RoadmapRequest = {
  topics?: string[];
  profile: UserProfile;
};

export async function POST(req: Request) {
  const body = (await req.json()) as RoadmapRequest;
  const profile = body?.profile;

  if (!profile) {
    return NextResponse.json({ error: "User profile is required." }, { status: 400 });
  }

  const topics = Array.isArray(body?.topics) ? body.topics.filter(Boolean) : [];
  const fallbackTopics = topics.length ? topics : generateTopicsFallback(profile);

  const lessons = generateRoadmapPlan(profile, fallbackTopics);
  return NextResponse.json({ lessons });
}
