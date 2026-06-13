'use strict';

const API = {
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  weather:   'https://api.open-meteo.com/v1/forecast',
  airQuality:'https://air-quality-api.open-meteo.com/v1/air-quality',
};

const WMO_CODES = {
  0:  { label:'Clear Sky',                day:'clear-day',                   night:'clear-night' },
  1:  { label:'Mainly Clear',             day:'mostly-clear-day',            night:'mostly-clear-night' },
  2:  { label:'Partly Cloudy',            day:'partly-cloudy-day',           night:'partly-cloudy-night' },
  3:  { label:'Overcast',                 day:'overcast',                    night:'overcast' },
  45: { label:'Foggy',                    day:'fog-day',                     night:'fog-night' },
  48: { label:'Icy Fog',                  day:'fog-day',                     night:'fog-night' },
  51: { label:'Light Drizzle',            day:'partly-cloudy-day-drizzle',   night:'partly-cloudy-night-drizzle' },
  53: { label:'Moderate Drizzle',         day:'overcast-day-drizzle',        night:'overcast-night-drizzle' },
  55: { label:'Dense Drizzle',            day:'overcast-day-drizzle',        night:'overcast-night-drizzle' },
  56: { label:'Freezing Drizzle',         day:'partly-cloudy-day-sleet',     night:'partly-cloudy-night-sleet' },
  57: { label:'Heavy Freezing Drizzle',   day:'sleet',                       night:'sleet' },
  61: { label:'Slight Rain',              day:'partly-cloudy-day-rain',      night:'partly-cloudy-night-rain' },
  63: { label:'Moderate Rain',            day:'overcast-day-rain',           night:'overcast-night-rain' },
  65: { label:'Heavy Rain',               day:'overcast-day-rain',           night:'overcast-night-rain' },
  66: { label:'Freezing Rain',            day:'partly-cloudy-day-sleet',     night:'partly-cloudy-night-sleet' },
  67: { label:'Heavy Freezing Rain',      day:'sleet',                       night:'sleet' },
  71: { label:'Slight Snowfall',          day:'partly-cloudy-day-snow',      night:'partly-cloudy-night-snow' },
  73: { label:'Moderate Snowfall',        day:'overcast-day-snow',           night:'overcast-night-snow' },
  75: { label:'Heavy Snowfall',           day:'overcast-day-snow',           night:'overcast-night-snow' },
  77: { label:'Snow Grains',              day:'partly-cloudy-day-snow',      night:'partly-cloudy-night-snow' },
  80: { label:'Slight Showers',           day:'partly-cloudy-day-rain',      night:'partly-cloudy-night-rain' },
  81: { label:'Moderate Showers',         day:'overcast-day-rain',           night:'overcast-night-rain' },
  82: { label:'Violent Showers',          day:'thunderstorms-day-rain',      night:'thunderstorms-night-rain' },
  85: { label:'Snow Showers',             day:'partly-cloudy-day-snow',      night:'partly-cloudy-night-snow' },
  86: { label:'Heavy Snow Showers',       day:'overcast-day-snow',           night:'overcast-night-snow' },
  95: { label:'Thunderstorm',             day:'thunderstorms-day',           night:'thunderstorms-night' },
  96: { label:'Thunderstorm with Hail',   day:'thunderstorms-day-rain',      night:'thunderstorms-night-rain' },
  99: { label:'Thunderstorm, Heavy Hail', day:'thunderstorms-overcast-rain', night:'thunderstorms-overcast-rain' },
};

const AQI_LEVELS = [
  { max:50,       label:'Good',     color:'#118b50', fill:12.5 },
  { max:100,      label:'Fair',     color:'#d4a017', fill:37.5 },
  { max:150,      label:'Moderate', color:'#d97706', fill:62.5 },
  { max:200,      label:'Poor',     color:'#dc2626', fill:87.5 },
  { max:Infinity, label:'Severe',   color:'#7c3aed', fill:100  },
];

const state = {
  lat:null, lon:null, locationName:'', country:'', timezone:'',
  clockTimer:null,
};

