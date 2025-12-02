import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, a0 as store_set, O as attr, N as attr_class, Q as stringify } from './index-C9dy-hDW.js';
import { o as onDestroy, L as Loading } from './Loading-Bei-CWQ1.js';
import { b as branding, f as features } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { S as StaticTable } from './StaticTable-CFTFs3M2.js';
import { l as loadDashboardData, a as activeRow, o as open } from './Dashboard-CRYdB654.js';
import './User-CeJunCPd.js';
import './utils-D3IkxnGP.js';
import '@sveltejs/kit';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './index2-CFqWCRce.js';
import './Dictionary-Cym6J1qH.js';
import './RemoteTable-CuygI6T5.js';
import './AddFilter-1lfQ-1wP.js';
import './Filter-DSKDPPqy.js';
import 'uuid';
import './OptionsSelectionList-B6aTQUlC.js';
import './Modal-C5zQSBqd.js';
import './ErrorAlert-BNxDBqzK.js';

function DashboardLink($$payload, $$props) {
  push();
  let {
    data = { row: { additional_info_link: "", consentGranted: false } }
  } = $$props;
  let link = data.row.additional_info_link;
  let consentGranted = data.row.consentGranted;
  if (consentGranted) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<i class="fa-regular fa-circle-check text-3xl text-success-500"></i>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<a${attr("href", link || "#")}${attr("title", link ? "More Info" : "Link not available")}${attr_class(`btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 ${stringify(!link ? "opacity-50 cursor-not-allowed" : "")}`)} target="_blank">More Info</a>`);
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function _page($$payload, $$props) {
  push();
  const tableName = "ExplorerTable";
  let currentColumns = [];
  let currentRows = [];
  const cellOverides = { additional_info_link: DashboardLink };
  const dataLoadPromise = loadDashboardData();
  onDestroy(() => {
  });
  function rowClickHandler(row) {
    store_set(activeRow, row);
    store_set(open, true);
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)}</title>`;
  });
  Content($$payload, {
    title: "Data Dashboard",
    class: "content-center",
    full: true,
    children: ($$payload2) => {
      $$payload2.out.push(`<section id="data-container">`);
      await_block(
        $$payload2,
        dataLoadPromise,
        () => {
          Loading($$payload2, {});
        },
        () => {
          StaticTable($$payload2, {
            tableName,
            data: currentRows,
            columns: currentColumns,
            cellOverides,
            showPagination: false,
            searchable: false,
            stickyHeader: true,
            rowClickHandler: features.dashboardDrawer ? rowClickHandler : void 0,
            isClickable: features.dashboardDrawer
          });
        }
      );
      $$payload2.out.push(`<!--]--></section>`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CJBtLnfU.js.map
