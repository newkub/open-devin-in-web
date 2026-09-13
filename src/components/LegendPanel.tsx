import { For, type Component } from "solid-js";
import { groupColors } from "../Graph";
import { Collapsible } from "./Collapsible";

const typeShapes: { type: string; label: string; icon: string }[] = [
  { type: "skill", label: "skill", icon: "i-mdi-circle" },
  { type: "subagent", label: "subagent", icon: "i-mdi-triangle" },
  { type: "mcp", label: "mcp server", icon: "i-mdi-rhombus" },
  { type: "rule", label: "global rule", icon: "i-mdi-star" },
];

export const LegendPanel: Component<{ groups: string[] }> = (props) => {
  return (
    <Collapsible title="legend">
      <ul class="legend">
        <For each={typeShapes}>
          {(t) => (
            <li>
              <span class={`${t.icon} shape-icon`} />
              <span class="cap">{t.label}</span>
            </li>
          )}
        </For>
      </ul>
      <ul class="legend">
        <For each={props.groups}>
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
    </Collapsible>
  );
};
