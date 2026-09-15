import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { orpc } from "../orpc/client";
import type { GraphData, GraphNode } from "../graph";
import { TopBar } from "../components/TopBar";
import { Sidebar, type SidebarTab } from "../components/Sidebar";
import { Content } from "../components/Content";
import { FlowPanel } from "../components/FlowPanel";
import type { Heading } from "../markdown";

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

  const [dark, setDark] = persisted("theme", true);
  const [prefix, setPrefix] = persisted("prefix", "all");
  const [tab, setTab] = persisted<SidebarTab>("tab", "all");
  const [compact, setCompact] = persisted("compact", false);
  const [showGraph, setShowGraph] = persisted("mini-graph", true);
  const [headings, setHeadings] = createSignal<Heading[]>([]);

  onMount(async () => {
    try {
      setGraphData(await orpc.skillsGraph());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  });

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
    return [...new Set(data.nodes.filter((n) => n.type === "skill").map((n) => n.group))].sort();
  });

  const groupCounts = createMemo(() => {
    const data = graphData();
    const counts: Record<string, number> = {};
    if (!data) return counts;
    for (const n of data.nodes) if (n.type === "skill") counts[n.group] = (counts[n.group] ?? 0) + 1;
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

  const listNodes = createMemo(() => {
    const data = graphData();
    if (!data) return [] as GraphNode[];
    const q = search().toLowerCase().trim();
    const t = tab();
    const p = prefix();
    const deg = degreeMap();
    return data.nodes
      .filter((n) =>
        (!q || n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q)) &&
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

  const selectById = (id: string) => {
    const n = graphData()?.nodes.find((x) => x.id === id || x.label === id || x.id === `skill:${id}`);
    if (n) setSelected(n);
  };

  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === "Escape") setSelected(null);
    if (e.key === "d" || e.key === "D") setDark((v) => !v);
    if (e.key === "/" || e.key === "s" || e.key === "S") {
      (document.getElementById("skill-search") as HTMLInputElement | null)?.focus();
      e.preventDefault();
    }
  };
  onMount(() => window.addEventListener("keydown", handler));
  onCleanup(() => window.removeEventListener("keydown", handler));

  return (
    <div class="app" classList={{ light: !dark(), compact: compact() }}>
      <TopBar
        search={search()}
        onSearch={setSearch}
        dark={dark()}
        onToggleDark={() => setDark((v) => !v)}
        compact={compact()}
        onToggleCompact={() => setCompact((v) => !v)}
        showGraph={showGraph()}
        onToggleGraph={() => setShowGraph((v) => !v)}
        totalNodes={graphData()?.nodes.length ?? 0}
        totalEdges={graphData()?.edges.length ?? 0}
        visibleNodes={listNodes().length}
      />
      <div class="body">
        <Show when={loading()}>
          <div class="app-loading"><div class="skeleton" /><div class="loading-message">loading resources...</div></div>
        </Show>
        <Show when={error()}>
          <div class="error-overlay">
            <p>failed to load resources</p>
            <pre>{error()}</pre>
            <button onClick={() => window.location.reload()}>retry</button>
          </div>
        </Show>
        <Show when={!loading() && !error()}>
          <Sidebar
            tab={tab()}
            onTab={setTab}
            tabCounts={tabCounts()}
            groups={groups()}
            groupCounts={groupCounts()}
            prefix={prefix()}
            onPrefix={setPrefix}
            nodes={listNodes()}
            degree={degreeMap()}
            selectedId={selected()?.id ?? null}
            onSelect={setSelected}
          />
          <Content
            node={selected()}
            typeCounts={tabCounts()}
            onHeadings={setHeadings}
            onSelectById={selectById}
          />
          <FlowPanel
            node={selected()}
            incoming={incoming()}
            outgoing={outgoing()}
            listNodes={listNodes()}
            edges={graphData()?.edges ?? []}
            headings={headings()}
            dark={dark()}
            showGraph={showGraph()}
            onSelectById={selectById}
          />
        </Show>
      </div>
    </div>
  );
}
