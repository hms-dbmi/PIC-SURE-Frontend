<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
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
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">ID:</th>
            <td>{privilege.uuid}</td>
          </tr>
          <tr>
            <th scope="row">Name:</th>
            <td>{privilege.name}</td>
          </tr>
          <tr>
            <th scope="row">Description:</th>
            <td>{privilege.description}</td>
          </tr>
          <tr>
            {#if typeof application !== 'string'}
              <th scope="row" class="align-top">Application:</th>
              <td>
                <table class="table bg-transparent">
                  <thead>
                    <tr>
                      <th scope="col">Field</th>
                      <th scope="col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">ID:</th>
                      <td>{application.uuid}</td>
                    </tr>
                    <tr>
                      <th scope="row">Name:</th>
                      <td>{application.name}</td>
                    </tr>
                    <tr>
                      <th scope="row">Description:</th>
                      <td>{application.description}</td>
                    </tr>
                    <tr>
                      <th scope="row">Enabled:</th>
                      <td>{application.enable ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            {:else}
              <th scope="row">Application:</th>
              <td>none</td>
            {/if}
          </tr>
        </tbody>
      </table>
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
