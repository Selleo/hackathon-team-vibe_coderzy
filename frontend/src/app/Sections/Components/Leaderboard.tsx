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

export default Leaderboard;
