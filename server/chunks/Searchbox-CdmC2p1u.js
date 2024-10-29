import { c as create_ssr_component, a as add_attribute } from './ssr-Di-o4HBA.js';

const css = {
  code: ".search-box.svelte-6bqelq{border-top-right-radius:0 !important;border-bottom-right-radius:0 !important;margin-right:0% !important}.search-button.svelte-6bqelq{border-top-left-radius:0;border-bottom-left-radius:0;padding-right:1rem;padding-left:0.75rem}",
  map: `{"version":3,"file":"Searchbox.svelte","sources":["Searchbox.svelte"],"sourcesContent":["<script lang=\\"ts\\">export let placeholder = \\"Search...\\";\\nexport let search = () => {\\n};\\nexport let searchTerm = \\"\\";\\n<\/script>\\n\\n<div class=\\"flex w-full\\">\\n  <input\\n    type=\\"search\\"\\n    autocomplete=\\"off\\"\\n    class=\\"search-box w-full\\"\\n    id=\\"explorer-search-box\\"\\n    data-testid=\\"search-box\\"\\n    aria-label=\\"Type search terms here, use enter or the search button to submit search\\"\\n    title=\\"Type search terms here, use enter or the search button to submit search\\"\\n    {placeholder}\\n    bind:value={searchTerm}\\n    on:keydown={(e) => e.key === 'Enter' && search()}\\n    required\\n  />\\n  <button\\n    id=\\"search-button\\"\\n    class=\\"btn variant-filled-primary search-button\\"\\n    aria-label=\\"Search\\"\\n    title=\\"Search\\"\\n    disabled={!searchTerm}\\n    on:click={search}\\n  >\\n    <i class=\\"fas fa-search\\"></i>\\n  </button>\\n</div>\\n\\n<style>\\n  .search-box {\\n    border-top-right-radius: 0 !important;\\n    border-bottom-right-radius: 0 !important;\\n    margin-right: 0% !important;\\n  }\\n  .search-button {\\n    border-top-left-radius: 0;\\n    border-bottom-left-radius: 0;\\n    padding-right: 1rem;\\n    padding-left: 0.75rem;\\n  }</style>\\n"],"names":[],"mappings":"AAiCE,yBAAY,CACV,uBAAuB,CAAE,CAAC,CAAC,UAAU,CACrC,0BAA0B,CAAE,CAAC,CAAC,UAAU,CACxC,YAAY,CAAE,EAAE,CAAC,UACnB,CACA,4BAAe,CACb,sBAAsB,CAAE,CAAC,CACzB,yBAAyB,CAAE,CAAC,CAC5B,aAAa,CAAE,IAAI,CACnB,YAAY,CAAE,OAChB"}`
};
const Searchbox = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { placeholder = "Search..." } = $$props;
  let { search = () => {
  } } = $$props;
  let { searchTerm = "" } = $$props;
  if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0) $$bindings.placeholder(placeholder);
  if ($$props.search === void 0 && $$bindings.search && search !== void 0) $$bindings.search(search);
  if ($$props.searchTerm === void 0 && $$bindings.searchTerm && searchTerm !== void 0) $$bindings.searchTerm(searchTerm);
  $$result.css.add(css);
  return `<div class="flex w-full"><input type="search" autocomplete="off" class="search-box w-full svelte-6bqelq" id="explorer-search-box" data-testid="search-box" aria-label="Type search terms here, use enter or the search button to submit search" title="Type search terms here, use enter or the search button to submit search"${add_attribute("placeholder", placeholder, 0)} required${add_attribute("value", searchTerm, 0)}> <button id="search-button" class="btn variant-filled-primary search-button svelte-6bqelq" aria-label="Search" title="Search" ${!searchTerm ? "disabled" : ""}><i class="fas fa-search"></i></button> </div>`;
});

export { Searchbox as S };
//# sourceMappingURL=Searchbox-CdmC2p1u.js.map
