<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { resolve } from '$app/paths';
  import { config } from '$lib/configuration.svelte';
  import { user, tokenStatus, getUser } from '$lib/stores/User';
  import {
    MCP_OS_OPTIONS,
    TOKEN_MASK,
    TOKEN_PLACEHOLDER,
    claudeCodeCommand,
    claudeCodeOpenCommand,
    claudeCodeRemoveCommand,
    claudeDesktopConfig,
    claudeDesktopConfigPath,
    cursorConfig,
    cursorConfigPath,
    detectOs,
    isPosixShell,
    maskToken,
    mcpConnectUrl,
    shellLanguage,
    tokenEnvCommands,
    type McpOs,
  } from '$lib/utilities/Mcp';
  import CodeBlock from '$lib/components/CodeBlock.svelte';

  let mounted = $state(false);
  let os: McpOs = $state('macos');
  let revealed = $state(false);
  let tokenLoadFailed = $state(false);

  const url = $derived(mcpConnectUrl(config.features.mcpConnect, config.settings.mcpUrl));
  const openAccess = $derived(config.features.login.open);
  const loggedIn = $derived(mounted && $tokenStatus);
  const token = $derived(loggedIn ? ($user?.token ?? '') : '');
  const hasToken = $derived(token !== '');
  const tokenState = $derived(
    !loggedIn ? 'loggedOut' : hasToken ? 'ready' : tokenLoadFailed ? 'failed' : 'loading',
  );
  const filler = $derived(hasToken ? token : TOKEN_PLACEHOLDER);
  const shell = $derived(shellLanguage(os));
  const desktopPath = $derived(claudeDesktopConfigPath(os));

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

  /**
   * Loads the long-term token for a logged-in user when it is not in the user store yet, and
   * records a failure when the request fails or returns no token.
   */
  async function loadToken() {
    if (!get(tokenStatus) || get(user)?.token) return;
    try {
      await getUser(false, true);
      tokenLoadFailed = !get(user)?.token;
    } catch {
      tokenLoadFailed = true;
    }
  }

  onMount(() => {
    os = detectOs(navigator.platform || navigator.userAgent || '');
    mounted = true;
    void loadToken();
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
      {#if tokenState === 'ready'}
        <p class="mx-0 mb-2">
          You are logged in, so the commands below already contain your token. You can find and
          refresh it in the token section elsewhere on this page.
        </p>
        <div class="flex items-center gap-4">
          <code data-testid="mcp-token-display" class="break-all">
            {#if revealed}
              {token}
            {:else}
              <span aria-hidden="true">{TOKEN_MASK}</span><span class="sr-only">Token hidden</span>
            {/if}
          </code>
          <button
            type="button"
            data-testid="mcp-token-reveal"
            class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
            aria-pressed={revealed}
            onclick={() => (revealed = !revealed)}
          >
            {revealed ? 'Hide token' : 'Show token'}
          </button>
        </div>
      {:else if tokenState === 'loading'}
        <p class="mx-0" data-testid="mcp-token-loading">
          Loading your token. Until it loads, the commands below say <code>{TOKEN_PLACEHOLDER}</code
          > where it goes.
        </p>
      {:else if tokenState === 'failed'}
        <p class="mx-0" data-testid="mcp-token-failed">
          Your token could not be loaded. Copy it from the token section elsewhere on this page and
          paste it where a command says <code>{TOKEN_PLACEHOLDER}</code>, or reload the page to try
          again.
        </p>
      {:else if openAccess}
        <p class="mx-0">
          Log in to have your token filled into the commands below, or paste it where a command says <code
            >{TOKEN_PLACEHOLDER}</code
          >.
        </p>
      {:else}
        <p class="mx-0" data-testid="mcp-login-required">
          This site needs a token to connect an assistant. <a
            class="anchor"
            href="{resolve('/login')}?redirectTo=/api">Log in</a
          > to get your token.
        </p>
      {/if}
      <p class="mx-0 mt-2" data-testid="mcp-token-refresh">
        After you refresh your token, or when it expires, repeat Steps 2 and 3, because PIC-SURE
        accepts only your current token. For Claude Code, run <code
          >{claudeCodeRemoveCommand()}</code
        > before adding it again.
      </p>
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
      <CodeBlock lang={shell} code={shown(envCommands.session)} copyCode={envCommands.session} />
      <p class="mx-0 my-2">
        Every new shell{os === 'macos'
          ? ' (bash users use ~/.bash_profile instead of ~/.zshrc)'
          : os === 'linux'
            ? ' (bash users use ~/.bashrc instead of ~/.zshrc)'
            : ''}:
      </p>
      <CodeBlock
        lang={shell}
        code={shown(envCommands.persistent)}
        copyCode={envCommands.persistent}
      />
      <p class="mx-0 mt-2 text-sm" data-testid="mcp-env-note">
        {#if os === 'powershell'}
          The second line only reaches PowerShell windows opened after it runs. Run both lines: the
          first for this window, the second for new ones.
        {:else if os === 'cmd'}
          The second line only reaches Command Prompt windows opened after it runs. Run both lines:
          the first for this window, the second for new ones.
        {:else}
          The second line only reaches terminal windows opened after it runs. Run both lines: the
          first for this window, the second for new ones.
        {/if}
      </p>
    </section>

    <section data-testid="mcp-step-connect">
      <h3 class="text-lg font-bold mb-2">Step 3. Connect your assistant</h3>

      <h4 class="font-bold mb-2">Claude Code</h4>
      <p class="mx-0 mb-2">
        With your token, run this in the window where you set it. It adds PIC-SURE for all your
        projects:
      </p>
      <CodeBlock lang={shell} code={claudeCodeCommand(os, url)} />
      {#if isPosixShell(os)}
        <p class="mx-0 mt-2 text-sm">
          If PICSURE_TOKEN is not set, the command stops with an error instead of saving an empty
          token.
        </p>
      {/if}
      {#if openAccess}
        <p class="mx-0 my-2">For open access without login:</p>
        <CodeBlock lang={shell} code={claudeCodeOpenCommand(url)} />
      {/if}

      <h4 class="font-bold mt-4 mb-2">Claude Desktop</h4>
      {#if openAccess}
        <p class="mx-0 mb-2">Without a token:</p>
        <ol class="list-inside list-decimal space-y-1 mb-2">
          <li>Open Settings, then Connectors.</li>
          <li>Choose Add custom connector.</li>
          <li>Paste this URL:</li>
        </ol>
        <CodeBlock lang="bash" code={url} />
        <p class="mx-0 my-2 text-sm" data-testid="mcp-connector-note">
          Claude reaches custom connectors from Anthropic's servers, not from your computer, so this
          works only when the URL above is reachable from the public internet. Free plans allow one
          custom connector.
        </p>
      {/if}
      <p class="mx-0 my-2" data-testid="mcp-desktop-config">
        With your token, add the <code>picsure</code> entry below to the
        <code>mcpServers</code> block of {#if desktopPath}<code>{desktopPath}</code>{:else}<code
            >claude_desktop_config.json</code
          >{/if}. You can open that file from Claude Desktop under Settings, Developer, Edit Config.
        If the file already lists other servers, add the entry next to them instead of replacing the
        file. It needs Node, and the token travels in the config's
        <code>env</code> block, so it does not depend on the shell.
        {#if os === 'linux'}
          Claude Desktop for Linux is in beta.
        {/if}
      </p>
      <CodeBlock lang="json" code={shown(desktop)} copyCode={desktop} />

      <h4 class="font-bold mt-4 mb-2">Cursor</h4>
      <p class="mx-0 mb-2">
        Add the <code>picsure</code> entry below to the <code>mcpServers</code> block of
        <code>{cursorConfigPath(os)}</code>{hasToken
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
