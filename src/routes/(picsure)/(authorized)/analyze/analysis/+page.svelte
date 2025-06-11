<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
</script>

<Content backUrl="/analyze" title={`Analyze with ${branding.analysisConfig.analysis.platform}`}>
  <div class="flex flex-col gap-4 w-full items-center mb-8">
      {@html branding.analysisConfig.analysis.introduction}
      {@html branding.analysisConfig.analysis.access}
      {@html branding.analysisConfig.analysis.examples}
  </div>
</Content>