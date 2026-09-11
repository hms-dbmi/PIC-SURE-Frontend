// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { bannerPlainText, hasBannerContent, sanitizeBannerHTML } from '$lib/utilities/BannerHTML';

describe('bannerPlainText', () => {
  it.each([
    ['paragraphs', '<p>Scheduled</p><p>maintenance</p>', 'Scheduled maintenance'],
    ['line breaks', '<p>Scheduled<br>maintenance</p>', 'Scheduled maintenance'],
    ['list items', '<ul><li>First step</li><li>Second step</li></ul>', 'First step Second step'],
    [
      'nested lists',
      '<ol><li>First<ul><li>Nested</li></ul>continued</li><li>Last</li></ol>',
      'First Nested continued Last',
    ],
    ['bare text beside a paragraph', 'Before<p>Notice</p>after', 'Before Notice after'],
    ['bare text beside a list', 'Before<ul><li>Notice</li></ul>after', 'Before Notice after'],
  ])('preserves word boundaries between %s', (_description, html, expected) => {
    expect(bannerPlainText(html)).toBe(expected);
  });

  it('keeps inline formatting within a word joined', () => {
    expect(
      bannerPlainText('<p>Main<strong>ten</strong><em>ance</em> &amp; re<a>covery</a></p>'),
    ).toBe('Maintenance & recovery');
  });

  it('omits script and style content from stored HTML excerpts', () => {
    expect(
      bannerPlainText(
        '<p>Visible <strong>notice</strong></p>' +
          '<script>hiddenScriptText</script><style>.hidden { color: red; }</style>',
      ),
    ).toBe('Visible notice');
  });

  it('decodes entities and collapses whitespace in visible text', () => {
    expect(bannerPlainText('<p>  Maintenance&nbsp; &amp;\n recovery </p>')).toBe(
      'Maintenance & recovery',
    );
    expect(bannerPlainText('<script>hidden</script><style>hidden</style>')).toBe('');
  });
});

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
