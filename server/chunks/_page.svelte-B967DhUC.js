import { a as subscribe, m as is_promise, n as noop, h as null_to_empty } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, v as validate_component, e as escape, b as each, a as add_attribute } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './Search-CP8PrEsw.js';
import { g as getToastStore } from './stores2-DrFt-twL.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressRadial } from './ProgressRadial-B9eVk9uU.js';
import { L as Logo } from './Logo-C9iXD67A.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './dictionary-DTJwdnk5.js';
import './User-BLfUZEEV.js';
import './index-CvuFLVuQ.js';

const css$1 = {
  code: ".help-text.svelte-12n96ld{font-size:0.8rem;color:var(--color-gray-500)}",
  map: '{"version":3,"file":"LoginButton.svelte","sources":["LoginButton.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { createInstance } from \\"$lib/AuthProviderRegistry\\";\\nimport { resetSearch } from \\"$lib/stores/Search\\";\\nexport let buttonText = \\"Log In\\";\\nexport let redirectTo = \\"/\\";\\nexport let provider;\\nexport let helpText;\\n$: testId = `login-button-${provider.name?.toLowerCase()}`;\\nlet login = async (redirectTo2, providerType) => {\\n  let instance = await createInstance(provider);\\n  instance.login(redirectTo2, providerType).then(() => {\\n    resetSearch();\\n  });\\n};\\nlet imageSrc = void 0;\\nif (provider.imagesrc) {\\n  imageSrc = \\"./\\" + provider.imagesrc;\\n}\\n<\/script>\\n\\n<button\\n  type=\\"button\\"\\n  data-testid={testId}\\n  class={$$props.class ?? \'btn variant-filled-primary m-1\'}\\n  on:click={() => login(redirectTo, provider.type)}\\n>\\n  {#if imageSrc}\\n    <img src={imageSrc} alt={provider.imageAlt} class=\\"mr-2 h-8\\" />\\n  {/if}\\n  {buttonText}\\n</button>\\n\\n{#if helpText && !provider.alt}\\n  <!-- eslint-disable-next-line svelte/no-at-html-tags -->\\n  <div class=\\"help-text\\">{@html helpText}</div>\\n{/if}\\n\\n<style>\\n  .help-text {\\n    font-size: 0.8rem;\\n    color: var(--color-gray-500);\\n  }</style>\\n"],"names":[],"mappings":"AAqCE,yBAAW,CACT,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IAAI,gBAAgB,CAC7B"}'
};
const LoginButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let testId;
  let { buttonText = "Log In" } = $$props;
  let { redirectTo = "/" } = $$props;
  let { provider } = $$props;
  let { helpText } = $$props;
  let imageSrc = void 0;
  if (provider.imagesrc) {
    imageSrc = "./" + provider.imagesrc;
  }
  if ($$props.buttonText === void 0 && $$bindings.buttonText && buttonText !== void 0) $$bindings.buttonText(buttonText);
  if ($$props.redirectTo === void 0 && $$bindings.redirectTo && redirectTo !== void 0) $$bindings.redirectTo(redirectTo);
  if ($$props.provider === void 0 && $$bindings.provider && provider !== void 0) $$bindings.provider(provider);
  if ($$props.helpText === void 0 && $$bindings.helpText && helpText !== void 0) $$bindings.helpText(helpText);
  $$result.css.add(css$1);
  testId = `login-button-${provider.name?.toLowerCase()}`;
  return `<button type="button"${add_attribute("data-testid", testId, 0)} class="${escape(null_to_empty($$props.class ?? "btn variant-filled-primary m-1"), true) + " svelte-12n96ld"}">${imageSrc ? `<img${add_attribute("src", imageSrc, 0)}${add_attribute("alt", provider.imageAlt, 0)} class="mr-2 h-8">` : ``} ${escape(buttonText)}</button> ${helpText && !provider.alt ? ` <div class="help-text svelte-12n96ld"><!-- HTML_TAG_START -->${helpText}<!-- HTML_TAG_END --></div>` : ``}`;
});
const css = {
  code: ".auth-warning.svelte-u0znbd{width:239px}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { page } from \\"$app/stores\\";\\nimport LoginButton from \\"$lib/components/LoginButton.svelte\\";\\nimport { ProgressRadial } from \\"@skeletonlabs/skeleton\\";\\nimport Logo from \\"$lib/components/Logo.svelte\\";\\nimport { branding, features } from \\"$lib/configuration\\";\\nimport { fly } from \\"svelte/transition\\";\\nimport { browser } from \\"$app/environment\\";\\nimport { getToastStore } from \\"@skeletonlabs/skeleton\\";\\nimport { onMount } from \\"svelte\\";\\nconst toastStore = getToastStore();\\nconst redirectTo = $page.url.searchParams.get(\\"redirectTo\\") || \\"/\\";\\nconst siteName = branding?.applicationName;\\nconst description = branding?.login.description;\\nconst openPicsureLinkText = branding?.login.openPicsureLinkText;\\nlet logoutReason;\\nonMount(() => {\\n  if (browser) {\\n    logoutReason = sessionStorage.getItem(\\"logout-reason\\");\\n    if (logoutReason) {\\n      toastStore.trigger({\\n        message: logoutReason,\\n        background: \\"variant-filled-error\\"\\n      });\\n      sessionStorage.removeItem(\\"logout-reason\\");\\n    }\\n  }\\n});\\nlet selected;\\n$: selectedProvider = selected ? $page.data?.providers?.find((provider) => provider.name === selected) : void 0;\\n<\/script>\\n\\n<section\\n  id=\\"logins\\"\\n  class=\\"flex flex-col items-center h-screen w-full text-center place-content-center text-lg\\"\\n  in:fly={{ duration: 600, x: '100%' }}\\n>\\n  <div id=\\"title-box\\" class=\\"flex flex-col items-center text-center mb-8\\">\\n    <h1 data-testid=\\"login-title\\" class=\\"mb-6 w-full flex gap-2 items-center justify-center\\">\\n      <Logo class=\\"flex-none\\" height={4} />\\n    </h1>\\n    <p data-testid=\\"login-description\\" class=\\"max-w-16 text-2xl\\">{description}</p>\\n  </div>\\n  {#await $page.data?.providers}\\n    <ProgressRadial width=\\"w-10\\" value={undefined} />\\n  {:then providers}\\n    <div id=\\"login-box\\" class=\\"w-max mt-2\\">\\n      <header class=\\"flex flex-col items-center\\">\\n        {#if branding?.login?.showSiteName}\\n          <div>{siteName}</div>\\n        {/if}\\n      </header>\\n      <div class=\\"flex flex-col items-center justify-center\\">\\n        <div id=\\"main-logins\\" class=\\"grid grid-cols-1 gap-4 w-full\\">\\n          {#if providers?.length === 0}\\n            <aside class=\\"auth-warning alert variant-ghost-warning\\">\\n              <div class=\\"alert-message\\">\\n                No main authentication providers are registered. Please add them to your\\n                configuration. Click <a\\n                  class=\\"anchor\\"\\n                  href=\\"https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure\\"\\n                  target=\\"_blank\\">Here</a\\n                >\\n                to learn how.\\n              </div>\\n            </aside>\\n          {/if}\\n          {#if providers.length > 3}\\n            <select bind:value={selected}>\\n              {#each providers as provider}\\n                <option class=\\"capitalize\\" value={provider.name}\\n                  >{provider.description || provider.name}</option\\n                >\\n              {/each}\\n            </select>\\n            {#if selectedProvider}\\n              <LoginButton\\n                buttonText=\\"Log In\\"\\n                provider={selectedProvider}\\n                {redirectTo}\\n                helpText={selectedProvider.helptext}\\n                class=\\"btn variant-outline-primary m-1 mt-2 w-full\\"\\n              />\\n            {/if}\\n          {:else}\\n            {#each providers as provider}\\n              <LoginButton\\n                buttonText={provider.description || provider.name}\\n                {provider}\\n                {redirectTo}\\n                helpText={provider.helptext}\\n                class=\\"btn variant-outline-primary text-primary-500 w-full\\"\\n              />\\n            {/each}\\n          {/if}\\n        </div>\\n        {#if features.login.open}\\n          <a\\n            href={branding?.login?.openPicsureLink || '/'}\\n            class=\\"btn variant-outline-primary hover:variant-filled-primary text-primary-500 m-1 mt-2 w-full mb-1\\"\\n            >{openPicsureLinkText}</a\\n          >\\n        {/if}\\n        {#await $page.data?.altProviders}\\n          <ProgressRadial width=\\"w-3\\" value={undefined} />\\n        {:then altProviders}\\n          {#each altProviders as provider}\\n            <LoginButton\\n              buttonText={provider.description || provider.name}\\n              {provider}\\n              {redirectTo}\\n              helpText={provider.helptext}\\n              class=\\"btn variant-outline-tertiary hover:variant-filled-tertiary m-1 w-full last:mb-4\\"\\n            />\\n          {/each}\\n        {/await}\\n      </div>\\n    </div>\\n  {/await}\\n</section>\\n\\n<style>\\n  .auth-warning {\\n    width: 239px;\\n  }</style>\\n"],"names":[],"mappings":"AAyHE,2BAAc,CACZ,KAAK,CAAE,KACT"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let selectedProvider;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  getToastStore();
  const redirectTo = $page.url.searchParams.get("redirectTo") || "/";
  const siteName = branding?.applicationName;
  const description = branding?.login.description;
  const openPicsureLinkText = branding?.login.openPicsureLinkText;
  $$result.css.add(css);
  selectedProvider = void 0;
  $$unsubscribe_page();
  return `<section id="logins" class="flex flex-col items-center h-screen w-full text-center place-content-center text-lg"><div id="title-box" class="flex flex-col items-center text-center mb-8"><h1 data-testid="login-title" class="mb-6 w-full flex gap-2 items-center justify-center">${validate_component(Logo, "Logo").$$render($$result, { class: "flex-none", height: 4 }, {}, {})}</h1> <p data-testid="login-description" class="max-w-16 text-2xl">${escape(description)}</p></div> ${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop);
      return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-10", value: void 0 }, {}, {})} `;
    }
    return function(providers) {
      return ` <div id="login-box" class="w-max mt-2"><header class="flex flex-col items-center">${branding?.login?.showSiteName ? `<div>${escape(siteName)}</div>` : ``}</header> <div class="flex flex-col items-center justify-center"><div id="main-logins" class="grid grid-cols-1 gap-4 w-full">${providers?.length === 0 ? `<aside class="auth-warning alert variant-ghost-warning svelte-u0znbd" data-svelte-h="svelte-1h3zug2"><div class="alert-message">No main authentication providers are registered. Please add them to your
                configuration. Click <a class="anchor" href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure" target="_blank">Here</a>
                to learn how.</div></aside>` : ``} ${providers.length > 3 ? `<select>${each(providers, (provider) => {
        return `<option class="capitalize"${add_attribute("value", provider.name, 0)}>${escape(provider.description || provider.name)}</option>`;
      })}</select> ${selectedProvider ? `${validate_component(LoginButton, "LoginButton").$$render(
        $$result,
        {
          buttonText: "Log In",
          provider: selectedProvider,
          redirectTo,
          helpText: selectedProvider.helptext,
          class: "btn variant-outline-primary m-1 mt-2 w-full"
        },
        {},
        {}
      )}` : ``}` : `${each(providers, (provider) => {
        return `${validate_component(LoginButton, "LoginButton").$$render(
          $$result,
          {
            buttonText: provider.description || provider.name,
            provider,
            redirectTo,
            helpText: provider.helptext,
            class: "btn variant-outline-primary text-primary-500 w-full"
          },
          {},
          {}
        )}`;
      })}`}</div> ${`<a${add_attribute("href", branding?.login?.openPicsureLink || "/", 0)} class="btn variant-outline-primary hover:variant-filled-primary text-primary-500 m-1 mt-2 w-full mb-1">${escape(openPicsureLinkText)}</a>`} ${function(__value2) {
        if (is_promise(__value2)) {
          __value2.then(null, noop);
          return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-3", value: void 0 }, {}, {})} `;
        }
        return function(altProviders) {
          return ` ${each(altProviders, (provider) => {
            return `${validate_component(LoginButton, "LoginButton").$$render(
              $$result,
              {
                buttonText: provider.description || provider.name,
                provider,
                redirectTo,
                helpText: provider.helptext,
                class: "btn variant-outline-tertiary hover:variant-filled-tertiary m-1 w-full last:mb-4"
              },
              {},
              {}
            )}`;
          })} `;
        }(__value2);
      }($page.data?.altProviders)}</div></div> `;
    }(__value);
  }($page.data?.providers)} </section>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-B967DhUC.js.map
