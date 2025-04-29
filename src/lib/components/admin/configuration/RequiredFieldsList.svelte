<script lang="ts">
  import { type RequiredField, parseFieldsFromJSON } from '$lib/models/Connection';
  import { isTopAdmin } from '$lib/stores/User';

  import RequiredFieldRow from './RequiredFieldRow.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  interface Props {
    fields?: string;
    onupdate?: (json: string) => void;
  }

  let { fields = '[]', onupdate = () => {} }: Props = $props();

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

  function hasDuplicate(checkField: RequiredField) {
    return !!duplicates.find((field) => field === checkField);
  }

  function updateFields(fields: RequiredField[]) {
    onupdate(JSON.stringify(fields));
  }

  function saveField(previous: RequiredField, current: RequiredField) {
    const newFields = [...fieldList];
    if (previous.label === '' || previous.id === '') {
      newFields.push(current);
      enableNewField = false;
    } else {
      const fieldIndex: number = newFields.findIndex(
        (f) => f.label === previous.label && f.id === previous.id,
      );
      if (fieldIndex > -1) {
        newFields[fieldIndex] = current;
      }
    }

    updateFields(newFields);
  }

  function deleteField(field: RequiredField) {
    const newFields = fieldList.filter((f) => f.label !== field.label || f.id !== field.id);
    updateFields(newFields);
  }
</script>

<fieldset class="border border-surface-300-700">
  <legend class="px-2 ml-2">
    Required Fields:
    <button
      type="button"
      class="text-primary-700-300 hover:text-secondary-700-300"
      aria-label="Add New Field"
      title="Add New Field"
      data-testid="required-field-new-btn"
      disabled={enableNewField}
      onclick={() => (enableNewField = !enableNewField)}
    >
      <i class="fa-solid fa-square-plus fa-xl {enableNewField ? 'opacity-50' : ''}"></i>
    </button>
  </legend>

  {#if enableNewField}
    <RequiredFieldRow onsave={saveField} ondelete={() => (enableNewField = false)} />
  {/if}

  {#each fieldList as field, index (`${index}-${field.label}-${field.id}`)}
    <RequiredFieldRow
      duplicate={hasDuplicate(field)}
      {field}
      onsave={saveField}
      ondelete={deleteField}
    />
  {/each}

  {#if duplicates.length > 0}
    <ErrorAlert data-testid="validation-warn" color="warning">
      Fields with the same ID may not function properly.
    </ErrorAlert>
  {/if}
</fieldset>
