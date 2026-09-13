import { os } from "@orpc/server";
import { dirname, join } from "node:path";

const HOME_DIR = Bun.env.USERPROFILE ?? Bun.env.HOME ?? "";

const SKILLS_ROOT = Bun.env.SKILLS_ROOT ?? "C:\\Users\\Veerapong\\AppData\\Roaming\\devin\\skills";
const AGENTS_ROOT = Bun.env.AGENTS_ROOT ?? join(HOME_DIR, ".config", "devin", "agents");
const MCP_CONFIG = Bun.env.MCP_CONFIG ?? join(SKILLS_ROOT, ".devin", "config.json");
const GLOBAL_RULES = Bun.env.GLOBAL_RULES ?? join(HOME_DIR, ".codeium", "windsurf", "memories", "global_rules.md");
const REVIEW_REPORT = Bun.env.REVIEW_REPORT ?? join(SKILLS_ROOT, "review-devin-global-skills", "review-skills-report.json");

type NodeType = "skill" | "subagent" | "mcp" | "rule";
type NodeIssue = { severity: string; category: string; finding: string; line?: number; kind: "finding" | "observation" };
type GraphNode = {
  id: string; label: string; title: string; group: string; type: NodeType; dir: string;
  findings?: number; observations?: number; maxSeverity?: string; issues?: NodeIssue[];
};
type GraphEdge = { from: string; to: string; };
type ReviewMeta = { score: number; grade: string; totalSkills: number; totalFindings: number; totalObservations: number; skillsWithIssues: number };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[]; review?: ReviewMeta };

type ScanResult = { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; };

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

async function scanSkills(): Promise<ScanResult> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  let matches: string[];
  try {
    matches = [...new Bun.Glob("*/SKILL.md").scanSync(SKILLS_ROOT)];
  } catch {
    return { nodes, edges, edgeSet };
  }

  for (const match of matches) {
    const dirName = dirname(match);
    const file = join(SKILLS_ROOT, match);
    try {
      const text = await Bun.file(file).text();
      const { name, description, related } = parseFrontmatter(text);
      const id = name ?? dirName;
      const group = id.split("-")[0] || "default";
      nodes.push({ id, label: id, title: description ?? "", group, type: "skill", dir: dirName });
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

async function scanSubagents(): Promise<ScanResult> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  let matches: string[];
  try {
    matches = [...new Bun.Glob("*/AGENT.md").scanSync(AGENTS_ROOT)];
  } catch {
    return { nodes, edges, edgeSet };
  }

  for (const match of matches) {
    const dirName = dirname(match);
    const file = join(AGENTS_ROOT, match);
    try {
      const text = await Bun.file(file).text();
      const { name, description, related } = parseFrontmatter(text);
      const id = name ?? dirName;
      nodes.push({ id, label: id, title: description ?? "", group: "subagent", type: "subagent", dir: dirName });
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

async function scanMcpServers(): Promise<ScanResult> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const file = Bun.file(MCP_CONFIG);
  if (!(await file.exists())) return { nodes, edges, edgeSet };

  try {
    const config = await file.json();
    const servers = config.mcpServers ?? config.servers ?? {};
    for (const [name, cfg] of Object.entries(servers)) {
      const desc = (cfg as any)?.description ?? `MCP server: ${name}`;
      nodes.push({ id: `mcp:${name}`, label: name, title: desc, group: "mcp", type: "mcp", dir: name });
    }
  } catch { }

  return { nodes, edges, edgeSet };
}

async function scanGlobalRules(): Promise<ScanResult> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  const file = Bun.file(GLOBAL_RULES);
  if (!(await file.exists())) return { nodes, edges, edgeSet };

  try {
    const text = await file.text();
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

const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Info"];

async function loadReview(): Promise<{ meta: ReviewMeta; bySkill: Map<string, { findings: number; observations: number; maxSeverity: string; issues: NodeIssue[] }> } | null> {
  const file = Bun.file(REVIEW_REPORT);
  if (!(await file.exists())) return null;
  try {
    const report = await file.json();
    const bySkill = new Map<string, { findings: number; observations: number; maxSeverity: string; issues: NodeIssue[] }>();
    const push = (item: any, kind: "finding" | "observation") => {
      const skill = item?.skill;
      if (!skill) return;
      const entry = bySkill.get(skill) ?? { findings: 0, observations: 0, maxSeverity: "Info", issues: [] };
      if (kind === "finding") entry.findings += 1; else entry.observations += 1;
      const sev = item.severity ?? "Info";
      if (SEVERITY_ORDER.indexOf(sev) < SEVERITY_ORDER.indexOf(entry.maxSeverity)) entry.maxSeverity = sev;
      entry.issues.push({ severity: sev, category: item.category ?? "", finding: item.finding ?? "", line: item.line, kind });
      bySkill.set(skill, entry);
    };
    for (const f of report.findings ?? []) push(f, "finding");
    for (const o of report.observations ?? []) push(o, "observation");
    return { meta: report.meta as ReviewMeta, bySkill };
  } catch {
    return null;
  }
}

export async function buildGraph(): Promise<GraphData> {
  const skills = await scanSkills();
  const subagents = await scanSubagents();
  const mcp = await scanMcpServers();
  const rules = await scanGlobalRules();
  const review = await loadReview();

  const allNodes = [...skills.nodes, ...subagents.nodes, ...mcp.nodes, ...rules.nodes];
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

export const router = {
  skillsGraph,
};

export type AppRouter = typeof router;
