"use client";

import React from "react";

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

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-gray-400">This week&apos;s top performers</p>
      </div>

      <div className="space-y-4">
        {dummyData.map((user, index) => {
          const isCurrentUser = user.name === "You";
          const isTopThree = index < 3;
          
          return (
            <div
              key={user.name}
              className={`relative group rounded-2xl transition-all duration-300 ${
                isCurrentUser
                  ? "bg-cyan-900/20 border-2 border-cyan-500/40 shadow-lg"
                  : isTopThree
                  ? "bg-gray-800/80 border-2 border-gray-700/60 hover:border-cyan-500/30 shadow-lg hover:shadow-xl"
                  : "bg-gray-800/60 border border-gray-700/50 hover:border-gray-600/70 shadow-md hover:shadow-lg"
              } hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-4 p-5">
                {/* Rank */}
                <div className={`flex items-center justify-center min-w-[3rem] ${
                  isTopThree ? "text-3xl" : "text-2xl"
                }`}>
                  {getMedalEmoji(index) || (
                    <span className={`font-bold ${
                      isCurrentUser ? "text-cyan-300" : "text-gray-500"
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-xl font-bold ${
                      isCurrentUser ? "text-white" : "text-gray-200"
                    }`}>
                      {user.name}
                    </h3>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500/30 text-cyan-300 rounded-full border border-cyan-500/50">
                        YOU
                      </span>
                    )}
                  </div>
                  
                  {/* XP Display */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${
                      isCurrentUser ? "bg-cyan-500/20" : "bg-gray-700/50"
                    }`}>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className={`font-bold text-base ${
                        isCurrentUser ? "text-white" : "text-yellow-400"
                      }`}>
                        {user.xp.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">XP</span>
                    </div>
                  </div>
                </div>


              </div>

              {/* Progress Bar for Current User */}
              {isCurrentUser && (
                <div className="px-5 pb-4">
                  <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 rounded-full transition-all duration-700"
                      style={{ 
                        width: `${Math.min((user.xp / (dummyData[0]?.xp || 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 text-right">
                    {dummyData[0] && user.xp < dummyData[0].xp 
                      ? `${(dummyData[0].xp - user.xp)} XP to #1`
                      : "You&apos;re #1! 🎉"
                    }
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
