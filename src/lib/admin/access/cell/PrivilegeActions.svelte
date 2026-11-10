<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { deletePrivilege } from '#lib/admin/access/Privileges.ts';
  import Modal from '#lib/ui/dialog/Modal.svelte';

  const { data = { cell: '', row: { name: '' } } } = $props();

  function editPrivilege(event: Event) {
    event.stopPropagation();
    goto(resolve(`admin/configuration/privilege/${data.cell}/edit`));
  }

  async function deleteRow() {
    if (!$isTopAdmin) return;
    try {
      await deletePrivilege(data.cell);
      toaster.success({
        title: `Successfully deleted privilege '${data.row.name}'`,
      });
    } catch (error) {
      console.error(error);
      if ((error as { status?: number })?.status === 409) {
        toaster.error({
          title: `Cannot delete privilege '${data.row.name}' as it is still in use by a role`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting privilege '${data.row.name}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <button
    data-testid={`admin-privilege-edit-${data.cell}`}
    type="button"
    title="Edit (e)"
    data-key="e"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    onclick={editPrivilege}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit (e)</span>
  </button>
  <Modal
    data-testid="admin-privilege-delete-{data.cell}"
    title="Delete Privilege?"
    triggerTitle="Delete (d)"
    data-key="d"
    confirmText="Yes"
    cancelText="No"
    disabled={!$isTopAdmin}
    onconfirm={deleteRow}
    triggerBase="btn-icon-color"
    withDefault
  >
    {#snippet trigger()}
      <i class="fa-solid fa-trash fa-xl"></i>
      <span class="sr-only">Delete (d)</span>
    {/snippet}
    Are you sure you want to delete privilege '{data.row.name}'?
  </Modal>
</div>
