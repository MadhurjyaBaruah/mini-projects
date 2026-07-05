# Habit Tracker

A small local habit tracker. Add a habit, mark it done for the day, and a streak map fills in below it, similar in spirit to a GitHub contribution graph, except the color of each square is driven by how long the streak was on that day rather than a flat done or not-done state.

No build step, no backend, no accounts. Everything lives in the browser's `localStorage`, so it works as a static page on GitHub Pages.

## Features

- Add any number of habits by name.
- Mark today done from a single button on each habit card.
- Click any past square in the streak map to correct an earlier day, useful if you forgot to log something yesterday.
- Current streak and best streak shown per habit, computed from the actual completion history rather than stored as separate counters, so they can never drift out of sync with the map.
- A streak map covering the last 17 weeks per habit. Color depth increases with how many consecutive days the streak had reached by that date: a single day is a pale square, a month-long run is the deepest green in the palette.
- Header stats summarizing total habits, how many are done today, and the longest streak across all of them.
- Deleting a habit asks for confirmation first, since it also removes its history.
- Works down to a small phone width; the streak map scrolls horizontally within its card and opens already scrolled to the current week.

## How the streak math works

`script.js` keeps completions as a plain array of `YYYY-MM-DD` strings per habit. From that array:

- **Current streak** counts backward from today. If today has not been marked yet, it checks yesterday first, so the streak stays alive until the day actually ends rather than resetting the moment you wake up.
- **Best streak** sorts the completion dates and finds the longest run of consecutive days anywhere in the history.
- **Map color** is computed the same way, but per date: each day gets the length of the run ending on that day, which is then bucketed into one of five shades mixed from the palette's pale, sage, and forest tones.

These three numbers are recalculated from the raw dates on every render rather than cached, so there is nothing to keep in sync by hand.

## Files

```
habit-tracker/
  index.html
  style.css
  script.js
  README.md
```

Everything is vanilla HTML, CSS, and JavaScript with no dependencies, so it can sit as its own folder inside a repo of mini projects and be linked to directly, for example `your-username.github.io/mini-projects/habit-tracker/`.

## Running it locally

Any static file server works, for example:

```
cd habit-tracker
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Opening `index.html` directly by double-clicking it also works, since nothing here depends on a server.

## Notes

- Data is stored only in the browser that added it, under the `localStorage` key `habit-tracker:habits`. There is no sync between devices and no server involved.
- Clearing site data or browsing storage for the page removes the habits.
- The page loads the Fraunces, Manrope, and Space Mono fonts from Google Fonts. If you would rather not depend on that, swap the `<link>` tags in `index.html` for local font files and point the `--font-*` variables in `style.css` at them.
