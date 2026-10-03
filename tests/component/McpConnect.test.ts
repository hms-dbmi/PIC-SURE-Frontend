// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';

import { tokenStatus, user } from '$lib/stores/User';
import { TOKEN_MASK } from '$lib/utilities/Mcp';
import McpConnect from '$lib/components/McpConnect.svelte';

const mockState = vi.hoisted(() => ({ enabled: false, url: '' }));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    get features() {
      return { mcpConnect: mockState.enabled };
    },
    get settings() {
      return { mcpUrl: mockState.url };
    },
  },
}));

const url = 'https://picsure.example.org/mcp';
const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.fake-payload.fake-signature';

function blocks(container: HTMLElement) {
  return Array.from(container.querySelectorAll('pre.shiki')).map((b) => b.textContent ?? '');
}

function logIn() {
  user.set({ ...get(user), token: fakeToken });
  tokenStatus.set(true);
}

async function chooseOs(value: string) {
  await fireEvent.change(screen.getByTestId('mcp-os'), { target: { value } });
  await waitFor(() => expect(screen.getByTestId('mcp-os')).toHaveValue(value));
  await tick();
}

describe('McpConnect', () => {
  beforeEach(() => {
    mockState.enabled = true;
    mockState.url = url;
    tokenStatus.set(false);
    user.set({ ...get(user), token: '' });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
    Element.prototype.animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve(),
    });
  });

  it('is shown when the feature is on and a URL is set', () => {
    render(McpConnect);

    expect(screen.getByTestId('mcp-connect')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('Claude Desktop')).toBeInTheDocument();
    expect(screen.getByText('Cursor')).toBeInTheDocument();
  });

  it('is hidden when the feature is off', () => {
    mockState.enabled = false;
    render(McpConnect);

    expect(screen.queryByTestId('mcp-connect')).not.toBeInTheDocument();
  });

  it.each(['', '   '])('is hidden when the URL is %j', (blank) => {
    mockState.url = blank;
    render(McpConnect);

    expect(screen.queryByTestId('mcp-connect')).not.toBeInTheDocument();
  });

  it('puts the URL in every connect snippet and the token placeholder when logged out', () => {
    const { container } = render(McpConnect);

    const all = blocks(container);
    expect(all).toHaveLength(7);
    const [session, persistent, codeToken, codeOpen, desktopUrl, desktopConfig, cursor] = all;
    [codeToken, codeOpen, desktopUrl, desktopConfig, cursor].forEach((text) =>
      expect(text).toContain(url),
    );
    expect(session).toBe('export PICSURE_TOKEN="YOUR_PICSURE_TOKEN"');
    expect(persistent).toContain('~/.zshrc');
    expect(codeToken).toContain('--header "Authorization: Bearer $PICSURE_TOKEN"');
    expect(codeOpen).not.toContain('--header');
    expect(desktopUrl).not.toContain('PICSURE_TOKEN');
    expect(desktopConfig).toContain('mcp-remote');
    expect(desktopConfig).toContain('Authorization:${AUTH_HEADER}');
    expect(desktopConfig).toContain('"AUTH_HEADER": "Bearer YOUR_PICSURE_TOKEN"');
    expect(cursor).toContain('Bearer YOUR_PICSURE_TOKEN');
  });

  it('shows no bullets and no reveal button when logged out', () => {
    const { container } = render(McpConnect);

    expect(container.textContent).not.toContain(TOKEN_MASK);
    expect(screen.queryByTestId('mcp-token-reveal')).not.toBeInTheDocument();
    expect(screen.getByTestId('mcp-step-token')).toHaveTextContent(/Log in/);
  });

  it('masks the token on screen, copies it in full, and reveals it on request', async () => {
    logIn();
    const { container } = render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-token-reveal')).toBeInTheDocument());
    expect(container.textContent).not.toContain(fakeToken);
    expect(screen.getByTestId('mcp-token-display')).toHaveTextContent(TOKEN_MASK);
    const [session, , , , , desktop, cursor] = blocks(container);
    expect(desktop).toContain(`"AUTH_HEADER": "Bearer ${TOKEN_MASK}"`);
    expect(session).toBe(`export PICSURE_TOKEN="${TOKEN_MASK}"`);
    expect(cursor).toContain(`Bearer ${TOKEN_MASK}`);

    await fireEvent.click(screen.getAllByTestId('code-block-copy-btn')[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `export PICSURE_TOKEN="${fakeToken}"`,
    );

    await fireEvent.click(screen.getAllByTestId('code-block-copy-btn')[5]);
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls.at(-1)?.[0]).toContain(
      `"AUTH_HEADER": "Bearer ${fakeToken}"`,
    );

    await fireEvent.click(screen.getAllByTestId('code-block-copy-btn')[6]);
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls.at(-1)?.[0]).toContain(
      `Bearer ${fakeToken}`,
    );

    await fireEvent.click(screen.getByTestId('mcp-token-reveal'));
    expect(screen.getByTestId('mcp-token-reveal')).toHaveTextContent('Hide token');
    expect(screen.getByTestId('mcp-token-display')).toHaveTextContent(fakeToken);
    expect(blocks(container)[0]).toBe(`export PICSURE_TOKEN="${fakeToken}"`);
    expect(blocks(container)[5]).toContain(`Bearer ${fakeToken}`);
    expect(blocks(container)[6]).toContain(`Bearer ${fakeToken}`);
  });

  it('changes the commands when the operating system changes', async () => {
    const { container } = render(McpConnect);

    await chooseOs('powershell');
    let all = blocks(container);
    expect(all[0]).toContain('$env:PICSURE_TOKEN = ');
    expect(all[1]).toContain('[Environment]::SetEnvironmentVariable');
    expect(all[2]).toContain('Bearer $env:PICSURE_TOKEN');

    await chooseOs('cmd');
    expect(screen.getByTestId('mcp-step-environment')).toHaveTextContent(
      'Takes effect in new Command Prompt windows; run the line above for this one.',
    );
    all = blocks(container);
    expect(all[0]).toContain('set PICSURE_TOKEN=');
    expect(all[1]).toContain('setx PICSURE_TOKEN');
    expect(all[2]).toContain('Bearer %PICSURE_TOKEN%');
    all.slice(2).forEach((text) => expect(text).toContain(url));

    await chooseOs('unix');
    expect(blocks(container)[0]).toContain('export PICSURE_TOKEN=');
  });

  it.each([
    ['Win32', 'powershell'],
    ['MacIntel', 'unix'],
    ['Linux x86_64', 'unix'],
  ])('defaults the operating system from the platform %s', async (platform, expected) => {
    Object.defineProperty(navigator, 'platform', { value: platform, configurable: true });
    render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-os')).toHaveValue(expected));
  });

  it('warns about the token and shell history in steps 1 and 2', () => {
    render(McpConnect);

    expect(screen.getByTestId('mcp-step-token')).toHaveTextContent(/shell history/);
    expect(screen.getByTestId('mcp-step-environment')).toHaveTextContent(/shell history/);
    expect(screen.getByTestId('mcp-step-environment')).toHaveTextContent(/This shell only/);
  });

  it('points Cursor at the global file and Desktop at its config path per OS', async () => {
    render(McpConnect);
    const connect = screen.getByTestId('mcp-step-connect');

    expect(connect).toHaveTextContent('~/.cursor/mcp.json');
    expect(connect).toHaveTextContent(
      'Library/Application Support/Claude/claude_desktop_config.json',
    );
    expect(connect).toHaveTextContent('do not commit that file');

    await chooseOs('powershell');
    expect(connect).toHaveTextContent('%USERPROFILE%\\.cursor\\mcp.json');
    expect(connect).toHaveTextContent('%APPDATA%\\Claude\\claude_desktop_config.json');
  });

  it('says authorized work needs the Python or R client', () => {
    render(McpConnect);

    expect(screen.getByTestId('mcp-connect-note')).toHaveTextContent(/Python or R client/);
    expect(screen.getByTestId('mcp-connect-note')).toHaveTextContent(/open-access data only/);
    expect(screen.getByTestId('mcp-connect-note')).toHaveTextContent(/your own environment/);
  });
});
