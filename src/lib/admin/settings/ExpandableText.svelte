<script lang="ts">
  import { truncate, visibleLength } from '#lib/utils/strings.ts';

  interface Props {
    /** The field's key; names the testids. */
    name: string;
    text: string;
  }

  let { name, text }: Props = $props();

  const LIMIT = 150;
  let expanded = $state(false);
  let truncatable = $derived(visibleLength(text) > LIMIT);
</script>

<p
  class="text-xs opacity-70 mt-1 leading-relaxed"
  data-testid={`admin-config-field-description-${name}`}
>
  {truncatable && !expanded ? truncate(text, LIMIT) : text}
</p>
{#if truncatable}
  <button
    type="button"
    class="text-xs font-semibold text-primary-500 hover:underline mt-1"
    data-testid={`admin-config-field-expand-${name}`}
    onclick={() => (expanded = !expanded)}
  >
    {expanded ? 'Show less' : 'Show more'}
  </button>
{/if}
