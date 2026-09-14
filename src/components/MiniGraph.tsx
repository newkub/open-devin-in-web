import { createEffect, onCleanup, onMount, type Component } from "solid-js";
import { DataSet, Network } from "vis-network/standalone";
import { groupColors, type GraphNode } from "../graph";

const MAX_NODES = 150;

export const MiniGraph: Component<{
  nodes: GraphNode[];
  edges: { from: string; to: string }[];
  selectedId: string | null;
  dark: boolean;
  onSelect: (id: string) => void;
}> = (props) => {
  let container: HTMLDivElement;
  let network: Network | null = null;
  const nodesDs = new DataSet<any>([]);
  const edgesDs = new DataSet<any>([]);

  onMount(() => {
    network = new Network(container, { nodes: nodesDs, edges: edgesDs }, {
      nodes: {
        shape: "dot",
        size: 7,
        font: { size: 0 },
        borderWidth: 1.5,
      },
      edges: {
        arrows: { to: { enabled: true, scaleFactor: 0.25 } },
        width: 0.5,
        color: { opacity: 0.3 },
        smooth: false,
      },
      physics: {
        solver: "forceAtlas2Based",
        forceAtlas2Based: { gravitationalConstant: -40, springLength: 60, damping: 0.5 },
        stabilization: { iterations: 80 },
        minVelocity: 1,
      },
      interaction: { hover: true, tooltipDelay: 150, zoomView: true, dragView: true, dragNodes: true },
    });
    network.on("click", (params: any) => {
      if (params.nodes.length > 0) props.onSelect(params.nodes[0]);
    });
    network.on("stabilizationIterationsDone", () => {
      network?.setOptions({ physics: { enabled: false } });
      network?.fit({ animation: false });
    });
  });

  onCleanup(() => network?.destroy());

  createEffect(() => {
    if (!network) return;
    const capped = props.nodes.slice(0, MAX_NODES);
    const ids = new Set(capped.map((n) => n.id));
    nodesDs.clear();
    edgesDs.clear();
    nodesDs.add(capped.map((n) => ({
      id: n.id,
      label: n.label,
      title: `${n.id}\n${n.title}`,
      color: groupColors[n.group] || groupColors.default,
      shape: n.type === "mcp" ? "diamond" : n.type === "rule" ? "star" : n.type === "subagent" ? "triangle" : "dot",
    })));
    edgesDs.add(props.edges
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e, i) => ({ id: `me${i}`, ...e })));
    network.stabilize(80);
  });

  createEffect(() => {
    if (!network) return;
    network.setOptions({
      edges: { color: { color: props.dark ? "#64748b" : "#94a3b8", opacity: 0.35 } },
    });
  });

  createEffect(() => {
    if (!network) return;
    if (props.selectedId && props.nodes.some((n) => n.id === props.selectedId)) {
      network.selectNodes([props.selectedId!]);
    } else {
      network.unselectAll();
    }
  });

  return <div ref={(el) => (container = el)} class="mini-graph" />;
};
