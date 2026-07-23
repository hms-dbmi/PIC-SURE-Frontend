<script lang="ts">
  import Popover from '$lib/components/Popover.svelte';

  interface Props {
    itemToCopy: string;
    text?: string;
    altText?: string;
    useIcon?: boolean;
    icon?: string;
    altIcon?: string;
    'data-testid'?: string;
    class?: string;
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
    class: className = '',
    oncopy = () => {},
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
    oncopy();
  }
</script>

<Popover
  data-testid={testid || 'copy'}
  triggerStyle="ml-4 {useIcon ? 'text-black-600 hover:text-primary-600' : 'btn'} {className}"
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
