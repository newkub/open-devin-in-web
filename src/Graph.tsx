import { createEffect, createSignal, onCleanup, onMount, Show, type Component } from "solid-js";
import { DataSet, Network } from "vis-network/standalone";
import { orpc } from "./orpc/client";
import type { GraphData } from "./orpc/router";

export type { GraphData } from "./orpc/router";
export type GraphNode = GraphData["nodes"][number];

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

export const typeColors: Record<string, string> = {
  skill: "#38bdf8",
  subagent: "#f59e0b",
  mcp: "#a855f7",
  rule: "#ef4444",
};

export const Graph: Component<{
  search: string;
  typeFilter: string;
  dark: boolean;
  focus: string | null;
  fitTick: number;
  selectedId: string | null;
  onSelect: (node: GraphNode | null) => void;
  onData: (data: GraphData) => void;
  onReady: () => void;
  onError?: (error: unknown) => void;
}> = (props) => {
  let container: HTMLDivElement;
  let network: Network;
  let degreeMap = new Map<string, number>();
  const [raw, setRaw] = createSignal<GraphData | null>(null);
  const [colored, setColored] = createSignal<GraphData | null>(null);
  const [empty, setEmpty] = createSignal(false);
  const [netReady, setNetReady] = createSignal(false);
  const [hoverId, setHoverId] = createSignal<string | null>(null);
  const [labelsHidden, setLabelsHidden] = createSignal(false);

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
    if (n.title) {
      const p = document.createElement("p");
      p.className = "tip-desc";
      p.textContent = n.title;
      tip.append(p);
    }
    return tip;
  };

  onMount(async () => {
    const fetchWithRetry = async (attempts = 4): Promise<GraphData> => {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await orpc.skillsGraph();
        } catch (err) {
          lastErr = err;
          if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        }
      }
      throw lastErr;
    };
    try {
      const data = await fetchWithRetry();
      setRaw(data);
      props.onData(data);

      degreeMap = new Map(data.nodes.map((n) => [n.id, 0]));
      data.edges.forEach((e) => {
        degreeMap.set(e.from, (degreeMap.get(e.from) ?? 0) + 1);
        degreeMap.set(e.to, (degreeMap.get(e.to) ?? 0) + 1);
      });

      const nodes = data.nodes.map((n) => {
        const base = groupColors[n.group] || groupColors.default;
        return {
          ...n,
          desc: n.title,
          title: makeTooltip(n, degreeMap.get(n.id) ?? 0),
          color: base,
          borderWidth: 2,
          value: degreeMap.get(n.id) ?? 0,
          shape: n.type === "mcp" ? "diamond" : n.type === "rule" ? "star" : n.type === "subagent" ? "triangle" : "dot",
        };
      });
      setColored({ nodes: nodes as any, edges: data.edges, review: data.review });

      network = new Network(container, {
        nodes: new DataSet(nodes as any),
        edges: new DataSet(data.edges.map((e, i) => ({ ...e, id: `e${i}` }))),
      }, {
        nodes: {
          shape: "dot",
          font: { color: props.dark ? "#e2e8f0" : "#1e293b", size: 11 },
          borderWidth: 2,
          scaling: { min: 6, max: 20, label: { enabled: false } },
        },
        edges: {
          arrows: { to: { enabled: true, scaleFactor: 0.4 } },
          width: 0.6,
          color: { opacity: 0.35 },
          smooth: false,
          hoverWidth: 1.5,
        },
        layout: { improvedLayout: false },
        physics: {
          solver: "forceAtlas2Based",
          forceAtlas2Based: { gravitationalConstant: -60, springLength: 120, damping: 0.6 },
          stabilization: { iterations: 150, updateInterval: 50 },
        },
        interaction: { hover: true, tooltipDelay: 200, hideEdgesOnDrag: true, hideEdgesOnZoom: true, selectConnectedEdges: true },
      });
      (window as any).__net = network;
      setNetReady(true);

      network.on("selectNode", (params: any) => {
        const node = data.nodes.find((n) => n.id === params.nodes?.[0]);
        props.onSelect(node ?? null);
      });
      network.on("deselectNode", () => props.onSelect(null));
      network.on("click", (params: any) => {
        if (params.nodes.length === 0) props.onSelect(null);
      });
      network.on("dragEnd", (params: any) => {
        const updates = params.nodes.map((id: string) => ({ id, fixed: { x: true, y: true } }));
        ((network as any).body.data.nodes as DataSet<any>).update(updates);
      });
      network.on("hoverNode", (params: any) => setHoverId(params.node));
      network.on("blurNode", () => setHoverId(null));
      network.on("zoom", () => setLabelsHidden(network.getScale() < 0.45));

      let ready = false;
      const markReady = () => {
        if (ready) return;
        ready = true;
        props.onReady();
      };
      network.on("stabilizationIterationsDone", () => {
        network.setOptions({ physics: { enabled: false } });
        markReady();
      });
      network.on("afterDrawing", markReady);
    } catch (err) {
      props.onError?.(err);
    }
  });

  onCleanup(() => network?.destroy());

  createEffect(() => {
    if (!netReady() || !colored() || !raw()) return;
    const q = props.search.toLowerCase().trim();
    const tf = props.typeFilter;
    const visible = colored()!.nodes.filter((n) => {
      const matchSearch = !q || n.id.toLowerCase().includes(q) || ((n as any).desc ?? "").toLowerCase().includes(q);
      const matchType = tf === "all" || n.type === tf;
      return matchSearch && matchType;
    });
    const ids = new Set(visible.map((n) => n.id));

    const h = props.selectedId || hoverId();
    const neighborIds = new Set<string>();
    if (h && ids.has(h)) {
      raw()!.edges.forEach((e) => {
        if (e.from === h) neighborIds.add(e.to);
        if (e.to === h) neighborIds.add(e.from);
      });
    }
    const hVisible = h ? ids.has(h) : false;

    setEmpty(visible.length === 0);

    const nodesDs = (network as any).body.data.nodes as DataSet<any>;
    const edgesDs = (network as any).body.data.edges as DataSet<any>;
    nodesDs.update(colored()!.nodes.map((n) => ({
      id: n.id,
      hidden: !ids.has(n.id),
      opacity: hVisible ? (n.id === h || neighborIds.has(n.id) ? 1 : 0.15) : 1,
    })));
    edgesDs.update(raw()!.edges.map((e, i) => {
      const edgeVisible = ids.has(e.from) && ids.has(e.to);
      const connected = hVisible && (e.from === h || e.to === h);
      return {
        id: `e${i}`,
        hidden: !edgeVisible,
        width: connected ? 1.4 : 0.6,
        color: { opacity: connected ? 0.9 : 0.35 },
      };
    }));
  });

  createEffect(() => {
    if (!netReady()) return;
    network.setOptions({
      nodes: { font: { color: props.dark ? "#e2e8f0" : "#1e293b", size: labelsHidden() ? 0 : 11 } },
    });
  });

  createEffect(() => {
    if (!netReady() || !props.focus) return;
    network.focus(props.focus, { scale: 1.2, animation: true });
    network.selectNodes([props.focus]);
  });

  createEffect(() => {
    if (!netReady() || props.fitTick === 0) return;
    network.fit({ animation: true });
  });

  return (
    <div class="graph-wrap">
      <Show when={empty()}>
        <div class="empty-overlay">No matching nodes</div>
      </Show>
      <div ref={(el) => (container = el)} class="graph-canvas" />
    </div>
  );
};
