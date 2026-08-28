<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';

  import type { Indexable } from '$lib/types';
  import { config } from '$lib/configuration.svelte';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import TabItem from '$lib/components/TabItem.svelte';
  import TermsEditor from '$lib/components/admin/configuration/TermsEditor.svelte';
  import RoleActions from '$lib/components/admin/configuration/cell/RoleActions.svelte';
  import PrivilegeActions from '$lib/components/admin/configuration/cell/PrivilegeActions.svelte';
  import ConnectionActions from '$lib/components/admin/configuration/cell/ConnectionActions.svelte';
  import Application from '$lib/components/admin/configuration/cell/Application.svelte';
  import RequiredFields from '$lib/components/admin/configuration/cell/RequiredFields.svelte';
  import ConfigKindTab from '$lib/components/admin/configuration/ConfigKindTab.svelte';
  import BannerManagementView from '$lib/components/admin/configuration/BannerManagementView.svelte';

  import { privileges, loadPrivileges } from '$lib/stores/Privileges';
  import { roles, loadRoles } from '$lib/stores/Roles';
  import { loadApplications } from '$lib/stores/Application';
  import { connections, loadConnections } from '$lib/stores/Connections';
  import { isTopAdmin } from '$lib/stores/User';

  import Loading from '$lib/components/Loading.svelte';

  let tabSet: string = $state('Access Control');
  let requestedTab: string = $state('Access Control');
  let bannerEditorDirty = $state(false);
  let pendingTab: string | null = $state(null);
  let hydrated = $state(false);

  onMount(() => {
    hydrated = true;
  });

  $effect(() => {
    if (requestedTab !== tabSet) {
      if (tabSet === 'Site banners' && bannerEditorDirty) {
        pendingTab = requestedTab;
        requestedTab = tabSet;
      } else {
        tabSet = requestedTab;
      }
    }
  });

  function resolveBannerTabChange(destination: string | null) {
    pendingTab = null;
    requestedTab = tabSet;
    if (destination) {
      bannerEditorDirty = false;
      tabSet = destination;
      requestedTab = destination;
    }
  }

  const roleTable = {
    columns: [
      { dataElement: 'name', label: 'Name', sort: true },
      { dataElement: 'description', label: 'Description', sort: true },
      { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
    ],
    overrides: { uuid: RoleActions },
  };

  const privilegesTable = {
    columns: [
      { dataElement: 'name', label: 'Name', sort: true },
      { dataElement: 'description', label: 'Description', sort: true },
      { dataElement: 'application', label: 'Application Name', sort: true },
      { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
    ],
    overrides: {
      uuid: PrivilegeActions,
      application: Application,
    },
  };

  const connectionTable = {
    columns: [
      { dataElement: 'label', label: 'Label', sort: true },
      { dataElement: 'id', label: 'ID', sort: true },
      { dataElement: 'subPrefix', label: 'Sub prefix', sort: true },
      { dataElement: 'requiredFields', label: 'Required fields' },
      { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
    ],
    overrides: {
      uuid: ConnectionActions,
      requiredFields: RequiredFields,
    },
  };

  async function loadAppsAndPriv() {
    await loadPrivileges();
    await loadApplications();
  }

  const rowClickHandler = (path: string) => (row: Indexable) => {
    const uuid = row?.uuid;
    goto(resolve(`/admin/configuration/${path}/${uuid}/edit` as '/'));
  };
  const roleRowCLick = rowClickHandler('role');
  const privilegeRowClick = rowClickHandler('privilege');
  const connectionRowClick = rowClickHandler('connection');
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Configuration</title>
</svelte:head>

{#if hydrated}
  <span data-testid="configuration-hydrated" hidden></span>
{/if}

<Content title="Configuration">
  {#if !$isTopAdmin && tabSet !== 'Site banners'}
    <ErrorAlert data-testid="top-admin-only-error" title="Top Administrator Only" color="warning">
      <p>
        Configurations are READ ONLY for admin users. Please contact your administrator to make
        changes.
      </p>
    </ErrorAlert>
  {/if}
  <Tabs value={tabSet} onValueChange={(e: { value: string }) => (requestedTab = e.value)}>
    {#snippet list()}
      <TabItem bind:group={requestedTab} value="Access Control">Access Control</TabItem>
      <TabItem bind:group={requestedTab} value="Settings & Features">Settings & Features</TabItem>
      <TabItem bind:group={requestedTab} value="Branding">Branding</TabItem>
      <TabItem bind:group={requestedTab} value="Site banners">Site banners</TabItem>
      {#if config.features.termsOfService}
        <TabItem bind:group={requestedTab} value="Terms of Service">Terms of Service</TabItem>
      {/if}
    {/snippet}
    {#snippet content()}
      <Tabs.Panel value="Access Control">
        <div id="role-table" class="mb-10">
          <h2>Roles Management</h2>
          {#await loadRoles()}
            <Loading />
          {:then}
            <div class="flex gap-4 my-6">
              <div class="flex-auto">
                <a
                  data-testid="add-role"
                  class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!$isTopAdmin
                    ? 'opacity-50 pointer-events-none'
                    : ''}"
                  href={resolve('/admin/configuration/role/new')}
                >
                  + Add Role
                </a>
              </div>
            </div>
            <Datatable
              tableName="Roles"
              data={$roles}
              columns={roleTable.columns}
              cellOverides={roleTable.overrides}
              rowClickHandler={roleRowCLick}
              isClickable
            />
          {:catch}
            <ErrorAlert title="API Error">
              Something went wrong when sending your request for roles.
            </ErrorAlert>
          {/await}
        </div>
        <div id="privilege-table" class="mb-10">
          <h2>Privileges Management</h2>
          {#await loadAppsAndPriv()}
            <Loading />
          {:then}
            <div class="flex gap-4 my-6">
              <div class="flex-auto">
                <a
                  data-testid="add-privilege"
                  class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!$isTopAdmin
                    ? 'opacity-50 pointer-events-none'
                    : ''}"
                  href={resolve('/admin/configuration/privilege/new')}
                >
                  + Add Privilege
                </a>
              </div>
            </div>
            <Datatable
              tableName="Privileges"
              data={$privileges}
              columns={privilegesTable.columns}
              cellOverides={privilegesTable.overrides}
              rowClickHandler={privilegeRowClick}
              isClickable
            />
          {:catch}
            <ErrorAlert title="API Error">
              Something went wrong when sending your request for priviledges and applications.
            </ErrorAlert>
          {/await}
        </div>
        <div id="connection-table" class="mb-10">
          <h2>Connections Management</h2>
          {#await loadConnections()}
            <Loading />
          {:then}
            <div class="flex gap-4 my-6">
              <div class="flex-auto">
                <a
                  data-testid="add-connection"
                  class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!$isTopAdmin
                    ? 'opacity-50 pointer-events-none'
                    : ''}"
                  href={resolve('/admin/configuration/connection/new')}
                >
                  + Add Connection
                </a>
              </div>
            </div>
            <Datatable
              tableName="Connections"
              data={$connections}
              columns={connectionTable.columns}
              cellOverides={connectionTable.overrides}
              rowClickHandler={connectionRowClick}
              isClickable
            />
          {:catch}
            <ErrorAlert title="API Error">
              Something went wrong when sending your request for connections.
            </ErrorAlert>
          {/await}
        </div>
      </Tabs.Panel>
      <Tabs.Panel value="Settings & Features">
        <ConfigKindTab
          kinds={['features', 'settings']}
          title="Settings & Features"
          readOnly={!$isTopAdmin}
        />
      </Tabs.Panel>
      <Tabs.Panel value="Branding">
        <ConfigKindTab kinds={['branding']} title="Branding" readOnly={!$isTopAdmin} />
      </Tabs.Panel>
      <Tabs.Panel value="Site banners">
        {#if tabSet === 'Site banners'}
          <BannerManagementView
            ondirtychange={(dirty) => (bannerEditorDirty = dirty)}
            tabchangerequest={pendingTab}
            ontabchangerequestresolve={resolveBannerTabChange}
          />
        {/if}
      </Tabs.Panel>
      {#if config.features.termsOfService}
        <Tabs.Panel value="Terms of Service">
          <TermsEditor />
        </Tabs.Panel>
      {/if}
    {/snippet}
  </Tabs>
</Content>
