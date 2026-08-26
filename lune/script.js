/*
  Lune - lunar phase tracker
  ─────────────────────────
  Phases are derived from a reference new moon: January 6, 2000 at 18:14 UTC.
  Elapsed time modulo the mean synodic period gives the current age.
  Everything runs client-side. Zero network requests after page load.
*/

'use strict';

// ── astronomical constants ─────────────────────────────────────────────────

const REF_NEW_MOON = new Date('2000-01-06T18:14:00.000Z');
const SYNODIC      = 29.530588853;   // mean synodic period, days
const MS_PER_DAY   = 86400000;

// ── moon math ──────────────────────────────────────────────────────────────

function moonFor(date) {
  const elapsed = date - REF_NEW_MOON;
  const age     = ((elapsed / MS_PER_DAY) % SYNODIC + SYNODIC) % SYNODIC;
  const phase   = age / SYNODIC;
  const illum   = (1 - Math.cos(phase * Math.PI * 2)) / 2;

  let name;
  if      (age < 1.85 || age >= 27.68)  name = 'New Moon';
  else if (age < 7.38)                   name = 'Waxing Crescent';
  else if (age < 9.22)                   name = 'First Quarter';
  else if (age < 14.77)                  name = 'Waxing Gibbous';
  else if (age < 16.61)                  name = 'Full Moon';
  else if (age < 22.15)                  name = 'Waning Gibbous';
  else if (age < 23.99)                  name = 'Last Quarter';
  else                                   name = 'Waning Crescent';

  return { age, phase, illum, name };
}

// days until the next occurrence of targetPhase (0 = new, 0.5 = full)
function daysTo(currentPhase, targetPhase) {
  let delta = targetPhase - currentPhase;
  if (delta <= 0) delta += 1;   // already past this phase, look ahead one cycle
  return delta * SYNODIC;
}

// ── moon canvas drawing ────────────────────────────────────────────────────

/*
  The lit portion is built from two shapes inside a circular clip:
    1. A rectangle filling the bright half (right for waxing, left for waning).
    2. A terminator ellipse whose x-radius is r * cos(t * PI), where t goes
       0 -> 1 within each half-cycle.
         t = 0 (new or full)  ->  x-radius = r    (ellipse same width as moon)
         t = 0.5 (quarter)    ->  x-radius = 0    (straight terminator, skip ellipse)
         t = 1 (full or new)  ->  x-radius = -r   (ellipse flips side)
  When the ellipse is on the same side as the lit half, it is drawn in shadow
  colour to carve a crescent. When it crosses to the dark side, it is drawn in
  moon colour to expand into a gibbous shape.
*/

