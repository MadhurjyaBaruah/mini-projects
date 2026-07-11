/*
  Glade - typing speed test

  Everything lives in one state object and a handful of functions.
  No frameworks, this is small enough that plain DOM work is easier
  to follow than reaching for a library.
*/

// a small pool of common, short english words. kept punctuation free
// on purpose, capitalisation and numbers would need their own rules
// for scoring so they are left out of this version.
const WORD_BANK = [
  'time', 'work', 'life', 'hand', 'part', 'child', 'eye', 'woman', 'place', 'work',
  'week', 'case', 'point', 'government', 'company', 'number', 'group', 'problem', 'fact',
  'water', 'room', 'mother', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right',
  'study', 'book', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service',
  'friend', 'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car',
  'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'body', 'information',
  'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health', 'person', 'art',
  'war', 'history', 'party', 'result', 'change', 'morning', 'reason', 'research', 'girl',
  'guy', 'moment', 'air', 'teacher', 'force', 'education', 'foot', 'boy', 'age', 'policy',
  'everything', 'process', 'music', 'market', 'sense', 'nation', 'plan', 'college', 'interest',
  'death', 'experience', 'effect', 'use', 'class', 'control', 'care', 'field', 'development',
  'role', 'effort', 'rate', 'heart', 'drug', 'show', 'leader', 'light', 'voice', 'wife',
  'whole', 'police', 'mind', 'price', 'report', 'decision', 'son', 'view', 'relationship',
  'town', 'road', 'arm', 'value', 'staff', 'action', 'age', 'bank', 'culture', 'space',
  'quality', 'nature', 'kid', 'building', 'material', 'evening', 'thing', 'season', 'stage',
  'answer', 'skill', 'model', 'weather', 'trade', 'growth', 'garden', 'forest', 'river',
  'stone', 'cloud', 'field', 'bridge', 'valley', 'coast', 'harbor', 'island', 'meadow',
  'quiet', 'bright', 'gentle', 'steady', 'simple', 'honest', 'clear', 'warm', 'still',
  'green', 'open', 'wide', 'deep', 'true', 'kind', 'brave', 'sharp', 'smooth', 'fresh'
];

const VALUE_OPTIONS = {
  time: [15, 30, 60, 120],
  words: [10, 25, 50, 100]
};

const DEFAULT_VALUE = {
  time: 30,
  words: 25
};

const RING_R_OUTER = 86;
const RING_R_INNER = 66;
const CIRC_OUTER = 2 * Math.PI * RING_R_OUTER;
const CIRC_INNER = 2 * Math.PI * RING_R_INNER;
const WPM_SCALE_CEILING = 150;

const HISTORY_KEY = 'glade-typing-history';
const BESTS_KEY = 'glade-typing-bests';

// elements
const el = {
  modeGroup: document.getElementById('modeGroup'),
  valueGroup: document.getElementById('valueGroup'),
  typeStage: document.getElementById('typeStage'),
  wordsViewport: document.getElementById('wordsViewport'),
  words: document.getElementById('words'),
  hiddenInput: document.getElementById('hiddenInput'),
  liveTime: document.getElementById('liveTime'),
  liveWpm: document.getElementById('liveWpm'),
  restartBtn: document.getElementById('restartBtn'),
  results: document.getElementById('results'),
  resultWpm: document.getElementById('resultWpm'),
  resultAccuracy: document.getElementById('resultAccuracy'),
  resultRaw: document.getElementById('resultRaw'),
  resultChars: document.getElementById('resultChars'),
  resultTime: document.getElementById('resultTime'),
  bestRow: document.getElementById('bestRow'),
  ringAccuracy: document.getElementById('ringAccuracy'),
  ringWpm: document.getElementById('ringWpm'),
  typeAgainBtn: document.getElementById('typeAgainBtn'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn')
};

const state = {
  mode: 'time',
  value: DEFAULT_VALUE.time,
  words: [],
  wordEls: [],
  currentIndex: 0,
  startTime: null,
  timer: null,
  finished: false,
  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  spacesTyped: 0
};

let tabArmed = false;

init();

function init() {
  buildValueGroup(state.mode);
  el.modeGroup.addEventListener('click', onModeClick);
  el.valueGroup.addEventListener('click', onValueClick);
  el.wordsViewport.addEventListener('click', () => el.hiddenInput.focus());
  el.hiddenInput.addEventListener('input', onInput);
  el.hiddenInput.addEventListener('keydown', onKeydown);
  el.restartBtn.addEventListener('click', restart);
  el.typeAgainBtn.addEventListener('click', restart);
  el.clearHistoryBtn.addEventListener('click', clearHistory);
  document.addEventListener('keydown', onDocumentKeydown);

  setupRings();
  resetTest();
  renderHistory();
  el.hiddenInput.focus();
}

function setupRings() {
  el.ringAccuracy.style.strokeDasharray = String(CIRC_OUTER);
  el.ringWpm.style.strokeDasharray = String(CIRC_INNER);
  setRingFraction(el.ringAccuracy, CIRC_OUTER, 0);
  setRingFraction(el.ringWpm, CIRC_INNER, 0);
}

function setRingFraction(circleEl, circumference, fraction) {
  const clamped = Math.max(0, Math.min(1, fraction));
  circleEl.style.strokeDashoffset = String(circumference * (1 - clamped));
}

// --- configuration pills ---

function buildValueGroup(mode) {
  const options = VALUE_OPTIONS[mode];
  el.valueGroup.innerHTML = '';
  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.value = String(option);
    btn.dataset.active = String(option === state.value);
    btn.textContent = mode === 'time' ? option + 's' : String(option);
    el.valueGroup.appendChild(btn);
  });
}

