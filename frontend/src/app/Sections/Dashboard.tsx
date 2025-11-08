"use client";

import { useState, useEffect } from "react";
import { LessonSummary, UserProfile } from "../lib/types";
import LessonModal from "./LessonModal";
import Roadmap from "./Roadmap";
import Leaderboard from "./Components/Leaderboard";
import Profile from "./Components/Profile";
import ChatWithMentor from "../components/ChatWithMentor";

import {
  BookIcon,
  FireIcon,
  HeartIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
  ChatIcon,
  MenuIcon,
  CloseIcon,
  CollapseIcon,
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
  const [selectedLesson, setSelectedLesson] = useState<LessonSummary | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // close sidebar on larger screens and keep it open on md+ by default
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tabs = [
    { name: "Roadmap", icon: BookIcon },
    { name: "Chat with Mentor", icon: ChatIcon },
    { name: "Leaderboard", icon: TrophyIcon },
    { name: "Profile", icon: UserIcon },
  ];

  const sidebarTranslate = sidebarOpen
    ? "translate-x-0 md:translate-x-0 opacity-100 pointer-events-auto"
    : "-translate-x-full md:-translate-x-full opacity-0 md:opacity-0 pointer-events-none";

  return (
    <div className="relative flex min-h-screen bg-gray-900">
      {/* Mobile hamburger */}
      <header
        className={`fixed top-4 left-4 z-40 flex ${
          sidebarOpen ? "md:hidden" : "md:flex"
        }`}
      >
        <button
          onClick={() => setSidebarOpen((open) => !open)}
          className="flex items-center gap-2 rounded-full bg-gray-800/90 px-4 py-2 shadow-lg backdrop-blur"
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        >
          {sidebarOpen ? (
            <CloseIcon className="h-6 w-6 text-cyan-200" />
          ) : (
            <MenuIcon className="h-6 w-6 text-cyan-200" />
          )}
          <span className="text-sm font-semibold text-cyan-100">Menu</span>
        </button>
      </header>

      {/* Sidebar + overlay for mobile */}
      <aside
        className={`absolute inset-y-0 left-0 z-30 transform transition-all duration-300 ease-in-out bg-linear-to-b from-gray-800/90 to-gray-900/95 shadow-xl w-72 p-5 flex flex-col justify-between md:relative h-full md:h-screen overflow-y-auto md:overflow-hidden ${sidebarTranslate}`}
        aria-hidden={!sidebarOpen}
      >
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-cyan-400 mb-1">
                ViaMent
              </h1>
              <p className="text-sm text-cyan-200/80">
                Mentor guiding your growth
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-gray-800/70 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-gray-700/70"
            >
              <CollapseIcon className="h-8 w-8" />
              <span>Hide</span>
            </button>
          </div>

          <nav className="mt-6">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.name}>
                  <button
                    onClick={() => {
                      setActiveTab(tab.name);
                      // close on small screens after selecting
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 gap-3 text-left ${
                      activeTab === tab.name
                        ? "bg-cyan-600/80 text-white shadow-md"
                        : "text-gray-300 hover:bg-gray-700/60"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                    {tab.name === "Chat with Mentor" && (
                      <span className="ml-auto text-xs bg-cyan-700/60 text-cyan-100 px-2 py-1 rounded">
                        AI
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 md:mt-6 sticky bottom-6">
          <div className="grid gap-4">
            {[
              {
                label: "XP",
                value: xp,
                Icon: StarIcon,
                iconColor: "text-yellow-300",
              },
              {
                label: "Streak",
                value: streak,
                Icon: FireIcon,
                iconColor: "text-orange-400",
              },
              {
                label: "Lives",
                value: lives,
                Icon: HeartIcon,
                iconColor: "text-red-400",
              },
            ].map(({ label, value, Icon, iconColor }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-gray-800/70 px-4 py-3 backdrop-blur transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div className="rounded-xl bg-gray-700/90 p-3">
                  <Icon className={`h-8 w-8 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-gray-400">
                    {label}
                  </div>
                  <div className="text-lg font-bold text-white">{value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full md:hidden bg-gray-700/60 hover:bg-gray-700 text-sm text-white py-2 rounded-lg"
            >
              Hide sidebar
            </button>
          </div>
        </div>
      </aside>

      {/* overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main
        className={`flex-1 p-4 pt-20 sm:p-6 md:p-8 md:pt-8 overflow-y-auto bg-gray-900 ml-0`}
      >
        {activeTab === "Roadmap" && (
          <Roadmap stages={roadmap} onStageSelect={setSelectedLesson} />
        )}
        {activeTab === "Chat with Mentor" && (
          <ChatWithMentor userProfile={userProfile} />
        )}
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
