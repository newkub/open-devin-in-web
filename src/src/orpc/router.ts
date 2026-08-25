import { os } from "@orpc/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SKILLS_ROOT = process.env.SKILLS_ROOT ?? "C:\\Users\\Veerapong\\AppData\\Roaming\\devin\\skills";

type GraphNode = { id: string; label: string; title: string; group: string; dir: string };
type GraphEdge = { from: string; to: string };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

export function buildGraph(): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const dir of readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const file = join(SKILLS_ROOT, dir.name, "SKILL.md");
    try {
      const text = readFileSync(file, "utf-8");
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) continue;
      const front = match[1];
      const name = front.match(/^name:\s*(.+)$/m)?.[1].trim() ?? dir.name;
      const description = front.match(/^description:\s*(.+)$/m)?.[1].trim() ?? "";
      const relatedBlock = front.match(/^related:\s*\n((?:\s*- .+\n?)+)/m)?.[1] ?? "";
      const group = name.split("-")[0] || "default";
      nodes.push({ id: name, label: name, title: description, group, dir: dir.name });
      for (const line of relatedBlock.split(/\r?\n/)) {
        const related = line.match(/^\s*-\s*(.+)$/)?.[1].trim();
        if (!related) continue;
        const key = `${name}->${related}`;
        if (edgeSet.has(key)) continue;
        edges.push({ from: name, to: related });
        edgeSet.add(key);
      }
    } catch {}
  }

  return { nodes, edges };
}

const skillsGraph = os.handler(async () => buildGraph());

export const router = {
  skillsGraph,
};

export type AppRouter = typeof router;
