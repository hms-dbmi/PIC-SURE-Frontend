<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/stores/Configuration';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  import Content from '$lib/components/Content.svelte';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';

  let introduction: string = $state('');
  let findCollaborators: string = $state('');

  onMount(() => {
    introduction = sanitizeHTML($branding.collaboratePage.introduction);
    findCollaborators = sanitizeHTML($branding.collaboratePage.findCollaborators);
  });
</script>

<Content title="Find Collaborators">
  <section class="flex flex-col items-center w-full mt-8">
    <CollaborateSteps currentStep={1} />
  </section>
  <section>
    <!-- eslint-disable svelte/no-at-html-tags -->
    {@html introduction}
    {@html findCollaborators}
    <!-- eslint-enable svelte/no-at-html-tags -->
  </section>
</Content>
