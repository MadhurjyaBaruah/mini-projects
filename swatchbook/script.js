/* ---------------------------------------------------------
   Swatchbook
   Generates and extracts color palettes, rendered as a
   single paint chip style strip. No frameworks, no build
   step, nothing sent to a server.
--------------------------------------------------------- */

(function () {
  'use strict';

  var MIN_COUNT = 3;
  var MAX_COUNT = 8;
  var INITIAL_COUNT = 5;
  var HISTORY_KEY = 'swatchbook.history.v1';
  var HISTORY_LIMIT = 8;

  /* mirrors --ink and --paper in style.css */
  var TEXT_DARK = '#16231C';
  var TEXT_LIGHT = '#FBF7EC';

  /* ---------------- color math ---------------- */

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  }

  function hslToHex(h, s, l) {
    var rgb = hslToRgb(h, s, l);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = 0; s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }

  function relLuminance(hex) {
    var h = hex.replace('#', '');
    var r = parseInt(h.slice(0, 2), 16) / 255;
    var g = parseInt(h.slice(2, 4), 16) / 255;
    var b = parseInt(h.slice(4, 6), 16) / 255;
    function f(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }

  function contrastText(hex) {
    return relLuminance(hex) > 0.5 ? TEXT_DARK : TEXT_LIGHT;
  }

  /* ---------------- palette generation ---------------- */

  function generateShades(baseHue, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = count === 1 ? 0 : i / (count - 1);
      out.push({
        h: baseHue + (i - (count - 1) / 2) * 1.4,
        s: lerp(20, 66, t),
        l: lerp(93, 30, Math.pow(t, 0.9))
      });
    }
    return out;
  }

  function generateAnalogous(baseHue, count) {
    var spread = 70;
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = count === 1 ? 0.5 : i / (count - 1);
      out.push({
        h: baseHue - spread / 2 + spread * t,
        s: lerp(45, 68, Math.abs(t - 0.5) * 2),
        l: lerp(88, 34, t)
      });
    }
    return out;
  }

  function generateComplementary(baseHue, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = count === 1 ? 0 : i / (count - 1);
      out.push({
        h: i % 2 === 0 ? baseHue : baseHue + 180,
        s: lerp(35, 65, t),
        l: lerp(88, 32, t)
      });
    }
    return out;
  }

  function generateTriadic(baseHue, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = count === 1 ? 0 : i / (count - 1);
      out.push({
        h: baseHue + (i % 3) * 120,
        s: lerp(40, 62, t),
        l: lerp(88, 32, t)
      });
    }
    return out;
  }

  function generateRandom(baseHue, count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = count === 1 ? 0 : i / (count - 1);
      out.push({
        h: Math.random() * 360,
        s: 45 + Math.random() * 30,
        l: clamp(lerp(85, 30, t) + (Math.random() * 10 - 5), 12, 95)
      });
    }
    return out;
  }

  var GENERATORS = {
    shades: generateShades,
    analogous: generateAnalogous,
    complementary: generateComplementary,
    triadic: generateTriadic,
    random: generateRandom
  };

  /* ---------------- photo extraction (k-means-lite) ---------------- */

  function dist2(a, b) {
    var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    return dr * dr + dg * dg + db * db;
  }

  function kmeansColors(points, k, iterations) {
    if (points.length === 0) return [];
    k = Math.min(k, points.length);
    var centroids = [];
    var used = {};
    var guard = 0;
    while (centroids.length < k && guard < points.length * 4) {
      guard++;
      var idx = Math.floor(Math.random() * points.length);
      if (used[idx] && Object.keys(used).length < points.length) continue;
      used[idx] = true;
      centroids.push(points[idx].slice());
    }
    var assignments = new Array(points.length).fill(0);
    for (var iter = 0; iter < iterations; iter++) {
      for (var p = 0; p < points.length; p++) {
        var best = 0, bestDist = Infinity;
        for (var c = 0; c < centroids.length; c++) {
          var d = dist2(points[p], centroids[c]);
          if (d < bestDist) { bestDist = d; best = c; }
        }
        assignments[p] = best;
      }
      var sums = centroids.map(function () { return [0, 0, 0, 0]; });
      for (var p2 = 0; p2 < points.length; p2++) {
        var cc = assignments[p2];
        sums[cc][0] += points[p2][0];
        sums[cc][1] += points[p2][1];
        sums[cc][2] += points[p2][2];
        sums[cc][3]++;
      }
      for (var ci = 0; ci < centroids.length; ci++) {
        if (sums[ci][3] > 0) {
          centroids[ci] = [sums[ci][0] / sums[ci][3], sums[ci][1] / sums[ci][3], sums[ci][2] / sums[ci][3]];
        }
      }
    }
    return centroids.map(function (c) {
      return c.map(function (v) { return clamp(Math.round(v), 0, 255); });
    });
  }

  function collectPoints(img) {
    var maxDim = 100;
    var w0 = img.naturalWidth || img.width;
    var h0 = img.naturalHeight || img.height;
    var scale = Math.min(1, maxDim / Math.max(w0, h0));
    var w = Math.max(1, Math.round(w0 * scale));
    var h = Math.max(1, Math.round(h0 * scale));
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    var data;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch (err) {
      return [];
    }
    var points = [];
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      points.push([data[i], data[i + 1], data[i + 2]]);
    }
    return points;
  }

  /* ---------------- palette naming ---------------- */

  var NOUNS = {
    red: ['Clay', 'Brick', 'Ember', 'Rust', 'Poppy'],
    orange: ['Amber', 'Copper', 'Marmalade', 'Terracotta'],
    yellow: ['Honey', 'Wheat', 'Butter', 'Straw'],
    green: ['Fern', 'Moss', 'Sage', 'Pine', 'Basil', 'Ivy'],
    teal: ['Harbor', 'Lagoon', 'Spruce', 'Pond'],
    blue: ['Denim', 'Slate', 'Storm', 'River'],
    purple: ['Plum', 'Iris', 'Thistle', 'Violet'],
    pink: ['Blush', 'Rose', 'Petal', 'Coral'],
    neutral: ['Stone', 'Ash', 'Linen', 'Fog', 'Paper', 'Bone']
  };

  var MODIFIERS = {
    light: ['Quiet', 'Soft', 'Pale', 'Whisper', 'Faint', 'Milky'],
    mid: ['Garden', 'Morning', 'Wild', 'Warm', 'Dusty', 'Common'],
    dark: ['Deep', 'Dusk', 'Night', 'Shadow', 'Heavy', 'Old']
  };

  function circularMeanHue(hues) {
    var sx = 0, sy = 0;
    hues.forEach(function (h) {
      var r = (h * Math.PI) / 180;
      sx += Math.cos(r);
      sy += Math.sin(r);
    });
    var deg = (Math.atan2(sy, sx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  }

  function bucketForHue(h, s) {
    if (s < 12) return 'neutral';
    if (h < 15 || h >= 345) return 'red';
    if (h < 45) return 'orange';
    if (h < 70) return 'yellow';
    if (h < 170) return 'green';
    if (h < 200) return 'teal';
    if (h < 255) return 'blue';
    if (h < 290) return 'purple';
    return 'pink';
  }

  function seededPick(arr, seed) {
    var idx = Math.abs(Math.floor(Math.sin(seed) * 10000)) % arr.length;
    return arr[idx];
  }

  function nameForPalette(chips) {
    if (!chips.length) return 'Empty strip';
    var avgHue = circularMeanHue(chips.map(function (c) { return c.h; }));
    var avgSat = chips.reduce(function (a, c) { return a + c.s; }, 0) / chips.length;
    var avgL = chips.reduce(function (a, c) { return a + c.l; }, 0) / chips.length;
    var bucket = bucketForHue(avgHue, avgSat);
    var lightBucket = avgL >= 72 ? 'light' : avgL >= 42 ? 'mid' : 'dark';
    var seed = 0;
    chips.forEach(function (c, i) { seed += Math.round(c.h) * (i + 1) + Math.round(c.l) * 7; });
    var noun = seededPick(NOUNS[bucket], seed);
    var mod = seededPick(MODIFIERS[lightBucket], seed * 1.37 + 1);
    return mod + ' ' + noun;
  }

  /* ---------------- format helpers ---------------- */

  function formatChip(chip, format) {
    if (format === 'rgb') {
      var rgb = hslToRgb(chip.h, chip.s, chip.l);
      return 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
    }
    if (format === 'hsl') {
      return 'hsl(' + Math.round(chip.h) + ', ' + Math.round(chip.s) + '%, ' + Math.round(chip.l) + '%)';
    }
    return hslToHex(chip.h, chip.s, chip.l);
  }

  function capitalize(word) { return word.charAt(0).toUpperCase() + word.slice(1); }

  /* ---------------- clipboard ---------------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) resolve(); else reject(new Error('execCommand failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ---------------- DOM refs ---------------- */

  var stripEl = document.getElementById('strip');
  var stripWrapEl = document.getElementById('stripWrap');
  var bandsEl = document.getElementById('bands');
  var stripNameEl = document.getElementById('stripName');
  var stripStatusEl = document.getElementById('stripStatus');
  var photoPinEl = document.getElementById('photoPin');
  var photoThumbEl = document.getElementById('photoThumb');
  var photoRemoveEl = document.getElementById('photoRemove');
  var photoBtnEl = document.getElementById('photoBtn');
  var photoInputEl = document.getElementById('photoInput');
  var shuffleBtnEl = document.getElementById('shuffleBtn');
  var cssBtnEl = document.getElementById('cssBtn');
  var countMinusEl = document.getElementById('countMinus');
  var countPlusEl = document.getElementById('countPlus');
  var countValueEl = document.getElementById('countValue');
  var modeGroupEl = document.getElementById('modeGroup');
  var formatGroupEl = document.getElementById('formatGroup');
  var historyToggleEl = document.getElementById('historyToggle');
  var historyShelfEl = document.getElementById('historyShelf');
  var historyClearEl = document.getElementById('historyClear');
  var shelfEl = document.getElementById('shelf');
  var toastEl = document.getElementById('toast');

  var modeButtons = Array.prototype.slice.call(modeGroupEl.querySelectorAll('button'));
  var formatButtons = Array.prototype.slice.call(formatGroupEl.querySelectorAll('button'));

  /* ---------------- state ---------------- */

  var state = {
    mode: 'shades',
    format: 'hex',
    baseHue: Math.random() * 360,
    chips: [],
    photo: null
  };

  for (var i0 = 0; i0 < INITIAL_COUNT; i0++) {
    state.chips.push({ h: 0, s: 0, l: 50, locked: false });
  }

  /* ---------------- generation helpers ---------------- */

  function fillUnlocked(mode, baseHue, indices) {
    var targetIndices = indices || state.chips.map(function (c, i) { return i; }).filter(function (i) { return !state.chips[i].locked; });
    if (targetIndices.length === 0) return false;
    var fresh = GENERATORS[mode](baseHue, targetIndices.length);
    fresh = fresh.slice().sort(function (a, b) { return b.l - a.l; });
    targetIndices.forEach(function (idx, k) {
      state.chips[idx] = { h: fresh[k].h, s: fresh[k].s, l: fresh[k].l, locked: false };
    });
    return true;
  }

  function shuffle() {
    if (state.photo) {
      reExtractFromPhoto();
      return;
    }
    var hue = Math.random() * 360;
    var changed = fillUnlocked(state.mode, hue, null);
    if (!changed) {
      showToast("Everything is locked. Unlock a chip to shuffle it.");
      return;
    }
    state.baseHue = hue;
    render();
    saveToHistory();
  }

  function onModeChange(newMode) {
    state.mode = newMode;
    state.photo = null;
    state.baseHue = Math.random() * 360;
    fillUnlocked(state.mode, state.baseHue, null);
    render();
    saveToHistory();
  }

  function setCount(n) {
    n = clamp(n, MIN_COUNT, MAX_COUNT);
    if (n === state.chips.length) return;

    if (state.photo) {
      reExtractFromPhoto(n);
      return;
    }

    if (n > state.chips.length) {
      var start = state.chips.length;
      for (var i = 0; i < n - start; i++) state.chips.push({ h: 0, s: 0, l: 50, locked: false });
      var newIndices = [];
      for (var j = start; j < state.chips.length; j++) newIndices.push(j);
      fillUnlocked(state.mode, state.baseHue, newIndices);
    } else {
      state.chips.length = n;
    }
    render();
  }

  function reExtractFromPhoto(newCount) {
    var count = newCount || state.chips.length;
    var centroids = kmeansColors(collectPoints(state.photo.img), count, 7);
    if (!centroids.length) {
      showToast("Couldn't read colors from that photo.");
      return;
    }
    var chips = centroids.map(function (rgb) {
      var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      return { h: hsl[0], s: hsl[1], l: hsl[2], locked: false };
    });
    chips.sort(function (a, b) { return b.l - a.l; });
    state.chips = chips;
    render();
    saveToHistory();
  }

  function processImageFile(file) {
    if (!file) return;
    if (!file.type || file.type.indexOf('image/') !== 0) {
      showToast("That file isn't an image. Try a different one.");
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { showToast("That image didn't load. Try a different file."); };
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      var img = new Image();
      img.onerror = function () { showToast("That image didn't load. Try a different file."); };
      img.onload = function () {
        var centroids = kmeansColors(collectPoints(img), state.chips.length, 7);
        if (!centroids.length) {
          showToast("Couldn't find colors in that photo.");
          return;
        }
        var chips = centroids.map(function (rgb) {
          var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
          return { h: hsl[0], s: hsl[1], l: hsl[2], locked: false };
        });
        chips.sort(function (a, b) { return b.l - a.l; });
        state.chips = chips;
        state.photo = { dataUrl: dataUrl, img: img };
        render();
        saveToHistory();
        showToast('Lifted ' + chips.length + ' colors from your photo.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    state.photo = null;
    state.baseHue = Math.random() * 360;
    fillUnlocked(state.mode, state.baseHue, null);
    render();
  }

  /* ---------------- rendering ---------------- */

  function render() {
    var active = document.activeElement;
    var refocus = null;
    if (active && bandsEl.contains(active) && active.dataset && active.dataset.index !== undefined) {
      refocus = { index: active.dataset.index, cls: active.classList.contains('band-pin') ? 'band-pin' : 'band-copy' };
    }

    stripEl.classList.toggle('photo-mode', !!state.photo);
    bandsEl.innerHTML = '';

    state.chips.forEach(function (chip, i) {
      var hex = hslToHex(chip.h, chip.s, chip.l);
      var fg = contrastText(hex);
      var codeText = formatChip(chip, state.format);

      var band = document.createElement('div');
      band.className = 'band';
      band.style.setProperty('--bg', hex);
      band.style.setProperty('--fg', fg);

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'band-copy';
      copyBtn.dataset.index = String(i);
      copyBtn.setAttribute('aria-label', 'Copy ' + codeText + (chip.locked ? '. Locked.' : '. Unlocked.'));
      var codeSpan = document.createElement('span');
      codeSpan.className = 'band-code';
      codeSpan.textContent = codeText;
      copyBtn.appendChild(codeSpan);
      band.appendChild(copyBtn);

      if (!state.photo) {
        var pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'band-pin';
        pin.dataset.index = String(i);
        pin.setAttribute('aria-pressed', chip.locked ? 'true' : 'false');
        pin.setAttribute('aria-label', chip.locked ? 'Unlock this chip' : 'Lock this chip');
        pin.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-lock-' + (chip.locked ? 'closed' : 'open') + '"></use></svg>';
        band.appendChild(pin);
      }

      bandsEl.appendChild(band);
    });

    stripNameEl.textContent = nameForPalette(state.chips);

    var lockedCount = state.chips.filter(function (c) { return c.locked; }).length;
    var modeLabel = state.photo ? 'From a photo' : capitalize(state.mode);
    stripStatusEl.textContent = modeLabel + ', ' + state.chips.length + ' chip' + (state.chips.length === 1 ? '' : 's') + ', ' + lockedCount + ' locked.';

    modeButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.mode === state.mode && !state.photo); });
    formatButtons.forEach(function (b) { b.classList.toggle('active', b.dataset.format === state.format); });

    countValueEl.textContent = String(state.chips.length);
    countMinusEl.disabled = state.chips.length <= MIN_COUNT;
    countPlusEl.disabled = state.chips.length >= MAX_COUNT;

    if (state.photo) {
      photoPinEl.hidden = false;
      photoThumbEl.src = state.photo.dataUrl;
    } else {
      photoPinEl.hidden = true;
      photoThumbEl.removeAttribute('src');
    }

    if (refocus) {
      var again = bandsEl.querySelector('.' + refocus.cls + '[data-index="' + refocus.index + '"]');
      if (again) again.focus();
    }
  }

  /* ---------------- history ---------------- */

  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveHistoryList(list) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch (err) {
      /* storage unavailable, fail quietly */
    }
  }

  function saveToHistory() {
    var entry = {
      chips: state.chips.map(function (c) { return { h: c.h, s: c.s, l: c.l }; }),
      mode: state.photo ? 'photo' : state.mode,
      name: nameForPalette(state.chips),
      ts: Date.now()
    };
    var list = loadHistory();
    list.unshift(entry);
    list = list.slice(0, HISTORY_LIMIT);
    saveHistoryList(list);
    renderShelf(list);
  }

  function renderShelf(list) {
    list = list || loadHistory();
    shelfEl.innerHTML = '';
    if (list.length === 0) {
      var p = document.createElement('p');
      p.className = 'shelf-empty';
      p.textContent = 'No strips saved yet. Shuffle one to start.';
      shelfEl.appendChild(p);
      return;
    }
    list.forEach(function (entry) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mini-strip';
      btn.setAttribute('aria-label', 'Load the ' + entry.name + ' strip');
      entry.chips.forEach(function (c) {
        var span = document.createElement('span');
        span.style.background = hslToHex(c.h, c.s, c.l);
        btn.appendChild(span);
      });
      btn.addEventListener('click', function () {
        state.chips = entry.chips.map(function (c) { return { h: c.h, s: c.s, l: c.l, locked: false }; });
        state.photo = null;
        if (GENERATORS.hasOwnProperty(entry.mode)) state.mode = entry.mode;
        render();
      });
      shelfEl.appendChild(btn);
    });
  }

  /* ---------------- toast ---------------- */

  var toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------------- events ---------------- */

  bandsEl.addEventListener('click', function (e) {
    var pinBtn = e.target.closest('.band-pin');
    if (pinBtn) {
      var pinIdx = Number(pinBtn.dataset.index);
      state.chips[pinIdx].locked = !state.chips[pinIdx].locked;
      render();
      return;
    }
    var copyBtn = e.target.closest('.band-copy');
    if (copyBtn) {
      var idx = Number(copyBtn.dataset.index);
      var text = formatChip(state.chips[idx], state.format);
      copyText(text).then(function () {
        showToast('Copied ' + text + '.');
      }).catch(function () {
        showToast("Couldn't copy. Select and copy manually.");
      });
    }
  });

  shuffleBtnEl.addEventListener('click', shuffle);

  countMinusEl.addEventListener('click', function () { setCount(state.chips.length - 1); });
  countPlusEl.addEventListener('click', function () { setCount(state.chips.length + 1); });

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { onModeChange(btn.dataset.mode); });
  });

  formatButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.format = btn.dataset.format;
      render();
    });
  });

  cssBtnEl.addEventListener('click', function () {
    var lines = state.chips.map(function (c, i) {
      return '  --swatch-' + (i + 1) + ': ' + hslToHex(c.h, c.s, c.l) + ';';
    });
    var css = ':root {\n' + lines.join('\n') + '\n}';
    copyText(css).then(function () {
      showToast('Copied CSS variables.');
    }).catch(function () {
      showToast("Couldn't copy. Select and copy manually.");
    });
  });

  photoBtnEl.addEventListener('click', function () { photoInputEl.click(); });
  photoInputEl.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    processImageFile(file);
    photoInputEl.value = '';
  });
  photoRemoveEl.addEventListener('click', removePhoto);

  var dragCounter = 0;
  ['dragenter', 'dragover'].forEach(function (evt) {
    stripWrapEl.addEventListener(evt, function (e) {
      e.preventDefault();
      if (evt === 'dragenter') dragCounter++;
      stripWrapEl.classList.add('drag-active');
    });
  });
  stripWrapEl.addEventListener('dragleave', function () {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      stripWrapEl.classList.remove('drag-active');
    }
  });
  stripWrapEl.addEventListener('drop', function (e) {
    e.preventDefault();
    dragCounter = 0;
    stripWrapEl.classList.remove('drag-active');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) processImageFile(file);
  });
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    if (!stripWrapEl.contains(e.target)) e.preventDefault();
  });

  historyToggleEl.addEventListener('click', function () {
    var willShow = historyShelfEl.hidden;
    historyShelfEl.hidden = !willShow;
    historyToggleEl.setAttribute('aria-expanded', String(willShow));
    if (willShow) renderShelf();
  });

  historyClearEl.addEventListener('click', function () {
    saveHistoryList([]);
    renderShelf([]);
  });

  window.addEventListener('keydown', function (e) {
    var isSpace = e.code === 'Space' || e.key === ' ';
    if (isSpace && document.activeElement === document.body) {
      e.preventDefault();
      shuffle();
    }
  });

  /* ---------------- init ---------------- */

  fillUnlocked(state.mode, state.baseHue, null);
  render();
  renderShelf(loadHistory());
})();