function onModeClick(e) {
  const target = e.target.closest('.pill');
  if (!target) return;
  const mode = target.dataset.mode;
  if (!mode || mode === state.mode) return;
  state.mode = mode;
  state.value = DEFAULT_VALUE[mode];
  Array.from(el.modeGroup.children).forEach((btn) => {
    btn.dataset.active = String(btn.dataset.mode === mode);
  });
  buildValueGroup(mode);
  resetTest();
}

function onValueClick(e) {
  const target = e.target.closest('.pill');
  if (!target) return;
  const value = Number(target.dataset.value);
  if (!value || value === state.value) return;
  state.value = value;
  Array.from(el.valueGroup.children).forEach((btn) => {
    btn.dataset.active = String(Number(btn.dataset.value) === value);
  });
  resetTest();
}

// --- word generation and rendering ---

function generateWords(count) {
  const out = [];
  let previous = null;
  for (let i = 0; i < count; i++) {
    let word;
    do {
      word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    } while (word === previous && WORD_BANK.length > 1);
    previous = word;
    out.push(word);
  }
  return out;
}

function renderWords(words, append) {
  if (!append) {
    el.words.innerHTML = '';
    state.wordEls = [];
  }
  const fragment = document.createDocumentFragment();
  words.forEach((word) => {
    const wordEl = document.createElement('div');
    wordEl.className = 'word';
    Array.from(word).forEach((ch) => {
      const letterEl = document.createElement('span');
      letterEl.className = 'letter';
      letterEl.textContent = ch;
      wordEl.appendChild(letterEl);
    });
    fragment.appendChild(wordEl);
    state.wordEls.push(wordEl);
  });
  el.words.appendChild(fragment);
}

function markCurrentWord() {
  state.wordEls.forEach((w, i) => {
    if (i === state.currentIndex) {
      w.dataset.current = 'true';
    } else {
      delete w.dataset.current;
    }
  });
}

// --- caret ---

function getOrCreateCaret() {
  let caret = el.words.querySelector('.caret');
  if (!caret) {
    caret = document.createElement('span');
    caret.className = 'caret';
    el.words.appendChild(caret);
  }
  return caret;
}

function updateCaret() {
  const wordEl = state.wordEls[state.currentIndex];
  const caret = getOrCreateCaret();
  if (!wordEl) {
    caret.style.display = 'none';
    return;
  }
  caret.style.display = 'block';
  const letters = wordEl.querySelectorAll('.letter');
  const typedLen = el.hiddenInput.value.length;
  const wordsRect = el.words.getBoundingClientRect();
  let targetRect;
  if (typedLen < letters.length) {
    targetRect = letters[typedLen].getBoundingClientRect();
    caret.style.left = (targetRect.left - wordsRect.left) + 'px';
  } else {
    const lastLetter = letters[letters.length - 1] || wordEl;
    targetRect = lastLetter.getBoundingClientRect();
    caret.style.left = (targetRect.right - wordsRect.left) + 'px';
  }
  caret.style.top = (targetRect.top - wordsRect.top) + 'px';
}

// --- scrolling the word list so the active line stays visible ---

