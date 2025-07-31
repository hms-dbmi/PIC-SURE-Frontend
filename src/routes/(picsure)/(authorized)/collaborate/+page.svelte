<script lang="ts">
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import Content from '$lib/components/Content.svelte';
  import CollaborateSteps from '$lib/components/steppers/CollaborateSteps.svelte';
  import { branding } from '$lib/configuration';

  let introduction: string = $state('');
  let findCollaborators: string = $state('');

  onMount(() => {
    introduction = DOMPurify.sanitize(branding.collaborateConfig.introduction);
    findCollaborators = DOMPurify.sanitize(branding.collaborateConfig.findCollaborators);
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
