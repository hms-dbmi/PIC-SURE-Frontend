<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    delete: RequiredField;
    save: { previous: RequiredField; current: RequiredField };
  }>();

  import type { RequiredField } from '$lib/models/Connection';

  export let field: RequiredField = { label: '', id: '' };
  export let duplicate: boolean = false;

  let label: string = field.label;
  let id: string = field.id;

  $: dirtyForm = field.id !== id || field.label !== label;
  const newField: boolean = field.label === '' || field.id === '';
  let edit: boolean = newField;

  const saveField = () => {
    const currentField = { label, id };
    dispatch('save', { previous: field, current: currentField });
    edit = false;
  };
  const resetField = () => {
    label = field.label;
    id = field.id;
  };
  const deleteField = () => dispatch('delete', { label, id });
  const toggleEdit = () => (edit = !edit);
</script>

<div
  class="flex gap-4 p-3 odd:bg-surface-100-800-token even:bg-surface-50-900-token"
  data-testid={`required-field-row-${field.id ? field.id : 'new'}`}
>
  <label class="label flex-1">
    <span>Label:</span>
    <input
      type="text"
      bind:value={label}
      disabled={!edit}
      class="input"
      minlength="1"
      maxlength="255"
    />
  </label>
  <label class="label flex-1">
    <span>ID:</span>
    <input
      type="text"
      bind:value={id}
      disabled={!edit}
      class="input {duplicate &&
        'variant-ghost-warning border-warning-500-400-token focus:border-warning-700-200-token'}"
      minlength="1"
      maxlength="255"
    />
  </label>
  <div class="flex-none content-end py-2">
    {#if edit}
      <button
        type="button"
        title="Save"
        data-testid="required-field-save-btn"
        class="btn-icon-color"
        disabled={!label || !id || !dirtyForm}
        on:click={saveField}
      >
        <i class="fa-solid fa-floppy-disk fa-xl"></i>
        <span class="sr-only">Save</span>
      </button>
      {#if dirtyForm}
        <button
          type="button"
          title="Reset and cancel"
          class="btn-icon-color"
          data-testid="required-field-reset-btn"
          on:click={resetField}
        >
          <i class="fa-solid fa-arrow-rotate-right fa-xl"></i>
          <span class="sr-only">Reset and cancel</span>
        </button>
      {:else if !newField && !dirtyForm}
        <button
          type="button"
          title="Cancel"
          class="btn-icon-color"
          data-testid="required-field-cancel-btn"
          on:click={toggleEdit}
        >
          <i class="fa-solid fa-ban fa-xl"></i>
          <span class="sr-only">Cancel</span>
        </button>
      {/if}
    {:else}
      <button
        type="button"
        title="Edit"
        class="btn-icon-color"
        data-testid="required-field-edit-btn"
        on:click={toggleEdit}
      >
        <i class="fa-solid fa-pen fa-xl"></i>
        <span class="sr-only">Edit</span>
      </button>
    {/if}
    <button
      type="button"
      title="Delete"
      class="btn-icon-color"
      data-testid="required-field-delete-btn"
      on:click={deleteField}
    >
      <i class="fa-solid fa-trash fa-xl"></i>
      <span class="sr-only">Delete</span>
    </button>
  </div>
</div>
