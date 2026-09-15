import { createSignal, onCleanup, onMount, Show, type Component } from "solid-js";

export const TopBar: Component<{
  search: string;
  onSearch: (v: string) => void;
  dark: boolean;
  onToggleDark: () => void;
  compact: boolean;
  onToggleCompact: () => void;
  showGraph: boolean;
  onToggleGraph: () => void;
  totalNodes: number;
  totalEdges: number;
  visibleNodes: number;
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  let menuRef: HTMLDivElement;

  const close = (e: MouseEvent) => {
    if (menuRef && !menuRef.contains(e.target as Node)) setOpen(false);
  };
  onMount(() => document.addEventListener("click", close));
  onCleanup(() => document.removeEventListener("click", close));

  return (
    <header class="topbar">
      <span class="brand">Open Devin</span>
      <div class="search-wrap">
        <span class="i-mdi-magnify search-icon" />
        <input
          id="skill-search"
          type="text"
          placeholder="search... ( / )"
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
      <div class="topbar-right">
        <span class="counts" role="status">
          <Show when={props.visibleNodes !== props.totalNodes}>
            {props.visibleNodes}/
          </Show>
          {props.totalNodes} nodes · {props.totalEdges} edges
        </span>
        <div class="menu-wrap" ref={(el) => (menuRef = el)}>
          <button
            class="tb-btn"
            aria-label="View options"
            aria-expanded={open()}
            title="View options"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          >
            <span class="i-mdi-tune" />
          </button>
          <Show when={open()}>
            <div class="dropdown" role="menu">
              <button role="menuitem" class="dd-item" onClick={() => { props.onToggleDark(); setOpen(false); }}>
                <span class={props.dark ? "i-mdi-white-balance-sunny" : "i-mdi-weather-night"} />
                {props.dark ? "light theme" : "dark theme"}
              </button>
              <button role="menuitem" class="dd-item" onClick={() => { props.onToggleCompact(); setOpen(false); }}>
                <span class={props.compact ? "i-mdi-checkbox-marked-outline" : "i-mdi-checkbox-blank-outline"} />
                compact list
              </button>
              <button role="menuitem" class="dd-item" onClick={() => { props.onToggleGraph(); setOpen(false); }}>
                <span class={props.showGraph ? "i-mdi-checkbox-marked-outline" : "i-mdi-checkbox-blank-outline"} />
                mini graph
              </button>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
};
