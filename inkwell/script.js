/*
  Inkwell
  All analysis runs locally. Nothing in this file makes a network request
  or sends the draft anywhere, the only side effect is localStorage so a
  draft survives a page refresh.
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

  function getWords(text) {
    const matches = text.match(/[A-Za-z']+/g);
    return matches ? matches : [];
  }

  function getSentences(text) {
    const trimmed = text.trim();
    if (!trimmed) return [];
    const matches = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (!matches) return [];
    return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  function countSyllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
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
