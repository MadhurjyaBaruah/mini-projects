// Verdant - Plant Care Journal
// vanilla JS, no frameworks, localStorage for persistence


// =====================================================================
//  CONFIG
// =====================================================================

const PLANT_TYPES = {
    succulent: { label: 'Succulent',    interval: 14 },
    snake:     { label: 'Snake Plant',  interval: 10 },
    pothos:    { label: 'Pothos',       interval: 7  },
    cactus:    { label: 'Cactus',       interval: 21 },
    monstera:  { label: 'Monstera',     interval: 7  },
    herb:      { label: 'Herb',         interval: 3  },
};

// ratio of watering interval at which each health level kicks in
const THRESHOLDS = { thriving: 0.30, good: 0.65, thirsty: 1.0 };

// background tint for the card illustration area, keyed by health
const ILLUS_BG = {
    thriving: '#d8f0a8',
    good:     '#E4F1AF',
    thirsty:  '#edefc4',
    critical: '#ede8d4',
};


// =====================================================================
//  COLOR PALETTES FOR SVG PLANTS (keyed by health level)
// =====================================================================

function plantColors(health) {
    const map = {
        thriving: { p: '#108B4F', s: '#5DB996', h: '#E4F1AF', stem: '#0b6e3c' },
        good:     { p: '#1a9858', s: '#66c4a0', h: '#e6f4d0', stem: '#127840' },
        thirsty:  { p: '#6a8c78', s: '#98bca8', h: '#e8f0d8', stem: '#558068' },
        critical: { p: '#a0b8a8', s: '#c0d4c4', h: '#f0f4ee', stem: '#8aa898' },
    };
    return map[health] || map.good;
}


// =====================================================================
//  SVG PLANT ILLUSTRATIONS
//  Each plant uses viewBox="0 0 120 160"
//  Pot occupies roughly y=112-150, plant fills above
// =====================================================================

function svgPot() {
    return `
        <path d="M30 116 Q30 147 40 150 L80 150 Q90 147 90 116 Z" fill="#C9B38A"/>
        <ellipse cx="60" cy="116" rx="30" ry="5.5" fill="#D8C8A4"/>
        <ellipse cx="60" cy="114" rx="26" ry="4" fill="#8C7050"/>
        <path d="M41 149 Q60 153 79 149" stroke="#B59670" stroke-width="1.5" fill="none"/>
    `;
}

// rosette succulent viewed from a 3/4 angle
function svgSucculent(c) {
    const outer = [];
    const mid   = [];
    for (let i = 0; i < 8; i++) {
        outer.push(`<ellipse cx="0" cy="-25" rx="8" ry="21" fill="${c.p}" transform="rotate(${i * 45})"/>`);
    }
    for (let i = 0; i < 8; i++) {
        mid.push(`<ellipse cx="0" cy="-16" rx="6.5" ry="13" fill="${c.s}" transform="rotate(${i * 45 + 22.5})"/>`);
    }
    return `
        <g transform="translate(60, 90)">
            ${outer.join('')}
            ${mid.join('')}
            <circle r="10" fill="${c.p}"/>
            <circle r="4.5" fill="${c.h}"/>
        </g>
    `;
}

// three upright leaves with a central stripe
function svgSnake(c) {
    return `
        <g>
            <path d="M68 112 Q64 72 70 26 Q73 16 77 26 Q80 72 74 112 Z" fill="${c.stem}"/>
            <path d="M43 112 Q39 75 44 36 Q47 26 50 36 Q53 75 50 112 Z" fill="${c.stem}"/>
            <path d="M54 112 Q51 68 56 20 Q59 10 63 20 Q67 68 65 112 Z" fill="${c.p}"/>
            <path d="M57 112 Q55 76 57.5 26 Q59 17 60.5 26 Q62 76 62 112 Z" fill="${c.s}" opacity="0.35"/>
            <path d="M63 112 Q67 70 73 34 Q76 24 79 34 Q82 70 72 112 Z" fill="${c.p}"/>
            <path d="M66 112 Q70 76 74.5 40 Q76.5 32 78 40 Q79 76 72 112 Z" fill="${c.s}" opacity="0.3"/>
        </g>
    `;
}

