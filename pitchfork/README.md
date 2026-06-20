# Pitchfork — Browser-Based Guitar & Instrument Tuner

A real-time instrument tuner that runs entirely inside the browser tab. No installs, no accounts, no audio ever leaves your device.

Part of the [mini-projects](../) collection.

**Version:** 1.0.0
**Status:** stable, feature-complete for the instruments listed below

---

## Overview

Pitchfork listens through your microphone, measures the exact frequency of whatever note you are playing, and tells you how far off you are in cents with a needle-style meter. It supports six tuning profiles and works on desktop, tablet, and mobile without any build step or external pitch-detection service.

## Features

- Real-time microphone-based pitch detection, no server round trip
- Six tuning modes: Acoustic Guitar, Electric Guitar, Bass Guitar, Ukulele, Violin, and a full Chromatic mode
- Live note name, frequency in Hz, signed cents deviation, and Flat / In Tune / Sharp status
- Animated needle meter with a per-instrument string reference rail
- Standard tuning reference table that updates with the selected instrument
- Start/Stop control with clear handling for denied or missing microphone permission
- Fully responsive, from 320px phones up to ultrawide monitors
- Keyboard accessible, semantic HTML, WCAG AA color contrast throughout

## How it works

Pitch detection runs entirely client-side using the Web Audio API. The microphone stream is read into a time-domain buffer and analyzed with **autocorrelation**: the signal is correlated against shifted copies of itself across a lag range, the strongest match marks the fundamental period, and a parabolic fit across the three best-matching lags recovers sub-sample precision. This is more accurate than reading raw FFT bins, which are too coarse to resolve a low guitar or bass string cleanly.

Each instrument profile narrows the expected frequency range to that instrument's actual strings, which speeds up detection and avoids octave errors. Readings are smoothed with a short rolling median so the needle settles instead of flickering, while a jump-detection check resets that smoothing instantly when you move to a different string.

No external pitch-detection API or library is used. The only network request the app makes is for the Google Fonts stylesheet; everything else, including all audio processing, stays on-device.

## Getting started

This is a static site, no dependencies and no build step.

```bash
# Option 1: just open it
open index.html

# Option 2 (recommended): serve it locally so microphone
# permission prompts behave consistently across browsers
npx serve .
# or
python3 -m http.server 8000
```

Then open the page, press **Start Tuning**, and allow microphone access when prompted.

## Project structure

```
pitchfork-tuner/
├── index.html      # Markup: hero, instrument selector, meter, guide, footer
├── style.css        # Brutalist styling, responsive layout, color tokens
├── script.js         # Audio capture, pitch detection, rendering, nav behavior
└── README.md
```

## Browser support

Requires a browser that implements the Web Audio API and `getUserMedia`. Tested on current versions of Chrome, Firefox, Edge, and Safari, on both desktop and mobile. Microphone access requires a secure context (`https://` or `localhost`).

## Known limitations

- Very noisy environments can prevent a clean lock; the noise gate filters quiet input but does not isolate a single instrument from background sound
- Polyphonic input (strumming multiple strings at once) is not supported; pitch detection assumes a single sustained note
- Chromatic mode has no fixed reference, so it matches whatever the nearest note in the 12-tone equal-tempered scale happens to be

## Roadmap ideas for a future version

- Adjustable reference pitch (A4 != 440Hz support)
- Alternate tunings (drop D, open G, etc.)
- Visual waveform or spectrum display alongside the meter
- Persisted instrument/tuning preference between sessions

## License

MIT. Use it, fork it, break it, fix it.
