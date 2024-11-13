import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-Di-o4HBA.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { D as DataSetStore } from './Dataset-DjZ7phnJ.js';
import { C as Content } from './Content-BUgV6smf.js';
import { T as Table } from './Table-ehh7vrd4.js';
import { C as CopyButton } from './CopyButton-BuZhfqkP.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import './index2-CV6P_ZFI.js';
import './User-DwYSDSFP.js';
import './index-DzcLzHBX.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores3-DsZ2QG0u.js';
import './AngleButton-Cxjzo9QZ.js';
import './Row-CyujZUEb.js';

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
  return `${data.row.archived ? ` <button${add_attribute("data-testid", `dataset-action-restore-${data.cell}`, 0)} type="button" title="Restore" class="btn-icon-color"${add_attribute("this", toggleButton, 0)}><i class="fa-solid fa-trash-arrow-up fa-xl"></i></button>` : ` <button${add_attribute("data-testid", `dataset-action-archive-${data.cell}`, 0)} type="button" title="Delete" class="btn-icon-color"${add_attribute("this", toggleButton, 0)}><i class="fa-solid fa-trash fa-xl"></i></button>`}`;
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
//# sourceMappingURL=_page.svelte-BWzHJTwf.js.map
