import { NextResponse } from "next/server";
import { LessonPlan, UserProfile, TopicBlueprint } from "../../lib/types";

interface LessonRequestBody {
  plan: LessonPlan;
  profile: UserProfile;
  topicBlueprint: TopicBlueprint;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const generateUserPrompt = (plan: LessonPlan, profile: UserProfile, topicBlueprint: TopicBlueprint): string => {
  const hobbies = profile.hobbies.join(", ") || "their interests";
  const baseContext = `
This learner is a ${profile.jobStatus} with ${profile.codingExperience} experience.
Their reason for learning is: "${profile.reason}".
Their learning goal is: "${profile.learningGoal}".
They are captivated by: "${profile.captivates}".
Their hobbies include: ${hobbies}.

The current topic is "${plan.topic}", which is part of their goal to ${plan.lessonGoal}.
This lesson should be infused with their interest in ${plan.hobbyInfusion}.
The reason hook for this lesson is: "${plan.reasonHook}".
The assessment focus is: "${plan.assessmentFocus}".
The topic blueprint tagline says: "${topicBlueprint.tagline}", and it matters because ${topicBlueprint.whyItMatters}.
Recommended artifacts for this topic: ${topicBlueprint.recommendedArtifacts.join(", ") || "streaks and mentor chats"}.
Key skills to unlock: ${topicBlueprint.skillsToUnlock.join(", ")}.

IMPORTANT:
- Every generated string (titles, descriptions, micro-steps, quiz rationales) must explicitly reference the user's survey answers.
- Teach by demonstrating concepts in narrative form. Avoid assigning homework or telling the learner to "go do" tasks. Use phrases like "Notice how..." or "Let's walk through..." instead of imperatives.
- Micro-steps must describe what the mentor is showing, not commands.
- Do NOT use placeholders. All content must be fully personalized.
- Teach directly. Avoid "you will learn" phrasing.
- Ensure the output is a single valid JSON object, with no extra text or explanations. All strings must be properly escaped.
`;

  switch (plan.lessonType) {
    case "text":
      return `
${baseContext}
Create a text-based lesson with 2-3 blocks.
Each text block must:
- Provide 2 concise paragraphs that explain the concept while weaving in ${profile.learningGoal} and ${plan.hobbyInfusion}.
- Include a concrete example (code, pseudo, or relatable analogy) that matches their ${profile.codingExperience} level.
- Supply a "microSteps" array with 2-3 guided observations phrased as "We first notice..." or "Next, see how..." (never commands).

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Personalized Title for Text Block 1",
      "markdown": "Personalized markdown content that explains the concept using the learner's goal and hobby context.",
      "microSteps": ["Guided observation 1 narrated by the mentor", "Guided observation 2 tied to ${plan.hobbyInfusion}"]
    },
    {
      "type": "text",
      "title": "Personalized Title for Text Block 2",
      "markdown": "Additional explanation that connects back to \"${profile.reason}\" and ${profile.jobStatus} life.",
      "microSteps": ["Narrated micro-step referencing ${profile.learningGoal}", "Narrated micro-step showing how ${plan.hobbyInfusion} sparks the idea"]
    }
  ]
}
`;
    case "quiz":
      return `
${baseContext}
Create a quiz-based lesson with 1 teaching text block and 2 quiz blocks.
- The text block should actively explain the concept with an example rooted in their ${profile.jobStatus} world and hobby "${plan.hobbyInfusion}".
- Each quiz block must contain a "reflectionPrompt" that starts with "Consider..." and invites them to think rather than act.

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Quiz Prep: ${plan.topic}",
      "markdown": "A brief, personalized introduction that explains the topic through an example tied to ${profile.learningGoal}."
    },
    {
      "type": "quiz",
      "title": "Challenge 1: ${plan.topic}",
      "recap": "A recap related to the user's experience level.",
      "scenario": "A scenario inspired by ${plan.hobbyInfusion}.",
      "question": "A challenging question about the topic that references their ${profile.codingExperience} background.",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Personalized explanation for why this is correct for a ${profile.jobStatus}."}, 
        {"text": "Option 2", "isCorrect": false, "explanation": "Personalized explanation for why this is incorrect."} 
      ],
      "penalty_hearts": 1,
      "reflectionPrompt": "Consider how this concept strengthens your goal of ${profile.learningGoal}."
    },
    {
      "type": "quiz",
      "title": "Challenge 2: Deeper Dive",
      "recap": "Another recap.",
      "scenario": "A different scenario, this time related to ${profile.captivates}.",
      "question": "Another question.",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Explain why this aligns with their motivation \"${profile.reason}\"."}, 
        {"text": "Option 2", "isCorrect": false, "explanation": "Explain the misconception using their hobby ${plan.hobbyInfusion}."}
      ],
      "penalty_hearts": 1,
      "reflectionPrompt": "Consider how this insight could inspire a ${plan.hobbyInfusion}-flavored vignette the mentor just described."
    }
  ]
}
`;
    case "code":
      return `
${baseContext}
Create a code-based lesson with 1 teaching text block, 1 guided code block, and 1 quiz block.
- The text block should narrate the mentor walking through a snippet aimed at ${profile.learningGoal}.
- The code block presents a focused challenge but describe it as something the mentor is demonstrating with the learner.
- Provide starter and solution snippets plus acceptance criteria tied to their context.
- Include a "reflectionPrompt" that invites thoughtful adaptation rather than action.

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Code Prep: ${plan.topic}",
      "markdown": "A brief, personalized introduction where the mentor walks through the coding idea, mentioning ${profile.reason}."
    },
    {
      "type": "code",
      "title": "Code Challenge: ${plan.topic}",
      "instructions": "Personalized walkthrough of the coding challenge described in a collaborative tone aimed at ${profile.learningGoal}.",
      "language": "javascript",
      "starter": "function yourChallenge() {\n  // Scaffolding that mirrors the mentor's walkthrough\n}",
      "solution": "function yourChallenge() {\n  // Completed solution explained by the mentor\n  return 'solution';\n}",
      "acceptanceCriteria": ["Criteria 1 related to ${profile.learningGoal}", "Criteria 2 referencing ${plan.hobbyInfusion}", "Criteria 3 echoing ${profile.reason}"],
      "penalty_hearts": 0,
      "reflectionPrompt": "Consider how this walkthrough could later inspire a ${plan.hobbyInfusion} themed tweak."
    },
    {
      "type": "quiz",
      "title": "Code Understanding",
      "recap": "A recap of the code challenge.",
      "scenario": "A scenario related to the code challenge.",
      "question": "A question about the code.",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Correct explanation."}, 
        {"text": "Option 2", "isCorrect": false, "explanation": "Incorrect explanation."}
      ],
      "penalty_hearts": 1
    }
  ]
}
`;
    default:
      return "Generate a default lesson.";
  }
};

export async function POST(req: Request) {
  const body = (await req.json()) as LessonRequestBody;

  if (!body?.plan || !body?.profile || !body?.topicBlueprint) {
    return NextResponse.json(
      { error: "Lesson plan, user profile, and topic blueprint are required." },
      { status: 400 },
    );
  }

  const { plan, profile, topicBlueprint } = body;

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 },
    );
  }

  try {
    const userPrompt = generateUserPrompt(plan, profile, topicBlueprint);

    const payload = {
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: "application/json",
      },
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini lesson error", data);
      return NextResponse.json(
        { error: "Failed to generate lesson content." },
        { status: 502 },
      );
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(content);
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Lesson generation error", error);
    return NextResponse.json(
      { error: "Unable to generate lesson content." },
      { status: 500 },
    );
  }
}
