# Ready-to-play library

`catalogue.json` contains 50 original quiz titles and 750 distinct question prompts:
8 Math, 8 English, 6 Coding, 5 General Knowledge, 5 History, 5 Science, 4 Nature,
4 Geography, 3 Riddles, and 2 Space quizzes. Every quiz has exactly 15 questions,
four distinct options, a correct index, and an explanation.

Apply migrations, then run `npm run db:seed` from the repo root. The seed runs in a
transaction and uses a reserved library owner with no authentication account.
Stable `seedKey` values make repeats idempotent. By default it never replaces existing
library question content or touches creator-authored quizzes.

To deliberately apply editorial improvements to titles and options, run
`npm run db:seed -- --refresh-library`. This updates only trusted built-in rows owned
by the reserved library owner. Quiz IDs, join codes, player records, best scores,
coins, and unlocked avatars stay intact. Existing attempts keep their original
question/answer snapshots so a quiz already in progress cannot change mid-round.
History lists current readable titles; old result screens can retain their original
snapshot title. Correct-answer positions vary in the authored catalogue; runtime
also shuffles options separately for each attempt.

Math and code-expression questions use deterministic, precomputed answers. No code
provided by a player is executed. Coding questions teach reading code, not running it.
Tests validate all question structures, unique titles/codes/prompts, and topic coverage.

Educational content draws on ordinary curriculum facts, with these primary reference
sources used for specialist history and astronomy checks. Wording is original:

- [NASA solar system facts](https://science.nasa.gov/solar-system/solar-system-facts/)
- [NASA Space Place planets](https://spaceplace.nasa.gov/planets/en/)
- [British Museum family Egypt guide](https://www.britishmuseum.org/sites/default/files/2024-06/Museum_explorers_Ancient_Egypt.pdf)
- [UNESCO Paharpur](https://whc.unesco.org/en/list/322)
- [Nobel Prize official list](https://www.nobelprize.org/prizes/lists/all-nobel-prizes/all/)

Content is a learning game catalogue, not a graded curriculum or live examination.
