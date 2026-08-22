# Signal

Translate your words into *morse*

A minimalist Morse code translator for the browser. Type text and watch it render as a live sequence of dots and dashes, then hear it played as audio tones. Or flip to Decode mode and go the other way.

---

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/signal/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/signal/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/signal/)



## Features

- Real-time text to Morse encoding with a visual dot and dash display
- Decode mode: paste any Morse sequence and translate it back to plain text
- Audio playback at 620 Hz using the Web Audio API, with standard ITU timing ratios
- Adjustable playback speed across five steps, from Very slow to Very fast
- Built-in reference chart covering all 26 letters and 10 digits
- Clicking a chart card in Encode mode inserts that character into your input
- No libraries, no build step, no server

---

## How to use

### Encode

Type a message in the input field. Signal converts each character as you type and renders the result as a visual field of dots and dashes, with the raw Morse string beneath it.

Supported characters: `A-Z`, `0-9`, and the punctuation marks `. , ? ' ! / + = @`

Characters not in the Morse alphabet are skipped silently rather than producing an error.

### Decode

Switch to Decode mode using the toggle in the header. Paste a Morse sequence into the input. The expected format is:

- Letters separated by a single space
- Words separated by ` / ` (space, forward slash, space)

Example input that spells SIGNAL:

```
... .. --. -. .- .-..
```

The decoded text appears live in the output area as you type or paste.

### Listen

Click Play to hear the Morse signal played through your speakers. Each dot and dash lights up in teal as it sounds. Click the button again to stop early.

Use the Speed slider to set the pace:

| Setting   | Base unit |
|-----------|-----------|
| Very slow | 192 ms    |
| Slow      | 128 ms    |
| Normal    | 80 ms     |
| Fast      | 50 ms     |
| Very fast | 29 ms     |

### Copy

The Copy button copies the current output to your clipboard. In Encode mode it copies the Morse string. In Decode mode it copies your raw input (useful for sharing a Morse sequence you have composed manually).

---

## Morse timing

Signal follows standard ITU-R M.1677 timing ratios:

- Dot: 1 unit
- Dash: 3 units
- Gap between signals within a letter: 1 unit
- Gap between letters: 3 units
- Gap between words: 7 units

The Speed slider scales the base unit length. Audio tones use a sine wave at 620 Hz with a short linear ramp at the start and end of each tone to avoid clicks.

---

## Tech

Pure HTML, CSS, and vanilla JavaScript. Tone generation uses the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), which is supported in all modern browsers. No external dependencies.

Typography: [DM Sans](https://fonts.google.com/specimen/DM+Sans) for body text, [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) italic for single-word emphasis.

---

## Running locally

Open `index.html` directly in any modern browser. No server required.

```
signal/
  index.html
  style.css
  script.js
  README.md
```

---

## Part of

[mini-projects](../) - a collection of small, self-contained web tools.
