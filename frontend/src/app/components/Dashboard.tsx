"use client";

import { useState } from "react";
import { LessonSummary, UserProfile } from "../lib/types";
import LessonModal from "./LessonModal";
import Roadmap from "./Roadmap";

const FireIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 12 2 12 2C12 2 12 2 12 2C11.93 2.00033 11.8611 2.01168 11.7954 2.03381C11.5982 2.09988 11.4116 2.21415 11.25 2.36C10.15 3.39 9.87 5.23 10.33 6.94C10.8 8.65 12.79 10.16 12.79 12.5C12.79 14.84 10.8 16.35 10.33 18.06C9.87 19.77 10.15 21.61 11.25 22.64C11.4116 22.7858 11.5982 22.9001 11.7954 22.9662C11.8611 22.9883 11.93 22.9997 12 23C12 23 12 23 12 23C12 23 12 23 12 23C13.06 23 14.05 22.61 14.81 21.84C16.88 19.77 16.92 16.47 15.65 14.28C15.01 13.16 15.17 11.64 16.25 10.64C17.25 9.72 17.5 8.16 16.71 7.03C15.75 5.67 15.89 3.82 17.21 2.72C16.53 2.26 15.72 2 14.86 2C13.91 2 12.98 2.34 12.28 2.97C12.1932 3.05141 12.0982 3.12333 12 3.18C12 3.18 12 3.18 12 3.18C12 3.18 12 3.18 12 3.18C11.9018 3.12333 11.8068 3.05141 11.72 2.97C11.55 2.82 11.64 2.58 11.64 2.58C11.72 2.41 11.85 2.27 12 2Z" />
  </svg>
);
const HeartIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 20.354l-1.454-1.314C5.4 14.246 2 11.22 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.72-3.4 6.746-8.546 11.54L12 20.354z" />
  </svg>
);
const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-2V1a1 1 0 00-2 0v1H8V1a1 1 0 00-2 0v1H4a2 2 0 00-2 2v2c0 1.1.9 2 2 2h1v1a6 6 0 005 5.91V20H9a1 1 0 000 2h6a1 1 0 000-2h-3v-3.09A6 6 0 0019 12v-1h1a2 2 0 002-2V4a2 2 0 00-2-2zM4 6V4h2v2H4zm14 0V4h2v2h-2z" />
  </svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);
const BookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
  </svg>
);
const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

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
          <h1 className="text-2xl font-bold text-cyan-400 mb-2 md:mb-8 text-center md:text-left">Dopamine Dev</h1>
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

const Leaderboard: React.FC<{ currentUserXp: number }> = ({ currentUserXp }) => {
  const dummyData = [
    { name: "Alex", xp: 1250 },
    { name: "Maria", xp: 1100 },
    { name: "You", xp: currentUserXp },
    { name: "Kenji", xp: 850 },
    { name: "Fatima", xp: 700 },
    { name: "David", xp: 620 },
    { name: "Sofia", xp: 550 },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="container mx-auto max-w-2xl animate-fade-in">
      <h1 className="text-4xl font-bold mb-8 text-cyan-300">Weekly Leaderboard</h1>
      <div className="bg-gray-800 rounded-lg shadow-lg p-4">
        <ul className="space-y-3">
          {dummyData.map((user, index) => (
            <li
              key={user.name}
              className={`flex items-center justify-between p-3 rounded-lg ${
                user.name === "You" ? "bg-cyan-600/50 border-2 border-cyan-400" : "bg-gray-700"
              }`}
            >
              <div className="flex items-center">
                <span className="font-bold text-lg text-gray-400 w-10">#{index + 1}</span>
                <span className="font-semibold text-white text-lg">{user.name}</span>
              </div>
              <span className="font-bold text-yellow-400">{user.xp} XP</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Profile: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => (
  <div className="container mx-auto max-w-2xl animate-fade-in">
    <h1 className="text-4xl font-bold mb-8 text-cyan-300">Your Profile</h1>
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Experience Level</h3>
        <p className="text-lg text-white">{userProfile.experience}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Daily Goal</h3>
        <p className="text-lg text-white">{userProfile.intensity}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;
