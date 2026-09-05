import { describe, expect, it } from 'vitest';

import { hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

describe('sanitizeBannerHTML', () => {
  it('keeps approved basic formatting, lists, and relative, HTTPS, and mailto links', () => {
    const sanitized = sanitizeBannerHTML(
      '<p><strong>Bold</strong> <em>italic</em> <u>underline</u></p>' +
        '<ul><li><a href="/help">Help</a></li></ul>' +
        '<ol><li><a href="https://example.org/path" target="_blank">External</a></li></ol>' +
        '<a href="mailto:help@example.org">Email</a>',
    );

    expect(sanitized).toContain('<strong>Bold</strong>');
    expect(sanitized).toContain('<em>italic</em>');
    expect(sanitized).toContain('<ul><li><a href="/help">Help</a></li></ul>');
    expect(sanitized).toContain(
      '<a href="https://example.org/path" target="_blank" rel="noopener noreferrer">External</a>',
    );
    expect(sanitized).toContain('<a href="mailto:help@example.org">Email</a>');
  });

  it.each([
    ['external HTTP', 'http://example.org/path'],
    ['protocol-relative', '//example.org/path'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,unsafe'],
  ])('removes the href from %s links', (_description, href) => {
    const sanitized = sanitizeBannerHTML(`<a href="${href}">Unsafe</a>`);

    expect(sanitized).toBe('<a>Unsafe</a>');
  });

  it('strips tags outside basic formatting and lists, including images, headings, and blockquotes', () => {
    const sanitized = sanitizeBannerHTML(
      '<p class="fixed" style="position:fixed">Safe<img src="https://example.org/x.png"></p>' +
        '<h1>Heading</h1><blockquote>Quote</blockquote><script>alert(1)</script>',
    );

    expect(sanitized).toBe('<p>Safe</p>HeadingQuote');
  });

  it.each([
    '<p></p>',
    '<p> \t\n</p>',
    '<p>&nbsp;</p>',
    '<p>&#160;&#xA0;</p>',
    '<p>\u200b\ufeff</p>',
  ])('treats semantically blank Quill markup as empty: %s', (html) => {
    expect(hasBannerContent(html)).toBe(false);
  });

  it('recognizes visible formatted content', () => {
    expect(hasBannerContent('<p><strong>Important</strong></p>')).toBe(true);
  });
});
