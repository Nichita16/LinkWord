// LinkWords — Graph & Puzzle Engine (extracted module)
(function(LW) {
  'use strict';

  let _state;
  let connectionSets = null;
  let _endDistCache = null;

  const DIFFICULTY = {
    easy:   { grid: 12, minDist: 2, maxDist: 3, hints: 5 },
    medium: { grid: 16, minDist: 3, maxDist: 5, hints: 3 },
    hard:   { grid: 20, minDist: 4, maxDist: 7, hints: 1 }
  };
  const DAILY_EPOCH = Date.UTC(2025, 0, 1);
  const DAILY_THEMES = [
    { name: 'Nature Walk',  groups: ['nature', 'animals', 'elements'] },
    { name: 'Mind Palace',  groups: ['emotions', 'abstract', 'body'] },
    { name: 'Kingdom',      groups: ['objects', 'places', 'animals'] },
    { name: 'Elements',     groups: ['elements', 'celestial', 'colors'] },
    { name: 'Free Play',    groups: null },
    { name: 'Heart & Soul', groups: ['emotions', 'body', 'abstract'] },
    { name: 'Wild World',   groups: ['animals', 'nature', 'celestial'] }
  ];

  function init(state) { _state = state; }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildConnectionSets() {
    if (!window.WORD_DATA || !window.WORD_DATA.concepts) {
      console.error('[LinkWords] WORD_DATA not loaded — game cannot start');
      connectionSets = {};
      return;
    }
    const concepts = window.WORD_DATA.concepts;
    connectionSets = {};
    for (const [key, val] of Object.entries(concepts)) {
      if (!connectionSets[key]) connectionSets[key] = new Set();
      for (const c of (val.c || [])) {
        connectionSets[key].add(c);
        if (!connectionSets[c]) connectionSets[c] = new Set();
        connectionSets[c].add(key);
      }
    }
  }

  function getConnections(concept) {
    return connectionSets?.[concept] || new Set();
  }

  function isConnected(a, b) {
    if (connectionSets) return (connectionSets[a]?.has(b) || connectionSets[b]?.has(a)) || false;
    return (window.WORD_DATA.concepts[a]?.c?.includes(b) || window.WORD_DATA.concepts[b]?.c?.includes(a)) || false;
  }

  function bfs(start, end) {
    if (!connectionSets) return null;
    const visited = new Set([start]);
    const parent = new Map();
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      if (cur === end) {
        const path = [];
        let node = end;
        while (node !== undefined) { path.push(node); node = parent.get(node); }
        return path.reverse();
      }
      for (const n of (connectionSets[cur] || [])) {
        if (!visited.has(n)) {
          visited.add(n);
          parent.set(n, cur);
          queue.push(n);
        }
      }
    }
    return null;
  }

  function allPaths(start, end, maxDepth, maxResults) {
    if (maxDepth === undefined) maxDepth = 6;
    if (maxResults === undefined) maxResults = 50;
    if (!connectionSets) return [];
    const results = [];
    const visited = new Set();
    const path = [];

    function dfs(cur) {
      if (results.length >= maxResults) return;
      if (cur === end) { results.push(path.slice()); return; }
      if (path.length >= maxDepth) return;
      for (const n of (connectionSets[cur] || [])) {
        if (!visited.has(n)) {
          visited.add(n);
          path.push(n);
          dfs(n);
          path.pop();
          visited.delete(n);
        }
      }
    }

    visited.add(start);
    path.push(start);
    dfs(start);
    return results;
  }

  function generatePuzzle(seed, diffKey, themeGroups, dailyFixed, distOverride) {
    if (!window.WORD_DATA?.concepts) return null;
    const concepts = window.WORD_DATA.concepts;
    const diff = DIFFICULTY[diffKey || 'medium'];
    const pairDiff = distOverride || (dailyFixed ? DIFFICULTY['medium'] : diff);
    let keys = Object.keys(concepts);
    const rng = mulberry32(seed);

    if (themeGroups) {
      const themed = keys.filter(k => themeGroups.includes(concepts[k]?.g));
      if (themed.length >= 20) keys = themed;
    }

    let bestPuzzle = null;

    for (let attempt = 0; attempt < 15; attempt++) {
      const startIdx = Math.floor(rng() * keys.length);
      const startKey = keys[startIdx];

      const distances = new Map();
      const queue = [[startKey, 0]];
      let head = 0;
      distances.set(startKey, 0);
      while (head < queue.length) {
        const [cur, dist] = queue[head++];
        for (const n of (connectionSets[cur] || [])) {
          if (!distances.has(n) && concepts[n]) {
            distances.set(n, dist + 1);
            queue.push([n, dist + 1]);
          }
        }
      }

      const candidates = [];
      for (const [k, d] of distances) {
        if (d >= pairDiff.minDist && d <= pairDiff.maxDist) candidates.push(k);
      }
      if (!candidates.length) continue;

      const endKey = candidates[Math.floor(rng() * candidates.length)];
      const optimal = bfs(startKey, endKey);
      if (!optimal || optimal.length < 3) continue;

      const paths = allPaths(startKey, endKey, optimal.length + 2);
      const wordSet = new Set();
      for (const p of paths) for (const w of p) wordSet.add(w);
      wordSet.delete(startKey);
      wordSet.delete(endKey);

      const pathWords = Array.from(wordSet);
      let gridWords = pathWords.slice();
      const gridWordSet = new Set(gridWords);
      gridWordSet.add(startKey);
      gridWordSet.add(endKey);

      const allKeys = shuffle(Object.keys(concepts), rng);
      for (const k of allKeys) {
        if (gridWords.length >= diff.grid) break;
        if (gridWordSet.has(k)) continue;
        const conns = connectionSets[k];
        if (!conns) continue;
        let hasConnection = conns.has(startKey) || conns.has(endKey);
        if (!hasConnection) { for (const w of conns) { if (gridWordSet.has(w)) { hasConnection = true; break; } } }
        if (hasConnection) { gridWords.push(k); gridWordSet.add(k); }
      }

      while (gridWords.length < diff.grid && allKeys.length) {
        const k = allKeys.pop();
        if (gridWordSet.has(k)) continue;
        const conns = connectionSets[k];
        if (!conns) continue;
        let hasConn = conns.has(startKey) || conns.has(endKey);
        if (!hasConn) { for (const w of conns) { if (gridWordSet.has(w)) { hasConn = true; break; } } }
        if (hasConn) { gridWords.push(k); gridWordSet.add(k); }
      }

      gridWords = shuffle(gridWords.slice(0, diff.grid), rng);

      bestPuzzle = {
        start: startKey,
        end: endKey,
        words: gridWords,
        optimal: optimal.length,
        optimalPath: optimal,
        seed
      };
      break;
    }

    return bestPuzzle;
  }

  function getDailyNumber() {
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.floor((today - DAILY_EPOCH) / 86400000);
  }

  function getTodayKey() {
    const now = new Date();
    return now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0') + '-' + String(now.getUTCDate()).padStart(2, '0');
  }

  function getDailyTheme() {
    return DAILY_THEMES[getDailyNumber() % DAILY_THEMES.length];
  }

  function getDailyThemeForDay(dayNum) {
    return DAILY_THEMES[dayNum % DAILY_THEMES.length];
  }

  function dateKeyForDay(dayNum) {
    const ms = DAILY_EPOCH + dayNum * 86400000;
    const d = new Date(ms);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }

  function precomputeEndDistances(endConcept) {
    _endDistCache = {};
    if (!connectionSets || !endConcept) return;
    const visited = new Set([endConcept]);
    const queue = [[endConcept, 0]];
    let head = 0;
    _endDistCache[endConcept] = 0;
    while (head < queue.length) {
      const [cur, dist] = queue[head++];
      if (dist >= 6) continue;
      for (const n of (connectionSets[cur] || [])) {
        if (!visited.has(n)) {
          visited.add(n);
          _endDistCache[n] = dist + 1;
          queue.push([n, dist + 1]);
        }
      }
    }
  }

  function getGraphDistance(from, to) {
    if (from === to) return 0;
    if (_endDistCache && to === _state?.puzzle?.end && from in _endDistCache) {
      return _endDistCache[from];
    }
    const visited = new Set([from]);
    const queue = [[from, 0]];
    let head = 0;
    while (head < queue.length) {
      const [cur, dist] = queue[head++];
      for (const n of (connectionSets[cur] || [])) {
        if (n === to) return dist + 1;
        if (!visited.has(n) && dist < 6) {
          visited.add(n);
          queue.push([n, dist + 1]);
        }
      }
    }
    return -1;
  }

  function computeReachability(puzzle, chainSet) {
    if (!puzzle) return new Set();
    const available = new Set(puzzle.words.filter(w => !chainSet.has(w)));
    available.add(puzzle.end);
    const reachable = new Set();
    const queue = [puzzle.end];
    let head = 0;
    reachable.add(puzzle.end);
    while (head < queue.length) {
      const cur = queue[head++];
      for (const n of (connectionSets[cur] || [])) {
        if (available.has(n) && !reachable.has(n)) {
          reachable.add(n);
          queue.push(n);
        }
      }
    }
    return reachable;
  }

  function gridBfs(start, end, puzzle, chainSet) {
    const available = new Set(puzzle.words.filter(w => !chainSet.has(w)));
    available.add(end);
    const queue = [[start]];
    const visited = new Set([start]);
    let head = 0;
    while (head < queue.length) {
      const path = queue[head++];
      const cur = path[path.length - 1];
      if (cur === end) return path;
      for (const n of (connectionSets[cur] || [])) {
        if (!visited.has(n) && available.has(n)) {
          visited.add(n);
          queue.push([...path, n]);
        }
      }
    }
    return null;
  }

  LW.graph = {
    init, DIFFICULTY, DAILY_EPOCH, DAILY_THEMES,
    buildConnectionSets, getConnections, isConnected, bfs, allPaths,
    generatePuzzle, getDailyNumber, getTodayKey, getDailyTheme,
    getDailyThemeForDay, dateKeyForDay,
    precomputeEndDistances, getGraphDistance, computeReachability, gridBfs,
    mulberry32, shuffle
  };

})(window.LW = window.LW || {});
