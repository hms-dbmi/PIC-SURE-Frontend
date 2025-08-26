import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, T as store_get, W as unsubscribe_stores, N as attr, P as stringify } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import { a as active, l as loadDatasets } from './Dataset-cbZBLonT.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { S as StaticTable } from './StaticTable-h7VnOZfV.js';
import { C as CopyButton } from './CopyButton-iVakjEWf.js';
import './User-ByrNDeqq.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './exports-Cnt0TmSD.js';
import './client2-CLhyDddE.js';
import './Dictionary-10axK71X.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import './RemoteTable-Dy4YtKgc.js';
import './AddFilter-BbVq5aRW.js';
import './Filter-BUwQwcV6.js';
import 'uuid';
import './OptionsSelectionList-Dlogw0gs.js';
import './Popover-D0sAJhG1.js';
import './Forms-DH01zSCL.js';
import './index2-CvuFLVuQ.js';

function CopyButtonCell($$payload, $$props) {
  push();
  let { data = { cell: "", row: {} } } = $$props;
  $$payload.out += `<div class="flex items-center"><span class="monospace">${escape_html(data.cell)}</span> `;
  CopyButton($$payload, {
    "data-testid": `${stringify(data.cell)}-copy`,
    useIcon: true,
    itemToCopy: data.cell
  });
  $$payload.out += `<!----></div>`;
  pop();
}
function Actions($$payload, $$props) {
  push();
  const { data = { cell: "", row: { archived: false } } } = $$props;
  if (data.row.archived) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button${attr("data-testid", `dataset-action-restore-${data.cell}`)} type="button" title="Restore" aria-label="Restore" class="btn-icon-color"><i class="fa-solid fa-trash-arrow-up fa-xl"></i></button>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button${attr("data-testid", `dataset-action-archive-${data.cell}`)} type="button" title="Delete" aria-label="Delete" class="btn-icon-color"><i class="fa-solid fa-trash fa-xl"></i></button>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const columns = [
    { dataElement: "name", label: "Dataset ID Name" },
    { dataElement: "startTime", label: "Created" },
    { dataElement: "queryId", label: "Dataset ID" },
    {
      dataElement: "uuid",
      label: "Actions",
      class: "text-center"
    }
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
          $$payload2.out += `<!----> `;
          {
            $$payload2.out += "<!--[!-->";
          }
          $$payload2.out += `<!--]--> <button data-testid="dataset-toggle-archive" type="button" class="btn bg-secondary-500 text-secondary-contrast-500">${escape_html("Show")} deleted datasets</button>`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B_B_yllE.js.map
