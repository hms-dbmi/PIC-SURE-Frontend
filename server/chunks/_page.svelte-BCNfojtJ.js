import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores, O as attr, Q as stringify } from './index-DMPVr6nO.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { a as active, l as loadDatasets } from './Dataset--vvV5NR5.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { S as StaticTable } from './StaticTable-BZzBQVFt.js';
import { C as CopyButton } from './CopyButton-C8qhQbgh.js';
import './User-01eW3TFo.js';
import { L as Loading } from './Loading-DAyWVuL0.js';
import './utils-B7NzVBxP.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './Dictionary-GEGKzEEq.js';
import './index2-Bp7szfwE.js';
import './RemoteTable-Dun11TjL.js';
import './AddFilter-CZ17On64.js';
import './Filter-Bhec34ty.js';
import 'uuid';
import './OptionsSelectionList-C9pb9mmD.js';
import './Modal-dMSGxUC4.js';
import './ErrorAlert-BrAljl0x.js';
import './Popover-7q3Ft3Q-.js';
import '@floating-ui/dom';
import './HTML-1Mhr8hI4.js';
import 'dompurify';
import './html2-FW6Ia4bL.js';
import './Forms-DH01zSCL.js';
import '@sveltejs/kit';

function CopyButtonCell($$payload, $$props) {
  push();
  let { data = { cell: "", row: {} } } = $$props;
  $$payload.out.push(`<div class="flex items-center"><span class="monospace">${escape_html(data.cell)}</span> `);
  CopyButton($$payload, {
    "data-testid": `${stringify(data.cell)}-copy`,
    useIcon: true,
    itemToCopy: data.cell
  });
  $$payload.out.push(`<!----></div>`);
  pop();
}
function Actions($$payload, $$props) {
  push();
  const { data = { cell: "", row: { archived: false } } } = $$props;
  if (data.row.archived) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button${attr("data-testid", `dataset-action-restore-${data.cell}`)} type="button" title="Restore" aria-label="Restore" class="btn-icon-color"><i class="fa-solid fa-trash-arrow-up fa-xl"></i></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button${attr("data-testid", `dataset-action-archive-${data.cell}`)} type="button" title="Delete" aria-label="Delete" class="btn-icon-color"><i class="fa-solid fa-trash fa-xl"></i></button>`);
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const columns = [
    { dataElement: "name", label: "Dataset ID Name" },
    { dataElement: "startTime", label: "Created" },
    { dataElement: "queryId", label: "Dataset ID" },
    { dataElement: "uuid", label: "Actions", class: "text-center" }
  ];
  const cellOverides = { queryId: CopyButtonCell, uuid: Actions };
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Datasets</title>`;
  });
  Content($$payload, {
    title: "Manage Datasets",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        loadDatasets(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          StaticTable($$payload2, {
            tableName: "ActiveDatasets",
            title: "Active Datasets",
            data: store_get($$store_subs ??= {}, "$active", active),
            columns,
            cellOverides
          });
          $$payload2.out.push(`<!----> `);
          {
            $$payload2.out.push("<!--[!-->");
          }
          $$payload2.out.push(`<!--]--> <button data-testid="dataset-toggle-archive" type="button" class="btn bg-secondary-500 text-secondary-contrast-500">${escape_html("Show")} deleted datasets</button>`);
        }
      );
      $$payload2.out.push(`<!--]-->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BCNfojtJ.js.map
