import type { Attachment } from 'svelte/attachments';

type Styles = string | Record<string, string | number>;
type Declaration = { property: string; value: string; priority: string };

// Reused so a frequently-updating caller (Popover follows floating-ui on every scroll) is not
// allocating an element per run. Attachments never run during SSR, so `document` is safe here.
let probe: HTMLElement | undefined;

function parse(styles: Styles): Declaration[] {
  if (typeof styles !== 'string') {
    return Object.entries(styles).map(([property, value]) => ({
      property,
      value: String(value),
      priority: '',
    }));
  }
  // Let the browser's own CSS parser split the declarations rather than splitting on ';', which
  // breaks on separators inside url() or quoted values.
  probe ??= document.createElement('div');
  probe.style.cssText = styles;
  return Array.from(probe.style).map((property) => ({
    property,
    value: probe!.style.getPropertyValue(property),
    priority: probe!.style.getPropertyPriority(property),
  }));
}

/**
 * Applies inline styles through the CSSOM instead of rendering a style attribute.
 *
 * CSP's style-src-attr governs style attributes - including setAttribute('style', ...), which is
 * what Svelte compiles `style="..."` to on the client - but it never governs CSSOM writes. That is
 * what lets a value only known at runtime be applied under a policy carrying no 'unsafe-inline'.
 * Chromium, Firefox and WebKit behave identically here.
 *
 * Each run removes only the properties the previous run set, so anything else writing to the same
 * element is left alone. That matters: floating-ui sets `pointerEvents` directly on the floating
 * element when a handleClose with blockPointerEvents is configured, and assigning cssText here
 * would silently wipe it, leaving a popover that cannot be interacted with.
 *
 * Object keys are CSS property names, not camelCase (`'margin-left'`, not `marginLeft`).
 *
 * Server-rendered markup carries no style, so an element positioned this way gets one frame of
 * unstyled layout before hydration. Fine for placeholders and click-triggered overlays; think
 * twice before using it for above-the-fold layout.
 */
export function css(styles: Styles): Attachment<HTMLElement> {
  return (node) => {
    const declarations = parse(styles);
    for (const { property, value, priority } of declarations) {
      node.style.setProperty(property, value, priority);
    }
    return () => {
      for (const { property } of declarations) node.style.removeProperty(property);
    };
  };
}
