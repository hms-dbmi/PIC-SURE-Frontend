import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component, e as escape } from './ssr-BRJpAXVH.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import { C as CopyButton } from './CopyButton-BtLZ49Iw.js';
import { u as user, b as getTokenExpirationAsDate, c as getUser, d as getTokenExpiration } from './User-Clr_TyZW.js';

const css = {
  code: "#user-token-container.svelte-15nvjbj.svelte-15nvjbj{display:flex;justify-content:center;width:52rem}#user-token-container.svelte-15nvjbj #user-token.svelte-15nvjbj{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem}#user-token-container.svelte-15nvjbj #user-token section.svelte-15nvjbj{min-width:50rem;grid-template-columns:min-content auto}#user-token-container.svelte-15nvjbj #user-token section label.svelte-15nvjbj{text-align:right;clear:both;float:left;margin-right:15px}",
  map: `{"version":3,"file":"UserToken.svelte","sources":["UserToken.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { getModalStore, getToastStore, ProgressRadial } from \\"@skeletonlabs/skeleton\\";\\nimport CopyButton from \\"$lib/components/buttons/CopyButton.svelte\\";\\nimport ErrorAlert from \\"$lib/components/ErrorAlert.svelte\\";\\nimport { user, getUser, getTokenExpiration, getTokenExpirationAsDate, refreshLongTermToken as refresh } from \\"$lib/stores/User\\";\\nconst modalStore = getModalStore();\\nconst toastStore = getToastStore();\\nlet account = \\"\\";\\nlet placeHolderToken = \\"\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\\\u2022\\";\\nlet revealed = false;\\nlet refreshButtonDisabled = false;\\nlet refreshButtonText = \\"Refresh\\";\\n$: displayedToken = revealed ? $user?.token : placeHolderToken;\\n$: revealButtonText = revealed ? \\"Hide\\" : \\"Reveal\\";\\n$: expires = $user && $user.token ? extractExperationDate($user.token) : 0;\\n$: badge = expires && checkIfExpired();\\n$: account = $user?.email || \\"There was an error retrieving your account.\\";\\nfunction checkIfExpired() {\\n  if (!expires || expires === 0) {\\n    return \\"unknown\\";\\n  }\\n  const daysLeftOnToken = Math.floor((expires - Date.now()) / (1e3 * 60 * 60 * 24));\\n  if (expires < Date.now()) {\\n    return \\"expired\\";\\n  } else if (daysLeftOnToken < 7) {\\n    return \\"expiring soon\\";\\n  } else {\\n    return \\"valid for \\" + daysLeftOnToken + \\" more days\\";\\n  }\\n}\\nfunction confirmRefreshToken() {\\n  modalStore.trigger({\\n    type: \\"confirm\\",\\n    title: \\"Please Confirm\\",\\n    body: \\"Are you sure you wish to invalidate your old token and create a new one?\\",\\n    response: (r) => r && refreshToken()\\n  });\\n}\\nfunction extractExperationDate(token) {\\n  if (!token)\\n    return 0;\\n  try {\\n    return getTokenExpiration(token);\\n  } catch (error) {\\n    console.error(error);\\n    toastStore.trigger({\\n      message: \\"An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.\\",\\n      background: \\"variant-filled-error\\"\\n    });\\n    return 0;\\n  }\\n}\\nasync function refreshToken() {\\n  await refresh().catch((e) => {\\n    console.log(\\"Error: \\", e);\\n    toastStore.trigger({\\n      message: \\"An error occured while refreshing your token. Please try again later. If this problem persists, please contact an administrator.\\",\\n      background: \\"variant-filled-error\\"\\n    });\\n    refreshButtonText = \\"Error\\";\\n  });\\n  refreshButtonText = \\"Refreshed!\\";\\n  refreshButtonDisabled = true;\\n}\\nfunction revealToken() {\\n  revealed = !revealed;\\n}\\n<\/script>\\n\\n<div id=\\"user-token-container\\">\\n  {#await getUser(true, true)}\\n    <ProgressRadial width=\\"w-10\\" value={undefined} />\\n  {:then}\\n    <div id=\\"user-token\\" class=\\"card variant-filled-sureface\\">\\n      <header class=\\"card-header\\"><h4>Personal Access Token</h4></header>\\n      <section class=\\"p-4 grid grid-cols-2 gap-y-2 items-center\\">\\n        <label for=\\"account\\">Account:</label>\\n        <span id=\\"account\\" class=\\"w-full\\">{account}</span>\\n        <label for=\\"token\\">Token:</label>\\n        <div id=\\"token\\">{displayedToken}</div>\\n        <label for=\\"expires\\">Expires:</label>\\n        <div>\\n          <span id=\\"expires\\" class=\\"w-1/3 mr-2\\"\\n            >{getTokenExpirationAsDate($user?.token || '')\\n              ?.toString()\\n              ?.substring(0, 24)}</span\\n          >\\n          {#if badge}\\n            <span id=\\"expires-badge\\" class=\\"badge {badge}\\" data-testid=\\"expires-badge\\"\\n              >{badge.toUpperCase()}</span\\n            >\\n          {/if}\\n        </div>\\n      </section>\\n      <footer class=\\"card-footer mt-2\\">\\n        <CopyButton\\n          itemToCopy={$user.token || ''}\\n          class=\\"variant-ghost-primary hover:variant-filled-primary\\"\\n        />\\n        <button\\n          id=\\"refresh-button\\"\\n          class=\\"btn variant-ghost-primary hover:variant-filled-primary\\"\\n          on:click={confirmRefreshToken}\\n          disabled={refreshButtonDisabled}>{refreshButtonText}</button\\n        >\\n        <button\\n          id=\\"reveal-button\\"\\n          class=\\"btn variant-ghost-primary hover:variant-filled-primary\\"\\n          on:click={revealToken}>{revealButtonText}</button\\n        >\\n      </footer>\\n    </div>\\n  {:catch}\\n    <ErrorAlert\\n      title=\\"An error occured while to retrieving your account. If this problem persists, please\\n    contact an administrator.\\"\\n    />\\n  {/await}\\n</div>\\n\\n<style>\\n  #user-token-container {\\n    display: flex;\\n    justify-content: center;\\n    width: 52rem;\\n  }\\n  #user-token-container #user-token {\\n    display: flex;\\n    flex-direction: column;\\n    align-items: center;\\n    justify-content: center;\\n    padding: 1rem;\\n  }\\n  #user-token-container #user-token section {\\n    min-width: 50rem;\\n    grid-template-columns: min-content auto;\\n  }\\n  #user-token-container #user-token section label {\\n    text-align: right;\\n    clear: both;\\n    float: left;\\n    margin-right: 15px;\\n  }</style>\\n"],"names":[],"mappings":"AAwHE,mDAAsB,CACpB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,KAAK,CAAE,KACT,CACA,oCAAqB,CAAC,0BAAY,CAChC,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,IACX,CACA,oCAAqB,CAAC,WAAW,CAAC,sBAAQ,CACxC,SAAS,CAAE,KAAK,CAChB,qBAAqB,CAAE,WAAW,CAAC,IACrC,CACA,oCAAqB,CAAC,WAAW,CAAC,OAAO,CAAC,oBAAM,CAC9C,UAAU,CAAE,KAAK,CACjB,KAAK,CAAE,IAAI,CACX,KAAK,CAAE,IAAI,CACX,YAAY,CAAE,IAChB"}`
};
let placeHolderToken = "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";
const UserToken = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let displayedToken;
  let revealButtonText;
  let expires;
  let badge;
  let $user, $$unsubscribe_user;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  getModalStore();
  const toastStore = getToastStore();
  let account = "";
  let refreshButtonText = "Refresh";
  function checkIfExpired() {
    if (!expires || expires === 0) {
      return "unknown";
    }
    const daysLeftOnToken = Math.floor((expires - Date.now()) / (1e3 * 60 * 60 * 24));
    if (expires < Date.now()) {
      return "expired";
    } else if (daysLeftOnToken < 7) {
      return "expiring soon";
    } else {
      return "valid for " + daysLeftOnToken + " more days";
    }
  }
  function extractExperationDate(token) {
    if (!token) return 0;
    try {
      return getTokenExpiration(token);
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: "An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.",
        background: "variant-filled-error"
      });
      return 0;
    }
  }
  $$result.css.add(css);
  displayedToken = placeHolderToken;
  revealButtonText = "Reveal";
  expires = $user && $user.token ? extractExperationDate($user.token) : 0;
  badge = expires && checkIfExpired();
  account = $user?.email || "There was an error retrieving your account.";
  $$unsubscribe_user();
  return `<div id="user-token-container" class="svelte-15nvjbj">${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop);
      return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-10", value: void 0 }, {}, {})} `;
    }
    return function() {
      return ` <div id="user-token" class="card variant-filled-sureface svelte-15nvjbj"><header class="card-header" data-svelte-h="svelte-2fmcqd"><h4>Personal Access Token</h4></header> <section class="p-4 grid grid-cols-2 gap-y-2 items-center svelte-15nvjbj"><label for="account" class="svelte-15nvjbj" data-svelte-h="svelte-17ludeq">Account:</label> <span id="account" class="w-full">${escape(account)}</span> <label for="token" class="svelte-15nvjbj" data-svelte-h="svelte-ttagsa">Token:</label> <div id="token">${escape(displayedToken)}</div> <label for="expires" class="svelte-15nvjbj" data-svelte-h="svelte-1bwcbvc">Expires:</label> <div><span id="expires" class="w-1/3 mr-2">${escape(getTokenExpirationAsDate($user?.token || "")?.toString()?.substring(0, 24))}</span> ${badge ? `<span id="expires-badge" class="${"badge " + escape(badge, true)}" data-testid="expires-badge">${escape(badge.toUpperCase())}</span>` : ``}</div></section> <footer class="card-footer mt-2">${validate_component(CopyButton, "CopyButton").$$render(
        $$result,
        {
          itemToCopy: $user.token || "",
          class: "variant-ghost-primary hover:variant-filled-primary"
        },
        {},
        {}
      )} <button id="refresh-button" class="btn variant-ghost-primary hover:variant-filled-primary" ${""}>${escape(refreshButtonText)}</button> <button id="reveal-button" class="btn variant-ghost-primary hover:variant-filled-primary">${escape(revealButtonText)}</button></footer></div> `;
    }();
  }(getUser(true, true))} </div>`;
});

export { UserToken as U };
//# sourceMappingURL=UserToken-Di9tipps.js.map
