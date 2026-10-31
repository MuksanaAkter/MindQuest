-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "userId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'knowledge',
    "config" JSONB NOT NULL,
    "state" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameReward" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimKey" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameAttempt_ownerKey_startedAt_idx" ON "GameAttempt"("ownerKey", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameReward_attemptId_key" ON "GameReward"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "GameReward_claimKey_key" ON "GameReward"("claimKey");

-- CreateIndex
CREATE INDEX "GameReward_userId_createdAt_idx" ON "GameReward"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameReward" ADD CONSTRAINT "GameReward_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "GameAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameReward" ADD CONSTRAINT "GameReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

