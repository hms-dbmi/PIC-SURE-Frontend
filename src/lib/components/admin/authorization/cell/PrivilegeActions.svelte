<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  export let data = { cell: '', row: { name: '' } };

  function deleteModal() {
    modalStore.trigger({
      type: 'confirm',
      title: 'Delete Privilege?',
      body: `Are you sure you want to delete privilege '${data.row.name}'?`,
      buttonTextConfirm: 'Yes',
      buttonTextCancel: 'No',
      response: (confirm: boolean) => {
        if (!confirm) return;
        // TODO: add delete logic using data.cell
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
