# AI Classical Problem Simulator (BFS module)

React + TypeScript prototype for the BFS engine and grid visualization on a 20×20 adjustable grid.

## Getting started
1. Install deps: `npm install`
2. Run dev server: `npm run dev`
3. Open the printed local URL (default `http://localhost:5173`).

## Usage
- Modes: select `Wall`, `Start`, or `Goal`, then click/drag on the grid (start/goal cannot be overwritten by walls).
- Run BFS: click **Run BFS**; use **Step -/+** to walk events; **Auto-run** plays through at slider-controlled speed.
- Reset: clears walls/state and repositions start `(0,0)` and goal `(19,19)`.

## BFS engine
- Pure logic in `src/engine/bfs.ts`; emits per-step events in the required schema and returns `path` + `steps`.
- Grid: `0` empty, `1` wall. Four-neighbor movement. FIFO frontier, visited set, parent map for path reconstruction.

## Rendering rules implemented
- Colors: empty white, wall black, start green, goal red, current yellow, frontier blue, newly added blue, explored gray.
- Final path: white outline + neon purple glow (#6C5CE7) with slight scale-up.

## Next steps
- Add Tree View renderer fed by the same BFS events.
- Extract control panel and grid into reusable components; add presets and persistence.
- Expand engines (DFS, Best-First, A*), reuse event format.
