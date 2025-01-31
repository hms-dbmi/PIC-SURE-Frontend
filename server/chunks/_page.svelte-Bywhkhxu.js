import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { D as DataSetStore } from './Dataset-BSTsSJMu.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { T as Table } from './Table-BH3DMZ1c.js';
import { C as CopyButton } from './CopyButton-BtLZ49Iw.js';
import { b as branding } from './configuration-BRozmRr_.js';
import './index2-BVONNh3m.js';
import './User-BiqhXRJx.js';
import './index-DzcLzHBX.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores4-C3NPX6l0.js';
import './AngleButton-C6YzBYNH.js';
import './Row-DZ3u2TX9.js';

const CopyButtonCell = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data = { cell: "", row: {} } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `<div class="flex items-center"><span class="monospace">${escape(data.cell)}</span> ${validate_component(CopyButton, "CopyButton").$$render(
    $$result,
    {
      "data-testid": data.cell + "-copy-btn",
      useIcon: true,
      itemToCopy: data.cell
    },
    {},
    {}
  )}</div>`;
});
const Actions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data = { cell: "", row: { archived: false } } } = $$props;
  let toggleButton;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  return `${data.row.archived ? ` <button${add_attribute("data-testid", `dataset-action-restore-${data.cell}`, 0)} type="button" title="Restore" aria-label="Restore" class="btn-icon-color"${add_attribute("this", toggleButton, 0)}><i class="fa-solid fa-trash-arrow-up fa-xl"></i></button>` : ` <button${add_attribute("data-testid", `dataset-action-archive-${data.cell}`, 0)} type="button" title="Delete" aria-label="Delete" class="btn-icon-color"${add_attribute("this", toggleButton, 0)}><i class="fa-solid fa-trash fa-xl"></i></button>`}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $active, $$unsubscribe_active;
  let $$unsubscribe_archived;
  const columns = [
    {
      dataElement: "name",
      label: "Dataset ID Name"
    },
    {
      dataElement: "startTime",
      label: "Created"
    },
    {
      dataElement: "queryId",
      label: "Dataset ID"
    },
    { dataElement: "uuid", label: "Actions" }
  ];
  const cellOverides = { queryId: CopyButtonCell, uuid: Actions };
  let { active, archived, loadDatasets } = DataSetStore;
  $$unsubscribe_active = subscribe(active, (value) => $active = value);
  $$unsubscribe_archived = subscribe(archived, (value) => value);
  const rowClickHandler = () => {
    console.error("Function not implemented.");
  };
  $$unsubscribe_active();
  $$unsubscribe_archived();
  return `${$$result.head += `<!-- HEAD_svelte-hk92pg_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Datasets</title>`, ""}<!-- HEAD_svelte-hk92pg_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Manage Datasets" }, {}, {
    default: () => {
      return `${function(__value) {
        if (is_promise(__value)) {
          __value.then(null, noop);
          return ` <h3 class="text-left" data-svelte-h="svelte-16fo5h6">Loading</h3> ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
        }
        return function() {
          return ` ${validate_component(Table, "Datatable").$$render(
            $$result,
            {
              tableName: "ActiveDatasets",
              title: "Active Datasets",
              data: $active,
              columns,
              cellOverides,
              rowClickHandler
            },
            {},
            {}
          )} ${``} <button data-testid="dataset-toggle-archive" type="button" class="btn bg-secondary-500 text-on-secondary-token">${escape("Show")} deleted datasets</button> `;
        }();
      }(loadDatasets())}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Bywhkhxu.js.map
