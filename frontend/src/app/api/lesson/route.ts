import { NextResponse } from "next/server";
import { LessonPlan, LessonBlock, UserProfile } from "../../lib/types";

interface LessonRequestBody {
  plan?: LessonPlan;
  profile?: UserProfile;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const deriveLanguageFromTopic = (topic: string): string => {
  const topicLower = topic.toLowerCase();
  if (/\bpython\b|django|flask|fastapi/.test(topicLower)) return "Python";
  if (/\btypescript\b/.test(topicLower)) return "TypeScript";
  if (/\bjava\b(?!script)|spring/.test(topicLower)) return "Java";
  if (/\bc#\b|csharp|\.net/.test(topicLower)) return "C#";
  if (/\bgo\b|golang/.test(topicLower)) return "Go";
  if (/\brust\b/.test(topicLower)) return "Rust";
  return "JavaScript";
};

export async function POST(req: Request) {
  const body = (await req.json()) as LessonRequestBody;

  if (!body?.plan || !body?.profile) {
    return NextResponse.json(
      { error: "Lesson plan and user profile are required." },
      { status: 400 },
    );
  }

  const { plan, profile } = body;
  const language = deriveLanguageFromTopic(plan.topic);

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured." },
      { status: 500 },
    );
  }

  try {
    let systemPrompt = "";
    let userPrompt = "";

    if (plan.lessonType === "text") {
      systemPrompt = "You are an expert educator creating engaging lesson content. Generate comprehensive, well-structured text lessons in markdown format.";
      userPrompt = `Create a text lesson about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Motivation: ${profile.captivates}
- Goal: ${profile.learningGoal}

Generate a lesson with:
1. Clear introduction explaining the concept
2. Real-world examples related to their goal
3. Key points to remember
4. 3-5 quick action items for the learner

Format the response as JSON with this structure:
{
  "blocks": [
    {
      "type": "text",
      "title": "Lesson Title",
      "markdown": "Full lesson content in markdown with ## headings, **bold**, lists, etc.",
      "quickActions": ["Action 1", "Action 2", "Action 3"]
    }
  ]
}`;
    } else if (plan.lessonType === "quiz") {
      systemPrompt = "You are an expert educator creating quiz questions that test understanding in practical scenarios.";
      userPrompt = `Create a quiz about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Goal: ${profile.learningGoal}

Generate a quiz with:
1. A brief recap of the concept (2-3 sentences)
2. A practical scenario related to their goal
3. A clear question
4. 3-4 multiple choice options (only one correct)
5. Explanations for each option

Format as JSON:
{
  "blocks": [
    {
      "type": "quiz",
      "title": "Quiz Title",
      "recap": "Brief recap of the concept",
      "scenario": "Practical scenario",
      "question": "The question to answer",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Why this is correct"},
        {"text": "Option 2", "isCorrect": false, "explanation": "Why this is wrong"},
        {"text": "Option 3", "isCorrect": false, "explanation": "Why this is wrong"}
      ],
      "penalty_hearts": 1
    }
  ]
}`;
    } else if (plan.lessonType === "code") {
      systemPrompt = `You are an expert ${language} developer creating coding challenges.`;
      userPrompt = `Create a coding challenge about "${plan.topic}" in ${language} for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Language: ${language}
- Goal: ${profile.learningGoal}

Generate:
1. Clear instructions in markdown
2. Starter code in ${language} with TODO comments
3. A working solution
4. 3-4 acceptance criteria

Format as JSON:
{
  "blocks": [
    {
      "type": "code",
      "title": "Challenge Title",
      "instructions": "Instructions in markdown explaining what to do",
      "language": "${language.toLowerCase()}",
      "starter": "// Starter code template\\nfunction example() {\\n  // TODO: implement\\n}",
      "solution": "// Working solution\\nfunction example() {\\n  return 'done';\\n}",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"],
      "penalty_hearts": 0
    }
  ]
}`;
    } else if (plan.lessonType === "mentor") {
      systemPrompt = "You are creating an AI mentor session configuration for interactive learning.";
      userPrompt = `Create a mentor session about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Goal: ${profile.learningGoal}

Generate an AI mentor session with:
1. Clear context about the topic
2. A prompt that guides the AI to explain and then quiz the learner
3. Suggested questions they might ask

Format as JSON:
{
  "blocks": [
    {
      "type": "ai-mentor",
      "mode": "explain",
      "title": "Mentor Session: ${plan.topic}",
      "persona": "supportive mentor",
      "lessonContext": "Context for the AI",
      "topic": "${plan.topic}",
      "prompt": "Detailed prompt for the AI mentor",
      "suggestedQuestions": ["Question 1", "Question 2"]
    }
  ]
}`;
    }

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

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
      console.error("OpenAI lesson error", data);
      return NextResponse.json(
        { error: "Failed to generate lesson content." },
        { status: 502 },
      );
    }

    const content = data.choices?.[0]?.message?.content;
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
