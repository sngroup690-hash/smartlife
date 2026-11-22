import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explication?: string;
};

export type ModuleQuiz = {
  moduleId: string;
  questions: QuizQuestion[];
};

export type QuizAttempt = {
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
};

type QuizStore = {
  attempts: Record<string, Record<string, QuizAttempt>>;
  saveAttempt: (formationId: string, moduleId: string, score: number, total: number) => void;
  getAttempt: (formationId: string, moduleId: string) => QuizAttempt | undefined;
  hasPassed: (formationId: string, moduleId: string) => boolean;
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      attempts: {},

      saveAttempt: (formationId, moduleId, score, total) => {
        const passed = total > 0 && score / total >= 0.7;
        set((state) => ({
          attempts: {
            ...state.attempts,
            [formationId]: {
              ...(state.attempts[formationId] ?? {}),
              [moduleId]: { score, total, passed, completedAt: new Date().toISOString() },
            },
          },
        }));
      },

      getAttempt: (formationId, moduleId) => get().attempts[formationId]?.[moduleId],

      hasPassed: (formationId, moduleId) =>
        get().attempts[formationId]?.[moduleId]?.passed === true,
    }),
    { name: "sl-quiz-progress-v1" }
  )
);
