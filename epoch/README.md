# Epoch

A life calendar that maps your entire lifespan as a grid of weeks.

---

## What it does

Enter your date of birth. Epoch draws your life as a grid of small squares, 52 columns wide (one per week) and as many rows tall as your target lifespan. Filled squares are weeks already behind you. The teal square is the week you are in right now. The pale squares ahead are still yours.

There is something clarifying about seeing the whole thing at once.

The idea comes from Tim Urban's "Your Life in Weeks" post on Wait But Why, and from Oliver Burkeman's book *4000 Weeks*, which makes the case that most of us have around four thousand weeks to spend and rarely think in those terms.

---

## Features

- Enter any past birthdate and the grid draws immediately
- Adjustable target lifespan slider (60 to 100 years)
- Animated stats: weeks lived, weeks remaining, percentage elapsed
- Year labels and decade dividers on the grid for orientation
- Hover any square to see the corresponding calendar week
- Scales to any screen width, from desktop down to a narrow phone
- Zero dependencies, no build step, no data sent anywhere

---

## Stack

Plain HTML, CSS, and vanilla JavaScript. The grid is drawn with the HTML5 Canvas API, which handles thousands of squares without any performance issues. Fonts are Inter (sans-serif body) and Playfair Display italic (used only for single-word typographic emphasis) loaded from Google Fonts.

---

## Running locally

Clone the repository, navigate to this folder, and open `index.html` directly in a browser. No server or install step required.

```
git clone https://github.com/yourusername/mini-projects.git
cd mini-projects/epoch
open index.html
```

Or drag `index.html` into any browser window.

---

## GitHub Pages

This project deploys automatically to GitHub Pages from the root or a `/docs` folder. No build configuration needed.

---

## Color palette

| Name             | Hex       | Used for                            |
|------------------|-----------|-------------------------------------|
| Cream            | `#FAF6EA` | Page background                     |
| Pale yellow-green| `#E4F1AF` | Future weeks, borders, slider track |
| Teal green       | `#5DB996` | Current week, interactive elements  |
| Deep green       | `#108B4F` | Lived weeks, headings, stat cards   |

---

## Attribution

Concept from Tim Urban, Wait But Why - "Your Life in Weeks" (2014).
Further reading: *4000 Weeks* by Oliver Burkeman (2021).

---

## License

MIT
