*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --pal-cream: #fbf6e9; --pal-lime: #e3f0af; --pal-teal: #5db996; --pal-green: #118b50;
  --glass-bg: rgba(251,246,233,0.72); --glass-border: rgba(255,255,255,0.92);
  --glass-shadow: 0 4px 32px rgba(17,139,80,0.08), 0 1.5px 6px rgba(17,139,80,0.05);
  --glass-hover: rgba(251,246,233,0.90);
  --text-primary: #0d2818; --text-secondary: #2e5c3a; --text-tertiary: #6b9c7a; --text-inverse: #fff;
  --accent-green: #118b50; --accent-green-soft: rgba(17,139,80,0.10);
  --accent-teal: #5db996;  --accent-teal-soft: rgba(93,185,150,0.15);
  --accent-warm: #e8a020; --accent-warm-soft: rgba(232,160,32,0.14);
  --accent-rose: #e05555;
  --aqi-good: #118b50; --aqi-fair: #d4a017; --aqi-poor: #d97706; --aqi-severe: #dc2626;
  --border-subtle: rgba(17,139,80,0.09); --border-light: rgba(17,139,80,0.18);
  --grad-a: #e8f5ec; --grad-b: #f3faf0; --grad-c: #fdf9f0; --grad-d: #eef7f4;
  --gradient-card: linear-gradient(160deg,rgba(251,246,233,0.82) 0%,rgba(237,249,241,0.62) 100%);
  --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px; --radius-xl: 32px;
  --font-display: 'DM Sans',sans-serif; --font-body: 'Inter',sans-serif;
  --transition-fast: 150ms ease; --transition-base: 250ms ease; --transition-slow: 400ms ease;
  --header-h: 68px; --nav-h: 68px;
}

[data-theme="dark"] {
  --glass-bg: rgba(10,28,16,0.75); --glass-border: rgba(93,185,150,0.12);
  --glass-shadow: 0 4px 32px rgba(0,0,0,0.40),0 1.5px 6px rgba(0,0,0,0.22);
  --glass-hover: rgba(15,38,22,0.85);
  --text-primary: #e8f5ee; --text-secondary: #7dba96; --text-tertiary: #3d7055; --text-inverse: #081a0e;
  --accent-green-soft: rgba(93,185,150,0.13); --accent-teal-soft: rgba(93,185,150,0.11);
  --accent-warm-soft: rgba(232,160,32,0.16);
  --border-subtle: rgba(93,185,150,0.08); --border-light: rgba(93,185,150,0.14);
  --grad-a: #081a0e; --grad-b: #0a2010; --grad-c: #0d1e08; --grad-d: #0b1f14;
  --gradient-card: linear-gradient(160deg,rgba(12,32,18,0.80) 0%,rgba(8,22,12,0.65) 100%);
}

@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after { animation-duration:0.01ms !important; transition-duration:0.01ms !important; }
}

html { font-size:16px; scroll-behavior:smooth; }

body {
  font-family: var(--font-body); color: var(--text-primary);
  min-height: 100dvh; line-height: 1.5; -webkit-font-smoothing: antialiased;
  transition: color var(--transition-slow); overflow-x: hidden;
}

/* ── BG CANVAS ── */
.bg-canvas {
  position: fixed; inset: 0; z-index: -1;
  background: linear-gradient(135deg,var(--grad-a) 0%,var(--grad-b) 30%,var(--grad-c) 60%,var(--grad-d) 100%);
  background-size: 400% 400%;
  animation: bgShift 18s ease-in-out infinite;
  transition: background var(--transition-slow);
}
@keyframes bgShift {
  0%  { background-position: 0% 50%; }  25% { background-position: 100% 0%; }
  50% { background-position: 100% 100%; } 75% { background-position: 0% 100%; }
  100%{ background-position: 0% 50%; }
}
.bg-canvas::before,.bg-canvas::after {
  content:''; position:absolute; border-radius:50%; pointer-events:none;
  animation: orbDrift 20s ease-in-out infinite;
}
.bg-canvas::before {
  width:55vw; height:55vw; top:-20%; right:-10%;
  background: radial-gradient(circle,rgba(93,185,150,0.13) 0%,transparent 65%);
}
.bg-canvas::after {
  width:40vw; height:40vw; bottom:-15%; left:-8%;
  background: radial-gradient(circle,rgba(227,240,175,0.18) 0%,transparent 65%);
  animation-delay: -10s;
}
@keyframes orbDrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(2%,3%) scale(1.05); }
  66%      { transform: translate(-2%,-2%) scale(0.96); }
}

