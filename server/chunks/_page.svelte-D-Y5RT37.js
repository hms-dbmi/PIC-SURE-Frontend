import { x as push, a4 as head, z as pop, a0 as store_set, M as escape_html, V as copy_payload, W as assign_payload, Y as await_block, S as ensure_array_like, O as attr, Z as bind_props } from './index-BYsoXH7a.js';
import { o as onDestroy, L as Loading } from './Loading-D4A6B7i5.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './client2-2LGcfZLB.js';
import { b as branding, f as features, s as settings, E as ExportType } from './configuration-wjj69jIJ.js';
import { S as post, R as Picsure } from './User-CGCqDR6a.js';
import { p as panelOpen } from './SidePanel-C0oDvhAm.js';
import { C as Content } from './Content-D47GFKQW.js';
import { E as ErrorAlert } from './ErrorAlert-BJMruCzq.js';
import { T as Tabs } from './index3-A3ikNsha.js';
import './Filter-D4fknGLB.js';
import './Export-BN3JIXjt.js';
import { S as StaticTable } from './StaticTable-CuYczK4V.js';
import '@sveltejs/kit';
import './index2-DXnmzf54.js';
import './create-context-CreHy-BA.js';
import 'uuid';
import './Dictionary-SO9EnU4C.js';
import './RemoteTable-fo4XXOhh.js';
import './AddFilter-DdRxu9jO.js';
import './OptionsSelectionList-B-cROXFf.js';
import './Modal-CHSSe0AJ.js';