const dom = {
  loading:          document.getElementById('loading-screen'),
  error:            document.getElementById('error-screen'),
  dashboard:        document.getElementById('weather-dashboard'),
  errorTitle:       document.getElementById('error-title'),
  errorMsg:         document.getElementById('error-message'),
  retryBtn:         document.getElementById('retry-btn'),
  searchInput:      document.getElementById('search-input'),
  searchBtn:        document.getElementById('search-btn'),
  suggestions:      document.getElementById('search-suggestions'),
  locationBtn:      document.getElementById('location-btn'),
  themeBtn:         document.getElementById('theme-btn'),
  locationName:     document.getElementById('location-name'),
  locationCountry:  document.getElementById('location-country'),
  currentDate:      document.getElementById('current-date'),
  localTime:        document.getElementById('local-time'),
  temperature:      document.getElementById('temperature'),
  conditionText:    document.getElementById('condition-text'),
  feelsLike:        document.getElementById('feels-like'),
  weatherIconWrap:  document.getElementById('weather-icon-wrap'),
  humidity:         document.getElementById('humidity'),
  windSpeed:        document.getElementById('wind-speed'),
  visibility:       document.getElementById('visibility'),
  pressure:         document.getElementById('pressure'),
  uvIndex:          document.getElementById('uv-index'),
  sunriseTime:      document.getElementById('sunrise-time'),
  sunsetTime:       document.getElementById('sunset-time'),
  sunProgressArc:   document.getElementById('sun-progress-arc'),
  sunDot:           document.getElementById('sun-position-dot'),
  moonriseTime:     document.getElementById('moonrise-time'),
  moonsetTime:      document.getElementById('moonset-time'),
  aqiValue:         document.getElementById('aqi-value'),
  aqiLabel:         document.getElementById('aqi-label'),
  aqiBarFill:       document.getElementById('aqi-bar-fill'),
  pm25:             document.getElementById('pm25'),
  pm10:             document.getElementById('pm10'),
  no2:              document.getElementById('no2'),
  o3:               document.getElementById('o3'),
  windSpeedDetail:  document.getElementById('wind-speed-detail'),
  windGust:         document.getElementById('wind-gust'),
  windDir:          document.getElementById('wind-dir'),
  compassNeedle:    document.getElementById('compass-needle-wrap'),
  hourlyList:       document.getElementById('hourly-list'),
  forecastList:     document.getElementById('forecast-list'),
  weatherSummary:   document.getElementById('weather-summary'),
  popupOverlay:     document.getElementById('location-popup-overlay'),
  popupLocationBtn: document.getElementById('popup-location-btn'),
  popupSearchInput: document.getElementById('popup-search-input'),
  popupSearchBtn:   document.getElementById('popup-search-btn'),
  popupSuggestions: document.getElementById('popup-suggestions'),
  popupSkipBtn:     document.getElementById('popup-skip-btn'),
};

/* ─── Helpers ─── */
function getIconSvg(code, isDay) {
  var entry = WMO_CODES[code] || { day:'overcast', night:'overcast' };
  var name = isDay ? entry.day : entry.night;
  return WEATHER_ICONS[name] || WEATHER_ICONS['overcast'] || '';
}

function showView(view) {
  dom.loading.classList.toggle('hidden', view !== 'loading');
  dom.error.classList.toggle('hidden', view !== 'error');
  dom.dashboard.classList.toggle('hidden', view !== 'dashboard');
}

function showError(title, msg) {
  dom.errorTitle.textContent = title;
  dom.errorMsg.textContent = msg;
  showView('error');
}

async function fetchJSON(url) {
  var res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
}

function formatHour(iso) {
  var h = new Date(iso).getHours();
  if (h === 0)  return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? h+' AM' : (h-12)+' PM';
}

function getDayName(dateStr, isToday) {
  if (isToday) return 'Today';
  return new Date(dateStr+'T12:00:00').toLocaleDateString('en-US', { weekday:'long' });
}

function windDegToDir(deg) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];
}

function getAqiLevel(val) {
  return AQI_LEVELS.find(function(l){ return val <= l.max; }) || AQI_LEVELS[AQI_LEVELS.length-1];
}

