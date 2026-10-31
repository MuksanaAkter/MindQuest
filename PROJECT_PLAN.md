# MindQuest implementation plan

## Current delivery: Knowledge Arena first

The attached platform brief is the long-term roadmap. The current request prioritizes
one complete, replayable Knowledge Arena and reusable game architecture. Keep the
existing Next.js runtime and `apps/web` / `apps/server` split. Preserve working auth
and personal quests. Keep npm and its existing lockfile rather than migrating tools
while building gameplay.

1. Inspect and preserve the current foundation; record architecture and scope.
2. Establish the fantasy Arena shell and original local artwork.
3. Add reusable attempt contracts, authoritative scoring, PostgreSQL attempt storage,
   ownership checks, server timers, and transactional authenticated XP awards.
4. Build category/difficulty selection, timed and relaxed play, shuffled questions
   and answers, streak bonuses, explanations, round review, history, and replay.
5. Verify unit logic, API boundaries, real PostgreSQL behavior, browser gameplay,
   responsive layout, keyboard controls, reduced motion, lint, types, and build.

## Replay loop

Choose a route → five questions → immediate explanation → build a streak → finish
with a rank and review → beat a personal best or try another category. A UTC daily
expedition uses a shared deterministic question selection. Every visit also offers
random practice. Guests can play and retain browser-linked history; only signed-in
players receive account XP. The UI states that distinction.

## Later work

Reuse the attempt lifecycle, ownership, reward ledger, and result UI for Memory,
Code, Math, and Language modes. These modes are not represented as playable until
implemented and tested. No multiplayer, leaderboard, coins, inventory, onboarding,
or production deployment is included in this slice.
