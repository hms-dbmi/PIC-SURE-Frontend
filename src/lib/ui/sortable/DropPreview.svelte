<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** What is being moved, after "Moving:". */
    label: string;
  }

  let { label, class: className = '', ...rest }: Props = $props();
</script>

<!-- Marks the dragged item's place in the list while the drag overlay follows the pointer. -->
<div
  class="absolute inset-0 flex items-center justify-center border border-dashed border-primary-500 bg-primary-500/10 {className}"
  {...rest}
>
  <span class="text-xs font-semibold uppercase tracking-wide text-primary-700">
    Moving: {label}
  </span>
</div>
