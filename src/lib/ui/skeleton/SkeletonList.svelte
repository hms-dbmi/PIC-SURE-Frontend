<script lang="ts">
  import { css } from '#lib/ui/style.ts';
  import SkeletonBar from './SkeletonBar.svelte';

  interface Props {
    count: number;
    /** Puts a checkbox-sized box before each bar. */
    marker?: boolean;
    /** Fades the rows out towards the end of the list. */
    fade?: boolean;
    class?: string;
    /** Each row gets `{data-testid}-{index}`. */
    'data-testid'?: string;
  }

  let {
    count,
    marker = false,
    fade = false,
    class: className = '',
    'data-testid': testid,
  }: Props = $props();

  // Cycled through so the rows look like varied text.
  const widths = ['w-32', 'w-28', 'w-36', 'w-24', 'w-40', 'w-30'];

  function opacity(index: number): number {
    return fade && count > 1 ? Math.max(0, 1 - (index / (count - 1)) * 0.8) : 1;
  }
</script>

<div class="space-y-3 {className}" aria-hidden="true">
  {#each { length: count }, index}
    <div
      class="flex items-center space-x-3"
      data-testid={testid && `${testid}-${index}`}
      {@attach css({ opacity: opacity(index) })}
    >
      {#if marker}
        <SkeletonBar class="size-4" shape="box" />
      {/if}
      <SkeletonBar class="h-4 {widths[index % widths.length]}" />
    </div>
  {/each}
</div>
