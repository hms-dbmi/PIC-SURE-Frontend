<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import type { RequiredField } from '#lib/auth/model/connection.ts';
  import { tones } from '#lib/ui/surface.ts';

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

  let label: string = $derived(field.label);
  let id: string = $derived(field.id);

  let dirtyForm = $derived(field.id !== id || field.label !== label);
  const newField: boolean = $derived(field.label === '' || field.id === '');
  // svelte-ignore state_referenced_locally
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
  data-testid={`admin-required-field-row-${field.id ? field.id : 'new'}`}
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
        `${tones['tonal-warning']} border border-warning-500 border-warning-600-400 focus:border-warning-800-200`}"
      minlength="1"
      maxlength="255"
    />
  </label>
  <div class="flex-none content-end py-2">
    {#if edit}
      <IconButton
        icon="fa-solid fa-floppy-disk fa-xl"
        label="Save"
        data-testid="admin-required-field-save"
        disabled={!label || !id || !dirtyForm}
        onclick={saveField}
      />
      {#if dirtyForm}
        <IconButton
          icon="fa-solid fa-arrow-rotate-right fa-xl"
          label="Reset and cancel"
          data-testid="admin-required-field-reset"
          onclick={resetField}
        />
      {:else if !newField && !dirtyForm}
        <IconButton
          icon="fa-solid fa-ban fa-xl"
          label="Cancel"
          data-testid="admin-required-field-cancel"
          onclick={toggleEdit}
        />
      {/if}
    {:else}
      <IconButton
        icon="fa-solid fa-pen fa-xl"
        label="Edit"
        data-testid="admin-required-field-edit"
        onclick={toggleEdit}
      />
    {/if}
    <IconButton
      icon="fa-solid fa-trash fa-xl"
      label="Delete"
      data-testid="admin-required-field-delete"
      onclick={deleteField}
    />
  </div>
</div>
