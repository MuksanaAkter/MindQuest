export const BASE_AVATARS = ["owl", "fox", "dragon", "cat", "unicorn", "astronaut"] as const;
export const UNLOCKABLE_AVATARS = ["phoenix", "robot", "wizard", "lion", "ninja", "alien", "tiger", "rocket"] as const;
export const AVATARS = [...BASE_AVATARS, ...UNLOCKABLE_AVATARS] as const;
export type Avatar = typeof AVATARS[number];
export const AVATAR_EMOJI: Record<Avatar, string> = { owl: "🦉", fox: "🦊", dragon: "🐉", cat: "🐱", unicorn: "🦄", astronaut: "🧑‍🚀", phoenix: "🐦‍🔥", robot: "🤖", wizard: "🧙", lion: "🦁", ninja: "🥷", alien: "👽", tiger: "🐯", rocket: "🚀" };
export type QuizQuestionInput = { prompt: string; options: string[]; correctIndex: number; explanation: string };
export type QuizInput = { title: string; timed: boolean; questions: QuizQuestionInput[] };
export type PublicQuiz = { builtIn?: boolean; topic?: string; icon?: string; description?: string; difficultyLabel?: string; id: string; title: string; code: string; questionCount: number; timed: boolean };
export type CreatorQuiz = PublicQuiz & { published: boolean; participants: { id: string; name: string; avatar: Avatar; score: number; correctCount: number; completedAt: string | null }[] };

export type PlayerState = { name: string; avatar: Avatar; totalXp: number; coins: number; level: number; xpInLevel: number; unlockedAvatars: Avatar[]; completedQuizzes: number; masteredQuizzes: number; bestByQuiz: Record<string, number> };
export type PlayerRewardSummary = { xp: number; coins: number; accuracy: number; badge: string; unlockedAvatar: Avatar | null; level: number; previousLevel: number; totalXp: number; totalCoins: number; newBest: boolean };
export type PlayerHistoryItem = { id: string; quizId: string; title: string; code: string; icon: string; name: string; avatar: Avatar; total: number; correct: number; answered: number; score: number; accuracy: number | null; startedAt: string; completedAt: string | null; abandoned: boolean; reward: PlayerRewardSummary | null };
export type PlayerHistory = { player: PlayerState; attempts: PlayerHistoryItem[]; nextCursor: string | null; totalAttempts: number; finishedAttempts: number };
export type CreatorOverview = { quizzes: (PublicQuiz & { published: boolean; attempts: number; finished: number; averageAccuracy: number | null })[]; totals: { quizzes: number; published: number; attempts: number; finished: number } };
export type CreatorResults = { participants: { id: string; name: string; avatar: Avatar; score: number; correct: number; total: number; startedAt: string; completedAt: string | null }[]; nextCursor: string | null; total: number };
