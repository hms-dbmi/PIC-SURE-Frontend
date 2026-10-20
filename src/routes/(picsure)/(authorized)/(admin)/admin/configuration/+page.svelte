<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { afterNavigate, beforeNavigate, goto, replaceState } from '$app/navigation';
  import { page } from '$app/state';

  import { config } from '#lib/config/config.svelte.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import ClientTable from '#lib/ui/datatable/ClientTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import Tabs from '#lib/ui/Tabs.svelte';
  import TermsEditor from '#lib/admin/terms/TermsEditor.svelte';
  import EntityActions from '#lib/admin/access/cell/EntityActions.svelte';
  import Application from '#lib/admin/access/cell/Application.svelte';
  import RequiredFields from '#lib/admin/access/cell/RequiredFields.svelte';
  import ConfigKindTab from '#lib/admin/settings/ConfigKindTab.svelte';
  import BannerManagementView from '#lib/banners/components/admin/BannerManagementView.svelte';
  import ApiKeysPanel from '#lib/admin/apiKeys/ApiKeysPanel.svelte';

  import * as admin from '#lib/admin/entities.ts';
  import type { AccessKind } from '#lib/admin/access/model/kind.ts';
  import type { Role } from '#lib/auth/model/role.ts';
  import type { Privilege } from '#lib/auth/model/privilege.ts';
  import type { Connection } from '#lib/auth/model/connection.ts';
  import { session } from '#lib/auth/session.svelte.ts';

  import Loading from '#lib/ui/Loading.svelte';
  import { UnsavedChanges, setUnsavedChanges } from '#lib/ui/unsavedGuard.svelte.ts';

  // Tab label -> its ?tab= value, so links (e.g. the old /admin/api-keys route) can open a tab.
  const TAB_PARAMS: Record<string, string> = {
    'Access Control': 'access-control',
    'Site banners': 'banners',
    'Settings & Features': 'settings',
    Branding: 'branding',
    'API Keys': 'api-keys',
    'Terms of Service': 'terms',
  };
  let visibleTabs: string[] = $derived(
    Object.keys(TAB_PARAMS).filter(
      (tab) =>
        // PSAMA only accepts role, privilege, and connection writes from top admins.
        (tab !== 'Access Control' || session.isTopAdmin) &&
        (tab !== 'Terms of Service' || config.features.termsOfService),
    ),
  );

  function tabFromUrl(url: typeof page.url): string | undefined {
    const requested = url.searchParams.get('tab');
    return visibleTabs.find((tab) => TAB_PARAMS[tab] === requested);
  }

  const startTab = untrack(() => tabFromUrl(page.url) ?? visibleTabs[0]);
  let tabSet: string = $state(startTab);
  // The banner editor and order guard register here, so a tab change asks before discarding.
  const unsaved = setUnsavedChanges(new UnsavedChanges());

  function showTab(tab: string) {
    tabSet = tab;
    replaceState(resolve(`admin/configuration?tab=${TAB_PARAMS[tab]}`), page.state);
  }

  // A link that only changes the query (e.g. the nav's Configuration link, or the old
  // /admin/api-keys route) keeps this page mounted, so follow later navigations too. showTab's
  // replaceState doesn't update page.url, so this doesn't fire for tab clicks. The banner editor's
  // navigation guard has already confirmed any unsaved changes by the time the URL changes.
  $effect(() => {
    const linked = tabFromUrl(page.url) ?? visibleTabs[0];
    untrack(() => {
      if (linked !== tabSet) showTab(linked);
    });
  });

  // A link to the Site banners tab while it's open (e.g. the nav's Configuration link for admins)
  // doesn't change tabs, so remount the view to drop the changes the editor's guard discarded.
  let bannerViewKey = $state(0);
  let leftBannersOpen = false;
  beforeNavigate(() => {
    leftBannersOpen = tabSet === 'Site banners';
  });
  afterNavigate(({ type }) => {
    if (type !== 'enter' && leftBannersOpen && tabSet === 'Site banners') bannerViewKey += 1;
  });

  const roleColumns: Column<Role>[] = [
    { dataElement: 'name', label: 'Name', sort: true },
    { dataElement: 'description', label: 'Description', sort: true },
    { dataElement: 'uuid', label: 'Actions', class: 'text-center', cell: roleActions },
  ];

  const privilegeColumns: Column<Privilege>[] = [
    { dataElement: 'name', label: 'Name', sort: true },
    { dataElement: 'description', label: 'Description', sort: true },
    { dataElement: 'application', label: 'Application Name', sort: true, cell: application },
    { dataElement: 'uuid', label: 'Actions', class: 'text-center', cell: privilegeActions },
  ];

  const connectionColumns: Column<Connection>[] = [
    { dataElement: 'label', label: 'Label', sort: true },
    { dataElement: 'id', label: 'ID', sort: true },
    { dataElement: 'subPrefix', label: 'Sub prefix', sort: true },
    { dataElement: 'requiredFields', label: 'Required fields', cell: requiredFields },
    { dataElement: 'uuid', label: 'Actions', class: 'text-center', cell: connectionActions },
  ];

  async function loadAppsAndPriv() {
    await admin.privileges.load();
    await admin.applications.load();
  }

  const editOnClick =
    (kind: AccessKind) =>
    ({ uuid }: { uuid?: string }) => {
      goto(
        resolve(
          '/(picsure)/(authorized)/(admin)/admin/configuration/(top-admin)/[kind=accessKind]/[uuid]/edit',
          { kind, uuid: uuid ?? '' },
        ),
      );
    };
