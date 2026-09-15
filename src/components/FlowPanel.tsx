import { createSignal, For, Show, type Component } from "solid-js";
import { MiniGraph } from "./MiniGraph";
import { typeColors, type GraphNode } from "../graph";
import type { Heading } from "../markdown";

type PanelTab = "flow" | "outline";

const FlowColumn: Component<{
  title: string;
  icon: string;
  nodes: GraphNode[];
  onSelect: (id: string) => void;
}> = (props) => (
  <div class="flow-col">
    <h5><span class={props.icon} /> {props.title} ({props.nodes.length})</h5>
    <div class="flow-items">
      <For each={props.nodes.slice(0, 30)}>
        {(r) => (
          <button class="flow-item" onClick={() => props.onSelect(r.id)} title={r.id}>
            <span class="node-dot" style={{ "background-color": typeColors[r.type] }} />
            <span class="flow-label">{r.label}</span>
          </button>
        )}
      </For>
      <Show when={props.nodes.length > 30}>
        <span class="flow-more">+{props.nodes.length - 30} more</span>
      </Show>
      <Show when={props.nodes.length === 0}>
        <span class="flow-more">none</span>
      </Show>
    </div>
  </div>
);

export const FlowPanel: Component<{
  node: GraphNode | null;
  incoming: GraphNode[];
  outgoing: GraphNode[];
  listNodes: GraphNode[];
  edges: { from: string; to: string }[];
  headings: Heading[];
  dark: boolean;
  showGraph: boolean;
  onSelectById: (id: string) => void;
}> = (props) => {
  const [ptab, setPtab] = createSignal<PanelTab>("flow");

  const scrollTo = (slug: string) => {
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside class="flow-panel" aria-label="Side panel">
      <nav class="tabs ptabs" role="tablist" aria-label="Panel tabs">
        <button
          role="tab"
          aria-selected={ptab() === "flow"}
          classList={{ active: ptab() === "flow" }}
          onClick={() => setPtab("flow")}
        >
          <span class="i-mdi-swap-horizontal" /> flow
        </button>
        <button
          role="tab"
          aria-selected={ptab() === "outline"}
          classList={{ active: ptab() === "outline" }}
          onClick={() => setPtab("outline")}
        >
          <span class="i-mdi-format-list-bulleted" /> outline
        </button>
      </nav>
      <Show when={ptab() === "flow"}>
        <div class="flow-section">
          <Show
            when={props.node}
            fallback={<p class="flow-hint">select a node to see its relations</p>}
          >
            <FlowColumn title="used by" icon="i-mdi-arrow-left" nodes={props.incoming} onSelect={props.onSelectById} />
            <div class="flow-center">
              <span class="flow-center-dot" style={{ "background-color": typeColors[props.node!.type] }} />
              {props.node!.label}
            </div>
            <FlowColumn title="related" icon="i-mdi-arrow-right" nodes={props.outgoing} onSelect={props.onSelectById} />
          </Show>
        </div>
        <Show when={props.showGraph}>
          <div class="mini-section">
            <h4 class="flow-heading">
              <span class="i-mdi-graph-outline" /> mini graph
              <span class="mini-count">{props.listNodes.length > 150 ? `150/${props.listNodes.length}` : props.listNodes.length}</span>
            </h4>
            <MiniGraph
              nodes={props.listNodes}
              edges={props.edges}
              selectedId={props.node?.id ?? null}
              dark={props.dark}
              onSelect={props.onSelectById}
            />
          </div>
        </Show>
      </Show>
      <Show when={ptab() === "outline"}>
        <div class="outline-section">
          <Show
            when={props.headings.length > 0}
            fallback={<p class="flow-hint">select a document to see its outline</p>}
          >
            <ul class="outline-list">
              <For each={props.headings}>
                {(h) => (
                  <li>
                    <button
                      class="outline-item"
                      style={{ "padding-left": `${(h.level - 1) * 14 + 8}px` }}
                      onClick={() => scrollTo(h.slug)}
                    >
                      {h.text}
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </Show>
    </aside>
  );
};
