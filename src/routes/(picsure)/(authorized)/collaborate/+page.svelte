<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  import Content from '$lib/components/Content.svelte';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';

  const introduction = $derived(config.branding.collaboratePage.introduction);
  const findCollaborators = $derived(config.branding.collaboratePage.findCollaborators);
</script>

<Content title="Find Collaborators">
  <section class="flex flex-col items-center w-full mt-8">
    <CollaborateSteps currentStep={1} />
  </section>
  <section>
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html sanitizeHTML(introduction)}
    {@html sanitizeHTML(findCollaborators)}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </section>
</Content>
