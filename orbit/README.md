# Orbit

A small gravity sandbox that runs in the browser. Drag on the stage to throw a body into a system, watch it bend around everything else, and see what settles and what flies apart.

Plain HTML, CSS and JavaScript. No build step, no dependencies, so it works as-is on GitHub Pages.

## Live Demo

**🔗 [Open Live Website](https://madhurjyabaruah.github.io/mini-projects/orbit/)**

_or click the preview below._

[![Website Preview](https://image.thum.io/get/width/1200/crop/800/https://madhurjyabaruah.github.io/mini-projects/orbit/)]
(https://madhurjyabaruah.github.io/mini-projects/orbit/)

## What you can do

- **Launch bodies.** Press on the stage, drag, and release. The drag line is the launch direction and its length sets the speed. A dotted preview shows where the body will go before you let go.
- **Drop one at rest.** A plain click places a body with no velocity and lets gravity pull it in.
- **Start from a system.** Six presets: Solar, Binary, Figure eight, Comet, Rings and Swarm.
- **Change the rules.** Gravity strength, time speed and trail length all have sliders.
- **Pick the next body.** Set its mass and color before you launch it.
- **Look closer.** Zoom with the wheel or the buttons, pan with a right drag (or shift and drag), and pinch on a touch screen.
- **Undo.** Every launch, preset and clear can be stepped back.

### Keyboard

| Key | Action |
| --- | --- |
| Space | Pause or resume |
| Z | Undo |
| R | Reload the current preset |
| C | Clear the stage |
| Esc | Cancel a launch while dragging |

## The presets

| Preset | What it shows |
| --- | --- |
| Solar | One star, five planets and a moon that orbits its own planet |
| Binary | Two equal stars circling each other, with two planets far outside |
| Figure eight | Three equal bodies chasing each other along a single figure eight track |
| Comet | A very stretched orbit that swings close to the star and back out |
| Rings | A thin ring of light bodies with one heavier planet stirring it |
| Swarm | A crowd of small bodies on slightly different orbits that slowly gather into planets, never the same way twice |

The figure eight is the Chenciner and Montgomery solution to the three-body problem (2000), scaled to the size of the stage. It is balanced on a knife edge: nudge one body with a launch and the pattern falls apart.

## How it works

The simulation is a direct n-body calculation. Every body pulls on every other body with a force proportional to the product of their masses and inversely proportional to the square of the distance between them.

- **Integrator.** Drift-kick-drift leapfrog. It is symplectic, so energy wobbles slightly but does not creep, and orbits stay orbits for a long time. In testing, every preset (with merging off) kept total energy within 0.01 percent over two minutes of running time.
- **Softening.** A small softening length is added to every distance so two bodies passing very close do not receive an enormous kick.
- **Time stepping.** Each frame is split into sub-steps no longer than 0.125 time units, so running at 3x does not make the physics less accurate, only more work. The step size depends on elapsed time, not frame count, so a 120 Hz screen runs at the same speed as a 60 Hz one.
- **Merging.** When two bodies touch, the lighter one folds into the heavier one. Mass and momentum are conserved. Turn this off to let bodies pass through each other.
- **Launch preview.** The dotted path is a copy of the whole system run forward with your new body added, so it accounts for the pull of every other body and for the new body pulling back.
- **Presets use the current gravity.** The starting speeds are worked out from the gravity slider, so orbits begin circular whatever strength you have chosen.
- **Escapees.** A body that gets 40,000 units from the origin is dropped so it does not slow things down forever.

## Files

```
orbit/
  index.html    page structure and controls
  style.css     palette, type, neon background, layout
  physics.js    the n-body engine (no DOM access, easy to test on its own)
  presets.js    the starter systems
  render.js     all canvas drawing
  script.js     input, camera, controls and the main loop
  README.md
```

## Running it

Open `index.html` in a browser. That is all.

If you prefer a local server:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Putting it on GitHub Pages

If this folder lives inside a repo such as `mini-projects`:

1. Push the repo to GitHub.
2. In the repo, open **Settings**, then **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick your main branch and the `/ (root)` folder, and save.
4. After a minute the project is live at `https://<your-username>.github.io/mini-projects/orbit/`.

All paths in the project are relative, so it works from a sub-folder without changes.

## Design notes

- **Palette.** Cream `#FAF6EA`, pale yellow green `#E4F1AF`, teal green `#5DB996` and deep green `#108B4F`. The simulation stage uses a much darker green so the glow reads as neon.
- **Type.** DM Sans for almost everything, with Instrument Serif in italic reserved for one word per heading as emphasis. The serif is scaled slightly up so the two sit at the same optical size, and it keeps the same color as the line around it.
- **Background.** Slowly turning glowing rings and two drifting soft lights sit behind the page. They stop if the browser asks for reduced motion.
- **Settings.** Slider values and toggles are remembered in `localStorage`. If storage is blocked the app still works, it just does not remember.

## Ideas for later

- Drag an existing body to move it instead of launching a new one
- Show total energy and angular momentum as a live readout
- Save and share a scene through the URL
- A Lagrange point preset

## Fonts

Loaded from Google Fonts: [DM Sans](https://fonts.google.com/specimen/DM+Sans) and [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif). If the fonts cannot load, the page falls back to system sans-serif and Georgia.
