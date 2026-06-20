"use strict";

/* ==========================================================================
   INSTRUMENT PROFILES
   Each string carries the note name shown to the player and the standard
   equal temperament frequency it should ring at. Frequencies follow
   A4 = 440Hz concert pitch.
   ========================================================================== */

const INSTRUMENTS = {
  acoustic: {
    label: "Acoustic Guitar",
    strings: [
      { note: "E2", freq: 82.41 },
      { note: "A2", freq: 110.00 },
      { note: "D3", freq: 146.83 },
      { note: "G3", freq: 196.00 },
      { note: "B3", freq: 246.94 },
      { note: "E4", freq: 329.63 }
    ],
    note: "Six string standard tuning, low to high: E A D G B E."
  },
  electric: {
    label: "Electric Guitar",
    strings: [
      { note: "E2", freq: 82.41 },
      { note: "A2", freq: 110.00 },
      { note: "D3", freq: 146.83 },
      { note: "G3", freq: 196.00 },
      { note: "B3", freq: 246.94 },
      { note: "E4", freq: 329.63 }
    ],
    note: "Same standard tuning as acoustic guitar. Pickup output is louder, so back off your input gain if readings clip."
  },
  bass: {
    label: "Bass Guitar",
    strings: [
      { note: "E1", freq: 41.20 },
      { note: "A1", freq: 55.00 },
      { note: "D2", freq: 73.42 },
      { note: "G2", freq: 98.00 }
    ],
    note: "Four string standard tuning, low to high: E A D G. An octave below the bottom four guitar strings."
  },
  ukulele: {
    label: "Ukulele",
    strings: [
      { note: "G4", freq: 392.00 },
      { note: "C4", freq: 261.63 },
      { note: "E4", freq: 329.63 },
      { note: "A4", freq: 440.00 }
    ],
    note: "Standard reentrant tuning: G C E A. The G string is tuned higher than the C string, not lower."
  },
  violin: {
    label: "Violin",
    strings: [
      { note: "G3", freq: 196.00 },
      { note: "D4", freq: 293.66 },
      { note: "A4", freq: 440.00 },
      { note: "E5", freq: 659.25 }
    ],
    note: "Four strings tuned in fifths, low to high: G D A E."
  },
  chromatic: {
    label: "Chromatic Mode",
    strings: null,
    note: "No fixed strings. Every pitch is measured against the nearest note in the twelve tone equal tempered scale."
  }
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const IN_TUNE_CENTS = 5;
const NOISE_GATE_RMS = 0.012;
const ANALYSIS_INTERVAL_MS = 45;
const SILENCE_RESET_MS = 600;
const HISTORY_LENGTH = 6;
const JUMP_RESET_CENTS = 150;
const CENTS_TO_DEG = 1.8; // maps the -50..+50 cent range onto a 180 degree sweep

/* ==========================================================================
   DOM REFERENCES
   ========================================================================== */

const elements = {
  toggleButton: document.getElementById("toggleTuner"),
  toggleLabel: document.getElementById("toggleTunerLabel"),
  statusHint: document.getElementById("statusHint"),
  errorBanner: document.getElementById("errorBanner"),
  instrumentTag: document.getElementById("instrumentTag"),
  noteDisplay: document.getElementById("noteDisplay"),
  freqDisplay: document.getElementById("freqDisplay"),
  statusChip: document.getElementById("statusChip"),
  centsDisplay: document.getElementById("centsDisplay"),
  needleGroup: document.getElementById("needleGroup"),
  tickGroup: document.getElementById("tickGroup"),
  instrumentGrid: document.getElementById("instrumentGrid"),
  stringChips: document.getElementById("stringChips"),
  readoutNote: document.getElementById("readoutNote"),
  readoutFreq: document.getElementById("readoutFreq"),
  readoutString: document.getElementById("readoutString"),
  readoutTarget: document.getElementById("readoutTarget"),
  readoutCents: document.getElementById("readoutCents"),
  signalFill: document.getElementById("signalFill"),
  guideIntro: document.getElementById("guideIntro"),
  guideTableBody: document.getElementById("guideTableBody"),
  guideFootnote: document.getElementById("guideFootnote"),
  navToggle: document.getElementById("navToggle"),
  navMenu: document.getElementById("navMenu"),
  yearStamp: document.getElementById("yearStamp")
};

/* ==========================================================================
   RUNTIME STATE
   ========================================================================== */

const state = {
  isRunning: false,
  selectedInstrument: "acoustic",
  audioCtx: null,
  analyser: null,
  mediaStream: null,
  timeDomainBuffer: null,
  rafId: null,
  lastAnalysisTime: 0,
  lastSoundTime: 0,
  freqHistory: [],
  lastStatusState: ""
};

/* ==========================================================================
   PITCH DETECTION
   Autocorrelation in the time domain rather than reading FFT bins, because
   bin spacing on a 2048 to 4096 point FFT is too coarse to resolve a low
   guitar or bass string precisely. The signal is correlated against shifted
   copies of itself across a lag range, the strongest match marks the
   fundamental period, and a parabolic fit across the three best points
   recovers sub sample precision.
   ========================================================================== */

function computeRms(buffer) {
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSquares += buffer[i] * buffer[i];
  }
  return Math.sqrt(sumSquares / buffer.length);
}

