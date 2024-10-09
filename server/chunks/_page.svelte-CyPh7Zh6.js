import { e as is_promise, n as noop, g as get_store_value } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, o as onDestroy, e as escape, v as validate_component, a as add_attribute } from './ssr-C099ZcAV.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { f as features, b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { T as Table } from './Table-0D_aobLH.js';
import { w as writable } from './index2-Bx7ZSImw.js';
import { u as user, d as get } from './User-D2U6RL_p.js';
import './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './Row-DCE9feR7.js';
import './index-DzcLzHBX.js';

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
//# sourceMappingURL=_page.svelte-CyPh7Zh6.js.map
