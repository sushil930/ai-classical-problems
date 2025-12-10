import { useEffect, useMemo, useRef, useState } from 'react';
import { bfsEngine, type BfsEvent, type Cell, type Grid } from './engine/bfs';

const GRID_SIZE = 20;

function makeGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));
}

type Mode = 'draw' | 'wall' | 'start' | 'goal';

type RunState = {
  steps: BfsEvent[];
  path: Cell[];
  status: BfsEvent['status'] | null;
};

export default function App() {
  const [grid, setGrid] = useState<Grid>(makeGrid);
  const [start, setStart] = useState<Cell>({ row: 0, col: 0 });
  const [goal, setGoal] = useState<Cell>({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 });
  const [mode, setMode] = useState<Mode>('draw');
  const [run, setRun] = useState<RunState>({ steps: [], path: [], status: null });
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(300);
  const dragging = useRef(false);

  const currentEvent = useMemo(() => run.steps[stepIndex], [run.steps, stepIndex]);

  useEffect(() => {
    // clamp index if steps shrink
    setStepIndex((i) => {
      if (!run.steps.length) return 0;
      return Math.min(i, run.steps.length - 1);
    });
    if (!run.steps.length) setIsPlaying(false);
  }, [run.steps.length]);

  useEffect(() => {
    // reset BFS playback when grid or endpoints change
    setRun({ steps: [], path: [], status: null });
    setStepIndex(0);
    setIsPlaying(false);
  }, [grid, start, goal]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!run.steps.length || stepIndex >= run.steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const id = setTimeout(() => setStepIndex((i) => Math.min(i + 1, run.steps.length - 1)), speedMs);
    return () => clearTimeout(id);
  }, [isPlaying, stepIndex, run.steps.length, speedMs]);

  const handleCellAction = (r: number, c: number) => {
    if (mode === 'start') {
      if (goal.row === r && goal.col === c) return;
      setStart({ row: r, col: c });
      return;
    }
    if (mode === 'goal') {
      if (start.row === r && start.col === c) return;
      setGoal({ row: r, col: c });
      return;
    }
    setGrid((g) => {
      if (start.row === r && start.col === c) return g;
      if (goal.row === r && goal.col === c) return g;
      const next = g.map((row) => [...row]);
      const isWall = g[r][c] === 1;
      if (mode === 'wall') {
        next[r][c] = 1;
      } else {
        next[r][c] = isWall ? 0 : 1;
      }
      return next;
    });
  };

  const runBfs = () => {
    if (!start || !goal) return;
    const { steps, path, status } = bfsEngine({ start, goal, grid });
    setRun({ steps, path, status });
    setStepIndex(0);
    setIsPlaying(false);
  };

  const reset = () => {
    setGrid(makeGrid());
    setRun({ steps: [], path: [], status: null });
    setStepIndex(0);
    setIsPlaying(false);
    setStart({ row: 0, col: 0 });
    setGoal({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 });
  };

  const stepForward = () => {
    if (!run.steps.length) return;
    setStepIndex((i) => Math.min(i + 1, run.steps.length - 1));
  };

  const stepBack = () => {
    if (!run.steps.length) return;
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const cellColor = (r: number, c: number) => {
    if (start.row === r && start.col === c) return '#2ecc71';
    if (goal.row === r && goal.col === c) return '#e74c3c';
    if (grid[r][c] === 1) return '#000000';
    if (!currentEvent) return '#ffffff';

    const key = `${r},${c}`;
    const isCurrent = currentEvent.current.row === r && currentEvent.current.col === c;
    const inFrontier = currentEvent.frontier.some((p) => p.row === r && p.col === c);
    const inExplored = currentEvent.explored.some((p) => p.row === r && p.col === c);
    const isNew = currentEvent.newlyAdded.some((p) => p.row === r && p.col === c);

    if (isCurrent) return '#f1c40f';
    if (isNew) return '#3498db';
    if (inFrontier) return '#2980b9';
    if (inExplored) return '#7f8c8d';
    return '#ffffff';
  };

  const pathSet = useMemo(() => {
    const set = new Set<string>();
    run.path.forEach((p) => set.add(`${p.row},${p.col}`));
    return set;
  }, [run.path]);

  return (
    <main>
      <h1>AI Classical Problem Simulator — BFS</h1>
      <div className="controls">
        <button onClick={runBfs}>Run BFS</button>
        <button onClick={stepBack} disabled={!run.steps.length || stepIndex === 0 || isPlaying}>
          Step -
        </button>
        <button
          onClick={stepForward}
          disabled={!run.steps.length || stepIndex >= run.steps.length - 1 || isPlaying}
        >
          Step +
        </button>
        <button onClick={() => setIsPlaying((p) => !p)} disabled={!run.steps.length}>
          {isPlaying ? 'Pause' : 'Auto-run'}
        </button>
        <button onClick={reset}>Reset</button>
        <label>
          Speed ({speedMs} ms)
          <input
            type="range"
            min={50}
            max={800}
            step={25}
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
          />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['Draw', 'draw'],
            ['Wall', 'wall'],
            ['Start', 'start'],
            ['Goal', 'goal'],
          ].map(([label, value]) => (
            <button
              key={value}
              onClick={() => setMode(value as Mode)}
              style={{
                border: mode === value ? '2px solid #6C5CE7' : '1px solid #444',
                background: mode === value ? '#1f2230' : '#161925',
                color: '#e6e6e6',
                padding: '6px 10px',
                borderRadius: 6,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <span>
          Step {run.steps.length ? stepIndex + 1 : 0}/{run.steps.length} — Status:{' '}
          {currentEvent?.status ?? 'idle'}
        </span>
      </div>

      <div
        className="grid"
        onMouseDown={() => {
          dragging.current = true;
        }}
        onMouseUp={() => {
          dragging.current = false;
        }}
        onMouseLeave={() => {
          dragging.current = false;
        }}
      >
        {grid.map((row, r) =>
          row.map((_, c) => {
            const isPath =
              pathSet.has(`${r},${c}`) &&
              run.status === 'goal-found' &&
              stepIndex === run.steps.length - 1;
            return (
              <div
                key={`${r}-${c}`}
                className={`cell${isPath ? ' path' : ''}`}
                style={{ background: cellColor(r, c) }}
                onMouseDown={() => handleCellAction(r, c)}
                onMouseEnter={() => {
                  if (dragging.current && (mode === 'wall' || mode === 'draw')) handleCellAction(r, c);
                }}
                onClick={() => handleCellAction(r, c)}
              />
            );
          }),
        )}
      </div>

      <div className="legend">
        {[
          ['Empty', '#ffffff'],
          ['Wall', '#000000'],
          ['Start', '#2ecc71'],
          ['Goal', '#e74c3c'],
          ['Current', '#f1c40f'],
          ['Frontier', '#2980b9'],
          ['Newly added', '#3498db'],
          ['Explored', '#7f8c8d'],
        ].map(([label, color]) => (
          <span key={label} className="legend-item">
            <span className="legend-swatch" style={{ background: color as string }} />
            {label}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: '#6C5CE7', boxShadow: '0 0 10px 4px rgba(108,92,231,0.6)' }} />
          Path glow
        </span>
      </div>
    </main>
  );
}
