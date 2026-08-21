// Signal - Morse Code Translator
// Encodes text to visual dots/dashes, decodes morse back to text,
// plays the signal as audio tones via the Web Audio API.

const MORSE = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',   E: '.',
  F: '..-.',  G: '--.',   H: '....',  I: '..',    J: '.---',
  K: '-.-',   L: '.-..', M: '--',    N: '-.',    O: '---',
  P: '.--.',  Q: '--.-',  R: '.-.',   S: '...',   T: '-',
  U: '..-',   V: '...-',  W: '.--',   X: '-..-',  Y: '-.--',
  Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..',
  "'": '.----.', '!': '-.-.--', '/': '-..-.', '+': '.-.-.',
  '=': '-...-',  '@': '.--.-.'
};

// reverse map: morse code -> character
const FROM_MORSE = Object.fromEntries(
  Object.entries(MORSE).map(([ch, code]) => [code, ch])
);

const SPEED_NAMES = ['Very slow', 'Slow', 'Normal', 'Fast', 'Very fast'];
const SPEED_MULT  = [2.4, 1.6, 1.0, 0.62, 0.36];

// Base timing at Normal speed, in milliseconds.
// Ratios: dot=1u, dash=3u, sym-gap=1u, letter-gap=3u, word-gap=7u
const UNIT_MS = 80;

// app state
let mode     = 'encode';
let playing  = false;
let aborted  = false;
let audioCtx = null;
let toastTimer;

// DOM shortcuts
const el = (id) => document.getElementById(id);

const dom = {
  input:      el('text-input'),
  view:       el('morse-view'),
  string:     el('morse-string'),
  chars:      el('char-count'),
  inputLabel: el('input-label'),
  playBtn:    el('play-btn'),
  playLabel:  el('play-label'),
  copyBtn:    el('copy-btn'),
  clearBtn:   el('clear-btn'),
  speedRange: el('speed-range'),
  speedTag:   el('speed-tag'),
  encodeTab:  el('btn-encode'),
  decodeTab:  el('btn-decode'),
  refGrid:    el('ref-grid'),
  refNote:    el('ref-note'),
  toast:      el('toast'),
};

// --------------------------------------------------
// Conversion
// --------------------------------------------------

function toMorse(text) {
  return text.toUpperCase().split('').map(ch => {
    if (ch === ' ') return '/';
    return MORSE[ch] ?? null;
  }).filter(x => x !== null).join(' ');
}

function fromMorse(morse) {
  return morse.trim()
    .split(/\s*\/\s*/)
    .map(word =>
      word.trim().split(/\s+/).map(code => FROM_MORSE[code] ?? '?').join('')
    ).join(' ');
}

// --------------------------------------------------
// Rendering
// --------------------------------------------------

function makeSymbol(type) {
  const s = document.createElement('span');
  s.className = type; // 'dot' or 'dash'
  return s;
}

function renderEncodeView(morseStr) {
  const view = dom.view;
  view.innerHTML = '';

  if (!morseStr) {
    view.innerHTML = '<p class="hint">Start typing to see the <em>signal</em></p>';
    return;
  }

  const words = morseStr.split(' / ');

  words.forEach((word, wi) => {
    word.trim().split(' ').filter(Boolean).forEach(code => {
      const group = document.createElement('div');
      group.className = 'letter-group';
      code.split('').forEach(s => group.appendChild(makeSymbol(s === '.' ? 'dot' : 'dash')));
      view.appendChild(group);
    });

    if (wi < words.length - 1) {
      const bar = document.createElement('div');
      bar.className = 'word-bar';
      view.appendChild(bar);
    }
  });
}

function renderDecodeView(text) {
  dom.view.innerHTML = text
    ? `<span class="decoded-text">${text}</span>`
    : '<p class="hint">Paste Morse code to <em>decode</em></p>';
}

// --------------------------------------------------
// Main update - called on every input event
// --------------------------------------------------

function update() {
  const raw = dom.input.value;
  const len = raw.length;

  dom.chars.textContent = `${len} character${len !== 1 ? 's' : ''}`;

  if (mode === 'encode') {
    const morse = toMorse(raw);
    dom.string.textContent = morse;
    renderEncodeView(morse);
    const hasOutput = morse.length > 0;
    dom.playBtn.disabled = !hasOutput;
    dom.copyBtn.disabled = !hasOutput;
  } else {
    const trimmed = raw.trim();
    if (trimmed) {
      const text = fromMorse(trimmed);
      dom.string.textContent = text;
      renderDecodeView(text);
    } else {
      dom.string.textContent = '';
      renderDecodeView('');
    }
    dom.playBtn.disabled = !trimmed;
    dom.copyBtn.disabled = !trimmed;
  }
}

// --------------------------------------------------
// Audio - Web Audio API tone generation
// --------------------------------------------------

function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  return audioCtx;
}

