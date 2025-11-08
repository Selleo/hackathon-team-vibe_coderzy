"use client";

import { useState, useCallback } from "react";
import Dashboard from "./Dashboard";
import Survey from "./Survey";
import MainTopics from "./MainTopics";
import { LessonSummary, StageStatus, UserProfile } from "../lib/types";

const App = () => {
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [topicsCompleted, setTopicsCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mainTopics, setMainTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [roadmap, setRoadmap] = useState<LessonSummary[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(3);
  const [xp, setXp] = useState(420);

  const handleSurveyComplete = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    setSurveyCompleted(true);
    setLoadingTopics(true);
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      setMainTopics(data.topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      // Handle error, maybe set some default topics
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  const handleTopicsComplete = useCallback(async (topics: string[]) => {
    setMainTopics(topics);
    setTopicsCompleted(true);
    setLoadingRoadmap(true);
    try {
      let newRoadmap: LessonSummary[] = [];
      for (const topic of topics) {
        const response = await fetch("/api/roadmap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic }),
        });
        const data = await response.json();
        const topicLessons = data.lessons.map((lesson: any) => ({
          id: `${topic}-${lesson.title}`,
          title: lesson.title,
          status: StageStatus.Unlocked,
          lesson: {
            id: `${topic}-${lesson.title}`,
            title: lesson.title,
            track: topic,
            chapter: topic,
            estimated_minutes: 10,
            xp_reward: 20,
            prerequisites: [],
            blocks: [{ type: "text", title: lesson.title, markdown: lesson.description }],
          },
        }));
        newRoadmap = [...newRoadmap, ...topicLessons];
        setRoadmap(newRoadmap);
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      // Handle error, maybe set a default roadmap
    } finally {
      setLoadingRoadmap(false);
    }
  }, []);

  const loseLife = () => {
    setLives((prev) => Math.max(0, prev - 1));
  };

  const completeLesson = (lessonId: string, xpReward: number) => {
    setXp((prev) => prev + xpReward);
    setRoadmap((prevRoadmap) => {
      const newRoadmap = prevRoadmap.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, status: StageStatus.Completed } : lesson,
      );

      const completedIndex = newRoadmap.findIndex((lesson) => lesson.id === lessonId);
      if (completedIndex !== -1 && completedIndex + 1 < newRoadmap.length) {
        newRoadmap[completedIndex + 1].status = StageStatus.Unlocked;
      }

      return newRoadmap;
    });
    setStreak((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {!surveyCompleted ? (
        <Survey onComplete={handleSurveyComplete} />
      ) : loadingTopics ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl">Generating your personalized roadmap...</div>
        </div>
      ) : !topicsCompleted ? (
        <MainTopics onComplete={handleTopicsComplete} initialTopics={mainTopics} />
      ) : loadingRoadmap ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl">Generating your personalized roadmap...</div>
        </div>
      ) : (
        userProfile && (
          <Dashboard
            lives={lives}
            streak={streak}
            xp={xp}
            roadmap={roadmap}
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
