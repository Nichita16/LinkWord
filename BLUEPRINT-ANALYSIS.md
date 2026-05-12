# LinkWords v3.0 — Blueprint Analysis

## Executive Summary

The blueprint proposes **62 distinct features** inspired by 100+ top games. After cross-referencing with the current codebase (game.js 3805 lines, 4 modules, 508 concepts, 20 languages), the analysis categorizes them into:

- **19 ENHANCE** (exists, needs improvement)
- **39 NEW** (doesn't exist)
- **4 RETHINK** (needs fundamental redesign)

Organized into **6 sprints** (Sprint 0 = 1 week foundation, Sprints 1-5 = 2 weeks each), with 13 features deferred to v3.1+.

---

## Sprint 0 — Foundation (1 week)

Everything else depends on these structural changes. All are S/M effort.

| # | Feature | Size | File(s) | What Changes |
|---|---------|------|---------|-------------|
| 1 | Grid sizes 8/12/16 → 12/16/20 | S | `lw-graph.js:9-13` | Change DIFFICULTY constants. Daily locked to medium (16 words) |
| 2 | 7-tier rating system | S | `lw-scoring.js:70-81` | Spark/Link/Chain/Bridge/Weaver/Architect/Mastermind (thresholds: <400, 400, 700, 1000, 1400, 1800, 2200+) |
| 3 | Level titles rework | S | `lw-scoring.js:21-30` | 31 new titles: Spark(1) → Prestige(100). Narrative of intellectual growth |
| 4 | Scoring overhaul | M | `lw-scoring.js:35-68`, `game.js:1700+` | +500 for ≤15s, undo penalty -20, optimal bonus 200→500, streak ×5.0 cap, level multiplier +0.1/10lvl, combo escalation (3rd cross-theme = ×2, 4th = ×3) |
| 5 | XP formula rework | S | `game.js:1816` | `score/10` → `score/5`. Add weekly mode ×1.5 |
| 6 | Bottom navigation bar | M | `index.html`, `style.css`, `game.js:511` | 4-icon persistent nav (Home/Stats/Collection/Settings). Replace current 3-button menu bottom row |
| 7 | Screen transitions | M | `game.js:511`, `style.css` | Cross-fade 150ms (tabs), fade-to-black 200ms (game entry), slide-up 200ms (post-game) |
| 8 | Difficulty day-of-week pattern | S | `game.js:startGame` | Daily: Mon-Tue dist 3, Wed-Thu dist 4, Fri-Sat dist 5, Sun dist 3 |

**Scoring system target**: With all multipliers maxed (streak 100+ = ×5, hard = ×1.5, level 100 = ×2.0, perfect combos), scores can reach **50,000+** vs current cap of ~4,000.

**Backward compatibility**: Old `bestScore`/`totalScore` stay as-is. Add `lw_schemaVersion` key to detect v2→v3 migration. Rating name change from `perfect` → `mastermind` requires updating `completeGame:1849` and `MICROCOPY` keys.

---

## Sprint 1 — Core Visual Overhaul (2 weeks)

The game looks and feels like v3 from the first tap.

| # | Feature | Size | File(s) | What Changes |
|---|---------|------|---------|-------------|
| 9 | Dynamic home screen (3 states) | L | `game.js`, `index.html`, `style.css` | **Fresh**: streak hero + Daily CTA prominent. **Done**: result inline on Daily card, countdown, Endless/Blitz promoted. **Returning** (2+ day absence): warm welcome screen with sunk-cost reminder |
| 10 | SVG connection lines | L | `game.js:1302+`, `index.html` | SVG overlay on word grid. Curved bezier paths animate 200ms on link. Purple full = cross-theme, purple 0.5 opacity = same-theme. Sequential illumination on completion |
| 11 | Theme-specific palettes | S | `style.css`, `game.js:startGame` | 7 CSS custom property sets. Nature=green-teal, Mind Palace=blue-indigo, Kingdom=gold-amber, Elements=red-orange, Heart&Soul=pink-coral, Wild World=green-earth, Free Play=default purple |
| 12 | Streak visual tiers | M | `game.js:651`, `style.css` | 4 tiers: 1-6 neutral chain, 7-29 purple flame, 30-99 golden shimmer, 100+ particle effect |
| 13 | Welcome back screen | S | `game.js:init`, `index.html` | Dedicated screen on return after 2+ days. "You still have 187 words, Lv.15 Scholar, 23 achievements." CTA: "Start a new streak today!" |
| 14 | Reachability dimming | S | `game.js:updateGrid`, `style.css` | Non-reachable words get `opacity: 0.4`. Currently `.connectable` highlights exist but no explicit dimming of unreachable |

**Critical path**: Bottom nav (#6) must be done before home redesign (#9). SVG lines (#10) must exist before completion ceremony redesign in Sprint 2.

---

## Sprint 2 — Gameplay Feel (2 weeks)

"If those 150ms of link feedback are perfect, everything else follows."

| # | Feature | Size | File(s) | What Changes |
|---|---------|------|---------|-------------|
| 15 | Audio enhancement | M | `lw-audio.js` | Detuned second oscillator (+2-3 Hz) for warmer "mechanical click". Distinct `crossTheme` sound. Longer reverb on complete final note (400ms vs 320ms) |
| 16 | Haptic differentiation | S | `game.js:onWordClick,completeGame` | 10ms select, 30ms cross-theme, 100ms pattern complete, 0ms error |
| 17 | Completion ceremony redesign | M | `game.js:1694-1768` | **300ms silence** → sequential SVG line illumination (100ms/link) → particle burst. Gold particles for optimal path. Sync sound with illumination |
| 18 | Cross-theme combo system | S | `game.js:1370`, `lw-scoring.js` | 3rd consecutive = ×2, 4th = ×3. "Combo ×3!" toast in gold. Sound intensification |
| 19 | Long-press connection preview | S | `game.js:grid handler` | 300ms hold highlights all connected words. Not a hint — strategic planning tool |
| 20 | Link value preview | S | `game.js:grid handler` | Tooltip on hold: "+50 cross-theme" or "+10 same-theme" |
| 21 | Near-miss feedback | S | `game.js:onWordClick error` | Amber "So close!" when 1 step from END but wrong word. Check `isConnected(concept, puzzle.end)` |
| 22 | Steps-from-end indicator | S | `game.js:onWordClick` | Subtle "2 links to go" in top bar. Use `getGraphDistance(lastWord, puzzle.end)` |
| 23 | Cell animation refinement | S | `style.css` | `cellPop` overshoot (1.14) → subtle press (0.97→1.0, 150ms). Shake: 6px/400ms → 3px/200ms |

---

## Sprint 3 — Post-Game & Sharing (2 weeks)

The post-game drives shares and return visits.

| # | Feature | Size | File(s) | What Changes |
|---|---------|------|---------|-------------|
| 24 | Post-game 3-act redesign | L | `game.js:1959+`, `index.html`, `style.css` | **Act 1** (2s, 1s unskippable): Rating name large + scale animation. Level-up overlay if applicable. **Act 2** (slides up): Score breakdown bars (Base, Speed, Creativity, Streak, Combo, Level), per-link classification. **Act 3**: Share button, countdown, Play Again |
| 25 | Share format overhaul | M | `game.js:2748-2797` | `🟣⚪🟣🟣💡🟣` (purple=cross, white=same, hint=💡). Named rating tier. Language flag. Different formats for Daily/Blitz/Weekly |
| 26 | Hidden daily goals | S | `game.js:completeGame` | Random invisible objective: "Complete without undo", "3+ cross-theme links". +100 XP if achieved |
| 27 | Post-game motivational quote | S | `game.js:ceremony` | Theme-specific phrase 3s before score. 30 phrases × 7 themes = 210 strings (EN only for v3.0) |
| 28 | Full board bonus | S | `game.js:completeGame` | If `chain.length === puzzle.words.length + 2`: triple XP + "Full Board!" celebration |
| 29 | Next puzzle preview on home | S | `game.js:home rendering` | "Tomorrow: Mind Palace · FEAR → HOPE". Uses `generatePuzzle` with tomorrow's seed |
| 30 | Achievement expansion | S | `game.js:44-69, 2235+` | +3: polyglotMaster (10 langs), weeklyChamp, totalScore (100K). "18/28 unlocked" counter. Unlock date display |

---

## Sprint 4 — Engagement & Progression (2 weeks)

Players have reasons to come back beyond the daily.

| # | Feature | Size | File(s) | What Changes |
|---|---------|------|---------|-------------|
| 31 | Word Collection | XL | New section in `game.js` (~300 lines), `index.html`, `style.css` | Track `{conceptId: {firstSeen, timesUsed, bestLink}}` in `lw_wordCollection`. Grouped by semantic category with progress bars. "23/45 nature words discovered". Tap for details. Group completion = achievement |
| 32 | Statistics redesign | L | `game.js:2601+`, `index.html`, `style.css` | 3 zones: **This Week** (7-day heatmap, leaderboard position), **Overview** (4 cards, sparkline, rating distribution, creativity average, languages), **All Time** (cumulative score, word collection progress, total time). Single scrollable page |
| 33 | Progressive mode unlock | S | `game.js:home rendering` | Day 1: only Daily. After 1st daily: Endless unlocks (+toast). After 3: Blitz. After 7: Weekly |
| 34 | Interactive onboarding | L | `game.js:3092+`, `lw-graph.js` | 3 guided micro-puzzles: (1) 4 words single path, (2) 6 words with choice, (3) 8 words with cross-theme. Hardcoded puzzles, zero text cards |
| 35 | Settings reorganization | M | `index.html`, `game.js:bindEvents` | 4 sections: Game (lang, difficulty, show timer, dim unreachable, show groups), Look & Feel (theme, sound, haptics), Account (login/sync/delete), About (rate, support, remove ads, privacy) |
| 36 | Group indicator dots | S | `game.js:renderGame`, `style.css` | 4px colored dot per semantic group on word chips. Settings toggle "Show Word Groups" (default off) |

---

## Sprint 5 — Polish & Ship (2 weeks)

v3.0 feels complete, tested, ready for launch.

| # | Feature | Size | File(s) | What Changes |
|---|---------|------|---------|-------------|
| 37 | Pencil mark mode | S | `game.js:grid handler` | Long-press toggle marks words as candidates with small dot |
| 38 | Bonus puzzle | M | `game.js`, localStorage | Unlocks 4h after daily. Small 6-word easy puzzle for bonus XP |
| 39 | Daily micro-goals (rings) | M | `game.js:home`, `style.css` | 3 SVG rings: complete daily, cross-theme link, play extra mode. All 3 = gold calendar day |
| 40 | Profile completeness | S | `game.js:renderStats` | "85% complete" bar. Actions: play Hard, try Blitz, 2nd language, all 7 themes, 14-day streak |
| 41 | Theme subtitles | S | `game.js:home rendering` | 30 rotating flavor texts per theme. "Today's forest is full of surprises" |
| 42 | Blitz perfect streak counter | S | `game.js:blitz logic` | Consecutive correct counter. At 10: background flash + double multiplier |
| 43 | Narrative stats | M | `game.js:renderStats` | "You usually solve in under a minute. Your fastest was 22s on May 3rd." |
| 44 | Ambient audio per theme | M | `lw-audio.js` | Subtle background soundscapes. Forest sounds for Nature Walk, etc. 10% volume |
| 45 | Cosmetic theme unlocks | M | `style.css`, `game.js` | 5 palettes (Midnight, Forest, Sunset, Ocean, Minimal) unlocked via activity points |
| — | Cross-platform testing | — | All | PWA, Capacitor iOS/Android, SW cache, localStorage migration |
| — | Performance audit | — | All | <100ms tap response with 20-word grids. Profile `computeReachability` on low-end devices |
| — | Accessibility pass | — | All | ARIA on new elements, screen reader, `reduceMotion` gates all new animations |

---

## Deferred to v3.1+ (P4)

These are great ideas that need server infrastructure or extensive playtesting:

| Feature | Size | Why Deferred |
|---------|------|-------------|
| Weekly Challenge (Friday special rules) | XL | Needs rule variant engine, separate leaderboard, Firestore infra |
| Word Map visualization (interactive graph) | XL | Complex Canvas/SVG renderer. Depends on Word Collection data |
| Post-game link percentiles ("found by 12%") | M | Needs Firestore aggregation Cloud Function |
| Monthly recap card (Spotify Wrapped) | M | Canvas image generation + Word Collection data |
| Puzzle completion percentile ("Only 23% solved") | M | Needs Cloud Function for real-time aggregation |
| Fading words (Hard mode) | M | Novel mechanic, needs extensive playtesting for balance |
| Zen Mode (exploratory, no goals) | L | Fourth mode, distinct UX paradigm |
| Duel Mode (async challenges) | L | Firestore documents, notification system |
| Creator Mode (user-generated puzzles) | L | Complex UI, moderation concerns |
| "Most creative link today" | M | Server aggregation required |
| Adaptive difficulty (Endless) | M | Needs player data to calibrate thresholds |
| Seasonal word themes (monthly) | M | Content pipeline needed for word selection bias |
| Referral XP (UTM tracking) | S | Analytics infrastructure |

---

## Risk Matrix

### HIGH RISK

**game.js monolith (3805 lines → ~5500+ lines)**
Before Sprint 1, extract into new modules: `lw-home.js`, `lw-postgame.js`, `lw-stats.js`, `lw-collection.js`. Same IIFE + `window.LW.*` + `init(state)` pattern as existing modules.

**Scoring backward compatibility**
Old `bestScore`/`totalScore` computed with old formula. Solution: add `lw_schemaVersion`, keep historical numbers, track v3 bests separately. Players will see higher scores going forward — this is fine.

### MEDIUM RISK

**Performance with 20-word grids**: `computeReachability` BFS is O(V+E), should stay <1ms. SVG rendering of 20 bezier curves needs `requestAnimationFrame`, not CSS transitions.

**i18n impact**: ~500+ new translatable strings. Strategy: EN-only for v3.0 with `t(key)` fallback returning the key. Translate top 5 languages first (en, es, it, fr, de).

**localStorage growth**: Word Collection could reach ~25KB. Total still well under the 5-10MB limit. Extend `pruneDailyHistory()` to also prune stale collection entries.

**Service worker cache**: Every new JS file must be added to `sw.js` ASSETS array and cache version bumped.

### LOW RISK

**Level title rename**: Purely cosmetic, no stored data uses title strings.
**Grid size increase**: Saved `lw_gameState` restores old-size games correctly.
**Achievement additions**: Purely additive — new IDs absent from existing `lw_achievements` will auto-unlock on first qualifying game.

---

## New Infrastructure Required

| What | Where | Sprint |
|------|-------|--------|
| `lw_schemaVersion` localStorage key | `game.js:load()` | 0 |
| `lw_wordCollection` localStorage key | `game.js:save()` | 4 |
| `lw_bonusPuzzle` localStorage key | `game.js` | 5 |
| `lw_modeUnlocks` localStorage key | `game.js` | 4 |
| SVG container in game screen | `index.html` | 1 |
| Bottom `<nav>` element | `index.html` | 0 |
| 5+ new CSS animation keyframes | `style.css` | 1-2 |
| Firestore `dailyStats/{day}` collection | Cloud Functions | v3.1 |
| Firestore `weeklyChallenge/{week}` collection | Cloud Functions | v3.1 |

---

## Implementation Order (PR Sequence for Sprint 0)

1. `lw-graph.js` DIFFICULTY constants (grid sizes) — zero dependencies
2. `lw-scoring.js` LEVEL_TITLES — zero dependencies
3. `lw-scoring.js` getScoreRating (7 tiers) — zero dependencies
4. `lw-scoring.js` calculateScore overhaul — depends on #3 for validation
5. `game.js` XP formula — depends on #4 for score values
6. `game.js` update all rating string references — depends on #3
7. `index.html` + `style.css` bottom nav bar — independent
8. `game.js` showScreen transition variants — depends on #7
9. `game.js` _undoCount tracking — prerequisite for scoring #4

Each is a discrete PR that can be reviewed and merged independently.

---

*Generated 2026-05-11 by 3 specialized agents analyzing the full 150K-character blueprint against the current codebase.*
