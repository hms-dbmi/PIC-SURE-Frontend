<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { deleteRole } from '#lib/admin/access/Roles.ts';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';

  const { data = { cell: '', row: { name: '' } } } = $props();

  function editRole(event: Event) {
    event.stopPropagation();
    goto(resolve(`admin/configuration/role/${data.cell}/edit`));
  }

  async function deleteRow() {
    if (!$isTopAdmin) return;
    try {
      await deleteRole(data.cell);
      toaster.success({
        title: `Successfully deleted role '${data.row.name}'`,
      });
    } catch (error) {
      console.error(error);
      if ((error as { status?: number })?.status === 409) {
        toaster.error({
          title: `Cannot delete role '${data.row.name}' as it is still in use by a user`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting role '${data.row.name}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <button
    data-testid={`admin-role-edit-${data.cell}`}
    type="button"
    title="Edit (e)"
    data-key="e"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    onclick={editRole}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit (e)</span>
  </button>
  <ConfirmDialog
    data-testid="admin-role-delete-{data.cell}"
    title="Delete Role?"
    triggerTitle="Delete (d)"
    triggerKey="d"
    confirmLabel="Yes"
    cancelLabel="No"
    disabled={!$isTopAdmin}
    onconfirm={deleteRow}
    triggerClass="btn-icon-color"
  >
    {#snippet trigger()}
      <i class="fa-solid fa-trash fa-xl"></i>
      <span class="sr-only">Delete (d)</span>
    {/snippet}
    Are you sure you want to delete role '{data.row.name}'?
  </ConfirmDialog>
</div>
