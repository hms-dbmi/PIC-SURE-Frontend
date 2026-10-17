import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '#lib/utilities/HTML.ts';

describe('sanitizeHTML', () => {
  it.each([
    ['drops scripts', '<p>hi</p><script>alert(1)</script>', '<p>hi</p>'],
    [
      'keeps id and class, drops event handlers and data attributes',
      '<p onclick="x()" id="a" class="b" data-x="1">t</p>',
      '<p id="a" class="b">t</p>',
    ],
    ['drops javascript: links', '<a href="javascript:alert(1)">x</a>', '<a>x</a>'],
    [
      'keeps link attributes',
      '<a href="https://e.org" target="_blank" rel="noopener" title="t" download>x</a>',
      '<a href="https://e.org" target="_blank" rel="noopener" title="t">x</a>',
    ],
    [
      'allows mailto and relative links, drops data: links',
      '<a href="mailto:a@b.org">m</a><a href="/relative">r</a><a href="data:text/html,x">d</a>',
      '<a href="mailto:a@b.org">m</a><a href="/relative">r</a><a>d</a>',
    ],
    [
      'keeps images, drops their handlers and data: sources',
      '<img src="https://e.org/i.png" alt="a" width="10" onerror="x()"><img src="data:image/png;base64,AA">',
      '<img src="https://e.org/i.png" alt="a" width="10" /><img />',
    ],
    [
      'drops iframes, video and style blocks with their content',
      '<iframe src="https://e.org"></iframe><video src="v"></video><style>p{}</style>',
      '',
    ],
    [
      'keeps theme colour variables and plain layout values only',
      '<span style="color: var(--color-primary-500); background-color: red; display: flex; width: calc(1px + 2px); background: url(x); margin: 0 auto">s</span>',
      '<span style="color:var(--color-primary-500);display:flex;margin:0 auto">s</span>',
    ],
    [
      'drops colour variables outside the editor palette',
      '<span style="color: var(--color-primary-600)">s</span>',
      '<span>s</span>',
    ],
    [
      'keeps table span and scope attributes',
      '<table><tr><td colspan="2" rowspan="3" width="5">c</td><th scope="col" colspan="2">h</th></tr></table>',
      '<table><tr><td colspan="2" rowspan="3">c</td><th scope="col" colspan="2">h</th></tr></table>',
    ],
    [
      'keeps default rich-text tags, unwraps others to their text',
      '<h1>t</h1><section><blockquote>q</blockquote></section><u>u</u><font>f</font><input value="x"><form>x</form>',
      '<h1>t</h1><section><blockquote>q</blockquote></section><u>u</u>fx',
    ],
  ])('%s', (_name, dirty, clean) => {
    expect(sanitizeHTML(dirty)).toBe(clean);
  });

  it('replaces, not merges, each option it is given', () => {
    expect(sanitizeHTML('<p id="a"><b>b</b></p>', { allowedTags: ['p'] })).toBe('<p id="a">b</p>');
    // Quirk: overriding allowedAttributes also drops the default id/class allowance.
    expect(
      sanitizeHTML('<p id="a" class="c"><a href="https://e.org">x</a></p>', {
        allowedAttributes: { a: ['href'] },
      }),
    ).toBe('<p><a href="https://e.org">x</a></p>');
  });
});
