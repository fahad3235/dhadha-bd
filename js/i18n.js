// Dhadha BD — bilingual UI strings (EN/BN) + Bengali digit conversion.
// Works in browser (window.DhadhaI18n) and Node (module.exports).
(function (global) {
  'use strict';

  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  function toBnDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) { return BN_DIGITS[Number(d)]; });
  }

  // fmt replaces {key} placeholders, e.g. fmt('Score: {n}', { n: 5 }).
  function fmt(template, vars) {
    vars = vars || {};
    return String(template).replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] !== undefined ? vars[k] : '';
    });
  }

  var STRINGS = {
    en: {
      title: 'Dhadha BD',
      tagline: 'Classic Bangla riddles — guess the answer, beat your streak.',
      langBtn: 'বাংলা',
      categoryLabel: 'Category',
      difficultyLabel: 'Difficulty',
      allCategories: 'All categories',
      cat_nature: 'Nature',
      cat_home: 'Home',
      cat_food: 'Food',
      cat_animals: 'Animals',
      cat_body: 'Body',
      allDifficulties: 'All levels',
      diff_easy: 'Easy',
      diff_medium: 'Medium',
      diff_hard: 'Hard',
      newRiddle: 'New riddle',
      answerPlaceholder: 'Type your answer…',
      submit: 'Check answer',
      hint: 'Show hint',
      hintUsed: 'Hint used',
      reveal: 'Reveal answer',
      skip: 'Skip',
      resetStats: 'Reset stats',
      scoreLabel: 'Score',
      streakLabel: 'Streak',
      bestLabel: 'Best streak',
      playedLabel: 'Played',
      correctLabel: 'Correct',
      attemptsLabel: 'Tries',
      emptyState: 'No riddles match this category and level. Try another combination.',
      emptyGuess: 'Type an answer first.',
      correctMsg: 'Correct! +{points} points.',
      wrongMsg: 'Not quite — try again! (Try {n})',
      alreadyDone: 'This riddle is done. Get a new riddle!',
      hintNote: 'Hint costs points: a hinted answer scores 5 instead of 10.',
      revealMsg: 'The answer was: {answer}',
      howTitle: 'How to play',
      howItems: [
        'Read the riddle and type your answer in Bangla or romanized Latin (e.g. badur).',
        'First-try answers score 10 points, second-try 7, later tries 4; a hinted answer scores 5.',
        'Correct answers in a row build your streak. Reveal counts as played but breaks the streak.',
        'Your score and streak stay on this device only — no account, no network.'
      ],
      footer: 'Dhadha BD is a free offline riddle game. 40 classic folk riddles; answers are folk-conventional.'
    },
    bn: {
      title: 'ধাঁধা বিডি',
      tagline: 'বাংলার চিরচেনা ধাঁধা — উত্তর দাও, স্ট্রিক গড়ো।',
      langBtn: 'English',
      categoryLabel: 'বিভাগ',
      difficultyLabel: 'কঠিনতা',
      allCategories: 'সব বিভাগ',
      cat_nature: 'প্রকৃতি',
      cat_home: 'ঘর',
      cat_food: 'খাবার',
      cat_animals: 'প্রাণী',
      cat_body: 'শরীর',
      allDifficulties: 'সব স্তর',
      diff_easy: 'সহজ',
      diff_medium: 'মাঝারি',
      diff_hard: 'কঠিন',
      newRiddle: 'নতুন ধাঁধা',
      answerPlaceholder: 'উত্তর লিখুন…',
      submit: 'উত্তর যাচাই',
      hint: 'ইঙ্গিত দেখান',
      hintUsed: 'ইঙ্গিত ব্যবহৃত',
      reveal: 'উত্তর দেখান',
      skip: 'বাদ দিন',
      resetStats: 'পরিসংখ্যান মুছুন',
      scoreLabel: 'স্কোর',
      streakLabel: 'স্ট্রিক',
      bestLabel: 'সেরা স্ট্রিক',
      playedLabel: 'খেলা',
      correctLabel: 'সঠিক',
      attemptsLabel: 'চেষ্টা',
      emptyState: 'এই বিভাগ ও স্তরে কোনো ধাঁধা নেই। অন্য সমন্বয় চেষ্টা করুন।',
      emptyGuess: 'আগে উত্তর লিখুন।',
      correctMsg: 'সঠিক! +{points} পয়েন্ট।',
      wrongMsg: 'হয়নি — আবার চেষ্টা করুন! (চেষ্টা {n})',
      alreadyDone: 'এই ধাঁধাটি শেষ। নতুন ধাঁধা নিন!',
      hintNote: 'ইঙ্গিত নিলে পয়েন্ট কমে: ইঙ্গিতসহ সঠিক উত্তরে ৫ পয়েন্ট (১০-এর বদলে)।',
      revealMsg: 'উত্তর ছিল: {answer}',
      howTitle: 'খেলার নিয়ম',
      howItems: [
        'ধাঁধা পড়ে উত্তর লিখুন — বাংলায় বা রোমান অক্ষরে (যেমন badur)।',
        'প্রথম চেষ্টায় সঠিক হলে ১০ পয়েন্ট, দ্বিতীয় চেষ্টায় ৭, পরে ৪; ইঙ্গিতসহ হলে ৫।',
        'টানা সঠিক উত্তরে স্ট্রিক বাড়ে। উত্তর দেখিয়ে নিলে খেলা ধরা হবে, কিন্তু স্ট্রিক ভাঙবে।',
        'স্কোর ও স্ট্রিক শুধু এই ডিভাইসে থাকবে — কোনো অ্যাকাউন্ট বা নেটওয়ার্ক লাগে না।'
      ],
      footer: 'ধাঁধা বিডি একটি বিনামূল্যের অফলাইন ধাঁধার খেলা। ৪০টি চিরচেনা লোকজ ধাঁধা; উত্তরগুলো লোকপ্রচলিত।'
    }
  };

  function t(lang, key, vars) {
    var s = (STRINGS[lang] || STRINGS.en)[key];
    if (s === undefined) s = STRINGS.en[key] || '';
    if (Array.isArray(s)) return s.slice();
    return fmt(s, vars);
  }

  var api = { STRINGS: STRINGS, toBnDigits: toBnDigits, fmt: fmt, t: t };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DhadhaI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
