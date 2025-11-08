"use client";

import { useState } from "react";
import { LessonSummary, UserProfile } from "../lib/types";
import LessonModal from "./LessonModal";
import Roadmap from "./Roadmap";
import Leaderboard from "./Components/Leaderboard";
import Profile from "./Components/Profile";

import {
  BookIcon,
  FireIcon,
  HeartIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
} from "./Components/Icons";

interface DashboardProps {
  lives: number;
  streak: number;
  xp: number;
  roadmap: LessonSummary[];
  userProfile: UserProfile;
  loseLife: () => void;
  completeLesson: (lessonId: string, xpReward: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  lives,
  streak,
  xp,
  roadmap,
  userProfile,
  loseLife,
  completeLesson,
}) => {
  const [activeTab, setActiveTab] = useState("Roadmap");
  const [selectedLesson, setSelectedLesson] = useState<LessonSummary | null>(null);

  const tabs = [
    { name: "Roadmap", icon: BookIcon },
    { name: "Leaderboard", icon: TrophyIcon },
    { name: "Profile", icon: UserIcon },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <nav className="w-full md:w-64 bg-gray-800 p-4 flex flex-row md:flex-col justify-between items-center md:items-stretch md:justify-start shadow-lg z-20">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2 md:mb-8 text-center md:text-left">ViaMent</h1>
          <ul className="flex flex-row md:flex-col md:space-y-2 justify-center">
            {tabs.map((tab) => (
              <li key={tab.name}>
                <button
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 ${
                    activeTab === tab.name ? "bg-cyan-600 text-white" : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-yellow-400" title={`${xp} XP`}>
            <StarIcon className="h-7 w-7" />
            <span className="text-xl font-bold">{xp}</span>
          </div>
          <div className="flex items-center space-x-1 text-orange-400" title={`${streak} day streak`}>
            <FireIcon className="h-7 w-7" />
            <span className="text-xl font-bold">{streak}</span>
          </div>
          <div className="flex items-center space-x-1 text-red-500" title={`${lives} lives remaining`}>
            <HeartIcon className="h-7 w-7" />
            <span className="text-xl font-bold">{lives}</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-gray-900">
        {activeTab === "Roadmap" && <Roadmap stages={roadmap} onStageSelect={setSelectedLesson} />}
        {activeTab === "Leaderboard" && <Leaderboard currentUserXp={xp} />}
        {activeTab === "Profile" && <Profile userProfile={userProfile} />}
      </main>

      {selectedLesson && (
        <LessonModal
          stage={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onComplete={completeLesson}
          loseLife={loseLife}
          userProfile={userProfile}
        />
      )}
    </div>
  );
};



export default Dashboard;
