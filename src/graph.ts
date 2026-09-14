import type { GraphData } from "./orpc/router";

export type { GraphData } from "./orpc/router";
export type GraphNode = GraphData["nodes"][number];

export const groupColors: Record<string, { background: string; border: string }> = {
  follow: { background: "#6366f1", border: "#4f46e5" },
  run: { background: "#22c55e", border: "#16a34a" },
  check: { background: "#f97316", border: "#ea580c" },
  report: { background: "#06b6d4", border: "#0891b2" },
  idea: { background: "#ec4899", border: "#db2777" },
  subagent: { background: "#f59e0b", border: "#d97706" },
  mcp: { background: "#a855f7", border: "#9333ea" },
  rule: { background: "#ef4444", border: "#dc2626" },
  default: { background: "#94a3b8", border: "#64748b" },
};

export const typeColors: Record<string, string> = {
  skill: "#38bdf8",
  subagent: "#f59e0b",
  mcp: "#a855f7",
  rule: "#ef4444",
};
