"use client";

import { UserProfile } from "@/app/lib/types";
import React from "react";

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

export default Profile;
