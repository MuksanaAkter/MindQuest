# MindQuest

A TypeScript monorepo with separate `apps/web` and `apps/server` workspaces.
Next.js runs the UI, API entrypoints, and backend logic in one application.
`apps/server` is a server package, not a separately running Express/NestJS service.

## Free library and player rewards

Run `npm run db:deploy`, then `npm run db:seed`. This seeds 50 ready-to-play quizzes,
15 questions each (750 unique prompts), across English, Math, Coding, GK, History,
Science, Nature, Geography, Riddles, and Space. The seed is repeatable and preserves
existing creator quizzes. Catalogue content and reference notes live under
`apps/server/prisma/seeds/`.

The homepage now has a colourful original owl/fox world, searchable topic catalogue,
player passport, quiz joining, a how-to-play section, virtual treasure, collectible
avatars, milestone missions, and a creator invitation. Motion respects reduced-motion
preferences. All library quizzes are free and require no participant account.

Library rewards are server-authoritative and saved against the browser's HttpOnly
guest identity in PostgreSQL:

- 10 XP and 2 virtual coins per correct answer in a quiz's personal best.
- Strictly **above 90%** earns a mastery badge, 100 bonus XP, and 50 bonus coins.
  With 15 questions, 14 correct (93%) qualifies and 13 correct does not.
- First mastery of a distinct quiz unlocks the next of eight rare avatars. Six base
  avatars are available immediately; locked avatars cannot be equipped through API tampering.
- Replays award only the improvement over the previous best, preventing duplicate
  treasure. Completion, best-score updates, coins, and unlocks share one transaction.
- Each 300 XP adds an explorer level. Missions reflect actual completion, mastery,
  and level state. Results show earned treasure and level/unlock celebrations.

These are virtual game rewards. Guest progression belongs to this browser, is shared
by names used in that browser, and is lost to the player if its guest cookie is cleared.
It is not automatically an authenticated account or cross-device profile. Creator-made
quizzes retain scores and private results; library rewards apply only to trusted seeded
quizzes. Built-in five-question Arena practice retains its separate account-XP rules.

## Creator and participant flows

- Creators sign in at `/login` or register at `/signup`, then use `/create`.
- Publish a quiz with 1–20 questions, four distinct choices per question, correct
  answers, optional explanations, and an optional 25-second timer per question.
- Each quiz gets an 8-character join code and a copyable homepage join link.
- Participants select a published quiz or enter its code, then choose a name and
  one of six avatars. No registration or login is required.
- Participant attempts and name/avatar snapshots persist in PostgreSQL. Reloading
  an owned `/play/:id` resumes the quiz or displays its saved result.
- Only the quiz creator can see their quiz's participant results and close/reopen
  it. Closing blocks new joins; participants already playing may finish.
- Published quizzes appear in the public selector (up to 150, prioritising the library). Answer keys are
  never included in public listings or unanswered question payloads.
- Custom quizzes use the existing authoritative Arena lifecycle and scoring.
  Creator-authored quizzes do not award library rewards or account XP. Trusted seeded
  library quizzes award the browser player rewards described above.
- Question content is immutable after publishing so existing attempts stay stable.
  Editing, deleting, live synchronized rooms, and public leaderboards are not
  included. The studio shows up to 100 owned quizzes and the latest 200 attempts
  per quiz; the server limits a browser to 20 attempts per custom quiz.

## Knowledge Arena

`/` is the public MindQuest landing page; `/login` and `/signup` share its fantasy theme.
Successful creator login/signup opens `/create`. Participants choose a published quiz
or use its shared code on the homepage, enter a nickname and avatar, and play at
`/play/:attemptId` without an account. `/arena` remains the built-in practice game. Open `/arena` for the playable fantasy learning game. Knowledge Arena has
72 authored questions across science, world geography, and history/culture, three
difficulties, five-question shuffled rounds, timed/relaxed play, streak bonuses,
explanations, results review, recent personal bests, resume, and replay. A daily
expedition uses a shared UTC date seed. Original artwork is stored locally in
`apps/web/public/images/knowledge-kingdom.png` and displayed with Next.js Image.

The answer bank stays on the server. PostgreSQL stores attempts and answer history.
Server timestamps enforce question deadlines. Row locks serialize submissions;
a unique reward ledger and progress update commit together. Guests can play with
browser-cookie-linked practice history; authenticated players earn account XP.
Daily XP is awarded only for the first completed daily round per account and UTC day.
History displays the latest 30 completed rounds. Guest history is not transferred on signup.

See [PROJECT_PLAN.md](PROJECT_PLAN.md), [ARCHITECTURE.md](ARCHITECTURE.md), and
[FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) for scope, decisions, and later modes.
Other modes are visibly marked as future content.

### This checkout's local database

This development environment has a native PostgreSQL cluster under ignored
`.local/postgres`, listening only on `127.0.0.1:55432`. Its generated credentials
are in ignored local files; `apps/web/.env` already points to it. All migrations
have been applied. After restarting this environment, start it from the repo root:

```bash
pg_ctl -D .local/postgres -l .local/postgres.log -o "-h 127.0.0.1 -p 55432 -k /tmp" start
npm run dev
```

To stop that local database: `pg_ctl -D .local/postgres stop`. Keep `.local` if you
want to preserve local data. The Docker setup below remains an alternative: use
the URL in `.env.example` when switching to Docker. Never share local secret files.

