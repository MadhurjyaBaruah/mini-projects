# Vestige

A minimalist digital time capsule. Write a letter to your future self, seal it with a date, and let time do the rest. When the day arrives, your capsule unlocks and the message will be waiting.

---

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/vestige/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/vestige/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/vestige/)




## What it does

Create a capsule with a title, a personal message, and an unlock date. Until that date passes, the message stays sealed behind a blur. Once the date arrives, you get a prompt to open it. The full letter is revealed and saved to your collection.

All data is stored in your browser via localStorage. No account, no backend, no sync.

## Three states

- **Sealed** -- message hidden, blurred preview bars hint at content inside
- **Ready** -- unlock date has passed, waiting for you to open it
- **Opened** -- full message revealed, saved with the date you read it

## Features

- Quick-pick unlock dates: 1 month, 3 months, 6 months, or 1 year
- Friendly label confirms the unlock date before sealing
- Capsules sorted by priority: ready first, sealed by soonest unlock, opened most recent
- Escape key and backdrop click close any open panel
- Enter in the title field moves focus to the message
- Keyboard accessible throughout
- Responsive down to 320px
- Zero dependencies, no build step

## Stack

Plain HTML, CSS, and vanilla JavaScript. No libraries. No bundler. Open `index.html` in any browser and it runs.

## Running locally

```bash
git clone https://github.com/yourusername/mini-projects.git
cd mini-projects/vestige
open index.html
```

Or just double-click `index.html`. Works on any static host including GitHub Pages with no configuration.

## GitHub Pages

Enable GitHub Pages for the `mini-projects` repo pointing at the root of `main` (or `/docs`), then navigate to:

```
https://yourusername.github.io/mini-projects/vestige/
```

## Design

| Token | Value |
|---|---|
| Cream | `#FAF6EA` |
| Pale green | `#E4F1AF` |
| Teal | `#5DB996` |
| Deep green | `#108B4F` |

Typography pairs **DM Sans** (body, weight 300 to 500) with **Cormorant Garamond** italic reserved for one or two words per line as emphasis. The contrast reads as intentional rather than decorative because only a single word switches typeface while size and color stay consistent -- a technique common in editorial and short-form video captions.

The blurred preview bars on sealed cards are the project's signature detail. They suggest there is content inside without revealing it, making the seal feel tangible.

## Project structure

```
vestige/
  index.html   page structure and modal markup
  style.css    tokens, layout, card states, animations
  app.js       state management, rendering, event handling
  README.md    this file
```
