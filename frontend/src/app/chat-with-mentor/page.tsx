"use client";

import { useMemo } from "react";
import ChatWithMentor from "../components/ChatWithMentor";
import { UserProfile } from "../lib/types";

const defaultProfile: UserProfile = {
  experience: "Beginner",
  intensity: "Medium",
};

export default function ChatPage() {
  const userProfile = useMemo<UserProfile>(() => {
    if (typeof window === "undefined") {
      return defaultProfile;
    }
    try {
      const stored = window.localStorage.getItem("userProfile");
      return stored ? (JSON.parse(stored) as UserProfile) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <ChatWithMentor userProfile={userProfile} />
    </div>
  );
}
