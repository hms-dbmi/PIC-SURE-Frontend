<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();

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
        if (!confirm) return;

        try {
          await deleteRole(data.cell);
          toastStore.trigger({
            message: `Successfully deleted role '${name}'`,
            background: 'variant-filled-success',
          });
        } catch (error) {
          console.error(error);
          toastStore.trigger({
            message: `An error occured while deleting role '${name}'`,
            background: 'variant-filled-error',
          });
        }
      },
    });
  }
</script>

<button
  data-testid={`role-view-btn-${data.cell}`}
  type="button"
  title="View"
  class="text-secondary-600 hover:text-primary-600"
  on:click|stopPropagation={() => goto(`/admin/authorization/role/${data.cell}`)}
>
  <i class="fa-solid fa-circle-info fa-xl"></i>
  <span class="sr-only">View Role</span>
</button>
<button
  data-testid={`role-edit-btn-${data.cell}`}
  type="button"
  title="Edit"
  class="text-secondary-600 hover:text-primary-600"
  on:click|stopPropagation={() => goto(`/admin/authorization/role/${data.cell}/edit`)}
>
  <i class="fa-solid fa-pen-to-square fa-xl"></i>
  <span class="sr-only">Edit</span>
</button>
<button
  data-testid={`role-delete-btn-${data.cell}`}
  type="button"
  title="Delete"
  class="bg-initial text-secondary-600 hover:text-primary-600"
  on:click|stopPropagation={deleteModal}
>
  <i class="fa-solid fa-trash fa-xl"></i>
  <span class="sr-only">Delete</span>
</button>
