import type { TreeNode } from './bfs';

type LayoutNode = TreeNode & {
  x: number;
  y: number;
};

export type TreeLayout = {
  nodes: LayoutNode[];
  width: number;
  height: number;
  root: LayoutNode | null;
};

const LEVEL_HEIGHT = 80;
const SIBLING_GAP = 60;

export class TreeManager {
  private nodes = new Map<string, TreeNode>();
  private layoutCache = new Map<string, { x: number; y: number }>();

  constructor() {}

  /**
   * Add a node to the tree
   */
  addNode(node: TreeNode): void {
    this.nodes.set(node.id, node);
    this.layoutCache.clear(); // Invalidate layout cache
  }

  /**
   * Link a child to a parent
   */
  linkChild(parentId: string, childId: string): void {
    const parent = this.nodes.get(parentId);
    if (parent && !parent.children.includes(childId)) {
      parent.children.push(childId);
      this.layoutCache.clear();
    }
  }

  /**
   * Get all nodes at a specific depth level
   */
  getNodesAtDepth(depth: number): TreeNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.depth === depth);
  }

  /**
   * Get maximum depth in the tree
   */
  getMaxDepth(): number {
    let max = 0;
    this.nodes.forEach((n) => {
      if (n.depth > max) max = n.depth;
    });
    return max;
  }

  /**
   * Calculate hierarchical layout positions for all nodes
   */
  calculateLayout(): TreeLayout {
    const positioned: LayoutNode[] = [];
    const levelMap = new Map<number, TreeNode[]>();

    // Group nodes by depth
    this.nodes.forEach((node) => {
      if (!levelMap.has(node.depth)) {
        levelMap.set(node.depth, []);
      }
      levelMap.get(node.depth)!.push(node);
    });

    // Position nodes level by level
    levelMap.forEach((nodes, depth) => {
      const y = depth * LEVEL_HEIGHT + 50;
      const totalWidth = (nodes.length - 1) * SIBLING_GAP;
      const startX = -totalWidth / 2;

      nodes.forEach((node, i) => {
        const x = startX + i * SIBLING_GAP;
        positioned.push({ ...node, x, y });
        this.layoutCache.set(node.id, { x, y });
      });
    });

    const maxDepth = this.getMaxDepth();
    const width = Math.max(...positioned.map((n) => Math.abs(n.x))) * 2 + 100;
    const height = maxDepth * LEVEL_HEIGHT + 100;

    return {
      nodes: positioned,
      width,
      height,
      root: positioned.find((n) => n.parentId === null) || null,
    };
  }

  /**
   * Get cached layout position for a node
   */
  getCachedPosition(nodeId: string): { x: number; y: number } | null {
    return this.layoutCache.get(nodeId) || null;
  }

  /**
   * Clear all nodes and reset the tree
   */
  clear(): void {
    this.nodes.clear();
    this.layoutCache.clear();
  }

  /**
   * Load nodes from an array (bulk operation)
   */
  loadNodes(nodes: TreeNode[]): void {
    this.clear();
    nodes.forEach((n) => this.addNode(n));
  }

  /**
   * Get all nodes as an array
   */
  getAllNodes(): TreeNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a specific node by ID
   */
  getNode(id: string): TreeNode | undefined {
    return this.nodes.get(id);
  }
}
