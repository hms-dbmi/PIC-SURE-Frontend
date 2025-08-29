<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/stores/Configuration';
  import { sanitizeHTML } from '$lib/utilities/HTML';
  import Content from '$lib/components/Content.svelte';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';

  let introduction: string = $state('');
  let access: string = $state('');
  let examples: string = $state('');

  onMount(() => {
    introduction = sanitizeHTML($branding.analysisPage.analysis.introduction);
    access = sanitizeHTML($branding.analysisPage.analysis.access);
    examples = sanitizeHTML($branding.analysisPage.analysis.examples);
  });
</script>

<Content title={`Analyze with ${$branding.analysisPage.analysis.platform}`}>
  <section class="flex flex-col items-center w-full mt-8">
    <CollaborateSteps currentStep={3} />
  </section>
  <div class="flex flex-col gap-4 w-full items-center mb-8">
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html introduction}
    {@html access}
    {@html examples}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </div>
</Content>
