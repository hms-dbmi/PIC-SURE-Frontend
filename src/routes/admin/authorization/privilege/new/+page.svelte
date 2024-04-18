<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import PrivilegeForm from '$lib/components/admin/authorization/PrivilegeForm.svelte';

  import Content from '$lib/components/Content.svelte';
  import ApplicationStore from '$lib/stores/Application';

  const { applicationList, loadApplications } = ApplicationStore;
</script>

<Content title="New Privilege">
  {#await loadApplications()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="privilege-new">
      <PrivilegeForm applicationList={$applicationList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
