import { os } from "@orpc/server";
import { z } from "zod";
import { scanGlobalRules, scanMcpServers, scanSkills, scanSubagents, scanWithRust } from "./scanners";
import { loadReview } from "./review";
import type { GraphData } from "./types";

export type { GraphData } from "./types";

export async function buildGraph(): Promise<GraphData> {
  const rust = await scanWithRust();
  const skills = rust?.skills ?? await scanSkills();
  const subagents = rust?.agents ?? await scanSubagents();
  const mcp = await scanMcpServers();
  const rules = await scanGlobalRules();
  const review = await loadReview();

  const seen = new Set<string>();
  const allNodes = [...skills.nodes, ...subagents.nodes, ...mcp.nodes, ...rules.nodes].filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
  if (review) {
    for (const n of allNodes) {
      const h = review.bySkill.get(n.id);
      if (h) {
        n.findings = h.findings;
        n.observations = h.observations;
        n.maxSeverity = h.maxSeverity;
        n.issues = h.issues;
      }
    }
  }
  const allEdges = [...skills.edges, ...subagents.edges, ...mcp.edges, ...rules.edges];

  return { nodes: allNodes, edges: allEdges, review: review?.meta };
}

const skillsGraph = os.handler(() => buildGraph());

export type NodeSource = { id: string; path: string; content: string };

const nodeSource = os
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input }): Promise<NodeSource> => {
    const data = await buildGraph();
    const node = data.nodes.find((n) => n.id === input.id);
    if (!node?.file) throw new Error(`node not found: ${input.id}`);
    const content = await Bun.file(node.file).text();
    return { id: node.id, path: node.file, content };
  });

export const router = {
  skillsGraph,
  nodeSource,
};

export type AppRouter = typeof router;
