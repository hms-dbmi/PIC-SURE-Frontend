<script lang="ts">
  interface Props {
    /** AND or OR; anything else gets the neutral tone. */
    operator: string;
    /** `neutral` drops the AND/OR colouring, e.g. for a fixed join that isn't the user's choice. */
    tone?: 'operator' | 'neutral';
  }

  let { operator, tone = 'operator' }: Props = $props();

  const tones = {
    AND: 'preset-filled-primary-200-800',
    OR: 'preset-filled-secondary-200-800',
    neutral: 'preset-filled-surface-200-800',
  } as const;
  const toneClass = $derived(
    tone === 'operator' && (operator === 'AND' || operator === 'OR')
      ? tones[operator]
      : tones.neutral,
  );
</script>

<span class="badge font-bold text-xs uppercase {toneClass}">{operator}</span>
