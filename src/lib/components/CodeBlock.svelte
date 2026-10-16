<script module>
  import { createHighlighterCoreSync } from 'shiki/core';
  import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
  // Themes: https://shiki.style/themes
  import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
  // Languages: https://shiki.style/languages
  import bash from 'shiki/langs/bash.mjs';
  import cmd from 'shiki/langs/cmd.mjs';
  import json from 'shiki/langs/json.mjs';
  import powershell from 'shiki/langs/powershell.mjs';
  import python from 'shiki/langs/python.mjs';
  import r from 'shiki/langs/r.mjs';

  const shiki = createHighlighterCoreSync({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [bash, cmd, json, powershell, python, r],
  });
</script>

<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import type { DecorationItem } from 'shiki/core';
  import type { CodeBlockProps } from '$lib/models/CodeBlock';

  let { code = '', copyCode, hiddenText, lang = 'bash', logAction }: CodeBlockProps = $props();

  /**
   * Returns a decoration that hides each occurrence of the text from screen readers.
   *
   * @param text the text to hide, or undefined or empty to hide nothing
   */
  function hiddenDecorations(text: string | undefined): DecorationItem[] {
    if (!text) return [];
    const decorations: DecorationItem[] = [];
    let start = code.indexOf(text);
    while (start !== -1) {
      const end = start + text.length;
      decorations.push({ start, end, properties: { 'aria-hidden': 'true' } });
      start = code.indexOf(text, end);
    }
    return decorations;
  }

  const generatedHtml = $derived(
    shiki.codeToHtml(code, {
      lang,
      theme: 'dark-plus',
      decorations: hiddenDecorations(hiddenText),
    }),
  );
</script>

<div class="code-block relative">
  <CopyButton
    useIcon
    itemToCopy={copyCode ?? code}
    triggerTitle="Copy code"
    {logAction}
    data-testid="code-block-copy"
    class="absolute top-2 right-2 text-surface-300"
  />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html generatedHtml}
</div>
