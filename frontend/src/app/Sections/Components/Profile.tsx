"use client";

import { UserProfile } from "@/app/lib/types";
import React from "react";

const Profile: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => (
  <div className="container mx-auto max-w-2xl animate-fade-in">
    <h1 className="text-4xl font-bold mb-8 text-cyan-300">Your Profile</h1>
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Coding Experience</h3>
        <p className="text-lg text-white">{userProfile.codingExperience}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Learning Goal</h3>
        <p className="text-lg text-white">{userProfile.learningGoal || 'Not specified'}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Job Status</h3>
        <p className="text-lg text-white">{userProfile.jobStatus || 'Not specified'}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Reason for Learning</h3>
        <p className="text-lg text-white">{userProfile.reason || 'Not specified'}</p>
      </div>
      {userProfile.hobbies && userProfile.hobbies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400">Hobbies</h3>
          <p className="text-lg text-white">{userProfile.hobbies.join(', ')}</p>
        </div>
      )}
    </div>
  </div>
);

export default Profile;
