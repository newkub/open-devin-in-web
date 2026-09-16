import { resolveReviewPath } from "./paths";
import type { NodeIssue, ReviewMeta } from "./types";

const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low", "Info"];

export type SkillIssues = { findings: number; observations: number; maxSeverity: string; issues: NodeIssue[] };

export async function loadReview(): Promise<{ meta: ReviewMeta; bySkill: Map<string, SkillIssues> } | null> {
  const path = await resolveReviewPath();
  if (!path) return null;
  const file = Bun.file(path);
  try {
    const report = await file.json();
    const bySkill = new Map<string, SkillIssues>();
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
