import { z } from "zod";
export const questSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(100),
  description: z.string().trim().max(500).default(""),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
});
export type QuestInput = z.infer<typeof questSchema>;