function autoCorrelate(buffer, sampleRate, minLag, maxLag) {
  const size = buffer.length;

  // Trim near silent leading and trailing samples so the correlation window
  // sits on the part of the buffer that actually has signal in it.
  const trimThreshold = 0.15;
  let start = 0;
  let end = size - 1;
  for (let i = 0; i < size; i++) {
    if (Math.abs(buffer[i]) > trimThreshold) { start = i; break; }
  }
  for (let i = size - 1; i > start; i--) {
    if (Math.abs(buffer[i]) > trimThreshold) { end = i; break; }
  }

  const samples = buffer.subarray(start, end + 1);
  const n = samples.length;
  if (n < maxLag + 8) return -1;

  const correlations = new Float32Array(maxLag + 2);
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const limit = n - lag;
    if (limit <= 0) break;
    for (let i = 0; i < limit; i++) {
      sum += samples[i] * samples[i + lag];
    }
    const correlation = sum / limit;
    correlations[lag] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag <= minLag) return -1;

  // Parabolic interpolation across (bestLag - 1, bestLag, bestLag + 1) recovers
  // a fractional lag, which matters most at low frequencies where one whole
  // sample of lag error can be several cents of pitch error.
  const c0 = correlations[bestLag - 1] || bestCorrelation;
  const c1 = bestCorrelation;
  const c2 = correlations[bestLag + 1] || bestCorrelation;
  const denominator = 2 * (2 * c1 - c0 - c2);
  const shift = denominator !== 0 ? (c2 - c0) / denominator : 0;
  const refinedLag = bestLag + (Number.isFinite(shift) ? shift : 0);

  return sampleRate / refinedLag;
}

function lagRangeForInstrument(key, sampleRate) {
  const profile = INSTRUMENTS[key];
  if (!profile.strings) {
    // Chromatic mode keeps a wide net: roughly D1 to B6.
    return {
      minLag: Math.floor(sampleRate / 1900),
      maxLag: Math.ceil(sampleRate / 30)
    };
  }
  const freqs = profile.strings.map((s) => s.freq);
  const lowest = Math.min(...freqs) * 0.75;
  const highest = Math.max(...freqs) * 1.4;
  return {
    minLag: Math.floor(sampleRate / highest),
    maxLag: Math.ceil(sampleRate / lowest)
  };
}

/* ==========================================================================
   NOTE MATH
   ========================================================================== */

function freqToChromaticNote(freq) {
  const midiFloat = 69 + 12 * Math.log2(freq / 440);
  const midiRounded = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midiRounded) * 100);
  const noteName = NOTE_NAMES[((midiRounded % 12) + 12) % 12];
  const octave = Math.floor(midiRounded / 12) - 1;
  const targetFreq = 440 * Math.pow(2, (midiRounded - 69) / 12);
  return { label: noteName + octave, cents, targetFreq };
}

