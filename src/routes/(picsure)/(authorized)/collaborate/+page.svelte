<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';
  import { branding } from '$lib/configuration';
</script>

<Content title="Find Collaborators">
  <section class="flex flex-col items-center w-full mt-8">
    <CollaborateSteps currentStep={1} />
  </section>
  <section>
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html branding.collaborateConfig.introduction}
    {@html branding.collaborateConfig.findCollaborators}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </section>
</Content>