/* ─── Sun arc (arc baseline y=100, radius=90) ─── */
function updateSunArc(sunriseStr, sunsetStr) {
  var now      = new Date();
  var sunrise  = new Date(sunriseStr);
  var sunset   = new Date(sunsetStr);
  var progress = Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)));
  /* Semi-circle arc length = π * r = π * 90 ≈ 282.74 */
  var arcLen   = Math.PI * 90;
  dom.sunProgressArc.setAttribute('stroke-dasharray', (progress * arcLen).toFixed(2) + ' ' + arcLen.toFixed(2));
  /* Dot position: angle starts at π (left) and goes to 0 (right) */
  var angle = Math.PI * (1 - progress);
  dom.sunDot.setAttribute('cx', (100 - 90 * Math.cos(angle)).toFixed(2));
  /* y baseline = 100, so top of arc = 100 - 90 = 10 */
  dom.sunDot.setAttribute('cy', (100 - 90 * Math.sin(angle)).toFixed(2));
}

/* Compute approximate moonrise / moonset from latitude + date */
function calcMoonTimes(lat, lon, date) {
  /* Simplified moon rise/set calculation using lunar hour angle */
  var rad = Math.PI / 180;
  var d = new Date(date);
  var JD = Math.floor(365.25 * (d.getFullYear() + 4716)) +
           Math.floor(30.6001 * (d.getMonth() + 2)) +
           d.getDate() - 1524.5;
  var T  = (JD - 2451545.0) / 36525;
  var L0 = (218.316 + 13.176396 * (JD - 2451545)) % 360;
  var M  = (134.963 + 13.064993 * (JD - 2451545)) % 360;
  var F  = (93.272  + 13.229350 * (JD - 2451545)) % 360;
  var lon_m = L0 + 6.289 * Math.sin(M * rad);
  var lat_m = 5.128 * Math.sin(F * rad);
  var dec   = Math.asin(Math.sin(lat_m * rad)) / rad;
  var cosH  = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec * rad)) /
              (Math.cos(lat * rad) * Math.cos(dec * rad));
  if (cosH < -1 || cosH > 1) return null;
  var H  = Math.acos(cosH) / rad;
  var RA = lon_m / 15;
  var LMST = (100.4606184 + 0.9856473662 * (JD - 2451545) + lon) % 360;
  var transit = (RA - LMST / 15 + 24) % 24;
  var rise    = (transit - H / 15 + 24) % 24;
  var set_    = (transit + H / 15) % 24;
  function toISO(hDecimal) {
    var hh = Math.floor(hDecimal);
    var mm = Math.round((hDecimal - hh) * 60);
    if (mm === 60) { hh++; mm = 0; }
    var base = new Date(date);
    base.setHours(hh, mm, 0, 0);
    return base.toISOString();
  }
  return { rise: toISO(rise), set: toISO(set_) };
}

function updateClock() {
  var now  = new Date();
  var opts = { timeZone: state.timezone || undefined };
  try {
    dom.currentDate.textContent = now.toLocaleDateString('en-US', Object.assign({ weekday:'long', month:'long', day:'numeric' }, opts));
    dom.localTime.textContent   = now.toLocaleTimeString('en-US', Object.assign({ hour:'2-digit', minute:'2-digit', hour12:true }, opts));
  } catch(e) {
    dom.currentDate.textContent = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    dom.localTime.textContent   = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
  }
}

function buildSummary(data, current) {
  var code  = current.weathercode;
  var cond  = WMO_CODES[code] ? WMO_CODES[code].label : 'Variable conditions';
  var temp  = Math.round(current.temperature_2m);
  var feels = Math.round(current.apparent_temperature);
  var humid = current.relativehumidity_2m;
  var wind  = Math.round(current.windspeed_10m);
  var maxT  = Math.round(data.daily.temperature_2m_max[0]);
  var minT  = Math.round(data.daily.temperature_2m_min[0]);
  var pop   = Math.round(data.daily.precipitation_probability_max[0]);
  return cond + ' conditions with a current temperature of ' + temp + '\u00b0C, feeling like ' + feels + '\u00b0C. ' +
    'Humidity is at ' + humid + '%, with winds at ' + wind + ' km/h. ' +
    'Temperatures range between ' + minT + '\u00b0C and ' + maxT + '\u00b0C today. ' +
    (pop > 20
      ? 'There is a ' + pop + '% chance of precipitation, so an umbrella may be useful.'
      : 'Precipitation is unlikely with only a ' + pop + '% probability.');
}

