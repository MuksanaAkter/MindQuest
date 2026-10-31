import { quizSchema, joinSchema } from "@mindquest/server/quizzes/validation";
const question = { prompt: "Which planet is red?", options: ["Mars", "Venus", "Earth", "Jupiter"], correctIndex: 0, explanation: "Iron-rich minerals give Mars a reddish appearance." };
test("quiz requires at least one valid question and four distinct choices", () => {
  expect(quizSchema.safeParse({ title: "Space quiz", timed: false, questions: [] }).success).toBe(false);
  expect(quizSchema.safeParse({ title: "Space quiz", timed: false, questions: [{ ...question, options: ["Mars", "mars", "Earth", "Jupiter"] }] }).success).toBe(false);
  expect(quizSchema.safeParse({ title: "Space quiz", timed: false, questions: [{ ...question, correctIndex: 4 }] }).success).toBe(false);
  expect(quizSchema.parse({ title: " Space quiz ", timed: false, questions: [question] }).title).toBe("Space quiz");
});
test("participant identity validates code, nickname and an approved avatar", () => {
  expect(joinSchema.parse({ code: "abcdefgh", name: " Ada ", avatar: "fox" })).toEqual({ code: "ABCDEFGH", name: "Ada", avatar: "fox" });
  expect(joinSchema.safeParse({ code: "ABCDEFGH", name: "A", avatar: "fox" }).success).toBe(false);
  expect(joinSchema.safeParse({ code: "ABCDEFGH", name: "Ada", avatar: "<script>" }).success).toBe(false);
  expect(joinSchema.safeParse({ code: "ABCDEFGH", name: "Ada", avatar: "fox", score: 9999 }).success).toBe(false);
});
