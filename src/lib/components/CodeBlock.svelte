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
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import type { CodeBlockProps } from '$lib/models/CodeBlock';

  let { code = '', lang = 'console', theme = 'dark-plus' }: CodeBlockProps = $props();

  // svelte-ignore state_referenced_locally
  const generatedHtml = shiki.codeToHtml(code, { lang, theme });
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
