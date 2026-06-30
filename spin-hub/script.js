/**
 * SpinHub - script.js
 * Sections:
 *  1. Constants & State
 *  2. Local Storage
 *  3. Template Data (SVG icons, no em-dashes)
 *  4. Router
 *  5. Scroll / Floating Nav
 *  6. Hero Wheel
 *  7. Home View
 *  8. My Wheels View
 *  9. Builder View
 * 10. Wheel Renderer
 * 11. Spin Engine
 * 12. Result Modal
 * 13. Item Editor Modal
 * 14. Context Menu
 * 15. Confetti
 * 16. Toast
 * 17. Drag and Drop
 * 18. Sound FX
 * 19. Utilities
 * 20. Init
 */

/* ============================================================
   1. CONSTANTS & STATE
============================================================ */
const STORAGE_KEYS = {
  WHEELS:  'spinHub_wheels',
  RECENTS: 'spinHub_recents',
  PREFS:   'spinHub_prefs',
};

const PALETTE = {
  bg:     '#F5F5E8',
  surface:'#EEF4DC',
  mint:   '#D4E8A0',
  teal:   '#5BB88A',
  forest: '#1E8A3C',
  text:   '#1A2B1F',
};

const SEGMENT_COLORS = [
  '#5BB88A','#1E8A3C','#8FD1B0','#3CA86A',
  '#A8C888','#6DCFA0','#2E9E50','#B8E4C8',
  '#4EB87A','#74C494','#C6DFA8','#D4E8A0',
];

const state = {
  currentView:      'home',
  wheels:           [],
  recents:          [],
  prefs:            {},
  wheelFilter:      'all',
  wheelSearch:      '',
  ctxTargetId:      null,
  deleteTargetId:   null,
  renameTargetId:   null,
  editingItemIndex: null,
  builder: {
    id:    null,
    name:  'My Wheel',
    desc:  '',
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
  },
  spin: {
    isSpinning:   false,
    currentAngle: 0,
    animFrameId:  null,
  },
};

/* ============================================================
   2. LOCAL STORAGE
============================================================ */
const Storage = {
  load() {
    try {
      state.wheels  = JSON.parse(localStorage.getItem(STORAGE_KEYS.WHEELS))  || [];
      state.recents = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTS)) || [];
      state.prefs   = JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFS))   || {};
    } catch(e) {
      state.wheels = []; state.recents = []; state.prefs = {};
    }
  },
  saveWheels()  { localStorage.setItem(STORAGE_KEYS.WHEELS,  JSON.stringify(state.wheels));  },
  saveRecents() { localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(state.recents)); },
};

/* ============================================================
   3. TEMPLATE DATA
   SVG icons inline - no emoji icons on cards
============================================================ */

/* Each template has an svgIcon string rendered in the card icon wrap */
const TPL_ICONS = {
  food: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="#1E8A3C" stroke-width="1.8"/><path d="M8 10c1-2 4-2 4 0s3 2 4 0" stroke="#5BB88A" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="14" r="1.2" fill="#5BB88A"/><circle cx="14" cy="14" r="1.2" fill="#1E8A3C"/><circle cx="12" cy="12" r="1" fill="#3CA86A"/></svg>`,
  movie: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#1E8A3C" stroke-width="1.8"/><path d="M3 9h18M3 15h18M9 5v14M15 5v14" stroke="#5BB88A" stroke-width="1.3"/></svg>`,
  study: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v14H4z" stroke="#1E8A3C" stroke-width="1.8" rx="1"/><path d="M8 10h8M8 13h5" stroke="#5BB88A" stroke-width="1.5" stroke-linecap="round"/><path d="M4 4l8-2 8 2" stroke="#3CA86A" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  team: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="#1E8A3C" stroke-width="1.7"/><circle cx="15" cy="8" r="3" stroke="#5BB88A" stroke-width="1.7"/><path d="M3 19c0-3 2.7-5 6-5h6c3.3 0 6 2 6 5" stroke="#1E8A3C" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  prize: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 3h8v9c0 4-2 6-4 6s-4-2-4-6V3z" stroke="#1E8A3C" stroke-width="1.7"/><path d="M8 7H4v3c0 2.5 2 4 4 4" stroke="#5BB88A" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M16 7h4v3c0 2.5-2 4-4 4" stroke="#5BB88A" stroke-width="1.6" stroke-linecap="round" fill="none"/><rect x="10" y="18" width="4" height="3" rx="0.5" fill="#5BB88A"/><rect x="7" y="21" width="10" height="2.5" rx="1" fill="#1E8A3C"/></svg>`,
  truth: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1E8A3C" stroke-width="1.8"/><path d="M9 10.5c0-1.5 1.3-3 3-3s3 1.5 3 3c0 1.5-1.5 2.5-3 2.5" stroke="#5BB88A" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="#1E8A3C"/></svg>`,
  workout: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="5" r="2" stroke="#1E8A3C" stroke-width="1.6"/><path d="M9 7v6l3 4" stroke="#1E8A3C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10l3 1 4-1" stroke="#5BB88A" stroke-width="1.5" stroke-linecap="round"/><path d="M12 11l4-2" stroke="#3CA86A" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  game: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="12" rx="4" stroke="#1E8A3C" stroke-width="1.7"/><path d="M9 11v4M7 13h4" stroke="#5BB88A" stroke-width="1.6" stroke-linecap="round"/><circle cx="15" cy="11.5" r="1" fill="#5BB88A"/><circle cx="17" cy="13.5" r="1" fill="#1E8A3C"/></svg>`,
  number: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><text x="4" y="17" font-size="13" font-weight="700" fill="#1E8A3C" font-family="system-ui">1</text><text x="12" y="17" font-size="13" font-weight="700" fill="#5BB88A" font-family="system-ui">2</text><circle cx="12" cy="12" r="9" stroke="#C6DFA8" stroke-width="1.5" stroke-dasharray="4 2"/></svg>`,
  country: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1E8A3C" stroke-width="1.7"/><path d="M3 12h18M12 3c-3 3-3 13 0 18M12 3c3 3 3 13 0 18" stroke="#5BB88A" stroke-width="1.3"/></svg>`,
  decision: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v8m0 0l-3-3m3 3l3-3" stroke="#1E8A3C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="5" y="14" width="6" height="6" rx="1.5" fill="#5BB88A"/><rect x="13" y="14" width="6" height="6" rx="1.5" fill="#D4E8A0" stroke="#5BB88A" stroke-width="1.3"/></svg>`,
  custom: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#5BB88A" stroke-width="1.7" stroke-dasharray="3 2"/><line x1="12" y1="7" x2="12" y2="17" stroke="#1E8A3C" stroke-width="2" stroke-linecap="round"/><line x1="7" y1="12" x2="17" y2="12" stroke="#1E8A3C" stroke-width="2" stroke-linecap="round"/></svg>`,
};

