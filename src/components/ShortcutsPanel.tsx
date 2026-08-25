import { type Component } from "solid-js";

export const ShortcutsPanel: Component = () => {
  return (
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
  );
};
