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

export type McpOs = 'macos' | 'linux' | 'powershell' | 'cmd';

export type McpShellLanguage = 'bash' | 'powershell' | 'cmd';

export const MCP_OS_OPTIONS: { value: McpOs; label: string }[] = [
  { value: 'macos', label: 'macOS (zsh or bash)' },
  { value: 'linux', label: 'Linux (bash or zsh)' },
  { value: 'powershell', label: 'Windows PowerShell' },
  { value: 'cmd', label: 'Windows Command Prompt' },
];

export const TOKEN_PLACEHOLDER = 'YOUR_PICSURE_TOKEN';

export const PUBLIC_KEY_PLACEHOLDER = 'YOUR_PUBLIC_KEY';

export const TOKEN_MASK = '•'.repeat(24);

/**
 * Picks the default operating system choice from a browser platform string: Windows gives
 * PowerShell, Linux and ChromeOS give Linux, and everything else gives macOS.
 *
 * @param platform navigator.platform or navigator.userAgent
 */
export function detectOs(platform: string): McpOs {
  if (/win/i.test(platform) && !/darwin/i.test(platform)) return 'powershell';
  if (/linux|x11|cros/i.test(platform)) return 'linux';
  return 'macos';
}

/**
 * Tells whether the selected operating system uses a POSIX shell such as bash or zsh.
 *
 * @param os the selected operating system
 */
export function isPosixShell(os: McpOs): boolean {
  return os === 'macos' || os === 'linux';
}

/**
 * Returns the syntax highlighting language for shell snippets on the selected operating system.
 *
 * @param os the selected operating system
 */
export function shellLanguage(os: McpOs): McpShellLanguage {
  if (os === 'powershell') return 'powershell';
  if (os === 'cmd') return 'cmd';
  return 'bash';
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
 * Builds the Claude Code command that registers the server for every project with the token
 * read from the PICSURE_TOKEN environment variable in the syntax of the selected shell. In
 * bash and zsh an unset variable stops the command with an error instead of saving an empty
 * token. PowerShell and cmd have no such guard, so an unset variable saves the server without
 * a working token.
 *
 * @param os the selected operating system
 * @param url the MCP server URL
 */
export function claudeCodeCommand(os: McpOs, url: string): string {
  const reference = {
    macos: '${PICSURE_TOKEN:?set PICSURE_TOKEN first}',
    linux: '${PICSURE_TOKEN:?set PICSURE_TOKEN first}',
    powershell: '$env:PICSURE_TOKEN',
    cmd: '%PICSURE_TOKEN%',
  }[os];
  return `${claudeCodeOpenCommand(url)} --header "Authorization: Bearer ${reference}"`;
}

/**
 * Builds the Claude Code command that registers the server for every project without a
 * token, for sites that offer open access.
 *
 * @param url the MCP server URL
 * @param withPublicKey whether to send the X-PICSURE-API-Key header with the public key
 *   placeholder, for sites that issue public access keys
 */
export function claudeCodeOpenCommand(url: string, withPublicKey = false): string {
  const command = `claude mcp add --scope user --transport http picsure "${url}"`;
  return withPublicKey
    ? `${command} --header "X-PICSURE-API-Key: ${PUBLIC_KEY_PLACEHOLDER}"`
    : command;
}

/**
 * Builds the Claude Code command that removes the server registered by the commands above,
 * so it can be added again with a new token.
 */
export function claudeCodeRemoveCommand(): string {
  return 'claude mcp remove --scope user picsure';
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
 * Returns where claude_desktop_config.json lives for the selected operating system, or an
 * empty string for Linux, where the file is opened from the app instead.
 *
 * @param os the selected operating system
 */
export function claudeDesktopConfigPath(os: McpOs): string {
  switch (os) {
    case 'macos':
      return '~/Library/Application Support/Claude/claude_desktop_config.json';
    case 'linux':
      return '';
    default:
      return '%APPDATA%\\Claude\\claude_desktop_config.json';
  }
}

/**
 * Returns where the global Cursor mcp.json lives for the selected operating system.
 *
 * @param os the selected operating system
 */
export function cursorConfigPath(os: McpOs): string {
  return isPosixShell(os) ? '~/.cursor/mcp.json' : '%USERPROFILE%\\.cursor\\mcp.json';
}

/**
 * Builds the Cursor mcp.json entry for a remote server with the token in the Authorization header.
 *
 * @param url the MCP server URL
 * @param token the token, or the placeholder text when the user is not logged in
 */
export function cursorConfig(url: string, token: string): string {
  return JSON.stringify(
    {
      mcpServers: { picsure: { url, headers: { Authorization: `Bearer ${token}` } } },
    },
    null,
    2,
  );
}
