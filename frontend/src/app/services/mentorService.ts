import { ExaminerResponse } from "../lib/types";

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
  question: string,
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
  userCode: string,
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
