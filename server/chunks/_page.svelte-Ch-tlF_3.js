import { o as onDestroy, l as is_promise, n as noop, g as get_store_value } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-BRJpAXVH.js';
import { g as getDrawerStore } from './stores3-BYOElYDy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { f as features, b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { T as Table } from './Table-CWagtDaQ.js';
import { w as writable } from './index2-BVONNh3m.js';
import { u as user, g as get } from './User-Dh89vg_C.js';
import './AngleButton-C6YzBYNH.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './Row-DZ3u2TX9.js';
import './index-CvuFLVuQ.js';
import './stores4-B2YFsTYy.js';

const DashboardLink = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data = {
    row: {
      additional_info_link: "",
      consentGranted: false
    }
  } } = $$props;
  let link = data.row.additional_info_link;
  let consentGranted = data.row.consentGranted;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${consentGranted ? `<i class="fa-regular fa-circle-check text-3xl text-success-500"></i>` : `<a${add_attribute("href", link || "#", 0)}${add_attribute("title", link ? "More Info" : "Link not available", 0)} class="${"btn variant-ghost-primary hover:variant-filled-primary" + escape(!link ? " opacity-50 cursor-not-allowed" : "", true)}" target="_blank">More Info</a>`}`;
});
const columns = writable([]);
const rows = writable([]);
function fetchDashboard() {
  return get("picsure/proxy/dictionary-api/dashboard");
}
async function loadDashboardData() {
  const dashboardData = await fetchDashboard();
  columns.set(dashboardData.columns);
  get_store_value(user);
  let consents = [];
  const processedRows = dashboardData.rows.map(processRow(consents));
  const sortedRows = processedRows.sort((a, b) => {
    const aIsAnvil = (a.program_name?.toString().toLowerCase() || "") === "anvil";
    const bIsAnvil = (b.program_name?.toString().toLowerCase() || "") === "anvil";
    if (aIsAnvil !== bIsAnvil) {
      return aIsAnvil ? 1 : -1;
    }
    if (a.consentGranted === b.consentGranted) {
      return sortByAbbreviation(a, b);
    }
    return a.consentGranted ? -1 : 1;
  });
  rows.set(sortedRows);
}
function processRow(consents) {
  return (row) => {
    if (!row.accession) {
      return { ...row, consentGranted: false };
    }
    const accession = row.accession.toString();
    const accessionRegex = /^phs\d+\.v\d+\.p\d+\.c\d+$/;
    if (accessionRegex.test(accession)) {
      const accessionBase = accession.replace(/\.v\d+\.p\d+/, "");
      return { ...row, consentGranted: consents.includes(accessionBase) };
    }
    return { ...row, consentGranted: consents.includes(accession) };
  };
}
function sortByAbbreviation(a, b) {
  const aAbbr = a.abbreviation?.toString() || "";
  const bAbbr = b.abbreviation?.toString() || "";
  return aAbbr.localeCompare(bAbbr);
}
const tableName = "ExplorerTable";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const drawerStore = getDrawerStore();
  let currentColumns = [];
  let currentRows = [];
  const cellOverides = { additional_info_link: DashboardLink };
  const dataLoadPromise = loadDashboardData();
  onDestroy(() => {
  });
  function rowClickHandler(row) {
    drawerStore.open({ id: "dashboard-drawer", meta: { row } });
  }
  return `${$$result.head += `<!-- HEAD_svelte-1uz9aip_START -->${$$result.title = `<title>${escape(branding.applicationName)}</title>`, ""}<!-- HEAD_svelte-1uz9aip_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Data Dashboard",
      class: "content-center",
      full: true
    },
    {},
    {
      default: () => {
        return `<section id="data-container" class="">${function(__value) {
          if (is_promise(__value)) {
            __value.then(null, noop);
            return ` ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
          }
          return function() {
            return ` ${validate_component(Table, "Datatable").$$render(
              $$result,
              {
                tableName,
                data: currentRows,
                columns: currentColumns,
                cellOverides,
                defaultRowsPerPage: currentRows.length,
                search: false,
                showPagination: false,
                stickyHeader: true,
                rowClickHandler,
                isClickable: features.dashboardDrawer
              },
              {},
              {}
            )} `;
          }();
        }(dataLoadPromise)}</section>`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Ch-tlF_3.js.map
