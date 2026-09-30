<script lang="ts">
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { goto, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

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
  import ApiKeysPanel from '$lib/components/admin/api-key/ApiKeysPanel.svelte';

  import { privileges, loadPrivileges } from '$lib/stores/Privileges';
  import { roles, loadRoles } from '$lib/stores/Roles';
  import { loadApplications } from '$lib/stores/Application';
  import { connections, loadConnections } from '$lib/stores/Connections';
  import { isTopAdmin } from '$lib/stores/User';

  import Loading from '$lib/components/Loading.svelte';

  // Tab label -> its ?tab= value, so links (e.g. the old /admin/api-keys route) can open a tab.
  const TAB_PARAMS: Record<string, string> = {
    'Access Control': 'access-control',
    'API Keys': 'api-keys',
    'Settings & Features': 'settings',
    Branding: 'branding',
    'Site banners': 'banners',
    'Terms of Service': 'terms',
  };
  // The operations service only accepts config writes from top admins.
  const READ_ONLY_FOR_ADMINS = ['Settings & Features', 'Branding'];

  let visibleTabs: string[] = $derived(
    Object.keys(TAB_PARAMS).filter(
      (tab) =>
        // PSAMA only accepts role, privilege, and connection writes from top admins.
        (tab !== 'Access Control' || $isTopAdmin) &&
        (tab !== 'Terms of Service' || config.features.termsOfService),
    ),
  );

  function tabFromUrl(url: URL): string | undefined {
    const requested = url.searchParams.get('tab');
    return visibleTabs.find((tab) => TAB_PARAMS[tab] === requested);
  }

  const startTab = untrack(() => tabFromUrl(page.url) ?? visibleTabs[0]);
  let tabSet: string = $state(startTab);
  let requestedTab: string = $state(startTab);
  let bannerEditorDirty = $state(false);
  let pendingTab: string | null = $state(null);

  function showTab(tab: string) {
    tabSet = tab;
    requestedTab = tab;
    replaceState(resolve(`/admin/configuration?tab=${TAB_PARAMS[tab]}`), page.state);
  }

  // A link that only changes the query (e.g. the nav's Configuration link, or the old
  // /admin/api-keys route) keeps this page mounted, so follow later navigations too. showTab's
  // replaceState doesn't update page.url, so this doesn't fire for tab clicks.
  $effect(() => {
    const linked = tabFromUrl(page.url) ?? visibleTabs[0];
    untrack(() => {
      if (linked !== tabSet) requestedTab = linked;
    });
  });

  $effect(() => {
    if (requestedTab !== tabSet) {
      if (tabSet === 'Site banners' && bannerEditorDirty) {
        pendingTab = requestedTab;
        requestedTab = tabSet;
      } else {
        untrack(() => showTab(requestedTab));
      }
    }
  });

  function resolveBannerTabChange(destination: string | null) {
    pendingTab = null;
    requestedTab = tabSet;
    if (destination) {
      bannerEditorDirty = false;
      showTab(destination);
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

<Content title="Configuration">
  {#if !$isTopAdmin && READ_ONLY_FOR_ADMINS.includes(tabSet)}
    <ErrorAlert data-testid="top-admin-only-error" title="Top Administrator Only" color="warning">
      <p>
        These settings are READ ONLY for admin users. Please contact your administrator to make
        changes.
      </p>
    </ErrorAlert>
  {/if}
  <Tabs value={tabSet} onValueChange={(e: { value: string }) => (requestedTab = e.value)}>
    {#snippet list()}
      {#each visibleTabs as tab (tab)}
        <TabItem bind:group={requestedTab} value={tab}>{tab}</TabItem>
      {/each}
    {/snippet}
    {#snippet content()}
      {#if $isTopAdmin}
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
                    class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
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
                    class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
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
                    class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
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
      {/if}
      <Tabs.Panel value="API Keys">
        {#if tabSet === 'API Keys'}
          <ApiKeysPanel />
        {/if}
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
