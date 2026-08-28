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
    convertQuillClasses = true,
    reconcileSanitizedDocument = false,
    ariaLabel = 'Rich text editor',
    ariaDescribedBy,
    id = 'editor',
  }: {
    content: string;
    embedOptions?: boolean;
    fontOptions?: boolean;
    headerDropdown?: boolean;
    alignOptions?: boolean;
    basicToolbar?: boolean;
    sanitizer?: (dirty: string) => string;
    convertQuillClasses?: boolean;
    reconcileSanitizedDocument?: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
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

  function convertClasses(content: string) {
    if (!convertQuillClasses) return content;
    let converted = content;
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
    }).forEach(([from, to]) => (converted = converted.replaceAll(from, to)));
    return converted;
  }

  function normalizeNonBreakingSpaces(content: string) {
    return content.replaceAll('&nbsp;', ' ').replaceAll('\u00a0', ' ');
  }

  function canonicalHTML(content: string) {
    const template = document.createElement('template');
    template.innerHTML = content;
    return template.innerHTML;
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
      // Quill reads initial markup only from its container during construction.
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
      if (ariaDescribedBy) {
        quill.root.setAttribute('aria-describedby', ariaDescribedBy);
      }
      quill.on('text-change', () => {
        if (!quill) return;
        const semanticContent = quill.getSemanticHTML();
        const convertedContent = convertClasses(semanticContent);
        let sanitizedContent = sanitizer(convertedContent);
        if (
          reconcileSanitizedDocument &&
          canonicalHTML(sanitizedContent) !== canonicalHTML(convertedContent)
        ) {
          const selection = quill.getSelection();
          quill.clipboard.dangerouslyPasteHTML(sanitizedContent, 'silent');
          sanitizedContent = sanitizer(convertClasses(quill.getSemanticHTML()));
          if (selection) {
            const finalIndex = Math.max(0, quill.getLength() - 1);
            const index = Math.min(selection.index, finalIndex);
            const length = Math.min(selection.length, finalIndex - index);
            quill.setSelection(index, length, 'silent');
          }
        }
        const nextContent = normalizeNonBreakingSpaces(sanitizedContent);
        editorContent = nextContent;
        content = nextContent;
      });
    }
  });
</script>

<div {id} bind:this={container} class="bg-white dark:bg-black"></div>
