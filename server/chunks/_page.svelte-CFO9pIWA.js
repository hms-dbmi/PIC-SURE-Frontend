import { x as push, K as escape_html, X as await_block, z as pop, R as ensure_array_like, N as attr, M as attr_class, O as clsx } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding, f as features } from './configuration-CSskKBur.js';
import './User-ByrNDeqq.js';
import 'dompurify';
import './Dictionary-10axK71X.js';
import { h as html } from './html-FW6Ia4bL.js';
import { L as Logo } from './Logo-BFd7HApn.js';
import { E as ErrorAlert } from './ErrorAlert-Sg5STlCJ.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './index2-CvuFLVuQ.js';

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
    $$payload.out += "<!--[-->";
    $$payload.out += `<button type="button"${attr("data-testid", testId)}${attr_class(clsx(className ?? "btn preset-filled-primary-500 m-1"), "svelte-1gvr6jh")}>`;
    if (imageSrc) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<img${attr("src", imageSrc)}${attr("alt", provider.imageAlt)} class="mr-2 h-8"/>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <span>${escape_html(buttonText)}</span></button> `;
    if (helpText && !provider?.alt) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="help-text svelte-1gvr6jh">${html(help)}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button type="button" disabled class="btn preset-filled-primary-500 m-1 w-full" title="No provider selected" aria-label="No provider selected. Please select a provider from the dropdown menu above."><span>Login</span></button>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function _page($$payload, $$props) {
  push();
  const redirectTo = page.url.searchParams.get("redirectTo") || "/";
  const siteName = branding?.applicationName;
  const description = branding?.login.description;
  const openPicsureLinkText = branding?.login.openPicsureLinkText;
  let selectedProvider = void 0;
  $$payload.out += `<section id="logins" class="flex flex-col items-center h-screen w-full text-center place-content-center text-lg"><div id="title-box" class="flex flex-col items-center text-center mb-8 max-w-3/4"><h1 data-testid="login-title" class="mb-6 w-full flex gap-2 items-center justify-center">`;
  Logo($$payload, { class: "flex-none", height: 7.5 });
  $$payload.out += `<!----></h1> <p data-testid="login-description" class="text-2xl">${escape_html(description)}</p></div> `;
  await_block(
    $$payload,
    page.data?.providers,
    () => {
      Loading($$payload, { ring: true, size: "medium" });
    },
    (providers) => {
      $$payload.out += `<div id="login-box" class="w-max mt-2"><header class="flex flex-col items-center">`;
      if (branding?.login?.showSiteName) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div>${escape_html(siteName)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></header> <div class="flex flex-col items-center justify-center"><div id="main-logins" class="grid grid-cols-1 gap-4 mb-4 w-full">`;
      if (providers?.length === 0) {
        $$payload.out += "<!--[-->";
        ErrorAlert($$payload, {
          children: ($$payload2) => {
            $$payload2.out += `<!---->No main authentication providers are registered. Please add them to your
              configuration. Click <a class="anchor" href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure" target="_blank">Here</a> to learn how.`;
          }
        });
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (providers.length > 3) {
        $$payload.out += "<!--[-->";
        const each_array = ensure_array_like(providers);
        $$payload.out += `<select id="login-select" required class="svelte-8v8woc"><option value="" disabled selected class="svelte-8v8woc">Select a provider</option><!--[-->`;
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let provider = each_array[$$index];
          $$payload.out += `<option class="capitalize svelte-8v8woc"${attr("value", provider.name)}>${escape_html(provider.description || provider.name)}</option>`;
        }
        $$payload.out += `<!--]--></select> `;
        LoginButton($$payload, {
          buttonText: "Log In",
          provider: selectedProvider,
          redirectTo,
          helpText: selectedProvider?.helptext,
          class: "btn preset-filled-primary-500 w-full"
        });
        $$payload.out += `<!---->`;
      } else {
        $$payload.out += "<!--[!-->";
        const each_array_1 = ensure_array_like(providers);
        $$payload.out += `<!--[-->`;
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
        $$payload.out += `<!--]-->`;
      }
      $$payload.out += `<!--]--></div> `;
      if (features.login.open) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<a${attr("href", branding?.login?.openPicsureLink || "/")} class="btn preset-outlined-primary-500 text-primary-500 hover:preset-filled-primary-500 hover:text-white mb-4 w-full">${escape_html(openPicsureLinkText)}</a>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      await_block(
        $$payload,
        page.data?.altProviders,
        () => {
          Loading($$payload, { ring: true });
        },
        (altProviders) => {
          const each_array_2 = ensure_array_like(altProviders);
          $$payload.out += `<div id="alt-logins" class="grid grid-cols-1 gap-4 mb-4 w-full"><!--[-->`;
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
          $$payload.out += `<!--]--></div>`;
        }
      );
      $$payload.out += `<!--]--></div></div>`;
    }
  );
  $$payload.out += `<!--]--></section>`;
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CFO9pIWA.js.map
