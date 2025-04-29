<script lang="ts">
  interface Props {
    title?: string;
    color?: string;
    solid?: boolean;
    icon?: boolean;
    closeText?: string;
    'data-testid'?: string;
    onclose?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    title,
    color = 'error',
    solid = false,
    icon = true,
    closeText = 'Close',
    'data-testid': testid = 'error-alert',
    onclose,
    children,
  }: Props = $props();
</script>

<aside
  data-testid={testid}
  class="card flex gap-4 preset-{solid ? 'filled' : 'tonal'}-{color}{solid
    ? '-500'
    : ''} border border-{color}-500 py-2 px-3 m-2"
>
  {#if icon}<i class="fa-solid fa-circle-exclamation text-4xl content-center" aria-hidden="true"
    ></i>{/if}
  <div class="alert-message content-center">
    {#if title}<h3 class="h3 text-left">{title}</h3>{/if}
    {@render children?.()}
    {#if onclose}
      <div class="alert-actions">
        <button onclick={onclose}>
          <i class="fa-solid fa-xmark"></i>
          <span class="sr-only">{closeText}</span>
        </button>
      </div>
    {/if}
  </div>
</aside>