const TEMPLATES = [
  {
    id:'tpl-food', name:'Food Picker', category:'Lifestyle',
    desc:'Cannot decide where to eat? Let the wheel choose.',
    svgIcon: TPL_ICONS.food,
    items:[
      {text:'Pizza',      color:'#5BB88A',weight:1},
      {text:'Sushi',      color:'#1E8A3C',weight:1},
      {text:'Tacos',      color:'#D4E8A0',weight:1},
      {text:'Burger',     color:'#8FD1B0',weight:1},
      {text:'Pasta',      color:'#3CA86A',weight:1},
      {text:'Salad',      color:'#A8C888',weight:1},
      {text:'Ramen',      color:'#6DCFA0',weight:1},
      {text:'Curry',      color:'#2E9E50',weight:1},
    ],
  },
  {
    id:'tpl-movie', name:'Movie Picker', category:'Fun',
    desc:'Pick a genre for movie night.',
    svgIcon: TPL_ICONS.movie,
    items:[
      {text:'Action',   color:'#5BB88A',weight:1},
      {text:'Comedy',   color:'#1E8A3C',weight:1},
      {text:'Horror',   color:'#D4E8A0',weight:1},
      {text:'Romance',  color:'#8FD1B0',weight:1},
      {text:'Sci-Fi',   color:'#3CA86A',weight:1},
      {text:'Thriller', color:'#A8C888',weight:1},
      {text:'Drama',    color:'#6DCFA0',weight:1},
      {text:'Anime',    color:'#2E9E50',weight:1},
    ],
  },
  {
    id:'tpl-study', name:'Study Spinner', category:'Education',
    desc:'Rotate through subjects to keep revision fresh.',
    svgIcon: TPL_ICONS.study,
    items:[
      {text:'Maths',     color:'#5BB88A',weight:1},
      {text:'Science',   color:'#1E8A3C',weight:1},
      {text:'History',   color:'#D4E8A0',weight:1},
      {text:'English',   color:'#8FD1B0',weight:1},
      {text:'Geography', color:'#3CA86A',weight:1},
      {text:'Art',       color:'#A8C888',weight:1},
    ],
  },
  {
    id:'tpl-team', name:'Team Picker', category:'Events',
    desc:'Randomly assign members to roles or tasks.',
    svgIcon: TPL_ICONS.team,
    items:[
      {text:'Team A', color:'#5BB88A',weight:1},
      {text:'Team B', color:'#1E8A3C',weight:1},
      {text:'Team C', color:'#D4E8A0',weight:1},
      {text:'Team D', color:'#8FD1B0',weight:1},
    ],
  },
  {
    id:'tpl-prize', name:'Prize Wheel', category:'Events',
    desc:'Lucky draw for events and giveaways.',
    svgIcon: TPL_ICONS.prize,
    items:[
      {text:'1st Prize', color:'#1E8A3C',weight:1},
      {text:'2nd Prize', color:'#5BB88A',weight:2},
      {text:'3rd Prize', color:'#8FD1B0',weight:3},
      {text:'Try Again', color:'#D4E8A0',weight:6},
      {text:'Free Spin', color:'#A8C888',weight:4},
      {text:'Bonus!',    color:'#3CA86A',weight:2},
    ],
  },
  {
    id:'tpl-truth', name:'Truth or Dare', category:'Fun',
    desc:'Classic party game spinner.',
    svgIcon: TPL_ICONS.truth,
    items:[
      {text:'Truth',    color:'#5BB88A',weight:1},
      {text:'Dare',     color:'#1E8A3C',weight:1},
      {text:'Truth',    color:'#8FD1B0',weight:1},
      {text:'Dare',     color:'#3CA86A',weight:1},
      {text:'Wild Card',color:'#D4E8A0',weight:1},
    ],
  },
  {
    id:'tpl-workout', name:'Workout', category:'Lifestyle',
    desc:'Randomise your exercise routine.',
    svgIcon: TPL_ICONS.workout,
    items:[
      {text:'Push-Ups',      color:'#5BB88A',weight:1},
      {text:'Squats',        color:'#1E8A3C',weight:1},
      {text:'Plank',         color:'#D4E8A0',weight:1},
      {text:'Burpees',       color:'#8FD1B0',weight:1},
      {text:'Jumping Jacks', color:'#3CA86A',weight:1},
      {text:'Run 5 Min',     color:'#A8C888',weight:1},
      {text:'Lunges',        color:'#6DCFA0',weight:1},
    ],
  },
  {
    id:'tpl-game', name:'Game Challenge', category:'Gaming',
    desc:'Spin for your next gaming challenge.',
    svgIcon: TPL_ICONS.game,
    items:[
      {text:'No HUD',         color:'#5BB88A',weight:1},
      {text:'Speed Run',      color:'#1E8A3C',weight:1},
      {text:'No Deaths',      color:'#D4E8A0',weight:1},
      {text:'Low %',          color:'#8FD1B0',weight:1},
      {text:'Max Difficulty', color:'#3CA86A',weight:1},
      {text:'Random Class',   color:'#A8C888',weight:1},
    ],
  },
  {
    id:'tpl-number', name:'Random Number', category:'Fun',
    desc:'Pick a number from 1 to 10.',
    svgIcon: TPL_ICONS.number,
    items: Array.from({length:10},(_,i)=>({
      text:String(i+1), color:SEGMENT_COLORS[i%SEGMENT_COLORS.length], weight:1,
    })),
  },
  {
    id:'tpl-country', name:'Country Picker', category:'Lifestyle',
    desc:'Spin the globe. Where next?',
    svgIcon: TPL_ICONS.country,
    items:[
      {text:'Japan',     color:'#5BB88A',weight:1},
      {text:'Italy',     color:'#1E8A3C',weight:1},
      {text:'Brazil',    color:'#D4E8A0',weight:1},
      {text:'Canada',    color:'#8FD1B0',weight:1},
      {text:'Australia', color:'#3CA86A',weight:1},
      {text:'India',     color:'#A8C888',weight:1},
      {text:'Egypt',     color:'#6DCFA0',weight:1},
      {text:'Mexico',    color:'#2E9E50',weight:1},
    ],
  },
  {
    id:'tpl-decision', name:'Decision Maker', category:'Fun',
    desc:'Yes, No or Maybe. Make up your mind!',
    svgIcon: TPL_ICONS.decision,
    items:[
      {text:'Yes!',        color:'#1E8A3C',weight:2},
      {text:'No',          color:'#5BB88A',weight:2},
      {text:'Maybe',       color:'#D4E8A0',weight:2},
      {text:'Ask again',   color:'#A8C888',weight:1},
      {text:'Definitely!', color:'#3CA86A',weight:1},
    ],
  },
  {
    id:'tpl-custom', name:'Custom Spinner', category:'Custom',
    desc:'Build your own wheel from scratch.',
    svgIcon: TPL_ICONS.custom,
    items:[],
  },
];

