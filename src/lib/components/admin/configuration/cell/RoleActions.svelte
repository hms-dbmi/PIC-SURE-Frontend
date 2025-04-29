<script lang="ts">
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';
  import { deleteRole } from '$lib/stores/Roles';
  import Modal from '$lib/components/Modal.svelte';

  const { data = { cell: '', row: { name: '' } } } = $props();

  function editRole(event: Event) {
    event.stopPropagation();
    goto(`/admin/configuration/role/${data.cell}/edit`);
  }

  async function deleteRow() {
    if (!isTopAdmin) return;
    try {
      await deleteRole(data.cell);
      toaster.success({
        title: `Successfully deleted role '${data.row.name}'`,
      });
    } catch (error) {
      console.error(error);
      if ((error as { status?: number })?.status === 409) {
        toaster.error({
          title: `Cannot delete role '${name}' as it is still in use by a user`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting role '${name}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <button
    data-testid={`role-${data.cell}-edit-btn`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    onclick={editRole}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <Modal
    data-testid="role-{data.cell}-delete"
    title="Delete Role?"
    confirmText="Yes"
    cancelText="No"
    disabled={!$isTopAdmin}
    onconfirm={deleteRow}
    triggerBase="btn-icon-color"
    withDefault
  >
    {#snippet trigger()}
      <i class="fa-solid fa-trash fa-xl"></i>
      <span class="sr-only">Delete</span>
    {/snippet}
    Are you sure you want to delete role '{data.row.name}'?
  </Modal>
</div>
