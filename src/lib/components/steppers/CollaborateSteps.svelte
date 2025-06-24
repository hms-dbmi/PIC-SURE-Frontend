<script lang="ts">
  import StepIndicator from '$lib/components/steppers/StepIndicator.svelte';
  import type { Step } from '$lib/types';
  import { features } from '$lib/configuration';
  import { branding } from '$lib/configuration';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  const { currentStep = 0 } = $props<{
    currentStep?: number;
  }>();

  const getSteps = () => {
    let steps: Step[] = [];
    if (branding?.collaborateConfig?.steps && branding.collaborateConfig.steps.length > 0) {
      steps = branding?.collaborateConfig?.steps.map((step: Step) => ({
        label: step.label,
        icon: step.icon,
        path: step.path,
      }));
    } else {
      console.warn('branding.collaborate.steps is empty');
      steps.push({
        label: 'Build Patient Cohort',
        icon: 'fa-search',
        path: '/explorer',
      });
      if (features['collaborate' as keyof typeof features]) {
        steps.push({
          label: 'Find Collaborators',
          icon: 'fa-handshake',
          path: '/collaborate',
        });
      }
      if (features['dataRequests' as keyof typeof features]) {
        steps.push({
          label: 'Request Access to Data',
          icon: 'fa-database',
          path: '/data-requests',
        });
      }
      if (features['analyzeApi' as keyof typeof features]) {
        steps.push({
          label: 'Analyze with API',
          icon: 'fa-chart-simple',
          path: '/analyze/api',
        });
      }
      if (features['analyzeAnalysis' as keyof typeof features]) {
        steps.push({
          label: 'Analyze with Service Workbench',
          icon: 'fa-chart-line',
          path: '/analyze/analysis',
        });
      }
    }
    return steps;
  };
</script>

<StepIndicator
  steps={getSteps()}
  {currentStep}
  onStepClick={(step, index) => {
    if (index === currentStep) {
      return;
    }
    if (step.path && browser) {
      goto(step.path);
    }
  }}
  width="w-3/4"
/>