function updateScroll() {
  const wordEl = state.wordEls[state.currentIndex] || state.wordEls[state.wordEls.length - 1];
  if (!wordEl) return;
  const lineHeight = parseFloat(getComputedStyle(el.words).lineHeight) || 40;
  const offsetTop = wordEl.offsetTop;
  const shift = offsetTop <= lineHeight ? 0 : offsetTop - lineHeight;
  el.words.style.transform = 'translateY(-' + shift + 'px)';
}

// --- typing logic ---

function onInput() {
  if (state.finished) return;

  if (state.startTime === null) {
    state.startTime = performance.now();
    startTicking();
  }

  const wordEl = state.wordEls[state.currentIndex];
  if (!wordEl) return;

  const typed = el.hiddenInput.value;
  const letters = wordEl.querySelectorAll('.letter');

  letters.forEach((letterEl, i) => {
    if (i >= typed.length) {
      letterEl.removeAttribute('data-state');
      return;
    }
    letterEl.dataset.state = typed[i] === letterEl.textContent ? 'correct' : 'incorrect';
  });

  // characters typed past the end of the word show up as their own
  // marks so mistakes are visible without breaking word alignment
  const existingExtra = wordEl.querySelectorAll('.letter.is-extra');
  const extraCount = Math.max(0, typed.length - letters.length);
  if (existingExtra.length < extraCount) {
    for (let i = existingExtra.length; i < extraCount; i++) {
      const extraEl = document.createElement('span');
      extraEl.className = 'letter is-extra';
      extraEl.dataset.state = 'extra';
      extraEl.textContent = typed[letters.length + i];
      wordEl.appendChild(extraEl);
    }
  } else if (existingExtra.length > extraCount) {
    for (let i = existingExtra.length - 1; i >= extraCount; i--) {
      existingExtra[i].remove();
    }
  }

  updateCaret();
  updateScroll();

  const isLastWord = state.currentIndex === state.words.length - 1;
  if (state.mode === 'words' && isLastWord && typed === state.words[state.currentIndex]) {
    tallyWord(wordEl);
    finishTest();
  }
}

function onKeydown(e) {
  if (state.finished) return;
  if (e.key === ' ') {
    e.preventDefault();
    if (el.hiddenInput.value.length === 0) return;
    completeCurrentWord();
  }
}

function onDocumentKeydown(e) {
  if (document.activeElement !== el.hiddenInput) return;
  if (e.key === 'Tab') {
    e.preventDefault();
    tabArmed = true;
    return;
  }
  if (e.key === 'Enter' && tabArmed) {
    restart();
  }
  tabArmed = false;
}

function tallyWord(wordEl) {
  const letters = wordEl.querySelectorAll('.letter');
  letters.forEach((letterEl) => {
    const s = letterEl.dataset.state;
    if (s === 'correct') state.correctChars++;
    else if (s === 'incorrect') state.incorrectChars++;
    else if (s === 'extra') state.extraChars++;
  });
}

function completeCurrentWord() {
  const wordEl = state.wordEls[state.currentIndex];
  if (wordEl) {
    tallyWord(wordEl);
    state.spacesTyped++;
  }

  state.currentIndex++;
  el.hiddenInput.value = '';

  if (state.mode === 'time' && state.words.length - state.currentIndex < 10) {
    const more = generateWords(20);
    state.words = state.words.concat(more);
    renderWords(more, true);
  }

  if (state.mode === 'words' && state.currentIndex >= state.words.length) {
    finishTest();
    return;
  }

  markCurrentWord();
  updateCaret();
  updateScroll();
}

// --- timer ---

function startTicking() {
  clearInterval(state.timer);
  state.timer = setInterval(tick, 200);
  tick();
}

