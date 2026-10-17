<script lang="ts" module>
  import type { Snippet } from 'svelte';

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

  /** Every dialog needs an accessible name: a visible title, or an aria-label without one. */
  export type DialogName =
    | { title: string; 'aria-label'?: undefined }
    | { title?: undefined; 'aria-label': string };
</script>

<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';

  type Props = DialogTriggerProps &
    DialogName & {
      open?: boolean;
      role?: 'dialog' | 'alertdialog';
      /** Whether Escape, a backdrop click and the × button close the dialog. */
      closeable?: boolean;
      size?: DialogSize;
      'data-testid'?: string;
      /** Runs whenever the dialog dismisses itself: Escape, a backdrop click or the × button. */
      onclose?: () => void;
      footer?: Snippet;
      children: Snippet;
    };

  let {
    open = $bindable(false),
    title,
    'aria-label': ariaLabel = undefined,
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

  // onclose runs before open changes, like ConfirmDialog's handlers
  function dismiss() {
    onclose?.();
    open = false;
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
      // Escape or a backdrop click. The dialog's own buttons close it first, so a late callback for
      // them falls through to the else branch and doesn't run onclose twice.
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
