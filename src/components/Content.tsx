import { createEffect, createSignal, For, Show, type Component } from "solid-js";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
import { orpc } from "../orpc/client";
import type { NodeSource } from "../orpc/router";
import { groupColors, typeColors, type GraphNode } from "../graph";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight(str, lang): string {
    let value: string;
    if (lang && hljs.getLanguage(lang)) {
      try {
        value = hljs.highlight(str, { language: lang }).value;
      } catch {
        value = escapeHtml(str);
      }
    } else {
      value = escapeHtml(str);
    }
    return `<pre class="hljs"><code>${value}</code></pre>`;
  },
});

const stripFrontmatter = (text: string) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

const renderSource = (s: NodeSource) => {
  if (s.path.endsWith(".json")) return md.render(`\`\`\`json\n${s.content}\n\`\`\``);
  return md.render(stripFrontmatter(s.content));
};

const McpCard: Component<{ node: GraphNode }> = (props) => {
  const m = () => (props.node.meta ?? {}) as Record<string, unknown>;
  const args = () => (m().args as string[] | undefined) ?? [];
  const entries = (o: unknown) => Object.entries((o ?? {}) as Record<string, unknown>);
  return (
    <div class="mcp-card">
      <div class="mcp-row">
        <span class="mcp-label">transport</span>
        <span class="badge badge-accent">{String(m().transport ?? "stdio")}</span>
      </div>
      <Show when={m().command}>
        <div class="mcp-row">
          <span class="mcp-label">command</span>
          <code class="mcp-cmd">{String(m().command)}</code>
        </div>
      </Show>
      <Show when={args().length > 0}>
        <div class="mcp-row">
          <span class="mcp-label">args</span>
          <div class="rel-chips">
            <For each={args()}>{(a) => <code class="chip chip-code">{a}</code>}</For>
          </div>
        </div>
      </Show>
      <Show when={m().url}>
        <div class="mcp-row">
          <span class="mcp-label">url</span>
          <code class="mcp-cmd">{String(m().url)}</code>
        </div>
      </Show>
      <Show when={m().registry}>
        <div class="mcp-row">
          <span class="mcp-label">registry</span>
          <code class="mcp-cmd">{String(m().registry)}</code>
        </div>
      </Show>
      <Show when={m().disabled}>
        <div class="mcp-row">
          <span class="mcp-label">status</span>
          <span class="badge">disabled</span>
        </div>
      </Show>
      <Show when={m().tools}>
        <div class="mcp-row">
          <span class="mcp-label">tools</span>
          <code class="mcp-cmd">{String(m().tools)}</code>
        </div>
      </Show>
      <Show when={entries(m().env).length > 0}>
        <div class="mcp-row">
          <span class="mcp-label">env</span>
          <div class="rel-chips">
            <For each={entries(m().env)}>
              {([k]) => <code class="chip chip-code">{k}=•••</code>}
            </For>
          </div>
        </div>
      </Show>
      <Show when={entries(m().headers).length > 0}>
        <div class="mcp-row">
          <span class="mcp-label">headers</span>
          <div class="rel-chips">
            <For each={entries(m().headers)}>
              {([k]) => <code class="chip chip-code">{k}</code>}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};

export const Content: Component<{
  node: GraphNode | null;
  typeCounts: Record<string, number>;
}> = (props) => {
  const [source, setSource] = createSignal<NodeSource | null>(null);
  const [state, setState] = createSignal<"idle" | "loading" | "error">("idle");

  createEffect(() => {
    const n = props.node;
    if (!n || n.type === "mcp") {
      setSource(null);
      setState(n ? "idle" : "idle");
      return;
    }
    if (!n.file) {
      setSource(null);
      setState("error");
      return;
    }
    setState("loading");
    orpc.nodeSource({ id: n.id })
      .then((s) => { setSource(s); setState("idle"); })
      .catch(() => setState("error"));
  });

  const openInVSCode = () => {
    const file = props.node?.file;
    if (file) window.open(`vscode://file/${file.replaceAll("\\", "/")}`);
  };

  return (
    <main class="content" aria-label="Content">
      <Show
        when={props.node}
        fallback={
          <div class="content-empty">
            <span class="i-mdi-file-document-outline" />
            <h2>Devin Global Resources</h2>
            <div class="overview-grid">
              <For each={Object.entries(props.typeCounts).filter(([k]) => k !== "all")}>
                {([t, c]) => (
                  <div class="overview-item">
                    <span class="node-dot" style={{ "background-color": typeColors[t] }} />
                    <span class="overview-type">{t}</span>
                    <span class="overview-count">{c}</span>
                  </div>
                )}
              </For>
            </div>
            <p>select a node from the sidebar to preview</p>
          </div>
        }
      >
        {(n) => (
          <>
            <div class="content-head">
              <div class="preview-title">
                <span
                  class="node-dot"
                  style={{ "background-color": (groupColors[n().group] || groupColors.default).background }}
                />
                <h2>{n().label}</h2>
              </div>
              <div class="preview-badges">
                <span class="badge" style={{ color: typeColors[n().type], "border-color": typeColors[n().type] }}>
                  {n().type}
                </span>
                <span class="badge">{n().group}</span>
                <Show when={n().file}>
                  <button class="tb-btn" title="Open in VS Code" aria-label="Open in VS Code" onClick={openInVSCode}>
                    <span class="i-mdi-open-in-new" />
                  </button>
                </Show>
              </div>
              <Show when={n().title}>
                <p class="preview-desc">{n().title}</p>
              </Show>
              <Show when={source()}>
                <p class="preview-path" title={source()!.path}>{source()!.path}</p>
              </Show>
              <Show when={n().file && !source()}>
                <p class="preview-path">{n().file}</p>
              </Show>
            </div>
            <div class="content-body">
              <Show when={n().type === "mcp"}>
                <McpCard node={n()} />
              </Show>
              <Show when={n().type !== "mcp"}>
                <Show when={state() === "loading"}>
                  <p class="preview-status">loading…</p>
                </Show>
                <Show when={state() === "error"}>
                  <p class="preview-status">no source available</p>
                </Show>
                <Show when={source()}>
                  {/* content is local user files; markdown-it html:false escapes raw HTML */}
                  <div class="md" innerHTML={renderSource(source()!)} />
                </Show>
              </Show>
            </div>
          </>
        )}
      </Show>
    </main>
  );
};
