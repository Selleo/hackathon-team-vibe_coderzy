"use client";

import { useMemo, useState } from "react";
import { getExaminerFeedback } from "../services/geminiService";
import {
  CodeBlock,
  LessonBlock,
  LessonSummary,
  MentorBlock,
  QuizBlock,
  QuizOption,
  UserProfile,
} from "../lib/types";

interface LessonModalProps {
  stage: LessonSummary;
  userProfile: UserProfile;
  onClose: () => void;
  onComplete: (lessonId: string, xpReward: number) => void;
  loseLife: () => void;
}

const LessonModal: React.FC<LessonModalProps> = ({ stage, userProfile, onClose, onComplete, loseLife }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  const { lessonBlocks, examinerMentor } = useMemo(() => {
    const blocks = stage.lesson.blocks;
    return {
      lessonBlocks: blocks.filter((block) => block.type !== "mentor"),
      examinerMentor: blocks.find((block) => block.type === "mentor" && block.mode === "examiner") as
        | MentorBlock
        | undefined,
    };
  }, [stage.lesson.blocks]);

  const currentBlock = lessonBlocks[currentBlockIndex];
  const progress = ((currentBlockIndex + 1) / lessonBlocks.length) * 100;

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
            <h3 className="text-2xl font-bold text-cyan-300 mb-4">{block.title}</h3>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{block.markdown}</p>
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
            block={block}
            loseLife={loseLife}
            onCorrect={handleNextBlock}
            examiner={examinerMentor}
            userProfile={userProfile}
          />
        );
      default:
        return <div>Unsupported block type.</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl p-8 relative max-h-[90vh] flex flex-col">
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div
            className="bg-cyan-500 h-2.5 rounded-full"
            style={{ width: `${progress}%`, transition: "width 0.3s ease-in-out" }}
          ></div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="overflow-y-auto pr-2">{renderBlock(currentBlock)}</div>
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

  const handleQuizAnswer = (option: QuizOption) => {
    if (answerStatus) return;

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
      <h3 className="text-xl font-bold text-cyan-300 mb-4">Quiz Time!</h3>
      <p className="text-gray-300 mb-6">{block.question}</p>
      <div className="space-y-3">
        {block.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleQuizAnswer(option)}
            disabled={!!answerStatus}
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
            className={`font-bold text-lg mb-2 ${answerStatus === "correct" ? "text-emerald-400" : "text-red-400"}`}
          >
            {answerStatus === "correct" ? "Correct!" : "Not quite..."}
          </p>
          <p className="text-gray-300">{selectedOption?.explanation}</p>
          <button
            onClick={onCorrect}
            className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

const CodeComponent: React.FC<{
  block: CodeBlock;
  examiner?: MentorBlock;
  userProfile: UserProfile;
  loseLife: () => void;
  onCorrect: () => void;
}> = ({ block, examiner, userProfile, loseLife, onCorrect }) => {
  const [code, setCode] = useState(block.starter);
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean }[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [allPassed, setAllPassed] = useState(false);
  const [feedback, setFeedback] = useState("");

  const runTests = async () => {
    setIsTesting(true);
    setFeedback("");
    setTestResults([]);

    if (examiner) {
      const result = await getExaminerFeedback(
        examiner.prompt_vars.lesson_context,
        userProfile.experience,
        code,
      );
      setFeedback(result.feedback);
      if (result.passed) {
        setAllPassed(true);
        const passedTests = block.tests.map((test) => ({ name: test.name, passed: true }));
        setTestResults(passedTests);
      } else {
        if (result.deduct_heart) loseLife();
        const failedTests = block.tests.map((test) => ({ name: test.name, passed: false }));
        setTestResults(failedTests);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const passed = code.replace(/\s+/g, "") === block.solution.replace(/\s+/g, "");
      if (passed) {
        setAllPassed(true);
        const results = block.tests.map((test) => ({ ...test, passed: true }));
        setTestResults(results);
        setFeedback("Great work! All tests passed.");
      } else {
        loseLife();
        const results = block.tests.map((test) => ({ ...test, passed: false }));
        setTestResults(results);
        setFeedback("Not quite right. Take a look at your code and try again.");
      }
    }

    setIsTesting(false);
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-cyan-300 mb-2">{block.title}</h3>
      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{block.instructions}</p>
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm border border-gray-700">
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="w-full h-48 bg-transparent text-white outline-none resize-none"
          aria-label="Code editor"
        />
      </div>
      <button
        onClick={runTests}
        disabled={isTesting || allPassed}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-500"
      >
        {isTesting ? "Running Tests..." : "Run Tests"}
      </button>
      {(testResults.length > 0 || feedback) && (
        <div className="mt-4 p-4 rounded-lg bg-gray-700">
          {feedback && <p className="mb-3 text-white">{feedback}</p>}
          <ul className="space-y-1">
            {testResults.map((result, index) => (
              <li
                key={index}
                className={`flex items-center ${result.passed ? "text-emerald-400" : "text-red-400"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  {result.passed ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                {result.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {allPassed && (
        <button
          onClick={onCorrect}
          className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          Continue
        </button>
      )}
    </div>
  );
};

export default LessonModal;
