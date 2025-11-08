import lessonsData from "../data/lessons.json";
import {
  AiMentorBlock,
  CodeBlock,
  Lesson,
  LessonSummary,
  MentorBlock,
  QuizBlock,
  QuizOption,
  StageStatus,
  TextBlock,
} from "./types";

type RawQuizBlock = Omit<QuizBlock, "options"> & {
  options: string[];
  correct: number[];
  explanations: string[];
};

type RawLessonBlock = RawQuizBlock | TextBlock | CodeBlock | MentorBlock | AiMentorBlock;

type RawLesson = Omit<Lesson, "blocks"> & {
  blocks: RawLessonBlock[];
};

const rawLessons = lessonsData as RawLesson[];

function processRawLessons(raws: RawLesson[]): LessonSummary[] {
  return raws.map((lesson, index) => {
    const processedBlocks = lesson.blocks.map((block): Lesson["blocks"][number] => {
      if (block.type === "quiz") {
        const quizBlock = block as RawQuizBlock;
        const options: QuizOption[] = quizBlock.options.map((optText, idx) => ({
          text: optText,
          isCorrect: quizBlock.correct.includes(idx),
          explanation: quizBlock.explanations[idx],
        }));
        return { ...quizBlock, options };
      }
      return block;
    });

    return {
      id: lesson.id,
      title: lesson.title,
      status: index === 0 ? StageStatus.Unlocked : StageStatus.Locked,
      lesson: { ...lesson, blocks: processedBlocks },
    };
  });
}

export const INITIAL_ROADMAP_LESSONS: LessonSummary[] = processRawLessons(rawLessons);

export const LESSON_DIRECTORY = rawLessons.map(({
  id,
  title,
  chapter,
  track,
  estimated_minutes,
  xp_reward,
}) => ({
  id,
  title,
  chapter,
  track,
  estimated_minutes,
  xp_reward,
}));
