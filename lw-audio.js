// LinkWords — Audio & Haptics (extracted module)
(function(LW) {
  'use strict';

  let _state;
  let audioCtx = null;

  function init(state) { _state = state; }

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function() {});
    }
  }

  function playTone(freq, duration, type, gain, detune) {
    if (type === undefined) type = 'sine';
    if (gain === undefined) gain = 0.15;
    if (!_state.sound) return;
    try {
      ensureAudio();
      if (audioCtx.state === 'suspended') return;
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(gain, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
      osc.addEventListener('ended', function() { osc.disconnect(); g.disconnect(); });

      if (detune) {
        var osc2 = audioCtx.createOscillator();
        var g2 = audioCtx.createGain();
        osc2.type = type;
        osc2.frequency.setValueAtTime(freq + detune, audioCtx.currentTime);
        g2.gain.setValueAtTime(gain * 0.6, audioCtx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc2.connect(g2);
        g2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + duration);
        osc2.addEventListener('ended', function() { osc2.disconnect(); g2.disconnect(); });
      }
    } catch (e) { /* ignore */ }
  }

  function playSound(type) {
    if (!_state.sound) return;
    switch (type) {
      case 'select': {
        var baseFreq = 523 + ((_state.chain?.length || 0) * 40);
        playTone(baseFreq, 0.1, 'sine', 0.15, 2.5);
        setTimeout(function() { playTone(baseFreq * 1.26, 0.1, 'sine', 0.12, 2.5); }, 50);
        break;
      }
      case 'crossTheme': {
        var cFreq = 659 + ((_state.chain?.length || 0) * 40);
        playTone(cFreq, 0.12, 'sine', 0.18, 3);
        setTimeout(function() { playTone(cFreq * 1.5, 0.12, 'sine', 0.14, 3); }, 40);
        setTimeout(function() { playTone(cFreq * 1.26, 0.08, 'sine', 0.10); }, 80);
        break;
      }
      case 'deselect':
        playTone(392, 0.08, 'sine', 0.15, 2);
        break;
      case 'error':
        playTone(200, 0.15, 'square', 0.08);
        setTimeout(function() { playTone(180, 0.2, 'square', 0.06); }, 100);
        break;
      case 'hint':
        playTone(880, 0.15, 'sine', 0.15, 2);
        setTimeout(function() { playTone(1047, 0.15, 'sine', 0.12, 2); }, 100);
        break;
      case 'complete':
        [523, 659, 784, 1047].forEach(function(f, i) {
          var last = i === 3;
          setTimeout(function() { playTone(f, last ? 0.4 : 0.2, 'sine', 0.12, 2); }, i * 80);
        });
        break;
      case 'mastermind':
        [523, 659, 784, 1047, 1319].forEach(function(f, i) {
          var last = i === 4;
          setTimeout(function() { playTone(f, last ? 0.5 : 0.3, 'sine', 0.15, 3); }, i * 80);
        });
        break;
      case 'perfect':
        [523, 659, 784, 1047, 1319].forEach(function(f, i) {
          var last = i === 4;
          setTimeout(function() { playTone(f, last ? 0.5 : 0.3, 'sine', 0.15, 3); }, i * 80);
        });
        break;
      case 'click':
        playTone(440, 0.05, 'sine', 0.06, 2);
        break;
      case 'achievement':
        playTone(784, 0.15, 'sine', 0.15, 2);
        setTimeout(function() { playTone(988, 0.15, 'sine', 0.12, 2); }, 80);
        setTimeout(function() { playTone(1175, 0.2, 'sine', 0.15, 3); }, 160);
        break;
      case 'newBest':
        [659, 784, 988, 1175, 1319].forEach(function(f, i) {
          setTimeout(function() { playTone(f, 0.25, 'sine', 0.12, 2); }, i * 100);
        });
        break;
    }
  }

  var _ambientNodes = [];
  var AMBIENT_PROFILES = {
    'nature-walk': [
      { freq: 180, type: 'sine', gain: 0.03 },
      { freq: 320, type: 'sine', gain: 0.015 },
      { freq: 520, type: 'triangle', gain: 0.008 }
    ],
    'mind-palace': [
      { freq: 220, type: 'sine', gain: 0.025 },
      { freq: 440, type: 'sine', gain: 0.012 }
    ],
    'kingdom': [
      { freq: 147, type: 'sine', gain: 0.03 },
      { freq: 294, type: 'triangle', gain: 0.015 }
    ],
    'elements': [
      { freq: 110, type: 'sawtooth', gain: 0.015 },
      { freq: 165, type: 'sine', gain: 0.02 }
    ],
    'heart-soul': [
      { freq: 261, type: 'sine', gain: 0.025 },
      { freq: 392, type: 'sine', gain: 0.012 }
    ],
    'wild-world': [
      { freq: 196, type: 'sine', gain: 0.025 },
      { freq: 350, type: 'triangle', gain: 0.01 }
    ]
  };

  function startAmbient(themeKey) {
    stopAmbient();
    if (!_state.sound) return;
    var profile = AMBIENT_PROFILES[themeKey];
    if (!profile) return;
    try {
      ensureAudio();
      if (audioCtx.state === 'suspended') return;
      for (var i = 0; i < profile.length; i++) {
        var p = profile[i];
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = p.type;
        osc.frequency.setValueAtTime(p.freq, audioCtx.currentTime);
        var lfo = audioCtx.createOscillator();
        var lfoGain = audioCtx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1 + i * 0.05, audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(p.gain * 0.3, audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(g.gain);
        g.gain.setValueAtTime(p.gain, audioCtx.currentTime);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        lfo.start();
        _ambientNodes.push(osc, g, lfo, lfoGain);
      }
    } catch (e) { /* ignore */ }
  }

  function stopAmbient() {
    for (var i = 0; i < _ambientNodes.length; i++) {
      try { _ambientNodes[i].stop ? _ambientNodes[i].stop() : null; } catch (e) {}
      try { _ambientNodes[i].disconnect(); } catch (e) {}
    }
    _ambientNodes = [];
  }

  function vibrate(pattern) {
    if (_state.haptics && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  function announce(msg) {
    var el = document.getElementById('a11yAnnouncer');
    if (el) { el.textContent = ''; requestAnimationFrame(function() { el.textContent = msg; }); }
  }

  LW.audio = {
    init, ensureAudio, playTone, playSound, vibrate, announce,
    startAmbient, stopAmbient
  };

})(window.LW = window.LW || {});
