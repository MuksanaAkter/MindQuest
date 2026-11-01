# MindQuest 🦉

A playful quiz adventure for curious kids. Pick a quest, choose a name and avatar,
and learn through colourful questions, friendly feedback, and little rewards.

**[Play MindQuest →](https://mind-quest-henna.vercel.app/)**

## What’s inside

- 50 free quizzes and 750 questions across 10 topics.
- Click any quiz card to enter your name, pick a buddy, and start playing.
- 15-second questions, cheerful sound effects, and green/red answer animations.
- Saved attempts, XP, virtual coins, level rewards, avatars, and mastery trophies.
- Creator accounts to publish quizzes, share join codes, and view private results.

Players can join without an account. Guest progress belongs to the current browser;
clearing its cookies starts a new identity. Rewards are virtual.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Framer Motion ·
Prisma 7 · PostgreSQL (Neon) · Better Auth · Zustand

`apps/web` serves both the UI and API routes on Vercel. `apps/server` contains the
shared backend logic; it does **not** need a separate Render server.

## Run locally

Use **Node 24** and **pnpm 10.30.1**. Run commands from the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env
openssl rand -base64 32
```

Set these values in `apps/web/.env`:

```dotenv
DATABASE_URL="your-pooled-postgres-url"
DATABASE_URL_UNPOOLED="your-direct-postgres-url"
BETTER_AUTH_SECRET="your-generated-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

Then prepare your database and start the app:

```bash
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Use a development database locally.
`db:seed` safely inserts missing library quizzes; it preserves existing player data.

## Deploy to Vercel

1. Import the repository as **Next.js** with Root Directory **`apps/web`** and Node **24.x**.
2. Enable access to files outside the Root Directory.
3. Install command: `cd ../.. && pnpm install --frozen-lockfile`.
4. Build command: `cd ../.. && pnpm build`. Leave Output Directory at its default.
5. Set the four environment variables above in Vercel. Use your live HTTPS origin
   for `BETTER_AUTH_URL` and a private random secret of at least 32 characters.
6. From a terminal configured with the target database URLs, run `pnpm db:deploy`
   and, for a new database, `pnpm db:seed`. Deploy or redeploy the app.

Neon’s pooled URL is for app requests; its direct URL is for migrations. Never put
secrets in `NEXT_PUBLIC_*` variables or commit `.env` files. Run production migrations
as a release step, outside the build. `/api/health` checks app liveness only.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test --runInBand
pnpm build
```

Browser tests: `pnpm exec playwright install chromium`, then `pnpm test:e2e`.
Use `RUN_DB_E2E=1 pnpm test:e2e` only with a disposable migrated and seeded database.

More details: [Architecture](ARCHITECTURE.md) · [Project plan](PROJECT_PLAN.md) ·
[Feature checklist](FEATURE_CHECKLIST.md)
