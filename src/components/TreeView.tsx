import { useEffect, useRef, useState } from 'react';
import type { TreeNode } from '../engine/bfs';
import { TreeManager } from '../engine/treeManager';
import { TreeRenderer } from '../renderers/treeRenderer';

type TreeViewProps = {
  treeNodes: TreeNode[];
  expandedNodeId: string | null;
  newlyGeneratedIds: string[];
  exploredIds: Set<string>;
  pathIds: Set<string>;
  currentNodeId: string | null;
  isGoalFound: boolean;
};

export default function TreeView({
  treeNodes,
  expandedNodeId,
  newlyGeneratedIds,
  exploredIds,
  pathIds,
  currentNodeId,
  isGoalFound,
}: TreeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const treeManagerRef = useRef(new TreeManager());
  const rendererRef = useRef<TreeRenderer | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load nodes into tree manager
  useEffect(() => {
    treeManagerRef.current.loadNodes(treeNodes);
  }, [treeNodes]);

  // Render tree
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!rendererRef.current) {
      rendererRef.current = new TreeRenderer(ctx);
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const centerX = rect.width / 2 + offset.x;
    const centerY = 50 + offset.y;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    const layout = treeManagerRef.current.calculateLayout();
    rendererRef.current.prepareRenderData(
      layout.nodes,
      currentNodeId,
      newlyGeneratedIds,
      exploredIds,
      pathIds,
      isGoalFound
    );
    rendererRef.current.render();

    ctx.restore();
  }, [treeNodes, scale, offset, currentNodeId, newlyGeneratedIds, exploredIds, pathIds, isGoalFound]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.1, Math.min(3, s * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8 }}>
        <button onClick={() => setScale((s) => Math.min(3, s * 1.2))} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
          Zoom +
        </button>
        <button onClick={() => setScale((s) => Math.max(0.1, s * 0.8))} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
          Zoom -
        </button>
        <button onClick={resetView} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>
          Reset
        </button>
      </div>
    </div>
  );
}
