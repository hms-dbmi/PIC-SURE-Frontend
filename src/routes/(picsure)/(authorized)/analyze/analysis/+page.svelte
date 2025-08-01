<script lang="ts">
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';

  let introduction: string = $state('');
  let access: string = $state('');
  let examples: string = $state('');

  onMount(() => {
    introduction = DOMPurify.sanitize(branding.analysisConfig.analysis.introduction);
    access = DOMPurify.sanitize(branding.analysisConfig.analysis.access);
    examples = DOMPurify.sanitize(branding.analysisConfig.analysis.examples);
  });
</script>

<Content title={`Analyze with ${branding.analysisConfig.analysis.platform}`}>
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
