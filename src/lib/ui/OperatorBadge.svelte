<script lang="ts">
  import { tones } from '#lib/ui/surface.ts';

  interface Props {
    /** AND or OR; anything else gets the neutral tone. */
    operator: string;
    /** `neutral` drops the AND/OR colouring, e.g. for a fixed join that isn't the user's choice. */
    tone?: 'operator' | 'neutral';
  }

  let { operator, tone = 'operator' }: Props = $props();

  const operatorTones = {
    AND: tones['filled-primary-subtle'],
    OR: tones['filled-secondary-subtle'],
    neutral: tones['filled-surface-subtle'],
  } as const;
  const toneClass = $derived(
    tone === 'operator' && (operator === 'AND' || operator === 'OR')
      ? operatorTones[operator]
      : operatorTones.neutral,
  );
</script>

<span class="badge font-bold text-xs uppercase {toneClass}">{operator}</span>
