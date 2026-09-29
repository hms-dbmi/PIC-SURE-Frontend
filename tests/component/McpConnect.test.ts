// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

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

describe('McpConnect', () => {
  beforeEach(() => {
    mockState.enabled = true;
    mockState.url = url;
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

  it('puts the URL in every snippet and the token placeholder only in with-token variants', () => {
    const { container } = render(McpConnect);

    const blocks = Array.from(container.querySelectorAll('pre.shiki')).map((b) => b.textContent);
    expect(blocks).toHaveLength(6);
    blocks.forEach((text) => expect(text).toContain(url));

    const [codeNoToken, codeToken, desktopUrl, desktopToken, cursorNoToken, cursorToken] = blocks;
    expect(codeNoToken).not.toContain('--header');
    expect(codeToken).toContain('--header "Authorization: Bearer $PICSURE_TOKEN"');
    expect(desktopUrl).not.toContain('PICSURE_TOKEN');
    expect(desktopToken).toContain('mcp-remote');
    expect(desktopToken).toContain('Authorization: Bearer ${PICSURE_TOKEN}');
    expect(cursorNoToken).not.toContain('Authorization');
    expect(cursorToken).toContain('"Authorization"');
  });

  it('says authorized work needs the Python or R client', () => {
    render(McpConnect);

    expect(screen.getByTestId('mcp-connect-note')).toHaveTextContent(/Python or R client/);
    expect(screen.getByTestId('mcp-connect-note')).toHaveTextContent(/open-access data only/);
    expect(screen.getByTestId('mcp-connect-note')).toHaveTextContent(/your own environment/);
  });
});
