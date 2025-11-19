import { x as push, N as attr_class, M as escape_html, z as pop, O as attr, Q as stringify } from './index-DMPVr6nO.js';
import { g as goto } from './client2-DxcZr6Tp.js';

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
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<a${attr("data-testid", clean_testid)}${attr("aria-disabled", disabled)}${attr_class(`${stringify(btnStyle)} &[aria-disabled=“true”]:opacity-75 ${stringify(className)}`)}${attr("rel", disabled ? "nofollow" : "")}${attr("href", href)}>`);
    if (angle === "left") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-solid fa-arrow-left mr-3"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    children?.($$payload);
    $$payload.out.push(`<!----> `);
    if (angle === "right") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-solid fa-arrow-right ml-3"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></a>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button${attr("data-testid", clean_testid)} type="button"${attr_class(`${stringify(btnStyle)} disabled:opacity-75 ${stringify(className)}`)}${attr("disabled", disabled, true)}>`);
    if (angle === "left") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-solid fa-arrow-left mr-3"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    children?.($$payload);
    $$payload.out.push(`<!----> `);
    if (angle === "right") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-solid fa-arrow-right ml-3"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></button>`);
  }
  $$payload.out.push(`<!--]-->`);
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
  $$payload.out.push(`<section${attr_class(`main-content ${full ? "w-full" : ""} pb-6 ${className}`)}>`);
  if (backUrl) {
    $$payload.out.push("<!--[-->");
    AngleButton($$payload, {
      name: "back",
      onclick: onBack,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->${escape_html(backTitle)}`);
      }
    });
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (title) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<h1${attr_class(`${stringify(backUrl ? "mb-4" : "my-4")} text-center`)}>${escape_html(title)}</h1>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  if (subtitle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<p class="subtitle mb-4 text-center">${escape_html(subtitle)}</p>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  children?.($$payload);
  $$payload.out.push(`<!----></section>`);
  pop();
}

export { AngleButton as A, Content as C };
//# sourceMappingURL=Content-DMJk6TmZ.js.map
