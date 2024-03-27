<script lang="ts">
  export let data = { cell: '', row: { status: '' } };
</script>

<button
  type="button"
  title="Information"
  class="bg-initial text-secondary-600 hover:text-primary-600"
>
  <i class="fa-solid fa-circle-info fa-xl"></i>
  <span class="sr-only">View Information</span>
</button>

{#if data.row.status === 'Active'}
  <button type="button" title="Edit" class="bg-initial text-secondary-600 hover:text-primary-600">
    <i class="fa-solid fa-pen-to-square fa-xl"></i>
    <span class="sr-only">Edit</span>
  </button>
  <button
    type="button"
    title="Deactivate user"
    class="bg-initial text-secondary-600 hover:text-primary-600"
  >
    <i class="fa-solid fa-circle-xmark fa-xl"></i>
    <span class="sr-only">Deactivate user</span>
  </button>
{:else}
  <button
    type="button"
    title="Reactivate user"
    class="bg-initial text-secondary-600 hover:text-primary-600"
  >
    <i class="fa-solid fa-circle-check fa-xl"></i>
    <span class="sr-only">Reactivate user</span>
  </button>
{/if}
