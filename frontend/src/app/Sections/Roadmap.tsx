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
      <div className="container mx-auto max-w-5xl animate-fade-in px-4 py-8">
        <button onClick={() => setSelectedTopic(null)} className="mb-6 px-4 py-2 bg-gray-700/80 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Topics
        </button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-cyan-300 tracking-tight mb-2">{selectedTopic}</h1>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-cyan-600 to-cyan-500/20" />
          
          <div className="space-y-6">
            {lessons.map((stage, index) => {
              const isLocked = stage.status === StageStatus.Locked;
              const isCompleted = stage.status === StageStatus.Completed;
              
              // Find the first uncompleted lesson
              const firstUncompletedIndex = lessons.findIndex(l => l.status !== StageStatus.Completed);
              const isNextAvailable = index === firstUncompletedIndex;
              const isClickable = isCompleted || isNextAvailable;
              
              return (
                <div key={stage.id} className="relative flex items-start gap-6">
                  {/* Timeline node */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-lg transition-all duration-200 ${
                    isCompleted 
                      ? "bg-emerald-500 border-emerald-300 shadow-emerald-500/50" 
                      : isNextAvailable
                      ? "bg-cyan-500 border-cyan-300 shadow-cyan-500/50"
                      : "bg-gray-600 border-gray-500"
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="w-8 h-8 text-white" />
                    ) : isNextAvailable ? (
                      <PlayIcon className="w-8 h-8 text-white" />
                    ) : (
                      <LockIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Lesson card */}
                  <button
                    onClick={() => {
                      if (!isClickable) {
                        setInfoMessage("Complete the previous lessons first to unlock this one.");
                        return;
                      }
                      onStageSelect(stage);
                    }}
                    className={`flex-1 text-left rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? "bg-emerald-900/20 border-emerald-500/30 hover:border-emerald-500/50"
                        : isNextAvailable
                        ? "bg-cyan-900/20 border-cyan-500/40 hover:border-cyan-500/60 hover:bg-cyan-900/30"
                        : "bg-gray-800/50 border-gray-700 cursor-not-allowed"
                    } p-5 shadow-lg`}
                    disabled={!isClickable}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Lesson {index + 1}
                          </span>
                          {isCompleted && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${
                          isLocked ? "text-gray-500" : "text-white"
                        }`}>
                          {stage.title}
                        </h3>
                        <p className={`text-sm ${isLocked ? "text-gray-600" : "text-gray-400"}`}>
                          {stage.lesson.chapter}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                          isLocked ? "bg-gray-700/50" : "bg-gray-700/80"
                        }`}>
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className={`text-sm font-medium ${isLocked ? "text-gray-500" : "text-gray-300"}`}>
                            {stage.lesson.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {infoMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-cyan-500/40 bg-gray-900/95 p-4 shadow-xl backdrop-blur-sm">
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
    <div className="container mx-auto max-w-4xl animate-fade-in px-4 py-8">
      <h1 className="text-5xl font-extrabold mb-10 text-cyan-300 tracking-tight">Your Learning Roadmap</h1>
      <div className="space-y-4">
        {topicEntries.map(([topic, lessons], topicIndex) => {
          const completedCount = lessons.filter(l => l.status === StageStatus.Completed).length;
          const totalLessons = lessons.length;
          const locked = isTopicLocked(topicIndex);
          
          return (
            <div key={topic} className={`bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border transition-all duration-200 ${
              locked ? "border-gray-700" : "border-gray-700/50 hover:border-cyan-500/30"
            }`}>
              <button
                className={`w-full text-left p-6 transition-colors duration-200 ${
                  locked ? "cursor-not-allowed" : "hover:bg-gray-800/80"
                }`}
                onClick={() => {
                  if (locked) {
                    setInfoMessage("Complete earlier lessons to unlock this section.");
                    return;
                  }
                  setSelectedTopic(topic);
                }}
                aria-disabled={locked}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold mb-2 ${locked ? "text-gray-500" : "text-white"}`}>
                      {topic}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <div className={`flex items-center gap-1.5 ${locked ? "text-gray-600" : "text-gray-400"}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>{completedCount}/{totalLessons} lessons</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    {!locked && (
                      <div className="mt-3 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${(completedCount / totalLessons) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    {locked ? (
                      <LockIcon className="w-8 h-8 text-gray-500" />
                    ) : (
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      {infoMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-cyan-500/40 bg-gray-900/95 p-4 shadow-xl backdrop-blur-sm">
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
