import { For, Show, type Component } from "solid-js";
import { MiniGraph } from "./MiniGraph";
import { typeColors, type GraphNode } from "../graph";

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
  dark: boolean;
  onSelectById: (id: string) => void;
}> = (props) => (
  <aside class="flow-panel" aria-label="Relations">
    <div class="flow-section">
      <h4 class="flow-heading">
        <span class="i-mdi-swap-horizontal" /> flow
      </h4>
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
  </aside>
);
