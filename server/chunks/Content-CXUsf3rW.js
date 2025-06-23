import { x as push, M as attr_class, K as escape_html, z as pop, N as attr, P as stringify } from './index-BKfiikQf.js';
import { g as goto } from './client-HRCS46UK.js';

function AngleButton($$payload, $$props) {
  push();
  const {
    href = "",
    angle = "left",
    variant = "tonal",
    color = "primary",
    disabled = false,
    name = "",
    "data-testid": testid = "",
    class: className = "",
    onclick = () => {
    },
    children
  } = $$props;
  const btnStyle = `btn btn-sm h-fit border preset-${variant}-${color} hover:preset-filled-${color}-500 text-lg`;
  const clean_testid = testid || name.replaceAll(" ", "-").toLowerCase() + "-btn";
  if (href) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<a${attr("data-testid", clean_testid)}${attr("aria-disabled", disabled)}${attr_class(`${stringify(btnStyle)} &[aria-disabled=“true”]:opacity-75 ${stringify(className)}`)}${attr("rel", disabled ? "nofollow" : "")}${attr("href", href)}>`;
    if (angle === "left") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i class="fa-solid fa-arrow-left mr-3"></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    children?.($$payload);
    $$payload.out += `<!----> `;
    if (angle === "right") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i class="fa-solid fa-arrow-right ml-3"></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></a>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button${attr("data-testid", clean_testid)} type="button"${attr_class(`${stringify(btnStyle)} disabled:opacity-75 ${stringify(className)}`)}${attr("disabled", disabled, true)}>`;
    if (angle === "left") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i class="fa-solid fa-arrow-left mr-3"></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    children?.($$payload);
    $$payload.out += `<!----> `;
    if (angle === "right") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i class="fa-solid fa-arrow-right ml-3"></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function Content($$payload, $$props) {
  push();
  const {
    full = false,
    transition = true,
    title = "",
    subtitle = "",
    backUrl = "",
    backTitle = "Back",
    class: className = "",
    backAction = () => {
    },
    children
  } = $$props;
  function onBack() {
    backAction();
    goto();
  }
  $$payload.out += `<section${attr_class(`main-content ${full ? "w-full" : ""} pb-6 ${className}`)}>`;
  if (backUrl) {
    $$payload.out += "<!--[-->";
    AngleButton($$payload, {
      name: "back",
      onclick: onBack,
      children: ($$payload2) => {
        $$payload2.out += `<!---->${escape_html(backTitle)}`;
      }
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (title) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<h1${attr_class(`${stringify(backUrl ? "mb-4" : "my-4")} text-center`)}>${escape_html(title)}</h1>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (subtitle) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="subtitle mb-4 text-center">${escape_html(subtitle)}</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  children?.($$payload);
  $$payload.out += `<!----></section>`;
  pop();
}

export { AngleButton as A, Content as C };
//# sourceMappingURL=Content-CXUsf3rW.js.map
