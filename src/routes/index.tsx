import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { Graph, type GraphData, type GraphNode } from "../Graph";
import { TopBar } from "../components/TopBar";
import { Sidebar, type SidebarTab } from "../components/Sidebar";
import { Preview } from "../components/Preview";

const persisted = <T,>(key: string, init: T) => {
  const full = `open-devin-in-web-${key}`;
  let start = init;
  try {
    const saved = localStorage.getItem(full);
    if (saved !== null) start = JSON.parse(saved) as T;
  } catch { }
  const [sig, setSig] = createSignal<T>(start);
  createEffect(() => {
    try { localStorage.setItem(full, JSON.stringify(sig())); } catch { }
  });
  return [sig, setSig] as const;
};

export function GraphPage() {
  const [search, setSearch] = createSignal("");
  const [selected, setSelected] = createSignal<GraphNode | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [graphData, setGraphData] = createSignal<GraphData | null>(null);
  const [focus, setFocus] = createSignal<string | null>(null);
  const [fitTick, setFitTick] = createSignal(0);

  const [dark, setDark] = persisted("theme", true);
  const [prefix, setPrefix] = persisted("prefix", "all");
  const [tab, setTab] = persisted<SidebarTab>("tab", "all");

  const degreeMap = createMemo(() => {
    const data = graphData();
    const degree = new Map<string, number>();
    if (!data) return degree;
    for (const n of data.nodes) degree.set(n.id, 0);
    for (const e of data.edges) {
      degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
      degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
    }
    return degree;
  });

  const groups = createMemo(() => {
    const data = graphData();
    if (!data) return [] as string[];
    return [...new Set(data.nodes.map((n) => n.group))].sort();
  });

  const groupCounts = createMemo(() => {
    const data = graphData();
    const counts: Record<string, number> = {};
    if (!data) return counts;
    for (const n of data.nodes) counts[n.group] = (counts[n.group] ?? 0) + 1;
    return counts;
  });

  const tabCounts = createMemo(() => {
    const data = graphData();
    const counts: Record<SidebarTab, number> = { all: 0, skill: 0, subagent: 0, mcp: 0, rule: 0 };
    if (!data) return counts;
    for (const n of data.nodes) {
      counts.all += 1;
      if (n.type in counts) counts[n.type as SidebarTab] += 1;
    }
    return counts;
  });

  const matchesSearch = (n: GraphNode) => {
    const q = search().toLowerCase().trim();
    return !q || n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q);
  };

  const listNodes = createMemo(() => {
    const data = graphData();
    if (!data) return [] as GraphNode[];
    const t = tab();
    const p = prefix();
    const deg = degreeMap();
    return data.nodes
      .filter((n) =>
        matchesSearch(n) &&
        (t === "all" || n.type === t) &&
        (p === "all" || n.group === p || n.type !== "skill")
      )
      .sort((a, b) => (deg.get(b.id) ?? 0) - (deg.get(a.id) ?? 0) || a.id.localeCompare(b.id));
  });

  const related = (ids: string[]) => {
    const data = graphData();
    if (!data) return [] as GraphNode[];
    return ids.map((id) => data.nodes.find((n) => n.id === id)).filter(Boolean) as GraphNode[];
  };

  const incoming = createMemo(() => {
    if (!selected() || !graphData()) return [] as GraphNode[];
    return related(graphData()!.edges.filter((e) => e.to === selected()!.id).map((e) => e.from));
  });

  const outgoing = createMemo(() => {
    if (!selected() || !graphData()) return [] as GraphNode[];
    return related(graphData()!.edges.filter((e) => e.from === selected()!.id).map((e) => e.to));
  });

  const selectNode = (n: GraphNode | null, shouldFocus = false) => {
    setSelected(n);
    if (n && shouldFocus) setFocus(n.id);
  };

  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === "Escape") { setSelected(null); setFocus(null); }
    if (e.key === "d" || e.key === "D") setDark((v) => !v);
    if (e.key === "/" || e.key === "s" || e.key === "S") {
      (document.getElementById("skill-search") as HTMLInputElement | null)?.focus();
      e.preventDefault();
    }
  };
  onMount(() => window.addEventListener("keydown", handler));
  onCleanup(() => window.removeEventListener("keydown", handler));

  return (
    <div class="app" classList={{ light: !dark() }}>
      <TopBar
        search={search()}
        onSearch={setSearch}
        groups={groups()}
        groupCounts={groupCounts()}
        prefix={prefix()}
        onPrefix={setPrefix}
        dark={dark()}
        onToggleDark={() => setDark((v) => !v)}
        totalNodes={graphData()?.nodes.length ?? 0}
        totalEdges={graphData()?.edges.length ?? 0}
        visibleNodes={listNodes().length}
      />
      <div class="body">
        <Sidebar
          tab={tab()}
          onTab={(t) => { setTab(t); setFitTick((v) => v + 1); }}
          tabCounts={tabCounts()}
          nodes={listNodes()}
          degree={degreeMap()}
          selectedId={selected()?.id ?? null}
          onSelect={(n) => selectNode(n, true)}
        />
        <main class="graph-area">
          <Show when={loading()}>
            <div class="skeleton" />
            <div class="loading-message">
              {graphData() ? `rendering ${graphData()!.nodes.length} nodes...` : "loading skills..."}
            </div>
          </Show>
          <Show when={error()}>
            <div class="error-overlay">
              <p>failed to load graph</p>
              <pre>{error()}</pre>
              <button onClick={() => window.location.reload()}>retry</button>
            </div>
          </Show>
          <Graph
            search={search()}
            typeFilter={tab()}
            dark={dark()}
            focus={focus()}
            fitTick={fitTick()}
            selectedId={selected()?.id ?? null}
            onSelect={(n) => selectNode(n)}
            onData={setGraphData}
            onReady={() => setLoading(false)}
            onError={(e) => { setLoading(false); setError(String(e)); }}
          />
        </main>
        <Preview
          node={selected()}
          incoming={incoming()}
          outgoing={outgoing()}
          onSelectById={(id) => {
            const n = graphData()?.nodes.find((x) => x.id === id);
            if (n) selectNode(n, true);
          }}
        />
      </div>
    </div>
  );
}
