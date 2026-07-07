/* Streaks
   A small local habit log. No backend, no build step.
   Everything lives in localStorage under STORAGE_KEY.

   The one idea worth explaining: each day cell is colored
   by how many days in a row the habit had been kept as of
   that day (its "momentum"), not just whether it was done.
   That is why a single habit's row fades from pale to teal
   to forest as a streak grows, and drops back to cream the
   moment it breaks. */

(function () {
  'use strict';

  var STORAGE_KEY = 'streaks:v1';
  var DAYS_SHOWN = 91; // 13 weeks, keeps the grid a clean multiple of 7

  var habitListEl = document.getElementById('habitList');
  var emptyStateEl = document.getElementById('emptyState');
  var habitInputEl = document.getElementById('habitInput');
  var addHabitBtn = document.getElementById('addHabitBtn');
  var todayLabelEl = document.getElementById('todayLabel');

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function todayDate() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function parseKey(key) {
    var parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function addDays(date, n) {
    var d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { habits: [] };
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.habits)) return { habits: [] };
      return parsed;
    } catch (err) {
      console.warn('Could not read saved habits, starting fresh.', err);
      return { habits: [] };
    }
  }

  var state = loadState();

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save habits.', err);
    }
  }

  function makeId() {
    return 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function addHabit(rawName) {
    var name = rawName.trim();
    if (!name) return;
    state.habits.push({
      id: makeId(),
      name: name,
      createdAt: formatKey(todayDate()),
      log: {}
    });
    saveState();
    render();
  }

  function removeHabit(id) {
    var habit = state.habits.find(function (h) { return h.id === id; });
    if (!habit) return;
    var ok = window.confirm('Remove "' + habit.name + '" and its full history? This cannot be undone.');
    if (!ok) return;
    state.habits = state.habits.filter(function (h) { return h.id !== id; });
    saveState();
    render();
  }

  function toggleDay(habit, dateKey) {
    if (habit.log[dateKey]) {
      delete habit.log[dateKey];
    } else {
      habit.log[dateKey] = true;
    }
    saveState();
    render();
  }

  function momentumLevel(habit, date) {
    var key = formatKey(date);
    if (!habit.log[key]) return 0;
    var streak = 0;
    var cursor = new Date(date);
    while (habit.log[formatKey(cursor)]) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    if (streak >= 7) return 3;
    if (streak >= 3) return 2;
    return 1;
  }

  function computeStats(habit) {
    var today = todayDate();

    var current = 0;
    var cursor = new Date(today);
    while (habit.log[formatKey(cursor)]) {
      current++;
      cursor = addDays(cursor, -1);
    }

    var doneDates = Object.keys(habit.log).filter(function (k) { return habit.log[k]; }).sort();
    var longest = 0;
    var run = 0;
    var prev = null;
    doneDates.forEach(function (key) {
      if (prev && formatKey(addDays(prev, 1)) === key) {
        run++;
      } else {
        run = 1;
      }
      longest = Math.max(longest, run);
      prev = parseKey(key);
    });

    var doneIn90 = 0;
    for (var i = 0; i < 90; i++) {
      if (habit.log[formatKey(addDays(today, -i))]) doneIn90++;
    }
    var rate = Math.round((doneIn90 / 90) * 100);

    return { current: current, longest: longest, rate: rate };
  }

  function buildCalendarDates() {
    var today = todayDate();
    var start = addDays(today, -(DAYS_SHOWN - 1));
    var gridStart = addDays(start, -start.getDay());
    var gridEnd = addDays(today, 6 - today.getDay());
    var dates = [];
    var d = new Date(gridStart);
    while (d <= gridEnd) {
      dates.push(new Date(d));
      d = addDays(d, 1);
    }
    return { dates: dates, today: today };
  }

  function buildMonthRow(dates) {
    var row = document.createElement('div');
    row.className = 'month-row';
    var columns = dates.length / 7;
    var lastLabel = '';
    for (var c = 0; c < columns; c++) {
      var firstOfColumn = dates[c * 7];
      var monthName = MONTHS[firstOfColumn.getMonth()];
      var label = '';
      if (monthName !== lastLabel && firstOfColumn.getDate() <= 7) {
        label = monthName;
        lastLabel = monthName;
      }
      var cell = document.createElement('span');
      cell.textContent = label;
      row.appendChild(cell);
    }
    return row;
  }

  function buildHeatmap(habit) {
    var wrap = document.createElement('div');
    wrap.className = 'heatmap-wrap';

    var calendar = buildCalendarDates();
    wrap.appendChild(buildMonthRow(calendar.dates));

    var grid = document.createElement('div');
    grid.className = 'heatmap';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', habit.name + ' history, last ' + DAYS_SHOWN + ' days');

    var todayKey = formatKey(calendar.today);

    calendar.dates.forEach(function (date) {
      var key = formatKey(date);
      var isFuture = date > calendar.today;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-cell';

      if (isFuture) {
        btn.classList.add('is-future');
        btn.tabIndex = -1;
        btn.setAttribute('aria-hidden', 'true');
      } else {
        var level = momentumLevel(habit, date);
        if (level > 0) btn.classList.add('level-' + level);
        if (key === todayKey) btn.classList.add('is-today');

        var weekday = WEEKDAYS[date.getDay()];
        var monthName = MONTHS[date.getMonth()];
        var status = habit.log[key] ? 'done' : 'not done';
        btn.setAttribute('aria-label', weekday + ' ' + monthName + ' ' + date.getDate() + ', ' + status);
        btn.title = monthName + ' ' + date.getDate() + ': ' + status;

        btn.addEventListener('click', function () {
          toggleDay(habit, key);
        });
      }

      grid.appendChild(btn);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  function buildHabitCard(habit) {
    var card = document.createElement('article');
    card.className = 'habit-card';

    var top = document.createElement('div');
    top.className = 'habit-card-top';

    var name = document.createElement('h2');
    name.className = 'habit-name';
    name.textContent = habit.name;

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'remove';
    removeBtn.addEventListener('click', function () {
      removeHabit(habit.id);
    });

    top.appendChild(name);
    top.appendChild(removeBtn);

    var stats = computeStats(habit);
    var statsRow = document.createElement('div');
    statsRow.className = 'habit-stats';

    var s1 = document.createElement('span');
    s1.innerHTML = 'current streak <b>' + stats.current + '</b>';
    var s2 = document.createElement('span');
    s2.innerHTML = 'longest <b>' + stats.longest + '</b>';
    var s3 = document.createElement('span');
    s3.innerHTML = 'last 90 days <b>' + stats.rate + '%</b>';
    statsRow.appendChild(s1);
    statsRow.appendChild(s2);
    statsRow.appendChild(s3);

    card.appendChild(top);
    card.appendChild(statsRow);
    card.appendChild(buildHeatmap(habit));

    return card;
  }

  function render() {
    habitListEl.innerHTML = '';
    if (state.habits.length === 0) {
      emptyStateEl.classList.add('show');
      return;
    }
    emptyStateEl.classList.remove('show');
    state.habits.forEach(function (habit) {
      habitListEl.appendChild(buildHabitCard(habit));
    });
  }

  function renderToday() {
    var today = todayDate();
    var weekday = WEEKDAYS[today.getDay()].slice(0, 3);
    var monthName = MONTHS[today.getMonth()];
    todayLabelEl.textContent = weekday + ' ' + String(today.getDate()).padStart(2, '0') + ' ' + monthName + ' ' + today.getFullYear();
  }

  addHabitBtn.addEventListener('click', function () {
    addHabit(habitInputEl.value);
    habitInputEl.value = '';
    habitInputEl.focus();
  });

  habitInputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      addHabit(habitInputEl.value);
      habitInputEl.value = '';
    }
  });

  renderToday();
  render();
})();
