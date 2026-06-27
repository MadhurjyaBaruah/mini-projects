/**
 * SpinHub – script.js
 * Modular vanilla JS spinner hub.
 * Sections:
 *   1. Constants & State
 *   2. Local Storage
 *   3. Template Data
 *   4. Router / Views
 *   5. Hero Wheel
 *   6. Home View
 *   7. My Wheels View
 *   8. Builder View
 *   9. Wheel Canvas Renderer
 *  10. Spin Engine
 *  11. Result Modal
 *  12. Item Editor Modal
 *  13. Context Menu
 *  14. Confetti
 *  15. Toast
 *  16. Drag & Drop
 *  17. Utilities
 *  18. Init
 */

/* ═══════════════════════════════════════════════════════════
   1. CONSTANTS & STATE
═══════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  WHEELS:       'spinHub_wheels',
  RECENTS:      'spinHub_recents',
  LAST_OPENED:  'spinHub_lastOpened',
  PREFS:        'spinHub_prefs',
};

const PALETTE = {
  bg:       '#F5F5E8',
  surface:  '#EEF4DC',
  mint:     '#D4E8A0',
  teal:     '#5BB88A',
  forest:   '#1E8A3C',
  text:     '#1A2B1F',
};

// Colour pool for auto-assigning segment colours
const SEGMENT_COLORS = [
  '#5BB88A', '#1E8A3C', '#D4E8A0', '#8FD1B0',
  '#A8C888', '#3CA86A', '#6DCFA0', '#2E9E50',
  '#B8E4C8', '#4EB87A', '#C6DFA8', '#74C494',
];

/** Central application state */
const state = {
  currentView:   'home',
  wheels:        [],   // all saved wheels
  recents:       [],   // array of wheel IDs (most recent first)
  prefs:         {},
  editingWheelId: null,

  // Builder working copy
  builder: {
    id:          null,
    name:        'My Wheel',
    desc:        '',
    items:       [],
    settings: {
      size:         420,
      fontFamily:   'system-ui',
      fontSize:     14,
      borderWidth:  2,
      pointerStyle: 'arrow',
      centerStyle:  'circle',
      spinDuration: 5000,
      spinDirection:'cw',
      easingType:   'ease-out',
      soundOn:      true,
      confettiOn:   true,
      bgType:       'solid',
      bgColor:      '#F5F5E8',
      bgGradFrom:   '#D4E8A0',
      bgGradTo:     '#5BB88A',
    },
  },

  // Spinner runtime
  spin: {
    isSpinning:  false,
    currentAngle:0,   // radians
    animFrameId: null,
  },

  // Context menu target
  ctxTargetId: null,
  // Delete confirmation target
  deleteTargetId: null,
  // Rename target
  renameTargetId: null,
  // Item editor
  editingItemIndex: null,

  // My Wheels filter
  wheelFilter: 'all',
  wheelSearch: '',
};

/* ═══════════════════════════════════════════════════════════
   2. LOCAL STORAGE
═══════════════════════════════════════════════════════════ */

const Storage = {
  load() {
    try {
      state.wheels  = JSON.parse(localStorage.getItem(STORAGE_KEYS.WHEELS))  || [];
      state.recents = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTS)) || [];
      state.prefs   = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFS))   || {};
    } catch(e) {
      console.warn('SpinHub: storage parse error', e);
      state.wheels = []; state.recents = []; state.prefs = {};
    }
  },

  saveWheels() {
    localStorage.setItem(STORAGE_KEYS.WHEELS, JSON.stringify(state.wheels));
  },

  saveRecents() {
    localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(state.recents));
  },

  savePrefs() {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(state.prefs));
  },

  setLastOpened(id) {
    localStorage.setItem(STORAGE_KEYS.LAST_OPENED, id);
  },

  getLastOpened() {
    return localStorage.getItem(STORAGE_KEYS.LAST_OPENED);
  },
};

/* ═══════════════════════════════════════════════════════════
   3. TEMPLATE DATA
═══════════════════════════════════════════════════════════ */