// trailing plant with heart-ish leaves on curved stems
function svgPothos(c) {
    return `
        <g>
            <path d="M60 112 Q52 94 38 77" stroke="${c.stem}" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M60 112 Q68 90 83 73" stroke="${c.stem}" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M60 112 Q55 88 43 63" stroke="${c.stem}" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M60 112 Q63 86 74 60" stroke="${c.stem}" stroke-width="2" fill="none" stroke-linecap="round"/>
            <path d="M60 112 Q59 88 60 66" stroke="${c.stem}" stroke-width="2" fill="none" stroke-linecap="round"/>

            <path d="M38 77 C28 67 21 71 27 81 C33 91 43 92 45 81 C46 75 41 67 38 77 Z" fill="${c.p}"/>
            <path d="M83 73 C93 63 100 67 94 77 C88 87 78 88 76 77 C75 71 80 63 83 73 Z" fill="${c.s}"/>
            <path d="M43 63 C33 53 26 57 32 67 C38 77 48 78 50 67 C51 61 46 53 43 63 Z" fill="${c.p}"/>
            <path d="M74 60 C84 50 91 54 85 64 C79 74 69 75 67 64 C66 58 71 50 74 60 Z" fill="${c.s}"/>
            <path d="M60 66 C50 56 43 60 49 70 C55 80 65 81 67 70 C68 64 63 56 60 66 Z" fill="${c.p}"/>
        </g>
    `;
}

// column cactus with arms, ribs, and spines
function svgCactus(c) {
    return `
        <g>
            <path d="M44 112 Q41 64 50 28 Q55 16 65 16 Q75 16 70 28 Q79 64 76 112 Z" fill="${c.p}"/>

            <path d="M60 112 Q58 64 60 16" stroke="${c.stem}" stroke-width="1" fill="none" opacity="0.4"/>
            <path d="M52 112 Q50 70 54 30" stroke="${c.stem}" stroke-width="0.8" fill="none" opacity="0.35"/>
            <path d="M68 112 Q70 70 66 30" stroke="${c.stem}" stroke-width="0.8" fill="none" opacity="0.35"/>

            <path d="M50 72 Q34 70 31 54 Q33 44 38 51 Q40 61 48 66 Z" fill="${c.p}"/>
            <path d="M38 51 Q40 58 46 62" stroke="${c.stem}" stroke-width="0.7" fill="none" opacity="0.4"/>

            <path d="M70 68 Q86 66 89 50 Q87 40 82 47 Q80 57 72 61 Z" fill="${c.p}"/>
            <path d="M82 47 Q80 54 74 59" stroke="${c.stem}" stroke-width="0.7" fill="none" opacity="0.4"/>

            <line x1="47" y1="36" x2="40" y2="29" stroke="${c.h}" stroke-width="1.3"/>
            <line x1="47" y1="50" x2="37" y2="45" stroke="${c.h}" stroke-width="1.3"/>
            <line x1="73" y1="36" x2="80" y2="29" stroke="${c.h}" stroke-width="1.3"/>
            <line x1="73" y1="50" x2="83" y2="45" stroke="${c.h}" stroke-width="1.3"/>
            <line x1="60" y1="16" x2="57" y2="7"  stroke="${c.h}" stroke-width="1.3"/>
            <line x1="60" y1="16" x2="63" y2="7"  stroke="${c.h}" stroke-width="1.3"/>
            <line x1="55" y1="19" x2="51" y2="11" stroke="${c.h}" stroke-width="1.3"/>
            <line x1="65" y1="19" x2="69" y2="11" stroke="${c.h}" stroke-width="1.3"/>
        </g>
    `;
}

