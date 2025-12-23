# Snake Game Frontend (React)

A classic Snake game built with React and Canvas.

## Features
- Centered game board with score on top and restart button below
- Controls: Arrow keys or WASD
- Light modern theme with primary `#3b82f6` and success `#06b6d4` accents
- Collision detection (walls/self), growth on food, score increment, game over/restart flow
- Optional backend integration for scores; works fully offline

## Getting Started

### `npm start`
Run the app in development mode.
Open http://localhost:3000 to view it in your browser.

### `npm test`
Launch the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.

## Optional Backend
If you run the companion FastAPI backend on port 3001, the app will submit and fetch scores automatically.

Environment variables (optional):
- `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL` — Base URL for the backend (default http://localhost:3001)

## Controls
- Start/Move: Arrow keys or WASD
- Restart: Click the “Restart” button

## Theme
Toggle theme via the button in the top-right corner for accessibility.
