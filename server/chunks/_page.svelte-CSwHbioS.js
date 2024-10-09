import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-C099ZcAV.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { D as DataSetStore } from './Dataset-BUkSjERL.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { T as Table } from './Table-0D_aobLH.js';
import { C as CopyButton } from './CopyButton-t8NdlniS.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import './index2-Bx7ZSImw.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './AngleButton-C0svtr3S.js';
import './Row-DCE9feR7.js';

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
//# sourceMappingURL=_page.svelte-CSwHbioS.js.map
