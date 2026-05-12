// LinkWords — Word Collection (extracted module)
(function(LW) {
  'use strict';

  let _state;
  let _getWord;
  let _t;

  const GROUP_NAMES = {
    emotions: 'Emotions', animals: 'Animals', nature: 'Nature', food: 'Food',
    elements: 'Elements', body: 'Body', objects: 'Objects', colors: 'Colors',
    celestial: 'Celestial', actions: 'Actions', places: 'Places', abstract: 'Abstract',
    music: 'Music', time: 'Time', weather: 'Weather', science: 'Science'
  };

  function init(state, getWord, t) {
    _state = state;
    _getWord = getWord;
    _t = t || (k => k);
  }

  function trackWord(conceptId) {
    if (!conceptId || !window.WORD_DATA?.concepts[conceptId]) return;
    const entry = _state.wordCollection[conceptId];
    if (entry) {
      entry.timesUsed++;
    } else {
      _state.wordCollection[conceptId] = {
        firstSeen: Date.now(),
        timesUsed: 1,
        bestLink: null
      };
    }
  }

  function trackChainLinks() {
    for (let i = 1; i < _state.chain.length; i++) {
      const a = _state.chain[i - 1];
      const b = _state.chain[i];
      const entryA = _state.wordCollection[a];
      const entryB = _state.wordCollection[b];
      if (entryA && !entryA.bestLink) entryA.bestLink = b;
      if (entryB && !entryB.bestLink) entryB.bestLink = a;
    }
  }

  function getCollectionStats() {
    const concepts = window.WORD_DATA?.concepts || {};
    const groups = {};
    for (const [key, val] of Object.entries(concepts)) {
      const g = val.g || 'abstract';
      if (!groups[g]) groups[g] = { total: 0, discovered: 0, words: [] };
      groups[g].total++;
      const found = !!_state.wordCollection[key];
      if (found) groups[g].discovered++;
      groups[g].words.push({ id: key, found });
    }
    const totalFound = Object.keys(_state.wordCollection).length;
    const totalWords = Object.keys(concepts).length;
    return { groups, totalFound, totalWords };
  }

  function renderCollection(groupColors) {
    const summary = document.getElementById('collectionSummary');
    const container = document.getElementById('collectionGroups');
    if (!summary || !container) return;

    const stats = getCollectionStats();
    const pct = stats.totalWords ? Math.round((stats.totalFound / stats.totalWords) * 100) : 0;
    summary.innerHTML = `<div class="collection-total"><span class="collection-pct">${pct}%</span><span class="collection-count">${stats.totalFound}/${stats.totalWords} ${_t('wordsDiscovered')}</span></div><div class="collection-bar"><div class="collection-bar-fill" style="width:${pct}%"></div></div>`;

    container.innerHTML = '';
    const sortedGroups = Object.entries(stats.groups).sort((a, b) => b[1].discovered - a[1].discovered);

    for (const [groupId, data] of sortedGroups) {
      const groupPct = data.total ? Math.round((data.discovered / data.total) * 100) : 0;
      const card = document.createElement('div');
      card.className = 'collection-group-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', `${GROUP_NAMES[groupId] || groupId}: ${data.discovered} of ${data.total} discovered`);
      if (data.discovered === data.total && data.total > 0) card.classList.add('complete');

      const dot = document.createElement('span');
      dot.className = 'collection-group-dot';
      dot.style.backgroundColor = groupColors[groupId] || '#7209b7';

      const header = document.createElement('div');
      header.className = 'collection-group-header';
      header.innerHTML = `<span class="collection-group-name">${GROUP_NAMES[groupId] || groupId}</span><span class="collection-group-count">${data.discovered}/${data.total}</span>`;
      header.prepend(dot);

      const bar = document.createElement('div');
      bar.className = 'collection-group-bar';
      bar.innerHTML = `<div class="collection-group-bar-fill" style="width:${groupPct}%;background:${groupColors[groupId] || '#7209b7'}"></div>`;

      const words = document.createElement('div');
      words.className = 'collection-group-words';
      data.words.sort((a, b) => (a.found === b.found ? 0 : a.found ? -1 : 1));
      for (const w of data.words) {
        const chip = document.createElement('span');
        chip.className = 'collection-word-chip' + (w.found ? ' found' : '');
        chip.textContent = w.found ? _getWord(w.id) : '???';
        if (w.found) {
          const entry = _state.wordCollection[w.id];
          chip.title = _t('usedNTimes').replace('{n}', entry.timesUsed);
        }
        words.appendChild(chip);
      }

      card.append(header, bar, words);
      card.addEventListener('click', () => {
        words.classList.toggle('expanded');
      });
      container.appendChild(card);
    }
  }

  LW.collection = {
    init, trackWord, trackChainLinks, getCollectionStats, renderCollection
  };

})(window.LW = window.LW || {});
