/*
  Folio - app.js
  A minimalist reading log.
  All data is stored in localStorage. No server, no account.
*/

(function () {
  'use strict';

  var STORAGE_KEY = 'folio_books_v1';

  // ============================================================
  // State
  // ============================================================

  var books       = [];
  var activeFilter = 'all';
  var editingId    = null;
  var deleteTarget = null;
  var pickedRating = 0;

  // ============================================================
  // Storage
  // ============================================================

  function loadBooks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      books = raw ? JSON.parse(raw) : [];
    } catch (e) {
      books = [];
    }
  }

  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      // Storage quota exceeded or unavailable - fail silently
    }
  }

  // ============================================================
  // Utilities
  // ============================================================

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  // Basic XSS protection for user-supplied text rendered as innerHTML
  function esc(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  // "Jan 14, 2026"
  function fmtDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric'
    });
  }

  // ============================================================
  // DOM references
  // ============================================================

  var bookGrid        = document.getElementById('bookGrid');
  var emptyState      = document.getElementById('emptyState');
  var noResults       = document.getElementById('noResults');

  var statReading     = document.getElementById('statReading');
  var statFinished    = document.getElementById('statFinished');
  var statWant        = document.getElementById('statWant');
  var statTotal       = document.getElementById('statTotal');

  var searchInput     = document.getElementById('searchInput');
  var sortSelect      = document.getElementById('sortSelect');
  var tabs            = document.querySelectorAll('.tab');

  var overlay         = document.getElementById('overlay');
  var confirmOverlay  = document.getElementById('confirmOverlay');
  var modalHeading    = document.getElementById('modalHeading');

  var fTitle          = document.getElementById('fTitle');
  var fAuthor         = document.getElementById('fAuthor');
  var fGenre          = document.getElementById('fGenre');
  var fStatus         = document.getElementById('fStatus');
  var fProgress       = document.getElementById('fProgress');
  var fNote           = document.getElementById('fNote');

  var progressField   = document.getElementById('progressField');
  var ratingField     = document.getElementById('ratingField');
  var progressLabel   = document.getElementById('progressLabel');

  var errTitle        = document.getElementById('errTitle');
  var errAuthor       = document.getElementById('errAuthor');

  var starRow         = document.getElementById('starRow');
  var starBtns        = document.querySelectorAll('.star');

  // ============================================================
  // Render
  // ============================================================

  function render() {
    updateStats();

    var list = books.slice(); // work on a copy

    // Filter by status tab
    if (activeFilter !== 'all') {
      list = list.filter(function (b) { return b.status === activeFilter; });
    }

    // Filter by search query
    var q = searchInput.value.trim().toLowerCase();
    if (q) {
      list = list.filter(function (b) {
        return b.title.toLowerCase().indexOf(q) !== -1 ||
               b.author.toLowerCase().indexOf(q) !== -1;
      });
    }

    // Sort
    var sortBy = sortSelect.value;
    list.sort(function (a, b) {
      if (sortBy === 'title')  return a.title.localeCompare(b.title);
      if (sortBy === 'author') return a.author.localeCompare(b.author);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      // default: newest first
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });

    // Clear the grid
    bookGrid.innerHTML = '';

    if (books.length === 0) {
      // No books at all
      emptyState.classList.add('show');
      noResults.classList.remove('show');
    } else if (list.length === 0) {
      // Books exist but none match the current filter/search
      emptyState.classList.remove('show');
      noResults.classList.add('show');
    } else {
      emptyState.classList.remove('show');
      noResults.classList.remove('show');
      list.forEach(function (book) {
        bookGrid.appendChild(buildCard(book));
      });
    }
  }

  function updateStats() {
    statReading.textContent  = books.filter(function (b) { return b.status === 'reading';  }).length;
    statFinished.textContent = books.filter(function (b) { return b.status === 'finished'; }).length;
    statWant.textContent     = books.filter(function (b) { return b.status === 'want';     }).length;
    statTotal.textContent    = books.length;
  }

  // ============================================================
  // Build a single book card element
  // ============================================================

  function buildCard(book) {
    var article = document.createElement('article');
    article.className    = 'book-card';
    article.dataset.id     = book.id;
    article.dataset.status = book.status;

    var statusText  = { reading: 'Reading', want: 'Want to Read', finished: 'Finished' }[book.status];
    var badgeClass  = { reading: 'badge-reading', want: 'badge-want', finished: 'badge-finished' }[book.status];

    // Progress bar (reading only)
    var progressHtml = '';
    if (book.status === 'reading') {
      var pct = book.progress || 0;
      progressHtml = [
        '<div class="card-prog-track">',
          '<div class="card-prog-fill" style="width:' + pct + '%"></div>',
        '</div>',
        '<span class="card-prog-pct">' + pct + '% through</span>'
      ].join('');
    }

    // Star rating (finished only)
    var starsHtml = '';
    if (book.status === 'finished') {
      var r = book.rating || 0;
      var starMarkup = '';
      for (var i = 1; i <= 5; i++) {
        starMarkup += '<span class="cstar' + (i <= r ? ' on' : '') + '">&#9733;</span>';
      }
      starsHtml = '<div class="card-stars">' + starMarkup + '</div>';
    }

    // Genre chip
    var genreHtml = book.genre
      ? '<span class="genre-chip">' + esc(book.genre) + '</span>'
      : '';

    // Truncated note
    var noteHtml = book.note
      ? '<p class="card-note">' + esc(book.note) + '</p>'
      : '';

    article.innerHTML = [
      '<div class="card-title">' + esc(book.title) + '</div>',
      '<div class="card-author">' + esc(book.author) + '</div>',
      '<div class="card-tags">',
        '<span class="badge ' + badgeClass + '">' + statusText + '</span>',
        genreHtml,
      '</div>',
      progressHtml,
      starsHtml,
      noteHtml,
      '<div class="card-foot">',
        '<span class="card-date">' + fmtDate(book.dateAdded) + '</span>',
        '<div class="card-btns">',
          '<button class="card-btn edit-btn" aria-label="Edit ' + esc(book.title) + '">edit</button>',
          '<button class="card-btn del del-btn" aria-label="Remove ' + esc(book.title) + '">remove</button>',
        '</div>',
      '</div>'
    ].join('');

    // Attach button events
    article.querySelector('.edit-btn').addEventListener('click', function () {
      openEdit(book.id);
    });

    article.querySelector('.del-btn').addEventListener('click', function () {
      openDeleteConfirm(book.id);
    });

    return article;
  }

  // ============================================================
  // Modal: open, close, reset
  // ============================================================

  function openAdd() {
    editingId    = null;
    pickedRating = 0;
    modalHeading.innerHTML = 'add a <em>book</em>';
    resetForm();
    overlay.classList.add('open');
    setTimeout(function () { fTitle.focus(); }, 60);
  }

  function openEdit(id) {
    var book = findBook(id);
    if (!book) return;

    editingId    = id;
    pickedRating = book.rating || 0;
    modalHeading.innerHTML = 'edit <em>book</em>';

    fTitle.value    = book.title;
    fAuthor.value   = book.author;
    fGenre.value    = book.genre || '';
    fStatus.value   = book.status;
    fProgress.value = book.progress || 0;
    progressLabel.textContent = (book.progress || 0) + '%';
    fNote.value     = book.note || '';

    syncFieldVisibility(book.status);
    syncStars(pickedRating);

    overlay.classList.add('open');
    setTimeout(function () { fTitle.focus(); }, 60);
  }

  function closeModal() {
    overlay.classList.remove('open');
    editingId = null;
    clearValidation();
  }

  function resetForm() {
    fTitle.value    = '';
    fAuthor.value   = '';
    fGenre.value    = '';
    fStatus.value   = 'want';
    fProgress.value = 0;
    progressLabel.textContent = '0%';
    fNote.value     = '';
    syncFieldVisibility('want');
    syncStars(0);
  }

  // Show or hide conditional fields based on current status value
  function syncFieldVisibility(status) {
    progressField.style.display = status === 'reading'  ? 'flex' : 'none';
    ratingField.style.display   = status === 'finished' ? 'flex' : 'none';
  }

  // ============================================================
  // Star rating
  // ============================================================

  function syncStars(rating) {
    starBtns.forEach(function (btn, i) {
      btn.classList.toggle('lit', i < rating);
    });
  }

  // Fill on hover
  starBtns.forEach(function (btn, idx) {
    btn.addEventListener('mouseenter', function () {
      starBtns.forEach(function (s, i) {
        s.classList.toggle('lit', i <= idx);
      });
    });

    btn.addEventListener('click', function () {
      // If clicking the already-set star, clear rating
      if (pickedRating === idx + 1) {
        pickedRating = 0;
      } else {
        pickedRating = idx + 1;
      }
      syncStars(pickedRating);
    });
  });

  // Revert to picked rating on mouse leave
  starRow.addEventListener('mouseleave', function () {
    syncStars(pickedRating);
  });

  // ============================================================
  // Save book (add or edit)
  // ============================================================

  function saveBook() {
    var title  = fTitle.value.trim();
    var author = fAuthor.value.trim();
    var valid  = true;

    clearValidation();

    if (!title) {
      fTitle.classList.add('invalid');
      errTitle.classList.add('show');
      valid = false;
    }

    if (!author) {
      fAuthor.classList.add('invalid');
      errAuthor.classList.add('show');
      valid = false;
    }

    if (!valid) {
      // Focus the first invalid field
      if (!title) fTitle.focus();
      else fAuthor.focus();
      return;
    }

    var status   = fStatus.value;
    var genre    = fGenre.value;
    var note     = fNote.value.trim();
    var progress = status === 'reading'  ? parseInt(fProgress.value, 10) : 0;
    var rating   = status === 'finished' ? pickedRating : 0;

    if (editingId) {
      // Update existing book
      var idx = indexOfBook(editingId);
      if (idx > -1) {
        var existing = books[idx];
        books[idx] = {
          id:          existing.id,
          title:       title,
          author:      author,
          genre:       genre,
          status:      status,
          note:        note,
          progress:    progress,
          rating:      rating,
          dateAdded:   existing.dateAdded,
          dateFinished: status === 'finished'
            ? (existing.dateFinished || new Date().toISOString())
            : null
        };
      }
    } else {
      // Create new book, prepend so newest appears first
      books.unshift({
        id:          uid(),
        title:       title,
        author:      author,
        genre:       genre,
        status:      status,
        note:        note,
        progress:    progress,
        rating:      rating,
        dateAdded:   new Date().toISOString(),
        dateFinished: status === 'finished' ? new Date().toISOString() : null
      });
    }

    saveBooks();
    render();
    closeModal();
  }

  function clearValidation() {
    fTitle.classList.remove('invalid');
    fAuthor.classList.remove('invalid');
    errTitle.classList.remove('show');
    errAuthor.classList.remove('show');
  }

  // ============================================================
  // Delete book
  // ============================================================

  function openDeleteConfirm(id) {
    deleteTarget = id;
    confirmOverlay.classList.add('open');
  }

  function confirmDelete() {
    if (deleteTarget) {
      books = books.filter(function (b) { return b.id !== deleteTarget; });
      saveBooks();
      render();
      deleteTarget = null;
    }
    confirmOverlay.classList.remove('open');
  }

  function cancelDelete() {
    deleteTarget = null;
    confirmOverlay.classList.remove('open');
  }

  // ============================================================
  // Helpers
  // ============================================================

  function findBook(id) {
    for (var i = 0; i < books.length; i++) {
      if (books[i].id === id) return books[i];
    }
    return null;
  }

  function indexOfBook(id) {
    for (var i = 0; i < books.length; i++) {
      if (books[i].id === id) return i;
    }
    return -1;
  }

  // ============================================================
  // Event listeners
  // ============================================================

  document.getElementById('openAddBtn').addEventListener('click', openAdd);
  document.getElementById('emptyAddBtn').addEventListener('click', openAdd);

  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
  document.getElementById('saveBookBtn').addEventListener('click', saveBook);

  // Close modal when clicking the backdrop
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Status change toggles which conditional fields are visible
  fStatus.addEventListener('change', function () {
    syncFieldVisibility(fStatus.value);
  });

  // Live progress label
  fProgress.addEventListener('input', function () {
    progressLabel.textContent = fProgress.value + '%';
  });

  // Filter tabs
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      render();
    });
  });

  // Search and sort re-render
  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);

  // Delete confirm dialog
  document.getElementById('doDeleteBtn').addEventListener('click', confirmDelete);
  document.getElementById('cancelDeleteBtn').addEventListener('click', cancelDelete);

  confirmOverlay.addEventListener('click', function (e) {
    if (e.target === confirmOverlay) cancelDelete();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
      cancelDelete();
    }

    // Enter in the modal body saves the book (but not inside textarea)
    if (e.key === 'Enter' && overlay.classList.contains('open')) {
      if (document.activeElement !== fNote) {
        e.preventDefault();
        saveBook();
      }
    }
  });

  // Remove red border when user starts correcting a field
  fTitle.addEventListener('input', function () {
    fTitle.classList.remove('invalid');
    errTitle.classList.remove('show');
  });

  fAuthor.addEventListener('input', function () {
    fAuthor.classList.remove('invalid');
    errAuthor.classList.remove('show');
  });

  // ============================================================
  // Init
  // ============================================================

  loadBooks();
  render();

})();
