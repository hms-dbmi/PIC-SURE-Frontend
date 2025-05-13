<script lang="ts">
  // Rebuild the Tab.Item component for skeleton until the click bug is fixed
  // https://github.com/skeletonlabs/skeleton/issues/3543
  import type { Snippet } from 'svelte';
  let {
    group = $bindable(''),
    value = '',
    children,
  }: {
    group: string;
    value: string;
    children?: Snippet;
  } = $props();

  let active: boolean = $derived(group === value);
</script>

<button
  data-scope="tabs"
  data-part="trigger"
  role="tab"
  type="button"
  dir="ltr"
  data-orientation="horizontal"
  data-value="Python"
  aria-selected="true"
  data-selected=""
  aria-controls="tabs:s5:content-{value}"
  data-ownedby="tabs:s5:list"
  id="tabs:s5:trigger-{value}"
  class="border-b-[1px] border-transparent pb-2 translate-y-[1px] {active
    ? 'border-b-surface-950-50 opacity-100'
    : '[&amp;:not(:hover)]:opacity-50'}"
  data-testid="tabs-control"
  onclick={() => (group = value)}
>
  <div class="btn hover:preset-tonal-primary" data-testid="tabs-control-label">
    <span>{@render children?.()}</span>
  </div>
</button>
