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
  // Tree view support
  treeNodes?: TreeNode[];
  expandedNodeId?: string;
  newlyGeneratedIds?: string[];
};

export type BfsResult = {
  status: 'goal-found' | 'finished' | 'blocked';
  path: Cell[];
  pathIds?: string[];
  steps: BfsEvent[];
};

export type TreeNode = {
  id: string;
  parentId: string | null;
  state: Cell;
  depth: number;
  children: string[];
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
  const tree = new Map<string, TreeNode>();

  // root node
  const rootId = key(start);
  tree.set(rootId, { id: rootId, parentId: null, state: start, depth: 0, children: [] });

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
    treeNodes: [...tree.values()],
    expandedNodeId: rootId,
    newlyGeneratedIds: [],
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    const current: Cell = { row: node.row, col: node.col };
    const depth = node.depth;

    const neighbours: Cell[] = [];
    const newlyAdded: Cell[] = [];
    const newlyGeneratedIds: string[] = [];

    const currentId = key(current);

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

        // add to tree
        const child: TreeNode = {
          id: k,
          parentId: currentId,
          state: n,
          depth: depth + 1,
          children: [],
        };
        tree.set(k, child);
        const parentNode = tree.get(currentId);
        if (parentNode) {
          parentNode.children.push(k);
        }
        newlyGeneratedIds.push(k);
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
      treeNodes: [...tree.values()],
      expandedNodeId: currentId,
      newlyGeneratedIds,
    });

    if (status === 'goal-found') {
      const { path, pathIds } = reconstructPath(start, goal, parent);
      return { status, path, pathIds, steps };
    }
  }

  // Ensure returned status matches BfsResult.status union
  const lastRawStatus = steps[steps.length - 1]?.status ?? 'finished';
  const lastStatus: BfsResult['status'] = lastRawStatus === 'running' ? 'finished' : (lastRawStatus as BfsResult['status']);
  return { status: lastStatus, path: [], pathIds: [], steps };
}

function reconstructPath(start: Cell, goal: Cell, parent: Map<string, Cell>): { path: Cell[]; pathIds: string[] } {
  const path: Cell[] = [];
  const pathIds: string[] = [];
  const startKey = key(start);
  const goalKey = key(goal);
  if (startKey !== goalKey && !parent.has(goalKey)) return { path, pathIds };

  let cur: Cell | undefined = goal;
  while (cur) {
    const k = key(cur);
    path.unshift(cur);
    pathIds.unshift(k);
    if (k === startKey) break;
    cur = parent.get(k);
  }
  return { path, pathIds };
}
