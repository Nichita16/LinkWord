// LinkWords — Internationalization (extracted module)
(function(LW) {
  'use strict';

  let _state;

  const LANGUAGES = [
    ['en', 'English'], ['es', 'Español'], ['it', 'Italiano'], ['fr', 'Français'],
    ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'], ['ro', 'Română'],
    ['uk', 'Українська'], ['tr', 'Türkçe'], ['pl', 'Polski'], ['nl', 'Nederlands'],
    ['ja', '日本語'], ['ko', '한국어'], ['zh', '中文'], ['ar', 'العربية'],
    ['hi', 'हिन्दी'], ['id', 'Bahasa Indonesia'], ['th', 'ไทย'], ['vi', 'Tiếng Việt']
  ];

  function init(state) { _state = state; }

  function t(key) {
    var strings = window.UI_STRINGS;
    return strings?.[_state.lang]?.[key] || strings?.en?.[key] || key;
  }

  function getWord(conceptId) {
    var langKey = _state.lang.toUpperCase();
    var langTranslations = window['WORD_TRANSLATIONS_' + langKey];
    if (langTranslations?.[conceptId]) return langTranslations[conceptId];
    var enTranslations = window.WORD_TRANSLATIONS_EN;
    if (enTranslations?.[conceptId]) return enTranslations[conceptId];
    var concept = window.WORD_DATA?.concepts?.[conceptId];
    if (!concept) return conceptId.replace(/_/g, ' ').toUpperCase();
    return concept.t?.[_state.lang] || concept.t?.en || conceptId.replace(/_/g, ' ').toUpperCase();
  }

  function loadLanguagePack(lang) {
    var key = 'WORD_TRANSLATIONS_' + lang.toUpperCase();
    if (window[key]) return Promise.resolve();
    return new Promise(function(resolve) {
      var manifest = window.ASSET_MANIFEST;
      var filename = manifest?.['lang/data-' + lang + '.js'] || ('data-' + lang + '.js');
      var src = manifest ? '/dist/' + filename : '/lang/data-' + lang + '.js';
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = function() { console.warn('[i18n] Failed to load ' + lang + ' pack'); resolve(); };
      document.head.appendChild(script);
    });
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var text = t(key);
      if (text !== key) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      var text = t(key);
      if (text !== key) el.setAttribute('aria-label', text);
    });
    document.documentElement.dir = _state.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = _state.lang;
  }

  function mergeExtraStrings() {
    if (!window.UI_STRINGS && window.WORD_DATA?.strings) {
      window.UI_STRINGS = window.WORD_DATA.strings;
    }
    if (!window.UI_STRINGS) return;
    var extra = window.EXTRA_STRINGS_ALL;
    if (!extra) return;
    for (var lang in extra) {
      if (!extra.hasOwnProperty(lang)) continue;
      if (!window.UI_STRINGS[lang]) window.UI_STRINGS[lang] = {};
      Object.assign(window.UI_STRINGS[lang], extra[lang]);
    }
  }

  function populateLanguageSelect() {
    var sel = document.getElementById('langSelect');
    if (!sel) return;
    sel.innerHTML = '';
    var available = window.UI_STRINGS ? Object.keys(window.UI_STRINGS) : ['en'];
    for (var i = 0; i < LANGUAGES.length; i++) {
      var code = LANGUAGES[i][0];
      var name = LANGUAGES[i][1];
      if (available.includes(code)) {
        var opt = document.createElement('option');
        opt.value = code;
        opt.textContent = name;
        if (code === _state.lang) opt.selected = true;
        sel.appendChild(opt);
      }
    }
  }

  LW.i18n = {
    init, LANGUAGES,
    t, getWord, loadLanguagePack, applyI18n, mergeExtraStrings, populateLanguageSelect
  };

})(window.LW = window.LW || {});
