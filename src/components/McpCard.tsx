import { For, Show, type Component } from "solid-js";
import type { GraphNode } from "../graph";

export const McpCard: Component<{ node: GraphNode }> = (props) => {
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
