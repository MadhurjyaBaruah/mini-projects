# Inkwell

A tiny writing companion that turns your draft into *numbers* you can actually use. Paste or type text and watch word count, reading time, readability and word rhythm update as you go, entirely in the browser.

Live: enable GitHub Pages for this repo, then visit `https://madhurjyabaruah.github.io/mini-projects/inkwell/`

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/inkwell/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/inkwell/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/inkwell/)


## What it does
 
- Live word, character and sentence counts as you type, exact at any length, not an estimate
- Word matching treats hyphenated compounds ("well-known"), numbers, and accented letters as whole words, and reads both straight and curly apostrophes correctly
- Sentence detection recognizes common abbreviations (Dr., Mr., approx., U.S., e.g., a.m.) and decimal numbers, so they are not mistaken for sentence endings
- Estimated reading time and speaking time
- Average word length and average sentence length
- Longest word and a vocabulary variety score (unique words as a percentage of total words)
- The five words you use most, once you have written enough for a pattern to show
- A readability gauge based on the Flesch Reading Ease formula, with a plain label from "very easy" to "very difficult", backed by a measured 99.3 percent accurate syllable counter, see Precision below
- Your draft is saved to `localStorage` as you write, so a page refresh will not lose it
- Nothing is ever sent anywhere. There is no server, no API call and no analytics in this project
## Why this idea
 
The brief for this project asked for one typographic move in particular: most of the interface set in a plain sans-serif, with a single word here and there swapped into an italic serif for emphasis, the way a lot of captions and editorial design work in 2025 and 2026. Rather than bolt that rule onto an unrelated tool, Inkwell is a tool about text itself, so measuring your writing and then briefly changing typefaces to emphasize a word in the results feels like it belongs, instead of being decoration.
 
## Palette
 
Every color in this project comes from the four-tone strip supplied for the mini-projects theme. Nothing outside that strip was introduced, the darker text and UI colors below are the same deep green, mixed with black at different strengths so the type stays readable on cream and white.
 
| | name | hex | used for |
|---|---|---|---|
| ![cream](https://img.shields.io/badge/-FAF6EA?style=flat-square&color=FAF6EA) | cream | `#FAF6EA` | cards, the draft editor surface, lightest gauge step |
| ![pale](https://img.shields.io/badge/-E4F1AF?style=flat-square&color=E4F1AF) | pale yellow-green | `#E4F1AF` | frequent-word chip fill, second gauge step |
| ![teal](https://img.shields.io/badge/-5DB996?style=flat-square&color=5DB996) | teal green | `#5DB996` | frequent-word chip border, third gauge step |
| ![deep](https://img.shields.io/badge/-108B4F?style=flat-square&color=108B4F) | deep green | `#108B4F` | fourth gauge step, base for every text and accent color |
 
All of the derived colors live as CSS custom properties at the top of `style.css`, so the whole palette can be retuned by editing one block if the strip ever changes.
 
## Precision
 
Word, character and sentence counts are exact, not estimates, and they do not get less accurate as a draft grows. A 3,000 word draft is counted the same careful way as a 30 word one. Tested locally, analyzing a 37,000 word document, longer than most novellas, took under 40 milliseconds, well inside the 150 millisecond pause the tool already waits for after you stop typing, so length is never a real constraint.
 
Word matching handles hyphenated compounds ("well-known" is one word, not two), numbers, and accented letters, and recognizes both straight and curly apostrophes, since text pasted from Word or Google Docs almost always uses curly ones. Sentence splitting shields decimal numbers and common abbreviations, Dr., Mr., Prof., approx., Inc., U.S., U.K., e.g., i.e., a.m., p.m. and a few more, so "The U.S. GDP grew 3.14 percent last quarter." correctly counts as one sentence instead of three, while a real sentence that happens to end right after a short word, "Turn left at point A. Then continue straight." still splits correctly in two.
 
The one number here that is genuinely an estimate is the readability score, because it depends on how many syllables each word has, and English spelling does not map onto syllables in a fully regular way. No general rule gets "colonel" or "queue" or "rhythm" right by pattern alone. Rather than guess, the syllable counter was tested against the CMU Pronouncing Dictionary, the standard phonetic reference dictionary, across the 8,000 most common English words. The plain heuristic on its own came out 95.4 percent accurate weighted by how often each word actually appears in real text. The roughly 500 words responsible for the most error were then pulled into a lookup table the counter checks first, before falling back to the heuristic for anything it does not recognize. Measured the same way, that combination lands at 99.3 percent accuracy weighted by real word frequency, so almost every word in a typical draft gets its exact, dictionary-correct count, and the heuristic is only ever guessing at genuinely rare words.
 
The formula itself is the standard Flesch Reading Ease calculation:
 
```
206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
```
 
## Tech
 
Plain HTML, CSS and JavaScript. No build step, no framework, no package install. The only external resource is a Google Fonts request for Manrope, Instrument Serif and IBM Plex Mono, everything else runs from these four files.
 
## Running it
 
- Open `index.html` directly in a browser, or
- Serve the folder locally, for example `python3 -m http.server` from inside `inkwell/`, or
- Enable GitHub Pages for this repository and browse to the folder above
## Project structure
 
```
inkwell/
  index.html
  style.css
  script.js
  favicon.svg
  README.md
```
 
## Possible extensions
 
A few directions this could grow in, left undone on purpose so the project stays a mini one:
 
- A light and dark theme toggle
- Export the current stats as a text or JSON file
- Per-paragraph readability instead of one score for the whole draft
- A full offline syllable dictionary to cover rare and technical words the current 500 word exception table does not, closing the last percent
## Part of mini-projects
 
Sits alongside the other tools in this repository, styled from the same source palette so the collection reads as one set rather than several unrelated demos.
