import { NextResponse } from "next/server";
import { UserProfile, TopicBlueprint } from "../../lib/types";
import { generateRoadmapPlan } from "../../lib/roadmapBuilder";
import { generateTopicBlueprintsFallback } from "../../lib/profileUtils";

type RoadmapRequest = {
  topics?: TopicBlueprint[];
  profile: UserProfile;
};

export async function POST(req: Request) {
  const body = (await req.json()) as RoadmapRequest;
  const profile = body?.profile;

  if (!profile) {
    return NextResponse.json({ error: "User profile is required." }, { status: 400 });
  }

  const topics = Array.isArray(body?.topics) ? body.topics.filter(Boolean) : [];
  const fallbackTopics = topics.length ? topics : generateTopicBlueprintsFallback(profile);

  const lessons = generateRoadmapPlan(profile, fallbackTopics);
  return NextResponse.json({ lessons });
}