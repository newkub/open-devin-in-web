import { createEffect, createSignal, For, Show, type Component } from "solid-js";
import MarkdownIt from "markdown-it";
import { orpc } from "../orpc/client";
import type { NodeSource } from "../orpc/router";
import { groupColors, typeColors, type GraphNode } from "../Graph";

const md = new MarkdownIt({ html: false, linkify: true });

const stripFrontmatter = (text: string) => text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

const renderSource = (s: NodeSource) => {
  if (s.path.endsWith(".json")) return md.render(`\`\`\`json\n${s.content}\n\`\`\``);
  return md.render(stripFrontmatter(s.content));
};

export const Preview: Component<{
  node: GraphNode | null;
  incoming: GraphNode[];
  outgoing: GraphNode[];
  onSelectById: (id: string) => void;
}> = (props) => {
  const [source, setSource] = createSignal<NodeSource | null>(null);
  const [state, setState] = createSignal<"idle" | "loading" | "error">("idle");

  createEffect(() => {
    const n = props.node;
    if (!n) {
      setSource(null);
      setState("idle");
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
    <aside class="preview" aria-label="Node details">
      <Show
        when={props.node}
        fallback={
          <div class="preview-empty">
            <span class="i-mdi-cursor-default-click-outline" />
            <p>select a node to preview</p>
          </div>
        }
      >
        {(n) => (
          <>
            <div class="preview-head">
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
                <button class="tb-btn" title="Open in VS Code" aria-label="Open in VS Code" onClick={openInVSCode}>
                  <span class="i-mdi-open-in-new" />
                </button>
              </div>
              <Show when={n().title}>
                <p class="preview-desc">{n().title}</p>
              </Show>
              <Show when={source()}>
                <p class="preview-path" title={source()!.path}>{source()!.path}</p>
              </Show>
              <div class="preview-rel">
                <Show when={props.outgoing.length > 0}>
                  <div class="rel-group">
                    <h5>related →</h5>
                    <div class="rel-chips">
                      <For each={props.outgoing}>
                        {(r) => (
                          <button class="chip" onClick={() => props.onSelectById(r.id)}>{r.id}</button>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
                <Show when={props.incoming.length > 0}>
                  <div class="rel-group">
                    <h5>← used by</h5>
                    <div class="rel-chips">
                      <For each={props.incoming}>
                        {(r) => (
                          <button class="chip" onClick={() => props.onSelectById(r.id)}>{r.id}</button>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
            <div class="preview-body">
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
            </div>
          </>
        )}
      </Show>
    </aside>
  );
};