// Play a sine tone for the given duration (ms)
function beep(ac, durationMs) {
  return new Promise(resolve => {
    const dur = durationMs / 1000;
    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = 'sine';
    osc.frequency.value = 620;

    // Ramp in/out to avoid clicks at note boundaries
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.26, ac.currentTime + 0.007);
    gain.gain.linearRampToValueAtTime(0.26, ac.currentTime + dur - 0.007);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);

    osc.start();
    osc.stop(ac.currentTime + dur);
    osc.onended = resolve;
  });
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function playSignal() {
  if (playing) {
    aborted = true;
    return;
  }

  const morseStr = mode === 'encode'
    ? dom.string.textContent
    : dom.input.value.trim();

  if (!morseStr) return;

  const ac = getAudioCtx();
  if (!ac) {
    showToast('Audio not available');
    return;
  }

  // Resume context if suspended (browser autoplay policy)
  if (ac.state === 'suspended') await ac.resume();

  const mult = SPEED_MULT[parseInt(dom.speedRange.value) - 1];
  const u    = UNIT_MS * mult; // one timing unit in ms

  playing = true;
  aborted = false;
  dom.playLabel.textContent = 'Stop';
  dom.view.classList.add('playing');

  const syms  = dom.view.querySelectorAll('.dot, .dash');
  let   symIdx = 0;

  const words = morseStr.split(' / ');

  wordLoop: for (let w = 0; w < words.length; w++) {
    const letters = words[w].trim().split(' ').filter(Boolean);

    for (let l = 0; l < letters.length; l++) {
      const code = letters[l];

      for (let s = 0; s < code.length; s++) {
        if (aborted) break wordLoop;

        const sym  = code[s];
        const symEl = syms[symIdx++];

        if (symEl) symEl.classList.add('on');
        await beep(ac, sym === '.' ? u : u * 3);
        if (symEl) symEl.classList.remove('on');

        // inter-symbol gap (not after last symbol in letter)
        if (s < code.length - 1 && !aborted) await wait(u);
      }

      // inter-letter gap (not after last letter in word)
      if (l < letters.length - 1 && !aborted) await wait(u * 3);
    }

    // inter-word gap (not after last word)
    if (w < words.length - 1 && !aborted) await wait(u * 7);
  }

  playing = false;
  aborted = false;
  dom.playLabel.textContent = 'Play';
  dom.view.classList.remove('playing');
}

// --------------------------------------------------
// Reference chart
// --------------------------------------------------

function buildRefChart() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

  chars.forEach(ch => {
    const code = MORSE[ch];
    if (!code) return;

    const card = document.createElement('div');
    card.className = 'ref-card';
    card.title = `${ch}  ${code}`;

    // character label
    const charEl = document.createElement('span');
    charEl.className = 'ref-char';
    charEl.textContent = ch;

    // visual symbols
    const symsEl = document.createElement('div');
    symsEl.className = 'ref-syms';
    code.split('').forEach(s => {
      const sym = document.createElement('span');
      sym.className = s === '.' ? 'rd' : 'rk';
      symsEl.appendChild(sym);
    });

    // raw code text
    const codeEl = document.createElement('span');
    codeEl.className = 'ref-code';
    codeEl.textContent = code;

    card.append(charEl, symsEl, codeEl);

    // clicking in encode mode inserts the character
    card.addEventListener('click', () => {
      if (mode === 'encode') {
        dom.input.value += ch;
        dom.input.focus();
        update();
      }
    });

    dom.refGrid.appendChild(card);
  });
}

// --------------------------------------------------
// Toast
// --------------------------------------------------

function showToast(msg) {
  clearTimeout(toastTimer);
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2200);
}

// --------------------------------------------------
// Mode switching
// --------------------------------------------------

function setMode(newMode) {
  mode = newMode;
  dom.input.value = '';

  dom.encodeTab.classList.toggle('active', newMode === 'encode');
  dom.decodeTab.classList.toggle('active', newMode === 'decode');

  if (newMode === 'encode') {
    dom.inputLabel.textContent = 'Your message';
    dom.input.placeholder = 'Type something...';
    dom.refNote.textContent = 'Click a card to insert the character';
    dom.refNote.style.opacity = '0.7';
  } else {
    dom.inputLabel.textContent = 'Morse code input';
    dom.input.placeholder = '... .. --. -. .- .-..';
    dom.refNote.textContent = 'For reference only in decode mode';
    dom.refNote.style.opacity = '0.45';
  }

  update();
}

// --------------------------------------------------
// Event listeners
// --------------------------------------------------

dom.input.addEventListener('input', update);

dom.playBtn.addEventListener('click', playSignal);

dom.copyBtn.addEventListener('click', () => {
  const text = mode === 'encode'
    ? dom.string.textContent
    : dom.input.value.trim();

  if (!text) return;

  navigator.clipboard.writeText(text)
    .then(() => showToast('Copied'))
    .catch(() => showToast('Copy failed'));
});

dom.clearBtn.addEventListener('click', () => {
  dom.input.value = '';
  dom.input.focus();
  update();
});

dom.speedRange.addEventListener('input', () => {
  dom.speedTag.textContent = SPEED_NAMES[dom.speedRange.value - 1];
});

dom.encodeTab.addEventListener('click', () => {
  if (mode !== 'encode') setMode('encode');
});

dom.decodeTab.addEventListener('click', () => {
  if (mode !== 'decode') setMode('decode');
});

// --------------------------------------------------
// Init
// --------------------------------------------------

buildRefChart();
dom.speedTag.textContent = SPEED_NAMES[2]; // 'Normal'
update();