function renderHourly(hourly, startIdx) {
  dom.hourlyList.innerHTML = '';
  hourly.time.slice(startIdx, startIdx+24).forEach(function(time, i) {
    var idx   = startIdx + i;
    var isDay = hourly.is_day ? hourly.is_day[idx] !== 0 : true;
    var code  = hourly.weathercode[idx];
    var temp  = Math.round(hourly.temperature_2m[idx]);
    var pop   = hourly.precipitation_probability ? (hourly.precipitation_probability[idx] || 0) : 0;
    var item  = document.createElement('div');
    item.className = 'hourly-item' + (i === 0 ? ' current-hour' : '');
    item.setAttribute('role', 'listitem');
    item.innerHTML =
      '<span class="hourly-time">' + (i === 0 ? 'Now' : formatHour(time)) + '</span>' +
      '<div class="hourly-icon-wrap">' + getIconSvg(code, isDay) + '</div>' +
      '<span class="hourly-temp">' + temp + '\u00b0</span>' +
      '<span class="hourly-pop">' + (pop > 0 ? pop+'%' : '') + '</span>';
    dom.hourlyList.appendChild(item);
  });
}

function renderForecast(daily) {
  dom.forecastList.innerHTML = '';
  var gMin  = Math.min.apply(null, daily.temperature_2m_min);
  var gMax  = Math.max.apply(null, daily.temperature_2m_max);
  var range = gMax - gMin || 1;
  daily.time.forEach(function(date, i) {
    var code = daily.weathercode[i];
    var max  = Math.round(daily.temperature_2m_max[i]);
    var min  = Math.round(daily.temperature_2m_min[i]);
    var bL   = ((min - gMin) / range * 100).toFixed(1);
    var bW   = ((max - min) / range * 100).toFixed(1);
    var item = document.createElement('div');
    item.className = 'forecast-item'; item.setAttribute('role', 'listitem');
    item.innerHTML =
      '<span class="forecast-day">' + getDayName(date, i===0) + '</span>' +
      '<div class="forecast-icon-wrap">' + getIconSvg(code, true) + '</div>' +
      '<div class="forecast-bar-wrap">' +
        '<span class="forecast-temp-min">' + min + '\u00b0</span>' +
        '<div class="forecast-bar-track"><div class="forecast-bar-fill" style="margin-left:'+bL+'%;width:'+bW+'%"></div></div>' +
        '<span class="forecast-temp-max">' + max + '\u00b0</span>' +
      '</div>';
    dom.forecastList.appendChild(item);
  });
}