function drawMoon(canvas, phase, breathe) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const cx  = W / 2;
  const cy  = W / 2;
  const r   = W * 0.36;

  ctx.clearRect(0, 0, W, W);

  // ── pulsing halo (outside the disc clip) ────────────────────────────────

  const glowAlpha  = 0.12 + Math.sin(breathe) * 0.04;
  const glowRadius = r * (2.1 + Math.sin(breathe * 0.65) * 0.08);

  const halo = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, glowRadius);
  halo.addColorStop(0,    'rgba(228, 241, 175, ' + (glowAlpha + 0.10) + ')');
  halo.addColorStop(0.45, 'rgba(93,  185, 150, ' + (glowAlpha * 0.35) + ')');
  halo.addColorStop(1,    'rgba(93,  185, 150, 0)');

  ctx.beginPath();
  ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // extra bloom on full moon
  if (phase > 0.44 && phase < 0.56) {
    const intensity  = 1 - Math.abs(phase - 0.5) * 10;
    const bloomAlpha = Math.max(0, intensity * 0.18);
    const bloom = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 3.0);
    bloom.addColorStop(0, 'rgba(228, 241, 175, ' + bloomAlpha + ')');
    bloom.addColorStop(1, 'rgba(228, 241, 175, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 3.0, 0, Math.PI * 2);
    ctx.fillStyle = bloom;
    ctx.fill();
  }

  // ── everything below is clipped to the disc ──────────────────────────────

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // dark fill for the shadow side
  ctx.fillStyle = '#111710';
  ctx.fillRect(0, 0, W, W);

  // moon surface -- off-centre inner point gives a faint 3-D feel
  const surf = ctx.createRadialGradient(
    cx - r * 0.12, cy - r * 0.18, r * 0.04,
    cx, cy, r * 1.05
  );
  surf.addColorStop(0,    '#f5f1e6');
  surf.addColorStop(0.52, '#eae4d0');
  surf.addColorStop(1,    '#bab498');

  if (phase >= 0.012 && phase <= 0.988) {

    const wax = phase <= 0.5;
    const t   = wax ? phase * 2 : (phase - 0.5) * 2;   // 0 -> 1 per half-cycle
    const tx  = r * Math.cos(t * Math.PI);               // r at start, -r at end

    // step 1: fill the lit half
    ctx.fillStyle = surf;
    if (wax) {
      ctx.fillRect(cx, 0, r + 4, W);       // right half lit when waxing
    } else {
      ctx.fillRect(0, 0, cx + 2, W);       // left half lit when waning
    }

    // step 2: terminator ellipse
    // tx > 0 on the lit side  -> shadow ellipse (carves a crescent)
    // tx < 0 on the dark side -> moon ellipse  (expands to gibbous)
    if (Math.abs(tx) > 0.9) {
      const castShadow = (wax && tx > 0) || (!wax && tx < 0);
      ctx.fillStyle = castShadow ? '#111710' : surf;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(tx), r + 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── faint crater marks ────────────────────────────────────────────────────
  // drawn as semi-transparent darkening so they read on the lit side but
  // disappear into the shadow side naturally
  if (phase > 0.08 && phase < 0.92) {
    const craters = [
      [ 0.22, -0.28, 0.068],
      [-0.28,  0.19, 0.054],
      [ 0.07,  0.31, 0.044],
      [-0.13, -0.14, 0.038],
    ];
    craters.forEach(([ox, oy, s]) => {
      ctx.beginPath();
      ctx.arc(cx + ox * r, cy + oy * r, s * r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();
    });
  }

  ctx.restore();

  // very faint rim to separate the disc from the glow
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(228, 241, 175, 0.07)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();
}

// stripped-down version for the 22x22 calendar icons
function drawMini(canvas, phase) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const cx  = W / 2;
  const cy  = W / 2;
  const r   = W * 0.40;
  const LIT = '#eae6d6';

  ctx.clearRect(0, 0, W, W);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = '#111710';
  ctx.fillRect(0, 0, W, W);

  if (phase >= 0.012 && phase <= 0.988) {
    const wax = phase <= 0.5;
    const t   = wax ? phase * 2 : (phase - 0.5) * 2;
    const tx  = r * Math.cos(t * Math.PI);

    ctx.fillStyle = LIT;
    if (wax) {
      ctx.fillRect(cx, 0, r + 2, W);
    } else {
      ctx.fillRect(0, 0, cx + 1, W);
    }

    if (Math.abs(tx) > 0.5) {
      const castShadow = (wax && tx > 0) || (!wax && tx < 0);
      ctx.fillStyle    = castShadow ? '#111710' : LIT;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.abs(tx), r + 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ── neon background animation ─────────────────────────────────────────────

const bgEl  = document.getElementById('bg');
const bgCtx = bgEl.getContext('2d');
let   bW = 0, bH = 0;

function resizeBg() {
  bW = bgEl.width  = window.innerWidth;
  bH = bgEl.height = window.innerHeight;
}

window.addEventListener('resize', resizeBg);
resizeBg();

// ── firefly particles (the main neon glow) ─────────────────────────────────

const FIREFLY_COUNT = 64;
const flies         = [];

for (let i = 0; i < FIREFLY_COUNT; i++) {
  flies.push({
    bx  : Math.random() * window.innerWidth,   // base x (drifts slowly)
    by  : Math.random() * window.innerHeight,  // base y
    x   : 0,
    y   : 0,
    r   : Math.random() * 1.5 + 0.45,
    vx  : (Math.random() - 0.5) * 0.22,
    vy  : (Math.random() - 0.5) * 0.20,
    wx  : Math.random() * 100,    // wobble phase x
    wy  : Math.random() * 100,    // wobble phase y
    wsx : (Math.random() - 0.5) * 0.013,
    wsy : (Math.random() - 0.5) * 0.010,
    a   : Math.random() * 0.40 + 0.08,
    dA  : (Math.random() * 0.004 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
    col : Math.random() > 0.5 ? '#5DB996' : '#E4F1AF',
  });
}

// ── large translucent orbs for atmospheric depth ───────────────────────────

const orbs = [];

for (let i = 0; i < 5; i++) {
  orbs.push({
    x  : Math.random() * window.innerWidth,
    y  : Math.random() * window.innerHeight,
    r  : Math.random() * 100 + 55,
    vx : (Math.random() - 0.5) * 0.10,
    vy : (Math.random() - 0.5) * 0.10,
    c  : Math.random() > 0.5 ? '93, 185, 150' : '228, 241, 175',
    a  : Math.random() * 0.022 + 0.007,
  });
}

// ── expanding neon ring pulses ─────────────────────────────────────────────

const pulses = [];

function spawnPulse() {
  pulses.push({
    x   : Math.random() * bW,
    y   : Math.random() * bH,
    r   : 0,
    max : Math.random() * 80 + 40,
    spd : Math.random() * 1.2 + 0.5,
    col : Math.random() > 0.5 ? '#5DB996' : '#E4F1AF',
  });
}

function tickBg() {
  bgCtx.clearRect(0, 0, bW, bH);

  // soft orbs
  orbs.forEach(o => {
    o.x += o.vx;
    o.y += o.vy;
    if (o.x + o.r < 0)  o.x = bW + o.r;
    if (o.x - o.r > bW) o.x = -o.r;
    if (o.y + o.r < 0)  o.y = bH + o.r;
    if (o.y - o.r > bH) o.y = -o.r;

    const g = bgCtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    g.addColorStop(0, 'rgba(' + o.c + ', ' + (o.a * 3) + ')');
    g.addColorStop(1, 'rgba(' + o.c + ', 0)');
    bgCtx.beginPath();
    bgCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    bgCtx.fillStyle = g;
    bgCtx.fill();
  });

  // ring pulses -- spawn randomly
  if (Math.random() < 0.004) spawnPulse();

  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.r += p.spd;
    const alpha = (1 - p.r / p.max) * 0.28;
    if (alpha <= 0) {
      pulses.splice(i, 1);
      continue;
    }
    bgCtx.save();
    bgCtx.globalAlpha = alpha;
    bgCtx.shadowColor = p.col;
    bgCtx.shadowBlur  = 8;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.strokeStyle = p.col;
    bgCtx.lineWidth   = 1.2;
    bgCtx.stroke();
    bgCtx.restore();
  }

  // fireflies
  flies.forEach(f => {
    f.wx  += f.wsx;
    f.wy  += f.wsy;
    f.bx  += f.vx;
    f.by  += f.vy;
    f.x    = f.bx + Math.sin(f.wx) * 28;
    f.y    = f.by + Math.cos(f.wy) * 20;

    // wrap base position around canvas edges
    if (f.bx < -30)      f.bx = bW + 30;
    if (f.bx > bW + 30)  f.bx = -30;
    if (f.by < -30)      f.by = bH + 30;
    if (f.by > bH + 30)  f.by = -30;

    // twinkle
    f.a += f.dA;
    if (f.a > 0.60)  { f.a = 0.60;  f.dA *= -1; }
    if (f.a < 0.06)  { f.a = 0.06;  f.dA *= -1; }

    bgCtx.save();
    bgCtx.globalAlpha = f.a;
    bgCtx.shadowColor = f.col;
    bgCtx.shadowBlur  = 12;
    bgCtx.beginPath();
    bgCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    bgCtx.fillStyle = f.col;
    bgCtx.fill();
    bgCtx.restore();
  });

  requestAnimationFrame(tickBg);
}

tickBg();

// ── monthly calendar ───────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March',     'April',
  'May',     'June',     'July',      'August',
  'September','October', 'November',  'December',
];

function buildCalendar(year, month) {
  const today = new Date();
  const grid  = document.getElementById('calGrid');

  document.getElementById('calMonth').textContent =
    MONTH_NAMES[month].toUpperCase() + '  ' + year;

  grid.innerHTML = '';

  const firstDow = new Date(year, month, 1).getDay();
  const lastDay  = new Date(year, month + 1, 0).getDate();

  // offset empty cells so day 1 lands on the right column
  for (let i = 0; i < firstDow; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= lastDay; d++) {
    const date           = new Date(year, month, d);
    const { phase, name } = moonFor(date);

    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.title     = name;   // native tooltip shows phase name on hover

    const isToday = (
      d     === today.getDate()     &&
      month === today.getMonth()    &&
      year  === today.getFullYear()
    );
    if (isToday) cell.classList.add('today');

    const num      = document.createElement('div');
    num.className  = 'day-num';
    num.textContent = d;

    const mc        = document.createElement('canvas');
    mc.width        = 22;
    mc.height       = 22;
    mc.style.display = 'block';

    cell.appendChild(num);
    cell.appendChild(mc);
    grid.appendChild(cell);

    drawMini(mc, phase);
  }
}

// ── contextual tidbits ─────────────────────────────────────────────────────

const TIDBITS = {
  'New Moon':        'Tides are at their highest as the sun, earth and moon align.',
  'Waxing Crescent': 'The dark limb glows faintly from sunlight reflected off our oceans.',
  'First Quarter':   'The terminator line marks the exact boundary between lunar day and night.',
  'Waxing Gibbous':  'Gibbous comes from the Latin word for hump.',
  'Full Moon':       'The moon rises at sunset and sets at sunrise tonight.',
  'Waning Gibbous':  'The same hemisphere of the moon has faced us for billions of years.',
  'Last Quarter':    'The moon rises close to midnight in this phase.',
  'Waning Crescent': 'Best seen in the eastern sky just before dawn.',
};

// ── lunar facts (revealed on moon click) ──────────────────────────────────

const FACTS = [
  'The moon drifts about 3.8 cm further from Earth every year.',
  'Moonlight takes about 1.3 seconds to reach your eyes.',
  'The moon is the fifth-largest natural satellite in the solar system.',
  'A full moon at perigee appears roughly 14% larger than at apogee.',
  'The distance to the moon fits almost exactly 108 lunar diameters.',
  'Moonquakes can reach 5.5 on the Richter scale and last for hours.',
  'No atmosphere means the sky above the moon is always black, even in daylight.',
  'The moon rotates once per orbit, so one face always points toward Earth.',
  'All six Apollo landing sites are on the near side, within view from Earth.',
  'The moon formed around 4.5 billion years ago from debris after an impact with Earth.',
];

// ── toast notification ─────────────────────────────────────────────────────

let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3600);
}

// ── main moon canvas setup ─────────────────────────────────────────────────

const moonCanvas = document.getElementById('moon');

// fit the moon to the screen without going above 280
const moonSize = Math.min(280, window.innerWidth - 56);
moonCanvas.width  = moonSize;
moonCanvas.height = moonSize;
moonCanvas.style.width  = moonSize + 'px';
moonCanvas.style.height = moonSize + 'px';
moonCanvas.parentElement.style.width  = moonSize + 'px';
moonCanvas.parentElement.style.height = moonSize + 'px';

let livePhase = 0;
let breath    = 0;

function animateMoon() {
  breath += 0.018;
  drawMoon(moonCanvas, livePhase, breath);
  requestAnimationFrame(animateMoon);
}

// ── DOM refresh ────────────────────────────────────────────────────────────

function refreshData() {
  const now  = new Date();
  const data = moonFor(now);
  livePhase  = data.phase;

  // split the phase name: first word in sans-serif, last word in italic serif
  const words = data.name.split(' ');
  document.getElementById('phaseWord1').textContent =
    words.length > 1 ? words[0] + '\u00A0' : '';
  document.getElementById('phaseWord2').textContent =
    words[words.length - 1];

  document.getElementById('illumPct').textContent =
    Math.round(data.illum * 100);

  document.getElementById('moonAge').textContent =
    data.age.toFixed(1);

  document.getElementById('toFull').textContent =
    Math.ceil(daysTo(data.phase, 0.5));

  document.getElementById('toNew').textContent =
    Math.ceil(daysTo(data.phase, 0));

  document.getElementById('tidbit').textContent =
    TIDBITS[data.name] || '';

  buildCalendar(now.getFullYear(), now.getMonth());
}

// ── click the moon for a random fact ──────────────────────────────────────

moonCanvas.addEventListener('click', () => {
  const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
  showToast(fact);
});

// ── boot ───────────────────────────────────────────────────────────────────

refreshData();
animateMoon();

// recalculate every minute in case the page stays open across a phase change
setInterval(refreshData, 60000);