.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.hidden { display:none !important; }
.app-wrapper { display:flex; flex-direction:column; min-height:100dvh; }

/* ── HEADER ── */
.app-header {
  position:sticky; top:0; z-index:100; height:var(--header-h);
  display:flex; align-items:center; justify-content:space-between;
  padding: 0 clamp(16px,4vw,40px);
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 2px 20px rgba(17,139,80,0.06);
  gap:16px; transition: background var(--transition-slow), border-color var(--transition-slow);
}
.brand { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.brand-icon { width:28px; height:28px; color:var(--accent-green); }
.brand-name { font-family:var(--font-display); font-size:1.2rem; font-weight:600; color:var(--text-primary); letter-spacing:-0.02em; }
.header-controls { display:flex; align-items:center; gap:10px; }
.search-container { position:relative; display:flex; align-items:center; }
.search-input {
  height:40px; width:clamp(160px,24vw,300px); padding:0 40px 0 14px;
  border-radius:var(--radius-lg); border:1.5px solid var(--border-light);
  background:var(--glass-bg); backdrop-filter:blur(12px);
  color:var(--text-primary); font-family:var(--font-body); font-size:0.875rem; outline:none;
  transition: border-color var(--transition-base),box-shadow var(--transition-base),background var(--transition-base);
}
.search-input::placeholder { color:var(--text-tertiary); }
.search-input:focus { border-color:var(--accent-green); box-shadow:0 0 0 3px var(--accent-green-soft); background:var(--glass-hover); }
.search-btn {
  position:absolute; right:6px; top:50%; transform:translateY(-50%);
  width:28px; height:28px; display:flex; align-items:center; justify-content:center;
  background:none; border:none; cursor:pointer; color:var(--text-secondary); border-radius:50%;
  transition: color var(--transition-fast),background var(--transition-fast);
}
.search-btn:hover { color:var(--accent-green); background:var(--accent-green-soft); }
.search-btn svg { width:16px; height:16px; }
.search-suggestions {
  position:absolute; top:calc(100% + 6px); left:0; right:0;
  background:var(--glass-bg); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
  border:1.5px solid var(--glass-border); border-radius:var(--radius-md);
  box-shadow:var(--glass-shadow); overflow:hidden; z-index:200; display:none;
}
.search-suggestions.open { display:block; }
.suggestion-item {
  padding:10px 14px; cursor:pointer; font-size:0.875rem; color:var(--text-primary);
  display:flex; align-items:center; gap:8px; transition:background var(--transition-fast);
}
.suggestion-item:hover,.suggestion-item[aria-selected="true"] { background:var(--accent-green-soft); }
.suggestion-item::before { content:''; display:block; width:6px; height:6px; border-radius:50%; background:var(--accent-green); flex-shrink:0; opacity:0.5; }
.icon-btn {
  width:40px; height:40px; border-radius:50%; border:1.5px solid var(--border-light);
  background:var(--glass-bg); backdrop-filter:blur(12px);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:var(--text-secondary); flex-shrink:0;
  transition: color var(--transition-base),background var(--transition-base),border-color var(--transition-base),box-shadow var(--transition-base);
}
.icon-btn:hover { color:var(--accent-green); background:var(--glass-hover); border-color:var(--accent-green); box-shadow:0 0 0 3px var(--accent-green-soft); }
.icon-btn svg { width:18px; height:18px; }
.theme-btn .icon-moon { display:block; }
.theme-btn .icon-sun  { display:none; }
[data-theme="dark"] .theme-btn .icon-moon { display:none; }
[data-theme="dark"] .theme-btn .icon-sun  { display:block; }

/* ── MAIN ── */
.main-content {
  flex:1; padding:clamp(20px,4vw,40px) clamp(16px,4vw,40px);
  max-width:1200px; margin:0 auto; width:100%;
  /* bottom padding for floating nav */
  padding-bottom: calc(clamp(20px,4vw,40px) + var(--nav-h) + 20px);
}

/* ── LOADING ── */
.loading-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:20px; }
.loader-ring { width:52px; height:52px; border-radius:50%; border:3px solid var(--border-light); border-top-color:var(--accent-green); animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.loading-text { color:var(--text-secondary); font-size:0.9rem; font-weight:500; letter-spacing:0.02em; }

/* ── ERROR ── */
.error-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:16px; text-align:center; padding:24px; }
.error-icon { width:64px; height:64px; color:var(--accent-rose); opacity:0.7; }
.error-icon svg { width:100%; height:100%; }
.error-title { font-family:var(--font-display); font-size:1.4rem; font-weight:600; color:var(--text-primary); }
.error-message { color:var(--text-secondary); font-size:0.9rem; max-width:360px; }
.retry-btn {
  margin-top:8px; padding:10px 28px; border-radius:var(--radius-lg);
  border:1.5px solid var(--accent-green); background:var(--accent-green-soft);
  color:var(--accent-green); font-family:var(--font-body); font-size:0.9rem; font-weight:500; cursor:pointer;
  transition: background var(--transition-base),box-shadow var(--transition-base),color var(--transition-base);
}
.retry-btn:hover { background:var(--accent-green); color:var(--text-inverse); box-shadow:0 4px 20px rgba(17,139,80,0.30); }

