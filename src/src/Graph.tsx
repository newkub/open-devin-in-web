import { createEffect, createSignal, onCleanup, onMount, Show, type Accessor, type Component } from "solid-js";
import { orpc } from "./orpc/client";
import type { GraphData } from "./orpc/router";

export type { GraphData } from "./orpc/router";
export type GraphNode = GraphData["nodes"][number];
export type SelectedNode = GraphNode & { incoming: number; outgoing: number };

export const groupColors: Record<string, { background: string; border: string }> = {
  follow: { background: "#6366f1", border: "#4f46e5" },
  run: { background: "#22c55e", border: "#16a34a" },
  check: { background: "#f97316", border: "#ea580c" },
  report: { background: "#06b6d4", border: "#0891b2" },
  idea: { background: "#ec4899", border: "#db2777" },
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
  dark: boolean;
  physics: boolean;
  showLabels: boolean;
  reset: number;
  focus: string | null;
  highlight: string | null;
  zoom: Accessor<{ dir: "in" | "out" } | null>;
  onSelect: (node: SelectedNode | null) => void;
  onData: (data: GraphData) => void;
  onReady: () => void;
  onError?: (error: unknown) => void;
}> = (props) => {
  let container: HTMLDivElement;
  let network: any;
  const [raw, setRaw] = createSignal<GraphData | null>(null);
  const [colored, setColored] = createSignal<GraphData | null>(null);
  const [empty, setEmpty] = createSignal(false);

  onMount(async () => {
    try {
      const data = await orpc.skillsGraph();
      setRaw(data);
      props.onData(data);

      const degree = new Map(data.nodes.map((n) => [n.id, 0]));
      data.edges.forEach((e) => {
        degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
        degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
      });

      const nodes = data.nodes.map((n) => ({
        ...n,
        color: groupColors[n.group] || groupColors.default,
        value: degree.get(n.id) ?? 0,
      }));
      setColored({ nodes, edges: data.edges });

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
        },
        physics: { enabled: props.physics, stabilization: { iterations: 80 } },
        interaction: { hover: true, tooltipDelay: 200 },
      });
      network.on("selectNode", () => {
        const id = network.getSelectedNodes()[0];
        const node = data.nodes.find((n) => n.id === id);
        if (!node) return;
        const incoming = data.edges.filter((e) => e.to === id).length;
        const outgoing = data.edges.filter((e) => e.from === id).length;
        props.onSelect({ ...node, incoming, outgoing });
      });
      network.on("deselectNode", () => props.onSelect(null));
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
    const visible = colored()!.nodes.filter((n) => {
      const matchSearch = !q || n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q);
      const matchPrefix = p === "all" || n.group === p;
      return matchSearch && matchPrefix;
    });
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

    network.setData({
      nodes: new window.vis.DataSet(styled),
      edges: new window.vis.DataSet(visibleEdges),
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