// big monstera leaf with fenestrations and veins
function svgMonstera(c) {
    return `
        <g>
            <line x1="60" y1="112" x2="60" y2="58" stroke="${c.stem}" stroke-width="3" stroke-linecap="round"/>
            <line x1="60" y1="74" x2="50" y2="58" stroke="${c.stem}" stroke-width="2" stroke-linecap="round"/>

            <path d="M50 58 C27 44 17 64 24 83 C31 102 49 110 59 100
                     C69 110 88 102 94 82 C100 62 88 43 66 48 Q60 50 50 58 Z" fill="${c.p}"/>

            <path d="M37 76 C31 69 31 82 37 82 Z" fill="#FAF6EA"/>
            <path d="M30 92 C24 85 24 98 30 98 Z" fill="#FAF6EA"/>
            <path d="M83 76 C89 69 89 82 83 82 Z" fill="#FAF6EA"/>
            <path d="M90 92 C96 85 96 98 90 98 Z" fill="#FAF6EA"/>

            <path d="M59 100 Q57 78 50 58" stroke="${c.s}" stroke-width="1" fill="none" opacity="0.5"/>
            <path d="M57 82 Q44 76 37 79" stroke="${c.s}" stroke-width="0.8" fill="none" opacity="0.4"/>
            <path d="M57 91 Q44 87 38 92" stroke="${c.s}" stroke-width="0.8" fill="none" opacity="0.4"/>
            <path d="M62 82 Q74 76 83 79" stroke="${c.s}" stroke-width="0.8" fill="none" opacity="0.4"/>
            <path d="M62 91 Q74 87 82 92" stroke="${c.s}" stroke-width="0.8" fill="none" opacity="0.4"/>
        </g>
    `;
}

// herb / basil with paired oval leaves on a central stem
function svgHerb(c) {
    return `
        <g>
            <line x1="60" y1="112" x2="60" y2="26" stroke="${c.stem}" stroke-width="2.5" stroke-linecap="round"/>

            <line x1="60" y1="98" x2="44" y2="88" stroke="${c.stem}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="60" y1="98" x2="76" y2="88" stroke="${c.stem}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="60" y1="78" x2="42" y2="68" stroke="${c.stem}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="60" y1="78" x2="78" y2="68" stroke="${c.stem}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="60" y1="58" x2="45" y2="48" stroke="${c.stem}" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="60" y1="58" x2="75" y2="48" stroke="${c.stem}" stroke-width="1.5" stroke-linecap="round"/>

            <ellipse cx="36" cy="87"  rx="14" ry="9"  fill="${c.p}" transform="rotate(-22, 36, 87)"/>
            <ellipse cx="84" cy="87"  rx="14" ry="9"  fill="${c.s}" transform="rotate(22, 84, 87)"/>
            <ellipse cx="34" cy="67"  rx="13" ry="8.5" fill="${c.p}" transform="rotate(-26, 34, 67)"/>
            <ellipse cx="86" cy="67"  rx="13" ry="8.5" fill="${c.s}" transform="rotate(26, 86, 67)"/>
            <ellipse cx="37" cy="47"  rx="11" ry="7.5" fill="${c.p}" transform="rotate(-20, 37, 47)"/>
            <ellipse cx="83" cy="47"  rx="11" ry="7.5" fill="${c.s}" transform="rotate(20, 83, 47)"/>
            <ellipse cx="53" cy="30"  rx="9"  ry="6"   fill="${c.p}" transform="rotate(-15, 53, 30)"/>
            <ellipse cx="67" cy="28"  rx="9"  ry="6"   fill="${c.s}" transform="rotate(15, 67, 28)"/>
            <ellipse cx="60" cy="20"  rx="7"  ry="5"   fill="${c.p}"/>
        </g>
    `;
}

// dispatcher - returns a full SVG string for a given type and health
function getPlantSVG(type, health, height) {
    const c   = plantColors(health || 'good');
    const pot = svgPot();
    let plant = '';

    switch (type) {
        case 'succulent': plant = svgSucculent(c); break;
        case 'snake':     plant = svgSnake(c);     break;
        case 'pothos':    plant = svgPothos(c);    break;
        case 'cactus':    plant = svgCactus(c);    break;
        case 'monstera':  plant = svgMonstera(c);  break;
        case 'herb':      plant = svgHerb(c);      break;
        default:          plant = svgSucculent(c);
    }

    const h = height || 138;
    return `<svg viewBox="0 0 120 160" height="${h}" xmlns="http://www.w3.org/2000/svg">${pot}${plant}</svg>`;
}


// =====================================================================
//  STORAGE
// =====================================================================

function loadPlants() {
    try {
        return JSON.parse(localStorage.getItem('verdant_plants') || '[]');
    } catch (_) {
        return [];
    }
}

function savePlants(plants) {
    localStorage.setItem('verdant_plants', JSON.stringify(plants));
}

function makeId() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function daysAgoISO(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}


// =====================================================================
//  HEALTH
// =====================================================================

