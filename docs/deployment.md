# Deploy MindQuest on Vercel

Vercel runs the Next.js app and API routes. `apps/server` is shared backend code,
so a separate Render service is unnecessary.

1. Import the repository and select **Next.js**, **Node 24**, root **apps/web**.
2. Enable files outside the root directory.
3. Install command: `cd ../.. && pnpm install --frozen-lockfile`.
4. Build command: `cd ../.. && pnpm build`.
5. Set the following variables for the intended deployment environment:
   - `DATABASE_URL`: pooled Neon PostgreSQL connection URL with required SSL.
   - `DATABASE_URL_UNPOOLED`: direct Neon PostgreSQL connection URL for migrations.
   - `BETTER_AUTH_SECRET`: generate with `openssl rand -base64 32`.
   - `BETTER_AUTH_URL`: exact HTTPS deployment origin, without a trailing slash.
6. From the project root, with those database variables available, run
   `pnpm db:deploy`. Run `pnpm db:seed` once for a new database.
7. Deploy or redeploy after changing environment variables.

Keep credentials out of Git. Use a separate development database for local work
and a disposable seeded database for database-backed end-to-end tests.

## Local setup & checks

Use Node 24 and pnpm 10.30.1 (`corepack enable`). Copy
`apps/web/.env.example` to `apps/web/.env` and set the four variables above.
Use a development database and `BETTER_AUTH_URL=http://localhost:3000` locally.
Never commit `apps/web/.env`. Run these commands from the project root after
configuring the environment:

```bash
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Run the checks before deploying:

```bash
pnpm lint
pnpm typecheck
pnpm test --runInBand
pnpm build
```
