<script lang="ts">
  interface Props {
    expanded: boolean;
    onclick?: () => void;
    class?: string;
    lessLabel?: string;
    moreLabel?: string;
    'data-testid'?: string;
    'data-testId'?: string;
  }

  const {
    expanded,
    onclick = () => {},
    class: className = '',
    lessLabel = 'Show Less',
    moreLabel = 'Show More',
    'data-testid': dataTestId = '',
    'data-testId': legacyDataTestId = '',
  }: Props = $props();

  const testId = $derived(dataTestId || legacyDataTestId || 'show-more');
</script>

<button
  data-testid={testId}
  type="button"
  class="show-more w-fit mx-auto my-1 {className}"
  {onclick}
>
  {expanded ? lessLabel : moreLabel}
  <i class="ml-1 fa-solid fa-angle-{expanded ? 'up' : 'down'}"></i>
</button>

<style lang="postcss">
  @reference "../../../styles/app.css";

  .show-more {
    @apply btn btn-sm preset-outlined-surface-500 rounded-container;
  }
</style>
