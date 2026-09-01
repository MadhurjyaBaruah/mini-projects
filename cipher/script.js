// Cipher - classical text encoder/decoder
// Caesar, ROT13, Vigenere - all running in the browser, no backend needed

// ---- State ----

var cipherType = 'caesar';
var mode = 'encode';
var shiftAmt = 3;
var glitchId = null;

// ---- Descriptions ----

var cipherInfo = {
  caesar: 'Each letter shifts forward by a fixed amount. A becomes D, B becomes E, and so on. Attributed to Julius Caesar, who used a shift of 3.',
  rot13: 'A special case of Caesar with a shift of 13. Because the alphabet has 26 letters, applying ROT13 twice returns the original text exactly.',
  vigenere: 'Uses a repeating keyword to apply a different shift to each letter. A key of "cat" shifts by 2, 0, 19, then repeats from the start.'
};

// ---- Sample messages ----

var samples = [
  'The quick brown fox jumps over the lazy dog.',
  'Attack at dawn, before they wake.',
  'All warfare is based on deception.',
  'Stay hungry. Stay foolish.',
  'To be or not to be, that is the question.'
];

// ============================================================
// Cipher algorithms
// ============================================================

function caesarShift(text, n) {
  // Normalize n to 0-25
  n = ((n % 26) + 26) % 26;
  return text.split('').map(function(c) {
    if (/[a-z]/.test(c)) return String.fromCharCode(((c.charCodeAt(0) - 97 + n) % 26) + 97);
    if (/[A-Z]/.test(c)) return String.fromCharCode(((c.charCodeAt(0) - 65 + n) % 26) + 65);
    return c;
  }).join('');
}

function vigEncrypt(text, keyword) {
  var key = keyword.toLowerCase().replace(/[^a-z]/g, '');
  if (!key.length) return text;
  var ki = 0;
  return text.split('').map(function(c) {
    var s;
    if (/[a-z]/.test(c)) {
      s = key.charCodeAt(ki % key.length) - 97;
      ki++;
      return String.fromCharCode(((c.charCodeAt(0) - 97 + s) % 26) + 97);
    }
    if (/[A-Z]/.test(c)) {
      s = key.charCodeAt(ki % key.length) - 97;
      ki++;
      return String.fromCharCode(((c.charCodeAt(0) - 65 + s) % 26) + 65);
    }
    return c;
  }).join('');
}

function vigDecrypt(text, keyword) {
  var key = keyword.toLowerCase().replace(/[^a-z]/g, '');
  if (!key.length) return text;
  var ki = 0;
  return text.split('').map(function(c) {
    var s;
    if (/[a-z]/.test(c)) {
      s = key.charCodeAt(ki % key.length) - 97;
      ki++;
      return String.fromCharCode(((c.charCodeAt(0) - 97 - s + 26) % 26) + 97);
    }
    if (/[A-Z]/.test(c)) {
      s = key.charCodeAt(ki % key.length) - 97;
      ki++;
      return String.fromCharCode(((c.charCodeAt(0) - 65 - s + 26) % 26) + 65);
    }
    return c;
  }).join('');
}

function runCipher(text) {
  if (cipherType === 'caesar') {
    var n = mode === 'encode' ? shiftAmt : (26 - (shiftAmt % 26)) % 26;
    return caesarShift(text, n);
  }
  if (cipherType === 'rot13') {
    // ROT13 is its own inverse, applying it twice returns original
    return caesarShift(text, 13);
  }
  if (cipherType === 'vigenere') {
    var key = document.getElementById('vig-key').value.trim();
    return mode === 'encode' ? vigEncrypt(text, key) : vigDecrypt(text, key);
  }
  return text;
}

// ============================================================
// Glitch animation for output
// Characters scramble before settling on the real result
// ============================================================

var glyphPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function animateOutput(final) {
  var el = document.getElementById('text-out');

  if (glitchId) {
    clearInterval(glitchId);
    glitchId = null;
  }

  if (!final) {
    el.value = '';
    return;
  }

  var revealed = 0;
  var step = Math.max(2, Math.ceil(final.length / 12));

  glitchId = setInterval(function() {
    revealed = Math.min(final.length, revealed + step);

    el.value = final.split('').map(function(c, i) {
      // Already revealed - lock it in
      if (i < revealed) return c;
      // Non-letter chars pass through immediately
      if (!/[a-zA-Z]/.test(c)) return c;
      // Still scrambling
      return glyphPool[Math.floor(Math.random() * glyphPool.length)];
    }).join('');

    if (revealed >= final.length) {
      el.value = final;
      clearInterval(glitchId);
      glitchId = null;
    }
  }, 36);
}

// ============================================================
// Transform - run cipher and update UI
// ============================================================

function transform() {
  var inp = document.getElementById('text-in').value;
  var out = runCipher(inp);

  animateOutput(out);

  document.getElementById('count-in').textContent = inp.length;
  document.getElementById('count-out').textContent = out.length;
}

