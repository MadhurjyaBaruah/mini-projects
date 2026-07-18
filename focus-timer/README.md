# Focus Timer

A minimal Pomodoro-style focus timer built with plain HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies beyond a Google Fonts import.

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/focus-timer/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/focus-timer/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/focus-timer/)

## What it does

Follows the standard Pomodoro technique: 25 minutes of focused work followed by a short break, with a longer break after every four sessions.

- 25-minute focus sessions
- 5-minute short breaks after each session
- 15-minute long break after every four sessions
- SVG ring that drains in real time to show time remaining
- Four session dots that fill as you complete rounds
- Running totals for completed sessions and minutes focused
- Space bar shortcut to start and pause without leaving the keyboard
- Reset and Skip controls for flexibility

## File structure

```
focus-timer/
  index.html
  style.css
  app.js
  README.md
```

## Tech

- HTML, CSS, JavaScript - no libraries or build tools
- SVG `stroke-dashoffset` animation for the timer ring
- Google Fonts: DM Mono (time display), Inter (labels and controls)
- Works on GitHub Pages as-is

## Color palette

| Role | Hex |
|---|---|
| Background | `#fbf6e9` |
| Ring track / accents | `#e3f0af` |
| Active ring stroke | `#5db996` |
| Primary actions / headings | `#118b50` |

Break mode switches the ring stroke from teal to chartreuse so the resting state reads differently from the working state at a glance.

## Keyboard shortcut

`Space` - start or pause the timer from anywhere on the page (except when a button has focus)

## Live demo

[View on GitHub Pages](https://madhurjyabaruah.github.io/mini-projects/focus-timer/)



## Part of

[mini-projects](https://github.com/MadhurjyaBaruah/mini-projects/) - a collection of small, self-contained tools built with web standards.
