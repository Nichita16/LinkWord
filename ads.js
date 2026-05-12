// LinkWords — Ads & In-App Purchase Module
(function () {
  'use strict';

  // ═══════════════════════════════════════════
  //  AD UNIT IDs
  //  Replace with your AdMob / AdSense IDs
  // ═══════════════════════════════════════════
  const AD_CONFIG = {
    admob: {
      banner: 'ca-app-pub-XXXXXXXX/BANNER_ID',
      interstitial: 'ca-app-pub-XXXXXXXX/INTERSTITIAL_ID',
      rewarded: 'ca-app-pub-XXXXXXXX/REWARDED_ID'
    },
    adsense: {
      client: 'ca-pub-XXXXXXXX',
      bannerSlot: 'XXXXXXXX'
    }
  };

  const INTERSTITIAL_EVERY = 3;
  const INTERSTITIAL_GRACE = 5;
  const INTERSTITIAL_MIN_INTERVAL_MS = 120000;
  const IAP_PRODUCT_ID = 'com.linkwords.removeads';
  const STORAGE_KEY = 'lw_ads';

  let _isCapacitor = false;
  let _admobPlugin = null;
  let _iapPlugin = null;
  let _interstitialLoaded = false;
  let _rewardedLoaded = false;
  let _rewardCallback = null;
  let _bannerVisible = false;
  let _lastInterstitialTime = 0;

  function getAdState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { gamesPlayed: 0, totalGames: 0, adsRemoved: false };
    } catch { return { gamesPlayed: 0, totalGames: 0, adsRemoved: false }; }
  }

  function saveAdState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function isAdsRemoved() {
    return getAdState().adsRemoved;
  }

  function isConfigured() {
    return AD_CONFIG.admob.banner !== 'ca-app-pub-XXXXXXXX/BANNER_ID';
  }

  // ═══════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════
  async function initAds() {
    _isCapacitor = typeof window.Capacitor !== 'undefined';

    if (_isCapacitor && isAdsRemoved()) {
      try {
        const mod = await import('@capgo/capacitor-purchases');
        _iapPlugin = mod.CapacitorPurchases;
        const info = await _iapPlugin.restoreTransactions();
        if (!hasRemoveAdsEntitlement(info)) {
          const s = getAdState();
          s.adsRemoved = false;
          saveAdState(s);
        }
      } catch { /* offline or unavailable — trust cache */ }
    }

    if (isAdsRemoved()) {
      updateAdsUI();
      return;
    }

    if (_isCapacitor) {
      await initAdMob();
    } else {
      initAdSense();
    }

    updateAdsUI();
  }

  // ═══════════════════════════════════════════
  //  ADMOB (Capacitor native)
  // ═══════════════════════════════════════════
  async function initAdMob() {
    if (!isConfigured()) return;
    try {
      const { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } = await import('@nicedash/capacitor-admob');
      _admobPlugin = AdMob;

      await AdMob.initialize({ initializeForTesting: false });

      AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => { _interstitialLoaded = true; });
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => { _interstitialLoaded = false; prepareInterstitial(); });
      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => { _interstitialLoaded = false; });
      AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => { _interstitialLoaded = false; });

      AdMob.addListener(RewardAdPluginEvents.Loaded, () => { _rewardedLoaded = true; });
      AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        if (_rewardCallback) { _rewardCallback(reward); _rewardCallback = null; }
      });
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => { _rewardedLoaded = false; prepareRewarded(); });
      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => { _rewardedLoaded = false; });
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => { _rewardedLoaded = false; _rewardCallback = null; });

      prepareInterstitial();
      prepareRewarded();
    } catch (e) {
      console.warn('[Ads] AdMob init failed:', e);
    }
  }

  async function prepareInterstitial() {
    if (!_admobPlugin || isAdsRemoved()) return;
    try {
      await _admobPlugin.prepareInterstitial({ adId: AD_CONFIG.admob.interstitial });
    } catch (e) { console.warn('[Ads] Interstitial prep failed:', e); }
  }

  async function prepareRewarded() {
    if (!_admobPlugin) return;
    try {
      await _admobPlugin.prepareRewardVideoAd({ adId: AD_CONFIG.admob.rewarded });
    } catch (e) { console.warn('[Ads] Rewarded prep failed:', e); }
  }

  // ═══════════════════════════════════════════
  //  ADSENSE (Web fallback)
  // ═══════════════════════════════════════════
  function initAdSense() {
    if (!isConfigured() || isAdsRemoved()) return;
    // AdSense auto-ads are loaded via the script tag in HTML
    // We just control container visibility
  }

  // ═══════════════════════════════════════════
  //  BANNER ADS
  // ═══════════════════════════════════════════
  async function showBanner() {
    if (isAdsRemoved()) return;

    if (_isCapacitor && _admobPlugin) {
      try {
        await _admobPlugin.showBanner({
          adId: AD_CONFIG.admob.banner,
          adSize: 'ADAPTIVE_BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0
        });
        _bannerVisible = true;
      } catch (e) { console.warn('[Ads] Banner show failed:', e); }
    } else {
      document.querySelectorAll('.ad-banner-container').forEach(c => c.hidden = false);
    }
  }

  async function hideBanner() {
    if (_isCapacitor && _admobPlugin && _bannerVisible) {
      try {
        await _admobPlugin.hideBanner();
        _bannerVisible = false;
      } catch (e) { /* ignore */ }
    } else {
      document.querySelectorAll('.ad-banner-container').forEach(c => c.hidden = true);
    }
  }

  // ═══════════════════════════════════════════
  //  INTERSTITIAL ADS
  // ═══════════════════════════════════════════
  async function showInterstitialIfReady() {
    if (isAdsRemoved()) return;

    const s = getAdState();
    s.gamesPlayed = (s.gamesPlayed || 0) + 1;
    s.totalGames = (s.totalGames || 0) + 1;
    saveAdState(s);

    if (s.totalGames <= INTERSTITIAL_GRACE) return;
    if (s.gamesPlayed % INTERSTITIAL_EVERY !== 0) return;
    if (Date.now() - _lastInterstitialTime < INTERSTITIAL_MIN_INTERVAL_MS) return;

    if (_isCapacitor && _admobPlugin && _interstitialLoaded) {
      try {
        await _admobPlugin.showInterstitial();
        _lastInterstitialTime = Date.now();
      } catch (e) { console.warn('[Ads] Interstitial show failed:', e); }
    }
  }

  // ═══════════════════════════════════════════
  //  REWARDED ADS
  // ═══════════════════════════════════════════
  function isRewardedReady() {
    if (_isCapacitor && _admobPlugin) return _rewardedLoaded;
    return false;
  }

  async function showRewarded(callback) {
    _rewardCallback = callback;

    if (_isCapacitor && _admobPlugin && _rewardedLoaded) {
      try {
        await _admobPlugin.showRewardVideoAd();
      } catch (e) {
        console.warn('[Ads] Rewarded show failed:', e);
        _rewardCallback = null;
      }
    } else {
      _rewardCallback = null;
    }
  }

  // ═══════════════════════════════════════════
  //  IN-APP PURCHASE: REMOVE ADS
  // ═══════════════════════════════════════════
  function applyAdsRemoved() {
    const s = getAdState();
    s.adsRemoved = true;
    s.gamesPlayed = 0;
    saveAdState(s);
    hideBanner();
    updateAdsUI();
  }

  function hasRemoveAdsEntitlement(info) {
    const entitlements = info?.customerInfo?.entitlements?.active || {};
    return !!entitlements['remove_ads'];
  }

  async function purchaseRemoveAds() {
    if (!_isCapacitor) return;

    try {
      if (!_iapPlugin) {
        const mod = await import('@capgo/capacitor-purchases');
        _iapPlugin = mod.CapacitorPurchases;
      }

      const result = await _iapPlugin.purchaseProduct({ productIdentifier: IAP_PRODUCT_ID });
      if (hasRemoveAdsEntitlement(result)) {
        applyAdsRemoved();
      }
    } catch (e) {
      if (e.code !== 'USER_CANCELLED') {
        console.error('[Ads] Purchase failed:', e);
      }
    }
  }

  async function restorePurchases() {
    if (!_isCapacitor) return;

    try {
      if (!_iapPlugin) {
        const mod = await import('@capgo/capacitor-purchases');
        _iapPlugin = mod.CapacitorPurchases;
      }

      const info = await _iapPlugin.restoreTransactions();
      if (hasRemoveAdsEntitlement(info)) {
        applyAdsRemoved();
        return true;
      }
      return false;
    } catch (e) {
      console.error('[Ads] Restore failed:', e);
      return false;
    }
  }

  // ═══════════════════════════════════════════
  //  UI
  // ═══════════════════════════════════════════
  function updateAdsUI() {
    const removed = isAdsRemoved();
    const nativeOnly = !_isCapacitor;

    const removeAdsBtn = document.getElementById('removeAdsBtn');
    if (removeAdsBtn) removeAdsBtn.hidden = removed || nativeOnly;

    const restoreBtn = document.getElementById('restorePurchasesBtn');
    if (restoreBtn) restoreBtn.hidden = removed || nativeOnly;

    const watchHintBtn = document.getElementById('watchAdHintBtn');
    if (watchHintBtn) watchHintBtn.hidden = true;

    const doubleXpBtn = document.getElementById('doubleXpBtn');
    if (doubleXpBtn) doubleXpBtn.hidden = true;
  }

  // ═══════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════
  window.LinkAds = {
    init: initAds,
    showBanner,
    hideBanner,
    showInterstitialIfReady,
    isRewardedReady,
    showRewarded,
    purchaseRemoveAds,
    restorePurchases,
    isAdsRemoved,
    updateAdsUI
  };

})();
