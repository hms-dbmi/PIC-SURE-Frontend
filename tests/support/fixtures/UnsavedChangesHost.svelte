<script lang="ts" generics="P extends Record<string, unknown>">
  import { untrack, type Component } from 'svelte';
  import { setUnsavedChanges, type UnsavedChanges } from '#lib/ui/unsavedGuard.svelte.ts';

  // Renders a component inside an UnsavedChanges context, the way the configuration page does.
  let {
    child: Child,
    props,
    unsaved,
  }: { child: Component<P>; props: P; unsaved: UnsavedChanges } = $props();
  setUnsavedChanges(untrack(() => unsaved));
</script>

<Child {...props} />
