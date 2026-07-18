# Swatchbook

A color palette tool shaped like a real paint chip strip. Shuffle through generated shade sets, lift a palette straight out of a photo, lock the chips you want to keep, and copy the results as hex, RGB, HSL, or a block of CSS variables.

No build step. No frameworks. No accounts or servers. Everything, including the photo color extraction, runs in the browser.

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/swatchbook/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/swatchbook/)

## Why it looks like this

This project started from a single reference image: a plain vertical strip of four color bands, cream fading down into deep green. Rather than just borrowing those four colors, the whole interface is built around that same object: a single paint chip strip, complete with a punched hole at the top, a dashed perforation between chips (like the tear lines on a real hardware store sample), and a printed catalog name stamped in a mono typeface. When you drop in a photo, its dominant colors get lifted onto the strip and the photo itself gets pinned to the corner under a strip of tape.

Every generated strip gets a name, in the style of real paint chip branding, worked out from its own hue and lightness (things like "Quiet Fern" or "Deep Harbor"), so two palettes rarely feel interchangeable.

Type is split three ways on purpose:

- **Manrope** carries almost all of the text. Clean, neutral, does not compete with the colors.
- **Fraunces**, set in italic, appears only on single accent words inside a line, such as the "work" in the header or the "hand" in the footer. Same color and roughly the same size as the surrounding sans, so the shift in typeface itself carries the emphasis, the way a caption on Instagram or TikTok will drop into a script or serif for just one word.
- **IBM Plex Mono** handles anything that reads like it was printed or stamped: hex codes, the strip's catalog name, the format toggle.

Colors are the exact four sampled from the reference image (cream, pale yellow green, mid green, deep green), extended with a couple of derived tones for body text and button fills so contrast holds up at normal reading sizes.

## Features

- **Five generation modes.** Shades (a single hue carried light to dark, the same structure as the reference strip), Analogous, Complementary, Triadic, and Random.
- **Lift colors from a photo.** Drop an image onto the strip or choose one from disk. A small clustering pass (a light k-means implementation, no libraries) finds the photo's dominant colors and lays them out light to dark. Shuffling while a photo is attached lifts the colors again with a fresh starting point, rather than switching back to generated shades.
- **Lock any chip.** Locked chips sit out the next shuffle. Everything else keeps moving around them.
- **3 to 8 chips**, adjustable at any time.
- **HEX, RGB, or HSL**, switchable without changing the palette itself.
- **Copy a single chip** by clicking it, or **copy the whole palette as CSS custom properties** with one button.
- **Recent strips.** The last few palettes are kept in the browser (localStorage) so you can get back to one you liked. Only the colors are stored, not any photo you uploaded.
- Press space anywhere on the page to shuffle, as long as nothing else has focus.

## Files

```
swatchbook/
  index.html      structure and copy
  style.css       the design system: color tokens, type, the strip, controls
  script.js       state, color math, the k-means-lite extraction, all DOM wiring
  favicon.svg     a small version of the strip motif
  README.md       this file
```

Nothing else is required. Open `index.html` directly in a browser, or serve the folder with any static file server.

## Running it locally

```
cd swatchbook
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Opening `index.html` straight from disk also works, though the clipboard copy buttons need a browser that allows clipboard access from a `file://` page, which not all of them do. A local server sidesteps that.

## Adding it to this repo

Drop the `swatchbook` folder in alongside the other mini-projects. If GitHub Pages is already serving the repo from its root, this project will be live at:

```
https://<your-username>.github.io/mini-projects/swatchbook/
```

If there's an index page listing the other projects in this repo, add a line for Swatchbook there too.

## Notes on the color math

Palettes are generated in HSL, not by picking random hex values, so lightness and saturation stay in a controlled range and the strip always reads light at the top to dark at the bottom, whatever mode produced it.

Photo extraction downsamples the image to a max dimension of 100px before clustering, which keeps it fast and is plenty of resolution for finding dominant colors. It works best on photos with a few clearly distinct colors. A very busy, textured photo can produce muddier results, in which case shuffling again (which reclusters with a different starting point) usually helps.

## A note on browser support

Built against current versions of Chrome, Firefox, Safari, and Edge. It leans on CSS custom properties, `clamp()`, and flexbox gap, all of which have been standard for years, but it is not aiming for support in old versions of Internet Explorer or similarly dated browsers.
