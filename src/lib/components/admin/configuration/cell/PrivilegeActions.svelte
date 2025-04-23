<script lang="ts">
  const modalStore = getModalStore();
  const toastStore = getToastStore();
  import { isTopAdmin } from '$lib/stores/User';

  import { goto } from '$app/navigation';

  import PrivilegesStore from '$lib/stores/Privileges';
  const { deletePrivilege } = PrivilegesStore;

  let { data = { cell: '', row: { name: '' } } } = $props();

  function editPrivilege(event: Event){
    event.stopPropagation();
    goto(`/admin/configuration/privilege/${data.cell}/edit`);
  }

  function deleteModal(event: Event){
    event.stopPropagation();
    const name = data.row.name;
    modalStore.trigger({
      type: 'confirm',
      title: 'Delete Privilege?',
      body: `Are you sure you want to delete privilege '${name}'?`,
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: async (confirm: boolean) => {
        if (!confirm || !$isTopAdmin) return;

        try {
          await deletePrivilege(data.cell);
          toastStore.trigger({
            message: `Successfully deleted privilege '${name}'`,
            background: 'preset-filled-success-500',
          });
        } catch (error: unknown) {
          console.error(error);
          if ((error as { status?: number })?.status === 409) {
            toastStore.trigger({
              message: `Cannot delete privilege '${name}' as it is still in use by a role`,
              background: 'preset-filled-error-500',
            });
          } else {
            console.error(error);
            toastStore.trigger({
              message: `An unknown error occured while deleting privilege '${name}'`,
              background: 'preset-filled-error-500',
            });
          }
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
    onclick={editPrivilege}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <button
    data-testid={`privilege-delete-btn-${data.cell}`}
    type="button"
    title="Delete"
    class="btn-icon-color"
    onclick={deleteModal}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
    <span class="sr-only">Delete</span>
  </button>
</div>
