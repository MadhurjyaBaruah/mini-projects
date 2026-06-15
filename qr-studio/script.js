// ── State ────────────────────────────────────────────────────────────────────
const state = {
  activeTab: 'text',
  qrMatrix: null,
  qrVersion: null,
  fgColor: '#16331f',
  bgColor: '#ffffff',
  size: 340,
  margin: 3,
  ecLevel: 'M',
};

// ── DOM refs ─────────────────────────────────────────────────────────────────
const canvas       = document.getElementById('qr-canvas');
const ctx          = canvas.getContext('2d');
const frame        = document.getElementById('preview-frame');
const previewMeta  = document.getElementById('preview-meta');
const errorMsg     = document.getElementById('error-msg');
const btnGenerate  = document.getElementById('btn-generate');
const btnCopy      = document.getElementById('btn-copy');
const btnDlPng     = document.getElementById('btn-dl-png');
const btnDlSvg     = document.getElementById('btn-dl-svg');

const fgPicker     = document.getElementById('fg-color');
const bgPicker     = document.getElementById('bg-color');
const fgHex        = document.getElementById('fg-hex');
const bgHex        = document.getElementById('bg-hex');
const sizeRange    = document.getElementById('size-range');
const sizeVal      = document.getElementById('size-val');
const marginRange  = document.getElementById('margin-range');
const marginVal    = document.getElementById('margin-val');
const ecSelect     = document.getElementById('ec-level');

// ── Tabs ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.input-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const target = document.getElementById('pane-' + btn.dataset.tab);
    if (target) target.classList.add('active');
    state.activeTab = btn.dataset.tab;
    setError('');
  });
});

// ── Theme toggle ──────────────────────────────────────────────────────────────
const themeBtn = document.getElementById('theme-toggle');
function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : '';
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  try { localStorage.setItem('qr-theme', dark ? 'dark' : 'light'); } catch (_) {}
}

themeBtn.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme !== 'dark');
});

(function initTheme() {
  let saved = '';
  try { saved = localStorage.getItem('qr-theme') || ''; } catch (_) {}
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (!saved && prefersDark));
})();

// ── Color pickers ─────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgb(${r} ${g} ${b})`;
}

fgPicker.addEventListener('input', () => {
  state.fgColor = fgPicker.value;
  fgHex.textContent = fgPicker.value.toUpperCase();
  if (state.qrMatrix) renderQR();
});

bgPicker.addEventListener('input', () => {
  state.bgColor = bgPicker.value;
  bgHex.textContent = bgPicker.value.toUpperCase();
  if (state.qrMatrix) renderQR();
});

// ── Sliders ───────────────────────────────────────────────────────────────────
sizeRange.addEventListener('input', () => {
  state.size = parseInt(sizeRange.value);
  sizeVal.textContent = state.size;
  if (state.qrMatrix) renderQR();
});

marginRange.addEventListener('input', () => {
  state.margin = parseInt(marginRange.value);
  marginVal.textContent = state.margin;
  if (state.qrMatrix) renderQR();
});

ecSelect.addEventListener('change', () => {
  state.ecLevel = ecSelect.value;
});

// ── Password visibility toggle ────────────────────────────────────────────────
document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const field = document.getElementById(btn.dataset.target);
    const pressed = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', String(!pressed));
    field.type = pressed ? 'password' : 'text';
  });
});

// ── WiFi hidden checkbox label ────────────────────────────────────────────────
const wifiHiddenCheck = document.getElementById('wifi-hidden');
if (wifiHiddenCheck) {
  wifiHiddenCheck.addEventListener('change', () => {});
}

