<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    open?: boolean;
    width?: string;
    height?: string;
    title?: string;
    withDefault?: boolean;
    closeable?: boolean;
    footerButtons?: boolean;
    cancelText?: string;
    confirmText?: string;
    cancelClass?: string;
    confirmClass?: string;
    disabled?: boolean;
    class?: string;
    triggerBase?: string;
    'data-testid'?: string;
    onclose?: () => void;
    onconfirm?: () => void;
    children: Snippet;
    trigger?: Snippet;
  }

  let {
    open: modalOpen = $bindable(false),
    width = 'w-auto',
    height = 'h-auto',
    title = '',
    withDefault = false,
    closeable = true,
    footerButtons = true,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    cancelClass = 'border preset-tonal-primary hover:preset-filled-primary-500',
    confirmClass = 'preset-filled-primary-500',
    disabled = false,
    class: className = '',
    triggerBase = '',
    'data-testid': testid = '',
    onclose = () => {},
    onconfirm,
    children,
    trigger,
  }: Props = $props();

  function modalClose() {
    modalOpen = false;
    onclose();
  }

  function confirm() {
    modalOpen = false;
    onconfirm && onconfirm();
  }
</script>

<div class="inline">
  {#if !!trigger}
    <button
      data-testid="{testid}-btn"
      onclick={(e) => {
        e.stopPropagation();
        modalOpen = true;
      }}
      {disabled}
      class={triggerBase}
    >
      {@render trigger?.()}
    </button>
  {/if}
  <Modal
    open={modalOpen}
    onOpenChange={(e) => (modalOpen = e.open)}
    contentBase="card bg-surface-50-950 p-4 pb-6 space-4 shadow-xl overflow-auto max-w-screen {width} max-h-screen {height} {className}"
    backdropClasses="backdrop-blur-sm"
    ids={{ content: 'modal-component' }}
    closeOnInteractOutside={closeable}
    closeOnEscape={closeable}
  >
    {#snippet content()}
      <div data-testid={testid}>
        <header
          data-testid="modal-wrapper-header"
          class="text-2xl font-bold block {title ? '' : 'text-right'}"
        >
          {#if title}{title}{/if}
          {#if closeable}<button
              data-testid="modal-close-button"
              class="hover:text-secondary-500"
              class:float-right={title}
              onclick={modalClose}>×</button
            >{/if}
        </header>
        {#if withDefault}
          <article class="modal-body overflow-hidden">
            {@render children?.()}
          </article>
          {#if footerButtons}
            <footer class="modal-footer flex justify-end space-x-2 mt-6">
              <button type="button" class="btn {cancelClass}" onclick={modalClose}
                >{cancelText}</button
              >
              {#if onconfirm}<button type="button" class="btn {confirmClass}" onclick={confirm}
                  >{confirmText}</button
                >{/if}
            </footer>
          {/if}
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/snippet}
  </Modal>
</div>
