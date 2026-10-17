<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { deleteConnection } from '#lib/admin/access/Connections.ts';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';

  const { data = { cell: '', row: { label: '' } } } = $props();

  function editConnection(event: Event) {
    event.stopPropagation();
    goto(resolve(`admin/configuration/connection/${data.cell}/edit`));
  }

  async function deleteRow() {
    if (!$isTopAdmin) return;
    const label = data.row.label;
    try {
      await deleteConnection(data.cell);
      toaster.success({
        title: `Successfully deleted connection '${label}'`,
      });
    } catch (error) {
      console.error(error);
      if ((error as { status?: number })?.status === 409) {
        toaster.error({
          title: `Cannot delete connection '${label}' as it is still in use by an application or user`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting connection '${label}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <IconButton
    icon="fa-solid fa-pen-to-square fa-xl"
    label="Edit (e)"
    data-testid={`admin-connection-edit-${data.cell}`}
    shortcut="e"
    disabled={!$isTopAdmin}
    onclick={editConnection}
  />
  <ConfirmButton
    icon="fa-solid fa-trash fa-xl"
    label="Delete (d)"
    shortcut="d"
    data-testid="admin-connection-delete-{data.cell}"
    title="Delete Connection?"
    confirmLabel="Yes"
    cancelLabel="No"
    disabled={!$isTopAdmin}
    onconfirm={deleteRow}
  >
    Are you sure you want to delete connection '{data.row.label}'?
  </ConfirmButton>
</div>
