"use client";

import { LessonSummary, StageStatus, UserProfile } from "../../lib/types";
import React, { useMemo } from "react";

interface ProfileProps {
  userProfile: UserProfile;
  xp: number;
  streak: number;
  lives: number;
  roadmap: LessonSummary[];
  mainTopics: string[];
  onResetRoadmap: () => void;
  onLogout: () => void;
}

interface StorageSnapshot {
  surveyCompleted: boolean;
  topicsCompleted: boolean;
  storedRoadmapCount: number;
  storedRoadmapCompleted: number;
  storedTopics: string[];
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

    const parseStringArray = (value: string | null) => {
      if (!value) return [] as string[];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
      } catch (error) {
        console.warn("Unable to parse stored array", error);
        return [] as string[];
      }
    };

    const parseRoadmapEntries = (value: string | null) => {
      if (!value) return [] as Array<{ status?: string }>;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn("Unable to parse stored roadmap entries", error);
        return [] as Array<{ status?: string }>;
      }
    };

    const storedRoadmapEntries = parseRoadmapEntries(
      window.localStorage.getItem("roadmap")
    );
    const storedRoadmapCompleted = storedRoadmapEntries.reduce(
      (count, entry) => {
        const status = entry?.status;
        if (status === StageStatus.Completed || status === "completed") {
          return count + 1;
        }
        return count;
      },
      0
    );

    return {
      surveyCompleted:
        window.localStorage.getItem("surveyCompleted") === "true",
      topicsCompleted:
        window.localStorage.getItem("topicsCompleted") === "true",
      storedRoadmapCount: storedRoadmapEntries.length,
      storedRoadmapCompleted,
      storedTopics: parseStringArray(window.localStorage.getItem("mainTopics")),
      lastProfileSync: window.localStorage.getItem("lastProfileSync"),
      roadmapUpdatedAt: window.localStorage.getItem("roadmapUpdatedAt"),
    };
  }, [safeRoadmap, safeMainTopics]);

  const progressStats = useMemo(() => {
    if (safeRoadmap.length > 0) {
      const completed = safeRoadmap.reduce((count, lesson) => {
        if (lesson.status === StageStatus.Completed) {
          return count + 1;
        }
        return count;
      }, 0);
      return {
        completedLessons: completed,
        totalLessons: safeRoadmap.length,
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
        "Resetting will clear your generated roadmap and let you choose topics again. Continue?"
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
        "This will clear your progress and profile data stored in this browser. Are you sure you want to log out?"
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
          },
          {
            label: "Streak",
            value: streak,
            accent: "text-orange-300",
            glow: "bg-orange-400/10",
          },
          {
            label: "Lives",
            value: lives,
            accent: "text-rose-300",
            glow: "bg-rose-400/10",
          },
        ].map(({ label, value, accent, glow }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-700/60 bg-gray-800/80 p-6 shadow-lg transition-transform duration-150 hover:-translate-y-1"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-4xl font-semibold ${accent}`}>
                {value}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${glow} text-gray-200`}
              >
                from local save
              </span>
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
            snapshotTopics.map((topic: string) => (
              <span
                key={topic}
                className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-100"
              >
                {topic}
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
          Log out & clear data
        </button>
      </section>
    </div>
  );
};

export default Profile;
