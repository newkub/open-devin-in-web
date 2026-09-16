import { dirname, join } from "node:path";
import { AGENTS_ROOT, GLOBAL_RULES, MCP_CONFIG, SCANNER_EXE, SKILLS_ROOT } from "./paths";
import type { GraphEdge, GraphNode, ScanResult } from "./types";

export async function scanWithRust(): Promise<{ skills: ScanResult; agents: ScanResult } | null> {
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

export async function scanSkills(): Promise<ScanResult> {
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

export async function scanSubagents(): Promise<ScanResult> {
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

export async function scanMcpServers(): Promise<ScanResult> {
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

export async function scanGlobalRules(): Promise<ScanResult> {
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
