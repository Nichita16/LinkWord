// LinkWords - Game Engine v2.0
(function () {
  'use strict';

  window.onerror = function (msg, src, line, col, err) {
    console.error('[LinkWords]', msg, src + ':' + line + ':' + col, err);
  };
  window.addEventListener('unhandledrejection', function (e) {
    console.error('[LinkWords] Unhandled promise:', e.reason);
  });

  // ═══════════════════════════════════════════
  //  MODULE ALIASES (from lw-graph, lw-scoring, lw-i18n, lw-audio)
  // ═══════════════════════════════════════════
  const { buildConnectionSets, getConnections, isConnected, bfs, allPaths,
    generatePuzzle, getDailyNumber, getTodayKey, getDailyTheme,
    getDailyThemeForDay, dateKeyForDay,
    precomputeEndDistances, getGraphDistance, computeReachability, gridBfs,
    DIFFICULTY, DAILY_EPOCH, DAILY_THEMES, mulberry32 } = LW.graph;
  const { calculateScore, getScoreRating, getRatingEmoji, getRatingLabel,
    getLevel, getLevelNumber, getLevelProgress, getLevelTitle,
    XP_PER_LEVEL, XP_DIFFICULTY_MULT, XP_MODE_MULT,
    XP_STREAK_BONUS_PER_DAY, XP_STREAK_BONUS_CAP,
    STREAK_FREEZE_PER_WEEK, CROSS_THEME_BONUS, SAME_THEME_BONUS,
    HINT_PENALTY, UNDO_PENALTY, LEVEL_TITLES } = LW.scoring;
  const { t, getWord, loadLanguagePack, applyI18n, mergeExtraStrings,
    populateLanguageSelect, LANGUAGES } = LW.i18n;
  const { playSound, vibrate, announce, ensureAudio } = LW.audio;

  function getDailyDist(dayNum) {
    const dow = new Date(DAILY_EPOCH + dayNum * 86400000).getUTCDay();
    return (dow >= 5) ? { minDist: 4, maxDist: 5 }
      : (dow >= 3) ? { minDist: 3, maxDist: 4 }
      : { minDist: 2, maxDist: 3 };
  }

  // ═══════════════════════════════════════════
  //  CONFIGURATION (game-only constants)
  // ═══════════════════════════════════════════
  const BLITZ_TIME = 60;
  const BLITZ_WORD_BONUS = 5;
  const BLITZ_ERROR_PENALTY = 3;

  const GROUP_EMOJI = {
    emotions: '🟣', animals: '🟤', nature: '🟢', food: '🟡',
    elements: '🔴', body: '🩷', objects: '⚪', colors: '🔵',
    celestial: '🟠', actions: '⚡', places: '🏠', abstract: '👁',
    warfare: '⚔️', professions: '👷', music: '🎵', mythology: '🏛️'
  };

  const ACHIEVEMENT_CATEGORIES = [
    { id: 'skill', labelKey: 'catSkill', icon: '🎯' },
    { id: 'creativity', labelKey: 'catCreativity', icon: '🧠' },
    { id: 'ritual', labelKey: 'catRitual', icon: '📅' },
    { id: 'exploration', labelKey: 'catExploration', icon: '🗺️' },
    { id: 'social', labelKey: 'catSocial', icon: '👥' }
  ];

  const ACHIEVEMENT_DEFS = [
    { id: 'first',       icon: '👟', nameKey: 'achFirst',       descKey: 'achDescFirst',       cat: 'skill' },
    { id: 'wordsmith',   icon: '✒️', nameKey: 'achWordsmith',   descKey: 'achDescWordsmith',   cat: 'ritual' },
    { id: 'speed',       icon: '⚡', nameKey: 'achSpeed',       descKey: 'achDescSpeed',       cat: 'skill' },
    { id: 'minimalist',  icon: '💎', nameKey: 'achMinimalist',  descKey: 'achDescMinimalist',  cat: 'skill' },
    { id: 'untouchable', icon: '🛡️', nameKey: 'achUntouchable', descKey: 'achDescUntouchable', cat: 'skill' },
    { id: 'marathon',    icon: '🔥', nameKey: 'achMarathon',    descKey: 'achDescMarathon',    cat: 'ritual' },
    { id: 'century',     icon: '👑', nameKey: 'achCentury',     descKey: 'achDescCentury',     cat: 'ritual' },
    { id: 'creative',    icon: '🧠', nameKey: 'achCreative',    descKey: 'achDescCreative',    cat: 'creativity' },
    { id: 'nightOwl',    icon: '🌙', nameKey: 'achNightOwl',    descKey: 'achDescNightOwl',    cat: 'exploration' },
    { id: 'blitzer',     icon: '💥', nameKey: 'achBlitzer',     descKey: 'achDescBlitzer',     cat: 'skill' },
    { id: 'linguist',    icon: '🌍', nameKey: 'achLinguist',    descKey: 'achDescLinguist',    cat: 'exploration' },
    { id: 'perfect3',    icon: '⭐', nameKey: 'achPerfect3',    descKey: 'achDescPerfect3',    cat: 'skill' },
    { id: 'halfCentury', icon: '🏅', nameKey: 'achHalfCentury', descKey: 'achDescHalfCentury', cat: 'ritual' },
    { id: 'veteran',     icon: '🎖️', nameKey: 'achVeteran',     descKey: 'achDescVeteran',     cat: 'ritual' },
    { id: 'mastermind',  icon: '🧩', nameKey: 'achMastermind',  descKey: 'achDescMastermind',  cat: 'skill' },
    { id: 'legend',      icon: '🏆', nameKey: 'achLegend',      descKey: 'achDescLegend',      cat: 'skill' },
    { id: 'streak14',    icon: '💪', nameKey: 'achStreak14',    descKey: 'achDescStreak14',    cat: 'ritual' },
    { id: 'streak30',    icon: '🌟', nameKey: 'achStreak30',    descKey: 'achDescStreak30',    cat: 'ritual' },
    { id: 'blitz10',     icon: '🎯', nameKey: 'achBlitz10',     descKey: 'achDescBlitz10',     cat: 'skill' },
    { id: 'linguist5',   icon: '📚', nameKey: 'achLinguist5',   descKey: 'achDescLinguist5',   cat: 'exploration' },
    { id: 'chain10',     icon: '🔗', nameKey: 'achChain10',     descKey: 'achDescChain10',     cat: 'creativity' },
    { id: 'speedster',   icon: '🚀', nameKey: 'achSpeedster',   descKey: 'achDescSpeedster',   cat: 'skill' },
    { id: 'noUndo',      icon: '✊', nameKey: 'achNoUndo',      descKey: 'achDescNoUndo',      cat: 'skill' },
    { id: 'hardWin',     icon: '💀', nameKey: 'achHardWin',     descKey: 'achDescHardWin',     cat: 'skill' },
    { id: 'explorer',    icon: '🗺️', nameKey: 'achExplorer',    descKey: 'achDescExplorer',    cat: 'exploration' },
    { id: 'polyglotMaster', icon: '🌐', nameKey: 'achPolyglot10', descKey: 'achDescPolyglot10', cat: 'social' },
    { id: 'weeklyChamp',    icon: '🏆', nameKey: 'achWeeklyChamp', descKey: 'achDescWeeklyChamp', cat: 'social' },
    { id: 'totalScore100k', icon: '💰', nameKey: 'achTotalScore100k', descKey: 'achDescTotalScore100k', cat: 'ritual' }
  ];


  // ═══════════════════════════════════════════
  //  PERSONALITY MICROCOPY
  // ═══════════════════════════════════════════
  const MICROCOPY = {
    comboSelect: [
      'Combo!', 'Keep going!', 'Unstoppable!', 'Wow!',
      'Hot streak!', 'Blazing!', 'Machine!'
    ],
    completeMsg: {
      mastermind: ['Flawless!', 'Masterpiece!', 'Incredible!', 'Genius!'],
      architect: ['Impressive!', 'Outstanding!', 'Superb!', 'Bravo!'],
      weaver: ['Well done!', 'Nice work!', 'Solid!', 'Great job!'],
      bridge: ['Good effort!', 'Not bad!', 'Keep it up!', 'You did it!'],
      chain: ['Completed!', 'Done!', 'Finished!', 'You made it!'],
      link: ['Completed!', 'Done!', 'Finished!', 'You made it!'],
      spark: ['Completed!', 'Done!', 'Finished!', 'You made it!']
    }
  };

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ═══════════════════════════════════════════
  //  CONSTANTS
  // ═══════════════════════════════════════════
  const groupColors = { emotions:'#b5179e', animals:'#8d6e63', nature:'#06d6a0', food:'#ffd60a', elements:'#f44336', body:'#e91e8f', objects:'#ffffff', colors:'#4361ee', celestial:'#f8961e', actions:'#ffeb3b', places:'#4cc9f0', abstract:'#7209b7' };

  const COSMETIC_THEMES = [
    { id: 'default', name: 'Default', xpReq: 0 },
    { id: 'midnight', name: 'Midnight', xpReq: 500, vars: { '--bg': '#0a0a1a', '--surface': '#12122a', '--surface2': '#1a1a3a', '--primary': '#6366f1', '--accent': '#818cf8' } },
    { id: 'forest', name: 'Forest', xpReq: 1500, vars: { '--bg': '#0a1a0a', '--surface': '#122a12', '--surface2': '#1a3a1a', '--primary': '#22c55e', '--accent': '#4ade80' } },
    { id: 'sunset', name: 'Sunset', xpReq: 3000, vars: { '--bg': '#1a0a0a', '--surface': '#2a1212', '--surface2': '#3a1a1a', '--primary': '#f97316', '--accent': '#fb923c' } },
    { id: 'ocean', name: 'Ocean', xpReq: 5000, vars: { '--bg': '#0a1a2a', '--surface': '#0d2240', '--surface2': '#122a4a', '--primary': '#0ea5e9', '--accent': '#38bdf8' } },
    { id: 'minimal', name: 'Minimal', xpReq: 8000, vars: { '--bg': '#fafafa', '--surface': '#f0f0f0', '--surface2': '#e5e5e5', '--primary': '#171717', '--accent': '#404040', '--text': '#171717', '--text2': '#525252' } }
  ];

  // ═══════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════
  const state = {
    screen: 'splash',
    prevScreen: null,
    lang: 'en',
    theme: 'dark',
    sound: true,
    haptics: true,
    reduceMotion: false,
    notifications: true,
    highContrast: false,
    showGroups: false,
    cosmeticTheme: 'default',
    mode: null,
    difficulty: 'medium',
    puzzle: null,
    chain: [],
    score: 0,
    runningScore: 0,
    timer: 0,
    timerRef: null,
    hintsLeft: 3,
    hintsUsed: 0,
    tutorialSlide: 0,
    combo: 0,
    comboBonus: 0,
    multiplier: 1,
    lastSelectTime: 0,
    blitzTime: BLITZ_TIME,
    blitzRef: null,
    challengeSeed: null,
    challengeScore: null,
    livesEnabled: false, // permanently disabled
    lives: 0,
    _archiveDay: null,
    stats: {
      played: 0, won: 0, streak: 0, maxStreak: 0,
      totalScore: 0, bestScore: 0, scores: [],
      langsUsed: [], perfectStreak: 0, blitzWins: 0,
      blitzBest: 0, level: 0, xp: 0,
      totalTime: 0, gamesWithTime: 0, bestTime: 0
    },
    achievements: {},
    daily: {},
    wordCollection: {},
    personalRecords: { fastestDaily: 0, highestScore: 0, longestChain: 0, mostCreative: 0 },
    firstTapPredictions: { correct: 0, total: 0 },
    firstRun: true
  };

  // Session-only goal — not persisted to localStorage
  const _sessionGoal = {
    target: 3,
    completed: 0,
    bonusXP: 50 + Math.floor(Math.random() * 51),
    claimed: false,
    bonusRoundTarget: 0,
    bonusRoundCompleted: 0
  };

  function openArchive() {
    const today = getDailyNumber();
    const container = document.createElement('div');
    container.className = 'archive-list';
    const title = document.createElement('h3');
    title.textContent = t('archiveTitle');
    title.className = 'archive-title';
    container.appendChild(title);
    const hint = document.createElement('p');
    hint.className = 'archive-hint';
    hint.textContent = t('archiveNoStreak');
    container.appendChild(hint);
    const list = document.createElement('div');
    list.className = 'archive-grid';

    const daysToShow = Math.min(today, 30);
    for (let i = 1; i <= daysToShow; i++) {
      const dayNum = today - i;
      const dateKey = dateKeyForDay(dayNum);
      const theme = getDailyThemeForDay(dayNum);
      const played = !!state.daily[dateKey];
      const archivePlayed = !!state.daily[`archive_${dayNum}`];

      const row = document.createElement('button');
      row.className = 'archive-row' + (archivePlayed ? ' archive-done' : '');
      row.dataset.day = dayNum;

      const dateLabel = dateKey.slice(5);
      const themeEmojis = theme.groups ? theme.groups.map(g => GROUP_EMOJI[g] || '').join('') : '';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'archive-date';
      dateSpan.textContent = dateLabel;
      const themeSpan = document.createElement('span');
      themeSpan.className = 'archive-theme';
      themeSpan.textContent = `${themeEmojis} ${theme.name}`;
      const statusSpan = document.createElement('span');
      statusSpan.className = 'archive-status';
      statusSpan.textContent = played ? '★' : archivePlayed ? '✓' : '·';
      row.append(dateSpan, themeSpan, statusSpan);

      row.addEventListener('click', () => {
        closeArchivePanel();
        startArchive(dayNum);
      });
      list.appendChild(row);
    }
    container.appendChild(list);

    const overlay = document.createElement('div');
    overlay.id = 'archiveOverlay';
    overlay.className = 'archive-overlay';
    const panel = document.createElement('div');
    panel.className = 'archive-panel';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'archive-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closeArchivePanel);
    panel.appendChild(closeBtn);
    panel.appendChild(container);
    overlay.appendChild(panel);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeArchivePanel(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('archive-visible'));
  }

  function closeArchivePanel() {
    const overlay = document.getElementById('archiveOverlay');
    if (overlay) {
      overlay.classList.remove('archive-visible');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      setTimeout(() => overlay.remove(), 300);
    }
  }

  function startArchive(dayNum) {
    clearGameState();
    clearCeremonyTimers();
    _activeFloaters = 0;
    const cb = document.getElementById('continueBtn');
    if (cb) cb.hidden = true;

    state.mode = 'archive';
    state._archiveDay = dayNum;
    state.chain = [];
    state.chainMultipliers = [];
    state.score = 0;
    state.runningScore = 0;
    state.hintsUsed = 0;
    state.timer = 0;
    state.combo = 0;
    state.comboBonus = 0;
    state.multiplier = 1;
    state.lastSelectTime = 0;
    state.gameOver = false;
    state._usedUndo = false;
    state._undoCount = 0;
    state._lastRank = null;

    const diff = DIFFICULTY[state.difficulty];
    state.hintsLeft = diff.hints;

    state.lives = 0;

    const theme = getDailyThemeForDay(dayNum);
    state.puzzle = generatePuzzle(dayNum, state.difficulty, theme.groups, true, getDailyDist(dayNum));

    if (!state.puzzle) {
      showToast(t('puzzleError') || 'Could not generate puzzle. Try again!');
      showScreen('menu');
      return;
    }

    state.chainSet = new Set();
    state._reachable = new Set(state.puzzle.words);
    precomputeEndDistances(state.puzzle.end);
    renderGame();
    showScreen('game');
    _updateHeaderCache();

    const banner = document.getElementById('challengeBanner');
    if (banner) {
      const dateKey = dateKeyForDay(dayNum);
      banner.textContent = `📅 ${t('archive')} — ${dateKey} · ${theme.name}`;
      banner.hidden = false;
    }

    updateLivesDisplay();
    startTimer(0);
    saveGameState();
  }

  // ═══════════════════════════════════════════
  //  SESSION GOAL
  // ═══════════════════════════════════════════

  function buildSessionDots(done, total) {
    let dots = '';
    for (let i = 0; i < total; i++) {
      dots += i < done ? '●' : '○';
    }
    return dots;
  }

  function incrementSessionGoal() {
    if (_sessionGoal.claimed) {
      // Bonus round mode
      _sessionGoal.bonusRoundCompleted++;
      if (_sessionGoal.bonusRoundCompleted >= _sessionGoal.bonusRoundTarget) {
        _sessionGoal.bonusXP = 50 + Math.floor(Math.random() * 51);
        _sessionGoal.claimed = false;
        _sessionGoal.bonusRoundTarget = 0;
        _sessionGoal.bonusRoundCompleted = 0;
        _sessionGoal.completed = 0;
      }
    } else {
      _sessionGoal.completed = Math.min(_sessionGoal.completed + 1, _sessionGoal.target);
    }
  }

  function claimSessionBonus() {
    if (_sessionGoal.claimed) return 0;
    _sessionGoal.claimed = true;
    const bonus = _sessionGoal.bonusXP;
    state.stats.xp = (state.stats.xp || 0) + bonus;
    state.stats.level = getLevelNumber(state.stats.xp);
    save();
    _sessionGoal.bonusRoundTarget = 2;
    _sessionGoal.bonusRoundCompleted = 0;
    return bonus;
  }

  function updateSessionGoalIndicator() {
    const el = document.getElementById('sessionGoalIndicator');
    if (!el) return;
    const { completed, target, claimed, bonusRoundTarget, bonusRoundCompleted } = _sessionGoal;
    if (claimed && bonusRoundTarget > 0) {
      const rem = bonusRoundTarget - bonusRoundCompleted;
      el.textContent = `${buildSessionDots(bonusRoundCompleted, bonusRoundTarget)} +${t('xp') || 'XP'}`;
      el.setAttribute('aria-label', t('sessionBonusRound')?.replace('{n}', rem) || `${rem} more for another reward!`);
    } else {
      el.textContent = `${buildSessionDots(completed, target)} ${completed}/${target}`;
      el.setAttribute('aria-label', `${t('sessionGoal') || 'Session Goal'}: ${completed}/${target}`);
    }
  }

  function ensureSessionGoalIndicator() {
    if (document.getElementById('sessionGoalIndicator')) {
      updateSessionGoalIndicator();
      return;
    }
    const pill = document.createElement('div');
    pill.id = 'sessionGoalIndicator';
    pill.className = 'session-goal-indicator';
    pill.setAttribute('role', 'status');
    pill.setAttribute('aria-live', 'polite');
    const gameActions = document.getElementById('gameActions');
    if (gameActions) gameActions.parentNode.insertBefore(pill, gameActions);
    updateSessionGoalIndicator();
  }

  function renderSessionGoalSection() {
    const el = document.getElementById('sessionGoalSection');
    if (el) el.remove();
  }

  // ═══════════════════════════════════════════
  //  STORAGE
  // ═══════════════════════════════════════════
  function pruneDailyHistory() {
    const d = new Date(Date.now() - 30 * 86400000);
    const cutoff = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    for (const key of Object.keys(state.daily)) {
      if (key.startsWith('archive_')) continue;
      if (key < cutoff) delete state.daily[key];
    }
  }

  let _saveTimer = null;
  function _saveNow() {
    try {
      localStorage.setItem('lw_stats', JSON.stringify(state.stats));
      localStorage.setItem('lw_daily', JSON.stringify(state.daily));
      localStorage.setItem('lw_achievements', JSON.stringify(state.achievements));
      localStorage.setItem('lw_wordCollection', JSON.stringify(state.wordCollection));
      localStorage.setItem('lw_personalRecords', JSON.stringify(state.personalRecords));
      localStorage.setItem('lw_firstTapPredictions', JSON.stringify(state.firstTapPredictions));
      localStorage.setItem('lw_settings', JSON.stringify({
        lang: state.lang, theme: state.theme,
        sound: state.sound, haptics: state.haptics,
        firstRun: state.firstRun, difficulty: state.difficulty,
        reduceMotion: state.reduceMotion,
        notifications: state.notifications,
        highContrast: state.highContrast,
        showGroups: state.showGroups,
        cosmeticTheme: state.cosmeticTheme,
        livesEnabled: state.livesEnabled
      }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        pruneDailyHistory();
        try {
          localStorage.setItem('lw_stats', JSON.stringify(state.stats));
          localStorage.setItem('lw_daily', JSON.stringify(state.daily));
        } catch (_) {}
      }
    }
    if (window.LinkAuth) window.LinkAuth.schedulePush();
  }
  function save() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(_saveNow, 300);
  }

  let _ceremonyTimers = [];
  function addCeremonyTimer(id) { _ceremonyTimers.push(id); }
  function clearCeremonyTimers() { _ceremonyTimers.forEach(id => clearTimeout(id)); _ceremonyTimers = []; }

  let _saveGameTimer = null;
  function saveGameState() {
    if (!state.puzzle || state.gameOver) {
      localStorage.removeItem('lw_gameState');
      if (_saveGameTimer) { clearTimeout(_saveGameTimer); _saveGameTimer = null; }
      return;
    }
    if (_saveGameTimer) clearTimeout(_saveGameTimer);
    _saveGameTimer = setTimeout(_flushGameState, 300);
  }
  function _flushGameState() {
    _saveGameTimer = null;
    if (!state.puzzle || state.gameOver) return;
    try {
      localStorage.setItem('lw_gameState', JSON.stringify({
        mode: state.mode,
        difficulty: state.difficulty,
        puzzle: state.puzzle,
        chain: state.chain,
        runningScore: state.runningScore,
        timer: state.timer,
        hintsLeft: state.hintsLeft,
        hintsUsed: state.hintsUsed,
        combo: state.combo,
        multiplier: state.multiplier,
        blitzTime: state.blitzTime,
        challengeSeed: state.challengeSeed,
        challengeScore: state.challengeScore,
        _isComeback: state._isComeback || false,
        _comebackStreak: state._comebackStreak || 0,
        livesEnabled: state.livesEnabled,
        lives: state.lives,
        _archiveDay: state._archiveDay || null,
        _undoCount: state._undoCount || 0,
        _usedUndo: state._usedUndo || false,
        ts: Date.now()
      }));
    } catch (_) {}
  }
  function saveGameStateImmediate() {
    if (_saveGameTimer) { clearTimeout(_saveGameTimer); _saveGameTimer = null; }
    _flushGameState();
  }

  function loadGameState() {
    try {
      const raw = localStorage.getItem('lw_gameState');
      if (!raw) return null;
      const gs = JSON.parse(raw);
      if (Date.now() - gs.ts > 86400000) {
        localStorage.removeItem('lw_gameState');
        return null;
      }
      return gs;
    } catch (_) { return null; }
  }

  function clearGameState() {
    localStorage.removeItem('lw_gameState');
  }

  function safeLoad(key, apply) {
    try { const v = JSON.parse(localStorage.getItem(key)); if (v) apply(v); }
    catch (_) {}
  }

  function load() {
    safeLoad('lw_stats', data => {
      if (data && typeof data === 'object') {
        if (Array.isArray(data.scores)) state.stats.scores = data.scores;
        if (Array.isArray(data.langsUsed)) state.stats.langsUsed = data.langsUsed;
        if (data.streakFreezesUsed && typeof data.streakFreezesUsed === 'object') state.stats.streakFreezesUsed = data.streakFreezesUsed;
        if (data.byDifficulty && typeof data.byDifficulty === 'object') state.stats.byDifficulty = data.byDifficulty;
        if (data.byMode && typeof data.byMode === 'object') state.stats.byMode = data.byMode;
        if (typeof data._comebackUsedDate === 'string') state.stats._comebackUsedDate = data._comebackUsedDate;
        if (typeof data._lostStreak === 'number') state.stats._lostStreak = data._lostStreak;
        if (typeof data.lastPlayedDate === 'string') state.stats.lastPlayedDate = data.lastPlayedDate;
        for (const k of ['played','won','streak','maxStreak','totalScore','bestScore','perfectStreak','blitzWins','blitzBest','level','xp','totalTime','gamesWithTime','bestTime','lossesLives']) {
          if (typeof data[k] === 'number' && Number.isFinite(data[k]) && data[k] >= 0) state.stats[k] = Math.min(data[k], 1e9);
        }
      }
    });
    safeLoad('lw_daily', data => {
      if (data && typeof data === 'object') state.daily = data;
    });
    safeLoad('lw_achievements', data => {
      if (data && typeof data === 'object') state.achievements = data;
    });
    safeLoad('lw_wordCollection', data => {
      if (data && typeof data === 'object') state.wordCollection = data;
    });
    safeLoad('lw_personalRecords', data => {
      if (data && typeof data === 'object') Object.assign(state.personalRecords, data);
    });
    safeLoad('lw_firstTapPredictions', data => {
      if (data && typeof data === 'object') Object.assign(state.firstTapPredictions, data);
    });
    safeLoad('lw_settings', data => {
      if (data && typeof data === 'object') {
        const validLangs = ['en','es','it','fr','de','pt','ru','ro','uk','tr','pl','nl','ja','ko','zh','ar','hi','id','th','vi'];
        const validDiffs = ['easy','medium','hard'];
        state.lang = validLangs.includes(data.lang) ? data.lang : 'en';
        state.theme = data.theme === 'light' ? 'light' : 'dark';
        state.sound = data.sound !== false;
        state.haptics = data.haptics !== false;
        state.firstRun = data.firstRun !== false;
        state.difficulty = validDiffs.includes(data.difficulty) ? data.difficulty : 'medium';
        if (typeof data.reduceMotion === 'boolean') state.reduceMotion = data.reduceMotion;
        if (typeof data.notifications === 'boolean') state.notifications = data.notifications;
        if (typeof data.highContrast === 'boolean') state.highContrast = data.highContrast;
        if (typeof data.showGroups === 'boolean') state.showGroups = data.showGroups;
        if (data.cosmeticTheme) state.cosmeticTheme = data.cosmeticTheme;
        state.livesEnabled = false; // lives system removed
      }
    });
    if (state.firstRun) {
      const mqMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mqMotion?.matches) state.reduceMotion = true;
      const mqTheme = window.matchMedia?.('(prefers-color-scheme: light)');
      if (mqTheme?.matches) state.theme = 'light';
      const browserLang = (navigator.language || '').toLowerCase().split('-')[0];
      const supported = LANGUAGES.map(([code]) => code);
      if (supported.includes(browserLang)) state.lang = browserLang;
    }

    const schemaVersion = parseInt(localStorage.getItem('lw_schemaVersion') || '0', 10);
    if (schemaVersion < 3) {
      if (!state.wordCollection) state.wordCollection = {};
      if (!state.stats.langsUsed) state.stats.langsUsed = [];
      if (state.stats.langsUsed.length === 0 && state.stats.played > 0) {
        state.stats.langsUsed = [state.lang || 'en'];
      }
      localStorage.setItem('lw_schemaVersion', '3');
      save();
    }
  }

  // ═══════════════════════════════════════════
  //  SCREEN MANAGEMENT
  // ═══════════════════════════════════════════
  function showScreen(name) {
    const prev = document.querySelector('.screen.active');
    const next = document.getElementById(name);
    if (!next || next === prev) return;

    const modal = document.getElementById('modal');
    if (modal && !modal.hidden) closeModal(false);

    state.prevScreen = state.screen;
    state.screen = name;

    let transType, dur;
    if (name === 'game') { transType = 'game'; dur = 200; }
    else if (name === 'result') { transType = 'result'; dur = 200; }
    else { transType = 'tab'; dur = 150; }

    if (prev) {
      prev.setAttribute('data-transition', transType);
      prev.classList.add('exit');
      prev.classList.remove('active');
      prev.inert = true;
      setTimeout(() => {
        prev.classList.remove('exit');
        prev.removeAttribute('data-transition');
      }, dur);
    }

    next.setAttribute('data-transition', transType);
    next.classList.add('active');
    next.inert = false;
    playSound('click');
    setTimeout(() => next.removeAttribute('data-transition'), dur + 50);

    updateBottomNav(name);
    updateDesktopTopbar(name);

    requestAnimationFrame(() => {
      const target = next.querySelector('h2, h1, button:not([hidden]):not([disabled])');
      if (target) target.focus();
    });

    if (state.prevScreen === 'game' && name !== 'game') {
      stopTimer();
      stopBlitz();
      clearCeremonyTimers();
    }

    if (name !== 'result' && state._nextDailyInterval) {
      clearInterval(state._nextDailyInterval);
      state._nextDailyInterval = null;
    }
    if (name !== 'menu' && _dailyCountdownInterval) {
      clearInterval(_dailyCountdownInterval);
      _dailyCountdownInterval = null;
    }

    if (name === 'stats') { renderStats(); renderAchievements(); renderLeaderboard(); renderWeeklyRecap(); }
    if (name === 'collection') renderCollection();
    if (name === 'settings') {
      syncSettings();
      if (window.LinkAuth && !window.LinkAuth._initialized) window.LinkAuth.init();
    }
    if (name === 'game') ensureSessionGoalIndicator();
    if (name === 'menu') {
      renderStreakCalendar();
      populateMenuMasthead();
      const cb = document.getElementById('continueBtn');
      if (cb) cb.hidden = !loadGameState();
      updateMenuLevel();
      updateComebackBanner();
      updateDailyButton();
      updateBonusButton();
      updateDailyRings();
      updateThemeSubtitle();
      applySeasonalEvent();
      const played = state.stats?.played || 0;
      const dailyCount = Object.keys(state.daily).filter(k => !k.startsWith('archive_')).length;
      const unlocked = JSON.parse(localStorage.getItem('lw_modeUnlocks') || '{}');
      const practiceBtn = document.querySelector('[data-action="startEndless"]');
      if (practiceBtn) {
        const show = dailyCount >= 1;
        practiceBtn.hidden = !show;
        if (show && !unlocked.practice) { unlocked.practice = true; localStorage.setItem('lw_modeUnlocks', JSON.stringify(unlocked)); }
      }
      const blitzBtn = document.getElementById('blitzBtn');
      if (blitzBtn) {
        const show = dailyCount >= 3;
        blitzBtn.hidden = !show;
        if (show && !unlocked.blitz) { unlocked.blitz = true; localStorage.setItem('lw_modeUnlocks', JSON.stringify(unlocked)); }
      }
      const archiveBtn = document.getElementById('archiveBtn');
      if (archiveBtn) {
        const show = played >= 5;
        archiveBtn.hidden = !show;
        if (show && !unlocked.archive) { unlocked.archive = true; localStorage.setItem('lw_modeUnlocks', JSON.stringify(unlocked)); }
      }
      const weeklyTrialBtn = document.getElementById('weeklyTrialBtn');
      if (weeklyTrialBtn) weeklyTrialBtn.hidden = played < 10;
      const wordRushBtn = document.getElementById('wordRushBtn');
      if (wordRushBtn) wordRushBtn.hidden = played < 7;
      const diffSel = document.getElementById('difficultySelector');
      if (diffSel) diffSel.hidden = false;
      updateNextPuzzlePreview();
    }

    if (window.LinkAds) {
      if (name === 'menu' || name === 'result') {
        window.LinkAds.showBanner();
      } else {
        window.LinkAds.hideBanner();
      }
    }

    if (name !== 'splash' && !state._isPopState) {
      history.pushState({ screen: name }, '', '');
    }
    state._isPopState = false;
  }

  function updateBottomNav(screenName) {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;
    const hideNav = screenName === 'game' || screenName === 'result' || screenName === 'splash';
    nav.classList.toggle('hidden', hideNav);
    const tabMap = { menu: 'menu', stats: 'stats', settings: 'settings', collection: 'collection', howto: 'menu', privacyManager: 'settings' };
    const activeNav = tabMap[screenName] || '';
    nav.querySelectorAll('.nav-tab').forEach(tab => {
      const isActive = tab.dataset.nav === activeNav;
      tab.classList.toggle('active', isActive);
      if (isActive) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function updateDesktopTopbar(screenName) {
    const bar = document.getElementById('desktopTopbar');
    if (!bar) return;
    const hideBar = screenName === 'splash';
    bar.style.display = hideBar ? 'none' : '';
    const navMap = { menu: 'menu', stats: 'stats', collection: 'collection', howto: 'howto', settings: 'settings', game: 'menu', result: 'menu' };
    const activeNav = navMap[screenName] || 'menu';
    bar.querySelectorAll('.desktop-topbar-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.nav === activeNav);
    });
    const sc = document.getElementById('desktopStreakCount');
    if (sc) sc.textContent = state.streak || 0;
  }

  let _dailyCountdownInterval = null;
  function updateDailyButton() {
    const btn = document.querySelector('[data-action="startDaily"]');
    if (!btn) return;
    const done = !!state.daily[getTodayKey()];
    btn.classList.toggle('daily-done', done);
    btn.disabled = done;
    const label = btn.querySelector('[data-i18n="play"]') || btn.querySelector('[data-i18n="daily"]') || btn.querySelector('[data-i18n="playTodaysPath"]');
    if (label) {
      if (done) {
        const entry = state.daily[getTodayKey()];
        const rating = getScoreRating(entry.score || 0);
        const rLabel = getRatingLabel(rating);
        label.innerHTML = `${t('daily') || 'Daily'} ✓ <span class="daily-inline-score">${(entry.score || 0).toLocaleString()} · ${rLabel}</span>`;
        btn.setAttribute('aria-label', `${t('dailyComplete') || 'Daily completed'} — ${entry.score || 0} pts`);
      } else {
        label.textContent = t('playTodaysPath') || t('play') || 'Play today\'s path';
        btn.removeAttribute('aria-label');
      }
    }

    const practiceBtn = document.querySelector('[data-action="startEndless"]');
    if (practiceBtn) practiceBtn.classList.toggle('btn-promoted', done);

    updateDailyCountdown(done);
  }

  function updateDailyCountdown(done) {
    if (!done) {
      if (_dailyCountdownInterval) { clearInterval(_dailyCountdownInterval); _dailyCountdownInterval = null; }
      return;
    }
    const btn = document.querySelector('[data-action="startDaily"]');
    if (!btn) return;
    const label = btn.querySelector('[data-i18n="daily"]') || btn.querySelector('[data-i18n="playTodaysPath"]');
    if (!label) return;
    function tick() {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      label.textContent = `${t('daily') || 'Daily'} ✓  ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    tick();
    if (_dailyCountdownInterval) clearInterval(_dailyCountdownInterval);
    _dailyCountdownInterval = setInterval(tick, 1000);
  }

  function updateBonusButton() {
    const btn = document.getElementById('bonusBtn');
    if (!btn) return;
    const todayEntry = state.daily[getTodayKey()];
    if (!todayEntry || state.daily[getTodayKey() + '_bonus']) {
      btn.hidden = true;
      return;
    }
    const completedAt = todayEntry.completedAt || 0;
    const elapsed = Date.now() - completedAt;
    const BONUS_DELAY = 4 * 3600 * 1000;
    btn.hidden = elapsed < BONUS_DELAY;
  }

  function startBonusPuzzle() {
    const dayNum = getDailyNumber();
    const seed = dayNum * 1000 + 777;
    const theme = getDailyTheme();
    state.mode = 'bonus';
    state._savedDifficulty = state.difficulty;
    state.difficulty = 'easy';
    const distOverride = { minDist: 2, maxDist: 3 };
    const puzzle = generatePuzzle(seed, 'easy', theme.groups, false, distOverride);
    if (!puzzle) { showToast('Could not generate bonus puzzle'); return; }
    puzzle.words = puzzle.words.slice(0, 6);
    state.puzzle = puzzle;
    state.chain = [];
    state.chainSet = new Set();
    state.score = 0;
    state.runningScore = 0;
    state.timer = 0;
    state.combo = 0;
    state.multiplier = 1;
    state.hintsLeft = 1;
    state.hintsUsed = 0;
    state.gameOver = false;
    state._undoCount = 0;
    precomputeEndDistances(puzzle.end);
    state._reachable = computeReachability(puzzle, state.chainSet);
    showScreen('game');
    renderGame();
    updateChainDisplay();
    updateGrid();
    updateActions();
    startTimer(0);
  }

  const THEME_SUBTITLES = {
    'Nature Walk':  ['The forest is full of surprises', 'Let the wind guide you', 'Every leaf tells a story', 'Walk among the giants', 'Nature never hurries'],
    'Mind Palace':  ['Explore the depths within', 'Where thoughts become paths', 'A labyrinth of meaning', 'The mind holds infinite rooms', 'Think beyond the obvious'],
    'Kingdom':      ['A realm of hidden connections', 'Bow to the king of words', 'Every castle needs a path', 'Kingdoms rise on strong links', 'Rule the word grid'],
    'Elements':     ['Fire and ice collide', 'The cosmos awaits your path', 'Stars align for the bold', 'Harness the power of elements', 'Light pierces the darkness'],
    'Free Play':    ['No rules, just connections', 'The whole world is your grid', 'Go wherever your mind wanders', 'Pure creativity awaits', 'All paths are possible'],
    'Heart & Soul': ['Feel the rhythm of words', 'Where emotion meets logic', 'Let your heart lead the way', 'Soul connections run deep', 'The heart knows the shortest path'],
    'Wild World':   ['Creatures great and small', 'The wild calls your name', 'Every beast has its bond', 'Untamed and unpredictable', 'The jungle whispers secrets']
  };

  function updateThemeSubtitle() {
    const el = document.getElementById('themeSubtitle');
    if (!el) return;
    const theme = getDailyTheme();
    const subs = THEME_SUBTITLES[theme.name] || THEME_SUBTITLES['Free Play'];
    const dayNum = getDailyNumber();
    el.textContent = `${theme.name} — ${subs[dayNum % subs.length]}`;
  }

  function updateDailyRings() {
    const container = document.getElementById('dailyRings');
    if (!container) return;
    const todayKey = getTodayKey();
    const todayEntry = state.daily[todayKey];
    const hasCrossTheme = !!(state._todayCrossTheme || todayEntry?.crossTheme);
    const hasExtra = Object.keys(state.daily).some(k =>
      k.startsWith(todayKey) && (k.endsWith('_bonus') || state.daily[k]?.mode === 'endless' || state.daily[k]?.mode === 'blitz')
    ) || (state.stats._todayExtra);

    const ringDaily = document.getElementById('ringDaily');
    const ringCross = document.getElementById('ringCross');
    const ringExtra = document.getElementById('ringExtra');

    ringDaily?.classList.toggle('done', !!todayEntry);
    ringCross?.classList.toggle('done', hasCrossTheme);
    ringExtra?.classList.toggle('done', !!hasExtra);

    const allDone = !!todayEntry && hasCrossTheme && !!hasExtra;
    container.classList.toggle('all-done', allDone);

    if (allDone && !state._ringsClaimedToday) {
      state._ringsClaimedToday = true;
      const ringsXP = 100;
      state.stats.xp = (state.stats.xp || 0) + ringsXP;
      state.stats.level = getLevelNumber(state.stats.xp);
      save();
      // rings complete toast — silent (XP still awarded)
    }
  }

  function updateNextPuzzlePreview() {
    const el = document.getElementById('nextPuzzlePreview');
    if (!el) return;
    el.hidden = true;
    return;
    const todayDone = !!state.daily[getTodayKey()];
    if (!todayDone) { el.hidden = true; return; }
    const tomorrowNum = getDailyNumber() + 1;
    if (!state._tomorrowCache || state._tomorrowCache.day !== tomorrowNum) {
      const theme = getDailyThemeForDay(tomorrowNum);
      const puzzle = generatePuzzle(tomorrowNum, 'medium', theme.groups, true, getDailyDist(tomorrowNum));
      state._tomorrowCache = { day: tomorrowNum, theme, puzzle };
    }
    const { theme, puzzle } = state._tomorrowCache;
    if (puzzle) {
      el.hidden = false;
      el.textContent = `${t('tomorrow') || 'Tomorrow'}: ${theme.name} · ${getWord(puzzle.start)} → ${getWord(puzzle.end)}`;
    } else {
      el.hidden = true;
    }
  }

  // ═══════════════════════════════════════════
  //  STREAK TIER HELPER
  // ═══════════════════════════════════════════
  function getStreakTier(streak) {
    if (streak >= 100) return { key: 'mythic',  labelKey: 'tierMythic',    icon: '💎', cssClass: 'tier-mythic' };
    if (streak >= 30)  return { key: 'golden',  labelKey: 'tierGolden',    icon: '🌟', cssClass: 'tier-golden' };
    if (streak >= 7)   return { key: 'hot',     labelKey: 'tierHot',       icon: '🔥', cssClass: 'tier-hot' };
    if (streak >= 1)   return { key: 'basic',   labelKey: null,             icon: '🔗', cssClass: 'tier-basic' };
    return null;
  }

  function getDailyCycleBonus(streak) {
    if (streak <= 0) return 0;
    const dayInCycle = ((streak - 1) % 7) + 1;
    return [10, 15, 20, 30, 40, 50, 100][dayInCycle - 1] || 10;
  }

  // ═══════════════════════════════════════════
  //  STREAK CALENDAR
  // ═══════════════════════════════════════════
  function renderStreakCalendar() {
    const strip = document.getElementById('streakStrip');
    if (!strip) return;
    strip.innerHTML = '';

    const today = new Date();
    const dayNames = ['S','M','T','W','T','F','S'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
      const played = !!state.daily[key];
      const isToday = i === 0;

      const el = document.createElement('div');
      el.className = 'streak-day';
      if (played) el.classList.add('played');
      if (isToday) el.classList.add('today');
      if (!played && !isToday) el.classList.add('missed');
      el.setAttribute('role', 'img');
      const dayLabel = dayNames[d.getDay()];
      const statusLabel = isToday ? (played ? 'today, played' : 'today') : (played ? 'played' : '');
      el.setAttribute('aria-label', `${dayLabel} ${d.getDate()}${statusLabel ? ', ' + statusLabel : ''}`);

      const label = document.createElement('span');
      label.className = 'day-label';
      label.textContent = dayLabel;

      const num = document.createElement('span');
      num.textContent = d.getDate();

      el.appendChild(label);
      el.appendChild(num);
      if (played && state.daily[key]) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          const entry = state.daily[key];
          const recap = `${dayLabel} ${d.getDate()}: ${entry.score || 0} pts · ${formatTime(entry.time || 0)} · ${entry.chain || 0} ${t('words') || 'words'}`;
          showToast(recap);
        });
      }
      strip.appendChild(el);
    }

    if (state.stats.streak > 0) {
      const s = state.stats.streak;
      const fire = document.createElement('div');
      fire.className = 'streak-fire';
      if (s >= 100) fire.classList.add('streak-mythic');
      else if (s >= 30) fire.classList.add('streak-golden');
      else if (s >= 7) fire.classList.add('streak-hot');
      const fireIcon = document.createElement('span');
      fireIcon.textContent = s >= 100 ? '💎' : s >= 30 ? '🌟' : s >= 7 ? '🔥' : '🔗';
      const fireCount = document.createElement('span');
      fireCount.textContent = s;
      fire.appendChild(fireIcon);
      fire.appendChild(fireCount);
      strip.appendChild(fire);
    }

    const freezesLeft = getStreakFreezesLeft();
    if (freezesLeft > 0 && state.stats.streak >= 2) {
      const freeze = document.createElement('div');
      freeze.className = 'streak-freeze-badge';
      freeze.textContent = `🛡️×${freezesLeft}`;
      freeze.title = 'Streak freeze available';
      strip.appendChild(freeze);
    }

    // Streak tier badge — hidden for cleaner menu
    // Weekly cycle indicator — hidden for cleaner menu
  }

  // ═══════════════════════════════════════════
  //  STREAK FREEZE
  // ═══════════════════════════════════════════
  function getWeekStart() {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  function getStreakFreezesLeft() {
    const weekKey = getWeekStart();
    const used = state.stats.streakFreezesUsed || {};
    return STREAK_FREEZE_PER_WEEK - (used[weekKey] || 0);
  }

  function useStreakFreeze() {
    const weekKey = getWeekStart();
    if (!state.stats.streakFreezesUsed) state.stats.streakFreezesUsed = {};
    state.stats.streakFreezesUsed[weekKey] = (state.stats.streakFreezesUsed[weekKey] || 0) + 1;
    const old = Object.keys(state.stats.streakFreezesUsed);
    if (old.length > 4) {
      const sorted = old.sort();
      for (let i = 0; i < sorted.length - 4; i++) delete state.stats.streakFreezesUsed[sorted[i]];
    }
    showToast(`🛡️ ${t('streakFreezeUsed') || 'Streak freeze used!'}`, 'milestone');
  }

  // ═══════════════════════════════════════════
  //  COMEBACK CHALLENGE
  // ═══════════════════════════════════════════
  function getYesterdayKey() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  }

  function checkComebackEligible() {
    const todayKey = getTodayKey();
    const yKey = getYesterdayKey();
    if (state.daily[todayKey]) return false;
    if (state.daily[yKey]) return false;
    if ((state.stats._lostStreak || 0) < 1) return false;
    if (state.stats._comebackUsedDate === todayKey) return false;
    if (state.stats._comebackWeekCount >= 3) {
      const lastDate = state.stats._comebackUsedDate || '';
      const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate + 'T00:00:00Z').getTime()) / 86400000) : 999;
      if (daysSince < 7) return false;
      state.stats._comebackWeekCount = 0;
    }
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    const tdaKey = `${twoDaysAgo.getUTCFullYear()}-${String(twoDaysAgo.getUTCMonth()+1).padStart(2,'0')}-${String(twoDaysAgo.getUTCDate()).padStart(2,'0')}`;
    if (!state.daily[tdaKey]) return false;
    return true;
  }

  function updateComebackBanner() {
    const banner = document.getElementById('comebackBanner');
    if (!banner) return;
    const eligible = checkComebackEligible();
    banner.hidden = !eligible;
    banner.style.display = eligible ? 'flex' : 'none';
    if (eligible) {
      const title = document.getElementById('comebackTitle');
      const desc = document.getElementById('comebackDesc');
      const btn = document.getElementById('comebackBtn');
      if (title) title.textContent = t('comebackTitle') || 'Save your streak!';
      if (desc) desc.textContent = (t('comebackDesc') || 'Complete yesterday\'s puzzle to recover your streak').replace('{streak}', state.stats._lostStreak || 0);
      if (btn) btn.textContent = t('comebackPlay') || 'Play';
    }
  }

  function checkWelcomeBack() {
    const card = document.getElementById('welcomeBackCard');
    if (!card) return;
    const lastDate = state.stats.lastPlayedDate;
    if (!lastDate) { card.hidden = true; return; }
    const last = new Date(lastDate + 'T00:00:00Z');
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const diff = Math.floor((today - last.getTime()) / 86400000);
    if (diff < 2) { card.hidden = true; return; }
    card.hidden = false;
    const greeting = document.getElementById('wbGreeting');
    const stats = document.getElementById('wbStats');
    if (greeting) greeting.textContent = t('wbGreeting') || 'Welcome back!';
    if (stats) {
      const words = Object.keys(window.WORD_DATA?.concepts || {}).length;
      const lvl = getLevelNumber(state.stats.xp);
      const title = getLevelTitle(lvl);
      const achCount = Object.keys(state.achievements).filter(k => state.achievements[k]).length;
      stats.textContent = `${words} ${t('words') || 'words'} · Lv.${lvl} ${title} · ${achCount} ${t('achievements') || 'achievements'}`;
    }
  }

  function startComebackChallenge() {
    const comebackBanner = document.getElementById('comebackBanner');
    if (comebackBanner) comebackBanner.hidden = true;
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yDailyNum = Math.floor((Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()) - DAILY_EPOCH) / 86400000);
    const yTheme = DAILY_THEMES[yDailyNum % DAILY_THEMES.length];
    state._isComeback = true;
    state._comebackStreak = state.stats._lostStreak || 0;
    state.mode = 'daily';
    state.chain = [];
    state.score = 0;
    state.runningScore = 0;
    state.hintsUsed = 0;
    state.timer = 0;
    state.combo = 0;
    state.comboBonus = 0;
    state.multiplier = 1;
    state.lastSelectTime = 0;
    state.gameOver = false;
    state._usedUndo = false;
    state._undoCount = 0;
    state._lastRank = null;
    const diff = DIFFICULTY[state.difficulty];
    state.hintsLeft = diff.hints;
    state.puzzle = generatePuzzle(yDailyNum, state.difficulty, yTheme.groups, true, getDailyDist(yDailyNum));
    if (!state.puzzle) { showToast(t('noConnection')); return; }
    state.chainSet = new Set();
    state._reachable = new Set(state.puzzle.words);
    precomputeEndDistances(state.puzzle.end);
    renderGame();
    showScreen('game');
    startTimer();
    const banner = document.getElementById('challengeBanner');
    if (banner) {
      banner.textContent = `🛡️ ${t('comebackTitle') || 'Save your streak!'}`;
      banner.hidden = false;
    }
  }

  // ═══════════════════════════════════════════
  //  SEASONAL EVENTS
  // ═══════════════════════════════════════════
  const SEASONAL_EVENTS = [
    { id:'valentine', start:[2,1], end:[2,14], name:'Valentine\'s Edition', emoji:'💕', groups:['emotions','body','abstract'], css:'seasonal-valentine' },
    { id:'spring', start:[3,20], end:[4,5], name:'Spring Bloom', emoji:'🌸', groups:['nature','animals','colors'], css:'seasonal-spring' },
    { id:'summer', start:[6,21], end:[7,7], name:'Summer Solstice', emoji:'☀️', groups:['celestial','nature','elements'], css:'seasonal-summer' },
    { id:'halloween', start:[10,25], end:[10,31], name:'Halloween', emoji:'🎃', groups:['abstract','emotions','elements'], css:'seasonal-halloween' },
    { id:'winter', start:[12,20], end:[1,3], name:'Winter Wonderland', emoji:'❄️', groups:['elements','celestial','nature'], css:'seasonal-winter' }
  ];

  function getActiveEvent() {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    for (const ev of SEASONAL_EVENTS) {
      const [sm, sd] = ev.start;
      const [em, ed] = ev.end;
      if (em < sm) {
        if ((m > sm || (m === sm && d >= sd)) || (m < em || (m === em && d <= ed))) return ev;
      } else {
        if ((m > sm || (m === sm && d >= sd)) && (m < em || (m === em && d <= ed))) return ev;
      }
    }
    return null;
  }

  function applySeasonalEvent() {
    const ev = getActiveEvent();
    const app = document.getElementById('app');
    SEASONAL_EVENTS.forEach(e => app.classList.remove(e.css));
    const banner = document.getElementById('seasonalBanner');
    if (ev) {
      app.classList.add(ev.css);
      if (banner) {
        banner.textContent = `${ev.emoji} ${ev.name}`;
        banner.hidden = false;
      }
    } else if (banner) {
      banner.hidden = true;
    }
    return ev;
  }

  // ═══════════════════════════════════════════
  //  DAILY PUZZLE COMMENTARY
  // ═══════════════════════════════════════════
  const DAILY_FACTS = {
    emotions: ['Emotions shape our word associations more than logic does.', 'The word "emotion" comes from Latin "emovere" — to move out.'],
    animals: ['Humans have used animal metaphors since the earliest languages.', 'Many idioms across cultures reference the same animals.'],
    nature: ['Nature vocabulary is among the oldest in every language.', 'Words for water exist in every known language.'],
    food: ['Food-related words are among the most borrowed between languages.', 'The word "restaurant" is used in over 100 languages.'],
    elements: ['Ancient cultures organized knowledge around four or five elements.', 'Element words connect across nearly every language family.'],
    body: ['Body part words are among the most stable across language evolution.', 'The word "heart" appears in idioms in virtually every language.'],
    objects: ['Object names often reveal how past cultures interacted with things.', 'Tool words are some of the oldest preserved in any language.'],
    colors: ['Languages develop color words in a predictable order: black, white, red, then others.', 'Some languages have no word for "blue" — they group it with green.'],
    celestial: ['Star names are among the most ancient words still in use today.', 'Many months and days are named after celestial bodies.'],
    actions: ['Verbs of motion are universal — every language has words for go, come, take.', 'Action words form the backbone of any language\'s grammar.'],
    places: ['Place names often preserve extinct languages.', 'The most common place-name element worldwide means "water" or "river".'],
    abstract: ['Abstract thinking in language emerged around 70,000 years ago.', 'Abstract words activate different brain regions than concrete ones.']
  };

  function getDailyCommentary() {
    if (state.lang !== 'en') return null;
    const theme = getDailyTheme();
    if (!theme.groups) return null;
    const group = theme.groups[getDailyNumber() % theme.groups.length];
    const facts = DAILY_FACTS[group];
    if (!facts) return null;
    return facts[getDailyNumber() % facts.length];
  }

  // ═══════════════════════════════════════════
  //  DAILY QUESTS
  // ═══════════════════════════════════════════
  const QUEST_POOL = [
    { id: 'noHint', key: 'questNoHint', check: () => state.hintsUsed === 0 },
    { id: 'crossTheme', key: 'questCrossTheme', check: () => {
      const c = window.WORD_DATA?.concepts; let ct = 0;
      for (let i = 0; i < state.chain.length - 1; i++) if (c[state.chain[i]]?.g !== c[state.chain[i+1]]?.g) ct++;
      return ct >= 3;
    }},
    { id: 'under90', key: 'questUnder90', check: () => state.timer <= 90 },
    { id: 'noUndo', key: 'questNoUndo', check: () => (state._undoCount || 0) === 0 },
    { id: 'optimal', key: 'questOptimal', check: () => state.chain.length <= (state.puzzle?.optimal || 99) }
  ];

  function getDailyQuests() {
    const seed = getDailyNumber();
    const rng = mulberry32(seed * 7919);
    const shuffled = QUEST_POOL.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }

  function checkDailyQuests() {
    if (state.mode !== 'daily') return [];
    const quests = getDailyQuests();
    const completed = [];
    for (const q of quests) {
      if (q.check()) completed.push(q);
    }
    return completed;
  }

  // ═══════════════════════════════════════════
  //  MILESTONE NOTIFICATIONS
  // ═══════════════════════════════════════════
  function checkMilestoneNotifications() {
    if (!state.notifications || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const s = state.stats;
    const milestones = [
      { check: s.streak === 6 && s.maxStreak >= 6, msg: `🔥 6-day streak! One more for the Marathon badge!` },
      { check: s.streak === 13, msg: `🔥 13-day streak! Tomorrow you unlock the 14-Day badge!` },
      { check: s.streak === 29, msg: `🌟 29-day streak! One more day for the legendary 30-Day badge!` },
      { check: s.played === 49, msg: `🏅 49 games played! One more for the Half Century badge!` },
      { check: s.played === 99, msg: `👑 99 games! One more for the Century badge!` },
      { check: s.blitzWins === 9, msg: `💥 9 Blitz wins! One more for Blitz Pro!` }
    ];
    const triggered = milestones.find(m => m.check);
    if (triggered && state._lastMilestoneMsg !== triggered.msg) {
      state._lastMilestoneMsg = triggered.msg;
      scheduleLocalNotification(triggered.msg);
    }
  }

  function scheduleLocalNotification(msg) {
    if (Notification.permission === 'granted') {
      setTimeout(() => {
        try { new Notification('LinkWords', { body: msg, icon: '/icons/icon-192.svg', badge: '/icons/icon-192.svg' }); } catch (_) {}
      }, 2000);
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function scheduleDailyReminder() {
    if (!state.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const todayKey = getTodayKey();
    if (state.daily[todayKey]?.done) return;
    const lastNotif = localStorage.getItem('lw_lastNotif');
    if (lastNotif === todayKey) return;
    const hour = now.getHours();
    if (hour >= 18 && hour <= 22) {
      localStorage.setItem('lw_lastNotif', todayKey);
      new Notification('LinkWords', {
        body: t('dailyReminder') || "Today's puzzle is waiting for you!",
        icon: '/icons/icon-192.svg',
        tag: 'daily-reminder'
      });
    }
  }

  // ═══════════════════════════════════════════
  //  SHARE CARD (Canvas)
  // ═══════════════════════════════════════════
  function generateShareCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 600, 400);

    const grad = ctx.createLinearGradient(0, 0, 600, 0);
    grad.addColorStop(0, '#7209b7');
    grad.addColorStop(1, '#4361ee');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    const num = state.mode === 'daily' ? ` #${getDailyNumber()}` : state.mode === 'archive' && state._archiveDay != null ? ` #${state._archiveDay}` : '';
    ctx.fillText(`LinkWords${num}`, 30, 50);

    ctx.fillStyle = '#a0a0b0';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    const theme = state.mode === 'daily' ? getDailyTheme().name : state.mode === 'archive' && state._archiveDay != null ? `📅 ${getDailyThemeForDay(state._archiveDay).name}` : (state.mode === 'blitz' ? (t('blitz') || 'Blitz') : (t('endless') || 'Endless'));
    ctx.fillText(theme, 30, 76);

    const rating = getScoreRating(state.score);
    const ratingColors = { perfect: '#ffd60a', excellent: '#f8961e', great: '#06d6a0', good: '#4cc9f0', ok: '#a0a0b0' };
    ctx.fillStyle = ratingColors[rating] || '#ffffff';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.score}`, 300, 145);

    ctx.fillStyle = '#a0a0b0';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${state.chain.length} words · ${formatTime(state.timer)}`, 300, 172);

    const concepts = window.WORD_DATA.concepts;
    const chainY = 210;
    const maxDisplay = Math.min(state.chain.length, 8);
    const cellW = Math.min(60, (540 / maxDisplay));
    const startX = 300 - (maxDisplay * cellW) / 2;

    for (let i = 0; i < maxDisplay; i++) {
      const c = state.chain[i];
      const g = concepts[c]?.g || 'abstract';
      ctx.fillStyle = groupColors[g] || '#7209b7';
      ctx.globalAlpha = 0.85;
      const rx = startX + i * cellW;
      roundRect(ctx, rx, chainY, cellW - 4, 34, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      const emoji = GROUP_EMOJI[g] || '⚪';
      ctx.fillText(emoji, rx + (cellW - 4) / 2, chainY + 24);
    }
    if (state.chain.length > 8) {
      ctx.fillStyle = '#a0a0b0';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`+${state.chain.length - 8} more`, 300, chainY + 56);
    }

    ctx.textAlign = 'left';
    const infoY = 300;
    if (state.stats.streak > 0) {
      const cardTier = getStreakTier(state.stats.streak);
      const cardTierLabel = cardTier && cardTier.labelKey ? ` · ${t(cardTier.labelKey)}` : '';
      ctx.fillStyle = '#f8961e';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(`🔥 ${state.stats.streak}-day streak${cardTierLabel}`, 30, infoY);
    }
    ctx.fillStyle = '#4cc9f0';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Lv.${state.stats.level || 1} ${getLevelTitle(state.stats.level || 1)}`, 570, infoY);

    ctx.fillStyle = '#555';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('linkwords.app', 300, 380);

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function shareCardImage() {
    const canvas = generateShareCard();
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'linkwords.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'LinkWords', text: 'linkwords.app' });
      } else {
        shareResult();
      }
    } catch (_) {
      shareResult();
    }
  }

  // ═══════════════════════════════════════════
  //  PERSONAL BEST THEATER
  // ═══════════════════════════════════════════
  function playPersonalBestTheater() {
    const container = document.getElementById('resultChain');
    if (!container) return;
    const nodes = container.querySelectorAll('.chain-node');
    nodes.forEach((node, i) => {
      node.style.opacity = '0';
      node.style.transform = 'scale(0.5)';
      setTimeout(() => {
        node.style.transition = 'opacity 0.3s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
        node.style.opacity = '1';
        node.style.transform = 'scale(1)';
        if (i === nodes.length - 1) {
          setTimeout(() => spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 20, ['#ffd60a', '#f8961e', '#ff6b35']), 300);
        }
      }, 200 + i * 150);
    });
    const arrows = container.querySelectorAll('.chain-arrow');
    arrows.forEach((arrow, i) => {
      arrow.style.opacity = '0';
      setTimeout(() => {
        arrow.style.transition = 'opacity 0.2s';
        arrow.style.opacity = '1';
      }, 280 + i * 150);
    });
  }

  // ═══════════════════════════════════════════
  //  GAME FLOW
  // ═══════════════════════════════════════════
  function startGame(mode) {
    clearGameState();
    clearCeremonyTimers();
    _activeFloaters = 0;
    const cb = document.getElementById('continueBtn');
    if (cb) cb.hidden = true;
    state.mode = mode;
    state.chain = [];
    state.chainMultipliers = [];
    state.score = 0;
    state.runningScore = 0;
    state.hintsUsed = 0;
    state.timer = 0;
    state.combo = 0;
    state.comboBonus = 0;
    state.multiplier = 1;
    state.lastSelectTime = 0;
    state.gameOver = false;
    state._usedUndo = false;
    state._undoCount = 0;
    state._lastRank = null;
    state._trialRule = null;
    state._rushMode = false;
    if (state._nextDailyInterval) {
      clearInterval(state._nextDailyInterval);
      state._nextDailyInterval = null;
    }

    if (!DIFFICULTY[state.difficulty]) state.difficulty = 'medium';
    const diff = DIFFICULTY[state.difficulty];
    state.hintsLeft = diff.hints;
    state._archiveDay = null;
    state.lives = 0;

    function makeSeed() { return (Date.now() & 0x7FFFFFFF) ^ ((Math.random() * 0x7FFFFFFF) | 0); }

    if (mode === 'daily') {
      const todayKey = getTodayKey();
      if (state.daily[todayKey]) {
        showToast(t('dailyComplete'));
        return;
      }
      const theme = getDailyTheme();
      const dayNum = getDailyNumber();
      state.puzzle = generatePuzzle(dayNum, state.difficulty, theme.groups, true, getDailyDist(dayNum));
    } else if (mode === 'blitz') {
      state.blitzTime = BLITZ_TIME;
      state.puzzle = generatePuzzle(makeSeed(), state.difficulty);
    } else {
      const seed = state.challengeSeed || makeSeed();
      const challengeDiff = state._challengeDifficulty || state.difficulty;
      state.puzzle = generatePuzzle(seed, challengeDiff);
      state._challengeDifficulty = null;
    }

    if (!state.puzzle) {
      showToast(t('puzzleError') || 'Could not generate puzzle. Try again!');
      showScreen('menu');
      return;
    }

    state.chainSet = new Set();
    state._reachable = new Set(state.puzzle.words);
    precomputeEndDistances(state.puzzle.end);
    renderGame();
    showScreen('game');
    _updateHeaderCache();

    const DOW_PALETTE = ['sun-gold','moon-silver','earth-green','sky-blue','fire-red','ocean-teal','star-purple'];
    const gameRoot = document.getElementById('game');
    if (gameRoot) {
      const dow = new Date().getUTCDay();
      gameRoot.setAttribute('data-dow-palette', DOW_PALETTE[dow]);
    }

    const THEME_PALETTE_MAP = {
      'Nature Walk': 'nature-walk', 'Mind Palace': 'mind-palace',
      'Kingdom': 'kingdom', 'Elements': 'elements',
      'Heart & Soul': 'heart-soul', 'Wild World': 'wild-world'
    };
    const gameEl = document.getElementById('game');
    if (mode === 'daily' || mode === 'archive') {
      const themeObj = mode === 'daily' ? getDailyTheme()
        : state._archiveDay != null ? getDailyThemeForDay(state._archiveDay) : null;
      const paletteKey = themeObj ? THEME_PALETTE_MAP[themeObj.name] : null;
      if (paletteKey) {
        gameEl.setAttribute('data-game-theme', paletteKey);
        if (LW.audio.startAmbient) LW.audio.startAmbient(paletteKey);
      } else {
        gameEl.removeAttribute('data-game-theme');
      }
    } else {
      gameEl.removeAttribute('data-game-theme');
    }

    const banner = document.getElementById('challengeBanner');
    if (banner) {
      if (state.challengeScore) {
        banner.textContent = t('beatScore').replace('{score}', state.challengeScore);
        banner.hidden = false;
      } else if (mode === 'daily') {
        const theme = getDailyTheme();
        const themeEmojis = theme.groups ? theme.groups.map(g => GROUP_EMOJI[g] || '').join(' ') : '';
        banner.textContent = `${themeEmojis} ${t('daily') || 'Daily'}`;
        banner.hidden = false;
      } else {
        banner.hidden = true;
      }
    }

    updateLivesDisplay();

    if (mode === 'blitz') {
      startBlitzTimer();
    } else {
      startTimer();
    }
  }


  function resumeGame() {
    const gs = loadGameState();
    if (!gs || !gs.puzzle) { clearGameState(); return; }
    const p = gs.puzzle;
    const concepts = window.WORD_DATA?.concepts;
    if (!concepts || typeof p.start !== 'string' || typeof p.end !== 'string'
        || !(p.start in concepts) || !(p.end in concepts)
        || !Array.isArray(p.words) || !p.words.every(w => typeof w === 'string' && w in concepts)) {
      clearGameState(); return;
    }
    Object.assign(state, {
      mode: gs.mode, difficulty: gs.difficulty, puzzle: gs.puzzle,
      chain: gs.chain, runningScore: gs.runningScore, timer: gs.timer,
      hintsLeft: gs.hintsLeft, hintsUsed: gs.hintsUsed,
      combo: gs.combo || 0, multiplier: gs.multiplier || 1,
      blitzTime: gs.blitzTime || BLITZ_TIME,
      challengeSeed: gs.challengeSeed, challengeScore: gs.challengeScore,
      _isComeback: gs._isComeback || false, _comebackStreak: gs._comebackStreak || 0,
      livesEnabled: gs.livesEnabled || false, lives: gs.lives || 0,
      _archiveDay: gs._archiveDay || null,
      _undoCount: gs._undoCount || 0, _usedUndo: gs._usedUndo || false,
      gameOver: false, lastSelectTime: 0, score: 0
    });
    state.chainSet = new Set(state.chain);
    if (!state.chainMultipliers) state.chainMultipliers = [];
    precomputeEndDistances(state.puzzle.end);
    renderGame();
    document.getElementById('scoreDisplay').textContent = state.runningScore;
    document.getElementById('timerDisplay').textContent =
      state.mode === 'blitz' ? formatTime(state.blitzTime) : formatTime(state.timer);
    showScreen('game');
    const banner = document.getElementById('challengeBanner');
    if (banner) {
      if (state.mode === 'archive' && state._archiveDay != null) {
        const theme = getDailyThemeForDay(state._archiveDay);
        const dateKey = dateKeyForDay(state._archiveDay);
        banner.textContent = `📅 ${t('archive')} — ${dateKey} · ${theme.name}`;
        banner.hidden = false;
      } else if (state.challengeScore) {
        banner.textContent = t('beatScore').replace('{score}', state.challengeScore);
        banner.hidden = false;
      } else {
        banner.hidden = true;
      }
    }
    updateLivesDisplay();
    state.mode === 'blitz' ? startBlitzTimer(state.blitzTime) : startTimer(state.timer);
    state._reachable = computeReachability(state.puzzle, state.chainSet);
    updateChainDisplay(); updateGrid(); updateActions();
    const cb = document.getElementById('continueBtn');
    if (cb) cb.hidden = true;
  }

  function renderGame() {
    const p = state.puzzle;
    const diff = DIFFICULTY[state.difficulty];

    const startEl = document.getElementById('startWord');
    const endEl = document.getElementById('endWord');
    startEl.textContent = getWord(p.start);
    endEl.textContent = getWord(p.end);
    startEl.setAttribute('aria-label', `${t('tapToStart')}: ${getWord(p.start)}`);
    endEl.setAttribute('aria-label', `${t('chain')} ${t('words')}: ${getWord(p.end)}`);

    const grid = document.getElementById('wordGrid');
    grid.innerHTML = '';
    grid.classList.toggle('grid-4', diff.grid >= 16);
    grid.setAttribute('role', 'group');

    const concepts = window.WORD_DATA.concepts;
    state.cellMap = new Map();
    state.chainSet = new Set();
    p.words.forEach((w, i) => {
      const cell = document.createElement('button');
      cell.className = 'word-cell cell-enter';
      cell.textContent = getWord(w);
      cell.dataset.concept = w;
      cell.dataset.tone = getChainTone(i);
      cell.setAttribute('aria-pressed', 'false');
      cell.style.setProperty('--cell-delay', `${i * 30}ms`);
      cell.style.setProperty('--breathe-delay', (Math.random() * 3).toFixed(1));
      const dot = document.createElement('span');
      dot.className = 'group-dot';
      const grp = concepts[w]?.g || 'abstract';
      dot.style.backgroundColor = groupColors[grp] || '#7209b7';
      dot.hidden = !state.showGroups;
      cell.appendChild(dot);
      grid.appendChild(cell);
      state.cellMap.set(w, cell);
      cell.addEventListener('animationend', () => {
        cell.classList.remove('cell-enter');
        cell.style.removeProperty('--cell-delay');
      }, { once: true });
    });
    grid.onclick = e => {
      const cell = e.target.closest('.word-cell');
      if (cell && !cell._longPressed) onWordClick(cell.dataset.concept);
      if (cell) cell._longPressed = false;
    };

    let _lpTimer = null;
    let _lpShowedPreview = false;
    state._pencilMarks = state._pencilMarks || new Set();
    grid.onpointerdown = e => {
      const cell = e.target.closest('.word-cell');
      if (!cell || state.gameOver) return;
      _lpShowedPreview = false;
      _lpTimer = setTimeout(() => {
        cell._longPressed = true;
        const concept = cell.dataset.concept;
        if (!concept) return;

        if (state._pencilMarks.has(concept)) {
          state._pencilMarks.delete(concept);
          cell.classList.remove('pencil-marked');
          cell.setAttribute('aria-description', '');
        } else {
          state._pencilMarks.add(concept);
          cell.classList.add('pencil-marked');
          cell.setAttribute('aria-description', 'marked as candidate');
        }
        vibrate(10);

        const conns = getConnections(concept);
        const last = state.chain.length > 0 ? state.chain[state.chain.length - 1] : null;
        const concepts = window.WORD_DATA?.concepts;
        for (const [w, c] of state.cellMap) {
          if (conns.has(w) && !state.chainSet.has(w)) {
            c.classList.add('preview-highlight');
            if (last && concepts) {
              const gA = concepts[last]?.g;
              const gW = concepts[w]?.g;
              const val = gA !== gW ? `+${CROSS_THEME_BONUS}` : `+${SAME_THEME_BONUS}`;
              c.setAttribute('data-preview', val);
            }
          }
        }
        _lpShowedPreview = true;
      }, 300);
    };
    grid.onpointerup = () => {
      clearTimeout(_lpTimer);
      if (_lpShowedPreview) {
        for (const [, c] of state.cellMap) {
          c.classList.remove('preview-highlight');
          c.removeAttribute('data-preview');
        }
      }
    };
    grid.onpointerleave = () => {
      clearTimeout(_lpTimer);
      for (const [, c] of state.cellMap) {
        c.classList.remove('preview-highlight');
        c.removeAttribute('data-preview');
      }
    };

    grid.onkeydown = e => {
      if (!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const cells = Array.from(grid.querySelectorAll('.word-cell'));
      const idx = cells.indexOf(document.activeElement);
      if (idx < 0) return;
      const cols = diff.grid >= 16 ? 4 : 3;
      let next = idx;
      if (e.key === 'ArrowRight') next = Math.min(cells.length - 1, idx + 1);
      else if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
      else if (e.key === 'ArrowDown') next = Math.min(cells.length - 1, idx + cols);
      else if (e.key === 'ArrowUp') next = Math.max(0, idx - cols);
      cells[next]?.focus();
    };

    updateChainDisplay();
    updateActions();
    document.getElementById('hintCount').textContent = state.hintsLeft;
    document.getElementById('scoreDisplay').textContent = '0';
    document.getElementById('timerDisplay').textContent = state.mode === 'blitz' ? formatTime(BLITZ_TIME) : '0:00';

    const timerPill = document.getElementById('timerPill');
    timerPill.classList.toggle('blitz-pill', state.mode === 'blitz');
    timerPill.setAttribute('aria-live', 'off');

    // HUD pills — hidden for minimal HUD (timer + score only)
    const diffPill = document.getElementById('diffPill');
    if (diffPill) {
      diffPill.hidden = false;
      const diffDisplay = document.getElementById('diffDisplay');
      if (diffDisplay) diffDisplay.textContent = t(state.difficulty) || state.difficulty;
    }
    const comboBadge = document.getElementById('comboBadge');
    if (comboBadge) comboBadge.hidden = true;
    const parEl = document.getElementById('parIndicator');
    if (parEl) parEl.hidden = true;
    const svg = document.getElementById('svgConnections');
    if (svg) svg.hidden = true;
  }

  function onWordClick(concept) {
    if (state.gameOver || !state.puzzle) return;
    if (state.chainSet.has(concept)) {
      if (concept === state.chain[state.chain.length - 1] && state.chain.length > 1) {
        undoLast();
      }
      return;
    }

    const now = Date.now();

    if (state.chain.length === 0) {
      if (concept === state.puzzle.start) {
        state.chain.push(concept);
        state.chainSet.add(concept);
        trackWord(concept);
        state.lastSelectTime = now;
        playSound('select');
        vibrate(15);
        const startEl = document.getElementById('startWord');
        startEl.classList.add('ep-bounce');
        startEl.addEventListener('animationend', () => startEl.classList.remove('ep-bounce'), { once: true });
      } else {
        // tap to start — visual hint only, no toast
        const startEl = document.getElementById('startWord');
        startEl.classList.add('hint-glow');
        setTimeout(() => startEl.classList.remove('hint-glow'), 2000);
        return;
      }
    } else {
      const last = state.chain[state.chain.length - 1];
      if (!isConnected(last, concept)) {
        playSound('error');
        shakeElement(concept);
        const gLast = window.WORD_DATA.concepts[last]?.g;
        const gThis = window.WORD_DATA.concepts[concept]?.g;
        const catHint = (gLast && gThis && state.difficulty !== 'hard') ? ` [${gLast} ≠ ${gThis}]` : '';
        const nearDist = getGraphDistance(last, concept);
        if (state.difficulty !== 'hard' && isConnected(concept, state.puzzle.end)) {
          showToast((t('soClose') || 'So close!') + ' — ' + (t('notLinked') || 'not linked to chain') + catHint, 'near-miss');
        } else if (nearDist > 0 && nearDist <= 3 && state.difficulty !== 'hard') {
          const distMsg = (t('linksAway') || '{n} links away').replace('{n}', nearDist);
          showToast(`${t('notConnectedBut') || 'Not connected'} — ${distMsg}${catHint}`);
        } else {
          showToast((t('notLinked') || 'Not linked — try another word') + catHint);
        }
        if (state.mode === 'blitz') {
          state.blitzTime = Math.max(0, state.blitzTime - BLITZ_ERROR_PENALTY);
          state._blitzEpoch += BLITZ_ERROR_PENALTY * 1000;
          state._blitzStart = state.blitzTime;
          state._blitzStreak = 0;
        }
        state.combo = 0;
        state.multiplier = 1;
        const _errBadge = document.getElementById('comboBadge');
        if (_errBadge) _errBadge.hidden = true;
        return;
      }

      // Weekly trial rule enforcement
      if (state._trialRule) {
        const concepts = window.WORD_DATA.concepts;
        const gPrev = concepts[last]?.g;
        const gCur = concepts[concept]?.g;
        const cross = gPrev !== gCur;
        if (state._trialRule === 'noCross' && cross) {
          showToast(t('ruleNoCross') || 'No cross-theme allowed!');
          shakeElement(concept);
          playSound('error');
          return;
        }
        if (state._trialRule === 'crossOnly' && !cross) {
          showToast(t('ruleCrossOnly') || 'Cross-theme only!');
          shakeElement(concept);
          playSound('error');
          return;
        }
        if (state._trialRule === 'longRoute' && concept === state.puzzle.end && state.chain.length < (state.puzzle.optimal || 3) + 2) {
          showToast((t('ruleLongRoute') || 'Minimum {n} steps!').replace('{n}', (state.puzzle.optimal || 3) + 2));
          shakeElement(concept);
          playSound('error');
          return;
        }
      }

      state.chain.push(concept);
      state.chainSet.add(concept);
      trackWord(concept);
      state._atDeadEnd = false;

      if (state.chain.length === 2) {
        state.firstTapPredictions.total++;
        const optPath = state.puzzle.optimalPath;
        if (optPath && optPath.length > 1 && optPath[1] === concept) {
          state.firstTapPredictions.correct++;
        }
      }

      // Combo: reward consecutive cross-theme connections
      const concepts = window.WORD_DATA.concepts;
      const gA = concepts[state.chain[state.chain.length - 2]]?.g;
      const gB = concepts[concept]?.g;
      const isCrossTheme = gA !== gB;

      const prevCombo = state.combo;
      if (isCrossTheme) {
        if (state.mode === 'daily') state._todayCrossTheme = true;
        state.combo++;
        state.multiplier = state.combo >= 3 ? (state.combo - 1) : 1;
      } else {
        // combo reset — silent
        state.combo = 0;
        state.multiplier = 1;
      }
      state.lastSelectTime = now;

      // Score pop with living counter
      const pts = Math.round((isCrossTheme ? CROSS_THEME_BONUS : SAME_THEME_BONUS) * state.multiplier);
      const baseMultPts = isCrossTheme ? CROSS_THEME_BONUS : SAME_THEME_BONUS;
      if (!state.chainMultipliers) state.chainMultipliers = [];
      state.chainMultipliers.push(state.multiplier);
      if (state.multiplier > 1) {
        state.comboBonus = (state.comboBonus || 0) + (pts - baseMultPts);
      }
      const prevScore = state.runningScore;
      state.runningScore += pts;
      const scoreEl = document.getElementById('scoreDisplay');
      animateScoreRollUp(scoreEl, prevScore, state.runningScore);

      const scorePill = document.querySelector('.score-pill');
      if (scorePill) {
        scorePill.classList.remove('score-pop');
        requestAnimationFrame(() => scorePill.classList.add('score-pop'));
      }

      const cell = state.cellMap.get(concept);
      if (cell) {
        cell.classList.remove('cell-pop');
        requestAnimationFrame(() => cell.classList.add('cell-pop'));
        if (state.multiplier > 1) {
          cell.classList.add('combo-glow');
          cell.addEventListener('animationend', () => cell.classList.remove('combo-glow'), { once: true });
          if (state.combo >= 3) showToast(`Combo x${state.combo - 1}!`, 'combo');
        }
      }

      // Combo badge — hidden for minimal HUD
      const comboBadge = document.getElementById('comboBadge');
      if (comboBadge) comboBadge.hidden = true;

      const progress = Math.min(1, state.chain.length / (state.puzzle?.optimal || state.chain.length));
      playSound(isCrossTheme ? 'crossTheme' : 'select');
      vibrate(isCrossTheme ? [10, 10, 30] : 10);

      if (state.mode === 'blitz') {
        state.blitzTime = Math.min(99, state.blitzTime + BLITZ_WORD_BONUS);
        state._blitzEpoch -= BLITZ_WORD_BONUS * 1000;
        state._blitzStart = state.blitzTime;
        state._blitzStreak = (state._blitzStreak || 0) + 1;
        if (state._blitzStreak === 10) {
          state.multiplier = Math.max(state.multiplier, 2) * 2;
          // streak milestone — silent
          document.getElementById('game')?.classList.add('blitz-flash');
          setTimeout(() => document.getElementById('game')?.classList.remove('blitz-flash'), 600);
        }
      }

      // In-session rank feedback
      const rankThresholds = [
        [2200, 'mastermind'], [1800, 'architect'], [1400, 'weaver'], [1000, 'bridge'], [700, 'chain'], [400, 'link']
      ];
      // rank popup during gameplay — removed for cleaner UX

      if (concept !== state.puzzle.end && state.chain.length >= 3) {
        const dist = getGraphDistance(concept, state.puzzle.end);
        if (dist > 0) {
          // proximity toasts — silent
        }
      }
    }

    // Chain milestone labels
    const milestoneKeys = { 3: 'milestone3', 5: 'milestone5', 7: 'milestone7', 9: 'milestone9', 12: 'milestone12' };
    const milestoneKey = milestoneKeys[state.chain.length];
    if (milestoneKey) {
      showToast(t(milestoneKey), 'milestone');
    }

    updateChainDisplay();
    state._reachable = computeReachability(state.puzzle, state.chainSet);
    updateGrid();
    updateActions();
    saveGameState();

    if (state.chain.length > 0 && concept !== state.puzzle.end) {
      const distToEnd = getGraphDistance(state.chain[state.chain.length - 1], state.puzzle.end);
      const pathsPill = document.getElementById('pathsPill');
      const countEl = document.getElementById('connectableCount');
      if (pathsPill && countEl && distToEnd > 0 && distToEnd <= 5) {
        pathsPill.hidden = false;
        countEl.textContent = distToEnd === 1 ? '1 link' : `${distToEnd} links`;
      } else if (pathsPill) {
        pathsPill.hidden = true;
      }
    }

    // Dead-end detection via precomputed reachability
    if (concept !== state.puzzle.end && state.chain.length > 1) {
      const last = state.chain[state.chain.length - 1];
      const neighbors = getConnections(last);
      const canReachEnd = [...neighbors].some(n => state._reachable && state._reachable.has(n));
      if (!canReachEnd) {
        showToast(t('deadEnd'));
        announce(t('deadEnd'));
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
          undoBtn.classList.add('pulse-hint');
          setTimeout(() => undoBtn.classList.remove('pulse-hint'), 3000);
        }
        state._atDeadEnd = true;
      }
    }

    if (concept === state.puzzle.end) {
      if (onboarding.active) {
        onboarding.onPuzzleComplete();
        return;
      }
      if (state._rushMode) {
        rushPuzzleComplete();
        return;
      }
      completeGame();
    }
  }

  function animateScoreRollUp(targetEl, from, to) {
    const diff = to - from;
    if (diff === 0) return;
    const duration = 400;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      targetEl.textContent = Math.round(from + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  let _activeFloaters = 0;
  let _headerBottomCache = 80;
  function _updateHeaderCache() {
    const h = document.querySelector('.game-header');
    if (h) _headerBottomCache = h.getBoundingClientRect().bottom;
  }
  function showFloatingScore(element, points, isCrossTheme) {
    const el = document.createElement('div');
    el.className = `floating-score ${isCrossTheme ? 'creative' : 'normal'}`;
    el.setAttribute('aria-hidden', 'true');
    el.textContent = isCrossTheme ? `+${points} ❖` : `+${points}`;
    const offset = _activeFloaters * 22;
    _activeFloaters++;
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${Math.max(_headerBottomCache + 4, rect.top - 24 - offset)}px`;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => { el.remove(); _activeFloaters = Math.max(0, _activeFloaters - 1); }, { once: true });
    });
  }

  function showRankPopup(label) {
    const el = document.createElement('div');
    el.className = 'rank-popup';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = label;
    const grid = document.getElementById('wordGrid');
    if (grid) {
      const r = grid.getBoundingClientRect();
      el.style.top = (r.top + r.height / 2) + 'px';
    }
    document.body.appendChild(el);
    playSound('achievement');
    vibrate([20, 30, 20]);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function undoToSafe() {
    if (state.chain.length <= 2) { undoLast(); return; }
    let safeIndex = state.chain.length - 2;
    while (safeIndex > 0) {
      const c = state.chain[safeIndex];
      const neighbors = getConnections(c);
      const reachable = [...neighbors].filter(n => !state.chainSet.has(n) || n === state.puzzle.end);
      if (reachable.length > 1) break;
      safeIndex--;
    }
    const removeCount = state.chain.length - 1 - safeIndex;
    for (let i = 0; i < removeCount; i++) undoLast();
  }

  function undoLast() {
    if (state.chain.length <= 1) return;
    state._usedUndo = true;
    state._undoCount = (state._undoCount || 0) + 1;
    const removed = state.chain.pop();
    const originalMult = (state.chainMultipliers && state.chainMultipliers.length) ? state.chainMultipliers.pop() : state.multiplier;
    state.chainSet.delete(removed);

    const concepts = window.WORD_DATA.concepts;
    const prevConcept = state.chain[state.chain.length - 1];
    const gA = concepts[prevConcept]?.g;
    const gB = concepts[removed]?.g;
    const wasCross = gA !== gB;
    const undoPts = Math.round((wasCross ? CROSS_THEME_BONUS : SAME_THEME_BONUS) * originalMult);
    const prevScore = state.runningScore;
    state.runningScore = Math.max(0, state.runningScore - undoPts);
    const scoreEl = document.getElementById('scoreDisplay');
    animateScoreRollUp(scoreEl, prevScore, state.runningScore);

    const cell = state.cellMap.get(removed);
    if (cell) {
      const el = document.createElement('div');
      el.className = 'floating-score undo';
      el.setAttribute('aria-hidden', 'true');
      el.textContent = `-${undoPts}`;
      requestAnimationFrame(() => {
        const rect = cell.getBoundingClientRect();
        el.style.left = `${rect.left + rect.width / 2}px`;
        el.style.top = `${rect.top - 24}px`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      });
    }

    if (wasCross && state.multiplier > 1) {
      const basePts = CROSS_THEME_BONUS;
      state.comboBonus = Math.max(0, (state.comboBonus || 0) - (undoPts - basePts));
    }
    state.combo = 0;
    state.multiplier = 1;
    state.lastSelectTime = 0;
    const comboBadge = document.getElementById('comboBadge');
    if (comboBadge) comboBadge.hidden = true;
    playSound('deselect');
    vibrate(20);
    updateChainDisplay();
    state._reachable = computeReachability(state.puzzle, state.chainSet);
    updateGrid();
    updateActions();
    saveGameState();
  }

  function updateWatchAdHintBtn() {
    const btn = document.getElementById('watchAdHintBtn');
    if (!btn) return;
    btn.hidden = state.hintsLeft > 0 || !window.LinkAds || window.LinkAds.isAdsRemoved() || !window.LinkAds.isRewardedReady();
  }

  function useHint() {
    if (state._trialRule === 'noHints') {
      showToast(t('ruleNoHints') || 'No hints allowed!');
      return;
    }
    if (state.hintsLeft <= 0) {
      updateWatchAdHintBtn();
      return;
    }
    if (state.chain.length === 0) {
      onWordClick(state.puzzle.start);
      return;
    }

    const last = state.chain[state.chain.length - 1];
    const target = state.puzzle.end;
    let path = gridBfs(last, target, state.puzzle, state.chainSet);
    if (!path || path.length <= 1) {
      path = bfs(last, target);
    }
    if (path && path.length > 1) {
      highlightWord(path[1]);
      state.hintsLeft--;
      state.hintsUsed++;
      document.getElementById('hintCount').textContent = state.hintsLeft;
      playSound('hint');
      vibrate([10, 20, 10, 20, 10]);
      // hint penalty toast — silent
      updateWatchAdHintBtn();
    } else {
      showToast(t('deadEnd'));
      announce(t('deadEnd'));
    }
  }

  function highlightWord(concept) {
    const cell = state.cellMap.get(concept);
    if (cell) {
      cell.classList.add('hint-glow');
      setTimeout(() => cell.classList.remove('hint-glow'), 3000);
    }

    if (concept === state.puzzle.start) {
      const el = document.getElementById('startWord');
      el.classList.add('hint-glow');
      setTimeout(() => el.classList.remove('hint-glow'), 3000);
    }
    if (concept === state.puzzle.end) {
      const el = document.getElementById('endWord');
      el.classList.add('hint-glow');
      setTimeout(() => el.classList.remove('hint-glow'), 3000);
    }
  }

  function giveUp() {
    if (state.gameOver) return;
    state.gameOver = true;
    clearGameState();
    stopTimer();
    stopBlitz();
    state.stats.played++;
    save();

    const optimal = state.puzzle.optimalPath;

    const kicker = document.getElementById('resultKicker');
    if (kicker) kicker.textContent = state.mode === 'daily' ? `№ ${getDailyNumber()} · GAVE UP` : 'GAVE UP';
    const hintsEl = document.getElementById('resultHintsUsed');
    if (hintsEl) hintsEl.textContent = state.hintsUsed || 0;
    const streakEl = document.getElementById('resultStreak');
    if (streakEl) streakEl.hidden = true;

    document.getElementById('resultEmoji').textContent = '🏳️';
    document.getElementById('resultTitle').textContent = t('gaveUp') || 'Better luck next time!';
    const subEl = document.getElementById('resultSubtitle');
    if (subEl) subEl.textContent = '';
    document.getElementById('resultChainLen').textContent = `${state.chain.length} ${t('words') || 'words'}`;
    document.getElementById('resultTime').textContent = formatTime(state.timer);
    document.getElementById('resultScore').textContent = '0';
    clearResultScreen();

    // Show optimal path on give up
    const opEl = document.getElementById('optimalPath');
    if (opEl && optimal && optimal.length > 0) {
      opEl.hidden = false;
      const opLabel = document.getElementById('optimalPathLabel');
      if (opLabel) opLabel.textContent = t('bestPath') || 'Optimal Path';
      const opText = document.getElementById('optimalPathText');
      if (opText) opText.textContent = optimal.map(c => getWord(c)).join(' → ');
    }

    const paBtn = document.querySelector('[data-action="playAgain"]');
    if (paBtn) paBtn.hidden = (state.mode === 'daily');

    renderSessionGoalSection();
    showScreen('result');
    announce(t('gaveUp') || 'Better luck next time!');
  }

  // ═══════════════════════════════════════════
  //  COMPLETION CEREMONY
  // ═══════════════════════════════════════════
  function completeGame() {
    if (state.gameOver) return;
    state.gameOver = true;
    clearGameState();
    stopTimer();
    stopBlitz();
    if (LW.audio.stopAmbient) LW.audio.stopAmbient();
    trackChainLinks();
    const rawScore = calculateScore(state.chain, state.timer, state.hintsUsed, state._undoCount || 0);
    state.score = rawScore;
    const rating = getScoreRating(rawScore);

    clearCeremonyTimers();

    // Multi-stage ceremony
    // 1. Flash
    const flash = document.createElement('div');
    flash.className = 'flash-overlay';
    document.body.appendChild(flash);
    addCeremonyTimer(setTimeout(() => flash.remove(), 300));

    // 2. Glow on start/end words
    document.getElementById('startWord').classList.add('complete-glow');
    document.getElementById('endWord').classList.add('complete-glow');

    // 3. Cascading chain reveal — chain cells glow first, then grid ripple
    state.chain.forEach((concept, i) => {
      const cell = state.cellMap.get(concept);
      if (cell) {
        addCeremonyTimer(setTimeout(() => {
          cell.classList.add('chain-reveal');
          cell.addEventListener('animationend', () => cell.classList.remove('chain-reveal'), { once: true });
        }, i * 80));
      }
    });

    // Grid ripple after chain reveal
    const rippleDelay = state.chain.length * 80;
    addCeremonyTimer(setTimeout(() => {
      document.querySelectorAll('.word-cell').forEach((cell, i) => {
        cell.style.setProperty('--ripple-delay', `${i * 40}ms`);
        cell.classList.add('ripple');
        cell.addEventListener('animationend', () => {
          cell.classList.remove('ripple');
          cell.style.removeProperty('--ripple-delay');
        }, { once: true });
      });
    }, rippleDelay));

    // 4. Sound + haptics
    if (rating === 'mastermind' || rating === 'architect') {
      playSound('mastermind');
      vibrate([20, 30, 20, 30, 100]);
    } else {
      playSound('complete');
      vibrate([20, 20, 100]);
    }

    // 5. Particles + confetti — intensity scales with chain length
    const chainIntensity = Math.min(2, state.chain.length / (state.puzzle?.optimal || 5));
    const particleCount = Math.round(8 + chainIntensity * 12);
    const confettiCount = Math.round(12 + chainIntensity * 18);
    addCeremonyTimer(setTimeout(() => {
      spawnParticles(window.innerWidth / 2, window.innerHeight / 3, particleCount);
      spawnConfetti(confettiCount);
      if (rating === 'mastermind' || rating === 'architect') {
        addCeremonyTimer(setTimeout(() => {
          spawnParticles(window.innerWidth / 2, window.innerHeight / 3, 10,
            ['#ffd60a', '#f8961e', '#ff6b35']);
          spawnConfetti(15);
          const app = document.getElementById('app');
          app.classList.add('screen-shake');
          app.addEventListener('animationend', () => app.classList.remove('screen-shake'), { once: true });
        }, 400));
      }
    }, 300));

    // Stats update — streak only from daily
    state.stats.played++;
    state.stats.won++;

    // Session goal progress
    incrementSessionGoal();

    const isArchive = state.mode === 'archive';

    // Streak update — must happen before XP calc so streak multiplier is accurate
    const wasComeback = !!state._isComeback;
    if (isArchive) {
      // Archive: no streak changes
    } else if (state._isComeback) {
      const recovered = Math.max(1, Math.floor((state._comebackStreak || 0) / 2));
      state.stats.streak = recovered + 1;
      state.stats._lostStreak = 0;
      state.stats._comebackUsedDate = getTodayKey();
      state.stats._comebackWeekCount = (state.stats._comebackWeekCount || 0) + 1;
      state._isComeback = false;
      showToast(`🛡️ ${t('comebackSuccess') || 'Streak recovered!'}`, 'milestone');
    } else if (state.mode === 'daily') {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yKey = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth()+1).padStart(2,'0')}-${String(yesterday.getUTCDate()).padStart(2,'0')}`;
      if (state.daily[yKey]) {
        state.stats.streak++;
      } else {
        const twoDaysAgo = new Date();
        twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
        const tdaKey = `${twoDaysAgo.getUTCFullYear()}-${String(twoDaysAgo.getUTCMonth()+1).padStart(2,'0')}-${String(twoDaysAgo.getUTCDate()).padStart(2,'0')}`;
        const freezesLeft = getStreakFreezesLeft();
        if (state.daily[tdaKey] && freezesLeft > 0 && state.stats.streak >= 2) {
          useStreakFreeze();
          state.stats.streak++;
        } else {
          if (state.stats.streak >= 1) state.stats._lostStreak = state.stats.streak;
          state.stats.streak = 1;
        }
      }
      state.stats.maxStreak = Math.max(state.stats.maxStreak, state.stats.streak);
    }

    if (state.mode === 'blitz') state.stats.blitzWins++;

    // XP-based leveling with multipliers (after streak update for correct multiplier)
    let baseXP = Math.max(10, Math.round(rawScore / 5));
    const diffMult = XP_DIFFICULTY_MULT[state.difficulty] || 1.0;
    const modeMult = isArchive ? 0.5 : (XP_MODE_MULT[state.mode] || 1.0);
    const streakDays = Math.min(state.stats.streak || 0, 10);
    const streakMult = 1 + Math.min(streakDays * XP_STREAK_BONUS_PER_DAY, XP_STREAK_BONUS_CAP);
    const cycleBonus = state.mode === 'daily' ? getDailyCycleBonus(state.stats.streak) : 0;
    const earnedXP = Math.round(baseXP * diffMult * modeMult * streakMult) + cycleBonus;
    state._lastEarnedXP = earnedXP;
    state._xpBreakdown = { base: baseXP, diff: diffMult, mode: modeMult, streak: streakMult, cycleBonus };
    const oldLevel = getLevelNumber(state.stats.xp || 0);
    state.stats.xp = (state.stats.xp || 0) + earnedXP;
    const newLevel = getLevelNumber(state.stats.xp);
    state.stats.level = newLevel;
    if (newLevel > oldLevel) {
      addCeremonyTimer(setTimeout(() => showLevelUp(newLevel), 600));
    }

    const score = rawScore;
    state.score = score;
    const isNewBest = !isArchive && score > state.stats.bestScore;

    state.stats.lastPlayedDate = getTodayKey();

    if (isArchive && state._archiveDay != null) {
      state.daily[`archive_${state._archiveDay}`] = { score, chain: state.chain.length, time: state.timer };
    } else if (state.mode === 'daily') {
      state.daily[getTodayKey()] = { score, chain: state.chain.length, time: state.timer, completedAt: Date.now(), crossTheme: !!state._todayCrossTheme };
    } else if (state.mode === 'bonus') {
      state.daily[getTodayKey() + '_bonus'] = { score, chain: state.chain.length, time: state.timer };
      if (state._savedDifficulty) { state.difficulty = state._savedDifficulty; state._savedDifficulty = null; }
    }
    if (state.mode === 'endless' || state.mode === 'blitz' || state.mode === 'bonus') {
      state.stats._todayExtra = true;
    }
    if (wasComeback) {
      state.daily[getYesterdayKey()] = { score, chain: state.chain.length, time: state.timer, comeback: true };
    }

    if (rating === 'mastermind') {
      state.stats.perfectStreak = (state.stats.perfectStreak || 0) + 1;
    } else {
      state.stats.perfectStreak = 0;
    }

    state.stats.totalScore += score;
    if (!isArchive) state.stats.bestScore = Math.max(state.stats.bestScore, score);
    state.stats.scores.push(score);
    if (state.mode !== 'blitz' && state.timer > 0) {
      state.stats.totalTime = (state.stats.totalTime || 0) + state.timer;
      state.stats.gamesWithTime = (state.stats.gamesWithTime || 0) + 1;
      if (state.stats.bestTime === 0 || state.timer < state.stats.bestTime) state.stats.bestTime = state.timer;
    }
    if (state.stats.scores.length > 30) state.stats.scores.shift();

    if (!state.stats.langsUsed.includes(state.lang)) {
      state.stats.langsUsed.push(state.lang);
    }
    if (state.difficulty === 'hard') state.stats._playedHard = true;
    if (state.mode === 'daily') {
      if (!state.stats._uniqueThemes) state.stats._uniqueThemes = 0;
      const themeIdx = getDailyNumber() % 7;
      if (!state.stats._seenThemes) state.stats._seenThemes = [];
      if (!state.stats._seenThemes.includes(themeIdx)) {
        state.stats._seenThemes.push(themeIdx);
        state.stats._uniqueThemes = state.stats._seenThemes.length;
      }
    }

    if (!state.stats.byDifficulty) state.stats.byDifficulty = {};
    const diffKey = state.difficulty || 'medium';
    if (!state.stats.byDifficulty[diffKey]) state.stats.byDifficulty[diffKey] = { played: 0, won: 0, totalScore: 0 };
    state.stats.byDifficulty[diffKey].played++;
    state.stats.byDifficulty[diffKey].won++;
    state.stats.byDifficulty[diffKey].totalScore += score;

    if (!state.stats.byMode) state.stats.byMode = {};
    const modeKey = state.mode || 'endless';
    if (!state.stats.byMode[modeKey]) state.stats.byMode[modeKey] = { played: 0, won: 0, totalScore: 0 };
    state.stats.byMode[modeKey].played++;
    state.stats.byMode[modeKey].won++;
    state.stats.byMode[modeKey].totalScore += score;

    save();

    // Streak tier milestone celebrations
    if (state.mode === 'daily') {
      const milestones = [
        { threshold: 365, key: 'tierMilestone365' },
        { threshold: 100, key: 'tierMilestone100' },
        { threshold: 30,  key: 'tierMilestone30' },
        { threshold: 14,  key: 'tierMilestone14' },
        { threshold: 7,   key: 'tierMilestone7' }
      ];
      const hitMilestone = milestones.find(m => state.stats.streak === m.threshold);
      if (hitMilestone) {
        const msg = t(hitMilestone.key) || hitMilestone.key;
        addCeremonyTimer(setTimeout(() => {
          showRankPopup(msg);
          showToast(msg, 'milestone');
        }, 900));
      }

      // Weekly champion celebration (day 7 of cycle)
      const dayInCycle = ((state.stats.streak - 1) % 7) + 1;
      if (dayInCycle === 7) {
        const champMsg = t('weeklyChampion') || 'Weekly Champion!';
        addCeremonyTimer(setTimeout(() => {
          showToast(`🏆 ${champMsg}`, 'milestone');
        }, hitMilestone ? 2200 : 900));
      }
    }

    if (window.LinkAuth && window.LinkAuth.submitWeeklyScore) {
      window.LinkAuth.submitWeeklyScore(score);
    }
    if (window.LinkAds) window.LinkAds.showInterstitialIfReady();

    // #28 — Full board bonus
    if (state.chain.length === state.puzzle.words.length + 2) {
      const extraXP = state._lastEarnedXP * 2;
      state.stats.xp += extraXP;
      state._lastEarnedXP += extraXP;
      // full board toast — silent (XP still awarded)
    }

    // #26 — Hidden daily goals
    if (state.mode === 'daily') {
      const goals = [
        { check: () => (state._undoCount || 0) === 0, label: 'No Undo!' },
        { check: () => { const c = window.WORD_DATA?.concepts; let ct = 0; for (let i = 0; i < state.chain.length - 1; i++) { if (c[state.chain[i]]?.g !== c[state.chain[i+1]]?.g) ct++; } return ct >= 3; }, label: '3+ Cross-theme!' },
        { check: () => state.hintsUsed === 0, label: 'No Hints!' },
        { check: () => state.timer <= 30, label: 'Speed Run!' }
      ];
      const seed = getDailyNumber();
      const goalIdx = seed % goals.length;
      const goal = goals[goalIdx];
      if (goal.check()) {
        const bonusXP = 100;
        state.stats.xp += bonusXP;
        state._lastEarnedXP += bonusXP;
        // goal toast — silent (XP still awarded)
      }
    }

    // Daily quest rewards
    const questsCompleted = checkDailyQuests();
    if (questsCompleted.length > 0) {
      const questXP = questsCompleted.length * 50;
      state.stats.xp += questXP;
      state._lastEarnedXP += questXP;
      state._questsCompleted = questsCompleted;
      // quest toast — silent (XP still awarded)
    }

    // Streak Society titles
    if (state.mode === 'daily') {
      const streakTitles = [
        { threshold: 365, key: 'streakTitle365' },
        { threshold: 100, key: 'streakTitle100' },
        { threshold: 30,  key: 'streakTitle30' },
        { threshold: 7,   key: 'streakTitle7' }
      ];
      const title = streakTitles.find(st => state.stats.streak >= st.threshold);
      if (title) state._streakTitle = t(title.key);
    }

    // Personal records
    const records = state.personalRecords;
    const newRecords = [];
    if (state.mode === 'daily' && state.timer > 0 && (records.fastestDaily === 0 || state.timer < records.fastestDaily)) {
      records.fastestDaily = state.timer;
      newRecords.push(t('fastestDaily') || 'Fastest Daily');
    }
    if (score > records.highestScore) { records.highestScore = score; newRecords.push(t('personalRecord') || 'Personal Record'); }
    if (state.chain.length > records.longestChain) { records.longestChain = state.chain.length; }
    const crossCount = (() => { const c = window.WORD_DATA?.concepts; let n = 0; for (let i = 0; i < state.chain.length - 1; i++) if (c[state.chain[i]]?.g !== c[state.chain[i+1]]?.g) n++; return n; })();
    if (crossCount > records.mostCreative) { records.mostCreative = crossCount; newRecords.push(t('mostCreative') || 'Most Creative'); }
    // personal record toast — silent

    // Granular score breakdown for result screen
    const speedBonus = state.timer <= 15 ? 500 : state.timer <= 30 ? 300 : state.timer <= 60 ? 200 : state.timer <= 120 ? 100 : 0;
    const creativityBonus = crossCount * 20;
    const optimalBonus = state.chain.length <= (state.puzzle?.optimal || 99) ? 150 : 0;
    const difficultyBonus = state.difficulty === 'hard' ? 200 : state.difficulty === 'easy' ? 0 : 50;
    state._scoreBreakdown = {
      base: state.runningScore,
      speed: speedBonus,
      creativity: creativityBonus,
      optimal: optimalBonus,
      difficulty: difficultyBonus
    };

    // Semantic distance score (creativity measure)
    state._semanticScore = Math.min(100, Math.round((crossCount / Math.max(1, state.chain.length - 1)) * 100));

    // Community percentile heuristic
    const avgScore = 800;
    const stdDev = 400;
    const zScore = (score - avgScore) / stdDev;
    state._percentile = Math.min(99, Math.max(1, Math.round(50 + zScore * 30)));

    // Check achievements
    const newAch = checkAchievements(score, rating);

    const ceremonyDelay = rating === 'mastermind' ? 1200 : 800;

    addCeremonyTimer(setTimeout(() => {
      renderResult(score, rating, isNewBest);
      if (newAch.length) {
        addCeremonyTimer(setTimeout(() => {
          newAch.forEach(ach => {
            showAchievementPopup(ach.icon, t(ach.nameKey));
            playSound('achievement');
          });
        }, 500));
      }
      showProgressiveTip();
    }, ceremonyDelay));
  }

  function showProgressiveTip() {
    const played = state.stats.played || 0;
    const tipKey = localStorage.getItem('lw_last_tip') || '';
    const TIPS = [
      { after: 2,  key: 'tipCombo',      lsKey: 'tip_combo' },
      { after: 3,  key: 'tipCreativity', lsKey: 'tip_creativity' },
      { after: 5,  key: 'tipOptimal',    lsKey: 'tip_optimal' },
      { after: 7,  key: 'tipUndo',       lsKey: 'tip_undo' },
      { after: 10, key: 'tipStreak',     lsKey: 'tip_streak' },
      { after: 12, key: 'tipBlitz',      lsKey: 'tip_blitz' },
      { after: 15, key: 'tipArchive',    lsKey: 'tip_archive' },
      { after: 18, key: 'tipLives',      lsKey: 'tip_lives' }
    ];
    for (const tip of TIPS) {
      if (played >= tip.after && !localStorage.getItem('lw_' + tip.lsKey)) {
        localStorage.setItem('lw_' + tip.lsKey, '1');
        // tip toast — removed for cleaner UX
        return;
      }
    }
  }

  function renderResult(score, rating, isNewBest, livesBonus) {
    populateResultExtras(score);
    document.getElementById('resultEmoji').textContent =
      { mastermind: '🌟', architect: '🏗️', weaver: '🧵', bridge: '🌉', chain: '🔗', link: '🔸', spark: '✨' }[rating] || '✨';
    document.getElementById('resultTitle').textContent = `${getRatingLabel(rating)} ${getRatingEmoji(rating)}`;
    const subtitleEl = document.getElementById('resultSubtitle');
    if (subtitleEl) subtitleEl.textContent = pickRandom(MICROCOPY.completeMsg[rating] || MICROCOPY.completeMsg.spark);
    document.getElementById('resultChainLen').textContent = `${state.chain.length} ${t('words') || 'words'}`;
    document.getElementById('resultTime').textContent = formatTime(state.timer);
    const resultScoreEl = document.getElementById('resultScore');
    resultScoreEl.textContent = '0';
    setTimeout(() => animateScoreRollUp(resultScoreEl, 0, score), 200);

    // New best score
    const newBestEl = document.getElementById('newBest');
    if (isNewBest && score > 0) {
      newBestEl.hidden = false;
      playSound('newBest');
      vibrate([50, 30, 50, 30, 100]);
      // confetti removed for cleaner UX
    } else {
      newBestEl.hidden = true;
    }

    clearResultScreen();
    state._xpDoubled = false;

    // Streak bonus row
    const streakRow = document.getElementById('streakBonusRow');
    if (streakRow && state.mode === 'daily' && state.stats.streak > 1) {
      streakRow.hidden = false;
      const streakVal = document.getElementById('resultStreakBonus');
      if (streakVal) streakVal.textContent = `×${state._xpBreakdown?.streak?.toFixed(1) || '1.0'}`;
    }

    // Combo bonus row
    const comboRow = document.getElementById('comboBonusRow');
    if (comboRow && state.comboBonus > 0) {
      comboRow.hidden = false;
      const comboVal = document.getElementById('resultComboBonus');
      if (comboVal) comboVal.textContent = `+${state.comboBonus}`;
    }

    // XP earned row
    const xpRow = document.getElementById('xpEarnedRow');
    if (xpRow && state._lastEarnedXP > 0) {
      xpRow.hidden = false;
      const xpVal = document.getElementById('resultXPDetail');
      if (xpVal) xpVal.textContent = `+${state._lastEarnedXP} XP`;
    }

    // Granular score breakdown
    const breakdown = state._scoreBreakdown;
    if (breakdown) {
      const bdEl = document.getElementById('scoreBreakdown');
      if (bdEl) {
        bdEl.hidden = false;
        bdEl.innerHTML = '';
        const rows = [
          [t('baseScore') || 'Base', breakdown.base],
          [t('speedBonus') || 'Speed', breakdown.speed],
          [t('creativityBonus') || 'Creativity', breakdown.creativity],
          [t('optimalBonus') || 'Optimal', breakdown.optimal],
          [t('difficultyBonus') || 'Difficulty', breakdown.difficulty]
        ];
        for (const [label, val] of rows) {
          if (val <= 0) continue;
          const row = document.createElement('div');
          row.className = 'breakdown-row';
          row.innerHTML = `<span>${label}</span><span>+${val}</span>`;
          bdEl.appendChild(row);
        }
      }
    }

    // Semantic distance score
    if (typeof state._semanticScore === 'number') {
      const semEl = document.getElementById('semanticScore');
      if (semEl) {
        semEl.hidden = false;
        semEl.textContent = `${t('semanticLeap') || 'Creativity'}: ${state._semanticScore}%`;
      }
    }

    // Community percentile
    if (state._percentile) {
      const pctEl = document.getElementById('percentileDisplay');
      if (pctEl) {
        pctEl.hidden = false;
        pctEl.textContent = (t('topPercent') || 'Top {n}%').replace('{n}', Math.max(1, 100 - state._percentile));
      }
    }

    // Streak Society title
    if (state._streakTitle) {
      const stEl = document.getElementById('streakTitle');
      if (stEl) {
        stEl.hidden = false;
        stEl.textContent = state._streakTitle;
      }
    }

    // First-tap instinct score
    if (state.firstTapPredictions.total > 0) {
      const instEl = document.getElementById('instinctScore');
      if (instEl) {
        const pct = Math.round((state.firstTapPredictions.correct / state.firstTapPredictions.total) * 100);
        instEl.hidden = false;
        instEl.textContent = `${t('instinctScore') || 'Instinct'}: ${pct}%`;
      }
    }

    // Game Review (move-by-move analysis)
    renderGameReview();

    // Daily quests display
    if (state.mode === 'daily') renderDailyQuestsResult();

    // Double XP button
    const dxpBtn = document.getElementById('doubleXpBtn');
    if (dxpBtn) dxpBtn.hidden = !window.LinkAds || window.LinkAds.isAdsRemoved();

    // Result banner ad
    const adBannerResult = document.getElementById('adBannerResult');
    if (adBannerResult) adBannerResult.hidden = window.LinkAds?.isAdsRemoved();

    // Chain display
    const chainEl = document.getElementById('resultChain');
    chainEl.innerHTML = '';
    const arrowChar = state.lang === 'ar' ? '←' : '→';
    state.chain.forEach((c, i) => {
      const node = document.createElement('span');
      node.className = 'chain-node';
      if (i === 0) node.classList.add('start');
      else if (i === state.chain.length - 1) node.classList.add('end');
      else {
        node.classList.add('mid');
        node.classList.add('tone-' + getChainTone(i - 1));
      }
      const concept = window.WORD_DATA.concepts[c];
      const groupEmoji = GROUP_EMOJI[concept?.g] || '';
      node.textContent = getWord(c);
      node.title = `${groupEmoji} ${concept?.g || ''}`;
      node.addEventListener('click', () => {
        if (i < state.chain.length - 1) {
          const next = state.chain[i + 1];
          const gA = concept?.g || '?';
          const gB = window.WORD_DATA.concepts[next]?.g || '?';
          const cross = gA !== gB;
          const emoji = cross ? '🔀' : '🔗';
          showToast(`${emoji} ${getWord(c)} → ${getWord(next)} (${gA} → ${gB})`, cross ? 'milestone' : 'info');
        }
      });
      chainEl.appendChild(node);
      if (i < state.chain.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'chain-arrow';
        arrow.textContent = arrowChar;
        arrow.setAttribute('aria-hidden', 'true');
        chainEl.appendChild(arrow);
      }
    });

    // Link pattern visualization (same-theme vs cross-theme)
    let linkPatternEl = document.getElementById('linkPattern');
    if (linkPatternEl) linkPatternEl.remove();
    if (state.chain.length > 1) {
      linkPatternEl = document.createElement('div');
      linkPatternEl.id = 'linkPattern';
      linkPatternEl.className = 'link-pattern';
      const concepts2 = window.WORD_DATA.concepts;
      for (let i = 1; i < state.chain.length; i++) {
        const gA = concepts2[state.chain[i - 1]]?.g;
        const gB = concepts2[state.chain[i]]?.g;
        const dot = document.createElement('span');
        dot.className = gA !== gB ? 'link-dot cross' : 'link-dot same';
        linkPatternEl.appendChild(dot);
      }
      chainEl.parentNode.insertBefore(linkPatternEl, chainEl.nextSibling);
    }

    // Optimal path comparison
    const opEl = document.getElementById('optimalPath');
    if (opEl) {
      const optPath = state.puzzle.optimalPath;
      if (optPath && optPath.length > 0 && optPath.length < state.chain.length) {
        opEl.hidden = false;
        const opLabel = document.getElementById('optimalPathLabel');
        if (opLabel) opLabel.textContent = t('bestPath') || 'Optimal Path';
        const opText = document.getElementById('optimalPathText');
        if (opText) opText.textContent = optPath.map(c => getWord(c)).join(' → ');
        const opComp = document.getElementById('optimalComparison');
        const opYours = document.getElementById('opYours');
        const opBest = document.getElementById('opBest');
        if (opComp && opYours && opBest) {
          opComp.hidden = false;
          opYours.textContent = `${state.chain.length} ${t('words') || 'words'}`;
          opBest.textContent = `${optPath.length} ${t('par') || 'par'}`;
        }
      } else {
        opEl.hidden = true;
      }
    }

    const playAgainBtn = document.querySelector('[data-action="playAgain"]');
    if (playAgainBtn) {
      if (state.mode === 'daily') {
        playAgainBtn.hidden = true;
      } else if (state.mode === 'endless') {
        playAgainBtn.hidden = false;
        const paSpan = playAgainBtn.querySelector('[data-i18n]') || playAgainBtn.querySelector('span');
        if (paSpan) paSpan.textContent = t('nextPuzzleBtn') || 'Next Puzzle';
      } else {
        playAgainBtn.hidden = false;
        const paSpan = playAgainBtn.querySelector('[data-i18n]') || playAgainBtn.querySelector('span');
        if (paSpan) paSpan.textContent = t('playAgain') || 'Play Again';
      }
    }

    // Session goal progress section
    renderSessionGoalSection();

    // Daily fact / theme quote (#27)
    let factEl = document.getElementById('dailyFact');
    if (factEl) factEl.remove();
    if (state.mode === 'daily') {
      const fact = getDailyCommentary();
      if (fact) {
        factEl = document.createElement('div');
        factEl.id = 'dailyFact';
        factEl.className = 'daily-fact';
        factEl.textContent = fact;
        const resultBody = document.querySelector('.result-body') || chainEl.parentNode;
        if (resultBody) resultBody.appendChild(factEl);
      }
    }

    // Next daily countdown
    let countdownEl = document.getElementById('nextDailyCountdown');
    if (countdownEl) countdownEl.remove();
    if (state.mode === 'daily') {
      countdownEl = document.createElement('div');
      countdownEl.id = 'nextDailyCountdown';
      countdownEl.className = 'next-daily-countdown';
      const resultActions = document.querySelector('.result-actions');
      if (resultActions) resultActions.parentNode.insertBefore(countdownEl, resultActions);
      function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const diff = tomorrow - now;
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        countdownEl.textContent = '';
        const label = document.createElement('span');
        label.className = 'countdown-label';
        label.textContent = t('nextPuzzle') || 'Next puzzle';
        const time = document.createElement('span');
        time.className = 'countdown-time';
        time.textContent = `${h}:${m}:${s}`;
        countdownEl.append(label, time);
      }
      updateCountdown();
      if (state._countdownInterval) clearInterval(state._countdownInterval);
      state._countdownInterval = setInterval(() => {
        if (!document.getElementById('nextDailyCountdown')) { clearInterval(state._countdownInterval); state._countdownInterval = null; return; }
        updateCountdown();
      }, 1000);
    }

    showScreen('result');

    // Personal best theater
    if (isNewBest && score > 0) {
      setTimeout(() => playPersonalBestTheater(), 400);
    }

    const staggerEls = document.querySelectorAll('.result-inner .score-row, .result-inner .result-chain, .result-inner .result-actions');
    staggerEls.forEach((el, i) => {
      el.style.setProperty('--row-delay', `${i * 80}ms`);
      el.addEventListener('animationend', () => el.style.removeProperty('--row-delay'), { once: true });
    });

    if (state.mode === 'daily' && !document.getElementById('nextDailyCountdown')) {
      startNextDailyCountdown();
    } else if (state.mode !== 'daily') {
      // Hide daily-only elements when not in daily mode
      const timerEl = document.getElementById('nextDailyTimer');
      if (timerEl) timerEl.hidden = true;
      const suggestEl = document.getElementById('dailyModeSuggestions');
      if (suggestEl) suggestEl.hidden = true;
      if (state._nextDailyInterval) {
        clearInterval(state._nextDailyInterval);
        state._nextDailyInterval = null;
      }
    }

    checkMilestoneNotifications();
  }

  function renderGameReview() {
    const el = document.getElementById('gameReview');
    if (!el || state.chain.length < 2) return;
    el.hidden = false;
    el.innerHTML = `<h4>${t('gameReview') || 'Game Review'}</h4>`;
    const concepts = window.WORD_DATA?.concepts;
    const optPath = state.puzzle.optimalPath;
    const optSet = optPath ? new Set(optPath) : new Set();

    for (let i = 1; i < state.chain.length; i++) {
      const prev = state.chain[i - 1];
      const curr = state.chain[i];
      const gA = concepts[prev]?.g;
      const gB = concepts[curr]?.g;
      const isCross = gA !== gB;
      const isOnOptimal = optSet.has(prev) && optSet.has(curr);
      let label, cls;
      if (isOnOptimal && isCross) { label = t('moveGreat') || 'Great'; cls = 'move-great'; }
      else if (isOnOptimal || isCross) { label = t('moveGood') || 'Good'; cls = 'move-good'; }
      else { label = t('moveDetour') || 'Detour'; cls = 'move-detour'; }

      const row = document.createElement('div');
      row.className = `review-move ${cls}`;
      row.innerHTML = `<span class="review-words">${getWord(prev)} → ${getWord(curr)}</span><span class="review-label">${label}</span>`;
      el.appendChild(row);
    }
  }

  function renderDailyQuestsResult() {
    const el = document.getElementById('dailyQuestsResult');
    if (!el) return;
    const quests = getDailyQuests();
    el.hidden = false;
    el.innerHTML = `<h4>${t('dailyQuests') || 'Daily Quests'}</h4>`;
    for (const q of quests) {
      const done = q.check();
      const row = document.createElement('div');
      row.className = `quest-row ${done ? 'quest-done' : 'quest-miss'}`;
      let qText = (t(q.key) || q.id).replace('{n}', '3');
      row.innerHTML = `<span>${done ? '✓' : '○'} ${qText}</span><span>${done ? '+50 XP' : ''}</span>`;
      el.appendChild(row);
    }
  }

  function startNextDailyCountdown() {
    if (state._nextDailyInterval) clearInterval(state._nextDailyInterval);
    let el = document.getElementById('nextDailyTimer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nextDailyTimer';
      el.className = 'next-daily-timer';
      const resultActions = document.querySelector('.result-actions');
      if (resultActions) resultActions.parentNode.insertBefore(el, resultActions);
    }
    el.hidden = false;
    function tick() {
      const now = new Date();
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${t('nextPuzzle')} ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    tick();
    state._nextDailyInterval = setInterval(tick, 1000);

    // Inject mode suggestion buttons after the countdown (only once)
    let suggestEl = document.getElementById('dailyModeSuggestions');
    if (!suggestEl) {
      suggestEl = document.createElement('div');
      suggestEl.id = 'dailyModeSuggestions';
      suggestEl.className = 'daily-mode-suggestions';
      const endlessBtn = document.createElement('button');
      endlessBtn.className = 'btn btn-secondary';
      endlessBtn.dataset.action = 'suggestEndless';
      endlessBtn.textContent = t('tryEndless') || 'Try Endless Mode';
      const blitzBtn = document.createElement('button');
      blitzBtn.className = 'btn btn-secondary';
      blitzBtn.dataset.action = 'suggestBlitz';
      blitzBtn.textContent = t('tryBlitz') || 'Try Blitz Mode';
      suggestEl.appendChild(endlessBtn);
      suggestEl.appendChild(blitzBtn);
      el.parentNode.insertBefore(suggestEl, el.nextSibling);
    }
    suggestEl.hidden = false;
  }

  // ═══════════════════════════════════════════
  //  ACHIEVEMENTS
  // ═══════════════════════════════════════════
  function checkAchievements(score, rating) {
    const newlyUnlocked = [];
    const s = state.stats;
    const hour = new Date().getHours();

    const checks = {
      first:       () => s.played >= 1,
      wordsmith:   () => s.played >= 10,
      speed:       () => state.timer <= 30,
      minimalist:  () => state.chain.length <= state.puzzle.optimal,
      untouchable: () => state.hintsUsed === 0,
      marathon:    () => s.streak >= 7,
      century:     () => s.streak >= 100,
      creative:    () => score >= 1100,
      nightOwl:    () => hour >= 23 || hour < 5,
      blitzer:     () => state.mode === 'blitz' && s.blitzWins >= 1,
      linguist:    () => s.langsUsed.length >= 3,
      perfect3:    () => s.perfectStreak >= 3,
      halfCentury: () => s.played >= 50,
      veteran:     () => s.played >= 100,
      mastermind:  () => score >= 1400,
      legend:      () => score >= 1700,
      streak14:    () => s.streak >= 14,
      streak30:    () => s.streak >= 30,
      blitz10:     () => s.blitzWins >= 10,
      linguist5:   () => s.langsUsed.length >= 5,
      chain10:     () => state.chain.length >= 10,
      speedster:   () => state.timer <= 20,
      noUndo:      () => !state._usedUndo && state.hintsUsed === 0,
      hardWin:     () => state.difficulty === 'hard',
      explorer:    () => s.played >= 25 && s.langsUsed.length >= 2,
      polyglotMaster: () => s.langsUsed.length >= 10,
      weeklyChamp:    () => s.streak >= 7 && s.played >= 7,
      totalScore100k: () => s.totalScore >= 100000
    };

    for (const def of ACHIEVEMENT_DEFS) {
      if (state.achievements[def.id]) continue;
      const check = checks[def.id];
      if (check && check()) {
        state.achievements[def.id] = Date.now();
        newlyUnlocked.push(def);
      }
    }

    if (newlyUnlocked.length) save();
    return newlyUnlocked;
  }

  function getAchievementProgress(id) {
    const s = state.stats;
    const progMap = {
      first: [Math.min(s.won, 1), 1],
      wordsmith: [Math.min(s.won, 10), 10],
      halfCentury: [Math.min(s.won, 50), 50],
      veteran: [Math.min(s.won, 100), 100],
      marathon: [Math.min(s.streak, 7), 7],
      streak14: [Math.min(s.streak, 14), 14],
      streak30: [Math.min(s.streak, 30), 30],
      century: [Math.min(s.streak, 100), 100],
      blitzer: [Math.min(s.blitzWins, 1), 1],
      blitz10: [Math.min(s.blitzWins, 10), 10],
      linguist: [Math.min((s.langsUsed || []).length, 3), 3],
      linguist5: [Math.min((s.langsUsed || []).length, 5), 5],
      perfect3: [Math.min(s.perfectStreak, 3), 3],
      creative: [Math.min(s.bestScore, 1100), 1100],
      mastermind: [Math.min(s.bestScore, 1400), 1400],
      legend: [Math.min(s.bestScore, 1700), 1700]
    };
    return progMap[id] || null;
  }

  function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const unlockedCount = ACHIEVEMENT_DEFS.filter(d => state.achievements[d.id]).length;
    const counter = document.createElement('div');
    counter.className = 'ach-counter';
    counter.textContent = `${unlockedCount}/${ACHIEVEMENT_DEFS.length} ${t('unlocked') || 'unlocked'}`;
    grid.appendChild(counter);

    for (const cat of ACHIEVEMENT_CATEGORIES) {
      const catDefs = ACHIEVEMENT_DEFS.filter(d => d.cat === cat.id);
      if (!catDefs.length) continue;
      const catHeader = document.createElement('div');
      catHeader.className = 'ach-category-header';
      catHeader.textContent = `${cat.icon} ${t(cat.labelKey) || cat.id}`;
      grid.appendChild(catHeader);
      for (const def of catDefs) renderSingleAchievement(grid, def);
    }
  }

  function renderSingleAchievement(grid, def) {
    {
      const el = document.createElement('div');
      el.className = 'achievement';
      const unlocked = !!state.achievements[def.id];
      if (!unlocked) el.classList.add('locked');

      const icon = document.createElement('div');
      icon.className = 'ach-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = def.icon;

      const name = document.createElement('div');
      name.className = 'ach-name';
      name.textContent = t(def.nameKey);

      const desc = document.createElement('div');
      desc.className = 'ach-desc';
      desc.textContent = t(def.descKey) || '';

      el.setAttribute('aria-label', `${t(def.nameKey)}: ${t(def.descKey) || ''}, ${unlocked ? 'unlocked' : 'locked'}`);

      el.append(icon, name, desc);

      if (!unlocked) {
        const prog = getAchievementProgress(def.id);
        if (prog) {
          const [current, total] = prog;
          const pct = Math.min(100, Math.round((current / total) * 100));
          if (pct > 0) {
            const bar = document.createElement('div');
            bar.className = 'ach-progress';
            const fill = document.createElement('div');
            fill.className = 'ach-progress-fill';
            fill.style.width = `${pct}%`;
            bar.appendChild(fill);
            const label = document.createElement('span');
            label.className = 'ach-progress-label';
            label.textContent = `${current}/${total}`;
            el.append(bar, label);
          }
        }
      }

      grid.appendChild(el);
    }
  }

  // ═══════════════════════════════════════════
  //  WORD COLLECTION (delegated to lw-collection.js)
  // ═══════════════════════════════════════════
  function trackWord(id) { LW.collection.trackWord(id); }
  function trackChainLinks() { LW.collection.trackChainLinks(); }
  function getCollectionStats() { return LW.collection.getCollectionStats(); }
  function renderCollection() { populateCollectionCounter(); LW.collection.renderCollection(groupColors); }

  // ═══════════════════════════════════════════
  //  UI UPDATES
  // ═══════════════════════════════════════════
  let _chainDisplayLen = 0;
  function updateChainDisplay() {
    const container = document.getElementById('chainNodes');
    const placeholder = document.getElementById('chainPlaceholder');

    if (state.chain.length === 0) {
      container.innerHTML = '';
      _chainDisplayLen = 0;
      placeholder.style.display = '';
      placeholder.textContent = t('tapToStart');
      return;
    }
    placeholder.style.display = 'none';

    const _wasUndo = state.chain.length < _chainDisplayLen;
    if (_wasUndo) {
      container.innerHTML = '';
      _chainDisplayLen = 0;
    }

    for (let i = _chainDisplayLen; i < state.chain.length; i++) {
      const c = state.chain[i];
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'chain-arrow';
        arrow.textContent = state.lang === 'ar' ? '←' : '→';
        arrow.setAttribute('aria-hidden', 'true');
        container.appendChild(arrow);
      }
      const node = document.createElement('span');
      node.className = 'chain-node';
      if (i === 0) node.classList.add('start');
      else if (c === state.puzzle.end) node.classList.add('end');
      else {
        node.classList.add('mid');
        node.classList.add('tone-' + getChainTone(i - 1));
      }
      node.textContent = getWord(c);
      container.appendChild(node);
    }
    _chainDisplayLen = state.chain.length;

    const track = document.getElementById('chainTrack');
    const sw = track.scrollWidth;
    const cw = track.clientWidth;
    track.scrollLeft = sw;
    track.classList.toggle('scrollable', sw > cw);
    track.classList.toggle('scrolled-left', sw > cw);

    if (state.chain.length > 1) {
      const last = state.chain[state.chain.length - 1];
      announce(`${getWord(last)} — ${state.runningScore}`);
    }

  }

  function updateGrid() {
    let connectableCount = 0;
    const last = state.chain.length > 0 ? state.chain[state.chain.length - 1] : null;

    for (const [concept, cell] of state.cellMap) {
      const inChain = state.chainSet.has(concept);
      const isLast = concept === last;

      cell.classList.toggle('selected', inChain);
      cell.classList.toggle('used', inChain && !isLast);
      cell.disabled = inChain && !isLast;
      cell.setAttribute('aria-pressed', inChain ? 'true' : 'false');

      const wasConnectable = cell.classList.contains('connectable');
      let nowConnectable = false;
      if (last && !inChain && isConnected(last, concept)) {
        nowConnectable = true;
        connectableCount++;
      }
      const showHighlight = nowConnectable && state.difficulty !== 'hard';
      cell.classList.toggle('connectable', showHighlight);
      if (showHighlight) {
        cell.setAttribute('aria-description', t('connectable') || 'connectable');
      } else {
        cell.removeAttribute('aria-description');
      }

      const unreachable = !inChain && state._reachable && !state._reachable.has(concept);
      cell.classList.toggle('unreachable', !!unreachable);
    }

    const endEl = document.getElementById('endWord');
    if (last) {
      const endConn = isConnected(last, state.puzzle.end);
      const wasEndConn = endEl.classList.contains('connectable');
      endEl.classList.toggle('connectable', endConn);
      if (endConn) {
        connectableCount++;
        if (!wasEndConn) {
          endEl.classList.add('ep-bounce');
          endEl.addEventListener('animationend', () => endEl.classList.remove('ep-bounce'), { once: true });
          vibrate([10, 20, 30]);
        }
      }
    } else {
      endEl.classList.remove('connectable');
    }

    // Paths pill — hidden for minimal HUD
    const pathsPill = document.getElementById('pathsPill');
    if (pathsPill) pathsPill.hidden = true;
  }

  function clearResultScreen() {
    if (state._countdownInterval) {
      clearInterval(state._countdownInterval);
      state._countdownInterval = null;
    }
    const hideIds = ['streakBonusRow','comboBonusRow','xpEarnedRow','dailyBonusRow','doubleXpBtn','optimalPath','pathEfficiency','dailyFact','newBest','livesBonusRow','scoreBreakdown','semanticScore','percentileDisplay','streakTitle','instinctScore','gameReview','dailyQuestsResult'];
    for (const id of hideIds) {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    }
    const removeIds = ['shareCardBtn','inviteBtn'];
    for (const id of removeIds) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }
    const chainEl = document.getElementById('resultChain');
    if (chainEl) chainEl.textContent = '';
  }

  function updateActions() {
    document.getElementById('undoBtn').disabled = state.chain.length <= 1;
    const giveUpBtn = document.getElementById('giveUpBtn');
    if (giveUpBtn) giveUpBtn.hidden = state.mode === 'blitz';
  }

  function updateLivesDisplay() {
    const livesEl = document.getElementById('livesPill');
    if (livesEl) livesEl.hidden = true;
  }

  function loseGame() {
    state.gameOver = true;
    stopTimer();
    stopBlitz();
    clearGameState();
    state.stats.played++;
    state.stats.lossesLives = (state.stats.lossesLives || 0) + 1;
    save();

    const kicker = document.getElementById('resultKicker');
    if (kicker) kicker.textContent = 'GAME OVER';
    const hintsEl = document.getElementById('resultHintsUsed');
    if (hintsEl) hintsEl.textContent = state.hintsUsed || 0;
    const streakEl = document.getElementById('resultStreak');
    if (streakEl) streakEl.hidden = true;

    document.getElementById('resultEmoji').textContent = '💔';
    document.getElementById('resultTitle').textContent = t('gameOverLives');
    const subEl = document.getElementById('resultSubtitle');
    if (subEl) subEl.textContent = '';
    document.getElementById('resultChainLen').textContent = `${state.chain.length} ${t('words') || 'words'}`;
    document.getElementById('resultTime').textContent = formatTime(state.timer);
    document.getElementById('resultScore').textContent = '0';
    clearResultScreen();

    // Show optimal path on game over
    const optimal = state.puzzle.optimalPath;
    const opEl = document.getElementById('optimalPath');
    if (opEl && optimal && optimal.length > 0) {
      opEl.hidden = false;
      const opLabel = document.getElementById('optimalPathLabel');
      if (opLabel) opLabel.textContent = t('bestPath') || 'Optimal Path';
      const opText = document.getElementById('optimalPathText');
      if (opText) opText.textContent = optimal.map(c => getWord(c)).join(' → ');
    }

    const paBtn = document.querySelector('[data-action="playAgain"]');
    if (paBtn) paBtn.hidden = (state.mode === 'daily');

    renderSessionGoalSection();
    showScreen('result');
    playSound('error');
    vibrate([100, 50, 100, 50, 200]);
    announce(t('gameOverLives'));
  }

  function shakeElement(concept) {
    let c = state.cellMap.get(concept);
    if (!c && concept === state.puzzle?.end) c = document.getElementById('endWord');
    if (!c && concept === state.puzzle?.start) c = document.getElementById('startWord');
    if (c) {
      c.classList.add('invalid');
      c.addEventListener('animationend', () => c.classList.remove('invalid'), { once: true });
    }
  }

  // ═══════════════════════════════════════════
  //  TIMERS
  // ═══════════════════════════════════════════
  function startTimer(resumeFrom) {
    stopTimer();
    if (typeof resumeFrom === 'number') {
      state.timer = resumeFrom;
    } else {
      state.timer = 0;
    }
    state._timerEpoch = Date.now() - state.timer * 1000;
    const display = document.getElementById('timerDisplay');
    display.textContent = formatTime(state.timer);
    state.timerRef = setInterval(() => {
      state.timer = Math.floor((Date.now() - state._timerEpoch) / 1000);
      display.textContent = formatTime(state.timer);
    }, 1000);
  }

  function stopTimer() {
    if (state.timerRef) {
      clearInterval(state.timerRef);
      state.timerRef = null;
    }
  }

  function startBlitzTimer(initialTime) {
    stopBlitz();
    if (typeof initialTime === 'number') {
      state.blitzTime = initialTime;
    } else {
      state.blitzTime = BLITZ_TIME;
      state.timer = 0;
    }
    state._blitzEpoch = Date.now();
    state._blitzStart = state.blitzTime;
    const display = document.getElementById('timerDisplay');
    const pill = document.getElementById('timerPill');
    display.textContent = formatTime(state.blitzTime);
    state.blitzRef = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state._blitzEpoch) / 1000);
      state.blitzTime = Math.max(0, state._blitzStart - elapsed);
      state.timer = elapsed;
      display.textContent = formatTime(state.blitzTime);
      pill.classList.toggle('warning', state.blitzTime <= 10);
      if (state.blitzTime === 10 || state.blitzTime === 5 || state.blitzTime === 3) {
        playSound('click');
        vibrate(30);
      }
      if (state.blitzTime <= 0) blitzTimeUp();
    }, 1000);
  }

  function stopBlitz() {
    if (state.blitzRef) {
      clearInterval(state.blitzRef);
      state.blitzRef = null;
    }
  }

  function blitzTimeUp() {
    stopBlitz();
    if (state.gameOver) return;
    clearGameState();
    playSound('error');
    vibrate([100, 50, 100]);
    announce(t('blitzOver'));

    if (state.chain.length && state.chain[state.chain.length - 1] === state.puzzle.end) {
      completeGame();
    } else {
      const lastWord = state.chain.length ? state.chain[state.chain.length - 1] : state.puzzle.start;
      const nearDist = getGraphDistance(lastWord, state.puzzle.end);
      if (nearDist > 0 && nearDist <= 3) {
        const _stepsStr = (t('stepsAway') || '{n} steps away').replace('{n}', nearDist);
        showToast(`${t('soClose') || t('nearMiss') || 'So close!'} ${_stepsStr}`, 'milestone');
      }
      state.gameOver = true;
      state.stats.played++;
      state.score = state.runningScore;
      if (!state.stats.blitzBest) state.stats.blitzBest = 0;
      const isBlitzBest = state.runningScore > state.stats.blitzBest;
      if (isBlitzBest) state.stats.blitzBest = state.runningScore;
      const _blitzBaseXP = Math.max(5, Math.round(state.runningScore / 10));
      const _blitzEarnedXP = Math.round(_blitzBaseXP * 1.5);
      state.stats.xp = (state.stats.xp || 0) + _blitzEarnedXP;
      state.stats.level = getLevelNumber(state.stats.xp);
      state._lastEarnedXP = _blitzEarnedXP;
      state._xpBreakdown = null;
      const _blitzOptimal = state.puzzle.optimalPath;
      save();

      addCeremonyTimer(setTimeout(() => {
        document.getElementById('resultEmoji').textContent = '⏱';
        const _btitleEl = document.getElementById('resultTitle');
        if (nearDist > 0 && nearDist <= 3) {
          const _bStepsStr = (t('stepsAway') || '{n} steps away').replace('{n}', nearDist);
          _btitleEl.textContent = `${t('soClose') || t('nearMiss') || 'So close!'} ${_bStepsStr}`;
        } else {
          _btitleEl.textContent = t('blitzOver');
        }
        document.getElementById('resultChainLen').textContent = `${state.chain.length} ${t('words') || 'words'}`;
        document.getElementById('resultTime').textContent = formatTime(BLITZ_TIME);
        document.getElementById('resultScore').textContent = state.runningScore;
        const newBestEl = document.getElementById('newBest');
        if (isBlitzBest && state.runningScore > 0) {
          newBestEl.hidden = false;
          playSound('newBest');
        } else {
          newBestEl.hidden = true;
        }
        clearResultScreen();
        const subEl = document.getElementById('resultSubtitle');
        if (subEl) subEl.textContent = '';

        // XP row for blitz
        const xpRow = document.getElementById('xpEarnedRow');
        if (xpRow && _blitzEarnedXP > 0) {
          xpRow.hidden = false;
          const xpVal = document.getElementById('resultXPDetail');
          if (xpVal) xpVal.textContent = `+${_blitzEarnedXP} XP`;
        }

        // Optimal path for blitz
        const opEl = document.getElementById('optimalPath');
        if (opEl && _blitzOptimal && _blitzOptimal.length > 0) {
          opEl.hidden = false;
          const opLabel = document.getElementById('optimalPathLabel');
          if (opLabel) opLabel.textContent = t('bestPath') || 'Optimal Path';
          const opText = document.getElementById('optimalPathText');
          if (opText) opText.textContent = _blitzOptimal.map(c => getWord(c)).join(' → ');
        }

        const chainEl = document.getElementById('resultChain');
        const bArrow = state.lang === 'ar' ? '←' : '→';
        state.chain.forEach((c, i) => {
          const node = document.createElement('span');
          node.className = 'chain-node';
          if (i === 0) node.classList.add('start');
          else node.classList.add('mid');
          node.textContent = getWord(c);
          chainEl.appendChild(node);
          if (i < state.chain.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'chain-arrow';
            arrow.textContent = bArrow;
            chainEl.appendChild(arrow);
          }
        });
        const paBtn = document.querySelector('[data-action="playAgain"]');
        if (paBtn) paBtn.hidden = false;

        incrementSessionGoal();
        renderSessionGoalSection();
        showScreen('result');
      }, 800));
    }
  }

  function formatTime(s) {
    const m = Math.floor(Math.abs(s) / 60);
    const sec = Math.abs(s) % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  // ═══════════════════════════════════════════
  //  STATS
  // ═══════════════════════════════════════════
  function renderStats() {
    populateStatsHero();
    const s = state.stats;
    document.getElementById('statPlayed').textContent = s.played;
    document.getElementById('statStreak').textContent = s.streak;
    document.getElementById('statMaxStreak').textContent = s.maxStreak;
    document.getElementById('statBestScore').textContent = s.bestScore.toLocaleString();
    const winRateEl = document.getElementById('statWinRate');
    if (winRateEl) winRateEl.textContent = s.played ? Math.round((s.won / s.played) * 100) + '%' : '0%';
    const bestTimeEl = document.getElementById('statBestTime');
    if (bestTimeEl) bestTimeEl.textContent = s.bestTime > 0 ? formatTime(s.bestTime) : '--';

    // Total score
    const totalScoreEl = document.getElementById('statTotalScore');
    if (totalScoreEl) totalScoreEl.textContent = (s.totalScore || 0).toLocaleString();

    // Weekly heatmap
    renderWeeklyHeatmap();

    // Sparkline
    renderSparkline();

    // Rating distribution
    renderRatingDistribution();

    // Creativity average (cross-theme ratio)
    const creativityEl = document.getElementById('statAvgCreativity');
    if (creativityEl) {
      const avg = s.played > 0 ? Math.round((s.scores || []).reduce((sum, sc) => sum + Math.min(100, sc / 20), 0) / s.played) : 0;
      creativityEl.textContent = avg + '%';
    }

    // Languages used
    const langsEl = document.getElementById('statLangsUsed');
    if (langsEl) langsEl.textContent = (s.langsUsed || []).length || 1;

    // Collection progress in stats
    const colProg = document.getElementById('statCollectionProgress');
    if (colProg) {
      const colStats = getCollectionStats();
      const pct = colStats.totalWords ? Math.round((colStats.totalFound / colStats.totalWords) * 100) : 0;
      colProg.innerHTML = `<div class="stat-collection-row"><span>${t('wordsCollected')}</span><strong>${colStats.totalFound}/${colStats.totalWords} (${pct}%)</strong></div><div class="collection-bar"><div class="collection-bar-fill" style="width:${pct}%"></div></div>`;
    }

    // Total time
    const totalTimeEl = document.getElementById('statTotalTime');
    if (totalTimeEl && s.totalTime) {
      const hrs = Math.floor(s.totalTime / 3600);
      const mins = Math.floor((s.totalTime % 3600) / 60);
      totalTimeEl.innerHTML = `<span class="stat-total-time-label">${t('totalPlayTime')}</span><strong>${hrs}h ${mins}m</strong>`;
    }

    // Narrative stats
    const narrativeEl = document.getElementById('narrativeStats');
    if (narrativeEl && s.played >= 3) {
      const lines = [];
      if (s.totalTime && s.gamesWithTime) {
        const avgTime = Math.round(s.totalTime / s.gamesWithTime);
        if (avgTime < 60) lines.push(t('narrativeFast'));
        else lines.push(t('narrativeAvg').replace('{n}', Math.round(avgTime / 60)));
      }
      if (s.bestTime > 0) {
        lines.push(t('narrativeFastest').replace('{time}', formatTime(s.bestTime)));
      }
      if (s.bestScore > 0) {
        lines.push(t('narrativeHighest').replace('{score}', s.bestScore.toLocaleString()));
      }
      if (s.maxStreak >= 7) {
        lines.push(t('narrativeStreak').replace('{n}', s.maxStreak));
      }
      if ((s.langsUsed || []).length >= 2) {
        lines.push(t('narrativeLangs').replace('{n}', s.langsUsed.length));
      }
      narrativeEl.textContent = lines.slice(0, 3).join(' ');
    } else if (narrativeEl) {
      narrativeEl.textContent = '';
    }

    // Profile completeness
    const profEl = document.getElementById('profileCompleteness');
    if (profEl) {
      const milestones = [
        { label: t('milestoneHard'), done: (s.scores || []).some((_, i) => i >= 0) && s._playedHard },
        { label: t('milestoneBlitz'), done: (s.blitzWins || 0) > 0 },
        { label: t('milestone2ndLang'), done: (s.langsUsed || []).length >= 2 },
        { label: t('milestoneAllThemes'), done: (s._uniqueThemes || 0) >= 7 },
        { label: t('milestoneStreak14'), done: (s.maxStreak || 0) >= 14 }
      ];
      const done = milestones.filter(m => m.done).length;
      const pct = Math.round((done / milestones.length) * 100);
      let html = `<div class="profile-header"><span>${t('profileLabel')}</span><strong>${pct}% ${t('profileComplete')}</strong></div>`;
      html += `<div class="collection-bar"><div class="collection-bar-fill" style="width:${pct}%"></div></div>`;
      html += '<div class="profile-milestones">';
      for (const m of milestones) {
        html += `<div class="profile-milestone ${m.done ? 'done' : ''}"><span>${m.done ? '✓' : '○'}</span> ${m.label}</div>`;
      }
      html += '</div>';
      profEl.innerHTML = html;
    }

    // Word DNA radar
    renderWordDNA();

    // Score history
    const hist = document.getElementById('scoreHistory');
    hist.innerHTML = '';
    if (!(s.scores || []).length) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'lb-empty';
      emptyDiv.textContent = t('noHistory') || 'Play a game to see your history';
      hist.appendChild(emptyDiv);
      return;
    }
    const maxScore = Math.max(...(s.scores || []));
    const recent = (s.scores || []).slice(-10);
    recent.forEach((score, i) => {
      const bar = document.createElement('div');
      bar.className = 'history-bar';
      const pct = Math.max(5, (score / maxScore) * 100);
      const idx = document.createElement('span');
      idx.style.cssText = 'min-width:24px;text-align:right;font-weight:600';
      idx.textContent = recent.length - i;
      const fill = document.createElement('div');
      fill.className = 'history-bar-fill';
      fill.style.transform = `scaleX(${pct / 100})`;
      const val = document.createElement('span');
      val.textContent = score;
      bar.appendChild(idx);
      bar.appendChild(fill);
      bar.appendChild(val);
      hist.appendChild(bar);
    });
  }

  function renderWeeklyHeatmap() {
    const container = document.getElementById('weeklyHeatmap');
    if (!container) return;
    container.innerHTML = '';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dow = (today.getUTCDay() + 6) % 7;

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - (dow - i));
      const key = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
      const entry = state.daily[key];
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      if (entry) {
        const rating = getScoreRating(entry.score || 0);
        cell.dataset.rating = rating;
        cell.title = `${days[i]}: ${entry.score || 0} pts`;
      } else {
        cell.dataset.rating = 'none';
      }
      if (i === dow) cell.classList.add('today');
      const label = document.createElement('span');
      label.className = 'heatmap-label';
      label.textContent = days[i];
      const dot = document.createElement('div');
      dot.className = 'heatmap-dot';
      cell.append(label, dot);
      container.appendChild(cell);
    }
  }

  function renderSparkline() {
    const canvas = document.getElementById('sparklineCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scores = (state.stats.scores || []).slice(-20);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (scores.length < 2) return;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min || 1;
    const w = canvas.width;
    const h = canvas.height;
    const step = w / (scores.length - 1);
    ctx.beginPath();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#7c3aed';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    scores.forEach((s, i) => {
      const x = i * step;
      const y = h - ((s - min) / range) * (h - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function renderRatingDistribution() {
    const container = document.getElementById('ratingDistribution');
    if (!container) return;
    container.innerHTML = '';
    const ratings = { mastermind: 0, architect: 0, weaver: 0, bridge: 0, chain: 0, link: 0, spark: 0 };
    const ratingColors = { mastermind: '#ffd60a', architect: '#f8961e', weaver: '#06d6a0', bridge: '#4cc9f0', chain: '#7209b7', link: '#a0a0b0', spark: '#666' };
    for (const score of (state.stats.scores || [])) {
      const r = getScoreRating(score);
      if (ratings[r] !== undefined) ratings[r]++;
    }
    const total = (state.stats.scores || []).length || 1;
    for (const [key, count] of Object.entries(ratings)) {
      const pct = Math.round((count / total) * 100);
      if (pct === 0) continue;
      const row = document.createElement('div');
      row.className = 'rating-dist-row';
      row.innerHTML = `<span class="rating-dist-label" style="color:${ratingColors[key]}">${getRatingLabel(key)}</span><div class="rating-dist-bar"><div class="rating-dist-fill" style="width:${pct}%;background:${ratingColors[key]}"></div></div><span class="rating-dist-pct">${pct}%</span>`;
      container.appendChild(row);
    }
  }


  function renderWordDNA() {
    const canvas = document.getElementById('wordDnaCanvas');
    if (!canvas) return;
    const s = state.stats;
    if (s.played < 3) { canvas.parentElement && (canvas.parentElement.hidden = true); return; }
    if (canvas.parentElement) canvas.parentElement.hidden = false;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 20;
    ctx.clearRect(0, 0, w, h);

    const axes = [
      { key: 'dnaSpeed', val: s.bestTime > 0 ? Math.min(1, 30 / s.bestTime) : 0.5 },
      { key: 'dnaCreativity', val: Math.min(1, (s.bestScore || 0) / 2000) },
      { key: 'dnaConsistency', val: Math.min(1, (s.streak || 0) / 30) },
      { key: 'dnaExploration', val: Math.min(1, ((s.langsUsed || []).length) / 5) },
      { key: 'dnaMastery', val: Math.min(1, s.played / 100) }
    ];
    const n = axes.length;
    const angleStep = (Math.PI * 2) / n;

    for (let ring = 0.25; ring <= 1; ring += 0.25) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * r * ring;
        const y = cy + Math.sin(angle) * r * ring;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const val = axes[i % n].val;
      const x = cx + Math.cos(angle) * r * val;
      const y = cy + Math.sin(angle) * r * val;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(114, 9, 183, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#7209b7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const lx = cx + Math.cos(angle) * (r + 14);
      const ly = cy + Math.sin(angle) * (r + 14);
      ctx.fillText(t(axes[i].key) || axes[i].key.replace('dna', ''), lx, ly + 4);
    }
  }

  async function renderLeaderboard() {
    const section = document.getElementById('leaderboardSection');
    const list = document.getElementById('leaderboardList');
    if (!section || !list) return;
    if (!window.LinkAuth || !window.LinkAuth.getWeeklyLeaderboard) {
      if (state.stats.played < 3) { section.hidden = true; return; }
      section.hidden = false;
      list.innerHTML = '';
      const teaser = document.createElement('div');
      teaser.className = 'lb-teaser';
      const teaserP = document.createElement('p');
      teaserP.textContent = t('leaderboardTeaser') || 'Sign in to compete on the weekly leaderboard';
      teaser.appendChild(teaserP);
      const signInBtn = document.createElement('button');
      signInBtn.className = 'btn btn-secondary btn-sm';
      signInBtn.textContent = t('signIn') || 'Sign In';
      signInBtn.addEventListener('click', () => showScreen('settings'));
      teaser.appendChild(signInBtn);
      list.appendChild(teaser);
      return;
    }
    section.hidden = false;
    list.innerHTML = '<div class="lb-loading">…</div>';
    try {
      const entries = await window.LinkAuth.getWeeklyLeaderboard();
      list.innerHTML = '';
      if (!entries || !entries.length) {
        list.innerHTML = '';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'lb-empty';
        emptyDiv.textContent = t('noScoresYet') || 'No scores yet this week';
        list.appendChild(emptyDiv);
        return;
      }
      entries.forEach((e, i) => {
        const row = document.createElement('div');
        row.className = 'lb-row' + (e.isMe ? ' lb-me' : '');
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        const rank = document.createElement('span');
        rank.className = 'lb-rank';
        rank.textContent = medal;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'lb-name';
        nameSpan.textContent = e.name;
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'lb-score';
        scoreSpan.textContent = typeof e.score === 'number' ? e.score : 0;
        row.append(rank, nameSpan, scoreSpan);
        list.appendChild(row);
      });
    } catch (_) {
      list.innerHTML = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'lb-empty';
      emptyDiv.textContent = t('noScoresYet') || 'No scores yet this week';
      list.appendChild(emptyDiv);
    }
  }

  // ═══════════════════════════════════════════
  //  SETTINGS
  // ═══════════════════════════════════════════
  function syncSettings() {
    populateLanguageSelect();
    syncSwitch('themeSwitch', state.theme === 'light');
    syncSwitch('soundSwitch', state.sound);
    syncSwitch('hapticsSwitch', state.haptics);
    syncSwitch('reduceMotionSwitch', state.reduceMotion);
    syncSwitch('notificationsSwitch', state.notifications);
    syncSwitch('highContrastSwitch', state.highContrast);
    syncSwitch('showGroupsSwitch', state.showGroups);
    syncToggle('themeToggle', state.theme);
    syncToggle('soundToggle', state.sound ? 'on' : 'off');
    syncToggle('hapticsToggle', state.haptics ? 'on' : 'off');
    syncToggle('reduceMotionToggle', state.reduceMotion ? 'on' : 'off');
    syncToggle('notificationsToggle', state.notifications ? 'on' : 'off');
    syncToggle('highContrastToggle', state.highContrast ? 'on' : 'off');
    syncToggle('showGroupsToggle', state.showGroups ? 'on' : 'off');
    renderCosmeticThemeSelector();
    syncDifficulty();
    if (window.LinkAuth) {
      const uid = document.getElementById('userId');
      if (uid) uid.textContent = window.LinkAuth.getUserId();
    }
  }

  function syncSwitch(id, checked) {
    const el = document.getElementById(id);
    if (!el) return;
    const input = el.querySelector('input');
    if (input) input.checked = !!checked;
  }

  function syncToggle(id, value) {
    const group = document.getElementById(id);
    if (!group) return;
    group.querySelectorAll('.toggle-btn').forEach(btn => {
      const isActive = btn.dataset.value === value;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
  }

  function syncDifficulty() {
    document.querySelectorAll('.diff-btn[data-diff]').forEach(btn => {
      const isActive = btn.dataset.diff === state.difficulty;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    });
    const livesBtn = document.querySelector('[data-action="toggleLives"]');
    if (livesBtn) livesBtn.hidden = true;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.theme === 'light' ? '#f8f7ff' : '#7209b7';
    applyCosmeticTheme();
  }

  function applyCosmeticTheme() {
    const root = document.documentElement;
    root.removeAttribute('data-cosmetic');
    const ct = COSMETIC_THEMES.find(t => t.id === state.cosmeticTheme);
    if (ct && ct.vars) {
      root.setAttribute('data-cosmetic', ct.id);
      for (const [k, v] of Object.entries(ct.vars)) {
        root.style.setProperty(k, v);
      }
    } else {
      for (const ct2 of COSMETIC_THEMES) {
        if (ct2.vars) {
          for (const k of Object.keys(ct2.vars)) {
            root.style.removeProperty(k);
          }
        }
      }
    }
  }

  function renderCosmeticThemeSelector() {
    const container = document.getElementById('cosmeticThemeSelector');
    if (!container) return;
    container.innerHTML = '';
    const xp = state.stats.xp || 0;
    for (const ct of COSMETIC_THEMES) {
      const btn = document.createElement('button');
      btn.className = 'cosmetic-theme-btn';
      const unlocked = xp >= ct.xpReq;
      if (!unlocked) btn.classList.add('locked');
      if (ct.id === state.cosmeticTheme) btn.classList.add('active');
      btn.textContent = unlocked ? ct.name : `${ct.name} (${ct.xpReq} XP)`;
      btn.disabled = !unlocked;
      btn.addEventListener('click', () => {
        if (!unlocked) return;
        state.cosmeticTheme = ct.id;
        applyCosmeticTheme();
        save();
        renderCosmeticThemeSelector();
      });
      container.appendChild(btn);
    }
  }

  // ═══════════════════════════════════════════
  //  SHARE
  // ═══════════════════════════════════════════
  function shareResult() {
    const rating = getScoreRating(state.score);
    const num = state.mode === 'daily' ? ` #${getDailyNumber()}` : state.mode === 'archive' && state._archiveDay != null ? ` #${state._archiveDay} 📅` : '';
    const concepts = window.WORD_DATA.concepts;
    const diffLabel = state.difficulty !== 'medium' ? ` [${t(state.difficulty).toUpperCase()}]` : '';
    const optLen = state.puzzle?.optimal || state.chain.length;
    const isPerfectPath = state.chain.length <= optLen;

    const LANG_FLAGS = {en:'🇬🇧',es:'🇪🇸',it:'🇮🇹',fr:'🇫🇷',de:'🇩🇪',pt:'🇵🇹',ru:'🇷🇺',ro:'🇷🇴',uk:'🇺🇦',tr:'🇹🇷',pl:'🇵🇱',nl:'🇳🇱',ja:'🇯🇵',ko:'🇰🇷',zh:'🇨🇳',ar:'🇸🇦',hi:'🇮🇳',id:'🇮🇩',th:'🇹🇭',vi:'🇻🇳'};
    const langFlag = LANG_FLAGS[state.lang] || '';

    const linkEmojis = state.chain.map((c, i) => {
      if (i === 0) return '';
      const gA = concepts[state.chain[i - 1]]?.g;
      const gB = concepts[c]?.g;
      return gA !== gB ? '🟣' : '⚪';
    }).filter(Boolean).join('');

    const ratingLabel = getRatingLabel(rating);
    const ratingStars = getRatingEmoji(rating);
    const streakLine = state.stats.streak > 1 ? `\n🔥 ${state.stats.streak}-day streak` : '';
    const scoreFormatted = state.score.toLocaleString();
    const timeSec = `${Math.floor(state.timer)}s`;

    const text = [
      `LinkWords 🔗${num} · ${langFlag}`,
      linkEmojis,
      `⏱️ ${timeSec} · ${ratingStars} · ${scoreFormatted}pts`,
      `${ratingLabel}${streakLine}`,
      'linkwords.app'
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      navigator.share({ text }).catch(() => copyText(text));
    } else {
      copyText(text);
    }
  }

  function generateChallengeLink() {
    const seed = state.puzzle.seed;
    const data = { s: seed, sc: state.score, n: state.chain.length, d: state.difficulty };
    const encoded = btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${location.origin}${location.pathname}?c=${encoded}`;
  }

  function shareChallenge() {
    const link = generateChallengeLink();
    const text = `${t('challengeFriend')}\n${t('beatScore').replace('{score}', state.score)}\n${link}`;

    if (navigator.share) {
      navigator.share({ text, url: link }).catch(() => copyText(text));
    } else {
      copyText(text);
    }
  }

  function inviteFriend() {
    const bonusXP = 75;
    const maxDaily = 5;
    const todayKey = getTodayKey();
    let inviteData;
    try { inviteData = JSON.parse(localStorage.getItem('lw_invites') || '{}'); } catch { inviteData = {}; }
    if (inviteData.date !== todayKey) { inviteData = { date: todayKey, count: 0 }; }
    const text = `${t('inviteText')}\nlinkwords.app`;

    if (inviteData.count >= maxDaily) {
      showToast(t('inviteLimitReached') || 'Daily invite limit reached');
      return;
    }

    const onSuccess = () => {
      inviteData.count++;
      localStorage.setItem('lw_invites', JSON.stringify(inviteData));
      state.stats.xp = (state.stats.xp || 0) + bonusXP;
      state.stats.level = getLevelNumber(state.stats.xp);
      save();
      showToast(`+${bonusXP} XP!`, 'milestone');
    };

    if (navigator.share) {
      navigator.share({ text, url: 'https://linkwords.app' }).then(onSuccess).catch(() => {});
    } else {
      copyText(text);
      onSuccess();
    }
  }

  function parseChallenge() {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    if (!c || c.length > 512) return;
    try {
      const padded = c.replace(/-/g, '+').replace(/_/g, '/');
      const data = JSON.parse(atob(padded));
      if (Object.prototype.hasOwnProperty.call(data, '__proto__') ||
          Object.prototype.hasOwnProperty.call(data, 'constructor') ||
          Object.prototype.hasOwnProperty.call(data, 'prototype')) return;
      if (typeof data.s === 'number' && Number.isFinite(data.s)) {
        state.challengeSeed = data.s;
        state.challengeScore = (typeof data.sc === 'number' && Number.isFinite(data.sc)) ? data.sc : null;
        state._challengeDifficulty = (data.d && ['easy','medium','hard'].includes(data.d)) ? data.d : null;
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (_) {}
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(t('copied'));
    }).catch(() => {
      showToast(t('copyFailed') || 'Could not copy');
    });
  }

  // ═══════════════════════════════════════════
  //  TOAST & MODAL
  // ═══════════════════════════════════════════
  let _activeToast = null;
  function showToast(msg, variant) {
    if (_activeToast && _activeToast.parentNode) _activeToast.remove();
    const el = document.createElement('div');
    el.className = 'toast-float' + (variant ? ` ${variant}` : '');
    el.textContent = msg;
    el.setAttribute('role', 'status');
    const grid = document.getElementById('wordGrid');
    if (grid) {
      const r = grid.getBoundingClientRect();
      el.style.top = (r.top + r.height * 0.05) + 'px';
    } else {
      el.style.top = '55%';
    }
    document.body.appendChild(el);
    _activeToast = el;
    announce(msg);
    el.addEventListener('animationend', () => { el.remove(); if (_activeToast === el) _activeToast = null; }, { once: true });
  }

  let modalResolve = null;
  let _modalTrigger = null;
  function showModal(text) {
    return new Promise(resolve => {
      modalResolve = resolve;
      _modalTrigger = document.activeElement;
      document.getElementById('modalText').textContent = text;
      const modal = document.getElementById('modal');
      modal.hidden = false;
      const content = modal.querySelector('.modal-content');
      content.focus();
      modal._trapHandler = (e) => {
        if (e.key === 'Escape') { closeModal(false); return; }
        if (e.key !== 'Tab') return;
        const focusable = content.querySelectorAll('button, [tabindex]');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      };
      modal.addEventListener('keydown', modal._trapHandler);
    });
  }

  function closeModal(result) {
    const modal = document.getElementById('modal');
    modal.hidden = true;
    if (modal._trapHandler) {
      modal.removeEventListener('keydown', modal._trapHandler);
      modal._trapHandler = null;
    }
    if (_modalTrigger && _modalTrigger.focus) {
      _modalTrigger.focus();
      _modalTrigger = null;
    }
    if (modalResolve) { modalResolve(result); modalResolve = null; }
  }

  // ═══════════════════════════════════════════
  //  PARTICLES
  // ═══════════════════════════════════════════
  function spawnParticles(x, y, count = 12, customColors) {
    if (state.reduceMotion) return;
    const cores = navigator.hardwareConcurrency || 4;
    const cap = cores <= 2 ? Math.min(count, 6) : cores <= 4 ? Math.min(count, 12) : count;
    const colors = customColors || ['#f72585', '#7209b7', '#4361ee', '#4cc9f0', '#f8961e', '#ffd60a', '#06d6a0'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cap; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      const size = 4 + Math.random() * 8;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 60 + Math.random() * 100;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 40;
      const dur = 0.5 + Math.random() * 0.5;
      el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};--tx:${tx}px;--ty:${ty}px;--duration:${dur}s;`;
      el.addEventListener('animationend', () => el.remove(), { once: true });
      frag.appendChild(el);
    }
    document.body.appendChild(frag);
  }

  function updateMenuLevel() {
    const xp = state.stats.xp || 0;
    const progress = getLevelProgress(xp);
    const lvl = progress.level || 1;
    const title = getLevelTitle(lvl);

    const levelNum = document.getElementById('levelNum');
    if (levelNum) levelNum.textContent = lvl;

    const titleEl = document.getElementById('levelTitle');
    if (titleEl) titleEl.textContent = title;

    const bar = document.getElementById('xpBar');
    if (bar) bar.style.transform = `scaleX(${progress.pct})`;

    const xpText = document.getElementById('xpText');
    if (xpText) xpText.textContent = `${progress.current} / ${progress.required} ${t('xp') || 'XP'}`;
  }

  function showLevelUp(level) {
    const title = getLevelTitle(level);
    const el = document.createElement('div');
    el.className = 'rank-popup';
    el.textContent = `⬆ ${t('level') || 'Level'} ${level}`;
    const grid = document.getElementById('wordGrid');
    if (grid) {
      const r = grid.getBoundingClientRect();
      el.style.top = (r.top + r.height / 2) + 'px';
    }
    document.body.appendChild(el);
    playSound('achievement');
    vibrate([30, 50, 30, 50, 100]);
    const isBigMilestone = level >= 50 || level % 10 === 0;
    spawnParticles(window.innerWidth / 2, window.innerHeight / 3, isBigMilestone ? 15 : 10, ['#ffd60a', '#f8961e']);
    if (isBigMilestone) spawnConfetti(20);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    // level title toast — silent
  }

  function spawnConfetti(count = 40) {
    if (state.reduceMotion) return;
    const cores = navigator.hardwareConcurrency || 4;
    const cap = cores <= 2 ? Math.min(count, 8) : cores <= 4 ? Math.min(count, 15) : Math.min(count, 25);
    const colors = ['#f72585', '#7209b7', '#4361ee', '#4cc9f0', '#f8961e', '#ffd60a', '#06d6a0', '#ff6b6b'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cap; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      const size = 6 + Math.random() * 10;
      const startX = Math.random() * window.innerWidth;
      const tx = (Math.random() - 0.5) * 200;
      const ty = window.innerHeight * 0.6 + Math.random() * window.innerHeight * 0.4;
      const rot = (360 + Math.random() * 720) + 'deg';
      const dur = 1.2 + Math.random() * 0.8;
      const delay = Math.random() * 0.4;
      const isRect = Math.random() > 0.5;
      el.style.cssText = `left:${startX}px;top:-${size}px;width:${size}px;height:${isRect ? size * 2.5 : size}px;background:${colors[i % colors.length]};border-radius:${isRect ? '2px' : '50%'};--conf-tx:${tx}px;--conf-ty:${ty}px;--conf-rot:${rot};--conf-dur:${dur}s;animation-delay:${delay}s;`;
      el.addEventListener('animationend', () => el.remove(), { once: true });
      frag.appendChild(el);
    }
    document.body.appendChild(frag);
  }

  const _achQueue = [];
  let _achShowing = false;

  function showAchievementPopup(icon, name) {
    _achQueue.push({ icon, name });
    if (!_achShowing) _showNextAchievement();
  }

  function _showNextAchievement() {
    if (!_achQueue.length) { _achShowing = false; return; }
    _achShowing = true;
    const { icon, name } = _achQueue.shift();
    const el = document.createElement('div');
    el.className = 'achievement-popup';
    el.setAttribute('aria-hidden', 'true');
    const iconSpan = document.createElement('span');
    iconSpan.className = 'ach-icon';
    iconSpan.textContent = icon;
    const labelSpan = document.createElement('span');
    labelSpan.className = 'ach-label';
    labelSpan.textContent = name;
    el.append(iconSpan, labelSpan);
    document.body.appendChild(el);
    announce(`${icon} ${name}`);
    el.addEventListener('animationend', () => {
      el.remove();
      setTimeout(_showNextAchievement, 200);
    }, { once: true });
  }

  // ═══════════════════════════════════════════
  //  WEEKLY TRIAL MODE
  // ═══════════════════════════════════════════
  const WEEKLY_RULES = [
    { id: 'noCross',    key: 'ruleNoCross',    mod: g => { g._trialRule = 'noCross'; } },
    { id: 'crossOnly',  key: 'ruleCrossOnly',  mod: g => { g._trialRule = 'crossOnly'; } },
    { id: 'noHints',    key: 'ruleNoHints',    mod: g => { g._trialRule = 'noHints'; } },
    { id: 'longRoute',  key: 'ruleLongRoute',  mod: g => { g._trialRule = 'longRoute'; } }
  ];

  function getWeeklyRule() {
    const weekNum = Math.floor(getDailyNumber() / 7);
    return WEEKLY_RULES[weekNum % WEEKLY_RULES.length];
  }

  function startWeeklyTrial() {
    const rule = getWeeklyRule();
    showToast(`${t('weeklyRule') || 'Rule'}: ${t(rule.key) || rule.id}`, 'info');
    state._trialRule = rule.id;
    if (rule.id === 'noHints') state.hintsLeft = 0;
    startGame('endless');
  }

  // ═══════════════════════════════════════════
  //  WORD RUSH MODE
  // ═══════════════════════════════════════════
  function startWordRush() {
    state._rushMode = true;
    state._rushSolved = 0;
    state._rushStrikes = 0;
    state._rushMaxStrikes = 3;
    state._rushStartTime = Date.now();
    nextRushPuzzle();
  }

  function nextRushPuzzle() {
    if (state._rushStrikes >= state._rushMaxStrikes) {
      endWordRush();
      return;
    }
    const seed = (Date.now() & 0x7FFFFFFF) ^ ((Math.random() * 0x7FFFFFFF) | 0);
    state.puzzle = generatePuzzle(seed, 'easy');
    if (!state.puzzle) { endWordRush(); return; }
    state.chain = [];
    state.chainSet = new Set();
    state.chainMultipliers = [];
    state.runningScore = 0;
    state.combo = 0;
    state.multiplier = 1;
    state.hintsLeft = 0;
    state.hintsUsed = 0;
    state.gameOver = false;
    state._usedUndo = false;
    state._undoCount = 0;
    state.mode = 'endless';
    precomputeEndDistances(state.puzzle.end);
    renderGame();
    updateGrid();
    updateActions();
    showScreen('game');
    _updateHeaderCache();
    const banner = document.getElementById('challengeBanner');
    if (banner) {
      banner.textContent = `${t('wordRush') || 'Word Rush'} — ${(t('rushSolved') || '{n} solved').replace('{n}', state._rushSolved)} | ${(t('rushStrikes') || '{n} strikes left').replace('{n}', state._rushMaxStrikes - state._rushStrikes)}: ${'✕'.repeat(state._rushStrikes)}${'○'.repeat(state._rushMaxStrikes - state._rushStrikes)}`;
      banner.hidden = false;
    }
    startTimer();
  }

  function rushPuzzleComplete() {
    state._rushSolved++;
    // rush solved toast — silent
    setTimeout(() => nextRushPuzzle(), 800);
  }

  function rushPuzzleFail() {
    state._rushStrikes++;
    if (state._rushStrikes >= state._rushMaxStrikes) {
      endWordRush();
    } else {
      showToast(`${t('rushStrikes') || 'Strike'} ${state._rushStrikes}/${state._rushMaxStrikes}`, 'warning');
      setTimeout(() => nextRushPuzzle(), 800);
    }
  }

  function endWordRush() {
    state._rushMode = false;
    stopTimer();
    const elapsed = Math.floor((Date.now() - state._rushStartTime) / 1000);
    const rushXP = state._rushSolved * 30;
    state.stats.xp = (state.stats.xp || 0) + rushXP;
    state.stats.level = getLevelNumber(state.stats.xp);
    save();

    document.getElementById('resultEmoji').textContent = '⚡';
    document.getElementById('resultTitle').textContent = `${t('wordRush') || 'Word Rush'} — ${state._rushSolved} ${t('rushSolved') || 'solved'}`;
    const subEl = document.getElementById('resultSubtitle');
    if (subEl) subEl.textContent = `${formatTime(elapsed)} · +${rushXP} XP`;
    document.getElementById('resultChainLen').textContent = '';
    document.getElementById('resultTime').textContent = formatTime(elapsed);
    document.getElementById('resultScore').textContent = state._rushSolved;
    clearResultScreen();
    const paBtn = document.querySelector('[data-action="playAgain"]');
    if (paBtn) paBtn.hidden = false;
    showScreen('result');
  }

  // ═══════════════════════════════════════════
  //  WEEKLY / MONTHLY RECAP
  // ═══════════════════════════════════════════
  function renderWeeklyRecap() {
    const el = document.getElementById('weeklyRecap');
    if (!el) return;
    const s = state.stats;
    if (s.played < 7) { el.hidden = true; return; }
    el.hidden = false;
    const weekScores = (s.scores || []).slice(-7);
    const weekAvg = weekScores.length ? Math.round(weekScores.reduce((a, b) => a + b, 0) / weekScores.length) : 0;
    const weekBest = weekScores.length ? Math.max(...weekScores) : 0;
    el.innerHTML = `<h4>${t('weekInLinks') || 'Your Week in Links'}</h4><div class="recap-stats"><span>${t('statPlayed') || 'Played'}: ${weekScores.length}</span> · <span>Avg: ${weekAvg}</span> · <span>Best: ${weekBest}</span></div>`;
  }

  // ═══════════════════════════════════════════
  //  TUTORIAL
  // ═══════════════════════════════════════════
  function showTutorialSlide(n) {
    const slides = document.querySelectorAll('.tutorial-slide');
    const visibleSlides = [...slides].filter(s => !s.classList.contains('desktop-only') || window.innerWidth >= 768);
    const totalVisible = visibleSlides.length;
    if (n >= totalVisible) n = totalVisible - 1;
    state.tutorialSlide = n;
    let visIdx = 0;
    slides.forEach(s => {
      const isDesktopOnly = s.classList.contains('desktop-only');
      const isVisible = !isDesktopOnly || window.innerWidth >= 768;
      if (isVisible) {
        s.classList.toggle('active', visIdx === n);
        s.classList.toggle('exit', visIdx < n);
        s.hidden = false;
        visIdx++;
      } else {
        s.classList.remove('active', 'exit');
        s.hidden = true;
      }
    });
    const dots = document.querySelectorAll('.tutorial-dots .dot');
    let dotIdx = 0;
    dots.forEach(d => {
      const isDesktopOnly = d.classList.contains('desktop-only');
      const isVisible = !isDesktopOnly || window.innerWidth >= 768;
      if (isVisible) {
        d.classList.toggle('active', dotIdx === n);
        d.hidden = false;
        dotIdx++;
      } else {
        d.hidden = true;
      }
    });

    const btn = document.querySelector('[data-action="tutorialNext"]');
    if (!btn) return;
    if (n >= totalVisible - 1) {
      btn.textContent = t('play');
      btn.dataset.action = 'tutorialDone';
    } else {
      btn.textContent = t('next');
      btn.dataset.action = 'tutorialNext';
    }
  }

  // ═══════════════════════════════════════════
  //  INTERACTIVE ONBOARDING
  // ═══════════════════════════════════════════
  const MICRO_PUZZLES = [
    {
      start: 'sun', end: 'moon',
      words: ['star', 'gold', 'fire', 'dawn'],
      optimal: 3, optimalPath: ['sun', 'star', 'moon'],
      hint: () => t('obHint1')
    },
    {
      start: 'tree', end: 'ocean',
      words: ['wind', 'storm', 'bird', 'leaf', 'rain', 'forest'],
      optimal: 4, optimalPath: ['tree', 'wind', 'storm', 'ocean'],
      hint: () => t('obHint2')
    },
    {
      start: 'fire', end: 'ice',
      words: ['smoke', 'cloud', 'storm', 'ash', 'dragon', 'water', 'snow', 'ember'],
      optimal: 5, optimalPath: ['fire', 'smoke', 'cloud', 'storm', 'ice'],
      hint: () => t('obHint3')
    }
  ];

  const onboarding = {
    step: 0,
    active: false,
    _prevMode: null,

    shouldShow() {
      return !localStorage.getItem('lw_tutorialDone');
    },

    start() {
      if (this.active) return;
      this.active = true;
      this.step = 0;
      this._prevMode = state.mode;
      this._loadMicroPuzzle(0);
    },

    _loadMicroPuzzle(idx) {
      this.step = idx;
      const mp = MICRO_PUZZLES[idx];
      state.puzzle = {
        start: mp.start, end: mp.end,
        words: mp.words.slice(),
        optimal: mp.optimal,
        optimalPath: mp.optimalPath,
        seed: 0
      };
      state.chain = [];
      state.chainSet = new Set();
      state.score = 0;
      state.runningScore = 0;
      state.combo = 0;
      state.multiplier = 1;
      state.hintsLeft = 0;
      state.hintsUsed = 0;
      state.gameOver = false;
      state.mode = 'endless';
      state._undoCount = 0;
      state._reachable = computeReachability(state.puzzle, state.chainSet);

      showScreen('game');
      renderGame();
      updateGrid();
      updateActions();

      const overlay = document.getElementById('onboarding');
      overlay.hidden = false;
      overlay.classList.add('step-interactive');
      const textEl = document.getElementById('onboardingText');
      textEl.textContent = typeof mp.hint === 'function' ? mp.hint() : mp.hint;
      const nextBtn = document.getElementById('onboardingNext');
      nextBtn.textContent = t('obSkip') || 'Skip';
      nextBtn.style.display = '';
      const skipBtn = document.getElementById('onboardingSkip');
      skipBtn.style.display = 'none';
      const spotlight = document.getElementById('onboardingSpotlight');
      spotlight.style.display = 'none';
      const tooltip = document.getElementById('onboardingTooltip');
      tooltip.style.top = '12px';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.classList.remove('tooltip-in');
      requestAnimationFrame(() => tooltip.classList.add('tooltip-in'));

      this._renderProgress();
    },

    _renderProgress() {
      const dotsEl = document.getElementById('onboardingDots');
      dotsEl.innerHTML = '';
      for (let i = 0; i < MICRO_PUZZLES.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'onboarding-dot';
        if (i < this.step) dot.classList.add('done');
        if (i === this.step) dot.classList.add('active');
        dotsEl.appendChild(dot);
      }
    },

    onPuzzleComplete() {
      if (!this.active) return;
      const overlay = document.getElementById('onboarding');
      const textEl = document.getElementById('onboardingText');
      if (this.step < MICRO_PUZZLES.length - 1) {
        textEl.textContent = '✓ ' + t('obGreat');
        setTimeout(() => this._loadMicroPuzzle(this.step + 1), 1200);
      } else {
        textEl.textContent = '✓ ' + t('obReady');
        setTimeout(() => this.finish(), 1200);
      }
    },

    finish() {
      this.active = false;
      const overlay = document.getElementById('onboarding');
      overlay.hidden = true;
      overlay.classList.remove('step-interactive');
      localStorage.setItem('lw_tutorialDone', '1');
      state.firstRun = false;
      state.gameOver = true;
      save();
      showScreen('menu');
      if (window.LinkAuth && !window.LinkAuth.hasGdprConsent()) {
        setTimeout(() => window.LinkAuth.showGdprBanner(), 500);
      }
    },

    bindEvents() {
      document.getElementById('onboardingNext').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.step < MICRO_PUZZLES.length - 1) {
          this._loadMicroPuzzle(this.step + 1);
        } else {
          this.finish();
        }
      });

      document.getElementById('onboardingSkip')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.finish();
      });

      document.getElementById('onboardingBackdrop')?.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  };

  // ═══════════════════════════════════════════
  //  EVENT HANDLERS
  // ═══════════════════════════════════════════
  function bindEvents() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {
        case 'startDaily':
          if (state.daily[getTodayKey()]) {
            const d = state.daily[getTodayKey()];
            const recap = `${t('dailyAlreadyDone') || 'Already completed today!'}\n${d.score || 0} pts · ${formatTime(d.time || 0)}`;
            showToast(recap);
            break;
          }
          startGame('daily');
          break;
        case 'startBonus':
          startBonusPuzzle();
          break;
        case 'startComeback':
          startComebackChallenge();
          break;
        case 'dismissWelcomeBack':
          { const wb = document.getElementById('welcomeBackCard'); if (wb) wb.hidden = true; }
          break;
        case 'startEndless':
          startGame('endless');
          break;
        case 'startBlitz':
          startGame('blitz');
          break;
        case 'openArchive':
          openArchive();
          break;
        case 'toggleLives':
          break;
        case 'startWeeklyTrial':
          startWeeklyTrial();
          break;
        case 'startWordRush':
          startWordRush();
          break;
        case 'resumeGame':
          resumeGame();
          break;
        case 'showStats':
          showScreen('stats');
          break;
        case 'showHowTo':
          showTutorialSlide(0);
          showScreen('howto');
          break;
        case 'showSettings':
          showScreen('settings');
          break;
        case 'goBack':
          if (state.screen === 'game') { stopTimer(); stopBlitz(); }
          showScreen(state.prevScreen || 'menu');
          break;
        case 'goHome':
          stopTimer();
          stopBlitz();
          showScreen('menu');
          break;
        case 'confirmExit':
          showModal(t('exitConfirm')).then(ok => {
            if (ok) { stopTimer(); stopBlitz(); showScreen('menu'); }
          });
          break;
        case 'giveUp':
          showModal(t('giveUpConfirm') || 'Give up and see the solution?').then(ok => {
            if (ok) giveUp();
          });
          break;
        case 'modalConfirm':
          closeModal(true);
          break;
        case 'modalCancel':
          closeModal(false);
          break;
        case 'undo':
          if (state._atDeadEnd) { undoToSafe(); state._atDeadEnd = false; }
          else undoLast();
          break;
        case 'hint':
          useHint();
          break;
        case 'shareResult':
          shareResult();
          break;
        case 'shareCard':
          shareCardImage();
          break;
        case 'challengeFriend':
          shareChallenge();
          break;
        case 'inviteFriend':
          inviteFriend();
          break;
        case 'playAgain':
          stopBlitz();
          stopTimer();
          state.challengeSeed = null;
          state.challengeScore = null;
          if (state.mode === 'archive') {
            showScreen('menu');
          } else {
            startGame(state.mode || 'endless');
          }
          break;
        case 'suggestEndless':
          stopBlitz();
          stopTimer();
          state.challengeSeed = null;
          state.challengeScore = null;
          startGame('endless');
          break;
        case 'suggestBlitz':
          stopBlitz();
          stopTimer();
          state.challengeSeed = null;
          state.challengeScore = null;
          startGame('blitz');
          break;
        case 'tutorialNext':
          showTutorialSlide(state.tutorialSlide + 1);
          break;
        case 'tutorialDone':
          state.firstRun = false;
          save();
          showScreen('menu');
          break;
        case 'toggleSound':
          state.sound = !state.sound;
          document.body.classList.toggle('sound-off', !state.sound);
          btn.setAttribute('aria-pressed', String(state.sound));
          save();
          break;
        case 'signInGoogle':
          if (window.LinkAuth) window.LinkAuth.signInWithGoogle();
          break;
        case 'signInApple':
          if (window.LinkAuth) window.LinkAuth.signInWithApple();
          break;
        case 'signInFacebook':
          if (window.LinkAuth) window.LinkAuth.signInWithFacebook();
          break;
        case 'signOut':
          if (window.LinkAuth) window.LinkAuth.signOut();
          break;
        case 'deleteAccount':
          showModal(t('deleteAccountConfirm') || 'Delete your account and all cloud data? This cannot be undone.').then(ok => {
            if (ok && window.LinkAuth) window.LinkAuth.deleteAccount();
          });
          break;
        case 'exportData':
          if (window.LinkAuth) window.LinkAuth.exportData();
          break;
        case 'rateApp':
          if (window.LinkAuth) window.LinkAuth.rateApp();
          break;
        case 'contactSupport':
          if (window.LinkAuth) window.LinkAuth.contactSupport();
          break;
        case 'watchAdHint':
          if (window.LinkAds && window.LinkAds.isRewardedReady()) {
            window.LinkAds.showRewarded(() => {
              state.hintsLeft++;
              document.getElementById('hintCount').textContent = state.hintsLeft;
              updateWatchAdHintBtn();
              showToast(t('watchAdHint'));
              playSound('hint');
            });
          }
          break;
        case 'doubleXp':
          if (window.LinkAds && window.LinkAds.isRewardedReady() && !state._xpDoubled) {
            window.LinkAds.showRewarded(() => {
              const bonus = state._lastEarnedXP || 0;
              const oldLevel = getLevelNumber(state.stats.xp || 0);
              state.stats.xp = (state.stats.xp || 0) + bonus;
              state.stats.level = getLevelNumber(state.stats.xp);
              state._xpDoubled = true;
              const xpDetail2 = document.getElementById('resultXPDetail');
              if (xpDetail2) xpDetail2.textContent = `+${bonus * 2} XP`;
              const dxpBtn = document.getElementById('doubleXpBtn');
              if (dxpBtn) dxpBtn.hidden = true;
              if (state.stats.level > oldLevel) showLevelUp(state.stats.level);
              save();
              showToast(t('doubleXp'));
              playSound('achievement');
            });
          }
          break;
        case 'removeAds':
          if (window.LinkAds) window.LinkAds.purchaseRemoveAds();
          break;
        case 'restorePurchases':
          if (window.LinkAds) {
            window.LinkAds.restorePurchases().then(ok => {
              showToast(ok ? (t('purchaseRestored') || 'Purchase restored!') : (t('noPurchaseFound') || 'No purchase found.'));
            });
          }
          break;
        case 'managePrivacy':
          showScreen('privacyManager');
          if (window.LinkAuth) window.LinkAuth.updatePrivacyUI();
          break;
        case 'ccpaOptOut':
          if (window.LinkAuth) {
            const current = window.LinkAuth.getCcpaOptOut();
            window.LinkAuth.setCcpaOptOut(!current);
            const msg = !current ? (t('ccpaOptedOut') || 'Your data will not be sold or shared.') : (t('ccpaOptedIn') || 'Preference updated.');
            showToast(msg);
          }
          break;
        case 'savePrivacy': {
          const analyticsEl = document.getElementById('privacyAnalytics');
          const personalizationEl = document.getElementById('privacyPersonalization');
          if (window.LinkAuth) {
            window.LinkAuth.setGdprConsent({
              analytics: analyticsEl?.checked || false,
              personalization: personalizationEl?.checked || false
            });
          }
          if (window.LinkAds) window.LinkAds.init();
          showScreen('settings');
          showToast(t('preferencesSaved') || 'Preferences saved');
          break;
        }
        case 'gdprAcceptAll':
          if (window.LinkAuth) {
            window.LinkAuth.setGdprConsent({ analytics: true, personalization: true });
            window.LinkAuth.hideGdprBanner();
          }
          if (window.LinkAds) window.LinkAds.init();
          break;
        case 'gdprReject':
          if (window.LinkAuth) {
            window.LinkAuth.setGdprConsent({ analytics: false, personalization: false });
            window.LinkAuth.hideGdprBanner();
          }
          if (window.LinkAds) window.LinkAds.init();
          break;
        case 'gdprManage':
          if (window.LinkAuth) window.LinkAuth.hideGdprBanner();
          showScreen('privacyManager');
          break;
      }
    });

    // Bottom nav tab clicks
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
      bottomNav.addEventListener('click', (e) => {
        const tab = e.target.closest('.nav-tab');
        if (!tab) return;
        const target = tab.dataset.nav;
        if (!target) return;
        const screenEl = document.getElementById(target);
        showScreen(screenEl ? target : 'menu');
      });
    }

    // Desktop topbar nav clicks
    const desktopNav = document.getElementById('desktopTopbar');
    if (desktopNav) {
      desktopNav.addEventListener('click', (e) => {
        const link = e.target.closest('[data-nav]');
        if (!link) return;
        e.preventDefault();
        const target = link.dataset.nav;
        if (target) showScreen(target);
      });
    }

    // Keyboard shortcuts during game
    document.addEventListener('keydown', (e) => {
      if (state.screen !== 'game' || state.gameOver) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        document.querySelector('[data-action="confirmExit"]')?.click();
        return;
      }
      if (e.key === 'u' || e.key === 'U' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        undoLast();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        useHint();
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const cells = document.querySelectorAll('.word-cell.connectable');
        if (cells[num - 1]) cells[num - 1].click();
      }
    });

    // Difficulty selector
    const diffBtns = [...document.querySelectorAll('.diff-btn[data-diff]')];
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.difficulty === btn.dataset.diff) return;
        state.difficulty = btn.dataset.diff;
        syncDifficulty();
        save();
        playSound('click');
        vibrate(15);
      });
    });
    const diffGroup = document.getElementById('difficultySelector');
    if (diffGroup) {
      diffGroup.addEventListener('keydown', e => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        const idx = diffBtns.findIndex(b => b.dataset.diff === state.difficulty);
        const next = diffBtns[(idx + dir + diffBtns.length) % diffBtns.length];
        if (next) { next.click(); next.focus(); }
      });
    }

    // Language select
    const langSel = document.getElementById('langSelect');
    if (langSel) {
      langSel.addEventListener('change', (e) => {
        state.lang = e.target.value;
        loadLanguagePack(state.lang).then(() => applyI18n());
        if (state.puzzle && document.getElementById('game').classList.contains('active')) {
          const savedScore = state.runningScore;
          const savedTimer = state.timer;
          renderGame();
          document.getElementById('scoreDisplay').textContent = savedScore;
          document.getElementById('timerDisplay').textContent = state.mode === 'blitz' ? formatTime(state.blitzTime) : formatTime(savedTimer);
          updateGrid();
        }
        save();
      });
    }

    // Settings switches (iOS-style toggles — mobile)
    const switchHandlers = {
      themeSwitch: (on) => { state.theme = on ? 'light' : 'dark'; applyTheme(); syncToggle('themeToggle', state.theme); },
      soundSwitch: (on) => { state.sound = on; document.body.classList.toggle('sound-off', !on); syncToggle('soundToggle', on ? 'on' : 'off'); },
      hapticsSwitch: (on) => { state.haptics = on; syncToggle('hapticsToggle', on ? 'on' : 'off'); },
      reduceMotionSwitch: (on) => { state.reduceMotion = on; document.documentElement.classList.toggle('reduce-motion', on); syncToggle('reduceMotionToggle', on ? 'on' : 'off'); },
      notificationsSwitch: (on) => { state.notifications = on; if (on) requestNotificationPermission(); syncToggle('notificationsToggle', on ? 'on' : 'off'); },
      highContrastSwitch: (on) => { state.highContrast = on; document.documentElement.classList.toggle('high-contrast', on); syncToggle('highContrastToggle', on ? 'on' : 'off'); },
      showGroupsSwitch: (on) => { state.showGroups = on; document.querySelectorAll('.group-dot').forEach(d => d.hidden = !on); syncToggle('showGroupsToggle', on ? 'on' : 'off'); },
    };
    Object.keys(switchHandlers).forEach(id => {
      const sw = document.getElementById(id);
      if (!sw) return;
      const input = sw.querySelector('input');
      if (!input) return;
      input.addEventListener('change', () => {
        switchHandlers[id](input.checked);
        save();
      });
    });

    // Toggle groups (On/Off buttons — desktop)
    document.querySelectorAll('.toggle-group').forEach(group => {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.dataset.value;
        const id = group.id;
        if (id === 'themeToggle') { state.theme = val; applyTheme(); syncSwitch('themeSwitch', val === 'light'); }
        else if (id === 'soundToggle') { state.sound = val === 'on'; document.body.classList.toggle('sound-off', !state.sound); syncSwitch('soundSwitch', state.sound); }
        else if (id === 'hapticsToggle') { state.haptics = val === 'on'; syncSwitch('hapticsSwitch', state.haptics); }
        else if (id === 'reduceMotionToggle') { state.reduceMotion = val === 'on'; document.documentElement.classList.toggle('reduce-motion', state.reduceMotion); syncSwitch('reduceMotionSwitch', state.reduceMotion); }
        else if (id === 'notificationsToggle') { state.notifications = val === 'on'; if (state.notifications) requestNotificationPermission(); syncSwitch('notificationsSwitch', state.notifications); }
        else if (id === 'highContrastToggle') { state.highContrast = val === 'on'; document.documentElement.classList.toggle('high-contrast', state.highContrast); syncSwitch('highContrastSwitch', state.highContrast); }
        else if (id === 'showGroupsToggle') { state.showGroups = val === 'on'; document.querySelectorAll('.group-dot').forEach(d => d.hidden = !state.showGroups); syncSwitch('showGroupsSwitch', state.showGroups); }
        save();
      });
    });

    // Start/end word clicks
    document.getElementById('startWord')?.addEventListener('click', () => {
      if (state.puzzle && state.chain.length === 0) {
        onWordClick(state.puzzle.start);
      }
    });

    document.getElementById('endWord')?.addEventListener('click', () => {
      if (state.puzzle && state.chain.length > 0) {
        onWordClick(state.puzzle.end);
      }
    });

    // Keyboard accessibility for endpoints
    document.getElementById('startWord')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.puzzle && state.chain.length === 0) onWordClick(state.puzzle.start);
      }
    });

    document.getElementById('endWord')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.puzzle && state.chain.length > 0) onWordClick(state.puzzle.end);
      }
    });

    window.addEventListener('popstate', (e) => {
      state._isPopState = true;
      if (e.state && e.state.screen) {
        showScreen(e.state.screen);
      } else if (state.screen !== 'menu') {
        showScreen('menu');
      }
    });
  }

  // ═══════════════════════════════════════════
  //  V3 DESIGN — POPULATE NEW ELEMENTS
  // ═══════════════════════════════════════════
  const CHAIN_TONES = ['inkblue', 'plum', 'forest', 'amber'];

  function populateSplash() {
    const dayNum = getDailyNumber();
    const el = document.getElementById('splashKicker');
    if (el) el.textContent = `№ ${dayNum}`;
    const dateEl = document.getElementById('splashDate');
    if (dateEl) {
      const d = new Date();
      const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      dateEl.textContent = `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
    }
  }

  function populateMenuMasthead() {
    const dayNum = getDailyNumber();
    const d = new Date();
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

    const kicker = document.getElementById('mastheadKicker');
    if (kicker) kicker.textContent = `№ ${dayNum} · ${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;

    const solved = document.getElementById('mastheadSolved');
    if (solved) {
      const count = Object.keys(state.daily).filter(k => !k.startsWith('archive_') && !k.endsWith('_bonus')).length;
      if (count > 0) solved.textContent = `${count} solved`;
      else solved.textContent = '';
    }

    const theme = getDailyTheme();
    const themeName = document.getElementById('heroThemeName');
    if (themeName) {
      const em = themeName.querySelector('em');
      if (em) em.textContent = theme.name || t('dailyPath') || 'Daily Path';
      else themeName.innerHTML = `<em>${theme.name || t('dailyPath') || 'Daily Path'}</em>`;
    }

    const puzzle = generatePuzzle(dayNum, state.difficulty, theme.groups, true, getDailyDist(dayNum));
    if (puzzle) {
      const startEl = document.getElementById('heroStartWord');
      if (startEl) startEl.textContent = getWord(puzzle.start);
      const endEl = document.getElementById('heroEndWord');
      if (endEl) endEl.textContent = getWord(puzzle.end);
    }

    const streakCount = document.getElementById('menuStreakCount');
    if (streakCount) streakCount.textContent = state.stats.streak || 0;
    const streakPill = document.getElementById('menuStreakPill');
    if (streakPill) streakPill.classList.toggle('hidden', !state.stats.streak);
  }

  function populateResultExtras(score) {
    const dayNum = getDailyNumber();
    const kicker = document.getElementById('resultKicker');
    if (kicker) {
      if (state.mode === 'daily') kicker.textContent = `№ ${dayNum} · SOLVED`;
      else if (state.mode === 'endless') kicker.textContent = 'FREE WEAVE · SOLVED';
      else if (state.mode === 'blitz') kicker.textContent = 'BLITZ · SOLVED';
      else kicker.textContent = 'SOLVED';
    }

    const hintsEl = document.getElementById('resultHintsUsed');
    if (hintsEl) hintsEl.textContent = state.hintsUsed || 0;

    const pathCount = document.getElementById('resultPathCount');
    if (pathCount) pathCount.textContent = `${state.chain.length} links`;

    const streakText = document.getElementById('resultStreakText');
    if (streakText) {
      const s = state.stats.streak;
      if (s > 0) {
        streakText.textContent = `${s} day streak`;
        const streakEl = document.getElementById('resultStreak');
        if (streakEl) streakEl.hidden = false;
      } else {
        const streakEl = document.getElementById('resultStreak');
        if (streakEl) streakEl.hidden = true;
      }
    }
  }

  function populateStatsHero() {
    const s = state.stats;
    const streakNum = document.getElementById('statsStreakNum');
    if (streakNum) streakNum.textContent = s.streak || 0;
    const longest = document.getElementById('statsLongestStreak');
    if (longest) longest.textContent = s.maxStreak || 0;
    const winRate = document.getElementById('statsWinRateHero');
    if (winRate) winRate.textContent = s.played ? Math.round((s.won / s.played) * 100) + '%' : '0%';
    const played = document.getElementById('statsPlayedHero');
    if (played) played.textContent = s.played || 0;

    const weekTotal = document.getElementById('statsWeekTotal');
    if (weekTotal) {
      const today = new Date();
      const dow = (today.getUTCDay() + 6) % 7;
      let total = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - (dow - i));
        const key = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
        const entry = state.daily[key];
        if (entry && entry.score) total += entry.score;
      }
      weekTotal.textContent = total > 0 ? `${total.toLocaleString()} total` : '';
    }
  }

  function populateCollectionCounter() {
    const el = document.getElementById('collectionCounter');
    if (!el) return;
    const colStats = getCollectionStats();
    if (colStats.totalWords) {
      el.textContent = `${colStats.totalFound}/${colStats.totalWords}`;
    }
  }

  function getChainTone(index) {
    return CHAIN_TONES[index % CHAIN_TONES.length];
  }

  // ═══════════════════════════════════════════
  //  BOOT
  // ═══════════════════════════════════════════
  function init() {
    LW.graph.init(state);
    LW.scoring.init(state);
    LW.i18n.init(state);
    LW.audio.init(state);
    LW.collection.init(state, getWord, t);
    mergeExtraStrings();
    load();
    loadLanguagePack(state.lang);
    if (state.lang !== 'en') loadLanguagePack('en');
    pruneDailyHistory();
    buildConnectionSets();
    applyTheme();
    if (state.reduceMotion) document.documentElement.classList.add('reduce-motion');
    if (state.highContrast) document.documentElement.classList.add('high-contrast');
    applyI18n();
    populateLanguageSelect();
    syncDifficulty();
    document.body.classList.toggle('sound-off', !state.sound);
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) soundBtn.setAttribute('aria-pressed', String(state.sound));
    document.querySelectorAll('.screen:not(.active)').forEach(s => { s.inert = true; });
    bindEvents();
    onboarding.bindEvents();
    parseChallenge();
    renderStreakCalendar();
    populateSplash();
    populateMenuMasthead();

    const savedGame = loadGameState();
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
      continueBtn.hidden = !savedGame;
    }
    updateMenuLevel();
    updateComebackBanner();
    applySeasonalEvent();
    if (state.stats.played >= 3) requestNotificationPermission();
    scheduleDailyReminder();

    const splashLoader = document.getElementById('splashLoader');
    const splashTap = document.getElementById('splashTap');
    if (splashLoader) splashLoader.classList.add('loading');
    let _splashExited = false;
    function exitSplash() {
      if (_splashExited) return;
      _splashExited = true;
      if (state.challengeSeed) {
        startGame('endless');
      } else if (onboarding.shouldShow()) {
        showScreen('menu');
        setTimeout(() => onboarding.start(), 300);
      } else if (state.firstRun) {
        showTutorialSlide(0);
        showScreen('howto');
      } else {
        showScreen('menu');
        checkWelcomeBack();
      }
    }
    setTimeout(() => {
      if (splashLoader) splashLoader.classList.remove('loading');
      if (splashTap) { splashTap.hidden = false; splashTap.classList.add('pulse'); }
      const splash = document.getElementById('splash');
      function onSplashTap() {
        splash.removeEventListener('click', onSplashTap);
        document.removeEventListener('keydown', onSplashKey);
        exitSplash();
      }
      function onSplashKey(e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          onSplashTap();
        }
      }
      splash.addEventListener('click', onSplashTap);
      document.addEventListener('keydown', onSplashKey);
      setTimeout(exitSplash, 3000);
    }, 800);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (_saveTimer) { clearTimeout(_saveTimer); _saveNow(); }
        if (state.screen === 'game' && !state.gameOver) saveGameStateImmediate();
      }
    });
    window.addEventListener('pagehide', () => {
      if (_saveTimer) { clearTimeout(_saveTimer); _saveNow(); }
    });


    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage('skipWaiting');
            }
          });
        });
      }).catch(() => {});
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (state.screen !== 'game' || state.gameOver) window.location.reload();
      });
    }

    if (window.LinkAuth) {
      if (!window.LinkAuth.hasGdprConsent() && !onboarding.shouldShow()) {
        window.LinkAuth.showGdprBanner();
      }
      const uid = document.getElementById('userId');
      if (uid) uid.textContent = window.LinkAuth.getUserId();
    }

    if (window.LinkAds) {
      if (window.LinkAuth && window.LinkAuth.hasGdprConsent()) {
        window.LinkAds.init();
      }
    }

    function deferAuthInit() {
      if (!window.LinkAuth || window.LinkAuth._initialized) return;
      window.LinkAuth.init();
    }
    const settingsBtn = document.querySelector('[data-action="showSettings"]');
    if (settingsBtn) settingsBtn.addEventListener('click', deferAuthInit, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.app = {
    startGame, showScreen,
    toggleSound() {
      state.sound = !state.sound;
      document.body.classList.toggle('sound-off', !state.sound);
      const btn = document.getElementById('soundBtn');
      if (btn) btn.setAttribute('aria-pressed', String(state.sound));
      save();
    },
    undo: undoLast, hint: useHint,
    _reloadState() {
      load();
      applyTheme();
      applyI18n();
      populateLanguageSelect();
      syncDifficulty();
      if (state.screen === 'stats') { renderStats(); renderAchievements(); }
      if (state.screen === 'menu') { renderStreakCalendar(); updateMenuLevel(); }
    }
  };

})();

