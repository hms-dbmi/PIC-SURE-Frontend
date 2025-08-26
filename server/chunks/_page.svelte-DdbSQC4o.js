import { x as push, T as store_get, a1 as head, W as unsubscribe_stores, z as pop, _ as store_set, K as escape_html, X as await_block, R as ensure_array_like, M as attr_class, O as clsx, P as stringify } from './index-C5NonOVO.js';
import { o as onDestroy, L as Loading } from './Loading-Drx6gnkR.js';
import { b as branding } from './configuration-CSskKBur.js';
import { S as StatPromise, c as countResult, g as getStatFields } from './StatBuilder-Dl1Zy-p_.js';
import { r as resultCounts } from './ResultStore-CVyEAw3c.js';
import { p as panelOpen } from './SidePanel-RBU0AY7R.js';
import { au as loading } from './User-ByrNDeqq.js';
import { C as Content } from './Content-DHBbMVB_.js';
import './index2-CvuFLVuQ.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './Dictionary-10axK71X.js';
import './index3-D0mgFMjB.js';
import './Filter-BUwQwcV6.js';
import 'uuid';
import './Export-CTQ_v_3l.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const NO_DATA = "-";
  const styles = {
    center: "!text-center",
    left: "!text-left",
    stat: "font-bold",
    field: ""
  };
  let resources = [];
  let columns = [
    { style: styles.left, value: "Details" },
    { style: styles.center, value: "Total" },
    ...resources.map((value) => ({ style: styles.center, value }))
  ];
  let rows = resources.length > 0 ? setTableData(store_get($$store_subs ??= {}, "$resultCounts", resultCounts), resources) : [];
  function setTableData(stats, resourceNames) {
    let rows2 = [];
    stats.forEach((stat) => {
      const statTotal = Promise.allSettled(StatPromise.list(stat)).then((results) => countResult(results.map(StatPromise.valueOrZero)));
      const resourceTotals = resourceNames.map((resource) => stat.result[resource].then((count) => countResult([count])));
      rows2.push({
        style: styles.stat,
        values: [stat.label, statTotal, ...resourceTotals]
      });
      getStatFields(stat.key).forEach((field) => {
        const fieldCount = (stat2) => {
          const count = typeof stat2 === "object" ? stat2[field.conceptPath] || NO_DATA : stat2;
          return `${count}` === "-1" ? NO_DATA : count;
        };
        const fieldTotal = Promise.allSettled(StatPromise.list(stat)).then((results) => countResult(results.map(StatPromise.valueOrZero).map(fieldCount)));
        const fieldTotals = resourceNames.map((resource) => stat.result[resource].then(fieldCount));
        rows2.push({
          style: styles.field,
          values: [field.label, fieldTotal, ...fieldTotals]
        });
      });
    });
    return rows2;
  }
  onDestroy(() => {
    store_set(panelOpen, true);
  });
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Cohort Details</title>`;
  });
  Content($$payload, {
    full: true,
    backUrl: "/explorer",
    backTitle: "Back to Cohort Builder",
    title: "Cohort Details",
    children: ($$payload2) => {
      $$payload2.out += `<p class="text-center">${escape_html(branding.results.cohortDescription || "Distribution of total patient counts across networked institutions.")}</p> `;
      await_block(
        $$payload2,
        store_get($$store_subs ??= {}, "$resourcesPromise", loading),
        () => {
          Loading($$payload2, { ring: true, size: "large" });
        },
        () => {
          const each_array = ensure_array_like(columns);
          const each_array_1 = ensure_array_like(rows);
          $$payload2.out += `<div class="table-wrap"><table class="table caption-bottom"><thead><tr><!--[-->`;
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let column = each_array[$$index];
            $$payload2.out += `<th${attr_class(clsx(column.style))}>${escape_html(column.value)}</th>`;
          }
          $$payload2.out += `<!--]--></tr></thead><tbody><!--[-->`;
          for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
            let row = each_array_1[$$index_2];
            const each_array_2 = ensure_array_like(row.values);
            $$payload2.out += `<tr><!--[-->`;
            for (let index = 0, $$length2 = each_array_2.length; index < $$length2; index++) {
              let rowColumn = each_array_2[index];
              $$payload2.out += `<td${attr_class(`${stringify(columns[index].style)} ${stringify(row.style)}`)}>`;
              await_block(
                $$payload2,
                rowColumn,
                () => {
                  Loading($$payload2, { ring: true, size: "micro" });
                },
                (rowValue) => {
                  $$payload2.out += `${escape_html(rowValue)}`;
                }
              );
              $$payload2.out += `<!--]--></td>`;
            }
            $$payload2.out += `<!--]--></tr>`;
          }
          $$payload2.out += `<!--]--></tbody></table></div> <ul id="cohort-key" class="w-full flex text-center py-3"><li class="flex-auto">"0" = Site returned zero results</li> <li class="flex-auto">"-" = No data for that site</li> <li class="flex-auto"><i class="fa-solid fa-circle-xmark text-error-500"></i> = Site did not return results</li></ul>`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DdbSQC4o.js.map
