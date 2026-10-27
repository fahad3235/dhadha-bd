// Dhadha BD — UI wiring. Depends on DhadhaLogic, DHADHA_BANK, DhadhaI18n.
(function () {
  'use strict';

  var L = window.DhadhaLogic;
  var BANK = window.DHADHA_BANK;
  var I18n = window.DhadhaI18n;
  var STORAGE_KEY = 'dhadha-bd-v1';

  function $(id) { return document.getElementById(id); }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { /* private mode etc. — fall back to defaults */ }
    return {};
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lang: state.lang,
        stats: state.stats
      }));
    } catch (e) { /* ignore */ }
  }

  var saved = loadSaved();
  var state = {
    lang: saved.lang === 'bn' ? 'bn' : 'en',
    category: 'all',
    difficulty: 'all',
    current: null,
    attempts: 0,
    hintUsed: false,
    resolved: false,
    stats: saved.stats ? {
      played: saved.stats.played || 0,
      correct: saved.stats.correct || 0,
      score: saved.stats.score || 0,
      streak: saved.stats.streak || 0,
      best: saved.stats.best || 0
    } : L.createStats()
  };

  function num(n) {
    return state.lang === 'bn' ? I18n.toBnDigits(n) : String(n);
  }

  function t(key, vars) { return I18n.t(state.lang, key, vars); }

  function buildSelectOptions() {
    var cat = $('category');
    var diff = $('difficulty');
    var catVal = cat.value, diffVal = diff.value;
    cat.innerHTML = '';
    diff.innerHTML = '';
    var allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = t('allCategories');
    cat.appendChild(allOpt);
    L.CATEGORIES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = t('cat_' + c);
      cat.appendChild(o);
    });
    var allD = document.createElement('option');
    allD.value = 'all';
    allD.textContent = t('allDifficulties');
    diff.appendChild(allD);
    L.DIFFICULTIES.forEach(function (d) {
      var o = document.createElement('option');
      o.value = d;
      o.textContent = t('diff_' + d);
      diff.appendChild(o);
    });
    cat.value = catVal;
    diff.value = diffVal;
  }

  function renderLabels() {
    document.documentElement.lang = state.lang;
    $('title').textContent = t('title');
    $('tagline').textContent = t('tagline');
    $('langBtn').textContent = t('langBtn');
    $('lblCategory').textContent = t('categoryLabel');
    $('lblDifficulty').textContent = t('difficultyLabel');
    $('newBtn').textContent = t('newRiddle');
    $('answerInput').placeholder = t('answerPlaceholder');
    $('submitBtn').textContent = t('submit');
    $('hintBtn').textContent = state.hintUsed ? t('hintUsed') : t('hint');
    $('revealBtn').textContent = t('reveal');
    $('skipBtn').textContent = t('skip');
    $('resetStatsBtn').textContent = t('resetStats');
    $('statScoreLabel').textContent = t('scoreLabel');
    $('statStreakLabel').textContent = t('streakLabel');
    $('statBestLabel').textContent = t('bestLabel');
    $('statPlayedLabel').textContent = t('playedLabel');
    $('statCorrectLabel').textContent = t('correctLabel');
    $('attemptsLabel').textContent = t('attemptsLabel');
    $('emptyState').textContent = t('emptyState');
    $('hintNote').textContent = t('hintNote');
    $('howTitle').textContent = t('howTitle');
    $('footerText').textContent = t('footer');
    var list = $('howList');
    list.innerHTML = '';
    t('howItems').forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    buildSelectOptions();
    renderCardLabels();
    renderStats();
  }

  // Re-render only the parts of the current card that depend on language,
  // so a language toggle re-renders the current riddle card labels.
  function renderCardLabels() {
    if (!state.current) return;
    $('catBadge').textContent = t('cat_' + state.current.category);
    $('diffBadge').textContent = t('diff_' + state.current.difficulty);
    if (state.resolved && state.lastReveal) {
      $('message').textContent = t('revealMsg', { answer: state.current.answer });
    }
  }

  function renderStats() {
    $('statScore').textContent = num(state.stats.score);
    $('statStreak').textContent = num(state.stats.streak);
    $('statBest').textContent = num(state.stats.best);
    $('statPlayed').textContent = num(state.stats.played);
    $('statCorrect').textContent = num(state.stats.correct);
    $('attempts').textContent = num(state.attempts);
  }

  function showCard(show) {
    $('riddleCard').hidden = !show;
    $('emptyState').hidden = show;
  }

  function newRiddle(excludeCurrent) {
    var exclude = excludeCurrent && state.current ? [state.current.id] : [];
    var r = L.pickRiddle(BANK, {
      category: state.category,
      difficulty: state.difficulty,
      excludeIds: exclude
    });
    state.current = r;
    state.attempts = 0;
    state.hintUsed = false;
    state.resolved = false;
    state.lastReveal = false;
    if (!r) {
      showCard(false);
      $('message').textContent = '';
      return;
    }
    showCard(true);
    $('question').textContent = r.question;
    $('hintText').textContent = '';
    $('answerText').textContent = '';
    $('message').textContent = '';
    $('answerInput').value = '';
    $('answerInput').disabled = false;
    $('submitBtn').disabled = false;
    $('hintBtn').disabled = false;
    renderCardLabels();
    $('hintBtn').textContent = t('hint');
    renderStats();
  }

  function submitAnswer(raw) {
    if (!state.current) return;
    if (state.resolved) {
      $('message').textContent = t('alreadyDone');
      return;
    }
    var res = L.checkAnswer(state.current, raw);
    if (res.empty) {
      $('message').textContent = t('emptyGuess');
      return;
    }
    if (res.correct) {
      var points = L.scoreFor({ hintUsed: state.hintUsed, attempts: state.attempts });
      state.stats = L.recordResult(state.stats, { correct: true, points: points });
      state.resolved = true;
      $('message').textContent = t('correctMsg', { points: num(points) });
      $('answerText').textContent = state.current.answer;
      $('answerInput').disabled = true;
      $('submitBtn').disabled = true;
      $('hintBtn').disabled = true;
    } else {
      state.attempts += 1;
      $('message').textContent = t('wrongMsg', { n: num(state.attempts) });
    }
    renderStats();
    save();
  }

  function useHint() {
    if (!state.current || state.resolved || state.hintUsed) return;
    state.hintUsed = true;
    $('hintText').textContent = state.current.hint;
    $('hintBtn').disabled = true;
    $('hintBtn').textContent = t('hintUsed');
  }

  function reveal() {
    if (!state.current || state.resolved) return;
    state.stats = L.recordResult(state.stats, { correct: false, points: 0 });
    state.resolved = true;
    state.lastReveal = true;
    $('answerText').textContent = state.current.answer;
    $('message').textContent = t('revealMsg', { answer: state.current.answer });
    $('answerInput').disabled = true;
    $('submitBtn').disabled = true;
    $('hintBtn').disabled = true;
    renderStats();
    save();
  }

  function toggleLang() {
    state.lang = state.lang === 'en' ? 'bn' : 'en';
    save();
    renderLabels();
  }

  // ---- Events ----
  $('langBtn').addEventListener('click', toggleLang);
  $('category').addEventListener('change', function () {
    state.category = $('category').value;
    newRiddle(false);
  });
  $('difficulty').addEventListener('change', function () {
    state.difficulty = $('difficulty').value;
    newRiddle(false);
  });
  $('newBtn').addEventListener('click', function () { newRiddle(false); });
  $('submitBtn').addEventListener('click', function () {
    submitAnswer($('answerInput').value);
  });
  $('answerInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitAnswer($('answerInput').value);
  });
  $('hintBtn').addEventListener('click', useHint);
  $('revealBtn').addEventListener('click', reveal);
  $('skipBtn').addEventListener('click', function () { newRiddle(true); });
  $('resetStatsBtn').addEventListener('click', function () {
    state.stats = L.createStats();
    renderStats();
    save();
  });

  // ---- Test hooks (used by tests/smoke.js) ----
  window.__dhadha = {
    setRiddle: function (id) {
      var r = null;
      BANK.forEach(function (x) { if (x.id === id) r = x; });
      if (!r) return false;
      state.current = r;
      state.attempts = 0;
      state.hintUsed = false;
      state.resolved = false;
      state.lastReveal = false;
      showCard(true);
      $('question').textContent = r.question;
      $('hintText').textContent = '';
      $('answerText').textContent = '';
      $('message').textContent = '';
      $('answerInput').value = '';
      $('answerInput').disabled = false;
      $('submitBtn').disabled = false;
      $('hintBtn').disabled = false;
      renderCardLabels();
      $('hintBtn').textContent = t('hint');
      renderStats();
      return true;
    },
    submit: function (text) { submitAnswer(text); },
    hint: function () { useHint(); },
    reveal: function () { reveal(); },
    state: function () {
      return {
        riddleId: state.current ? state.current.id : null,
        category: state.current ? state.current.category : null,
        difficulty: state.current ? state.current.difficulty : null,
        answer: state.current ? state.current.answer : null,
        attempts: state.attempts,
        hintUsed: state.hintUsed,
        resolved: state.resolved,
        score: state.stats.score,
        streak: state.stats.streak,
        best: state.stats.best,
        played: state.stats.played,
        correct: state.stats.correct,
        lang: state.lang
      };
    }
  };

  renderLabels();
  newRiddle(false);
})();
