// LinkWords — Scoring & Levels Engine v3.0
(function(LW) {
  'use strict';

  let _state;

  const BASE_SCORE = 1000;
  const OPTIMAL_PATH_BONUS = 500;
  const TIME_BONUSES = [[15, 500], [30, 300], [60, 200], [120, 100]];
  const CHAIN_PENALTY = 80;
  const CROSS_THEME_BONUS = 50;
  const SAME_THEME_BONUS = 10;
  const HINT_PENALTY = 50;
  const UNDO_PENALTY = 20;
  const DIFFICULTY_MULTIPLIER = { easy: 0.8, medium: 1.0, hard: 1.5 };
  const LEVEL_MULT_PER_10 = 0.1;
  const XP_PER_LEVEL = function(n) { return Math.floor(30 * Math.pow(n, 1.3)); };
  const XP_DIFFICULTY_MULT = { easy: 0.8, medium: 1.0, hard: 1.5 };
  const XP_MODE_MULT = { daily: 1.2, blitz: 1.3, endless: 1.0, weekly: 1.5 };
  const XP_STREAK_BONUS_PER_DAY = 0.05;
  const XP_STREAK_BONUS_CAP = 0.5;
  const STREAK_FREEZE_PER_WEEK = 1;
  const LEVEL_TITLES = {
    1:'Spark', 3:'Thinker', 5:'Wordsmith', 8:'Puzzler',
    10:'Linker', 13:'Weaver', 15:'Scholar', 18:'Strategist',
    20:'Sage', 23:'Linguist', 25:'Polyglot', 28:'Artisan',
    30:'Maestro', 33:'Philosopher', 35:'Luminary', 38:'Visionary',
    40:'Oracle', 43:'Architect', 45:'Virtuoso', 48:'Prodigy',
    50:'Master', 55:'Grand Master', 60:'Champion', 65:'Titan',
    70:'Legend', 75:'Mythic', 80:'Transcendent', 85:'Eternal',
    90:'Celestial', 95:'Ascendant', 100:'Prestige'
  };
  const PRESTIGE_TITLES = ['Prestige', 'Prestige II', 'Prestige III', 'Prestige IV', 'Prestige V'];

  const RATING_THRESHOLDS = [
    [2200, 'mastermind'], [1800, 'architect'], [1400, 'weaver'],
    [1000, 'bridge'], [700, 'chain'], [400, 'link']
  ];

  function init(state) { _state = state; }

  function calculateScore(chain, time, hintsUsed, undosUsed) {
    const concepts = window.WORD_DATA.concepts;
    let score = BASE_SCORE;

    for (const [max, bonus] of TIME_BONUSES) {
      if (time <= max) { score += bonus; break; }
    }

    let creativity = 0;
    for (let i = 0; i < chain.length - 1; i++) {
      const gA = concepts[chain[i]]?.g;
      const gB = concepts[chain[i + 1]]?.g;
      creativity += (gA !== gB) ? CROSS_THEME_BONUS : SAME_THEME_BONUS;
    }
    score += creativity;

    score -= hintsUsed * HINT_PENALTY;
    score -= (undosUsed || 0) * UNDO_PENALTY;

    if (_state.puzzle && chain.length <= _state.puzzle.optimal) {
      score += OPTIMAL_PATH_BONUS;
    }

    const diffMult = DIFFICULTY_MULTIPLIER[_state.difficulty] || 1.0;
    score = Math.round(score * diffMult);

    const comboTotal = _state.comboBonus || 0;
    score += comboTotal;

    const playerLevel = _state.stats?.level || 0;
    const levelMult = 1.0 + Math.floor(playerLevel / 10) * LEVEL_MULT_PER_10;
    score = Math.round(score * levelMult);

    const streak = _state.stats?.streak || 0;
    const streakMult = streak >= 100 ? 5.0
      : streak >= 60 ? 4.0
      : streak >= 30 ? 3.0
      : streak >= 14 ? 2.0
      : streak >= 7  ? 1.5
      : 1.0;
    score = Math.round(score * streakMult);

    return Math.max(0, score);
  }

  function getScoreRating(score) {
    for (const [threshold, name] of RATING_THRESHOLDS) {
      if (score >= threshold) return name;
    }
    return 'spark';
  }

  function getRatingEmoji(rating) {
    const map = {
      mastermind: '✦✦✦', architect: '✦✦✦', weaver: '✦✦',
      bridge: '✦✦', chain: '✦', link: '○', spark: '·'
    };
    return map[rating] || '';
  }

  function getRatingLabel(rating) {
    const map = {
      mastermind: 'Mastermind', architect: 'Architect', weaver: 'Weaver',
      bridge: 'Bridge', chain: 'Chain', link: 'Link', spark: 'Spark'
    };
    return map[rating] || 'Spark';
  }

  const _levelThresholds = [];
  (function() {
    let total = 0;
    for (let i = 0; i <= 200; i++) {
      _levelThresholds.push(total);
      total += XP_PER_LEVEL(i + 1);
    }
  })();

  function getLevel(xp) {
    if (!Number.isFinite(xp) || xp < 0) return { level: 0, totalXp: 0 };
    let lo = 0, hi = _levelThresholds.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (_levelThresholds[mid] <= xp) lo = mid;
      else hi = mid - 1;
    }
    return { level: lo, totalXp: _levelThresholds[lo] };
  }

  function getLevelNumber(xp) {
    return getLevel(xp).level;
  }

  function getLevelProgress(xp) {
    var result = getLevel(xp);
    var nextReq = XP_PER_LEVEL(result.level + 1);
    var cur = xp - result.totalXp;
    return { level: result.level, current: cur, required: nextReq, pct: Math.min(1, cur / nextReq) };
  }

  function getLevelTitle(lvl) {
    if (lvl > 100) {
      const tier = Math.min(Math.floor((lvl - 100) / 50), PRESTIGE_TITLES.length - 1);
      return PRESTIGE_TITLES[tier];
    }
    let title = 'Spark';
    for (const threshold in LEVEL_TITLES) {
      if (lvl >= Number(threshold)) title = LEVEL_TITLES[threshold];
    }
    return title;
  }

  LW.scoring = {
    init,
    BASE_SCORE, OPTIMAL_PATH_BONUS, TIME_BONUSES, CHAIN_PENALTY,
    CROSS_THEME_BONUS, SAME_THEME_BONUS, HINT_PENALTY, UNDO_PENALTY,
    DIFFICULTY_MULTIPLIER, LEVEL_MULT_PER_10, XP_PER_LEVEL, XP_DIFFICULTY_MULT,
    XP_MODE_MULT, XP_STREAK_BONUS_PER_DAY, XP_STREAK_BONUS_CAP,
    STREAK_FREEZE_PER_WEEK, LEVEL_TITLES, PRESTIGE_TITLES, RATING_THRESHOLDS,
    calculateScore, getScoreRating, getRatingEmoji, getRatingLabel,
    getLevel, getLevelNumber, getLevelProgress, getLevelTitle
  };

})(window.LW = window.LW || {});
