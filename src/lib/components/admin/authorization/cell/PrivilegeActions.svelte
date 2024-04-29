<script lang="ts">
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();
  const toastStore = getToastStore();

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

<a
  data-testid={`privilege-view-btn-${data.cell}`}
  href={`/admin/authorization/privilege/${data.cell}`}
  class="text-secondary-600 hover:text-primary-600"
>
  <i class="fa-solid fa-circle-info fa-xl"></i>
  <span class="sr-only">View Privilege</span>
</a>
<a
  data-testid={`privilege-edit-btn-${data.cell}`}
  href={`/admin/authorization/privilege/${data.cell}/edit`}
  class="text-secondary-600 hover:text-primary-600"
>
  <i class="fa-solid fa-pen-to-square fa-xl"></i>
  <span class="sr-only">Edit</span>
</a>
<button
  data-testid={`privilege-delete-btn-${data.cell}`}
  type="button"
  title="Delete"
  class="bg-initial text-secondary-600 hover:text-primary-600"
  on:click={deleteModal}
>
  <i class="fa-solid fa-trash fa-xl"></i>
  <span class="sr-only">Delete</span>
</button>
