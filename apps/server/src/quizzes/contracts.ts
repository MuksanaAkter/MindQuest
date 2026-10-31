export const AVATARS = ["owl", "fox", "dragon", "cat", "unicorn", "astronaut"] as const;
export type Avatar = typeof AVATARS[number];
export const AVATAR_EMOJI: Record<Avatar, string> = { owl: "🦉", fox: "🦊", dragon: "🐉", cat: "🐱", unicorn: "🦄", astronaut: "🧑‍🚀" };
export type QuizQuestionInput = { prompt: string; options: string[]; correctIndex: number; explanation: string };
export type QuizInput = { title: string; timed: boolean; questions: QuizQuestionInput[] };
export type PublicQuiz = { id: string; title: string; code: string; questionCount: number; timed: boolean };
export type CreatorQuiz = PublicQuiz & { published: boolean; participants: { id: string; name: string; avatar: Avatar; score: number; correctCount: number; completedAt: string | null }[] };
