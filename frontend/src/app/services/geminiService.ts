
import { GoogleGenAI, Type } from "@google/genai";
import { ExaminerResponse } from "../lib/types";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set. AI Mentor features will not work.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const safeGenerateContent = async (prompt: string, isJson: boolean = false): Promise<string> => {
    if (!API_KEY) {
        if(isJson) return JSON.stringify({ passed: true, feedback: "The AI Mentor is currently unavailable. Correctness was not checked.", deduct_heart: false });
        return Promise.resolve("The AI Mentor is currently unavailable. Please proceed to the next step.");
    }

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: isJson ? {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        passed: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING },
                        deduct_heart: { type: Type.BOOLEAN },
                    },
                    required: ["passed", "feedback", "deduct_heart"]
                },
            } : undefined
        });
        return response.text;
    } catch (error) {
        console.error("Error with Generative AI:", error);
        if (isJson) return JSON.stringify({ passed: true, feedback: "Could not contact the AI Mentor. Please try again.", deduct_heart: false });
        return "There was an issue contacting the AI Mentor. Please check your connection and try again.";
    }
}

export const getGuideFeedback = async (
  lessonContext: string,
  proficiency: string,
  userWork: string,
  question: string,
): Promise<string> => {
  const prompt = `
    You are "Mentor" in Guide mode. Your goal is to help a learner understand a concept without giving the direct answer.
    - Ask 1 Socratic question at a time to guide them.
    - Offer a small hint first, then a deeper hint if they are still stuck.
    - Avoid giving full solutions unless the learner is stuck after several attempts.
    - Match the learner's proficiency: ${proficiency}.
    - Keep your response to a maximum of 3-4 concise sentences.

    LEARNING CONTEXT: ${lessonContext}
    THEIR QUESTION/CODE: "${userWork}"
    YOUR QUESTION TO THEM: "${question}"
  `;
  return safeGenerateContent(prompt);
};

export const getExaminerFeedback = async (
    lessonContext: string,
    proficiency: string,
    userCode: string
): Promise<ExaminerResponse> => {
    const prompt = `
    You are "Mentor" in Examiner mode. Your goal is to evaluate code accurately and concisely.
    - You will be given the learning context and the user's code.
    - Evaluate if the code correctly solves the problem described in the context.
    - Output a JSON object with the specified schema.
    - Your feedback should be a maximum of 1-2 sentences.
    - If the code is correct, set passed=true and provide encouraging feedback.
    - If the code is incorrect, set passed=false, provide a hint towards the fix, and set deduct_heart=true.

    LEARNING CONTEXT: "${lessonContext}"
    USER'S CODE:
    \`\`\`javascript
    ${userCode}
    \`\`\`
    `;

    const responseText = await safeGenerateContent(prompt, true);
    try {
        return JSON.parse(responseText) as ExaminerResponse;
    } catch {
        console.error("Failed to parse Examiner JSON response:", responseText);
        return { passed: true, feedback: "The AI Mentor returned an unexpected response.", deduct_heart: false };
    }
}