function getVariantData(exportType, request) {
  request.query.expectedResultType = exportType === ExportType.Aggregate ? "AGGREGATE_VCF_EXCERPT" : "VCF_EXCERPT";
  return post(Picsure.QuerySync, request).then((response) => {
    const downloadUrl = URL.createObjectURL(new Blob([response], { type: "octet/stream" }));
    const lines = response.split("\n");
    const headers = lines[0].split("	");
    const excludeIndexes = settings.variantExplorer.excludeColumns.map((column) => headers.indexOf(column)).filter((x) => x >= 0);
    const variants = lines.slice(1).map((line) => line.split("	")).filter((varList) => varList.length > 1);
    const rows = variants.map((variant) => {
      return variant.reduce((map, column, index) => {
        if (!excludeIndexes.includes(index)) {
          map[headers[index].toString()] = column;
        }
        return map;
      }, {});
    });
    const columns = headers.filter((_header, index) => !excludeIndexes.includes(index)).map(
      (header) => ({
        dataElement: header,
        label: header,
        sort: true,
        filter: true
      })
    );
    return { columns, rows, downloadUrl };
  });
}
function VariantData($$payload, $$props) {
  push();
  let {
    count,
    data = void 0,
    exportType = void 0,
    onAggregateToggle = () => {
    }
  } = $$props;
  let aggregateCheckbox = exportType === ExportType.Full;
  if (data) {
    $$payload.out.push("<!--[-->");
    await_block(
      $$payload,
      data,
      () => {
        if (count > 0) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div data-testid="variant-count" class="flex-none w-full">${escape_html(count.toLocaleString())} variants found</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        Loading($$payload, { ring: true, size: "medium" });
        $$payload.out.push(`<!---->`);
      },
      (varData) => {
        if (count > settings.variantExplorer.maxCount) {
          $$payload.out.push("<!--[-->");
          ErrorAlert($$payload, {
            color: "warning",
            children: ($$payload2) => {
              $$payload2.out.push(`<!---->Too many variants! Found ${escape_html(count.toLocaleString())}, but cannot display more than
        ${escape_html(settings.variantExplorer.maxCount)} variants.`);
            }
          });
        } else {
          $$payload.out.push("<!--[!-->");
          if (count > 0 && !!varData && varData.rows.length > 0) {
            $$payload.out.push("<!--[-->");
            {
              let tableActions = function($$payload2) {
                if (varData.downloadUrl) {
                  $$payload2.out.push("<!--[-->");
                  $$payload2.out.push(`<a data-testid="variant-download-btn" class="btn btn-sm preset-tonal-primary border border-primary-500"${attr("href", varData.downloadUrl)} download="variantData.tsv"><i class="fa-solid fa-download"></i> Download Variant${escape_html(aggregateCheckbox ? " (Aggregate)" : "")} Data</a>`);
                } else {
                  $$payload2.out.push("<!--[!-->");
                }
                $$payload2.out.push(`<!--]--> `);
                if (count > 0) {
                  $$payload2.out.push("<!--[-->");
                  $$payload2.out.push(`<div data-testid="variant-count" class="text-left w-full">${escape_html(count.toLocaleString())} variants found</div>`);
                } else {
                  $$payload2.out.push("<!--[!-->");
                }
                $$payload2.out.push(`<!--]--> `);
                if (settings.variantExplorer.type === ExportType.Full) {
                  $$payload2.out.push("<!--[-->");
                  $$payload2.out.push(`<div><label class="flex items-center space-x-2"><input class="checkbox" type="checkbox"${attr("checked", aggregateCheckbox, true)}/> <p>Aggregate data</p></label></div>`);
                } else {
                  $$payload2.out.push("<!--[!-->");
                }
                $$payload2.out.push(`<!--]-->`);
              };
              StaticTable($$payload, {
                tableName: "variant-explorer",
                data: varData.rows,
                columns: varData.columns,
                fullWidth: true,
                searchable: true,
                tableActions,
                $$slots: { tableActions: true }
              });
            }
          } else {
            $$payload.out.push("<!--[!-->");
            $$payload.out.push(`<div data-testid="variant-count" class="flex-none w-full">${escape_html(count.toLocaleString())} variants found</div>`);
          }
          $$payload.out.push(`<!--]-->`);
        }
        $$payload.out.push(`<!--]-->`);
      }
    );
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { data, exportType });
  pop();
}
function VariantExplorer($$payload, $$props) {
  push();
  let variantResults = [];
  let tabGroup = "";
  let loading$1 = Promise.resolve();
  function changeTabGroup(newTab) {
    tabGroup = newTab;
    const tabResult = variantResults.find((result) => result.name === tabGroup);
    if (tabResult && !tabResult.data) {
      tabResult.data = getVariantData(tabResult.exportType, tabResult.queryRequest);
    }
  }
  function aggregateChange(index) {
    const result = variantResults[index];
    return (checked) => {
      result.exportType = checked ? ExportType.Aggregate : ExportType.Full;
      result.data = getVariantData(result.exportType, result.queryRequest);
    };
  }
  function shortNumber(count) {
    const tril = 1e12;
    const bil = 1e9;
    const mil = 1e6;
    const thou = 1e3;
    const toFixed = (val, mod) => val % mod > 0 ? (val / mod).toFixed(1) : Math.round(val / mod);
    if (count >= tril) {
      return "~" + toFixed(count, tril) + "T";
    } else if (count >= bil) {
      return "~" + toFixed(count, bil) + "B";
    } else if (count >= mil) {
      return "~" + toFixed(count, mil) + "M";
    } else if (count >= thou) {
      return "~" + toFixed(count, thou) + "K";
    }
    return count.toString();
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    await_block(
      $$payload2,
      loading$1,
      () => {
        Loading($$payload2, { ring: true, size: "medium" });
      },
      () => {
        if (variantResults.length > 1) {
          $$payload2.out.push("<!--[-->");
          {
            let list = function($$payload3) {
              const each_array = ensure_array_like(variantResults);
              $$payload3.out.push(`<!--[-->`);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let { name, count } = each_array[$$index];
                $$payload3.out.push(`<!---->`);
                Tabs.Control($$payload3, {
                  value: name,
                  children: ($$payload4) => {
                    $$payload4.out.push(`<div class="flex items-center"><span class="font-bold">${escape_html(name)}</span> `);
                    await_block(
                      $$payload4,
                      count,
                      () => {
                        $$payload4.out.push(`<span class="float-right">`);
                        Loading($$payload4, { ring: true, size: "micro" });
                        $$payload4.out.push(`<!----></span>`);
                      },
                      (countValue) => {
                        $$payload4.out.push(`<span class="text-xs ml-1">(${escape_html(shortNumber(countValue))})</span>`);
                      }
                    );
                    $$payload4.out.push(`<!--]--></div>`);
                  },
                  $$slots: { default: true }
                });
                $$payload3.out.push(`<!---->`);
              }
              $$payload3.out.push(`<!--]-->`);
            }, content = function($$payload3) {
              const each_array_1 = ensure_array_like(variantResults);
              $$payload3.out.push(`<!--[-->`);
              for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
                let result = each_array_1[index];
                const { name, count } = result;
                $$payload3.out.push(`<!---->`);
                Tabs.Panel($$payload3, {
                  value: name,
                  children: ($$payload4) => {
                    await_block(
                      $$payload4,
                      count,
                      () => {
                        Loading($$payload4, { ring: true, size: "medium" });
                      },
                      (countResult) => {
                        VariantData($$payload4, {
                          count: countResult,
                          onAggregateToggle: aggregateChange(index),
                          get data() {
                            return variantResults[index].data;
                          },
                          set data($$value) {
                            variantResults[index].data = $$value;
                            $$settled = false;
                          },
                          get exportType() {
                            return variantResults[index].exportType;
                          },
                          set exportType($$value) {
                            variantResults[index].exportType = $$value;
                            $$settled = false;
                          }
                        });
                      }
                    );
                    $$payload4.out.push(`<!--]-->`);
                  },
                  $$slots: { default: true }
                });
                $$payload3.out.push(`<!---->`);
              }
              $$payload3.out.push(`<!--]-->`);
            };
            Tabs($$payload2, {
              value: tabGroup,
              onValueChange: (e) => changeTabGroup(e.value),
              list,
              content,
              $$slots: { list: true, content: true }
            });
          }
        } else {
          $$payload2.out.push("<!--[!-->");
          if (variantResults.length === 1) {
            $$payload2.out.push("<!--[-->");
            await_block(
              $$payload2,
              variantResults[0].count,
              () => {
                Loading($$payload2, { ring: true, size: "medium" });
              },
              (countResult) => {
                VariantData($$payload2, {
                  count: countResult,
                  onAggregateToggle: aggregateChange(0),
                  get data() {
                    return variantResults[0].data;
                  },
                  set data($$value) {
                    variantResults[0].data = $$value;
                    $$settled = false;
                  },
                  get exportType() {
                    return variantResults[0].exportType;
                  },
                  set exportType($$value) {
                    variantResults[0].exportType = $$value;
                    $$settled = false;
                  }
                });
              }
            );
            $$payload2.out.push(`<!--]-->`);
          } else {
            $$payload2.out.push("<!--[!-->");
            ErrorAlert($$payload2, {
              title: "Error",
              children: ($$payload3) => {
                $$payload3.out.push(`<!---->No resources were found to query for variant data.`);
              }
            });
          }
          $$payload2.out.push(`<!--]-->`);
        }
        $$payload2.out.push(`<!--]-->`);
      }
    );
    $$payload2.out.push(`<!--]-->`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
function _page($$payload, $$props) {
  push();
  onDestroy(() => store_set(panelOpen, true));
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Variant Explorer</title>`;
  });
  Content($$payload, {
    full: true,
    backUrl: "/explorer",
    backTitle: "Back to Explore",
    children: ($$payload2) => {
      $$payload2.out.push(`<h2 class="text-center clear-both">Variant Explorer</h2> `);
      if (features.explorer.variantExplorer) {
        $$payload2.out.push("<!--[-->");
        VariantExplorer($$payload2);
      } else {
        $$payload2.out.push("<!--[!-->");
        ErrorAlert($$payload2, {
          title: "Error",
          children: ($$payload3) => {
            $$payload3.out.push(`<!---->Variant explorer feature has not been enabled in this environment. Please contact an admin if
      you have any questions.`);
          }
        });
      }
      $$payload2.out.push(`<!--]-->`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D-Y5RT37.js.map
