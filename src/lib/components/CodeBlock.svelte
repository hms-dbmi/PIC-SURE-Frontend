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
  import type { CodeBlockProps } from '$lib/models/CodeBlock';

  let { code = '', lang = 'bash' }: CodeBlockProps = $props();

  const generatedHtml = $derived(shiki.codeToHtml(code, { lang, theme: 'dark-plus' }));
</script>

<div class="code-block">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html generatedHtml}
</div>
