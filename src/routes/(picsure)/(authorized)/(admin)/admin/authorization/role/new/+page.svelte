<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import RoleForm from '$lib/components/admin/authorization/RoleForm.svelte';

  import PrivilegesStore from '$lib/stores/Privileges';
  const { privilegeList, loadPrivileges } = PrivilegesStore;
</script>

<Content title="New Role">
  {#await loadPrivileges()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-new">
      <RoleForm privilegeList={$privilegeList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
