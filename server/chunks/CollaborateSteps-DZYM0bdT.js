import { x as push, z as pop, R as ensure_array_like, M as attr_class, N as attr, K as escape_html, P as stringify } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import './client2-CLhyDddE.js';

function StepIndicator($$payload, $$props) {
  push();
  const {
    steps = [],
    currentStep = 0,
    width = "w-full"
  } = $$props;
  const each_array = ensure_array_like(steps);
  $$payload.out += `<div${attr_class(`flex flex-col items-center ${stringify(width)}`)}${attr("data-testid", `step-indicator-${steps[currentStep]?.label || "container"}`)}><div class="flex flex-start w-full" style="min-height:3.5rem;"><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let step = each_array[i];
    $$payload.out += `<div${attr_class(`flex ${stringify(i < steps.length - 1 ? "w-full" : "")}`)}><div class="w-24"><button type="button"${attr("aria-label", step.label)} class="flex items-center justify-center bg-transparent border-none p-0 mx-auto my-2 focus:outline-none"><span${attr_class(`flex items-center justify-center w-10 h-10 rounded-full border-2 ${stringify(i === currentStep ? "bg-primary-500 border-primary-500 text-white cursor-default" : "bg-surface-100 border-surface-300 text-surface-500")}`)}><i${attr_class(`fa ${step.icon} text-xl`)}></i></span></button> <div class="flex flex-col items-center w-full"><span${attr_class(`text-sm font-semibold text-center break-words ${stringify(i === currentStep ? "text-primary-700" : "text-surface-500")}`)}>${escape_html(step.label)}</span> `;
    if (step.description) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="text-xs text-surface-400">${escape_html(step.description)}</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div> `;
    if (i < steps.length - 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex-1 h-0.5 mt-6 bg-surface-300"></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
function CollaborateSteps($$payload, $$props) {
  push();
  const { currentStep = 0 } = $$props;
  const getSteps = () => {
    let steps = [];
    if (branding?.collaborateConfig?.steps && branding.collaborateConfig.steps.length > 0) {
      steps = branding?.collaborateConfig?.steps.map((step) => ({
        label: step.label,
        icon: step.icon,
        path: step.path
      }));
    } else {
      console.warn("branding.collaborate.steps is empty");
      steps.push({
        label: "Build Patient Cohort",
        icon: "fa-search",
        path: "/explorer"
      });
      {
        steps.push({
          label: "Find Collaborators",
          icon: "fa-handshake",
          path: "/collaborate"
        });
      }
      {
        steps.push({
          label: "Request Access to Data",
          icon: "fa-database",
          path: "/data-requests"
        });
      }
      {
        steps.push({
          label: "Analyze with API",
          icon: "fa-chart-simple",
          path: "/analyze/api"
        });
      }
      {
        steps.push({
          label: "Analyze with Service Workbench",
          icon: "fa-chart-line",
          path: "/analyze/analysis"
        });
      }
    }
    return steps;
  };
  StepIndicator($$payload, {
    steps: getSteps(),
    currentStep,
    width: "w-3/4"
  });
  pop();
}

export { CollaborateSteps as C };
//# sourceMappingURL=CollaborateSteps-DZYM0bdT.js.map
