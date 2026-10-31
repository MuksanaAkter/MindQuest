import nextJest from "next/jest.js";
const createJestConfig = nextJest({ dir: new URL("./apps/web", import.meta.url).pathname });
export default createJestConfig({ testEnvironment: "node", testMatch: ["<rootDir>/tests/unit/**/*.test.ts"], moduleNameMapper: { "^@/(.*)$": "<rootDir>/apps/web/src/$1" } });
