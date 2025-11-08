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

export type BlockType = "text" | "quiz" | "code" | "mentor";

export interface BaseBlock {
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  title: string;
  markdown: string;
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizBlock extends BaseBlock {
  type: "quiz";
  question: string;
  kind: "single" | "multi" | "code-output" | "ordering";
  options: QuizOption[];
  penalty_hearts: number;
}

export interface CodeTest {
  name: string;
  hidden: boolean;
  run: string;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  title: string;
  instructions: string;
  language: "javascript";
  starter: string;
  solution: string;
  tests: CodeTest[];
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

export type LessonBlock = TextBlock | QuizBlock | CodeBlock | MentorBlock;

export interface Lesson {
  id: string;
  track: string;
  chapter: string;
  title: string;
  estimated_minutes: number;
  xp_reward: number;
  prerequisites: string[];
  blocks: LessonBlock[];
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
