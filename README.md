# MindQuest

A TypeScript monorepo with separate `apps/web` and `apps/server` workspaces.
Next.js runs the UI, API entrypoints, and backend logic in one application.
`apps/server` is a server package, not a separately running Express/NestJS service.

## Knowledge Arena

`/` is the public MindQuest landing page; `/login` and `/signup` share its fantasy theme.
Successful login/signup opens `/arena`. Guest play is explicitly available from
the landing and auth pages. Open `/arena` for the playable fantasy learning game. Knowledge Arena has
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
are in ignored local files; `apps/web/.env` already points to it. Both migrations
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
