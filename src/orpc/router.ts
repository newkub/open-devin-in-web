import { os } from "@orpc/server";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

const HOME_DIR = Bun.env.USERPROFILE ?? Bun.env.HOME ?? "";
const DEVIN_HOME = Bun.env.DEVIN_HOME ?? join(Bun.env.APPDATA ?? join(HOME_DIR, ".config"), "devin");

const SKILLS_ROOT = Bun.env.SKILLS_ROOT ?? join(DEVIN_HOME, "skills");

const firstExisting = (candidates: string[], fallback: string) => {
  for (const p of candidates) if (existsSync(p)) return p;
  return fallback;
};

const AGENTS_ROOT = Bun.env.AGENTS_ROOT ?? firstExisting(
  [join(DEVIN_HOME, "agents"), join(HOME_DIR, ".config", "devin", "agents")],
  join(DEVIN_HOME, "agents"),
);
const MCP_CONFIG = Bun.env.MCP_CONFIG ?? firstExisting(
  [join(DEVIN_HOME, "mcp_config.json"), join(SKILLS_ROOT, ".devin", "config.json")],
  join(DEVIN_HOME, "mcp_config.json"),
);
const GLOBAL_RULES = Bun.env.GLOBAL_RULES ?? join(HOME_DIR, ".codeium", "windsurf", "memories", "global_rules.md");
const REVIEW_REPORT = Bun.env.REVIEW_REPORT ?? join(SKILLS_ROOT, "review-devin-global-harness", "review-skills-report.json");

async function resolveReviewPath(): Promise<string | null> {
  if (await Bun.file(REVIEW_REPORT).exists()) return REVIEW_REPORT;
  try {
    for (const m of new Bun.Glob("review-devin*/review-skills-report.json").scanSync(SKILLS_ROOT)) {
      return join(SKILLS_ROOT, m);
    }
  } catch { }
  return null;
}

type NodeType = "skill" | "subagent" | "mcp" | "rule";
type NodeIssue = { severity: string; category: string; finding: string; line?: number; kind: "finding" | "observation" };
type GraphNode = {
  id: string; label: string; title: string; group: string; type: NodeType; dir: string; file?: string;
  findings?: number; observations?: number; maxSeverity?: string; issues?: NodeIssue[];
  meta?: Record<string, unknown>;
};
type GraphEdge = { from: string; to: string; };
type ReviewMeta = { score: number; grade: string; totalSkills: number; totalFindings: number; totalObservations: number; skillsWithIssues: number };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[]; review?: ReviewMeta };

type ScanResult = { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; };

const SCANNER_EXE = join(import.meta.dir, "..", "..", "scanner", "target", "release",
  process.platform === "win32" ? "graph-scanner.exe" : "graph-scanner");

async function scanWithRust(): Promise<{ skills: ScanResult; agents: ScanResult } | null> {
  try {
    if (!(await Bun.file(SCANNER_EXE).exists())) return null;
    const proc = Bun.spawnSync([SCANNER_EXE], { stdout: "pipe", stderr: "ignore" });
    if (proc.exitCode !== 0) return null;
    const data = JSON.parse(proc.stdout.toString()) as {
      skills: { nodes: GraphNode[]; edges: GraphEdge[] };
      agents: { nodes: GraphNode[]; edges: GraphEdge[] };
    };
    const toResult = (s: { nodes: GraphNode[]; edges: GraphEdge[] }): ScanResult => ({
      nodes: s.nodes,
      edges: s.edges,
      edgeSet: new Set(s.edges.map((e) => `${e.from}->${e.to}`)),
    });
    return { skills: toResult(data.skills), agents: toResult(data.agents) };
  } catch {
    return null;
  }
}

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
      nodes.push({ id, label: id, title: description ?? "", group, type: "skill", dir: dirName, file });
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
      const name2 = name ?? dirName;
      const id = `agent:${name2}`;
      nodes.push({ id, label: name2, title: description ?? "", group: "subagent", type: "subagent", dir: dirName, file });
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
    const maskSecrets = (obj: unknown) =>
      Object.fromEntries(Object.entries((obj ?? {}) as Record<string, unknown>).map(([k]) => [k, "•••"]));
    for (const [name, cfg] of Object.entries(servers)) {
      const c = (cfg ?? {}) as Record<string, unknown>;
      const desc = (c.description as string) ?? `MCP server: ${name}`;
      const url = c.url ?? c.serverUrl;
      const meta: Record<string, unknown> = {
        transport: url ? "http" : c.command ? "stdio" : (c.type as string) ?? "unknown",
        command: c.command,
        args: c.args,
        url,
        registry: c.registry,
        disabled: c.disabled,
        env: maskSecrets(c.env),
        headers: maskSecrets(c.headers),
        tools: c.tools,
      };
      nodes.push({ id: `mcp:${name}`, label: name, title: desc, group: "mcp", type: "mcp", dir: name, file: MCP_CONFIG, meta });
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
    nodes.push({ id, label: "Global Rules", title: desc, group: "rule", type: "rule", dir: "global_rules.md", file: GLOBAL_RULES });
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
  const path = await resolveReviewPath();
  if (!path) return null;
  const file = Bun.file(path);
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
