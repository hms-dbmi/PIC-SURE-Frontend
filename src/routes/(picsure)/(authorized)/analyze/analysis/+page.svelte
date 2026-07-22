<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import { sanitizeHTML } from '$lib/utilities/HTML';
  import Content from '$lib/components/Content.svelte';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';

  const introduction = $derived(config.branding.analysisPage.analysis.introduction);
  const access = $derived(config.branding.analysisPage.analysis.access);
  const examples = $derived(config.branding.analysisPage.analysis.examples);
</script>

<Content title={`Analyze with ${config.branding.analysisPage.analysis.platform}`}>
  <section class="flex flex-col items-center w-full mt-8">
    <CollaborateSteps currentStep={3} />
  </section>
  <div class="flex flex-col gap-4 w-full items-center mb-8">
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html sanitizeHTML(introduction)}
    {@html sanitizeHTML(access)}
    {@html sanitizeHTML(examples)}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </div>
</Content>
