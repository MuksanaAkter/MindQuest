# Knowledge Arena delivery checklist

- [x] Preserve web/server workspaces, auth, and existing personal quest foundation.
- [x] Original fantasy illustration and responsive Arena design.
- [x] Categories, three difficulties, timed and relaxed rounds.
- [x] Server-private question bank and shuffled question/answer order.
- [x] One-question-at-a-time answer validation and explanation feedback.
- [x] Server clock, streak scoring, result rank, answer review, replay.
- [x] Daily seeded expedition and personal bests/history.
- [x] Guest cookie ownership and authenticated account ownership.
- [x] Durable attempts, atomic XP awards, duplicate reward prevention.
- [x] Resume after reload and recoverable network errors.
- [x] Keyboard access, reduced motion, mobile QA.
- [x] Unit, API, real database, browser, lint, type, and build verification.

Other game modes remain later phases, as requested. No inactive mode has a fake play button.

## Verification evidence

- 20 Jest tests: level boundaries, quest validation/API checks, Arena scoring, XP,
  content coverage, seeded daily selection, and non-mutating shuffle.
- Browser/API suite covers complete guest rounds, feedback, review, replay, reload
  and resume, account ownership, concurrent submissions, daily reward deduplication,
  server deadline enforcement, mobile timeout recovery, auth, and personal quests.
- Desktop and 390px mobile preview checked, including no horizontal overflow.
- Lint, strict typecheck, schema validation, and production build verified.

## Remaining platform work

Memory Temple and Code Dungeon are next consumers of the shared attempt/reward
architecture. Coins, leaderboards, inventory, character selection, admin content
tools, and deployment remain future work. The current question catalogue has 72
authored entries and should grow with reviewed, versioned question content.

## Creator and anonymous participant flow

- [x] Protected creator studio and API for creating/publishing quizzes.
- [x] Creator-only login/signup destination, sharing, and close/reopen controls.
- [x] Homepage quiz choice/code, nickname, six selectable avatars; no player login.
- [x] Persistent custom question snapshots, participant identity, and results.
- [x] Reuse server scoring, deadlines, ownership, feedback, resume, and review.
- [x] Creator-private participant results and protected management operations.
- [x] End-to-end creator publication, anonymous joining, completion, and closure.

## Seeded library, kids homepage, and rewards

- [x] 50 titled ready quizzes, 15 questions each, 750 distinct prompts and 10 topics.
- [x] Repeatable transactional seed; existing quizzes are preserved.
- [x] Free catalogue with search, topic filters, pagination, and direct quest selection.
- [x] Saved browser player passport, coins, XP, missions, and levels.
- [x] Strict >90% mastery, eight avatar unlocks, and server-side equipment validation.
- [x] Personal-best reward deltas and transaction-safe duplicate prevention.
- [x] Original friendly owl/fox artwork, animated sections, mobile and reduced motion.
- [x] Reward, level-up, and avatar celebrations with persisted result snapshots.

## Clear learning content and separate roles

- [x] Plain, descriptive names for all 50 ready quizzes and plausible related options.
- [x] Explicit catalogue refresh preserving existing attempts, progress and creators.
- [x] Animated hero scene with 3D books, camera depth, pause and reduced motion.
- [x] Participant play shell without creator sidebar or login prompts.
- [x] Public `/me` with persistent complete history, review/resume, levels and prizes.
- [x] Authenticated `/dashboard` with creator aggregates and private participant results.
- [x] Pagination and ownership checks for player history and creator reports.
