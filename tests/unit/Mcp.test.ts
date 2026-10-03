import { describe, expect, it } from 'vitest';

import {
  TOKEN_MASK,
  claudeCodeCommand,
  claudeCodeOpenCommand,
  claudeDesktopConfig,
  claudeDesktopConfigPath,
  cursorConfigPath,
  cursorConfig,
  detectOs,
  maskToken,
  mcpConnectUrl,
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
    ['MacIntel', 'unix'],
    ['Linux x86_64', 'unix'],
    ['', 'unix'],
  ])('maps %j to %s', (platform, expected) => {
    expect(detectOs(platform)).toBe(expected);
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
  it('builds the macOS and Linux commands', () => {
    expect(tokenEnvCommands('unix', 'T')).toEqual({
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
    ['unix', '$PICSURE_TOKEN'],
    ['powershell', '$env:PICSURE_TOKEN'],
    ['cmd', '%PICSURE_TOKEN%'],
  ] as const)('references the variable in %s syntax', (os, reference) => {
    expect(claudeCodeCommand(os, url)).toBe(
      `claude mcp add --transport http picsure ${url} --header "Authorization: Bearer ${reference}"`,
    );
  });

  it('builds the open access command', () => {
    expect(claudeCodeOpenCommand(url)).toBe(`claude mcp add --transport http picsure ${url}`);
  });

  it('puts the token in the Cursor header', () => {
    const parsed = JSON.parse(cursorConfig(url, 'T'));
    expect(parsed.mcpServers.picsure).toEqual({
      type: 'http',
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
    expect(claudeDesktopConfigPath('unix')).toBe(
      '~/Library/Application Support/Claude/claude_desktop_config.json',
    );
    expect(claudeDesktopConfigPath('powershell')).toBe(
      '%APPDATA%\\Claude\\claude_desktop_config.json',
    );
    expect(claudeDesktopConfigPath('cmd')).toBe('%APPDATA%\\Claude\\claude_desktop_config.json');
  });

  it('gives the global Cursor path per operating system', () => {
    expect(cursorConfigPath('unix')).toBe('~/.cursor/mcp.json');
    expect(cursorConfigPath('cmd')).toBe('%USERPROFILE%\\.cursor\\mcp.json');
  });
});
