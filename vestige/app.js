'use strict';

// ============================================================
//  VESTIGE - app.js
//  A personal time capsule. Capsules live in localStorage.
//  Each one has three states: sealed -> ready -> opened.
// ============================================================

const STORAGE_KEY = 'vestige_v1';

// ---- State ----
let capsules = [];
let activeId  = null;   // capsule currently shown in the read modal

// ---- Boot ----
document.addEventListener('DOMContentLoaded', init);

function init() {
  load();
  setDateConstraints();
  bindUI();
  render();
}

// ---- Persistence ----
function load() {
  try {
    capsules = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    capsules = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
}

// ---- Helpers ----

// Generate a short unique ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Return today's date as YYYY-MM-DD in local time (not UTC, to avoid off-by-one on timezones)
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Capsule state machine
function getStatus(c) {
  if (c.openedAt)             return 'opened';
  if (c.unlockDate <= todayStr()) return 'ready';
  return 'sealed';
}

// Days remaining until a date string (YYYY-MM-DD)
function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const target = new Date(y, mo - 1, d);
  return Math.ceil((target - now) / 86_400_000);
}

// Format a YYYY-MM-DD string into a readable date like "March 4, 2026"
function fmtDate(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day:   'numeric',
    year:  'numeric'
  });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n).trimEnd() + '...' : str;
}

// Inline SVG trash icon reused across all cards
const ICON_TRASH = `
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"></path>
  </svg>`;

// ---- Render ----
function render() {
  const grid  = document.getElementById('capsules-grid');
  const empty = document.getElementById('empty-state');

  if (capsules.length === 0) {
    empty.style.display = 'flex';
    grid.innerHTML      = '';
    return;
  }

  empty.style.display = 'none';

  // Sort: ready first, sealed next (soonest unlock), opened last (most recently opened)
  const order  = { ready: 0, sealed: 1, opened: 2 };
  const sorted = [...capsules].sort((a, b) => {
    const sa = getStatus(a), sb = getStatus(b);
    if (sa !== sb) return order[sa] - order[sb];
    if (sa === 'sealed') return new Date(a.unlockDate) - new Date(b.unlockDate);
    if (sa === 'opened') return new Date(b.openedAt)   - new Date(a.openedAt);
    return 0;
  });

  grid.innerHTML = sorted.map(buildCard).join('');
}

function buildCard(c) {
  const s = getStatus(c);
  if (s === 'sealed') return cardSealed(c);
  if (s === 'ready')  return cardReady(c);
  return cardOpened(c);
}

function cardSealed(c) {
  const days = daysUntil(c.unlockDate);
  const dStr = days === 1 ? '1 day' : `${days} days`;
  return `
    <article class="card card-sealed">
      <div class="card-row">
        <span class="badge badge-sealed">sealed</span>
        <button class="card-del" data-id="${c.id}" data-action="delete" title="Delete capsule">
          ${ICON_TRASH}
        </button>
      </div>
      <h3 class="card-title">${escHtml(c.title)}</h3>
      <p class="card-countdown">Opens in <em class="accent">${dStr}</em></p>
      <p class="card-date">Unlocks ${fmtDate(c.unlockDate)}</p>
      <div class="blur-lines" aria-label="Message preview hidden until unlock date">
        <div class="blur-line" style="width:84%"></div>
        <div class="blur-line" style="width:68%"></div>
        <div class="blur-line" style="width:91%"></div>
        <div class="blur-line" style="width:52%"></div>
      </div>
    </article>`;
}

function cardReady(c) {
  return `
    <article class="card card-ready">
      <div class="card-row">
        <span class="badge badge-ready">ready</span>
        <button class="card-del" data-id="${c.id}" data-action="delete" title="Delete capsule">
          ${ICON_TRASH}
        </button>
      </div>
      <h3 class="card-title">${escHtml(c.title)}</h3>
      <p class="card-countdown">Ready to be <em class="accent">opened</em></p>
      <p class="card-date">Sealed ${fmtDate(c.createdAt)}</p>
      <button class="btn-open" data-id="${c.id}" data-action="open">
        Open Your Capsule
      </button>
    </article>`;
}

function cardOpened(c) {
  return `
    <article class="card card-opened">
      <div class="card-row">
        <span class="badge badge-opened">opened</span>
        <button class="card-del" data-id="${c.id}" data-action="delete" title="Delete capsule">
          ${ICON_TRASH}
        </button>
      </div>
      <h3 class="card-title">${escHtml(c.title)}</h3>
      <p class="card-countdown">Opened <em class="accent">${fmtDate(c.openedAt)}</em></p>
      <p class="card-preview">${escHtml(truncate(c.message, 88))}</p>
      <button class="btn-reread" data-id="${c.id}" data-action="reread">Read again</button>
    </article>`;
}

// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showCreate() {
  openModal('overlay-create');
  // slight delay lets the animation settle before focusing
  setTimeout(() => document.getElementById('f-title').focus(), 80);
}

