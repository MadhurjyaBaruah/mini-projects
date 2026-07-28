// Epoch - life in weeks
// draws your lifespan as a grid of small squares on a canvas.
// each row = 1 year, each column = 1 week (52 per year).
// no frameworks, no build step. runs entirely in the browser.

(function () {
  'use strict';

  // --- DOM refs ---
  const birthdateEl     = document.getElementById('birthdate');
  const lifespanEl      = document.getElementById('lifespan');
  const lifespanDisplay = document.getElementById('lifespan-display');
  const statsRow        = document.getElementById('stats-row');
  const gridSection     = document.getElementById('grid-section');
  const canvas          = document.getElementById('grid');
  const tooltip         = document.getElementById('tooltip');
  const currentWeekLabel = document.getElementById('current-week-label');

  const ctx = canvas.getContext('2d');

  // --- colors, pulled from the CSS palette ---
  const C = {
    lived:       '#108B4F',
    livedShade:  '#0c6e3d',   // subtle edge on lived squares
    now:         '#5DB996',
    future:      '#E4F1AF',
    futureLine:  'rgba(93,185,150,0.22)',
    decadeLine:  'rgba(16,139,79,0.1)',
    yearText:    '#7a9e8b',
    ringNow:     '#5DB996',
  };

  const WEEKS_PER_YEAR = 52;

  // grid drawing state (stored so hover can reference it)
  let state = {
    total:   0,
    lived:   0,
    birth:   null,
    cols:    WEEKS_PER_YEAR,
    rows:    0,
    sq:      0,
    gap:     0,
    cell:    0,
    labelW:  0,
    padTop:  0,
  };

  // --- init ---

  // block future dates
  birthdateEl.max = new Date().toISOString().split('T')[0];

  // wire up events
  birthdateEl.addEventListener('change', onUpdate);
  lifespanEl.addEventListener('input', onLifespanChange);

  canvas.addEventListener('mousemove', onGridHover);
  canvas.addEventListener('mouseleave', hideTooltip);
  canvas.addEventListener('touchstart', hideTooltip, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (birthdateEl.value) onUpdate();
    }, 140);
  });

  // --- handlers ---

  function onLifespanChange() {
    const val = parseInt(lifespanEl.value, 10);
    lifespanDisplay.textContent = val + ' years';
    if (birthdateEl.value) onUpdate();
  }

  function onUpdate() {
    const raw = birthdateEl.value;
    if (!raw) return;

    // date inputs give YYYY-MM-DD; parse as local date to avoid UTC offset issues
    const parts = raw.split('-');
    const birth = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );

    const now = new Date();
    if (birth >= now) return; // must be in the past

    const lifespan  = parseInt(lifespanEl.value, 10);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = lifespan * WEEKS_PER_YEAR;
    const weeksLived = Math.floor((now - birth) / msPerWeek);
    const weeksLeft  = Math.max(0, totalWeeks - weeksLived - 1);
    const pct        = Math.min(100, (weeksLived / totalWeeks) * 100);

    // update stat cards with a count-up
    animateCount(document.getElementById('w-lived'), weeksLived, '');
    animateCount(document.getElementById('w-left'),  weeksLeft,  '');
    animatePct(document.getElementById('w-pct'), pct);

    // current week info for the header label
    const currentWeekNum = weeksLived + 1;
    currentWeekLabel.textContent = 'week ' + currentWeekNum.toLocaleString() + ' of your life';

    // show sections
    statsRow.classList.add('visible');
    gridSection.classList.add('visible');

    // draw
    drawGrid(birth, totalWeeks, weeksLived);
  }

  // --- grid drawing ---

  function drawGrid(birth, total, lived) {
    const COLS = WEEKS_PER_YEAR;
    const ROWS = Math.ceil(total / COLS);

    // measure available width inside the canvas-wrap padding
    const wrapWidth = canvas.parentElement.clientWidth - 32; // 2x 1rem padding

    // year labels on the left
    const labelW = 26;
    const padTop = 4;

    // fit as many columns as possible without going fractional
    const available = wrapWidth - labelW;
    const sq  = Math.max(4, Math.floor(available / COLS));
    const gap = Math.max(1, Math.round(sq * 0.22));
    const cell = sq + gap;

    const canvasW = labelW + COLS * cell - gap;
    const canvasH = padTop + ROWS * cell - gap;

    canvas.width  = canvasW;
    canvas.height = canvasH;

    // store in state so hover can reference
    state = { total, lived, birth, cols: COLS, rows: ROWS, sq, gap, cell, labelW, padTop };

    ctx.clearRect(0, 0, canvasW, canvasH);

    for (let row = 0; row < ROWS; row++) {
      const y = padTop + row * cell;
      const year = row + 1;

      // year label
      if (year === 1 || year % 10 === 0) {
        ctx.fillStyle = C.yearText;
        ctx.font = Math.max(7, sq - 1) + 'px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(year, labelW - 5, y + sq / 2);
      }

      // thin line before each decade (except the very first row)
      if (year > 1 && year % 10 === 1) {
        ctx.strokeStyle = C.decadeLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(labelW, y - gap / 2 - 0.5);
        ctx.lineTo(canvasW, y - gap / 2 - 0.5);
        ctx.stroke();
      }

      // draw each week square in this row
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        if (i >= total) break;

        const x = labelW + col * cell;

        if (i < lived) {
          // lived week
          ctx.fillStyle = C.lived;
          roundRect(x, y, sq, sq, Math.max(1, sq * 0.2));
          ctx.fill();
        } else if (i === lived) {
          // current week - teal fill + glow ring drawn after
          ctx.fillStyle = C.now;
          roundRect(x, y, sq, sq, Math.max(1, sq * 0.2));
          ctx.fill();
        } else {
          // future week
          ctx.fillStyle = C.future;
          roundRect(x, y, sq, sq, Math.max(1, sq * 0.2));
          ctx.fill();
        }
      }
    }

    // draw ring around current week last (so it sits on top)
    const curRow = Math.floor(lived / COLS);
    const curCol = lived % COLS;
    const ringX  = labelW + curCol * cell;
    const ringY  = padTop + curRow * cell;
    const r      = Math.max(1, sq * 0.2);

    ctx.strokeStyle = C.ringNow;
    ctx.lineWidth = 1.5;
    roundRect(ringX - 1.5, ringY - 1.5, sq + 3, sq + 3, r + 1.5);
    ctx.stroke();
  }

  // draws a rounded rectangle path (does not fill/stroke - caller does that)
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h,     x, y + h - r,     r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y,         x + r, y,         r);
    ctx.closePath();
  }

  // --- hover / tooltip ---

  function onGridHover(e) {
    if (!state.total) return;

    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    const col = Math.floor((mx - state.labelW) / state.cell);
    const row = Math.floor((my - state.padTop) / state.cell);

    if (col < 0 || col >= state.cols || row < 0 || row >= state.rows) {
      hideTooltip();
      return;
    }

    const weekIndex = row * state.cols + col;
    if (weekIndex >= state.total) {
      hideTooltip();
      return;
    }

    // figure out the calendar date this week began
    const msPerWeek  = 7 * 24 * 60 * 60 * 1000;
    const weekStart  = new Date(state.birth.getTime() + weekIndex * msPerWeek);
    const dateStr    = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });

    const weekNum = weekIndex + 1;
    const status  = weekIndex < state.lived
      ? 'lived'
      : weekIndex === state.lived
        ? 'now'
        : 'ahead';

    tooltip.textContent = 'week ' + weekNum + '  ' + dateStr + '  [' + status + ']';
    tooltip.style.display = 'block';
    tooltip.setAttribute('aria-hidden', 'false');

    // position: follow cursor, flip if near right edge
    const tW = tooltip.offsetWidth;
    const tH = tooltip.offsetHeight;
    let tx = e.clientX + 14;
    let ty = e.clientY - tH - 8;

    if (tx + tW > window.innerWidth - 10) tx = e.clientX - tW - 10;
    if (ty < 6) ty = e.clientY + 14;

    tooltip.style.left = tx + 'px';
    tooltip.style.top  = ty + 'px';
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
    tooltip.setAttribute('aria-hidden', 'true');
  }

  // --- animations for the stat numbers ---

  function animateCount(el, target, suffix) {
    const duration  = 700;
    const startTime = performance.now();
    const start     = 0;

    function tick(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  function animatePct(el, target) {
    const duration  = 700;
    const startTime = performance.now();

    function tick(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = (eased * target).toFixed(1);
      el.textContent = current + '%';
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toFixed(1) + '%';
      }
    }

    requestAnimationFrame(tick);
  }

})();
