<script lang="ts">
  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import Terms from '#lib/shell/Terms.svelte';
  import { termsOfService } from '#lib/shell/termsOfService.svelte.ts';
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
