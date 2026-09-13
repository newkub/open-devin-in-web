import type { ParentComponent } from "solid-js";

export const Collapsible: ParentComponent<{ title: string; open?: boolean }> = (props) => {
  return (
    <details class="section collapsible" open={props.open}>
      <summary>
        <h4>{props.title}</h4>
        <span class="i-mdi-chevron-down chev" />
      </summary>
      <div class="collapsible-body">{props.children}</div>
    </details>
  );
};