## Stack

Next.js App Router, Tailwind CSS v4, Framer Motion, Lucide React, PostgreSQL,
Prisma 7, Better Auth, Zustand, Zod, Jest, and Playwright. Use Node 24 LTS and npm.

## Folder structure

```text
MindQuest/
├── apps/
│   ├── web/                     # Next.js application
│   │   ├── src/
│   │   │   ├── app/             # Pages, layouts, API entrypoints
│   │   │   ├── components/      # UI and starter feature components
│   │   │   ├── lib/             # Browser auth client
│   │   │   └── stores/          # Zustand UI state
│   │   ├── .env.example
│   │   └── next.config.ts
│   └── server/                  # @mindquest/server workspace package
│       ├── src/
│       │   ├── auth.ts          # Better Auth configuration
│       │   ├── db.ts            # Prisma client singleton
│       │   ├── session.ts       # Server-side session access
│       │   ├── game.ts          # Shared pure XP/level rules
│       │   ├── routes/          # Backend quest handlers
│       │   ├── validations/     # Zod schemas
│       │   └── generated/       # Generated Prisma Client (ignored)
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
├── tests/
│   ├── unit/
│   └── e2e/
├── .github/workflows/ci.yml
├── compose.yaml                 # Optional local PostgreSQL
├── prisma.config.ts
└── package.json                 # Workspace commands
```

Development and production builds use Next.js Webpack mode for local environment compatibility.

Run all commands from the repository root. Install once at the root; do not
create separate lockfiles inside the apps. Server-only entrypoints use
`server-only`; browser-safe rules and validation have separate package exports.

## Local setup

```bash
npm install
cp apps/web/.env.example apps/web/.env
openssl rand -base64 32
```

Paste the generated secret into `BETTER_AUTH_SECRET` in `apps/web/.env`.
The public Arena lobby renders without PostgreSQL; actual gameplay requires it:

```bash
npm run dev
```

Open http://localhost:3000. For gameplay, signup, login, and saved quests, set `DATABASE_URL`
in `apps/web/.env` to your PostgreSQL URL, or start the included local database:

```bash
docker compose up -d db
npm run db:deploy
npm run db:seed
npm run db:generate
```

The example connection matches Docker's local credentials. Use those credentials
only in development. The root Prisma CLI and Next.js read the same environment file.
Restart the dev server after updating it.

For future schema changes:

```bash
npm run db:migrate -- --name describe_change
npm run db:generate
```

Commit the new migration directory. `npm run db:studio` opens Prisma Studio.

## Starter behavior

- Fantasy Knowledge Arena with saved gameplay, results, daily expeditions, and replay.
- Email/password signup, login, logout, and server-protected dashboard.
- Create personal quests with server-validated difficulty.
- Complete owned quests and award XP atomically, once per quest.
- Easy/medium/hard quests award 20/40/60 XP; every 100 XP adds a level.
- Zustand stores temporary UI state; PostgreSQL owns saved progress.

These are starter features for the project foundation. Email verification,
password recovery, recurring quests, avatars, and leaderboards are not configured.
The score represents personal goals; competitive rewards would require server-defined
quests and completion verification.

## API

- `GET /api/arena`: guest/account overview and history.
- `POST /api/arena`: start a validated round configuration.
- `GET /api/arena/:id`: resume an owned attempt.
- `POST /api/arena/:id`: validated `answer` or `next` action.
- `GET /api/health`: application liveness, not database readiness.
- `/api/auth/*`: Better Auth endpoints.
- `GET /api/quests`: current user's quests.
- `POST /api/quests`: `{ "title": "Read 10 pages", "difficulty": "EASY" }`.
- `POST /api/quests/:id/complete`: complete an owned quest and award XP once.

All quest endpoints require a session. Client-supplied owner IDs and XP are ignored.
Next.js route files in `apps/web` delegate backend work to `apps/server`.

## Verification

```bash
npm run typecheck
npm test -- --runInBand
npm run build
npx playwright install chromium
npm run test:e2e
```

Jest tests cover level boundaries, validation, API ownership checks, and repeat completion.
Public lobby Playwright tests run without a database. To test gameplay, timers,
authenticated/daily rewards, signup, ownership, and concurrent completion, configure a **disposable migrated database**
in `apps/web/.env`, then run:

```bash
RUN_DB_E2E=1 npm run test:e2e
```

This creates test attempts and temporary accounts in that database. CI runs lint,
typecheck, schema validation, Jest, and the production build. PostgreSQL E2E tests are opt-in.

## Vercel later

Import as Next.js, set Root Directory to `apps/web`, enable access to files outside
the root directory, and use `cd ../.. && npm ci` as the install command. The default
Next.js build command runs from `apps/web`; the root install generates Prisma Client.
Set `DATABASE_URL` (a provider-appropriate pooled URL), `BETTER_AUTH_SECRET`, and
`BETTER_AUTH_URL` (the actual HTTPS app URL) in Vercel.

Run `npm run db:deploy` against the target database as a controlled release step
before deploying. Do not run development migrations during a build. Use separate
databases and auth URLs for previews. Deployment is not part of this initial setup.

## References

- [Better Auth installation](https://better-auth.com/docs/installation)
- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- [Prisma 7 + Next.js](https://www.prisma.io/docs/guides/v7/frameworks/nextjs)
