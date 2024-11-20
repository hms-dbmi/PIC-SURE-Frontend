import { s as setContext, p as compute_rest_props, f as getContext, a as subscribe, k as createEventDispatcher, m as compute_slots } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, a as add_attribute, s as spread, g as escape_attribute_value, f as escape_object } from './ssr-BRJpAXVH.js';
import { w as writable } from './index2-BVONNh3m.js';

const storeHighlightJs = writable(void 0);
const cBase$2 = "space-y-4";
const cList = "flex overflow-x-auto hide-scrollbar";
const cPanel = "";
const TabGroup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let classesList;
  let classesPanel;
  let $$slots = compute_slots(slots);
  let { justify = "justify-start" } = $$props;
  let { border = "border-b border-surface-400-500-token" } = $$props;
  let { active = "border-b-2 border-surface-900-50-token" } = $$props;
  let { hover = "hover:variant-soft" } = $$props;
  let { flex = "flex-none" } = $$props;
  let { padding = "px-4 py-2" } = $$props;
  let { rounded = "rounded-tl-container-token rounded-tr-container-token" } = $$props;
  let { spacing = "space-y-1" } = $$props;
  let { regionList = "" } = $$props;
  let { regionPanel = "" } = $$props;
  let { labelledby = "" } = $$props;
  let { panel = "" } = $$props;
  setContext("active", active);
  setContext("hover", hover);
  setContext("flex", flex);
  setContext("padding", padding);
  setContext("rounded", rounded);
  setContext("spacing", spacing);
  if ($$props.justify === void 0 && $$bindings.justify && justify !== void 0) $$bindings.justify(justify);
  if ($$props.border === void 0 && $$bindings.border && border !== void 0) $$bindings.border(border);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  if ($$props.hover === void 0 && $$bindings.hover && hover !== void 0) $$bindings.hover(hover);
  if ($$props.flex === void 0 && $$bindings.flex && flex !== void 0) $$bindings.flex(flex);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.regionList === void 0 && $$bindings.regionList && regionList !== void 0) $$bindings.regionList(regionList);
  if ($$props.regionPanel === void 0 && $$bindings.regionPanel && regionPanel !== void 0) $$bindings.regionPanel(regionPanel);
  if ($$props.labelledby === void 0 && $$bindings.labelledby && labelledby !== void 0) $$bindings.labelledby(labelledby);
  if ($$props.panel === void 0 && $$bindings.panel && panel !== void 0) $$bindings.panel(panel);
  classesBase = `${cBase$2} ${$$props.class ?? ""}`;
  classesList = `${cList} ${justify} ${border} ${regionList}`;
  classesPanel = `${cPanel} ${regionPanel}`;
  return `<div class="${"tab-group " + escape(classesBase, true)}" data-testid="tab-group"> <div class="${"tab-list " + escape(classesList, true)}" role="tablist"${add_attribute("aria-labelledby", labelledby, 0)}>${slots.default ? slots.default({}) : ``}</div>  ${$$slots.panel ? `<div class="${"tab-panel " + escape(classesPanel, true)}" role="tabpanel"${add_attribute("aria-labelledby", panel, 0)} tabindex="0">${slots.panel ? slots.panel({}) : ``}</div>` : ``}</div>`;
});
const cBase$1 = "text-center cursor-pointer transition-colors duration-100";
const cInterface = "";
const Tab = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let selected;
  let classesActive;
  let classesBase;
  let classesInterface;
  let classesTab;
  let $$restProps = compute_rest_props($$props, [
    "group",
    "name",
    "value",
    "title",
    "controls",
    "regionTab",
    "active",
    "hover",
    "flex",
    "padding",
    "rounded",
    "spacing"
  ]);
  let $$slots = compute_slots(slots);
  let { group } = $$props;
  let { name } = $$props;
  let { value } = $$props;
  let { title = "" } = $$props;
  let { controls = "" } = $$props;
  let { regionTab = "" } = $$props;
  let { active = getContext("active") } = $$props;
  let { hover = getContext("hover") } = $$props;
  let { flex = getContext("flex") } = $$props;
  let { padding = getContext("padding") } = $$props;
  let { rounded = getContext("rounded") } = $$props;
  let { spacing = getContext("spacing") } = $$props;
  let elemInput;
  function prunedRestProps() {
    delete $$restProps.class;
    return $$restProps;
  }
  if ($$props.group === void 0 && $$bindings.group && group !== void 0) $$bindings.group(group);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.controls === void 0 && $$bindings.controls && controls !== void 0) $$bindings.controls(controls);
  if ($$props.regionTab === void 0 && $$bindings.regionTab && regionTab !== void 0) $$bindings.regionTab(regionTab);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  if ($$props.hover === void 0 && $$bindings.hover && hover !== void 0) $$bindings.hover(hover);
  if ($$props.flex === void 0 && $$bindings.flex && flex !== void 0) $$bindings.flex(flex);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  selected = value === group;
  classesActive = selected ? active : hover;
  classesBase = `${cBase$1} ${flex} ${padding} ${rounded} ${classesActive} ${$$props.class ?? ""}`;
  classesInterface = `${cInterface} ${spacing}`;
  classesTab = `${regionTab}`;
  return `<label${add_attribute("class", classesBase, 0)}${add_attribute("title", title, 0)}> <div class="${"tab " + escape(classesTab, true)}" data-testid="tab" role="tab"${add_attribute("aria-controls", controls, 0)}${add_attribute("aria-selected", selected, 0)}${add_attribute("tabindex", selected ? 0 : -1, 0)}> <div class="h-0 w-0 overflow-hidden"><input${spread(
    [
      { type: "radio" },
      { name: escape_attribute_value(name) },
      { value: escape_attribute_value(value) },
      escape_object(prunedRestProps()),
      { tabindex: "-1" }
    ],
    {}
  )}${add_attribute("this", elemInput, 0)}${value === group ? add_attribute("checked", true, 1) : ""}></div>  <div class="${"tab-interface " + escape(classesInterface, true)}">${$$slots.lead ? `<div class="tab-lead">${slots.lead ? slots.lead({}) : ``}</div>` : ``} <div class="tab-label">${slots.default ? slots.default({}) : ``}</div></div></div></label>`;
});
const cBase = "overflow-hidden shadow";
const cHeader = "text-xs text-white/50 uppercase flex justify-between items-center p-2 pl-4";
const cPre = "whitespace-pre-wrap break-all p-4 pt-1";
function languageFormatter(lang) {
  if (lang === "js") return "javascript";
  if (lang === "ts") return "typescript";
  if (lang === "shell") return "terminal";
  return lang;
}
const CodeBlock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let $storeHighlightJs, $$unsubscribe_storeHighlightJs;
  $$unsubscribe_storeHighlightJs = subscribe(storeHighlightJs, (value) => $storeHighlightJs = value);
  createEventDispatcher();
  let { language = "plaintext" } = $$props;
  let { code = "" } = $$props;
  let { lineNumbers = false } = $$props;
  let { background = "bg-neutral-900/90" } = $$props;
  let { blur = "" } = $$props;
  let { text = "text-sm" } = $$props;
  let { color = "text-white" } = $$props;
  let { rounded = "rounded-container-token" } = $$props;
  let { shadow = "shadow" } = $$props;
  let { button = "btn btn-sm variant-soft !text-white" } = $$props;
  let { buttonLabel = "Copy" } = $$props;
  let { buttonCopied = "👍" } = $$props;
  let formatted = false;
  let displayCode = code;
  if ($$props.language === void 0 && $$bindings.language && language !== void 0) $$bindings.language(language);
  if ($$props.code === void 0 && $$bindings.code && code !== void 0) $$bindings.code(code);
  if ($$props.lineNumbers === void 0 && $$bindings.lineNumbers && lineNumbers !== void 0) $$bindings.lineNumbers(lineNumbers);
  if ($$props.background === void 0 && $$bindings.background && background !== void 0) $$bindings.background(background);
  if ($$props.blur === void 0 && $$bindings.blur && blur !== void 0) $$bindings.blur(blur);
  if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.shadow === void 0 && $$bindings.shadow && shadow !== void 0) $$bindings.shadow(shadow);
  if ($$props.button === void 0 && $$bindings.button && button !== void 0) $$bindings.button(button);
  if ($$props.buttonLabel === void 0 && $$bindings.buttonLabel && buttonLabel !== void 0) $$bindings.buttonLabel(buttonLabel);
  if ($$props.buttonCopied === void 0 && $$bindings.buttonCopied && buttonCopied !== void 0) $$bindings.buttonCopied(buttonCopied);
  {
    if ($storeHighlightJs !== void 0) {
      displayCode = $storeHighlightJs.highlight(code, { language }).value.trim();
      formatted = true;
    }
  }
  {
    if (lineNumbers) {
      displayCode = displayCode.replace(/^/gm, () => {
        return '<span class="line"></span>	';
      });
      formatted = true;
    }
  }
  classesBase = `${cBase} ${background} ${blur} ${text} ${color} ${rounded} ${shadow} ${$$props.class ?? ""}`;
  $$unsubscribe_storeHighlightJs();
  return ` ${language && code ? `<div class="${"codeblock " + escape(classesBase, true)}" data-testid="codeblock"> <header class="${"codeblock-header " + escape(cHeader, true)}"> <span class="codeblock-language">${escape(languageFormatter(language))}</span>  <button type="button" class="${"codeblock-btn " + escape(button, true)}">${escape(buttonLabel)}</button></header>  <pre class="${"codeblock-pre " + escape(cPre, true)}"><code class="${"codeblock-code language-" + escape(language, true) + " lineNumbers"}">${formatted ? `<!-- HTML_TAG_START -->${displayCode}<!-- HTML_TAG_END -->` : `${escape(code.trim())}`}</code></pre></div>` : ``}`;
});
const bdcPythonExport = `# Requires python 3.7 or later
import sys
import pandas as pd
import matplotlib.pyplot as plt

# BDC Powered by Terra users uncomment the following line to specify package install location
# sys.path.insert(0, r"/home/jupyter/.local/lib/python3.7/site-packages")
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git
!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-biodatacatalyst-python-adapter-hpds.git

import PicSureClient
import PicSureBdcAdapter

token_file = "token.txt"
with open(token_file, "r") as f:
  my_token = f.read()

bdc = PicSureBdcAdapter.Adapter("https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure", my_token)

resource = bdc.useResource('02e23f52-f354-4e8b-992c-d37c8b9ba140')

queryID = "{{queryId}}" 

results = resource.retrieveQueryResults(queryID)

from io import StringIO
df_UI = pd.read_csv(StringIO(results), low_memory=False)
df_UI.head() # View top 5 rows of dataframe`;
const bdcRExport = '# Requires R 3.4 or later\n### Uncomment this code if you are not using the PIC-SURE environment in *BDC-Seven Bridges*, or if you do not have all the necessary dependencies installed.\n#install.packages("devtools")\n\nSys.setenv(TAR = "/bin/tar")\noptions(unzip = "internal")\ndevtools::install_github("hms-dbmi/pic-sure-r-adapter-hpds", ref="main", force=T, quiet=FALSE)\nlibrary(dplyr)\n\ntoken_file <- "token.txt"\ntoken <- scan(token_file, what = "character")\n\nsession <- picsure::bdc.initializeSession("https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure", token)\nsession <- picsure::bdc.setResource(session = session, resourceName = "AUTH")\n\nqueryID <- "{{queryId}}"\nresults <- picsure::getResultByQueryUUID(session, queryID)\nhead(results) # View top 5 rows of dataframe';
const bdcPythonAPI = '# Requires python 3.6 or later\nimport sys\nimport pandas as pd\nimport matplotlib.pyplot as plt\n# BDC Powered by Terra users uncomment the following line to specify package install location\n# sys.path.insert(0, r"/home/jupyter/.local/lib/python3.7/site-packages")\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-client.git\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-python-adapter-hpds.git\n!{sys.executable} -m pip install --upgrade --force-reinstall git+https://github.com/hms-dbmi/pic-sure-biodatacatalyst-python-adapter-hpds.git\nimport PicSureClient\nimport PicSureBdcAdapter\n# Set up connection to PIC-SURE API\nPICSURE_network_URL = "https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure"\ntoken_file = "token.txt"\n\nwith open(token_file, "r") as f:\n    my_token = f.read()\n\nbdc = PicSureBdcAdapter.Adapter(PICSURE_network_URL, my_token)';
const bdcRAPI = '# Requires R 3.4 or later\n### Uncomment this code if you are not using the PIC-SURE environment in *BDC-Seven Bridges*, or if you do not have all the necessary dependencies installed.\n#install.packages("devtools")\nSys.setenv(TAR = "/bin/tar")\noptions(unzip = "internal")\ndevtools::install_github("hms-dbmi/pic-sure-r-adapter-hpds", ref="main", force=T, quiet=FALSE)\nlibrary(dplyr)\nPICSURE_network_URL = "https://picsure.biodatacatalyst.nhlbi.nih.gov/picsure"\ntoken_file <- "token.txt"\ntoken <- scan(token_file, what = "character")\nsession <- picsure::bdc.initializeSession(PICSURE_network_URL, token)\nsession <- picsure::bdc.setResource(session = session,  resourceName = "AUTH")';
const basePythonExport = "Code not set";
const baseRExport = "Code not set";
const basePythonAPI = "Code not set";
const baseRAPI = "Code not set";
const codeBlocks = {
  bdcPythonExport,
  bdcRExport,
  bdcPythonAPI,
  bdcRAPI,
  basePythonExport,
  baseRExport,
  basePythonAPI,
  baseRAPI
};

export { CodeBlock as C, TabGroup as T, Tab as a, codeBlocks as c, storeHighlightJs as s };
//# sourceMappingURL=codeBlocks-D7Bb9quT.js.map
