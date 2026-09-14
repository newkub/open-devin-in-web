import { For, Show, type Component } from "solid-js";

export const TopBar: Component<{
  search: string;
  onSearch: (v: string) => void;
  groups: string[];
  groupCounts: Record<string, number>;
  prefix: string;
  onPrefix: (v: string) => void;
  dark: boolean;
  onToggleDark: () => void;
  totalNodes: number;
  totalEdges: number;
  visibleNodes: number;
}> = (props) => (
  <header class="topbar">
    <span class="brand">Open Devin</span>
    <div class="search-wrap">
      <span class="i-mdi-magnify search-icon" />
      <input
        id="skill-search"
        type="text"
        placeholder="search nodes (press /)..."
        aria-label="Search nodes"
        value={props.search}
        onInput={(e) => props.onSearch(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            props.onSearch("");
            e.currentTarget.blur();
          }
        }}
      />
    </div>
    <select
      value={props.prefix}
      onChange={(e) => props.onPrefix(e.currentTarget.value)}
      aria-label="Filter by prefix"
      title="Filter by skill prefix"
    >
      <option value="all">all prefixes</option>
      <For each={props.groups}>
        {(g) => <option value={g}>{g} ({props.groupCounts[g] ?? 0})</option>}
      </For>
    </select>
    <span class="counts" role="status">
      <Show when={props.visibleNodes !== props.totalNodes}>
        {props.visibleNodes}/
      </Show>
      {props.totalNodes} nodes · {props.totalEdges} edges
    </span>
    <button
      class="tb-btn"
      aria-label="Toggle dark/light theme (D)"
      title="Toggle dark/light theme (D)"
      onClick={props.onToggleDark}
    >
      <span class={props.dark ? "i-mdi-white-balance-sunny" : "i-mdi-weather-night"} />
    </button>
  </header>
);