function hideCreate() {
  closeModal('overlay-create');
  document.getElementById('f-title').value   = '';
  document.getElementById('f-message').value = '';
  document.getElementById('f-date').value    = '';
  document.getElementById('f-date-label').textContent = '';
}

function showRead(id) {
  const c = capsules.find(x => x.id === id);
  if (!c) return;

  activeId = id;
  document.getElementById('read-meta-date').textContent =
    'Opened ' + fmtDate(c.openedAt);
  document.getElementById('read-title').textContent = c.title;
  // Preserve line breaks written in the message
  document.getElementById('read-body').innerHTML =
    escHtml(c.message).replace(/\n/g, '<br>');

  openModal('overlay-read');
}

function hideRead() {
  closeModal('overlay-read');
  activeId = null;
}

// ---- Actions ----
function sealCapsule() {
  const title      = document.getElementById('f-title').value.trim();
  const message    = document.getElementById('f-message').value.trim();
  const unlockDate = document.getElementById('f-date').value;

  // Basic validation -- prefer focus over alert dialogs
  if (!title) {
    document.getElementById('f-title').focus();
    document.getElementById('f-title').style.borderColor = '#d36a30';
    setTimeout(() => {
      document.getElementById('f-title').style.borderColor = '';
    }, 1800);
    return;
  }

  if (!message) {
    document.getElementById('f-message').focus();
    document.getElementById('f-message').style.borderColor = '#d36a30';
    setTimeout(() => {
      document.getElementById('f-message').style.borderColor = '';
    }, 1800);
    return;
  }

  if (!unlockDate) {
    document.getElementById('f-date').focus();
    return;
  }

  if (unlockDate <= todayStr()) {
    document.getElementById('f-date-label').textContent =
      'Pick a date in the future.';
    return;
  }

  const capsule = {
    id:          uid(),
    title,
    message,
    createdAt:   todayStr(),
    unlockDate,
    openedAt:    null
  };

  capsules.unshift(capsule);
  save();
  hideCreate();
  render();
}

function openCapsule(id) {
  const c = capsules.find(x => x.id === id);
  if (!c) return;

  c.openedAt = todayStr();
  save();
  render();

  // Let the DOM update before opening the read modal
  requestAnimationFrame(() => showRead(id));
}

function deleteCapsule(id) {
  if (!confirm('Delete this capsule? This cannot be undone.')) return;
  capsules = capsules.filter(x => x.id !== id);
  save();
  render();
}

function deleteFromReadModal() {
  if (!activeId) return;
  if (!confirm('Delete this capsule? This cannot be undone.')) return;
  capsules = capsules.filter(x => x.id !== activeId);
  save();
  hideRead();
  render();
}

// ---- Event binding ----
function bindUI() {

  // "New Capsule" buttons (header + hero)
  document.getElementById('btn-new').addEventListener('click', showCreate);
  document.getElementById('btn-hero').addEventListener('click', showCreate);

  // Modal close buttons
  document.getElementById('close-create').addEventListener('click', hideCreate);
  document.getElementById('close-read').addEventListener('click', hideRead);

  // Clicking the backdrop closes the modal
  document.getElementById('overlay-create').addEventListener('click', e => {
    if (e.target === e.currentTarget) hideCreate();
  });
  document.getElementById('overlay-read').addEventListener('click', e => {
    if (e.target === e.currentTarget) hideRead();
  });

  // Escape key closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('overlay-create').classList.contains('open')) hideCreate();
    if (document.getElementById('overlay-read').classList.contains('open'))   hideRead();
  });

  // Quick-pick date buttons
  document.querySelectorAll('.qdates-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const months = parseInt(btn.dataset.months, 10);
      const d      = new Date();
      d.setMonth(d.getMonth() + months);
      const y   = d.getFullYear();
      const mo  = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      document.getElementById('f-date').value =
        `${y}-${mo}-${day}`;
      document.getElementById('f-date-label').textContent =
        'Unlocks ' + fmtDate(`${y}-${mo}-${day}`);
    });
  });

  // Show a friendly label when user picks a date manually
  document.getElementById('f-date').addEventListener('change', e => {
    const val = e.target.value;
    document.getElementById('f-date-label').textContent =
      val ? 'Unlocks ' + fmtDate(val) : '';
  });

  // Enter in the title field moves focus to the message
  document.getElementById('f-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('f-message').focus();
    }
  });

  // Seal button
  document.getElementById('btn-seal').addEventListener('click', sealCapsule);

  // Delete from the read modal
  document.getElementById('btn-delete-modal').addEventListener('click', deleteFromReadModal);

  // Event delegation for the capsule grid (open, reread, delete)
  document.getElementById('capsules-grid').addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    const { id, action } = el.dataset;
    if (action === 'delete') deleteCapsule(id);
    if (action === 'open')   openCapsule(id);
    if (action === 'reread') showRead(id);
  });
}

// ---- Date input constraints ----
function setDateConstraints() {
  // Minimum date is tomorrow so capsules always have at least one day sealed
  const d   = new Date();
  d.setDate(d.getDate() + 1);
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  document.getElementById('f-date').min = `${y}-${m}-${day}`;
}
