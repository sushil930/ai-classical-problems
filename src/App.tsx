import { useEffect, useMemo, useRef, useState } from 'react';
import { bfsEngine, type BfsEvent, type Cell, type Grid } from './engine/bfs';
import TreeView from './components/TreeView';

const GRID_SIZE = 20;

function makeGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => 0));
}

type Mode = 'draw' | 'start' | 'goal';
type ViewMode = 'grid' | 'tree';

type RunState = {
  steps: BfsEvent[];
  path: Cell[];
  pathIds: string[];
  status: BfsEvent['status'] | null;
};

export default function App() {
  const [grid, setGrid] = useState<Grid>(makeGrid);
  const [start, setStart] = useState<Cell>({ row: 0, col: 0 });
  const [goal, setGoal] = useState<Cell>({ row: GRID_SIZE - 1, col: GRID_SIZE - 1 });
  const [mode, setMode] = useState<Mode>('draw');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [run, setRun] = useState<RunState>({ steps: [], path: [], pathIds: [], status: null });
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(300);
  const dragging = useRef<false | 'left' | 'right'>(false);

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
    setRun({ steps: [], path: [], pathIds: [], status: null });
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

  const handleCellAction = (r: number, c: number, isRightClick: boolean = false) => {
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
    if (mode === 'draw') {
      setGrid((g) => {
        if (start.row === r && start.col === c) return g;
        if (goal.row === r && goal.col === c) return g;
        const next = g.map((row) => [...row]);
        next[r][c] = isRightClick ? 1 : 0; // Right-click draws, left-click erases
        return next;
      });
    }
  };

  const runBfs = () => {
    if (!start || !goal) return;
    const { steps, path, pathIds, status } = bfsEngine({ start, goal, grid });
    setRun({ steps, path, pathIds: pathIds || [], status });
    setStepIndex(0);
    setIsPlaying(false);
  };

  const reset = () => {
    setGrid(makeGrid());
    setRun({ steps: [], path: [], pathIds: [], status: null });
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
    if (isNew) return '#00cec9'; // Teal/Cyan for newly added
    if (inFrontier) return '#3498db'; // Blue for frontier
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
      
      <div className="layout">
        <div className="panel controls">
          <div className="control-group">
            <label>View Mode</label>
            <div className="mode-buttons">
              {[
                ['Grid', 'grid'],
                ['Tree', 'tree'],
              ].map(([label, value]) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value as ViewMode)}
                  className={viewMode === value ? 'active' : ''}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Algorithm Control</label>
            <button 
              onClick={runBfs} 
              disabled={isPlaying || (run.steps.length > 0 && run.status === 'running')}
            >
              {run.steps.length > 0 ? 'Restart BFS' : 'Run BFS'}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={stepBack} disabled={!run.steps.length || stepIndex === 0 || isPlaying} style={{ flex: 1 }}>
                Step -
              </button>
              <button onClick={stepForward} disabled={!run.steps.length || stepIndex >= run.steps.length - 1 || isPlaying} style={{ flex: 1 }}>
                Step +
              </button>
            </div>
            <button onClick={() => setIsPlaying((p) => !p)} disabled={!run.steps.length}>
              {isPlaying ? 'Pause' : 'Auto-run'}
            </button>
            <button onClick={reset}>Reset Grid</button>
          </div>

          <div className="control-group">
            <label>Speed ({speedMs} ms)</label>
            <input
              type="range"
              min={50}
              max={800}
              step={25}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Edit Mode</label>
            <div className="mode-buttons">
              {[
                ['Draw', 'draw'],
                ['Start', 'start'],
                ['Goal', 'goal'],
              ].map(([label, value]) => (
                <button
                  key={value}
                  onClick={() => setMode(value as Mode)}
                  className={mode === value ? 'active' : ''}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-container">
          {viewMode === 'grid' ? (
            <>
              <div
                className="grid"
                style={{ cursor: mode === 'draw' ? 'crosshair' : 'pointer' }}
                onContextMenu={(e) => e.preventDefault()}
                onMouseDown={(e) => {
                  // set dragging to left or right directly (avoid assigning boolean `true`)
                  dragging.current = e.button === 2 ? 'right' : 'left';
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
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCellAction(r, c, e.button === 2);
                        }}
                        onMouseEnter={(e) => {
                          if (dragging.current && mode === 'draw') {
                            handleCellAction(r, c, dragging.current === 'right');
                          }
                        }}
                        onContextMenu={(e) => e.preventDefault()}
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
                  ['Frontier', '#3498db'],
                  ['Newly added', '#00cec9'],
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
            </>
          ) : (
            <TreeView
              treeNodes={currentEvent?.treeNodes || []}
              expandedNodeId={currentEvent?.expandedNodeId || null}
              newlyGeneratedIds={currentEvent?.newlyGeneratedIds || []}
              exploredIds={new Set(currentEvent?.explored.map((c) => `${c.row},${c.col}`) || [])}
              pathIds={new Set(run.pathIds)}
              currentNodeId={currentEvent?.expandedNodeId || null}
              isGoalFound={run.status === 'goal-found' && stepIndex === run.steps.length - 1}
            />
          )}
        </div>

        <div className="panel info">
          <div className="control-group">
            <label>Status</label>
            <div className="stat-row">
              <span className="stat-label">State</span>
              <span className="stat-value" style={{ textTransform: 'capitalize' }}>
                {currentEvent?.status ?? 'Idle'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Step</span>
              <span className="stat-value">
                {run.steps.length ? stepIndex + 1 : 0} / {run.steps.length}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Depth</span>
              <span className="stat-value">{currentEvent?.depth ?? 0}</span>
            </div>
            {run.status === 'goal-found' && stepIndex === run.steps.length - 1 && (
              <div className="stat-row">
                <span className="stat-label">Path Length</span>
                <span className="stat-value">{run.path.length}</span>
              </div>
            )}
          </div>

          <div className="control-group">
            <label>Queue Viewer</label>
            <div className="stat-row">
              <span className="stat-label">Frontier Size</span>
              <span className="stat-value">{currentEvent?.frontier.length ?? 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Explored Size</span>
              <span className="stat-value">{currentEvent?.explored.length ?? 0}</span>
            </div>
            {currentEvent?.frontier && currentEvent.frontier.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '0.85em', color: '#b2bec3' }}>
                <div>Next in queue:</div>
                <div style={{ 
                  display: 'flex', gap: 4, flexWrap: 'wrap', 
                  marginTop: 4, maxHeight: 60, overflowY: 'auto' 
                }}>
                  {currentEvent.frontier.slice(0, 10).map((c, i) => (
                    <span key={i} style={{ 
                      background: '#2d3436', padding: '2px 6px', borderRadius: 4,
                      border: i === 0 ? '1px solid #f1c40f' : '1px solid #636e72'
                    }}>
                      ({c.row},{c.col})
                    </span>
                  ))}
                  {currentEvent.frontier.length > 10 && <span>...</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