/* ============================================================
   4. ROUTER
============================================================ */
const Router = {
  go(view) {
    document.querySelectorAll('.view').forEach(el => { el.hidden = true; });
    const target = document.getElementById('view-' + view);
    if (target) target.hidden = false;

    // Update both navbars
    ['[data-view]'].forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        const isActive = btn.dataset.view === view;
        btn.classList.toggle('active', isActive);
        if (btn.getAttribute('aria-current') !== null) {
          btn.setAttribute('aria-current', isActive ? 'page' : 'false');
        }
      });
    });

    // Close mobile menu
    const mob = document.getElementById('mobile-menu');
    const ham = document.getElementById('hamburger');
    mob.hidden = true;
    ham.setAttribute('aria-expanded', 'false');

    state.currentView = view;

    if (view === 'home')      HomeView.render();
    if (view === 'my-wheels') MyWheelsView.render();
    if (view === 'builder')   BuilderView.render();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};

/* ============================================================
   5. SCROLL / FLOATING NAV
============================================================ */
const FloatingNav = {
  floatEl: null,
  staticHeaderEl: null,
  ticking: false,

  init() {
    this.floatEl       = document.getElementById('floating-nav');
    this.staticHeaderEl = document.getElementById('static-header');
    if (!this.floatEl) return;
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  },

  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const threshold = this.staticHeaderEl ? this.staticHeaderEl.offsetHeight + 20 : 84;
      if (scrollY > threshold) {
        this.floatEl.classList.add('visible');
        this.floatEl.setAttribute('aria-hidden', 'false');
        // Make float buttons focusable
        this.floatEl.querySelectorAll('button, a').forEach(el => el.removeAttribute('tabindex'));
      } else {
        this.floatEl.classList.remove('visible');
        this.floatEl.setAttribute('aria-hidden', 'true');
        // Remove from tab order when hidden
        this.floatEl.querySelectorAll('button, a').forEach(el => el.setAttribute('tabindex', '-1'));
      }
      this.ticking = false;
    });
  },
};

