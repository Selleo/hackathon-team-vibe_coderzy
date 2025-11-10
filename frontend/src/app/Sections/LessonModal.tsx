"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
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
            <div className="prose prose-invert prose-cyan max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-cyan-300 mb-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-cyan-300 mb-3 mt-6" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-cyan-400 mb-2 mt-4" {...props} />,
                  p: ({ node, ...props }) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-cyan-200" {...props} />,
                  em: ({ node, ...props }) => <em className="italic text-cyan-200" {...props} />,
                  code: ({ node, ...props }) => <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                  pre: ({ node, ...props }) => <pre className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto mb-4" {...props} />,
                }}
              >
                {block.markdown}
              </ReactMarkdown>
            </div>
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
      <div className="bg-gray-800 rounded-xl  shadow-2xl pt-7 max-w-3xl p-8 relative  flex flex-col max-h-[80vh]">

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Segment {currentBlockIndex + 1} of {lessonBlocks.length}
                </span>
                <span className="text-sm text-gray-400">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-cyan-500 h-2.5 rounded-full"
                  style={{ width: `${progress}%`, transition: "width 0.3s ease-in-out" }}
                ></div>
              </div>
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

  useEffect(() => {
    setSelectedOption(null);
    setAnswerStatus(null);
  }, [block]);

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
      <div className="prose prose-invert prose-cyan max-w-none mb-6">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-cyan-300 mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-cyan-300 mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-cyan-400 mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="text-gray-300 mb-3" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold text-cyan-200" {...props} />,
            code: ({ node, ...props }) => <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
          }}
        >
          {`### ${block.title}\n\n${block.recap}\n\n${block.scenario}\n\n**${block.question}**`}
        </ReactMarkdown>
      </div>
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
  const [userCode, setUserCode] = useState(block.starter);
  const [showSolution, setShowSolution] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ passed: boolean; feedback: string; deduct_heart: boolean } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    
    try {
      const response = await fetch("/api/mentor/examiner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonContext: `${block.instructions}\n\nLanguage: ${block.language || 'javascript'}\n\nAcceptance Criteria:\n${block.acceptanceCriteria.join('\n')}`,
          proficiency: "beginner",
          userCode: userCode,
        }),
      });

      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error("Error submitting code:", error);
      setFeedback({
        passed: false,
        feedback: "Failed to validate code. Please try again.",
        deduct_heart: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="prose prose-invert prose-cyan max-w-none mb-4">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-cyan-300 mb-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-cyan-300 mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-cyan-400 mb-2" {...props} />,
            p: ({ node, ...props }) => <p className="text-gray-300 mb-3" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold text-cyan-200" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1" {...props} />,
            li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
            code: ({ node, ...props }) => <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
          }}
        >
          {`### ${block.title}\n\n${block.instructions}\n\n**Acceptance Criteria:**\n\n${block.acceptanceCriteria.map(c => `- ${c}`).join('\n')}`}
        </ReactMarkdown>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">Your Code:</label>
          {block.language && (
            <span className="text-xs px-2 py-1 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
              {block.language}
            </span>
          )}
        </div>
        <textarea
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          className="w-full h-64 bg-gray-900 rounded-lg p-4 font-mono text-sm border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
          placeholder="Write your code here..."
          disabled={feedback?.passed}
          spellCheck={false}
        />
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || feedback?.passed}
          className="flex-1 rounded-lg bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-gray-600"
        >
          {submitting ? "Validating..." : "Submit Code"}
        </button>
        <button
          onClick={() => setShowSolution((prev) => !prev)}
          className="px-4 py-3 text-sm text-cyan-300 border border-cyan-700 rounded-lg hover:bg-cyan-900/30 transition"
        >
          {showSolution ? "Hide Solution" : "Show Solution"}
        </button>
      </div>

      {showSolution && (
        <div className="mb-3 rounded-lg border border-cyan-700/40 bg-gray-900/60 p-4 font-mono text-sm whitespace-pre-wrap text-gray-300">
          {block.solution}
        </div>
      )}

      {feedback && (
        <div className={`p-4 rounded-lg mb-3 ${feedback.passed ? "bg-emerald-900/30 border border-emerald-500/50" : "bg-red-900/30 border border-red-500/50"}`}>
          <p className={`font-bold text-lg mb-2 ${feedback.passed ? "text-emerald-400" : "text-red-400"}`}>
            {feedback.passed ? "✓ Code Accepted!" : "✗ Needs Improvement"}
          </p>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="text-gray-300 mb-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 mb-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-gray-100" {...props} />,
                code: ({ node, ...props }) => <code className="bg-gray-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
              }}
            >
              {feedback.feedback}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {feedback?.passed && (
        <button
          onClick={onContinue}
          className="w-full rounded-lg bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-500"
        >
          Continue
        </button>
      )}
    </div>
  );
};

export default LessonModal;