/* ── DASHBOARD ── */
.weather-dashboard { display:flex; flex-direction:column; gap:20px; animation:fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

/* ── HERO ── */
.hero-section {
  display:flex; justify-content:space-between; align-items:center;
  background:var(--gradient-card);
  backdrop-filter:blur(24px) saturate(1.5); -webkit-backdrop-filter:blur(24px) saturate(1.5);
  border:1.5px solid var(--glass-border); border-radius:var(--radius-xl);
  padding:clamp(24px,4vw,40px); box-shadow:var(--glass-shadow);
  min-height:200px; overflow:hidden; position:relative;
  transition: background var(--transition-slow),border-color var(--transition-slow);
}
.hero-section::before {
  content:''; position:absolute; top:-50%; left:-10%; width:50%; height:200%;
  background:radial-gradient(ellipse,rgba(93,185,150,0.10) 0%,transparent 60%); pointer-events:none;
}
.hero-left { display:flex; flex-direction:column; gap:6px; z-index:1; min-width:0; }
.location-display { display:flex; align-items:center; gap:5px; color:var(--text-secondary); font-size:0.875rem; font-weight:500; flex-wrap:wrap; }
.loc-pin { width:14px; height:14px; color:var(--accent-green); flex-shrink:0; }
.location-name { color:var(--text-primary); font-weight:600; }
.location-country { color:var(--text-tertiary); }
.date-time-display { display:flex; flex-wrap:wrap; gap:8px 12px; font-size:0.8rem; color:var(--text-tertiary); margin-top:4px; }
.temp-display { display:flex; align-items:flex-start; line-height:1; margin-top:6px; }
.temperature { font-family:var(--font-display); font-size:clamp(3.5rem,9vw,6.5rem); font-weight:300; letter-spacing:-0.04em; color:var(--text-primary); line-height:1; }
.temp-unit { font-family:var(--font-display); font-size:clamp(1.3rem,3.5vw,2.2rem); font-weight:300; color:var(--text-secondary); margin-top:8px; }
.condition-text { font-size:1.05rem; font-weight:500; color:var(--text-secondary); margin-top:4px; }
.feels-like { font-size:0.85rem; color:var(--text-tertiary); }
.hero-right { display:flex; align-items:center; justify-content:flex-end; flex-shrink:0; z-index:1; margin-left:20px; }
.weather-icon-container { position:relative; }
.weather-icon-wrap {
  width:clamp(90px,13vw,150px); height:clamp(90px,13vw,150px);
  display:flex; align-items:center; justify-content:center;
  animation:floatIcon 4s ease-in-out infinite;
  filter:drop-shadow(0 8px 20px rgba(17,139,80,0.16));
}
.weather-icon-wrap svg { width:100%; height:100%; }
@keyframes floatIcon { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
/* FIX: circular glow — use percentage-based width/height via padding trick */
.icon-glow {
  position:absolute;
  top:50%; left:50%;
  width:80%; height:80%;
  transform:translate(-50%,-50%);
  border-radius:50%;
  background:radial-gradient(circle, rgba(93,185,150,0.35) 0%, transparent 70%);
  animation:glowPulse 4s ease-in-out infinite; pointer-events:none;
  z-index: -1;
}
@keyframes glowPulse { 0%,100% { opacity:0.6; transform:translate(-50%,-50%) scale(1); } 50% { opacity:1; transform:translate(-50%,-50%) scale(1.15); } }

/* ── STATS STRIP ── */
.stats-strip {
  display:flex; gap:12px;
  /* FIX: overflow visible vertically so hover translateY is not clipped */
  overflow-x:auto; overflow-y:visible;
  padding: 6px 2px 10px; /* top/bottom padding so translateY shadow/transform shows */
  scrollbar-width:none;
}
.stats-strip::-webkit-scrollbar { display:none; }
.stat-pill {
  display:flex; align-items:center; gap:10px; padding:12px 16px;
  background:var(--glass-bg);
  backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
  border:1.5px solid var(--glass-border); border-radius:var(--radius-lg);
  box-shadow:var(--glass-shadow); flex-shrink:0; min-width:118px;
  transition: background var(--transition-base),border-color var(--transition-base),transform var(--transition-base),box-shadow var(--transition-base);
  cursor:default;
}
.stat-pill:hover {
  background:var(--glass-hover); border-color:var(--accent-green);
  transform:translateY(-3px); box-shadow:0 10px 32px rgba(17,139,80,0.16);
}
.stat-icon { width:20px; height:20px; color:var(--accent-green); flex-shrink:0; }
.stat-info { display:flex; flex-direction:column; gap:1px; }
.stat-label { font-size:0.7rem; color:var(--text-tertiary); font-weight:500; text-transform:uppercase; letter-spacing:0.05em; }
.stat-value { font-size:0.9rem; font-weight:600; color:var(--text-primary); white-space:nowrap; }

/* ── GRID ── */
.grid-layout { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }

/* ── CARD BASE ── */
.card {
  background:var(--gradient-card);
  backdrop-filter:blur(20px) saturate(1.4); -webkit-backdrop-filter:blur(20px) saturate(1.4);
  border:1.5px solid var(--glass-border); border-radius:var(--radius-lg);
  padding:clamp(16px,2.5vw,24px); box-shadow:var(--glass-shadow);
  transition: background var(--transition-slow),border-color var(--transition-slow),box-shadow var(--transition-base);
  overflow:hidden; min-width:0;
}
.card:hover { box-shadow:0 8px 40px rgba(17,139,80,0.11); }
.card-title { font-family:var(--font-display); font-size:0.68rem; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:14px; }

/* ── SUN / MOON CARD ── */
/* FIX: give arc container explicit height so dot never clips at top */
.sun-arc-container { margin:4px 0 10px; overflow:visible; }
.sun-arc-svg { width:100%; height:auto; display:block; overflow:visible; }
.sun-times { display:flex; justify-content:space-between; gap:8px; }
.sun-time-item { display:flex; flex-direction:column; align-items:center; gap:3px; }
.sun-icon { width:15px; height:15px; color:var(--accent-warm); flex-shrink:0; }
.moon-icon { width:15px; height:15px; color:#a78bfa; flex-shrink:0; }
.sun-label { font-size:0.68rem; color:var(--text-tertiary); font-weight:500; text-transform:uppercase; letter-spacing:0.05em; }
.sun-value { font-size:0.92rem; font-weight:600; color:var(--text-primary); white-space:nowrap; }

/* Moon row */
.moon-row {
  display:flex; justify-content:space-between; gap:8px;
  margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle);
}
.moon-time-item { display:flex; flex-direction:column; align-items:center; gap:3px; }
.moon-label { font-size:0.68rem; color:var(--text-tertiary); font-weight:500; text-transform:uppercase; letter-spacing:0.05em; }
.moon-value { font-size:0.88rem; font-weight:600; color:var(--text-primary); white-space:nowrap; }

/* ── AQI CARD ── */
.aqi-display { display:flex; flex-direction:column; gap:12px; }
.aqi-number-wrap { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
.aqi-number { font-family:var(--font-display); font-size:2.6rem; font-weight:300; letter-spacing:-0.03em; color:var(--text-primary); line-height:1; }
.aqi-category { font-size:0.82rem; font-weight:600; padding:3px 10px; border-radius:20px; background:var(--aqi-good); color:white; white-space:nowrap; }
.aqi-bar-container { display:flex; flex-direction:column; gap:5px; }
.aqi-bar-track { height:6px; border-radius:3px; background:var(--border-subtle); overflow:hidden; }
.aqi-bar-fill { height:100%; border-radius:3px; background:var(--aqi-good); width:0%; transition:width 1s ease,background 0.5s ease; }
.aqi-scale-labels { display:flex; justify-content:space-between; font-size:0.62rem; color:var(--text-tertiary); }
.aqi-pollutants { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle); }
.pollutant-item { display:flex; justify-content:space-between; align-items:center; padding:5px 9px; background:var(--accent-green-soft); border-radius:var(--radius-sm); gap:6px; }
.pollutant-name { font-size:0.68rem; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em; flex-shrink:0; }
.pollutant-val { font-size:0.75rem; font-weight:500; color:var(--text-primary); white-space:nowrap; }

/* ── WIND CARD ── */
.wind-content { display:flex; align-items:center; gap:20px; }
.wind-compass-wrap { flex-shrink:0; }
.wind-compass { position:relative; width:86px; height:86px; border-radius:50%; border:1.5px solid var(--border-light); background:var(--accent-green-soft); display:flex; align-items:center; justify-content:center; }
.compass-ring { position:absolute; inset:0; border-radius:50%; }
.compass-dir { position:absolute; font-size:0.62rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; }
.compass-dir.n { top:4px; left:50%; transform:translateX(-50%); }
.compass-dir.s { bottom:4px; left:50%; transform:translateX(-50%); }
.compass-dir.e { right:5px; top:50%; transform:translateY(-50%); }
.compass-dir.w { left:5px; top:50%; transform:translateY(-50%); }
.compass-needle-wrap { width:100%; height:100%; position:absolute; display:flex; align-items:center; justify-content:center; transition:transform 1s cubic-bezier(0.4,0,0.2,1); }
.compass-needle { width:3px; height:34px; border-radius:2px; background:linear-gradient(to bottom,var(--accent-green) 50%,var(--accent-rose) 50%); }
.wind-stats { flex:1; display:flex; flex-direction:column; gap:8px; min-width:0; }
.wind-stat-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-subtle); }
.wind-stat-row:last-child { border-bottom:none; }
.wind-stat-label { font-size:0.75rem; color:var(--text-tertiary); font-weight:500; }
.wind-stat-val { font-size:0.88rem; font-weight:600; color:var(--text-primary); white-space:nowrap; }

