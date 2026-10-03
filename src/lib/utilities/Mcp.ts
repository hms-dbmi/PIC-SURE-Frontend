/**
 * Returns the trimmed MCP server URL when the assistant connection panel should be
 * offered, or an empty string when the feature is off or no URL is configured.
 *
 * @param enabled whether the MCP_CONNECT feature is on
 * @param url the raw MCP_URL setting
 */
export function mcpConnectUrl(enabled: boolean, url: string): string {
  return enabled ? url.trim() : '';
}

export type McpOs = 'unix' | 'powershell' | 'cmd';

export const MCP_OS_OPTIONS: { value: McpOs; label: string }[] = [
  { value: 'unix', label: 'macOS and Linux (bash or zsh)' },
  { value: 'powershell', label: 'Windows PowerShell' },
  { value: 'cmd', label: 'Windows Command Prompt' },
];

export const TOKEN_PLACEHOLDER = 'YOUR_PICSURE_TOKEN';

export const TOKEN_MASK = '•'.repeat(24);

/**
 * Picks the default operating system choice from a browser platform string:
 * Windows gives PowerShell, everything else gives macOS and Linux.
 *
 * @param platform navigator.platform or navigator.userAgent
 */
export function detectOs(platform: string): McpOs {
  return /win/i.test(platform) && !/darwin/i.test(platform) ? 'powershell' : 'unix';
}

/**
 * Replaces every occurrence of the token in the text with a fixed-width run of bullets,
 * so the rendered text never reveals the token or its length.
 *
 * @param text the text that may contain the token
 * @param token the real token, or an empty string when there is none
 */
export function maskToken(text: string, token: string): string {
  return token ? text.split(token).join(TOKEN_MASK) : text;
}

/**
 * Builds the two commands that store the token in an environment variable: one for the
 * current shell only and one that persists for every new shell.
 *
 * @param os the selected operating system
 * @param token the token, or the placeholder text when the user is not logged in
 */
export function tokenEnvCommands(
  os: McpOs,
  token: string,
): { session: string; persistent: string } {
  switch (os) {
    case 'powershell':
      return {
        session: `$env:PICSURE_TOKEN = "${token}"`,
        persistent: `[Environment]::SetEnvironmentVariable("PICSURE_TOKEN", "${token}", "User")`,
      };
    case 'cmd':
      return {
        session: `set PICSURE_TOKEN=${token}`,
        persistent: `setx PICSURE_TOKEN "${token}"`,
      };
    default:
      return {
        session: `export PICSURE_TOKEN="${token}"`,
        persistent: `echo 'export PICSURE_TOKEN="${token}"' >> ~/.zshrc`,
      };
  }
}

/**
 * Builds the Claude Code command that registers the server with the token read from the
 * PICSURE_TOKEN environment variable in the syntax of the selected shell.
 *
 * @param os the selected operating system
 * @param url the MCP server URL
 */
export function claudeCodeCommand(os: McpOs, url: string): string {
  const reference = {
    unix: '$PICSURE_TOKEN',
    powershell: '$env:PICSURE_TOKEN',
    cmd: '%PICSURE_TOKEN%',
  }[os];
  return `claude mcp add --transport http picsure ${url} --header "Authorization: Bearer ${reference}"`;
}

/**
 * Builds the Claude Code command for open access without a token.
 *
 * @param url the MCP server URL
 */
export function claudeCodeOpenCommand(url: string): string {
  return `claude mcp add --transport http picsure ${url}`;
}

/**
 * Builds the claude_desktop_config.json entry that runs mcp-remote with the token passed
 * through the entry's env block, so it does not depend on the shell that launched Claude Desktop.
 *
 * @param url the MCP server URL
 * @param token the token, or the placeholder text when the user is not logged in
 */
export function claudeDesktopConfig(url: string, token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        picsure: {
          command: 'npx',
          args: ['-y', 'mcp-remote', url, '--header', 'Authorization:${AUTH_HEADER}'],
          env: { AUTH_HEADER: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  );
}

/**
 * Returns where claude_desktop_config.json lives for the selected operating system.
 *
 * @param os the selected operating system
 */
export function claudeDesktopConfigPath(os: McpOs): string {
  return os === 'unix'
    ? '~/Library/Application Support/Claude/claude_desktop_config.json'
    : '%APPDATA%\\Claude\\claude_desktop_config.json';
}

/**
 * Returns where the global Cursor mcp.json lives for the selected operating system.
 *
 * @param os the selected operating system
 */
export function cursorConfigPath(os: McpOs): string {
  return os === 'unix' ? '~/.cursor/mcp.json' : '%USERPROFILE%\\.cursor\\mcp.json';
}

/**
 * Builds the .cursor/mcp.json entry with the token in the Authorization header.
 *
 * @param url the MCP server URL
 * @param token the token, or the placeholder text when the user is not logged in
 */
export function cursorConfig(url: string, token: string): string {
  return JSON.stringify(
    {
      mcpServers: { picsure: { type: 'http', url, headers: { Authorization: `Bearer ${token}` } } },
    },
    null,
    2,
  );
}
