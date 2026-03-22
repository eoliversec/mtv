# CLAUDE.md

## Project overview

Missile Trajectory Visualization (MTV) — an interactive SVG chart comparing ballistic, cruise, and boost-glide missile trajectories by country. Pure HTML/CSS/JS, no build step. Open `index.html` in a browser.

## File structure

- `index.html` — markup, script/style links, theme toggle, controls container, legend container
- `styles.css` — CSS variables for dark/light themes, shared button styles, layout
- `data.js` — all country/missile data, flight phases, type descriptions, color definitions. Loaded before app.js
- `app.js` — rendering logic, math helpers, event listeners, dynamic legend/buttons. Uses `defer`
- `CONTRIBUTING.md` — contributor guide for adding countries/data

## Architecture

- Data is separated from rendering so contributors only edit `data.js`
- Country dropdown is populated dynamically from `COUNTRIES` in `data.js`
- Legend is dynamic: shows type colors in "All types" view, stage colors in single-type view
- Theme preference stored in `localStorage` under key `mtv-theme`
- DOM elements are cached in `$`-prefixed variables at the top of `app.js`
- Event handlers use delegation (no inline handlers)

## Key design decisions

- Cruise missiles use real altitude (0.1 km / 100m), not exaggerated. Y-axis switches to meters when scale is sub-1km
- Each flight phase has a distinct color — no two phases in the same missile type share a color
- "All types" view uses one solid color per type (not per stage) to distinguish trajectory types
- When a country lacks a missile type, show a message instead of hiding the button
- Type buttons are always visible regardless of selected country
- `TYPE_COLORS` should reference `SPEED_COLORS` constants, not hardcoded hex values

## Conventions

- Commit messages: single line, no co-authored-by
- Colors defined as hex in `SPEED_COLORS` in `data.js`; inline SVG fill values use `rgba()` format
- CSS custom properties prefixed with `--bg-`, `--text-`, `--border-`
- Dark theme vars defined once with combined selector `[data-theme="dark"], :root:not([data-theme="light"])`
- Shared UI button class `.btn` in CSS; type-specific classes extend it
