<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ConnectionForm from '#lib/admin/access/ConnectionForm.svelte';
  import PrivilegeForm from '#lib/admin/access/PrivilegeForm.svelte';
  import RoleForm from '#lib/admin/access/RoleForm.svelte';

  import type { AccessKind } from '#lib/admin/access/model/kind.ts';
  import * as admin from '#lib/admin/entities.ts';

  interface Props {
    kind: AccessKind;
    /** The record to edit; the page creates a new one without it. */
    uuid?: string;
  }

  let { kind, uuid }: Props = $props();

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

  const descriptor: { label: string; editTitle?: string } = $derived(KINDS[kind]);
  const action = $derived(uuid ? 'Edit' : 'New');
  const title = $derived(`${action} ${descriptor.label}`);
  const pageTitle = $derived((uuid && descriptor.editTitle) || title);
</script>

<svelte:head>
  <title>{config.branding.applicationName} | {pageTitle}</title>
</svelte:head>

<Content {title} backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await KINDS[kind].load(uuid)}
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
