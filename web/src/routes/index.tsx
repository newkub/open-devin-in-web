import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Graph, groupColors, type GraphData, type GraphNode, type SelectedNode } from "../Graph";

export function GraphPage() {
  const [search, setSearch] = createSignal("");
  const [prefix, setPrefix] = createSignal("all");
  const [selected, setSelected] = createSignal<SelectedNode | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [graphData, setGraphData] = createSignal<GraphData | null>(null);

  const saved = typeof localStorage !== "undefined" ? localStorage.getItem("visulize-theme") : null;
  const [dark, setDark] = createSignal(saved ? saved === "dark" : true);
  const [physics, setPhysics] = createSignal(true);
  const [showLabels, setShowLabels] = createSignal(true);
  const [reset, setReset] = createSignal(0);
  const [focus, setFocus] = createSignal<string | null>(null);
  const [zoom, setZoom] = createSignal<{ dir: "in" | "out" } | null>(null);

  createEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("visulize-theme", dark() ? "dark" : "light");
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
    return { isolated, groupCounts };
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
    return ids
      .map((id) => graphData()!.nodes.find((n) => n.id === id))
      .filter(Boolean) as GraphNode[];
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

  const doReset = () => {
    setSelected(null);
    setFocus(null);
    setReset((v) => v + 1);
  };
  const doFocus = () => { if (selected()) setFocus(selected()!.id); };
  const doRandom = () => {
    if (!graphData()) return;
    const n = graphData()!.nodes[Math.floor(Math.random() * graphData()!.nodes.length)];
    const incoming = graphData()!.edges.filter((e) => e.to === n.id).length;
    const outgoing = graphData()!.edges.filter((e) => e.from === n.id).length;
    setSelected({ ...n, incoming, outgoing });
    setFocus(n.id);
  };

  const selectNode = (n: SelectedNode) => {
    setSelected(n);
    setFocus(n.id);
  };

  const selectById = (id: string) => {
    const data = graphData();
    if (!data) return;
    const n = data.nodes.find((x) => x.id === id);
    if (!n) return;
    const incoming = data.edges.filter((e) => e.to === id).length;
    const outgoing = data.edges.filter((e) => e.from === id).length;
    selectNode({ ...n, incoming, outgoing });
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
        <h1>Devin Skills</h1>
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
        <Show when={selected()}>
          <div class="detail">
            <div class="detail-header">
              <h3>{selected()!.id}</h3>
              <span class="group-badge" style={{ "background-color": (groupColors[selected()!.group] || groupColors.default).background }}>{selected()!.group}</span>
            </div>
            <p class="desc">{selected()!.title}</p>
            <p class="meta">{selected()!.incoming} incoming · {selected()!.outgoing} outgoing</p>
            <div class="controls small">
              <button onClick={doFocus}>focus</button>
              <button onClick={() => setSelected(null)}>clear</button>
              <button onClick={() => navigator.clipboard?.writeText?.(selected()!.id)}>copy</button>
              <button onClick={() => openInVSCode(selected()!.dir)}>open</button>
            </div>
            <Show when={outgoing().length > 0}>
              <div class="related-section">
                <h5>uses</h5>
                <ul class="related-list">
                  <For each={outgoing()}>
                    {(n) => (
                      <li onClick={() => selectById(n.id)}>
                        <span class="related-dot" style={{ "background-color": (groupColors[n.group] || groupColors.default).background }} />
                        <span>{n.id}</span>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </Show>
            <Show when={incoming().length > 0}>
              <div class="related-section">
                <h5>used by</h5>
                <ul class="related-list">
                  <For each={incoming()}>
                    {(n) => (
                      <li onClick={() => selectById(n.id)}>
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
        <div class="section">
          <h4>top skills</h4>
          <ul class="top-list">
            <For each={topSkills()}>
              {(item) => (
                <li
                  onClick={() => {
                    const n = item.node;
                    const incoming = graphData()!.edges.filter((e) => e.to === n.id).length;
                    const outgoing = graphData()!.edges.filter((e) => e.from === n.id).length;
                    selectNode({ ...n, incoming, outgoing });
                  }}
                >
                  <span>{item.id}</span>
                  <span class="count">{item.count}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
        <Show when={stats()}>
          <div class="section">
            <h4>stats</h4>
            <div class="stat-grid">
              <div>
                <div class="stat-value">{counts().nodes}</div>
                <div class="stat-label">nodes</div>
              </div>
              <div>
                <div class="stat-value">{counts().edges}</div>
                <div class="stat-label">edges</div>
              </div>
              <div>
                <div class="stat-value">{stats()!.isolated}</div>
                <div class="stat-label">isolated</div>
              </div>
            </div>
            <ul class="group-stats">
              <For each={Object.entries(stats()!.groupCounts).sort((a, b) => b[1] - a[1])}>
                {([g, count]) => (
                  <li>
                    <span class="related-dot" style={{ "background-color": (groupColors[g] || groupColors.default).background }} />
                    <span>{g}</span>
                    <span class="count">{count}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
        <div class="section">
          <h4>legend</h4>
          <ul class="legend">
            <For each={groups()}>
              {(group) => {
                const c = groupColors[group] || groupColors.default;
                return (
                  <li>
                    <span class="dot" style={{ "background-color": c.background, "border-color": c.border }} />
                    <span class="cap">{group}</span>
                  </li>
                );
              }}
            </For>
          </ul>
        </div>
        <div class="section">
          <h4>shortcuts</h4>
          <ul class="shortcuts-list">
            <li><kbd>/</kbd> <span>search</span></li>
            <li><kbd>esc</kbd> <span>clear selection</span></li>
            <li><kbd>f</kbd> <span>focus selected</span></li>
            <li><kbd>r</kbd> <span>fit graph</span></li>
            <li><kbd>d</kbd> <span>toggle theme</span></li>
            <li><kbd>p</kbd> <span>toggle physics</span></li>
            <li><kbd>l</kbd> <span>toggle labels</span></li>
          </ul>
        </div>
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
