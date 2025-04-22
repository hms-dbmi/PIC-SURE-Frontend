<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ update: { json: string } }>();
  import { isTopAdmin } from '$lib/stores/User';

  import { type RequiredField, parseFieldsFromJSON } from '$lib/models/Connection';
  import RequiredFieldRow from './RequiredFieldRow.svelte';

  interface Props {
    fields?: string;
  }

  let { fields = '[]' }: Props = $props();

  let fieldList = $derived(parseFieldsFromJSON(fields));
  let enableNewField = $derived(fieldList.length === 0 || !$isTopAdmin);
  let duplicates = $derived(
    fieldList.filter((checkField) => {
      return (
        fieldList
          .filter((field) => field !== checkField)
          .filter((field) => field.id === checkField.id).length > 0
      );
    }),
  );

  type SaveRequiredFieldEvent = { detail: { previous: RequiredField; current: RequiredField } };
  type RequiredFieldEvent = { detail: RequiredField };

  function hasDuplicate(checkField: RequiredField) {
    return !!duplicates.find((field) => field === checkField);
  }

  function updateFields(fields: RequiredField[]) {
    dispatch('update', { json: JSON.stringify(fields) });
  }

  function saveField(event: SaveRequiredFieldEvent) {
    const newFields = [...fieldList];
    if (event.detail.previous.label === '' || event.detail.previous.id === '') {
      newFields.push(event.detail.current);
      enableNewField = false;
    } else {
      const fieldIndex: number = newFields.findIndex(
        (f) => f.label === event.detail.previous.label && f.id === event.detail.previous.id,
      );
      if (fieldIndex > -1) {
        newFields[fieldIndex] = event.detail.current;
      }
    }

    updateFields(newFields);
  }

  function deleteField(event: RequiredFieldEvent) {
    const newFields = fieldList.filter(
      (f) => f.label !== event.detail.label || f.id !== event.detail.id,
    );
    updateFields(newFields);
  }
</script>

<fieldset class="border border-surface-300-600-token">
  <legend class="px-2 ml-2">
    Required Fields:
    <button
      type="button"
      class="text-primary-600-300-token hover:text-secondary-600-300-token"
      aria-label="Add New Field"
      title="Add New Field"
      aria-label="Add New Field"
      data-testid="required-field-new-btn"
      disabled={enableNewField}
      onclick={() => (enableNewField = !enableNewField)}
    >
      <i class="fa-solid fa-square-plus fa-xl {enableNewField ? 'opacity-50' : ''}"></i>
    </button>
  </legend>

  {#if enableNewField}
    <RequiredFieldRow on:save={saveField} on:delete={() => (enableNewField = false)} />
  {/if}

  {#each fieldList as field, index (`${index}-${field.label}-${field.id}`)}
    <RequiredFieldRow
      duplicate={hasDuplicate(field)}
      {field}
      on:save={saveField}
      on:delete={deleteField}
    />
  {/each}

  {#if duplicates.length > 0}
    <aside data-testid="validation-warn" class="alert variant-ghost-warning m-2">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <div class="alert-message">
        <p>Fields with the same ID may not function properly.</p>
      </div>
    </aside>
  {/if}
</fieldset>
