"use client";

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
  isLast,
  index,
}: {
  stage: LessonSummary;
  onSelect: () => void;
  isLast: boolean;
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
    [StageStatus.Unlocked]: <PlayIcon className="w-6 h-6" />,
    [StageStatus.Completed]: <CheckCircleIcon className="w-6 h-6" />,
    [StageStatus.Locked]: <LockIcon className="w-5 h-5" />,
  } as const;

  return (
    <div className="flex items-center w-full">
      <div className="flex flex-col items-center mr-4">
        <button
          onClick={onSelect}
          disabled={isLocked}
          aria-label={`Lesson ${index + 1}: ${stage.title}, status: ${stage.status}`}
          className={`flex items-center justify-center w-12 h-12 rounded-full border-4 shadow-lg transition-transform duration-200 ${
            nodeStyles[stage.status]
          } ${!isLocked ? "hover:scale-110" : ""}`}
        >
          {icon[stage.status]}
        </button>
        {!isLast && <div className="w-1 h-24 bg-gray-700"></div>}
      </div>
      <div
        onClick={isLocked ? undefined : onSelect}
        className={`w-full p-4 rounded-lg transition-all duration-200 ${
          isLocked ? "bg-gray-800/50 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700/80 cursor-pointer shadow-md"
        }`}
      >
        <p className={`font-bold text-lg ${textStyles[stage.status]}`}>{stage.title}</p>
        <p className="text-gray-400 text-sm">{stage.lesson.chapter}</p>
      </div>
    </div>
  );
};

const Roadmap: React.FC<RoadmapProps> = ({ stages, onStageSelect }) => (
  <div className="container mx-auto max-w-2xl animate-fade-in">
    <h1 className="text-4xl font-bold mb-8 text-cyan-300">React Learning Roadmap</h1>
    <div className="flex flex-col items-start">
      {stages.map((stage, index) => (
        <RoadmapNode
          key={stage.id}
          stage={stage}
          index={index}
          onSelect={() => onStageSelect(stage)}
          isLast={index === stages.length - 1}
        />
      ))}
    </div>
  </div>
);

export default Roadmap;
