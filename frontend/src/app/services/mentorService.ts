import { ExaminerResponse } from "../lib/types";

export type MentorChatHistoryItem = {
  role: "mentor" | "user";
  content: string;
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

const handleError = async (res: Response) => {
  let message = "Unexpected server error";
  try {
    const data = await res.json();
    message = data?.error ?? message;
  } catch {
    // ignore json parse errors
  }
  throw new Error(message);
};

export const getGuideFeedback = async (
  lessonContext: string,
  proficiency: string,
  userWork: string,
  question: string
): Promise<string> => {
  const response = await fetch("/api/mentor/guide", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ lessonContext, proficiency, userWork, question }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  const data = await response.json();
  return data.feedback as string;
};

export const getExaminerFeedback = async (
  lessonContext: string,
  proficiency: string,
  userCode: string
): Promise<ExaminerResponse> => {
  const response = await fetch("/api/mentor/examiner", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ lessonContext, proficiency, userCode }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return (await response.json()) as ExaminerResponse;
};

export const getAiMentorExplain = async (
  lessonContext: string,
  proficiency: string,
  persona: string,
  topic: string,
  prompt: string,
  learnerQuestion: string,
  history: MentorChatHistoryItem[] = [],
): Promise<string> => {
  const response = await fetch("/api/mentor/ai-explain", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      lessonContext,
      proficiency,
      persona,
      topic,
      prompt,
      learnerQuestion,
      history,
    }),
export const saveChat = async (payload: {
  message: string;
  userProfile: any;
  conversationHistory?: any[];
}) => {
  const response = await fetch("/api/mentor/chat", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleError(response);
  }

  const data = await response.json();
  return data.feedback as string;
};

export const requestAiMentorQuestion = async (
  lessonContext: string,
  topic: string,
  prompt: string,
): Promise<{ question: string }> => {
  const response = await fetch("/api/mentor/ai-quiz", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      action: "ask",
      lessonContext,
      topic,
      prompt,
    }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return (await response.json()) as { question: string };
};

export const submitAiMentorAnswer = async (
  lessonContext: string,
  topic: string,
  question: string,
  answer: string,
): Promise<{ correct: boolean; feedback: string }> => {
  const response = await fetch("/api/mentor/ai-quiz", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      action: "answer",
      lessonContext,
      topic,
      question,
      answer,
    }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return (await response.json()) as { correct: boolean; feedback: string };
  return response.json();
};
