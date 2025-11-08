"use client";

import { useState } from "react";
import { LessonSummary, StageStatus } from "../lib/types";
import { CoinIcon, ChestIcon, StarIcon, LockIcon } from "./Components/Icons";

interface ProgressPathProps {
  stages: LessonSummary[];
  onStageSelect: (stage: LessonSummary) => void;
}

const Milestone = ({
  stage,
  onSelect,
  index,
}: {
  stage: LessonSummary;
  onSelect: () => void;
  index: number;
}) => {
  const isLocked = stage.status === StageStatus.Locked;
  const isMajor = (index + 1) % 5 === 0; // Every 5th lesson is a major milestone

  const icon = isMajor ? <ChestIcon className="w-12 h-12" /> : <CoinIcon className="w-12 h-12" />;

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

  return (
    <div className={`flex items-center w-full ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
      <div className="flex flex-col items-center w-40">
        <button
          onClick={onSelect}
          disabled={isLocked}
          className={`flex items-center justify-center w-24 h-24 rounded-full border-8 shadow-lg transition-transform duration-200 ${
            nodeStyles[stage.status]
          } ${!isLocked ? "hover:scale-110" : ""}`}
        >
          {icon}
        </button>
        <p className={`mt-2 text-center font-semibold ${textStyles[stage.status]}`}>{stage.title}</p>
        <div className="flex mt-1">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${
                i < (stage.lesson.xp_reward / 20) * 5 ? "text-yellow-400" : "text-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ProgressPath: React.FC<ProgressPathProps> = ({ stages, onStageSelect }) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

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
      <div className="container mx-auto max-w-lg animate-fade-in px-4">
        <button onClick={() => setSelectedTopic(null)} className="mb-8 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
          &larr; Back to Topics
        </button>
        <h1 className="text-5xl font-extrabold mb-10 text-cyan-300 tracking-tight text-center">{selectedTopic}</h1>
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-2 bg-gray-700"></div>
          {lessons.map((stage, index) => (
            <div key={stage.id} className="my-12">
              <Milestone
                stage={stage}
                index={index}
                onSelect={() => onStageSelect(stage)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4">
      <h1 className="text-5xl font-extrabold mb-10 text-cyan-300 tracking-tight">Your Learning Roadmap</h1>
      <div className="space-y-6">
        {topicEntries.map(([topic, lessons], topicIndex) => (
          <div key={topic} className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <button
              className="w-full text-left text-2xl font-bold text-white flex justify-between items-center p-6 bg-gray-700/50 hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setSelectedTopic(topic)}
              disabled={isTopicLocked(topicIndex)}
            >
              <span>{topic}</span>
              {isTopicLocked(topicIndex) && <LockIcon className="w-8 h-8 text-gray-500" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressPath;
