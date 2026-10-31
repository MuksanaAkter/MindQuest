# Game architecture

## Boundaries

- `apps/web/src/features/arena`: lobby, playable round, results, accessible controls,
  localized copy, UI-only Zustand state. No answer keys or reward mutation.
- `apps/web/src/app/api/arena`: thin Next.js HTTP entrypoints.
- `apps/server/src/games/shared`: browser-safe contracts and pure scoring rules.
- `apps/server/src/games/knowledge`: private authored question bank, deterministic
  daily/random selection, server lifecycle and public projections.
- `apps/server/src/routes/arena.ts`: input validation, cookie/session ownership,
  error responses, and calls to the service.
- `apps/server/prisma`: attempts and unique reward ledger alongside existing auth,
  personal quests, and progress.

## Trust and concurrency

A random HttpOnly SameSite cookie identifies guest attempts. Signed-in attempts are
scoped to the authenticated user ID. Owners cannot read or answer each other's
attempts. The client receives one unanswered question and randomized option IDs;
answer keys and explanations are returned only after submission. Server timestamps
control deadlines; the client clock is display-only. A PostgreSQL row lock serializes
answer/advance operations. A repeated submission returns the existing feedback and
cannot award points twice. Authenticated XP and a unique attempt reward ledger entry
are committed in the same transaction as completion. Guests earn a saved practice
score, not account XP. Daily repeat attempts remain playable but only the first
completed daily run per account and UTC day earns XP.

## Folder structure

```text
apps/web/src/features/arena/{components,copy.ts,store.ts,arena.css}
apps/web/src/app/api/arena/{route.ts,[id]/route.ts}
apps/server/src/games/shared/{contracts.ts,scoring.ts}
apps/server/src/games/knowledge/{questions.ts,selection.ts,service.ts}
apps/server/src/routes/arena.ts
apps/server/prisma/{schema.prisma,migrations/}
tests/{unit,e2e}/
```

## Operational choices

Questions are versioned, reviewed source content rather than an unimplemented admin
CMS. Attempt JSON stores the chosen question/option order and answer snapshots;
changing a question ID's meaning is prohibited. A future admin bank should introduce
immutable question revisions. PostgreSQL is required for gameplay; outages produce
an honest retry state, never local fabricated rewards. The local development DB is
ignored under `.local/`; production uses the configured PostgreSQL URL. Guest
history is tied to this browser cookie and is not transferred on signup. Account XP
is for learning engagement, not a tamper-proof examination or competitive economy.
