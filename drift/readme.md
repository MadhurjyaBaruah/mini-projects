# Drift

An ambient sound mixer that runs entirely in your browser. Slide five layers up and down, pick a scene, and build the room you want to work or sleep in.

Nothing is streamed and no audio files are loaded. Every sound is generated live with the Web Audio API.

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/drift/)**

_or click the preview below._

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/drift/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/drift/)

## What it does

- Five layers: **Rain**, **Wind**, **Hum**, **Deep** and **Ember**, each with its own level slider
- One-click scenes (Rainy window, Campfire, Open field, Deep focus, Storm)
- Master volume with a soft fade when you start and stop
- Sleep timer (15, 30 or 60 minutes) that fades the sound out over the last 20 seconds and only counts down while audio is playing
- "Surprise me" for a random mix, "Silence all" to zero everything
- Copy mix link: your levels get packed into the URL hash so you can send someone the exact mix
- Your last mix is remembered in localStorage
- Glowing lines in the background that grow with each layer and react to the loudness of the output
- Space bar starts and pauses

## How the sounds are made

| Layer | Recipe |
| --- | --- |
| Rain | Pink noise through a highpass and lowpass, two copies panned left and right, plus a thin bright band of white noise on top |
| Wind | Pink noise through a bandpass filter whose pitch drifts slowly, with a second slow oscillator making the volume swell |
| Hum | A low A (55 Hz) with a few overtones, each slightly detuned, with a very slow tremolo |
| Deep | Brown noise through a lowpass filter, panned wide |
| Ember | A soft brown noise roar underneath, plus tiny filtered bursts of white noise fired at random intervals |

The noise buffers are generated once when you first press play, and the loop points are crossfaded so you do not hear a click when they repeat.

All of the audio goes through a master gain, a compressor so stacking every layer does not clip, and an analyser that feeds the background animation.

## Running it

There is no build step and no dependencies. Open `index.html` in a browser.

Browsers will not start audio until you interact with the page, so nothing plays until you press the big button.

If you would rather use a local server:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Putting it on GitHub Pages

1. Put the `drift` folder in your `mini-projects` repo.
2. In the repo settings, open **Pages** and set the source to your main branch, root folder.
3. After it builds, the project lives at `https://<your-username>.github.io/mini-projects/drift/`.

All paths in the project are relative, so it works from a subfolder without changes.

## Files

```
drift/
  index.html   page structure
  style.css    palette, layout, background glow
  script.js    audio engine, mixer, timer, canvas lines
  README.md
```

## Tweaking it

- Levels per layer are trimmed in the `LAYERS` list at the top of `script.js`. If a layer feels too loud or too quiet on your speakers, change its `scale` value.
- Scenes are just objects in the `SCENES` list, so adding one is a single line.
- Colors live in the `:root` block of `style.css`.

## Design notes

The palette is four colors: cream `#FAF6EA`, pale yellow-green `#E4F1AF`, teal green `#5DB996` and deep green `#108B4F`. Body text uses a much darker shade of the same green so it stays readable on cream.

Type is DM Sans for almost everything, with Instrument Serif italic reserved for a single word in a line (the *sound* in the headline and the *own* in the mixer title). Both fonts load from Google Fonts and fall back to system fonts if you are offline.

## Browser support

Any recent Chrome, Edge, Firefox or Safari. Stereo panning is skipped on browsers that lack `StereoPannerNode`, and the sound simply comes out mono.

## Known limits

- The Hum layer sits very low, so small laptop speakers will mostly play its overtones. Headphones show it off better.
- The sleep timer runs while the tab is open. If the browser fully suspends the tab, the countdown catches up when you return.
