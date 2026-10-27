# Dhadha BD - Bangla Riddle Game

A free, offline, bilingual (English / Bangla) riddle game: 40 classic folk-style
Bangla riddles across 5 categories. Read a riddle, type the answer in Bangla
script or romanized Latin, build a streak, and beat your score. No account,
no network requests, no build step - open `index.html` and play.

## Problem

Bangla riddles (dhadha) are a beloved folk tradition, but there is no small,
offline, bilingual riddle game that accepts both Bangla-script and romanized
answers and works on a phone without an account or an internet connection.
Dhadha BD fills that gap with a hand-checked bank of classic riddles.

## Features

- **40 riddles, 5 categories x 8**: Nature, Home, Food, Animals, Body.
- **3 difficulty levels**: Easy, Medium, Hard, plus category + difficulty filters.
- **Bilingual UI**: one-tap English / Bangla toggle (persisted), with Bengali
  digits in Bangla mode.
- **Flexible answers**: every riddle accepts its Bangla answer plus romanized
  Latin variants (e.g. `badur` for the bat riddle); matching ignores spaces,
  case, and punctuation.
- **Scoring**: first-try correct = 10 points, second-try = 7, later tries = 4;
  a hinted correct answer = 5. Streaks and best streak tracked.
- **One hint per riddle** (hint text never contains the answer), plus Reveal
  and Skip actions.
- **Empty state**: filter combinations with no riddles (e.g. Body + Hard) show
  a clear message instead of a broken card.
- **Persistent stats**: score, streak, best streak, played, and correct counts
  are stored in `localStorage` (key `dhadha-bd-v1`) on the device only.
- **Responsive**: works at 390px mobile width with no horizontal overflow.

## Stack

- Plain HTML, CSS, and JavaScript - no frameworks, no bundler, no dependencies.
- Game logic is DOM-free (`js/logic.js`) and runs unchanged in Node for tests.
- Headless-Chrome smoke tests use raw CDP (no Puppeteer dependency).

## Prerequisites

- Any modern browser, or Node.js 18+ to run the tests.

## Install / Run

No install step. Open the app directly:

```sh
# From the project root, serve it (any static server works), or just open:
open index.html
```

## Dev commands

```sh
node tests/logic.test.js   # Node unit tests for game logic + bank integrity
node tests/smoke.js        # Headless-Chrome CDP smoke test (needs Chrome)
```

## Env

None. There are no secrets, API keys, or network requests in this project.

## Testing

- `tests/logic.test.js` - bank integrity (40 riddles, unique ids, 8/category,
  valid categories/difficulties, non-empty fields, hint never contains the
  answer, accepted answers include Bengali + Latin variants), normalization,
  answer checking, scoring rules, riddle picking (filters, exclusion,
  deterministic seeded RNG), stats math, and Bengali-digit conversion.
- `tests/smoke.js` - loads the real page in headless Chrome and verifies the
  title, riddle card, correct/wrong answers via test hooks, hint, reveal,
  category filtering, the empty state, the Bangla toggle with Bengali digits,
  390px no-overflow, and zero console/page errors.

## Deployment

GitHub Pages: publish the repository root (main branch, `/root`) as a static
site. No build step is required.

## Limitations

- Riddle answers are folk-conventional: where a riddle could arguably admit
  more than one answer, the bank records the traditional answer, and romanized
  spellings are accepted as a convenience (spelling variants may differ).
- Stats live only in the browser's `localStorage`; clearing site data resets
  them, and they do not sync across devices.
- The game is fully client-side; the riddle bank is visible in `js/data.js`.

## Status

Complete MVP. See `TEST_RESULTS.md` for the latest verified test counts.
