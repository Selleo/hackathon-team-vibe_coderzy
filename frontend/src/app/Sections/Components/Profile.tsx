"use client";

import { StageStatus, UserProfile, RoadmapTopic, TopicBlueprint } from "../../lib/types";
import React, { useMemo } from "react";

interface ProfileProps {
  userProfile: UserProfile;
  xp: number;
  streak: number;
  lives: number;
  roadmap: RoadmapTopic[];
  mainTopics: TopicBlueprint[];
  onResetRoadmap: () => void;
  onLogout: () => void;
}

interface StorageSnapshot {
  surveyCompleted: boolean;
  topicsCompleted: boolean;
  storedRoadmapCount: number;
  storedRoadmapCompleted: number;
  storedTopics: TopicBlueprint[];
  lastProfileSync: string | null;
  roadmapUpdatedAt: string | null;
}

const formatTimestamp = (value: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Profile: React.FC<ProfileProps> = ({
  userProfile,
  xp,
  streak,
  lives,
  roadmap,
  mainTopics,
  onResetRoadmap,
  onLogout,
}) => {
  const safeRoadmap = useMemo(
    () => (Array.isArray(roadmap) ? roadmap : []),
    [roadmap]
  );
  const safeMainTopics = useMemo(
    () => (Array.isArray(mainTopics) ? mainTopics : []),
    [mainTopics]
  );

  const storageSnapshot = useMemo<StorageSnapshot | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    void safeRoadmap;
    void safeMainTopics;

    const parseTopics = (value: string | null) => {
      if (!value) return [] as TopicBlueprint[];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn("Unable to parse stored topics", error);
        return [] as TopicBlueprint[];
      }
    };

    const parseRoadmapEntries = (value: string | null) => {
      if (!value) return [] as RoadmapTopic[];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn("Unable to parse stored roadmap entries", error);
        return [] as RoadmapTopic[];
      }
    };

    const storedRoadmapEntries = parseRoadmapEntries(
      window.localStorage.getItem("roadmap")
    );
    const storedRoadmapCompleted = storedRoadmapEntries.reduce(
      (count, topic) => {
        return count + topic.lessons.reduce((lessonCount, lesson) => {
          if (lesson.status === StageStatus.Completed) {
            return lessonCount + 1;
          }
          return lessonCount;
        }, 0);
      },
      0
    );
    const totalLessons = storedRoadmapEntries.reduce((count, topic) => count + topic.lessons.length, 0);

    return {
      surveyCompleted:
        window.localStorage.getItem("surveyCompleted") === "true",
      topicsCompleted:
        window.localStorage.getItem("topicsCompleted") === "true",
      storedRoadmapCount: totalLessons,
      storedRoadmapCompleted,
      storedTopics: parseTopics(window.localStorage.getItem("mainTopics")),
      lastProfileSync: window.localStorage.getItem("lastProfileSync"),
      roadmapUpdatedAt: window.localStorage.getItem("roadmapUpdatedAt"),
    };
  }, [safeRoadmap, safeMainTopics]);

  const progressStats = useMemo(() => {
    if (safeRoadmap.length > 0) {
      const completed = safeRoadmap.reduce((count, topic) => {
        return count + topic.lessons.reduce((lessonCount, lesson) => {
          if (lesson.status === StageStatus.Completed) {
            return lessonCount + 1;
          }
          return lessonCount;
        }, 0);
      }, 0);
      const total = safeRoadmap.reduce((count, topic) => count + topic.lessons.length, 0);
      return {
        completedLessons: completed,
        totalLessons: total,
      };
    }

    if (storageSnapshot) {
      return {
        completedLessons: storageSnapshot.storedRoadmapCompleted,
        totalLessons: storageSnapshot.storedRoadmapCount,
      };
    }

    return { completedLessons: 0, totalLessons: 0 };
  }, [safeRoadmap, storageSnapshot]);

  const { completedLessons, totalLessons } = progressStats;
  const completionRate =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleResetClick = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "This will clear ALL your data including progress, profile, and roadmap. You will start from the survey again. Continue?"
      );
      if (!confirmed) {
        return;
      }
    }
    if (typeof onResetRoadmap === "function") {
      onResetRoadmap();
    } else {
      console.warn("Reset roadmap handler is missing.");
    }
  };

  const handleLogoutClick = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        "Are you sure you want to log out? Your data will be saved and available when you log back in."
      );
      if (!confirmed) {
        return;
      }
    }
    if (typeof onLogout === "function") {
      onLogout();
    } else {
      console.warn("Logout handler is missing.");
    }
  };

  const snapshotTopics = storageSnapshot?.storedTopics ?? safeMainTopics;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 animate-fade-in">
      <section className="rounded-3xl border border-cyan-500/20 bg-linear-to-br from-gray-800/80 via-gray-900/80 to-gray-950/90 p-8 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-wide text-cyan-200/70">
              Learning journey
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Personal Profile
            </h1>
            <p className="max-w-2xl text-base text-gray-300">
              You decided to learn coding because of{" "}
              <span className="font-semibold text-cyan-200">
                {userProfile.reason}
              </span>
              . Currently you are {userProfile.jobStatus?.toLowerCase()} with
              experience level of
              <span className="font-semibold text-cyan-200">
                {" "}
                {userProfile.codingExperience}
              </span>{" "}
              and you are driven by
              <span className="font-semibold text-cyan-200">
                {" "}
                {userProfile.captivates}
              </span>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-gray-900/80 p-4 text-sm text-gray-200">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Last profile sync
            </p>
            <p className="text-base font-semibold text-white">
              {formatTimestamp(storageSnapshot?.lastProfileSync ?? null)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "XP",
            value: xp,
            accent: "text-yellow-300",
            glow: "bg-yellow-400/10",
            icon: (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ),
            description: "Total experience points earned"
          },
          {
            label: "Streak",
            value: streak,
            accent: "text-orange-300",
            glow: "bg-orange-400/10",
            icon: (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            ),
            description: "Days of consecutive learning"
          },
          {
            label: "Lives",
            value: lives,
            accent: "text-rose-300",
            glow: "bg-rose-400/10",
            icon: (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            ),
            description: "Remaining attempts for challenges"
          },
        ].map(({ label, value, accent, icon, description }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-700/60 bg-gray-800/80 p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {label}
              </span>
              <div className={`${accent} opacity-30`}>
                {icon}
              </div>
            </div>
            <div className="space-y-2">
              <span className={`text-4xl font-bold ${accent} block`}>
                {value}
              </span>
              <p className="text-xs text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-700/60 bg-gray-800/80 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white">Learning focus</h2>
          <dl className="mt-4 space-y-3 text-sm text-gray-300">
            <div>
              <dt className="uppercase text-xs tracking-wider text-gray-400">
                Goal
              </dt>
              <dd className="text-base text-white">
                {userProfile.learningGoal || "No goal provided yet"}
              </dd>
            </div>
            <div>
              <dt className="uppercase text-xs tracking-wider text-gray-400">
                What keeps you motivated
              </dt>
              <dd className="text-base text-white">{userProfile.captivates}</dd>
            </div>
            <div>
              <dt className="uppercase text-xs tracking-wider text-gray-400">
                Hobbies
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {userProfile.hobbies?.length ? (
                  userProfile.hobbies.map((hobby: string) => (
                    <span
                      key={hobby}
                      className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-100"
                    >
                      {hobby}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    No hobbies selected yet
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-700/60 bg-gray-800/80 p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white">Roadmap progress</h2>
          <p className="mt-4 text-sm text-gray-300">
            {completedLessons} of {totalLessons || "—"} lessons completed
          </p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-700/70">
            <div
              className="h-full rounded-full bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>Completion</span>
            <span className="font-semibold text-cyan-200">
              {completionRate}%
            </span>
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Status in storage</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  storageSnapshot?.topicsCompleted
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-200"
                }`}
              >
                {storageSnapshot?.topicsCompleted ? "Ready" : "Needs topics"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last updated</span>
              <span className="font-medium text-white">
                {formatTimestamp(storageSnapshot?.roadmapUpdatedAt ?? null)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-700/60 bg-gray-800/80 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white">Topics you track</h2>
        <p className="mt-2 text-sm text-gray-400">Synced with local storage</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {snapshotTopics.length ? (
            snapshotTopics.map((topic: TopicBlueprint) => (
              <span
                key={topic.id}
                className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-100"
              >
                {topic.title}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No topics saved yet</span>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={handleResetClick}
          className="inline-flex items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-6 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
        >
          Reset roadmap
        </button>
        <button
          onClick={handleLogoutClick}
          className="inline-flex items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 px-6 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
        >
          Log out
        </button>
      </section>
    </div>
  );
};

export default Profile;