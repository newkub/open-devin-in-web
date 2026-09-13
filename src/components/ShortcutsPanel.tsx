import { type Component } from "solid-js";
import { Collapsible } from "./Collapsible";

export const ShortcutsPanel: Component = () => {
  return (
    <Collapsible title="shortcuts">
      <ul class="shortcuts-list">
        <li><kbd>/</kbd> <span>search</span></li>
        <li><kbd>enter</kbd> <span>select first match</span></li>
        <li><kbd>esc</kbd> <span>clear selection</span></li>
        <li><kbd>f</kbd> <span>focus selected</span></li>
        <li><kbd>r</kbd> <span>fit graph</span></li>
        <li><kbd>d</kbd> <span>toggle theme</span></li>
        <li><kbd>p</kbd> <span>toggle physics</span></li>
        <li><kbd>l</kbd> <span>toggle labels</span></li>
        <li><kbd>i</kbd> <span>toggle isolated</span></li>
        <li><kbd>c</kbd> <span>toggle clusters</span></li>
        <li><kbd>b</kbd> <span>toggle sidebar</span></li>
        <li><kbd>dblclick</kbd> <span>open file</span></li>
      </ul>
    </Collapsible>
  );
};
