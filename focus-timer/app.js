/* focus timer -- app.js */

(function () {
  "use strict";

  /* ---- config ---- */
  var MODES = {
    focus: { label: "Focus",       minutes: 25 },
    short: { label: "Short Break", minutes: 5  },
    long:  { label: "Long Break",  minutes: 15 },
  };

  var RING_CIRCUMFERENCE = 716.28; // 2 * Math.PI * 114

  /* ---- state ---- */
  var currentMode     = "focus";
  var totalSeconds    = MODES.focus.minutes * 60;
  var secondsLeft     = totalSeconds;
  var running         = false;
  var sessionIndex    = 0;   // 0-3
  var totalCompleted  = 0;
  var totalFocusMins  = 0;
  var ticker          = null;

  /* ---- elements ---- */
  var timeDisplay   = document.getElementById("time-display");
  var modeLabel     = document.getElementById("mode-label");
  var ringFill      = document.getElementById("ring-fill");
  var btnStart      = document.getElementById("btn-start");
  var btnReset      = document.getElementById("btn-reset");
  var btnSkip       = document.getElementById("btn-skip");
  var sessionCount  = document.getElementById("session-count");
  var dots          = document.querySelectorAll(".dot");
  var statCompleted = document.getElementById("stat-completed");
  var statMinutes   = document.getElementById("stat-minutes");
  var tabs          = document.querySelectorAll(".tab");

  /* ---- helpers ---- */
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return pad(m) + ":" + pad(s);
  }

  function setRing(secondsRemaining, secondsTotal) {
    var ratio  = secondsTotal > 0 ? secondsRemaining / secondsTotal : 1;
    var offset = RING_CIRCUMFERENCE * (1 - ratio);
    ringFill.style.strokeDashoffset = offset;
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(secondsLeft);
    timeDisplay.setAttribute("aria-label", formatTime(secondsLeft) + " remaining");
    setRing(secondsLeft, totalSeconds);
  }

  function setMode(mode) {
    currentMode  = mode;
    totalSeconds = MODES[mode].minutes * 60;
    secondsLeft  = totalSeconds;
    running      = false;
    clearInterval(ticker);
    btnStart.textContent = "Start";

    modeLabel.textContent = MODES[mode].label;

    if (mode === "focus") {
      ringFill.classList.remove("break-mode");
    } else {
      ringFill.classList.add("break-mode");
    }

    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.mode === mode);
    });

    updateDisplay();
  }

  function updateDots() {
    dots.forEach(function (dot, i) {
      dot.classList.remove("active", "done");
      if (i < sessionIndex) {
        dot.classList.add("done");
      } else if (i === sessionIndex) {
        dot.classList.add("active");
      }
    });
  }

  function updateStats() {
    statCompleted.textContent = totalCompleted;
    statMinutes.textContent   = totalFocusMins;
    sessionCount.textContent  = sessionIndex + 1;
  }

  function onSessionEnd() {
    running = false;
    clearInterval(ticker);
    btnStart.textContent = "Start";

    if (currentMode === "focus") {
      totalCompleted++;
      totalFocusMins += MODES.focus.minutes;

      var nextIndex = (sessionIndex + 1) % 4;

      if (nextIndex === 0) {
        /* completed a full cycle of 4 */
        sessionIndex = 0;
        updateDots();
        updateStats();
        setMode("long");
      } else {
        sessionIndex = nextIndex;
        updateDots();
        updateStats();
        setMode("short");
      }
    } else {
      updateStats();
      setMode("focus");
    }
  }

  function tick() {
    if (secondsLeft <= 0) {
      secondsLeft = 0;
      updateDisplay();
      onSessionEnd();
      return;
    }
    secondsLeft--;
    updateDisplay();
  }

  /* ---- event handlers ---- */
  btnStart.addEventListener("click", function () {
    if (running) {
      running = false;
      clearInterval(ticker);
      btnStart.textContent = "Resume";
    } else {
      running = true;
      ticker  = setInterval(tick, 1000);
      btnStart.textContent = "Pause";
    }
  });

  btnReset.addEventListener("click", function () {
    running = false;
    clearInterval(ticker);
    btnStart.textContent = "Start";
    secondsLeft  = totalSeconds;
    updateDisplay();
  });

  btnSkip.addEventListener("click", function () {
    running = false;
    clearInterval(ticker);
    onSessionEnd();
  });

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      if (tab.dataset.mode !== currentMode) {
        setMode(tab.dataset.mode);
      }
    });
  });

  /* keyboard shortcut: space to start/pause */
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && e.target.tagName !== "BUTTON") {
      e.preventDefault();
      btnStart.click();
    }
  });

  /* ---- init ---- */
  updateDots();
  updateStats();
  setRing(totalSeconds, totalSeconds);

})();
