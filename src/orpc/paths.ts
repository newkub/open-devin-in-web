import { existsSync } from "node:fs";
import { join } from "node:path";

export const HOME_DIR = Bun.env.USERPROFILE ?? Bun.env.HOME ?? "";
export const DEVIN_HOME = Bun.env.DEVIN_HOME ?? join(Bun.env.APPDATA ?? join(HOME_DIR, ".config"), "devin");

export const SKILLS_ROOT = Bun.env.SKILLS_ROOT ?? join(DEVIN_HOME, "skills");

const firstExisting = (candidates: string[], fallback: string) => {
  for (const p of candidates) if (existsSync(p)) return p;
  return fallback;
};

export const AGENTS_ROOT = Bun.env.AGENTS_ROOT ?? firstExisting(
  [join(DEVIN_HOME, "agents"), join(HOME_DIR, ".config", "devin", "agents")],
  join(DEVIN_HOME, "agents"),
);
export const MCP_CONFIG = Bun.env.MCP_CONFIG ?? firstExisting(
  [join(DEVIN_HOME, "mcp_config.json"), join(SKILLS_ROOT, ".devin", "config.json")],
  join(DEVIN_HOME, "mcp_config.json"),
);
export const GLOBAL_RULES = Bun.env.GLOBAL_RULES ?? join(HOME_DIR, ".codeium", "windsurf", "memories", "global_rules.md");
export const REVIEW_REPORT = Bun.env.REVIEW_REPORT ?? join(SKILLS_ROOT, "review-devin-global-harness", "review-skills-report.json");

export const SCANNER_EXE = join(import.meta.dir, "..", "..", "scanner", "target", "release",
  process.platform === "win32" ? "graph-scanner.exe" : "graph-scanner");

export async function resolveReviewPath(): Promise<string | null> {
  if (await Bun.file(REVIEW_REPORT).exists()) return REVIEW_REPORT;
  try {
    for (const m of new Bun.Glob("review-devin*/review-skills-report.json").scanSync(SKILLS_ROOT)) {
      return join(SKILLS_ROOT, m);
    }
  } catch { }
  return null;
}
