# Jeopardy Builder + Host (Frontend Only)

Single-page Jeopardy-style app built with React + Vite + Tailwind. It runs entirely in the browser with no backend and stores complete game state in JSON files.

## Features implemented

- `Home` screen with `Make Game`, `Import Game`, and `Host Game` actions.
- `Builder` screen with dynamic categories and clues (unbounded rows/columns).
- Clue editor fields:
	- Points (number)
	- Question (markdown-style text editor + preview)
	- Answer (markdown-style text editor + preview)
	- Optional image upload (auto-converted to Base64 and embedded in game state)
- JSON import/export:
	- `Export Game` downloads a self-contained `.json`
	- `Import Game` loads `.json` and overwrites current game state
- `Play setup` + `Host view` foundation with player count and score controls (board rendering intentionally pending)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages note

`vite.config.js` uses `base: './'` so built assets are referenced relatively, which helps static deployment scenarios like GitHub Pages.
