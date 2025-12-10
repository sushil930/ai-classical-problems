export type Cell = { row: number; col: number };
export type Grid = number[][]; // 0 empty, 1 wall

export type BfsEvent = {
  current: Cell;
  frontier: Cell[];
  explored: Cell[];
  newlyAdded: Cell[];
  neighbours: Cell[];
  depth: number;
  status: 'running' | 'goal-found' | 'finished' | 'blocked';
};

export type BfsResult = {
  status: 'goal-found' | 'finished' | 'blocked';
  path: Cell[];
  steps: BfsEvent[];
};

const key = (c: Cell) => `${c.row},${c.col}`;

const deltas: Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function bfsEngine(input: { start: Cell; goal: Cell; grid: Grid }): BfsResult {
  const { start, goal, grid } = input;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const inBounds = (c: Cell) => c.row >= 0 && c.col >= 0 && c.row < rows && c.col < cols;
  const isWall = (c: Cell) => grid[c.row]?.[c.col] === 1;

  const queue: Array<Cell & { depth: number }> = [];
  const visited = new Set<string>();
  const parent = new Map<string, Cell>();
  const explored: Cell[] = [];
  const steps: BfsEvent[] = [];

  queue.push({ ...start, depth: 0 });
  visited.add(key(start));

  steps.push({
    current: start,
    frontier: queue.map(({ row, col }) => ({ row, col })),
    explored: [...explored],
    newlyAdded: [start],
    neighbours: [],
    depth: 0,
    status: 'running',
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    const current: Cell = { row: node.row, col: node.col };
    const depth = node.depth;

    const neighbours: Cell[] = [];
    const newlyAdded: Cell[] = [];

    for (const d of deltas) {
      const n: Cell = { row: current.row + d.row, col: current.col + d.col };
      if (!inBounds(n) || isWall(n)) continue;
      neighbours.push(n);
      const k = key(n);
      if (!visited.has(k)) {
        visited.add(k);
        parent.set(k, current);
        queue.push({ ...n, depth: depth + 1 });
        newlyAdded.push(n);
      }
    }

    explored.push(current);

    let status: BfsEvent['status'] = 'running';
    if (current.row === goal.row && current.col === goal.col) {
      status = 'goal-found';
    } else if (queue.length === 0) {
      status = newlyAdded.length === 0 && neighbours.length > 0 ? 'blocked' : 'finished';
    }

    steps.push({
      current,
      frontier: queue.map(({ row, col }) => ({ row, col })),
      explored: [...explored],
      newlyAdded: [...newlyAdded],
      neighbours: [...neighbours],
      depth,
      status,
    });

    if (status === 'goal-found') {
      return { status, path: reconstructPath(start, goal, parent), steps };
    }
  }

  return { status: steps[steps.length - 1]?.status ?? 'finished', path: [], steps };
}

function reconstructPath(start: Cell, goal: Cell, parent: Map<string, Cell>): Cell[] {
  const path: Cell[] = [];
  const startKey = key(start);
  const goalKey = key(goal);
  if (startKey !== goalKey && !parent.has(goalKey)) return path;

  let cur: Cell | undefined = goal;
  while (cur) {
    path.unshift(cur);
    if (key(cur) === startKey) break;
    cur = parent.get(key(cur));
  }
  return path;
}
