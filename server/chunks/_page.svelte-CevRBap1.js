import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, a0 as store_set, O as attr, N as attr_class, Q as stringify } from './index-DMPVr6nO.js';
import { o as onDestroy, L as Loading } from './Loading-DAyWVuL0.js';
import { b as branding, f as features } from './configuration-CBIXsjx2.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { S as StaticTable } from './StaticTable-BZzBQVFt.js';
import { l as loadDashboardData, a as activeRow, o as open } from './Dashboard-DcCMRJp3.js';
import './User-01eW3TFo.js';
import './utils-B7NzVBxP.js';
import '@sveltejs/kit';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './index2-Bp7szfwE.js';
import './Dictionary-GEGKzEEq.js';
import './RemoteTable-Dun11TjL.js';
import './AddFilter-CZ17On64.js';
import './Filter-Bhec34ty.js';
import 'uuid';
import './OptionsSelectionList-C9pb9mmD.js';
import './Modal-dMSGxUC4.js';
import './ErrorAlert-BrAljl0x.js';

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
//# sourceMappingURL=_page.svelte-CevRBap1.js.map