const TEMPLATES = [
  {
    id: 'tpl-food',
    name: 'Food Picker',
    desc: 'Can\'t decide where to eat? Let the wheel choose!',
    icon: '🍕',
    category: 'Lifestyle',
    items: [
      { text: 'Pizza', emoji: '🍕', color: '#5BB88A', weight: 1 },
      { text: 'Sushi',  emoji: '🍣', color: '#1E8A3C', weight: 1 },
      { text: 'Tacos',  emoji: '🌮', color: '#D4E8A0', weight: 1 },
      { text: 'Burger', emoji: '🍔', color: '#8FD1B0', weight: 1 },
      { text: 'Pasta',  emoji: '🍝', color: '#3CA86A', weight: 1 },
      { text: 'Salad',  emoji: '🥗', color: '#A8C888', weight: 1 },
      { text: 'Ramen',  emoji: '🍜', color: '#6DCFA0', weight: 1 },
      { text: 'Curry',  emoji: '🍛', color: '#2E9E50', weight: 1 },
    ],
  },
  {
    id: 'tpl-movie',
    name: 'Movie Picker',
    desc: 'Pick a genre for movie night.',
    icon: '🎬',
    category: 'Fun',
    items: [
      { text: 'Action',   emoji: '💥', color: '#5BB88A', weight: 1 },
      { text: 'Comedy',   emoji: '😂', color: '#1E8A3C', weight: 1 },
      { text: 'Horror',   emoji: '👻', color: '#D4E8A0', weight: 1 },
      { text: 'Romance',  emoji: '💕', color: '#8FD1B0', weight: 1 },
      { text: 'Sci-Fi',   emoji: '🚀', color: '#3CA86A', weight: 1 },
      { text: 'Thriller', emoji: '🔪', color: '#A8C888', weight: 1 },
      { text: 'Drama',    emoji: '🎭', color: '#6DCFA0', weight: 1 },
      { text: 'Anime',    emoji: '⛩️', color: '#2E9E50', weight: 1 },
    ],
  },
  {
    id: 'tpl-study',
    name: 'Study Spinner',
    desc: 'Rotate through subjects to keep revision fresh.',
    icon: '📚',
    category: 'Education',
    items: [
      { text: 'Maths',    emoji: '➗', color: '#5BB88A', weight: 1 },
      { text: 'Science',  emoji: '🔬', color: '#1E8A3C', weight: 1 },
      { text: 'History',  emoji: '📜', color: '#D4E8A0', weight: 1 },
      { text: 'English',  emoji: '📝', color: '#8FD1B0', weight: 1 },
      { text: 'Geography',emoji: '🌍', color: '#3CA86A', weight: 1 },
      { text: 'Art',      emoji: '🎨', color: '#A8C888', weight: 1 },
    ],
  },
  {
    id: 'tpl-team',
    name: 'Team Picker',
    desc: 'Randomly assign team members to roles or tasks.',
    icon: '👥',
    category: 'Events',
    items: [
      { text: 'Team A',  emoji: '🔵', color: '#5BB88A', weight: 1 },
      { text: 'Team B',  emoji: '🟢', color: '#1E8A3C', weight: 1 },
      { text: 'Team C',  emoji: '🟡', color: '#D4E8A0', weight: 1 },
      { text: 'Team D',  emoji: '🔴', color: '#8FD1B0', weight: 1 },
    ],
  },
  {
    id: 'tpl-prize',
    name: 'Prize Wheel',
    desc: 'Lucky draw for events and giveaways.',
    icon: '🏆',
    category: 'Events',
    items: [
      { text: '1st Prize',  emoji: '🥇', color: '#1E8A3C', weight: 1 },
      { text: '2nd Prize',  emoji: '🥈', color: '#5BB88A', weight: 2 },
      { text: '3rd Prize',  emoji: '🥉', color: '#8FD1B0', weight: 3 },
      { text: 'Try Again',  emoji: '🔄', color: '#D4E8A0', weight: 6 },
      { text: 'Free Spin',  emoji: '🎡', color: '#A8C888', weight: 4 },
      { text: 'Bonus!',     emoji: '🎁', color: '#3CA86A', weight: 2 },
    ],
  },
  {
    id: 'tpl-truth',
    name: 'Truth or Dare',
    desc: 'Classic party game spinner.',
    icon: '🎭',
    category: 'Fun',
    items: [
      { text: 'Truth',   emoji: '💬', color: '#5BB88A', weight: 1 },
      { text: 'Dare',    emoji: '🎯', color: '#1E8A3C', weight: 1 },
      { text: 'Truth',   emoji: '💬', color: '#8FD1B0', weight: 1 },
      { text: 'Dare',    emoji: '🎯', color: '#3CA86A', weight: 1 },
      { text: 'Wild Card',emoji:'🃏', color: '#D4E8A0', weight: 1 },
    ],
  },
  {
    id: 'tpl-workout',
    name: 'Workout',
    desc: 'Randomise your exercise routine.',
    icon: '💪',
    category: 'Lifestyle',
    items: [
      { text: 'Push-Ups',    emoji: '💪', color: '#5BB88A', weight: 1 },
      { text: 'Squats',      emoji: '🏋️', color: '#1E8A3C', weight: 1 },
      { text: 'Plank',       emoji: '🧘', color: '#D4E8A0', weight: 1 },
      { text: 'Burpees',     emoji: '🔥', color: '#8FD1B0', weight: 1 },
      { text: 'Jumping Jacks',emoji:'🤸', color: '#3CA86A', weight: 1 },
      { text: 'Run 5 Min',   emoji: '🏃', color: '#A8C888', weight: 1 },
      { text: 'Lunges',      emoji: '🦵', color: '#6DCFA0', weight: 1 },
    ],
  },
  {
    id: 'tpl-game',
    name: 'Game Challenge',
    desc: 'Spin for your next gaming challenge.',
    icon: '🎮',
    category: 'Gaming',
    items: [
      { text: 'No HUD',      emoji: '👁️', color: '#5BB88A', weight: 1 },
      { text: 'Speed Run',   emoji: '⚡', color: '#1E8A3C', weight: 1 },
      { text: 'No Deaths',   emoji: '💀', color: '#D4E8A0', weight: 1 },
      { text: 'Low %',       emoji: '📉', color: '#8FD1B0', weight: 1 },
      { text: 'Max Difficulty',emoji:'🔥',color: '#3CA86A', weight: 1 },
      { text: 'Random Class',emoji: '🎲', color: '#A8C888', weight: 1 },
    ],
  },
  {
    id: 'tpl-number',
    name: 'Random Number',
    desc: 'Pick a number from 1 to 10.',
    icon: '🔢',
    category: 'Fun',
    items: Array.from({ length: 10 }, (_, i) => ({
      text: String(i + 1), emoji: '', color: SEGMENT_COLORS[i % SEGMENT_COLORS.length], weight: 1,
    })),
  },
  {
    id: 'tpl-country',
    name: 'Country Picker',
    desc: 'Spin the globe – where next?',
    icon: '🌍',
    category: 'Lifestyle',
    items: [
      { text: 'Japan',   emoji: '🇯🇵', color: '#5BB88A', weight: 1 },
      { text: 'Italy',   emoji: '🇮🇹', color: '#1E8A3C', weight: 1 },
      { text: 'Brazil',  emoji: '🇧🇷', color: '#D4E8A0', weight: 1 },
      { text: 'Canada',  emoji: '🇨🇦', color: '#8FD1B0', weight: 1 },
      { text: 'Australia',emoji:'🇦🇺', color: '#3CA86A', weight: 1 },
      { text: 'India',   emoji: '🇮🇳', color: '#A8C888', weight: 1 },
      { text: 'Egypt',   emoji: '🇪🇬', color: '#6DCFA0', weight: 1 },
      { text: 'Mexico',  emoji: '🇲🇽', color: '#2E9E50', weight: 1 },
    ],
  },
  {
    id: 'tpl-decision',
    name: 'Decision Maker',
    desc: 'Yes, No or Maybe – make up your mind!',
    icon: '🤔',
    category: 'Fun',
    items: [
      { text: 'Yes!',       emoji: '✅', color: '#1E8A3C', weight: 2 },
      { text: 'No',         emoji: '❌', color: '#5BB88A', weight: 2 },
      { text: 'Maybe',      emoji: '🤷', color: '#D4E8A0', weight: 2 },
      { text: 'Ask again',  emoji: '🔄', color: '#A8C888', weight: 1 },
      { text: 'Definitely!',emoji: '🎯', color: '#3CA86A', weight: 1 },
    ],
  },
  {
    id: 'tpl-custom',
    name: 'Custom Spinner',
    desc: 'Build your own wheel from scratch.',
    icon: '✨',
    category: 'Custom',
    items: [],
  },
];

/* ═══════════════════════════════════════════════════════════
   4. ROUTER / VIEWS
═══════════════════════════════════════════════════════════ */

const Router = {
  /** Navigate to a named view */
  go(view) {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => el.hidden = true);

    // Show target view
    const target = document.getElementById(`view-${view}`);
    if (target) target.hidden = false;

    // Update nav button states
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
      btn.setAttribute('aria-current', btn.dataset.view === view ? 'page' : 'false');
    });

    state.currentView = view;

    // Close mobile menu
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger  = document.getElementById('hamburger');
    mobileMenu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');

    // View-specific init
    switch (view) {
      case 'home':      HomeView.render();     break;
      case 'my-wheels': MyWheelsView.render(); break;
      case 'builder':   BuilderView.render();  break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};

