import { For, Show, type Accessor, type Component } from "solid-js";
import { groupColors, severityColors, type GraphNode, type SelectedNode } from "../Graph";

export const DetailPanel: Component<{
  selected: Accessor<SelectedNode | null>;
  incoming: GraphNode[];
  outgoing: GraphNode[];
  egoActive: boolean;
  onFocus: () => void;
  onClear: () => void;
  onEgo: () => void;
  onSelectById: (id: string) => void;
  onOpenInVSCode: (node: GraphNode) => void;
}> = (props) => {
  return (
    <Show when={props.selected}>
      <div class="detail">
        <div class="detail-header">
          <h3>{props.selected()!.id}</h3>
          <span class="group-badge" style={{ "background-color": (groupColors[props.selected()!.group] || groupColors.default).background }}>
            {props.selected()!.group}
          </span>
          <span class="type-badge">{props.selected()!.type}</span>
        </div>
        <p class="desc">{props.selected()!.title}</p>
        <p class="meta">{props.selected()!.incoming} incoming · {props.selected()!.outgoing} outgoing</p>
        <p class="meta dir-path">{props.selected()!.dir}</p>
        <div class="controls small">
          <button onClick={props.onFocus}>focus</button>
          <button classList={{ active: props.egoActive }} title="Show only this node and its neighbors" onClick={props.onEgo}>ego net</button>
          <button onClick={props.onClear}>clear</button>
          <button title="Copy node id" onClick={() => navigator.clipboard?.writeText?.(props.selected()!.id)}>copy</button>
          <Show when={props.selected()!.type === "skill"}>
            <button title="Copy /skill invocation" onClick={() => navigator.clipboard?.writeText?.(`/${props.selected()!.id}`)}>copy /</button>
          </Show>
          <button title="Open file in VS Code" onClick={() => props.onOpenInVSCode(props.selected()!)}>open</button>
        </div>
        <Show when={(props.selected()!.issues?.length ?? 0) > 0}>
          <div class="related-section">
            <h5>review issues ({props.selected()!.issues!.length})</h5>
            <ul class="issue-list">
              <For each={props.selected()!.issues}>
                {(issue) => (
                  <li>
                    <span class="sev-chip" style={{ "background-color": severityColors[issue.severity] ?? severityColors.Info }}>
                      {issue.severity}
                    </span>
                    <span class="issue-text">{issue.finding}{issue.line ? ` :${issue.line}` : ""}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
        <Show when={props.outgoing.length > 0}>
          <div class="related-section">
            <h5>uses</h5>
            <ul class="related-list">
              <For each={props.outgoing}>
                {(n) => (
                  <li onClick={() => props.onSelectById(n.id)}>
                    <span class="related-dot" style={{ "background-color": (groupColors[n.group] || groupColors.default).background }} />
                    <span>{n.id}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
        <Show when={props.incoming.length > 0}>
          <div class="related-section">
            <h5>used by</h5>
            <ul class="related-list">
              <For each={props.incoming}>
                {(n) => (
                  <li onClick={() => props.onSelectById(n.id)}>
                    <span class="related-dot" style={{ "background-color": (groupColors[n.group] || groupColors.default).background }} />
                    <span>{n.id}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>
    </Show>
  );
};
