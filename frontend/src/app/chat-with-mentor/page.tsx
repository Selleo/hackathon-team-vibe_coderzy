"use client";

import { useMemo } from "react";
import ChatWithMentor from "../components/ChatWithMentor";
import { UserProfile } from "../lib/types";

const defaultProfile: UserProfile = {
  reason: "",
  jobStatus: "",
  codingExperience: "beginner",
  captivates: "",
  learningGoal: "",
  hobbies: [],
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
    <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 h-screen overflow-hidden">
      <ChatWithMentor userProfile={userProfile} />
    </div>
  );
}
