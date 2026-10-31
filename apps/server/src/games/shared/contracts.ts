export const CATEGORIES = ["mixed", "science", "world", "history"] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Category = typeof CATEGORIES[number];
export type Difficulty = typeof DIFFICULTIES[number];
export type ArenaConfig = { category: Category; difficulty: Difficulty; timed: boolean; daily: boolean };
export type PublicQuestion = { id: string; category: Exclude<Category, "mixed">; prompt: string; options: { id: string; text: string }[] };
export type AnswerReview = { questionId: string; prompt: string; selected: string | null; answer: string; explanation: string; correct: boolean; points: number; timedOut: boolean };
export type ArenaView = {
  playerReward?: import("../../quizzes/contracts").PlayerRewardSummary;
  quiz?: { library?: boolean; id: string; title: string; code: string; participantName: string; avatar: string };
  id: string; config: ArenaConfig; phase: "question" | "feedback" | "results";
  index: number; total: number; score: number; correctCount: number; streak: number;
  bestStreak: number; xpAwarded: number; authenticated: boolean;
  question: PublicQuestion | null; deadline: string | null; serverTime: string;
  feedback: AnswerReview | null; reviews: AnswerReview[]; rank: string;
};
export type HistoryEntry = { id: string; score: number; correctCount: number; config: ArenaConfig; completedAt: string; xpAwarded: number };
export type ArenaOverview = { history: HistoryEntry[]; activeId: string | null; totalXp: number; authenticated: boolean; name: string; dailyCompleted: boolean };
