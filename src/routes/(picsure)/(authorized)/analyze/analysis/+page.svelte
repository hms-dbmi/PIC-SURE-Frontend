<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
</script>

<Content title={`Analyze with ${branding.analysisConfig.analysis.platform}`}>
  <div class="flex flex-col gap-4 w-full items-center mb-8">
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html branding.analysisConfig.analysis.introduction}
    {@html branding.analysisConfig.analysis.access}
    {@html branding.analysisConfig.analysis.examples}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </div>
</Content>
