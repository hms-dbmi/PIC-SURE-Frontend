import { x as push, a1 as head, z as pop, K as escape_html, _ as await_block, Z as store_set, N as attr, M as attr_class, P as stringify } from './index-BKfiikQf.js';
import { o as onDestroy } from './machine.svelte-D_VZYMjT.js';
import { b as branding, f as features } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { S as StaticTable } from './StaticTable-DpzYDOnO.js';
import { l as loadDashboardData, a as activeRow, o as open } from './Dashboard-Cg3p4Xos.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './index-BB9JrA1L.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './Dictionary-DkgC0mju.js';
import './stores-DhwnhD2d.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './RemoteTable-DsZbuyUA.js';
import './AddFilter-BMouBxmg.js';
import './toaster-DzAsAKEJ.js';
import './Filter-4LYIgLGB.js';
import './OptionsSelectionList-BuyVKVAm.js';

function DashboardLink($$payload, $$props) {
  push();
  let {
    data = {
      row: {
        additional_info_link: "",
        consentGranted: false
      }
    }
  } = $$props;
  let link = data.row.additional_info_link;
  let consentGranted = data.row.consentGranted;
  if (consentGranted) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<i class="fa-regular fa-circle-check text-3xl text-success-500"></i>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<a${attr("href", link || "#")}${attr("title", link ? "More Info" : "Link not available")}${attr_class(`btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 ${stringify(!link ? "opacity-50 cursor-not-allowed" : "")}`)} target="_blank">More Info</a>`;
  }
  $$payload.out += `<!--]-->`;
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
      $$payload2.out += `<section id="data-container">`;
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
            rowClickHandler,
            isClickable: features.dashboardDrawer
          });
        }
      );
      $$payload2.out += `<!--]--></section>`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DImMXjHV.js.map