/* ═══════════════════════════════════════════════════════════
   5. HERO WHEEL (decorative animated wheel on home page)
═══════════════════════════════════════════════════════════ */

const HeroWheel = {
  canvas: null,
  ctx:    null,
  angle:  0,
  raf:    null,
  items: ['🍕', '🎬', '🌍', '🎮', '💪', '🎭', '📚', '🏆'],

  init() {
    this.canvas = document.getElementById('hero-wheel');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animate();
  },

  draw() {
    const ctx   = this.ctx;
    const size  = this.canvas.width;
    const cx    = size / 2;
    const cy    = size / 2;
    const r     = cx - 4;
    const n     = this.items.length;
    const arc   = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < n; i++) {
      const start = this.angle + i * arc;
      const end   = start + arc;

      // Segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();

      // Separator
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + 0.01);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.font = `${size < 200 ? 16 : 22}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.items[i], r * 0.65, 0);
      ctx.restore();
    }

    // Border ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.forest;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Centre circle
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.forest;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  },

  animate() {
    this.angle += 0.003;
    this.draw();
    this.raf = requestAnimationFrame(() => this.animate());
  },
};

/* ═══════════════════════════════════════════════════════════
   6. HOME VIEW
═══════════════════════════════════════════════════════════ */

const HomeView = {
  render() {
    this.renderTemplateCards();
    this.renderRecents();
  },

  renderTemplateCards() {
    const grid = document.getElementById('template-grid');
    grid.innerHTML = '';

    TEMPLATES.forEach(tpl => {
      const card = document.createElement('article');
      card.className = 'template-card';
      card.setAttribute('role', 'listitem');
      card.tabIndex = 0;
      card.setAttribute('aria-label', `${tpl.name} – ${tpl.desc}`);
      card.innerHTML = `
        <div class="card-icon" aria-hidden="true">${tpl.icon}</div>
        <div class="card-title">${tpl.name}</div>
        <div class="card-desc">${tpl.desc}</div>
        <button class="card-open-btn" aria-label="Open ${tpl.name}">Open</button>
      `;

      const openBtn = card.querySelector('.card-open-btn');
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTemplate(tpl);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openTemplate(tpl);
        }
      });

      grid.appendChild(card);
    });
  },

  renderRecents() {
    const section = document.getElementById('recent-section');
    const grid    = document.getElementById('recent-grid');

    const recentWheels = state.recents
      .map(id => state.wheels.find(w => w.id === id))
      .filter(Boolean)
      .slice(0, 8);

    if (recentWheels.length === 0) {
      section.style.display = 'none';
      grid.innerHTML = '';
      return;
    }

    section.style.display = '';
    grid.innerHTML = '';

    recentWheels.forEach(wheel => {
      const chip = document.createElement('button');
      chip.className = 'recent-chip';
      chip.textContent = wheel.name;
      chip.setAttribute('aria-label', `Re-open ${wheel.name}`);
      chip.addEventListener('click', () => BuilderView.loadWheel(wheel.id));
      grid.appendChild(chip);
    });
  },

  openTemplate(tpl) {
    // If custom, go straight to empty builder
    if (tpl.id === 'tpl-custom') {
      BuilderView.resetBuilder();
      Router.go('builder');
      return;
    }

    // Otherwise load template into builder
    BuilderView.loadFromTemplate(tpl);
    Router.go('builder');
  },
};

/* ═══════════════════════════════════════════════════════════
   7. MY WHEELS VIEW
═══════════════════════════════════════════════════════════ */

const MyWheelsView = {
  render() {
    this.applyFilter();
  },

  applyFilter() {
    let wheels = [...state.wheels];

    // Filter by type
    if (state.wheelFilter === 'favorites') {
      wheels = wheels.filter(w => w.favorite);
    } else if (state.wheelFilter === 'custom') {
      wheels = wheels.filter(w => !w.isTemplate);
    } else if (state.wheelFilter === 'template') {
      wheels = wheels.filter(w => w.isTemplate);
    }

    // Filter by search
    if (state.wheelSearch) {
      const q = state.wheelSearch.toLowerCase();
      wheels = wheels.filter(w => w.name.toLowerCase().includes(q));
    }

    this.renderCards(wheels);
  },

  renderCards(wheels) {
    const grid  = document.getElementById('wheels-grid');
    const empty = document.getElementById('wheels-empty');

    grid.innerHTML = '';

    if (wheels.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    wheels.forEach(wheel => {
      const card = this.createCard(wheel);
      grid.appendChild(card);
    });
  },

  createCard(wheel) {
    const card = document.createElement('article');
    card.className = 'wheel-card';
    card.setAttribute('role', 'listitem');
    card.dataset.wheelId = wheel.id;

    const itemCount = wheel.items ? wheel.items.length : 0;
    const favIcon   = wheel.favorite ? '⭐' : '☆';
    const dateStr   = wheel.updatedAt
      ? new Date(wheel.updatedAt).toLocaleDateString()
      : '';

    card.innerHTML = `
      <div class="wheel-card-preview">
        <canvas width="120" height="120" aria-hidden="true"></canvas>
        <button class="wheel-card-more" data-id="${wheel.id}" aria-label="More options for ${wheel.name}" title="More options">⋯</button>
        <button class="wheel-card-fav" data-id="${wheel.id}" aria-label="${wheel.favorite ? 'Remove from favorites' : 'Add to favorites'}" title="Favourite">${favIcon}</button>
      </div>
      <div class="wheel-card-body">
        <div class="wheel-card-name" title="${wheel.name}">${wheel.name}</div>
        <div class="wheel-card-meta">
          <span>${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          <span>${dateStr}</span>
        </div>
      </div>
      <div class="wheel-card-actions">
        <button class="wca-btn primary" data-id="${wheel.id}" data-action="open">Spin</button>
        <button class="wca-btn" data-id="${wheel.id}" data-action="edit">Edit</button>
      </div>
    `;

    // Draw mini preview wheel
    const canvas = card.querySelector('canvas');
    WheelRenderer.drawMini(canvas, wheel.items || [], 60);

    // Favourite button
    card.querySelector('.wheel-card-fav').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite(wheel.id);
    });

    // More options button
    card.querySelector('.wheel-card-more').addEventListener('click', (e) => {
      e.stopPropagation();
      ContextMenu.open(e, wheel.id);
    });

    // Action buttons
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'open') BuilderView.loadWheel(wheel.id);
        if (action === 'edit') BuilderView.loadWheel(wheel.id, true);
      });
    });

    // Card click → open
    card.addEventListener('click', () => BuilderView.loadWheel(wheel.id));
    card.tabIndex = 0;
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') BuilderView.loadWheel(wheel.id);
    });

    return card;
  },

  toggleFavorite(id) {
    const wheel = state.wheels.find(w => w.id === id);
    if (!wheel) return;
    wheel.favorite = !wheel.favorite;
    Storage.saveWheels();
    this.render();
    Toast.show(wheel.favorite ? '⭐ Added to favourites' : 'Removed from favourites');
  },

  deleteWheel(id) {
    state.wheels = state.wheels.filter(w => w.id !== id);
    state.recents = state.recents.filter(rid => rid !== id);
    Storage.saveWheels();
    Storage.saveRecents();
    this.render();
    Toast.show('Wheel deleted');
  },

  duplicateWheel(id) {
    const wheel = state.wheels.find(w => w.id === id);
    if (!wheel) return;
    const copy = deepClone(wheel);
    copy.id        = generateId();
    copy.name      = `${wheel.name} (copy)`;
    copy.favorite  = false;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    state.wheels.unshift(copy);
    Storage.saveWheels();
    this.render();
    Toast.show('Wheel duplicated');
  },

  renameWheel(id, newName) {
    const wheel = state.wheels.find(w => w.id === id);
    if (!wheel || !newName.trim()) return;
    wheel.name      = newName.trim();
    wheel.updatedAt = Date.now();
    Storage.saveWheels();
    this.render();
    Toast.show('Wheel renamed');
  },
};

/* ═══════════════════════════════════════════════════════════
   8. BUILDER VIEW
═══════════════════════════════════════════════════════════ */

const BuilderView = {
  render() {
    this.syncFormFromState();
    this.renderItemsList();
    this.updatePreviewStats();
    WheelRenderer.draw(getBuilderCanvas(), state.builder);
  },

  /** Reset builder to a blank wheel */
  resetBuilder() {
    state.builder = {
      id:   null,
      name: 'My Wheel',
      desc: '',
      items: [],
      settings: {
        size:          420,
        fontFamily:    'system-ui',
        fontSize:      14,
        borderWidth:   2,
        pointerStyle:  'arrow',
        centerStyle:   'circle',
        spinDuration:  5000,
        spinDirection: 'cw',
        easingType:    'ease-out',
        soundOn:       true,
        confettiOn:    true,
        bgType:        'solid',
        bgColor:       '#F5F5E8',
        bgGradFrom:    '#D4E8A0',
        bgGradTo:      '#5BB88A',
      },
    };
    state.editingWheelId = null;
    document.getElementById('builder-title').textContent = 'Build a Wheel';
  },

  /** Load a template into the builder */
  loadFromTemplate(tpl) {
    this.resetBuilder();
    state.builder.name  = tpl.name;
    state.builder.items = tpl.items.map((item, i) => ({
      ...item,
      id: generateId(),
      color: item.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    }));
    document.getElementById('builder-title').textContent = tpl.name;
  },

  /** Load an existing saved wheel into the builder */
  loadWheel(id, editMode = false) {
    const wheel = state.wheels.find(w => w.id === id);
    if (!wheel) return;

    state.builder     = deepClone(wheel);
    state.builder.id  = id;
    state.editingWheelId = id;

    // Track recent
    addToRecents(id);

    document.getElementById('builder-title').textContent = wheel.name;
    Router.go('builder');
  },

  /** Sync all form inputs from state.builder */
  syncFormFromState() {
    const b = state.builder;
    const s = b.settings;

    setVal('wheel-name',     b.name);
    setVal('wheel-desc',     b.desc);
    setVal('wheel-size',     s.size);
    setVal('font-family',    s.fontFamily);
    setVal('font-size',      s.fontSize);
    setVal('border-width',   s.borderWidth);
    setVal('pointer-style',  s.pointerStyle);
    setVal('center-style',   s.centerStyle);
    setVal('spin-duration',  s.spinDuration);
    setVal('spin-direction', s.spinDirection);
    setVal('easing-type',    s.easingType);
    setChecked('sound-toggle',    s.soundOn);
    setChecked('confetti-toggle', s.confettiOn);
    setVal('bg-color',     s.bgColor);
    setVal('bg-grad-from', s.bgGradFrom);
    setVal('bg-grad-to',   s.bgGradTo);

    // Background type radio
    document.querySelectorAll('input[name="bg-type"]').forEach(r => {
      r.checked = r.value === s.bgType;
    });
    this.toggleBgOpts(s.bgType);
    this.updatePointerSvg(s.pointerStyle);
    this.resizeCanvas(s.size);
  },

  /** Read all form inputs and update state.builder.settings */
  syncStateFromForm() {
    const s = state.builder.settings;
    state.builder.name = getVal('wheel-name') || 'My Wheel';
    state.builder.desc = getVal('wheel-desc');
    s.size          = parseInt(getVal('wheel-size'));
    s.fontFamily    = getVal('font-family');
    s.fontSize      = parseInt(getVal('font-size'));
    s.borderWidth   = parseInt(getVal('border-width'));
    s.pointerStyle  = getVal('pointer-style');
    s.centerStyle   = getVal('center-style');
    s.spinDuration  = parseInt(getVal('spin-duration'));
    s.spinDirection = getVal('spin-direction');
    s.easingType    = getVal('easing-type');
    s.soundOn       = document.getElementById('sound-toggle').checked;
    s.confettiOn    = document.getElementById('confetti-toggle').checked;
    s.bgType        = document.querySelector('input[name="bg-type"]:checked')?.value || 'solid';
    s.bgColor       = getVal('bg-color');
    s.bgGradFrom    = getVal('bg-grad-from');
    s.bgGradTo      = getVal('bg-grad-to');
  },

  /** Re-render the items list in the panel */
  renderItemsList() {
    const list = document.getElementById('items-list');
    list.innerHTML = '';

    state.builder.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.setAttribute('role', 'listitem');
      row.draggable = true;
      row.dataset.index = i;

      const label = item.emoji ? `${item.emoji} ${item.text}` : item.text;
      const showWeight = item.weight && item.weight > 1;

      row.innerHTML = `
        <span class="item-drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span>
        <span class="item-color-dot" style="background:${item.color}"></span>
        <span class="item-text" title="${label}">${label}</span>
        ${showWeight ? `<span class="item-weight-badge" title="Weight">×${item.weight}</span>` : ''}
        <div class="item-actions">
          <button class="item-action-btn" data-action="edit" data-index="${i}" aria-label="Edit ${item.text}" title="Edit">✏️</button>
          <button class="item-action-btn" data-action="dup"  data-index="${i}" aria-label="Duplicate ${item.text}" title="Duplicate">📋</button>
          <button class="item-action-btn danger" data-action="del" data-index="${i}" aria-label="Delete ${item.text}" title="Delete">✕</button>
        </div>
      `;

      // Action buttons
      row.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          if (btn.dataset.action === 'edit') ItemEditor.open(idx);
          if (btn.dataset.action === 'dup')  this.duplicateItem(idx);
          if (btn.dataset.action === 'del')  this.deleteItem(idx);
        });
      });

      // Drag & drop
      DragDrop.attachRow(row);

      list.appendChild(row);
    });

    // Update count badges
    const count = state.builder.items.length;
    document.getElementById('item-count').textContent     = `${count} item${count !== 1 ? 's' : ''}`;
    document.getElementById('preview-item-count').textContent = `${count} item${count !== 1 ? 's' : ''}`;
  },

  duplicateItem(index) {
    const item = state.builder.items[index];
    const copy = { ...item, id: generateId() };
    state.builder.items.splice(index + 1, 0, copy);
    this.renderItemsList();
    this.refreshWheel();
  },

  deleteItem(index) {
    state.builder.items.splice(index, 1);
    this.renderItemsList();
    this.refreshWheel();
  },

  addItem() {
    const nextColor = SEGMENT_COLORS[state.builder.items.length % SEGMENT_COLORS.length];
    const newItem = {
      id:     generateId(),
      text:   `Item ${state.builder.items.length + 1}`,
      emoji:  '',
      color:  nextColor,
      weight: 1,
    };
    state.builder.items.push(newItem);
    this.renderItemsList();
    this.refreshWheel();
    // Scroll items list to bottom
    const list = document.getElementById('items-list');
    list.scrollTop = list.scrollHeight;
    // Open editor for new item
    ItemEditor.open(state.builder.items.length - 1);
  },

  /** Redraw the preview wheel and update stats */
  refreshWheel() {
    this.syncStateFromForm();
    WheelRenderer.draw(getBuilderCanvas(), state.builder);
    this.updatePointerSvg(state.builder.settings.pointerStyle);
    this.resizeCanvas(state.builder.settings.size);
    this.updatePreviewStats();
  },

  updatePreviewStats() {
    const s = state.builder.settings;
    const dur = s.spinDuration / 1000;
    const dir = s.spinDirection === 'cw' ? 'Clockwise' : 'Counter-CW';
    document.getElementById('preview-spin-info').textContent = `${dur}s · ${dir}`;
  },

  toggleBgOpts(type) {
    document.getElementById('bg-solid-opts').hidden    = type !== 'solid';
    document.getElementById('bg-gradient-opts').hidden = type !== 'gradient';
  },

  resizeCanvas(size) {
    const canvas = getBuilderCanvas();
    const stage  = document.getElementById('wheel-stage');
    const maxSize = Math.min(size, window.innerWidth < 640 ? 300 : 480);
    canvas.width  = maxSize;
    canvas.height = maxSize;
    canvas.style.width  = maxSize + 'px';
    canvas.style.height = maxSize + 'px';
    WheelRenderer.draw(canvas, state.builder);
  },

  updatePointerSvg(style) {
    const shape = document.getElementById('pointer-shape');
    if (!shape) return;
    if (style === 'arrow') {
      shape.setAttribute('points', '20,48 2,4 38,4');
      shape.setAttribute('fill', PALETTE.forest);
    } else if (style === 'pin') {
      shape.setAttribute('points', '20,48 14,20 20,2 26,20');
      shape.setAttribute('fill', '#c0392b');
    } else if (style === 'flag') {
      shape.setAttribute('points', '20,48 20,8 36,16 20,24');
      shape.setAttribute('fill', PALETTE.teal);
    }
  },

  /** Save current builder state to wheels array */
  saveWheel() {
    this.syncStateFromForm();
    const b = state.builder;

    if (!b.name.trim()) {
      Toast.show('Please give your wheel a name.');
      document.getElementById('wheel-name').focus();
      return;
    }
    if (b.items.length < 2) {
      Toast.show('Add at least 2 items to save.');
      return;
    }

    const now = Date.now();
    const existingIdx = state.wheels.findIndex(w => w.id === b.id);

    if (existingIdx >= 0) {
      // Update existing
      state.wheels[existingIdx] = { ...deepClone(b), updatedAt: now };
      Toast.show('✅ Wheel updated!');
    } else {
      // New wheel
      const newWheel = {
        ...deepClone(b),
        id:         b.id || generateId(),
        isTemplate: false,
        favorite:   false,
        createdAt:  now,
        updatedAt:  now,
      };
      state.builder.id = newWheel.id;
      state.wheels.unshift(newWheel);
      Toast.show('✅ Wheel saved!');
    }

    Storage.saveWheels();
    addToRecents(state.builder.id);
  },
};

/* ═══════════════════════════════════════════════════════════
   9. WHEEL CANVAS RENDERER
═══════════════════════════════════════════════════════════ */

const WheelRenderer = {
  /**
   * Draw the full interactive wheel onto a canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {object} builderState - { items, settings }
   * @param {number} [overrideAngle] - optional rotation override (radians)
   */
  draw(canvas, builderState, overrideAngle) {
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const size = canvas.width;
    const cx   = size / 2;
    const cy   = size / 2;
    const r    = cx - 6;
    const items     = builderState.items || [];
    const settings  = builderState.settings || {};
    const angle     = overrideAngle !== undefined ? overrideAngle : state.spin.currentAngle;

    ctx.clearRect(0, 0, size, size);

    // Background
    if (settings.bgType === 'gradient') {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, settings.bgGradFrom || PALETTE.mint);
      grad.addColorStop(1, settings.bgGradTo   || PALETTE.teal);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = settings.bgColor || PALETTE.bg;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    if (items.length === 0) {
      // Empty state placeholder
      ctx.fillStyle = PALETTE.mint;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `${Math.floor(size * 0.05)}px ${settings.fontFamily || 'system-ui'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add items to preview', cx, cy);
      return;
    }

    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    const arcStart    = angle - Math.PI / 2; // start from top

    let currentAngle = arcStart;

    items.forEach((item, i) => {
      const itemWeight = item.weight || 1;
      const arc = (itemWeight / totalWeight) * Math.PI * 2;
      const endAngle = currentAngle + arc;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, currentAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = item.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();

      // Segment border
      if (settings.borderWidth > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth   = settings.borderWidth;
        ctx.stroke();
      }

      // Label text
      const midAngle  = currentAngle + arc / 2;
      const labelR    = r * 0.62;
      const tx        = cx + Math.cos(midAngle) * labelR;
      const ty        = cy + Math.sin(midAngle) * labelR;
      const fontSize  = settings.fontSize || 14;
      const fontFace  = settings.fontFamily || 'system-ui';

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);

      // Emoji line (if present)
      if (item.emoji) {
        ctx.font = `${fontSize + 2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#fff';
        ctx.fillText(item.emoji, 0, 0);
        ctx.font = `bold ${fontSize}px ${fontFace}`;
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur  = 3;
        ctx.fillText(truncate(item.text, 12), 0, 2);
      } else {
        ctx.font = `bold ${fontSize}px ${fontFace}`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#fff';
        ctx.shadowColor  = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur   = 3;
        ctx.fillText(truncate(item.text, 14), 0, 0);
      }
      ctx.restore();

      currentAngle = endAngle;
    });

    // Outer ring / border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.forest;
    ctx.lineWidth   = Math.max(settings.borderWidth || 2, 3);
    ctx.stroke();

    // Centre decoration
    if (settings.centerStyle !== 'none') {
      const innerR = settings.centerStyle === 'dot' ? 10 : 32;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle   = PALETTE.forest;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 3;
      ctx.stroke();
    }
  },

  /**
   * Draw a tiny thumbnail wheel onto a card canvas.
   * @param {HTMLCanvasElement} canvas
   * @param {Array} items
   * @param {number} r  - radius
   */
  drawMini(canvas, items, r) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx  = canvas.width  / 2;
    const cy  = canvas.height / 2;
    const n   = items.length || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (items.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.mint;
      ctx.fill();
      return;
    }

    const totalWeight = items.reduce((s, it) => s + (it.weight || 1), 0);
    let cur = -Math.PI / 2;

    items.forEach((item, i) => {
      const arc = ((item.weight || 1) / totalWeight) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, cur, cur + arc);
      ctx.closePath();
      ctx.fillStyle = item.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      cur += arc;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.forest;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.forest;
    ctx.fill();
  },
};

/* ═══════════════════════════════════════════════════════════
   10. SPIN ENGINE
═══════════════════════════════════════════════════════════ */

const SpinEngine = {
  /**
   * Kick off a spin animation.
   */
  spin() {
    if (state.spin.isSpinning) return;

    const items = state.builder.items;
    if (items.length < 2) {
      Toast.show('Add at least 2 items to spin!');
      return;
    }

    const s         = state.builder.settings;
    const duration  = s.spinDuration || 5000;
    const direction = s.spinDirection === 'ccw' ? -1 : 1;
    const easing    = s.easingType || 'ease-out';

    // Weighted random selection
    const winnerIndex = this.pickWeightedRandom(items);
    const winnerItem  = items[winnerIndex];

    // Calculate how far each item spans
    const totalWeight = items.reduce((sum, it) => sum + (it.weight || 1), 0);
    let winnerMidAngle = 0;
    let acc = 0;
    for (let i = 0; i <= winnerIndex; i++) {
      const w    = items[i].weight || 1;
      const frac = w / totalWeight;
      if (i < winnerIndex) acc += frac;
      else winnerMidAngle = acc + frac / 2;
    }

    // Target angle: winner segment mid should be at top (12 o'clock = -PI/2)
    // currentAngle is the rotation already applied
    // We need to bring winnerMidAngle * 2PI to 0 position (top)
    const winnerRad   = winnerMidAngle * Math.PI * 2;
    // Extra full rotations for drama (at least 5)
    const extraSpins  = (5 + Math.floor(Math.random() * 5)) * Math.PI * 2;
    const targetDelta = direction * (extraSpins + (Math.PI * 2 - winnerRad));

    const startAngle  = state.spin.currentAngle;
    const endAngle    = startAngle + targetDelta;
    const startTime   = performance.now();

    // Disable spin button
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.disabled = true;
    state.spin.isSpinning = true;

    // Sound
    if (s.soundOn) SoundFX.playTick();

    const canvas = getBuilderCanvas();

    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = this.ease(progress, easing);
      const current  = startAngle + (endAngle - startAngle) * eased;

      state.spin.currentAngle = current;
      WheelRenderer.draw(canvas, state.builder, current);

      // Tick sound at each segment crossing (approx)
      if (s.soundOn && Math.floor(elapsed / 120) !== Math.floor((elapsed - 16) / 120)) {
        SoundFX.playTick();
      }

      if (progress < 1) {
        state.spin.animFrameId = requestAnimationFrame(animate);
      } else {
        // Snap to final angle
        state.spin.currentAngle = endAngle;
        WheelRenderer.draw(canvas, state.builder, endAngle);
        state.spin.isSpinning = false;
        spinBtn.disabled = false;
        this.onSpinEnd(winnerItem, winnerIndex);
      }
    };

    state.spin.animFrameId = requestAnimationFrame(animate);
  },

  /** Weighted random picker – returns item index */
  pickWeightedRandom(items) {
    const totalWeight = items.reduce((s, it) => s + (it.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      rand -= (items[i].weight || 1);
      if (rand <= 0) return i;
    }
    return items.length - 1;
  },

  /** Easing functions */
  ease(t, type) {
    switch (type) {
      case 'bounce':
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75;
        return 7.5625 * t * t + 0.984375;
      case 'elastic': {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
      }
      default: // ease-out cubic
        return 1 - Math.pow(1 - t, 3);
    }
  },

  onSpinEnd(winnerItem, winnerIndex) {
    // Confetti
    if (state.builder.settings.confettiOn) {
      Confetti.burst();
    }
    // Show result
    ResultModal.show(winnerItem, winnerIndex);
  },
};

/* ═══════════════════════════════════════════════════════════
   11. RESULT MODAL
═══════════════════════════════════════════════════════════ */

const ResultModal = {
  show(item, index) {
    const overlay = document.getElementById('result-overlay');
    document.getElementById('result-emoji').textContent  = item.emoji || '🎉';
    document.getElementById('result-title').textContent  = item.text;
    document.getElementById('result-sub').textContent    =
      item.weight && item.weight > 1 ? `Weight: ${item.weight}` : '';

    overlay.hidden = false;
    overlay.querySelector('.modal').focus?.();

    // Store winning index for "Remove Winner"
    overlay.dataset.winnerIndex = index;
  },

  hide() {
    document.getElementById('result-overlay').hidden = true;
    Confetti.clear();
  },

  spinAgain() {
    this.hide();
    SpinEngine.spin();
  },

  removeAndSpin() {
    const idx = parseInt(document.getElementById('result-overlay').dataset.winnerIndex);
    if (!isNaN(idx) && state.builder.items[idx]) {
      state.builder.items.splice(idx, 1);
      BuilderView.renderItemsList();
      WheelRenderer.draw(getBuilderCanvas(), state.builder);
    }
    this.hide();
    if (state.builder.items.length >= 2) {
      SpinEngine.spin();
    } else {
      Toast.show('Not enough items left to spin.');
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   12. ITEM EDITOR MODAL
═══════════════════════════════════════════════════════════ */

const ItemEditor = {
  open(index) {
    state.editingItemIndex = index;
    const item = state.builder.items[index];

    document.getElementById('item-modal-title').textContent =
      index === undefined ? 'New Item' : 'Edit Item';
    document.getElementById('item-text-input').value  = item.text  || '';
    document.getElementById('item-emoji-input').value = item.emoji || '';
    document.getElementById('item-color-input').value = item.color || SEGMENT_COLORS[0];
    document.getElementById('item-weight-input').value = item.weight || 1;

    document.getElementById('item-overlay').hidden = false;
    document.getElementById('item-text-input').focus();
  },

  save() {
    const idx = state.editingItemIndex;
    if (idx === null || idx === undefined) return;

    const text   = document.getElementById('item-text-input').value.trim();
    const emoji  = document.getElementById('item-emoji-input').value.trim();
    const color  = document.getElementById('item-color-input').value;
    const weight = Math.max(1, parseInt(document.getElementById('item-weight-input').value) || 1);

    if (!text) {
      Toast.show('Please enter a label.');
      document.getElementById('item-text-input').focus();
      return;
    }

    state.builder.items[idx] = {
      ...state.builder.items[idx],
      text, emoji, color, weight,
    };

    this.close();
    BuilderView.renderItemsList();
    BuilderView.refreshWheel();
  },

  close() {
    document.getElementById('item-overlay').hidden = true;
    state.editingItemIndex = null;
  },
};

/* ═══════════════════════════════════════════════════════════
   13. CONTEXT MENU
═══════════════════════════════════════════════════════════ */

const ContextMenu = {
  open(event, wheelId) {
    state.ctxTargetId = wheelId;
    const menu = document.getElementById('context-menu');

    // Position near the click
    const x = Math.min(event.clientX, window.innerWidth  - 200);
    const y = Math.min(event.clientY, window.innerHeight - 260);
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    menu.hidden = false;

    // Update favourite label
    const wheel = state.wheels.find(w => w.id === wheelId);
    const favBtn = menu.querySelector('[data-action="favorite"]');
    if (wheel && favBtn) {
      favBtn.textContent = wheel.favorite ? '⭐ Unfavourite' : '⭐ Favourite';
    }

    // Focus first item
    menu.querySelector('.ctx-btn')?.focus();
  },

  close() {
    document.getElementById('context-menu').hidden = true;
    state.ctxTargetId = null;
  },

  handle(action) {
    const id = state.ctxTargetId;
    this.close();
    if (!id) return;

    switch (action) {
      case 'open':
        BuilderView.loadWheel(id);
        break;
      case 'edit':
        BuilderView.loadWheel(id, true);
        break;
      case 'duplicate':
        MyWheelsView.duplicateWheel(id);
        break;
      case 'favorite':
        MyWheelsView.toggleFavorite(id);
        break;
      case 'rename': {
        const wheel = state.wheels.find(w => w.id === id);
        if (!wheel) break;
        state.renameTargetId = id;
        document.getElementById('rename-input').value = wheel.name;
        document.getElementById('rename-overlay').hidden = false;
        document.getElementById('rename-input').focus();
        break;
      }
      case 'delete': {
        const wheel = state.wheels.find(w => w.id === id);
        state.deleteTargetId = id;
        document.getElementById('delete-body').textContent =
          `Delete "${wheel ? wheel.name : 'this wheel'}"? This cannot be undone.`;
        document.getElementById('delete-overlay').hidden = false;
        break;
      }
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   14. CONFETTI
═══════════════════════════════════════════════════════════ */

const Confetti = {
  burst() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    this.clear();

    const colors = [PALETTE.mint, PALETTE.teal, PALETTE.forest, '#fff', '#FFD700'];

    for (let i = 0; i < 48; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        width:  ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        animation-delay:    ${Math.random() * 0.5}s;
        animation-duration: ${0.9 + Math.random() * 0.8}s;
      `;
      container.appendChild(piece);
    }

    // Auto-clear
    setTimeout(() => this.clear(), 2500);
  },

  clear() {
    const container = document.getElementById('confetti-container');
    if (container) container.innerHTML = '';
  },
};

/* ═══════════════════════════════════════════════════════════
   15. TOAST
═══════════════════════════════════════════════════════════ */

const Toast = {
  _timer: null,

  show(message, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.hidden = false;

    // Force reflow so animation re-triggers
    void el.offsetWidth;
    el.classList.add('visible');

    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => { el.hidden = true; }, 320);
    }, duration);
  },
};

