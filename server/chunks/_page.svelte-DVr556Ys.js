import { x as push, a1 as head, z as pop, K as escape_html, N as attr, T as store_get, W as unsubscribe_stores } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { W as isAdmin } from './User-ByrNDeqq.js';
import './Roles-CWZH5hrE.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './index2-CvuFLVuQ.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let studyId = "";
  let consentCode = "";
  let isSubmitting = false;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New Role</title>`;
  });
  Content($$payload, {
    title: "Manual Role",
    children: ($$payload2) => {
      $$payload2.out += `<form class="flex flex-col items-center m-8"><fieldset data-testid="manual-role-form" class="grid gap-4 my-3"${attr("disabled", !store_get($$store_subs ??= {}, "$isAdmin", isAdmin) || isSubmitting, true)}><label class="label required"><span>Study with Consent Code (e.g. phs001514):</span> <input type="text"${attr("value", studyId)} class="input" required minlength="1" maxlength="255" pattern="[a-zA-Z0-9._-]+" title="Only letters, numbers, dots, underscores and hyphens are allowed"/></label> <label class="label"><span>Consent Code (optional, c followed by numbers):</span> <input type="text"${attr("value", consentCode)} class="input" minlength="1" maxlength="255" pattern="(\\c\\d+)?" title="Consent code must be empty or a c followed by numbers (e.g. c1, c23)"/></label> <div class="flex flex-row justify-center"><button class="btn preset-filled-primary-500 max-w-fit" type="submit"${attr("disabled", isSubmitting, true)}>${escape_html("Add Role")}</button></div></fieldset></form>`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DVr556Ys.js.map
