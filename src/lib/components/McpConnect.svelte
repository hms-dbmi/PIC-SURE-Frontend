<script lang="ts">
  import { onMount } from 'svelte';
  import { config } from '$lib/configuration.svelte';
  import { user, tokenStatus } from '$lib/stores/User';
  import {
    MCP_OS_OPTIONS,
    TOKEN_MASK,
    TOKEN_PLACEHOLDER,
    claudeCodeCommand,
    claudeCodeOpenCommand,
    claudeDesktopConfig,
    claudeDesktopConfigPath,
    cursorConfig,
    cursorConfigPath,
    detectOs,
    maskToken,
    mcpConnectUrl,
    tokenEnvCommands,
    type McpOs,
  } from '$lib/utilities/Mcp';
  import CodeBlock from '$lib/components/CodeBlock.svelte';

  let mounted = $state(false);
  let os: McpOs = $state('unix');
  let revealed = $state(false);

  const url = $derived(mcpConnectUrl(config.features.mcpConnect, config.settings.mcpUrl));
  const token = $derived(mounted && $tokenStatus ? ($user?.token ?? '') : '');
  const hasToken = $derived(token !== '');
  const filler = $derived(hasToken ? token : TOKEN_PLACEHOLDER);

  const envCommands = $derived(tokenEnvCommands(os, filler));
  const cursor = $derived(cursorConfig(url, filler));
  const desktop = $derived(claudeDesktopConfig(url, filler));

  /**
   * Returns the text to render for a snippet: the full text when the token is revealed or
   * absent, otherwise the text with the token replaced by bullets.
   */
  function shown(text: string): string {
    return revealed ? text : maskToken(text, token);
  }

  onMount(() => {
    os = detectOs(navigator.platform || navigator.userAgent || '');
    mounted = true;
  });
</script>

{#if url}
  <div data-testid="mcp-connect" class="space-y-6">
    <p class="mx-0">
      Connect an AI assistant to PIC-SURE so it can search the data dictionary and run obfuscated
      open-access counts for you.
    </p>

    <div
      class="border border-primary-500 rounded-lg bg-primary-50-950 p-4"
      data-testid="mcp-connect-note"
    >
      <ul class="list-inside list-disc space-y-1">
        <li>
          The MCP tools serve open-access data only. Exact counts under your consents, participant
          rows, and exports need the Python or R client.
        </li>
        <li>Any code your assistant generates runs in your own environment, not on PIC-SURE.</li>
      </ul>
    </div>

    <section data-testid="mcp-step-token">
      <h3 class="text-lg font-bold mb-2">Step 1. Get your token</h3>
      {#if hasToken}
        <p class="mx-0 mb-2">
          You are logged in, so the commands below already contain your token. You can find and
          refresh it in the token section elsewhere on this page.
        </p>
        <div class="flex items-center gap-4">
          <code data-testid="mcp-token-display" class="break-all"
            >{revealed ? token : TOKEN_MASK}</code
          >
          <button
            type="button"
            data-testid="mcp-token-reveal"
            class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
            onclick={() => (revealed = !revealed)}
          >
            {revealed ? 'Hide token' : 'Show token'}
          </button>
        </div>
      {:else}
        <p class="mx-0">
          Log in to have your token filled into the commands below, or paste it where a command says <code
            >{TOKEN_PLACEHOLDER}</code
          >.
        </p>
      {/if}
      <p class="mx-0 mt-2 text-sm">
        Copied commands and config contain your token, which grants access as you, and commands also
        land in your shell history. Do not paste them into shared documents or chat.
      </p>
    </section>

    <section data-testid="mcp-step-environment">
      <h3 class="text-lg font-bold mb-2">Step 2. Set the token in your environment</h3>
      <label class="block mb-2">
        <span class="mr-2">Operating system</span>
        <select
          class="select w-auto"
          data-testid="mcp-os"
          value={os}
          onchange={(event) => (os = event.currentTarget.value as McpOs)}
        >
          {#each MCP_OS_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>
      <p class="mx-0 mb-2 text-sm">
        "This shell only" sets the variable for the window you paste it into; "Every new shell"
        stores it so future windows have it.
      </p>
      <p class="mx-0 mb-2">This shell only:</p>
      <CodeBlock lang="bash" code={shown(envCommands.session)} copyCode={envCommands.session} />
      <p class="mx-0 my-2">
        Every new shell{os === 'unix' ? ' (bash users use ~/.bashrc instead of ~/.zshrc)' : ''}:
      </p>
      <CodeBlock
        lang="bash"
        code={shown(envCommands.persistent)}
        copyCode={envCommands.persistent}
      />
      {#if os === 'cmd'}
        <p class="mx-0 mt-2 text-sm">
          Takes effect in new Command Prompt windows; run the line above for this one.
        </p>
      {/if}
      <p class="mx-0 mt-2 text-sm">
        Copied commands and config contain your token, which grants access as you, and commands also
        land in your shell history. Do not paste them into shared documents or chat.
      </p>
    </section>

    <section data-testid="mcp-step-connect">
      <h3 class="text-lg font-bold mb-2">Step 3. Connect your assistant</h3>

      <h4 class="font-bold mb-2">Claude Code</h4>
      <p class="mx-0 mb-2">With your token:</p>
      <CodeBlock lang="bash" code={claudeCodeCommand(os, url)} />
      <p class="mx-0 my-2">For open access without login:</p>
      <CodeBlock lang="bash" code={claudeCodeOpenCommand(url)} />

      <h4 class="font-bold mt-4 mb-2">Claude Desktop</h4>
      <p class="mx-0 mb-2">Without a token:</p>
      <ol class="list-inside list-decimal space-y-1 mb-2">
        <li>Open Settings, then Connectors.</li>
        <li>Choose Add custom connector.</li>
        <li>Paste this URL:</li>
      </ol>
      <CodeBlock lang="bash" code={url} />
      <p class="mx-0 my-2">
        With your token, add this to <code>{claudeDesktopConfigPath(os)}</code>. It needs Node, and
        the token travels in the config's <code>env</code> block, so it does not depend on the shell:
      </p>
      <CodeBlock lang="json" code={shown(desktop)} copyCode={desktop} />

      <h4 class="font-bold mt-4 mb-2">Cursor</h4>
      <p class="mx-0 mb-2">
        Add this to <code>{cursorConfigPath(os)}</code>{hasToken
          ? ''
          : `, replacing ${TOKEN_PLACEHOLDER} with your token`}. If you put it in a project's
        <code>.cursor/mcp.json</code> instead, do not commit that file.
      </p>
      <CodeBlock lang="json" code={shown(cursor)} copyCode={cursor} />
    </section>

    <section data-testid="mcp-step-try">
      <h3 class="text-lg font-bold mb-2">Step 4. Try it</h3>
      <p class="mx-0">
        Ask your assistant: "Search PIC-SURE for blood pressure variables and count participants
        aged 20 to 40." Open counts are obfuscated, and authorized work needs the Python or R
        client.
      </p>
    </section>
  </div>
{/if}
