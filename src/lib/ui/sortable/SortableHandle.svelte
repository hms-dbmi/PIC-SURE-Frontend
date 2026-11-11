<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    /** The sortable's `attachHandle`. */
    handle: Attachment<HTMLElement>;
    title: string;
  }

  let { handle, title, class: className = '', ...rest }: Props = $props();
</script>

<button
  type="button"
  class="cursor-grab active:cursor-grabbing {className}"
  {title}
  {...rest}
  {@attach handle}
>
  <i class="fa-solid fa-grip-vertical text-xl" aria-hidden="true"></i>
</button>
