import { createEffect, createSignal, onCleanup, onMount, Show, type Accessor, type Component } from "solid-js";
import { orpc } from "./orpc/client";
import type { GraphData } from "./orpc/router";

export type { GraphData } from "./orpc/router";
export type GraphNode = GraphData["nodes"][number];
export type SelectedNode = GraphNode & { incoming: number; outgoing: number };

export const severityColors: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#eab308",
  Low: "#94a3b8",
  Info: "#64748b",
};

export const groupColors: Record<string, { background: string; border: string }> = {
  follow: { background: "#6366f1", border: "#4f46e5" },
  run: { background: "#22c55e", border: "#16a34a" },
  check: { background: "#f97316", border: "#ea580c" },
  report: { background: "#06b6d4", border: "#0891b2" },
  idea: { background: "#ec4899", border: "#db2777" },
  subagent: { background: "#f59e0b", border: "#d97706" },
  mcp: { background: "#a855f7", border: "#9333ea" },
  rule: { background: "#ef4444", border: "#dc2626" },
  default: { background: "#94a3b8", border: "#64748b" },
};

declare global {
  interface Window {
    vis: any;
  }
}

export const Graph: Component<{
  search: string;
  prefix: string;
  typeFilter: string;
  dark: boolean;
  physics: boolean;
  showLabels: boolean;
  hideIsolated: boolean;
  issuesOnly: boolean;
  ego: string | null;
  clusterMode: boolean;
  reset: number;
  focus: string | null;
  highlight: string | null;
  zoom: Accessor<{ dir: "in" | "out" } | null>;
  onSelect: (node: SelectedNode | null) => void;
  onData: (data: GraphData) => void;
  onReady: () => void;
  onError?: (error: unknown) => void;
  onNetwork?: (network: any) => void;
  onClusterSelect?: (group: string) => void;
  onDoubleClick?: (node: GraphNode) => void;
}> = (props) => {
  let container: HTMLDivElement;
  let network: any;
  let degreeMap = new Map<string, number>();
  const [raw, setRaw] = createSignal<GraphData | null>(null);
  const [colored, setColored] = createSignal<GraphData | null>(null);
  const [empty, setEmpty] = createSignal(false);

  const makeTooltip = (n: GraphNode, degree: number) => {
    const tip = document.createElement("div");
    tip.className = "node-tip";
    const head = document.createElement("div");
    head.className = "tip-head";
    head.textContent = n.id;
    const meta = document.createElement("div");
    meta.className = "tip-meta";
    meta.textContent = `${n.type} · ${n.group} · ${degree} edges`;
    tip.append(head, meta);
    if ((n.findings ?? 0) > 0 || (n.observations ?? 0) > 0) {
      const health = document.createElement("div");
      health.className = "tip-health";
      health.textContent = `${n.maxSeverity} · ${n.findings ?? 0} findings · ${n.observations ?? 0} observations`;
      health.style.color = severityColors[n.maxSeverity ?? "Info"];
      tip.append(health);
    }
    if (n.title) {
      const p = document.createElement("p");
      p.className = "tip-desc";
      p.textContent = n.title;
      tip.append(p);
    }
    return tip;
  };

  onMount(async () => {
    try {
      const data = await orpc.skillsGraph();
      setRaw(data);
      props.onData(data);

      degreeMap = new Map(data.nodes.map((n) => [n.id, 0]));
      data.edges.forEach((e) => {
        degreeMap.set(e.from, (degreeMap.get(e.from) ?? 0) + 1);
        degreeMap.set(e.to, (degreeMap.get(e.to) ?? 0) + 1);
      });

      const nodes = data.nodes.map((n) => {
        const base = groupColors[n.group] || groupColors.default;
        const hasFindings = (n.findings ?? 0) > 0;
        const hasObs = (n.observations ?? 0) > 0;
        return {
          ...n,
          desc: n.title,
          title: makeTooltip(n, degreeMap.get(n.id) ?? 0),
          color: hasFindings || hasObs
            ? { background: base.background, border: severityColors[n.maxSeverity ?? "Info"] ?? base.border }
            : base,
          borderWidth: hasFindings ? 4 : hasObs ? 3 : 2,
          value: degreeMap.get(n.id) ?? 0,
          shape: n.type === "mcp" ? "diamond" : n.type === "rule" ? "star" : n.type === "subagent" ? "triangle" : "dot",
        };
      });
      setColored({ nodes: nodes as any, edges: data.edges });

      const fontColor = props.dark ? "#e2e8f0" : "#1e293b";

      const ds = {
        nodes: new window.vis.DataSet(nodes),
        edges: new window.vis.DataSet(data.edges),
      };
      network = new window.vis.Network(container, ds, {
        nodes: {
          shape: "dot",
          font: { color: fontColor, size: props.showLabels ? 11 : 0 },
          borderWidth: 2,
          scaling: { min: 6, max: 20, label: { enabled: false } },
        },
        edges: {
          arrows: { to: { enabled: true, scaleFactor: 0.4 } },
          width: 0.6,
          color: { opacity: 0.35 },
          smooth: false,
        },
        layout: { improvedLayout: false },
        physics: {
          enabled: props.physics,
          solver: "forceAtlas2Based",
          forceAtlas2Based: { gravitationalConstant: -60, springLength: 120, damping: 0.6 },
          stabilization: { iterations: 150, updateInterval: 25 },
        },
        interaction: { hover: true, tooltipDelay: 200, hideEdgesOnDrag: true, hideEdgesOnZoom: true },
      });
      props.onNetwork?.(network);
      network.on("selectNode", () => {
        const id = network.getSelectedNodes()[0];
        if (typeof id === "string" && id.startsWith("cluster:")) {
          props.onClusterSelect?.(id.slice(8));
          return;
        }
        const node = data.nodes.find((n) => n.id === id);
        if (!node) return;
        const incoming = data.edges.filter((e) => e.to === id).length;
        const outgoing = data.edges.filter((e) => e.from === id).length;
        props.onSelect({ ...node, incoming, outgoing });
      });
      network.on("deselectNode", () => props.onSelect(null));
      network.on("doubleClick", (params: any) => {
        const id = params.nodes?.[0];
        const node = data.nodes.find((n) => n.id === id);
        if (node) props.onDoubleClick?.(node);
      });
      network.on("click", (params: any) => {
        if (params.nodes.length === 0) props.onSelect(null);
      });
      network.on("dragEnd", (params: any) => {
        const updates = params.nodes.map((id: string) => ({ id, fixed: { x: true, y: true } }));
        network.body.data.nodes.update(updates);
      });

      let ready = false;
      const markReady = () => {
        if (ready) return;
        ready = true;
        props.onReady();
      };
      network.on("stabilizationIterationsDone", markReady);
      network.on("afterDrawing", markReady);
    } catch (err) {
      props.onError?.(err);
    }
  });

  onCleanup(() => network?.destroy());

  createEffect(() => {
    if (!network || !colored() || !raw()) return;
    const q = props.search.toLowerCase().trim();
    const p = props.prefix;
    const tf = props.typeFilter;
    let visible = colored()!.nodes.filter((n) => {
      const matchSearch = !q || n.id.toLowerCase().includes(q) || ((n as any).desc ?? "").toLowerCase().includes(q);
      const matchPrefix = p === "all" || n.group === p;
      const matchType = tf === "all" || n.type === tf;
      return matchSearch && matchPrefix && matchType;
    });
    if (props.hideIsolated) {
      visible = visible.filter((n) => (degreeMap.get(n.id) ?? 0) > 0);
    }
    if (props.issuesOnly) {
      visible = visible.filter((n) => (n.findings ?? 0) > 0 || (n.observations ?? 0) > 0);
    }
    if (props.ego) {
      const egoId = props.ego;
      const keep = new Set<string>([egoId]);
      raw()!.edges.forEach((e) => {
        if (e.from === egoId) keep.add(e.to);
        if (e.to === egoId) keep.add(e.from);
      });
      visible = visible.filter((n) => keep.has(n.id));
    }
    const ids = new Set(visible.map((n) => n.id));
    const groupById = new Map(visible.map((n) => [n.id, n.group]));

    const h = props.highlight;
    const hVisible = h ? ids.has(h) : false;
    const neighborIds = new Set<string>();
    if (hVisible) {
      raw()!.edges.forEach((e) => {
        if (e.from === h) neighborIds.add(e.to);
        if (e.to === h) neighborIds.add(e.from);
      });
    }

    const styled = visible.map((n) => {
      if (!hVisible) return n;
      if (n.id === h) return { ...n, size: 16, opacity: 1 };
      if (neighborIds.has(n.id)) return { ...n, opacity: 1 };
      return { ...n, opacity: 0.25 };
    });

    const visibleEdges = raw()!
      .edges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e) => {
        const g = groupById.get(e.from) || "default";
        const c = groupColors[g] || groupColors.default;
        return { ...e, color: { color: c.border, opacity: 0.35 }, width: 0.6 };
      });

    setEmpty(visible.length === 0 && (q !== "" || p !== "all"));

    let nodeList: any[] = styled;
    let edgeList: any[] = visibleEdges;
    if (props.clusterMode) {
      const byGroup = new Map<string, any[]>();
      for (const n of styled) {
        const arr = byGroup.get(n.group) ?? [];
        arr.push(n);
        byGroup.set(n.group, arr);
      }
      const clusterOf = new Map<string, string>();
      nodeList = [...byGroup.entries()].map(([g, arr]) => {
        for (const n of arr) clusterOf.set(n.id, `cluster:${g}`);
        return {
          id: `cluster:${g}`,
          label: `${g} (${arr.length})`,
          title: `${arr.length} ${g} nodes — click to drill down`,
          group: g,
          color: groupColors[g] || groupColors.default,
          value: arr.length,
          shape: "hexagon",
          size: Math.min(32, 10 + arr.length),
          opacity: arr[0].opacity ?? 1,
        };
      });
      const seen = new Set<string>();
      edgeList = [];
      for (const e of visibleEdges) {
        const f = clusterOf.get(e.from)!;
        const t = clusterOf.get(e.to)!;
        if (f === t) continue;
        const key = `${f}->${t}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edgeList.push({ ...e, from: f, to: t });
      }
    }

    network.setData({
      nodes: new window.vis.DataSet(nodeList),
      edges: new window.vis.DataSet(edgeList),
    });
  });

  createEffect(() => {
    if (!network) return;
    const fontColor = props.dark ? "#e2e8f0" : "#1e293b";
    network.setOptions({
      nodes: { font: { color: fontColor, size: props.showLabels ? 11 : 0 } },
    });
  });

  createEffect(() => {
    if (!network) return;
    network.setOptions({ physics: { enabled: props.physics } });
  });

  createEffect(() => {
    if (!network) return;
    props.reset;
    network.fit();
  });

  createEffect(() => {
    if (!network || !props.focus) return;
    network.focus(props.focus, { scale: 1.2, animation: true });
  });

  createEffect(() => {
    if (!network) return;
    const z = props.zoom();
    if (!z) return;
    const current = network.getScale() || 1;
    const next = current * (z.dir === "in" ? 1.2 : 0.8);
    network.moveTo({ scale: Math.max(0.2, Math.min(next, 4)), animation: true });
  });

  return (
    <div class="graph-wrap">
      <Show when={empty()}>
        <div class="empty-overlay">No matching skills</div>
      </Show>
      <div ref={(el) => (container = el)} class="graph-canvas" />
    </div>
  );
};
