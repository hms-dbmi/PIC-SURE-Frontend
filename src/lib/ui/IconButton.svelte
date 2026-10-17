<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLButtonAttributes, 'class' | 'children' | 'title'> {
    /** Font Awesome classes for the icon, e.g. "fa-solid fa-trash fa-xl". */
    icon: string;
    /** The button's tooltip and accessible name. */
    label: string;
    /** Keyboard shortcut a table row listens for (data-key). */
    shortcut?: string;
    class?: string;
    'data-testid'?: string;
  }

  const {
    icon,
    label,
    shortcut,
    class: className = '',
    type = 'button',
    ...rest
  }: Props = $props();
</script>

<button {...rest} {type} title={label} data-key={shortcut} class="btn-icon-color {className}">
  <i class={icon}></i>
  <span class="sr-only">{label}</span>
</button>
