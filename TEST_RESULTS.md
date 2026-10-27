# Dhadha BD - Test Results

Verified by actual runs on 2026-10-27 (Asia/Dhaka). No results were invented.

## Score rule (exact, as implemented in js/logic.js `scoreFor`)

- Correct on the first try (0 wrong guesses): **10 points**
- Correct on the second try (1 wrong guess before it): **7 points**
- Correct on any later try (2+ wrong guesses): **4 points**
- Correct after using the hint for that riddle: **5 points, regardless of tries**
- Reveal (give up) scores 0, counts as played, and breaks the streak.

## Node unit tests - `node tests/logic.test.js`

- **43 checks, 0 failures - LOGIC GREEN**
- Coverage: bank integrity (40 riddles, unique ids, 8 per category, valid
  categories/difficulties, non-empty question/answer/hint, hint never contains
  the answer after normalization, accepted answers include a Bengali entry and
  a Latin entry, accepted includes the primary answer); normalization (spaces,
  Bengali danda and punctuation, Latin case, internal spaces, non-strings);
  answer checking (primary, romanized, case/space/punct variants, wrong,
  empty, punctuation-only, partial); scoring (10 / 7 / 4 / hint-5 rules);
  filtering and picking (category, difficulty, combos incl. the empty
  Body+Hard combo, deterministic seeded RNG, exclusion, fallback when all
  excluded, null for an empty filter); stats math (streak/best-streak, no
  mutation); Bengali-digit conversion and i18n key parity.

## Headless-Chrome smoke tests - `node tests/smoke.js`

- **23 checks, 0 failures - SMOKE GREEN** (raw CDP, port 9343, fresh tmp profile)
- Coverage: page title, riddle card + question + category badge, test hooks,
  correct answer via hook (score increases, success message, played/correct
  counted), wrong answer (attempts increment, try-again message), hint reveal
  + button disable, reveal shows the answer + marks resolved, category filter
  narrows to Animals, Body+Hard empty state, language toggle (lang="bn",
  button reads English, score stat in Bengali digits, card re-rendered),
  localStorage persistence (key `dhadha-bd-v1`), 390px viewport with no
  horizontal overflow, and 0 console/page errors.

## ASCII-only verification

`index.html`, `css/style.css`, `README.md`, `tests/logic.test.js`,
`tests/smoke.js`, and `.gitignore` contain no non-ASCII bytes (verified with
`grep`). Bengali characters appear only in `js/*.js` (data, i18n, app
strings); test files reference Bengali only through imported data or
`\uXXXX` escapes, never as literals.

## Repairs made

1. Fixed one invalid CSS declaration (stray text in the `.empty` rule).
2. Replaced em-dash characters in README.md with ASCII hyphens so the file
   stays ASCII-only.
3. Replaced a literal Bengali danda character in `tests/logic.test.js` with
   the `\u0964` escape so the test file stays ASCII-only.
4. Replaced literal Bengali words in two smoke-test message regexes with
   English-only patterns (the page was already in English mode at those
   steps), keeping the smoke file ASCII-only.

Both suites were green on the first run; the repairs above were constraint
fixes only, and both suites were re-run green afterwards. No repair cycles
beyond these were needed.

## Status

Complete, tested, ready to publish. Not pushed to GitHub and not recorded in
the factory ledger, per the build brief (publishing is left to the parent).
