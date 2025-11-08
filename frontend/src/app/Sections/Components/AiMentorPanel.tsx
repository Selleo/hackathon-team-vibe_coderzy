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
        role: msg.sender,
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
        userProfile.experience,
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
        className="mb-4 max-h-72 overflow-y-auto space-y-3 border border-[#1A1A1A] bg-[#050505] p-4"
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
                className={`rounded-lg px-3 py-2 leading-relaxed ${
                  message.sender === "mentor" ? "bg-transparent text-gray-100" : "bg-[#1A1A1A]"
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
              className="rounded-full border border-[#2A2A2A] px-3 py-1 text-[11px] text-gray-400 hover:text-gray-100"
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
        <div className="flex items-center gap-3 rounded-lg border border-[#1A1A1A] bg-[#050505] px-3">
          <textarea
            value={promptInput}
            onChange={(event) => setPromptInput(event.target.value)}
            placeholder="Message mentor…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-3 text-gray-100 placeholder:text-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSendingExplain}
            className="text-xs text-gray-300 transition hover:text-gray-100 disabled:opacity-50"
          >
            {isSendingExplain ? "…" : "Send"}
          </button>
        </div>
      </form>
      {explainError && <p className="mt-3 text-sm text-red-400">{explainError}</p>}
      {readyToContinue && (
        <button
          onClick={onContinue}
          className="mt-6 w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Continue
        </button>
      )}
    </>
  );

  const quizSection = (
    <>
      <p className="text-gray-300 mb-3">
        {block.prompt} You need {quizGoal} correct answer{quizGoal === 1 ? "" : "s"} to continue.
      </p>
      <div className="mb-4 h-1.5 w-full rounded-full bg-[#1E1E1E]">
        <div
          className="h-full rounded-full bg-[#0FA47F] transition-all"
          style={{ width: `${(correctCount / quizGoal) * 100}%` }}
        />
      </div>
      {quizError && <p className="text-sm text-red-400 mb-3">{quizError}</p>}
      {isFetchingQuestion && <p className="text-gray-400 mb-4">Fetching a new question…</p>}
      {currentQuestion && (
        <div className="mb-4 rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-2">Question</p>
          <p className="text-base font-medium text-white whitespace-pre-wrap">{currentQuestion}</p>
        </div>
      )}
      <textarea
        value={quizAnswer}
        onChange={(event) => setQuizAnswer(event.target.value)}
        className="w-full min-h-24 rounded-xl border border-[#2A2A2A] bg-[#0D0D0D] p-3 text-gray-100 placeholder:text-gray-500 focus:border-[#4E4E4E] focus:outline-none"
        placeholder="Type your answer..."
        disabled={isFetchingQuestion || correctCount >= quizGoal}
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={submitQuizResponse}
          disabled={isFetchingQuestion || correctCount >= quizGoal || isCheckingAnswer}
          className="flex-1 rounded-xl bg-[#0FA47F] py-3 px-4 text-white font-semibold transition hover:brightness-110 disabled:opacity-60"
        >
          {isCheckingAnswer ? "Checking…" : "Submit answer"}
        </button>
        <button
          type="button"
          onClick={requestNewQuestion}
          disabled={isFetchingQuestion || isCheckingAnswer || lockNextQuestion}
          className="flex-1 rounded-xl border border-[#2A2A2A] py-3 px-4 text-gray-300 transition hover:bg-[#1A1A1A] disabled:opacity-60"
        >
          New question
        </button>
      </div>
      {quizFeedback && (
        <p className="mt-4 text-white bg-gray-800 rounded-lg p-4 whitespace-pre-wrap">
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
          className="mt-6 w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Continue
        </button>
      )}
    </>
  );

  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#0c0c0c] p-4 text-[13px] text-gray-100">
      <header className="mb-4 space-y-1">
        <p className="text-[10px] tracking-[0.35em] text-gray-500 uppercase">{block.persona} mentor</p>
        <h3 className="text-base font-medium text-gray-100">{block.title}</h3>
        <p className="text-[11px] text-gray-500 capitalize">Mode: {block.mode}</p>
      </header>
      <div>{block.mode === "quiz" ? quizSection : chatSection}</div>
    </div>
  );
};

export default AiMentorPanel;