// ============================================================
// Alphabet mapper
// Shows live letter-to-letter mapping for the active cipher
// ============================================================

function buildMapper() {
  var strip = document.getElementById('alpha-strip');
  var plainRow = document.getElementById('row-plain');
  var cipherRow = document.getElementById('row-cipher');

  // Vigenere mapping changes per-position, so mapper doesn't apply
  if (cipherType === 'vigenere') {
    strip.style.display = 'none';
    return;
  }
  strip.style.display = '';

  plainRow.innerHTML = '';
  cipherRow.innerHTML = '';

  var mappedShift;
  if (cipherType === 'rot13') {
    mappedShift = 13;
  } else {
    mappedShift = mode === 'encode' ? shiftAmt : (26 - (shiftAmt % 26)) % 26;
  }

  for (var i = 0; i < 26; i++) {
    var plainLetter  = String.fromCharCode(65 + i);
    var cipherLetter = String.fromCharCode(((i + mappedShift) % 26) + 65);

    // Light up first 4 letters as a worked example
    var isLit = i < 4;

    var pc = document.createElement('div');
    pc.className = 'a-cell' + (isLit ? ' lit' : '');
    pc.textContent = plainLetter;
    plainRow.appendChild(pc);

    var cc = document.createElement('div');
    cc.className = 'a-cell' + (isLit ? ' lit' : '');
    cc.textContent = cipherLetter;
    cipherRow.appendChild(cc);
  }
}

// ============================================================
// Switch cipher type
// ============================================================

function setCipher(c) {
  cipherType = c;

  document.getElementById('cipher-desc').textContent = cipherInfo[c];

  document.getElementById('slot-caesar').classList.toggle('hidden', c !== 'caesar');
  document.getElementById('slot-vigenere').classList.toggle('hidden', c !== 'vigenere');
  document.getElementById('slot-rot13').classList.toggle('hidden', c !== 'rot13');

  buildMapper();
  transform();
}

// ============================================================
// Switch encode / decode mode
// ============================================================

function setMode(m) {
  mode = m;

  var arrowLbl = document.getElementById('arrow-lbl');
  var outLabel = document.getElementById('out-label');

  if (m === 'encode') {
    arrowLbl.textContent = 'encoding';
    outLabel.textContent = 'cipher text';
  } else {
    arrowLbl.textContent = 'decoding';
    outLabel.textContent = 'plain text';
  }

  buildMapper();
  transform();
}

// ============================================================
// Event listeners
// ============================================================

// Cipher tab buttons
document.querySelectorAll('.c-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.c-tab').forEach(function(t) {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-selected', 'true');
    setCipher(this.dataset.cipher);
  });
});

// Encode / decode mode buttons
document.querySelectorAll('.mode-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.mode-btn').forEach(function(b) {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    setMode(this.dataset.mode);
  });
});

// Live input
document.getElementById('text-in').addEventListener('input', transform);

// Shift down
document.getElementById('btn-down').addEventListener('click', function() {
  shiftAmt = Math.max(1, shiftAmt - 1);
  document.getElementById('shift-input').value = shiftAmt;
  buildMapper();
  transform();
});

// Shift up
document.getElementById('btn-up').addEventListener('click', function() {
  shiftAmt = Math.min(25, shiftAmt + 1);
  document.getElementById('shift-input').value = shiftAmt;
  buildMapper();
  transform();
});

// Shift typed directly
document.getElementById('shift-input').addEventListener('change', function() {
  var v = parseInt(this.value, 10);
  if (!isNaN(v)) {
    shiftAmt = Math.max(1, Math.min(25, v));
    this.value = shiftAmt;
    buildMapper();
    transform();
  }
});

// Vigenere keyword
document.getElementById('vig-key').addEventListener('input', transform);

// Clear
document.getElementById('btn-clear').addEventListener('click', function() {
  if (glitchId) { clearInterval(glitchId); glitchId = null; }
  document.getElementById('text-in').value = '';
  document.getElementById('text-out').value = '';
  document.getElementById('count-in').textContent = '0';
  document.getElementById('count-out').textContent = '0';
});

// Load sample
document.getElementById('btn-sample').addEventListener('click', function() {
  var idx = Math.floor(Math.random() * samples.length);
  document.getElementById('text-in').value = samples[idx];
  transform();
});

// Copy result
document.getElementById('btn-copy').addEventListener('click', function() {
  var out = document.getElementById('text-out').value;
  if (!out) return;

  var self = this;

  navigator.clipboard.writeText(out).then(function() {
    var msg = document.getElementById('copy-ok');
    msg.classList.remove('hidden');
    setTimeout(function() { msg.classList.add('hidden'); }, 2000);
  }).catch(function() {
    // Fallback for older browsers
    document.getElementById('text-out').select();
    document.execCommand('copy');
  });
});

// ============================================================
// Boot
// ============================================================

setCipher('caesar');
