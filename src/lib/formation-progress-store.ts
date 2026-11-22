import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VideoProgress = {
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatched: string;
};

export type FormationProgress = {
  formationId: string;
  videosProgress: Record<string, VideoProgress>;
  lastVideoKey?: string;
  startedAt: string;
};

type ProgressStore = {
  progress: Record<string, FormationProgress>;
  saveVideoProgress: (
    formationId: string,
    videoKey: string,
    currentTime: number,
    duration: number,
    completed?: boolean
  ) => void;
  markVideoCompleted: (formationId: string, videoKey: string, duration?: number) => void;
  getVideoProgress: (formationId: string, videoKey: string) => VideoProgress | undefined;
  getFormationProgress: (formationId: string) => FormationProgress | undefined;
  getTotalProgress: (formationId: string, totalVideos: number) => number;
  getCompletedCount: (formationId: string) => number;
};

export const useFormationProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progress: {},

      saveVideoProgress: (formationId, videoKey, currentTime, duration, completed = false) => {
        set((state) => {
          const fp = state.progress[formationId] ?? {
            formationId,
            videosProgress: {},
            startedAt: new Date().toISOString(),
          };
          const isCompleted = completed || (duration > 0 && currentTime / duration >= 0.9);
          return {
            progress: {
              ...state.progress,
              [formationId]: {
                ...fp,
                lastVideoKey: videoKey,
                videosProgress: {
                  ...fp.videosProgress,
                  [videoKey]: {
                    currentTime,
                    duration,
                    completed: fp.videosProgress[videoKey]?.completed || isCompleted,
                    lastWatched: new Date().toISOString(),
                  },
                },
              },
            },
          };
        });
      },

      markVideoCompleted: (formationId, videoKey, duration = 0) => {
        set((state) => {
          const fp = state.progress[formationId] ?? {
            formationId,
            videosProgress: {},
            startedAt: new Date().toISOString(),
          };
          return {
            progress: {
              ...state.progress,
              [formationId]: {
                ...fp,
                lastVideoKey: videoKey,
                videosProgress: {
                  ...fp.videosProgress,
                  [videoKey]: {
                    currentTime: duration,
                    duration,
                    completed: true,
                    lastWatched: new Date().toISOString(),
                  },
                },
              },
            },
          };
        });
      },

      getVideoProgress: (formationId, videoKey) =>
        get().progress[formationId]?.videosProgress[videoKey],

      getFormationProgress: (formationId) => get().progress[formationId],

      getTotalProgress: (formationId, totalVideos) => {
        if (totalVideos === 0) return 0;
        const fp = get().progress[formationId];
        if (!fp) return 0;
        const completed = Object.values(fp.videosProgress).filter((v) => v.completed).length;
        return Math.round((completed / totalVideos) * 100);
      },

      getCompletedCount: (formationId) => {
        const fp = get().progress[formationId];
        if (!fp) return 0;
        return Object.values(fp.videosProgress).filter((v) => v.completed).length;
      },
    }),
    { name: "mediastore-formation-progress-v1" }
  )
);
