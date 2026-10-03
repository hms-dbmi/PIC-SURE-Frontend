// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';

import { tokenStatus, user } from '$lib/stores/User';
import { TOKEN_MASK } from '$lib/utilities/Mcp';
import McpConnect from '$lib/components/McpConnect.svelte';

const mockState = vi.hoisted(() => ({ enabled: false, url: '', open: true }));
const apiGet = vi.hoisted(() => vi.fn());

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    get features() {
      return { mcpConnect: mockState.enabled, login: { open: mockState.open } };
    },
    get settings() {
      return { mcpUrl: mockState.url };
    },
  },
}));

vi.mock('$lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/api')>()),
  get: apiGet,
}));

const url = 'https://picsure.example.org/mcp';
const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.fake-payload.fake-signature';
const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

function blocks(container: HTMLElement) {
  return Array.from(container.querySelectorAll('pre.shiki')).map((b) => b.textContent ?? '');
}

function logIn(token = fakeToken) {
  user.set({ ...get(user), token });
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
    mockState.open = true;
    apiGet.mockReset();
    tokenStatus.set(false);
    user.set({ ...get(user), token: '' });
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
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

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(navigator, 'platform', originalPlatform);
    } else {
      delete (navigator as { platform?: string }).platform;
    }
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
    expect(codeToken).toBe(
      `claude mcp add --scope user --transport http picsure "${url}" --header "Authorization: Bearer \${PICSURE_TOKEN:?set PICSURE_TOKEN first}"`,
    );
    expect(codeOpen).toBe(`claude mcp add --scope user --transport http picsure "${url}"`);
    expect(desktopUrl).not.toContain('PICSURE_TOKEN');
    expect(desktopConfig).toContain('mcp-remote');
    expect(desktopConfig).toContain('Authorization:${AUTH_HEADER}');
    expect(desktopConfig).toContain('"AUTH_HEADER": "Bearer YOUR_PICSURE_TOKEN"');
    expect(cursor).toContain('Bearer YOUR_PICSURE_TOKEN');
    expect(cursor).not.toContain('"type"');
  });

  it('offers the tokenless snippets and the connector caveat when the site has open access', () => {
    render(McpConnect);

    const connect = screen.getByTestId('mcp-step-connect');
    expect(connect).toHaveTextContent('For open access without login');
    expect(connect).toHaveTextContent('Without a token');
    expect(screen.getByTestId('mcp-connector-note')).toHaveTextContent(/public internet/);
    expect(screen.getByTestId('mcp-step-token')).toHaveTextContent(/Log in to have your token/);
    expect(screen.queryByTestId('mcp-login-required')).not.toBeInTheDocument();
  });

  it('hides the tokenless snippets and asks a logged-out user to log in without open access', () => {
    mockState.open = false;
    const { container } = render(McpConnect);

    const connect = screen.getByTestId('mcp-step-connect');
    expect(connect).not.toHaveTextContent('For open access without login');
    expect(connect).not.toHaveTextContent('Without a token');
    expect(screen.queryByTestId('mcp-connector-note')).not.toBeInTheDocument();
    expect(blocks(container)).toHaveLength(5);
    blocks(container).forEach((text) => expect(text).not.toBe(url));
    expect(screen.getByTestId('mcp-login-required')).toHaveTextContent(
      'This site needs a token to connect an assistant. Log in to get your token.',
    );
  });

  it('hides the tokenless snippets for a logged-in user without open access', async () => {
    mockState.open = false;
    logIn();
    render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-token-reveal')).toBeInTheDocument());
    expect(screen.getByTestId('mcp-step-connect')).not.toHaveTextContent(
      'For open access without login',
    );
    expect(screen.queryByTestId('mcp-login-required')).not.toBeInTheDocument();
  });

  it('shows no bullets and no reveal button when logged out', () => {
    const { container } = render(McpConnect);

    expect(container.innerHTML).not.toContain(TOKEN_MASK);
    expect(screen.queryByTestId('mcp-token-reveal')).not.toBeInTheDocument();
    expect(screen.getByTestId('mcp-step-token')).toHaveTextContent(/Log in/);
  });

  it('says the token is loading while a logged-in user waits for it', async () => {
    apiGet.mockReturnValue(new Promise(() => {}));
    logIn('');
    render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-token-loading')).toBeInTheDocument());
    expect(screen.getByTestId('mcp-step-token')).not.toHaveTextContent(/Log in/);
    expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('hasToken'));
  });

  it('says the token could not be loaded when the request fails', async () => {
    apiGet.mockRejectedValue(new Error('down'));
    logIn('');
    render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-token-failed')).toBeInTheDocument());
    expect(screen.getByTestId('mcp-step-token')).not.toHaveTextContent(/Log in/);
  });

  it('fills the token in once the request returns it', async () => {
    apiGet.mockResolvedValue({ token: fakeToken, privileges: [] });
    logIn('');
    render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-token-reveal')).toBeInTheDocument());
    expect(screen.queryByTestId('mcp-token-loading')).not.toBeInTheDocument();
  });

  it('masks the token on screen, copies it in full, and reveals it on request', async () => {
    logIn();
    const { container } = render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-token-reveal')).toBeInTheDocument());
    expect(apiGet).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toContain(fakeToken);
    expect(screen.getByTestId('mcp-token-display')).toHaveTextContent('Token hidden');
    expect(screen.getByTestId('mcp-token-reveal')).toHaveAttribute('aria-pressed', 'false');
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
    expect(screen.getByTestId('mcp-token-reveal')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mcp-token-display')).toHaveTextContent(fakeToken);
    expect(blocks(container)[0]).toBe(`export PICSURE_TOKEN="${fakeToken}"`);
    expect(blocks(container)[5]).toContain(`Bearer ${fakeToken}`);
    expect(blocks(container)[6]).toContain(`Bearer ${fakeToken}`);
  });

  it('changes the commands and the note when the operating system changes', async () => {
    const { container } = render(McpConnect);
    const environment = screen.getByTestId('mcp-step-environment');

    expect(environment).toHaveTextContent('~/.bash_profile instead of ~/.zshrc');
    expect(screen.getByTestId('mcp-env-note')).toHaveTextContent(/Run both lines/);

    await chooseOs('linux');
    expect(environment).toHaveTextContent('~/.bashrc instead of ~/.zshrc');

    await chooseOs('powershell');
    let all = blocks(container);
    expect(all[0]).toContain('$env:PICSURE_TOKEN = ');
    expect(all[1]).toContain('[Environment]::SetEnvironmentVariable');
    expect(all[2]).toContain('Bearer $env:PICSURE_TOKEN');
    expect(screen.getByTestId('mcp-env-note')).toHaveTextContent(
      /only reaches PowerShell windows opened after it runs\. Run both lines/,
    );

    await chooseOs('cmd');
    expect(screen.getByTestId('mcp-env-note')).toHaveTextContent(
      /only reaches Command Prompt windows opened after it runs\. Run both lines/,
    );
    all = blocks(container);
    expect(all[0]).toContain('set PICSURE_TOKEN=');
    expect(all[1]).toContain('setx PICSURE_TOKEN');
    expect(all[2]).toContain('Bearer %PICSURE_TOKEN%');
    all.slice(2).forEach((text) => expect(text).toContain(url));

    await chooseOs('macos');
    expect(blocks(container)[0]).toContain('export PICSURE_TOKEN=');
  });

  it.each([
    ['Win32', 'powershell'],
    ['MacIntel', 'macos'],
    ['Linux x86_64', 'linux'],
  ])('defaults the operating system from the platform %s', async (platform, expected) => {
    Object.defineProperty(navigator, 'platform', { value: platform, configurable: true });
    render(McpConnect);

    await waitFor(() => expect(screen.getByTestId('mcp-os')).toHaveValue(expected));
  });

  it('warns about the token and shell history once', () => {
    const { container } = render(McpConnect);

    expect(screen.getByTestId('mcp-step-token')).toHaveTextContent(/shell history/);
    expect(screen.getByTestId('mcp-step-environment')).not.toHaveTextContent(/shell history/);
    expect(container.textContent?.match(/shell history/g)).toHaveLength(1);
    expect(screen.getByTestId('mcp-step-environment')).toHaveTextContent(/This shell only/);
  });

  it('tells the user to repeat steps 2 and 3 after a token refresh', () => {
    render(McpConnect);

    expect(screen.getByTestId('mcp-token-refresh')).toHaveTextContent(
      /repeat Steps 2 and 3.*claude mcp remove --scope user picsure/,
    );
  });

  it('points Cursor at the global file and Desktop at its config path per OS', async () => {
    render(McpConnect);
    const connect = screen.getByTestId('mcp-step-connect');

    expect(connect).toHaveTextContent('~/.cursor/mcp.json');
    expect(connect).toHaveTextContent(
      'Library/Application Support/Claude/claude_desktop_config.json',
    );
    expect(connect).toHaveTextContent('do not commit that file');
    expect(screen.getByTestId('mcp-desktop-config')).toHaveTextContent(
      /instead of replacing the file/,
    );

    await chooseOs('linux');
    expect(connect).not.toHaveTextContent('Library/Application Support');
    expect(screen.getByTestId('mcp-desktop-config')).toHaveTextContent(
      /Settings, Developer, Edit Config.*Linux is in beta/,
    );
    expect(connect).toHaveTextContent('~/.cursor/mcp.json');

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
