import { x as push, U as copy_payload, V as assign_payload, z as pop, R as ensure_array_like, a1 as head, M as attr_class, K as escape_html, N as attr, P as stringify, T as store_get, W as unsubscribe_stores, _ as await_block } from './index-BKfiikQf.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { g as goto } from './client-HRCS46UK.js';
import { S as Searchbox } from './Searchbox-D0oQSAkw.js';
import { i as derived, w as writable } from './exports-CKriv3vT.js';
import './index2-CvuFLVuQ.js';
import './User-DPh8mmLT.js';
import './Filter-4LYIgLGB.js';
import './Export-cYFOztwS.js';
import './Dictionary-DkgC0mju.js';
import { L as Loading } from './Loading-DKkczq09.js';
import { h as html } from './html-FW6Ia4bL.js';
import { E as ErrorAlert } from './ErrorAlert-MgcOEbFF.js';
import './stores-DhwnhD2d.js';
import './index-BB9JrA1L.js';
import './machine.svelte-D_VZYMjT.js';

const hasError = writable(false);
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
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$stats", stats2));
  $$payload.out += `<div${attr("data-testid", `data-summary-${stringify(authString)}`)} class="w-full flex flex-col items-center"><div class="w-2/4">${html(description)}</div> <div${attr_class(`grid grid-cols-${stringify(store_get($$store_subs ??= {}, "$stats", stats2).length)} grid-flow-col justify-center p-4 my-4 gap-y-9 ${stringify(store_get($$store_subs ??= {}, "$stats", stats2).length > 4 ? "w-full" : "w-1/2")}`)}><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let stat = each_array[$$index];
    $$payload.out += `<div class="p-4 not-last:border-r border-surface-500"><div${attr("data-testid", `value-${stringify(authString)}-${stringify(stat.key)}-${stringify(stat.label)}`)} class="flex flex-col justify-center items-center text-2xl">`;
    await_block(
      $$payload,
      stat.value,
      () => {
        Loading($$payload, { ring: true, size: "mini" });
      },
      (value) => {
        $$payload.out += `<strong class="p-1 mb-3">${escape_html(value && value.toLocaleString())}</strong>`;
      }
    );
    $$payload.out += `<!--]--></div> <p>${escape_html(stat.label)}</p></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Stats($$payload, $$props) {
  push();
  var $$store_subs;
  $$payload.out += `<section class="flex flex-col items-center w-full p-4 bg-surface-100-900"><h2 class="m-4">Data Summary</h2> `;
  if (store_get($$store_subs ??= {}, "$authStats", authStats).length > 0) {
    $$payload.out += "<!--[-->";
    Stat($$payload, {
      stats: authStats,
      auth: true,
      description: branding?.landing?.authExplanation
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$stats", stats).length > 0) {
    $$payload.out += "<!--[-->";
    Stat($$payload, {
      stats,
      description: branding?.landing?.explanation
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$hasError", hasError)) {
    $$payload.out += "<!--[-->";
    ErrorAlert($$payload, {
      "data-testid": "landing-error",
      solid: true,
      children: ($$payload2) => {
        $$payload2.out += `<!---->We're having trouble fetching some data points right now. Please try again later.`;
      }
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section>`;
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
    $$payload2.out += `<div id="landing" class="flex flex-wrap flex-col justify-evenly text-center items-center w-full h-full mt-8"><section id="search-section" class="flex flex-col text-center items-center my-4 mt-auto w-2/3">`;
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
    $$payload2.out += `<!----></section> <section id="actions-section" class="flex flex-row justify-evenly items-center w-2/3 mt-auto mb-8"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let { title, description, icon, url, btnText } = each_array[$$index];
      $$payload2.out += `<div${attr_class(`flex flex-col items-center w-1/${stringify(actionsToDisplay?.length || 3)}`)}><div class="text-3xl my-1">${escape_html(title)}</div> <i${attr_class(`text-[5rem] my-3 text-secondary-600-400 ${stringify(icon)}`)}></i> <div class="subtitle my-3">${escape_html(description)}</div> <a${attr("data-testid", `landing-action-${stringify(title)}-btn`)}${attr("href", url)} class="btn preset-filled-primary-500">${escape_html(btnText)}</a></div>`;
    }
    $$payload2.out += `<!--]--></section> `;
    Stats($$payload2);
    $$payload2.out += `<!----></div>`;
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
//# sourceMappingURL=_page.svelte-tu15ZCJn.js.map
