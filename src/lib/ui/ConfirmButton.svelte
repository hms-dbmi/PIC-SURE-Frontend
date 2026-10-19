<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import { buttonClass, type ButtonSize, type ButtonVariant } from '#lib/ui/button.ts';

  type DialogProps = Omit<
    ComponentProps<typeof ConfirmDialog>,
    'trigger' | 'triggerClass' | 'triggerTitle' | 'triggerKey' | 'size'
  >;

  interface Props extends DialogProps {
    /** The trigger's text, or with an icon its tooltip and accessible name. */
    label: string;
    /** Font Awesome classes; renders an icon-only trigger like IconButton. */
    icon?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    dialogSize?: ComponentProps<typeof ConfirmDialog>['size'];
    /** Keyboard shortcut a table row listens for (data-key). */
    shortcut?: string;
    class?: string;
  }

  let {
    open = $bindable(false),
    label,
    icon,
    variant = 'filled',
    size = 'md',
    dialogSize,
    shortcut,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const triggerClass = $derived(
    `${icon ? 'btn-icon-color' : buttonClass(variant, size)} ${className}`,
  );
</script>

<ConfirmDialog
  bind:open
  {...rest}
  size={dialogSize}
  {triggerClass}
  triggerTitle={icon ? label : undefined}
  triggerKey={shortcut}
>
  {#snippet trigger()}
    {#if icon}
      <i class={icon}></i>
      <span class="sr-only">{label}</span>
    {:else}
      {label}
    {/if}
  {/snippet}
  {@render children()}
</ConfirmDialog>
