<script lang="ts">
  import Popover, { type TriggerType } from '#lib/ui/popover/Popover.svelte';
  import { sanitizeHTML } from '#lib/utils/html.ts';

  interface Props {
    /** HTML, sanitised before rendering. */
    text: string;
    /** Accessible name of the icon button. */
    label?: string;
    'data-testid'?: string;
    type?: 'question' | 'info' | 'exclamation' | 'xmark';
    color?: 'primary' | 'warning';
    onopen?: (by: TriggerType) => void;
  }

  const {
    text,
    label = 'More information',
    'data-testid': testid,
    type = 'question',
    color = 'primary',
    onopen,
  }: Props = $props();

  const colors = {
    primary: 'text-primary-950-50 hover:text-primary-300-700',
    warning: 'text-warning-950-50 hover:text-warning-300-700',
  };
</script>

{#if text}
  <div data-testid={testid}>
    <Popover
      data-testid={testid && `${testid}-content`}
      triggerTypes={['click', 'hover']}
      textSize="base"
      {onopen}
    >
      {#snippet trigger(props)}
        <button {...props} type="button" aria-label={label}>
          <i class="fa-solid fa-circle-{type} {colors[color]}" aria-hidden="true"></i>
        </button>
      {/snippet}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html sanitizeHTML(text)}
    </Popover>
  </div>
{/if}
