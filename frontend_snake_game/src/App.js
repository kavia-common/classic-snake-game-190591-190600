import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * Classic Snake Game implemented with React and Canvas.
 * - Centered board with score on top and restart below
 * - Keyboard controls: Arrow keys and WASD
 * - Light theme with primary #3b82f6 and success #06b6d4 accents
 * - Optional backend integration (FastAPI) for score submit/get; app works without backend
 */

// Grid and game config
const BOARD_SIZE = 20; // 20x20 cells
const CELL_SIZE = 20;  // 20px per cell -> canvas 400x400
const TICK_MS = 120;   // game speed

const COLORS = {
  background: '#f9fafb',
  surface: '#ffffff',
  grid: '#e5e7eb',
  snake: '#3b82f6',
  snakeHead: '#1d4ed8',
  food: '#06b6d4',
  text: '#111827',
  danger: '#EF4444',
};

// Calculate backend base URL from env or default
function getApiBase() {
  const env = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  return env && env.trim() ? env.trim().replace(/\/+$/, '') : 'http://localhost:3001';
}

// Helper: random position within grid
function randomCell(excludeSet) {
  let x, y;
  do {
    x = Math.floor(Math.random() * BOARD_SIZE);
    y = Math.floor(Math.random() * BOARD_SIZE);
  } while (excludeSet.has(`${x},${y}`));
  return { x, y };
}

// Directions
const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  W: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  S: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  A: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  D: { x: 1, y: 0 },
};

