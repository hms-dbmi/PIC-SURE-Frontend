import sanitizeHtml, { type IOptions } from 'sanitize-html';

const bannerOptions: IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ol', 'ul', 'li', 'a'],
  allowedAttributes: {
    a: ['href', 'target', 'title', 'rel'],
  },
  allowedSchemes: ['https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attributes) => {
      const transformed = { ...attributes };
      if (transformed.target === '_blank') {
        transformed.rel = 'noopener noreferrer';
      } else {
        delete transformed.target;
        delete transformed.rel;
      }
      return { tagName: 'a', attribs: transformed };
    },
  },
};

export const sanitizeBannerHTML = (dirty: string): string => sanitizeHtml(dirty, bannerOptions);

export function hasBannerContent(dirty: string): boolean {
  const visibleText = sanitizeHtml(sanitizeBannerHTML(dirty), {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/[\s\u200b]/gu, '');
  return visibleText.length > 0;
}

export function bannerPlainText(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
