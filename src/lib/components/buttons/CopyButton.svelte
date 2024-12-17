<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  import { popup, clipboard } from '@skeletonlabs/skeleton';

  export let itemToCopy: string;

  export let text: string = 'Copy';
  export let altText: string = 'Copied!';
  export let useIcon: boolean = false;
  export let icon: string = 'fa-regular fa-copy';
  export let altIcon: string = 'fa-regular fa-square-check';

  let buttonId = $$props['data-testid'] || 'copy-btn';
  let timer: ReturnType<typeof setTimeout>;

  function debounce(method: () => void) {
    clearTimeout(timer);
    timer = setTimeout(method, 4500);
  }

  function updateButton() {
    if (useIcon) {
      const iconText = icon;
      debounce(() => (icon = iconText));
      icon = altIcon;
    } else {
      const btnText = text;
      debounce(() => (text = btnText));
      text = altText;
    }
  }
</script>

{#if useIcon}
  <button
    type="button"
    data-testid={buttonId}
    title={text}
    class="ml-4 text-black-600 hover:text-primary-600 {$$props.class || ''}"
    on:click|stopPropagation={updateButton}
    use:clipboard={itemToCopy}
    use:popup={{
      event: 'click',
      target: buttonId,
      placement: 'top',
    }}
  >
    <i class="fa-xl {icon}"></i>
    <div
      data-testid="{buttonId}-popup"
      class="rounded p-4 max-w-md shadow-2xl variant-filled-surface text-on-primary"
      data-popup={buttonId}
    >
      {altText}
      <div class="arrow variant-filled-surface" />
    </div>
  </button>
{:else}
  <button
    type="button"
    data-testid={buttonId}
    title={text}
    class="ml-4 btn {$$props.class || ''}"
    on:click|stopPropagation={updateButton}
    use:clipboard={itemToCopy}>{text}</button
  >
{/if}
