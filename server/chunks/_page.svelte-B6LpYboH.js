import { o as onDestroy, m as is_promise, n as noop, g as get_store_value } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-Di-o4HBA.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { f as features, b as branding } from './configuration-B3dQYR0_.js';
import { C as Content } from './Content-BUgV6smf.js';
import { T as Table } from './Table-ehh7vrd4.js';
import { w as writable } from './index2-CV6P_ZFI.js';
import { u as user, d as get } from './User-DwYSDSFP.js';
import './AngleButton-Cxjzo9QZ.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './Row-CyujZUEb.js';
import './index-DzcLzHBX.js';
import './stores3-DsZ2QG0u.js';

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
  return `${consentGranted ? `<i class="fa-regular fa-circle-check text-3xl text-success-500"></i>` : `<a${add_attribute("href", link, 0)} class="btn variant-ghost-primary hover:variant-filled-primary" target="_blank">More Info</a>`}`;
});
const columns = writable([]);
const rows = writable([]);
function fetchDashboard() {
  return get("picsure/proxy/dictionary-api/dashboard");
}
function isUserLoggedIn() {
  return false;
}
async function loadDashboardData() {
  const dashboardData = await fetchDashboard();
  columns.set(dashboardData.columns);
  const loggedInUser = get_store_value(user);
  const useConsents = features.useQueryTemplate && isUserLoggedIn() && loggedInUser?.queryTemplate;
  let consents = [];
  if (useConsents) {
    consents = loggedInUser.queryTemplate?.categoryFilters?.["\\_consents\\"] || [];
  }
  const processedRows = dashboardData.rows.map(processRow(consents));
  const sortedRows = processedRows.sort((a, b) => {
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
  let currentColumns = [];
  let currentRows = [];
  const cellOverides = { additional_info_link: DashboardLink };
  const dataLoadPromise = loadDashboardData();
  onDestroy(() => {
  });
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
                stickyHeader: true
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
//# sourceMappingURL=_page.svelte-B6LpYboH.js.map
