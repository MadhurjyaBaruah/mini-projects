/* Drift
   Every sound here is generated with the Web Audio API. No samples,
   no downloads. Noise gets shaped by filters, a few slow oscillators
   wobble the levels, and that is basically the whole trick. */

(() => {
  'use strict';

  const STORE_KEY = 'drift.mix.v1';
  const FADE_MS = 20000; // how long the sleep timer takes to fade to silence

  // "scale" is a rough loudness trim so equal slider values sit at similar volume.
  // If one layer feels too loud or too quiet on your speakers, nudge it here.
  const LAYERS = [
    { id: 'rain',  name: 'Rain',  note: 'A steady hiss on the glass',    def: 45, scale: 1.2 },
    { id: 'wind',  name: 'Wind',  note: 'Slow gusts through tall grass', def: 25, scale: 2.2 },
    { id: 'hum',   name: 'Hum',   note: 'A low, warm drone',             def: 30, scale: 0.25 },
    { id: 'deep',  name: 'Deep',  note: 'Brown noise for heavy focus',   def: 20, scale: 1.6 },
    { id: 'ember', name: 'Ember', note: 'Fire pops, now and then',       def: 0,  scale: 1.6 },
  ];

  const SCENES = [
    { name: 'Rainy window', mix: { rain: 70, wind: 15, hum: 25, deep: 35, ember: 0 } },
    { name: 'Campfire',     mix: { rain: 0,  wind: 22, hum: 12, deep: 20, ember: 72 } },
    { name: 'Open field',   mix: { rain: 8,  wind: 66, hum: 10, deep: 0,  ember: 0 } },
    { name: 'Deep focus',   mix: { rain: 22, wind: 0,  hum: 55, deep: 45, ember: 0 } },
    { name: 'Storm',        mix: { rain: 88, wind: 72, hum: 18, deep: 62, ember: 0 } },
  ];

  // rgb triples, so the canvas can add its own alpha
  const TEAL = '93,185,150';
  const DEEP = '16,139,79';
  const LIME = '228,241,175';

  const $ = (sel) => document.querySelector(sel);
  const els = {
    play: $('#play'),
    state: $('#state'),
    vol: $('#vol'),
    volOut: $('#vol-out'),
    timer: $('#timer'),
    countdown: $('#countdown'),
    scenes: $('#scenes'),
    layers: $('#layers'),
    shuffle: $('#shuffle'),
    reset: $('#reset'),
    copy: $('#copy'),
    status: $('#status'),
    field: $('#field'),
  };

  const AC = window.AudioContext || window.webkitAudioContext;
  const byId = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const levelCurve = (v) => Math.pow(v / 100, 1.4);
  const levelToGain = (id, v) => levelCurve(v) * byId[id].scale;

  const state = loadState();

  let actx = null;
  let master = null;
  let analyser = null;
  let freqData = null;
  let noise = {};
  let layerNodes = {};
  let emberOut = null;
  let emberTimer = null;
  let playing = false;

  let timerMin = 0;
  let remaining = 0;
  let fadeFactor = 1;


  /* ------------------------------------------------------------------
     saved state
  ------------------------------------------------------------------ */

  function loadState() {
    const s = { vol: 70 };
    LAYERS.forEach((l) => { s[l.id] = l.def; });

    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && typeof saved === 'object') {
        LAYERS.forEach((l) => {
          if (Number.isFinite(saved[l.id])) s[l.id] = clamp(Math.round(saved[l.id]), 0, 100);
        });
        if (Number.isFinite(saved.vol)) s.vol = clamp(Math.round(saved.vol), 0, 100);
      }
    } catch (_) { /* private mode or bad json, just use defaults */ }

    // a shared link wins over whatever was saved
    const hash = new URLSearchParams(window.location.hash.slice(1));
    LAYERS.forEach((l) => {
      const n = parseInt(hash.get(l.id), 10);
      if (!Number.isNaN(n)) s[l.id] = clamp(n, 0, 100);
    });
    const v = parseInt(hash.get('vol'), 10);
    if (!Number.isNaN(v)) s.vol = clamp(v, 0, 100);

    return s;
  }

  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
    }, 250);
  }


  /* ------------------------------------------------------------------
     sound building blocks
  ------------------------------------------------------------------ */

  // Makes a few seconds of noise. The first half second is crossfaded with
  // the extra tail so the loop point does not click.
  function makeNoise(kind, seconds = 8) {
    const rate = actx.sampleRate;
    const len = Math.floor(rate * seconds);
    const fade = Math.floor(rate * 0.5);
    const raw = new Float32Array(len + fade);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let last = 0;

    for (let i = 0; i < raw.length; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') {
        raw[i] = w * 0.5;
      } else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        raw[i] = last * 3.5;
      }
    }

    const buf = actx.createBuffer(1, len, rate);
    const out = buf.getChannelData(0);
    out.set(raw.subarray(0, len));
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      out[i] = raw[i] * t + raw[len + i] * (1 - t);
    }
    return buf;
  }

  // A looping noise source starting at a random spot, optionally panned.
  // Returns the last node in its little chain so you can connect from it.
  function noiseNode(kind, pan = 0) {
    const src = actx.createBufferSource();
    src.buffer = noise[kind];
    src.loop = true;
    src.start(0, Math.random() * noise[kind].duration);
    if (actx.createStereoPanner) {
      const p = actx.createStereoPanner();
      p.pan.value = pan;
      src.connect(p);
      return p;
    }
    return src;
  }

  function filter(type, freq, q = 0.7) {
    const f = actx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  // slow oscillator that nudges an AudioParam up and down
  function lfo(freq, depth, param) {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.frequency.value = freq;
    g.gain.value = depth;
    o.connect(g);
    g.connect(param);
    o.start();
  }


  /* ------------------------------------------------------------------
     the five layers
  ------------------------------------------------------------------ */

  function buildRain(out) {
    // two panned streams of filtered pink noise for width
    [-0.55, 0.55].forEach((pan) => {
      const hp = filter('highpass', 650);
      const lp = filter('lowpass', 7500);
      const g = actx.createGain();
      g.gain.value = 0.55;
      noiseNode('pink', pan).connect(hp);
      hp.connect(lp);
      lp.connect(g);
      g.connect(out);
      lfo(0.12 + Math.random() * 0.1, 0.08, g.gain);
    });

    // a thin bright band on top so it does not sound like a vent
    const bp = filter('bandpass', 3200, 0.6);
    const sparkle = actx.createGain();
    sparkle.gain.value = 0.18;
    noiseNode('white').connect(bp);
    bp.connect(sparkle);
    sparkle.connect(out);
  }

  function buildWind(out) {
    [-0.4, 0.4].forEach((pan, i) => {
      const bp = filter('bandpass', 480, 1.1);
      const gust = actx.createGain();
      gust.gain.value = 0.7;
      noiseNode('pink', pan).connect(bp);
      bp.connect(gust);
      gust.connect(out);
      lfo(0.055 + i * 0.03, 260, bp.frequency);   // the pitch of the wind drifts
      lfo(0.085 + i * 0.04, 0.4, gust.gain);      // and it swells and dies back
    });
  }

  function buildHum(out) {
    const lp = filter('lowpass', 900);
    const tone = actx.createGain();
    tone.gain.value = 0.5;

    // a low A with a few of its overtones, each detuned a hair
    [
      [55.0,  'sine',     0.9],
      [110.4, 'triangle', 0.5],
      [164.9, 'sine',     0.35],
      [220.3, 'triangle', 0.18],
    ].forEach(([freq, type, amp]) => {
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 10;
      g.gain.value = amp;
      o.connect(g);
      g.connect(lp);
      o.start();
      lfo(0.05 + Math.random() * 0.08, amp * 0.25, g.gain);
    });

    lp.connect(tone);
    tone.connect(out);
  }

  function buildDeep(out) {
    [-0.5, 0.5].forEach((pan) => {
      const lp = filter('lowpass', 520);
      const g = actx.createGain();
      g.gain.value = 0.6;
      noiseNode('brown', pan).connect(lp);
      lp.connect(g);
      g.connect(out);
      lfo(0.04, 80, lp.frequency);
    });
  }

  function buildEmber(out) {
    emberOut = out;

    // the soft roar underneath, the pops are scheduled separately
    const lp = filter('lowpass', 280);
    const bed = actx.createGain();
    bed.gain.value = 0.45;
    noiseNode('brown').connect(lp);
    lp.connect(bed);
    bed.connect(out);
    lfo(0.2, 0.15, bed.gain);
  }

  // one little crackle, then schedule the next at a random gap
  function pop() {
    if (!playing) return;

    if (state.ember > 0) {
      const t = actx.currentTime;
      const dur = 0.01 + Math.random() * 0.05;
      const src = actx.createBufferSource();
      src.buffer = noise.white;

      const bp = filter('bandpass', 1000 + Math.random() * 3500, 2 + Math.random() * 5);
      const g = actx.createGain();
      const peak = 0.4 + Math.random() * 1.1;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      src.connect(bp);
      bp.connect(g);

      let tail = g;
      if (actx.createStereoPanner) {
        const p = actx.createStereoPanner();
        p.pan.value = Math.random() * 1.4 - 0.7;
        g.connect(p);
        tail = p;
      }
      tail.connect(emberOut);
      src.start(t, Math.random() * 6, dur + 0.02);
    }

    // cubing the random number bunches the pops into little bursts
    emberTimer = setTimeout(pop, 30 + Math.pow(Math.random(), 3) * 650);
  }


  /* ------------------------------------------------------------------
     audio graph and transport
  ------------------------------------------------------------------ */

  function ensureAudio() {
    if (actx) return;
    actx = new AC();

    master = actx.createGain();
    master.gain.value = 0;

    const post = actx.createGain();
    post.gain.value = 3;

    const comp = actx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 6;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;

    const trim = actx.createGain();
    trim.gain.value = 0.9;

    analyser = actx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;
    freqData = new Uint8Array(analyser.frequencyBinCount);

    master.connect(post);
    post.connect(comp);
    comp.connect(trim);
    trim.connect(analyser);
    analyser.connect(actx.destination);

    noise = {
      white: makeNoise('white'),
      pink: makeNoise('pink'),
      brown: makeNoise('brown'),
    };

    const builders = { rain: buildRain, wind: buildWind, hum: buildHum, deep: buildDeep, ember: buildEmber };
    LAYERS.forEach((l) => {
      const out = actx.createGain();
      out.gain.value = levelToGain(l.id, state[l.id]);
      out.connect(master);
      layerNodes[l.id] = out;
      builders[l.id](out);
    });
  }

  const masterTarget = () => Math.pow(state.vol / 100, 1.5) * 0.9 * fadeFactor;

  async function start() {
    if (!AC) return;
    try {
      ensureAudio();
      await actx.resume();
    } catch (err) {
      els.state.textContent = 'Could not start audio in this browser';
      return;
    }
    playing = true;
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setTargetAtTime(masterTarget(), actx.currentTime, 0.3);
    clearTimeout(emberTimer);
    pop();
    paintPlaying();
  }

  function stop() {
    playing = false;
    clearTimeout(emberTimer);
    if (master) {
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.setTargetAtTime(0, actx.currentTime, 0.12);
      // give the fade a moment, then let the audio hardware sleep
      setTimeout(() => { if (!playing && actx) actx.suspend(); }, 600);
    }
    paintPlaying();
  }

  const toggle = () => (playing ? stop() : start());

  function setLevel(id, v, ramp = 0.08) {
    state[id] = v;
    if (layerNodes[id]) {
      layerNodes[id].gain.setTargetAtTime(levelToGain(id, v), actx.currentTime, ramp);
    }
  }

  function setVolume(v) {
    state.vol = v;
    if (master && playing) {
      master.gain.setTargetAtTime(masterTarget(), actx.currentTime, 0.05);
    }
  }


  /* ------------------------------------------------------------------
     sleep timer
  ------------------------------------------------------------------ */

  function setTimer(min) {
    timerMin = min;
    remaining = min * 60000;
    fadeFactor = 1;
    if (master && playing) {
      master.gain.setTargetAtTime(masterTarget(), actx.currentTime, 0.2);
    }
    paintTimer();
  }

  let lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = now - lastTick;
    lastTick = now;

    // the clock only runs while sound is playing
    if (!playing || !timerMin) return;

    remaining = Math.max(0, remaining - dt);
    fadeFactor = remaining < FADE_MS ? remaining / FADE_MS : 1;
    master.gain.setTargetAtTime(masterTarget(), actx.currentTime, 0.25);
    paintCountdown();

    if (remaining === 0) {
      stop();
      setTimer(0);
      announce('Timer finished. Sound has faded out.');
    }
  }, 250);


  /* ------------------------------------------------------------------
     painting the interface
  ------------------------------------------------------------------ */

  function announce(msg) {
    els.status.textContent = '';
    // tiny delay so screen readers notice repeated messages
    setTimeout(() => { els.status.textContent = msg; }, 30);
  }

  function renderScenes() {
    els.scenes.innerHTML = SCENES.map((s, i) =>
      `<button type="button" class="scene" data-i="${i}" aria-pressed="false">${s.name}</button>`
    ).join('');
  }

  function renderLayers() {
    els.layers.innerHTML = LAYERS.map((l) => `
      <li class="layer" data-id="${l.id}">
        <div class="layer-head">
          <span class="dot" aria-hidden="true"></span>
          <label class="layer-name" for="lv-${l.id}">${l.name}</label>
          <output class="layer-val" for="lv-${l.id}">0</output>
        </div>
        <p class="layer-note">${l.note}</p>
        <input type="range" id="lv-${l.id}" min="0" max="100" step="1" value="0">
      </li>`
    ).join('');
  }

  function paintLevel(id) {
    const input = $('#lv-' + id);
    const li = input.closest('.layer');
    const v = state[id];
    input.value = v;
    input.style.setProperty('--v', v + '%');
    li.querySelector('.layer-val').textContent = v;
    li.style.setProperty('--glow', (v / 100).toFixed(2));
  }

  function paintVolume() {
    els.vol.value = state.vol;
    els.vol.style.setProperty('--v', state.vol + '%');
    els.volOut.textContent = state.vol;
  }

  function paintScenes() {
    els.scenes.querySelectorAll('.scene').forEach((btn, i) => {
      const m = SCENES[i].mix;
      btn.setAttribute('aria-pressed', LAYERS.every((l) => state[l.id] === m[l.id]));
    });
  }

  function paintPlaying() {
    els.play.setAttribute('aria-pressed', playing);
    els.play.setAttribute('aria-label', playing ? 'Pause sound' : 'Start sound');

    if (!playing) {
      els.state.textContent = 'Ready when you are';
    } else {
      const n = LAYERS.filter((l) => state[l.id] > 0).length;
      els.state.textContent = n === 0
        ? 'Playing, but every layer is silent'
        : `Playing, ${n} ${n === 1 ? 'layer' : 'layers'} active`;
    }
    document.title = playing ? 'Drift (playing)' : 'Drift | Ambient sound mixer';
  }

  function paintTimer() {
    els.timer.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', Number(b.dataset.min) === timerMin);
    });
    paintCountdown();
  }

  function paintCountdown() {
    if (!timerMin) {
      els.countdown.textContent = '';
      return;
    }
    const total = Math.ceil(remaining / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, '0');
    els.countdown.textContent = `${m}:${s} left`;
  }

  function paintAll() {
    LAYERS.forEach((l) => paintLevel(l.id));
    paintVolume();
    paintScenes();
    paintPlaying();
    paintTimer();
  }


  /* ------------------------------------------------------------------
     interactions
  ------------------------------------------------------------------ */

  els.play.addEventListener('click', toggle);

  els.vol.addEventListener('input', () => {
    setVolume(Number(els.vol.value));
    paintVolume();
    persist();
  });

  els.layers.addEventListener('input', (e) => {
    if (!e.target.matches('input[type="range"]')) return;
    const id = e.target.id.replace('lv-', '');
    setLevel(id, Number(e.target.value));
    paintLevel(id);
    paintScenes();
    paintPlaying();
    persist();
  });

  function applyMix(mix) {
    LAYERS.forEach((l) => setLevel(l.id, mix[l.id], 0.4));
    paintAll();
    persist();
  }

  els.scenes.addEventListener('click', (e) => {
    const btn = e.target.closest('.scene');
    if (btn) applyMix(SCENES[Number(btn.dataset.i)].mix);
  });

  els.shuffle.addEventListener('click', () => {
    const mix = {};
    let lit = 0;
    LAYERS.forEach((l) => {
      const on = Math.random() < 0.6;
      mix[l.id] = on ? 15 + Math.floor(Math.random() * 65) : 0;
      if (on) lit++;
    });
    if (!lit) mix[LAYERS[Math.floor(Math.random() * LAYERS.length)].id] = 40;
    applyMix(mix);
  });

  els.reset.addEventListener('click', () => {
    const mix = {};
    LAYERS.forEach((l) => { mix[l.id] = 0; });
    applyMix(mix);
  });

  els.timer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) setTimer(Number(btn.dataset.min));
  });

  els.copy.addEventListener('click', async () => {
    const p = new URLSearchParams();
    LAYERS.forEach((l) => p.set(l.id, state[l.id]));
    p.set('vol', state.vol);
    const url = window.location.href.split('#')[0] + '#' + p.toString();

    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch (_) {
      // older browsers or a non secure page, fall back to the old trick
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
    }

    els.copy.textContent = ok ? 'Link copied' : 'Copy failed';
    announce(ok ? 'Mix link copied to clipboard' : 'Could not copy the link');
    setTimeout(() => { els.copy.textContent = 'Copy mix link'; }, 1800);
  });

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'SELECT') return;
    e.preventDefault();
    toggle();
  });


  /* ------------------------------------------------------------------
     the glowing lines in the background
  ------------------------------------------------------------------ */

  const pen = els.field.getContext('2d');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0;
  let H = 0;
  let live = 0;     // eases toward 1 while playing, so the lines wake up gradually
  let energy = 0;   // smoothed loudness from the analyser

  const RIBBONS = [
    { id: 'rain',  y: 0.20, freq: 0.016,  speed: 1.5,  glow: TEAL, core: TEAL },
    { id: 'wind',  y: 0.38, freq: 0.0055, speed: 0.55, glow: TEAL, core: DEEP },
    { id: 'hum',   y: 0.55, freq: 0.0035, speed: 0.28, glow: LIME, core: TEAL },
    { id: 'deep',  y: 0.72, freq: 0.0022, speed: 0.14, glow: TEAL, core: DEEP },
    { id: 'ember', y: 0.88, freq: 0.011,  speed: 2.1,  glow: LIME, core: DEEP },
  ];

  function sizeField() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    els.field.width = Math.round(W * dpr);
    els.field.height = Math.round(H * dpr);
    pen.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawRibbon(r, t) {
    const lvl = state[r.id] / 100;
    const wake = 0.55 + 0.45 * live;
    const amp = 10 + lvl * 56 * wake * (0.85 + energy * 1.2);
    const alpha = (0.25 + 0.75 * lvl) * (0.5 + 0.5 * live);
    const base = r.y * H;

    const path = new Path2D();
    for (let x = -10; x <= W + 10; x += 8) {
      const a = x * r.freq + t * r.speed;
      let y = base + Math.sin(a) * amp + Math.sin(a * 2.3 - t * 0.6) * amp * 0.35;
      if (r.id === 'ember') y += Math.sin(x * 0.07 + t * 8) * amp * 0.12;
      if (x === -10) path.moveTo(x, y); else path.lineTo(x, y);
    }

    pen.lineCap = 'round';
    pen.lineJoin = 'round';

    // three passes: wide soft glow, tighter glow, thin bright core
    pen.strokeStyle = `rgba(${r.glow},${(0.09 * alpha).toFixed(3)})`;
    pen.lineWidth = 18;
    pen.stroke(path);

    pen.strokeStyle = `rgba(${r.glow},${(0.18 * alpha).toFixed(3)})`;
    pen.lineWidth = 8;
    pen.stroke(path);

    pen.strokeStyle = `rgba(${r.core},${(0.85 * alpha).toFixed(3)})`;
    pen.lineWidth = 1.6;
    pen.stroke(path);
  }

  function frame(ms) {
    const t = (ms / 1000) * (calm ? 0.25 : 1);

    live += ((playing ? 1 : 0) - live) * 0.04;

    if (analyser && playing) {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) sum += freqData[i];
      energy += (sum / freqData.length / 255 - energy) * 0.12;
    } else {
      energy *= 0.96;
    }

    pen.clearRect(0, 0, W, H);
    RIBBONS.forEach((r) => drawRibbon(r, t));
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', sizeField);


  /* ------------------------------------------------------------------
     go
  ------------------------------------------------------------------ */

  renderScenes();
  renderLayers();
  paintAll();
  sizeField();
  requestAnimationFrame(frame);

  if (!AC) {
    els.play.disabled = true;
    els.state.textContent = 'This browser does not support Web Audio';
  }
})();
