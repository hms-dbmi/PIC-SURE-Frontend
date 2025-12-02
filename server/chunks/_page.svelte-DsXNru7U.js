import { x as push, V as copy_payload, W as assign_payload, z as pop, S as ensure_array_like, a8 as head, N as attr_class, M as escape_html, O as attr, Q as stringify, U as store_get, X as unsubscribe_stores, Y as await_block } from './index-C9dy-hDW.js';
import { b as branding, f as features } from './configuration-BAm0JRx1.js';
import { g as goto } from './client2-BVaV_p61.js';
import { S as Searchbox } from './Searchbox-CmXpWjCV.js';
import { o as derived, w as writable } from './utils-D3IkxnGP.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';
import './index2-CFqWCRce.js';
import './Dictionary-Cym6J1qH.js';
import './Filter-DSKDPPqy.js';
import './Export-DV6CwdT5.js';
import { S as StatPromise, c as countResult } from './StatBuilder-C-7IIq7L.js';
import { s as sanitizeHTML } from './HTML-1Mhr8hI4.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import { H as HelpInfoPopup } from './HelpInfoPopup-DPAVvdpu.js';
import { h as html } from './html2-FW6Ia4bL.js';
import '@sveltejs/kit/internal';
import 'uuid';
import 'dompurify';
import './Popover-eIX_ze36.js';
import '@floating-ui/dom';

const statData = writable([]);
const stats = derived(
  statData,
  ($s) => $s.filter((stat) => !stat.auth)
);
const authStats = derived(
  statData,
  ($s) => $s.filter((stat) => stat.auth)
);
function Stat($$payload, $$props) {
  push();
  var $$store_subs;
  let { stats: stats2, description, auth = false } = $$props;
  let authString = auth ? "auth" : "open";
  let width = store_get($$store_subs ??= {}, "$stats", stats2).length > 4 ? "w-full" : "w-1/2";
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12"
  };
  const gridClass = gridClasses[store_get($$store_subs ??= {}, "$stats", stats2).length] || "grid-cols-1";
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$stats", stats2));
  $$payload.out.push(`<div${attr("data-testid", `data-summary-${stringify(authString)}`)} class="w-full flex flex-col items-center"><div class="w-2/4">${html(sanitizeHTML(description))}</div> <div${attr_class(`grid ${stringify(gridClass)} grid-flow-col justify-center p-2 my-2 gap-y-9 ${stringify(width)}`)}><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let stat = each_array[$$index];
    $$payload.out.push(`<div class="p-2 not-last:border-r border-surface-500"><div${attr("data-testid", `value-${stringify(authString)}-${stringify(stat.key)}-${stringify(stat.label)}`)} class="flex flex-col justify-center items-center text-2xl">`);
    await_block(
      $$payload,
      Promise.allSettled(StatPromise.list(stat).map(({ promise }) => promise)),
      () => {
        Loading($$payload, { ring: true, size: "mini" });
      },
      (counts) => {
        const statPromises = StatPromise.list(stat);
        const countResults = counts.map((result, index) => ({ ...result, resourceName: statPromises[index].resourceName }));
        $$payload.out.push(`<div class="flex flex-row h-full"><strong class="p-1 mb-3">${escape_html(countResult(countResults.filter(StatPromise.fullfiled).map((result) => result.status === "fulfilled" ? result.value : 0)))}</strong> `);
        if (features.federated) {
          $$payload.out.push("<!--[-->");
          if (countResults.some(StatPromise.rejected)) {
            $$payload.out.push("<!--[-->");
            const failedSites = countResults.filter(StatPromise.rejected).map((result) => result.resourceName).join(", ");
            HelpInfoPopup($$payload, {
              type: "exclamation",
              color: "warning",
              id: "result-count-error",
              size: "text-xs",
              popoverSize: "text-sm",
              text: `The following sites are not included as they did not return patient counts: ${stringify(failedSites)}.`
            });
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]-->`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div> `);
        if (!features.federated && counts.some(StatPromise.rejected)) {
          $$payload.out.push("<!--[-->");
          HelpInfoPopup($$payload, {
            type: "exclamation",
            color: "warning",
            id: "result-count-error",
            text: "We're having trouble fetching some data points right now. Please try again later."
          });
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]-->`);
      }
    );
    $$payload.out.push(`<!--]--></div> <p>${escape_html(stat.label)}</p></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Stats($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out.push(`<section class="flex flex-col items-center w-full p-4 my-3 bg-surface-100-900"><h2 class="m-2">Data Summary</h2> `);
  if (store_get($$store_subs ??= {}, "$authStats", authStats).length > 0) {
    $$payload.out.push("<!--[-->");
    Stat($$payload, {
      stats: authStats,
      auth: true,
      description: branding?.landing?.authExplanation
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (store_get($$store_subs ??= {}, "$stats", stats).length > 0) {
    $$payload.out.push("<!--[-->");
    Stat($$payload, { stats, description: branding?.landing?.explanation });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></section>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function _page($$payload, $$props) {
  push();
  let searchTerm = "";
  function search() {
    goto();
  }
  const actionsToDisplay = branding?.landing?.actions.filter((action) => {
    {
      return action.isOpen || !action.showIfLoggedIn;
    }
  });
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array = ensure_array_like(actionsToDisplay);
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>${escape_html(branding.applicationName)}</title>`;
    });
    $$payload2.out.push(`<div id="landing" class="flex flex-wrap flex-col justify-evenly text-center items-center w-full h-full mt-8"><section id="search-section" class="flex flex-col text-center items-center my-auto w-2/3">`);
    Searchbox($$payload2, {
      placeholder: branding?.landing?.searchPlaceholder,
      search,
      get searchTerm() {
        return searchTerm;
      },
      set searchTerm($$value) {
        searchTerm = $$value;
        $$settled = false;
      }
    });
    $$payload2.out.push(`<!----></section> <section id="actions-section" class="flex flex-row justify-evenly items-center mb-auto w-2/3"><!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let { title, description, icon, url, btnText } = each_array[$$index];
      $$payload2.out.push(`<div${attr_class(`flex flex-col items-center w-1/${stringify(actionsToDisplay?.length || 3)}`)}><div class="text-3xl my-1">${escape_html(title)}</div> <i${attr_class(`text-[5rem] my-3 text-secondary-600-400 ${stringify(icon)}`)}></i> <div class="subtitle my-3">${escape_html(description)}</div> <a${attr("data-testid", `landing-action-${stringify(title)}-btn`)}${attr("href", url)} class="btn preset-filled-primary-500">${escape_html(btnText)}</a></div>`);
    }
    $$payload2.out.push(`<!--]--></section> `);
    Stats($$payload2);
    $$payload2.out.push(`<!----></div>`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DsXNru7U.js.map
