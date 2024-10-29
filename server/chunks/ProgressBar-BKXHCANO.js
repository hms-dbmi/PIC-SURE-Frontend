import { c as create_ssr_component, e as escape, a as add_attribute, d as add_styles } from './ssr-Di-o4HBA.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';

const css = {
  code: ".anim-indeterminate.svelte-1sf2k6w{transform-origin:0% 50%;animation:svelte-1sf2k6w-anim-indeterminate 2s infinite linear}@keyframes svelte-1sf2k6w-anim-indeterminate{0%{transform:translateX(0) scaleX(0)}40%{transform:translateX(0) scaleX(0.4)}100%{transform:translateX(100%) scaleX(0.5)}}",
  map: '{"version":3,"file":"ProgressBar.svelte","sources":["ProgressBar.svelte"],"sourcesContent":["<script>export let value = void 0;\\nexport let min = 0;\\nexport let max = 100;\\nexport let height = \\"h-2\\";\\nexport let rounded = \\"rounded-token\\";\\nexport let transition = \\"transition-[width]\\";\\nexport let animIndeterminate = \\"anim-indeterminate\\";\\nexport let meter = \\"bg-surface-900-50-token\\";\\nexport let track = \\"bg-surface-200-700-token\\";\\nexport let labelledby = \\"\\";\\nconst cTrack = \\"w-full overflow-hidden\\";\\nconst cMeter = \\"h-full\\";\\n$:\\n  fillPercent = value ? 100 * (value - min) / (max - min) : 0;\\n$:\\n  indeterminate = value === void 0 || value < 0;\\n$:\\n  classesIndeterminate = indeterminate ? animIndeterminate : \\"\\";\\n$:\\n  classesTrack = `${cTrack} ${track} ${height} ${rounded} ${$$props.class ?? \\"\\"}`;\\n$:\\n  classesMeter = `${cMeter} ${meter} ${rounded} ${classesIndeterminate} ${transition}`;\\n<\/script>\\n\\n<!-- Track -->\\n<div\\n\\tclass=\\"progress-bar {classesTrack}\\"\\n\\tdata-testid=\\"progress-bar\\"\\n\\trole=\\"progressbar\\"\\n\\taria-labelledby={labelledby}\\n\\taria-valuenow={value}\\n\\taria-valuemin={min}\\n\\taria-valuemax={max - min}\\n>\\n\\t<!-- Meter -->\\n\\t<div class=\\"progress-bar-meter {classesMeter}\\" style:width=\\"{indeterminate ? 100 : fillPercent}%\\"></div>\\n</div>\\n\\n<style>\\n\\t.anim-indeterminate {\\n\\t\\ttransform-origin: 0% 50%;\\n\\t\\tanimation: anim-indeterminate 2s infinite linear;\\n\\t}\\n\\t/* prettier-ignore */\\n\\t@keyframes anim-indeterminate {\\n\\t\\t0% { transform: translateX(0) scaleX(0); }\\n\\t\\t40% { transform: translateX(0) scaleX(0.4); }\\n\\t\\t100% { transform: translateX(100%) scaleX(0.5); }\\n\\t}</style>\\n"],"names":[],"mappings":"AAuCC,kCAAoB,CACnB,gBAAgB,CAAE,EAAE,CAAC,GAAG,CACxB,SAAS,CAAE,iCAAkB,CAAC,EAAE,CAAC,QAAQ,CAAC,MAC3C,CAEA,WAAW,iCAAmB,CAC7B,EAAG,CAAE,SAAS,CAAE,WAAW,CAAC,CAAC,CAAC,OAAO,CAAC,CAAG,CACzC,GAAI,CAAE,SAAS,CAAE,WAAW,CAAC,CAAC,CAAC,OAAO,GAAG,CAAG,CAC5C,IAAK,CAAE,SAAS,CAAE,WAAW,IAAI,CAAC,CAAC,OAAO,GAAG,CAAG,CACjD"}'
};
const cTrack = "w-full overflow-hidden";
const cMeter = "h-full";
const ProgressBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let fillPercent;
  let indeterminate;
  let classesIndeterminate;
  let classesTrack;
  let classesMeter;
  let { value = void 0 } = $$props;
  let { min = 0 } = $$props;
  let { max = 100 } = $$props;
  let { height = "h-2" } = $$props;
  let { rounded = "rounded-token" } = $$props;
  let { transition = "transition-[width]" } = $$props;
  let { animIndeterminate = "anim-indeterminate" } = $$props;
  let { meter = "bg-surface-900-50-token" } = $$props;
  let { track = "bg-surface-200-700-token" } = $$props;
  let { labelledby = "" } = $$props;
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.min === void 0 && $$bindings.min && min !== void 0) $$bindings.min(min);
  if ($$props.max === void 0 && $$bindings.max && max !== void 0) $$bindings.max(max);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0) $$bindings.height(height);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.transition === void 0 && $$bindings.transition && transition !== void 0) $$bindings.transition(transition);
  if ($$props.animIndeterminate === void 0 && $$bindings.animIndeterminate && animIndeterminate !== void 0) $$bindings.animIndeterminate(animIndeterminate);
  if ($$props.meter === void 0 && $$bindings.meter && meter !== void 0) $$bindings.meter(meter);
  if ($$props.track === void 0 && $$bindings.track && track !== void 0) $$bindings.track(track);
  if ($$props.labelledby === void 0 && $$bindings.labelledby && labelledby !== void 0) $$bindings.labelledby(labelledby);
  $$result.css.add(css);
  fillPercent = value ? 100 * (value - min) / (max - min) : 0;
  indeterminate = value === void 0 || value < 0;
  classesIndeterminate = indeterminate ? animIndeterminate : "";
  classesTrack = `${cTrack} ${track} ${height} ${rounded} ${$$props.class ?? ""}`;
  classesMeter = `${cMeter} ${meter} ${rounded} ${classesIndeterminate} ${transition}`;
  return ` <div class="${"progress-bar " + escape(classesTrack, true) + " svelte-1sf2k6w"}" data-testid="progress-bar" role="progressbar"${add_attribute("aria-labelledby", labelledby, 0)}${add_attribute("aria-valuenow", value, 0)}${add_attribute("aria-valuemin", min, 0)}${add_attribute("aria-valuemax", max - min, 0)}> <div class="${"progress-bar-meter " + escape(classesMeter, true) + " svelte-1sf2k6w"}"${add_styles({
    "width": `${indeterminate ? 100 : fillPercent}%`
  })}></div> </div>`;
});

export { ProgressBar as P };
//# sourceMappingURL=ProgressBar-BKXHCANO.js.map
