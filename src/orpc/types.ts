export type NodeType = "skill" | "subagent" | "mcp" | "rule";
export type NodeIssue = { severity: string; category: string; finding: string; line?: number; kind: "finding" | "observation" };
export type GraphNode = {
  id: string; label: string; title: string; group: string; type: NodeType; dir: string; file?: string;
  findings?: number; observations?: number; maxSeverity?: string; issues?: NodeIssue[];
  meta?: Record<string, unknown>;
};
export type GraphEdge = { from: string; to: string; };
export type ReviewMeta = { score: number; grade: string; totalSkills: number; totalFindings: number; totalObservations: number; skillsWithIssues: number };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[]; review?: ReviewMeta };

export type ScanResult = { nodes: GraphNode[]; edges: GraphEdge[]; edgeSet: Set<string>; };
