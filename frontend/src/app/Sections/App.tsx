"use client";

import { useState, useCallback, useEffect } from "react";
import Dashboard from "./Dashboard";
import Survey from "./Survey";
import MainTopics from "./MainTopics";
import Login from "./Login";
import { LessonBlock, LessonSummary, StageStatus, UserProfile, TopicBlueprint, RoadmapTopic } from "../lib/types";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [topicsCompleted, setTopicsCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mainTopics, setMainTopics] = useState<TopicBlueprint[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapTopic[]>([]);
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
        const parsedTopics = JSON.parse(storedMainTopics) as TopicBlueprint[];
        if (Array.isArray(parsedTopics)) {
          setMainTopics(parsedTopics);
        }
      }

      const storedRoadmap = localStorage.getItem("roadmap");
      if (storedRoadmap) {
        const parsedRoadmap = JSON.parse(storedRoadmap) as RoadmapTopic[];
        if (Array.isArray(parsedRoadmap)) {
          setRoadmap(parsedRoadmap);
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
    } finally {
      setLoadingTopics(false);
    }
  }, []);

  const handleTopicsComplete = useCallback(async (topics: TopicBlueprint[]) => {
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
      const roadmapTopics = Array.isArray(data.lessons) ? data.lessons : [];
      setRoadmap(roadmapTopics);
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
      let originalLesson: LessonSummary | undefined;
      for (const topic of prevRoadmap) {
        originalLesson = topic.lessons.find(l => l.id === lessonId);
        if (originalLesson) break;
      }

      if (originalLesson?.status !== StageStatus.Completed) {
        setXp((prev) => prev + xpReward);
        setStreak((prev) => (prev === 0 ? 1 : prev));
      }

      const newRoadmap = prevRoadmap.map(topic => {
        const newLessons = topic.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, status: StageStatus.Completed };
          }
          return lesson;
        });

        const lessonIndex = newLessons.findIndex(l => l.id === lessonId);
        if (lessonIndex !== -1 && lessonIndex + 1 < newLessons.length) {
          if (newLessons[lessonIndex + 1].status === StageStatus.Locked) {
            newLessons[lessonIndex + 1].status = StageStatus.Unlocked;
          }
        }
        return { ...topic, lessons: newLessons };
      });

      // Unlock first lesson of next topic
      const topicIndex = newRoadmap.findIndex(t => t.lessons.some(l => l.id === lessonId));
      if (topicIndex !== -1 && topicIndex + 1 < newRoadmap.length) {
        const currentTopic = newRoadmap[topicIndex];
        const allLessonsCompleted = currentTopic.lessons.every(l => l.status === StageStatus.Completed);
        if (allLessonsCompleted) {
          newRoadmap[topicIndex + 1].lessons[0].status = StageStatus.Unlocked;
        }
      }

      return newRoadmap;
    });
  };

  const handleLessonHydrated = useCallback((lessonId: string, blocks: LessonBlock[]) => {
    setRoadmap((prevRoadmap) => 
      prevRoadmap.map(topic => ({
        ...topic,
        lessons: topic.lessons.map(lesson =>
          lesson.id === lessonId
            ? { ...lesson, lesson: { ...lesson.lesson, blocks } }
            : lesson
        )
      }))
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