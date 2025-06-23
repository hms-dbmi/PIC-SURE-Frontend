function Layout($$payload, $$props) {
  let { children } = $$props;
  children($$payload);
  $$payload.out += `<!---->`;
}

export { Layout as default };
//# sourceMappingURL=layout.svelte-4V-_rMCU.js.map
