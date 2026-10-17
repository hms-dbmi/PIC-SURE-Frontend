<script lang="ts">
  import { css } from '#lib/ui/style.ts';
  import SkeletonBar from './SkeletonBar.svelte';

  interface Props {
    count: number;
    /** Width classes, cycled through so the rows look like varied text. */
    widths?: readonly string[];
    /** Puts a checkbox-sized box before each bar. */
    marker?: boolean;
    /** Fades the rows out towards the end of the list. */
    fade?: boolean;
    class?: string;
    /** Rows get `{data-testid}-item-{index}`. */
    'data-testid'?: string;
  }

  let {
    count,
    widths = ['w-32', 'w-28', 'w-36', 'w-24', 'w-40', 'w-30'],
    marker = false,
    fade = false,
    class: className = '',
    'data-testid': testid,
  }: Props = $props();

  function opacity(index: number): number {
    return fade && count > 1 ? Math.max(0, 1 - (index / (count - 1)) * 0.8) : 1;
  }
</script>

<div class="space-y-3 {className}" aria-hidden="true" data-testid={testid}>
  {#each { length: count }, index}
    <div
      class="flex items-center space-x-3"
      data-testid={testid && `${testid}-item-${index}`}
      {@attach css({ opacity: opacity(index) })}
    >
      {#if marker}
        <SkeletonBar class="size-4" shape="box" />
      {/if}
      <SkeletonBar class="h-4 {widths[index % widths.length]}" />
    </div>
  {/each}
</div>
