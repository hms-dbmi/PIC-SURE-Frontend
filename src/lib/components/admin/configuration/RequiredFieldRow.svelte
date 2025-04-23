<script lang="ts">
  import type { RequiredField } from '$lib/models/Connection';

  interface Props {
    field?: RequiredField;
    duplicate?: boolean;
    onsave?: (previous: RequiredField, current: RequiredField) => void;
    ondelete?: (field: RequiredField) => void;
  }

  let {
    field = { label: '', id: '' },
    duplicate = false,
    onsave = () => {},
    ondelete = () => {},
  }: Props = $props();

  let label: string = $state(field.label);
  let id: string = $state(field.id);

  let dirtyForm = $derived(field.id !== id || field.label !== label);
  const newField: boolean = field.label === '' || field.id === '';
  let edit: boolean = $state(newField);

  const saveField = () => {
    const currentField = { label, id };
    onsave(field, currentField);
    edit = false;
  };
  const resetField = () => {
    label = field.label;
    id = field.id;
  };
  const deleteField = () => ondelete({ label, id });
  const toggleEdit = () => (edit = !edit);
</script>

<div
  class="flex gap-4 p-3 odd:bg-surface-100-900 even:bg-surface-50-950"
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
        'preset-tonal-warning border border-warning-500 border-warning-600-400 focus:border-warning-800-200'}"
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
        onclick={saveField}
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
          onclick={resetField}
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
          onclick={toggleEdit}
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
        onclick={toggleEdit}
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
      onclick={deleteField}
    >
      <i class="fa-solid fa-trash fa-xl"></i>
      <span class="sr-only">Delete</span>
    </button>
  </div>
</div>