function getHealth(plant) {
    const config = PLANT_TYPES[plant.type] || PLANT_TYPES.succulent;
    const days   = getDaysSince(plant.lastWatered);
    const ratio  = days / config.interval;

    let level, label;
    if      (ratio <= THRESHOLDS.thriving) { level = 'thriving'; label = 'thriving'; }
    else if (ratio <= THRESHOLDS.good)     { level = 'good';     label = 'doing well'; }
    else if (ratio <= THRESHOLDS.thirsty)  { level = 'thirsty';  label = 'needs water'; }
    else                                   { level = 'critical';  label = 'water now'; }

    return { level, label, days, ratio: Math.min(ratio, 1) };
}

function getDaysSince(iso) {
    if (!iso) return 999;
    const then  = new Date(iso + 'T00:00:00');
    const today = new Date();
    then.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.floor((today - then) / 86400000);
}

function formatDays(days) {
    if (days === 0) return 'watered today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
}

function formatDate(iso) {
    if (!iso) return 'unknown';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


// =====================================================================
//  RENDER - main grid
// =====================================================================

function renderAll() {
    const plants = loadPlants();

    const emptyState = document.getElementById('emptyState');
    const grid       = document.getElementById('plantGrid');
    const statsBar   = document.getElementById('statsBar');

    if (plants.length === 0) {
        emptyState.classList.remove('hidden');
        grid.classList.add('hidden');
        statsBar.classList.remove('visible');
        return;
    }

    emptyState.classList.add('hidden');
    grid.classList.remove('hidden');
    statsBar.classList.add('visible');

    // sort: critical first, then thirsty, then good, then thriving
    const order = { critical: 0, thirsty: 1, good: 2, thriving: 3 };
    const sorted = [...plants].sort((a, b) => {
        return (order[getHealth(a).level] || 0) - (order[getHealth(b).level] || 0);
    });

    grid.innerHTML = '';
    sorted.forEach(p => grid.appendChild(buildCard(p)));

    renderStats(plants);
}

function renderStats(plants) {
    const today   = todayISO();
    let needWater = 0;
    let watered   = 0;

    plants.forEach(p => {
        const h = getHealth(p);
        if (h.level === 'critical' || h.level === 'thirsty') needWater++;
        if (p.lastWatered === today) watered++;
    });

    document.getElementById('statTotal').textContent    = plants.length;
    document.getElementById('statNeedWater').textContent = needWater;
    document.getElementById('statWatered').textContent  = watered;
}

function buildCard(plant) {
    const health     = getHealth(plant);
    const bg         = ILLUS_BG[health.level];
    const svg        = getPlantSVG(plant.type, health.level, 138);
    const alreadyWatered = plant.lastWatered === todayISO();

    const card = document.createElement('div');
    card.className   = 'plant-card';
    card.dataset.id  = plant.id;

    card.innerHTML = `
        <div class="status-dot dot-${health.level}"></div>
        <div class="card-illustration" style="background:${bg}">${svg}</div>
        <div class="card-body">
            <div>
                <div class="card-name">${esc(plant.name)}</div>
                ${plant.species ? `<div class="card-species">${esc(plant.species)}</div>` : ''}
            </div>
            <div class="card-row">
                <span class="badge badge-${health.level}">${health.label}</span>
                <span class="card-days">${formatDays(health.days)}</span>
            </div>
            <button class="btn-water" data-action="water" data-id="${plant.id}"
                ${alreadyWatered ? 'disabled' : ''}>
                ${alreadyWatered ? 'Watered today' : 'Water now'}
            </button>
        </div>
    `;

    // open detail on card click (not on the water button)
    card.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="water"]')) return;
        openDetail(plant.id);
    });

    return card;
}


// =====================================================================
//  WATER PLANT
// =====================================================================

function waterPlant(id) {
    const plants = loadPlants();
    const plant  = plants.find(p => p.id === id);
    if (!plant) return;

    const today = todayISO();
    if (plant.lastWatered === today) return; // already done

    plant.lastWatered = today;
    if (!plant.waterHistory.includes(today)) {
        plant.waterHistory = [today, ...plant.waterHistory];
    }

    savePlants(plants);
    showToast(`${plant.name} watered`);
    renderAll();
}


// =====================================================================
//  ADD PLANT MODAL
// =====================================================================

let selectedType = 'succulent';