/* ============================================================
   6. HERO WHEEL (decorative, auto-rotating)
============================================================ */
const HeroWheel = {
  canvas: null, ctx: null, angle: 0, raf: null,
  labels: ['Food','Movies','Games','Study','Prize','Workout','Truth','Country'],

  init() {
    this.canvas = document.getElementById('hero-wheel');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.animate();
  },

  draw() {
    const ctx  = this.ctx;
    const size = this.canvas.width;
    const cx   = size / 2;
    const cy   = size / 2;
    const r    = cx - 4;
    const n    = this.labels.length;
    const arc  = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < n; i++) {
      const start = this.angle + i * arc;
      const end   = start + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text label
      const mid = start + arc / 2;
      const tx  = cx + Math.cos(mid) * r * 0.62;
      const ty  = cy + Math.sin(mid) * r * 0.62;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(mid + Math.PI / 2);
      ctx.font = `bold ${size < 200 ? 11 : 13}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText(this.labels[i], 0, 0);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.forest;
    ctx.lineWidth = 5;
    ctx.stroke();

    // Centre
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.forest;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  },

  animate() {
    this.angle += 0.004;
    this.draw();
    this.raf = requestAnimationFrame(() => this.animate());
  },
};

/* ============================================================
   7. HOME VIEW
============================================================ */
const HomeView = {
  render() {
    this.renderTemplateCards();
    this.renderRecents();
  },

  renderTemplateCards() {
    const grid = document.getElementById('template-grid');
    if (!grid) return;
    grid.innerHTML = '';

    TEMPLATES.forEach(tpl => {
      const card = document.createElement('article');
      card.className = 'template-card';
      card.setAttribute('role', 'listitem');
      card.tabIndex = 0;
      card.setAttribute('aria-label', tpl.name + '. ' + tpl.desc);

      card.innerHTML =
        '<div class="card-icon-wrap" aria-hidden="true">' + tpl.svgIcon + '</div>' +
        '<div class="card-category">' + tpl.category + '</div>' +
        '<div class="card-title">' + tpl.name + '</div>' +
        '<div class="card-desc">' + tpl.desc + '</div>' +
        '<button class="card-open-btn" aria-label="Open ' + tpl.name + '">Open</button>';

      const openBtn = card.querySelector('.card-open-btn');

      // FIXED: both the button and card open the template correctly
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTemplate(tpl);
      });
      card.addEventListener('click', (e) => {
        if (e.target === openBtn) return;
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
    if (!section || !grid) return;

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
      chip.setAttribute('aria-label', 'Re-open ' + wheel.name);
      chip.addEventListener('click', () => BuilderView.loadWheel(wheel.id));
      grid.appendChild(chip);
    });
  },

  openTemplate(tpl) {
    if (tpl.id === 'tpl-custom') {
      BuilderView.resetBuilder();
    } else {
      BuilderView.loadFromTemplate(tpl);
    }
    Router.go('builder');
  },
};

/* ============================================================
   8. MY WHEELS VIEW
============================================================ */
const MyWheelsView = {
  render() {
    this.applyFilter();
  },

  applyFilter() {
    let wheels = [...state.wheels];
    if (state.wheelFilter === 'favorites') wheels = wheels.filter(w => w.favorite);
    else if (state.wheelFilter === 'custom')   wheels = wheels.filter(w => !w.isTemplate);
    else if (state.wheelFilter === 'template') wheels = wheels.filter(w =>  w.isTemplate);
    if (state.wheelSearch) {
      const q = state.wheelSearch.toLowerCase();
      wheels = wheels.filter(w => w.name.toLowerCase().includes(q));
    }
    this.renderCards(wheels);
  },

  renderCards(wheels) {
    const grid  = document.getElementById('wheels-grid');
    const empty = document.getElementById('wheels-empty');
    if (!grid || !empty) return;
    grid.innerHTML = '';

    if (wheels.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    wheels.forEach(wheel => grid.appendChild(this.createCard(wheel)));
  },

  createCard(wheel) {
    const card = document.createElement('article');
    card.className = 'wheel-card';
    card.setAttribute('role', 'listitem');
    card.dataset.wheelId = wheel.id;
    card.tabIndex = 0;

    const itemCount = wheel.items ? wheel.items.length : 0;
    const dateStr   = wheel.updatedAt ? new Date(wheel.updatedAt).toLocaleDateString() : '';
    const favSvg    = wheel.favorite
      ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3.5 3.5.3-2.5 2.5.7 3.7L7 9 3.8 11l.7-3.7L2 4.8l3.5-.3L7 1z" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"/></svg>'
      : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3.5 3.5.3-2.5 2.5.7 3.7L7 9 3.8 11l.7-3.7L2 4.8l3.5-.3L7 1z" stroke="#4A6852" stroke-width="1.3" stroke-linejoin="round"/></svg>';

    card.innerHTML =
      '<div class="wheel-card-preview">' +
        '<canvas width="120" height="120" aria-hidden="true"></canvas>' +
        '<button class="wheel-card-more" data-id="' + wheel.id + '" aria-label="More options" title="More options">...</button>' +
        '<button class="wheel-card-fav" data-id="' + wheel.id + '" aria-label="' + (wheel.favorite ? 'Remove from favourites' : 'Add to favourites') + '">' + favSvg + '</button>' +
      '</div>' +
      '<div class="wheel-card-body">' +
        '<div class="wheel-card-name" title="' + wheel.name + '">' + wheel.name + '</div>' +
        '<div class="wheel-card-meta"><span>' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + '</span><span>' + dateStr + '</span></div>' +
      '</div>' +
      '<div class="wheel-card-actions">' +
        '<button class="wca-btn primary" data-id="' + wheel.id + '" data-action="open">Spin</button>' +
        '<button class="wca-btn" data-id="' + wheel.id + '" data-action="edit">Edit</button>' +
      '</div>';

    WheelRenderer.drawMini(card.querySelector('canvas'), wheel.items || [], 56);

    card.querySelector('.wheel-card-fav').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite(wheel.id);
    });
    card.querySelector('.wheel-card-more').addEventListener('click', (e) => {
      e.stopPropagation();
      ContextMenu.open(e, wheel.id);
    });
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.action === 'open') BuilderView.loadWheel(wheel.id);
        if (btn.dataset.action === 'edit') BuilderView.loadWheel(wheel.id, true);
      });
    });
    card.addEventListener('click', () => BuilderView.loadWheel(wheel.id));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') BuilderView.loadWheel(wheel.id); });

    return card;
  },

  toggleFavorite(id) {
    const w = state.wheels.find(w => w.id === id);
    if (!w) return;
    w.favorite = !w.favorite;
    Storage.saveWheels();
    this.render();
    Toast.show(w.favorite ? 'Added to favourites' : 'Removed from favourites');
  },

  deleteWheel(id) {
    state.wheels  = state.wheels.filter(w => w.id !== id);
    state.recents = state.recents.filter(r => r !== id);
    Storage.saveWheels();
    Storage.saveRecents();
    this.render();
    Toast.show('Wheel deleted');
  },

  duplicateWheel(id) {
    const w = state.wheels.find(w => w.id === id);
    if (!w) return;
    const copy = deepClone(w);
    copy.id        = generateId();
    copy.name      = w.name + ' (copy)';
    copy.favorite  = false;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    state.wheels.unshift(copy);
    Storage.saveWheels();
    this.render();
    Toast.show('Wheel duplicated');
  },

  renameWheel(id, newName) {
    const w = state.wheels.find(w => w.id === id);
    if (!w || !newName.trim()) return;
    w.name      = newName.trim();
    w.updatedAt = Date.now();
    Storage.saveWheels();
    this.render();
    Toast.show('Wheel renamed');
  },
};

/* ============================================================
   9. BUILDER VIEW
============================================================ */
const BuilderView = {
  render() {
    this.syncFormFromState();
    this.renderItemsList();
    this.updatePreviewStats();
    WheelRenderer.draw(getBuilderCanvas(), state.builder);
  },

  resetBuilder() {
    state.builder = {
      id: null, name: 'My Wheel', desc: '',
      items: [],
      settings: {
        size:420, fontFamily:'system-ui', fontSize:14, borderWidth:2,
        pointerStyle:'arrow', centerStyle:'circle', spinDuration:5000,
        spinDirection:'cw', easingType:'ease-out', soundOn:true,
        confettiOn:true, bgType:'solid', bgColor:'#F5F5E8',
        bgGradFrom:'#D4E8A0', bgGradTo:'#5BB88A',
      },
    };
    state.spin.currentAngle = 0;
    state.spin.isSpinning   = false;
    const t = document.getElementById('builder-title');
    if (t) t.textContent = 'Build a Wheel';
  },

  loadFromTemplate(tpl) {
    this.resetBuilder();
    state.builder.name  = tpl.name;
    state.builder.desc  = tpl.desc || '';
    state.builder.items = tpl.items.map((item, i) => ({
      id:     generateId(),
      text:   item.text,
      color:  item.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      weight: item.weight || 1,
    }));
    const t = document.getElementById('builder-title');
    if (t) t.textContent = tpl.name;
  },

  loadWheel(id, editMode = false) {
    const wheel = state.wheels.find(w => w.id === id);
    if (!wheel) return;
    state.builder = deepClone(wheel);
    state.builder.id = id;
    state.spin.currentAngle = 0;
    addToRecents(id);
    const t = document.getElementById('builder-title');
    if (t) t.textContent = wheel.name;
    Router.go('builder');
  },

  syncFormFromState() {
    const b = state.builder;
    const s = b.settings;
    setVal('wheel-name',    b.name);
    setVal('wheel-desc',    b.desc);
    setVal('wheel-size',    s.size);
    setVal('font-family',   s.fontFamily);
    setVal('font-size',     s.fontSize);
    setVal('border-width',  s.borderWidth);
    setVal('pointer-style', s.pointerStyle);
    setVal('center-style',  s.centerStyle);
    setVal('spin-duration', s.spinDuration);
    setVal('spin-direction',s.spinDirection);
    setVal('easing-type',   s.easingType);
    setChecked('sound-toggle',    s.soundOn);
    setChecked('confetti-toggle', s.confettiOn);
    setVal('bg-color',     s.bgColor);
    setVal('bg-grad-from', s.bgGradFrom);
    setVal('bg-grad-to',   s.bgGradTo);
    document.querySelectorAll('input[name="bg-type"]').forEach(r => { r.checked = r.value === s.bgType; });
    this.toggleBgOpts(s.bgType);
    this.updatePointerSvg(s.pointerStyle);
    this.resizeCanvas(s.size);
  },

  syncStateFromForm() {
    const s = state.builder.settings;
    state.builder.name  = getVal('wheel-name') || 'My Wheel';
    state.builder.desc  = getVal('wheel-desc');
    s.size              = parseInt(getVal('wheel-size'))      || 420;
    s.fontFamily        = getVal('font-family');
    s.fontSize          = parseInt(getVal('font-size'))       || 14;
    s.borderWidth       = parseInt(getVal('border-width'))    || 0;
    s.pointerStyle      = getVal('pointer-style');
    s.centerStyle       = getVal('center-style');
    s.spinDuration      = parseInt(getVal('spin-duration'))   || 5000;
    s.spinDirection     = getVal('spin-direction');
    s.easingType        = getVal('easing-type');
    s.soundOn           = document.getElementById('sound-toggle').checked;
    s.confettiOn        = document.getElementById('confetti-toggle').checked;
    const bgRadio       = document.querySelector('input[name="bg-type"]:checked');
    s.bgType            = bgRadio ? bgRadio.value : 'solid';
    s.bgColor           = getVal('bg-color');
    s.bgGradFrom        = getVal('bg-grad-from');
    s.bgGradTo          = getVal('bg-grad-to');
  },

  renderItemsList() {
    const list = document.getElementById('items-list');
    if (!list) return;
    list.innerHTML = '';

    state.builder.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.setAttribute('role', 'listitem');
      row.draggable = true;
      row.dataset.index = i;

      const showWeight = item.weight && item.weight > 1;
      const editSvg = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 9L7 3l2 2-6 6H1V9z" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>';
      const dupSvg  = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="4" width="6" height="7" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M4 4V2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9" stroke="currentColor" stroke-width="1.3"/></svg>';
      const delSvg  = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4 4l.5 7M8 4l-.5 7M2 3l.8 8h6.4L10 3H2z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

      row.innerHTML =
        '<span class="item-drag-handle" aria-hidden="true" title="Drag to reorder">:: </span>' +
        '<span class="item-color-dot" style="background:' + item.color + '"></span>' +
        '<span class="item-text" title="' + item.text + '">' + item.text + '</span>' +
        (showWeight ? '<span class="item-weight-badge" title="Weight">x' + item.weight + '</span>' : '') +
        '<div class="item-actions">' +
          '<button class="item-action-btn" data-action="edit" data-index="' + i + '" aria-label="Edit ' + item.text + '" title="Edit">' + editSvg + '</button>' +
          '<button class="item-action-btn" data-action="dup"  data-index="' + i + '" aria-label="Duplicate" title="Duplicate">' + dupSvg + '</button>' +
          '<button class="item-action-btn danger" data-action="del" data-index="' + i + '" aria-label="Delete" title="Delete">' + delSvg + '</button>' +
        '</div>';

      row.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          if (btn.dataset.action === 'edit') ItemEditor.open(idx);
          if (btn.dataset.action === 'dup')  this.duplicateItem(idx);
          if (btn.dataset.action === 'del')  this.deleteItem(idx);
        });
      });

      DragDrop.attachRow(row);
      list.appendChild(row);
    });

    const count = state.builder.items.length;
    const label = count + ' item' + (count !== 1 ? 's' : '');
    const ic  = document.getElementById('item-count');
    const pic = document.getElementById('preview-item-count');
    if (ic)  ic.textContent  = label;
    if (pic) pic.textContent = label;
  },

  duplicateItem(index) {
    const copy = { ...state.builder.items[index], id: generateId() };
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
    const color = SEGMENT_COLORS[state.builder.items.length % SEGMENT_COLORS.length];
    const newItem = { id: generateId(), text: 'Item ' + (state.builder.items.length + 1), color, weight: 1 };
    state.builder.items.push(newItem);
    this.renderItemsList();
    this.refreshWheel();
    const list = document.getElementById('items-list');
    if (list) list.scrollTop = list.scrollHeight;
    ItemEditor.open(state.builder.items.length - 1);
  },

  refreshWheel() {
    this.syncStateFromForm();
    this.updatePointerSvg(state.builder.settings.pointerStyle);
    this.resizeCanvas(state.builder.settings.size);
    WheelRenderer.draw(getBuilderCanvas(), state.builder);
    this.updatePreviewStats();
  },

  updatePreviewStats() {
    const s   = state.builder.settings;
    const dur = (s.spinDuration / 1000) + 's';
    const dir = s.spinDirection === 'cw' ? 'Clockwise' : 'Counter-CW';
    const el  = document.getElementById('preview-spin-info');
    if (el) el.textContent = dur + ' . ' + dir;
  },

  toggleBgOpts(type) {
    const sol = document.getElementById('bg-solid-opts');
    const grd = document.getElementById('bg-gradient-opts');
    if (sol) sol.hidden = type !== 'solid';
    if (grd) grd.hidden = type !== 'gradient';
  },

  resizeCanvas(size) {
    const canvas  = getBuilderCanvas();
    if (!canvas) return;
    const maxSize = Math.min(size, window.innerWidth < 640 ? 280 : 480);
    canvas.width  = maxSize;
    canvas.height = maxSize;
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

  saveWheel() {
    this.syncStateFromForm();
    const b = state.builder;
    if (!b.name.trim()) { Toast.show('Please name your wheel.'); return; }
    if (b.items.length < 2) { Toast.show('Add at least 2 items first.'); return; }

    const now = Date.now();
    const idx = state.wheels.findIndex(w => w.id === b.id);

    if (idx >= 0) {
      state.wheels[idx] = { ...deepClone(b), updatedAt: now };
      Toast.show('Wheel updated!');
    } else {
      const nw = { ...deepClone(b), id: b.id || generateId(), isTemplate:false, favorite:false, createdAt:now, updatedAt:now };
      state.builder.id = nw.id;
      state.wheels.unshift(nw);
      Toast.show('Wheel saved!');
    }

    Storage.saveWheels();
    addToRecents(state.builder.id);
  },
};

/* ============================================================
   10. WHEEL RENDERER
============================================================ */
const WheelRenderer = {
  draw(canvas, builderState, overrideAngle) {
    if (!canvas) return;
    const ctx     = canvas.getContext('2d');
    const size    = canvas.width;
    const cx      = size / 2;
    const cy      = size / 2;
    const r       = cx - 6;
    const items   = builderState.items    || [];
    const s       = builderState.settings || {};
    const angle   = overrideAngle !== undefined ? overrideAngle : state.spin.currentAngle;

    ctx.clearRect(0, 0, size, size);

    // Background fill (circle clip)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (s.bgType === 'gradient') {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, s.bgGradFrom || PALETTE.mint);
      grad.addColorStop(1, s.bgGradTo   || PALETTE.teal);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = s.bgColor || PALETTE.bg;
    }
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    if (items.length === 0) {
      ctx.fillStyle = PALETTE.mint;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = Math.floor(size * 0.048) + 'px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add items to preview', cx, cy);
      return;
    }

    const totalWeight = items.reduce((sum, it) => sum + (it.weight || 1), 0);
    const arcStart    = angle - Math.PI / 2;
    let currentAngle  = arcStart;

    items.forEach((item, i) => {
      const itemW = item.weight || 1;
      const arc   = (itemW / totalWeight) * Math.PI * 2;
      const end   = currentAngle + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, currentAngle, end);
      ctx.closePath();
      ctx.fillStyle = item.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();

      if (s.borderWidth > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth   = s.borderWidth;
        ctx.stroke();
      }

      // Label
      const midAngle = currentAngle + arc / 2;
      const labelR   = r * 0.6;
      const tx       = cx + Math.cos(midAngle) * labelR;
      const ty       = cy + Math.sin(midAngle) * labelR;
      const fontSize = s.fontSize || 14;
      const fontFace = s.fontFamily || 'system-ui';

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.font = 'bold ' + fontSize + 'px ' + fontFace;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#fff';
      ctx.shadowColor  = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur   = 3;
      ctx.fillText(truncate(item.text, 14), 0, 0);
      ctx.restore();

      currentAngle = end;
    });

    // Outer border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = PALETTE.forest;
    ctx.lineWidth   = Math.max(s.borderWidth || 2, 3);
    ctx.stroke();

    // Centre
    if (s.centerStyle !== 'none') {
      const innerR = s.centerStyle === 'dot' ? 10 : 30;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle   = PALETTE.forest;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 3;
      ctx.stroke();
    }
  },

  drawMini(canvas, items, r) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx  = canvas.width  / 2;
    const cy  = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!items || items.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.mint;
      ctx.fill();
      return;
    }

    const totalW = items.reduce((s, it) => s + (it.weight || 1), 0);
    let cur = -Math.PI / 2;

    items.forEach((item, i) => {
      const arc = ((item.weight || 1) / totalW) * Math.PI * 2;
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
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.forest;
    ctx.fill();
  },
};

/* ============================================================
   11. SPIN ENGINE
============================================================ */
const SpinEngine = {
  spin() {
    if (state.spin.isSpinning) return;
    const items = state.builder.items;
    if (items.length < 2) { Toast.show('Add at least 2 items to spin!'); return; }

    const s         = state.builder.settings;
    const duration  = s.spinDuration || 5000;
    const direction = s.spinDirection === 'ccw' ? -1 : 1;
    const winnerIdx = this.pickWeightedRandom(items);
    const winner    = items[winnerIdx];

    const totalWeight = items.reduce((sum, it) => sum + (it.weight || 1), 0);
    let acc = 0;
    let winnerMidFrac = 0;
    for (let i = 0; i <= winnerIdx; i++) {
      const frac = (items[i].weight || 1) / totalWeight;
      if (i < winnerIdx) acc += frac;
      else winnerMidFrac = acc + frac / 2;
    }

    const winnerRad  = winnerMidFrac * Math.PI * 2;
    const extraSpins = (5 + Math.floor(Math.random() * 5)) * Math.PI * 2;
    const targetDelta = direction * (extraSpins + (Math.PI * 2 - winnerRad));
    const startAngle  = state.spin.currentAngle;
    const endAngle    = startAngle + targetDelta;
    const startTime   = performance.now();
    const canvas      = getBuilderCanvas();

    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.disabled = true;
    state.spin.isSpinning = true;

    if (s.soundOn) SoundFX.playTick();

    let lastTickMs = 0;
    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = this.ease(progress, s.easingType || 'ease-out');
      const current  = startAngle + (endAngle - startAngle) * eased;

      state.spin.currentAngle = current;
      WheelRenderer.draw(canvas, state.builder, current);

      if (s.soundOn && elapsed - lastTickMs > 80) {
        SoundFX.playTick();
        lastTickMs = elapsed;
      }

      if (progress < 1) {
        state.spin.animFrameId = requestAnimationFrame(animate);
      } else {
        state.spin.currentAngle = endAngle;
        WheelRenderer.draw(canvas, state.builder, endAngle);
        state.spin.isSpinning = false;
        if (spinBtn) spinBtn.disabled = false;
        if (s.soundOn) SoundFX.playWin();
        this.onSpinEnd(winner, winnerIdx);
      }
    };

    state.spin.animFrameId = requestAnimationFrame(animate);
  },

  pickWeightedRandom(items) {
    const total = items.reduce((s, it) => s + (it.weight || 1), 0);
    let rand = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      rand -= (items[i].weight || 1);
      if (rand <= 0) return i;
    }
    return items.length - 1;
  },

  ease(t, type) {
    switch (type) {
      case 'bounce':
        if (t < 1/2.75) return 7.5625*t*t;
        if (t < 2/2.75) { t-=1.5/2.75; return 7.5625*t*t+0.75; }
        if (t < 2.5/2.75) { t-=2.25/2.75; return 7.5625*t*t+0.9375; }
        t -= 2.625/2.75; return 7.5625*t*t+0.984375;
      case 'elastic': {
        if (t === 0 || t === 1) return t;
        const p = 0.3;
        return Math.pow(2, -10*t) * Math.sin((t - p/4) * (2*Math.PI) / p) + 1;
      }
      default: return 1 - Math.pow(1 - t, 3);
    }
  },

  onSpinEnd(winner, winnerIdx) {
    if (state.builder.settings.confettiOn) Confetti.burst();
    ResultModal.show(winner, winnerIdx);
  },
};

/* ============================================================
   12. RESULT MODAL
============================================================ */
const ResultModal = {
  show(item, index) {
    const overlay = document.getElementById('result-overlay');
    if (!overlay) return;
    document.getElementById('result-title').textContent = item.text;
    document.getElementById('result-sub').textContent   = item.weight && item.weight > 1 ? 'Weight: ' + item.weight : '';
    overlay.hidden = false;
    overlay.dataset.winnerIndex = index;
  },

  hide() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) overlay.hidden = true;
    Confetti.clear();
  },

  spinAgain() { this.hide(); SpinEngine.spin(); },

  removeAndSpin() {
    const idx = parseInt(document.getElementById('result-overlay').dataset.winnerIndex);
    if (!isNaN(idx) && state.builder.items[idx]) {
      state.builder.items.splice(idx, 1);
      BuilderView.renderItemsList();
      WheelRenderer.draw(getBuilderCanvas(), state.builder);
    }
    this.hide();
    if (state.builder.items.length >= 2) SpinEngine.spin();
    else Toast.show('Not enough items left.');
  },
};

/* ============================================================
   13. ITEM EDITOR MODAL
============================================================ */
const ItemEditor = {
  open(index) {
    state.editingItemIndex = index;
    const item = state.builder.items[index];
    if (!item) return;

    const titleEl = document.getElementById('item-modal-title');
    if (titleEl) titleEl.textContent = 'Edit Item';

    const textEl  = document.getElementById('item-text-input');
    const colorEl = document.getElementById('item-color-input');
    const weightEl= document.getElementById('item-weight-input');
    if (textEl)   textEl.value   = item.text  || '';
    if (colorEl)  colorEl.value  = item.color || SEGMENT_COLORS[0];
    if (weightEl) weightEl.value = item.weight || 1;

    const overlay = document.getElementById('item-overlay');
    if (overlay) overlay.hidden = false;
    if (textEl)  textEl.focus();
  },

  save() {
    const idx = state.editingItemIndex;
    if (idx === null || idx === undefined) return;

    const textEl   = document.getElementById('item-text-input');
    const colorEl  = document.getElementById('item-color-input');
    const weightEl = document.getElementById('item-weight-input');

    const text   = textEl   ? textEl.value.trim()                          : '';
    const color  = colorEl  ? colorEl.value                                : SEGMENT_COLORS[0];
    const weight = weightEl ? Math.max(1, parseInt(weightEl.value) || 1)   : 1;

    if (!text) { Toast.show('Please enter a label.'); if (textEl) textEl.focus(); return; }

    state.builder.items[idx] = { ...state.builder.items[idx], text, color, weight };
    this.close();
    BuilderView.renderItemsList();
    BuilderView.refreshWheel();
  },

  close() {
    const overlay = document.getElementById('item-overlay');
    if (overlay) overlay.hidden = true;
    state.editingItemIndex = null;
  },
};

/* ============================================================
   14. CONTEXT MENU
============================================================ */
const ContextMenu = {
  open(event, wheelId) {
    state.ctxTargetId = wheelId;
    const menu = document.getElementById('context-menu');
    if (!menu) return;
    const x = Math.min(event.clientX, window.innerWidth  - 200);
    const y = Math.min(event.clientY, window.innerHeight - 270);
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    menu.hidden = false;

    const wheel  = state.wheels.find(w => w.id === wheelId);
    const favBtn = menu.querySelector('[data-action="favorite"]');
    if (wheel && favBtn) {
      favBtn.childNodes[favBtn.childNodes.length - 1].textContent = wheel.favorite ? ' Unfavourite' : ' Favourite';
    }
    menu.querySelector('.ctx-btn').focus();
  },

  close() {
    const menu = document.getElementById('context-menu');
    if (menu) menu.hidden = true;
    state.ctxTargetId = null;
  },

  handle(action) {
    const id = state.ctxTargetId;
    this.close();
    if (!id) return;
    switch (action) {
      case 'open':      BuilderView.loadWheel(id); break;
      case 'edit':      BuilderView.loadWheel(id, true); break;
      case 'duplicate': MyWheelsView.duplicateWheel(id); break;
      case 'favorite':  MyWheelsView.toggleFavorite(id); break;
      case 'rename': {
        const w = state.wheels.find(w => w.id === id);
        if (!w) break;
        state.renameTargetId = id;
        const ri = document.getElementById('rename-input');
        if (ri) ri.value = w.name;
        const ro = document.getElementById('rename-overlay');
        if (ro) ro.hidden = false;
        if (ri) ri.focus();
        break;
      }
      case 'delete': {
        const w = state.wheels.find(w => w.id === id);
        state.deleteTargetId = id;
        const db = document.getElementById('delete-body');
        if (db) db.textContent = 'Delete "' + (w ? w.name : 'this wheel') + '"? This cannot be undone.';
        const dov = document.getElementById('delete-overlay');
        if (dov) dov.hidden = false;
        break;
      }
    }
  },
};

/* ============================================================
   15. CONFETTI
============================================================ */
const Confetti = {
  burst() {
    const c = document.getElementById('confetti-container');
    if (!c) return;
    this.clear();
    const colors = [PALETTE.mint, PALETTE.teal, PALETTE.forest, '#fff', '#FFD700', '#FF6B6B'];
    for (let i = 0; i < 52; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.cssText =
        'left:' + (Math.random() * 100) + '%;' +
        'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
        'width:' + (6 + Math.random() * 8) + 'px;' +
        'height:' + (6 + Math.random() * 8) + 'px;' +
        'animation-delay:' + (Math.random() * 0.5) + 's;' +
        'animation-duration:' + (0.9 + Math.random() * 0.8) + 's;';
      c.appendChild(p);
    }
    setTimeout(() => this.clear(), 2600);
  },
  clear() {
    const c = document.getElementById('confetti-container');
    if (c) c.innerHTML = '';
  },
};

/* ============================================================
   16. TOAST
============================================================ */
const Toast = {
  _timer: null,
  show(msg, dur = 2800) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('visible');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => { el.hidden = true; }, 330);
    }, dur);
  },
};

/* ============================================================
   17. DRAG AND DROP
============================================================ */
const DragDrop = {
  dragSrcIndex: null,

  attachRow(row) {
    row.addEventListener('dragstart', () => {
      this.dragSrcIndex = parseInt(row.dataset.index);
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      document.querySelectorAll('.item-row').forEach(r => r.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      document.querySelectorAll('.item-row').forEach(r => r.classList.remove('drag-over'));
      row.classList.add('drag-over');
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIdx = parseInt(row.dataset.index);
      if (this.dragSrcIndex === null || this.dragSrcIndex === targetIdx) return;
      const [moved] = state.builder.items.splice(this.dragSrcIndex, 1);
      state.builder.items.splice(targetIdx, 0, moved);
      BuilderView.renderItemsList();
      BuilderView.refreshWheel();
      this.dragSrcIndex = null;
    });
  },
};

/* ============================================================
   18. SOUND FX
============================================================ */
const SoundFX = {
  ctx: null,
  getCtx() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return this.ctx;
  },
  playTick() {
    const ctx = this.getCtx(); if (!ctx) return;
    try {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
    } catch(e) {}
  },
  playWin() {
    const ctx = this.getCtx(); if (!ctx) return;
    try {
      [523,659,784,1047].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.14, ctx.currentTime + i*0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i*0.12 + 0.22);
        osc.start(ctx.currentTime + i*0.12); osc.stop(ctx.currentTime + i*0.12 + 0.25);
      });
    } catch(e) {}
  },
};

/* ============================================================
   19. UTILITIES
============================================================ */
function generateId()    { return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function deepClone(obj)  { return JSON.parse(JSON.stringify(obj)); }
function getVal(id)      { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function setChecked(id, v){ const el = document.getElementById(id); if (el) el.checked = !!v; }
function truncate(str, max){ return str && str.length > max ? str.slice(0, max-1) + '...' : str; }
function getBuilderCanvas(){ return document.getElementById('wheel-canvas'); }
function addToRecents(id) {
  state.recents = [id, ...state.recents.filter(r => r !== id)].slice(0, 10);
  Storage.saveRecents();
}

/* ============================================================
   20. INIT
============================================================ */

function seedDefaultWheels() {
  if (state.wheels.length > 0) return;
  ['tpl-food','tpl-movie','tpl-prize'].forEach((tplId, i) => {
    const tpl = TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    const now = Date.now() - i * 1000;
    state.wheels.push({
      id: generateId(), name: tpl.name, desc: tpl.desc || '',
      items: tpl.items.map(it => ({ ...it, id: generateId() })),
      isTemplate:true, favorite:false, createdAt:now, updatedAt:now,
      settings:{
        size:420, fontFamily:'system-ui', fontSize:14, borderWidth:2,
        pointerStyle:'arrow', centerStyle:'circle', spinDuration:5000,
        spinDirection:'cw', easingType:'ease-out', soundOn:true,
        confettiOn:true, bgType:'solid', bgColor:'#F5F5E8',
        bgGradFrom:'#D4E8A0', bgGradTo:'#5BB88A',
      },
    });
  });
  Storage.saveWheels();
}

function initEvents() {

  // Global nav (both static and floating)
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.view;
      if (view === 'builder') BuilderView.resetBuilder();
      Router.go(view);
    });
  });

  // Logo links
  document.getElementById('logo-link')?.addEventListener('click', (e) => { e.preventDefault(); Router.go('home'); });
  document.getElementById('float-logo-link')?.addEventListener('click', (e) => { e.preventDefault(); Router.go('home'); });

  // Scroll to templates
  document.querySelector('[data-scroll="templates"]')?.addEventListener('click', () => {
    document.getElementById('templates')?.scrollIntoView({ behavior:'smooth' });
  });

  // Hamburger
  const ham = document.getElementById('hamburger');
  const mob = document.getElementById('mobile-menu');
  ham?.addEventListener('click', () => {
    const open = ham.getAttribute('aria-expanded') === 'true';
    ham.setAttribute('aria-expanded', String(!open));
    mob.hidden = open;
  });

  // My Wheels filters
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

  // Builder form inputs
  ['wheel-name','wheel-desc','wheel-size','font-family','font-size','border-width',
   'pointer-style','center-style','spin-duration','spin-direction','easing-type',
   'bg-color','bg-grad-from','bg-grad-to','sound-toggle','confetti-toggle'].forEach(id => {
    document.getElementById(id)?.addEventListener('input',  () => BuilderView.refreshWheel());
    document.getElementById(id)?.addEventListener('change', () => BuilderView.refreshWheel());
  });
  document.querySelectorAll('input[name="bg-type"]').forEach(r => {
    r.addEventListener('change', () => { BuilderView.toggleBgOpts(r.value); BuilderView.refreshWheel(); });
  });

  document.getElementById('add-item-btn')?.addEventListener('click',  () => BuilderView.addItem());
  document.getElementById('save-wheel-btn')?.addEventListener('click', () => BuilderView.saveWheel());
  document.getElementById('go-spin-btn')?.addEventListener('click',    () => SpinEngine.spin());
  document.getElementById('spin-btn')?.addEventListener('click',       () => SpinEngine.spin());

  // Result modal
  document.getElementById('spin-again-btn')?.addEventListener('click',  () => ResultModal.spinAgain());
  document.getElementById('remove-winner-btn')?.addEventListener('click',() => ResultModal.removeAndSpin());
  document.getElementById('close-result-btn')?.addEventListener('click', () => ResultModal.hide());
  document.getElementById('result-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) ResultModal.hide(); });

  // Item editor
  document.getElementById('save-item-btn')?.addEventListener('click',    () => ItemEditor.save());
  document.getElementById('cancel-item-btn')?.addEventListener('click',  () => ItemEditor.close());
  document.getElementById('cancel-item-btn-2')?.addEventListener('click',() => ItemEditor.close());
  document.getElementById('item-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) ItemEditor.close(); });
  document.getElementById('item-text-input')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') ItemEditor.save(); });

  // Context menu
  document.querySelectorAll('.ctx-btn').forEach(btn => {
    btn.addEventListener('click', () => ContextMenu.handle(btn.dataset.action));
  });
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    if (menu && !menu.contains(e.target)) ContextMenu.close();
  });

  // Rename modal
  document.getElementById('confirm-rename-btn')?.addEventListener('click', () => {
    const name = document.getElementById('rename-input')?.value?.trim();
    if (name && state.renameTargetId) MyWheelsView.renameWheel(state.renameTargetId, name);
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

  // Delete modal
  document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    if (state.deleteTargetId) MyWheelsView.deleteWheel(state.deleteTargetId);
    document.getElementById('delete-overlay').hidden = true;
    state.deleteTargetId = null;
  });
  document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
    document.getElementById('delete-overlay').hidden = true;
  });
  document.getElementById('delete-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('delete-overlay').hidden = true;
  });

  // Escape key closes all modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ResultModal.hide();
      ItemEditor.close();
      ContextMenu.close();
      ['rename-overlay','delete-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
      });
    }
    // Space to spin in builder view
    if (
      e.code === 'Space' &&
      state.currentView === 'builder' &&
      !['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)
    ) {
      e.preventDefault();
      SpinEngine.spin();
    }
  });
}

function boot() {
  Storage.load();
  seedDefaultWheels();
  FloatingNav.init();
  initEvents();
  HeroWheel.init();
  Router.go('home');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}