<script module>
  import { createHighlighterCoreSync } from 'shiki/core';
  import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
  // Themes: https://shiki.style/themes
  import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
  // Languages: https://shiki.style/languages
  import console from 'shiki/langs/console.mjs';
  import python from 'shiki/langs/python.mjs';
  import r from 'shiki/langs/r.mjs';

  const shiki = createHighlighterCoreSync({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [console, python, r],
  });
</script>

<script lang="ts">
  import type { CodeBlockProps } from '$lib/models/CodeBlock';

  let { code = '', lang = 'console', theme = 'dark-plus' }: CodeBlockProps = $props();

  const generatedHtml = shiki.codeToHtml(code, { lang, theme });
</script>

<div class="code-block">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html generatedHtml}
</div>
