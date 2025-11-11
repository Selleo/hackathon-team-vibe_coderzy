import { NextResponse } from "next/server";
import { LessonPlan, UserProfile } from "../../lib/types";

interface LessonRequestBody {
  plan: LessonPlan;
  profile: UserProfile;
  topicBlueprint: TopicBlueprint;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const generateUserPrompt = (plan: LessonPlan, profile: UserProfile, topicBlueprint: TopicBlueprint): string => {
  const hobbies = profile.hobbies.join(', ') || 'their interests';
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

IMPORTANT:
- Every generated string (titles, descriptions, micro-steps, quiz rationales) must explicitly reference the user's survey answers.
- Do NOT use placeholders. All content must be fully personalized.
- Teach directly. Do not say "you will learn".
- Ensure the output is a single valid JSON object, with no extra text or explanations. All strings must be properly escaped.
`;

  switch (plan.lessonType) {
    case "text":
      return `
${baseContext}
Create a text-based lesson with 2-3 blocks.
Each text block must include a "microSteps" array with 2-3 concrete actions the learner can take, related to their profile.
For example: "Sketch a UI idea for a project inspired by your hobby of ${plan.hobbyInfusion}".

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Personalized Title for Text Block 1",
      "markdown": "Personalized markdown content for block 1, referencing user's goal and hobbies.",
      "microSteps": ["Personalized micro-step 1", "Personalized micro-step 2"]
    },
    {
      "type": "text",
      "title": "Personalized Title for Text Block 2",
      "markdown": "More personalized content, connecting to '${profile.reason}'.",
      "microSteps": ["Another personalized micro-step related to ${plan.hobbyInfusion}", "Actionable step for a ${profile.jobStatus}"]
    }
  ]
}
`;
    case "quiz":
      return `
${baseContext}
Create a quiz-based lesson with 1 text block and 2 quiz blocks.
Each quiz block must include a "reflectionPrompt" asking the learner to connect their answer to their goal or hobby.

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Quiz Prep: ${plan.topic}",
      "markdown": "A brief, personalized introduction to the quiz topic, tying into ${profile.learningGoal}."
    },
    {
      "type": "quiz",
      "title": "Challenge 1: ${plan.topic}",
      "recap": "A recap related to the user's experience level.",
      "scenario": "A scenario inspired by ${plan.hobbyInfusion}.",
      "question": "A challenging question about the topic.",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Personalized explanation for why this is correct for a ${profile.jobStatus}."}, 
        {"text": "Option 2", "isCorrect": false, "explanation": "Personalized explanation for why this is incorrect."} 
      ],
      "penalty_hearts": 1,
      "reflectionPrompt": "How does this concept apply to your goal of ${profile.learningGoal}?"
    },
    {
      "type": "quiz",
      "title": "Challenge 2: Deeper Dive",
      "recap": "Another recap.",
      "scenario": "A different scenario, this time related to ${profile.captivates}.",
      "question": "Another question.",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Correct explanation."}, 
        {"text": "Option 2", "isCorrect": false, "explanation": "Incorrect explanation."}
      ],
      "penalty_hearts": 1,
      "reflectionPrompt": "Think about how you could use this in a project about ${plan.hobbyInfusion}."
    }
  ]
}
`;
    case "code":
      return `
${baseContext}
Create a code-based lesson with 1 text block, 1 code block, and 1 quiz block.
The code block must have a "reflectionPrompt".

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Code Prep: ${plan.topic}",
      "markdown": "A brief, personalized introduction to the coding challenge, mentioning ${profile.reason}."
    },
    {
      "type": "code",
      "title": "Code Challenge: ${plan.topic}",
      "instructions": "Personalized instructions for the coding challenge.",
      "language": "javascript",
      "starter": "function yourChallenge() {\n  // Your code here\n}",
      "solution": "function yourChallenge() {\n  return 'solution';\n}",
      "acceptanceCriteria": ["Criteria 1 related to ${profile.learningGoal}", "Criteria 2"],
      "penalty_hearts": 0,
      "reflectionPrompt": "How would you adapt this code for a project about ${plan.hobbyInfusion}?"
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