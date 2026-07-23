# Inkwell

A tiny writing companion that turns your draft into *numbers* you can actually use. Paste or type text and watch word count, reading time, readability and word rhythm update as you go, entirely in the browser.

Live: enable GitHub Pages for this repo, then visit `https://madhurjyabaruah.github.io/mini-projects/inkwell/`

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/inkwell/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/inkwell/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/inkwell/)


## What it does

- Live word, character and sentence counts as you type
- Estimated reading time and speaking time
- Average word length and average sentence length
- Longest word and a vocabulary variety score (unique words as a percentage of total words)
- The five words you use most, once you have written enough for a pattern to show
- A readability gauge based on the Flesch Reading Ease formula, with a plain label from "very easy" to "very difficult"
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

## How the readability score works

The gauge runs the standard Flesch Reading Ease formula against your draft:

```
206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
```

Syllables are estimated with a vowel-group heuristic rather than a dictionary, so the score is a reasonable approximation, not a certified measurement. It is accurate enough to tell you whether a paragraph reads as plain or dense, which is the point.

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
- An offline dictionary-based syllable count instead of the heuristic

## Part of mini-projects

Sits alongside the other tools in this repository, styled from the same source palette so the collection reads as one set rather than several unrelated demos.
