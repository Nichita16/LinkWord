// LinkWords — Auth, Cloud Save & Privacy Module
(function () {
  'use strict';

  function safeParse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
  }

  // ═══════════════════════════════════════════
  //  FIREBASE CONFIG
  //  Replace these with your Firebase project values
  // ═══════════════════════════════════════════
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDQTtb015y4Cd2FaeEGlVJENVglp3r84HQ",
    authDomain: "linkword-3ef90.firebaseapp.com",
    projectId: "linkword-3ef90",
    storageBucket: "linkword-3ef90.firebasestorage.app",
    messagingSenderId: "22078511933",
    appId: "1:22078511933:web:7b86696786a4cb6216c354",
    measurementId: "G-D5XLDHRKGD"
  };

  const CLOUD_KEYS = ['lw_stats', 'lw_daily', 'lw_achievements', 'lw_settings', 'lw_ads'];
  const SYNC_DEBOUNCE = 3000;
  const SUPPORT_EMAIL = 'support@linkwords.app';
  const PRIVACY_URL = 'https://linkwords.app/privacy';
  const TERMS_URL = 'https://linkwords.app/terms';

  let _app = null;
  let _auth = null;
  let _db = null;
  let _user = null;
  let _syncTimer = null;
  let _isCapacitor = false;

  // ═══════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════
  function isConfigured() {
    return FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';
  }

  async function initAuth() {
    if (window.LinkAuth._initialized) return;
    window.LinkAuth._initialized = true;
    if (!isConfigured()) {
      console.warn('[Auth] Firebase not configured — running offline only');
      updateAuthUI();
      return;
    }

    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js');
      const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');

      _app = initializeApp(FIREBASE_CONFIG);
      _auth = getAuth(_app);
      _db = getFirestore(_app);

      _isCapacitor = typeof window.Capacitor !== 'undefined';

      onAuthStateChanged(_auth, async (user) => {
        _user = user;
        updateAuthUI();
        if (user) {
          await pullFromCloud();
        }
      });
    } catch (e) {
      console.error('[Auth] Firebase init failed:', e);
      updateAuthUI();
    }
  }

  // ═══════════════════════════════════════════
  //  SIGN IN / OUT
  // ═══════════════════════════════════════════
  async function signInWithGoogle() {
    if (!_auth) return;
    try {
      if (_isCapacitor && window.FirebaseAuthentication) {
        const result = await window.FirebaseAuthentication.signInWithGoogle();
        const { GoogleAuthProvider, signInWithCredential } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
        const credential = GoogleAuthProvider.credential(result.credential?.idToken);
        await signInWithCredential(_auth, credential);
      } else {
        const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
        await signInWithPopup(_auth, new GoogleAuthProvider());
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        console.error('[Auth] Google sign-in failed:', e);
        showAuthError('Google sign-in failed');
      }
    }
  }

  async function signInWithApple() {
    if (!_auth) return;
    try {
      if (_isCapacitor && window.FirebaseAuthentication) {
        const result = await window.FirebaseAuthentication.signInWithApple();
        const { OAuthProvider, signInWithCredential } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
        const credential = new OAuthProvider('apple.com').credential({
          idToken: result.credential?.idToken,
          rawNonce: result.credential?.nonce
        });
        await signInWithCredential(_auth, credential);
      } else {
        const { OAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
        const provider = new OAuthProvider('apple.com');
        provider.addScope('name');
        await signInWithPopup(_auth, provider);
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        console.error('[Auth] Apple sign-in failed:', e);
        showAuthError('Apple sign-in failed');
      }
    }
  }

  async function signInWithFacebook() {
    if (!_auth) return;
    try {
      if (_isCapacitor && window.FirebaseAuthentication) {
        const result = await window.FirebaseAuthentication.signInWithFacebook();
        const { FacebookAuthProvider, signInWithCredential } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
        const credential = FacebookAuthProvider.credential(result.credential?.accessToken);
        await signInWithCredential(_auth, credential);
      } else {
        const { FacebookAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
        await signInWithPopup(_auth, new FacebookAuthProvider());
      }
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        console.error('[Auth] Facebook sign-in failed:', e);
        showAuthError('Facebook sign-in failed');
      }
    }
  }

  async function signOut() {
    if (!_auth) return;
    try {
      const { signOut: fbSignOut } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
      await fbSignOut(_auth);
      _user = null;
      updateAuthUI();
    } catch (e) {
      console.error('[Auth] Sign-out failed:', e);
    }
  }

  // ═══════════════════════════════════════════
  //  CLOUD SYNC
  // ═══════════════════════════════════════════
  async function pullFromCloud() {
    if (!_db || !_user) return;
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
      const snap = await getDoc(doc(_db, 'users', _user.uid));
      if (!snap.exists()) {
        await pushToCloud();
        return;
      }
      const cloud = snap.data();
      mergeCloudData(cloud);
    } catch (e) {
      console.error('[Auth] Pull failed:', e);
    }
  }

  function mergeCloudData(cloud) {
    if (!cloud) return;
    const localStats = safeParse('lw_stats', {});
    const cloudStats = cloud.stats || {};

    const merged = { ...localStats };
    const STAT_CAPS = { played: 1e6, won: 1e6, streak: 1e5, maxStreak: 1e5, totalScore: 1e9, bestScore: 1e6, blitzWins: 1e6, blitzBest: 1e6, xp: 1e8 };
    for (const k of ['played', 'won', 'maxStreak', 'totalScore', 'bestScore', 'blitzWins', 'blitzBest', 'xp']) {
      const val = Math.max(localStats[k] || 0, cloudStats[k] || 0);
      merged[k] = Number.isFinite(val) ? Math.min(val, STAT_CAPS[k]) : localStats[k] || 0;
    }
    const localLastPlayed = localStats.lastPlayedDate || '';
    const cloudLastPlayed = cloudStats.lastPlayedDate || '';
    const freshestDate = localLastPlayed > cloudLastPlayed ? localLastPlayed : cloudLastPlayed;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streakAlive = freshestDate === today || freshestDate === yesterday;
    if (streakAlive) {
      const streakVal = Math.max(localStats.streak || 0, cloudStats.streak || 0);
      merged.streak = Number.isFinite(streakVal) ? Math.min(streakVal, STAT_CAPS.streak) : 0;
    } else {
      merged.streak = 0;
    }
    if ((cloudStats.scores || []).length > (localStats.scores || []).length) {
      merged.scores = cloudStats.scores;
    }
    const localLangs = new Set(localStats.langsUsed || []);
    const cloudLangs = new Set(cloudStats.langsUsed || []);
    merged.langsUsed = [...new Set([...localLangs, ...cloudLangs])];

    localStorage.setItem('lw_stats', JSON.stringify(merged));

    const localAch = safeParse('lw_achievements', {});
    const cloudAch = cloud.achievements || {};
    const validAchIds = new Set(['first','wordsmith','speed','minimalist','untouchable','marathon','century','creative','nightOwl','blitzer','linguist','perfect3','halfCentury','veteran','mastermind','legend','streak14','streak30','blitz10','linguist5','chain10','speedster','noUndo','hardWin','explorer']);
    const mergedAch = { ...localAch };
    for (const [key, val] of Object.entries(cloudAch)) {
      if (!validAchIds.has(key)) continue;
      if (val !== false && val !== undefined && (typeof val !== 'number' || !Number.isFinite(val) || val < 0)) continue;
      if (!mergedAch[key] || (typeof val === 'number' && (typeof mergedAch[key] !== 'number' || val < mergedAch[key]))) {
        mergedAch[key] = val;
      }
    }
    localStorage.setItem('lw_achievements', JSON.stringify(mergedAch));

    if (cloud.daily && typeof cloud.daily === 'object') {
      const localDaily = safeParse('lw_daily', {});
      const mergedDaily = { ...localDaily };
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      for (const [key, val] of Object.entries(cloud.daily)) {
        if (!dateRe.test(key) || !val || typeof val !== 'object') continue;
        if (typeof val.score !== 'number' || !isFinite(val.score) || val.score < 0 || val.score > 99999) continue;
        if (!mergedDaily[key] || (val.score || 0) > (mergedDaily[key].score || 0)) {
          mergedDaily[key] = { score: Math.round(val.score), chain: Number(val.chain) || 0, time: Number(val.time) || 0 };
          if (val.comeback === true) mergedDaily[key].comeback = true;
        }
      }
      localStorage.setItem('lw_daily', JSON.stringify(mergedDaily));
    }

    if (cloud.settings) {
      const localSettings = safeParse('lw_settings', {});
      if (!localSettings.lang) {
        localStorage.setItem('lw_settings', JSON.stringify(cloud.settings));
      }
    }

    if (window.app && window.app._reloadState) {
      window.app._reloadState();
    }
  }

  async function pushToCloud() {
    if (!_db || !_user) return;
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
      const data = {};
      for (const key of CLOUD_KEYS) {
        const raw = localStorage.getItem(key);
        if (raw) data[key.replace('lw_', '')] = JSON.parse(raw);
      }
      data.updatedAt = Date.now();
      data.displayName = _user.displayName || null;
      await setDoc(doc(_db, 'users', _user.uid), data, { merge: true });
    } catch (e) {
      console.error('[Auth] Push failed:', e);
    }
  }

  function schedulePush() {
    if (!_user) return;
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(pushToCloud, SYNC_DEBOUNCE);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _syncTimer) {
      clearTimeout(_syncTimer);
      _syncTimer = null;
      pushToCloud();
    }
  });

  function getWeekId() {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  async function submitWeeklyScore(score) {
    if (!_db || !_user) return;
    if (typeof score !== 'number' || !isFinite(score) || score < 0 || score > 99999) return;
    score = Math.round(score);
    try {
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
      const weekId = getWeekId();
      const name = _user.displayName || 'Player';
      await setDoc(doc(_db, 'weekly', weekId, 'scores', _user.uid), {
        score, name, uid: _user.uid, ts: serverTimestamp()
      }, { merge: true });
    } catch (_) {}
  }

  async function getWeeklyLeaderboard() {
    if (!_db || !_user) return [];
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
      const weekId = getWeekId();
      const q = query(collection(_db, 'weekly', weekId, 'scores'), orderBy('score', 'desc'), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), isMe: d.id === _user.uid }));
    } catch (_) { return []; }
  }

  // ═══════════════════════════════════════════
  //  DATA EXPORT
  // ═══════════════════════════════════════════
  function exportData() {
    const data = {};
    for (const key of CLOUD_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    }
    data.exportedAt = new Date().toISOString();
    if (_user) {
      data.userId = _user.uid;
      data.email = _user.email;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkwords-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ═══════════════════════════════════════════
  //  GDPR CONSENT
  // ═══════════════════════════════════════════
  function hasGdprConsent() {
    return localStorage.getItem('lw_gdpr') !== null;
  }

  function getGdprConsent() {
    try { return JSON.parse(localStorage.getItem('lw_gdpr')); }
    catch { return null; }
  }

  function setGdprConsent(consent) {
    localStorage.setItem('lw_gdpr', JSON.stringify({
      analytics: consent.analytics || false,
      personalization: consent.personalization || false,
      timestamp: Date.now()
    }));
    updatePrivacyUI();
  }

  function showGdprBanner() {
    const el = document.getElementById('gdprBanner');
    if (!el) return;
    el.hidden = false;
    const firstBtn = el.querySelector('button');
    if (firstBtn) firstBtn.focus();
    el._trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = el.querySelectorAll('button, a[href]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    el.addEventListener('keydown', el._trapHandler);
  }

  function hideGdprBanner() {
    const el = document.getElementById('gdprBanner');
    if (!el) return;
    el.hidden = true;
    if (el._trapHandler) {
      el.removeEventListener('keydown', el._trapHandler);
      el._trapHandler = null;
    }
  }

  // ═══════════════════════════════════════════
  //  CCPA
  // ═══════════════════════════════════════════
  function getCcpaOptOut() {
    return localStorage.getItem('lw_ccpa_optout') === '1';
  }

  function setCcpaOptOut(optOut) {
    localStorage.setItem('lw_ccpa_optout', optOut ? '1' : '0');
  }

  // ═══════════════════════════════════════════
  //  RATE APP
  // ═══════════════════════════════════════════
  function rateApp() {
    if (_isCapacitor && window.Capacitor?.Plugins?.AppRate) {
      window.Capacitor.Plugins.AppRate.requestReview();
    } else if (_isCapacitor && window.Capacitor?.Plugins?.App) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.Capacitor.Plugins.App.openUrl({ url: 'https://apps.apple.com/app/com.linkwords.app' });
      } else {
        window.Capacitor.Plugins.App.openUrl({ url: 'market://details?id=com.linkwords.app' });
      }
    }
  }

  // ═══════════════════════════════════════════
  //  SUPPORT
  // ═══════════════════════════════════════════
  function getUserId() {
    if (_user) return _user.uid;
    let localId = localStorage.getItem('lw_userId');
    if (!localId) {
      localId = 'local_' + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : Math.random().toString(36).substring(2, 10));
      localStorage.setItem('lw_userId', localId);
    }
    return localId;
  }

  function contactSupport() {
    const uid = getUserId();
    const lang = localStorage.getItem('lw_settings');
    let langCode = 'en';
    try { langCode = JSON.parse(lang)?.lang || 'en'; } catch {}
    const subject = encodeURIComponent('LinkWords Support');
    const body = encodeURIComponent(`\n\n---\nUser ID: ${uid}\nLanguage: ${langCode}\nPlatform: ${navigator.userAgent}\nVersion: 2.3`);
    window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`, '_self');
  }

  // ═══════════════════════════════════════════
  //  AUTH UI
  // ═══════════════════════════════════════════
  function updateAuthUI() {
    const section = document.getElementById('accountSection');
    if (!section) return;

    if (!isConfigured()) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    const loggedIn = document.getElementById('accountLoggedIn');
    const loggedOut = document.getElementById('accountLoggedOut');
    const nameEl = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    const avatarEl = document.getElementById('accountAvatar');
    const userIdEl = document.getElementById('userId');

    if (userIdEl) userIdEl.textContent = getUserId();

    if (_user) {
      if (loggedIn) loggedIn.hidden = false;
      if (loggedOut) loggedOut.hidden = true;
      if (nameEl) nameEl.textContent = _user.displayName || '';
      if (emailEl) emailEl.textContent = _user.email || '';
      if (avatarEl) {
        const safeUrl = _user.photoURL && /^https:\/\/[^\s"')]+$/.test(_user.photoURL) ? _user.photoURL : '';
        if (safeUrl) {
          avatarEl.style.backgroundImage = `url("${safeUrl.replace(/["\\]/g, '')}")`;
          avatarEl.textContent = '';
        } else {
          avatarEl.style.backgroundImage = '';
          avatarEl.textContent = (_user.displayName || _user.email || '?')[0].toUpperCase();
        }
      }
    } else {
      if (loggedIn) loggedIn.hidden = true;
      if (loggedOut) loggedOut.hidden = false;
    }
  }

  function updatePrivacyUI() {
    const consent = getGdprConsent();
    const analyticsToggle = document.getElementById('privacyAnalytics');
    const personalizationToggle = document.getElementById('privacyPersonalization');
    if (analyticsToggle && consent) analyticsToggle.checked = consent.analytics;
    if (personalizationToggle && consent) personalizationToggle.checked = consent.personalization;

    const ccpaBtn = document.getElementById('ccpaBtn');
    if (ccpaBtn) ccpaBtn.classList.toggle('active', getCcpaOptOut());
  }

  function showAuthError(msg) {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
  }

  // ═══════════════════════════════════════════
  //  DELETE ACCOUNT
  // ═══════════════════════════════════════════
  async function deleteAccount() {
    if (!_auth || !_user) return;
    const uid = _user.uid;
    try {
      if (_db) {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js');
        await deleteDoc(doc(_db, 'users', uid)).catch(() => {});
      }
      const { deleteUser } = await import('https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js');
      await deleteUser(_user);
      _user = null;
      updateAuthUI();
    } catch (e) {
      console.error('[Auth] Delete account failed:', e);
      if (e.code === 'auth/requires-recent-login') {
        showAuthError('Please sign in again before deleting');
      }
    }
  }

  // ═══════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════
  window.LinkAuth = {
    _initialized: false,
    init: initAuth,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    signOut,
    deleteAccount,
    schedulePush,
    exportData,
    rateApp,
    contactSupport,
    getUserId,
    submitWeeklyScore,
    getWeeklyLeaderboard,
    hasGdprConsent,
    getGdprConsent,
    setGdprConsent,
    showGdprBanner,
    hideGdprBanner,
    getCcpaOptOut,
    setCcpaOptOut,
    updatePrivacyUI,
    isSignedIn: () => !!_user,
    getUser: () => _user,
    PRIVACY_URL,
    TERMS_URL
  };

})();
