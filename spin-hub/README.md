# SpinHub 🎡

> A polished, fully-featured spinning wheel hub — no frameworks, no build tools, just HTML, CSS, and vanilla JS.

---

## Overview

SpinHub is a browser-based decision-making app built around spinning wheels. It ships with **12 ready-made wheel templates** (food, movies, workouts, prizes, and more), a full **custom wheel builder**, rich **per-item customisation**, **local storage persistence**, and a **smooth animated spin engine** — all in a single dependency-free codebase.

The design follows a minimal, modern aesthetic using an earthy green palette with plenty of whitespace, soft shadows, and smooth transitions. It's mobile-first and fully responsive.

---

## Features

### Home Screen
- Animated decorative hero wheel
- 12 predefined template cards with icon, title, description, and quick-open button
- Recently used wheel chips for fast re-access

### Wheel Builder
- Live canvas preview that updates as you type
- Unlimited items with drag-and-drop reordering
- Per-item: label, emoji, custom segment colour, and probability weight
- Duplicate or delete individual items
- Full appearance controls: wheel size, font, font size, border, pointer style, centre decoration
- Animation controls: spin duration, direction (CW / CCW), easing style (smooth / bouncy / elastic)
- Sound effects (Web Audio API) and confetti toggles
- Background: solid colour or two-stop radial gradient (palette colours)

### Spin Engine
- Weighted random selection (higher weight = higher chance)
- Smooth acceleration and natural deceleration via cubic / bounce / elastic easing
- Tick sound effects during spin
- Result modal with 🎉 winner display, confetti burst, and win chime
- "Spin Again", "Remove Winner & Spin", and "Close" actions

### My Wheels
- Grid view of all saved wheels with mini canvas preview thumbnails
- Filter by All / Favourites / Custom / Template
- Search by name
- Per-card actions: Spin, Edit, Duplicate, Rename, Favourite, Delete
- Confirm-before-delete modal

### Persistence
- Everything stored in `localStorage` — no server needed
- Saved wheels, recent history, and user preferences survive page refreshes

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Markup     | HTML5 (semantic)        |
| Styles     | CSS3 (custom properties, grid, flexbox) |
| Logic      | Vanilla JavaScript (ES6+, Canvas API, Web Audio API) |
| Storage    | localStorage            |
| Build      | None – open `index.html` |

No npm. No bundler. No framework. No CDN dependencies.

---

## Getting Started

```bash
# Clone the mini-projects repo (or this folder)
git clone https://github.com/your-username/mini-projects.git

# Open SpinHub
open mini-projects/spinner-hub/index.html
```

Or simply drag `index.html` into any browser.

---

## Folder Structure

```
spinner-hub/
├── index.html       # App shell & all views
├── style.css        # Design system + component styles
├── script.js        # All application logic (modular, commented)
├── README.md        # This file
│
├── assets/
│   ├── icons/       # (placeholder for future custom icons)
│   ├── sounds/      # (placeholder for future audio files)
│   └── images/      # (placeholder for screenshots / OG image)
│
└── data/            # (placeholder for exportable JSON wheel packs)
```

---

## Colour Palette

| Token          | Hex       | Usage                        |
|----------------|-----------|------------------------------|
| `--bg`         | `#F5F5E8` | Page background (cream)      |
| `--surface`    | `#EEF4DC` | Cards, panels                |
| `--mint`       | `#D4E8A0` | Light accent, hovers         |
| `--teal`       | `#5BB88A` | Primary interactive colour   |
| `--forest`     | `#1E8A3C` | Dark primary, headings, CTA  |
| `--text`       | `#1A2B1F` | Body text                    |
| `--text-muted` | `#4A6852` | Secondary text, labels       |
| `--border`     | `#C6DFA8` | Borders, dividers            |

---

## Screenshots

> _Add screenshots here once the project is running._

| Home | Builder | My Wheels | Result |
|------|---------|-----------|--------|
| `assets/images/home.png` | `assets/images/builder.png` | `assets/images/my-wheels.png` | `assets/images/result.png` |

---

## Keyboard Shortcuts

| Key       | Action                          |
|-----------|---------------------------------|
| `Space`   | Spin the wheel (builder view)   |
| `Escape`  | Close any open modal            |
| `Enter`   | Confirm modal / item editor     |
| `Tab`     | Navigate interactive elements   |

---

## Accessibility

- Semantic HTML5 landmarks and `role` attributes
- `aria-label` on all icon-only buttons
- Keyboard-navigable modals and context menus
- Visible focus rings on all interactive elements
- Colour contrast ≥ 4.5:1 for body text against backgrounds
- `prefers-reduced-motion` media query disables animations

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires ES6+ and Canvas API — both universally available. Web Audio API is used for sound effects and degrades gracefully when unavailable.

---

## Future Improvements

- [ ] **Export / Import** – download wheels as JSON and share them
- [ ] **PWA / offline** – service worker for offline use and installability
- [ ] **Wheel packs** – curated JSON packs (languages, capitals, trivia)
- [ ] **Timer mode** – auto-spin every N seconds for classroom use
- [ ] **History log** – record every spin result with timestamps
- [ ] **QR code share** – encode wheel config in a shareable URL
- [ ] **Dark mode** – honour `prefers-color-scheme: dark`
- [ ] **Multiplayer** – real-time shared spin via WebSockets
- [ ] **Custom audio** – upload your own spin sound / win jingle

---

## Licence

MIT — free to use, modify, and distribute.
