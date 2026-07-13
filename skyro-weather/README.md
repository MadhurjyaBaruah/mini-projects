# Skyro Weather

A modern, production-quality weather application built with vanilla HTML, CSS, and JavaScript. Features a glassmorphism design with a slow animated gradient background, real-time weather data, animated weather icons, and a floating navigation dock.

[![Website Preview](https://api.microlink.io/?url=https://madhurjyabaruah.github.io/mini-projects/skyro-weather/&screenshot=true&meta=false&embed=screenshot.url)](https://madhurjyabaruah.github.io/mini-projects/skyro-weather/)

## Features

- Current weather with temperature, feels-like, humidity, wind, visibility, pressure, UV index
- Animated weather icons for all WMO condition codes (day and night variants)
- Sunrise and sunset with animated arc tracker
- Moonrise and moonset times
- Air Quality Index with PM2.5, PM10, NO2, and O3 breakdown
- Wind compass with speed, gust, and direction
- 24-hour scrollable hourly forecast
- 7-day forecast with temperature range bars
- Today's weather summary
- City search with live autocomplete
- Auto geolocation detection with first-visit permission popup
- Floating bottom navigation dock (home, search, location, hourly, 7-day, theme)
- Light and dark mode with system preference detection
- Slow animated gradient background
- Fully responsive across all screen sizes
- No API key required
- Powered by Open-Meteo

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript (ES6+)
- [Open-Meteo](https://open-meteo.com/) — free weather and air quality API
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — city search
- [Nominatim / OpenStreetMap](https://nominatim.org/) — reverse geocoding
- [Meteocons / @meteocons/svg](https://github.com/basmilius/weather-icons) — animated SVG icons (bundled inline)
- Google Fonts: Inter, DM Sans


## Project Structure

```
skyro-weather/
├── index.html   — markup and layout
├── styles.css   — design system, animations, dark mode, responsive
├── app.js       — weather logic, API calls, UI rendering
├── icons.js     — 52 inline animated SVG weather icons
└── README.md
```

## Credits

Built by **Madhurjya Baruah**. Enhanced with AI assistance for design system, UI architecture, responsive behavior, and UX improvements.