function openAdd() {
    selectedType = 'succulent';

    const grid = document.getElementById('typeGrid');
    grid.innerHTML = '';

    Object.entries(PLANT_TYPES).forEach(([key, val]) => {
        const btn = document.createElement('button');
        btn.className       = 'type-btn' + (key === 'succulent' ? ' selected' : '');
        btn.dataset.type    = key;
        // using 'good' health for the selector previews
        btn.innerHTML = `
            ${getPlantSVG(key, 'good', 60)}
            <div class="type-btn-label">${val.label}</div>
        `;
        btn.addEventListener('click', () => {
            grid.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedType = key;
        });
        grid.appendChild(btn);
    });

    document.getElementById('inputName').value        = '';
    document.getElementById('inputSpecies').value     = '';
    document.getElementById('inputLastWatered').value = todayISO();
    document.getElementById('inputName').classList.remove('error');

    document.getElementById('addModalBackdrop').classList.add('open');
    setTimeout(() => document.getElementById('inputName').focus(), 60);
}

function closeAdd() {
    document.getElementById('addModalBackdrop').classList.remove('open');
}

function submitAdd() {
    const name = document.getElementById('inputName').value.trim();
    if (!name) {
        document.getElementById('inputName').classList.add('error');
        document.getElementById('inputName').focus();
        return;
    }
    document.getElementById('inputName').classList.remove('error');

    const today     = todayISO();
    let lastWatered = document.getElementById('inputLastWatered').value || today;
    // clamp future dates to today
    if (lastWatered > today) lastWatered = today;

    const plants = loadPlants();
    plants.push({
        id:           makeId(),
        name:         name,
        species:      document.getElementById('inputSpecies').value.trim(),
        type:         selectedType,
        addedDate:    today,
        lastWatered:  lastWatered,
        waterHistory: [lastWatered],
        notes:        '',
    });

    savePlants(plants);
    closeAdd();
    renderAll();
    showToast(`${name} added`);
}


// =====================================================================
//  DETAIL MODAL
// =====================================================================

let currentDetailId = null;

function openDetail(id) {
    const plants = loadPlants();
    const plant  = plants.find(p => p.id === id);
    if (!plant) return;

    currentDetailId  = id;
    const health     = getHealth(plant);
    const config     = PLANT_TYPES[plant.type] || PLANT_TYPES.succulent;
    const healthPct  = Math.round((1 - health.ratio) * 100);
    const barColor   = health.level === 'critical' ? '#C04A30'
                     : health.level === 'thirsty'  ? '#8ab830'
                     : '#108B4F';

    const alreadyWatered = plant.lastWatered === todayISO();

    const historyHTML = plant.waterHistory.length
        ? plant.waterHistory.slice(0, 12).map(d =>
            `<div class="history-row">
                <div class="history-pip"></div>
                <span>${formatDate(d)}</span>
             </div>`
          ).join('')
        : `<span style="font-size:0.8rem;color:var(--muted)">No history recorded.</span>`;

    document.getElementById('detailContent').innerHTML = `
        <div class="detail-top">
            <div class="detail-svg-wrap" style="background:${ILLUS_BG[health.level]}">
                ${getPlantSVG(plant.type, health.level, 128)}
            </div>
            <div class="detail-info">
                <div class="detail-name">${esc(plant.name)}</div>
                ${plant.species ? `<div class="detail-species">${esc(plant.species)}</div>` : ''}
                <div class="detail-status-row">
                    <span class="badge badge-${health.level}">${health.label}</span>
                    <div class="health-bar-track">
                        <div class="health-bar-fill" style="width:${healthPct}%; background:${barColor}"></div>
                    </div>
                    <div class="detail-days-text">
                        ${formatDays(health.days)} &middot; water every ${config.interval} days
                    </div>
                </div>
            </div>
        </div>

        <div class="section-head">Watering history</div>
        <div class="history-list">${historyHTML}</div>

        <div class="section-head">Notes</div>
        <textarea class="notes-input" id="detailNotes" placeholder="Anything to remember about this plant...">${esc(plant.notes)}</textarea>

        <div class="detail-actions">
            <button class="btn-primary" id="detailWaterBtn"
                ${alreadyWatered ? 'disabled' : ''}>
                ${alreadyWatered ? 'Watered today' : 'Water today'}
            </button>
            <button class="btn-ghost" id="detailSaveBtn">Save notes</button>
            <button class="btn-danger" id="detailDeleteBtn">Delete plant</button>
        </div>
    `;

    document.getElementById('detailWaterBtn').addEventListener('click', () => {
        waterPlant(id);
        openDetail(id); // refresh the modal
    });

    document.getElementById('detailSaveBtn').addEventListener('click', function() {
        saveNotes(id, this);
    });

    document.getElementById('detailDeleteBtn').addEventListener('click', () => {
        deletePlant(id);
    });

    document.getElementById('detailModalBackdrop').classList.add('open');
}

