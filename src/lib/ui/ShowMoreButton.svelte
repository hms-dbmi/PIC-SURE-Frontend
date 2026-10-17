<script lang="ts">
  interface Props {
    expanded: boolean;
    onclick?: () => void;
    class?: string;
    lessLabel?: string;
    moreLabel?: string;
    'data-testid'?: string;
  }

  const {
    expanded,
    onclick = () => {},
    class: className = '',
    lessLabel = 'Show Less',
    moreLabel = 'Show More',
    'data-testid': testid = 'ui-show-more',
  }: Props = $props();
</script>

<button
  data-testid={testid}
  type="button"
  class="show-more w-fit mx-auto my-1 {className}"
  {onclick}
>
  {expanded ? lessLabel : moreLabel}
  <i class="ml-1 fa-solid fa-angle-{expanded ? 'up' : 'down'}"></i>
</button>

<style lang="postcss">
  @reference "../../styles/app.css";

  .show-more {
    /* Skeleton's own small button, without the app's .btn and .btn-sm overrides */
    @apply btn px-3 py-1 text-xs preset-outlined-surface-500 rounded-container;
  }
</style>
