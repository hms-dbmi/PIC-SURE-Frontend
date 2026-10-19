import { describe, expect, it } from 'vitest';

import {
  TOKEN_MASK,
  claudeCodeCommand,
  claudeCodeOpenCommand,
  claudeCodeRemoveCommand,
  claudeDesktopConfig,
  claudeDesktopConfigPath,
  cursorConfigPath,
  cursorConfig,
  detectOs,
  isPosixShell,
  maskToken,
  mcpConnectUrl,
  shellLanguage,
  tokenEnvCommands,
} from '$lib/utilities/Mcp';

const url = 'https://picsure.example.org/mcp';

describe('mcpConnectUrl', () => {
  it('trims the URL when enabled and is empty when disabled', () => {
    expect(mcpConnectUrl(true, ` ${url} `)).toBe(url);
    expect(mcpConnectUrl(false, url)).toBe('');
  });
});

describe('detectOs', () => {
  it.each([
    ['Win32', 'powershell'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'powershell'],
    ['MacIntel', 'macos'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Darwin', 'macos'],
    ['Linux x86_64', 'linux'],
    ['Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)', 'linux'],
    ['', 'macos'],
  ])('maps %j to %s', (platform, expected) => {
    expect(detectOs(platform)).toBe(expected);
  });
});

describe('shell helpers', () => {
  it.each([
    ['macos', true, 'bash'],
    ['linux', true, 'bash'],
    ['powershell', false, 'powershell'],
    ['cmd', false, 'cmd'],
  ] as const)('treats %s as posix=%s with %s highlighting', (os, posix, language) => {
    expect(isPosixShell(os)).toBe(posix);
    expect(shellLanguage(os)).toBe(language);
  });
});

describe('maskToken', () => {
  it('replaces every occurrence of the token', () => {
    const masked = maskToken('a abc b abc', 'abc');
    expect(masked).toBe(`a ${TOKEN_MASK} b ${TOKEN_MASK}`);
    expect(masked).not.toContain('abc');
  });

  it('returns the text unchanged without a token', () => {
    expect(maskToken('nothing to hide', '')).toBe('nothing to hide');
  });
});

describe('tokenEnvCommands', () => {
  it.each(['macos', 'linux'] as const)('builds the %s commands', (os) => {
    expect(tokenEnvCommands(os, 'T')).toEqual({
      session: 'export PICSURE_TOKEN="T"',
      persistent: `echo 'export PICSURE_TOKEN="T"' >> ~/.zshrc`,
    });
  });

  it('builds the PowerShell commands', () => {
    expect(tokenEnvCommands('powershell', 'T')).toEqual({
      session: '$env:PICSURE_TOKEN = "T"',
      persistent: '[Environment]::SetEnvironmentVariable("PICSURE_TOKEN", "T", "User")',
    });
  });

  it('builds the Command Prompt commands', () => {
    expect(tokenEnvCommands('cmd', 'T')).toEqual({
      session: 'set PICSURE_TOKEN=T',
      persistent: 'setx PICSURE_TOKEN "T"',
    });
  });
});

describe('connect commands', () => {
  it.each([
    ['macos', '${PICSURE_TOKEN:?set PICSURE_TOKEN first}'],
    ['linux', '${PICSURE_TOKEN:?set PICSURE_TOKEN first}'],
    ['powershell', '$env:PICSURE_TOKEN'],
    ['cmd', '%PICSURE_TOKEN%'],
  ] as const)('references the variable in %s syntax', (os, reference) => {
    expect(claudeCodeCommand(os, url)).toBe(
      `claude mcp add --scope user --transport http picsure "${url}" --header "Authorization: Bearer ${reference}"`,
    );
  });

  it('builds the open access command', () => {
    expect(claudeCodeOpenCommand(url)).toBe(
      `claude mcp add --scope user --transport http picsure "${url}"`,
    );
  });

  it('adds the public key header to the open access command when asked', () => {
    expect(claudeCodeOpenCommand(url, true)).toBe(
      `claude mcp add --scope user --transport http picsure "${url}" --header "X-PICSURE-API-Key: YOUR_PUBLIC_KEY"`,
    );
  });

  it('removes the server from the same scope it was added to', () => {
    expect(claudeCodeRemoveCommand()).toBe('claude mcp remove --scope user picsure');
  });

  it('puts the token in the Cursor header without a transport type', () => {
    const parsed = JSON.parse(cursorConfig(url, 'T'));
    expect(parsed.mcpServers.picsure).toEqual({
      url,
      headers: { Authorization: 'Bearer T' },
    });
  });
});

describe('claudeDesktopConfig', () => {
  it('passes the token through the env block', () => {
    const parsed = JSON.parse(claudeDesktopConfig(url, 'T'));
    expect(parsed.mcpServers.picsure).toEqual({
      command: 'npx',
      args: ['-y', 'mcp-remote', url, '--header', 'Authorization:${AUTH_HEADER}'],
      env: { AUTH_HEADER: 'Bearer T' },
    });
  });
});

describe('config paths', () => {
  it('gives the Claude Desktop path per operating system', () => {
    expect(claudeDesktopConfigPath('macos')).toBe(
      '~/Library/Application Support/Claude/claude_desktop_config.json',
    );
    expect(claudeDesktopConfigPath('linux')).toBe('');
    expect(claudeDesktopConfigPath('powershell')).toBe(
      '%APPDATA%\\Claude\\claude_desktop_config.json',
    );
    expect(claudeDesktopConfigPath('cmd')).toBe('%APPDATA%\\Claude\\claude_desktop_config.json');
  });

  it('gives the global Cursor path per operating system', () => {
    expect(cursorConfigPath('macos')).toBe('~/.cursor/mcp.json');
    expect(cursorConfigPath('linux')).toBe('~/.cursor/mcp.json');
    expect(cursorConfigPath('cmd')).toBe('%USERPROFILE%\\.cursor\\mcp.json');
  });
});
