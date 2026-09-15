import { createEffect, createSignal, For, Show, type Component } from "solid-js";
import "@shikijs/twoslash/style-rich.css";
import { orpc } from "../orpc/client";
import type { NodeSource } from "../orpc/router";
import { groupColors, typeColors, type GraphNode } from "../graph";
import { extractHeadings, getMarkdown, parseDoc, type Heading } from "../markdown";

const McpCard: Component<{ node: GraphNode }> = (props) => {
  const m = () => (props.node.meta ?? {}) as Record<string, unknown>;
  const args = () => (m().args as string[] | undefined) ?? [];
  const entries = (o: unknown) => Object.entries((o ?? {}) as Record<string, unknown>);
  return (
    <div class="mcp-card">
      <div class="mcp-row">
        <span class="mcp-label">transport</span>
        <span class="badge badge-accent">{String(m().transport ?? "stdio")}</span>
        <Show when={m().disabled}>
          <span class="badge">disabled</span>
        </Show>
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
      <Show when={m().tools}>
        <div class="mcp-row">
          <span class="mcp-label">tools</span>
          <code class="mcp-cmd">{String(m().tools)}</code>
        </div>
      </Show>
    </div>
  );
};

export const Content: Component<{
  node: GraphNode | null;
  typeCounts: Record<string, number>;
  onHeadings: (h: Heading[]) => void;
  onSelectById: (id: string) => void;
}> = (props) => {
  const [html, setHtml] = createSignal("");
  const [fields, setFields] = createSignal<{ key: string; values: string[] }[]>([]);
  const [path, setPath] = createSignal("");
  const [state, setState] = createSignal<"idle" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = createSignal("");

  createEffect(() => {
    const n = props.node;
    props.onHeadings([]);
    if (!n || n.type === "mcp") {
      setHtml("");
      setFields([]);
      setPath(n?.file ?? "");
      setState("idle");
      return;
    }
    if (!n.file) {
      setState("error");
      return;
    }
    setState("loading");
    const nodeId = n.id;
    void (async () => {
      try {
        const [s, md] = await Promise.all([orpc.nodeSource({ id: nodeId }), getMarkdown()]);
        const doc = parseDoc(s.content);
        const out = s.path.endsWith(".json")
          ? await md.renderAsync(`\`\`\`json\n${s.content}\n\`\`\``)
          : await md.renderAsync(doc.body);
        if (props.node?.id !== nodeId) return;
        setPath(s.path);
        setFields(doc.fields);
        setHtml(out);
        props.onHeadings(extractHeadings(doc.body));
        setState("idle");
      } catch (err) {
        console.error("content render failed", err);
        if (props.node?.id === nodeId) {
          setErrMsg(err instanceof Error ? err.message : String(err));
          setState("error");
        }
      }
    })();
  });

  const openInVSCode = () => {
    const file = props.node?.file;
    if (file) window.open(`vscode://file/${file.replaceAll("\\", "/")}`);
  };

  const fieldLabel = (key: string) => key.replace(/-/g, " ");

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
              <Show when={path()}>
                <p class="preview-path" title={path()}>{path()}</p>
              </Show>
            </div>
            <div class="content-body">
              <Show when={n().type === "mcp"}>
                <McpCard node={n()} />
              </Show>
              <Show when={n().type !== "mcp"}>
                <Show when={fields().length > 0}>
                  <div class="fm-card">
                    <For each={fields().filter((f) => f.key !== "name" && f.key !== "description")}>
                      {(f) => (
                        <div class="fm-row">
                          <span class="fm-key">{fieldLabel(f.key)}</span>
                          <Show
                            when={f.key === "related"}
                            fallback={
                              <div class="rel-chips">
                                <For each={f.values}>
                                  {(v) => <code class="chip chip-code">{v}</code>}
                                </For>
                              </div>
                            }
                          >
                            <div class="rel-chips">
                              <For each={f.values}>
                                {(v) => (
                                  <button class="chip" onClick={() => props.onSelectById(v)}>{v}</button>
                                )}
                              </For>
                            </div>
                          </Show>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={state() === "loading"}>
                  <p class="preview-status">loading…</p>
                </Show>
                <Show when={state() === "error"}>
                  <p class="preview-status">no source available</p>
                  <Show when={errMsg()}>
                    <pre class="preview-error">{errMsg()}</pre>
                  </Show>
                </Show>
                {/* content is local user files; markdown-exit html:false escapes raw HTML */}
                <div class="md" innerHTML={html()} />
              </Show>
            </div>
          </>
        )}
      </Show>
    </main>
  );
};
