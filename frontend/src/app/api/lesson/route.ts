import { NextResponse } from "next/server";
import { LessonPlan, LessonBlock, UserProfile } from "../../lib/types";

interface LessonRequestBody {
  plan?: LessonPlan;
  profile?: UserProfile;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 },
    );
  }

  try {
    let systemPrompt = "";
    let userPrompt = "";

    if (plan.lessonType === "text") {
      systemPrompt = "You are an expert educator. Teach directly - don't tell them what they'll learn, just teach it. Be conversational and clear. Keep it VERY SHORT. Always include a quiz to verify understanding.";
      userPrompt = `Teach about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Goal: ${profile.learningGoal}

Generate these blocks IN THIS EXACT ORDER:

Block 1 - Text (VERY SHORT, 2-3 paragraphs):
- Teach the concept directly with a practical example
- Use simple, conversational language

Block 2 - Text (VERY SHORT, 2-3 paragraphs):
- Continue with another key aspect and example
- Keep it concrete and specific

Block 3 - Quiz (MUST HAVE):
- Create a practical quiz question about what was just taught
- Scenario should relate to ${profile.learningGoal}
- 4 options, only one correct
- Short explanations (1-2 sentences each)

IMPORTANT:
- DON'T say "you will learn" - just TEACH directly
- Be conversational and friendly
- Keep text blocks EXTREMELY SHORT (2-3 paragraphs max)
- Quiz is MANDATORY
- Make the quiz question unique and interesting

Format the response as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Learning ${plan.topic}",
      "markdown": "## ${plan.topic}\\n\\nDirect teaching content...",
      "quickActions": ["Action 1", "Action 2"]
    },
    {
      "type": "text",
      "title": "More About ${plan.topic}",
      "markdown": "## Continued\\n\\nMore teaching content...",
      "quickActions": ["Action 1", "Action 2"]
    },
    {
      "type": "quiz",
      "title": "Check Your Understanding",
      "recap": "Quick recap sentence",
      "scenario": "Practical scenario for ${profile.learningGoal}",
      "question": "The question",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Why correct"},
        {"text": "Option 2", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 3", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 4", "isCorrect": false, "explanation": "Why wrong"}
      ],
      "penalty_hearts": 1
    }
  ]
}`;
    } else if (plan.lessonType === "quiz") {
      systemPrompt = "You are an expert educator. Teach briefly then test with multiple quiz questions. Make each quiz unique and challenging.";
      userPrompt = `Create a quiz-focused lesson about "${plan.topic}" for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Goal: ${profile.learningGoal}

Generate these blocks IN THIS EXACT ORDER:

Block 1 - Text (VERY SHORT, 1-2 paragraphs):
- Quick teaching of the key concepts
- Direct and conversational

Block 2 - Quiz #1:
- First quiz question with practical scenario
- 4 options, only one correct
- Make it unique and interesting

Block 3 - Quiz #2:
- Second quiz question with DIFFERENT scenario
- 4 options, only one correct
- Test a different aspect of the topic
- Make it challenging but fair

Format as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Quick Overview",
      "markdown": "## ${plan.topic}\\n\\nBrief teaching...",
      "quickActions": ["Action 1", "Action 2"]
    },
    {
      "type": "quiz",
      "title": "Challenge #1",
      "recap": "Brief recap",
      "scenario": "First practical scenario for ${profile.learningGoal}",
      "question": "First question",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Why correct"},
        {"text": "Option 2", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 3", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 4", "isCorrect": false, "explanation": "Why wrong"}
      ],
      "penalty_hearts": 1
    },
    {
      "type": "quiz",
      "title": "Challenge #2",
      "recap": "Another aspect",
      "scenario": "DIFFERENT scenario for ${profile.learningGoal}",
      "question": "Second question",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Why correct"},
        {"text": "Option 2", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 3", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 4", "isCorrect": false, "explanation": "Why wrong"}
      ],
      "penalty_hearts": 1
    }
  ]
}`;
    } else if (plan.lessonType === "code") {
      systemPrompt = `You are an expert ${language} developer creating focused coding exercises. Be strict but fair in evaluation criteria.`;
      userPrompt = `Create a complete coding lesson about "${plan.topic}" in ${language} for someone working on ${profile.learningGoal}.

Context:
- Job: ${profile.jobStatus}
- Experience: ${profile.codingExperience}
- Language: ${language}
- Goal: ${profile.learningGoal}

Generate these blocks IN THIS EXACT ORDER:

Block 1 - Text (VERY SHORT, 1-2 paragraphs):
- Teach the concept briefly with a small example
- Use conversational ${language} code snippets inline

Block 2 - Code Challenge:
- ONE focused function to implement (5-15 lines)
- Clear, specific instructions
- Starter code in ${language} with function signature
- Working solution that solves the problem
- 3-4 SPECIFIC acceptance criteria (be clear about requirements)

Block 3 - Quiz about the code:
- Question about the concept or code approach
- 4 options testing understanding
- Related to what they just coded

IMPORTANT for ${language}:
- Use ONLY ${language} syntax (never mention other languages)
- Keep function simple but meaningful
- Acceptance criteria should be SPECIFIC and TESTABLE (e.g., "Returns correct result for empty input", "Handles edge case X")
- Make quiz unique and related to the coding task

Format as JSON:
{
  "blocks": [
    {
      "type": "text",
      "title": "Learning ${plan.topic}",
      "markdown": "## ${plan.topic}\\n\\nTeaching with ${language} examples...",
      "quickActions": ["Action 1", "Action 2"]
    },
    {
      "type": "code",
      "title": "Code: ${plan.topic}",
      "instructions": "Clear, specific instructions for the function",
      "language": "${language.toLowerCase()}",
      "starter": "// ${language} function signature with TODO",
      "solution": "// Complete working ${language} solution",
      "acceptanceCriteria": ["Specific criterion 1", "Specific criterion 2", "Specific criterion 3"],
      "penalty_hearts": 0
    },
    {
      "type": "quiz",
      "title": "Understanding the Code",
      "recap": "About the code concept",
      "scenario": "Scenario related to the coding task",
      "question": "Question about approach or concept",
      "kind": "single",
      "options": [
        {"text": "Option 1", "isCorrect": true, "explanation": "Why correct"},
        {"text": "Option 2", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 3", "isCorrect": false, "explanation": "Why wrong"},
        {"text": "Option 4", "isCorrect": false, "explanation": "Why wrong"}
      ],
      "penalty_hearts": 1
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
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
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
