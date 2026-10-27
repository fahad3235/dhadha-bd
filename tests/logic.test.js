// Node unit tests for Dhadha BD. Usage: node tests/logic.test.js
// No Bengali literals here: all Bengali strings come from js/data.js via import.
const L = require('../js/logic.js');
const BANK = require('../js/data.js');
const I18n = require('../js/i18n.js');
let failures = 0;
let count = 0;
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hasBn = (s) => /[\u0980-\u09ff]/.test(s);
const hasLatin = (s) => /^[a-z]+$/.test(s);
const byId = (id) => BANK.find((r) => r.id === id);

// ---- Bank integrity ----
check('bank has 40 riddles', BANK.length === 40, String(BANK.length));
check('all ids unique', new Set(BANK.map((r) => r.id)).size === 40);
check('8 riddles per category', L.CATEGORIES.every((c) => BANK.filter((r) => r.category === c).length === 8));
check('all categories valid', BANK.every((r) => L.CATEGORIES.indexOf(r.category) !== -1));
check('all difficulties valid', BANK.every((r) => L.DIFFICULTIES.indexOf(r.difficulty) !== -1));
check('each difficulty non-empty', L.DIFFICULTIES.every((d) => BANK.some((r) => r.difficulty === d)));
check('question/answer/hint all non-empty', BANK.every((r) =>
  r.question && r.question.trim().length > 3 &&
  r.answer && r.answer.trim().length > 0 &&
  r.hint && r.hint.trim().length > 3));
check('hint does not contain the answer (normalized)',
  BANK.every((r) => L.normalizeAnswer(r.hint).indexOf(L.normalizeAnswer(r.answer)) === -1),
  BANK.filter((r) => L.normalizeAnswer(r.hint).indexOf(L.normalizeAnswer(r.answer)) !== -1).map((r) => r.id).join(','));
check('accepted has >= 2 entries incl. a Bengali and a Latin one', BANK.every((r) =>
  Array.isArray(r.accepted) && r.accepted.length >= 2 &&
  r.accepted.some(hasBn) && r.accepted.some(hasLatin)));
check('accepted includes the primary answer', BANK.every((r) => r.accepted.indexOf(r.answer) !== -1));

// ---- normalizeAnswer ----
check('normalize trims spaces', L.normalizeAnswer('  ' + byId('animal-01').answer + ' ') === L.normalizeAnswer(byId('animal-01').answer));
check('normalize strips Bengali danda and punctuation',
  L.normalizeAnswer(byId('animal-01').answer + '\u0964') === L.normalizeAnswer(byId('animal-01').answer) &&
  L.normalizeAnswer(byId('animal-01').answer + '!') === L.normalizeAnswer(byId('animal-01').answer));
check('normalize lowercases Latin', L.normalizeAnswer('BADUR') === 'badur');
check('normalize strips internal spaces', L.normalizeAnswer('ba dur') === 'badur');
check('normalize of non-string is empty', L.normalizeAnswer(null) === '' && L.normalizeAnswer(42) === '');

// ---- checkAnswer ----
const bat = byId('animal-01');
check('checkAnswer accepts primary answer', L.checkAnswer(bat, bat.answer).correct === true);
check('checkAnswer accepts romanized variant', L.checkAnswer(bat, 'badur').correct === true);
check('checkAnswer accepts romanized with case/spaces/punct', L.checkAnswer(bat, ' Badur. ').correct === true);
check('checkAnswer rejects wrong answer', L.checkAnswer(bat, byId('animal-02').answer).correct === false);
check('checkAnswer rejects empty guess', L.checkAnswer(bat, '').empty === true && L.checkAnswer(bat, '').correct === false);
check('checkAnswer rejects punctuation-only guess', L.checkAnswer(bat, '...').empty === true);
check('checkAnswer rejects partial answer', L.checkAnswer(bat, bat.answer.slice(0, 2)).correct === false);

