# Verdant

A minimalist plant care journal that lives in your browser. Add your houseplants, log when you water them, and see at a glance which ones are *thriving* and which ones need attention.

No accounts. No syncing. Just your plants and a quiet interface to keep track of them.

---
## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/verdant/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/verdant/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/verdant/)

---

## What it does

- Add plants with a name, optional species, and type
- Six illustrated plant types: Succulent, Snake Plant, Pothos, Cactus, Monstera, Herb
- Each type has its own suggested watering interval
- Health status calculated automatically from days since last watering
- Plants sorted by urgency: the ones that need water most appear first
- Full watering history per plant
- Notes field per plant
- Everything persists to localStorage, works fully offline

---

## Health levels

| Level      | When it shows                          |
|------------|----------------------------------------|
| Thriving   | Watered within the first 30% of interval |
| Doing well | 30-65% of interval elapsed             |
| Needs water | 65-100% of interval elapsed           |
| Water now  | Overdue, past the full interval        |

---

## Watering intervals by plant type

| Type        | Water every  |
|-------------|-------------|
| Succulent   | 14 days     |
| Snake Plant | 10 days     |
| Pothos      | 7 days      |
| Cactus      | 21 days     |
| Monstera    | 7 days      |
| Herb        | 3 days      |

---

## Running locally

No build step. Open `index.html` directly in any modern browser.

```
git clone https://github.com/yourusername/mini-projects.git
cd mini-projects/verdant
open index.html
```

Or serve with any static server:

```
npx serve .
python3 -m http.server 8080
```

---

## Stack

- HTML, CSS, JavaScript, no dependencies
- SVG plant illustrations generated in JS, color-coded by health
- Google Fonts: DM Sans (body) and Playfair Display (accent)
- Data stored in `localStorage` under the key `verdant_plants`

---

## Project structure

```
verdant/
  index.html    page structure and modal markup
  style.css     all styling, responsive down to 360px
  app.js        plant types, SVG generation, storage, rendering
  README.md     this file
```

---

Part of the [mini-projects](https://github.com/yourusername/mini-projects) collection.
