import type { ArenaConfig } from "../shared/contracts";
import { ROUND_LENGTH } from "../shared/scoring";
import { QUESTIONS } from "./questions";
export function seededRandom(seed: string) {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => { value += 0x6d2b79f5; let t = Math.imul(value ^ value >>> 15, 1 | value); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function selectQuestions(config: ArenaConfig, seed: string) {
  const pool = QUESTIONS.filter((q) => q.difficulty === config.difficulty && (config.category === "mixed" || q.category === config.category));
  if (pool.length < ROUND_LENGTH) throw new Error("Insufficient question content for this configuration.");
  return shuffled(pool, seededRandom(seed)).slice(0, ROUND_LENGTH);
}