/* ═══════════════════════════════════════════════════════════
   16. DRAG & DROP (item reordering)
═══════════════════════════════════════════════════════════ */

const DragDrop = {
  dragSrcIndex: null,

  attachRow(row) {
    row.addEventListener('dragstart', (e) => {
      this.dragSrcIndex = parseInt(row.dataset.index);
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.item-row').forEach(r => r.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.item-row').forEach(r => r.classList.remove('drag-over'));
      row.classList.add('drag-over');
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(row.dataset.index);
      if (this.dragSrcIndex === null || this.dragSrcIndex === targetIndex) return;

      // Reorder items
      const items = state.builder.items;
      const [moved] = items.splice(this.dragSrcIndex, 1);
      items.splice(targetIndex, 0, moved);

      BuilderView.renderItemsList();
      BuilderView.refreshWheel();
      this.dragSrcIndex = null;
    });
  },
};

/* ═══════════════════════════════════════════════════════════
   SOUND FX (Web Audio API)
═══════════════════════════════════════════════════════════ */

const SoundFX = {
  ctx: null,

  getCtx() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return this.ctx;
  },

  playTick() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch(e) {}
  },

  playWin() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.2);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime  + i * 0.12 + 0.25);
      });
    } catch(e) {}
  },
};

/* ═══════════════════════════════════════════════════════════
   17. UTILITIES
═══════════════════════════════════════════════════════════ */

