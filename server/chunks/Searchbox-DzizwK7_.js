import { x as push, N as attr, Y as bind_props, z as pop } from './index-C5NonOVO.js';

function Searchbox($$payload, $$props) {
  push();
  let {
    placeholder = "Search...",
    search = () => {
    },
    searchTerm = ""
  } = $$props;
  $$payload.out += `<div class="flex w-full h-full"><input type="search" autocomplete="off" class="search-box w-full svelte-buhrr8" id="explorer-search-box" data-testid="search-box" aria-label="Type search terms here, use enter or the search button to submit search" title="Type search terms here, use enter or the search button to submit search"${attr("placeholder", placeholder)}${attr("value", searchTerm)}/> <button id="search-button" class="btn preset-filled-primary-500 search-button svelte-buhrr8" aria-label="Search" title="Search"><i class="fas fa-search"></i></button></div>`;
  bind_props($$props, { searchTerm });
  pop();
}

export { Searchbox as S };
//# sourceMappingURL=Searchbox-DzizwK7_.js.map