/* ── HOURLY ── */
.hourly-section { overflow:hidden; }
.hourly-scroll-container { overflow-x:auto; padding-bottom:6px; scrollbar-width:thin; scrollbar-color:var(--border-light) transparent; }
.hourly-scroll-container::-webkit-scrollbar { height:4px; }
.hourly-scroll-container::-webkit-scrollbar-track { background:transparent; }
.hourly-scroll-container::-webkit-scrollbar-thumb { background:var(--border-light); border-radius:2px; }
.hourly-list { display:flex; gap:8px; padding:4px 0; min-width:max-content; }
.hourly-item {
  display:flex; flex-direction:column; align-items:center; gap:7px; padding:10px 12px;
  border-radius:var(--radius-md); background:var(--accent-green-soft); border:1.5px solid transparent;
  min-width:64px; transition:background var(--transition-base),border-color var(--transition-base),transform var(--transition-base); cursor:default;
}
.hourly-item:hover { background:var(--glass-hover); border-color:var(--accent-green); transform:translateY(-3px); }
.hourly-item.current-hour { background:var(--accent-green); border-color:var(--accent-green); }
.hourly-item.current-hour .hourly-time,.hourly-item.current-hour .hourly-temp,.hourly-item.current-hour .hourly-pop { color:white; }
.hourly-time { font-size:0.68rem; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.04em; }
.hourly-icon-wrap { width:34px; height:34px; display:flex; align-items:center; justify-content:center; }
.hourly-icon-wrap svg { width:100%; height:100%; }
.hourly-temp { font-size:0.9rem; font-weight:600; color:var(--text-primary); }
.hourly-pop { font-size:0.68rem; color:var(--accent-green); font-weight:500; min-height:1em; }

