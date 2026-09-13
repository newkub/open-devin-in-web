import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Graph, groupColors, type GraphData, type GraphNode, type SelectedNode } from "../Graph";
import { StatsPanel } from "../components/StatsPanel";
import { Collapsible } from "../components/Collapsible";
import { LegendPanel } from "../components/LegendPanel";
import { ShortcutsPanel } from "../components/ShortcutsPanel";
import { DetailPanel } from "../components/DetailPanel";
import { TopSkills } from "../components/TopSkills";

export function GraphPage() {
  const [search, setSearch] = createSignal("");
  const [prefix, setPrefix] = createSignal("all");
  const [typeFilter, setTypeFilter] = createSignal("all");
  const [selected, setSelected] = createSignal<SelectedNode | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [graphData, setGraphData] = createSignal<GraphData | null>(null);

  const saved = typeof localStorage !== "undefined" ? localStorage.getItem("open-devin-in-web-theme") : null;
  const [dark, setDark] = createSignal(saved ? saved === "dark" : true);
  const [physics, setPhysics] = createSignal(true);
  const [showLabels, setShowLabels] = createSignal(true);
  const [hideIsolated, setHideIsolated] = createSignal(false);
  const [clusterMode, setClusterMode] = createSignal(false);
  const [reset, setReset] = createSignal(0);
  const [focus, setFocus] = createSignal<string | null>(null);
  const [zoom, setZoom] = createSignal<{ dir: "in" | "out" } | null>(null);
  let networkRef: any;

  createEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("open-devin-in-web-theme", dark() ? "dark" : "light");
    }
  });

  const counts = createMemo(() =>
    graphData() ? { nodes: graphData()!.nodes.length, edges: graphData()!.edges.length } : { nodes: 0, edges: 0 }
  );

  const groups = createMemo(() => {
    const data = graphData();
    if (!data) return [] as string[];
    const set = new Set(data.nodes.map((n) => n.group));
    return [...set].sort();
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

  const stats = createMemo(() => {
    const data = graphData();
    if (!data) return null;
    const degree = degreeMap();
    const isolated = data.nodes.filter((n) => (degree.get(n.id) ?? 0) === 0).length;
    const groupCounts = data.nodes.reduce<Record<string, number>>((acc, n) => {
      acc[n.group] = (acc[n.group] ?? 0) + 1;
      return acc;
    }, {});
    const typeCounts = data.nodes.reduce<Record<string, number>>((acc, n) => {
      acc[n.type] = (acc[n.type] ?? 0) + 1;
      return acc;
    }, {});
    return { isolated, groupCounts, typeCounts };
  });

  const searchMatches = createMemo(() => {
    const data = graphData();
    const q = search().toLowerCase().trim();
    if (!data || !q) return [] as GraphNode[];
    const deg = degreeMap();
    return data.nodes
      .filter((n) => n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q))
      .sort((a, b) => (deg.get(b.id) ?? 0) - (deg.get(a.id) ?? 0));
  });

  const isolatedNodes = createMemo(() => {
    const data = graphData();
    if (!data) return [] as GraphNode[];
    const deg = degreeMap();
    return data.nodes.filter((n) => (deg.get(n.id) ?? 0) === 0);
  });

  const topSkills = createMemo(() => {
    if (!graphData()) return [];
    const deg = new Map<string, number>();
    for (const n of graphData()!.nodes) deg.set(n.id, 0);
    for (const e of graphData()!.edges) {
      deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
      deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
    }
    return [...deg.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ id, count, node: graphData()!.nodes.find((n) => n.id === id)! }));
  });

  const related = (ids: string[]) => {
    if (!graphData()) return [] as GraphNode[];
    return ids.map((id) => graphData()!.nodes.find((n) => n.id === id)).filter(Boolean) as GraphNode[];
  };

  const incoming = createMemo(() => {
    if (!selected() || !graphData()) return [] as GraphNode[];
    const ids = graphData()!.edges.filter((e) => e.to === selected()!.id).map((e) => e.from);
    return related(ids);
  });

  const outgoing = createMemo(() => {
    if (!selected() || !graphData()) return [] as GraphNode[];
    const ids = graphData()!.edges.filter((e) => e.from === selected()!.id).map((e) => e.to);
    return related(ids);
  });

  const doReset = () => { setSelected(null); setFocus(null); setReset((v) => v + 1); };
  const doFocus = () => { if (selected()) setFocus(selected()!.id); };
  const doRandom = () => {
    if (!graphData()) return;
    const n = graphData()!.nodes[Math.floor(Math.random() * graphData()!.nodes.length)];
    const inc = graphData()!.edges.filter((e) => e.to === n.id).length;
    const out = graphData()!.edges.filter((e) => e.from === n.id).length;
    setSelected({ ...n, incoming: inc, outgoing: out });
    setFocus(n.id);
  };

  const selectById = (id: string) => {
    const data = graphData();
    if (!data) return;
    const n = data.nodes.find((x) => x.id === id);
    if (!n) return;
    const inc = data.edges.filter((e) => e.to === id).length;
    const out = data.edges.filter((e) => e.from === id).length;
    setSelected({ ...n, incoming: inc, outgoing: out });
    setFocus(id);
  };

  const openInVSCode = (dir: string) => {
    window.open(`vscode://file/C:/Users/Veerapong/AppData/Roaming/devin/skills/${dir}/SKILL.md`);
  };

  const exportPng = () => {
    const canvas = networkRef?.canvas?.frame?.canvas as HTMLCanvasElement | undefined;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "devin-skills-graph.png";
    a.click();
  };

  const onClusterSelect = (group: string) => {
    setClusterMode(false);
    setPrefix(group);
    setSelected(null);
  };

  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === "Escape") { setSelected(null); setFocus(null); }
    if (e.key === "f" || e.key === "F") doFocus();
    if (e.key === "r" || e.key === "R") doReset();
    if (e.key === "d" || e.key === "D") setDark((v) => !v);
    if (e.key === "p" || e.key === "P") setPhysics((v) => !v);
    if (e.key === "l" || e.key === "L") setShowLabels((v) => !v);
    if (e.key === "i" || e.key === "I") setHideIsolated((v) => !v);
    if (e.key === "c" || e.key === "C") setClusterMode((v) => !v);
    if (e.key === "/" || e.key === "s" || e.key === "S") {
      const el = document.getElementById("skill-search") as HTMLInputElement | null;
      el?.focus();
      e.preventDefault();
    }
  };
  onMount(() => window.addEventListener("keydown", handler));
  onCleanup(() => window.removeEventListener("keydown", handler));

  return (
    <div class="app" classList={{ light: !dark() }}>
      <aside class="sidebar">
        <h1>Open Devin</h1>
        <div class="search-wrap">
          <span class="i-mdi-magnify search-icon" />
          <input
            id="skill-search"
            type="text"
            placeholder="search skills (press /)..."
            aria-label="Search skills"
            title="Press / to focus, Enter to select first match, Esc to clear"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchMatches()[0]) selectById(searchMatches()[0].id);
              if (e.key === "Escape") { setSearch(""); e.currentTarget.blur(); }
            }}
          />
          <Show when={search().trim()}>
            <div class="search-meta">{searchMatches().length} matches</div>
            <Show when={searchMatches().length > 0}>
              <ul class="search-results">
                <For each={searchMatches().slice(0, 8)}>
                  {(m) => (
                    <li onClick={() => selectById(m.id)}>
                      <span class="related-dot" style={{ "background-color": (groupColors[m.group] || groupColors.default).background }} />
                      <span class="sr-id">{m.id}</span>
                      <span class="sr-type">{m.type}</span>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>
        <select value={prefix()} onChange={(e) => setPrefix(e.currentTarget.value)} aria-label="Filter by prefix" title="Filter by skill prefix">
          <option value="all">all prefixes</option>
          <For each={groups()}>
            {(g) => <option value={g}>{g}</option>}
          </For>
        </select>
        <select value={typeFilter()} onChange={(e) => setTypeFilter(e.currentTarget.value)} aria-label="Filter by type" title="Filter by resource type">
          <option value="all">all types</option>
          <option value="skill">skills</option>
          <option value="subagent">subagents</option>
          <option value="mcp">mcp servers</option>
          <option value="rule">global rules</option>
        </select>
        <div class="controls">
          <button title="Toggle dark/light theme (D)" onClick={() => setDark((v) => !v)}>
            <span class={dark() ? "i-mdi-white-balance-sunny" : "i-mdi-weather-night"} /> {dark() ? "light" : "dark"}
          </button>
          <button classList={{ active: physics() }} title="Toggle physics (P)" onClick={() => setPhysics((v) => !v)}>
            <span class="i-mdi-atom" /> physics
          </button>
          <button classList={{ active: showLabels() }} title="Toggle labels (L)" onClick={() => setShowLabels((v) => !v)}>
            <span class={showLabels() ? "i-mdi-label" : "i-mdi-label-off"} /> labels
          </button>
        </div>
        <div class="controls">
          <button classList={{ active: hideIsolated() }} title="Hide nodes with no edges (I)" onClick={() => setHideIsolated((v) => !v)}>
            <span class="i-mdi-filter-remove" /> isolated
          </button>
          <button classList={{ active: clusterMode() }} title="Group nodes into prefix clusters (C)" onClick={() => setClusterMode((v) => !v)}>
            <span class="i-mdi-hexagon-multiple" /> cluster
          </button>
          <button title="Export graph as PNG" onClick={exportPng}>
            <span class="i-mdi-camera" /> png
          </button>
        </div>
        <div class="controls">
          <button title="Zoom out" onClick={() => setZoom({ dir: "out" })}><span class="i-mdi-minus" /></button>
          <button title="Fit graph (R)" onClick={doReset}><span class="i-mdi-fit-to-screen" /> fit</button>
          <button title="Zoom in" onClick={() => setZoom({ dir: "in" })}><span class="i-mdi-plus" /></button>
          <button title="Jump to a random skill" onClick={doRandom}><span class="i-mdi-dice-5" /> random</button>
        </div>
        <DetailPanel
          selected={selected}
          incoming={incoming()}
          outgoing={outgoing()}
          onFocus={doFocus}
          onClear={() => setSelected(null)}
          onSelectById={selectById}
          onOpenInVSCode={openInVSCode}
        />
        <TopSkills
          topSkills={topSkills()}
          graphData={graphData()}
          onSelect={(node, inc, out) => { setSelected({ ...node, incoming: inc, outgoing: out }); setFocus(node.id); }}
        />
        <Show when={isolatedNodes().length > 0}>
          <Collapsible title={`isolated (${isolatedNodes().length})`}>
            <ul class="related-list">
              <For each={isolatedNodes().slice(0, 20)}>
                {(n) => (
                  <li onClick={() => selectById(n.id)}>
                    <span class="related-dot" style={{ "background-color": (groupColors[n.group] || groupColors.default).background }} />
                    <span>{n.id}</span>
                  </li>
                )}
              </For>
            </ul>
          </Collapsible>
        </Show>
        <StatsPanel counts={counts()} stats={stats()} groups={groups()} />
        <LegendPanel groups={groups()} />
        <ShortcutsPanel />
        <div class="status">{counts().nodes} nodes · {counts().edges} edges</div>
      </aside>
      <main class="canvas-wrap">
        <Show when={loading()}>
          <div class="skeleton" />
          <div class="loading-message">{graphData() ? `rendering ${counts().nodes} nodes...` : "loading skills..."}</div>
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
          prefix={prefix()}
          typeFilter={typeFilter()}
          dark={dark()}
          physics={physics()}
          showLabels={showLabels()}
          hideIsolated={hideIsolated()}
          clusterMode={clusterMode()}
          reset={reset()}
          focus={focus()}
          highlight={selected()?.id ?? null}
          zoom={zoom}
          onSelect={setSelected}
          onData={setGraphData}
          onReady={() => setLoading(false)}
          onError={(e) => { setLoading(false); setError(String(e)); }}
          onNetwork={(n) => (networkRef = n)}
          onClusterSelect={onClusterSelect}
        />
      </main>
    </div>
  );
}
