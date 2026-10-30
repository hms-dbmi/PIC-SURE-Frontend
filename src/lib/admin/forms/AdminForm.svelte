<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '#lib/ui/Button.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import TextField from '#lib/admin/forms/TextField.svelte';

  interface Props {
    /** Names the testids: `admin-{entity}-form`, `-save` and `-cancel`. */
    entity: 'connection' | 'privilege' | 'role' | 'user';
    /** Shows the record's uuid read-only when editing. */
    uuid?: string;
    disabled?: boolean;
    cancelHref: string;
    /** Returns the message to show instead of saving. */
    validate?: () => string | undefined;
    onsave: () => Promise<void>;
    children: Snippet;
  }

  let { entity, uuid, disabled = false, cancelHref, validate, onsave, children }: Props = $props();

  let validationError = $state('');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    validationError = validate?.() ?? '';
    if (!validationError) await onsave();
  }
</script>

<form onsubmit={submit}>
  <fieldset data-testid="admin-{entity}-form" class="grid gap-4 my-3" {disabled}>
    {#if uuid}
      <TextField label="UUID:" value={uuid} readonly />
    {/if}

    {@render children()}

    {#if validationError}
      <ErrorAlert data-testid="admin-form-validation-error" onclose={() => (validationError = '')}>
        {validationError}
      </ErrorAlert>
    {/if}

    <div class="mt-2">
      <Button variant="tonal" type="submit" data-testid="admin-{entity}-save">Save</Button>
      <Button variant="tonal-secondary" href={cancelHref} data-testid="admin-{entity}-cancel">
        Cancel
      </Button>
    </div>
  </fieldset>
</form>