function renderWeather(weatherData, aqiData) {
  var current = weatherData.current;
  var hourly  = weatherData.hourly;
  var daily   = weatherData.daily;
  state.timezone = weatherData.timezone;

  dom.locationName.textContent    = state.locationName;
  dom.locationCountry.textContent = state.country ? ', '+state.country : '';

  if (state.clockTimer) clearInterval(state.clockTimer);
  updateClock();
  state.clockTimer = setInterval(updateClock, 30000);

  var code  = current.weathercode;
  var isDay = current.is_day != null ? current.is_day !== 0 : true;

  dom.temperature.textContent   = Math.round(current.temperature_2m);
  dom.conditionText.textContent = WMO_CODES[code] ? WMO_CODES[code].label : 'Variable';
  dom.feelsLike.textContent     = 'Feels like ' + Math.round(current.apparent_temperature) + '\u00b0C';
  dom.weatherIconWrap.innerHTML = getIconSvg(code, isDay);

  dom.humidity.textContent   = current.relativehumidity_2m + '%';
  dom.windSpeed.textContent  = Math.round(current.windspeed_10m) + ' km/h';
  dom.visibility.textContent = (current.visibility / 1000).toFixed(1) + ' km';
  dom.pressure.textContent   = Math.round(current.surface_pressure) + ' hPa';
  dom.uvIndex.textContent    = current.uv_index != null ? current.uv_index.toFixed(1) : '--';

  dom.sunriseTime.textContent = formatTime(daily.sunrise[0]);
  dom.sunsetTime.textContent  = formatTime(daily.sunset[0]);
  updateSunArc(daily.sunrise[0], daily.sunset[0]);

  /* Moon times */
  var moon = calcMoonTimes(state.lat, state.lon, new Date());
  if (moon) {
    dom.moonriseTime.textContent = formatTime(moon.rise);
    dom.moonsetTime.textContent  = formatTime(moon.set);
  } else {
    dom.moonriseTime.textContent = 'N/A';
    dom.moonsetTime.textContent  = 'N/A';
  }

  var windDeg = current.winddirection_10m;
  dom.windSpeedDetail.textContent   = Math.round(current.windspeed_10m) + ' km/h';
  dom.windGust.textContent          = current.windgusts_10m ? Math.round(current.windgusts_10m)+' km/h' : 'N/A';
  dom.windDir.textContent           = windDegToDir(windDeg) + ' (' + windDeg + '\u00b0)';
  dom.compassNeedle.style.transform = 'rotate(' + windDeg + 'deg)';

  if (aqiData) {
    var c      = aqiData.current;
    var aqiVal = Math.round(c.european_aqi != null ? c.european_aqi : (c.us_aqi || 0));
    var level  = getAqiLevel(aqiVal);
    dom.aqiValue.textContent        = aqiVal;
    dom.aqiLabel.textContent        = level.label;
    dom.aqiLabel.style.background   = level.color;
    dom.aqiBarFill.style.width      = level.fill + '%';
    dom.aqiBarFill.style.background = level.color;
    dom.pm25.textContent = c.pm2_5            != null ? c.pm2_5.toFixed(1)+' \u03bcg'            : '--';
    dom.pm10.textContent = c.pm10             != null ? c.pm10.toFixed(1)+' \u03bcg'             : '--';
    dom.no2.textContent  = c.nitrogen_dioxide != null ? c.nitrogen_dioxide.toFixed(1)+' \u03bcg' : '--';
    dom.o3.textContent   = c.ozone            != null ? c.ozone.toFixed(1)+' \u03bcg'            : '--';
  }

  var nowIso  = current.time;
  var hourIdx = hourly.time.findIndex(function(t){ return t >= nowIso; });
  renderHourly(hourly, hourIdx >= 0 ? hourIdx : 0);
  renderForecast(daily);
  dom.weatherSummary.textContent = buildSummary(weatherData, current);
  showView('dashboard');
}

async function loadWeather() {
  showView('loading');
  try {
    var wP = new URLSearchParams({
      latitude:state.lat, longitude:state.lon,
      current:  ['temperature_2m','apparent_temperature','relativehumidity_2m',
                 'weathercode','windspeed_10m','winddirection_10m','windgusts_10m',
                 'visibility','surface_pressure','uv_index','is_day'].join(','),
      hourly:   ['temperature_2m','weathercode','precipitation_probability','is_day'].join(','),
      daily:    ['weathercode','temperature_2m_max','temperature_2m_min','sunrise','sunset','precipitation_probability_max'].join(','),
      timezone: 'auto', forecast_days:7,
    });
    var aP = new URLSearchParams({
      latitude:state.lat, longitude:state.lon,
      current: ['european_aqi','us_aqi','pm2_5','pm10','nitrogen_dioxide','ozone'].join(','),
      timezone:'auto',
    });
    var results = await Promise.allSettled([
      fetchJSON(API.weather+'?'+wP),
      fetchJSON(API.airQuality+'?'+aP),
    ]);
    if (results[0].status === 'rejected') throw new Error('Weather data unavailable. Please check your connection.');
    renderWeather(results[0].value, results[1].status === 'fulfilled' ? results[1].value : null);
  } catch(err) {
    showError('Unable to load weather', err.message || 'Check your connection and try again.');
  }
}

