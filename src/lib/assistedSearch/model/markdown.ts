import { marked } from 'marked';

import { sanitizeHTML } from '$lib/utilities/HTML';

// Model output is untrusted text. Raw HTML in it is escaped by the sanitizer, never rendered:
// only what markdown itself produces survives, and links are the only thing with attributes.
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
];

export function renderChatMarkdown(text: string): string {
  const html = marked.parse(text, { async: false, gfm: true, breaks: true });
  return sanitizeHTML(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
    allowedStyles: {},
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
      }),
    },
    disallowedTagsMode: 'escape',
  });
}
