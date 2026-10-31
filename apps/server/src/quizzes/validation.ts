import { z } from "zod";
import { AVATARS } from "./contracts";
export const quizSchema = z.object({
  title: z.string().trim().min(3).max(100), timed: z.boolean(),
  questions: z.array(z.object({ prompt: z.string().trim().min(5).max(500), options: z.array(z.string().trim().min(1).max(200)).length(4).refine((values) => new Set(values.map((s) => s.toLowerCase())).size === 4, "Every answer option must be different."), correctIndex: z.number().int().min(0).max(3), explanation: z.string().trim().max(1000).default("") }).strict()).min(1).max(20),
}).strict();
export const joinSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z2-9]{8}$/), name: z.string().trim().min(2).max(40), avatar: z.enum(AVATARS) }).strict();
