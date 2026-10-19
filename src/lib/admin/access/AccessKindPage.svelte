<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ConnectionForm from '#lib/admin/access/ConnectionForm.svelte';
  import PrivilegeForm from '#lib/admin/access/PrivilegeForm.svelte';
  import RoleForm from '#lib/admin/access/RoleForm.svelte';

  import type { Connection } from '#lib/auth/model/connection.ts';
  import type { Privilege } from '#lib/auth/model/privilege.ts';
  import type { Role } from '#lib/auth/model/role.ts';
  import type { AccessKind } from '#lib/admin/access/model/kind.ts';
  import * as admin from '#lib/admin/entities.ts';

  interface Props {
    kind: AccessKind;
    /** The record to edit; the page creates a new one without it. */
    uuid?: string;
  }

  let { kind, uuid }: Props = $props();

  type List = { load(): Promise<void> };

  // `lists` are the resources the form's options come from.
  const KINDS: Record<AccessKind, { label: string; editTitle?: string; lists: List[] }> = {
    connection: { label: 'Connection', editTitle: 'Edit Connection Configuration', lists: [] },
    privilege: { label: 'Privilege', lists: [admin.applications] },
    role: { label: 'Role', lists: [admin.privileges] },
  };
  const RESOURCES = {
    connection: admin.connections,
    privilege: admin.privileges,
    role: admin.roles,
  } satisfies Record<AccessKind, unknown>;

  type Entities = { connection: Connection; privilege: Privilege; role: Role };
  type Loaded = { [K in AccessKind]: { kind: K; entity?: Entities[K] } }[AccessKind];

  const descriptor = $derived(KINDS[kind]);
  const action = $derived(uuid ? 'Edit' : 'New');
  const title = $derived(`${action} ${descriptor.label}`);
  const pageTitle = $derived((uuid && descriptor.editTitle) || title);

  // Nothing to fetch (a new connection) renders the form straight away, without the spinner.
  function load(): Loaded | Promise<Loaded> {
    if (!uuid && descriptor.lists.length === 0) return { kind } as Loaded;
    return fetchEntity(kind, uuid, descriptor.lists);
  }

  async function fetchEntity(kind: AccessKind, uuid: string | undefined, lists: List[]) {
    const entity = uuid ? await RESOURCES[kind].get(uuid) : undefined;
    for (const list of lists) await list.load();
    // `entity` came from RESOURCES[kind], so it matches `kind`; TS can't correlate the two.
    return { kind, entity } as Loaded;
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | {pageTitle}</title>
</svelte:head>

<Content {title} backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then loaded}
    <section id="admin-{kind}-{action.toLowerCase()}">
      {#if loaded.kind === 'connection'}
        <ConnectionForm connection={loaded.entity} />
      {:else if loaded.kind === 'privilege'}
        <PrivilegeForm applicationList={admin.applications.options} privilege={loaded.entity} />
      {:else}
        <RoleForm privilegeList={admin.privileges.options} role={loaded.entity} />
      {/if}
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      {#if uuid}
        An error occurred while retrieving {kind} {uuid}.
      {:else}
        Something went wrong when sending your request.
      {/if}
    </ErrorAlert>
  {/await}
</Content>
