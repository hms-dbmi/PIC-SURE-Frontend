<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { session } from '#lib/auth/session.svelte.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import * as admin from '#lib/admin/entities.ts';
  import type { AccessKind } from '#lib/admin/access/model/kind.ts';

  type Row = { name?: string; label?: string };

  interface Props {
    kind: AccessKind;
    /** The table's cell contract: `cell` is the row's uuid. */
    data: { cell: string; row: Row };
  }

  let { kind, data }: Props = $props();

  const KINDS = {
    connection: {
      title: 'Delete Connection?',
      name: (row: Row) => row.label,
      resource: admin.connections,
      inUseBy: 'an application or user',
    },
    privilege: {
      title: 'Delete Privilege?',
      name: (row: Row) => row.name,
      resource: admin.privileges,
      inUseBy: 'a role',
    },
    role: {
      title: 'Delete Role?',
      name: (row: Row) => row.name,
      resource: admin.roles,
      inUseBy: 'a user',
    },
  } satisfies Record<AccessKind, unknown>;

  const config = $derived(KINDS[kind]);
  const name = $derived(config.name(data.row) ?? '');

  function edit(event: Event) {
    event.stopPropagation();
    goto(
      resolve(
        '/(picsure)/(authorized)/(admin)/admin/configuration/(top-admin)/[kind=accessKind]/[uuid]/edit',
        { kind, uuid: data.cell },
      ),
    );
  }

  async function remove() {
    if (!session.isTopAdmin) return;
    // The row goes once the delete lands; keep what the toasts need.
    const { resource, inUseBy } = config;
    const subject = `${kind} '${name}'`;
    try {
      await resource.remove(data.cell);
      toaster.success({ title: `Successfully deleted ${subject}` });
    } catch (error) {
      console.error(error);
      toaster.error({
        title:
          (error as { status?: number })?.status === 409
            ? `Cannot delete ${subject} as it is still in use by ${inUseBy}`
            : `An unknown error occured while deleting ${subject}`,
      });
    }
  }
</script>

<div class="w-20 min-w-20">
  <IconButton
    icon="fa-solid fa-pen-to-square fa-xl"
    label="Edit (e)"
    data-testid="admin-{kind}-edit-{data.cell}"
    shortcut="e"
    disabled={!session.isTopAdmin}
    onclick={edit}
  />
  <ConfirmButton
    icon="fa-solid fa-trash fa-xl"
    label="Delete (d)"
    shortcut="d"
    data-testid="admin-{kind}-delete-{data.cell}"
    title={config.title}
    confirmLabel="Yes"
    cancelLabel="No"
    disabled={!session.isTopAdmin}
    onconfirm={remove}
  >
    Are you sure you want to delete {kind} '{name}'?
  </ConfirmButton>
</div>
