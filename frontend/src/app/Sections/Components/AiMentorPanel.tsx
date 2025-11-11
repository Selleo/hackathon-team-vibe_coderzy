"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiMentorBlock, UserProfile } from "../../lib/types";
import {
  MentorChatHistoryItem,
  getAiMentorExplain,
  requestAiMentorQuestion,
  submitAiMentorAnswer,
} from "../../services/mentorService";

interface AiMentorPanelProps {
  block: AiMentorBlock;
  userProfile: UserProfile;
  onContinue: () => void;
}

type ChatMessage = {
  id: string;
  sender: "mentor" | "user";
  content: string;
  isIntro?: boolean;
};

const getId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const AiMentorPanel: React.FC<AiMentorPanelProps> = ({ block, userProfile, onContinue }) => {
  const isQuizMode = block.mode === "quiz";
  const quizGoal = block.quizGoal ?? 1;

  const [promptInput, setPromptInput] = useState(block.suggestedQuestions?.[0] ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSendingExplain, setIsSendingExplain] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isFetchingQuestion, setIsFetchingQuestion] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const introMessage = useMemo<ChatMessage>(
    () => ({
      id: getId(),
      sender: "mentor",
      content: `👋 Hey! I'm your mentor for ${block.topic}. Ask me anything and I'll tailor the explanation to your level.`,
      isIntro: true,
    }),
    [block.topic],
  );

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    setPromptInput(block.suggestedQuestions?.[0] ?? "");
    setMessages(block.mode === "explain" ? [introMessage] : []);
    setExplainError(null);
    setCurrentQuestion(null);
    setQuizAnswer("");
    setQuizFeedback(null);
    setLastAnswerCorrect(null);
    setQuizError(null);
    setCorrectCount(0);
  }, [block, introMessage]);

  const mentorReplies = useMemo(
    () => messages.filter((msg) => msg.sender === "mentor" && !msg.isIntro),
    [messages],
  );

  const readyToContinue = isQuizMode ? correctCount >= quizGoal : mentorReplies.length > 0;

  const historyForExplain = useMemo<MentorChatHistoryItem[]>(() => {
    return messages
      .filter((msg) => !msg.isIntro)
      .map((msg) => ({
        role: msg.sender === "mentor" ? "assistant" : "user",
        content: msg.content,
      }));
  }, [messages]);

  const fetchQuestion = useCallback(async () => {
    setIsFetchingQuestion(true);
    setQuizError(null);
    setCurrentQuestion(null);
    setQuizFeedback(null);
    try {
      const { question } = await requestAiMentorQuestion(
        block.lessonContext,
        block.topic,
        block.prompt,
      );
      setCurrentQuestion(question);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Could not fetch a question.");
    } finally {
      setIsFetchingQuestion(false);
    }
  }, [block.lessonContext, block.topic, block.prompt]);

  useEffect(() => {
    if (isQuizMode) {
      void fetchQuestion();
    }
  }, [isQuizMode, fetchQuestion]);

  const sendExplainMessage = async () => {
    const trimmed = promptInput.trim();
    if (!trimmed) {
      setExplainError("Enter a message before sending.");
      return;
    }

    setExplainError(null);
    const userMessage: ChatMessage = { id: getId(), sender: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setPromptInput("");
    setIsSendingExplain(true);

    try {
      const reply = await getAiMentorExplain(
        block.lessonContext,
        userProfile.codingExperience,
        block.persona,
        block.topic,
        block.prompt,
        trimmed,
        historyForExplain,
      );
      setMessages((prev) => [
        ...prev,
        { id: getId(), sender: "mentor", content: reply, isIntro: false },
      ]);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : "Could not contact the mentor.");
      // remove the last user message if call failed?
    } finally {
      setIsSendingExplain(false);
    }
  };

  const requestNewQuestion = async () => {
    if (isCheckingAnswer) return;
    await fetchQuestion();
  };

  const submitQuizResponse = async () => {
    if (!currentQuestion) {
      setQuizError("No active question. Request a new one.");
      return;
    }
    const trimmed = quizAnswer.trim();
    if (!trimmed) {
      setQuizError("Provide an answer before submitting.");
      return;
    }

    setQuizError(null);
    setIsCheckingAnswer(true);
    try {
      const result = await submitAiMentorAnswer(
        block.lessonContext,
        block.topic,
        currentQuestion,
        trimmed,
      );
      const wasCorrect = typeof result.correct === "boolean" ? result.correct : true;
      setQuizFeedback(result.feedback);
      setLastAnswerCorrect(wasCorrect);
      if (wasCorrect) {
        const nextCount = correctCount + 1;
        setCorrectCount(nextCount);
        setQuizAnswer("");
        if (nextCount < quizGoal) {
          await fetchQuestion();
        } else {
          setCurrentQuestion(null);
          setLastAnswerCorrect(null);
        }
      }
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Could not submit answer.");
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const lockNextQuestion =
    Boolean(currentQuestion && lastAnswerCorrect === false && correctCount < quizGoal);

  const chatSection = (
    <>
      <div
        ref={chatScrollRef}
        className="mb-4 max-h-72 overflow-y-auto space-y-4 rounded-2xl border border-gray-700/60 bg-gray-800/50 p-5 backdrop-blur"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "mentor" ? "justify-start" : "justify-end"}`}
          >
            <div className="max-w-[80%] space-y-1">
              <p className="text-[11px] text-gray-500 capitalize">
                {message.sender === "mentor" ? "mentor" : "you"}
              </p>
              <div
                className={`rounded-2xl px-4 py-3 leading-relaxed shadow-lg ${
                  message.sender === "mentor"
                    ? "border border-gray-700/50 bg-gray-800/85 text-gray-100"
                    : "bg-linear-to-br from-cyan-600 to-cyan-700 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {!messages.length && (
          <p className="text-sm text-gray-400">Start the conversation by asking a question.</p>
        )}
      </div>
      {block.suggestedQuestions && block.suggestedQuestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {block.suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPromptInput(suggestion)}
              className="rounded-full border border-gray-700/60 bg-gray-900/60 px-3 py-1 text-[11px] text-gray-300 transition hover:border-cyan-500/60 hover:text-cyan-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendExplainMessage();
        }}
      >
  <div className="flex items-center gap-3 rounded-2xl border border-gray-700/60 bg-gray-900/60 px-4 py-2">
          <textarea
            value={promptInput}
            onChange={(event) => setPromptInput(event.target.value)}
            placeholder="Message mentor…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-2 text-gray-100 placeholder:text-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSendingExplain}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-[11px] font-semibold text-white transition hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-40"
          >
            {isSendingExplain ? "…" : "Send"}
          </button>
        </div>
      </form>
      {explainError && <p className="mt-3 text-sm text-red-400">{explainError}</p>}
      {readyToContinue && (
        <button
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-linear-to-r from-cyan-600 to-cyan-700 py-3 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-cyan-600"
        >
          Continue
        </button>
      )}
    </>
  );

  const quizSection = (
    <>
      <p className="mb-3 text-sm text-gray-300">
        {block.prompt} You need {quizGoal} correct answer{quizGoal === 1 ? "" : "s"} to continue.
      </p>
      <div className="mb-4 h-1.5 w-full rounded-full bg-gray-700/60">
        <div
          className="h-full rounded-full bg-linear-to-r from-cyan-500 to-cyan-400 transition-all"
          style={{ width: `${(correctCount / quizGoal) * 100}%` }}
        />
      </div>
  {quizError && <p className="mb-3 text-sm text-red-400">{quizError}</p>}
      {isFetchingQuestion && <p className="mb-4 text-sm text-gray-300">Fetching a new question…</p>}
      {currentQuestion && (
        <div className="mb-4 rounded-2xl border border-gray-700/60 bg-gray-900/55 p-5 shadow-lg">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gray-500">Question</p>
          <p className="whitespace-pre-wrap text-base font-medium text-white">{currentQuestion}</p>
        </div>
      )}
      <textarea
        value={quizAnswer}
        onChange={(event) => setQuizAnswer(event.target.value)}
        className="w-full min-h-24 rounded-2xl border border-gray-700/60 bg-gray-900/45 p-4 text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none"
        placeholder="Type your answer..."
        disabled={isFetchingQuestion || correctCount >= quizGoal}
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={submitQuizResponse}
          disabled={isFetchingQuestion || correctCount >= quizGoal || isCheckingAnswer}
          className="flex-1 rounded-xl bg-linear-to-r from-cyan-600 to-cyan-700 py-3 px-4 text-white font-semibold transition hover:from-cyan-500 hover:to-cyan-600 disabled:opacity-60"
        >
          {isCheckingAnswer ? "Checking…" : "Submit answer"}
        </button>
        <button
          type="button"
          onClick={requestNewQuestion}
          disabled={isFetchingQuestion || isCheckingAnswer || lockNextQuestion}
          className="flex-1 rounded-xl border border-gray-600/70 py-3 px-4 text-gray-200 transition hover:bg-gray-800 disabled:opacity-60"
        >
          New question
        </button>
      </div>
      {quizFeedback && (
        <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-gray-700/60 bg-gray-900/55 p-5 text-gray-100 shadow-lg">
          {quizFeedback}
        </p>
      )}
      {lastAnswerCorrect === false && (
        <p className="mt-2 text-xs text-red-400">
          Answer this question correctly before moving on.
        </p>
      )}
      {readyToContinue && (
        <button
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-linear-to-r from-cyan-600 to-cyan-700 py-3 text-sm font-semibold text-white transition hover:from-cyan-500 hover:to-cyan-600"
        >
          Continue
        </button>
      )}
    </>
  );

  return (
    <div className="rounded-2xl border border-gray-700/60 bg-gray-900/50 p-6 text-[13px] text-gray-100 shadow-2xl backdrop-blur">
      <header className="mb-6 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">{block.persona} mentor</p>
        <h3 className="text-lg font-semibold text-white">{block.title}</h3>
        <p className="text-[11px] text-gray-300 capitalize">Mode: {block.mode}</p>
      </header>
      <div>{block.mode === "quiz" ? quizSection : chatSection}</div>
    </div>
  );
};

export default AiMentorPanel;
