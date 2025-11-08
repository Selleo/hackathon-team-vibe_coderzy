"use client";

import { useState, useCallback } from "react";
import Dashboard from "./Dashboard";
import Survey from "./Survey";
import MainTopics from "./MainTopics";
import { INITIAL_ROADMAP_LESSONS } from "../lib/constants";
import { LessonSummary, StageStatus, UserProfile } from "../lib/types";

const App = () => {
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [topicsCompleted, setTopicsCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mainTopics, setMainTopics] = useState<string[]>([]);

  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(3);
  const [xp, setXp] = useState(420);
  const [lessons, setLessons] = useState<LessonSummary[]>(INITIAL_ROADMAP_LESSONS);

  const handleSurveyComplete = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setSurveyCompleted(true);
  }, []);

  const handleTopicsComplete = useCallback((topics: string[]) => {
    setMainTopics(topics);
    setTopicsCompleted(true);
  }, []);

  const loseLife = () => {
    setLives((prev) => Math.max(0, prev - 1));
  };

  const completeLesson = (lessonId: string, xpReward: number) => {
    setXp((prev) => prev + xpReward);
    setLessons((prevLessons) => {
      const newLessons = prevLessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, status: StageStatus.Completed } : lesson,
      );

      const completedIndex = newLessons.findIndex((lesson) => lesson.id === lessonId);
      if (completedIndex !== -1 && completedIndex + 1 < newLessons.length) {
        newLessons[completedIndex + 1].status = StageStatus.Unlocked;
      }
      return newLessons;
    });
    setStreak((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {!surveyCompleted ? (
        <Survey onComplete={handleSurveyComplete} />
      ) : !topicsCompleted ? (
        <MainTopics onComplete={handleTopicsComplete} />
      ) : (
        userProfile && (
          <Dashboard
            lives={lives}
            streak={streak}
            xp={xp}
            roadmap={lessons}
            loseLife={loseLife}
            completeLesson={completeLesson}
            userProfile={userProfile}
          />
        )
      )}
    </div>
  );
};

export default App;