/* ─── Geocoding ─── */
async function searchCity(query) {
  if (!query.trim()) return [];
  try {
    var data = await fetchJSON(API.geocoding+'?'+new URLSearchParams({ name:query, count:5, language:'en', format:'json' }));
    return data.results || [];
  } catch(e) { return []; }
}

function selectResult(result) {
  state.lat = result.latitude; state.lon = result.longitude;
  state.locationName = result.name; state.country = result.country;
  dom.searchInput.value = result.name;
  dom.suggestions.classList.remove('open');
  closePopup();
  loadWeather();
}

function showSuggestions(results, listEl) {
  if (!results.length) { listEl.innerHTML=''; listEl.classList.remove('open'); return; }
  listEl.innerHTML = results.map(function(r,i){
    return '<div class="suggestion-item popup-suggestion-item" role="option" tabindex="0" data-i="'+i+'">' +
      r.name+(r.admin1?', '+r.admin1:'')+', '+r.country+'</div>';
  }).join('');
  listEl.classList.add('open');
  listEl.querySelectorAll('[data-i]').forEach(function(el){
    var i = parseInt(el.getAttribute('data-i'),10);
    el.addEventListener('click', function(){ selectResult(results[i]); });
    el.addEventListener('keydown', function(e){ if(e.key==='Enter') selectResult(results[i]); });
  });
}

/* ─── Header search ─── */
var searchTimer;
dom.searchInput.addEventListener('input', function(e){
  clearTimeout(searchTimer);
  var val = e.target.value.trim();
  if (!val) { dom.suggestions.classList.remove('open'); return; }
  searchTimer = setTimeout(async function(){ showSuggestions(await searchCity(val), dom.suggestions); }, 350);
});
dom.searchInput.addEventListener('keydown', function(e){
  if (e.key==='Escape') dom.suggestions.classList.remove('open');
  if (e.key==='Enter') { var f=dom.suggestions.querySelector('[data-i]'); if(f) f.click(); }
  if (e.key==='ArrowDown') { e.preventDefault(); var f2=dom.suggestions.querySelector('[data-i]'); if(f2) f2.focus(); }
});
dom.searchBtn.addEventListener('click', async function(){
  var val=dom.searchInput.value.trim(); if(!val) return;
  var r=await searchCity(val); if(r.length) selectResult(r[0]); else showSuggestions([],dom.suggestions);
});
document.addEventListener('click', function(e){
  if (!e.target.closest('.search-container')) dom.suggestions.classList.remove('open');
});

/* ─── Geolocation ─── */
function requestGeo(onSuccess, onError) {
  if (!navigator.geolocation) { onError({code:0}); return; }
  navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout:10000});
}

async function resolveAndLoad(lat, lon) {
  state.lat = lat; state.lon = lon;
  try {
    var geo  = await fetchJSON('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json');
    var addr = geo.address || {};
    state.locationName = addr.city||addr.town||addr.village||addr.county||'Your Location';
    state.country = addr.country || '';
  } catch(e) { state.locationName='Your Location'; state.country=''; }
  loadWeather();
}

dom.locationBtn.addEventListener('click', function(){
  showView('loading');
  requestGeo(
    function(pos){ resolveAndLoad(pos.coords.latitude, pos.coords.longitude); },
    function(err){
      var msgs={1:'Location access denied. Please allow permission and try again.',2:'Position unavailable. Try searching manually.'};
      showError('Location unavailable', msgs[err.code]||'Unable to access location.');
    }
  );
});

dom.retryBtn.addEventListener('click', function(){
  if(state.lat&&state.lon) loadWeather(); else showView('loading');
});

