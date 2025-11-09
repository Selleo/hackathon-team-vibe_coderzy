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
      systemPrompt = "You are an expert educator creating engaging lesson content. Generate well-structured text lessons in markdown format. Keep each block VERY SHORT and focused.";
      userPrompt = `Create a complete text lesson about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Motivation: ${profile.captivates}
- Goal: ${profile.learningGoal}

Generate a lesson with 3 SEPARATE text blocks (the user will go through them one by one):

Block 1 - Introduction (VERY SHORT, 2-3 paragraphs MAXIMUM):
- Brief introduction to the concept (1 paragraph)
- Why it matters for their goal (1 paragraph)

Block 2 - Deep Dive (VERY SHORT, 2-3 paragraphs MAXIMUM):
- Main explanation with one simple example
- How it applies to their specific goal

Block 3 - Key Takeaways (VERY SHORT, 2-3 paragraphs MAXIMUM):
- Summary in simple terms
- One concrete next step

IMPORTANT: Keep each block EXTREMELY SHORT and easy to read. No more than 3 paragraphs per block.

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Introduction to ${plan.topic}",
      "markdown": "## Introduction\\n\\nShort introduction content here...",
      "quickActions": ["Action 1", "Action 2"]
    },
    {
      "type": "text",
      "title": "Understanding ${plan.topic}",
      "markdown": "## Deep Dive\\n\\nMain explanation here...",
      "quickActions": ["Action 1", "Action 2"]
    },
    {
      "type": "text",
      "title": "Key Takeaways",
      "markdown": "## Summary\\n\\nKey points here...",
      "quickActions": ["Action 1", "Action 2"]
    }
  ]
}`;
    } else if (plan.lessonType === "quiz") {
      systemPrompt = "You are an expert educator creating quiz questions that test understanding in practical scenarios.";
      userPrompt = `Create a complete quiz lesson about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Goal: ${profile.learningGoal}

Generate a lesson with these blocks IN THIS ORDER:

Block 1 - Text recap (VERY SHORT):
- Brief review in 1-2 paragraphs ONLY
- Keep it concise and to the point

Block 2 - Quiz question:
- Practical scenario related to their goal
- Clear question with 3-4 options
- Only one correct answer
- Short explanations for each (1-2 sentences)

Format as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Quick Review",
      "markdown": "## Review: ${plan.topic}\\n\\nBrief recap here...",
      "quickActions": ["Review action 1", "Review action 2"]
    },
    {
      "type": "quiz",
      "title": "Test Your Knowledge",
      "recap": "Brief recap sentence",
      "scenario": "Practical scenario related to ${profile.learningGoal}",
      "question": "The question to answer",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Why this is correct"},
        {"text": "Option 2", "isCorrect": false, "explanation": "Why this is wrong"},
        {"text": "Option 3", "isCorrect": false, "explanation": "Why this is wrong"},
        {"text": "Option 4", "isCorrect": false, "explanation": "Why this is wrong"}
      ],
      "penalty_hearts": 1
    }
  ]
}`;
    } else if (plan.lessonType === "code") {
      systemPrompt = `You are an expert ${language} developer creating simple, focused coding challenges.`;
      userPrompt = `Create a complete coding lesson about "${plan.topic}" in ${language} for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Language: ${language}
- Goal: ${profile.learningGoal}

Generate a lesson with these blocks IN THIS ORDER:

Block 1 - Text instructions (VERY SHORT, 1-2 paragraphs ONLY):
- Explain what simple function they will write (1 paragraph)
- Why it's useful (1 paragraph)

Block 2 - Code challenge:
- ONE simple function to implement (keep it small and focused)
- Clear, short instructions (3-4 sentences max)
- Starter code in ${language} with function signature and TODO
- A working solution (keep it simple, 5-15 lines of code)
- 2-3 acceptance criteria (short and specific)

IMPORTANT for ${language} code:
- Keep it SIMPLE - just ONE small function
- Function should be 5-15 lines, not complex
- Use proper ${language} syntax ONLY (don't mention other languages)
- Realistic but simple example
- Clear and focused task

Format as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Coding Challenge Setup",
      "markdown": "## Build: ${plan.topic}\\n\\nWhat you'll create and why...",
      "quickActions": ["Think about the inputs", "Consider edge cases"]
    },
    {
      "type": "code",
      "title": "Implement ${plan.topic}",
      "instructions": "Clear step-by-step instructions in markdown",
      "language": "${language.toLowerCase()}",
      "starter": "// Proper ${language} starter code with structure",
      "solution": "// Complete working solution in ${language}",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3", "Criterion 4"],
      "penalty_hearts": 0
    }
  ]
}`;
    } else if (plan.lessonType === "mentor") {
      systemPrompt = "You are creating an AI mentor session configuration for interactive learning.";
      userPrompt = `Create a complete mentor lesson about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Goal: ${profile.learningGoal}

Generate a lesson with these blocks IN THIS ORDER:

Block 1 - Text warm-up (VERY SHORT, 1-2 paragraphs ONLY):
- Quick prep for the mentor session (1 paragraph)
- One thing to think about (1 paragraph)

Block 2 - AI Mentor Explanation:
- Context for the AI to explain the concept
- Prompt for teaching mode
- 2 suggested questions

Block 3 - AI Mentor Quiz:
- Context for the AI to quiz them
- Prompt for examiner mode
- Goal of 2 correct answers

Format as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Mentor Session Prep",
      "markdown": "## Get Ready\\n\\nBrief prep for mentor session...",
      "quickActions": ["Think of a question", "Review the concept"]
    },
    {
      "type": "ai-mentor",
      "mode": "explain",
      "title": "Learn with Mentor",
      "persona": "supportive mentor",
      "lessonContext": "${plan.topic} for ${profile.learningGoal}. Experience: ${profile.codingExperience}",
      "topic": "${plan.topic}",
      "prompt": "Explain ${plan.topic} using examples from ${profile.learningGoal}. Be practical and use their experience level (${profile.codingExperience}).",
      "suggestedQuestions": ["Question about concept", "Question about application"]
    },
    {
      "type": "ai-mentor",
      "mode": "quiz",
      "title": "Verify Understanding",
      "persona": "coach",
      "lessonContext": "${plan.topic} for ${profile.learningGoal}",
      "topic": "${plan.topic}",
      "prompt": "Ask 2-3 questions about ${plan.topic} to verify understanding. Wait for correct answers before proceeding.",
      "quizGoal": 2
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
