# AI Classical Problem Simulator – Master Development Instructions

This document defines the complete architecture, rules, visualization standards, algorithm specifications, and development workflow for building the AI Classical Problem Simulator. All components, modules, and algorithms must follow these guidelines to ensure consistency, clarity, and extensibility.

## 1. Project Overview
- Visualize core AI search algorithms and classical AI problems through interactive, step-by-step animation.
- Keep the system modular, renderer-independent, and educational.
- Maintain a unified simulation architecture with event-driven rendering.

### Primary Goals
- Provide clear visualization of search processes.
- Support easy extension for new algorithms.
- Keep logic and UI layers separated.
- Ensure consistent event handling across modules.

## 2. Supported Algorithms (Phased Implementation)

### Phase 1 – Uninformed Search
- Breadth-First Search (BFS)
- Depth-First Search (DFS)

### Phase 2 – Informed Search
- Best First Search
- Hill Climbing
- A* Search

### Phase 3 – Classical Problems

| Problem                | Description                      |
|-----------------------|----------------------------------|
| 8-Puzzle              | Tile sliding problem             |
| Missionaries & Cannibals | River crossing puzzle        |
| Water Jug Problem     | Capacity constraints puzzle      |
| Tower of Hanoi        | Disk movement puzzle             |
| Tic-Tac-Toe State Tree| Minimax/game state visualization |

Each algorithm follows the same event-driven simulation format.

## 3. Core Architecture
The simulator is organized into three layers that must remain isolated:

$$\text{Engine Layer (Algorithm Logic)} \leftrightarrow \text{Renderer Layer (Views)} \leftrightarrow \text{UI Layer (Controls)}$$

### 3.1 Engine Layer (Logic)
- Contains only pure logic; no DOM, canvas, or rendering code.
- Emits step events in the unified structure.
- Operates independently of visualization details.

### 3.2 Renderer Layer (Visualization)
- Consumes engine events and renders grid, tree, state-space, or puzzle views.
- Must be able to visualize events from any algorithm without modification.
- Applies standardized colors and animations.

### 3.3 UI Layer (Controls)
- Provides controls for start/step/reset, speed, and algorithm selection.
- Manages mode selection (grid, tree, puzzle) and presets.
- Updates panels with current state, frontier, explored nodes, and explanations.

## 4. Universal Event Format
All algorithms must output events in this structure:

```json
{
  "current": { "row": r, "col": c } or "state",
  "frontier": [],
  "explored": [],
  "newlyAdded": [],
  "neighbours": [],
  "depth": number,
  "status": "running" | "goal-found" | "finished" | "blocked"
}
```

Additional fields (such as cost or heuristic values) may be included when required. The unified structure ensures every renderer can interpret the data consistently.

## 5. Rendering Standards

### 5.1 Grid Renderer (BFS, DFS, A*, Best-First)

| State     | Color    |
|-----------|----------|
| Empty     | white    |
| Wall      | black    |
| Start     | green    |
| Goal      | red      |
| Current   | yellow   |
| Frontier  | blue     |
| Explored  | gray     |

- Final path uses a white 2 px inner stroke, neon purple outer glow (#6C5CE7, 10 px blur), and a slight scale-up (1.05).

### 5.2 Tree Renderer (BFS Tree, DFS Tree, State Trees)
- Auto-layout nodes with hierarchical positioning.
- Highlight current node in yellow, frontier nodes in blue, explored nodes in gray, and goal nodes in green.
- Emphasize the final path from root to goal once found.

### 5.3 Puzzle Renderer (8-Puzzle, Missionaries-Cannibals, etc.)
- Display board or state visuals per puzzle.
- Animate BFS/DFS expansions step by step.
- Show frontier and explored states in a side panel.

## 6. Algorithm Behavior Rules
- Adhere to standard definitions of BFS, DFS, Best-First, Hill Climbing, and A*.
- Emit events at every meaningful state change without skipping steps.
- Maintain parent mappings to reconstruct the final path.
- Respect constraints such as walls, invalid moves, and puzzle rules.

## 7. UI Layout Requirements

**Left Panel (Controls)**
- Algorithm selection and visualization mode (grid/tree/puzzle).
- Start, goal, and wall configuration for grid-based problems.
- Step, auto-run, reset controls, and speed slider.

**Center Panel (Visualization)**
- Primary visualization canvas replaced dynamically by the active renderer.

**Right Panel (Explanation)**
- Display current node/state, frontier, explored list, depth, textual explanation, and path length when available.

## 8. Extensibility Rules
- Enforce the universal event format for all new algorithms.
- Integrate with renderers without altering global architecture.
- Uphold consistent color conventions.
- Keep engine and renderer logic separated.

## 9. Coding Standards
- Use pure functions for algorithm logic files.
- Avoid embedding rendering code inside logic modules.
- Prevent renderer files from mutating BFS/DFS internal data.
- Adopt consistent naming, e.g., `bfsEngine.js`, `dfsEngine.js`, `aStarEngine.js`, `gridRenderer.js`, `treeRenderer.js`, `puzzleRenderer.js`.
- Maintain modular, testable code.

## 10. Implementation Order (Recommended)
1. Implement BFS engine (logic only).
2. Build the grid renderer.
3. Create UI and controls for BFS.
4. Add DFS using the same event system.
5. Introduce the tree view renderer.
6. Implement classical problems (e.g., 8-puzzle).

## 11. Performance Considerations
- Avoid re-rendering the entire grid each step; prefer diff-based updates.
- Precompute steps before animation for smooth playback.
- Allow skipping to any step in the timeline.

## 12. Debugging Tools (Optional but Recommended)
- Toggle display of visited order.
- Provide heatmaps of search levels.
- Visualize parent links for debugging.

## 13. Deliverables for Each Algorithm
- Engine logic implementation.
- Step event generator adhering to the unified format.
- Renderer mapping configuration.
- UI integration hooks.
- Example presets.
- Explanatory text for users.

## 14. Quality Goals
- Keep the simulator clean, predictable, and educational.
- Ensure extensibility and visual consistency.
- Make interactions easy for students to understand.