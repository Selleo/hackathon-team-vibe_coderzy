"use client";

import { useCallback, useEffect, useState } from "react";
import AiMentorPanel from "./Components/AiMentorPanel";
import {
  CodeBlock,
  LessonBlock,
  LessonSummary,
  QuizBlock,
  QuizOption,
  UserProfile,
} from "../lib/types";
import { hydrateLessonBlocks } from "../services/lessonService";

interface LessonModalProps {
  stage: LessonSummary;
  userProfile: UserProfile;
  onClose: () => void;
  onComplete: (lessonId: string, xpReward: number) => void;
  loseLife: () => void;
  onHydrated: (lessonId: string, blocks: LessonBlock[]) => void;
}

const LessonModal: React.FC<LessonModalProps> = ({
  stage,
  userProfile,
  onClose,
  onComplete,
  loseLife,
  onHydrated,
}) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [lessonBlocks, setLessonBlocks] = useState<LessonBlock[]>(stage.lesson.blocks ?? []);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  const hydrateLessonContent = useCallback(async () => {
    if (!stage.lesson.plan) {
      setHydrationError("Lesson plan is missing.");
      return;
    }
    setHydrating(true);
    setHydrationError(null);
    try {
      const blocks = await hydrateLessonBlocks(stage.lesson.plan, userProfile);
      setLessonBlocks(blocks);
      onHydrated(stage.id, blocks);
      setCurrentBlockIndex(0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate this lesson.";
      setHydrationError(message);
    } finally {
      setHydrating(false);
    }
  }, [stage.id, stage.lesson.plan, userProfile, onHydrated]);

  useEffect(() => {
    const existingBlocks = stage.lesson.blocks ?? [];
    setLessonBlocks(existingBlocks);
    setCurrentBlockIndex(0);
    if (!existingBlocks.length) {
      void hydrateLessonContent();
    }
  }, [stage, hydrateLessonContent]);

  const currentBlock = lessonBlocks[currentBlockIndex];
  const progress =
    lessonBlocks.length > 0
      ? (currentBlockIndex / lessonBlocks.length) * 100 + 5
      : 5;

  const handleNextBlock = () => {
    if (currentBlockIndex < lessonBlocks.length - 1) {
      setCurrentBlockIndex((prev) => prev + 1);
    } else {
      onComplete(stage.id, stage.lesson.xp_reward);
      onClose();
    }
  };

  const renderBlock = (block: LessonBlock) => {
    switch (block.type) {
      case "text":
        return (
          <div>
            <h3 className="text-2xl pb-4 font-bold text-cyan-300 mb-4">{block.title}</h3>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{block.markdown}</p>
            {block.quickActions && (
              <ul className="mt-4 space-y-2 rounded-lg bg-gray-900/40 p-4 text-sm text-gray-200">
                {block.quickActions.map((action) => (
                  <li key={action} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    {action}
                  </li>
                ))}
              </ul>
            )}
            {block.snippet && (
              <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900 p-3 font-mono text-sm text-cyan-200">
                {block.snippet}
              </div>
            )}
            <button
              onClick={handleNextBlock}
              className="mt-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Continue
            </button>
          </div>
        );
      case "quiz":
        return <QuizComponent block={block} loseLife={loseLife} onCorrect={handleNextBlock} />;
      case "code":
        return (
      <CodeComponent
        key={`${stage.id}-${block.title}`}
        block={block}
        onContinue={handleNextBlock}
      />
        );
      case "ai-mentor":
        return (
          <AiMentorPanel block={block} userProfile={userProfile} onContinue={handleNextBlock} />
        );
      default:
        return <div>Unsupported block type.</div>;
    }
  };

  const renderContent = () => {
    if (hydrating) {
      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-gray-300">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p>Generating lesson content based on your profile…</p>
        </div>
      );
    }

    if (hydrationError) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-300">{hydrationError}</p>
          <button
            onClick={() => hydrateLessonContent()}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!currentBlock) {
      return (
        <div className="text-center text-gray-300">
          This lesson is missing blocks. Try another lesson or regenerate your roadmap.
        </div>
      );
    }

    return renderBlock(currentBlock);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl  shadow-2xl pt-7 max-w-3xl p-8 relative  flex flex-col">

            <div className=" bg-gray-700 w-7/8 rounded-full h-2.5 mb-4">
          <div
            className="bg-cyan-500 h-2.5  rounded-full "
            style={{ width: `${progress}%`, transition: "width 0.3s ease-in-out" }}
          ></div>
          </div>

        <button onClick={onClose} className="absolute top-4  right-4 text-gray-400 hover:text-white transition z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-y-auto my-2 pr-2">{renderContent()}</div>
      </div>
    </div>
  );
};

