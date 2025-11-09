export interface UserProfile {
  reason: string;
  jobStatus: string;
  codingExperience: string;
  captivates: string;
  learningGoal: string;
  hobbies: string[];
}

export enum StageStatus {
  Locked = "locked",
  Unlocked = "unlocked",
  Completed = "completed",
}

export type BlockType = "text" | "quiz" | "code" | "mentor" | "ai-mentor";

export type LessonTemplateId =
  | "text-foundation"
  | "text-deepening"
  | "quiz-scenario"
  | "code-plan"
  | "mentor-duo";

export interface LessonPlan {
  templateId: LessonTemplateId;
  lessonType: "text" | "quiz" | "code" | "mentor";
  topic: string;
  title: string;
  description: string;
  focus: string;
  tone?: string;
  scenario?: string;
  quickActions?: string[];
  snippetTag?: string;
  persona?: string;
  prompt?: string;
  emphasis?: string;
}

export interface BaseBlock {
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  title: string;
  markdown: string;
  quickActions?: string[];
  snippet?: string;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizBlock extends BaseBlock {
  type: "quiz";
  title: string;
  recap: string;
  scenario: string;
  question: string;
  kind: "single" | "multi" | "code-output" | "ordering";
  options: QuizOption[];
  penalty_hearts: number;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  title: string;
  instructions: string;
  language?: "pseudocode" | "text";
  starter: string;
  solution: string;
  acceptanceCriteria: string[];
  penalty_hearts: number;
}

export interface MentorBlock extends BaseBlock {
  type: "mentor";
  mode: "guide" | "examiner";
  trigger: "manual" | "after_incorrect" | "after_test_fail";
  prompt_vars: {
    proficiency: string;
    lesson_context: string;
  };
}

export interface AiMentorBlock extends BaseBlock {
  type: "ai-mentor";
  mode: "explain" | "quiz";
  title: string;
  persona: string;
  lessonContext: string;
  prompt: string;
  topic: string;
  suggestedQuestions?: string[];
  quizGoal?: number;
}

export type LessonBlock =
  | TextBlock
  | QuizBlock
  | CodeBlock
  | MentorBlock
  | AiMentorBlock;

export interface Lesson {
  id: string;
  track: string;
  chapter: string;
  title: string;
  estimated_minutes: number;
  xp_reward: number;
  prerequisites: string[];
  blocks: LessonBlock[];
  plan: LessonPlan;
}

export interface LessonSummary {
  id: string;
  title: string;
  status: StageStatus;
  lesson: Lesson;
}

export interface ExaminerResponse {
  passed: boolean;
  feedback: string;
  deduct_heart: boolean;
}
