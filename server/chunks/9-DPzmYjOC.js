import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';

const load = async () => {
  let providers = getAllProviderData();
  const altProviders = [];
  providers = providers.reduce((mainProviders, current) => {
    if (current.alt) {
      altProviders.push(current);
    } else {
      mainProviders.push(current);
    }
    return mainProviders;
  }, []);
  return {
    providers,
    altProviders
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BDHeNGXw.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/9.Dcg5UjcA.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/B9BhT3Ut.js","_app/immutable/chunks/pV5yBOfK.js","_app/immutable/chunks/D3FUfhzK.js","_app/immutable/chunks/CPDBQclr.js","_app/immutable/chunks/CF-XIK1E.js","_app/immutable/chunks/BAa5cEXk.js","_app/immutable/chunks/CFqqwPkz.js","_app/immutable/chunks/B3YVaWvx.js","_app/immutable/chunks/Dj8TqXX2.js","_app/immutable/chunks/B9OKY7FI.js","_app/immutable/chunks/BLfKYx2_.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/chunks/i859GThY.js","_app/immutable/chunks/tvkVmxlD.js","_app/immutable/chunks/hUONLBj8.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/xQt8NbMC.js","_app/immutable/chunks/C2caA9Pm.js","_app/immutable/chunks/N6i2_EpV.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/COZ3s8UQ.js","_app/immutable/chunks/D3-cXwBU.js","_app/immutable/chunks/D2cigjdB.js","_app/immutable/chunks/C6RsMIt9.js","_app/immutable/chunks/BK-nQ0m1.js"];
const stylesheets = ["_app/immutable/assets/User.D5ff5RAM.css","_app/immutable/assets/Dictionary.DGG4D70t.css","_app/immutable/assets/9.CGr4IPog.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=9-DPzmYjOC.js.map
