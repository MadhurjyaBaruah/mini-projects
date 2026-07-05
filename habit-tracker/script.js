(function () {
  'use strict';

  var STORAGE_KEY = 'habit-tracker:habits';
  var WEEKS_SHOWN = 17;
  var CELL_SIZE = 11;
  var CELL_GAP = 3;
  var CELL_STEP = CELL_SIZE + CELL_GAP;

  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Anchors taken straight from the source palette. The two in-between
  // shades are mixed at render time rather than picked by eye, so the
  // gradient always reads as one continuous scale.
  var PALE = '#E3F0AF';
  var SAGE = '#5DB996';
  var FOREST = '#118B50';
  var WELL = '#F0EAD8';

  var LEVEL_COLORS = [
    WELL,
    PALE,
    mixHex(PALE, SAGE, 0.5),
    SAGE,
    mixHex(SAGE, FOREST, 0.5),
    FOREST
  ];

  // ---------- elements ----------

  var addForm = document.getElementById('addForm');
  var habitInput = document.getElementById('habitInput');
  var habitList = document.getElementById('habitList');
  var emptyState = document.getElementById('emptyState');
  var template = document.getElementById('habitTemplate');

  var statHabits = document.getElementById('statHabits');
  var statToday = document.getElementById('statToday');
  var statLongest = document.getElementById('statLongest');

  // ---------- date helpers ----------
  // All arithmetic happens on local calendar dates. Keys are plain
  // YYYY-MM-DD strings so storage stays readable and timezone-proof.

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, amount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function toKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function keyToIndex(key) {
    var parts = key.split('-');
    return Math.round(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]) / 86400000);
  }

  function dateToIndex(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  function formatLong(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- color helpers ----------

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixHex(a, b, t) {
    var ca = hexToRgb(a);
    var cb = hexToRgb(b);
    var r = Math.round(ca.r + (cb.r - ca.r) * t);
    var g = Math.round(ca.g + (cb.g - ca.g) * t);
    var bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  // ---------- storage ----------

  function loadHabits() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('Could not read saved habits, starting fresh.', err);
      return [];
    }
  }

  function saveHabits(habits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- streak math ----------

  function currentStreak(habit) {
    var done = new Set(habit.completions);
    var cursor = startOfDay(new Date());

    if (!done.has(toKey(cursor))) {
      cursor = addDays(cursor, -1);
      if (!done.has(toKey(cursor))) return 0;
    }

    var count = 0;
    while (done.has(toKey(cursor))) {
      count++;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  function bestStreak(habit) {
    if (habit.completions.length === 0) return 0;
    var days = habit.completions.map(keyToIndex).sort(function (a, b) { return a - b; });
    var best = 1;
    var run = 1;
    for (var i = 1; i < days.length; i++) {
      if (days[i] === days[i - 1]) continue;
      run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
      if (run > best) best = run;
    }
    return best;
  }

  // Run length ending on each completed day, so the heatmap can shade a
  // date by how long the streak had grown by that point rather than a
  // flat done/not-done color.
  function runsEndingOnEachDay(habit) {
    var days = habit.completions.map(keyToIndex).sort(function (a, b) { return a - b; });
    var runs = new Map();
    var run = 0;
    var prev = null;
    for (var i = 0; i < days.length; i++) {
      var d = days[i];
      if (d === prev) continue;
      run = (prev !== null && d === prev + 1) ? run + 1 : 1;
      runs.set(d, run);
      prev = d;
    }
    return runs;
  }

  function depthToLevel(depth) {
    if (depth <= 0) return 0;
    if (depth <= 2) return 1;
    if (depth <= 6) return 2;
    if (depth <= 13) return 3;
    if (depth <= 29) return 4;
    return 5;
  }

  // ---------- actions ----------

  function addHabit(name) {
    var trimmed = name.trim();
    if (!trimmed) return;
    var habits = loadHabits();
    habits.push({
      id: makeId(),
      name: trimmed,
      createdAt: toKey(startOfDay(new Date())),
      completions: []
    });
    saveHabits(habits);
    render();
  }

  function deleteHabit(id) {
    var habits = loadHabits();
    var habit = habits.find(function (h) { return h.id === id; });
    if (!habit) return;
    var confirmed = window.confirm('Delete "' + habit.name + '" and its history?');
    if (!confirmed) return;
    saveHabits(habits.filter(function (h) { return h.id !== id; }));
    render();
  }

  function toggleCompletion(id, dateKey) {
    var habits = loadHabits();
    var habit = habits.find(function (h) { return h.id === id; });
    if (!habit) return;
    var i = habit.completions.indexOf(dateKey);
    if (i === -1) {
      habit.completions.push(dateKey);
    } else {
      habit.completions.splice(i, 1);
    }
    saveHabits(habits);
    render();
  }

  // ---------- heatmap ----------

  function buildHeatmap(habit, monthsEl, cellsEl) {
    var today = startOfDay(new Date());
    var currentSunday = addDays(today, -today.getDay());
    var startSunday = addDays(currentSunday, -(WEEKS_SHOWN - 1) * 7);
    var runs = runsEndingOnEachDay(habit);

    cellsEl.style.gridTemplateColumns = 'repeat(' + WEEKS_SHOWN + ', ' + CELL_SIZE + 'px)';
    monthsEl.style.width = (WEEKS_SHOWN * CELL_SIZE + (WEEKS_SHOWN - 1) * CELL_GAP) + 'px';

    var lastMonth = null;

    for (var week = 0; week < WEEKS_SHOWN; week++) {
      var weekStart = addDays(startSunday, week * 7);

      var month = weekStart.getMonth();
      if (month !== lastMonth) {
        var label = document.createElement('span');
        label.textContent = MONTH_NAMES[month];
        label.style.left = (week * CELL_STEP) + 'px';
        monthsEl.appendChild(label);
        lastMonth = month;
      }

      for (var day = 0; day < 7; day++) {
        var date = addDays(weekStart, day);
        var isFuture = date > today;
        var cell;

        if (isFuture) {
          cell = document.createElement('div');
          cell.className = 'heatmap-cell is-future';
        } else {
          var key = toKey(date);
          var idx = dateToIndex(date);
          var depth = runs.get(idx) || 0;
          var level = depthToLevel(depth);

          cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'heatmap-cell is-clickable';
          cell.style.background = LEVEL_COLORS[level];
          var label = formatLong(date) + ' - ' + (depth > 0 ? depth + '-day streak' : 'not done');
          cell.title = label;
          cell.setAttribute('aria-label', label);
          cell.setAttribute('aria-pressed', depth > 0 ? 'true' : 'false');
          // Excluded from the Tab sequence on purpose: a habit's grid is
          // ~120 cells, and the leaf toggle already covers the common
          // case of marking today from the keyboard. Mouse and touch
          // users can still click any day to fix an earlier entry.
          cell.tabIndex = -1;
          cell.addEventListener('click', function (habitId, dateKey) {
            return function () { toggleCompletion(habitId, dateKey); };
          }(habit.id, key));
        }

        cell.style.gridColumn = String(week + 1);
        cell.style.gridRow = String(day + 1);
        cellsEl.appendChild(cell);
      }
    }
  }

  // ---------- rendering ----------

  function buildHabitCard(habit) {
    var node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = habit.id;
    node.querySelector('.habit-name').textContent = habit.name;

    var todayKey = toKey(startOfDay(new Date()));
    var doneToday = habit.completions.indexOf(todayKey) !== -1;

    node.querySelector('.current-streak').textContent = currentStreak(habit);
    node.querySelector('.best-streak').textContent = bestStreak(habit);

    var toggle = node.querySelector('.leaf-toggle');
    toggle.setAttribute('aria-pressed', doneToday ? 'true' : 'false');
    toggle.setAttribute('aria-label', doneToday ? 'Mark today not done' : 'Mark today done');
    toggle.addEventListener('click', function () {
      toggleCompletion(habit.id, todayKey);
    });

    var deleteBtn = node.querySelector('.delete-btn');
    deleteBtn.setAttribute('aria-label', 'Delete ' + habit.name);
    deleteBtn.addEventListener('click', function () {
      deleteHabit(habit.id);
    });

    var monthsEl = node.querySelector('.heatmap-months');
    var cellsEl = node.querySelector('.heatmap-cells');
    buildHeatmap(habit, monthsEl, cellsEl);

    return node;
  }

  function updateStats(habits) {
    var todayKey = toKey(startOfDay(new Date()));
    var doneToday = habits.filter(function (h) { return h.completions.indexOf(todayKey) !== -1; }).length;
    var longest = habits.reduce(function (max, h) { return Math.max(max, bestStreak(h)); }, 0);

    statHabits.textContent = habits.length;
    statToday.textContent = doneToday + ' / ' + habits.length;
    statLongest.textContent = longest;
  }

  function render() {
    var habits = loadHabits();
    habitList.innerHTML = '';

    if (habits.length === 0) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      habits.forEach(function (habit) {
        habitList.appendChild(buildHabitCard(habit));
      });
    }

    updateStats(habits);

    // The most recent weeks matter most, so start the strip scrolled
    // all the way to the right instead of showing the oldest data.
    document.querySelectorAll('.heatmap-scroll').forEach(function (el) {
      el.scrollLeft = el.scrollWidth;
    });
  }

  // ---------- events ----------

  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    addHabit(habitInput.value);
    habitInput.value = '';
    habitInput.focus();
  });

  render();
})();
