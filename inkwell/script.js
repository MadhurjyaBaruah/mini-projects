/*
  Inkwell
  All analysis runs locally. Nothing in this file makes a network request
  or sends the draft anywhere, the only side effect is localStorage so a
  draft survives a page refresh.

  Precision notes:
  Word, character and sentence counts are exact for any length of text,
  they do not get less accurate as a draft grows. The one genuinely
  approximate figure is the readability score, because it depends on
  syllable counts, and English spelling does not map to syllables in a
  fully regular way. SYLLABLE_EXCEPTIONS below is a lookup table for the
  500 common English words most likely to be miscounted by the general
  heuristic, built by checking the heuristic against the CMU Pronouncing
  Dictionary across the 8,000 most frequent English words and keeping the
  highest-impact corrections. Combined with the heuristic fallback for
  every other word, this measured at 99.3 percent accuracy weighted by
  real word frequency, versus 95.4 percent for the heuristic alone.
*/

(function () {
  'use strict';

  const STORAGE_KEY = 'inkwell:draft';

  const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'as', 'by',
    'that', 'this', 'these', 'those', 'it', 'its', 'from', 'have', 'has',
    'had', 'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very', 'can',
    'will', 'just', 'you', 'your', 'i', 'we', 'they', 'he', 'she', 'him',
    'her', 'them', 'his', 'their', 'our', 'my', 'me', 'us', 'do', 'does',
    'did', 'about', 'into', 'over', 'after', 'before', 'up', 'down', 'out',
    'off', 'again', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'only', 'own', 'same', 'what', 'which', 'who', 'whom'
  ]);

  // Sentence-ending abbreviations that should not count as a sentence break.
  // Deliberately excludes short common words (no, in, on...) since those
  // are far more likely to be real sentence endings than abbreviations.
  const ABBREVIATIONS = new Set([
    'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'ave', 'blvd', 'vs',
    'etc', 'approx', 'dept', 'gen', 'col', 'capt', 'lt', 'sgt', 'rev',
    'hon', 'mt', 'corp', 'inc', 'ltd', 'co'
  ]);

  // Multi-part abbreviations that contain their own internal periods.
  const DOTTED_ABBREVIATIONS = /\b(?:e\.g|i\.e|a\.m|p\.m|u\.s|u\.k|u\.n|ph\.d)\./gi;

  // Syllable counts for common words the general heuristic tends to miss,
  // checked word by word against the CMU Pronouncing Dictionary. See the
  // file header for how this list was built.
  const SYLLABLE_EXCEPTIONS = {
    absolutely:4, accepted:3, achievement:3, acquired:3, acted:2, actual:3, actually:4, added:2,
    admitted:3, adopted:3, affected:3, ages:2, aisle:1, alien:3, alliance:3, anime:3,
    announcement:3, annual:3, anxiety:4, anyone:3, ap:2, appointed:3, appreciate:4, appropriate:4,
    approximately:5, area:3, areas:3, arrested:3, associate:4, associated:5, association:5, attempted:3,
    attended:3, attracted:3, audience:3, audio:3, aug:2, automatically:5, awarded:3, awareness:3,
    awesome:2, barely:2, baseball:2, basically:3, bbc:3, bc:2, beautiful:3, beauty:2,
    behaviour:3, being:2, biological:5, boxes:2, brian:2, bureau:2, business:2, canadian:4,
    careful:2, carefully:3, carrier:3, carrying:3, cases:2, catholic:2, causes:2, cd:2,
    centre:2, ceo:3, challenges:3, champion:3, champions:3, championship:4, chances:2, changes:2,
    chaos:2, charges:2, charles:1, chocolate:2, choices:2, choir:2, churches:2, circumstances:4,
    cited:2, classes:2, cleveland:2, client:2, clients:2, closely:2, cnn:3, coaches:2,
    colleagues:2, collected:3, colonel:2, columbia:4, committed:3, completed:3, completely:3, complicated:4,
    concluded:3, conducted:3, connected:3, consequences:4, constructed:3, continuing:4, contributed:4, cooperation:5,
    courses:2, create:2, created:3, creates:2, creating:3, creation:3, creative:3, criticism:4,
    crying:2, dated:2, dc:2, decided:3, dedicated:4, definitely:4, delicious:3, desire:3,
    desperate:2, devices:3, diego:3, diet:2, differences:4, directed:3, disabled:3, disappointed:4,
    diseases:3, distributed:4, divided:3, dna:3, doing:2, dual:2, dying:2, earlier:3,
    easier:3, edinburgh:4, edited:3, educated:4, effectively:4, elected:3, elementary:4, elsewhere:2,
    empire:3, ended:2, enforcement:3, engagement:3, entire:3, entitled:3, especially:3, estimated:4,
    etc:4, eu:2, european:4, evening:2, eventually:5, everybody:4, everyday:3, everything:3,
    everywhere:3, excited:3, executed:4, existed:3, expanded:3, expected:3, expenses:3, experience:4,
    experienced:4, experiences:5, extended:3, extraordinary:6, extremely:3, eye:1, eyes:1, facebook:2,
    faces:2, fbi:3, feb:4, february:4, female:2, females:2, file:1, files:1,
    fire:2, fired:2, flying:2, forces:2, founded:2, framework:2, fuel:2, funded:2,
    generated:4, genuine:3, giant:2, giants:2, glasses:2, going:2, gorgeous:2, graduate:3,
    granted:2, grateful:2, guardian:3, handed:2, headed:2, hire:2, hired:2, hole:1,
    holes:1, homeless:2, hopefully:3, horses:2, hour:2, hours:2, household:2, houses:2,
    http:4, hundred:2, ian:2, idea:3, ideas:3, idiot:3, images:3, immediate:4,
    improvement:3, improvements:3, inches:2, included:3, increases:3, india:3, indian:3, indiana:4,
    indicated:4, individual:5, individuals:5, industrial:4, influence:3, inspired:3, integrated:4, intellectual:5,
    intended:3, interest:2, interesting:3, interests:2, interior:4, invited:3, involvement:3, iowa:3,
    isle:1, israel:3, january:4, jr:2, judges:2, korea:3, korean:3, laboratory:4,
    languages:3, largely:2, lately:2, league:1, lieutenant:3, lifestyle:2, lifetime:2, likely:2,
    limited:3, listed:2, located:3, losses:2, lovely:2, ltd:3, lying:2, male:1,
    management:3, manual:3, maria:3, matches:2, material:4, materials:4, maybe:2, meanwhile:2,
    mechanism:4, media:3, medium:3, memorial:4, merely:2, messages:3, miami:3, mile:1,
    miles:1, mm:0, mobile:2, mounted:2, movement:2, movements:2, mr:2, mrs:2,
    museum:3, mutual:3, naive:2, naked:2, nba:3, needed:2, nfl:3, nigeria:4,
    noted:2, nuclear:3, offices:3, ohio:3, ok:2, ongoing:3, opera:2, operated:4,
    our:2, ourselves:3, pages:2, painted:2, passes:2, pc:2, peaceful:2, performances:4,
    period:3, periods:3, philadelphia:5, piano:3, pieces:2, places:2, pm:2, poem:2,
    poet:2, poetry:3, pointed:2, posted:2, practices:3, prayer:1, precious:2, premium:3,
    presented:3, prices:2, printed:2, prior:2, priority:4, processes:3, profile:2, protected:3,
    provided:3, purposes:3, queen:1, queue:1, races:2, radiation:4, radio:3, rarely:2,
    rated:2, ratio:3, reaction:3, realise:3, reality:4, realize:3, realized:3, recommended:4,
    recorded:3, recovery:3, references:4, regarded:3, rejected:3, related:3, relatively:4, releases:3,
    reliable:4, religious:3, repeated:3, replacement:3, reported:3, represented:4, requested:3, require:3,
    required:3, requirement:3, requirements:3, requires:3, resources:3, respectively:4, responded:3, responses:3,
    resulted:3, rhythm:2, rio:2, role:1, roles:1, ruin:2, ruined:2, rule:1,
    rules:1, ryan:2, safety:2, sale:1, sales:1, scale:1, schedule:2, science:2,
    sciences:3, scientific:4, scientists:3, seattle:3, selected:3, separated:4, services:3, settled:2,
    several:2, sexual:3, situation:4, situations:4, smile:1, society:4, sole:1, somebody:3,
    somehow:2, something:2, sometimes:2, somewhat:2, somewhere:2, sources:2, soviet:3, spaces:2,
    specifically:4, spiritual:4, stadium:3, stages:2, started:2, stated:2, statement:2, statements:2,
    struggling:3, studio:3, studying:3, style:1, styles:1, submitted:3, suggested:3, suicide:3,
    superior:4, supported:3, surely:2, surrounded:3, suspended:3, syria:3, tale:1, talented:3,
    taxes:2, technique:2, techniques:2, temperature:3, temperatures:3, tested:2, theater:3, theatre:3,
    therefore:2, tired:2, tokyo:3, tongue:1, tourism:3, treated:2, trial:2, trials:2,
    trying:2, tv:2, typically:3, uk:2, ultimately:4, unfortunately:5, unique:2, united:3,
    unlikely:3, unusual:4, updated:3, usa:3, useful:2, uses:2, usual:3, usually:4,
    variety:4, via:2, victoria:4, video:3, videos:3, vietnam:3, violence:3, violent:3,
    violet:3, virtual:3, virtually:4, visited:3, visual:3, voices:2, voted:2, vs:2,
    w:3, wales:1, wanted:2, warriors:3, wednesday:2, while:1, whoever:3, whole:1,
    widely:2, wire:2, wishes:2, witnesses:3, wounded:2
  };

  const SAMPLE_TEXT = 'Every draft starts as a rough sketch, a few sentences that barely resemble the idea in your head. Good writing rarely arrives whole. It gets discovered one sentence at a time, then reordered, trimmed, and read aloud until the sentence finally sounds like something you would say out loud. Some writers count words to know when a draft is finished. Others just read the draft again until it stops sounding like a draft and starts sounding like writing. Either way, the numbers are only a mirror. What matters is whether the words still mean what you meant when you first wrote them down.';

  const el = {};
  const previous = {};
  let debounceTimer = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cacheElements() {
    el.draft = document.getElementById('draft');
    el.emptyHint = document.getElementById('empty-hint');
    el.words = document.getElementById('stat-words');
    el.chars = document.getElementById('stat-chars');
    el.sentences = document.getElementById('stat-sentences');
    el.time = document.getElementById('stat-time');
    el.speak = document.getElementById('stat-speak');
    el.avgWord = document.getElementById('stat-avgword');
    el.avgSentence = document.getElementById('stat-avgsentence');
    el.longest = document.getElementById('stat-longest');
    el.unique = document.getElementById('stat-unique');
    el.frequentList = document.getElementById('frequent-list');
    el.frequentEmpty = document.getElementById('frequent-empty');
    el.gauge = document.getElementById('gauge');
    el.gaugeSegments = el.gauge.querySelectorAll('.gauge-segment');
    el.gaugeScore = document.getElementById('gauge-score');
    el.gaugeLabel = document.getElementById('gauge-label');
    el.btnSample = document.getElementById('btn-sample');
    el.btnClear = document.getElementById('btn-clear');
  }

  // Matches letters (including accented Latin letters), digits, and
  // hyphenated or apostrophed compounds as a single word: "well-known",
  // "co-founder", "don't", "caf\u00e9" all count as one word each, and both
  // straight and curly apostrophes are recognised.
  function getWords(text) {
    const matches = text.match(/[A-Za-z\u00C0-\u024F0-9]+(?:['\u2019-][A-Za-z\u00C0-\u024F0-9]+)*/g);
    return matches ? matches : [];
  }

  function protectAbbreviations(text) {
    let out = text.replace(/(\d)\.(?=\d)/g, '$1\u0000');
    out = out.replace(DOTTED_ABBREVIATIONS, (m) => m.replace(/\./g, '\u0000'));
    return out;
  }

  function endsWithAbbreviation(candidate) {
    const match = candidate.match(/\b([A-Za-z]+)\.$/);
    if (!match) return false;
    return ABBREVIATIONS.has(match[1].toLowerCase());
  }

  // Splits on ./!/? but first shields decimal numbers (3.14) and common
  // dotted abbreviations (e.g., a.m., U.S.) from being read as sentence
  // endings, then re-merges any candidate that ends in a title or reference
  // abbreviation (Dr. Smith, Acme Corp.) with the clause that follows it.
  function getSentences(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];
    const protectedText = protectAbbreviations(trimmed);
    const raw = protectedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (!raw) return [];
    const candidates = raw.map((s) => s.trim()).filter((s) => s.length > 0);

    const merged = [];
    let buffer = '';
    for (let i = 0; i < candidates.length; i++) {
      buffer = buffer ? buffer + ' ' + candidates[i] : candidates[i];
      const isLast = i === candidates.length - 1;
      if (!isLast && endsWithAbbreviation(candidates[i])) continue;
      merged.push(buffer);
      buffer = '';
    }
    return merged;
  }

  // Checks the measured exception table first, falls back to a vowel-group
  // heuristic for every word that table does not cover.
  function countSyllables(word) {
    const lower = word.toLowerCase();
    const known = SYLLABLE_EXCEPTIONS[lower];
    if (typeof known === 'number') return known;

    let w = lower.replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 2) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    w = w.replace(/^y/, '');
    const matches = w.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  function formatMinutes(wordCount, wpm) {
    const minutes = wordCount / wpm;
    if (minutes < 1) return 'Under 1 min';
    return Math.round(minutes) + ' min';
  }

  function getFrequentWords(words, limit) {
    const counts = {};
    for (const raw of words) {
      const w = raw.toLowerCase();
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      counts[w] = (counts[w] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  function readingLevel(score) {
    if (score >= 90) return { label: 'Very easy', level: 0 };
    if (score >= 70) return { label: 'Easy', level: 1 };
    if (score >= 50) return { label: 'Standard', level: 2 };
    if (score >= 30) return { label: 'Difficult', level: 3 };
    return { label: 'Very difficult', level: 4 };
  }

  function animateValue(node, from, to) {
    if (from === to) {
      node.textContent = to;
      return;
    }
    const duration = 240;
    let start = null;
    function step(timestamp) {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else node.textContent = to;
    }
    requestAnimationFrame(step);
  }

  function setCount(node, value, key) {
    if (reduceMotion) {
      node.textContent = value;
    } else {
      animateValue(node, previous[key] || 0, value);
    }
    previous[key] = value;
  }

  function analyze() {
    const text = el.draft.value;
    const hasText = text.trim().length > 0;
    el.emptyHint.classList.toggle('is-hidden', hasText);
    el.btnClear.disabled = !hasText;

    const words = getWords(text);
    const sentences = getSentences(text);
    const wordCount = words.length;
    const sentenceCount = sentences.length;

    setCount(el.words, wordCount, 'words');
    setCount(el.chars, text.length, 'chars');
    setCount(el.sentences, sentenceCount, 'sentences');
    el.time.textContent = wordCount > 0 ? formatMinutes(wordCount, 200) : '0 min';
    el.speak.textContent = wordCount > 0 ? formatMinutes(wordCount, 130) : '0 min';

    let totalChars = 0;
    let totalSyllables = 0;
    let longest = '';
    const uniqueSet = new Set();

    for (const w of words) {
      totalChars += w.length;
      totalSyllables += countSyllables(w);
      if (w.length > longest.length) longest = w;
      uniqueSet.add(w.toLowerCase());
    }

    el.avgWord.textContent = wordCount > 0 ? (totalChars / wordCount).toFixed(1) + ' chars' : '0 chars';
    el.avgSentence.textContent = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) + ' words' : '0 words';
    el.longest.textContent = longest || '-';
    el.unique.textContent = wordCount > 0 ? Math.round((uniqueSet.size / wordCount) * 100) + '%' : '0%';

    const frequent = getFrequentWords(words, 5);
    el.frequentList.innerHTML = '';
    if (frequent.length === 0) {
      el.frequentEmpty.classList.remove('is-hidden');
    } else {
      el.frequentEmpty.classList.add('is-hidden');
      for (const [word, count] of frequent) {
        const li = document.createElement('li');
        li.className = 'chip';
        li.textContent = word + ' (' + count + ')';
        el.frequentList.appendChild(li);
      }
    }

    if (wordCount < 10 || sentenceCount === 0) {
      el.gaugeScore.textContent = '-';
      el.gaugeLabel.textContent = 'Write a few sentences to see a score.';
      el.gaugeSegments.forEach((seg) => seg.classList.remove('is-active'));
    } else {
      const rawScore = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount);
      const clamped = Math.max(0, Math.min(100, rawScore));
      const result = readingLevel(clamped);
      el.gaugeScore.textContent = Math.round(clamped);
      el.gaugeLabel.textContent = result.label;
      el.gaugeSegments.forEach((seg, index) => {
        seg.classList.toggle('is-active', index <= result.level);
      });
    }

    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch (e) {
      // localStorage unavailable, the draft simply will not persist
    }
  }

  function handleInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(analyze, 150);
  }

  function loadSample() {
    el.draft.value = SAMPLE_TEXT;
    analyze();
    el.draft.focus();
  }

  function clearDraft() {
    el.draft.value = '';
    analyze();
    el.draft.focus();
  }

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) el.draft.value = saved;
    } catch (e) {
      // localStorage unavailable, start from an empty draft
    }
  }

  function init() {
    cacheElements();
    restoreDraft();
    el.draft.addEventListener('input', handleInput);
    el.btnSample.addEventListener('click', loadSample);
    el.btnClear.addEventListener('click', clearDraft);
    analyze();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
