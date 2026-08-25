import { os } from "@orpc/server";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILLS_ROOT = process.env.SKILLS_ROOT ?? "C:\\Users\\Veerapong\\AppData\\Roaming\\devin\\skills";
const AGENTS_ROOT = process.env.AGENTS_ROOT ?? join(homedir(), ".config", "devin", "agents");
const MCP_CONFIG = process.env.MCP_CONFIG ?? join(SKILLS_ROOT, ".devin", "config.json");
const GLOBAL_RULES = process.env.GLOBAL_RULES ?? join(homedir(), ".codeium", "windsurf", "memories", "global_rules.md");

type NodeType = "skill" | "subagent" | "mcp" | "rule";
type GraphNode = { id: string; label: string; title: string; group: string; type: NodeType; dir: string; };
type GraphEdge = { from: string; to: string; };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[]; };

function parseFrontmatter(text: string): { name?: string; description?: string; related: string[]; } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { related: [] };
  const front = match[1];
  const name = front.match(/^name:\s*(.+)$/m)?.[1].trim();
  const description = front.match(/^description:\s*(.+)$/m)?.[1].trim();
  const relatedBlock = front.match(/^related:\s*\n((?:\s*- .+\n?)+)/m)?.[1] ?? "";
  const related: string[] = [];
  for (const line of relatedBlock.split(/\r?\n/)) {
    const r = line.match(/^\s*-\s*(.+)$/)?.[1].trim();
    if (r) related.push(r);
  }
  return { name, description, related };
}

function scanSkills(): { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const dir of readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith(".")) continue;
    const file = join(SKILLS_ROOT, dir.name, "SKILL.md");
    if (!existsSync(file)) continue;
    try {
      const text = readFileSync(file, "utf-8");
      const { name, description, related } = parseFrontmatter(text);
      const id = name ?? dir.name;
      const group = id.split("-")[0] || "default";
      nodes.push({ id, label: id, title: description ?? "", group, type: "skill", dir: dir.name });
      for (const r of related) {
        const key = `${id}->${r}`;
        if (edgeSet.has(key)) continue;
        edges.push({ from: id, to: r });
        edgeSet.add(key);
      }
    } catch { }
  }
  return { nodes, edges, edgeSet };
}

function scanSubagents(): { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  if (!existsSync(AGENTS_ROOT)) return { nodes, edges, edgeSet };

  for (const dir of readdirSync(AGENTS_ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const file = join(AGENTS_ROOT, dir.name, "AGENT.md");
    if (!existsSync(file)) continue;
    try {
      const text = readFileSync(file, "utf-8");
      const { name, description, related } = parseFrontmatter(text);
      const id = name ?? dir.name;
      nodes.push({ id, label: id, title: description ?? "", group: "subagent", type: "subagent", dir: dir.name });
      for (const r of related) {
        const key = `${id}->${r}`;
        if (edgeSet.has(key)) continue;
        edges.push({ from: id, to: r });
        edgeSet.add(key);
      }
    } catch { }
  }
  return { nodes, edges, edgeSet };
}

function scanMcpServers(): { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  if (!existsSync(MCP_CONFIG)) return { nodes, edges, edgeSet };

  try {
    const config = JSON.parse(readFileSync(MCP_CONFIG, "utf-8"));
    const servers = config.mcpServers ?? config.servers ?? {};
    for (const [name, cfg] of Object.entries(servers)) {
      const desc = (cfg as any)?.description ?? `MCP server: ${name}`;
      nodes.push({ id: `mcp:${name}`, label: name, title: desc, group: "mcp", type: "mcp", dir: name });
    }
  } catch { }

  return { nodes, edges, edgeSet };
}

function scanGlobalRules(): { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  if (!existsSync(GLOBAL_RULES)) return { nodes, edges, edgeSet };

  try {
    const text = readFileSync(GLOBAL_RULES, "utf-8");
    const { related } = parseFrontmatter(text);
    const id = "global-rules";
    const desc = "Global rules for all tasks and workspaces";
    nodes.push({ id, label: "Global Rules", title: desc, group: "rule", type: "rule", dir: "global_rules.md" });
    for (const r of related) {
      const key = `${id}->${r}`;
      if (edgeSet.has(key)) continue;
      edges.push({ from: id, to: r });
      edgeSet.add(key);
    }
  } catch { }

  return { nodes, edges, edgeSet };
}

export function buildGraph(): GraphData {
  const skills = scanSkills();
  const subagents = scanSubagents();
  const mcp = scanMcpServers();
  const rules = scanGlobalRules();

  const allNodes = [...skills.nodes, ...subagents.nodes, ...mcp.nodes, ...rules.nodes];
  const allEdges = [...skills.edges, ...subagents.edges, ...mcp.edges, ...rules.edges];

  return { nodes: allNodes, edges: allEdges };
}

const skillsGraph = os.handler(async () => buildGraph());

export const router = {
  skillsGraph,
};

export type AppRouter = typeof router;
