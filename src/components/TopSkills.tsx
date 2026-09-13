import { For, type Component } from "solid-js";
import type { GraphData, GraphNode } from "../Graph";
import { Collapsible } from "./Collapsible";

type TopItem = { id: string; count: number; node: GraphNode };

export const TopSkills: Component<{
  topSkills: TopItem[];
  graphData: GraphData | null;
  onSelect: (node: GraphNode, incoming: number, outgoing: number) => void;
}> = (props) => {
  return (
    <Collapsible title="top skills" open>
      <ul class="top-list">
        <For each={props.topSkills}>
          {(item) => (
            <li
              role="button"
              tabIndex={0}
              onClick={() => {
                const data = props.graphData;
                if (!data) return;
                const incoming = data.edges.filter((e) => e.to === item.id).length;
                const outgoing = data.edges.filter((e) => e.from === item.id).length;
                props.onSelect(item.node, incoming, outgoing);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const data = props.graphData;
                if (!data) return;
                const incoming = data.edges.filter((e) => e.to === item.id).length;
                const outgoing = data.edges.filter((e) => e.from === item.id).length;
                props.onSelect(item.node, incoming, outgoing);
              }}
            >
              <span>{item.id}</span>
              <span class="count">{item.count}</span>
            </li>
          )}
        </For>
      </ul>
    </Collapsible>
  );
};
