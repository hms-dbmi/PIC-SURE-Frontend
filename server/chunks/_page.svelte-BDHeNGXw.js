import { x as push, M as escape_html, Y as await_block, z as pop, S as ensure_array_like, a3 as maybe_selected, O as attr, N as attr_class, P as clsx } from './index-BYsoXH7a.js';
import { p as page } from './index2-DXnmzf54.js';
import { b as branding, f as features } from './configuration-wjj69jIJ.js';
import './User-CGCqDR6a.js';
import './HTML-1Mhr8hI4.js';
import './Dictionary-SO9EnU4C.js';
import { h as html } from './html2-FW6Ia4bL.js';
import { L as Logo } from './Logo-CzJKUKHy.js';
import { E as ErrorAlert } from './ErrorAlert-BJMruCzq.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import '@sveltejs/kit';
import 'dompurify';

function LoginButton($$payload, $$props) {
  push();
  const {
    provider,
    helpText,
    buttonText = "Log In",
    redirectTo = "/",
    class: className = ""
  } = $$props;
  const testId = `login-button-${provider?.name?.toLowerCase()}`;
  let imageSrc = void 0;
  let help = "";
  if (provider?.imagesrc) {
    imageSrc = "./" + provider.imagesrc;
  }
  if (provider) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button type="button"${attr("data-testid", testId)}${attr_class(clsx(className ?? "btn preset-filled-primary-500 m-1"), "svelte-18ne8hb")}>`);
    if (imageSrc) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<img${attr("src", imageSrc)}${attr("alt", provider.imageAlt)} class="mr-2 h-8"/>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <span>${escape_html(buttonText)}</span></button> `);
    if (helpText && !provider?.alt) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="help-text svelte-18ne8hb">${html(help)}</div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button type="button" disabled class="btn preset-filled-primary-500 m-1 w-full" title="No provider selected" aria-label="No provider selected. Please select a provider from the dropdown menu above."><span>Login</span></button>`);
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
function _page($$payload, $$props) {
  push();
  const redirectTo = page.url.searchParams.get("redirectTo") || "/";
  const siteName = branding?.applicationName;
  const description = branding?.login.description;
  const openPicsureLinkText = branding?.login.openPicsureLinkText;
  let selected = "";
  let selectedProvider = void 0;
  $$payload.out.push(`<section id="logins" class="flex flex-col items-center h-screen w-full text-center place-content-center text-lg"><div id="title-box" class="flex flex-col items-center text-center mb-8 max-w-3/4"><h1 data-testid="login-title" class="mb-6 w-full flex gap-2 items-center justify-center">`);
  Logo($$payload, { class: "flex-none", height: 7.5 });
  $$payload.out.push(`<!----></h1> <p data-testid="login-description" class="text-2xl">${escape_html(description)}</p></div> `);
  await_block(
    $$payload,
    page.data?.providers,
    () => {
      Loading($$payload, { ring: true, size: "medium" });
    },
    (providers) => {
      $$payload.out.push(`<div id="login-box" class="w-max mt-2"><header class="flex flex-col items-center">`);
      if (branding?.login?.showSiteName) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div>${escape_html(siteName)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></header> <div class="flex flex-col items-center justify-center"><div id="main-logins" class="grid grid-cols-1 gap-4 mb-4 w-full">`);
      if (providers?.length === 0) {
        $$payload.out.push("<!--[-->");
        ErrorAlert($$payload, {
          children: ($$payload2) => {
            $$payload2.out.push(`<!---->No main authentication providers are registered. Please add them to your
              configuration. Click <a class="anchor" href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure" target="_blank">Here</a> to learn how.`);
          }
        });
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (providers.length > 3) {
        $$payload.out.push("<!--[-->");
        const each_array = ensure_array_like(providers);
        $$payload.out.push(`<select id="login-select" required class="svelte-1p89lhy">`);
        $$payload.select_value = selected;
        $$payload.out.push(`<option value=""${maybe_selected($$payload, "")} disabled selected class="svelte-1p89lhy">Select a provider</option><!--[-->`);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let provider = each_array[$$index];
          $$payload.out.push(`<option class="capitalize svelte-1p89lhy"${attr("value", provider.name)}${maybe_selected($$payload, provider.name)}>${escape_html(provider.description || provider.name)}</option>`);
        }
        $$payload.out.push(`<!--]-->`);
        $$payload.select_value = void 0;
        $$payload.out.push(`</select> `);
        LoginButton($$payload, {
          buttonText: "Log In",
          provider: selectedProvider,
          redirectTo,
          helpText: selectedProvider?.helptext,
          class: "btn preset-filled-primary-500 w-full"
        });
        $$payload.out.push(`<!---->`);
      } else {
        $$payload.out.push("<!--[!-->");
        const each_array_1 = ensure_array_like(providers);
        $$payload.out.push(`<!--[-->`);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let provider = each_array_1[$$index_1];
          LoginButton($$payload, {
            buttonText: provider.description || provider.name,
            provider,
            redirectTo,
            helpText: provider.helptext,
            class: "btn preset-filled-primary-500 w-full"
          });
        }
        $$payload.out.push(`<!--]-->`);
      }
      $$payload.out.push(`<!--]--></div> `);
      if (features.login.open) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<a${attr("href", branding?.login?.openPicsureLink || "/")} class="btn preset-outlined-primary-500 text-primary-500 hover:preset-filled-primary-500 hover:text-white mb-4 w-full">${escape_html(openPicsureLinkText)}</a>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      await_block(
        $$payload,
        page.data?.altProviders,
        () => {
          Loading($$payload, { ring: true });
        },
        (altProviders) => {
          const each_array_2 = ensure_array_like(altProviders);
          $$payload.out.push(`<div id="alt-logins" class="grid grid-cols-1 gap-4 mb-4 w-full"><!--[-->`);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let provider = each_array_2[$$index_2];
            LoginButton($$payload, {
              buttonText: provider.description || provider.name,
              provider,
              redirectTo,
              helpText: provider.helptext,
              class: "btn-sm preset-outlined-primary-500 text-primary-500 hover:preset-filled-primary-500 hover:text-white"
            });
          }
          $$payload.out.push(`<!--]--></div>`);
        }
      );
      $$payload.out.push(`<!--]--></div></div>`);
    }
  );
  $$payload.out.push(`<!--]--></section>`);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BDHeNGXw.js.map
