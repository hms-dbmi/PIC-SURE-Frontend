<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';

  export let data = { cell: '', row: { name: '' } };

  function deleteModal() {
    const name = data.row.name;
    modalStore.trigger({
      type: 'confirm',
      title: 'Delete Connection?',
      body: `Are you sure you want to delete connection '${name}'?`,
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: async (confirm: boolean) => {
        if (!confirm) return;

        try {
          // TODO: delete connection
          toastStore.trigger({
            message: `Successfully deleted connection '${name}'`,
            background: 'variant-filled-success',
          });
        } catch (error) {
          console.error(error);
          toastStore.trigger({
            message: `An error occured while deleting connection '${name}'`,
            background: 'variant-filled-error',
          });
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
    on:click|stopPropagation={deleteModal}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
    <span class="sr-only">Delete</span>
  </button>
</div>
