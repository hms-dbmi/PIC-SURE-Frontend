<script lang="ts">
  import DOMPurify from 'dompurify';
  import { onMount } from 'svelte';

  import 'quill/dist/quill.core.css';
  import 'quill/dist/quill.snow.css';
  import '../../../styles/editor.css';

  let {
    content = $bindable(),
    embedOptions = false,
    fontOptions = false,
    headerDropdown = true,
    alignOptions = true,
  }: {
    content: string;
    embedOptions?: boolean;
    fontOptions?: boolean;
    headerDropdown?: boolean;
    alignOptions?: boolean;
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

  const toolbarOptions = [
    headerDropdown ? [{ header: [1, 2, 3, 4, 5, 6, false] }] : [{ header: 1 }, { header: 2 }],
    ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
    ...(alignOptions
      ? [
          [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
        ]
      : []),
    embedOptions ? ['image', 'video', 'formula'] : undefined,
    fontOptions
      ? [
          { font: [] },
          { size: ['small', false, 'large', 'huge'] },
          { color: colors },
          { background: colors },
        ]
      : undefined,
    ['clean'],
  ].filter((x) => x !== undefined);

  // Swap known Quill format classes for tailwind classes and nbsp for spaces, then sanitize
  function swapAndClean(content: string) {
    let text: string = content;
    Object.entries({
      '&nbsp;': ' ',
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
    return DOMPurify.sanitize(text, { ADD_ATTR: ['target'] });
  }

  onMount(async () => {
    const { default: Quill } = await import('quill');
    let container = document.getElementById('editor');
    if (container) {
      container.innerHTML = content;
      let quill = new Quill(container, {
        theme: 'snow',
        modules: {
          toolbar: toolbarOptions,
        },
      });
      quill.on('text-change', () => {
        content = swapAndClean(quill.getSemanticHTML());
      });
    }
  });
</script>

<div id="editor" class="bg-white dark:bg-black"></div>
