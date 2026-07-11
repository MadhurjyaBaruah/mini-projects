# Glade, a typing speed test

A small, single-page typing test. Pick a time limit or a word count, type the
words as they appear, and get your speed and accuracy when you are done. Part
of the `mini-projects` collection.

Live text moves through a highlighted "clearing" as you type, untyped words
sit in a soft haze until you reach them, and your results are shown as a pair
of growth-ring style arcs rather than a plain progress bar.

## Features

- Two test types: a countdown timer (15, 30, 60 or 120 seconds) or a fixed
  word count (10, 25, 50 or 100 words)
- Live word-per-minute and elapsed/remaining time while you type
- Per-letter feedback: correct, incorrect, and extra characters typed past
  the end of a word are all tracked separately
- Results screen with net WPM, raw WPM, accuracy, character breakdown and
  time taken, shown with an SVG ring meter
- A personal best is remembered for each mode and length combination, and a
  small badge appears when you beat it
- Your last six runs are kept in a local history list
- Restart with the button, by clicking type again, or with the keyboard
  by pressing Tab then Enter, without leaving the keyboard
- No build step, no dependencies, and no network requests apart from the
  two Google Fonts used for type

## Tech

Plain HTML, CSS and JavaScript. No frameworks, no bundler. Results, history
and personal bests are kept in `localStorage`, so nothing is sent anywhere
and nothing needs a server. This makes it a straightforward fit for GitHub
Pages, or for simply opening `index.html` directly in a browser.

## Files

```
typing-speed-test/
  index.html   markup and layout
  style.css    palette, type and layout rules
  script.js    test logic, timing, scoring and storage
  README.md    this file
```

## Running it locally

Open `index.html` in a browser. There is nothing to install and nothing to
build. If you would rather serve it over a local server, any static file
server works, for example:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000/typing-speed-test/`.

## Deploying with GitHub Pages

From the repository settings, turn on Pages for the branch this folder lives
on, either serving the repository root or the `/typing-speed-test` folder
directly depending on how the rest of `mini-projects` is organized. No build
step is required.

## Design notes

The palette comes from a four-tone reference: a warm cream background, a
pale moss highlight for the word currently being typed, a sage accent for
the caret and one of the result rings, and a deeper forest green for
primary actions, correct letters and the other result ring. A muted rust
tone is added only to mark mistakes, since a typing test needs some way to
show an error that a four-color natural palette does not include on its own.

Type pairs a serif display face (Fraunces) for the wordmark and the big
result number against a plain sans (Work Sans) for interface text, with a
monospace face (IBM Plex Mono) for the typing area itself and every figure
on the page, since fixed-width digits keep timers and stats from shifting
around as they update.

## Possible extensions

- Punctuation and number modes
- A quote mode using short public-domain text instead of single words
- A line chart of WPM over the course of a run, not just the final number
- Exporting run history as a file