/** Generate a short unique ID */
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Deep clone an object via JSON */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Get value of an input/select by ID */
function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/** Set value of an input/select by ID */
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/** Set checked state of a checkbox */
function setChecked(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = !!checked;
}

/** Truncate a string with ellipsis */
function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/** Add wheel id to recents (most-recent-first, max 10) */
function addToRecents(id) {
  state.recents = [id, ...state.recents.filter(r => r !== id)].slice(0, 10);
  Storage.saveRecents();
}

/** Get the builder canvas element */
function getBuilderCanvas() {
  return document.getElementById('wheel-canvas');
}

/* ═══════════════════════════════════════════════════════════
   18. INIT – Wire up all events and boot the app
═══════════════════════════════════════════════════════════ */

function initEventListeners() {

  // ── Navigation ──────────────────────────────────────────
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.view;
      if (view === 'builder') BuilderView.resetBuilder();
      Router.go(view);
    });
  });

  // "Browse Templates" scroll button on hero
  document.querySelector('[data-scroll="templates"]')?.addEventListener('click', () => {
    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Logo → home
  document.getElementById('logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    Router.go('home');
  });

  // Hamburger menu
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger?.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });
  mobileMenu?.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === 'builder') BuilderView.resetBuilder();
      Router.go(view);
    });
  });

  // ── My Wheels filters & search ────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.wheelFilter = btn.dataset.filter;
      MyWheelsView.applyFilter();
    });
  });

  document.getElementById('wheel-search')?.addEventListener('input', (e) => {
    state.wheelSearch = e.target.value;
    MyWheelsView.applyFilter();
  });

  // ── Builder: form change listeners ───────────────────
  const builderInputs = [
    'wheel-name','wheel-desc','wheel-size','font-family','font-size',
    'border-width','pointer-style','center-style','spin-duration',
    'spin-direction','easing-type','bg-color','bg-grad-from','bg-grad-to',
    'sound-toggle','confetti-toggle',
  ];
  builderInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => BuilderView.refreshWheel());
    document.getElementById(id)?.addEventListener('change', () => BuilderView.refreshWheel());
  });

  // Background type radio
  document.querySelectorAll('input[name="bg-type"]').forEach(r => {
    r.addEventListener('change', () => {
      BuilderView.toggleBgOpts(r.value);
      BuilderView.refreshWheel();
    });
  });

  // Add item button
  document.getElementById('add-item-btn')?.addEventListener('click', () => {
    BuilderView.addItem();
  });

  // Save wheel button
  document.getElementById('save-wheel-btn')?.addEventListener('click', () => {
    BuilderView.saveWheel();
  });

  // Go spin (same as clicking the spin btn)
  document.getElementById('go-spin-btn')?.addEventListener('click', () => {
    SpinEngine.spin();
  });

  // Spin button (canvas centre)
  document.getElementById('spin-btn')?.addEventListener('click', () => {
    SpinEngine.spin();
  });

  // ── Result modal ──────────────────────────────────────
  document.getElementById('spin-again-btn')?.addEventListener('click', () => {
    ResultModal.spinAgain();
  });
  document.getElementById('remove-winner-btn')?.addEventListener('click', () => {
    ResultModal.removeAndSpin();
  });
  document.getElementById('close-result-btn')?.addEventListener('click', () => {
    ResultModal.hide();
  });
  // Close on overlay click
  document.getElementById('result-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) ResultModal.hide();
  });

  // ── Item editor modal ─────────────────────────────────
  document.getElementById('save-item-btn')?.addEventListener('click', () => ItemEditor.save());
  document.getElementById('cancel-item-btn')?.addEventListener('click', () => ItemEditor.close());
  document.getElementById('item-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) ItemEditor.close();
  });
  // Enter key in item modal
  document.getElementById('item-text-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ItemEditor.save();
  });

  // ── Context menu ──────────────────────────────────────
  document.querySelectorAll('.ctx-btn').forEach(btn => {
    btn.addEventListener('click', () => ContextMenu.handle(btn.dataset.action));
  });
  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    if (!document.getElementById('context-menu').contains(e.target)) {
      ContextMenu.close();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ContextMenu.close();
      ResultModal.hide();
      ItemEditor.close();
      document.getElementById('rename-overlay').hidden = true;
      document.getElementById('delete-overlay').hidden = true;
    }
  });

  // ── Rename modal ──────────────────────────────────────
  document.getElementById('confirm-rename-btn')?.addEventListener('click', () => {
    const newName = document.getElementById('rename-input').value.trim();
    if (newName && state.renameTargetId) {
      MyWheelsView.renameWheel(state.renameTargetId, newName);
    }
    document.getElementById('rename-overlay').hidden = true;
    state.renameTargetId = null;
  });
  document.getElementById('cancel-rename-btn')?.addEventListener('click', () => {
    document.getElementById('rename-overlay').hidden = true;
  });
  document.getElementById('rename-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('rename-overlay').hidden = true;
  });
  document.getElementById('rename-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('confirm-rename-btn').click();
  });

  // ── Delete modal ──────────────────────────────────────
  document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    if (state.deleteTargetId) {
      MyWheelsView.deleteWheel(state.deleteTargetId);
    }
    document.getElementById('delete-overlay').hidden = true;
    state.deleteTargetId = null;
  });
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
    document.getElementById('delete-overlay').hidden = true;
  });
  document.getElementById('delete-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('delete-overlay').hidden = true;
  });

  // ── Keyboard: spin with Space on builder view ─────────
  document.addEventListener('keydown', (e) => {
    if (
      e.code === 'Space' &&
      state.currentView === 'builder' &&
      document.activeElement.tagName !== 'INPUT' &&
      document.activeElement.tagName !== 'TEXTAREA' &&
      document.activeElement.tagName !== 'SELECT' &&
      !document.getElementById('result-overlay').hidden === false
    ) {
      e.preventDefault();
      SpinEngine.spin();
    }
  });
}

