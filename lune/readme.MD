# Lune

A minimalist lunar phase tracker that lives entirely in your browser. No API, no server, no data sent anywhere.

## What it shows

- The current moon phase drawn accurately on an HTML canvas
- Illumination percentage and days since the last new moon
- Countdown to the next full moon and new moon
- A monthly calendar with every day's phase rendered as a tiny moon icon
- A contextual note about what the current phase means
- A neon particle background that pulses with the palette

Click the moon to reveal a random fact about Earth's nearest neighbour.

## How the phase calculation works

The phase is derived from a known reference new moon: January 6, 2000 at 18:14 UTC. The elapsed time from that moment, modulo the mean synodic period of 29.530588853 days, gives the current age of the moon in its cycle. Illumination is the cosine relationship between phase angle and the fraction of the disc visible from Earth.

## How the moon is drawn

Each phase is drawn on Canvas 2D using two overlapping shapes clipped to the moon disc. A rectangle fills the bright half, and a terminator ellipse whose horizontal radius varies from full-moon-radius at new moon (creating a crescent by shadowing nearly the whole bright half), through zero at the quarters, to full-moon-radius again at full moon (expanding lit coverage to the complete disc). Craters are semi-transparent darkening circles drawn last. A radial gradient halo breathes softly around the disc on every frame.

## Running it

Open `index.html` in any modern browser. That is all.

## Stack

HTML, CSS, JavaScript. No dependencies. No build step.