function tick() {
  const elapsedMs = performance.now() - state.startTime;
  const elapsedMinutes = elapsedMs / 60000;

  if (state.mode === 'time') {
    const remaining = Math.max(0, state.value - Math.floor(elapsedMs / 1000));
    el.liveTime.textContent = formatClock(remaining);
    if (remaining <= 0) {
      finishTest();
      return;
    }
  } else {
    el.liveTime.textContent = formatClock(Math.floor(elapsedMs / 1000));
  }

  const wordEl = state.wordEls[state.currentIndex];
  let liveCorrect = state.correctChars;
  if (wordEl) {
    liveCorrect += wordEl.querySelectorAll('.letter[data-state="correct"]').length;
  }
  const wpm = elapsedMinutes > 0 ? Math.round((liveCorrect / 5) / elapsedMinutes) : 0;
  el.liveWpm.textContent = wpm + ' wpm';
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

// --- finishing and results ---

function finishTest() {
  if (state.finished) return;
  state.finished = true;
  clearInterval(state.timer);

  const startedAt = state.startTime || performance.now();
  let elapsedMinutes = (performance.now() - startedAt) / 60000;
  if (state.mode === 'time') {
    elapsedMinutes = state.value / 60;
  }
  elapsedMinutes = Math.max(elapsedMinutes, 1 / 60);

  const correctForWpm = state.correctChars + state.spacesTyped;
  const rawForWpm = state.correctChars + state.incorrectChars + state.extraChars + state.spacesTyped;
  const netWpm = Math.round((correctForWpm / 5) / elapsedMinutes);
  const rawWpm = Math.round((rawForWpm / 5) / elapsedMinutes);

  const typedNonSpace = state.correctChars + state.incorrectChars + state.extraChars;
  const accuracy = typedNonSpace > 0 ? Math.round((state.correctChars / typedNonSpace) * 100) : 100;
  const timeSeconds = Math.round(elapsedMinutes * 60);

  showResults({
    wpm: netWpm,
    raw: rawWpm,
    accuracy: accuracy,
    correct: state.correctChars,
    missed: state.incorrectChars + state.extraChars,
    seconds: timeSeconds
  });

  saveRun({
    mode: state.mode,
    value: state.value,
    wpm: netWpm,
    accuracy: accuracy,
    date: new Date().toISOString()
  });

  renderHistory();
}

function showResults(r) {
  el.resultWpm.textContent = String(r.wpm);
  el.resultAccuracy.textContent = r.accuracy + '%';
  el.resultRaw.textContent = r.raw + ' wpm';
  el.resultChars.textContent = r.correct + ' correct, ' + r.missed + ' missed';
  el.resultTime.textContent = formatClock(r.seconds);

  setRingFraction(el.ringAccuracy, CIRC_OUTER, r.accuracy / 100);
  setRingFraction(el.ringWpm, CIRC_INNER, r.wpm / WPM_SCALE_CEILING);

  const bestKey = state.mode + '-' + state.value;
  const bests = readJSON(BESTS_KEY, {});
  const previousBest = bests[bestKey];
  const isNewBest = !previousBest || r.wpm > previousBest.wpm;
  if (isNewBest) {
    bests[bestKey] = { wpm: r.wpm, accuracy: r.accuracy };
    writeJSON(BESTS_KEY, bests);
  }
  el.bestRow.hidden = !isNewBest;

  el.typeStage.hidden = true;
  el.results.hidden = false;
}

// --- history storage ---

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // storage may be unavailable in private browsing, fail quietly
  }
}

function saveRun(run) {
  const history = readJSON(HISTORY_KEY, []);
  history.push(run);
  while (history.length > 20) history.shift();
  writeJSON(HISTORY_KEY, history);
}

function clearHistory() {
  writeJSON(HISTORY_KEY, []);
  renderHistory();
}

function renderHistory() {
  const history = readJSON(HISTORY_KEY, []);
  el.historyList.innerHTML = '';

  if (history.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-empty';
    empty.textContent = 'No runs yet. Finish a test to see it here.';
    el.historyList.appendChild(empty);
    return;
  }

  history.slice(-6).reverse().forEach((run) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const left = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = run.wpm + ' wpm';
    left.appendChild(strong);

    const right = document.createElement('span');
    const unit = run.mode === 'time' ? 's' : ' words';
    right.textContent = run.accuracy + '% accuracy, ' + run.mode + ' ' + run.value + unit;

    item.appendChild(left);
    item.appendChild(right);
    el.historyList.appendChild(item);
  });
}

// --- reset ---

function resetTest() {
  clearInterval(state.timer);
  state.words = [];
  state.wordEls = [];
  state.currentIndex = 0;
  state.startTime = null;
  state.finished = false;
  state.correctChars = 0;
  state.incorrectChars = 0;
  state.extraChars = 0;
  state.spacesTyped = 0;

  el.hiddenInput.value = '';
  el.results.hidden = true;
  el.typeStage.hidden = false;
  el.words.style.transform = 'translateY(0px)';

  const initialCount = state.mode === 'time' ? 40 : state.value;
  state.words = generateWords(initialCount);
  renderWords(state.words, false);
  markCurrentWord();

  el.liveTime.textContent = state.mode === 'time' ? formatClock(state.value) : '0:00';
  el.liveWpm.textContent = '0 wpm';

  updateCaret();
  el.hiddenInput.focus();
}

function restart() {
  resetTest();
}
