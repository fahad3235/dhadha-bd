// Dhadha BD — DOM-free game logic. Works in browser and Node (for tests).
// Scoring rule (documented): a correct answer scores 10 on the first try,
// 7 on the second try (one wrong guess before it), 4 on any later try.
// If a hint was used for that riddle, the score is 5 regardless of tries.
(function (global) {
  'use strict';

  var CATEGORIES = ['nature', 'home', 'food', 'animals', 'body'];
  var DIFFICULTIES = ['easy', 'medium', 'hard'];

  // Lowercase Latin, drop spaces and all punctuation (including the Bengali
  // danda "।", hyphens and quotes) so "বাদুড়", " বাদুড়।" and "BADUR" all match.
  function normalizeAnswer(raw) {
    if (typeof raw !== 'string') return '';
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09ff]/g, '');
  }

  // Returns { correct: boolean, empty: boolean }.
  // Empty (or punctuation-only) guesses are always rejected.
  function checkAnswer(riddle, guess) {
    var norm = normalizeAnswer(guess);
    if (!norm) return { correct: false, empty: true };
    if (!riddle || !Array.isArray(riddle.accepted)) return { correct: false, empty: false };
    var ok = riddle.accepted.some(function (a) {
      return normalizeAnswer(a) === norm;
    });
    return { correct: ok, empty: false };
  }

  // opts: { hintUsed: boolean, attempts: number of wrong guesses before the correct one }
  function scoreFor(opts) {
    opts = opts || {};
    if (opts.hintUsed) return 5;
    var attempts = opts.attempts || 0;
    if (attempts <= 0) return 10;
    if (attempts === 1) return 7;
    return 4;
  }

  // opts: { category ('all' or key), difficulty ('all' or key) }
  function filterBank(bank, opts) {
    opts = opts || {};
    return bank.filter(function (r) {
      var catOk = !opts.category || opts.category === 'all' || r.category === opts.category;
      var diffOk = !opts.difficulty || opts.difficulty === 'all' || r.difficulty === opts.difficulty;
      return catOk && diffOk;
    });
  }

  // opts: { category, difficulty, excludeIds (array of riddle ids) }, rng (fn).
  // Exclusion is honoured when possible; if every filtered riddle is excluded,
  // the pool falls back to the full filtered set (never returns null on that
  // account). Returns null only when the filter itself matches nothing.
  function pickRiddle(bank, opts, rng) {
    opts = opts || {};
    var pool = filterBank(bank, opts);
    if (pool.length === 0) return null;
    var excluded = opts.excludeIds || [];
    var fresh = pool.filter(function (r) { return excluded.indexOf(r.id) === -1; });
    if (fresh.length > 0) pool = fresh;
    var r = rng || Math.random;
    return pool[Math.floor(r() * pool.length)];
  }

  function createStats() {
    return { played: 0, correct: 0, score: 0, streak: 0, best: 0 };
  }

  // Returns a NEW stats object. correct=true adds points and grows the streak;
  // correct=false (reveal / give-up) ends the streak but still counts as played.
  function recordResult(stats, result) {
    var next = {
      played: (stats.played || 0) + 1,
      correct: (stats.correct || 0) + (result.correct ? 1 : 0),
      score: (stats.score || 0) + (result.correct ? (result.points || 0) : 0),
      streak: result.correct ? (stats.streak || 0) + 1 : 0,
      best: stats.best || 0
    };
    if (next.streak > next.best) next.best = next.streak;
    return next;
  }

  var api = {
    CATEGORIES: CATEGORIES,
    DIFFICULTIES: DIFFICULTIES,
    normalizeAnswer: normalizeAnswer,
    checkAnswer: checkAnswer,
    scoreFor: scoreFor,
    filterBank: filterBank,
    pickRiddle: pickRiddle,
    createStats: createStats,
    recordResult: recordResult
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DhadhaLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
