import { For, Show, type Component } from "solid-js";
import { groupColors, type GraphData } from "../Graph";
import { Collapsible } from "./Collapsible";

type Stats = {
  isolated: number;
  groupCounts: Record<string, number>;
  typeCounts: Record<string, number>;
};

export const StatsPanel: Component<{
  counts: { nodes: number; edges: number };
  stats: Stats | null;
  groups: string[];
  review?: GraphData["review"];
}> = (props) => {
  return (
    <Show when={props.stats}>
      <Collapsible title="stats" open>
        <Show when={props.review}>
          <div class="review-score">
            <span class={`grade-badge grade-${props.review!.grade.toLowerCase()}`}>{props.review!.grade}</span>
            <span class="review-detail">
              score {props.review!.score} · {props.review!.totalFindings} findings · {props.review!.totalObservations} observations
            </span>
          </div>
        </Show>
        <div class="stat-grid">
          <div>
            <div class="stat-value">{props.counts.nodes}</div>
            <div class="stat-label">nodes</div>
          </div>
          <div>
            <div class="stat-value">{props.counts.edges}</div>
            <div class="stat-label">edges</div>
          </div>
          <div>
            <div class="stat-value">{props.stats!.isolated}</div>
            <div class="stat-label">isolated</div>
          </div>
        </div>
        <Show when={props.stats!.typeCounts}>
          <div class="type-stats">
            <For each={Object.entries(props.stats!.typeCounts).sort((a, b) => b[1] - a[1])}>
              {([t, count]) => (
                <div class="type-stat-item">
                  <span class="type-dot" style={{ "background-color": (groupColors[t] || groupColors.default).background }} />
                  <span class="type-label">{t}</span>
                  <span class="type-count">{count}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
        <ul class="group-stats">
          <For each={Object.entries(props.stats!.groupCounts).sort((a, b) => b[1] - a[1])}>
            {([g, count]) => (
              <li>
                <span class="related-dot" style={{ "background-color": (groupColors[g] || groupColors.default).background }} />
                <span>{g}</span>
                <span class="count">{count}</span>
              </li>
            )}
          </For>
        </ul>
      </Collapsible>
    </Show>
  );
};
