import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Graph, groupColors, type GraphData, type GraphNode, type SelectedNode } from "../Graph";
import { StatsPanel } from "../components/StatsPanel";
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
  const [reset, setReset] = createSignal(0);
  const [focus, setFocus] = createSignal<string | null>(null);
  const [zoom, setZoom] = createSignal<{ dir: "in" | "out" } | null>(null);

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

  const stats = createMemo(() => {
    const data = graphData();
    if (!data) return null;
    const degree = new Map(data.nodes.map((n) => [n.id, 0]));
    data.edges.forEach((e) => {
      degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
      degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
    });
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

  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === "Escape") { setSelected(null); setFocus(null); }
    if (e.key === "f" || e.key === "F") doFocus();
    if (e.key === "r" || e.key === "R") doReset();
    if (e.key === "d" || e.key === "D") setDark((v) => !v);
    if (e.key === "p" || e.key === "P") setPhysics((v) => !v);
    if (e.key === "l" || e.key === "L") setShowLabels((v) => !v);
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
        <input
          id="skill-search"
          type="text"
          placeholder="search skills (press /)..."
          aria-label="Search skills"
          title="Press / to focus, Esc to clear"
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
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
          <button title="Toggle dark/light theme (D)" onClick={() => setDark((v) => !v)}>{dark() ? "light" : "dark"}</button>
          <button title="Toggle physics (P)" onClick={() => setPhysics((v) => !v)}>{physics() ? "stop physics" : "start physics"}</button>
          <button title="Toggle labels (L)" onClick={() => setShowLabels((v) => !v)}>{showLabels() ? "hide labels" : "show labels"}</button>
        </div>
        <div class="controls">
          <button title="Zoom out" onClick={() => setZoom({ dir: "out" })}>-</button>
          <button title="Fit graph (R)" onClick={doReset}>fit</button>
          <button title="Zoom in" onClick={() => setZoom({ dir: "in" })}>+</button>
          <button title="Jump to a random skill" onClick={doRandom}>random</button>
        </div>
        <DetailPanel
          selected={selected()}
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
          reset={reset()}
          focus={focus()}
          highlight={selected()?.id ?? null}
          zoom={zoom}
          onSelect={setSelected}
          onData={setGraphData}
          onReady={() => setLoading(false)}
          onError={(e) => { setLoading(false); setError(String(e)); }}
        />
      </main>
    </div>
  );
}