// PUBLIC_INTERFACE
function App() {
  /** Theme handling - light theme default with simple toggle for accessibility */
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = COLORS.background;
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  /** Game state */
  const [snake, setSnake] = useState(() => [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ]);
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const dirRef = useRef(dir);
  const [food, setFood] = useState({ x: 12, y: 10 });
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const canvasRef = useRef(null);
  const tickRef = useRef(null);
  const pendingDirRef = useRef(null); // to prevent reversing within the same tick

  // Keep refs in sync to avoid stale closures in setInterval
  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  // Init food not on snake
  useEffect(() => {
    const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
    if (occupied.has(`${food.x},${food.y}`)) {
      const pos = randomCell(occupied);
      setFood(pos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      const nd = DIRS[e.key];
      if (!nd) return;
      e.preventDefault();
      // Prevent 180-degree turns
      const current = pendingDirRef.current || dirRef.current;
      if (current && current.x + nd.x === 0 && current.y + nd.y === 0) {
        return;
      }
      pendingDirRef.current = nd;
      setStarted(true);
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    tickRef.current = setInterval(() => {
      setSnake((prev) => {
        const currentDir = pendingDirRef.current || dirRef.current;
        pendingDirRef.current = null;

        const head = prev[0];
        const next = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Wall collision
        if (
          next.x < 0 ||
          next.y < 0 ||
          next.x >= BOARD_SIZE ||
          next.y >= BOARD_SIZE
        ) {
          setGameOver(true);
          return prev;
        }

        // Self collision: check next against existing segments
        const hitsSelf = prev.some((seg) => seg.x === next.x && seg.y === next.y);
        if (hitsSelf) {
          setGameOver(true);
          return prev;
        }

        // Move
        let newSnake = [next, ...prev];

        // Eat food
        if (next.x === food.x && next.y === food.y) {
          setScore((s) => s + 1);
          // Spawn new food not on snake
          const occupied = new Set(newSnake.map((s) => `${s.x},${s.y}`));
          const pos = randomCell(occupied);
          setFood(pos);
        } else {
          // Remove tail
          newSnake.pop();
        }
        return newSnake;
      });
    }, TICK_MS);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [food, gameOver]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear surface
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 0, BOARD_SIZE * CELL_SIZE, BOARD_SIZE * CELL_SIZE);

    // Optional grid for modern look
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      // vertical
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE + 0.5, 0);
      ctx.lineTo(i * CELL_SIZE + 0.5, BOARD_SIZE * CELL_SIZE);
      ctx.stroke();
      // horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE + 0.5);
      ctx.lineTo(BOARD_SIZE * CELL_SIZE, i * CELL_SIZE + 0.5);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.arc(fx, fy, CELL_SIZE * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? COLORS.snakeHead : COLORS.snake;
      const px = seg.x * CELL_SIZE;
      const py = seg.y * CELL_SIZE;
      const radius = 6;
      // rounded rectangle
      roundRect(ctx, px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, radius);
      ctx.fill();
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(0, 0, BOARD_SIZE * CELL_SIZE, BOARD_SIZE * CELL_SIZE);
      ctx.fillStyle = COLORS.danger;
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', BOARD_SIZE * CELL_SIZE / 2, BOARD_SIZE * CELL_SIZE / 2);
    }
  }, [snake, food, gameOver]);

  // Rounded rect path helper
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    setSnake([
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ]);
    setDir({ x: 1, y: 0 });
    dirRef.current = { x: 1, y: 0 };
    pendingDirRef.current = null;
    const occupied = new Set(['8,10', '7,10', '6,10']);
    setFood(randomCell(occupied));
    setScore(0);
    setGameOver(false);
    setStarted(false);
  };

  // Optional backend fetch: get top scores
  const apiBase = useMemo(getApiBase, []);
  const fetchScores = async () => {
    try {
      const res = await fetch(`${apiBase}/scores`);
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      if (Array.isArray(data?.scores)) setHighScores(data.scores);
    } catch {
      // fail silently; UI still works
    }
  };

  // Optional submit score on gameOver
  useEffect(() => {
    if (!gameOver || score <= 0) return;
    const submit = async () => {
      try {
        await fetch(`${apiBase}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Player', score }),
        });
        fetchScores();
      } catch {
        // ignore backend errors
      }
    };
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  useEffect(() => {
    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={styles.header}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div style={styles.container}>
          <h1 style={styles.title}>Snake</h1>
          <p style={styles.subtitle}>Score: <strong>{score}</strong></p>

          <div style={styles.boardWrapper}>
            <canvas
              ref={canvasRef}
              width={BOARD_SIZE * CELL_SIZE}
              height={BOARD_SIZE * CELL_SIZE}
              role="img"
              aria-label="Snake game board"
              style={styles.canvas}
              tabIndex={0}
              onKeyDown={(e) => {
                // focusable canvas for keyboard input as well
                const nd = DIRS[e.key];
                if (!nd) return;
                e.preventDefault();
                const current = pendingDirRef.current || dirRef.current;
                if (current && current.x + nd.x === 0 && current.y + nd.y === 0) {
                  return;
                }
                pendingDirRef.current = nd;
                setStarted(true);
              }}
            />
            {!started && !gameOver && (
              <div style={styles.overlay}>
                <div style={styles.overlayCard}>
                  <div style={styles.overlayTitle}>Press Arrow Keys or WASD to Start</div>
                  <div style={styles.overlayHint}>Eat the food, avoid walls and yourself.</div>
                </div>
              </div>
            )}
            {gameOver && (
              <div style={styles.overlay}>
                <div style={styles.overlayCard}>
                  <div style={{ ...styles.overlayTitle, color: COLORS.danger }}>Game Over</div>
                  <div style={styles.overlayHint}>Final Score: {score}</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleRestart}
            style={styles.restartButton}
            aria-label="Restart game"
          >
            Restart
          </button>

          {highScores.length > 0 && (
            <div style={styles.scoresBox} aria-live="polite">
              <div style={styles.scoresTitle}>Top Scores</div>
              <ol style={styles.scoreList}>
                {highScores.slice(0, 5).map((s, i) => (
                  <li key={i} style={styles.scoreItem}>
                    <span>{s.name || 'Player'}</span>
                    <strong>{s.score}</strong>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

const styles = {
  header: {
    background: COLORS.background,
    color: COLORS.text,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    boxSizing: 'border-box',
  },
  container: {
    width: '100%',
    maxWidth: 560,
    background: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 10px 30px rgba(17, 24, 39, 0.08)',
    border: `1px solid ${COLORS.grid}`,
  },
  title: {
    margin: '0 0 4px',
    fontSize: 28,
    letterSpacing: 0.5,
  },
  subtitle: {
    margin: '0 0 16px',
    color: '#374151',
  },
  boardWrapper: {
    position: 'relative',
    width: BOARD_SIZE * CELL_SIZE,
    height: BOARD_SIZE * CELL_SIZE,
    margin: '0 auto',
    borderRadius: 12,
    overflow: 'hidden',
    border: `1px solid ${COLORS.grid}`,
  },
  canvas: {
    display: 'block',
    background: COLORS.surface,
    outline: 'none',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(2px)',
  },
  overlayCard: {
    background: '#ffffff',
    border: `1px solid ${COLORS.grid}`,
    borderRadius: 12,
    padding: '14px 18px',
    textAlign: 'center',
    boxShadow: '0 6px 20px rgba(17,24,39,0.08)',
  },
  overlayTitle: {
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 4,
  },
  overlayHint: {
    color: '#4b5563',
    fontSize: 14,
  },
  restartButton: {
    marginTop: 16,
    width: '100%',
    background: COLORS.primary || '#3b82f6',
    backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    color: '#fff',
    border: 'none',
    padding: '12px 16px',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
    boxShadow: '0 8px 20px rgba(59,130,246,0.25)',
  },
  scoresBox: {
    marginTop: 16,
    background: '#ffffff',
    border: `1px solid ${COLORS.grid}`,
    borderRadius: 12,
    padding: 12,
  },
  scoresTitle: {
    fontWeight: 700,
    marginBottom: 8,
  },
  scoreList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  scoreItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderRadius: 8,
    background: '#f9fafb',
    marginBottom: 6,
    border: `1px solid ${COLORS.grid}`,
  },
};

export default App;
