import { x as push, O as attr, Z as bind_props, z as pop } from './index-BYsoXH7a.js';

function Searchbox($$payload, $$props) {
  push();
  let {
    placeholder = "Search...",
    search = () => {
    },
    searchTerm = ""
  } = $$props;
  $$payload.out.push(`<div class="flex w-full h-full"><input type="search" autocomplete="off" class="search-box w-full svelte-1gghge1" id="explorer-search-box" data-testid="search-box" aria-label="Type search terms here, use enter or the search button to submit search" title="Type search terms here, use enter or the search button to submit search"${attr("placeholder", placeholder)}${attr("value", searchTerm)}/> <button id="search-button" class="btn preset-filled-primary-500 search-button svelte-1gghge1" aria-label="Search" title="Search"><i class="fas fa-search"></i></button></div>`);
  bind_props($$props, { searchTerm });
  pop();
}

export { Searchbox as S };
//# sourceMappingURL=Searchbox-BFhJjEkJ.js.map