function closeDetail() {
    document.getElementById('detailModalBackdrop').classList.remove('open');
    currentDetailId = null;
}

function saveNotes(id, btn) {
    const plants = loadPlants();
    const plant  = plants.find(p => p.id === id);
    if (!plant) return;

    plant.notes = document.getElementById('detailNotes').value;
    savePlants(plants);

    if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Saved';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = orig;
            btn.disabled = false;
        }, 1100);
    }
}

function deletePlant(id) {
    const plants = loadPlants();
    const plant  = plants.find(p => p.id === id);
    if (!plant) return;

    if (!confirm(`Remove "${plant.name}" from your collection?`)) return;

    savePlants(plants.filter(p => p.id !== id));
    closeDetail();
    renderAll();
    showToast(`${plant.name} removed`);
}


// =====================================================================
//  SAMPLE DATA
// =====================================================================

function addSampleData() {
    const samples = [
        { name: 'Sunny',  species: 'Echeveria elegans',   type: 'succulent', ago: 2  },
        { name: 'Mo',     species: 'Monstera deliciosa',  type: 'monstera',  ago: 10 },
        { name: 'Spikey', species: '',                    type: 'cactus',    ago: 14 },
        { name: 'Basil',  species: 'Ocimum basilicum',    type: 'herb',      ago: 4  },
        { name: 'Sansa',  species: 'Sansevieria trifasciata', type: 'snake', ago: 4  },
        { name: 'Pearl',  species: 'Epipremnum aureum',   type: 'pothos',    ago: 5  },
    ];

    const today  = todayISO();
    const plants = loadPlants();

    samples.forEach(s => {
        const lastWatered = daysAgoISO(s.ago);
        plants.push({
            id:           makeId(),
            name:         s.name,
            species:      s.species,
            type:         s.type,
            addedDate:    today,
            lastWatered:  lastWatered,
            waterHistory: [lastWatered],
            notes:        '',
        });
    });

    savePlants(plants);
    renderAll();
    showToast('Sample plants added');
}


// =====================================================================
//  TOAST
// =====================================================================

let toastTimer = null;

function showToast(msg) {
    let toast = document.getElementById('verdantToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'verdantToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}


// =====================================================================
//  EVENT SETUP + INIT
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {

    // header "Add a plant" button
    document.getElementById('openAddBtn').addEventListener('click', openAdd);

    // empty state buttons
    document.getElementById('emptyAddBtn').addEventListener('click', openAdd);
    document.getElementById('sampleBtn').addEventListener('click', addSampleData);

    // add modal
    document.getElementById('closeAddModal').addEventListener('click', closeAdd);
    document.getElementById('cancelAddBtn').addEventListener('click', closeAdd);
    document.getElementById('submitAddBtn').addEventListener('click', submitAdd);

    // detail modal
    document.getElementById('closeDetailModal').addEventListener('click', closeDetail);

    // close modals when clicking outside the panel
    document.getElementById('addModalBackdrop').addEventListener('click', function(e) {
        if (e.target === this) closeAdd();
    });
    document.getElementById('detailModalBackdrop').addEventListener('click', function(e) {
        if (e.target === this) closeDetail();
    });

    // water buttons bubbled up from the grid
    document.getElementById('plantGrid').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="water"]');
        if (btn) {
            e.stopPropagation();
            waterPlant(btn.dataset.id);
        }
    });

    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdd();
            closeDetail();
        }
        // enter to confirm add modal
        if (e.key === 'Enter' && document.getElementById('addModalBackdrop').classList.contains('open')) {
            // only if we're not in a textarea / select
            if (document.activeElement.tagName !== 'TEXTAREA') {
                submitAdd();
            }
        }
    });

    // first render
    renderAll();
});
