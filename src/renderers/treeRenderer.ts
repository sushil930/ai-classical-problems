import type { TreeNode } from '../engine/bfs';

const NODE_RADIUS = 20;

export type NodeRenderState = {
  id: string;
  x: number;
  y: number;
  color: string;
  isPath: boolean;
  isCurrent: boolean;
  label: string;
};

export type EdgeRenderState = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isPath: boolean;
};

export class TreeRenderer {
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number | null = null;
  private nodeStates = new Map<string, NodeRenderState>();
  private edgeStates: EdgeRenderState[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Draw a single node
   */
  drawNode(state: NodeRenderState): void {
    const { x, y, color, isPath, isCurrent, label } = state;
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (isPath) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowColor = 'rgba(108, 92, 231, 0.8)';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#0f1115';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  /**
   * Draw a single edge
   */
  drawEdge(state: EdgeRenderState): void {
    const { fromX, fromY, toX, toY, isPath } = state;
    const ctx = this.ctx;

    ctx.strokeStyle = isPath ? '#6C5CE7' : '#636e72';
    ctx.lineWidth = isPath ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }

  /**
   * Update node state (color, flags, etc.)
   */
  updateNodeState(
    nodeId: string,
    x: number,
    y: number,
    color: string,
    label: string,
    isPath = false,
    isCurrent = false
  ): void {
    this.nodeStates.set(nodeId, { id: nodeId, x, y, color, isPath, isCurrent, label });
  }

  /**
   * Clear all node states
   */
  clearNodeStates(): void {
    this.nodeStates.clear();
    this.edgeStates = [];
  }

  /**
   * Add an edge to the render queue
   */
  addEdge(fromX: number, fromY: number, toX: number, toY: number, isPath = false): void {
    this.edgeStates.push({ fromX, fromY, toX, toY, isPath });
  }

  /**
   * Render all nodes and edges
   */
  render(): void {
    // Draw edges first (background)
    this.edgeStates.forEach((edge) => this.drawEdge(edge));

    // Draw nodes on top
    this.nodeStates.forEach((state) => this.drawNode(state));
  }

  /**
   * Animate node addition (simple fade-in or scale-up effect)
   */
  animateAddition(nodeIds: string[], duration = 300): void {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Simple scale animation (not implemented fully here, just a placeholder)
      // In a real implementation, you'd interpolate node scales or opacities

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Animate path glow (pulsing effect)
   */
  animatePathGlow(pathNodeIds: string[], duration = 600): void {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Pulse glow intensity based on sine wave
      const glowIntensity = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;

      // Update node states with animated glow
      pathNodeIds.forEach((id) => {
        const state = this.nodeStates.get(id);
        if (state) {
          // Adjust rendering or shadow based on glowIntensity
          // This is a placeholder; full implementation would modify shadowBlur dynamically
        }
      });

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Cancel any ongoing animation
   */
  cancelAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Prepare render data from tree nodes
   */
  prepareRenderData(
    nodes: Array<TreeNode & { x: number; y: number }>,
    currentNodeId: string | null,
    newlyGeneratedIds: string[],
    exploredIds: Set<string>,
    pathIds: Set<string>,
    isGoalFound: boolean
  ): void {
    this.clearNodeStates();

    const nodeMap = new Map<string, TreeNode & { x: number; y: number }>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Prepare edges
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          const isPath = pathIds.has(node.id) && pathIds.has(parent.id);
          this.addEdge(parent.x, parent.y, node.x, node.y, isPath);
        }
      }
    });

    // Prepare nodes
    nodes.forEach((node) => {
      const isPath = pathIds.has(node.id);
      const isCurrent = node.id === currentNodeId;
      const isNew = newlyGeneratedIds.includes(node.id);
      const isExplored = exploredIds.has(node.id);

      let color = '#ffffff';
      if (isCurrent) color = '#f1c40f'; // yellow
      else if (isNew) color = '#00cec9'; // teal
      else if (isExplored) color = '#7f8c8d'; // gray
      else if (isPath && isGoalFound) color = '#6C5CE7'; // purple

      const label = `${node.state.row},${node.state.col}`;

      this.updateNodeState(node.id, node.x, node.y, color, label, isPath && isGoalFound, isCurrent);
    });
  }
}
