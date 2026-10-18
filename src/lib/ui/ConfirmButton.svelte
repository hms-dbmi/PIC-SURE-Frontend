<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import { buttonClass, type ButtonSize, type ButtonVariant } from '#lib/ui/button.ts';

  type DialogProps = Omit<
    ComponentProps<typeof ConfirmDialog>,
    'trigger' | 'triggerClass' | 'triggerTitle' | 'triggerKey'
  >;

  interface Props extends DialogProps {
    /** The trigger's text, or with an icon its tooltip and accessible name. */
    label: string;
    /** Font Awesome classes; renders an icon-only trigger like IconButton. */
    icon?: string;
    variant?: ButtonVariant;
    /** The trigger's Button size; `size` is the dialog's. */
    buttonSize?: ButtonSize;
    /** Keyboard shortcut a table row listens for (data-key). */
    shortcut?: string;
    class?: string;
  }

  let {
    open = $bindable(false),
    label,
    icon,
    variant = 'filled',
    buttonSize = 'md',
    shortcut,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const triggerClass = $derived(
    `${icon ? 'btn-icon-color' : buttonClass(variant, buttonSize)} ${className}`,
  );
</script>

<ConfirmDialog
  bind:open
  {...rest}
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
