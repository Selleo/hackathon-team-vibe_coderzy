"use client";

import { useState, useCallback, useEffect } from "react";
import Dashboard from "./Dashboard";
import Survey from "./Survey";
import MainTopics from "./MainTopics";
import Login from "./Login";
import { LessonBlock, LessonSummary, StageStatus, UserProfile } from "../lib/types";

interface StoredLessonSummary extends Omit<LessonSummary, "status"> {
  status: StageStatus;
}

interface RoadmapLessonResponse {
  title: string;
  description: string;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

    try {
      const storedIsLoggedIn = localStorage.getItem("userIsLoggedIn");
      if (storedIsLoggedIn === "true") {
        setIsLoggedIn(true);
      }

      const storedSurveyCompleted = localStorage.getItem("surveyCompleted");
      if (storedSurveyCompleted === "true") {
        setSurveyCompleted(true);
      }

      const storedTopicsCompleted = localStorage.getItem("topicsCompleted");
      if (storedTopicsCompleted === "true") {
        setTopicsCompleted(true);
      }

      const storedUserProfile = localStorage.getItem("userProfile");
      if (storedUserProfile) {
        setUserProfile(JSON.parse(storedUserProfile));
      }

      const storedMainTopics = localStorage.getItem("mainTopics");
      if (storedMainTopics) {
        const parsedTopics = JSON.parse(storedMainTopics);
        if (Array.isArray(parsedTopics)) {
          setMainTopics(parsedTopics);
        }
      }

      const storedRoadmap = localStorage.getItem("roadmap");
      if (storedRoadmap) {
        const parsedRoadmap = JSON.parse(
          storedRoadmap
        ) as StoredLessonSummary[];
        if (Array.isArray(parsedRoadmap)) {
          setRoadmap(
            parsedRoadmap.map((lesson) => ({
              ...lesson,
              status: lesson.status as StageStatus,
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error loading persisted user data:", error);
    } finally {
      setIsHydrated(true);
    }
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
      setMainTopics(Array.isArray(data.topics) ? data.topics : []);
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
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          topics,
          profile: userProfile 
        }),
      });
      const data = await response.json();
      const lessons = Array.isArray(data.lessons) ? data.lessons : [];
      
      const newRoadmap: LessonSummary[] = lessons.map((lesson: any) => ({
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
          prerequisites: [] as string[],
          blocks: [],
          lessonType: lesson.plan?.lessonType,
          plan: lesson.plan,
        },
      }));
      
      setRoadmap(newRoadmap);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
    } finally {
      setLoadingRoadmap(false);
    }
  }, [userProfile]);

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
    setRoadmap((prevRoadmap) => 
      prevRoadmap.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, lesson: { ...lesson.lesson, blocks } }
          : lesson
      )
    );
  }, []);

  const handleResetRoadmap = useCallback(() => {
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

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("userIsLoggedIn");
      localStorage.removeItem("userEmail");
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

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : !surveyCompleted ? (
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
            onResetRoadmap={handleResetRoadmap}
            onLogout={handleLogout}
            mainTopics={mainTopics}
            onLessonHydrated={handleLessonHydrated}
          />
        )
      )}
    </div>
  );
};

export default App;
