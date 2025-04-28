<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();

  import { goto } from '$app/navigation';

  import PrivilegesStore from '$lib/stores/Privileges';
  const { deletePrivilege } = PrivilegesStore;

  export let data = { cell: '', row: { name: '' } };

  function deleteModal() {
    const name = data.row.name;
    modalStore.trigger({
      type: 'confirm',
      title: 'Delete Privilege?',
      body: `Are you sure you want to delete privilege '${name}'?`,
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: async (confirm: boolean) => {
        if (!confirm) return;

        try {
          await deletePrivilege(data.cell);
          toastStore.trigger({
            message: `Successfully deleted privilege '${name}'`,
            background: 'variant-filled-success',
          });
        } catch (error) {
          console.error(error);
          toastStore.trigger({
            message: `An error occured while deleting privilege '${name}'`,
            background: 'variant-filled-error',
          });
        }
      },
    });
  }
</script>

<div class="w-20 min-w-20">
  <button
    data-testid={`privilege-edit-btn-${data.cell}`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    on:click|stopPropagation={() => goto(`/admin/configuration/privilege/${data.cell}/edit`)}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <button
    data-testid={`privilege-delete-btn-${data.cell}`}
    type="button"
    title="Delete"
    class="btn-icon-color"
    on:click|stopPropagation={deleteModal}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
    <span class="sr-only">Delete</span>
  </button>
</div>
