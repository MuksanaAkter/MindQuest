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

## Public and player routes

`/` introduces MindQuest to visitors. `/login` and `/signup` use the shared public
fantasy shell. Successful authentication opens the protected `/create` studio. Participants join
from `/` using a quiz code, nickname, and avatar, then play at `/play/:id` without
authentication. `/arena` remains optional built-in practice. `/dashboard` remains the protected personal quest area.

## Creator-authored quizzes

`Quiz` stores an authenticated creator, immutable authored question JSON, a unique
join code, and its open/closed state. Public listing projections include only
metadata. Creator APIs always scope reads and mutations to the session user.

Joining uses only an HttpOnly browser identity and validated name/avatar. Questions
are snapshotted privately into `GameAttempt.state`; its nullable Quiz relation and
participant identity distinguish custom quizzes from the built-in bank. The same
question projection, row locking, deadlines, feedback, and saved result lifecycle
are reused. Custom attempts never issue account XP or reward ledger entries.
Authenticated creators can also participate using the independent guest cookie.
Participant ownership is checked against the session key or current guest cookie;
knowing a result URL alone grants no access. Guest names are shown only to their
quiz creator and within the participant's own attempt.

## Seeded learning library and browser player progression

A trusted local seed installs 50 `Quiz` rows marked `builtIn`, with 15 immutable
question snapshots each. Public projections contain topic/icon/difficulty metadata,
never answers. Creators cannot mark their own quizzes as built-in through APIs.
The seed is transactional and idempotent by unique `seedKey`; a second run inserts zero.

`PlayerProfile` is keyed by the HttpOnly guest cookie, independent of creator login.
`PlayerQuizProgress` has a unique owner/quiz key and records best answers and total
rewards earned. At completion, the existing attempt row lock and an advisory player
lock serialise attempts, including different quizzes. Only increases to a personal
best add XP/coins. A first score strictly above 90% grants mastery and one previously
locked avatar. The result stores a reward snapshot; rereading it grants nothing.
Avatar equipment is checked server-side against base and persisted unlocked avatars.
Levels derive from XP at 300 XP per level. Guest progress is browser-scoped rather
than nickname-authenticated, and has no cash, purchase, or competitive value.
