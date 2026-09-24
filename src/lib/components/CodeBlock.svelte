<script module>
  import { createHighlighterCoreSync } from 'shiki/core';
  import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
  // Themes: https://shiki.style/themes
  import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
  // Languages: https://shiki.style/languages
  import bash from 'shiki/langs/bash.mjs';
  import python from 'shiki/langs/python.mjs';
  import r from 'shiki/langs/r.mjs';

  const shiki = createHighlighterCoreSync({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [bash, python, r],
  });
</script>

<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import type { CodeBlockProps } from '$lib/models/CodeBlock';

  let { code = '', lang = 'bash' }: CodeBlockProps = $props();

  const generatedHtml = $derived(shiki.codeToHtml(code, { lang, theme: 'dark-plus' }));
</script>

<div class="code-block relative">
  <CopyButton
    useIcon
    itemToCopy={code}
    data-testid="code-block-copy"
    class="absolute top-2 right-2 text-surface-300"
  />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html generatedHtml}
</div>