// ---- scoreFor ----
check('scoreFor first-try = 10', L.scoreFor({ hintUsed: false, attempts: 0 }) === 10);
check('scoreFor second-try = 7', L.scoreFor({ hintUsed: false, attempts: 1 }) === 7);
check('scoreFor later tries = 4', L.scoreFor({ hintUsed: false, attempts: 2 }) === 4 && L.scoreFor({ hintUsed: false, attempts: 5 }) === 4);
check('scoreFor after hint = 5 regardless of tries',
  L.scoreFor({ hintUsed: true, attempts: 0 }) === 5 && L.scoreFor({ hintUsed: true, attempts: 3 }) === 5);

// ---- filterBank / pickRiddle ----
check('filterBank respects category', L.filterBank(BANK, { category: 'food' }).length === 8 &&
  L.filterBank(BANK, { category: 'food' }).every((r) => r.category === 'food'));
check('filterBank respects difficulty', L.filterBank(BANK, { difficulty: 'hard' }).every((r) => r.difficulty === 'hard'));
check('filterBank category+difficulty combo', L.filterBank(BANK, { category: 'body', difficulty: 'hard' }).length === 0);
check('filterBank all/all returns full bank', L.filterBank(BANK, { category: 'all', difficulty: 'all' }).length === 40);
check('pickRiddle respects category', L.pickRiddle(BANK, { category: 'animals' }, () => 0).category === 'animals');
check('pickRiddle respects difficulty', L.pickRiddle(BANK, { difficulty: 'hard' }, () => 0).difficulty === 'hard');
check('pickRiddle deterministic with seeded rng (rng 0 => first of pool)',
  L.pickRiddle(BANK, { category: 'food' }, () => 0).id === 'food-01' &&
  L.pickRiddle(BANK, { category: 'food' }, () => 0).id === L.pickRiddle(BANK, { category: 'food' }, () => 0).id);
check('pickRiddle honours exclusion', (() => {
  const foodIds = BANK.filter((r) => r.category === 'food').map((r) => r.id);
  return L.pickRiddle(BANK, { category: 'food', excludeIds: foodIds.slice(0, 7) }, () => 0).id === foodIds[7];
})());
check('pickRiddle falls back when all excluded', (() => {
  const foodIds = BANK.filter((r) => r.category === 'food').map((r) => r.id);
  const got = L.pickRiddle(BANK, { category: 'food', excludeIds: foodIds }, () => 0);
  return got && got.category === 'food';
})());
check('pickRiddle returns null for empty filter', L.pickRiddle(BANK, { category: 'body', difficulty: 'hard' }, () => 0) === null);

// ---- stats helpers ----
let s = L.createStats();
check('createStats starts at zero', eq(s, { played: 0, correct: 0, score: 0, streak: 0, best: 0 }));
s = L.recordResult(s, { correct: true, points: 10 });
check('correct result: played/correct/score/streak/best all rise',
  s.played === 1 && s.correct === 1 && s.score === 10 && s.streak === 1 && s.best === 1);
s = L.recordResult(s, { correct: true, points: 7 });
check('second correct: streak 2, best 2, score 17', s.streak === 2 && s.best === 2 && s.score === 17);
s = L.recordResult(s, { correct: false, points: 0 });
check('miss: streak resets, best kept, played rises, score unchanged',
  s.streak === 0 && s.best === 2 && s.played === 3 && s.score === 17 && s.correct === 2);
check('recordResult does not mutate input', (() => {
  const before = L.createStats();
  const snap = JSON.stringify(before);
  L.recordResult(before, { correct: true, points: 10 });
  return JSON.stringify(before) === snap;
})());

// ---- i18n digits helper ----
check('toBnDigits converts digits to Bengali range', /^[\u09e6-\u09ef]{4}$/.test(I18n.toBnDigits(2026)) && I18n.toBnDigits(0) !== '0' && I18n.toBnDigits(10).length === 2);
check('i18n has both languages with all keys', (() => {
  const enKeys = Object.keys(I18n.STRINGS.en).sort();
  const bnKeys = Object.keys(I18n.STRINGS.bn).sort();
  return eq(enKeys, bnKeys) && enKeys.length >= 25;
})());

console.log('LOGIC CHECKS: ' + count + ', FAILURES: ' + failures);
console.log(failures === 0 ? 'LOGIC GREEN' : 'LOGIC FAILURES: ' + failures);
process.exit(failures === 0 ? 0 : 1);