const QuizComponent: React.FC<{ block: QuizBlock; loseLife: () => void; onCorrect: () => void }> = ({
  block,
  loseLife,
  onCorrect,
}) => {
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"correct" | "incorrect" | null>(null);
  const optionsLocked = answerStatus === "correct";

  const handleQuizAnswer = (option: QuizOption) => {
    if (optionsLocked) return;

    setSelectedOption(option);
    if (option.isCorrect) {
      setAnswerStatus("correct");
    } else {
      setAnswerStatus("incorrect");
      loseLife();
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-cyan-300 mb-2">{block.title}</h3>
      <p className="text-sm text-gray-400 mb-1">{block.recap}</p>
      <p className="text-sm text-gray-400 mb-4">{block.scenario}</p>
      <p className="text-gray-100 mb-6 font-semibold">{block.question}</p>
      <div className="space-y-3">
        {block.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleQuizAnswer(option)}
            disabled={optionsLocked}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedOption?.text === option.text
                ? option.isCorrect
                  ? "bg-emerald-500 border-emerald-400"
                  : "bg-red-500 border-red-400"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>
      {answerStatus && (
        <div className="mt-4 p-4 rounded-lg bg-gray-700">
          <p
            className={`font-bold text-lg mb-2 ${
              answerStatus === "correct" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {answerStatus === "correct" ? "Correct!" : "Not quite..."}
          </p>
          <p className="text-gray-300 mb-3">{selectedOption?.explanation}</p>
          {answerStatus === "correct" ? (
            <button
              onClick={onCorrect}
              className="mt-1 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Continue
            </button>
          ) : (
            <p className="text-sm text-gray-400">Try another option to continue.</p>
          )}
        </div>
      )}
    </div>
  );
};

const CodeComponent: React.FC<{
  block: CodeBlock;
  onContinue: () => void;
}> = ({ block, onContinue }) => {
  const [showSolution, setShowSolution] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(
    block.acceptanceCriteria.map(() => false),
  );

  const allChecked = checked.every(Boolean);

  const toggleCriterion = (index: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-cyan-300 mb-2">{block.title}</h3>
      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{block.instructions}</p>
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm border border-gray-700 whitespace-pre-wrap">
        {block.starter}
      </div>
      <button
        onClick={() => setShowSolution((prev) => !prev)}
        className="mt-3 text-sm text-cyan-300 underline decoration-dotted"
      >
        {showSolution ? "Hide sample plan" : "Show sample plan"}
      </button>
      {showSolution && (
        <div className="mt-3 rounded-lg border border-cyan-700/40 bg-gray-900/60 p-4 font-mono text-sm whitespace-pre-wrap">
          {block.solution}
        </div>
      )}
      <div className="mt-4 space-y-2">
        {block.acceptanceCriteria.map((criterion, index) => (
          <label
            key={criterion}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700/60 bg-gray-900/40 p-3 text-sm text-gray-200"
          >
            <input
              type="checkbox"
              checked={checked[index]}
              onChange={() => toggleCriterion(index)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span>{criterion}</span>
          </label>
        ))}
      </div>
      <button
        onClick={onContinue}
        disabled={!allChecked}
        className="mt-5 w-full rounded-lg bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-gray-600"
      >
        Continue
      </button>
    </div>
  );
};

export default LessonModal;
