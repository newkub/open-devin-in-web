import { For, Show, type Component } from "solid-js";
import { groupColors, typeColors, type GraphNode } from "../Graph";

export type SidebarTab = "all" | "skill" | "subagent" | "mcp" | "rule";

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: "all", label: "all", icon: "i-mdi-apps" },
  { id: "skill", label: "skills", icon: "i-mdi-lightning-bolt-outline" },
  { id: "subagent", label: "agents", icon: "i-mdi-robot-outline" },
  { id: "mcp", label: "mcp", icon: "i-mdi-server-outline" },
  { id: "rule", label: "rules", icon: "i-mdi-scale-balance" },
];

export const Sidebar: Component<{
  tab: SidebarTab;
  onTab: (t: SidebarTab) => void;
  tabCounts: Record<SidebarTab, number>;
  nodes: GraphNode[];
  degree: Map<string, number>;
  selectedId: string | null;
  onSelect: (n: GraphNode) => void;
}> = (props) => (
  <aside class="side">
    <nav class="tabs" role="tablist" aria-label="Resource types">
      <For each={TABS}>
        {(t) => (
          <button
            role="tab"
            aria-selected={props.tab === t.id}
            classList={{ active: props.tab === t.id }}
            onClick={() => props.onTab(t.id)}
            title={`${t.label} (${props.tabCounts[t.id] ?? 0})`}
          >
            <span class={t.icon} />
            <span class="tab-label">{t.label}</span>
            <span class="tab-count">{props.tabCounts[t.id] ?? 0}</span>
          </button>
        )}
      </For>
    </nav>
    <ul class="node-list" role="listbox" aria-label="Nodes">
      <For each={props.nodes}>
        {(n) => (
          <li
            role="option"
            tabIndex={0}
            aria-selected={props.selectedId === n.id}
            classList={{ active: props.selectedId === n.id }}
            onClick={() => props.onSelect(n)}
            onKeyDown={(e) => e.key === "Enter" && props.onSelect(n)}
          >
            <span
              class="node-dot"
              style={{ "background-color": (groupColors[n.group] || groupColors.default).background }}
            />
            <span class="node-id">{n.label}</span>
            <span class="node-meta">
              <span class="node-type" style={{ color: typeColors[n.type] }}>{n.type}</span>
              <Show when={(props.degree.get(n.id) ?? 0) > 0}>
                <span class="node-deg">{props.degree.get(n.id)}</span>
              </Show>
            </span>
          </li>
        )}
      </For>
      <Show when={props.nodes.length === 0}>
        <li class="node-empty">no nodes match</li>
      </Show>
    </ul>
  </aside>
);