/* ─── Theme ─── */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('zephyr-theme', t);
  dom.themeBtn.setAttribute('aria-label', t==='dark'?'Switch to light mode':'Switch to dark mode');
  /* update floating nav icon */
  var icon = document.getElementById('nav-theme-icon');
  if (icon) {
    if (t === 'dark') {
      icon.innerHTML = '<circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.6"/>' +
        '<path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
    } else {
      icon.innerHTML = '<path d="M17.5 12.5A7.5 7.5 0 019 4C5.41 4 2.5 6.91 2.5 10.5S5.41 17 9 17a7.5 7.5 0 008.5-4.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>';
    }
  }
}

dom.themeBtn.addEventListener('click', function(){
  setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
});

function initTheme() {
  var saved = localStorage.getItem('zephyr-theme');
  var pref  = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved || pref);
}

/* ─── Location Popup ─── */
function closePopup() { dom.popupOverlay.classList.add('hidden'); localStorage.setItem('zephyr-popup-seen','1'); }
function openPopup()  { dom.popupOverlay.classList.remove('hidden'); setTimeout(function(){ dom.popupSearchInput.focus(); },300); }

dom.popupSkipBtn.addEventListener('click', function(){ closePopup(); initDefaultLocation(); });
dom.popupLocationBtn.addEventListener('click', function(){
  closePopup(); showView('loading');
  requestGeo(
    function(pos){ resolveAndLoad(pos.coords.latitude, pos.coords.longitude); },
    function(){ openPopup(); }
  );
});

var popupTimer;
dom.popupSearchInput.addEventListener('input', function(e){
  clearTimeout(popupTimer);
  var val=e.target.value.trim(); if(!val){ dom.popupSuggestions.classList.remove('open'); return; }
  popupTimer = setTimeout(async function(){ showSuggestions(await searchCity(val), dom.popupSuggestions); },350);
});
dom.popupSearchInput.addEventListener('keydown', function(e){
  if(e.key==='Enter'){
    var f=dom.popupSuggestions.querySelector('[data-i]');
    if(f) f.click(); else if(dom.popupSearchInput.value.trim()) dom.popupSearchBtn.click();
  }
});
dom.popupSearchBtn.addEventListener('click', async function(){
  var val=dom.popupSearchInput.value.trim(); if(!val) return;
  var r=await searchCity(val); if(r.length) selectResult(r[0]); else dom.popupSuggestions.classList.remove('open');
});

/* ─── Floating Nav ─── */
document.getElementById('nav-home').addEventListener('click', function(){
  window.scrollTo({ top:0, behavior:'smooth' });
  setNavActive('nav-home');
});
document.getElementById('nav-search').addEventListener('click', function(){
  dom.searchInput.focus();
  dom.searchInput.select();
  setNavActive('nav-search');
});
document.getElementById('nav-location').addEventListener('click', function(){
  showView('loading');
  requestGeo(
    function(pos){ resolveAndLoad(pos.coords.latitude, pos.coords.longitude); },
    function(err){
      var msgs={1:'Location access denied. Try searching manually.',2:'Position unavailable. Try searching manually.'};
      showError('Location unavailable', msgs[err.code]||'Unable to access location.');
    }
  );
  setNavActive('nav-location');
});
document.getElementById('nav-scroll-hourly').addEventListener('click', function(){
  var el = document.querySelector('.hourly-section');
  if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  setNavActive('nav-scroll-hourly');
});
document.getElementById('nav-scroll-forecast').addEventListener('click', function(){
  var el = document.querySelector('.forecast-section');
  if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  setNavActive('nav-scroll-forecast');
});
document.getElementById('nav-theme').addEventListener('click', function(){
  setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');
});

function setNavActive(id) {
  document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active'); });
  var el = document.getElementById(id); if(el) el.classList.add('active');
}

/* ─── Init ─── */
function initDefaultLocation() {
  state.lat=28.6139; state.lon=77.2090;
  state.locationName='New Delhi'; state.country='India';
  loadWeather();
}

function init() {
  initTheme();
  var seen = localStorage.getItem('zephyr-popup-seen');
  if (seen) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos){ resolveAndLoad(pos.coords.latitude, pos.coords.longitude); },
        function(){ initDefaultLocation(); },
        {timeout:5000}
      );
    } else { initDefaultLocation(); }
  } else {
    openPopup();
    initDefaultLocation();
  }
}

init();
