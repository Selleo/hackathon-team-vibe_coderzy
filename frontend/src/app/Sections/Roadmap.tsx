"use client";

import { useEffect, useState } from "react";
import { LessonSummary, StageStatus } from "../lib/types";

const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 1a3 3 0 00-3 3v2H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-1V4a3 3 0 00-3-3zm-1 4V4a1 1 0 112 0v1H9z"
      clipRule="evenodd"
    />
  </svg>
);
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);
const PlayIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
      clipRule="evenodd"
    />
  </svg>
);

interface RoadmapProps {
  stages: LessonSummary[];
  onStageSelect: (stage: LessonSummary) => void;
}

const RoadmapNode = ({
  stage,
  onSelect,
  onLockedAttempt,
  index,
}: {
  stage: LessonSummary;
  onSelect: () => void;
  onLockedAttempt: () => void;
  index: number;
}) => {
  const isLocked = stage.status === StageStatus.Locked;

  const nodeStyles = {
    [StageStatus.Unlocked]: "bg-cyan-500 border-cyan-300 shadow-cyan-500/50",
    [StageStatus.Completed]: "bg-emerald-500 border-emerald-300 shadow-emerald-500/50",
    [StageStatus.Locked]: "bg-gray-600 border-gray-500 cursor-not-allowed",
  } as const;

  const textStyles = {
    [StageStatus.Unlocked]: "text-white",
    [StageStatus.Completed]: "text-white",
    [StageStatus.Locked]: "text-gray-400",
  } as const;

  const icon = {
    [StageStatus.Unlocked]: <PlayIcon className="w-8 h-8" />,
    [StageStatus.Completed]: <CheckCircleIcon className="w-8 h-8" />,
    [StageStatus.Locked]: <LockIcon className="w-6 h-6" />,
  } as const;

  const handleClick = () => {
    if (isLocked) {
      onLockedAttempt();
      return;
    }
    onSelect();
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Lesson ${index + 1}: ${stage.title}, status: ${stage.status}`}
        aria-disabled={isLocked}
        className={`flex items-center justify-center w-24 h-24 rounded-full border-8 shadow-lg transition-transform duration-200 ${
          nodeStyles[stage.status]
        } ${!isLocked ? "hover:scale-110" : ""}`}
      >
        {icon[stage.status]}
      </button>
      <p className={`mt-2 text-center font-semibold ${textStyles[stage.status]}`}>{stage.title}</p>
    </div>
  );
};
const Roadmap: React.FC<RoadmapProps> = ({ stages, onStageSelect }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!infoMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setInfoMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [infoMessage]);

  const topics = stages.reduce((acc, stage) => {
    const topic = stage.lesson.track;
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(stage);
    return acc;
  }, {} as Record<string, LessonSummary[]>);

  const topicEntries = Object.entries(topics);

  const isTopicLocked = (topicIndex: number) => {
    if (topicIndex === 0) {
      return false;
    }
    const prevTopic = topicEntries[topicIndex - 1][1];
    return prevTopic.some((stage) => stage.status !== StageStatus.Completed);
  };

  if (selectedTopic) {
    const lessons = topics[selectedTopic];
    return (
      <div className="container mx-auto max-w-4xl animate-fade-in px-4">
        <button onClick={() => setSelectedTopic(null)} className="mb-8 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
          &larr; Back to Topics
        </button>
        <h1 className="text-5xl font-extrabold mb-10 text-cyan-300 tracking-tight text-center">{selectedTopic}</h1>
        <div className="flex flex-col items-center">
          <div className="relative">
            {lessons.map((stage, index) => (
              <div key={stage.id} className="flex items-center justify-center my-4">
                <RoadmapNode
                  stage={stage}
                  index={index}
                  onSelect={() => onStageSelect(stage)}
                  onLockedAttempt={() =>
                    setInfoMessage("This lesson unlocks after you complete the previous ones.")
                  }
                />
              </div>
            ))}
          </div>
        </div>
        {infoMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-cyan-500/40 bg-gray-900/95 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-cyan-400" />
              <div className="text-sm text-gray-200">{infoMessage}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4">
      <h1 className="text-5xl font-extrabold mb-10 text-cyan-300 tracking-tight">Your Learning Roadmap</h1>
      <div className="space-y-6">
  {topicEntries.map(([topic], topicIndex) => (
          <div key={topic} className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <button
              className="w-full text-left text-2xl font-bold text-white flex justify-between items-center p-6 bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200"
              onClick={() => {
                if (isTopicLocked(topicIndex)) {
                  setInfoMessage("Complete earlier lessons to unlock this section.");
                  return;
                }
                setSelectedTopic(topic);
              }}
              aria-disabled={isTopicLocked(topicIndex)}
            >
              <span>{topic}</span>
              {isTopicLocked(topicIndex) && <LockIcon className="w-8 h-8 text-gray-500" />}
            </button>
          </div>
        ))}
      </div>
      {infoMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-cyan-500/40 bg-gray-900/95 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-cyan-400" />
            <div className="text-sm text-gray-200">{infoMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
