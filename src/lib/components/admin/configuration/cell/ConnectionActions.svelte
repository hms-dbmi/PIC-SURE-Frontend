<script lang="ts">
  import { goto } from '$app/navigation';

  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';
  import { deleteConnection } from '$lib/stores/Connections';
  import Modal from '$lib/components/Modal.svelte';

  const { data = { cell: '', row: { label: '' } } } = $props();

  function editConnection(event: Event) {
    event.stopPropagation();
    goto(`/admin/configuration/connection/${data.cell}/edit`);
  }

  async function deleteRow() {
    if (!$isTopAdmin) return;
    const label = data.row.label;
    try {
      await deleteConnection(data.cell);
      toaster.success({
        title: `Successfully deleted connection '${data.row.label}'`,
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
  <button
    data-testid={`connection-${data.cell}-edit-btn`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    onclick={editConnection}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <Modal
    data-testid="connection-{data.cell}-delete"
    title="Delete Connection?"
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
    Are you sure you want to delete connection '{data.row.label}'?
  </Modal>
</div>