/** Seed a few template-based saved wheels so "My Wheels" isn't empty on first load */
function seedDefaultWheels() {
  if (state.wheels.length > 0) return; // already have wheels

  const seeds = ['tpl-food', 'tpl-movie', 'tpl-prize'];
  seeds.forEach((tplId, i) => {
    const tpl = TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    const now = Date.now() - i * 1000;
    state.wheels.push({
      id:         generateId(),
      name:       tpl.name,
      desc:       tpl.desc,
      items:      tpl.items.map(it => ({ ...it, id: generateId() })),
      isTemplate: true,
      favorite:   false,
      createdAt:  now,
      updatedAt:  now,
      settings: {
        size: 420, fontFamily: 'system-ui', fontSize: 14,
        borderWidth: 2, pointerStyle: 'arrow', centerStyle: 'circle',
        spinDuration: 5000, spinDirection: 'cw', easingType: 'ease-out',
        soundOn: true, confettiOn: true,
        bgType: 'solid', bgColor: '#F5F5E8', bgGradFrom: '#D4E8A0', bgGradTo: '#5BB88A',
      },
    });
  });
  Storage.saveWheels();
}

/** Boot the application */
function boot() {
  Storage.load();
  seedDefaultWheels();
  initEventListeners();
  HeroWheel.init();
  Router.go('home');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
