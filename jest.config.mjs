import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: "./apps/web" });
export default createJestConfig({ testEnvironment: "node", testMatch: ["<rootDir>/tests/unit/**/*.test.ts"], moduleNameMapper: { "^@/(.*)$": "<rootDir>/apps/web/src/$1" } });
