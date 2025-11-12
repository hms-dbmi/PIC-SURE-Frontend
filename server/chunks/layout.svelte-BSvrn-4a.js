function Layout($$payload, $$props) {
  let { children } = $$props;
  children($$payload);
  $$payload.out.push(`<!---->`);
}

export { Layout as default };
//# sourceMappingURL=layout.svelte-BSvrn-4a.js.map
