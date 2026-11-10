<script lang="ts">
  import Popover from '#lib/ui/popover/Popover.svelte';
  import { buttonClass, type ButtonVariant } from '#lib/ui/button.ts';

  interface Props {
    itemToCopy: string;
    text?: string;
    altText?: string;
    useIcon?: boolean;
    icon?: string;
    altIcon?: string;
    'data-testid'?: string;
    'data-key'?: string;
    triggerTitle?: string;
    /** Button style for the text form; the icon form ignores it. */
    variant?: ButtonVariant;
    class?: string;
    /** Runs after a successful copy. */
    oncopy?: () => void;
  }

  const {
    itemToCopy,
    text = 'Copy',
    altText = 'Copied!',
    useIcon = false,
    icon = 'fa-regular fa-copy',
    altIcon = 'fa-regular fa-square-check',
    'data-testid': testid = '',
    'data-key': dataKey,
    triggerTitle,
    variant = 'none',
    class: className = '',
    oncopy,
  }: Props = $props();

  let copied = $state(false);
  let resetTimer: ReturnType<typeof setTimeout>;

  const activeIcon = $derived(copied ? altIcon : icon);
  const activeButtonText = $derived(copied ? altText : text);

  async function updateButton() {
    try {
      await navigator.clipboard.writeText(itemToCopy);
    } catch {
      return;
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (copied = false), 4500);
    copied = true;
    oncopy?.();
  }
</script>

<Popover
  data-testid={testid || 'ui-copy'}
  data-key={dataKey}
  {triggerTitle}
  triggerStyle="ml-4 {useIcon ? 'hover:text-primary-600' : buttonClass(variant)} {className}"
  onengage={updateButton}
  onTriggerClick={(e) => e.stopPropagation()}
  color="secondary"
  placement="bottom"
>
  {#snippet trigger()}
    {#if useIcon}
      <i class="fa-xl {activeIcon}"></i>
    {:else}
      {activeButtonText}
    {/if}
  {/snippet}
  {altText}
</Popover>
