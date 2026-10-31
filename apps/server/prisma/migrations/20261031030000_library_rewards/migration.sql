-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "builtIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "difficultyLabel" TEXT NOT NULL DEFAULT 'Explorer',
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '✨',
ADD COLUMN     "seedKey" TEXT,
ADD COLUMN     "topic" TEXT NOT NULL DEFAULT 'Community';

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Explorer',
    "avatar" TEXT NOT NULL DEFAULT 'owl',
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "unlockedAvatars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerQuizProgress" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "bestCorrect" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerQuizProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_ownerKey_key" ON "PlayerProfile"("ownerKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerQuizProgress_ownerKey_quizId_key" ON "PlayerQuizProgress"("ownerKey", "quizId");

-- CreateIndex
CREATE INDEX "GameAttempt_quizId_startedAt_idx" ON "GameAttempt"("quizId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_seedKey_key" ON "Quiz"("seedKey");

-- AddForeignKey
ALTER TABLE "PlayerQuizProgress" ADD CONSTRAINT "PlayerQuizProgress_ownerKey_fkey" FOREIGN KEY ("ownerKey") REFERENCES "PlayerProfile"("ownerKey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerQuizProgress" ADD CONSTRAINT "PlayerQuizProgress_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