/* ── FORECAST ── */
.forecast-list { display:flex; flex-direction:column; gap:2px; }
.forecast-item { display:grid; grid-template-columns:minmax(80px,110px) 34px 1fr; align-items:center; gap:10px; padding:9px 6px; border-radius:var(--radius-sm); transition:background var(--transition-fast); }
.forecast-item:hover { background:var(--accent-green-soft); }
.forecast-item:not(:last-child) { border-bottom:1px solid var(--border-subtle); }
.forecast-day { font-size:0.85rem; font-weight:500; color:var(--text-primary); }
.forecast-icon-wrap { width:34px; height:34px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.forecast-icon-wrap svg { width:100%; height:100%; }
.forecast-bar-wrap { display:flex; align-items:center; gap:7px; min-width:0; }
.forecast-temp-min { font-size:0.78rem; color:var(--text-tertiary); font-weight:500; min-width:26px; text-align:right; white-space:nowrap; }
.forecast-temp-max { font-size:0.78rem; font-weight:600; color:var(--text-primary); min-width:26px; white-space:nowrap; }
.forecast-bar-track { flex:1; height:4px; background:var(--border-subtle); border-radius:2px; overflow:hidden; min-width:30px; }
.forecast-bar-fill { height:100%; border-radius:2px; background:linear-gradient(to right,var(--accent-teal),var(--accent-green)); }

/* ── SUMMARY ── */
.summary-card .summary-text { font-size:0.93rem; color:var(--text-secondary); line-height:1.7; font-weight:400; }

/* ── FOOTER ── */
.app-footer { padding:16px clamp(16px,4vw,40px); border-top:1px solid var(--border-subtle); background:var(--glass-bg); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }
.footer-inner { max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; font-size:0.76rem; color:var(--text-tertiary); }
.footer-brand { font-weight:600; color:var(--text-secondary); }
.footer-left,.footer-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.footer-sep { display:inline-block; width:3px; height:3px; border-radius:50%; background:var(--text-tertiary); opacity:0.5; }
.footer-ai-badge { display:flex; align-items:center; gap:5px; color:var(--accent-green); font-weight:500; font-size:0.73rem; }
.ai-icon { width:13px; height:13px; }

/* ── FLOATING NAV ── */
.floating-nav {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  border: 1.5px solid var(--glass-border);
  border-radius: 50px;
  box-shadow: 0 8px 40px rgba(17,139,80,0.14), 0 2px 10px rgba(0,0,0,0.08);
  animation: navSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes navSlideUp {
  from { opacity:0; transform:translateX(-50%) translateY(24px); }
  to   { opacity:1; transform:translateX(-50%) translateY(0); }
}

.nav-btn {
  position: relative;
  width: 42px; height: 42px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-tertiary);
  transition: color var(--transition-base), background var(--transition-base), transform var(--transition-fast);
  flex-shrink: 0;
}
.nav-btn svg { width: 18px; height: 18px; pointer-events: none; }
.nav-btn:hover { color: var(--accent-green); background: var(--accent-green-soft); transform: translateY(-2px); }
.nav-btn.active { color: var(--accent-green); background: var(--accent-green-soft); }

/* Tooltip label above each nav button */
.nav-btn::before {
  content: attr(data-label);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: var(--text-primary);
  color: var(--text-inverse);
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 4px 9px;
  border-radius: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  z-index: 10;
}
.nav-btn::after {
  content: '';
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  border: 5px solid transparent;
  border-top-color: var(--text-primary);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.nav-btn:hover::before { opacity: 1; transform: translateX(-50%) translateY(0); }
.nav-btn:hover::after  { opacity: 1; transform: translateX(-50%) translateY(0); }

.nav-divider { width: 1px; height: 22px; background: var(--border-light); margin: 0 4px; flex-shrink: 0; }

/* ── LOCATION POPUP ── */
.location-popup-overlay {
  position:fixed; inset:0; z-index:500;
  background:rgba(8,26,14,0.45); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center; padding:20px;
  animation:overlayIn 0.3s ease;
}
[data-theme="dark"] .location-popup-overlay { background:rgba(0,0,0,0.55); }
@keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
.location-popup {
  background:var(--glass-bg); backdrop-filter:blur(32px) saturate(1.6); -webkit-backdrop-filter:blur(32px) saturate(1.6);
  border:1.5px solid var(--glass-border); border-radius:var(--radius-xl);
  box-shadow:0 24px 80px rgba(17,139,80,0.18),0 8px 30px rgba(0,0,0,0.10);
  padding:36px 32px 32px; max-width:420px; width:100%;
  animation:popupIn 0.35s cubic-bezier(0.34,1.56,0.64,1); position:relative; overflow:hidden;
}
.location-popup::before {
  content:''; position:absolute; top:-40%; right:-20%; width:60%; height:60%; border-radius:50%;
  background:radial-gradient(circle,rgba(93,185,150,0.15) 0%,transparent 70%); pointer-events:none;
}
@keyframes popupIn { from { opacity:0; transform:scale(0.88) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
.popup-icon { width:56px; height:56px; margin:0 auto 18px; background:var(--accent-green-soft); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--accent-green); }
.popup-icon svg { width:28px; height:28px; }
.popup-title { font-family:var(--font-display); font-size:1.4rem; font-weight:600; color:var(--text-primary); text-align:center; margin-bottom:8px; }
.popup-desc { font-size:0.88rem; color:var(--text-secondary); text-align:center; line-height:1.6; margin-bottom:24px; }
.popup-actions { display:flex; flex-direction:column; gap:10px; }
.popup-btn-primary {
  display:flex; align-items:center; justify-content:center; gap:8px;
  padding:13px 20px; border-radius:var(--radius-lg); background:var(--accent-green); color:white;
  border:none; cursor:pointer; font-family:var(--font-body); font-size:0.9rem; font-weight:600;
  transition: background var(--transition-base),box-shadow var(--transition-base),transform var(--transition-fast);
}
.popup-btn-primary:hover { background:#0d7040; box-shadow:0 6px 24px rgba(17,139,80,0.35); transform:translateY(-1px); }
.popup-btn-primary svg { width:18px; height:18px; flex-shrink:0; }
.popup-divider { display:flex; align-items:center; gap:10px; font-size:0.75rem; color:var(--text-tertiary); }
.popup-divider::before,.popup-divider::after { content:''; flex:1; height:1px; background:var(--border-subtle); }
.popup-search-row { display:flex; gap:8px; }
.popup-search-input {
  flex:1; height:42px; padding:0 14px; border-radius:var(--radius-md);
  border:1.5px solid var(--border-light); background:var(--glass-bg); color:var(--text-primary);
  font-family:var(--font-body); font-size:0.875rem; outline:none;
  transition: border-color var(--transition-base),box-shadow var(--transition-base);
}
.popup-search-input::placeholder { color:var(--text-tertiary); }
.popup-search-input:focus { border-color:var(--accent-green); box-shadow:0 0 0 3px var(--accent-green-soft); }
.popup-search-btn {
  height:42px; padding:0 16px; border-radius:var(--radius-md);
  border:1.5px solid var(--accent-green); background:var(--accent-green-soft); color:var(--accent-green);
  font-family:var(--font-body); font-size:0.85rem; font-weight:600; cursor:pointer; white-space:nowrap;
  transition: background var(--transition-base),color var(--transition-base);
}
.popup-search-btn:hover { background:var(--accent-green); color:white; }
.popup-suggestions { border-radius:var(--radius-md); border:1.5px solid var(--glass-border); background:var(--glass-bg); backdrop-filter:blur(16px); overflow:hidden; display:none; }
.popup-suggestions.open { display:block; }
.popup-suggestion-item { padding:10px 14px; cursor:pointer; font-size:0.875rem; color:var(--text-primary); display:flex; align-items:center; gap:8px; transition:background var(--transition-fast); }
.popup-suggestion-item:hover { background:var(--accent-green-soft); }
.popup-suggestion-item::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--accent-green); flex-shrink:0; opacity:0.5; }
.popup-close-row { text-align:center; margin-top:4px; }
.popup-skip-btn { background:none; border:none; cursor:pointer; font-size:0.8rem; color:var(--text-tertiary); font-family:var(--font-body); text-decoration:underline; text-underline-offset:3px; transition:color var(--transition-fast); }
.popup-skip-btn:hover { color:var(--text-secondary); }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .grid-layout { grid-template-columns:1fr 1fr; }
  .wind-card { grid-column:1 / -1; }
  .wind-compass { width:80px; height:80px; }
}
@media (max-width: 640px) {
  .hero-section { flex-direction:column; align-items:flex-start; gap:16px; }
  .hero-right { align-self:flex-end; margin-left:0; margin-top:-55px; }
  .search-input { width:140px; }
  .brand-name { display:none; }
  .footer-inner { flex-direction:column; align-items:flex-start; gap:6px; }
  .location-popup { padding:28px 20px 24px; }
  .popup-title { font-size:1.2rem; }
  .floating-nav { padding:6px 10px; gap:2px; }
  .nav-btn { width:38px; height:38px; }
  .nav-btn svg { width:16px; height:16px; }
}
@media (max-width: 600px) {
  .grid-layout { grid-template-columns:1fr; }
  .wind-card { grid-column:auto; }
  .wind-compass { width:76px; height:76px; }
}
@media (max-width: 480px) {
  .forecast-item { grid-template-columns:minmax(70px,90px) 30px 1fr; gap:7px; }
  .aqi-pollutants { grid-template-columns:1fr 1fr; }
}
@media (max-width: 380px) {
  .stats-strip { flex-wrap:nowrap; }
  .stat-pill { min-width:105px; }
  .popup-search-row { flex-direction:column; }
  .popup-search-btn { width:100%; }
  .nav-divider { display:none; }
  .floating-nav { gap:0; }
  .nav-btn { width:34px; height:34px; }
}
