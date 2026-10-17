<script lang="ts" module>
  export type DialogSize = 'auto' | 'form' | 'third' | 'half' | 'page';

  export interface DialogTriggerProps {
    /** Rendered inside the button that opens the dialog. */
    trigger?: Snippet;
    triggerClass?: string;
    triggerTitle?: string;
    triggerKey?: string;
    /** Disables the trigger button. */
    disabled?: boolean;
    ontrigger?: () => void;
  }

  import type { Snippet } from 'svelte';
</script>

<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';

  interface Props extends DialogTriggerProps {
    open?: boolean;
    title?: string;
    /** Accessible name when there's no visible title. */
    'aria-label'?: string;
    role?: 'dialog' | 'alertdialog';
    /** Whether Escape, a backdrop click and the × button close the dialog. */
    closeable?: boolean;
    size?: DialogSize;
    'data-testid'?: string;
    /** Runs whenever the dialog dismisses itself: Escape, a backdrop click or the × button. */
    onclose?: () => void;
    footer?: Snippet;
    children: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    'aria-label': ariaLabel,
    role = 'dialog',
    closeable = true,
    size = 'auto',
    'data-testid': testid,
    onclose,
    footer,
    children,
    trigger,
    triggerClass = '',
    triggerTitle,
    triggerKey,
    disabled = false,
    ontrigger,
  }: Props = $props();

  const sizes: Record<DialogSize, string> = {
    auto: 'w-auto h-auto',
    form: 'w-full max-w-xl h-auto',
    third: 'w-1/3 h-auto',
    half: 'w-1/2 h-auto',
    page: 'w-3/4 h-full',
  };

  const titleId = $props.id();

  function dismiss() {
    open = false;
    onclose?.();
  }
</script>

<div class="inline">
  {#if trigger}
    <button
      type="button"
      data-testid={testid && `${testid}-trigger`}
      title={triggerTitle}
      data-key={triggerKey}
      onclick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        open = true;
        ontrigger?.();
      }}
      {disabled}
      class={triggerClass}
    >
      {@render trigger()}
    </button>
  {/if}
  <Modal
    {open}
    onOpenChange={(e) => {
      // Escape or a backdrop click. The dialog's own buttons set open first, so they never land here.
      if (open && !e.open) dismiss();
      else open = e.open;
    }}
    {role}
    aria-label={title ? undefined : ariaLabel}
    ids={{ title: titleId }}
    contentBase="card bg-surface-50-950 p-4 pb-6 space-4 shadow-xl overflow-auto max-w-screen max-h-screen {sizes[
      size
    ]}"
    backdropClasses="backdrop-blur-sm"
    closeOnInteractOutside={closeable}
    closeOnEscape={closeable}
  >
    {#snippet content()}
      <div data-testid={testid}>
        {#if title || closeable}
          <header
            data-testid="ui-modal-header"
            class="text-2xl font-bold block {title ? '' : 'text-right'}"
          >
            {#if title}<h2 id={titleId} class="inline text-black dark:text-white">{title}</h2>{/if}
            {#if closeable}<button
                type="button"
                data-testid="ui-modal-close"
                aria-label="Close"
                class="hover:text-secondary-500"
                class:float-right={title}
                onclick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}>×</button
              >{/if}
          </header>
        {/if}
        {@render children()}
        {#if footer}
          <footer class="flex justify-end gap-2 mt-6">
            {@render footer()}
          </footer>
        {/if}
      </div>
    {/snippet}
  </Modal>
</div>
