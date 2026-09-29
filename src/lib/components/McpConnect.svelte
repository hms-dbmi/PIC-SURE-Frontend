<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import { mcpConnectUrl } from '$lib/utilities/Mcp';
  import CodeBlock from '$lib/components/CodeBlock.svelte';

  const url = $derived(mcpConnectUrl(config.features.mcpConnect, config.settings.mcpUrl));

  const claudeCode = $derived(`claude mcp add --transport http picsure ${url}`);
  const claudeCodeToken = $derived(
    `claude mcp add --transport http picsure ${url} --header "Authorization: Bearer $PICSURE_TOKEN"`,
  );

  const claudeDesktopToken = $derived(
    JSON.stringify(
      {
        mcpServers: {
          picsure: {
            command: 'npx',
            args: ['-y', 'mcp-remote', url, '--header', 'Authorization: Bearer ${PICSURE_TOKEN}'],
          },
        },
      },
      null,
      2,
    ),
  );

  function serverBlock(headers: boolean) {
    const server: Record<string, unknown> = { type: 'http', url };
    if (headers) server.headers = { Authorization: 'Bearer <your PIC-SURE token>' };
    return JSON.stringify({ mcpServers: { picsure: server } }, null, 2);
  }
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

    <section>
      <h3 class="text-lg font-bold mb-2">Claude Code</h3>
      <p class="mx-0 mb-2">Without a token:</p>
      <CodeBlock lang="bash" code={claudeCode} />
      <p class="mx-0 my-2">With your token, exported as PICSURE_TOKEN:</p>
      <CodeBlock lang="bash" code={claudeCodeToken} />
    </section>

    <section>
      <h3 class="text-lg font-bold mb-2">Claude Desktop</h3>
      <p class="mx-0 mb-2">Without a token:</p>
      <ol class="list-inside list-decimal space-y-1 mb-2">
        <li>Open Settings, then Connectors.</li>
        <li>Choose Add custom connector.</li>
        <li>Paste this URL:</li>
      </ol>
      <CodeBlock lang="bash" code={url} />
      <p class="mx-0 my-2">
        With your token, add this to <code>claude_desktop_config.json</code>. It needs Node, and
        mcp-remote reads <code>PICSURE_TOKEN</code> from the environment:
      </p>
      <CodeBlock lang="json" code={claudeDesktopToken} />
    </section>

    <section>
      <h3 class="text-lg font-bold mb-2">Cursor</h3>
      <p class="mx-0 mb-2">Add this to <code>.cursor/mcp.json</code>. Without a token:</p>
      <CodeBlock lang="json" code={serverBlock(false)} />
      <p class="mx-0 my-2">With your token:</p>
      <CodeBlock lang="json" code={serverBlock(true)} />
    </section>
  </div>
{/if}