function nearestString(freq, profile) {
  let best = null;
  for (const string of profile.strings) {
    const cents = Math.round(1200 * Math.log2(freq / string.freq));
    if (best === null || Math.abs(cents) < Math.abs(best.cents)) {
      best = { note: string.note, freq: string.freq, cents };
    }
  }
  return best;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/* ==========================================================================
   METER GAUGE (built once, then only the needle transform changes)
   ========================================================================== */

function buildGaugeTicks() {
  const centerX = 160;
  const centerY = 178;
  const radius = 130;
  const ticks = [];

  for (let cents = -50; cents <= 50; cents += 10) {
    const angleDeg = -90 + cents * CENTS_TO_DEG;
    const angleRad = (angleDeg * Math.PI) / 180;
    const isMajor = cents % 50 === 0 || cents === 0;
    const innerR = isMajor ? radius - 16 : radius - 10;
    const x1 = centerX + innerR * Math.cos(angleRad);
    const y1 = centerY + innerR * Math.sin(angleRad);
    const x2 = centerX + radius * Math.cos(angleRad);
    const y2 = centerY + radius * Math.sin(angleRad);
    ticks.push(
      `<line class="tick${isMajor ? " tick-major" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`
    );
  }
  elements.tickGroup.innerHTML = ticks.join("");
}

function setNeedleCents(cents) {
  const clamped = Math.max(-50, Math.min(50, cents));
  const angle = clamped * CENTS_TO_DEG;
  // Setting the CSS transform property (not the SVG transform attribute)
  // is what lets the CSS transition above actually animate the change.
  // The pivot itself is handled by the static outer <g translate>, so this
  // rotation is always around the needle's true local origin.
  elements.needleGroup.style.transform = `rotate(${angle}deg)`;
}

/* ==========================================================================
   RENDERING
   ========================================================================== */

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function renderIdle() {
  setNeedleCents(0);
  setText(elements.noteDisplay, "\u2013\u2013");
  elements.freqDisplay.innerHTML = "0.0<small>HZ</small>";
  setStatusChip("idle", "IDLE");
  setText(elements.centsDisplay, "0 CENTS");
  setText(elements.readoutNote, "\u2013\u2013");
  setText(elements.readoutFreq, "0.0 Hz");
  setText(elements.readoutString, "\u2013\u2013");
  setText(elements.readoutTarget, "\u2013\u2013");
  setText(elements.readoutCents, "0 cents");
  elements.signalFill.style.width = "0%";
}

function renderListening(rms) {
  setStatusChip("listening", "LISTENING");
  elements.signalFill.style.width = `${Math.min(100, rms * 320)}%`;
}

function renderWaiting() {
  setNeedleCents(0);
  setText(elements.noteDisplay, "\u2013\u2013");
  elements.freqDisplay.innerHTML = "0.0<small>HZ</small>";
  setText(elements.centsDisplay, "0 CENTS");
  setText(elements.readoutNote, "\u2013\u2013");
  setText(elements.readoutFreq, "0.0 Hz");
  setText(elements.readoutString, "\u2013\u2013");
  setText(elements.readoutTarget, "\u2013\u2013");
  setText(elements.readoutCents, "0 cents");
}

function setStatusChip(stateKey, label) {
  if (state.lastStatusState !== stateKey) {
    elements.statusChip.dataset.state = stateKey;
    elements.statusChip.textContent = label;
    state.lastStatusState = stateKey;
  }
}

function renderResult(result, rms) {
  setNeedleCents(result.cents);

  setText(elements.noteDisplay, result.label);
  elements.freqDisplay.innerHTML = `${result.freq.toFixed(1)}<small>HZ</small>`;

  const absCents = Math.abs(result.cents);
  // Cap what we print at the same +/-50 the needle maxes out at. Beyond
  // that the exact number stops being useful, "very flat" is the message.
  const displayCents = Math.max(-50, Math.min(50, result.cents));
  const signedCents = displayCents > 0 ? `+${displayCents}` : `${displayCents}`;
  setText(elements.centsDisplay, `${signedCents} CENTS`);

  if (absCents <= IN_TUNE_CENTS) {
    setStatusChip("in-tune", "IN TUNE");
  } else if (result.cents < 0) {
    setStatusChip("flat", "FLAT");
  } else {
    setStatusChip("sharp", "SHARP");
  }

  setText(elements.readoutNote, result.label);
  setText(elements.readoutFreq, `${result.freq.toFixed(2)} Hz`);
  setText(elements.readoutString, result.stringNote || result.label);
  setText(elements.readoutTarget, `${result.targetFreq.toFixed(2)} Hz`);
  setText(elements.readoutCents, `${signedCents} cents`);

  elements.signalFill.style.width = `${Math.min(100, rms * 320)}%`;
}

/* ==========================================================================
   AUDIO LOOP
   ========================================================================== */

function analysisStep(timestamp) {
  if (!state.isRunning) return;
  state.rafId = requestAnimationFrame(analysisStep);

  if (timestamp - state.lastAnalysisTime < ANALYSIS_INTERVAL_MS) return;
  state.lastAnalysisTime = timestamp;

  state.analyser.getFloatTimeDomainData(state.timeDomainBuffer);
  const rms = computeRms(state.timeDomainBuffer);

  if (rms < NOISE_GATE_RMS) {
    renderListening(rms);
    if (timestamp - state.lastSoundTime > SILENCE_RESET_MS) {
      if (state.freqHistory.length > 0) renderWaiting();
      state.freqHistory = [];
    }
    return;
  }

  state.lastSoundTime = timestamp;

  const { minLag, maxLag } = lagRangeForInstrument(state.selectedInstrument, state.audioCtx.sampleRate);
  const detected = autoCorrelate(state.timeDomainBuffer, state.audioCtx.sampleRate, minLag, maxLag);

  if (detected === -1 || !Number.isFinite(detected)) {
    renderListening(rms);
    return;
  }

  // Reset the smoothing window on a large jump so switching strings feels
  // immediate instead of dragging the old reading along with it.
  if (state.freqHistory.length > 0) {
    const lastMedian = median(state.freqHistory);
    const jumpCents = Math.abs(1200 * Math.log2(detected / lastMedian));
    if (jumpCents > JUMP_RESET_CENTS) state.freqHistory = [];
  }

  state.freqHistory.push(detected);
  if (state.freqHistory.length > HISTORY_LENGTH) state.freqHistory.shift();
  const stableFreq = median(state.freqHistory);

  const profile = INSTRUMENTS[state.selectedInstrument];
  let result;
  if (!profile.strings) {
    const note = freqToChromaticNote(stableFreq);
    result = { label: note.label, cents: note.cents, targetFreq: note.targetFreq, freq: stableFreq, stringNote: note.label };
  } else {
    const nearest = nearestString(stableFreq, profile);
    result = { label: nearest.note, cents: nearest.cents, targetFreq: nearest.freq, freq: stableFreq, stringNote: nearest.note };
  }

  renderResult(result, rms);
}

async function startTuner() {
  hideError();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError("Browser not supported", "This browser does not expose microphone access. Try a recent version of Chrome, Firefox, Edge or Safari.");
    return;
  }

  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      showError("Microphone blocked", "Microphone access was denied. Open your browser site settings, allow the microphone for this page, then press Start Tuning again.");
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      showError("No microphone found", "No audio input device was detected. Connect a microphone or audio interface and try again.");
    } else {
      showError("Could not start microphone", err.message || "An unknown error stopped microphone access from starting.");
    }
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  state.audioCtx = new AudioContextClass();
  if (state.audioCtx.state === "suspended") {
    await state.audioCtx.resume();
  }

  const source = state.audioCtx.createMediaStreamSource(state.mediaStream);
  state.analyser = state.audioCtx.createAnalyser();
  state.analyser.fftSize = 4096;
  state.analyser.smoothingTimeConstant = 0;
  source.connect(state.analyser);

  state.timeDomainBuffer = new Float32Array(state.analyser.fftSize);
  state.freqHistory = [];
  state.lastAnalysisTime = 0;
  state.lastSoundTime = performance.now();
  state.isRunning = true;

  elements.toggleButton.setAttribute("aria-pressed", "true");
  setText(elements.toggleLabel, "Stop Tuning");
  setText(elements.statusHint, "Listening. Pluck a single string and hold it steady.");

  state.rafId = requestAnimationFrame(analysisStep);
}