</script>

{#snippet roleActions(row: Role)}
  <EntityActions kind="role" uuid={row.uuid ?? ''} {row} />
{/snippet}

{#snippet privilegeActions(row: Privilege)}
  <EntityActions kind="privilege" uuid={row.uuid ?? ''} {row} />
{/snippet}

{#snippet connectionActions(row: Connection)}
  <EntityActions kind="connection" uuid={row.uuid ?? ''} {row} />
{/snippet}

{#snippet application(row: Privilege)}
  <Application application={row.application} />
{/snippet}

{#snippet requiredFields(row: Connection)}
  <RequiredFields requiredFields={row.requiredFields} />
{/snippet}

<svelte:head>
  <title>{config.branding.applicationName} | Configuration</title>
</svelte:head>

<!-- The operations service only accepts config writes from top admins. Tabs keep hidden panels
     mounted, so only the open tab renders its notice. -->
{#snippet readOnlyNotice(tab: string)}
  {#if !session.isTopAdmin && tabSet === tab}
    <ErrorAlert
      data-testid="admin-top-admin-required"
      title="Top Administrator Only"
      color="warning"
    >
      <p>
        These settings are READ ONLY for admin users. Please contact your administrator to make
        changes.
      </p>
    </ErrorAlert>
  {/if}
{/snippet}

<Content title="Configuration">
  <Tabs
    label="Configuration sections"
    tabs={visibleTabs.map((tab) => ({ value: tab, label: tab }))}
    value={tabSet}
    onchange={(tab) => unsaved.request(tab, () => showTab(tab))}
  >
    {#snippet panel(tab)}
      {#if tab === 'Access Control'}
        <div id="admin-role-section" class="mb-10">
          <h2>Roles Management</h2>
          {#await admin.roles.load()}
            <Loading />
          {:then}
            <div class="flex gap-4 my-6">
              <div class="flex-auto">
                <Button
                  variant="tonal"
                  data-testid="admin-role-add"
                  href={resolve(
                    '/(picsure)/(authorized)/(admin)/admin/configuration/(top-admin)/[kind=accessKind]/new',
                    { kind: 'role' },
                  )}
                >
                  + Add Role
                </Button>
              </div>
            </div>
            <ClientTable
              tableName="Roles"
              data-testid="admin-role-table"
              id="admin-role-table"
              rows={admin.roles.items}
              columns={roleColumns}
              rowClickHandler={editOnClick('role')}
              isClickable
            />
          {:catch}
            <ErrorAlert title="API Error">
              Something went wrong when sending your request for roles.
            </ErrorAlert>
          {/await}
        </div>
        <div id="admin-privilege-section" class="mb-10">
          <h2>Privileges Management</h2>
          {#await loadAppsAndPriv()}
            <Loading />
          {:then}
            <div class="flex gap-4 my-6">
              <div class="flex-auto">
                <Button
                  variant="tonal"
                  data-testid="admin-privilege-add"
                  href={resolve(
                    '/(picsure)/(authorized)/(admin)/admin/configuration/(top-admin)/[kind=accessKind]/new',
                    { kind: 'privilege' },
                  )}
                >
                  + Add Privilege
                </Button>
              </div>
            </div>
            <ClientTable
              tableName="Privileges"
              data-testid="admin-privilege-table"
              id="admin-privilege-table"
              rows={admin.privileges.items}
              columns={privilegeColumns}
              rowClickHandler={editOnClick('privilege')}
              isClickable
            />
          {:catch}
            <ErrorAlert title="API Error">
              Something went wrong when sending your request for priviledges and applications.
            </ErrorAlert>
          {/await}
        </div>
        <div id="admin-connection-section" class="mb-10">
          <h2>Connections Management</h2>
          {#await admin.connections.load()}
            <Loading />
          {:then}
            <div class="flex gap-4 my-6">
              <div class="flex-auto">
                <Button
                  variant="tonal"
                  data-testid="admin-connection-add"
                  href={resolve(
                    '/(picsure)/(authorized)/(admin)/admin/configuration/(top-admin)/[kind=accessKind]/new',
                    { kind: 'connection' },
                  )}
                >
                  + Add Connection
                </Button>
              </div>
            </div>
            <ClientTable
              tableName="Connections"
              data-testid="admin-connection-table"
              id="admin-connection-table"
              rows={admin.connections.items}
              columns={connectionColumns}
              rowClickHandler={editOnClick('connection')}
              isClickable
            />
          {:catch}
            <ErrorAlert title="API Error">
              Something went wrong when sending your request for connections.
            </ErrorAlert>
          {/await}
        </div>
      {:else if tab === 'Site banners'}
        {#if tabSet === 'Site banners'}
          {#key bannerViewKey}
            <BannerManagementView />
          {/key}
        {/if}
      {:else if tab === 'Settings & Features'}
        {@render readOnlyNotice('Settings & Features')}
        <ConfigKindTab
          kinds={['features', 'settings']}
          title="Settings & Features"
          readOnly={!session.isTopAdmin}
        />
      {:else if tab === 'Branding'}
        {@render readOnlyNotice('Branding')}
        <ConfigKindTab kinds={['branding']} title="Branding" readOnly={!session.isTopAdmin} />
      {:else if tab === 'API Keys'}
        {#if tabSet === 'API Keys'}
          <ApiKeysPanel />
        {/if}
      {:else if tab === 'Terms of Service'}
        <TermsEditor />
      {/if}
    {/snippet}
  </Tabs>
</Content>
