<script lang="ts">
  import Popover from '$lib/components/Popover.svelte';
  import { debounce } from '$lib/utilities/Forms';

  interface Props {
    itemToCopy: string;
    text?: string;
    altText?: string;
    useIcon?: boolean;
    icon?: string;
    altIcon?: string;
    'data-testid'?: string;
    class?: string;
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
  }: Props = $props();

  let activeIcon: string = $state(icon);
  let activeButtonText: string = $state(text);

  function updateButton() {
    if (useIcon) {
      const iconText = icon;
      debounce(() => (activeIcon = iconText), 4500)();
      activeIcon = altIcon;
    } else {
      const btnText = text;
      debounce(() => (activeButtonText = btnText), 4500)();
      activeButtonText = altText;
    }
    navigator.clipboard.writeText(itemToCopy);
  }
</script>

<Popover
  data-testid={testid || 'copy'}
  triggerStyle="ml-4 {useIcon ? 'text-black-600 hover:text-primary-600' : 'btn'} {className}"
  onengage={updateButton}
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
