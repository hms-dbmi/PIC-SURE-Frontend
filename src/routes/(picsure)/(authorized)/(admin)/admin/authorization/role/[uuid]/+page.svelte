<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';

  import type { Role } from '$lib/models/Role';
  import type { Privilege } from '$lib/models/Privilege';
  import RolesStore from '$lib/stores/Roles';
  import PrivilegesStore from '$lib/stores/Privileges';
  const { loadRoles, getRole } = RolesStore;
  const { loadPrivileges, getPrivilege } = PrivilegesStore;

  let role: Role;
  let privileges: Privilege[];

  async function load() {
    await loadRoles();
    await loadPrivileges();
    role = await getRole($page.params.uuid);
    privileges = await Promise.all(role.privileges.map(getPrivilege));
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Role Summary</title>
</svelte:head>

<Content title="Role Summary" backUrl="/admin/authorization" backTitle="Back to Authorization">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-view">
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
            <td>{role.uuid}</td>
          </tr>
          <tr>
            <th scope="row">Name:</th>
            <td>{role.name}</td>
          </tr>
          <tr>
            <th scope="row">Description:</th>
            <td>{role.description}</td>
          </tr>
          <tr>
            <th scope="row">Privileges:</th>
            <td>{privileges.map((p) => p.name).join(', ')}</td>
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
