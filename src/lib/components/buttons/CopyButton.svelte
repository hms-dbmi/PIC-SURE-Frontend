<script lang="ts">
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

  let buttonId = testid || 'copy-btn';
  let timer: ReturnType<typeof setTimeout>;
  let activeIcon: string = $state(icon);
  let activeButtonText: string = $state(text);

  function debounce(method: () => void) {
    clearTimeout(timer);
    timer = setTimeout(method, 4500);
  }

  function updateButton(event: Event) {
    event.stopPropagation();
    if (useIcon) {
      const iconText = icon;
      debounce(() => (activeIcon = iconText));
      activeIcon = altIcon;
    } else {
      const btnText = text;
      debounce(() => (activeButtonText = btnText));
      activeButtonText = altText;
    }
  }
</script>

{#if useIcon}
  <button
    type="button"
    data-testid={buttonId}
    title={activeButtonText}
    class="ml-4 text-black-600 hover:text-primary-600 {className}"
    onclick={updateButton}
    use:clipboard={itemToCopy}
    use:popup={{
      event: 'click',
      target: buttonId,
      placement: 'top',
    }}
  >
    <i class="fa-xl {activeIcon}"></i>
    <div
      data-testid="{buttonId}-popup"
      class="rounded-sm p-4 max-w-md shadow-2xl preset-filled-surface-500 text-on-primary"
      data-popup={buttonId}
    >
      {altText}
      <div class="arrow preset-filled-surface-500"></div>
    </div>
  </button>
{:else}
  <button
    type="button"
    data-testid={buttonId}
    title={activeButtonText}
    class="ml-4 btn {className}"
    onclick={updateButton}
    use:clipboard={itemToCopy}>{activeButtonText}</button
  >
{/if}
