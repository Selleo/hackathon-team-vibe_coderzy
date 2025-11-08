"use client";

import { useEffect, useState } from "react";
import ChatWithMentor from "../components/ChatWithMentor";
import { UserProfile } from "../lib/types";

const defaultProfile: UserProfile = {
  experience: "Beginner",
  intensity: "Medium",
};

export default function ChatPage() {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      }
    } catch (e) {
      // ignore and use default
    }
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <ChatWithMentor userProfile={userProfile} />
    </div>
  );
}
