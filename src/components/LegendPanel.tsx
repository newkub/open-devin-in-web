import { For, type Component } from "solid-js";
import { groupColors } from "../Graph";

export const LegendPanel: Component<{ groups: string[] }> = (props) => {
  return (
    <div class="section">
      <h4>legend</h4>
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
    </div>
  );
};
