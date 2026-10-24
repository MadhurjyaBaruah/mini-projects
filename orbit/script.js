/* Orbit: the app.
   Wires the canvas, the controls and the physics together. */

(function () {
  'use strict';

  const { World, predict, radiusFor, massFromSlider } = window.Physics;
  const presets = window.OrbitPresets;
  const $ = id => document.getElementById(id);

  const PALETTE = ['#E4F1AF', '#5DB996', '#108B4F', '#FAF6EA'];
  const BASE_DT = 0.5;          // simulated time units per frame at 1x
  const LAUNCH_SCALE = 0.05;    // launch speed per world unit of drag
  const MIN_ZOOM = 0.12;
  const MAX_ZOOM = 4;
  const MAX_UNDO = 30;
  const STORE_KEY = 'orbit.settings.v1';

  const canvas = $('stage');
  const wrap = $('stageWrap');
  const view = window.OrbitRender.create(canvas);
  const world = new World();
  const cam = { x: 0, y: 0, zoom: 1 };

  const opts = { trails: true, vectors: false, grid: true, follow: false };
  const state = {
    paused: false,
    color: 'mix',
    colorIdx: 0,
    preset: null,
    clock: 0,
    speed: 1,
    trailLen: 160
  };
  const undoStack = [];
  let effects = [];
  let drag = null;
  const pointers = new Map();

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ---------- saved settings ---------- */

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function writeStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        opts: Object.assign({}, opts, { merge: world.merge }),
        gravity: world.G,
        speed: state.speed,
        trailLen: state.trailLen,
        mass: Number($('mass').value),
        color: state.color
      }));
    } catch (err) {
      /* storage can be blocked, the app works fine without it */
    }
  }

  /* ---------- coordinates ---------- */

  function toWorld(px, py) {
    const s = view.size();
    return {
      x: (px - s.w / 2) / cam.zoom + cam.x,
      y: (py - s.h / 2) / cam.zoom + cam.y
    };
  }

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function zoomAt(factor, px, py) {
    const before = toWorld(px, py);
    cam.zoom = clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const s = view.size();
    cam.x = before.x - (px - s.w / 2) / cam.zoom;
    cam.y = before.y - (py - s.h / 2) / cam.zoom;
  }

  function fitView() {
    const s = view.size();
    const list = world.bodies;
    if (!list.length) {
      cam.x = 0;
      cam.y = 0;
      cam.zoom = 1;
      return;
    }
    let M = 0, cx = 0, cy = 0;
    for (const b of list) {
      M += b.m;
      cx += b.x * b.m;
      cy += b.y * b.m;
    }
    cx /= M;
    cy /= M;
    // ignore the farthest few percent so one runaway body does not shrink everything
    const reach = list.map(b => Math.hypot(b.x - cx, b.y - cy) + b.r).sort((a, b) => a - b);
    const extent = reach[Math.min(reach.length - 1, Math.floor(reach.length * 0.92))] + 30;
    cam.x = cx;
    cam.y = cy;
    cam.zoom = clamp((Math.min(s.w, s.h) * 0.46) / extent, MIN_ZOOM, 2.5);
  }

  /* ---------- the next body ---------- */

  const currentMass = () => massFromSlider(Number($('mass').value));
  const currentColor = () => state.color === 'mix' ? PALETTE[state.colorIdx % PALETTE.length] : state.color;

  function formatMass(m) {
    return m >= 1000 ? (m / 1000).toFixed(1) + 'k' : String(Math.round(m));
  }

  function updateMassUI() {
    const m = currentMass();
    const rMin = radiusFor(0.4);
    const rMax = radiusFor(4000);
    const dia = 6 + ((radiusFor(m) - rMin) / (rMax - rMin)) * 36;
    const dot = $('massDot');
    const color = currentColor();
    $('massOut').textContent = formatMass(m);
    dot.style.width = dot.style.height = dia.toFixed(1) + 'px';
    dot.style.background = color;
    dot.style.boxShadow = '0 0 10px 2px ' + color;
  }

  /* ---------- scenes and undo ---------- */

  function syncUndoButton() {
    $('btnUndo').disabled = undoStack.length === 0;
  }

  function pushUndo() {
    undoStack.push(world.snapshot());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    syncUndoButton();
  }

  function undo() {
    const snap = undoStack.pop();
    if (!snap) return;
    world.restore(snap);
    syncUndoButton();
  }

  function markPreset(id) {
    state.preset = id;
    document.querySelectorAll('.preset').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.id === id));
    });
  }

  function loadPreset(id) {
    const p = presets.find(x => x.id === id);
    if (!p) return;
    pushUndo();
    world.clear();
    p.build(world.G).forEach(spec => world.add(spec));
    world.zeroMomentum();
    effects = [];
    fitView();
    markPreset(id);
  }

  function clearAll() {
    if (!world.bodies.length) return;
    pushUndo();
    world.clear();
    effects = [];
    markPreset(null);
  }

  /* ---------- launching ---------- */

  function aimVelocity(a) {
    return { vx: (a.x1 - a.x0) * LAUNCH_SCALE, vy: (a.y1 - a.y0) * LAUNCH_SCALE };
  }

  function launch(a) {
    pushUndo();
    const v = a.moved ? aimVelocity(a) : { vx: 0, vy: 0 };
    world.add({ x: a.x0, y: a.y0, vx: v.vx, vy: v.vy, m: a.m, color: a.color });
    effects.push({ x: a.x0, y: a.y0, color: a.color, age: 0, span: 0.7, reach: 32 });
    if (state.color === 'mix') state.colorIdx++;
    updateMassUI();
  }

  /* ---------- pointer input ---------- */

  function startPinch() {
    const pts = Array.from(pointers.values());
    const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    drag = {
      mode: 'pinch',
      dist0: Math.max(10, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)),
      zoom0: cam.zoom,
      anchor: toWorld(mid.x, mid.y)
    };
  }

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    const p = pointerPos(e);
    pointers.set(e.pointerId, p);

    if (pointers.size === 2) { startPinch(); return; }
    if (pointers.size > 2) return;

    const wantsPan = e.button === 1 || e.button === 2 || e.shiftKey;
    if (wantsPan) {
      drag = { mode: 'pan', last: p };
      canvas.classList.add('panning');
    } else if (e.button === 0) {
      const w = toWorld(p.x, p.y);
      drag = {
        mode: 'aim',
        sx: p.x, sy: p.y,
        x0: w.x, y0: w.y, x1: w.x, y1: w.y,
        m: currentMass(),
        r: radiusFor(currentMass()),
        color: currentColor(),
        moved: false,
        path: null
      };
    }
  });

  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const p = pointerPos(e);
    pointers.set(e.pointerId, p);
    if (!drag) return;

    if (drag.mode === 'pinch' && pointers.size >= 2) {
      const pts = Array.from(pointers.values());
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      cam.zoom = clamp(drag.zoom0 * (dist / drag.dist0), MIN_ZOOM, MAX_ZOOM);
      const s = view.size();
      cam.x = drag.anchor.x - (mid.x - s.w / 2) / cam.zoom;
      cam.y = drag.anchor.y - (mid.y - s.h / 2) / cam.zoom;
      stopFollowing();
    } else if (drag.mode === 'pan') {
      cam.x -= (p.x - drag.last.x) / cam.zoom;
      cam.y -= (p.y - drag.last.y) / cam.zoom;
      drag.last = p;
      stopFollowing();
    } else if (drag.mode === 'aim') {
      const w = toWorld(p.x, p.y);
      drag.x1 = w.x;
      drag.y1 = w.y;
      if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    const finished = drag;
    if (finished && finished.mode === 'aim' && e.type === 'pointerup') launch(finished);
    if (finished && finished.mode === 'pinch' && pointers.size >= 1) {
      drag = { mode: 'idle' };      // the finger left behind should not start a launch
      return;
    }
    drag = null;
    canvas.classList.remove('panning');
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const p = pointerPos(e);
    const unit = e.deltaMode === 1 ? 16 : 1;
    zoomAt(Math.exp(-e.deltaY * unit * 0.0012), p.x, p.y);
  }, { passive: false });

  function stopFollowing() {
    if (!opts.follow) return;
    opts.follow = false;
    $('optFollow').checked = false;
    writeStore();
  }

  /* ---------- controls ---------- */

  function buildPresetButtons() {
    const host = $('presets');
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset';
      btn.dataset.id = p.id;
      btn.setAttribute('aria-pressed', 'false');
      const name = document.createElement('span');
      name.className = 'preset-name';
      name.textContent = p.name;
      const note = document.createElement('span');
      note.className = 'preset-note';
      note.textContent = p.note;
      btn.append(name, note);
      btn.addEventListener('click', () => loadPreset(p.id));
      host.appendChild(btn);
    });
  }

  function setPaused(value) {
    state.paused = value;
    $('btnPause').textContent = value ? 'Resume' : 'Pause';
    $('stateChip').hidden = !value;
  }

  function selectColor(value) {
    state.color = value;
    document.querySelectorAll('.swatch').forEach(s => {
      s.setAttribute('aria-pressed', String(s.dataset.color === value));
    });
    updateMassUI();
  }

  function wireControls() {
    $('mass').addEventListener('input', () => { updateMassUI(); writeStore(); });

    $('gravity').addEventListener('input', e => {
      world.G = Number(e.target.value);
      $('gravityOut').textContent = world.G.toFixed(1) + 'x';
      writeStore();
    });

    $('speed').addEventListener('input', e => {
      state.speed = Number(e.target.value);
      $('speedOut').textContent = state.speed.toFixed(1) + 'x';
      writeStore();
    });

    $('trailLen').addEventListener('input', e => {
      state.trailLen = Number(e.target.value);
      $('trailOut').textContent = String(state.trailLen);
      writeStore();
    });

    const toggles = [
      ['optTrails', v => { opts.trails = v; if (!v) world.bodies.forEach(b => { b.trail = []; }); }],
      ['optVectors', v => { opts.vectors = v; }],
      ['optGrid', v => { opts.grid = v; }],
      ['optMerge', v => { world.merge = v; }],
      ['optFollow', v => { opts.follow = v; }]
    ];
    toggles.forEach(([id, apply]) => {
      $(id).addEventListener('change', e => { apply(e.target.checked); writeStore(); });
    });

    document.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => { selectColor(s.dataset.color); writeStore(); });
    });

    $('btnPause').addEventListener('click', () => setPaused(!state.paused));
    $('btnUndo').addEventListener('click', undo);
    $('btnRecenter').addEventListener('click', fitView);
    $('btnClear').addEventListener('click', clearAll);
    $('btnZoomIn').addEventListener('click', () => { const s = view.size(); zoomAt(1.25, s.w / 2, s.h / 2); });
    $('btnZoomOut').addEventListener('click', () => { const s = view.size(); zoomAt(0.8, s.w / 2, s.h / 2); });
  }

  function restoreControls() {
    const saved = readStore();
    if (saved.opts) {
      ['trails', 'vectors', 'grid', 'follow'].forEach(k => {
        if (typeof saved.opts[k] === 'boolean') opts[k] = saved.opts[k];
      });
      if (typeof saved.opts.merge === 'boolean') world.merge = saved.opts.merge;
    }
    if (typeof saved.gravity === 'number') world.G = clamp(saved.gravity, 0.2, 3);
    if (typeof saved.speed === 'number') state.speed = clamp(saved.speed, 0.25, 3);
    if (typeof saved.trailLen === 'number') state.trailLen = clamp(saved.trailLen, 20, 400);
    if (typeof saved.mass === 'number') $('mass').value = clamp(saved.mass, 1, 100);
    if (typeof saved.color === 'string') state.color = saved.color;

    $('optTrails').checked = opts.trails;
    $('optVectors').checked = opts.vectors;
    $('optGrid').checked = opts.grid;
    $('optMerge').checked = world.merge;
    $('optFollow').checked = opts.follow;
    $('gravity').value = world.G;
    $('gravityOut').textContent = world.G.toFixed(1) + 'x';
    $('speed').value = state.speed;
    $('speedOut').textContent = state.speed.toFixed(1) + 'x';
    $('trailLen').value = state.trailLen;
    $('trailOut').textContent = String(state.trailLen);
    selectColor(state.color);
  }

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.code === 'Space') {
      // stop a focused button from also firing when space is pressed
      e.preventDefault();
      if (!e.repeat) setPaused(!state.paused);
    } else if (k === 'z') {
      undo();
    } else if (k === 'c') {
      clearAll();
    } else if (k === 'r' && state.preset) {
      loadPreset(state.preset);
    } else if (k === 'escape' && drag && drag.mode === 'aim') {
      drag = null;
    }
  });

  document.addEventListener('keyup', e => {
    if (e.code === 'Space') e.preventDefault();
  });

  /* ---------- main loop ---------- */

  function recordTrails() {
    if (!opts.trails) return;
    const cap = state.trailLen * 2;
    for (const b of world.bodies) {
      b.trail.push(b.x, b.y);
      if (b.trail.length > cap) b.trail.splice(0, b.trail.length - cap);
    }
  }

  function followHeaviest() {
    if (!opts.follow) return;
    const top = world.heaviest();
    if (!top) return;
    cam.x += (top.x - cam.x) * 0.1;
    cam.y += (top.y - cam.y) * 0.1;
  }

  function updateAimPreview() {
    if (!drag || drag.mode !== 'aim') return;
    const readout = $('aimReadout');
    if (!drag.moved) {
      drag.path = null;
      readout.hidden = false;
      readout.textContent = 'release to place it at rest';
      return;
    }
    const v = aimVelocity(drag);
    const pairs = (world.bodies.length * (world.bodies.length + 1)) / 2;
    const frames = clamp(Math.floor(1200000 / (pairs * 4)), 120, 520);
    drag.path = predict(world, { x: drag.x0, y: drag.y0, vx: v.vx, vy: v.vy, m: drag.m }, frames, BASE_DT);
    readout.hidden = false;
    readout.textContent = 'launch speed ' + Math.hypot(v.vx, v.vy).toFixed(1) + '   mass ' + formatMass(drag.m);
  }

  let lastStats = '';
  function updateStats() {
    const text = world.bodies.length + '/' + world.merges + '/' + cam.zoom.toFixed(2);
    if (text === lastStats) return;
    lastStats = text;
    $('statBodies').textContent = String(world.bodies.length);
    $('statMerges').textContent = String(world.merges);
    $('zoomLabel').textContent = (cam.zoom < 1 ? cam.zoom.toFixed(2) : cam.zoom.toFixed(1)) + 'x';
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.clock += dt;

    if (!state.paused) {
      const events = world.advance(dt * 60 * BASE_DT * state.speed);
      events.forEach(ev => effects.push({ x: ev.x, y: ev.y, color: ev.color, age: 0, span: 0.9, reach: 54 }));
      recordTrails();
    }

    followHeaviest();
    effects.forEach(ev => { ev.age += dt; });
    effects = effects.filter(ev => ev.age < ev.span);

    if (!drag || drag.mode !== 'aim') $('aimReadout').hidden = true;
    updateAimPreview();
    updateStats();

    view.draw({
      world: world,
      cam: cam,
      opts: opts,
      effects: effects,
      time: state.clock,
      aim: drag && drag.mode === 'aim' ? drag : null
    });
    requestAnimationFrame(frame);
  }

  /* ---------- start ---------- */

  buildPresetButtons();
  restoreControls();
  wireControls();
  updateMassUI();
  syncUndoButton();

  new ResizeObserver(() => view.resize()).observe(wrap);
  view.resize();

  loadPreset('solar');
  undoStack.length = 0;          // loading the first scene is not something to undo
  syncUndoButton();

  requestAnimationFrame(frame);
})();
