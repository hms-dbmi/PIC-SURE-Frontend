<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import Terms from '#lib/shell/Terms.svelte';
  import { termsOfService } from '#lib/shell/termsOfService.svelte.ts';

  // Terms opened from a footer belong to the page they were opened on, so a navigation closes them,
  // including a logout's redirect to /login.
  afterNavigate(() => termsOfService.closeReading());
</script>

<Dialog
  bind:open={termsOfService.dialogOpen}
  data-testid="app-footer-terms"
  aria-label="Terms of Service"
  size="page"
  closeable={!termsOfService.required}
>
  <Terms required={termsOfService.required} onclose={() => (termsOfService.dialogOpen = false)} />
</Dialog>
