<p align="center">
  <img src="apps/web/src/app/icon.svg" alt="MindQuest logo" width="80" />
</p>

<h1 align="center">MindQuest</h1>
<p align="center">Learn. Play. Level up. A little adventure for curious minds.</p>
<p align="center"><a href="https://mind-quest-henna.vercel.app/"><strong>Play MindQuest →</strong></a></p>

## Features

- **50 free quizzes · 750 questions · 10 topics** on the homepage and a dedicated quiz library.
- Pick a quiz, enter a nickname, choose an avatar, and play—no player signup needed.
- Timed questions, friendly animations, sound effects, and clear answer explanations.
- Automatic final-result popup, a per-quiz scoreboard, and saved result pages.
- XP, virtual coins, levels, collectible avatars, and above-90% mastery trophies.
- Creator accounts to publish quizzes, share codes, and see detailed participant results.

Guest progress stays in the same browser. Nicknames, best scores and levels appear
on quiz scoreboards. Rewards are virtual.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Prisma 7 · Neon PostgreSQL · Better Auth

Vercel runs the frontend **and** API. `apps/server` contains shared backend logic.

## Quick start

Use **Node 24**, **pnpm 10.30.1** and a development PostgreSQL database.
[Environment setup & Vercel deployment →](docs/deployment.md)

```bash
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env
# Fill in the four environment variables using the setup guide.
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

[Architecture](ARCHITECTURE.md) · [Project plan](PROJECT_PLAN.md) · [Feature checklist](FEATURE_CHECKLIST.md)
