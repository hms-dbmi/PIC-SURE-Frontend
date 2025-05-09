<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();
  import { isTopAdmin } from '$lib/stores/User';

  import { goto } from '$app/navigation';

  import RolesStore from '$lib/stores/Roles';
  const { deleteRole } = RolesStore;

  export let data = { cell: '', row: { name: '' } };

  function deleteModal() {
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
            background: 'variant-filled-success',
          });
        } catch (error: unknown) {
          console.error(error);
          if ((error as { status?: number })?.status === 409) {
            toastStore.trigger({
              message: `Cannot delete role '${name}' as it is still in use by a user`,
              background: 'variant-filled-error',
            });
          } else {
            console.error(error);
            toastStore.trigger({
              message: `An unknown error occured while deleting role '${name}'`,
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
    data-testid={`role-edit-btn-${data.cell}`}
    type="button"
    title="Edit"
    class="btn-icon-color"
    disabled={!$isTopAdmin}
    on:click|stopPropagation={() => goto(`/admin/configuration/role/${data.cell}/edit`)}
  >
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <button
    data-testid={`role-delete-btn-${data.cell}`}
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
