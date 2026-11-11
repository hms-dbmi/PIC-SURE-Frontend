<script lang="ts" module>
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ConnectionForm from '#lib/admin/access/ConnectionForm.svelte';
  import PrivilegeForm from '#lib/admin/access/PrivilegeForm.svelte';
  import RoleForm from '#lib/admin/access/RoleForm.svelte';

  import type { AccessKind } from '#lib/admin/access/model/kind.ts';
  import * as admin from '#lib/admin/entities.ts';

  // Each `load` fetches the record and the lists its form offers as options, and tags the
  // result with its kind so the template can narrow `entity`.
  const KINDS = {
    connection: {
      label: 'Connection',
      editTitle: 'Edit Connection Configuration',
      // A new connection has nothing to fetch: answer synchronously so the form renders
      // straight away, without the spinner.
      load: (uuid?: string) =>
        uuid
          ? admin.connections.get(uuid).then((entity) => ({ kind: 'connection' as const, entity }))
          : { kind: 'connection' as const, entity: undefined },
    },
    privilege: {
      label: 'Privilege',
      load: async (uuid?: string) => {
        const entity = uuid ? await admin.privileges.get(uuid) : undefined;
        await admin.applications.load();
        return { kind: 'privilege' as const, entity };
      },
    },
    role: {
      label: 'Role',
      load: async (uuid?: string) => {
        const entity = uuid ? await admin.roles.get(uuid) : undefined;
        await admin.privileges.load();
        return { kind: 'role' as const, entity };
      },
    },
  } satisfies Record<AccessKind, { label: string; editTitle?: string; load: unknown }>;

  /** The page heading: "New Role", "Edit Connection". */
  export function accessKindTitle(kind: AccessKind, uuid?: string) {
    return `${uuid ? 'Edit' : 'New'} ${KINDS[kind].label}`;
  }
</script>

<script lang="ts">
  interface Props {
    kind: AccessKind;
    /** The record to edit; the page creates a new one without it. */
    uuid?: string;
  }

  let { kind, uuid }: Props = $props();

  const descriptor: { label: string; editTitle?: string } = $derived(KINDS[kind]);
  const action = $derived(uuid ? 'edit' : 'new');
  const pageTitle = $derived((uuid && descriptor.editTitle) || accessKindTitle(kind, uuid));
</script>

<svelte:head>
  <title>{config.branding.applicationName} | {pageTitle}</title>
</svelte:head>

{#await KINDS[kind].load(uuid)}
  <Loading />
{:then loaded}
  <section id="admin-{kind}-{action}">
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
