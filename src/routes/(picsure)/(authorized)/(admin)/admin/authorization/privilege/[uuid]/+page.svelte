<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';

  import PrivilegesStore from '$lib/stores/Privileges';
  import ApplicationStore from '$lib/stores/Application';
  import type { Privilege } from '$lib/models/Privilege';
  import type { Application } from '$lib/models/Applications';

  const { loadPrivileges, getPrivilege } = PrivilegesStore;
  const { getApplication } = ApplicationStore;

  let privilege: Privilege;
  let application: Application | string = '';

  async function load() {
    await loadPrivileges();
    privilege = await getPrivilege($page.params.uuid);
    if (privilege.application) {
      application = (await getApplication(privilege.application)) || '';
    }
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Privilege Summary</title>
</svelte:head>

<Content title="Privilege Summary" backUrl="/admin/authorization" backTitle="Back to Authorization">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="privilege-view" class="m-3">
      <table class="table bg-transparent">
        <tr>
          <td>ID:</td>
          <td>{privilege.uuid}</td>
        </tr>
        <tr>
          <td>Name:</td>
          <td>{privilege.name}</td>
        </tr>
        <tr>
          <td>Description:</td>
          <td>{privilege.description}</td>
        </tr>
        <tr>
          {#if typeof application !== 'string'}
            <td class="align-top">Application:</td>
            <td
              ><table class="table bg-transparent">
                <tr>
                  <td>ID:</td>
                  <td>{application.uuid}</td>
                </tr>
                <tr>
                  <td>Name:</td>
                  <td>{application.name}</td>
                </tr>
                <tr>
                  <td>Description:</td>
                  <td>{application.description}</td>
                </tr>
                <tr>
                  <td>Enabled:</td>
                  <td>{application.enable ? 'Yes' : 'No'}</td>
                </tr>
              </table></td
            >
          {:else}
            <td>Application:</td>
            <td>none</td>
          {/if}
        </tr>
      </table>
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
