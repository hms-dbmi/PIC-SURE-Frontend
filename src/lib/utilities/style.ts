import type { Attachment } from 'svelte/attachments';

type Styles = string | Record<string, string | number>;
type Declaration = { property: string; value: string; priority: string };

let probe: HTMLElement | undefined;

function parse(styles: Styles): Declaration[] {
  if (typeof styles !== 'string') {
    return Object.entries(styles).map(([property, value]) => ({
      property,
      value: String(value),
      priority: '',
    }));
  }
  // Parse via the browser so values and !important survive the replay through setProperty.
  probe ??= document.createElement('div');
  probe.style.cssText = styles;
  return Array.from(probe.style).map((property) => ({
    property,
    value: probe!.style.getPropertyValue(property),
    priority: probe!.style.getPropertyPriority(property),
  }));
}

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
