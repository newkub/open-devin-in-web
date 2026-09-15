import { createMarkdownExit, type MarkdownExit } from "markdown-exit";
import Shiki from "@shikijs/markdown-exit";

export type Heading = { level: number; text: string; slug: string };
export type FrontmatterField = { key: string; values: string[] };
export type ParsedDoc = { fields: FrontmatterField[]; body: string };

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^\wก-๙-]+/g, "-").replace(/^-+|-+$/g, "");

let mdPromise: Promise<MarkdownExit> | null = null;

export function getMarkdown(): Promise<MarkdownExit> {
  if (!mdPromise) {
    mdPromise = (async () => {
      const { transformerNotationDiff, transformerNotationFocus, transformerNotationHighlight } =
        await import("@shikijs/transformers");
      const transformers = [
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerNotationHighlight(),
      ];
      try {
        const { transformerTwoslash } = await import("@shikijs/twoslash");
        transformers.push(transformerTwoslash({ explicitTrigger: true }));
      } catch {
        // twoslash needs fs — unavailable in browser; ```ts twoslash blocks render plain
      }
      const md = createMarkdownExit({ html: false, linkify: true });
      md.use(Shiki({
        themes: { light: "github-light", dark: "github-dark-default" },
        transformers,
      }));
      md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        const inline = tokens[idx + 1];
        const text = inline?.content ?? "";
        const base = slugify(text) || "section";
        const slugs = ((env as Record<string, unknown>).__slugs ??= new Map<string, number>()) as Map<string, number>;
        const count = slugs.get(base) ?? 0;
        slugs.set(base, count + 1);
        tokens[idx].attrSet("id", count ? `${base}-${count}` : base);
        return self.renderToken(tokens, idx, options);
      };
      return md;
    })();
  }
  return mdPromise;
}

export function parseDoc(text: string): ParsedDoc {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { fields: [], body: text };
  const fields: FrontmatterField[] = [];
  let current: FrontmatterField | null = null;
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv && !/^\s/.test(line)) {
      current = { key: kv[1], values: kv[2] ? [kv[2].trim().replace(/^["']|["']$/g, "")] : [] };
      fields.push(current);
      continue;
    }
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && current) {
      current.values.push(item[1].trim().replace(/^["']|["']$/g, ""));
    }
  }
  return { fields, body: text.slice(match[0].length) };
}

export function extractHeadings(body: string): Heading[] {
  const headings: Heading[] = [];
  const slugs = new Map<string, number>();
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^(#{1,4})\s+(.+?)\s*#*$/);
    if (!m) continue;
    const base = slugify(m[2]) || "section";
    const count = slugs.get(base) ?? 0;
    slugs.set(base, count + 1);
    headings.push({ level: m[1].length, text: m[2], slug: count ? `${base}-${count}` : base });
  }
  return headings;
}