function stopTuner() {
  state.isRunning = false;
  if (state.rafId) cancelAnimationFrame(state.rafId);

  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach((track) => track.stop());
    state.mediaStream = null;
  }
  if (state.audioCtx) {
    state.audioCtx.close();
    state.audioCtx = null;
  }

  elements.toggleButton.setAttribute("aria-pressed", "false");
  setText(elements.toggleLabel, "Start Tuning");
  setText(elements.statusHint, "Press start and allow microphone access.");
  renderIdle();
}

function showError(title, message) {
  elements.errorBanner.innerHTML = `<strong>${title}</strong>${message}`;
  elements.errorBanner.hidden = false;
}

function hideError() {
  elements.errorBanner.hidden = true;
}

/* ==========================================================================
   INSTRUMENT SELECTION + GUIDE
   ========================================================================== */

function selectInstrument(key) {
  state.selectedInstrument = key;
  state.freqHistory = [];

  document.querySelectorAll(".instrument-btn").forEach((btn) => {
    const isActive = btn.dataset.instrument === key;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  const profile = INSTRUMENTS[key];
  setText(elements.instrumentTag, profile.label.toUpperCase());

  renderStringChips(profile);
  renderGuide(key);
}

function renderStringChips(profile) {
  if (!profile.strings) {
    elements.stringChips.innerHTML = `<span class="string-chip">C C# D D# E F F# G G# A A# B</span>`;
    return;
  }
  elements.stringChips.innerHTML = profile.strings
    .map((s) => `<span class="string-chip">${s.note} ${s.freq.toFixed(2)}Hz</span>`)
    .join("");
}

function renderGuide(key) {
  const profile = INSTRUMENTS[key];
  setText(elements.guideIntro, `Showing standard tuning for ${profile.label.toLowerCase()}. This table follows whatever instrument is selected above.`);

  if (!profile.strings) {
    elements.guideTableBody.innerHTML = NOTE_NAMES
      .map((name, i) => {
        const freq = 440 * Math.pow(2, (i - 9) / 12);
        return `<tr><td>${i + 1}</td><td>${name}4</td><td>${freq.toFixed(2)} Hz</td></tr>`;
      })
      .join("");
  } else {
    elements.guideTableBody.innerHTML = profile.strings
      .map((s, i) => `<tr><td>String ${i + 1}</td><td>${s.note}</td><td>${s.freq.toFixed(2)} Hz</td></tr>`)
      .join("");
  }
  setText(elements.guideFootnote, profile.note);
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

function setupNav() {
  elements.navToggle.addEventListener("click", () => {
    const isOpen = elements.navMenu.classList.toggle("open");
    elements.navToggle.setAttribute("aria-expanded", String(isOpen));
    elements.navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      elements.navMenu.classList.remove("open");
      elements.navToggle.setAttribute("aria-expanded", "false");
    });
  });

  const sections = document.querySelectorAll("main section[id]");
  const links = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === entry.target.id);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ==========================================================================
   INIT
   ========================================================================== */

function init() {
  buildGaugeTicks();
  renderIdle();
  selectInstrument(state.selectedInstrument);
  setupNav();

  elements.toggleButton.addEventListener("click", () => {
    if (state.isRunning) {
      stopTuner();
    } else {
      startTuner();
    }
  });

  elements.instrumentGrid.addEventListener("click", (event) => {
    const btn = event.target.closest(".instrument-btn");
    if (!btn) return;
    selectInstrument(btn.dataset.instrument);
  });

  elements.yearStamp.textContent = new Date().getFullYear();

  window.addEventListener("beforeunload", () => {
    if (state.isRunning) stopTuner();
  });
}

document.addEventListener("DOMContentLoaded", init);