import { describe, expect, it } from 'vitest';

import { renderChatMarkdown } from '$lib/assistedSearch/model/markdown';

describe('renderChatMarkdown', () => {
  it('renders ordinary markdown', () => {
    const html = renderChatMarkdown('**Bold** and `code`\n\n- one\n- two');
    expect(html).toContain('<strong>Bold</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<li>one</li>');
  });

  it('never emits raw HTML from the model', () => {
    const html = renderChatMarkdown(
      '<script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil"></iframe>',
    );
    expect(html).not.toMatch(/<(script|img|iframe)/i);
  });

  it('opens links safely and drops unsafe schemes', () => {
    const html = renderChatMarkdown('[ok](https://example.org) [bad](javascript:alert(1))');
    expect(html).toContain('href="https://example.org"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain('javascript:');
  });

  it('strips style and event attributes', () => {
    const html = renderChatMarkdown('<p style="color:red" onclick="x()">hi</p>');
    expect(html).not.toMatch(/style=|onclick=|<p style/);
  });
});
