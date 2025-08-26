import { x as push, T as store_get, X as await_block, K as escape_html, M as attr_class, W as unsubscribe_stores, z as pop, P as stringify } from './index-C5NonOVO.js';
import { u as user, am as getTokenExpiration, t as toaster, an as getTokenExpirationAsDate, ao as getUser, ap as refreshLongTermToken } from './User-ByrNDeqq.js';
import { d as debounce } from './Forms-DH01zSCL.js';
import { C as CopyButton } from './CopyButton-iVakjEWf.js';
import { M as Modal_1 } from './Modal-tsNejdoN.js';
import { L as Loading } from './Loading-Drx6gnkR.js';

function UserToken($$payload, $$props) {
  push();
  var $$store_subs;
  const defaultRefreshText = "Refresh";
  const placeHolderToken = "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";
  let account = store_get($$store_subs ??= {}, "$user", user)?.email || "There was an error retrieving your account.";
  let refreshButtonDisabled = false;
  let refreshPromise = Promise.resolve(defaultRefreshText);
  let token = store_get($$store_subs ??= {}, "$user", user)?.token;
  let expires = token ? extractExperationDate(token) : 0;
  let badge = expires && checkIfExpired();
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
  function extractExperationDate(token2) {
    if (!token2) return 0;
    try {
      return getTokenExpiration(token2);
    } catch (error) {
      console.error(error);
      toaster.error({
        title: "An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator."
      });
      return 0;
    }
  }
  function refreshToken() {
    refreshButtonDisabled = true;
    refreshPromise = refreshLongTermToken().then(() => "Refreshed!").catch((e) => {
      console.log("Error: ", e);
      toaster.error({
        title: "An error occured while refreshing your token. Please try again later. If this problem persists, please contact an administrator."
      });
      return "Error";
    }).finally(debounce(
      () => {
        refreshPromise = Promise.resolve("Refresh");
        refreshButtonDisabled = false;
      },
      5e3
    ));
  }
  $$payload.out += `<div id="user-token-container" class="svelte-nvw5lv">`;
  await_block(
    $$payload,
    getUser(true, true),
    () => {
      Loading($$payload, { ring: true, size: "medium" });
    },
    () => {
      $$payload.out += `<div id="user-token" class="card preset-filled-sureface-500 svelte-nvw5lv"><header class="card-header"><h4>Personal Access Token</h4></header> <section class="p-4 grid grid-cols-2 gap-y-2 items-center svelte-nvw5lv"><label for="account" class="svelte-nvw5lv">Account:</label> <span id="account" class="w-full">${escape_html(account)}</span> <label for="token" class="svelte-nvw5lv">Token:</label> <div id="token">${escape_html(placeHolderToken)}</div> <label for="expires" class="svelte-nvw5lv">Expires:</label> <div><span id="expires" class="w-1/3 mr-2">${escape_html(getTokenExpirationAsDate(store_get($$store_subs ??= {}, "$user", user)?.token || "")?.toString()?.substring(0, 24))}</span> `;
      if (badge) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span id="expires-badge"${attr_class(`badge ${stringify(badge)}`)} data-testid="expires-badge">${escape_html(badge.toUpperCase())}</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></section> <footer class="card-footer mt-2">`;
      CopyButton($$payload, {
        itemToCopy: store_get($$store_subs ??= {}, "$user", user).token || "",
        class: "preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
      });
      $$payload.out += `<!----> `;
      {
        let trigger = function($$payload2) {
          await_block(
            $$payload2,
            refreshPromise,
            () => {
              Loading($$payload2, {
                ring: true,
                size: "micro",
                label: "Refreshing"
              });
            },
            (text) => {
              $$payload2.out += `${escape_html(text)}`;
            }
          );
          $$payload2.out += `<!--]-->`;
        };
        Modal_1($$payload, {
          "data-testid": "refresh",
          title: "Please Confirm",
          onconfirm: refreshToken,
          disabled: refreshButtonDisabled,
          triggerBase: "btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500",
          footerButtons: true,
          withDefault: true,
          trigger,
          children: ($$payload2) => {
            $$payload2.out += `<!---->Are you sure you wish to invalidate your old token and create a new one?`;
          },
          $$slots: { trigger: true, default: true }
        });
      }
      $$payload.out += `<!----> <button data-testid="reveal-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">${escape_html("Reveal")}</button></footer></div>`;
    }
  );
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { UserToken as U };
//# sourceMappingURL=UserToken-B3RpHJ0L.js.map
