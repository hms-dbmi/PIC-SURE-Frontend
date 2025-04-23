<script lang="ts">
  const modalStore = getModalStore();
  const toastStore = getToastStore();
  import { isTopAdmin } from '$lib/stores/User';

  import { goto } from '$app/navigation';

  import RolesStore from '$lib/stores/Roles';
  const { deleteRole } = RolesStore;

  let { data = { cell: '', row: { name: '' } } } = $props();

  function editRole(event: Event){
    event.stopPropagation();
    goto(`/admin/configuration/role/${data.cell}/edit`);
  }

  function deleteModal(event: Event){
    event.stopPropagation();
    const name = data.row.name;
    modalStore.trigger({
      type: 'confirm',
      title: 'Delete Role?',
      body: `Are you sure you want to delete role '${name}'?`,
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: async (confirm: boolean) => {
        if (!confirm || !$isTopAdmin) return;

        try {
          await deleteRole(data.cell);
          toastStore.trigger({
            message: `Successfully deleted role '${name}'`,
            background: 'preset-filled-success-500',
          });
        } catch (error: unknown) {
          console.error(error);
          if ((error as { status?: number })?.status === 409) {
            toastStore.trigger({
              message: `Cannot delete role '${name}' as it is still in use by a user`,
              background: 'preset-filled-error-500',
            });
          } else {
            console.error(error);
            toastStore.trigger({
              message: `An unknown error occured while deleting role '${name}'`,
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
    data-testid={`role-edit-btn-${data.cell}`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    onclick={editRole}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <button
    data-testid={`role-delete-btn-${data.cell}`}
    type="button"
    title="Delete"
    class="btn-icon-color"
    onclick={deleteModal}
  >
    <i class="fa-solid fa-trash fa-xl"></i>
    <span class="sr-only">Delete</span>
  </button>
</div>
