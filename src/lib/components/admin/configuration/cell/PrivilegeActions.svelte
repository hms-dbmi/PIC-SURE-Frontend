<script lang="ts">
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';
  import { deletePrivilege } from '$lib/stores/Privileges';
  import Modal from '$lib/components/Modal.svelte';

  const { data = { cell: '', row: { name: '' } } } = $props();

  function editPrivilege(event: Event) {
    event.stopPropagation();
    goto(`/admin/configuration/privilege/${data.cell}/edit`);
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
          title: `Cannot delete privilege '${name}' as it is still in use by a role`,
        });
      } else {
        toaster.error({
          title: `An unknown error occured while deleting privilege '${name}'`,
        });
      }
    }
  }
</script>

<div class="w-20 min-w-20">
  <button
    data-testid={`privilege-${data.cell}-edit-btn`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    onclick={editPrivilege}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <Modal
    data-testid="privilege-{data.cell}-delete"
    title="Delete Privilege?"
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
    Are you sure you want to delete privilege '{data.row.name}'?
  </Modal>
</div>
