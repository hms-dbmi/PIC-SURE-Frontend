import sanitizeHtml, { type IOptions } from 'sanitize-html';

// Restricts color-bearing properties to the CSS custom properties the Quill
// editor's color/background toolbar (Editor.svelte's `colors` array) can emit -
// var(--color-{surface,primary,secondary,tertiary,success,error,warning}-{50,200,500,800,950}).
const ALLOWED_COLOR_VALUE =
  /^var\(--color-(surface|primary|secondary|tertiary|success|error|warning)-(50|200|500|800|950)\)$/;

// Layout properties actually used in branding content (confirmed against
// src/lib/assets/configuration.json): plain keyword/length/percentage values,
// no parens - blocks url(), calc(), expression() injection via these properties.
const SAFE_LAYOUT_VALUE = /^[a-zA-Z0-9\s.,%-]+$/;

// sanitize-html's default allowedTags already covers everything admin-authored
// branding/terms content uses today (h1-h6, section, p, div, span, lists,
// blockquote, a, u/s/sub/sup, table) - see sanitizeHtml.defaults.allowedTags.
// img/iframe/video are deliberately left out: no branding field renders them
// today, and they're the highest-risk tags to allow blanket (remote sources).
const defaultOptions: IOptions = {
  allowedAttributes: {
    '*': ['id', 'class', 'style'],
    a: ['href', 'target', 'title', 'rel'],
  },
  allowedStyles: {
    '*': {
      color: [ALLOWED_COLOR_VALUE],
      'background-color': [ALLOWED_COLOR_VALUE],
      background: [ALLOWED_COLOR_VALUE],
      display: [SAFE_LAYOUT_VALUE],
      'flex-direction': [SAFE_LAYOUT_VALUE],
      'flex-wrap': [SAFE_LAYOUT_VALUE],
      'align-items': [SAFE_LAYOUT_VALUE],
      'align-self': [SAFE_LAYOUT_VALUE],
      'justify-content': [SAFE_LAYOUT_VALUE],
      width: [SAFE_LAYOUT_VALUE],
      'max-width': [SAFE_LAYOUT_VALUE],
      margin: [SAFE_LAYOUT_VALUE],
      padding: [SAFE_LAYOUT_VALUE],
      gap: [SAFE_LAYOUT_VALUE],
      'text-align': [SAFE_LAYOUT_VALUE],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export const sanitizeHTML = (dirty: string, options?: IOptions): string =>
  sanitizeHtml(dirty, options ? { ...defaultOptions, ...options } : defaultOptions);
