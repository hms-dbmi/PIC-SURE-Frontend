<script lang="ts">
  import { onMount } from 'svelte';

  import 'quill/dist/quill.core.css';
  import 'quill/dist/quill.snow.css';
  import '../../../styles/editor.css';

  import { sanitizeHTML } from '$lib/utilities/HTML';

  let {
    content = $bindable(),
    embedOptions = false,
    fontOptions = false,
    headerDropdown = true,
    alignOptions = true,
    basicToolbar = false,
    sanitizer = sanitizeHTML,
    ariaLabel = 'Rich text editor',
    id = 'editor',
  }: {
    content: string;
    embedOptions?: boolean;
    fontOptions?: boolean;
    headerDropdown?: boolean;
    alignOptions?: boolean;
    basicToolbar?: boolean;
    sanitizer?: (dirty: string) => string;
    ariaLabel?: string;
    id?: string;
  } = $props();

  const colors = [
    'surface',
    'primary',
    'secondary',
    'tertiary',
    'success',
    'error',
    'warning',
  ].flatMap((color) =>
    ['50', '200', '500', '800', '950'].map((val) => `var(--color-${color}-${val})`),
  );

  const toolbarOptions = $derived(
    basicToolbar
      ? [
          ['bold', 'italic', 'underline', 'strike'],
          ['link'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ]
      : [
          headerDropdown ? [{ header: [1, 2, 3, 4, 5, 6, false] }] : [{ header: 1 }, { header: 2 }],
          ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
          ...(alignOptions
            ? [
                [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
                ['link', 'blockquote', 'code-block'],
                [{ list: 'ordered' }, { list: 'bullet' }],
              ]
            : []),
          embedOptions ? ['image'] : undefined,
          fontOptions
            ? [
                { font: [] },
                { size: ['small', false, 'large', 'huge'] },
                { color: colors },
                { background: colors },
              ]
            : undefined,
          ['clean'],
        ].filter((x) => x !== undefined),
  );

  // Preserve the full editor's established class conversion; the basic banner editor strips classes.
  function swapAndClean(content: string) {
    let text = content.replaceAll('&nbsp;', ' ');
    if (!basicToolbar) {
      Object.entries({
        'ql-indent-1': 'ml-2',
        'ql-indent-2': 'ml-4',
        'ql-indent-3': 'ml-6',
        'ql-align-right': 'text-right',
        'ql-align-center': 'text-center',
        'ql-align-justify': 'text-justify',
        'ql-font-serif': 'font-serif',
        'ql-font-monospace': 'font-mono',
        'ql-size-small': 'text-sm',
        'ql-size-large': 'text-lg',
        'ql-size-huge': 'text-xl',
      }).forEach(([from, to]) => (text = text.replaceAll(from, to)));
    }
    return sanitizer(text);
  }

  let container: HTMLDivElement;
  let quill: import('quill').default | undefined;
  let editorContent = content;

  $effect(() => {
    const nextContent = content;
    if (quill && nextContent !== editorContent) {
      editorContent = nextContent;
      quill.clipboard.dangerouslyPasteHTML(nextContent, 'silent');
    }
  });

  onMount(async () => {
    const { default: Quill } = await import('quill');
    if (container) {
      // Quill must initialize from the supplied DOM to preserve the established Terms content semantics.
      // eslint-disable-next-line svelte/no-dom-manipulating
      container.innerHTML = content;
      quill = new Quill(container, {
        theme: 'snow',
        modules: {
          toolbar: toolbarOptions,
        },
      });
      quill.root.setAttribute('role', 'textbox');
      quill.root.setAttribute('aria-multiline', 'true');
      quill.root.setAttribute('aria-label', ariaLabel);
      quill.on('text-change', () => {
        if (!quill) return;
        const semanticContent = quill.getSemanticHTML();
        let nextContent = swapAndClean(semanticContent);
        if (basicToolbar && nextContent !== semanticContent) {
          const selection = quill.getSelection();
          quill.clipboard.dangerouslyPasteHTML(nextContent, 'silent');
          nextContent = swapAndClean(quill.getSemanticHTML());
          if (selection) {
            const finalIndex = Math.max(0, quill.getLength() - 1);
            const index = Math.min(selection.index, finalIndex);
            const length = Math.min(selection.length, finalIndex - index);
            quill.setSelection(index, length, 'silent');
          }
        }
        editorContent = nextContent;
        content = nextContent;
      });
    }
  });
</script>

<div {id} bind:this={container} class="bg-white dark:bg-black"></div>
