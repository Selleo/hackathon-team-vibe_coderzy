"use client";

import { useState, useCallback, useEffect } from "react";
import Dashboard from "./Dashboard";
import Survey from "./Survey";
import MainTopics from "./MainTopics";
import { LessonBlock, LessonPlan, LessonSummary, StageStatus, UserProfile } from "../lib/types";
import { generateRoadmapPlan, generateTopicsFallback } from "../lib/roadmapBuilder";

interface StoredLessonSummary extends Omit<LessonSummary, "status"> {
  status: StageStatus;
}

interface RoadmapLessonResponse {
  id: string;
  title: string;
  topic: string;
  status: StageStatus;
  xp_reward: number;
  plan: LessonPlan;
}

const App = () => {
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [topicsCompleted, setTopicsCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mainTopics, setMainTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [roadmap, setRoadmap] = useState<LessonSummary[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const safeParse = <T,>(key: string): T | null => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch (error) {
        console.warn(`Failed to parse ${key}`, error);
        localStorage.removeItem(key);
        return null;
      }
    };

    const storedSurveyCompleted = localStorage.getItem("surveyCompleted");
    if (storedSurveyCompleted === "true") {
      setSurveyCompleted(true);
    }

    const storedTopicsCompleted = localStorage.getItem("topicsCompleted");
    if (storedTopicsCompleted === "true") {
      setTopicsCompleted(true);
    }

    const storedUserProfile = safeParse<UserProfile>("userProfile");
    if (storedUserProfile) {
      setUserProfile(storedUserProfile);
    }

    const storedMainTopics = safeParse<string[]>("mainTopics");
    if (storedMainTopics) {
      setMainTopics(Array.isArray(storedMainTopics) ? storedMainTopics : []);
    }

    const storedRoadmap = safeParse<StoredLessonSummary[]>("roadmap");
    if (storedRoadmap) {
      setRoadmap(
        storedRoadmap.map((lesson) => ({
          ...lesson,
          status: lesson.status as StageStatus,
        }))
      );
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }
    localStorage.setItem("surveyCompleted", surveyCompleted ? "true" : "false");
  }, [surveyCompleted, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }
    localStorage.setItem("topicsCompleted", topicsCompleted ? "true" : "false");
  }, [topicsCompleted, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }
    if (userProfile) {
      localStorage.setItem("userProfile", JSON.stringify(userProfile));
      localStorage.setItem("lastProfileSync", new Date().toISOString());
    } else {
      localStorage.removeItem("userProfile");
      localStorage.removeItem("lastProfileSync");
    }
  }, [userProfile, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }
    localStorage.setItem("mainTopics", JSON.stringify(mainTopics));
  }, [mainTopics, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }
    if (roadmap.length > 0) {
      localStorage.setItem("roadmap", JSON.stringify(roadmap));
      localStorage.setItem("roadmapUpdatedAt", new Date().toISOString());
    } else {
      localStorage.removeItem("roadmap");
      localStorage.removeItem("roadmapUpdatedAt");
    }
  }, [roadmap, isHydrated]);

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
      const topics = Array.isArray(data?.topics)
        ? data.topics
        : generateTopicsFallback(profile);
      setMainTopics(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setMainTopics(generateTopicsFallback(profile));
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  const handleTopicsComplete = useCallback(
    async (topics: string[]) => {
      if (!userProfile) {
        console.warn("Cannot generate roadmap without profile.");
        return;
      }
      setMainTopics(topics);
      setTopicsCompleted(true);
      setLoadingRoadmap(true);
      try {
        const response = await fetch("/api/roadmap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topics, profile: userProfile }),
        });
        const data = await response.json();
        const lessons: RoadmapLessonResponse[] = Array.isArray(data?.lessons)
          ? data.lessons
          : generateRoadmapPlan(userProfile, topics);
        const roadmapEntries = lessons.map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title,
          status: lesson.status ?? (index === 0 ? StageStatus.Unlocked : StageStatus.Locked),
          lesson: {
            id: lesson.id,
            title: lesson.title,
            track: lesson.topic,
            chapter: lesson.topic,
            estimated_minutes: 10,
            xp_reward: lesson.xp_reward ?? 20,
            prerequisites: [],
            blocks: [],
            plan: lesson.plan,
          },
        }));
        setRoadmap(roadmapEntries);
      } catch (error) {
        console.error("Error fetching roadmap:", error);
        const fallback = generateRoadmapPlan(userProfile, topics);
        const entries = fallback.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          status: lesson.status,
          lesson: {
            id: lesson.id,
            title: lesson.title,
            track: lesson.topic,
            chapter: lesson.topic,
            estimated_minutes: 10,
            xp_reward: lesson.xp_reward,
            prerequisites: [],
            blocks: [],
            plan: lesson.plan,
          },
        }));
        setRoadmap(entries);
      } finally {
        setLoadingRoadmap(false);
      }
    },
    [userProfile],
  );

  const loseLife = () => {
    setLives((prev) => Math.max(0, prev - 1));
  };

  const completeLesson = (lessonId: string, xpReward: number) => {
    setRoadmap((prevRoadmap) => {
      const currentLesson = prevRoadmap.find((lesson) => lesson.id === lessonId);
      
      // Only give XP if the lesson wasn't already completed
      if (currentLesson?.status !== StageStatus.Completed) {
        setXp((prev) => prev + xpReward);
        setStreak((prev) => (prev === 0 ? 1 : prev));
      }
      
      const newRoadmap = prevRoadmap.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, status: StageStatus.Completed }
          : lesson
      );

      const completedIndex = newRoadmap.findIndex(
        (lesson) => lesson.id === lessonId
      );
      
      // Only unlock the next lesson if it's currently locked
      if (completedIndex !== -1 && completedIndex + 1 < newRoadmap.length) {
        const nextLesson = newRoadmap[completedIndex + 1];
        if (nextLesson.status === StageStatus.Locked) {
          newRoadmap[completedIndex + 1].status = StageStatus.Unlocked;
        }
      }

      return newRoadmap;
    });
  };

  const handleLessonHydrated = useCallback((lessonId: string, blocks: LessonBlock[]) => {
    setRoadmap((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              lesson: { ...lesson.lesson, blocks },
            }
          : lesson,
      ),
    );
  }, []);

  const handleResetRoadmap = useCallback(() => {
    setRoadmap([]);
    setTopicsCompleted(false);
    setLoadingRoadmap(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("roadmap");
      localStorage.removeItem("roadmapUpdatedAt");
      localStorage.setItem("topicsCompleted", "false");
    }
  }, []);

  const handleLogout = useCallback(() => {
    setSurveyCompleted(false);
    setTopicsCompleted(false);
    setUserProfile(null);
    setMainTopics([]);
    setRoadmap([]);
    setLives(3);
    setStreak(0);
    setXp(0);
    setLoadingTopics(false);
    setLoadingRoadmap(false);
    if (typeof window !== "undefined") {
      [
        "surveyCompleted",
        "topicsCompleted",
        "userProfile",
        "mainTopics",
        "roadmap",
        "lastProfileSync",
        "roadmapUpdatedAt",
      ].forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  const renderLoadingState = (message: string) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900 px-4">
      <div className="text-2xl text-white">{message}</div>
      <p className="text-sm text-gray-400">
        This might take a moment, thanks for your patience.
      </p>
      <div className="w-full max-w-xl">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-800">
          <div className="absolute inset-y-0 left-0 w-1/2 animate-[progress-slide_1.6s_linear_infinite] bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {!surveyCompleted ? (
        <Survey onComplete={handleSurveyComplete} />
      ) : loadingTopics ? (
        renderLoadingState("Generating your personalized roadmap...")
      ) : !topicsCompleted ? (
        <MainTopics
          onComplete={handleTopicsComplete}
          initialTopics={mainTopics}
        />
      ) : loadingRoadmap ? (
        renderLoadingState("Generating your personalized roadmap...")
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
            onLessonHydrated={handleLessonHydrated}
            onResetRoadmap={handleResetRoadmap}
            onLogout={handleLogout}
            mainTopics={mainTopics}
          />
        )
      )}
    </div>
  );
};

export default App;