// ── Collect input value ───────────────────────────────────────────────────────
function getValue() {
  switch (state.activeTab) {
    case 'text':
      return document.getElementById('input-text').value.trim();
    case 'url': {
      let u = document.getElementById('input-url').value.trim();
      if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
      return u;
    }
    case 'phone': {
      const ph = document.getElementById('input-phone').value.trim();
      return ph ? 'tel:' + ph : '';
    }
    case 'wifi': {
      const ssid  = document.getElementById('wifi-ssid').value;
      const pass  = document.getElementById('wifi-pass').value;
      const sec   = document.getElementById('wifi-sec').value;
      const hidden = document.getElementById('wifi-hidden').checked;
      const escapedSsid = ssid.replace(/[\\;,":]/g, c => '\\' + c);
      const escapedPass = pass.replace(/[\\;,":]/g, c => '\\' + c);
      return `WIFI:T:${sec};S:${escapedSsid};P:${escapedPass};${hidden ? 'H:true;' : ''}`;
    }
    case 'custom':
      return document.getElementById('input-custom').value.trim();
    default:
      return '';
  }
}

// ── Generate ──────────────────────────────────────────────────────────────────
function setError(msg) {
  errorMsg.textContent = msg;
}

btnGenerate.addEventListener('click', generate);

document.querySelectorAll('.input-pane input, .input-pane textarea, .input-pane select').forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) generate(); });
});

function generate() {
  setError('');
  const text = getValue();

  if (!text) {
    setError('Please enter some content first.');
    return;
  }

  if (state.activeTab === 'wifi') {
    const ssid = document.getElementById('wifi-ssid').value.trim();
    if (!ssid) { setError('Network name (SSID) is required.'); return; }
  }

  const result = QR.generate(text, state.ecLevel);

  if (!result) {
    setError('Content is too long. Reduce text or choose EC level L.');
    frame.classList.remove('has-code');
    previewMeta.textContent = '';
    return;
  }

  state.qrMatrix  = result.matrix;
  state.qrVersion = result.version;
  frame.classList.add('has-code');
  renderQR();

  const ecNames = { L: 'Low (7%)', M: 'Medium (15%)', Q: 'Quartile (25%)', H: 'High (30%)' };
  previewMeta.textContent = `Version ${result.version}  •  ${result.size}×${result.size} modules  •  EC ${ecNames[state.ecLevel]}`;
  btnDlPng.disabled = false;
  btnDlSvg.disabled = false;
  btnCopy.disabled  = false;
}

// ── Render to canvas ──────────────────────────────────────────────────────────
function renderQR() {
  const matrix = state.qrMatrix;
  if (!matrix) return;

  const N       = matrix.length;
  const margin  = state.margin;
  const total   = N + margin * 2;
  const px      = Math.max(1, Math.floor(state.size / total));
  const canvasSize = total * px;

  canvas.width  = canvasSize;
  canvas.height = canvasSize;

  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = state.fgColor;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((margin + c) * px, (margin + r) * px, px, px);
      }
    }
  }
}

// ── Download PNG ───────────────────────────────────────────────────────────────
btnDlPng.addEventListener('click', () => {
  if (!state.qrMatrix) return;
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ── Download SVG ───────────────────────────────────────────────────────────────
btnDlSvg.addEventListener('click', () => {
  if (!state.qrMatrix) return;

  const matrix = state.qrMatrix;
  const N      = matrix.length;
  const margin = state.margin;
  const total  = N + margin * 2;
  const unit   = 10;
  const size   = total * unit;

  let paths = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c]) {
        const x = (margin + c) * unit;
        const y = (margin + r) * unit;
        paths += `<rect x="${x}" y="${y}" width="${unit}" height="${unit}"/>`;
      }
    }
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="${state.bgColor}"/>`,
    `<g fill="${state.fgColor}">${paths}</g>`,
    `</svg>`
  ].join('');

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const link = document.createElement('a');
  link.download = 'qrcode.svg';
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
});

// ── Copy content ──────────────────────────────────────────────────────────────
btnCopy.addEventListener('click', async () => {
  const text = getValue();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const orig = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(() => { btnCopy.textContent = orig; }, 1800);
  } catch (_) {
    setError('Clipboard access denied by browser.');
  }
});

// ── Scroll-to-generator CTA ────────────────────────────────────────────────────
document.getElementById('cta-generate')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.querySelector('.tab.active')?.focus(), 600);
});
