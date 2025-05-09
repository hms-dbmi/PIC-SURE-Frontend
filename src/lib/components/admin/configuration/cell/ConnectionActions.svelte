<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();
  import { isTopAdmin } from '$lib/stores/User';

  import { goto } from '$app/navigation';

  import { deleteConnection } from '$lib/stores/Connections';

  export let data = { cell: '', row: { label: '' } };

  function deleteModal() {
    const label = data.row.label;
    modalStore.trigger({
      type: 'confirm',
      title: 'Delete Connection?',
      body: `Are you sure you want to delete connection '${label}'?`,
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: async (confirm: boolean) => {
        if (!confirm || !$isTopAdmin) return;

        try {
          await deleteConnection(data.cell);
          toastStore.trigger({
            message: `Successfully deleted connection '${label}'`,
            background: 'variant-filled-success',
          });
        } catch (error: unknown) {
          console.error(error);
          if ((error as { status?: number })?.status === 409) {
            toastStore.trigger({
              message: `Cannot delete connection '${label}' as it is still in use by an application or user`,
              background: 'variant-filled-error',
            });
          } else {
            toastStore.trigger({
              message: `An unknown error occured while deleting connection '${label}'`,
              background: 'variant-filled-error',
            });
          }
        }
      },
    });
  }
</script>

<div class="w-20 min-w-20">
  <button
    data-testid={`connection-edit-btn-${data.cell}`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    on:click|stopPropagation={() => goto(`/admin/configuration/connection/${data.cell}/edit`)}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <button
    data-testid={`connection-delete-btn-${data.cell}`}
    type="button"
    title="Delete"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    on:click|stopPropagation={deleteModal}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
    <span class="sr-only">Delete</span>
  </button>
</div>
